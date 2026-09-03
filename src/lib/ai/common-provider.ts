import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  ProofreadingResponseSchema,
  ResumeChangeSchema,
  TailoringResponseSchema,
  UnsupportedGapSchema,
} from "@/features/changes/schema";
import { filterValidChanges } from "@/features/changes/validate-change";
import type { GuidanceContext } from "@/features/guidance/schema";
import { JobAnalysisResponseSchema, type JobAnalysisResponse, type TargetJob } from "@/features/jobs/schema";
import type { ImportResult } from "@/features/latex/importer";
import type { RenderedSection } from "@/features/presentation/schema";
import type { CandidateProfile } from "@/features/resume/candidate-profile";
import { ResumeSchema, type Resume } from "@/features/resume/schema";
import { AppError } from "@/lib/ai/errors";
import { validateResumeAgainstEvidence } from "@/lib/ai/factuality-validator";
import { delay } from "@/lib/utils";
import { compactGuidanceForPrompt } from "@/features/guidance/retrieve";
import { cleanJobPostingText, normalizePromptText, toCompactJson } from "@/lib/ai/sanitize-input";
import {
  extractAndParseJson,
  extractNormalizedResume,
  normalizeRawFullTailoring,
  normalizeRawJobAnalysis,
  normalizeRawProofreadingResponse,
  normalizeRawResume,
  normalizeRawTailoringResponse,
} from "@/lib/ai/normalize";
import { callOpenRouter, configuredOpenRouterModel } from "@/lib/ai/openrouter-driver";
import { callGroq, configuredGroqModel } from "@/lib/ai/groq-driver";


import {
  analyzeJobPrompt,
  buildResumePrompt,
  fullTailorPrompt,
  parseResumePrompt,
  proofreadPrompt,
  repairPrompt,
  tailorPrompt,
} from "@/lib/ai/prompts";
import type { BuildResumeResponse, ResumeAIProvider, TailoredResumeResponse } from "@/lib/ai/provider";
import { assertUniqueResumeIds, assertValidJobComparison, filterValidProofreadingChanges } from "@/lib/ai/semantic-validation";

export type AIProviderType = "google" | "groq" | "openrouter";

interface CommonProviderOptions {
  provider?: AIProviderType;
  apiKey?: string;
  model?: string;
}

const DEFAULT_GOOGLE_MODEL = "gemini-3.6-flash";

const ImportResponseSchema = z.object({
  resume: ResumeSchema,
  warnings: z.array(z.object({ code: z.string().min(1), message: z.string().min(1).max(1000) })).max(50),
});

const BuildResumeResponseSchema = z.object({
  resume: ResumeSchema,
  summary: z.string().min(1).max(2000),
  normalizedItemsCount: z.number().int().nonnegative().default(0),
});

const FullTailoringResponseSchema = z.object({
  tailoredResume: ResumeSchema,
  summary: z.string().min(1).max(2000),
  changes: z.array(ResumeChangeSchema).max(80),
  gaps: z.array(UnsupportedGapSchema).max(80),
});

function configuredGoogleModel(): string {
  const model = process.env.GEMINI_MODEL?.trim() || process.env.GOOGLE_MODEL?.trim() || DEFAULT_GOOGLE_MODEL;
  return model.replace(/^models\//, "");
}

function errorDetails(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).slice(0, 12).join("; ");
  if (error instanceof SyntaxError) return error.message || "Response is not valid JSON.";
  return error instanceof Error ? error.message : "Response did not match the requested shape.";
}

function providerStatus(error: unknown): number | undefined {
  return typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
}



const GEMINI_SCHEMA_KEYS = new Set([
  "$defs", "$ref", "$anchor", "type", "format", "title", "description", "enum", "items", "prefixItems",
  "minItems", "maxItems", "minimum", "maximum", "anyOf", "oneOf", "properties", "additionalProperties", "required",
]);

export function standardJsonSchema(schema: z.ZodType): unknown {
  const sanitize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (!value || typeof value !== "object") return value;
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(source)) {
      if (key === "const") {
        result.enum = [entry];
      } else if ((key === "properties" || key === "$defs") && entry && typeof entry === "object" && !Array.isArray(entry)) {
        result[key] = Object.fromEntries(Object.entries(entry as Record<string, unknown>).map(([name, child]) => [name, sanitize(child)]));
      } else if (GEMINI_SCHEMA_KEYS.has(key)) {
        result[key] = sanitize(entry);
      }
    }
    return result;
  };
  return sanitize(z.toJSONSchema(schema));
}

function geminiJsonSchema(schema: z.ZodType): unknown {
  return standardJsonSchema(schema);
}


export function resolveAiProvider(override?: string | null): AIProviderType {
  const explicit = override?.trim().toLowerCase() || process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq") return "groq";
  if (explicit === "openrouter") return "openrouter";
  if (explicit === "google" || explicit === "gemini") return "google";

  // Auto-detection when AI_PROVIDER is unset:
  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());
  const hasGoogle = Boolean(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  if (hasGroq && !hasGoogle && !hasOpenRouter) {
    return "groq";
  }

  if (hasOpenRouter && !hasGoogle) {
    return "openrouter";
  }

  return "google";
}

export class CommonResumeAIProvider implements ResumeAIProvider {
  public readonly provider: AIProviderType;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly googleClient?: GoogleGenAI;

  constructor(options?: CommonProviderOptions) {
    this.provider = options?.provider ?? resolveAiProvider();

    if (this.provider === "groq") {
      this.apiKey = options?.apiKey ?? process.env.GROQ_API_KEY?.trim() ?? "";
      this.model = options?.model ?? configuredGroqModel();

      if (!this.apiKey) {
        throw new AppError(
          "AI_NOT_CONFIGURED",
          "AI is unavailable until GROQ_API_KEY is configured in your environment.",
          503,
          false,
        );
      }
    } else if (this.provider === "openrouter") {
      this.apiKey = options?.apiKey ?? process.env.OPENROUTER_API_KEY?.trim() ?? "";
      this.model = options?.model ?? configuredOpenRouterModel();

      if (!this.apiKey) {
        throw new AppError(
          "AI_NOT_CONFIGURED",
          "AI is unavailable until OPENROUTER_API_KEY is configured in your environment.",
          503,
          false,
        );
      }
    } else {
      this.apiKey =
        options?.apiKey ??
        (process.env.GEMINI_API_KEY?.trim() ||
          process.env.GOOGLE_API_KEY?.trim() ||
          process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
          "");
      this.model = options?.model ?? configuredGoogleModel();

      if (!this.apiKey) {
        throw new AppError(
          "AI_NOT_CONFIGURED",
          "AI is unavailable until GEMINI_API_KEY is configured in your environment.",
          503,
          false,
        );
      }

      this.googleClient = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  private async generateRaw(
    prompt: [system: string, user: string],
    schema: z.ZodType,
    maxOutputTokens = 3500,
  ): Promise<string> {
    const jsonSchema = standardJsonSchema(schema);

    if (this.provider === "groq") {
      return callGroq(prompt, this.model, this.apiKey, maxOutputTokens, jsonSchema);
    }

    if (this.provider === "openrouter") {
      return callOpenRouter(prompt, this.model, this.apiKey, jsonSchema);
    }


    // Google AI Studio / Gemini provider call
    let response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>> | undefined;

    for (let providerAttempt = 0; providerAttempt < 3; providerAttempt += 1) {
      try {
        response = await this.googleClient!.models.generateContent({
          model: this.model,
          contents: prompt[1],
          config: {
            systemInstruction: prompt[0],
            temperature: 0.1,
            maxOutputTokens,
            responseMimeType: "application/json",
            responseJsonSchema: geminiJsonSchema(schema),
            httpOptions: { timeout: 45_000 },
          },
        });
        break;
      } catch (providerError) {
        const status = providerStatus(providerError);
        if (providerAttempt === 2 || (status !== 429 && (!status || status < 500))) throw providerError;
        await delay(300 * 2 ** providerAttempt);
      }
    }

    if (!response) throw new AppError("PROVIDER_UNAVAILABLE", "Google Gemini service is temporarily unavailable.", 503, true);

    const output = response.text || "";
    if (!output.trim()) {
      throw new AppError("INVALID_MODEL_OUTPUT", "Gemini returned an empty response.", 502, true);
    }

    return output;
  }

  private async request<T>(
    prompt: [string, string],
    schema: z.ZodType<T>,
    preNormalizer?: (raw: unknown) => unknown,
    maxOutputTokens = 3500,
  ): Promise<T> {
    const originalPrompt = prompt;
    let currentPrompt = prompt;
    let lastOutput = "";
    let lastIssue = "";

    for (let repairAttempt = 0; repairAttempt <= 2; repairAttempt += 1) {
      try {
        lastOutput = await this.generateRaw(currentPrompt, schema, maxOutputTokens);

        const parsedJson = extractAndParseJson(lastOutput);
        const normalized = preNormalizer ? preNormalizer(parsedJson) : parsedJson;
        return schema.parse(normalized);
      } catch (error) {
        const status = providerStatus(error);
        const message = error instanceof Error ? error.message : String(error);

        if (status === 402 || message.includes("402") || message.toLowerCase().includes("credits") || message.toLowerCase().includes("afford")) {
          throw new AppError("INSUFFICIENT_CREDITS", message, 402, false);
        }

        if (status === 404 || message.includes("404") || message.includes("NOT_FOUND") || message.includes("no longer available")) {
          throw new AppError("INVALID_MODEL", `${this.provider === "openrouter" ? "OpenRouter" : "Gemini"} model "${this.model}" is not available. Check your model configuration and try again.`, 400, false);
        }

        if (status === 429 || message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded")) {
          throw new AppError("RATE_LIMITED", `${this.provider === "openrouter" ? "OpenRouter" : "Google Gemini"} rate limit or quota reached. Please try again shortly.`, 429, true);
        }

        if (status && status >= 500) {
          throw new AppError("PROVIDER_UNAVAILABLE", `${this.provider === "openrouter" ? "OpenRouter" : "Google Gemini"} service is temporarily unavailable.`, 503, true);
        }

        if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("aborted")) {
          throw new AppError("REQUEST_TIMEOUT", `${this.provider === "openrouter" ? "OpenRouter" : "Gemini"} did not respond within 45 seconds. Please try again.`, 504, true);
        }

        if (error instanceof AppError && error.code !== "INVALID_MODEL_OUTPUT") {
          throw error;
        }

        lastIssue = errorDetails(error);
        if (repairAttempt === 2) break;
        currentPrompt = repairPrompt(originalPrompt, lastOutput || "{}", lastIssue);
      }
    }

    throw new AppError(
      "INVALID_MODEL_OUTPUT",
      `The model returned invalid structured data after two repair attempts: ${lastIssue}`,
      422,
      false,
      lastIssue,
    );
  }

  async parseLatexResume(source: string): Promise<ImportResult> {
    const cleaned = normalizePromptText(source);
    const parsed = await this.request(
      parseResumePrompt(cleaned),
      ImportResponseSchema,
      normalizeRawResume,
      3500,
    );
    assertUniqueResumeIds(parsed.resume);
    return { ...parsed, confidence: parsed.warnings.length > 0 ? "medium" : "high", importer: "ai" };
  }

  async parseResume(source: string): Promise<ImportResult> {
    return this.parseLatexResume(source);
  }

  async buildResume(
    profile: CandidateProfile,
    sections: RenderedSection[],
    guidance: GuidanceContext,
  ): Promise<BuildResumeResponse> {
    const compactGuidance = compactGuidanceForPrompt(guidance);
    const result = await this.request(
      buildResumePrompt(
        toCompactJson(profile),
        toCompactJson(sections),
        toCompactJson(compactGuidance),
      ),
      BuildResumeResponseSchema,
      (raw) => {
        if (raw && typeof raw === "object") {
          const rObj = raw as Record<string, unknown>;
          return {
            ...rObj,
            resume: extractNormalizedResume(rObj.resume ?? raw),
          };
        }
        return raw;
      },
      3500,
    );
    assertUniqueResumeIds(result.resume);
    const factuality = validateResumeAgainstEvidence(result.resume, profile);
    if (!factuality.valid) {
      console.warn("[factuality-warning in build]", factuality.violations);
    }
    return result;
  }

  async analyzeJob(resume: Resume, targetJob: TargetJob, guidance: GuidanceContext): Promise<JobAnalysisResponse> {
    const cleanedJob: TargetJob = {
      ...targetJob,
      description: cleanJobPostingText(targetJob.description),
    };
    const compactGuidance = compactGuidanceForPrompt(guidance);
    const result = await this.request(
      analyzeJobPrompt(toCompactJson(resume), toCompactJson(cleanedJob), toCompactJson(compactGuidance)),
      JobAnalysisResponseSchema,
      normalizeRawJobAnalysis,
      2000,
    );
    assertValidJobComparison(result, resume);
    return result;
  }

  async tailorResume(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
    guidance: GuidanceContext,
  ): Promise<TailoredResumeResponse> {
    const cleanedJob: TargetJob = {
      ...targetJob,
      description: cleanJobPostingText(targetJob.description),
    };
    const compactGuidance = compactGuidanceForPrompt(guidance);
    const result = await this.request(
      fullTailorPrompt(
        toCompactJson(resume),
        toCompactJson(cleanedJob),
        toCompactJson(analysis),
        resumeRevision,
        toCompactJson(compactGuidance),
      ),
      FullTailoringResponseSchema,
      normalizeRawFullTailoring,
      3500,
    );
    assertUniqueResumeIds(result.tailoredResume);
    const validated = filterValidChanges(result.changes, resume, analysis.analysis, guidance);
    const factuality = validateResumeAgainstEvidence(result.tailoredResume, resume);
    if (!factuality.valid) {
      console.warn("[factuality-warning in tailoring]", factuality.violations);
    }

    return {
      tailoredResume: result.tailoredResume,
      summary: result.summary,
      changes: validated.valid,
      gaps: result.gaps,
      evidenceReport: analysis.comparison.entries.map((entry) => ({
        requirement: entry.requirementId,
        evidence: entry.explanation,
        status: entry.status,
      })),
    };
  }

  async generateTailoringSuggestions(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
    guidance: GuidanceContext,
  ) {
    const cleanedJob: TargetJob = {
      ...targetJob,
      description: cleanJobPostingText(targetJob.description),
    };
    const compactGuidance = compactGuidanceForPrompt(guidance);
    const result = await this.request(
      tailorPrompt(toCompactJson(resume), toCompactJson(cleanedJob), toCompactJson(analysis), resumeRevision, toCompactJson(compactGuidance)),
      TailoringResponseSchema,
      normalizeRawTailoringResponse,
      2500,
    );
    const validated = filterValidChanges(result.changes, resume, analysis.analysis, guidance);
    if (validated.rejected.length > 0) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "One or more AI suggestions were not supported by resume evidence or cited unknown guidance.", 422, false, validated.rejected);
    }
    const unsupportedIds = new Set(analysis.comparison.entries.filter((entry) => entry.status === "unsupported").map((entry) => entry.requirementId));
    if (result.changes.some((change) => change.jobRequirementIds.some((id) => unsupportedIds.has(id)))) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "A proposal attempted to apply an unsupported job requirement.", 422, false);
    }
    if (result.gaps.some((gap) => !unsupportedIds.has(gap.requirementId))) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "An unsupported gap does not match the job comparison.", 422, false);
    }
    return { ...result, changes: validated.valid };
  }

  async proofreadResume(resume: Resume, resumeRevision: string, guidance: GuidanceContext) {
    const compactGuidance = compactGuidanceForPrompt(guidance);
    const result = await this.request(
      proofreadPrompt(toCompactJson(resume), resumeRevision, toCompactJson(compactGuidance)),
      ProofreadingResponseSchema,
      normalizeRawProofreadingResponse,
      1500,
    );


    const validated = filterValidProofreadingChanges(result.changes, resume, guidance);
    if (validated.rejected.length > 0) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "One or more proofreading changes failed factual validation or cited unknown guidance.", 422, false, validated.rejected);
    }
    return { changes: validated.valid };
  }
}

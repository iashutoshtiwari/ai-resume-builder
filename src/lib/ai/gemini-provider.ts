import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ProofreadingResponseSchema, TailoringResponseSchema } from "@/features/changes/schema";
import { filterValidChanges } from "@/features/changes/validate-change";
import { JobAnalysisResponseSchema, type JobAnalysisResponse, type TargetJob } from "@/features/jobs/schema";
import type { ImportResult } from "@/features/latex/importer";
import { ResumeSchema, type Resume } from "@/features/resume/schema";
import { AppError } from "@/lib/ai/errors";
import { extractAndParseJson, normalizeRawJobAnalysis, normalizeRawResume } from "@/lib/ai/normalize";
import type { ResumeAIProvider } from "@/lib/ai/provider";
import { analyzeJobPrompt, parseResumePrompt, proofreadPrompt, repairPrompt, tailorPrompt } from "@/lib/ai/prompts";
import { assertUniqueResumeIds, assertValidJobComparison, filterValidProofreadingChanges } from "@/lib/ai/semantic-validation";

const DEFAULT_MODEL = "gemini-3.6-flash";

const ImportResponseSchema = z.object({
  resume: ResumeSchema,
  warnings: z.array(z.object({ code: z.string().min(1), message: z.string().min(1).max(1000) })).max(50),
});

function configuredModel(): string {
  const model = process.env.GEMINI_MODEL?.trim() || process.env.GOOGLE_MODEL?.trim() || DEFAULT_MODEL;
  return model.replace(/^models\//, "");
}

function errorDetails(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).slice(0, 12).join("; ");
  if (error instanceof SyntaxError) return error.message || "Response is not valid JSON.";
  return error instanceof Error ? error.message : "Response did not match the requested shape.";
}

export class GeminiResumeAIProvider implements ResumeAIProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor() {
    const apiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

    if (!apiKey) {
      throw new AppError(
        "AI_NOT_CONFIGURED",
        "AI is unavailable until GEMINI_API_KEY is configured in your environment.",
        503,
        false
      );
    }

    this.model = configuredModel();
    this.client = new GoogleGenAI({ apiKey });
  }

  private async request<T>(
    prompt: [string, string],
    schema: z.ZodType<T>,
    preNormalizer?: (raw: unknown) => unknown,
  ): Promise<T> {
    let currentPrompt = prompt;
    let lastOutput = "";
    let lastIssue = "";

    for (let repairAttempt = 0; repairAttempt <= 2; repairAttempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: currentPrompt[1],
          config: {
            systemInstruction: currentPrompt[0],
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });

        lastOutput = response.text || "";
        if (!lastOutput.trim()) {
          throw new AppError("INVALID_MODEL_OUTPUT", "Gemini returned an empty response.", 502, true);
        }

        const parsedJson = extractAndParseJson(lastOutput);
        const normalized = preNormalizer ? preNormalizer(parsedJson) : parsedJson;
        return schema.parse(normalized);
      } catch (error) {
        const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
        const message = error instanceof Error ? error.message : String(error);

        if (status === 404 || message.includes("404") || message.includes("NOT_FOUND") || message.includes("no longer available")) {
          throw new AppError("INVALID_MODEL", `Gemini model "${this.model}" is not available or discontinued: ${message}`, 400, false);
        }

        if (status === 429 || message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded")) {
          throw new AppError("RATE_LIMITED", "Google Gemini API rate limit or quota reached. Please try again shortly.", 429, true);
        }

        if (status && status >= 500) {
          throw new AppError("PROVIDER_UNAVAILABLE", "Google Gemini service is temporarily unavailable.", 503, true);
        }

        if (error instanceof AppError && error.code !== "INVALID_MODEL_OUTPUT") {
          throw error;
        }

        lastIssue = errorDetails(error);
        if (repairAttempt === 2) break;
        currentPrompt = repairPrompt(lastOutput || "{}", lastIssue);
      }
    }

    throw new AppError(
      "INVALID_MODEL_OUTPUT",
      `The model returned invalid structured data after two repair attempts: ${lastIssue}`,
      422,
      false,
      lastIssue
    );
  }

  async parseLatexResume(source: string): Promise<ImportResult> {
    const parsed = await this.request(
      parseResumePrompt(source),
      ImportResponseSchema,
      normalizeRawResume,
    );
    assertUniqueResumeIds(parsed.resume);
    return { ...parsed, confidence: "high", importer: "ai" };
  }

  async analyzeJob(resume: Resume, targetJob: TargetJob): Promise<JobAnalysisResponse> {
    const result = await this.request(
      analyzeJobPrompt(JSON.stringify(resume), JSON.stringify(targetJob)),
      JobAnalysisResponseSchema,
      normalizeRawJobAnalysis,
    );
    assertValidJobComparison(result, resume);
    return result;
  }

  async generateTailoringSuggestions(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
  ) {
    const result = await this.request(
      tailorPrompt(JSON.stringify(resume), JSON.stringify(targetJob), JSON.stringify(analysis), resumeRevision),
      TailoringResponseSchema,
    );
    const validated = filterValidChanges(result.changes, resume, analysis.analysis);
    if (validated.rejected.length > 0) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "One or more AI suggestions were not supported by resume evidence.", 422, false, validated.rejected);
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

  async proofreadResume(resume: Resume, resumeRevision: string) {
    const result = await this.request(
      proofreadPrompt(JSON.stringify(resume), resumeRevision),
      ProofreadingResponseSchema,
    );
    const validated = filterValidProofreadingChanges(result.changes, resume);
    if (validated.rejected.length > 0) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "One or more proofreading changes failed factual validation.", 422, false, validated.rejected);
    }
    return { changes: validated.valid };
  }
}

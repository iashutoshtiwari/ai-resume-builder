import { z } from "zod";
import { KnownTemplateImporter } from "@/features/latex/importer";
import { apiErrorResponse, AppError } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { enforceAiRouteGuard } from "@/lib/ai/guard";
import { getCachedAiResponse, setCachedAiResponse } from "@/lib/ai/cache";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z
  .object({
    latex: z.string().min(20).max(205_000).optional(),
    text: z.string().min(20).max(205_000).optional(),
    source: z.string().min(20).max(205_000).optional(),
  })
  .refine((data) => Boolean(data.source || data.latex || data.text), {
    message: "Either source, text, or latex must be provided.",
  });

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 205_000);
    const content = (input.source || input.latex || input.text || "").trim();

    if (new TextEncoder().encode(content).byteLength > 200_000) {
      throw new AppError("PAYLOAD_TOO_LARGE", "Resume content must be 200 KB or smaller.", 413, false);
    }

    // If it looks like LaTeX, try deterministic known-template parsing first (0 tokens)
    if (content.includes("\\documentclass") || content.includes("\\begin{document}")) {
      const known = new KnownTemplateImporter();
      if (known.canHandle(content)) {
        const result = await known.parse(content);
        if (result.confidence !== "low") return Response.json(result);
      }
    }

    const providerHeader = (request.headers.get("x-ai-provider") || undefined) as import("@/lib/ai/common-provider").AIProviderType | undefined;
    const key = await requestKey("parse-resume", { content, provider: providerHeader });
    const cached = getCachedAiResponse(key);
    if (cached) return Response.json(cached);

    // Apply abuse prevention guardrails (origin, daily limit, rate limiting)
    await enforceAiRouteGuard(request, "heavy");

    const result = await dedupeRequest(key, () => getResumeAIProvider(providerHeader).parseLatexResume(content));
    setCachedAiResponse(key, result);
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

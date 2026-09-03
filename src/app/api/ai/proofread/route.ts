import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { retrieveGuidance } from "@/features/guidance/retrieve";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { enforceAiRouteGuard } from "@/lib/ai/guard";
import { getCachedAiResponse, setCachedAiResponse } from "@/lib/ai/cache";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z.object({ resume: ResumeSchema, resumeRevision: z.string().min(1).max(160) });

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 210_000);
    const guidance = retrieveGuidance({ task: "proofread", resume: input.resume });
    const providerHeader = (request.headers.get("x-ai-provider") || undefined) as import("@/lib/ai/common-provider").AIProviderType | undefined;
    const key = await requestKey("proofread", { resume: input.resume, resumeRevision: input.resumeRevision, provider: providerHeader });

    const cached = getCachedAiResponse(key);
    if (cached) return Response.json(cached);

    await enforceAiRouteGuard(request, "medium");

    const result = await dedupeRequest(key, () => getResumeAIProvider(providerHeader).proofreadResume(input.resume, input.resumeRevision, guidance));
    setCachedAiResponse(key, result);
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

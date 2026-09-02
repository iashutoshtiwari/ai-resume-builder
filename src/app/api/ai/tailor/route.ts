import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { JobAnalysisResponseSchema, TargetJobSchema } from "@/features/jobs/schema";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z.object({
  resume: ResumeSchema,
  targetJob: TargetJobSchema,
  analysis: JobAnalysisResponseSchema,
  resumeRevision: z.string().min(1).max(160),
});

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 260_000);
    const key = await requestKey("tailor", input);
    const result = await dedupeRequest(key, () => getResumeAIProvider().generateTailoringSuggestions(input.resume, input.targetJob, input.analysis, input.resumeRevision));
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

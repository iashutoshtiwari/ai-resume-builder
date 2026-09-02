import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { TargetJobSchema } from "@/features/jobs/schema";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z.object({ resume: ResumeSchema, targetJob: TargetJobSchema });

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 240_000);
    const key = await requestKey("analyze-job", input);
    const result = await dedupeRequest(key, () => getResumeAIProvider().analyzeJob(input.resume, input.targetJob));
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

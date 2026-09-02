import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { retrieveGuidance } from "@/features/guidance/retrieve";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z.object({ resume: ResumeSchema, resumeRevision: z.string().min(1).max(160) });

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 210_000);
    const guidance = retrieveGuidance({ task: "proofread", resume: input.resume });
    const key = await requestKey("proofread", { ...input, guidance });
    const result = await dedupeRequest(key, () => getResumeAIProvider().proofreadResume(input.resume, input.resumeRevision, guidance));
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

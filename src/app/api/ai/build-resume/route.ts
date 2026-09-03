import { z } from "zod";
import { retrieveGuidance } from "@/features/guidance/retrieve";
import { RenderedSectionSchema } from "@/features/presentation/schema";
import { CandidateProfileSchema, candidateProfileToResumeDocument } from "@/features/resume/candidate-profile";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { dedupeRequest, parseJsonRequest, requestKey } from "@/lib/ai/request";

export const runtime = "nodejs";

const InputSchema = z.object({
  profile: CandidateProfileSchema,
  sections: z.array(RenderedSectionSchema).min(1).max(8),
  locale: z.enum(["india", "us-canada"]).optional().default("india"),
});

export async function POST(request: Request) {
  try {
    const input = await parseJsonRequest(request, InputSchema, 300_000);
    const candidateDoc = candidateProfileToResumeDocument(input.profile);
    const guidance = retrieveGuidance({
      task: "build",
      resume: candidateDoc,
      careerStage: input.profile.careerStage,
      locale: input.locale,
    });
    const key = await requestKey("build-resume", {
      profile: input.profile,
      sections: input.sections,
      locale: input.locale,
    });

    const result = await dedupeRequest(key, () =>
      getResumeAIProvider().buildResume(input.profile, input.sections, guidance),
    );

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

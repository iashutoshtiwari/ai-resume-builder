import { z } from "zod";
import { retrieveGuidance } from "@/features/guidance/retrieve";
import { RenderedSectionSchema } from "@/features/presentation/schema";
import { CandidateProfileSchema, candidateProfileToResumeDocument } from "@/features/resume/candidate-profile";
import { apiErrorResponse } from "@/lib/ai/errors";
import { getResumeAIProvider } from "@/lib/ai/factory";
import { enforceAiRouteGuard } from "@/lib/ai/guard";
import { getCachedAiResponse, setCachedAiResponse } from "@/lib/ai/cache";
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
    const providerHeader = (request.headers.get("x-ai-provider") || undefined) as import("@/lib/ai/common-provider").AIProviderType | undefined;
    const key = await requestKey("build-resume", {
      profile: input.profile,
      sections: input.sections,
      locale: input.locale,
      provider: providerHeader,
    });

    const cached = getCachedAiResponse(key);
    if (cached) return Response.json(cached);

    await enforceAiRouteGuard(request, "heavy");

    const result = await dedupeRequest(key, () =>
      getResumeAIProvider(providerHeader).buildResume(input.profile, input.sections, guidance),
    );
    setCachedAiResponse(key, result);

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import type { TailoringResponse, ProofreadingResponse } from "@/features/changes/schema";
import type { JobAnalysisResponse, TargetJob } from "@/features/jobs/schema";
import type { ImportResult } from "@/features/latex/importer";
import type { Resume } from "@/features/resume/schema";
import type { GuidanceContext } from "@/features/guidance/schema";

export interface ResumeAIProvider {
  parseLatexResume(source: string): Promise<ImportResult>;
  analyzeJob(resume: Resume, targetJob: TargetJob, guidance: GuidanceContext): Promise<JobAnalysisResponse>;
  generateTailoringSuggestions(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
    guidance: GuidanceContext,
  ): Promise<TailoringResponse>;
  proofreadResume(resume: Resume, resumeRevision: string, guidance: GuidanceContext): Promise<ProofreadingResponse>;
}

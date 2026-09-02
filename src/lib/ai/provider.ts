import type { TailoringResponse, ProofreadingResponse } from "@/features/changes/schema";
import type { JobAnalysisResponse, TargetJob } from "@/features/jobs/schema";
import type { ImportResult } from "@/features/latex/importer";
import type { Resume } from "@/features/resume/schema";

export interface ResumeAIProvider {
  parseLatexResume(source: string): Promise<ImportResult>;
  analyzeJob(resume: Resume, targetJob: TargetJob): Promise<JobAnalysisResponse>;
  generateTailoringSuggestions(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
  ): Promise<TailoringResponse>;
  proofreadResume(resume: Resume, resumeRevision: string): Promise<ProofreadingResponse>;
}

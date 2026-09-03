import type {
  ProofreadingResponse,
  ResumeChange,
  TailoringResponse,
  UnsupportedGap,
} from "@/features/changes/schema";
import type { GuidanceContext } from "@/features/guidance/schema";
import type { JobAnalysisResponse, TargetJob } from "@/features/jobs/schema";
import type { ImportResult } from "@/features/latex/importer";
import type { RenderedSection } from "@/features/presentation/schema";
import type { CandidateProfile } from "@/features/resume/candidate-profile";
import type { Resume } from "@/features/resume/schema";

export interface BuildResumeResponse {
  resume: Resume;
  summary: string;
  normalizedItemsCount: number;
}

export interface TailoredResumeResponse {
  tailoredResume: Resume;
  summary: string;
  changes: ResumeChange[];
  gaps: UnsupportedGap[];
  evidenceReport?: Array<{ requirement: string; evidence: string; status: string }>;
}

export interface ResumeAIProvider {
  parseLatexResume(source: string): Promise<ImportResult>;
  parseResume(source: string): Promise<ImportResult>;
  buildResume(
    profile: CandidateProfile,
    sections: RenderedSection[],
    guidance: GuidanceContext,
  ): Promise<BuildResumeResponse>;
  analyzeJob(resume: Resume, targetJob: TargetJob, guidance: GuidanceContext): Promise<JobAnalysisResponse>;
  tailorResume(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
    guidance: GuidanceContext,
  ): Promise<TailoredResumeResponse>;
  generateTailoringSuggestions(
    resume: Resume,
    targetJob: TargetJob,
    analysis: JobAnalysisResponse,
    resumeRevision: string,
    guidance: GuidanceContext,
  ): Promise<TailoringResponse>;
  proofreadResume(resume: Resume, resumeRevision: string, guidance: GuidanceContext): Promise<ProofreadingResponse>;
}


import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { JobAnalysisSchema, JobComparisonSchema, TargetJobSchema } from "@/features/jobs/schema";
import { ProofreadingChangeSchema, ResumeChangeSchema, UnsupportedGapSchema } from "@/features/changes/schema";

export const WorkspaceSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  resume: ResumeSchema,
  originalResume: ResumeSchema,
  originalLatex: z.string().max(200_000).nullable(),
  generatedLatex: z.string().max(200_000),
  manualLatex: z.string().max(200_000).nullable(),
  manualLatexStale: z.boolean(),
  targetJob: TargetJobSchema.nullable(),
  jobAnalysis: JobAnalysisSchema.nullable(),
  jobComparison: JobComparisonSchema.nullable(),
  tailoringChanges: z.array(ResumeChangeSchema),
  unsupportedGaps: z.array(UnsupportedGapSchema),
  proofreadingChanges: z.array(ProofreadingChangeSchema),
  resumeRevision: z.string().min(1),
  lastCompiledSourceHash: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export type PersistedWorkspaceRecord = {
  key: "primary";
  workspace: Workspace;
  pdfBlob?: Blob;
};

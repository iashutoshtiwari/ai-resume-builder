import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { JobAnalysisSchema, JobComparisonSchema, TargetJobSchema } from "@/features/jobs/schema";
import { ProofreadingChangeSchema, ResumeChangeSchema, UnsupportedGapSchema } from "@/features/changes/schema";
import { GuidanceContextSchema } from "@/features/guidance/schema";
import { ResumePresentationSchema } from "@/features/presentation/schema";

import { CandidateProfileSchema } from "@/features/resume/candidate-profile";
import { CareerStageSchema } from "@/features/resume/schema";

export const LatexProjectFileSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().min(1).max(240).regex(/^[^\\/:*?"<>|]+$/, "Use a plain filename without folders."),
  content: z.instanceof(Uint8Array).refine((value) => value.byteLength <= 8_000_000, "Project files must be 8 MB or smaller."),
});

export const WorkspaceSchema = z.object({
  version: z.literal(4),
  id: z.string().min(1),
  name: z.string().min(1).max(160),
  resume: ResumeSchema,
  originalResume: ResumeSchema,
  baselineResume: ResumeSchema.optional(),
  tailoredResume: ResumeSchema.nullable().optional(),
  tailoringSummary: z.string().optional(),
  candidateProfile: CandidateProfileSchema.optional(),
  locale: z.enum(["india", "us-canada"]).default("india"),
  careerStageOverride: CareerStageSchema.nullable().optional(),
  activeVariant: z.enum(["original", "current", "tailored"]).default("current"),
  originalLatex: z.string().max(200_000).nullable(),
  generatedLatex: z.string().max(200_000),
  templateVersion: z.literal(1),
  latexMode: z.enum(["generated", "manual"]),
  manualLatex: z.string().max(200_000).nullable(),
  manualLatexStale: z.boolean(),
  compilerFiles: z.array(LatexProjectFileSchema).max(40).refine(
    (files) => files.reduce((total, file) => total + file.content.byteLength, 0) <= 25_000_000,
    "LaTeX project files must total 25 MB or less.",
  ),
  presentation: ResumePresentationSchema,
  guidanceContext: GuidanceContextSchema.nullable(),
  targetJob: TargetJobSchema.nullable(),
  jobAnalysis: JobAnalysisSchema.nullable(),
  jobComparison: JobComparisonSchema.nullable(),
  tailoringChanges: z.array(ResumeChangeSchema),
  unsupportedGaps: z.array(UnsupportedGapSchema),
  proofreadingChanges: z.array(ProofreadingChangeSchema).default([]),
  resumeRevision: z.string().min(1),
  lastCompiledSourceHash: z.string().nullable(),
  lastCompiledPageCount: z.number().int().positive().max(100).nullable(),
  updatedAt: z.iso.datetime(),
}).refine(
  (workspace) => workspace.latexMode !== "manual" || workspace.manualLatex !== null,
  { message: "Manual LaTeX mode requires a manual source.", path: ["manualLatex"] },
);

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type LatexProjectFile = z.infer<typeof LatexProjectFileSchema>;

export type PersistedWorkspaceRecord = {
  key: "primary";
  workspace: Workspace;
  pdfBlob?: Blob;
};

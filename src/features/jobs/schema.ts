import { z } from "zod";
import { EvidenceReferenceSchema } from "@/features/changes/schema";

export const TargetJobSchema = z.object({
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  description: z.string().min(40).max(30_000),
});

export const JobRequirementSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().min(1).max(600),
  category: z.enum(["skill", "technology", "experience", "responsibility", "domain", "education", "soft-skill", "other"]),
  importance: z.enum(["required", "preferred", "inferred"]),
});

export const JobAnalysisSchema = z.object({
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  summary: z.string().min(1).max(1200),
  requirements: z.array(JobRequirementSchema).max(80),
  keywords: z.array(z.string().min(1).max(120)).max(100),
  primaryResponsibilities: z.array(z.string().min(1).max(500)).max(30),
  senioritySignals: z.array(z.string().min(1).max(300)).max(20),
  domainSignals: z.array(z.string().min(1).max(300)).max(20),
});

export const JobComparisonEntrySchema = z.object({
  requirementId: z.string().min(1),
  status: z.enum(["supported", "under-emphasized", "unsupported"]),
  explanation: z.string().min(1).max(800),
  evidence: z.array(EvidenceReferenceSchema).max(12),
});

export const JobComparisonSchema = z.object({
  entries: z.array(JobComparisonEntrySchema).max(80),
});

export const JobAnalysisResponseSchema = z.object({
  analysis: JobAnalysisSchema,
  comparison: JobComparisonSchema,
});

export type TargetJob = z.infer<typeof TargetJobSchema>;
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
export type JobComparison = z.infer<typeof JobComparisonSchema>;
export type JobAnalysisResponse = z.infer<typeof JobAnalysisResponseSchema>;

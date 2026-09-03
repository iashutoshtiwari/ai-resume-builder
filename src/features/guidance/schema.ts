import { z } from "zod";

export const GuidanceTaskSchema = z.enum(["format", "analyze", "tailor", "proofread", "build"]);
export const GuidanceSectionSchema = z.enum([
  "global",
  "contact",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
  "dates",
  "bullets",
]);

export const GuidanceCategorySchema = z.enum(["global", "career-stage", "locale", "sections"]);

export const GuidanceChunkSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(120),
  guidance: z.string().min(1).max(1000),
  category: GuidanceCategorySchema.optional(),
  careerStages: z.array(z.string()).optional(),
  locale: z.enum(["general", "india", "us-canada"]).optional(),
  sourceUrl: z.string().optional(),
  sourceSection: z.string().max(120).optional(),
  reviewedAt: z.string().optional(),
  applicability: z.enum(["general", "india", "us-canada"]).default("general"),
  tasks: z.array(GuidanceTaskSchema).min(1),
  sections: z.array(GuidanceSectionSchema).min(1),
  tags: z.array(z.string().min(1).max(60)).min(1).max(20),
  mandatory: z.boolean().default(false),
});

export const GuidanceContextSchema = z.object({
  snapshotVersion: z.string().min(1).max(60),
  chunks: z.array(GuidanceChunkSchema).max(16),
});

export const GuidanceFindingSchema = z.object({
  id: z.string().min(1).max(160),
  ruleId: z.string().min(1).max(160),
  severity: z.enum(["action", "review", "passed"]),
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(800),
  target: z.string().max(240).optional(),
});

export type GuidanceTask = z.infer<typeof GuidanceTaskSchema>;
export type GuidanceSection = z.infer<typeof GuidanceSectionSchema>;
export type GuidanceChunk = z.infer<typeof GuidanceChunkSchema>;
export type GuidanceContext = z.infer<typeof GuidanceContextSchema>;
export type GuidanceFinding = z.infer<typeof GuidanceFindingSchema>;

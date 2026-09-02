import { z } from "zod";

export const GuidanceTaskSchema = z.enum(["format", "analyze", "tailor", "proofread"]);
export const GuidanceSectionSchema = z.enum(["global", "contact", "skills", "experience", "projects", "education", "dates", "bullets"]);

export const GuidanceChunkSchema = z.object({
  id: z.string().regex(/^er-[a-z0-9-]+$/),
  title: z.string().min(1).max(120),
  guidance: z.string().min(1).max(700),
  sourceUrl: z.url().startsWith("https://www.reddit.com/r/EngineeringResumes/wiki/"),
  sourceSection: z.string().min(1).max(120),
  reviewedAt: z.iso.date(),
  applicability: z.enum(["general", "us-canada"]),
  tasks: z.array(GuidanceTaskSchema).min(1),
  sections: z.array(GuidanceSectionSchema).min(1),
  tags: z.array(z.string().min(1).max(60)).min(1).max(20),
  mandatory: z.boolean().default(false),
});

export const GuidanceContextSchema = z.object({
  snapshotVersion: z.string().min(1).max(40),
  chunks: z.array(GuidanceChunkSchema).max(10),
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

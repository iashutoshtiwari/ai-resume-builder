import { z } from "zod";

export const EvidenceReferenceSchema = z.object({
  type: z.enum(["experience", "project", "skill", "education", "resume"]),
  entityId: z.string().min(1),
  itemId: z.string().min(1).optional(),
  quote: z.string().min(1).max(1200).optional(),
});

export const RewriteTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("basics-headline") }),
  z.object({ kind: z.literal("experience-bullet"), entityId: z.string(), itemId: z.string() }),
  z.object({ kind: z.literal("project-bullet"), entityId: z.string(), itemId: z.string() }),
  z.object({ kind: z.literal("education-detail"), entityId: z.string(), itemId: z.string() }),
]);

export const RemoveTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("experience-bullet"), entityId: z.string(), itemId: z.string() }),
  z.object({ kind: z.literal("project-bullet"), entityId: z.string(), itemId: z.string() }),
]);

export const ReorderTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("experience-bullet"), entityId: z.string(), itemId: z.string(), beforeItemId: z.string().nullable() }),
  z.object({ kind: z.literal("project-bullet"), entityId: z.string(), itemId: z.string(), beforeItemId: z.string().nullable() }),
  z.object({ kind: z.literal("skill"), entityId: z.string(), itemId: z.string(), beforeItemId: z.string().nullable() }),
]);

const ChangeBaseSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(1).max(1200),
  evidence: z.array(EvidenceReferenceSchema).min(1).max(12),
  jobRequirementIds: z.array(z.string().min(1)).max(30),
  guidanceRuleIds: z.array(z.string().min(1).max(160)).min(1).max(10),
  risk: z.enum(["safe", "needs-review"]),
  status: z.enum(["pending", "accepted", "rejected", "edited"]).default("pending"),
  resumeRevision: z.string().min(1),
  editedAfter: z.string().min(1).max(2000).optional(),
});

export const ResumeChangeSchema = z.discriminatedUnion("type", [
  ChangeBaseSchema.extend({
    type: z.literal("rewrite-text"),
    target: RewriteTargetSchema,
    before: z.string().max(2000),
    after: z.string().min(1).max(2000),
  }),
  ChangeBaseSchema.extend({
    type: z.literal("remove-item"),
    target: RemoveTargetSchema,
    before: z.string().min(1).max(2000),
  }),
  ChangeBaseSchema.extend({
    type: z.literal("reorder-item"),
    target: ReorderTargetSchema,
  }),
]);

export const UnsupportedGapSchema = z.object({
  id: z.string().min(1),
  requirementId: z.string().min(1),
  explanation: z.string().min(1).max(800),
});

export const TailoringResponseSchema = z.object({
  changes: z.array(ResumeChangeSchema).max(80),
  gaps: z.array(UnsupportedGapSchema).max(80),
});

export const ProofreadingChangeSchema = z.object({
  id: z.string().min(1),
  target: RewriteTargetSchema,
  before: z.string().min(1).max(2000),
  after: z.string().min(1).max(2000),
  category: z.enum(["grammar", "spelling", "punctuation", "consistency", "clarity"]),
  explanation: z.string().min(1).max(800),
  confidence: z.enum(["high", "medium", "low"]),
  guidanceRuleIds: z.array(z.string().min(1).max(160)).min(1).max(10),
  status: z.enum(["pending", "accepted", "rejected", "edited"]).default("pending"),
  resumeRevision: z.string().min(1),
  editedAfter: z.string().min(1).max(2000).optional(),
});

export const ProofreadingResponseSchema = z.object({ changes: z.array(ProofreadingChangeSchema).max(100) });

export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;
export type ResumeChange = z.infer<typeof ResumeChangeSchema>;
export type ProofreadingChange = z.infer<typeof ProofreadingChangeSchema>;
export type UnsupportedGap = z.infer<typeof UnsupportedGapSchema>;
export type RewriteTarget = z.infer<typeof RewriteTargetSchema>;
export type TailoringResponse = z.infer<typeof TailoringResponseSchema>;
export type ProofreadingResponse = z.infer<typeof ProofreadingResponseSchema>;

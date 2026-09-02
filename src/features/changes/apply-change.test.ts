import { describe, expect, it } from "vitest";
import { applyResumeChange, ChangeApplicationError } from "@/features/changes/apply-change";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import type { ResumeChange } from "@/features/changes/schema";

function baseChange(overrides: Partial<ResumeChange> = {}): ResumeChange {
  return {
    id: "change-1",
    type: "rewrite-text",
    target: { kind: "experience-bullet", entityId: "experience-example", itemId: "bullet-api" },
    before: "Integrated REST APIs and improved error handling across customer-facing workflows.",
    after: "Integrated REST APIs with resilient error handling across customer-facing workflows.",
    reason: "Clarifies the existing API work.",
    evidence: [{ type: "experience", entityId: "experience-example", itemId: "bullet-api" }],
    jobRequirementIds: ["req-api"],
    guidanceRuleIds: ["er-relevant-content"],
    risk: "safe",
    status: "pending",
    resumeRevision: "revision-1",
    ...overrides,
  } as ResumeChange;
}

describe("applyResumeChange", () => {
  it("rewrites a bullet immutably", () => {
    const result = applyResumeChange(sampleResume, baseChange());
    expect(result.experience[0].bullets[1].text).toContain("resilient");
    expect(sampleResume.experience[0].bullets[1].text).not.toContain("resilient");
  });

  it("removes a bullet", () => {
    const result = applyResumeChange(sampleResume, baseChange({ type: "remove-item", target: { kind: "experience-bullet", entityId: "experience-example", itemId: "bullet-api" }, before: sampleResume.experience[0].bullets[1].text }));
    expect(result.experience[0].bullets).toHaveLength(2);
  });

  it("reorders a bullet", () => {
    const result = applyResumeChange(sampleResume, baseChange({ type: "reorder-item", target: { kind: "experience-bullet", entityId: "experience-example", itemId: "bullet-ci", beforeItemId: "bullet-design-system" } }));
    expect(result.experience[0].bullets[0].id).toBe("bullet-ci");
  });

  it("rejects an invalid target", () => {
    expect(() => applyResumeChange(sampleResume, baseChange({ target: { kind: "experience-bullet", entityId: "experience-example", itemId: "missing" } }))).toThrow(ChangeApplicationError);
  });
});

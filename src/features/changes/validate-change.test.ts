import { describe, expect, it } from "vitest";
import { validateChangeAgainstResume } from "@/features/changes/validate-change";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import type { ResumeChange } from "@/features/changes/schema";

const change: ResumeChange = {
  id: "change-1",
  type: "rewrite-text",
  target: { kind: "experience-bullet", entityId: "experience-example", itemId: "bullet-api" },
  before: "Integrated REST APIs and improved error handling across customer-facing workflows.",
  after: "Integrated REST APIs with robust error handling across customer-facing workflows.",
  reason: "Clarifies relevant work.",
  evidence: [{ type: "experience", entityId: "experience-example", itemId: "bullet-api", quote: "Integrated REST APIs" }],
  jobRequirementIds: [],
  guidanceRuleIds: ["er-relevant-content"],
  risk: "safe",
  status: "pending",
  resumeRevision: "revision-1",
};

describe("validateChangeAgainstResume", () => {
  it("accepts grounded rewrites", () => expect(validateChangeAgainstResume(change, sampleResume)).toEqual({ valid: true }));
  it("rejects missing evidence", () => expect(validateChangeAgainstResume({ ...change, evidence: [{ type: "experience", entityId: "missing" }] }, sampleResume)).toMatchObject({ valid: false, code: "bad-evidence" }));
  it("rejects mismatched source", () => expect(validateChangeAgainstResume({ ...change, before: "Different" }, sampleResume)).toMatchObject({ valid: false, code: "source-mismatch" }));
  it("rejects invented metrics", () => expect(validateChangeAgainstResume({ ...change, after: `${change.after} Improved speed by 40%.` }, sampleResume)).toMatchObject({ valid: false, code: "invented-metric" }));
  it("rejects job technologies absent from resume evidence", () => {
    const analysis = { company: "Example", role: "Engineer", summary: "Role", requirements: [{ id: "req-k8s", text: "Kubernetes", category: "technology" as const, importance: "preferred" as const }], keywords: [], primaryResponsibilities: [], senioritySignals: [], domainSignals: [] };
    expect(validateChangeAgainstResume({ ...change, after: `${change.after} using Kubernetes.`, jobRequirementIds: ["req-k8s"] }, sampleResume, analysis)).toMatchObject({ valid: false, code: "unsupported-technology" });
  });

  it("validates guidance rule citations against supplied guidance context", () => {
    const guidance = {
      snapshotVersion: "test-v1",
      chunks: [
        {
          id: "er-relevant-content",
          title: "Relevant",
          guidance: "Guidance text",
          sourceUrl: "https://www.reddit.com/r/EngineeringResumes/wiki/index/#wiki_general_rules",
          sourceSection: "General Rules",
          reviewedAt: "2026-09-02",
          applicability: "general" as const,
          tasks: ["tailor" as const],
          sections: ["global" as const],
          tags: ["relevance"],
          mandatory: false,
        },
      ],
    };
    expect(validateChangeAgainstResume(change, sampleResume, undefined, guidance)).toEqual({ valid: true });
    expect(validateChangeAgainstResume({ ...change, guidanceRuleIds: ["unknown-rule-id"] }, sampleResume, undefined, guidance)).toMatchObject({
      valid: false,
      code: "unknown-guidance-id",
    });
  });
});

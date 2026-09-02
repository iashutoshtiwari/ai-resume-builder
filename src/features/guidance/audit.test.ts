import { describe, expect, it } from "vitest";
import { auditResumeGuidance } from "@/features/guidance/audit";
import { DEFAULT_PRESENTATION } from "@/features/presentation/schema";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";

describe("auditResumeGuidance", () => {
  it("reports deterministic local findings without an ATS score", () => {
    const findings = auditResumeGuidance({ resume: sampleResume, presentation: DEFAULT_PRESENTATION, manualLatex: false, pageCount: 1, compiledCurrent: true });
    expect(findings.some((item) => item.ruleId === "er-page-length" && item.severity === "passed")).toBe(true);
    expect(findings.some((item) => item.ruleId === "er-single-column" && item.severity === "passed")).toBe(true);
    expect(JSON.stringify(findings).toLowerCase()).not.toContain("ats score");
  });

  it("warns about manual source and multi-page output without blocking", () => {
    const findings = auditResumeGuidance({ resume: sampleResume, presentation: DEFAULT_PRESENTATION, manualLatex: true, pageCount: 2, compiledCurrent: true });
    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "er-single-column", severity: "review" }),
      expect.objectContaining({ ruleId: "er-page-length", severity: "review" }),
    ]));
  });

  it("detects pronouns, terminal punctuation, weak verbs, long bullets, and mixed dates", () => {
    const resume = structuredClone(sampleResume);
    resume.experience[0].startDate = "03/2020";
    resume.experience[0].endDate = "March 2024";
    resume.experience[0].bullets[0].text = `We helped ${"with repeated technical details ".repeat(9)}.`;
    const findings = auditResumeGuidance({ resume, presentation: DEFAULT_PRESENTATION, manualLatex: false, pageCount: null, compiledCurrent: false });
    const rules = new Set(findings.filter((item) => item.severity !== "passed").map((item) => item.ruleId));
    expect(rules.has("er-no-pronouns")).toBe(true);
    expect(rules.has("er-no-periods")).toBe(true);
    expect(rules.has("er-weak-verbs")).toBe(true);
    expect(rules.has("er-bullet-one-sentence")).toBe(true);
    expect(rules.has("er-date-format")).toBe(true);
  });
});

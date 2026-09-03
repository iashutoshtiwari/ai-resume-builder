import { describe, expect, it } from "vitest";
import { assessJobMatch, assessResume, detectCareerStage } from "@/features/assessment/scoring";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";

describe("resume assessment", () => {
  it("derives a deterministic career stage and independent quality scores", () => {
    expect(detectCareerStage(sampleResume)).toBe("mid-level");
    const assessment = assessResume(sampleResume);
    expect(assessment.quality).toBeGreaterThan(0);
    expect(assessment.ats).toBeGreaterThanOrEqual(75);
    expect(assessment.qualityBreakdown).toHaveLength(6);
  });

  it("does not treat an older graduation or a graduate-titled role as new graduate", () => {
    const experiencedResume = {
      ...sampleResume,
      experience: [{ ...sampleResume.experience[0], role: "Graduate Software Engineer", startDate: "July 2020", endDate: "Present" }],
      education: [{ ...sampleResume.education[0], endDate: "May 2020" }],
    };
    expect(detectCareerStage(experiencedResume)).toBe("mid-level");
  });

  it("keeps exact and transferable job evidence distinct", () => {
    const result = assessJobMatch(sampleResume, { company: "Acme", role: "Engineer", summary: "", keywords: [], primaryResponsibilities: [], senioritySignals: [], domainSignals: [], requirements: [
      { id: "react", text: "React", category: "technology", importance: "required" },
      { id: "cicd", text: "CI CD", category: "skill", importance: "preferred" },
      { id: "kafka", text: "Kafka", category: "technology", importance: "required" },
    ] });
    expect(result.matches.map((match) => match.status)).toEqual(["exact", "transferable", "not-represented"]);
    expect(result.score).toBeGreaterThan(0);
  });
});

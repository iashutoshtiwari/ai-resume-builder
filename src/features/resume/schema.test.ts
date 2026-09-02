import { describe, expect, it } from "vitest";
import { ResumeSchema } from "@/features/resume/schema";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";

describe("ResumeSchema", () => {
  it("accepts a valid resume", () => expect(ResumeSchema.safeParse(sampleResume).success).toBe(true));
  it("rejects a resume without a name", () => expect(ResumeSchema.safeParse({ ...sampleResume, basics: { ...sampleResume.basics, name: "" } }).success).toBe(false));
});

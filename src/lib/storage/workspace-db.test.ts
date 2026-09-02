import { describe, expect, it } from "vitest";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { migrateWorkspace } from "@/lib/storage/workspace-db";

describe("workspace migrations", () => {
  it("migrates a legacy resume-only workspace", () => {
    const migrated = migrateWorkspace({ version: 0, name: "Legacy", resume: sampleResume });
    expect(migrated.version).toBe(1);
    expect(migrated.originalResume).toEqual(sampleResume);
    expect(migrated.generatedLatex).toContain("Alex Morgan");
  });

  it("rejects corrupt and future records", () => {
    expect(() => migrateWorkspace({ version: 99, resume: sampleResume })).toThrow(/unsupported/i);
    expect(() => migrateWorkspace({ version: 0, resume: { nope: true } })).toThrow(/corrupt/i);
  });
});

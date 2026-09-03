import { describe, expect, it } from "vitest";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { migrateWorkspace } from "@/lib/storage/workspace-db";

describe("workspace migrations", () => {
  it("migrates a legacy resume-only workspace", () => {
    const migrated = migrateWorkspace({ version: 0, name: "Legacy", resume: sampleResume });
    expect(migrated.version).toBe(4);
    expect(migrated.originalResume).toEqual(sampleResume);
    expect(migrated.generatedLatex).toContain("Alex Morgan");
    expect(migrated.compilerFiles).toEqual([]);
    expect(migrated.presentation.paperSize).toBe("letter");
    expect(migrated.templateVersion).toBe(1);
    expect(migrated.latexMode).toBe("generated");
    expect(migrated.guidanceContext).toBeNull();
    expect(migrated.lastCompiledPageCount).toBeNull();
  });

  it("rejects corrupt and future records", () => {
    expect(() => migrateWorkspace({ version: 99, resume: sampleResume })).toThrow(/unsupported/i);
    expect(() => migrateWorkspace({ version: 0, resume: { nope: true } })).toThrow(/corrupt/i);
  });

  it("migrates legacy presentation choices to the canonical allowlist and preserves manual mode", () => {
    const migrated = migrateWorkspace({
      version: 3,
      name: "Legacy override",
      resume: sampleResume,
      manualLatex: "\\documentclass{article}\\begin{document}Manual\\end{document}",
      presentation: {
        templateId: "minimal",
        fontFamily: "lato",
        fontSize: 10.5,
        margin: 0.4,
        density: "compact",
        paperSize: "a4",
        sections: ["education", "experience"],
      },
    });

    expect(migrated.presentation).toEqual({ paperSize: "a4", sections: ["education", "experience"] });
    expect(migrated.latexMode).toBe("manual");
    expect(migrated.manualLatex).toContain("Manual");
    expect(migrated.generatedLatex).toContain("a4paper");
    expect(migrated.generatedLatex.indexOf("\\section*{Education}")).toBeLessThan(
      migrated.generatedLatex.indexOf("\\section*{Experience}"),
    );
  });
});

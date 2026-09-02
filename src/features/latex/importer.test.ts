import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KnownTemplateImporter } from "@/features/latex/importer";

describe("KnownTemplateImporter", () => {
  it("imports the supplied main.tex fixture", async () => {
    const source = await readFile(resolve(process.cwd(), "main.tex"), "utf8");
    const importer = new KnownTemplateImporter();
    expect(importer.canHandle(source)).toBe(true);
    const result = await importer.parse(source);
    expect(result.resume.basics.name).toBe("John Doe");
    expect(result.resume.experience.length).toBeGreaterThan(0);
    expect(result.resume.projects.length).toBeGreaterThan(0);
    expect(result.resume.education.length).toBeGreaterThan(0);
  });
});

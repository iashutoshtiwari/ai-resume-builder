import { describe, expect, it } from "vitest";
import { KnownTemplateImporter } from "@/features/latex/importer";
import { CANONICAL_TEMPLATE_SOURCE } from "@/features/latex/templates/canonical";

describe("KnownTemplateImporter", () => {
  it("imports the supplied canonical template", async () => {
    const source = CANONICAL_TEMPLATE_SOURCE;
    const importer = new KnownTemplateImporter();
    expect(importer.canHandle(source)).toBe(true);
    const result = await importer.parse(source);
    expect(result.resume.basics.name).toBe("John Doe");
    expect(result.resume.experience.length).toBeGreaterThan(0);
    expect(result.resume.projects.length).toBeGreaterThan(0);
    expect(result.resume.education.length).toBeGreaterThan(0);
  });
});

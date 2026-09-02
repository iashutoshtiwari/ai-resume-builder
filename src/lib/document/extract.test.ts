import { describe, expect, it } from "vitest";
import { extractTextFromFile } from "./extract";

describe("document extractor", () => {
  it("extracts text from plain text files", async () => {
    const file = new File(["John Doe\nSoftware Engineer\nReact, TypeScript"], "resume.txt", {
      type: "text/plain",
    });
    const result = await extractTextFromFile(file);
    expect(result.format).toBe("text");
    expect(result.text).toContain("John Doe");
    expect(result.text).toContain("Software Engineer");
  });

  it("extracts text from latex files", async () => {
    const file = new File(["\\documentclass{article}\\begin{document}John Doe\\end{document}"], "resume.tex", {
      type: "text/x-tex",
    });
    const result = await extractTextFromFile(file);
    expect(result.format).toBe("latex");
    expect(result.text).toContain("\\documentclass{article}");
  });

  it("rejects legacy Word and unrelated binary formats with useful guidance", async () => {
    await expect(extractTextFromFile(new File(["legacy"], "resume.doc"))).rejects.toThrow(/save it as \.docx/i);
    await expect(extractTextFromFile(new File(["binary"], "resume.rtf"))).rejects.toThrow(/unsupported resume format/i);
  });
});

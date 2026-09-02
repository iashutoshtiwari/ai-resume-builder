import { describe, expect, it } from "vitest";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";

describe("renderResumeToLatex", () => {
  it("renders the canonical sections and important content", () => {
    const latex = renderResumeToLatex(sampleResume);
    expect(latex).toContain("\\centerline{\\Huge Alex Morgan}");
    expect(latex).toContain("\\section*{Experience}");
    expect(latex).toContain("Example Corp");
    expect(latex).toContain("\\section*{Education}");
    expect(latex).toContain("\\end{document}");
  });
});

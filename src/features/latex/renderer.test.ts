import { describe, expect, it } from "vitest";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { DEFAULT_PRESENTATION, type ResumePresentation } from "@/features/presentation/schema";

describe("renderResumeToLatex", () => {
  it("renders the canonical sections and important content", () => {
    const latex = renderResumeToLatex(sampleResume);
    expect(latex).toContain("\\centerline{\\Huge Alex Morgan}");
    expect(latex).toContain("\\section*{Experience}");
    expect(latex).toContain("Example Corp");
    expect(latex).toContain("\\section*{Education}");
    expect(latex).toContain("\\end{document}");
  });

  it("omits empty sections without generating empty section headings", () => {
    const resumeWithoutProjects = {
      ...sampleResume,
      projects: [],
    };
    const latex = renderResumeToLatex(resumeWithoutProjects);
    expect(latex).not.toContain("\\section*{Projects}");
    expect(latex).not.toContain("No projects listed");
    expect(latex).toContain("\\section*{Experience}");
    expect(latex).toContain("\\section*{Education}");
  });

  it("omits multiple empty sections cleanly", () => {
    const sparseResume = {
      ...sampleResume,
      projects: [],
      skills: [],
    };
    const latex = renderResumeToLatex(sparseResume);
    expect(latex).not.toContain("\\section*{Projects}");
    expect(latex).not.toContain("\\section*{Skills}");
    expect(latex).toContain("\\section*{Experience}");
    expect(latex).toContain("\\section*{Education}");
  });

  it("preserves canonical default preamble choices", () => {
    const latex = renderResumeToLatex(sampleResume, DEFAULT_PRESENTATION);
    expect(latex).toContain("\\documentclass[11pt]{article}");
    expect(latex).toContain("\\usepackage[letterpaper,top=0.5in,bottom=0.5in,left=0.5in,right=0.5in]{geometry}");
    expect(latex).toContain("\\usepackage{XCharter}");
    expect(latex).not.toContain("\\linespread");
  });

  it("renders every safe presentation combination without leaking invalid values", () => {
    const templates: ResumePresentation["templateId"][] = ["canonical", "compact", "minimal"];
    const fonts: ResumePresentation["fontFamily"][] = ["xcharter", "tex-gyre-heros", "lato", "latin-modern"];
    const papers: ResumePresentation["paperSize"][] = ["letter", "a4"];
    const sizes: ResumePresentation["fontSize"][] = [10.5, 11, 12];
    const margins: ResumePresentation["margin"][] = [0.4, 0.5, 0.65];
    const densities: ResumePresentation["density"][] = ["compact", "balanced", "relaxed"];
    for (const templateId of templates) for (const fontFamily of fonts) for (const paperSize of papers) for (const fontSize of sizes) for (const margin of margins) for (const density of densities) {
      const latex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, templateId, fontFamily, paperSize, fontSize, margin, density });
      expect(latex).toContain("\\begin{document}");
      expect(latex).not.toContain("undefined");
    }
  });

  it("honors section order and selected sections", () => {
    const latex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, sections: ["education", "experience"] });
    expect(latex.indexOf("\\section*{Education}")).toBeLessThan(latex.indexOf("\\section*{Experience}"));
    expect(latex).not.toContain("\\section*{Skills}");
    expect(latex).not.toContain("\\section*{Projects}");
  });

  it("maps fonts, A4, exact 10.5pt text, and the minimal header", () => {
    const latex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, templateId: "minimal", fontFamily: "tex-gyre-heros", paperSize: "a4", fontSize: 10.5 });
    expect(latex).toContain("\\usepackage{tgheros}");
    expect(latex).toContain("a4paper");
    expect(latex).toContain("\\fontsize{10.5pt}{11.25pt}\\selectfont");
    expect(latex).toContain("{\\Huge \\textbf{Alex Morgan}}");
  });

  it("renders new curated fonts accurately", () => {
    const robotoLatex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, fontFamily: "roboto" });
    expect(robotoLatex).toContain("\\usepackage[sfdefault]{roboto}");

    const garamondLatex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, fontFamily: "ebgaramond" });
    expect(garamondLatex).toContain("\\usepackage{ebgaramond}");

    const monoLatex = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, fontFamily: "inconsolata" });
    expect(monoLatex).toContain("\\usepackage{inconsolata}");
  });
});

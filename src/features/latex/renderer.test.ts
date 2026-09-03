import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { CANONICAL_TEMPLATE_SOURCE, CANONICAL_TEMPLATE_VERSION } from "@/features/latex/templates/canonical";
import { DEFAULT_PRESENTATION } from "@/features/presentation/schema";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import type { Resume } from "@/features/resume/schema";

const completeResume = {
  ...sampleResume,
  summary: "Engineer focused on reliable document systems.",
  experience: [
    ...sampleResume.experience,
    {
      ...sampleResume.experience[0],
      id: "experience-second",
      company: "Second Company",
      role: "Software Engineer",
    },
  ],
  projects: [
    ...sampleResume.projects,
    {
      ...sampleResume.projects[0],
      id: "project-second",
      name: "Second Project",
    },
  ],
  certifications: [
    { id: "cert-1", name: "Cloud Engineer", issuer: "Example Org", date: "2025", url: "https://example.com/credential?id=1" },
    { id: "cert-2", name: "Security Engineer", issuer: "Example Org", date: "2024" },
  ],
  achievements: [
    { id: "achievement-1", title: "Hackathon winner", description: "Built a verified compiler", date: "2025" },
    { id: "achievement-2", title: "Open-source maintainer" },
  ],
};

describe("canonical template", () => {
  it("keeps the versioned template shell immutable", () => {
    expect(CANONICAL_TEMPLATE_VERSION).toBe(1);
    const normalizedSource = CANONICAL_TEMPLATE_SOURCE.replace(/\r\n/g, "\n").replace(/\n$/, "");
    expect(createHash("sha256").update(normalizedSource).digest("hex")).toBe(
      "6454b0cb899666dabaf9657278053ebf1a51843b93e446015380a2a212fffdaa",
    );
  });
});

describe("renderResumeToLatex", () => {
  it("is deterministic and preserves the fixed canonical shell", () => {
    const first = renderResumeToLatex(sampleResume);
    const second = renderResumeToLatex(structuredClone(sampleResume));
    expect(first).toBe(second);
    expect(first).toContain("\\documentclass[11pt]{article}");
    expect(first).toContain("top=0.5in,\n  bottom=0.5in,\n  left=0.5in,\n  right=0.5in");
    expect(first).toContain("\\usepackage{XCharter}");
    expect(first).toContain("\\usepackage{microtype}");
    expect(first).toContain("\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\small$\\bullet$}}$}");
    expect(first).toContain("itemsep=-2pt,\n  leftmargin=12pt,\n  topsep=7pt");
  });

  it("renders every supported section and multiple repeatable entries", () => {
    const latex = renderResumeToLatex(completeResume);
    for (const heading of ["Summary", "Skills", "Experience", "Projects", "Certifications", "Achievements", "Education"]) {
      expect(latex).toContain(`\\section*{${heading}}`);
    }
    expect(latex).toContain("Example Corp");
    expect(latex).toContain("Second Company");
    expect(latex).toContain("Document Studio");
    expect(latex).toContain("Second Project");
    expect(latex).toContain("Cloud Engineer");
    expect(latex).toContain("Security Engineer");
    expect(latex).toContain("Hackathon winner");
    expect(latex).toContain("Open-source maintainer");
  });

  it.each<[string, Partial<Resume>, string]>([
    ["summary", { summary: undefined }, "Summary"],
    ["projects", { projects: [] }, "Projects"],
    ["certifications", { certifications: [] }, "Certifications"],
    ["achievements", { achievements: [] }, "Achievements"],
  ])("omits an empty %s section", (_name, patch, heading) => {
    const latex = renderResumeToLatex({ ...completeResume, ...patch });
    expect(latex).not.toContain(`\\section*{${heading}}`);
    expect(latex).toContain("\\section*{Education}");
  });

  it("honors explicit section visibility and ordering", () => {
    const latex = renderResumeToLatex(completeResume, {
      paperSize: "letter",
      sections: ["education", "experience"],
    });
    expect(latex.indexOf("\\section*{Education}")).toBeLessThan(latex.indexOf("\\section*{Experience}"));
    expect(latex).not.toContain("\\section*{Skills}");
    expect(latex).not.toContain("\\section*{Projects}");
  });

  it("switches only the allowlisted paper-size token", () => {
    const letter = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, paperSize: "letter" });
    const a4 = renderResumeToLatex(sampleResume, { ...DEFAULT_PRESENTATION, paperSize: "a4" });
    expect(letter).toContain("  letterpaper,");
    expect(a4).toContain("  a4paper,");
    expect(letter.replace("  letterpaper,", "  a4paper,")).toBe(a4);
  });

  it("escapes all LaTeX-sensitive structured text and never treats it as commands", () => {
    const resume = structuredClone(sampleResume);
    resume.basics.name = String.raw`A&B % $ # _ {x} ~ ^ \textbf{Injected}`;
    resume.experience[0].bullets[0].text = String.raw`Built A&B_100% for $5 with {safe} ~ ^ \input{evil}`;
    const latex = renderResumeToLatex(resume);
    expect(latex).toContain(String.raw`A\&B \% \$ \# \_ \{x\} \textasciitilde{} \textasciicircum{} \textbackslash{}textbf\{Injected\}`);
    expect(latex).toContain(String.raw`Built A\&B\_100\% for \$5 with \{safe\} \textasciitilde{} \textasciicircum{} \textbackslash{}input\{evil\}`);
    expect(latex).not.toContain(String.raw`\input{evil}`);
  });

  it("renders safe URLs and degrades unsafe URL values to escaped labels", () => {
    const resume = structuredClone(sampleResume);
    resume.basics.links = [
      { id: "safe", label: "Portfolio", url: "https://example.com/a_b?q=100%25#work" },
      { id: "unsafe", label: "No command", url: String.raw`javascript:\input{evil}` },
    ];
    const latex = renderResumeToLatex(resume);
    expect(latex).toContain(String.raw`\href{https://example.com/a_b?q=100\%25\#work}{Portfolio}`);
    expect(latex).toContain("No command");
    expect(latex).not.toContain("javascript:");
  });
});

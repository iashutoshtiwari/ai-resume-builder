import { createId } from "@/lib/utils";
import { ResumeSchema, type Resume } from "@/features/resume/schema";

export type ImportWarning = { code: string; message: string };
export type ImportResult = { resume: Resume; confidence: "high" | "medium" | "low"; warnings: ImportWarning[]; importer: "known-template" | "ai" };

export interface ResumeImporter {
  canHandle(source: string): boolean;
  parse(source: string): Promise<ImportResult>;
}

function stripComments(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("%"))
    .map((line) => line.replace(/(^|[^\\])%.*/, "$1"))
    .join("\n");
}

function visibleText(source: string): string {
  let value = source.trim();
  value = value.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1");
  value = value.replace(/\\url\{([^}]*)\}/g, "$1");
  value = value.replace(/\\(?:textbf|underline|emph)\{([^{}]*)\}/g, "$1");
  value = value.replace(/\\textasciitilde\{\}/g, "~").replace(/\\textasciicircum\{\}/g, "^");
  value = value.replace(/\\([&%$#_{}])/g, "$1");
  value = value.replace(/\\[a-zA-Z*]+(?:\[[^\]]*\])?/g, "");
  value = value.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  return value;
}

function section(source: string, name: string): string {
  const start = source.indexOf(`\\section*{${name}}`);
  if (start < 0) return "";
  const rest = source.slice(start + `\\section*{${name}}`.length);
  const next = rest.search(/\\section\*\{/);
  return next < 0 ? rest : rest.slice(0, next);
}

function parseBullets(block: string) {
  const list = block.match(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/)?.[1] ?? "";
  return Array.from(list.matchAll(/\\item\s+([\s\S]*?)(?=\\item|$)/g))
    .map((match) => visibleText(match[1]))
    .filter(Boolean)
    .map((text) => ({ id: createId("bullet"), text }));
}

function parseLinks(block: string) {
  return Array.from(block.matchAll(/\\href\{([^}]*)\}\{([^}]*)\}/g)).map((match) => ({
    id: createId("link"),
    url: match[1].replace(/\\#/g, "#"),
    label: visibleText(match[2]),
  }));
}

export class KnownTemplateImporter implements ResumeImporter {
  canHandle(source: string): boolean {
    return source.includes("\\documentclass") && source.includes("\\section*{Experience}") && source.includes("\\section*{Education}");
  }

  async parse(rawSource: string): Promise<ImportResult> {
    const source = stripComments(rawSource);
    const warnings: ImportWarning[] = [];
    const name = visibleText(source.match(/\\centerline\{\\Huge\s+([^}]*)\}/)?.[1] ?? "Imported Resume");
    const centerlines = Array.from(source.matchAll(/\\centerline\{([\s\S]*?)\}\s*(?=\n|$)/g)).map((match) => match[1]);
    const contactLine = centerlines.find((line) => line.includes("\\href") || line.includes("mailto:")) ?? "";
    const links = parseLinks(contactLine).filter((link) => !link.url.startsWith("mailto:"));
    const email = contactLine.match(/mailto:([^}]+)/)?.[1];

    const skills = section(source, "Skills");
    const skillGroups = Array.from(skills.matchAll(/\\textbf\{([^}:]+):\}\s*([^\\\n]*(?:\\[^\\\n]+)*)\s*\\\\/g)).map((match) => ({
      id: createId("skill-group"),
      name: visibleText(match[1]),
      skills: visibleText(match[2]).split(",").map((item) => item.trim()).filter(Boolean).map((item) => ({ id: createId("skill"), name: item })),
    }));

    const experienceBlock = section(source, "Experience");
    const experienceHeaders = Array.from(experienceBlock.matchAll(/\\textbf\{([^,}]+),\}\s*\{([^}]*)\}\s*(?:--\s*([^\\\n]*?))?\s*\\hfill\s*([^\\\n]+)\\\\/g));
    const experience = experienceHeaders.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = experienceHeaders[index + 1]?.index ?? experienceBlock.length;
      const dates = visibleText(match[4]).split(/\s+--\s+/);
      return {
        id: createId("experience"),
        role: visibleText(match[1]),
        company: visibleText(match[2]),
        location: visibleText(match[3] ?? "") || undefined,
        startDate: dates[0] ?? "",
        endDate: dates.slice(1).join(" -- "),
        bullets: parseBullets(experienceBlock.slice(start, end)),
      };
    });

    const projectsBlock = section(source, "Projects");
    const projectHeaders = Array.from(projectsBlock.matchAll(/\\textbf\{([^}]+)\}\s*(?:\\hfill\s*([^\n]+))?\\\\/g));
    const projects = projectHeaders.map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = projectHeaders[index + 1]?.index ?? projectsBlock.length;
      return {
        id: createId("project"),
        name: visibleText(match[1]),
        technologies: [],
        links: parseLinks(match[2] ?? ""),
        bullets: parseBullets(projectsBlock.slice(start, end)),
      };
    });

    const educationBlock = section(source, "Education");
    const education = Array.from(educationBlock.matchAll(/\\textbf\{([^}]+)\}\s*--\s*([^\\\n]+?)(?:\s*\\hfill\s*([^\\\n]+))?\s*(?:\\\\|$)/g)).map((match) => ({
      id: createId("education"),
      institution: visibleText(match[1]),
      degree: visibleText(match[2]),
      endDate: visibleText(match[3] ?? "") || undefined,
      details: [],
    }));

    if (experience.length === 0) warnings.push({ code: "experience-empty", message: "No work experience could be extracted." });
    if (skillGroups.length === 0) warnings.push({ code: "skills-empty", message: "No skill groups could be extracted." });
    if (education.length === 0) warnings.push({ code: "education-empty", message: "No education entries could be extracted." });

    const resume = ResumeSchema.parse({
      version: 1,
      basics: { name, email, links },
      skills: skillGroups,
      experience,
      projects,
      education,
    });

    return { resume, confidence: warnings.length === 0 ? "high" : warnings.length < 3 ? "medium" : "low", warnings, importer: "known-template" };
  }
}

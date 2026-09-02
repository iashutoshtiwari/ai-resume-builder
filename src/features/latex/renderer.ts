import { escapeLatexText, escapeLatexUrl } from "@/features/latex/escape";
import { DEFAULT_PRESENTATION, type RenderedSection, type ResumePresentation } from "@/features/presentation/schema";
import type { Resume } from "@/features/resume/schema";

const FONT_PACKAGES: Record<ResumePresentation["fontFamily"], string> = {
  xcharter: "\\usepackage{XCharter}",
  "tex-gyre-heros": "\\usepackage{tgheros}\n\\renewcommand{\\familydefault}{\\sfdefault}",
  lato: "\\usepackage{lato}\n\\renewcommand{\\familydefault}{\\sfdefault}",
  "latin-modern": "\\usepackage{lmodern}",
};

const DENSITY = {
  compact: { itemSep: -3, topSep: 5, sectionGap: -8, headerGap: 3, lineStretch: "\\linespread{1.02}" },
  balanced: { itemSep: -2, topSep: 7, sectionGap: -6.5, headerGap: 5, lineStretch: "" },
  relaxed: { itemSep: 0, topSep: 8, sectionGap: -3, headerGap: 7, lineStretch: "\\linespread{1.12}" },
} as const;

function renderPreamble(presentation: ResumePresentation): string {
  const density = DENSITY[presentation.density];
  const documentSize = presentation.fontSize === 12 ? 12 : 11;
  const templateHeading = presentation.templateId === "minimal"
    ? String.raw`\titleformat{\section}{\bfseries\normalsize}{}{0pt}{\MakeUppercase}`
    : String.raw`\titleformat{\section}{\bfseries\large}{}{0pt}{}[\vspace{1pt}\titlerule\vspace{-6.5pt}]`;
  const compactAdjustment = presentation.templateId === "compact" ? -1 : 0;
  return String.raw`\documentclass[${documentSize}pt]{article}
\usepackage[${presentation.paperSize === "a4" ? "a4paper" : "letterpaper"},top=${presentation.margin}in,bottom=${presentation.margin}in,left=${presentation.margin}in,right=${presentation.margin}in]{geometry}
${FONT_PACKAGES[presentation.fontFamily]}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}
\raggedright
\pagestyle{empty}
\input{glyphtounicode}
\pdfgentounicode=1
${templateHeading}
\renewcommand\labelitemi{$\vcenter{\hbox{\small$\bullet$}}$}
\setlist[itemize]{itemsep=${density.itemSep + compactAdjustment}pt, leftmargin=12pt, topsep=${density.topSep + compactAdjustment}pt}${density.lineStretch ? `\n${density.lineStretch}` : ""}`;
}

function renderLink(label: string, url: string): string {
  return `\\href{${escapeLatexUrl(url)}}{${escapeLatexText(label)}}`;
}

function renderBullets(bullets: Array<{ text: string }>, presentation: ResumePresentation): string {
  if (bullets.length === 0) return "";
  const offset = presentation.templateId === "compact" ? -10 : presentation.density === "relaxed" ? -7 : -9;
  return [`\\vspace{${offset}pt}`, "\\begin{itemize}", ...bullets.map((bullet) => `  \\item ${escapeLatexText(bullet.text)}`), "\\end{itemize}"].join("\n");
}

function renderHeader(resume: Resume, presentation: ResumePresentation): string[] {
  const contact = [
    resume.basics.email ? renderLink(resume.basics.email, `mailto:${resume.basics.email}`) : null,
    resume.basics.phone ? escapeLatexText(resume.basics.phone) : null,
    resume.basics.location ? escapeLatexText(resume.basics.location) : null,
    ...resume.basics.links.map((link) => renderLink(link.label, link.url)),
  ].filter((value): value is string => Boolean(value));
  const gap = DENSITY[presentation.density].headerGap + (presentation.templateId === "compact" ? -1 : 0);

  if (presentation.templateId === "minimal") {
    return [
      `{\\Huge \\textbf{${escapeLatexText(resume.basics.name)}}} \\\\`,
      ...(resume.basics.headline ? [`${escapeLatexText(resume.basics.headline)} \\\\`] : []),
      ...(contact.length > 0 ? [`${contact.join(" | ")} \\\\`] : []),
      `\\vspace{${Math.max(0, gap - 2)}pt}`,
    ];
  }

  return [
    `\\centerline{\\Huge ${escapeLatexText(resume.basics.name)}}`,
    ...(resume.basics.headline ? [`\\centerline{${escapeLatexText(resume.basics.headline)}}`] : []),
    `\\vspace{${gap}pt}`,
    ...(contact.length > 0 ? [`\\centerline{${contact.join(" | ")}}`, "\\vspace{-10pt}"] : []),
  ];
}

export function renderResumeToLatex(resume: Resume, presentation: ResumePresentation = DEFAULT_PRESENTATION): string {
  const sections = new Map<RenderedSection, string>();

  const activeSkills = resume.skills.filter((group) => group.name.trim() || group.skills.length > 0);
  if (activeSkills.length > 0) {
    const skillLines = activeSkills.map((group) => {
      const skillsList = group.skills.map((skill) => escapeLatexText(skill.name)).filter(Boolean).join(", ");
      return `\\textbf{${escapeLatexText(group.name)}:} ${skillsList} \\\\`;
    }).filter((line) => line.trim().length > 0).join("\n");
    if (skillLines) sections.set("skills", `\\section*{Skills}\n${skillLines}`);
  }

  const activeExperience = resume.experience.filter((entry) => entry.role.trim() || entry.company.trim() || entry.bullets.length > 0);
  if (activeExperience.length > 0) {
    const experiences = activeExperience.map((entry) => {
      const location = entry.location ? ` -- ${escapeLatexText(entry.location)}` : "";
      const dates = [entry.startDate, entry.endDate].filter(Boolean).map(escapeLatexText).join(" -- ");
      return [`\\textbf{${escapeLatexText(entry.role)},} {${escapeLatexText(entry.company)}}${location} \\hfill ${dates} \\\\`, renderBullets(entry.bullets, presentation)].filter(Boolean).join("\n");
    }).filter((block) => block.trim().length > 0).join("\n\n");
    if (experiences) sections.set("experience", `\\section*{Experience}\n${experiences}`);
  }

  const activeProjects = resume.projects.filter((project) => project.name.trim() || project.bullets.length > 0 || project.technologies.length > 0);
  if (activeProjects.length > 0) {
    const projects = activeProjects.map((project) => {
      const links = project.links.map((link) => renderLink(link.label, link.url)).join(" | ");
      const tech = project.technologies.length > 0 ? ` — ${project.technologies.map((item) => escapeLatexText(item.name)).join(", ")}` : "";
      const description = project.description ? `: ${escapeLatexText(project.description)} \\\\` : "";
      return [`\\textbf{${escapeLatexText(project.name)}${tech}}${links ? ` \\hfill ${links}` : ""} \\\\`, description, renderBullets(project.bullets, presentation)].filter(Boolean).join("\n");
    }).filter((block) => block.trim().length > 0).join("\n\n");
    if (projects) sections.set("projects", `\\section*{Projects}\n${projects}`);
  }

  const activeEducation = resume.education.filter((entry) => entry.institution.trim() || entry.degree.trim() || entry.details.length > 0);
  if (activeEducation.length > 0) {
    const education = activeEducation.map((entry) => {
      const field = entry.field ? ` in ${escapeLatexText(entry.field)}` : "";
      const location = entry.location ? ` -- ${escapeLatexText(entry.location)}` : "";
      const dates = [entry.startDate, entry.endDate].filter(Boolean).map((date) => escapeLatexText(date ?? "")).join(" -- ");
      const details = entry.details.map((detail) => escapeLatexText(detail.text));
      return [`\\textbf{${escapeLatexText(entry.institution)}} -- ${escapeLatexText(entry.degree)}${field}${location}${dates ? ` \\hfill ${dates}` : ""}`, ...details].join(" \\\\\n");
    }).filter((block) => block.trim().length > 0).join(" \\\\\n");
    if (education) sections.set("education", `\\section*{Education}\n${education}`);
  }

  const sectionGap = DENSITY[presentation.density].sectionGap + (presentation.templateId === "compact" ? -1 : 0);
  const sectionContent = presentation.sections.map((section) => sections.get(section)).filter((section): section is string => Boolean(section)).join(`\n\n\\vspace{${sectionGap}pt}\n\n`);
  const exactSize = presentation.fontSize === 10.5 ? "\\fontsize{10.5pt}{11.25pt}\\selectfont" : "";

  return [
    renderPreamble(presentation),
    "",
    "\\begin{document}",
    ...(exactSize ? [exactSize] : []),
    "",
    ...renderHeader(resume, presentation),
    "",
    sectionContent,
    "",
    "\\end{document}",
    "",
  ].join("\n");
}

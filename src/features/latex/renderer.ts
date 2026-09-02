import type { Resume } from "@/features/resume/schema";
import { escapeLatexText, escapeLatexUrl } from "@/features/latex/escape";

const PREAMBLE = String.raw`\documentclass[11pt]{article}
\usepackage[letterpaper,top=0.5in,bottom=0.5in,left=0.5in,right=0.5in]{geometry}
\usepackage{XCharter}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{titlesec}
\raggedright
\pagestyle{empty}
\input{glyphtounicode}
\pdfgentounicode=1
\titleformat{\section}{\bfseries\large}{}{0pt}{}[\vspace{1pt}\titlerule\vspace{-6.5pt}]
\renewcommand\labelitemi{$\vcenter{\hbox{\small$\bullet$}}$}
\setlist[itemize]{itemsep=-2pt, leftmargin=12pt, topsep=7pt}`;

function renderLink(label: string, url: string): string {
  return `\\href{${escapeLatexUrl(url)}}{${escapeLatexText(label)}}`;
}

function renderBullets(bullets: Array<{ text: string }>): string {
  if (bullets.length === 0) return "";
  return ["\\vspace{-9pt}", "\\begin{itemize}", ...bullets.map((bullet) => `  \\item ${escapeLatexText(bullet.text)}`), "\\end{itemize}"].join("\n");
}

export function renderResumeToLatex(resume: Resume): string {
  const contact = [
    resume.basics.email ? renderLink(resume.basics.email, `mailto:${resume.basics.email}`) : null,
    resume.basics.phone ? escapeLatexText(resume.basics.phone) : null,
    resume.basics.location ? escapeLatexText(resume.basics.location) : null,
    ...resume.basics.links.map((link) => renderLink(link.label, link.url)),
  ].filter((value): value is string => Boolean(value));

  const skillLines = resume.skills
    .map((group) => `\\textbf{${escapeLatexText(group.name)}:} ${group.skills.map((skill) => escapeLatexText(skill.name)).join(", ")} \\\\`)
    .join("\n");

  const experiences = resume.experience
    .map((experience) => {
      const location = experience.location ? ` -- ${escapeLatexText(experience.location)}` : "";
      const dates = [experience.startDate, experience.endDate].filter(Boolean).map(escapeLatexText).join(" -- ");
      return [`\\textbf{${escapeLatexText(experience.role)},} {${escapeLatexText(experience.company)}}${location} \\hfill ${dates} \\\\`, renderBullets(experience.bullets)].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const projects = resume.projects
    .map((project) => {
      const links = project.links.map((link) => renderLink(link.label, link.url)).join(" | ");
      const tech = project.technologies.length > 0 ? ` — ${project.technologies.map((item) => escapeLatexText(item.name)).join(", ")}` : "";
      const description = project.description ? `: ${escapeLatexText(project.description)} \\\\` : "";
      return [`\\textbf{${escapeLatexText(project.name)}${tech}}${links ? ` \\hfill ${links}` : ""} \\\\`, description, renderBullets(project.bullets)].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const education = resume.education
    .map((item) => {
      const field = item.field ? ` in ${escapeLatexText(item.field)}` : "";
      const location = item.location ? ` -- ${escapeLatexText(item.location)}` : "";
      const dates = [item.startDate, item.endDate].filter(Boolean).map((date) => escapeLatexText(date ?? "")).join(" -- ");
      const details = item.details.map((detail) => escapeLatexText(detail.text));
      return [`\\textbf{${escapeLatexText(item.institution)}} -- ${escapeLatexText(item.degree)}${field}${location}${dates ? ` \\hfill ${dates}` : ""}`, ...details].join(" \\\\" + String.fromCharCode(10));
    })
    .join(" \\\\" + String.fromCharCode(10));

  return [
    PREAMBLE,
    "",
    "\\begin{document}",
    "",
    `\\centerline{\\Huge ${escapeLatexText(resume.basics.name)}}`,
    resume.basics.headline ? `\\centerline{${escapeLatexText(resume.basics.headline)}}` : "",
    "\\vspace{5pt}",
    contact.length ? `\\centerline{${contact.join(" | ")}}` : "",
    "\\vspace{-10pt}",
    "",
    "\\section*{Skills}",
    skillLines || "% No skills listed",
    "",
    "\\vspace{-6.5pt}",
    "\\section*{Experience}",
    experiences || "% No experience listed",
    "",
    "\\vspace{-18.5pt}",
    "\\section*{Projects}",
    projects || "% No projects listed",
    "",
    "\\vspace{-18.5pt}",
    "\\section*{Education}",
    education || "% No education listed",
    "",
    "\\end{document}",
    "",
  ].join("\n");
}

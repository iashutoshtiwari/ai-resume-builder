import { escapeLatexText, safeLatexUrl } from "@/features/latex/escape";
import { renderCanonicalShell } from "@/features/latex/templates/canonical";
import { DEFAULT_PRESENTATION, type RenderedSection, type ResumePresentation } from "@/features/presentation/schema";
import type { Resume } from "@/features/resume/schema";

/**
 * IMPORTANT: ArqeloCV owns this canonical renderer. AI output is structured
 * resume content only. Do not add presentation choices or accept raw LaTeX here.
 */

function renderLink(label: string, url: string): string {
  const safeUrl = safeLatexUrl(url);
  const safeLabel = escapeLatexText(label);
  return safeUrl ? `\\href{${safeUrl}}{${safeLabel}}` : safeLabel;
}

function renderBullets(bullets: Array<{ text: string }>): string {
  const items = bullets.map((bullet) => bullet.text.trim()).filter(Boolean);
  if (items.length === 0) return "";
  return ["\\vspace{-9pt}", "\\begin{itemize}", ...items.map((text) => `  \\item ${escapeLatexText(text)}`), "\\end{itemize}"].join("\n");
}

function renderHeader(resume: Resume): string {
  const contact = [
    resume.basics.email ? renderLink(resume.basics.email, `mailto:${resume.basics.email.trim()}`) : null,
    resume.basics.phone?.trim() ? escapeLatexText(resume.basics.phone.trim()) : null,
    resume.basics.location?.trim() ? escapeLatexText(resume.basics.location.trim()) : null,
    ...resume.basics.links.map((link) => renderLink(link.label, link.url)),
  ].filter((value): value is string => Boolean(value));

  return [
    "% name",
    `\\centerline{\\Huge ${escapeLatexText(resume.basics.name)}}`,
    ...(resume.basics.headline?.trim() ? [`\\centerline{${escapeLatexText(resume.basics.headline.trim())}}`] : []),
    "",
    "\\vspace{5pt}",
    "",
    ...(contact.length > 0
      ? ["% contact information", `\\centerline{${contact.join(" \\;|\\; ")}}`, "", "\\vspace{-10pt}"]
      : []),
  ].join("\n");
}

function renderSummary(resume: Resume): string | null {
  const summary = resume.summary?.trim();
  return summary ? `\\section*{Summary}\n${escapeLatexText(summary)}\n\n\\vspace{-6.5pt}` : null;
}

function renderSkills(resume: Resume): string | null {
  const lines = resume.skills.flatMap((group) => {
    const name = group.name.trim();
    const skills = group.skills.map((skill) => skill.name.trim()).filter(Boolean);
    if (!name || skills.length === 0) return [];
    return `\\textbf{${escapeLatexText(name)}:} ${skills.map(escapeLatexText).join(", ")} \\\\`;
  });
  return lines.length > 0 ? `\\section*{Skills}\n${lines.join("\n")}\n\n\\vspace{-6.5pt}` : null;
}

function renderExperience(resume: Resume): string | null {
  const entries = resume.experience.flatMap((entry) => {
    if (!entry.role.trim() && !entry.company.trim() && entry.bullets.length === 0) return [];
    const location = entry.location?.trim() ? ` -- ${escapeLatexText(entry.location.trim())}` : "";
    const dates = [entry.startDate, entry.endDate].map((value) => value.trim()).filter(Boolean).map(escapeLatexText).join(" -- ");
    const header = `\\textbf{${escapeLatexText(entry.role.trim())},} {${escapeLatexText(entry.company.trim())}}${location}${dates ? ` \\hfill ${dates}` : ""} \\\\`;
    return [[header, renderBullets(entry.bullets)].filter(Boolean).join("\n")];
  });
  return entries.length > 0 ? `\\section*{Experience}\n${entries.join("\n\n")}\n\n\\vspace{-18.5pt}` : null;
}

function renderProjects(resume: Resume): string | null {
  const entries = resume.projects.flatMap((project) => {
    if (!project.name.trim() && !project.description?.trim() && project.bullets.length === 0) return [];
    const technologies = project.technologies.map((item) => item.name.trim()).filter(Boolean);
    const title = technologies.length > 0
      ? `${escapeLatexText(project.name.trim())} — ${technologies.map(escapeLatexText).join(", ")}`
      : escapeLatexText(project.name.trim());
    const links = project.links.map((link) => renderLink(link.label, link.url)).join(" \\;|\\; ");
    const header = `\\textbf{${title}}${links ? ` \\hfill ${links}` : ""} \\\\`;
    const description = project.description?.trim() ? `${escapeLatexText(project.description.trim())} \\\\` : "";
    return [[header, description, renderBullets(project.bullets)].filter(Boolean).join("\n")];
  });
  return entries.length > 0 ? `\\section*{Projects}\n${entries.join("\n\n")}\n\n\\vspace{-18.5pt}` : null;
}

function renderCertifications(resume: Resume): string | null {
  const entries = (resume.certifications ?? []).flatMap((certification) => {
    if (!certification.name.trim()) return [];
    const name = certification.url?.trim()
      ? renderLink(certification.name.trim(), certification.url)
      : escapeLatexText(certification.name.trim());
    const issuer = certification.issuer?.trim() ? ` -- ${escapeLatexText(certification.issuer.trim())}` : "";
    const date = certification.date?.trim() ? ` \\hfill ${escapeLatexText(certification.date.trim())}` : "";
    return `\\textbf{${name}}${issuer}${date} \\\\`;
  });
  return entries.length > 0 ? `\\section*{Certifications}\n${entries.join("\n")}\n\n\\vspace{-6.5pt}` : null;
}

function renderAchievements(resume: Resume): string | null {
  const entries = (resume.achievements ?? []).flatMap((achievement) => {
    if (!achievement.title.trim()) return [];
    const description = achievement.description?.trim() ? `: ${escapeLatexText(achievement.description.trim())}` : "";
    const date = achievement.date?.trim() ? ` \\hfill ${escapeLatexText(achievement.date.trim())}` : "";
    return `  \\item ${escapeLatexText(achievement.title.trim())}${description}${date}`;
  });
  return entries.length > 0
    ? `\\section*{Achievements}\n\\begin{itemize}\n${entries.join("\n")}\n\\end{itemize}\n\n\\vspace{-18.5pt}`
    : null;
}

function renderEducation(resume: Resume): string | null {
  const entries = resume.education.flatMap((education) => {
    if (!education.institution.trim() && !education.degree.trim() && education.details.length === 0) return [];
    const field = education.field?.trim() ? ` in ${escapeLatexText(education.field.trim())}` : "";
    const location = education.location?.trim() ? ` -- ${escapeLatexText(education.location.trim())}` : "";
    const dates = [education.startDate, education.endDate]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .map(escapeLatexText)
      .join(" -- ");
    const header = `\\textbf{${escapeLatexText(education.institution.trim())}} -- ${escapeLatexText(education.degree.trim())}${field}${location}${dates ? ` \\hfill ${dates}` : ""}`;
    const details = education.details.map((detail) => detail.text.trim()).filter(Boolean).map(escapeLatexText);
    return `${header}${details.length > 0 ? ` \\\\\n${details.join(" \\\\\n")}` : ""}`;
  });
  return entries.length > 0 ? `\\section*{Education}\n${entries.join(" \\\\\n")}` : null;
}

const SECTION_RENDERERS: Record<RenderedSection, (resume: Resume) => string | null> = {
  summary: renderSummary,
  skills: renderSkills,
  experience: renderExperience,
  projects: renderProjects,
  certifications: renderCertifications,
  achievements: renderAchievements,
  education: renderEducation,
};

export function renderResumeToLatex(
  resume: Resume,
  options: ResumePresentation = DEFAULT_PRESENTATION,
): string {
  const sections = options.sections
    .map((section) => SECTION_RENDERERS[section](resume))
    .filter((section): section is string => Boolean(section));
  return renderCanonicalShell([renderHeader(resume), ...sections].join("\n\n"), options);
}

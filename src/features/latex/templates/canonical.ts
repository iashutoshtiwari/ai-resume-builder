import canonicalTemplateSource from "@/features/latex/templates/canonical.tex?raw";
import type { ResumePresentation } from "@/features/presentation/schema";

/**
 * IMPORTANT:
 * canonical.tex is the single canonical ArqeloCV resume template.
 *
 * Do not alter its visual formatting, typography, margins, spacing, section
 * design, entry layouts, bullet styling, or LaTeX dependencies without an
 * explicit product requirement. Normal customization happens through resume
 * content and the allowlisted options below. Raw LaTeX edits are the user's
 * intentional escape hatch.
 */
export const CANONICAL_TEMPLATE_VERSION = 1;

export const canonicalTemplateConfig = {
  version: CANONICAL_TEMPLATE_VERSION,
  supportedPaperSizes: ["letter", "a4"] as const,
  fixedDocumentClass: "article",
  fixedFontSize: 11,
  fixedFontFamily: "XCharter",
  fixedMarginInches: 0.5,
} as const;

export const CANONICAL_TEMPLATE_SOURCE = canonicalTemplateSource;

const DOCUMENT_START = "\\begin{document}";
const DOCUMENT_END = "\\end{document}";
const startIndex = CANONICAL_TEMPLATE_SOURCE.indexOf(DOCUMENT_START);
const endIndex = CANONICAL_TEMPLATE_SOURCE.lastIndexOf(DOCUMENT_END);

if (startIndex < 0 || endIndex <= startIndex) {
  throw new Error("The canonical ArqeloCV template is missing its document boundary.");
}

/**
 * Generated source intentionally omits developer-only example content and
 * guidance comments after \begin{document}; the authoritative .tex file keeps
 * them intact. This does not alter compiled formatting.
 */
export const CANONICAL_TEMPLATE_SHELL = `${CANONICAL_TEMPLATE_SOURCE.slice(
  0,
  startIndex + DOCUMENT_START.length,
)}\n\n%%ARQELO_CANONICAL_CONTENT%%\n\n${DOCUMENT_END}\n`;

export function renderCanonicalShell(content: string, options: ResumePresentation): string {
  const paper = options.paperSize === "a4" ? "a4paper" : "letterpaper";
  return CANONICAL_TEMPLATE_SHELL
    .replace("  letterpaper,", `  ${paper},`)
    .replace("%%ARQELO_CANONICAL_CONTENT%%", content.trim());
}

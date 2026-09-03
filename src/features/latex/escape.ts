const LATEX_TEXT_REPLACEMENTS: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escapeLatexText(value: string): string {
  return value.replace(/[\\&%$#_{}~^]/g, (character) => LATEX_TEXT_REPLACEMENTS[character]);
}

export function escapeLatexUrl(value: string): string {
  return value
    .replace(/[{}\\\r\n]/g, "")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}

/** Returns a LaTeX-safe URL only for protocols supported by the resume UI. */
export function safeLatexUrl(value: string): string | null {
  const candidate = value.trim();
  if (!candidate || /[{}\\\r\n]/.test(candidate)) return null;

  try {
    const parsed = new URL(candidate);
    if (!new Set(["http:", "https:", "mailto:"]).has(parsed.protocol)) return null;
    return escapeLatexUrl(candidate);
  } catch {
    return null;
  }
}

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
  "\u2026": "\\dots{}",
  "\u2022": "\\textbullet{}",
  "\u2219": "\\textbullet{}",
  "\u00B7": "\\textperiodcentered{}",
  "\u00A9": "\\textcopyright{}",
  "\u00AE": "\\textregistered{}",
  "\u2122": "\\texttrademark{}",
  "\u00B0": "\\textdegree{}",
};

/**
 * Normalizes Unicode spaces, zero-width characters, typographic quotes,
 * and dashes that break pdflatex or cause typesetting errors.
 */
export function normalizeUnicodeForLatex(value: string): string {
  return value
    // Strip zero-width, invisible formatting, and BOM characters
    .replace(/[\u200B-\u200D\u200E\u200F\u2060\uFEFF]/g, "")
    // Normalize exotic and non-breaking Unicode spaces to standard ASCII spaces
    // (includes U+202F narrow no-break space, U+00A0 nbsp, en/em spaces, etc.)
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    // Normalize dashes and hyphens
    .replace(/[\u2010\u2011\u2012\u2212]/g, "-")
    .replace(/\u2013/g, "--")
    .replace(/[\u2014\u2015]/g, "---")
    // Normalize typographic quotes
    .replace(/\u2018/g, "`")
    .replace(/[\u2019\u201B\u2032]/g, "'")
    .replace(/\u201C/g, "``")
    .replace(/[\u201D\u2033]/g, "''")
    .replace(/\u201A/g, ",")
    .replace(/\u201E/g, ",,")
    .replace(/\u00AB/g, "<<")
    .replace(/\u00BB/g, ">>")
    // Common currency/symbols that are not native in pdflatex T1 without extra packages
    .replace(/\u20B9/g, "Rs. ");
}

export function escapeLatexText(value: string): string {
  const normalized = normalizeUnicodeForLatex(value);
  return normalized.replace(
    /[\\&%$#_{}~^\u2026\u2022\u2219\u00B7\u00A9\u00AE\u2122\u00B0]/g,
    (character) => LATEX_TEXT_REPLACEMENTS[character] ?? character
  );
}

/** Sanitizes raw LaTeX source for pdflatex by removing invisible characters and converting Unicode spaces */
export function sanitizeLatexSource(source: string): string {
  return source
    .replace(/[\u200B-\u200D\u200E\u200F\u2060\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");
}

export function escapeLatexUrl(value: string): string {
  return value
    .replace(/[\u200B-\u200D\u200E\u200F\u2060\uFEFF]/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, "")
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

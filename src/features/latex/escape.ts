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
  return value.replace(/[{}\\\r\n]/g, "").replace(/%/g, "\\%").replace(/#/g, "\\#");
}

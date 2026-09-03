import "server-only";

// Patterns commonly found at the bottom of job postings that add 500-1500 tokens of non-informative text
const BOILERPLATE_PATTERNS: RegExp[] = [
  /equal\s+opportunity\s+employer[\s\S]*?(?=(\n{3,}|$))/i,
  /we\s+(do\s+not|prohibit)\s+discriminate\s+on\s+the\s+basis\s+of[\s\S]*?(?=(\n{3,}|$))/i,
  /all\s+qualified\s+applicants\s+will\s+receive\s+consideration\s+for\s+employment[\s\S]*?(?=(\n{3,}|$))/i,
  /reasonable\s+accommodations?\s+(is|are|can\s+be)\s+provided[\s\S]*?(?=(\n{3,}|$))/i,
  /agency\s+or\s+third-party\s+recruiter\s+submissions\s+will\s+not\s+be\s+accepted[\s\S]*?(?=(\n{3,}|$))/i,
  /notice\s+to\s+recruiters[\s\S]*?(?=(\n{3,}|$))/i,
  /privacy\s+notice\s+for\s+job\s+applicants[\s\S]*?(?=(\n{3,}|$))/i,
];

export function cleanJobPostingText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, "\n");
  }

  // Normalize excessive blank lines and trailing whitespace
  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

export function normalizePromptText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Recursively prune null, undefined, empty strings, and empty arrays/objects
 * from an object to minimize token usage when serializing JSON for LLM prompts.
 */
export function pruneNullsAndEmpty<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    const prunedArray = value
      .map((item) => pruneNullsAndEmpty(item))
      .filter((item) => item !== undefined && item !== null && item !== "");
    return prunedArray as unknown as T;
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === null || val === undefined || val === "") continue;
      if (Array.isArray(val)) {
        const prunedArray = val
          .map((item) => pruneNullsAndEmpty(item))
          .filter((item) => item !== undefined && item !== null && item !== "");
        if (prunedArray.length > 0) {
          result[key] = prunedArray;
        }
      } else if (typeof val === "object") {
        const prunedObj = pruneNullsAndEmpty(val);
        if (prunedObj && Object.keys(prunedObj).length > 0) {
          result[key] = prunedObj;
        }
      } else {
        result[key] = val;
      }
    }
    return result as unknown as T;
  }
  return value;
}

/**
 * Serialize a value to minified JSON with null, empty, and redundant fields stripped.
 */
export function toCompactJson(value: unknown): string {
  return JSON.stringify(pruneNullsAndEmpty(value));
}


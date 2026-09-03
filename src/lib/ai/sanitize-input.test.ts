import { describe, expect, it } from "vitest";
import { cleanJobPostingText, normalizePromptText, pruneNullsAndEmpty, toCompactJson } from "@/lib/ai/sanitize-input";

describe("Input Sanitizer", () => {
  it("removes EEO legal boilerplate from job postings", () => {
    const rawJob = `
Senior Software Engineer at Acme Corp
Requirements:
- 5+ years React & TypeScript
- Docker & Kubernetes

We are an Equal Opportunity Employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity.
`;

    const cleaned = cleanJobPostingText(rawJob);
    expect(cleaned).toContain("Senior Software Engineer at Acme Corp");
    expect(cleaned).toContain("5+ years React & TypeScript");
    expect(cleaned).not.toContain("Equal Opportunity Employer");
    expect(cleaned).not.toContain("sexual orientation");
  });

  it("normalizes excessive blank lines and whitespace", () => {
    const rawText = "Line 1\n\n\n\n\nLine 2     with   spaces\r\n\r\nLine 3";
    const cleaned = normalizePromptText(rawText);
    expect(cleaned).toBe("Line 1\n\nLine 2 with spaces\n\nLine 3");
  });

  it("prunes nulls, undefined, empty strings, and empty collections for token reduction", () => {
    const input = {
      name: "Alex",
      headline: "",
      location: undefined,
      email: null,
      skills: ["React", "", null, "TypeScript"],
      emptyArray: [],
      experience: [
        {
          company: "Acme",
          bullets: ["Shipped v1", ""],
          notes: null,
        },
      ],
      nestedEmpty: {
        a: "",
        b: null,
      },
      validZero: 0,
      validFalse: false,
    };

    const pruned = pruneNullsAndEmpty(input) as Record<string, unknown>;
    expect(pruned).toEqual({
      name: "Alex",
      skills: ["React", "TypeScript"],
      experience: [
        {
          company: "Acme",
          bullets: ["Shipped v1"],
        },
      ],
      validZero: 0,
      validFalse: false,
    });
    expect(pruned).not.toHaveProperty("headline");
    expect(pruned).not.toHaveProperty("location");
    expect(pruned).not.toHaveProperty("email");
    expect(pruned).not.toHaveProperty("emptyArray");
    expect(pruned).not.toHaveProperty("nestedEmpty");

    const compactJson = toCompactJson(input);
    expect(compactJson).not.toContain("headline");
    expect(compactJson).not.toContain("emptyArray");
    expect(compactJson).toContain('"validZero":0');
    expect(compactJson).toContain('"validFalse":false');
  });
});


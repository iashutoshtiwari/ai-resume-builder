import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildStructuredPrompt,
  buildTargetedRepairPrompt,
  DEFAULT_AI_SYSTEM_PROMPT,
} from "@/lib/ai/prompt-builder";
import { buildResumePrompt, fullTailorPrompt } from "@/lib/ai/prompts";

describe("Structured Prompt Builder", () => {
  it("builds a well-formed prompt tuple with default system prompt", () => {
    const [system, user] = buildStructuredPrompt({
      objective: "Extract resume data.",
      rules: ["Rule 1: Be truthful.", "Rule 2: Stable IDs."],
      guidanceJson: '{"version":"1"}',
      payloads: [
        {
          name: "untrusted_resume",
          format: "json",
          content: '{"name":"Alex"}',
        },
      ],
    });

    expect(system).toBe(DEFAULT_AI_SYSTEM_PROMPT);
    expect(system).toMatch(/Never emit LaTeX/i);
    expect(user).toContain("<task_objective>\nExtract resume data.\n</task_objective>");
    expect(user).toContain("<rules>\n- Rule 1: Be truthful.\n- Rule 2: Stable IDs.\n</rules>");
    expect(user).toContain('<reference_guidance format="json">\n{"version":"1"}\n</reference_guidance>');
    expect(user).toContain('<untrusted_resume format="json">\n{"name":"Alex"}\n</untrusted_resume>');
  });

  it("builds a targeted delta repair prompt without ballooning invalid output tokens", () => {
    const original: [string, string] = ["System instructions", "Original user prompt"];
    const issues = 'Field "experience[0].id" is required.';
    const largeOutput = "X".repeat(5000); // 5000 characters of invalid output

    const [system, user] = buildTargetedRepairPrompt(original, issues, largeOutput);

    expect(system).toBe("System instructions");
    expect(user).toContain("Original user prompt");
    expect(user).toContain("<validation_issues>\nField \"experience[0].id\" is required.\n</validation_issues>");
    // Should be truncated to at most 400 chars, not full 5000!
    expect(user).toContain("<failing_snippet>");
    expect(user.length).toBeLessThan(1200);
  });

  it("keeps resume generation and tailoring on the structured-content side of the boundary", () => {
    const build = buildResumePrompt("{}", "[]", "{}").join("\n");
    const tailor = fullTailorPrompt("{}", "{}", "{}", "revision-1", "{}").join("\n");
    expect(build).toMatch(/structured Resume JSON only/i);
    expect(build).toMatch(/Do not emit LaTeX/i);
    expect(tailor).toMatch(/structured resume content only/i);
    expect(tailor).toMatch(/never recommend formatting compression/i);
  });
});

import { describe, expect, it } from "vitest";
import { escapeLatexText } from "@/features/latex/escape";

describe("escapeLatexText", () => {
  it.each([
    ["A & B", "A \\& B"],
    ["100%", "100\\%"],
    ["$5", "\\$5"],
    ["C#", "C\\#"],
    ["snake_case", "snake\\_case"],
    ["{value}", "\\{value\\}"],
  ])("escapes %s", (source, expected) => expect(escapeLatexText(source)).toBe(expected));
});

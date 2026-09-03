import { describe, expect, it } from "vitest";
import { escapeLatexText, safeLatexUrl } from "@/features/latex/escape";

describe("escapeLatexText", () => {
  it.each([
    ["A & B", "A \\& B"],
    ["100%", "100\\%"],
    ["$5", "\\$5"],
    ["C#", "C\\#"],
    ["snake_case", "snake\\_case"],
    ["{value}", "\\{value\\}"],
    [String.raw`\command ~ ^`, String.raw`\textbackslash{}command \textasciitilde{} \textasciicircum{}`],
  ])("escapes %s", (source, expected) => expect(escapeLatexText(source)).toBe(expected));

  it("allows only HTTP(S) and mailto URLs", () => {
    expect(safeLatexUrl("https://example.com/a#b")).toBe("https://example.com/a\\#b");
    expect(safeLatexUrl("mailto:name@example.com")).toBe("mailto:name@example.com");
    expect(safeLatexUrl("javascript:alert(1)")).toBeNull();
    expect(safeLatexUrl(String.raw`https://example.com/\input{evil}`)).toBeNull();
  });
});

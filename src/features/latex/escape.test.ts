import { describe, expect, it } from "vitest";
import { escapeLatexText, safeLatexUrl, sanitizeLatexSource } from "@/features/latex/escape";

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

  it("normalizes U+202F narrow no-break space and exotic spaces", () => {
    // Specifically test the exact error condition: 2\u202FM+ weekly users
    expect(escapeLatexText("checkout for 2\u202FM+ weekly users")).toBe("checkout for 2 M+ weekly users");
    expect(escapeLatexText("100\u00A0k users\u2003test")).toBe("100 k users test");
  });

  it("strips zero-width and invisible formatting characters", () => {
    expect(escapeLatexText("Zero\u200BWidth\uFEFFSpace\u200CJoiner")).toBe("ZeroWidthSpaceJoiner");
  });

  it("converts typographic quotes, dashes, bullets, and ellipses", () => {
    expect(escapeLatexText("“Smart quotes” and ‘single’")).toBe("``Smart quotes'' and `single'");
    expect(escapeLatexText("Range 2020–2024 — ongoing")).toBe("Range 2020--2024 --- ongoing");
    expect(escapeLatexText("Loading… • Bullet")).toBe("Loading\\dots{} \\textbullet{} Bullet");
    expect(escapeLatexText("Cost: ₹50,000")).toBe("Cost: Rs. 50,000");
  });

  it("allows only HTTP(S) and mailto URLs", () => {
    expect(safeLatexUrl("https://example.com/a#b")).toBe("https://example.com/a\\#b");
    expect(safeLatexUrl("mailto:name@example.com")).toBe("mailto:name@example.com");
    expect(safeLatexUrl("javascript:alert(1)")).toBeNull();
    expect(safeLatexUrl(String.raw`https://example.com/\input{evil}`)).toBeNull();
  });
});

describe("sanitizeLatexSource", () => {
  it("normalizes U+202F and strips zero-width chars from raw LaTeX documents", () => {
    const raw = "\\begin{itemize}\n  \\item checkout for 2\u202FM+ weekly users\u200B\n\\end{itemize}";
    const sanitized = sanitizeLatexSource(raw);
    expect(sanitized).toBe("\\begin{itemize}\n  \\item checkout for 2 M+ weekly users\n\\end{itemize}");
  });
});

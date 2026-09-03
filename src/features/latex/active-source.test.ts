import { describe, expect, it } from "vitest";
import { getActiveLatexSource } from "@/features/latex/active-source";

describe("getActiveLatexSource", () => {
  it("selects the same generated source for editing, compiling, and downloading", () => {
    expect(getActiveLatexSource({ latexMode: "generated", generatedLatex: "generated", manualLatex: "manual" })).toBe("generated");
  });

  it("selects the user's exact manual override while manual mode is active", () => {
    expect(getActiveLatexSource({ latexMode: "manual", generatedLatex: "generated", manualLatex: "manual" })).toBe("manual");
  });
});

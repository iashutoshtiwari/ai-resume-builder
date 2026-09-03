import { beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteLatexCompiler } from "@/features/latex/compiler";

describe("RemoteLatexCompiler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts source and files to /api/compile and parses returned PDF", async () => {
    const mockPdfBase64 = "JVBERi0xLjQK";
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pdf: mockPdfBase64,
        logs: "Compiled successfully",
      }),
    } as unknown as Response);

    const compiler = new RemoteLatexCompiler();
    const result = await compiler.compile({
      source: "\\documentclass{article}\\begin{document}Test\\end{document}",
      files: [{ name: "test.sty", content: "\\ProvidesPackage{test}" }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pdf).toBeInstanceOf(Blob);
      expect(result.logs).toBe("Compiled successfully");
    }

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/compile",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          source: "\\documentclass{article}\\begin{document}Test\\end{document}",
          engine: "pdflatex",
          files: [{ name: "test.sty", content: "\\ProvidesPackage{test}" }],
        }),
      })
    );
  });

  it("handles remote compilation syntax errors", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        errors: [{ code: "latex", message: "Undefined control sequence", line: 10 }],
        logs: "Error on line 10",
      }),
    } as unknown as Response);

    const compiler = new RemoteLatexCompiler();
    const result = await compiler.compile({
      source: "bad latex",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.message).toBe("Undefined control sequence");
      expect(result.errors[0]?.line).toBe(10);
    }
  });

  it("handles network failure gracefully", async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("Network connection error"));

    const compiler = new RemoteLatexCompiler();
    const result = await compiler.compile({
      source: "\\documentclass{article}\\begin{document}Test\\end{document}",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.code).toBe("runtime");
      expect(result.errors[0]?.message).toContain("Network connection error");
    }
  });

  it("sanitizes U+202F and zero-width characters in source before posting to /api/compile", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pdf: "JVBERi0xLjQK",
        logs: "Compiled successfully",
      }),
    } as unknown as Response);

    const compiler = new RemoteLatexCompiler();
    await compiler.compile({
      source: "\\begin{document}checkout for 2\u202FM+ weekly users\u200B\\end{document}",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/compile",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          source: "\\begin{document}checkout for 2 M+ weekly users\\end{document}",
          engine: "pdflatex",
          files: [],
        }),
      })
    );
  });

  it("normalizes LaTeX Unicode character error messages", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        errors: [{ message: "LaTeX Error: Unicode character   (U+202F) not set up for use with LaTeX." }],
        logs: "./main.tex:160: LaTeX Error: Unicode character   (U+202F) not set up for use with LaTeX.\nl.160 checkout for 2 M+",
      }),
    } as unknown as Response);

    const compiler = new RemoteLatexCompiler();
    const result = await compiler.compile({ source: "test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.code).toBe("latex");
      expect(result.errors[0]?.message).toContain("Unsupported Unicode character (U+202F)");
      expect(result.errors[0]?.line).toBe(160);
    }
  });
});

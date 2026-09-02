import { beforeEach, describe, expect, it, vi } from "vitest";
import { HybridLatexCompiler, RemoteLatexCompiler } from "@/features/latex/compiler";

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
      expect(result.engine).toBe("cloud");
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
      expect(result.engine).toBe("cloud");
      expect(result.errors[0]?.message).toBe("Undefined control sequence");
      expect(result.errors[0]?.line).toBe(10);
    }
  });
});

describe("HybridLatexCompiler", () => {
  it("defaults to wasm mode and switches modes", () => {
    const hybrid = new HybridLatexCompiler();
    expect(hybrid.getMode()).toBe("wasm");

    hybrid.setMode("cloud");
    expect(hybrid.getMode()).toBe("cloud");

    hybrid.setMode("auto");
    expect(hybrid.getMode()).toBe("auto");
  });

  it("routes compile calls directly to cloud in cloud mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        pdf: "JVBERi0xLjQK",
        logs: "Cloud compile ok",
      }),
    } as unknown as Response);

    const hybrid = new HybridLatexCompiler("cloud");
    const result = await hybrid.compile({
      source: "\\documentclass{article}\\begin{document}Hello\\end{document}",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.engine).toBe("cloud");
    }
  });
});

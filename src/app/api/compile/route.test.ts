import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/compile/route";

describe("/api/compile route handler", () => {
  const originalEnv = process.env.LATEX_COMPILER_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.LATEX_COMPILER_URL = originalEnv;
  });

  describe("GET /api/compile", () => {
    it("reports not configured when LATEX_COMPILER_URL is unset", async () => {
      delete process.env.LATEX_COMPILER_URL;
      const response = await GET();
      const data = await response.json();
      expect(data).toEqual({
        available: false,
        configured: false,
        message: "PDF compilation is not configured for this environment.",
      });
    });

    it("checks remote health when LATEX_COMPILER_URL is set", async () => {
      process.env.LATEX_COMPILER_URL = "https://mock-compiler.run.app";
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok", engines: ["pdflatex", "xelatex"] }),
      } as Response);

      const response = await GET();
      const data = await response.json();
      expect(data).toEqual({
        available: true,
        configured: true,
        engines: ["pdflatex", "xelatex"],
      });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://mock-compiler.run.app/health",
        expect.objectContaining({ headers: { Accept: "application/json" } })
      );
    });
  });

  describe("POST /api/compile", () => {
    it("returns 503 when LATEX_COMPILER_URL is unset", async () => {
      delete process.env.LATEX_COMPILER_URL;
      const request = new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "\\documentclass{article}\\begin{document}Hi\\end{document}" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.errors[0]?.message).toContain("PDF compilation is not configured");
    });

    it("returns 400 when request body is not valid JSON", async () => {
      process.env.LATEX_COMPILER_URL = "https://mock-compiler.run.app";
      const request = new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.errors[0]?.message).toContain("Invalid JSON");
    });

    it("returns 400 when source is missing", async () => {
      process.env.LATEX_COMPILER_URL = "https://mock-compiler.run.app";
      const request = new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: "pdflatex" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("proxies compilation to Cloud Run and returns successful PDF", async () => {
      process.env.LATEX_COMPILER_URL = "https://mock-compiler.run.app";
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          pdf: "JVBERi0xLjQK...",
          logs: "Output written on main.pdf (1 page).",
        }),
      } as unknown as Response);

      const request = new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "\\documentclass{article}\\begin{document}Hello\\end{document}",
          engine: "pdflatex",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pdf).toBe("JVBERi0xLjQK...");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://mock-compiler.run.app/compile",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("handles remote service connection failure gracefully with 502", async () => {
      process.env.LATEX_COMPILER_URL = "https://mock-compiler.run.app";
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("Connection refused"));

      const request = new Request("http://localhost/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "\\documentclass{article}\\begin{document}Hello\\end{document}",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(502);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.errors[0]?.message).toContain("PDF compilation is temporarily unavailable");
    });
  });
});

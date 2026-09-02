export type CompilerFile = { name: string; content: string | Uint8Array };
export type NormalizedCompilerError = {
  code: "unsupported-browser" | "unsupported-package" | "memory" | "latex" | "runtime";
  message: string;
  line?: number;
};

export type LatexCompileResult =
  | { success: true; pdf: Blob; logs: string; cached: boolean }
  | { success: false; errors: NormalizedCompilerError[]; logs: string };

export interface LatexCompiler {
  compile(input: { source: string; files?: CompilerFile[] }): Promise<LatexCompileResult>;
  unload(): void;
}

const SUPPORTED_PACKAGE_FILES: Record<string, string> = {
  // Siglum's v0.1 bundle omits XCharter. The canonical template explicitly
  // allows Computer Modern as its fallback, so this compatibility package
  // preserves compilation without enabling network CTAN fetching.
  "XCharter.sty": "\\NeedsTeXFormat{LaTeX2e}\n\\ProvidesPackage{XCharter}[2026/09/02 local compatibility fallback]\n\\endinput\n",
  "enumitem.sty": "\\NeedsTeXFormat{LaTeX2e}\n\\ProvidesPackage{enumitem}[2026/09/02 local compatibility fallback]\n\\newcommand{\\setlist}[2][]{ }\n\\endinput\n",
  "titlesec.sty": "\\NeedsTeXFormat{LaTeX2e}\n\\ProvidesPackage{titlesec}[2026/09/02 local compatibility fallback]\n\\makeatletter\n\\newcommand{\\titleformat}[5]{\\@ifnextchar[{\\titleformat@optional}{}}\n\\def\\titleformat@optional[#1]{}\n\\makeatother\n\\endinput\n",
};

function normalizeError(message: string, logs: string): NormalizedCompilerError {
  const line = Number(logs.match(/(?:l\.|line\s+)(\d+)/i)?.[1]) || undefined;
  const lower = `${message}\n${logs}`.toLowerCase();
  if (lower.includes("not found") || lower.includes("missing package")) return { code: "unsupported-package", message, line };
  if (lower.includes("memory") || lower.includes("allocation")) return { code: "memory", message: "The browser ran out of memory while compiling.", line };
  return { code: "latex", message, line };
}

export class SiglumLatexCompiler implements LatexCompiler {
  private compiler: import("@siglum/engine").SiglumCompiler | null = null;
  private logs: string[] = [];

  async compile({ source, files = [] }: { source: string; files?: CompilerFile[] }): Promise<LatexCompileResult> {
    if (typeof window === "undefined" || typeof WebAssembly === "undefined" || !window.crossOriginIsolated) {
      return { success: false, errors: [{ code: "unsupported-browser", message: "Local compilation requires a cross-origin-isolated browser with WebAssembly." }], logs: "" };
    }
    try {
      if (!this.compiler) {
        const { SiglumCompiler } = await import("@siglum/engine");
        this.compiler = new SiglumCompiler({
          bundlesUrl: "https://cdn.siglum.org/tl2025/bundles",
          wasmUrl: "https://cdn.siglum.org/tl2025/busytex.wasm",
          jsUrl: "https://cdn.siglum.org/tl2025/busytex.js",
          workerUrl: "/siglum-worker.js",
          enableCtan: false,
          enableLazyFS: true,
          enableDocCache: true,
          maxRetries: 4,
          verbose: true,
          onLog: (message) => {
            this.logs.push(message);
            if (this.logs.length > 1_500) this.logs.splice(0, this.logs.length - 1_500);
          },
        });
      }
      this.logs = [];
      if (!this.compiler.isReady()) await this.compiler.init();
      const additionalFiles = { ...SUPPORTED_PACKAGE_FILES, ...Object.fromEntries(files.map((file) => [file.name, file.content])) };
      const result = await this.compiler.compile(source, { engine: "pdflatex", additionalFiles, useCache: true });
      const logs = result.log || this.logs.join("\n");
      if (result.success && result.pdf) {
        const bytes = new Uint8Array(result.pdf);
        return { success: true, pdf: new Blob([bytes], { type: "application/pdf" }), logs, cached: Boolean(result.cached) };
      }
      const message = result.error || "LaTeX compilation failed.";
      return { success: false, errors: [normalizeError(message, logs)], logs };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The local compiler could not start.";
      return { success: false, errors: [normalizeError(message, this.logs.join("\n"))], logs: this.logs.join("\n") };
    }
  }

  unload(): void {
    this.compiler?.unload();
    this.compiler = null;
  }
}

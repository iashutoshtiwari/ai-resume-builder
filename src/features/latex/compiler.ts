import { loadLatexPackageFiles } from "@/features/latex/packages";

export type CompilerFile = { name: string; content: string | Uint8Array };

export type NormalizedCompilerError = {
  code: "unsupported-browser" | "unsupported-package" | "memory" | "latex" | "runtime";
  message: string;
  line?: number;
};

export type LatexCompileResult =
  | { success: true; pdf: Blob; logs: string; cached: boolean; engine: "wasm" | "cloud" }
  | { success: false; errors: NormalizedCompilerError[]; logs: string; engine: "wasm" | "cloud" };

export interface LatexCompiler {
  compile(input: {
    source: string;
    files?: CompilerFile[];
    engine?: "pdflatex" | "xelatex";
  }): Promise<LatexCompileResult>;
  unload(): void;
}

export type CompilerMode = "wasm" | "cloud" | "auto";

function normalizeError(message: string, logs: string): NormalizedCompilerError {
  const line = Number(logs.match(/(?:l\.|line\s+)(\d+)/i)?.[1]) || undefined;
  const lower = `${message}\n${logs}`.toLowerCase();
  if (lower.includes("not found") || lower.includes("missing package")) {
    return { code: "unsupported-package", message, line };
  }
  if (lower.includes("memory") || lower.includes("allocation") || lower.includes("capacity exceeded")) {
    return { code: "memory", message: "Memory limit reached while compiling.", line };
  }
  return { code: "latex", message, line };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType = "application/pdf"): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export class SiglumLatexCompiler implements LatexCompiler {
  private compiler: import("@siglum/engine").SiglumCompiler | null = null;
  private logs: string[] = [];

  async compile({
    source,
    files = [],
  }: {
    source: string;
    files?: CompilerFile[];
    engine?: "pdflatex" | "xelatex";
  }): Promise<LatexCompileResult> {
    if (typeof window === "undefined" || typeof WebAssembly === "undefined" || !window.crossOriginIsolated) {
      return {
        success: false,
        engine: "wasm",
        errors: [
          {
            code: "unsupported-browser",
            message: "Local compilation requires a cross-origin-isolated browser with WebAssembly.",
          },
        ],
        logs: "",
      };
    }
    try {
      if (!this.compiler) {
        const { SiglumCompiler } = await import("@siglum/engine");
        this.compiler = new SiglumCompiler({
          bundlesUrl: "https://cdn.siglum.org/tl2025/bundles",
          wasmUrl: "https://cdn.siglum.org/tl2025/busytex.wasm",
          jsUrl: "https://cdn.siglum.org/tl2025/busytex.js",
          ctanProxyUrl: window.location.origin,
          xzwasmUrl: "/xzwasm.min.js",
          workerUrl: "/siglum-worker.js",
          enableCtan: true,
          enableLazyFS: true,
          enableDocCache: true,
          maxRetries: 8,
          verbose: false,
          onLog: (message) => {
            this.logs.push(message);
            if (this.logs.length > 1_500) this.logs.splice(0, this.logs.length - 1_500);
          },
        });
      }
      this.logs = [];
      if (!this.compiler.isReady()) await this.compiler.init();
      const packageFiles = await loadLatexPackageFiles();
      const additionalFiles = {
        ...packageFiles,
        ...Object.fromEntries(files.map((file) => [file.name, file.content])),
      };
      const result = await this.compiler.compile(source, {
        engine: "pdflatex",
        additionalFiles,
        useCache: true,
      });

      const logs = result.log || this.logs.join("\n");
      if (result.success && result.pdf) {
        const bytes = new Uint8Array(result.pdf);
        return {
          success: true,
          engine: "wasm",
          pdf: new Blob([bytes], { type: "application/pdf" }),
          logs,
          cached: Boolean(result.cached),
        };
      }
      const message = result.error || "LaTeX compilation failed.";
      return {
        success: false,
        engine: "wasm",
        errors: [normalizeError(message, logs)],
        logs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "The local compiler could not start.";
      return {
        success: false,
        engine: "wasm",
        errors: [normalizeError(message, this.logs.join("\n"))],
        logs: this.logs.join("\n"),
      };
    }
  }

  unload(): void {
    this.compiler?.unload();
    this.compiler = null;
  }
}

export class RemoteLatexCompiler implements LatexCompiler {
  async compile({
    source,
    files = [],
    engine = "pdflatex",
  }: {
    source: string;
    files?: CompilerFile[];
    engine?: "pdflatex" | "xelatex";
  }): Promise<LatexCompileResult> {
    try {
      const serializedFiles = files.map((file) => {
        let contentStr: string;
        if (typeof file.content === "string") {
          contentStr = file.content;
        } else {
          contentStr = `data:application/octet-stream;base64,${uint8ArrayToBase64(file.content)}`;
        }
        return { name: file.name, content: contentStr };
      });

      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, engine, files: serializedFiles }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.pdf) {
        const pdfBlob = base64ToBlob(data.pdf);
        return {
          success: true,
          engine: "cloud",
          pdf: pdfBlob,
          logs: data.logs || "",
          cached: false,
        };
      }

      const errors: NormalizedCompilerError[] =
        Array.isArray(data.errors) && data.errors.length > 0
          ? data.errors
          : [normalizeError(data.error || "Remote compilation failed.", data.logs || "")];

      return {
        success: false,
        engine: "cloud",
        errors,
        logs: data.logs || "",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach remote compilation service.";
      return {
        success: false,
        engine: "cloud",
        errors: [{ code: "runtime", message }],
        logs: message,
      };
    }
  }

  unload(): void {
    // Stateless HTTP client
  }
}

export class HybridLatexCompiler implements LatexCompiler {
  private wasmCompiler: SiglumLatexCompiler;
  private remoteCompiler: RemoteLatexCompiler;
  private mode: CompilerMode = "wasm";

  constructor(initialMode: CompilerMode = "wasm") {
    this.wasmCompiler = new SiglumLatexCompiler();
    this.remoteCompiler = new RemoteLatexCompiler();
    this.mode = initialMode;
  }

  setMode(mode: CompilerMode): void {
    this.mode = mode;
  }

  getMode(): CompilerMode {
    return this.mode;
  }

  async compile(input: {
    source: string;
    files?: CompilerFile[];
    engine?: "pdflatex" | "xelatex";
  }): Promise<LatexCompileResult> {
    if (this.mode === "cloud") {
      return this.remoteCompiler.compile(input);
    }

    if (this.mode === "wasm") {
      return this.wasmCompiler.compile(input);
    }

    // "auto": Try WASM first, fall back to Cloud Run if package/browser is unsupported
    const wasmResult = await this.wasmCompiler.compile(input);
    if (wasmResult.success) {
      return wasmResult;
    }

    const canFallback = wasmResult.errors.some(
      (err) =>
        err.code === "unsupported-package" ||
        err.code === "unsupported-browser" ||
        err.code === "memory"
    );

    if (canFallback) {
      const cloudResult = await this.remoteCompiler.compile(input);
      if (cloudResult.success) {
        return cloudResult;
      }
    }

    return wasmResult;
  }

  unload(): void {
    this.wasmCompiler.unload();
    this.remoteCompiler.unload();
  }
}

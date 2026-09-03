export type CompilerFile = { name: string; content: string | Uint8Array };

export type NormalizedCompilerError = {
  code: "unsupported-package" | "memory" | "latex" | "timeout" | "unavailable" | "runtime";
  message: string;
  line?: number;
};

export type LatexCompileResult =
  | { success: true; pdf: Blob; logs: string; cached: boolean }
  | { success: false; errors: NormalizedCompilerError[]; logs: string };

export interface LatexCompiler {
  compile(input: {
    source: string;
    files?: CompilerFile[];
    engine?: "pdflatex" | "xelatex";
  }): Promise<LatexCompileResult>;
  unload(): void;
}

function normalizeError(message: string, logs: string): NormalizedCompilerError {
  const line = Number(logs.match(/(?:l\.|line\s+)(\d+)/i)?.[1]) || undefined;
  const lower = `${message}\n${logs}`.toLowerCase();
  if (lower.includes("not found") || lower.includes("missing package")) {
    return { code: "unsupported-package", message: "This document uses a LaTeX package that is not available in the current compiler.", line };
  }
  if (lower.includes("memory") || lower.includes("allocation") || lower.includes("capacity exceeded")) {
    return { code: "memory", message: "Memory limit reached while compiling.", line };
  }
  if (lower.includes("timeout") || lower.includes("timed out")) return { code: "timeout", message: "PDF compilation took too long and was stopped. Try a smaller document or the default template.", line };
  if (lower.includes("not configured") || lower.includes("temporarily unavailable") || lower.includes("failed to fetch")) return { code: "unavailable", message: "PDF compilation is temporarily unavailable. Please try again shortly.", line };
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
          pdf: pdfBlob,
          logs: data.logs || "",
          cached: false,
        };
      }

      const errors: NormalizedCompilerError[] = Array.isArray(data.errors) && data.errors.length > 0
        ? data.errors.map((error: { code?: string; message?: string; line?: number }) => normalizeError(error.message || "Compilation failed.", data.logs || ""))
        : [normalizeError(data.error || "Remote compilation failed.", data.logs || "")];

      return {
        success: false,
        errors,
        logs: data.logs || "",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach compilation service.";
      return {
        success: false,
        errors: [{ code: "runtime", message }],
        logs: message,
      };
    }
  }

  unload(): void {
    // Stateless HTTP client
  }
}

// Default compiler export
export const defaultCompiler = new RemoteLatexCompiler();

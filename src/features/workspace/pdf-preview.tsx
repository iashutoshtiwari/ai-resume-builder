"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Cpu,
  Download,
  FileWarning,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HybridLatexCompiler } from "@/features/latex/compiler";
import { hashCompileInput } from "@/features/latex/source-hash";
import { sanitizeFilename } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
const compiler = new HybridLatexCompiler();

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function PdfPreview({ compact = false }: { compact?: boolean }) {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const pdfBlob = useWorkspaceStore((state) => state.pdfBlob);
  const compileStatus = useWorkspaceStore((state) => state.compileStatus);
  const compileError = useWorkspaceStore((state) => state.compileError);
  const compileLogs = useWorkspaceStore((state) => state.compileLogs);
  const compilerMode = useWorkspaceStore((state) => state.compilerMode);
  const setCompilerMode = useWorkspaceStore((state) => state.setCompilerMode);
  const setPending = useWorkspaceStore((state) => state.setCompilePending);
  const setSuccess = useWorkspaceStore((state) => state.setCompileSuccess);
  const setFailure = useWorkspaceStore((state) => state.setCompileFailure);
  const setCompiledPageCount = useWorkspaceStore((state) => state.setCompiledPageCount);
  const source = workspace.manualLatex ?? workspace.generatedLatex;
  const [sourceHash, setSourceHash] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(0.82);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    void hashCompileInput(source, workspace.compilerFiles).then(
      (value) => alive && setSourceHash(value)
    );
    return () => {
      alive = false;
    };
  }, [source, workspace.compilerFiles]);

  const stale = Boolean(pdfBlob && sourceHash && workspace.lastCompiledSourceHash !== sourceHash);

  async function compile() {
    setPending();
    const hash = await hashCompileInput(source, workspace.compilerFiles);
    compiler.setMode(compilerMode);
    const result = await compiler.compile({
      source,
      files: workspace.compilerFiles.map((file) => ({ name: file.name, content: file.content })),
    });

    if (result.success) {
      setSuccess(result.pdf, hash, result.logs);
      const engineLabel = result.engine === "cloud" ? "Cloud TeX Live" : "local WASM";
      toast.success(
        result.cached ? "Loaded compiled PDF from browser cache" : `PDF compiled via ${engineLabel}`
      );
    } else {
      const message = result.errors[0]?.message ?? "Compilation failed.";
      setFailure(message, result.logs);
      toast.error(message);
    }
  }

  const filename = sanitizeFilename(
    `${workspace.resume.basics.name}-${workspace.targetJob?.company ?? "resume"}`
  );

  const controls = (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))}
        aria-label="Zoom out"
      >
        <Minus />
      </Button>
      <span className="w-12 text-center font-mono text-[10px] text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}
        aria-label="Zoom in"
      >
        <Plus />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => setZoom(0.82)} aria-label="Fit page">
        <Maximize2 />
      </Button>
    </div>
  );

  return (
    <section
      className={`flex h-full min-h-0 flex-col bg-[#d8dad7] text-zinc-950 ${compact ? "min-h-[680px]" : ""}`}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/15 bg-[#eeeeeb] px-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-zinc-950 text-white hover:bg-zinc-800"
            disabled={compileStatus === "compiling"}
            onClick={() => void compile()}
          >
            {compileStatus === "compiling" ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
            {pdfBlob ? "Recompile" : "Compile"}
          </Button>

          {/* Compiler Mode Segmented Toggle */}
          <div className="flex items-center rounded-md border border-black/15 bg-white/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setCompilerMode("wasm")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                compilerMode === "wasm" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
              }`}
              title="Browser WebAssembly: Fast, private, offline"
            >
              <Cpu className="size-3" /> WASM
            </button>
            <button
              type="button"
              onClick={() => setCompilerMode("cloud")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                compilerMode === "cloud" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
              }`}
              title="Cloud TeX Live: Full engine, all fonts & packages"
            >
              <Cloud className="size-3" /> Cloud
            </button>
            <button
              type="button"
              onClick={() => setCompilerMode("auto")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                compilerMode === "auto" ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-950"
              }`}
              title="Auto Hybrid: WASM with Cloud fallback"
            >
              <Sparkles className="size-3" /> Auto
            </button>
          </div>

          {stale && <span className="font-mono text-[10px] text-amber-800">PREVIEW STALE</span>}
        </div>

        {controls}

        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!pdfBlob}
            onClick={() => pdfBlob && downloadBlob(pdfBlob, `${filename}.pdf`)}
            aria-label="Download PDF"
          >
            <Download />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => downloadBlob(new Blob([source], { type: "application/x-tex" }), `${filename}.tex`)}
            aria-label="Download LaTeX"
          >
            <span className="font-mono text-[9px]">TEX</span>
          </Button>
        </div>
      </div>

      <div ref={viewportRef} className="min-h-0 flex-1 overflow-auto p-5">
        {pdfBlob ? (
          <BlobPdf
            key={workspace.lastCompiledSourceHash ?? "saved-pdf"}
            blob={pdfBlob}
            page={page}
            zoom={zoom}
            onLoaded={(numPages) => {
              setPages(numPages);
              setPage((current) => Math.min(current, numPages));
              setCompiledPageCount(numPages);
            }}
          />
        ) : (
          <div className="mx-auto grid aspect-[8.5/11] w-full max-w-[610px] place-items-center border border-black/10 bg-white shadow-xl shadow-black/10">
            <div className="max-w-xs text-center">
              <FileWarning className="mx-auto size-6 text-zinc-400" />
              <p className="mt-3 text-sm font-medium">No compiled preview yet</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {compilerMode === "cloud"
                  ? "Cloud TeX Live uses your Google Cloud Run microservice with all fonts and packages."
                  : "Compilation runs only when you request it. Local WASM compiles directly in the browser."}
              </p>
              <Button
                className="mt-5 bg-zinc-950 text-white hover:bg-zinc-800"
                onClick={() => void compile()}
                disabled={compileStatus === "compiling"}
              >
                {compileStatus === "compiling"
                  ? "Starting compiler…"
                  : compilerMode === "cloud"
                  ? "Compile with Cloud Run"
                  : "Compile locally"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {(pages > 1 || compileError) && (
        <div className="shrink-0 border-t border-black/15 bg-[#eeeeeb] px-3 py-2 space-y-2">
          {pages > 1 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="font-mono text-[10px]">
                  {page} / {pages}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={page >= pages}
                  onClick={() => setPage((value) => value + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
              <div className="rounded border border-amber-300/80 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-4 text-amber-900">
                <span className="font-semibold">Multi-page resume ({pages} pages):</span> The
                EngineeringResumes guide recommends 1 page for most early- and mid-career engineers. A
                second page may be justified for candidates with roughly 10+ years of relevant experience
                or senior scope. PDF export remains fully available.
              </div>
            </div>
          )}
          {compileError && (
            <details className="text-xs text-red-800">
              <summary className="cursor-pointer font-medium">
                Compile failed — last successful preview preserved
              </summary>
              <p className="mt-2">{compileError}</p>
              {compileLogs && (
                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px]">
                  {compileLogs.slice(-5000)}
                </pre>
              )}
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function PreviewMessage({ label }: { label: string }) {
  return <div className="grid h-[720px] w-[556px] place-items-center bg-white text-xs text-zinc-500">{label}</div>;
}

function BlobPdf({
  blob,
  page,
  zoom,
  onLoaded,
}: {
  blob: Blob;
  page: number;
  zoom: number;
  onLoaded: (pages: number) => void;
}) {
  const [data, setData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    let alive = true;
    blob.arrayBuffer().then((buf) => {
      if (alive) {
        setData(new Uint8Array(buf));
      }
    });
    return () => {
      alive = false;
    };
  }, [blob]);

  const fileProp = useMemo(() => (data ? { data } : null), [data]);

  if (!fileProp) {
    return (
      <div className="mx-auto w-fit shadow-2xl shadow-black/25">
        <PreviewMessage label="Loading PDF…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-fit shadow-2xl shadow-black/25">
      <Document
        file={fileProp}
        loading={<PreviewMessage label="Loading PDF…" />}
        error={<PreviewMessage label="The saved PDF could not be displayed." />}
        onLoadSuccess={({ numPages }) => onLoaded(numPages)}
      >
        <Page pageNumber={page} scale={zoom} renderAnnotationLayer={false} renderTextLayer />
      </Document>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ImportResult } from "@/features/latex/importer";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import {
  extractTextFromFile,
  type SupportedFormat,
} from "@/lib/document/extract";
import { LandingContent } from "@/features/seo/landing-content";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  ArrowRight,
  Check,
  FileCode2,
  FileText,
  FileType,
  FolderOpen,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ApiError = { error?: { message?: string } };

export function ImportScreen({
  canonicalLatex,
  aiConfigured,
}: {
  canonicalLatex: string;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<SupportedFormat | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const {
    hydrate,
    hydrated,
    workspace,
    startWorkspace,
    resetWorkspace,
    saveStatus,
  } = useWorkspaceStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function parseResumeContent(
    content = source,
    formatHint: SupportedFormat = "text",
  ) {
    if (content.trim().length < 30) {
      return toast.error(
        "Upload a resume file (PDF, Word, LaTeX) or paste your resume text first.",
      );
    }
    setBusy(true);
    setLoadingStep("Structuring resume with AI...");
    try {
      const response = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: content }),
      });
      const body = (await response.json()) as ImportResult | ApiError;
      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error?.message : "Resume import failed.",
        );
      }
      setSource(content);
      setDetectedFormat(formatHint);
      setResult(body as ImportResult);
      toast.success("Resume parsed successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Resume import failed.",
      );
    } finally {
      setBusy(false);
      setLoadingStep("");
    }
  }

  async function begin() {
    if (!result) return;
    await startWorkspace(
      result.resume,
      detectedFormat === "latex" ? source : null,
      `${result.resume.basics.name}'s Resume`,
    );
    router.push("/workspace");
  }

  async function onFile(file?: File) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!aiConfigured && extension !== "tex") {
      return toast.error(
        "PDF, DOCX, and text imports require an AI API key. LaTeX template imports remain local.",
      );
    }
    if (file.size > 8_000_000) {
      return toast.error("Uploaded resume must be 8 MB or smaller.");
    }

    setBusy(true);
    setLoadingStep(`Extracting text from ${file.name}...`);
    try {
      const extracted = await extractTextFromFile(file);
      if (!extracted.text || extracted.text.trim().length < 20) {
        throw new Error(
          "Could not extract readable text from this file. If it is a scanned image, try a standard text PDF or Word document.",
        );
      }
      if (new TextEncoder().encode(extracted.text).byteLength > 200_000) {
        throw new Error(
          "The extracted resume text exceeds 200 KB. Remove embedded appendices or export a shorter resume and try again.",
        );
      }
      setSource(extracted.text);
      setDetectedFormat(extracted.format);
      await parseResumeContent(extracted.text, extracted.format);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to extract text from file.",
      );
      setBusy(false);
      setLoadingStep("");
    }
  }

  if (result) {
    const count =
      result.resume.experience.length +
      result.resume.projects.length +
      result.resume.education.length;
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 sm:py-10">
        <section className="w-full border border-border bg-card shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  Structured Import Review
                </p>
                {detectedFormat && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] uppercase"
                  >
                    {detectedFormat}
                  </Badge>
                )}
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                Check the extracted information
              </h1>
            </div>
            <Badge
              variant="outline"
              className="w-fit gap-1.5 self-start sm:self-auto"
            >
              <Check className="size-3 text-emerald-500" /> {result.confidence}{" "}
              confidence
            </Badge>
          </div>
          <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6 p-5 sm:p-6 lg:border-r lg:border-border">
              <div>
                <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {result.resume.basics.name || "Unnamed Candidate"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    result.resume.basics.email,
                    result.resume.basics.phone,
                    result.resume.basics.location,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "No contact info detected"}
                </p>
                {result.resume.basics.headline && (
                  <p className="mt-2 text-xs font-medium text-foreground/80">
                    {result.resume.basics.headline}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                {[
                  ["Experience", result.resume.experience.length],
                  ["Projects", result.resume.projects.length],
                  ["Skill groups", result.resume.skills.length],
                  ["Education", result.resume.education.length],
                ].map(([label, value]) => (
                  <div key={label} className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Detected Sections
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ...result.resume.experience.map((item) => item.role),
                    ...result.resume.projects.map((item) => item.name),
                    ...result.resume.education.map((item) => item.institution),
                  ]
                    .slice(0, 10)
                    .map((label, index) => (
                      <Badge key={`${label}-${index}`} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  {count === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No repeatable sections detected.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <aside className="space-y-5 bg-background/40 p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-medium">Extraction Notes</h2>
                {result.warnings.length ? (
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {result.warnings.map((warning) => (
                      <li
                        key={warning.code}
                        className="border-l-2 border-warning pl-3"
                      >
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    All expected resume entities were mapped into the structured
                    schema.
                  </p>
                )}
              </div>
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full justify-between"
                  onClick={() => void begin()}
                >
                  Open Workspace <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setResult(null)}
                >
                  Upload a different file
                </Button>
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground">
                Your resume is converted into our clean LaTeX template and
                compiled directly in your browser.
              </p>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center border border-primary/40 bg-primary/10">
            <FileCode2 className="size-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">AI Resume Builder</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          v0.1 · PDF + DOCX + LaTeX
        </Badge>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12 lg:pt-[6vh]">
        <section className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Evidence-Grounded Resume Tailoring
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Upload your resume.
            <br />
            <span className="text-muted-foreground">Tailor for any job.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Upload your current resume in <strong>PDF or Word (.docx)</strong>{" "}
            format. Paste any job description to compare requirements, generate
            verified improvements, and compile a polished LaTeX PDF.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-3">
            {[
              [
                ShieldCheck,
                "Factual safeguards",
                "Evidence-grounded edits only",
              ],
              [LockKeyhole, "TeX Live Engine", "Standardized ATS-ready PDF output"],
              [Sparkles, "Atomic Diffs", "Review and approve every change"],
            ].map(([Icon, title, copy]) => {
              const Glyph = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="bg-background px-3.5 py-4">
                  <Glyph className="size-4 text-primary" />
                  <p className="mt-2.5 text-xs font-medium">{String(title)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                    {String(copy)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border border-border bg-card shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-medium">Upload Current Resume</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accepts PDF, Word (.docx), LaTeX (.tex), or plain text
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono text-[9px]">
                PDF
              </Badge>
              <Badge variant="outline" className="font-mono text-[9px]">
                DOCX
              </Badge>
              <Badge variant="outline" className="font-mono text-[9px]">
                TEX
              </Badge>
            </div>
          </div>

          {workspace && hydrated && (
            <div className="flex flex-col gap-2 border-b border-border bg-primary/5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Continue: {workspace.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {saveStatus === "saved"
                    ? "Saved in this browser"
                    : "Local workspace found"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void resetWorkspace()}
                >
                  <RotateCcw className="size-3.5" /> Reset
                </Button>
                <Button size="sm" onClick={() => router.push("/workspace")}>
                  Open <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 p-5">
            {saveStatus === "corrupt" && (
              <div className="flex items-center justify-between border-l-2 border-destructive bg-destructive/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">
                    Local workspace could not be recovered
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reset the invalid record, then import again.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void resetWorkspace()}
                >
                  Reset storage
                </Button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.tex,.txt,text/plain,text/x-tex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />

            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onFile(event.dataTransfer.files[0]);
              }}
              className="group grid w-full place-items-center border border-dashed border-border bg-background/40 px-6 py-9 text-center transition-colors hover:border-primary/60 hover:bg-primary/3 disabled:opacity-60"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="grid size-10 place-items-center border border-border bg-card group-hover:border-primary/50">
                  <Upload className="size-4 text-primary" />
                </span>
                <span className="grid size-10 place-items-center border border-border bg-card group-hover:border-primary/50">
                  <FileText className="size-4 text-muted-foreground" />
                </span>
                <span className="grid size-10 place-items-center border border-border bg-card group-hover:border-primary/50">
                  <FileType className="size-4 text-muted-foreground" />
                </span>
              </div>
              <span className="mt-4 text-sm font-medium">
                {busy
                  ? loadingStep || "Processing document…"
                  : "Drop your resume PDF, Word (.docx), or LaTeX here"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                or click to browse from your computer (up to 8 MB)
              </span>
            </button>

            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or paste text / LaTeX
              <span className="h-px flex-1 bg-border" />
            </div>

            <Textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Paste your plain text resume or \documentclass{article} LaTeX here..."
              className="min-h-32 resize-y bg-background font-mono text-xs leading-5"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                disabled={busy || source.trim().length < 30}
                onClick={() => void parseResumeContent()}
              >
                {busy
                  ? loadingStep || "Structuring…"
                  : "Parse & Structure Resume"}
                <ArrowRight className="size-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                onClick={() => void parseResumeContent(canonicalLatex, "latex")}
                disabled={busy}
              >
                <FolderOpen className="size-4 mr-1" /> Load Example Template
              </Button>
            </div>

            <button
              type="button"
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={async () => {
                await startWorkspace(
                  sampleResume,
                  null,
                  "Sample Software Engineer Resume",
                );
                router.push("/workspace");
              }}
            >
              Or start instantly with a sample software engineer resume
            </button>
          </div>

          <div className="border-t border-border px-5 py-3.5 text-xs leading-5 text-muted-foreground">
            {aiConfigured
              ? "Text extraction and PDF compilation stay in your browser. AI parsing and tailoring use the configured AI provider."
              : "PDF, DOCX, and text structuring require an API key (GEMINI_API_KEY or OPENROUTER_API_KEY). Known-template LaTeX import, editing, compilation, and exports remain available."}
          </div>
        </section>
      </div>

      <LandingContent />
    </main>
  );
}

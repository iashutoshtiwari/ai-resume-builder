"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  detectCareerStageDetailed,
  getRecommendedSections,
  STAGE_LABEL,
  type CareerStage,
} from "@/features/assessment/scoring";
import type { ImportResult } from "@/features/latex/importer";
import type { RenderedSection } from "@/features/presentation/schema";
import { resumeToCandidateProfile } from "@/features/resume/candidate-profile";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { LandingContent } from "@/features/seo/landing-content";
import {
  extractTextFromFile,
  type SupportedFormat,
} from "@/lib/document/extract";
import { useWorkspaceStore } from "@/store/workspace-store";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDashed,
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
import { AiProviderSwitch } from "@/features/workspace/ai-provider-switch";
import { siteConfig } from "@/config/site";

type ApiError = { error?: { message?: string } };

const ALL_SECTION_OPTIONS: Array<{ id: RenderedSection; label: string }> = [
  { id: "summary", label: "Professional Summary" },
  { id: "experience", label: "Work Experience" },
  { id: "skills", label: "Technical Skills" },
  { id: "projects", label: "Engineering Projects" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "achievements", label: "Achievements & Honors" },
];

const STAGES: CareerStage[] = [
  "student",
  "new-graduate",
  "early-career",
  "mid-level",
  "senior",
  "staff-principal",
  "career-changer",
  "returning-professional",
];

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
  const [selectedStage, setSelectedStage] = useState<CareerStage | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<"india" | "us-canada">(
    "india",
  );
  const [selectedSections, setSelectedSections] = useState<RenderedSection[]>(
    [],
  );
  const [isBuilding, setIsBuilding] = useState(false);
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
        headers: {
          "content-type": "application/json",
          "x-ai-provider": useWorkspaceStore.getState().activeAiProvider,
        },
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
    const currentResult = result;
    const profile = resumeToCandidateProfile(currentResult.resume);
    const stageInfo = detectCareerStageDetailed(currentResult.resume);
    const activeStage = selectedStage ?? stageInfo.stage;
    const sectionRecs = getRecommendedSections(
      activeStage,
      currentResult.resume,
    );
    const activeSections =
      selectedSections.length > 0 ? selectedSections : sectionRecs.recommended;

    const totalBullets = [
      ...currentResult.resume.experience.flatMap((e) => e.bullets),
      ...currentResult.resume.projects.flatMap((p) => p.bullets),
    ].length;
    const totalSkills = currentResult.resume.skills.flatMap(
      (g) => g.skills,
    ).length;
    const certsCount = currentResult.resume.certifications?.length ?? 0;
    const achCount = currentResult.resume.achievements?.length ?? 0;

    const isLowDensity =
      source.trim().length < 150 ||
      currentResult.warnings.some(
        (w) =>
          w.message.toLowerCase().includes("ocr") ||
          w.message.toLowerCase().includes("scan"),
      );

    async function handleBuildResume() {
      setIsBuilding(true);
      setLoadingStep(
        "AI is compiling and polishing your resume according to engineering standards...",
      );
      try {
        const response = await fetch("/api/ai/build-resume", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-ai-provider": useWorkspaceStore.getState().activeAiProvider,
          },
          body: JSON.stringify({
            profile: { ...profile, careerStage: activeStage },
            sections: activeSections,
            locale: selectedLocale,
          }),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error?.message ?? "Resume build failed.");
        await startWorkspace(
          body.resume,
          detectedFormat === "latex" ? source : null,
          `${body.resume.basics.name || "Candidate"}'s Resume`,
          profile,
          selectedLocale,
        );
        toast.success("Baseline resume successfully built!");
        router.push("/workspace");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Build failed. Opening extracted resume.",
        );
        await startWorkspace(
          currentResult.resume,
          detectedFormat === "latex" ? source : null,
          `${currentResult.resume.basics.name || "Candidate"}'s Resume`,
          profile,
          selectedLocale,
        );
        router.push("/workspace");
      } finally {
        setIsBuilding(false);
        setLoadingStep("");
      }
    }

    async function handleOpenRaw() {
      await startWorkspace(
        currentResult.resume,
        detectedFormat === "latex" ? source : null,
        `${currentResult.resume.basics.name || "Candidate"}'s Resume`,
        profile,
        selectedLocale,
      );
      router.push("/workspace");
    }

    function toggleSection(sectionId: RenderedSection) {
      if (activeSections.includes(sectionId)) {
        if (activeSections.length > 1) {
          setSelectedSections(activeSections.filter((s) => s !== sectionId));
        } else {
          toast.error("At least one section must remain enabled.");
        }
      } else {
        setSelectedSections([...activeSections, sectionId]);
      }
    }

    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 sm:py-10">
        <section className="w-full border border-border bg-card shadow-2xl">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  Extraction Review
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
                Review Extracted Profile & Build Baseline
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <AiProviderSwitch />
              <Badge variant="outline" className="gap-1.5">
                <Check className="size-3 text-emerald-500" />{" "}
                {result.confidence} confidence
              </Badge>
            </div>
          </div>

          {isLowDensity && (
            <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3 text-xs text-amber-200">
              ⚠️ Low text density detected. If this is a scanned/photographed
              document, consider pasting raw text or uploading an exported text
              PDF/DOCX for best accuracy.
            </div>
          )}

          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
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

              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Extracted Evidence
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">
                      {result.resume.experience.length}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Work Experiences ({totalBullets} bullets)
                    </p>
                  </div>
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">
                      {result.resume.projects.length}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Engineering Projects
                    </p>
                  </div>
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">
                      {result.resume.education.length}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Education Degrees
                    </p>
                  </div>
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">
                      {totalSkills}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Technical Skills ({result.resume.skills.length} groups)
                    </p>
                  </div>
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">
                      {certsCount}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Certifications
                    </p>
                  </div>
                  <div className="bg-card p-3 sm:p-4">
                    <p className="font-mono text-xl sm:text-2xl">{achCount}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Achievements / Honors
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-none border border-border bg-background/50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Detected Career Stage
                      </span>
                      <Badge variant="outline">
                        {STAGE_LABEL[stageInfo.stage]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stageInfo.explanation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Tier:</span>
                    <Select
                      value={activeStage}
                      onValueChange={(val) => {
                        const newStage = val as CareerStage;
                        setSelectedStage(newStage);
                        setSelectedSections(
                          getRecommendedSections(newStage, result.resume)
                            .recommended,
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem
                            key={stage}
                            value={stage}
                            className="text-xs"
                          >
                            {STAGE_LABEL[stage]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Included Resume Sections
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {activeSections.length} sections selected
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {ALL_SECTION_OPTIONS.map((sec) => {
                    const isSelected = activeSections.includes(sec.id);
                    const isRec = sectionRecs.recommended.includes(sec.id);
                    return (
                      <button
                        type="button"
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className={`flex items-center justify-between rounded-none border p-2.5 text-left text-xs transition-colors ${
                          isSelected
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex size-4 items-center justify-center rounded-none border ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <span>{sec.label}</span>
                        </div>
                        {isRec && (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-primary">
                            Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="flex flex-col justify-between space-y-5 bg-background/40 p-5 sm:p-6">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-medium">
                    Hiring Locale Preference
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tunes section emphasis, degree terminology, and date
                    formatting.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        selectedLocale === "india" ? "default" : "outline"
                      }
                      className="flex-1 text-xs"
                      onClick={() => setSelectedLocale("india")}
                    >
                      India (Default)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        selectedLocale === "us-canada" ? "default" : "outline"
                      }
                      className="flex-1 text-xs"
                      onClick={() => setSelectedLocale("us-canada")}
                    >
                      US / Canada
                    </Button>
                  </div>
                </div>

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
                      All expected resume entities were mapped into the
                      structured schema.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  className="w-full justify-between"
                  disabled={isBuilding}
                  onClick={() => void handleBuildResume()}
                >
                  {isBuilding ? (
                    <>
                      <CircleDashed className="animate-spin" /> Building resume…
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="size-4" /> Build My Resume
                      </span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  disabled={isBuilding}
                  onClick={() => void handleOpenRaw()}
                >
                  Skip AI Polish & Open Workspace
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  disabled={isBuilding}
                  onClick={() => setResult(null)}
                >
                  Upload a different file
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  Baseline resume compiled deterministically using our canonical
                  LaTeX engine.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="grid size-7 place-items-center border border-primary/40 bg-primary/10 text-xs font-black text-primary">
                A
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                ArqeloCV
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
              <a href="#how-it-works" className="transition-colors hover:text-foreground">
                How it works
              </a>
              <a href="#features" className="transition-colors hover:text-foreground">
                Features
              </a>
              <a href="#trust" className="transition-colors hover:text-foreground">
                Trust
              </a>
              <a href="#faq" className="transition-colors hover:text-foreground">
                FAQ
              </a>
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                Open Source <ArrowUpRight className="size-3" />
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            <AiProviderSwitch />
            <Button
              size="sm"
              onClick={() => {
                document.getElementById("upload-resume")?.scrollIntoView({ behavior: "smooth" });
                inputRef.current?.focus();
              }}
              className="text-xs"
            >
              Build Your Resume
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-12 lg:pt-[5vh]">
        <section className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            ArqeloCV
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            AI Resume Builder for Software Engineers
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Build, improve, and tailor your engineering resume with AI.
            Import what you already have, target a job, and generate a
            professional resume grounded in your actual experience.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="default"
              onClick={() => {
                document.getElementById("upload-resume")?.scrollIntoView({ behavior: "smooth" });
                inputRef.current?.focus();
              }}
              className="text-xs"
            >
              Build Your Resume <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="default"
              asChild
              className="text-xs"
            >
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                View on GitHub <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
          </div>

          <div className="mt-8 grid max-w-lg grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-3">
            <div className="bg-background px-3.5 py-4">
              <ShieldCheck className="size-4 text-primary" />
              <p className="mt-2 text-xs font-medium">Grounded in Experience</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Emphasize real skills without inventing experience
              </p>
            </div>
            <div className="bg-background px-3.5 py-4">
              <LockKeyhole className="size-4 text-primary" />
              <p className="mt-2 text-xs font-medium">ATS-Friendly LaTeX</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Standard single-column vector PDF output
              </p>
            </div>
            <div className="bg-background px-3.5 py-4">
              <Sparkles className="size-4 text-primary" />
              <p className="mt-2 text-xs font-medium">Targeted Job Match</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Align accomplishments directly to the role
              </p>
            </div>
          </div>
        </section>

        <section id="upload-resume" className="border border-border bg-card shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-medium">Upload your resume</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accepts PDF, Word (.docx), LaTeX (.tex), or plain text
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
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
              className="h-40 [field-sizing:fixed] resize-none overflow-y-auto bg-background/60 font-mono text-xs leading-relaxed"
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
              ? "Text extraction happens locally. AI parsing and tailoring use the configured AI provider; PDF compilation uses the dedicated service."
              : "PDF, DOCX, and text structuring require an API key (GEMINI_API_KEY or OPENROUTER_API_KEY). LaTeX editing and source exports remain available."}
          </div>
        </section>
      </div>

      <LandingContent
        onStartSample={async () => {
          await startWorkspace(
            sampleResume,
            null,
            "Sample Software Engineer Resume"
          );
          router.push("/workspace");
        }}
      />
    </main>
  );
}

import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  FileCode2,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function LandingContent({
  onStartSample,
}: {
  onStartSample?: () => void;
}) {
  const capabilities = [
    {
      icon: Upload,
      title: "Build from what you already have",
      description:
        "Upload your PDF, DOCX, or LaTeX resume, or paste your existing content. ArqeloCV structures it into an engineering-focused resume.",
    },
    {
      icon: Sparkles,
      title: "Tailor for a specific job",
      description:
        "Paste a job description to see how your experience matches and generate a more relevant version of your resume.",
    },
    {
      icon: ShieldCheck,
      title: "Grounded in your experience",
      description:
        "ArqeloCV can emphasize relevant skills and projects without adding unsupported technologies, responsibilities, or achievements.",
    },
    {
      icon: FileCode2,
      title: "Export a professional resume",
      description:
        "Generate a clean, ATS-friendly resume and export it as PDF using deterministic single-column LaTeX compilation.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Import",
      description: "Upload your existing resume or paste its content.",
    },
    {
      step: "2",
      title: "Build",
      description:
        "ArqeloCV structures and improves your resume for software engineering roles.",
    },
    {
      step: "3",
      title: "Tailor",
      description:
        "Add a job description to understand your match and generate a targeted version.",
    },
  ];

  const faqs = [
    {
      question: "What is ArqeloCV?",
      answer:
        "ArqeloCV is an AI resume builder designed primarily for software engineers. It structures your existing experience, scores technical quality, and tailors your resume to target job descriptions while preserving factual accuracy.",
    },
    {
      question: "Can ArqeloCV tailor my resume to a job description?",
      answer:
        "Yes. Paste any target job description to evaluate requirements, identify alignment gaps, and generate tailored revisions emphasizing your relevant supported experience.",
    },
    {
      question: "Will ArqeloCV add skills I don't have?",
      answer:
        "No. ArqeloCV enforces strict factuality guardrails. Suggestions rewrite and highlight verified experience from your original resume. Missing skills remain missing until you explicitly supply evidence.",
    },
    {
      question: "What resume formats can I import?",
      answer:
        "You can import resumes in PDF, DOCX (Microsoft Word), LaTeX (.tex), or plain text. You can also start immediately with our pre-configured sample software engineer resume.",
    },
    {
      question: "Is ArqeloCV ATS-friendly?",
      answer:
        "Yes. Resumes are rendered with clean, single-column typesetting and compiled into standard text-based vector PDFs via TeX Live, ensuring reliable parsing across applicant tracking systems.",
    },
    {
      question: "Who is ArqeloCV for?",
      answer:
        "ArqeloCV is built primarily for software engineers, developers, students, and technical candidates applying for software roles.",
    },
  ];

  function scrollToUpload() {
    const el = document.getElementById("upload-resume");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="border-t border-border bg-background text-foreground">
      {/* PRODUCT VISUAL / WORKSPACE PREVIEW */}
      <section
        id="preview"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24"
      >
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Workspace Preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            A focused review desk for engineering resumes
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Inspect structured sections, evaluate job match alignment, and
            compile clean LaTeX PDFs with deterministic precision.
          </p>
        </div>

        <div className="mt-10 overflow-hidden border border-border bg-card shadow-2xl">
          {/* Simulated Workspace Window Bar */}
          <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
                <span className="size-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">
                ArqeloCV Workspace · Staff Software Engineer
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                <CheckCircle2 className="size-3" /> Grounded in evidence
              </span>
              <span className="hidden sm:inline-flex border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                pdfLaTeX Engine
              </span>
            </div>
          </div>

          {/* Workspace Multi-Pane Representation */}
          <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Left Column: Quality & Match Metrics */}
            <div className="p-5 lg:col-span-3 space-y-5 bg-background/40">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  ATS & Quality Metrics
                </p>
                <div className="mt-3 space-y-3">
                  <div className="border border-border bg-card p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        ATS Compatibility
                      </span>
                      <span className="font-mono font-semibold text-emerald-400">
                        98 / 100
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      Clean single-column glyphs; standard margins.
                    </p>
                  </div>
                  <div className="border border-border bg-card p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Job Description Match
                      </span>
                      <span className="font-mono font-semibold text-emerald-400">
                        86%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                      Strong overlap in distributed systems and Go.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Structured Sections
                </p>
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                  <li className="flex items-center justify-between border-l-2 border-primary bg-primary/5 px-2 py-1 text-foreground">
                    <span>Work Experience</span>
                    <span className="text-[10px] text-primary">4 roles</span>
                  </li>
                  <li className="flex items-center justify-between px-2 py-1">
                    <span>Engineering Projects</span>
                    <span className="text-[10px]">3 projects</span>
                  </li>
                  <li className="flex items-center justify-between px-2 py-1">
                    <span>Technical Skills</span>
                    <span className="text-[10px]">18 items</span>
                  </li>
                  <li className="flex items-center justify-between px-2 py-1">
                    <span>Education</span>
                    <span className="text-[10px]">B.Tech CS</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Center Column: Structured Bullet Editor */}
            <div className="p-5 lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    Work Experience · Staff Engineer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Infrastructure & Distributed Systems
                  </p>
                </div>
                <span className="border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  Atomic Diff
                </span>
              </div>

              <div className="space-y-3">
                <div className="border border-border bg-background p-3 text-xs leading-relaxed">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Original Bullet from Resume
                  </p>
                  <p className="mt-1.5 text-muted-foreground">
                    &quot;Built distributed event ingestion pipeline for
                    real-time transactions.&quot;
                  </p>
                </div>

                <div className="border border-primary/50 bg-primary/5 p-3 text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      Tailored Revision (Factuality Grounded)
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="size-3" /> Grounded in source
                    </span>
                  </div>
                  <p className="mt-1.5 text-foreground">
                    &quot;Engineered distributed event ingestion pipeline using
                    Go and Kafka, sustaining 45,000 events/sec with sub-50ms
                    latency and reducing database contention by 32%.&quot;
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <FileCheck2 className="size-3.5 text-primary" />
                  <span>
                    No invented frameworks or unearned metrics introduced.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: PDF Preview */}
            <div className="p-5 lg:col-span-4 bg-zinc-950/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Deterministic LaTeX Preview
                  </p>
                  <span className="font-mono text-[10px] text-emerald-400">
                    Vector PDF
                  </span>
                </div>

                {/* Paper Representation */}
                <div className="mt-3 rounded-none border border-zinc-200 bg-white p-4 text-zinc-900 shadow-md">
                  <div className="text-center">
                    <h4 className="font-serif text-sm font-bold tracking-wide uppercase">
                      Alex Morgan
                    </h4>
                    <p className="text-[9px] text-zinc-600">
                      alex.morgan@email.com · github.com/alexm · San Francisco,
                      CA
                    </p>
                  </div>
                  <div className="my-2 border-b border-zinc-400" />
                  <div>
                    <h5 className="font-serif text-[10px] font-bold tracking-wider uppercase text-zinc-800">
                      Experience
                    </h5>
                    <div className="mt-1 text-[9px] text-zinc-700">
                      <div className="flex justify-between font-semibold">
                        <span>Staff Infrastructure Engineer — CloudCorp</span>
                        <span>2021 – Present</span>
                      </div>
                      <ul className="mt-1 list-disc pl-3 space-y-0.5 text-[8.5px] leading-tight">
                        <li>
                          Engineered distributed event ingestion pipeline using
                          Go and Kafka.
                        </li>
                        <li>
                          Reduced database contention by 32% under peak holiday
                          load.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="my-2 border-b border-zinc-400" />
                  <div>
                    <h5 className="font-serif text-[10px] font-bold tracking-wider uppercase text-zinc-800">
                      Technical Skills
                    </h5>
                    <p className="mt-1 text-[8.5px] text-zinc-700">
                      <strong className="font-semibold">Languages:</strong> Go,
                      TypeScript, Python, SQL, LaTeX
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
                Compiled via dedicated Docker TeX Live sandbox
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* KEY CAPABILITIES */}
      <section
        id="features"
        className="border-t border-border bg-card/40 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Key Capabilities
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Engineered for technical resumes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Everything software engineers need to build, tailor, and compile
              an ATS-friendly resume.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="flex flex-col border border-border bg-background p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex size-10 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                    {cap.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-t border-border py-16 lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              How It Works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Three straightforward steps
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              No complex setup or proprietary lock-in. Just clean structure and
              targeted tailoring.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="relative border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="font-mono text-3xl font-bold text-primary/40">
                  0{item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {item.step}. {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / TRUTH SECTION */}
      <section
        id="trust"
        className="border-t border-border bg-card/30 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="inline-flex size-12 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Tailored without making things up.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            ArqeloCV can rewrite, reorder, and emphasize the experience already
            supported by your resume and projects. Missing skills stay missing
            until you provide evidence for them.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 text-left">
            <div className="border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground">
                Grounded in Source
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Every AI bullet suggestion links directly to verbatim excerpts
                from your original background.
              </p>
            </div>
            <div className="border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground">
                Deterministic LaTeX
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Single-column output compiled via dedicated TeX service,
                eliminating broken parser glyphs.
              </p>
            </div>
            <div className="border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground">
                Local Workspace Storage
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Documents and history stay in your browser&apos;s IndexedDB. No
                cloud resume repository.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="border-t border-border py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Frequently Asked Questions
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Answers to common questions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Direct, concise information about ATS compatibility, factuality,
              and formats.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group border border-border bg-card p-5 transition-colors open:border-primary/50"
                {...(index === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground focus:outline-none">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="size-4 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <span className="ml-4 font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border bg-card/50 py-16 lg:py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Build a better engineering resume.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Import your existing resume and let ArqeloCV handle the structure,
            writing, and tailoring.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={scrollToUpload} className="px-6 text-sm">
              Build Your Resume <ArrowRight className="ml-2 size-4" />
            </Button>
            {onStartSample && (
              <Button
                variant="outline"
                size="lg"
                onClick={onStartSample}
                className="px-6 text-sm"
              >
                Start with Sample Resume
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* SEMANTIC FOOTER */}
      <footer className="border-t border-border bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid size-7 place-items-center border border-primary/40 bg-primary/10 text-xs font-black text-primary">
              A
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground">
                ArqeloCV
              </span>
              <p className="text-[10px] text-muted-foreground">
                AI resume builder for software engineers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <a
              href="#how-it-works"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              Features
            </a>
            <a
              href="#faq"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              FAQ
            </a>
            <a
              href="/llms.txt"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              llms.txt
            </a>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline underline-offset-4"
            >
              GitHub <ArrowUpRight className="size-3" />
            </a>
          </div>

          <div className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground sm:items-end">
            <p>
              Made by{" "}
              <a
                href="https://ashutoshtiwari.dev"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Ashutosh
              </a>
            </p>
            <p className="text-[10px] text-muted-foreground/80">
              © {new Date().getFullYear()} ArqeloCV · Local workspace storage
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

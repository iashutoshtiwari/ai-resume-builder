import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileCode2,
  HelpCircle,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react";

export function LandingContent() {
  const steps = [
    {
      num: "01",
      title: "Import Existing Resume",
      desc: "Upload a PDF, Microsoft Word (.docx), LaTeX (.tex), or paste plain text. Extraction runs locally and structures your background into clean JSON entities.",
    },
    {
      num: "02",
      title: "Analyze Job Requirements",
      desc: "Paste any job posting. The AI extracts technical qualifications, core competencies, and responsibilities, mapping them directly against your background.",
    },
    {
      num: "03",
      title: "Review Evidence-Grounded Diffs",
      desc: "Inspect atomic bullet proposals. Every suggestion is anchored to verbatim evidence from your resume—never hallucinating metrics or unearned skills.",
    },
    {
      num: "04",
      title: "Compile ATS LaTeX PDF",
      desc: "Compile your approved resume into an ATS-optimized, high-resolution PDF directly in your browser using the local WebAssembly TeX Live engine.",
    },
  ];

  const advantages = [
    {
      icon: Cpu,
      title: "In-Browser WebAssembly TeX Engine",
      summary:
        "Compiles with real pdfLaTeX via Siglum WebAssembly in a browser worker. No server queue, no TeX Live installation, and zero telemetry.",
    },
    {
      icon: ShieldCheck,
      title: "Zero-Hallucination Semantic Guardrails",
      summary:
        "Every AI proposal is verified against your actual background. If a claim or metric lacks evidence, the validator rejects it before review.",
    },
    {
      icon: Lock,
      title: "Client-Side Privacy by Architecture",
      summary:
        "Your resume data and generated PDFs stay in your browser's IndexedDB. We do not store, log, or train on your personal documents.",
    },
    {
      icon: Layers,
      title: "100% Deterministic ATS Layouts",
      summary:
        "Clean single-column LaTeX ensures Applicant Tracking Systems parse your name, contacts, roles, and dates with 100% fidelity.",
    },
  ];

  const faqs = [
    {
      q: "Why is LaTeX superior to Word or drag-and-drop builders for ATS systems?",
      a: "Applicant Tracking Systems (ATS) use automated text parsers to ingest candidate documents. Visual builders often generate nested HTML tables, multi-column bounding boxes, and non-standard character glyphs that scramble chronological order or discard skills entirely. LaTeX outputs deterministic typographic glyphs in a clean, semantic stream that ATS engines parse with near 100% accuracy.",
    },
    {
      q: "How does evidence-grounding prevent AI resume hallucinations?",
      a: "Generic AI assistants often invent metrics ('increased revenue by 40%') or add buzzwords you never practiced. AI Resume Builder enforces strict Zod semantic validators: every proposed bullet revision must cite verbatim evidence from your original experience. The system prevents turning unproven skill gaps into fabricated accomplishments.",
    },
    {
      q: "Are my personal details or resumes stored on your servers?",
      a: "No. Your resume, job descriptions, and compiled PDFs are saved solely in your local browser storage (IndexedDB). When you use an AI action, text is sent securely to the configured AI provider (Google Gemini or OpenRouter) strictly for processing and is never stored in a backend resume database.",
    },
    {
      q: "Can I use AI Resume Builder without an AI API key?",
      a: "Yes. You can import LaTeX resumes based on our canonical template, edit them in our structured workspace, preview real-time changes, and compile high-resolution PDFs completely offline and without any API key.",
    },
    {
      q: "What file formats can I import?",
      a: "You can import resumes in PDF format, Microsoft Word (.docx), LaTeX (.tex), or plain text. You can also start instantly with our pre-loaded Software Engineer sample template.",
    },
  ];

  return (
    <div className="border-t border-border bg-background/50 text-foreground">
      {/* SECTION 1: How it Works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            End-to-End Workflow
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            How evidence-grounded tailoring works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            From raw document to an ATS-ready LaTeX PDF in four verifiable steps.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.num}
              className="relative border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="font-mono text-2xl font-bold text-primary/40">
                {step.num}
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 2: Technical Advantages & Comparison */}
      <section className="border-y border-border bg-card/40 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Architectural Rigor
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Engineered for precision, not guesswork
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Why engineers and technical professionals trust our local LaTeX compilation and strict semantic validation over generic chatbot prompts.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((adv) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.title}
                  className="flex flex-col border border-border bg-background p-6"
                >
                  <div className="flex size-9 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-foreground">
                    {adv.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {adv.summary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="mt-16 overflow-hidden border border-border bg-background">
            <div className="border-b border-border bg-card px-6 py-4">
              <h3 className="text-sm font-medium">
                Feature Comparison: AI Resume Builder vs. Generic Resume Builders
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-card/50 text-muted-foreground">
                    <th className="p-4 font-medium">Capability</th>
                    <th className="p-4 font-medium text-primary">AI Resume Builder</th>
                    <th className="p-4 font-medium">Traditional AI Resume Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-4 font-medium">Typography & Typesetting</td>
                    <td className="p-4 text-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Deterministic pdfLaTeX
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">Fragile HTML/CSS to PDF convertors</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Hallucination Prevention</td>
                    <td className="p-4 text-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Evidence-grounded schema validation
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">Unconstrained LLM prompts that invent metrics</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">ATS Parse Rate</td>
                    <td className="p-4 text-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> 100% standard single-column text stream
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">Prone to column collisions and broken OCR</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Data Storage & Privacy</td>
                    <td className="p-4 text-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Browser IndexedDB only
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">Resumes saved in cloud databases</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">LaTeX Toolchain Required</td>
                    <td className="p-4 text-foreground">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Zero (WebAssembly in browser)
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">Manual TeX Live or Overleaf account</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: AEO FAQ Accordion */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Frequently Asked Questions
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to know about AI Resume Builder
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Direct answers on ATS compliance, evidence grounding, and local compilation.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={faq.q}
              className="group border border-border bg-card p-5 transition-colors open:border-primary/50"
              {...(index === 0 ? { open: true } : {})}
            >
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground focus:outline-none">
                <span className="flex items-center gap-3">
                  <HelpCircle className="size-4 text-primary shrink-0" />
                  {faq.q}
                </span>
                <span className="ml-4 font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* SECTION 4: Semantic Footer */}
      <footer className="border-t border-border bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid size-7 place-items-center border border-primary/40 bg-primary/10">
              <FileCode2 className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              AI Resume Builder
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              v0.1 · Evidence-Grounded LaTeX
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <a
              href="/llms.txt"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              llms.txt
            </a>
            <a
              href="/llms-full.txt"
              className="hover:text-foreground hover:underline underline-offset-4"
            >
              Full Spec (GEO)
            </a>
            <a
              href="https://github.com/iashutoshtiwari/ai-resume-builder"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline underline-offset-4"
            >
              GitHub <ArrowUpRight className="size-3" />
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Local browser compilation · Zero cloud storage of candidate resumes
          </p>
        </div>
      </footer>
    </div>
  );
}

import {
  IconArrowRight,
  IconArrowUpRight,
  IconFileCode,
  IconHelpCircle,
  IconShieldCheck,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function LandingContent({
  onStartSample,
}: {
  onStartSample?: () => void;
}) {
  const capabilities = [
    {
      icon: IconUpload,
      title: "Build from what you already have",
      description:
        "Upload your PDF, DOCX, or LaTeX resume, or paste your existing content. ArqeloCV structures it into an engineering-focused resume.",
    },
    {
      icon: IconSparkles,
      title: "Tailor for a specific job",
      description:
        "Paste a job description to see how your experience matches and generate a more relevant version of your resume.",
    },
    {
      icon: IconShieldCheck,
      title: "Grounded in your experience",
      description:
        "ArqeloCV can emphasize relevant skills and projects without adding unsupported technologies, responsibilities, or achievements.",
    },
    {
      icon: IconFileCode,
      title: "Export a professional resume",
      description:
        "Generate a clean, ATS-friendly resume and export it as PDF using deterministic single-column LaTeX compilation.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Import your current resume",
      description:
        "Upload a PDF, Word document, or LaTeX file. ArqeloCV extracts structured sections without altering your career history.",
    },
    {
      step: "2",
      title: "Tailor against a target role",
      description:
        "Provide a job description. The AI analyzes requirements, suggests evidence-grounded revisions, and computes a job match score.",
    },
    {
      step: "3",
      title: "Compile and export",
      description:
        "Review every change atomically with word diffs. Compile with pdfLaTeX via our dedicated microservice and download vector PDF or LaTeX source.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI ensure it doesn't invent experience?",
      answer:
        "The system prompt strictly instructs the model to only use facts present in your uploaded resume. Every suggested change is presented as an atomic diff that you can accept, reject, or edit before applying.",
    },
    {
      question: "What LaTeX compiler is used?",
      answer:
        "PDF compilation uses a dedicated microservice running TeX Live with pdfLaTeX. If the microservice is unreachable, you can always export the generated LaTeX source (.tex) and compile locally.",
    },
    {
      question: "Can I edit the LaTeX source directly?",
      answer:
        "Yes. The workspace provides a Monaco-powered LaTeX editor tab. You can make direct edits and recompile, or switch back to structured editing.",
    },
    {
      question: "Where is my data stored?",
      answer:
        "Your workspace is stored entirely in your browser using IndexedDB. Nothing is persisted to a server database. AI requests are processed statelessly without retaining your resume data.",
    },
    {
      question: "What file formats are accepted for import?",
      answer:
        "You can upload PDF (.pdf), Word (.docx), LaTeX (.tex), or plain text (.txt). You can also paste text directly or start from our canonical software engineer template.",
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
      {/* KEY CAPABILITIES */}
      <section
        id="features"
        className="border-t border-border bg-card/40 py-16 lg:py-24"
      >
        <div className="mx-auto max-w-7xl 3xl:max-w-[1680px] px-4 sm:px-6">
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
        <div className="mx-auto max-w-7xl 3xl:max-w-[1680px] px-4 sm:px-6">
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
            <IconShieldCheck className="size-6" />
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
                    <IconHelpCircle className="size-4 text-primary shrink-0" />
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
              Build Your Resume <IconArrowRight className="ml-2 size-4" />
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
        <div className="mx-auto flex max-w-7xl 3xl:max-w-[1680px] flex-col items-center justify-between gap-6 sm:flex-row">
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
              GitHub <IconArrowUpRight className="size-3" />
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

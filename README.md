# AI Resume Builder v0.1

An evidence-grounded resume tailoring workspace built with Next.js. Structured JSON is the resume source of truth, LaTeX generation is deterministic, AI suggestions require explicit approval, and PDF compilation runs locally in the browser.

## Start locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. PDF, DOCX, and plain-text structuring plus tailoring require an AI key from either Google AI Studio (Free tier supported) or OpenRouter. Known-template LaTeX import, editing, rendering, compilation, formatting presets, guidance audits, and export remain usable without AI.

```dotenv
# Provider: 'google' (default) or 'openrouter'
AI_PROVIDER=google

# Google AI Studio
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash

# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
```

No secret is exposed through a `NEXT_PUBLIC_*` variable.

## Architecture

- `main.tex` is unchanged and remains the canonical supported import fixture.
- Resume, job, comparison, change, compile, and workspace contracts are Zod schemas under `src/features`.
- `extractTextFromFile` supports PDF (`pdfjs-dist`), Word DOCX (`mammoth`), LaTeX, and plain text.
- `KnownTemplateImporter` handles the bundled article template deterministically; uncertain templates fall back to the server-only AI provider (Google Gemini or OpenRouter).
- `renderResumeToLatex` owns deterministic source generation and escaping across canonical, compact, and minimal presets.
- Zustand holds the active workspace and bounded session history. IndexedDB persists one versioned workspace and the last successful PDF after a 750 ms debounce.
- Four Node.js route handlers expose parse, analyze, tailor, and proofread operations. Prompts treat all document text as untrusted, use no tools, and validate JSON both structurally and semantically.
- Siglum runs pdfLaTeX in a browser worker with TeX Live 2025 bundles, same-origin on-demand package proxying, and browser caches. Users can attach workspace-scoped `.sty`, `.cls`, bibliography, image, and pdfLaTeX font support files for custom templates.

## Privacy and factuality

Local documents remain in browser storage unless an AI action or uncertain import requires an AI provider. Structured outputs use JSON Schema plus local Zod and semantic validation. The application never logs resumes, job descriptions, prompts, model output, email addresses, or phone numbers.

Before a proposal reaches review, it is checked for valid targets, exact source text, exact evidence, known requirement IDs, duplicate targets, invented metrics, unsupported technologies, and attempts to convert unsupported gaps into applicable changes.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright screenshots are written to `artifacts/` for the bounded visual review at 390×844, 1024×768, and 1440×900.

## Current constraints

- One local workspace and one supported template.
- Browser compilation requires cross-origin isolation and WebAssembly.
- Gemini availability and quotas depend on the configured billing-enabled project.
- Browser TeX Live has broad package and font coverage, but documents requiring unrestricted shell escape or unsupported native binaries will not match Overleaf.
- Authentication, cloud sync, analytics, cover letters, model selection, autonomous agents, and server-side compilation are out of scope.

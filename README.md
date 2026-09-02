# AI Resume Builder v0.1

An evidence-grounded resume tailoring workspace built with Next.js. Structured JSON is the resume source of truth, LaTeX generation is deterministic, AI suggestions require explicit approval, and PDF compilation runs locally in the browser.

## Start locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. AI features require a Google AI Studio key; import, editing, rendering, compilation, and export do not.

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

No secret is exposed through a `NEXT_PUBLIC_*` variable.

## Architecture

- `main.tex` is unchanged and remains the canonical supported import fixture.
- Resume, job, comparison, change, compile, and workspace contracts are Zod schemas under `src/features`.
- `extractTextFromFile` supports PDF (`pdfjs-dist`), Word DOCX (`mammoth`), LaTeX, and plain text.
- `KnownTemplateImporter` handles the bundled article template deterministically; uncertain templates fall back to the server-only Gemini provider.
- `renderResumeToLatex` owns deterministic source generation and escaping.
- Zustand holds the active workspace and bounded session history. IndexedDB persists one versioned workspace and the last successful PDF after a 750 ms debounce.
- Four Node.js route handlers expose parse, analyze, tailor, and proofread operations. Prompts treat all document text as untrusted, use no tools, and validate JSON both structurally and semantically.
- Siglum runs pdfLaTeX in a browser worker with CTAN fetching disabled. Runtime bundles and WASM are loaded from Siglum’s CDN and cached by the browser; the worker is copied locally during `postinstall`.

## Privacy and factuality

Local documents remain in browser storage unless an AI action or uncertain import requires Gemini. Structured outputs use official Gemini JSON modes. The application never logs resumes, job descriptions, prompts, model output, email addresses, or phone numbers.

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
- The free AI model can be rate limited or unavailable.
- Authentication, cloud sync, analytics, cover letters, model selection, autonomous agents, and server-side compilation are out of scope.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Resume Builder — Agent Guide

## Stack

Next.js 16 App Router · TypeScript (strict) · React 19 · Tailwind CSS 4 · shadcn/ui · Zustand · React Hook Form · Zod 4 · IndexedDB (idb) · Google AI (Gemini SDK) + OpenRouter · Siglum WebAssembly LaTeX · Monaco · PDF.js

## Architecture

- `src/features/` — Feature-sliced modules: changes, guidance, import, jobs, latex, presentation, resume, workspace
- `src/lib/ai/` — AI providers (CommonResumeAIProvider), OpenRouter driver, prompts, semantic validation
- `src/lib/document/` — PDF/DOCX/LaTeX/text extraction
- `src/lib/storage/` — IndexedDB workspace persistence
- `src/store/` — Zustand workspace store with bounded undo/redo
- `src/app/api/ai/` — Four route handlers: parse-resume, analyze-job, tailor, proofread
- `main.tex` — Canonical LaTeX template fixture (do NOT modify)
- `public/latex-packages/` — Statically bundled TeX Live packages and fonts

## Key Conventions

- ResumeSchema is the source of truth; LaTeX is deterministic output
- AI prompts treat all document text as untrusted; no tools; JSON Schema output
- Compilation is explicit (never on edit); structured edits mark overrides stale
- All AI changes are atomic, evidence-grounded, diffable, and require explicit acceptance
- `server-only` guards all AI/provider modules from client bundles
- Cross-origin isolation headers required for WebAssembly compilation (configured in next.config.ts)
- Unused shadcn components are not scaffolded — add via `npx shadcn add <component>` when needed

## Design System

- Dark zinc workspace surfaces with paper-white PDF preview
- Green = primary/accepted; amber = stale/review; red = destructive/failed
- DM Sans for body text · Geist for headings · Geist Mono for state/source labels
- Compact controls, hairline borders, minimal shadows, square work surfaces
- All states communicated with text/icon — never color alone
- Animations respect `prefers-reduced-motion`

## Commands

```
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests
```

## Testing

- Vitest unit tests live beside source files (`*.test.ts`)
- Playwright E2E tests in `tests/e2e/`
- Screenshots written to `artifacts/` (gitignored)

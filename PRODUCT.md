# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, strict TypeScript, React, Tailwind CSS, shadcn/ui, Zustand, React Hook Form, Zod, IndexedDB, Google AI Studio (Gemini SDK), Siglum WebAssembly LaTeX, Monaco, and PDF.js. The app is desktop-first and remains deployable to a conventional Next.js host.

## Users

Resume owners—especially technical candidates—who already maintain a LaTeX resume and need to tailor it to a job without surrendering factual control to an AI system.

## Product Purpose

Import a LaTeX resume into structured data, compare it with a job description, review evidence-grounded AI suggestions one by one, proofread independently, and deterministically compile the accepted result back to PDF and LaTeX.

## Positioning

AI proposes atomic, auditable changes against stable resume entities; unsupported requirements remain visible gaps, and no model-generated statement enters the final resume without evidence and explicit acceptance.

## Operating Context

Users work in a dense desktop editor with their structured resume, a target job, a Git-style change queue, advanced LaTeX source, and a PDF preview visible together. Files and generated documents persist locally; AI runs only when explicitly invoked.

## Capabilities and Constraints

Version 0.1 supports one local workspace, the supplied `main.tex` template, deterministic rendering, browser-side compilation, Google Gemini-backed parsing/analysis/tailoring/proofreading, PDF/LaTeX export, and refresh recovery. It excludes accounts, cloud databases, payments, cover letters, job tracking, multiple templates, autonomous agents, and server-side compilation.

## Brand Commitments

Working name: AI Resume Builder. Voice: direct, calm, technically credible, and transparent. Supporting line: “AI suggests. You decide.” The interface must feel like a professional developer productivity tool rather than a generic AI SaaS dashboard.

## Evidence on Hand

`main.tex` is the preserved supported-template source and sanitized import/compile fixture. No testimonials, customer metrics, or commercial claims exist and none should be invented.

## Product Principles

- Truth and user control outrank keyword coverage.
- ResumeSchema is canonical; LaTeX is deterministic output.
- Unsupported requirements are gaps, never silent additions.
- Local processing and persistence are preferred wherever practical.
- Complex states should remain inspectable, reversible, and explainable.

## Accessibility & Inclusion

All core workflows must be keyboard usable, have visible focus, semantic labels and headings, sufficient contrast, reduced-motion support, and accepted/rejected states that do not rely on color alone.

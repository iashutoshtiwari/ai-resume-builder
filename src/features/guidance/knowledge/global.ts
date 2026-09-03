import type { GuidanceChunk } from "@/features/guidance/schema";

export const GLOBAL_KNOWLEDGE: GuidanceChunk[] = [
  {
    id: "kb-factual-evidence",
    title: "Ground in factual evidence",
    guidance:
      "A resume can present genuine experience strategically, but it must never fabricate unearned experience. Never add an employer, credential, technology, metric, or scope that the candidate did not supply.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["analyze", "tailor", "build"],
    sections: ["global"],
    tags: ["facts", "evidence", "truth", "metrics", "technology"],
    mandatory: true,
  },
  {
    id: "kb-action-verbs",
    title: "Open with precise action verbs",
    guidance:
      "Begin every bullet point with a strong, precise past-tense action verb (built, designed, engineered, implemented, reduced, automated, optimized). Avoid passive or weak openings like 'assisted with', 'worked on', 'responsible for', or 'helped'.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["tailor", "build", "format"],
    sections: ["bullets", "experience", "projects"],
    tags: ["action", "verb", "built", "designed", "implemented", "leadership"],
    mandatory: true,
  },
  {
    id: "kb-star-car-xyz",
    title: "Frame bullets with action and impact (XYZ / STAR)",
    guidance:
      "Structure accomplishments to explain what was done, the engineering challenge or tools used, and the measurable or observable outcome. Follow 'Accomplished [X], as measured by [Y], by doing [Z]'. If a metric is unavailable, emphasize technical outcome over filler.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["tailor", "build"],
    sections: ["bullets", "experience", "projects"],
    tags: ["star", "car", "xyz", "action", "result", "impact", "engineering"],
    mandatory: true,
  },
  {
    id: "kb-concise-bullets",
    title: "Keep bullets concise and scannable",
    guidance:
      "Aim for 1–2 rendered lines per bullet. Remove redundant filler adjectives, adverbs, and fluff. Never use personal pronouns (I, we, us, my, our). Avoid ending sentence fragments with arbitrary punctuation.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["tailor", "build", "format"],
    sections: ["bullets"],
    tags: ["concise", "length", "pronouns", "filler", "scannable"],
    mandatory: false,
  },
  {
    id: "kb-single-column-ats",
    title: "Enforce single-column ATS readability",
    guidance:
      "Applicant Tracking Systems and human screeners read top-to-bottom in a predictable single-column hierarchy. Avoid multi-column text tables, progress bars, graphic icons, and embedded text boxes.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["format", "build"],
    sections: ["global"],
    tags: ["ats", "layout", "single-column", "hierarchy", "parsing"],
    mandatory: false,
  },
  {
    id: "kb-page-budget",
    title: "Budget toward 1 page without visual compression",
    guidance:
      "Software engineers with under 8–10 years of experience should prioritize a clean 1-page resume. Never force 1 page by using microscopic fonts, zero margins, or dense walls of text; prefer prioritizing high-impact content over compressing low-value details.",
    category: "global",
    locale: "general",
    applicability: "general",
    tasks: ["format", "tailor", "build"],
    sections: ["global"],
    tags: ["page", "length", "one-page", "density", "margins"],
    mandatory: false,
  },
];

import type { GuidanceChunk } from "@/features/guidance/schema";

export const SECTIONS_KNOWLEDGE: GuidanceChunk[] = [
  {
    id: "kb-section-skills-grouping",
    title: "Group technical skills logically",
    guidance:
      "Organize skills into concise labeled categories (e.g., Languages, Frameworks & Libraries, Cloud & Infrastructure, Databases, Developer Tools). Never use subjective proficiency meters, star ratings, or progress bars. Separate skills with commas.",
    category: "sections",
    locale: "general",
    applicability: "general",
    tasks: ["build", "tailor", "format"],
    sections: ["skills"],
    tags: ["skills", "categories", "languages", "frameworks", "tools"],
    mandatory: false,
  },
  {
    id: "kb-section-summary-conditional",
    title: "Keep summary conditional and concise (max 2–3 lines)",
    guidance:
      "Omit a summary for students, new grads, and standard early-to-mid career engineers. Include a summary only when providing valuable framing: senior/staff scope, career change, or returning after an extended leave. Never write generic platitudes like 'hardworking engineer seeking exciting opportunity'.",
    category: "sections",
    locale: "general",
    applicability: "general",
    tasks: ["build", "tailor"],
    sections: ["summary"],
    tags: ["summary", "positioning", "conditional", "concise"],
    mandatory: false,
  },
  {
    id: "kb-section-experience-depth",
    title: "Prioritize production impact in work experience",
    guidance:
      "For each role, lead with the most impressive supported accomplishment. Connect system actions to business value, latency reduction, user throughput, or developer velocity. Keep chronological order with clear dates (Month Year – Month Year / Present).",
    category: "sections",
    locale: "general",
    applicability: "general",
    tasks: ["build", "tailor"],
    sections: ["experience"],
    tags: ["experience", "impact", "outcomes", "chronological"],
    mandatory: true,
  },
  {
    id: "kb-section-projects-engineering",
    title: "Demonstrate architectural depth in projects",
    guidance:
      "Highlight problem solved, technical choices (e.g. why PostgreSQL vs MongoDB, or WebSockets vs polling), testing, and deployment. Emphasize original engineering over standard classroom clones (like basic todo apps or weather dashboards).",
    category: "sections",
    locale: "general",
    applicability: "general",
    tasks: ["build", "tailor"],
    sections: ["projects"],
    tags: ["projects", "architecture", "technical-depth", "decisions"],
    mandatory: false,
  },
  {
    id: "kb-section-certifications-achievements",
    title: "Surface verified credentials and achievements",
    guidance:
      "List recognized cloud and technical certifications (e.g. AWS Certified Solutions Architect, CKA) and notable achievements (hackathon wins, competitive programming ranks, open source contributions). Keep these concise to avoid consuming space needed for work experience.",
    category: "sections",
    locale: "general",
    applicability: "general",
    tasks: ["build", "tailor"],
    sections: ["certifications", "achievements"],
    tags: ["certifications", "achievements", "credentials", "hackathons"],
    mandatory: false,
  },
];

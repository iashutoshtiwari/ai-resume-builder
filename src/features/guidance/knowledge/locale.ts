import type { GuidanceChunk } from "@/features/guidance/schema";

export const LOCALE_KNOWLEDGE: GuidanceChunk[] = [
  {
    id: "kb-locale-india-relevance",
    title: "India tech hiring: Technical clarity and academic conventions",
    guidance:
      "In Indian tech hiring (product companies, GCCs, startups), recruiters prioritize exact tech stack alignment, competitive coding or project depth, and degrees (e.g., B.Tech / M.Tech in Computer Science / Information Technology with CGPA or percentage when strong). Never include unnecessary personal demographics such as photo, religion, caste, marital status, gender, or parents' names.",
    category: "locale",
    locale: "india",
    applicability: "india",
    tasks: ["build", "tailor", "format"],
    sections: ["education", "contact", "skills"],
    tags: ["india", "btech", "cgpa", "contact", "privacy"],
    mandatory: false,
  },
  {
    id: "kb-locale-na-conventions",
    title: "North America conventions: Strict privacy and impact quantification",
    guidance:
      "For US and Canada roles, keep resumes strictly privacy-compliant (no full street address, no photo, no citizenship/visa details unless applying for defense/clearance roles). Focus on business metrics, product scale, and engineering outcomes. GPA is typically omitted unless a current student or recent graduate with high honors.",
    category: "locale",
    locale: "us-canada",
    applicability: "us-canada",
    tasks: ["build", "tailor", "format"],
    sections: ["contact", "experience", "education"],
    tags: ["us-canada", "privacy", "gpa", "address", "metrics"],
    mandatory: false,
  },
];

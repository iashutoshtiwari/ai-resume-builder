/**
 * Central site configuration for ArqeloCV.
 * Production URL and canonical origin: https://arqelo.ashutoshtiwari.dev
 */

export const siteConfig = {
  name: "ArqeloCV",
  shortName: "ArqeloCV",
  tagline: "AI Resume Builder for Software Engineers",
  title: "ArqeloCV — AI Resume Builder for Software Engineers",
  description:
    "ArqeloCV is an AI resume builder for software engineers. Build, improve, score, and tailor your resume to job descriptions without inventing experience.",
  url: "https://arqelo.ashutoshtiwari.dev",
  canonical: "https://arqelo.ashutoshtiwari.dev/",
  githubUrl: "https://github.com/iashutoshtiwari/ai-resume-builder",
  authors: [
    {
      name: "Ashutosh Tiwari",
      url: "https://ashutoshtiwari.dev",
    },
  ],
  creator: "ArqeloCV",
  publisher: "ArqeloCV",
  category: "Productivity",
  keywords: [
    "AI resume builder for software engineers",
    "software engineering resume",
    "resume tailoring",
    "job description matching",
    "ATS-friendly resume",
    "LaTeX resume",
    "resume builder",
    "AI resume tailoring",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

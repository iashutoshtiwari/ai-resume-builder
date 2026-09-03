import { z } from "zod";

export const RenderedSectionSchema = z.enum([
  "summary",
  "experience",
  "skills",
  "projects",
  "education",
  "certifications",
  "achievements",
]);

export const ResumePresentationSchema = z.object({
  paperSize: z.enum(["letter", "a4"]),
  sections: z.array(RenderedSectionSchema).min(1).max(8).refine(
    (sections) => new Set(sections).size === sections.length,
    "Resume sections must be unique.",
  ),
}).strict();

export type RenderedSection = z.infer<typeof RenderedSectionSchema>;
export type ResumePresentation = z.infer<typeof ResumePresentationSchema>;

export const DEFAULT_PRESENTATION: ResumePresentation = {
  paperSize: "letter",
  sections: [
    "summary",
    "skills",
    "experience",
    "projects",
    "certifications",
    "achievements",
    "education",
  ],
};

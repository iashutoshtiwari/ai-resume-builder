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

export const FontFamilySchema = z.enum([
  "xcharter",
  "tex-gyre-heros",
  "lato",
  "latin-modern",
  "newtx",
  "newpx",
  "ebgaramond",
  "libertine",
  "roboto",
  "sourcesanspro",
  "inter",
  "firasans",
  "inconsolata",
]);

export const ResumePresentationSchema = z.object({
  templateId: z.enum(["canonical", "compact", "minimal"]),
  fontFamily: FontFamilySchema,
  paperSize: z.enum(["letter", "a4"]),
  fontSize: z.union([z.literal(10.5), z.literal(11), z.literal(12)]),
  margin: z.union([z.literal(0.4), z.literal(0.5), z.literal(0.65)]),
  density: z.enum(["compact", "balanced", "relaxed"]),
  sections: z.array(RenderedSectionSchema).min(1).max(8).refine(
    (sections) => new Set(sections).size === sections.length,
    "Resume sections must be unique.",
  ),
});

export type RenderedSection = z.infer<typeof RenderedSectionSchema>;
export type FontFamily = z.infer<typeof FontFamilySchema>;
export type ResumePresentation = z.infer<typeof ResumePresentationSchema>;

export const DEFAULT_PRESENTATION: ResumePresentation = {
  templateId: "canonical",
  fontFamily: "xcharter",
  paperSize: "letter",
  fontSize: 11,
  margin: 0.5,
  density: "balanced",
  sections: ["skills", "experience", "projects", "education"],
};

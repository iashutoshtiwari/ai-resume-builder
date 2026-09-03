import { z } from "zod";

const IdSchema = z.string().min(1).max(160);

export const LinkSchema = z.object({
  id: IdSchema,
  label: z.string().min(1).max(160),
  url: z.string().min(1).max(2048),
});

export const TextItemSchema = z.object({ id: IdSchema, text: z.string().min(1).max(2000) });
export const NamedItemSchema = z.object({ id: IdSchema, name: z.string().min(1).max(160) });

export const ResumeBasicsSchema = z.object({
  name: z.string().min(1).max(160),
  headline: z.string().max(240).optional(),
  email: z.string().max(254).optional(),
  phone: z.string().max(80).optional(),
  location: z.string().max(160).optional(),
  links: z.array(LinkSchema).max(12),
});

export const ExperienceSchema = z.object({
  id: IdSchema,
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  location: z.string().max(160).optional(),
  startDate: z.string().max(80),
  endDate: z.string().max(80),
  bullets: z.array(TextItemSchema).max(30),
});

export const ProjectSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  technologies: z.array(NamedItemSchema).max(40),
  links: z.array(LinkSchema).max(12),
  bullets: z.array(TextItemSchema).max(30),
});

export const SkillGroupSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(120),
  skills: z.array(NamedItemSchema).max(80),
});

export const EducationSchema = z.object({
  id: IdSchema,
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().max(200).optional(),
  location: z.string().max(160).optional(),
  startDate: z.string().max(80).optional(),
  endDate: z.string().max(80).optional(),
  details: z.array(TextItemSchema).max(20),
});

export const CertificationSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional(),
  date: z.string().max(80).optional(),
  url: z.string().max(2048).optional(),
});

export const AchievementSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(600).optional(),
  date: z.string().max(80).optional(),
});

export const CareerStageSchema = z.enum([
  "student",
  "new-graduate",
  "early-career",
  "mid-level",
  "senior",
  "staff-principal",
  "career-changer",
  "returning-professional",
]);

export const ResumeSchema = z.object({
  version: z.literal(1),
  basics: ResumeBasicsSchema,
  summary: z.string().max(1000).optional(),
  skills: z.array(SkillGroupSchema).max(30),
  experience: z.array(ExperienceSchema).max(30),
  projects: z.array(ProjectSchema).max(30),
  education: z.array(EducationSchema).max(20),
  certifications: z.array(CertificationSchema).max(30).optional(),
  achievements: z.array(AchievementSchema).max(30).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeDocument = Resume;
export type TextItem = z.infer<typeof TextItemSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type CareerStage = z.infer<typeof CareerStageSchema>;

export type ResumeSection =
  | "overview"
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications"
  | "achievements";

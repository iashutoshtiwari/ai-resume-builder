import { z } from "zod";
import {
  AchievementSchema,
  CareerStageSchema,
  CertificationSchema,
  EducationSchema,
  ExperienceSchema,
  ProjectSchema,
  ResumeBasicsSchema,
  SkillGroupSchema,
  type CareerStage,
  type Resume,
  type ResumeDocument,
} from "@/features/resume/schema";

export const CandidateOptionalContextSchema = z.object({
  careerChange: z.boolean().optional(),
  careerGap: z.boolean().optional(),
  targetRoles: z.array(z.string().min(1).max(120)).max(10).optional(),
});

export const CandidateProfileSchema = z.object({
  version: z.literal(1),
  personal: ResumeBasicsSchema,
  careerStage: CareerStageSchema,
  summaryContext: z.string().max(1000).optional(),
  skills: z.array(SkillGroupSchema).max(50),
  experience: z.array(ExperienceSchema).max(50),
  projects: z.array(ProjectSchema).max(50),
  certifications: z.array(CertificationSchema).max(50).default([]),
  achievements: z.array(AchievementSchema).max(50).default([]),
  education: z.array(EducationSchema).max(30),
  optionalContext: CandidateOptionalContextSchema.optional(),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type CandidateOptionalContext = z.infer<typeof CandidateOptionalContextSchema>;

export function resumeToCandidateProfile(
  resume: Resume,
  careerStage: CareerStage = "mid-level",
  optionalContext?: CandidateOptionalContext,
): CandidateProfile {
  return {
    version: 1,
    personal: resume.basics,
    careerStage,
    summaryContext: resume.summary,
    skills: resume.skills,
    experience: resume.experience,
    projects: resume.projects,
    certifications: resume.certifications ?? [],
    achievements: resume.achievements ?? [],
    education: resume.education,
    optionalContext,
  };
}

export function candidateProfileToResumeDocument(
  profile: CandidateProfile,
  options?: {
    includeSummary?: boolean;
    selectedExperienceIds?: string[];
    selectedProjectIds?: string[];
    selectedSkillGroupIds?: string[];
    selectedEducationIds?: string[];
    selectedCertificationIds?: string[];
    selectedAchievementIds?: string[];
  },
): ResumeDocument {
  const expIds = options?.selectedExperienceIds ? new Set(options.selectedExperienceIds) : null;
  const projIds = options?.selectedProjectIds ? new Set(options.selectedProjectIds) : null;
  const skillIds = options?.selectedSkillGroupIds ? new Set(options.selectedSkillGroupIds) : null;
  const eduIds = options?.selectedEducationIds ? new Set(options.selectedEducationIds) : null;
  const certIds = options?.selectedCertificationIds ? new Set(options.selectedCertificationIds) : null;
  const achIds = options?.selectedAchievementIds ? new Set(options.selectedAchievementIds) : null;

  return {
    version: 1,
    basics: profile.personal,
    summary: options?.includeSummary ? profile.summaryContext : undefined,
    skills: skillIds ? profile.skills.filter((g) => skillIds.has(g.id)) : profile.skills,
    experience: expIds ? profile.experience.filter((e) => expIds.has(e.id)) : profile.experience,
    projects: projIds ? profile.projects.filter((p) => projIds.has(p.id)) : profile.projects,
    education: eduIds ? profile.education.filter((ed) => eduIds.has(ed.id)) : profile.education,
    certifications: certIds ? profile.certifications.filter((c) => certIds.has(c.id)) : profile.certifications,
    achievements: achIds ? profile.achievements.filter((a) => achIds.has(a.id)) : profile.achievements,
  };
}

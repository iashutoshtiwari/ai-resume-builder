import { GUIDANCE_CORPUS, GUIDANCE_SNAPSHOT_VERSION } from "@/features/guidance/corpus";
import type { GuidanceContext, GuidanceSection, GuidanceTask } from "@/features/guidance/schema";
import type { TargetJob } from "@/features/jobs/schema";
import type { Resume } from "@/features/resume/schema";

const TOKEN = /[a-z0-9+#.]{2,}/g;
const STOP_WORDS = new Set(["and", "the", "for", "with", "from", "that", "this", "your", "you", "are", "our", "will", "into", "using"]);

function tokens(value: string): Set<string> {
  return new Set((value.toLowerCase().match(TOKEN) ?? []).filter((token) => !STOP_WORDS.has(token)));
}

function resumeText(resume: Resume): string {
  return [
    resume.basics.headline,
    ...resume.skills.flatMap((group) => [group.name, ...group.skills.map((skill) => skill.name)]),
    ...resume.experience.flatMap((entry) => [entry.role, entry.company, ...entry.bullets.map((bullet) => bullet.text)]),
    ...resume.projects.flatMap((project) => [project.name, project.description, ...project.technologies.map((technology) => technology.name), ...project.bullets.map((bullet) => bullet.text)]),
    ...resume.education.flatMap((entry) => [entry.degree, entry.field, entry.institution, ...entry.details.map((detail) => detail.text)]),
  ].filter(Boolean).join(" ");
}

export function retrieveGuidance(input: {
  task: GuidanceTask;
  resume: Resume;
  targetJob?: TargetJob | null;
  section?: GuidanceSection;
  limit?: number;
}): GuidanceContext {
  const query = tokens(`${resumeText(input.resume)} ${input.targetJob?.role ?? ""} ${input.targetJob?.description ?? ""} ${input.section ?? ""} ${input.task}`);
  const mandatory = GUIDANCE_CORPUS.filter((item) => item.mandatory);
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 6);
  const ranked = GUIDANCE_CORPUS
    .filter((item) => !item.mandatory)
    .map((item) => {
      const titleAndGuidance = tokens(`${item.title} ${item.guidance}`);
      let score = item.tasks.includes(input.task) ? 12 : 0;
      if (input.section && item.sections.includes(input.section)) score += 10;
      for (const tag of item.tags) {
        if (query.has(tag.toLowerCase())) score += 6;
        for (const tagToken of tokens(tag)) if (query.has(tagToken)) score += 2;
      }
      for (const token of titleAndGuidance) if (query.has(token)) score += 1;
      return { item, score };
    })
    .filter(({ item, score }) => item.tasks.includes(input.task) || score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
    .map(({ item }) => item);

  return { snapshotVersion: GUIDANCE_SNAPSHOT_VERSION, chunks: [...mandatory, ...ranked] };
}

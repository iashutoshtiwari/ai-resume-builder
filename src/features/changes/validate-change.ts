import type { JobAnalysis } from "@/features/jobs/schema";
import type { Resume } from "@/features/resume/schema";
import type { EvidenceReference, ResumeChange } from "@/features/changes/schema";
import { readTargetText } from "@/features/changes/apply-change";

export type ChangeValidation = { valid: true } | { valid: false; code: string; message: string };

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function resumeCorpus(resume: Resume): string {
  return normalize(JSON.stringify(resume));
}

export function resolveEvidence(resume: Resume, evidence: EvidenceReference): string | undefined {
  if (evidence.type === "resume") return JSON.stringify(resume);
  if (evidence.type === "experience") {
    const entity = resume.experience.find((item) => item.id === evidence.entityId);
    if (!entity) return undefined;
    return evidence.itemId ? entity.bullets.find((item) => item.id === evidence.itemId)?.text : JSON.stringify(entity);
  }
  if (evidence.type === "project") {
    const entity = resume.projects.find((item) => item.id === evidence.entityId);
    if (!entity) return undefined;
    return evidence.itemId ? entity.bullets.find((item) => item.id === evidence.itemId)?.text : JSON.stringify(entity);
  }
  if (evidence.type === "skill") {
    const entity = resume.skills.find((item) => item.id === evidence.entityId);
    if (!entity) return undefined;
    return evidence.itemId ? entity.skills.find((item) => item.id === evidence.itemId)?.name : JSON.stringify(entity);
  }
  const entity = resume.education.find((item) => item.id === evidence.entityId);
  if (!entity) return undefined;
  return evidence.itemId ? entity.details.find((item) => item.id === evidence.itemId)?.text : JSON.stringify(entity);
}

function numericClaims(value: string): string[] {
  return value.match(/(?:\$?\d[\d,.]*\s?(?:%|x|k|m|b|million|billion|users?)?)/gi) ?? [];
}

export function validateChangeAgainstResume(change: ResumeChange, resume: Resume, analysis?: JobAnalysis): ChangeValidation {
  for (const evidence of change.evidence) {
    const resolved = resolveEvidence(resume, evidence);
    if (!resolved) return { valid: false, code: "bad-evidence", message: "A cited resume item does not exist." };
    if (evidence.quote && !normalize(resolved).includes(normalize(evidence.quote))) {
      return { valid: false, code: "bad-evidence-quote", message: "An evidence quote does not match the cited resume item." };
    }
  }

  if (analysis) {
    const requirementIds = new Set(analysis.requirements.map((item) => item.id));
    if (change.jobRequirementIds.some((id) => !requirementIds.has(id))) return { valid: false, code: "bad-requirement", message: "A referenced job requirement does not exist." };
    const corpus = resumeCorpus(resume);
    const stopwords = new Set(["and", "with", "using", "experience", "knowledge", "skills", "required", "preferred", "proficiency", "in", "of", "or", "the", "a", "an"]);
    const unsupportedTechnology = analysis.requirements
      .filter((item) => item.category === "technology" && change.jobRequirementIds.includes(item.id))
      .find((item) => item.text.toLowerCase().match(/[a-z][a-z0-9.+#-]{2,}/g)?.filter((token) => !stopwords.has(token)).every((token) => !corpus.includes(token)));
    if (unsupportedTechnology) return { valid: false, code: "unsupported-technology", message: "The proposal introduces a job technology that is absent from resume evidence." };
  }

  if (change.type === "rewrite-text") {
    const current = readTargetText(resume, change.target);
    if (current === undefined) return { valid: false, code: "invalid-target", message: "The suggested resume target does not exist." };
    if (current !== change.before) return { valid: false, code: "source-mismatch", message: "The resume changed after this suggestion was created." };
    if (normalize(change.before) === normalize(change.after)) return { valid: false, code: "unchanged", message: "The suggestion does not change the source text." };
    const corpus = resumeCorpus(resume);
    const inventedMetric = numericClaims(change.after).find((claim) => !corpus.includes(normalize(claim)));
    if (inventedMetric) return { valid: false, code: "invented-metric", message: `The proposed metric “${inventedMetric}” is not present in the resume.` };
  }

  return { valid: true };
}

export function filterValidChanges(changes: ResumeChange[], resume: Resume, analysis?: JobAnalysis) {
  const targets = new Set<string>();
  const valid: ResumeChange[] = [];
  const rejected: Array<{ id: string; code: string; message: string }> = [];
  for (const change of changes) {
    const key = JSON.stringify(change.target);
    if (targets.has(key)) {
      rejected.push({ id: change.id, code: "duplicate-target", message: "Multiple suggestions target the same resume item." });
      continue;
    }
    const result = validateChangeAgainstResume(change, resume, analysis);
    if (!result.valid) rejected.push({ id: change.id, code: result.code, message: result.message });
    else {
      targets.add(key);
      valid.push(change);
    }
  }
  return { valid, rejected };
}

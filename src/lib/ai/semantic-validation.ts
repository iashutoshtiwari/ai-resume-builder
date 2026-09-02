import { readTargetText } from "@/features/changes/apply-change";
import { resolveEvidence, resumeCorpus } from "@/features/changes/validate-change";
import type { ProofreadingChange } from "@/features/changes/schema";
import type { JobAnalysisResponse } from "@/features/jobs/schema";
import type { Resume } from "@/features/resume/schema";
import { AppError } from "@/lib/ai/errors";

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function collectIds(resume: Resume): string[] {
  return [
    ...resume.basics.links.map((item) => item.id),
    ...resume.skills.flatMap((group) => [group.id, ...group.skills.map((item) => item.id)]),
    ...resume.experience.flatMap((item) => [item.id, ...item.bullets.map((bullet) => bullet.id)]),
    ...resume.projects.flatMap((item) => [item.id, ...item.technologies.map((technology) => technology.id), ...item.links.map((link) => link.id), ...item.bullets.map((bullet) => bullet.id)]),
    ...resume.education.flatMap((item) => [item.id, ...item.details.map((detail) => detail.id)]),
  ];
}

export function assertUniqueResumeIds(resume: Resume): void {
  const ids = collectIds(resume);
  if (new Set(ids).size !== ids.length) {
    throw new AppError("SEMANTIC_VALIDATION_FAILED", "The imported resume contains duplicate item IDs.", 422, false);
  }
}

export function assertValidJobComparison(result: JobAnalysisResponse, resume: Resume): void {
  const requirementIds = new Set(result.analysis.requirements.map((item) => item.id));
  if (requirementIds.size !== result.analysis.requirements.length) {
    throw new AppError("SEMANTIC_VALIDATION_FAILED", "The job analysis contains duplicate requirement IDs.", 422, false);
  }
  if (result.comparison.entries.length !== result.analysis.requirements.length) {
    throw new AppError("SEMANTIC_VALIDATION_FAILED", "Every job requirement must have exactly one comparison.", 422, false);
  }
  const compared = new Set<string>();
  for (const entry of result.comparison.entries) {
    if (!requirementIds.has(entry.requirementId) || compared.has(entry.requirementId)) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "The job comparison references an invalid or duplicate requirement.", 422, false);
    }
    compared.add(entry.requirementId);
    if (entry.status === "unsupported" && entry.evidence.length > 0) {
      throw new AppError("SEMANTIC_VALIDATION_FAILED", "Unsupported requirements cannot cite resume evidence.", 422, false);
    }
    for (const evidence of entry.evidence) {
      const source = resolveEvidence(resume, evidence);
      if (!source || (evidence.quote && !normalize(source).includes(normalize(evidence.quote)))) {
        throw new AppError("SEMANTIC_VALIDATION_FAILED", "The job comparison cites evidence that does not exist.", 422, false);
      }
    }
  }
}

export function filterValidProofreadingChanges(changes: ProofreadingChange[], resume: Resume) {
  const corpus = resumeCorpus(resume);
  const seenTargets = new Set<string>();
  const valid: ProofreadingChange[] = [];
  const rejected: Array<{ id: string; code: string; message: string }> = [];
  for (const change of changes) {
    const key = JSON.stringify(change.target);
    const current = readTargetText(resume, change.target);
    let code: string | undefined;
    if (seenTargets.has(key)) code = "duplicate-target";
    else if (current === undefined) code = "invalid-target";
    else if (current !== change.before) code = "source-mismatch";
    else if (normalize(change.before) === normalize(change.after)) code = "unchanged";
    else {
      const numbers = change.after.match(/(?:\$?\d[\d,.]*\s?(?:%|x|k|m|b|million|billion|users?)?)/gi) ?? [];
      if (numbers.some((claim) => !corpus.includes(normalize(claim)))) code = "invented-metric";
    }
    if (code) rejected.push({ id: change.id, code, message: "The proofreading change failed factual validation." });
    else {
      seenTargets.add(key);
      valid.push(change);
    }
  }
  return { valid, rejected };
}

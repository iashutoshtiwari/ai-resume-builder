import type { Resume, TextItem } from "@/features/resume/schema";
import type { ProofreadingChange, ResumeChange, RewriteTarget } from "@/features/changes/schema";

export class ChangeApplicationError extends Error {
  constructor(public readonly code: "invalid-target" | "source-mismatch" | "invalid-operation", message: string) {
    super(message);
    this.name = "ChangeApplicationError";
  }
}

export function readTargetText(resume: Resume, target: RewriteTarget): string | undefined {
  if (target.kind === "basics-headline") return resume.basics.headline ?? "";
  if (target.kind === "experience-bullet") return resume.experience.find((item) => item.id === target.entityId)?.bullets.find((item) => item.id === target.itemId)?.text;
  if (target.kind === "project-bullet") return resume.projects.find((item) => item.id === target.entityId)?.bullets.find((item) => item.id === target.itemId)?.text;
  return resume.education.find((item) => item.id === target.entityId)?.details.find((item) => item.id === target.itemId)?.text;
}

function rewriteItems(items: TextItem[], itemId: string, before: string, after: string): TextItem[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index < 0) throw new ChangeApplicationError("invalid-target", `Item ${itemId} does not exist.`);
  if (items[index].text !== before) throw new ChangeApplicationError("source-mismatch", "The resume changed after this suggestion was created.");
  return items.map((item) => item.id === itemId ? { ...item, text: after } : item);
}

function removeItem(items: TextItem[], itemId: string, before: string): TextItem[] {
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) throw new ChangeApplicationError("invalid-target", `Item ${itemId} does not exist.`);
  if (item.text !== before) throw new ChangeApplicationError("source-mismatch", "The resume changed after this suggestion was created.");
  return items.filter((candidate) => candidate.id !== itemId);
}

function reorder<T extends { id: string }>(items: T[], itemId: string, beforeItemId: string | null): T[] {
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) throw new ChangeApplicationError("invalid-target", `Item ${itemId} does not exist.`);
  const remaining = items.filter((candidate) => candidate.id !== itemId);
  if (beforeItemId === null) return [...remaining, item];
  const index = remaining.findIndex((candidate) => candidate.id === beforeItemId);
  if (index < 0) throw new ChangeApplicationError("invalid-target", `Destination ${beforeItemId} does not exist.`);
  return [...remaining.slice(0, index), item, ...remaining.slice(index)];
}

function applyRewrite(resume: Resume, target: RewriteTarget, before: string, after: string): Resume {
  if (target.kind === "basics-headline") {
    if ((resume.basics.headline ?? "") !== before) throw new ChangeApplicationError("source-mismatch", "The headline changed after this suggestion was created.");
    return { ...resume, basics: { ...resume.basics, headline: after } };
  }
  if (target.kind === "experience-bullet") return { ...resume, experience: resume.experience.map((item) => item.id === target.entityId ? { ...item, bullets: rewriteItems(item.bullets, target.itemId, before, after) } : item) };
  if (target.kind === "project-bullet") return { ...resume, projects: resume.projects.map((item) => item.id === target.entityId ? { ...item, bullets: rewriteItems(item.bullets, target.itemId, before, after) } : item) };
  return { ...resume, education: resume.education.map((item) => item.id === target.entityId ? { ...item, details: rewriteItems(item.details, target.itemId, before, after) } : item) };
}

export function applyResumeChange(resume: Resume, change: ResumeChange): Resume {
  if (change.type === "rewrite-text") return applyRewrite(resume, change.target, change.before, change.editedAfter ?? change.after);
  if (change.type === "remove-item") {
    if (change.target.kind === "experience-bullet") return { ...resume, experience: resume.experience.map((item) => item.id === change.target.entityId ? { ...item, bullets: removeItem(item.bullets, change.target.itemId, change.before) } : item) };
    return { ...resume, projects: resume.projects.map((item) => item.id === change.target.entityId ? { ...item, bullets: removeItem(item.bullets, change.target.itemId, change.before) } : item) };
  }
  const target = change.target;
  if (target.kind === "experience-bullet") return { ...resume, experience: resume.experience.map((item) => item.id === target.entityId ? { ...item, bullets: reorder(item.bullets, target.itemId, target.beforeItemId) } : item) };
  if (target.kind === "project-bullet") return { ...resume, projects: resume.projects.map((item) => item.id === target.entityId ? { ...item, bullets: reorder(item.bullets, target.itemId, target.beforeItemId) } : item) };
  return { ...resume, skills: resume.skills.map((group) => group.id === target.entityId ? { ...group, skills: reorder(group.skills, target.itemId, target.beforeItemId) } : group) };
}

export function applyResumeChanges(resume: Resume, changes: ResumeChange[]): Resume {
  return changes.reduce((current, change) => applyResumeChange(current, change), resume);
}

export function applyProofreadingChange(resume: Resume, change: ProofreadingChange): Resume {
  return applyRewrite(resume, change.target, change.before, change.editedAfter ?? change.after);
}

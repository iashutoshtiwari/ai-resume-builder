import { openDB, type DBSchema } from "idb";
import { WorkspaceSchema, type PersistedWorkspaceRecord, type Workspace } from "@/features/workspace/schema";
import { ResumeSchema } from "@/features/resume/schema";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { createId } from "@/lib/utils";

interface ResumeBuilderDB extends DBSchema {
  workspaces: { key: string; value: PersistedWorkspaceRecord };
}

const DB_NAME = "ai-resume-builder";
const STORE_NAME = "workspaces";

function database() {
  return openDB<ResumeBuilderDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "key" });
    },
  });
}

export async function saveWorkspace(workspace: Workspace, pdfBlob?: Blob): Promise<void> {
  const db = await database();
  await db.put(STORE_NAME, { key: "primary", workspace: WorkspaceSchema.parse(workspace), ...(pdfBlob ? { pdfBlob } : {}) });
}

export async function loadWorkspace(): Promise<{ workspace: Workspace; pdfBlob?: Blob } | null> {
  const db = await database();
  const record = await db.get(STORE_NAME, "primary");
  if (!record) return null;
  const workspace = migrateWorkspace(record.workspace);
  return { workspace, ...(record.pdfBlob ? { pdfBlob: record.pdfBlob } : {}) };
}

export async function clearWorkspace(): Promise<void> {
  const db = await database();
  await db.delete(STORE_NAME, "primary");
}

export function migrateWorkspace(value: unknown): Workspace {
  const current = WorkspaceSchema.safeParse(value);
  if (current.success) return current.data;
  if (!value || typeof value !== "object") throw new Error("The locally saved workspace is corrupt.");
  const legacy = value as Record<string, unknown>;
  if (legacy.version !== undefined && legacy.version !== 0) throw new Error("The locally saved workspace uses an unsupported version.");
  const resume = ResumeSchema.safeParse(legacy.resume);
  if (!resume.success) throw new Error("The locally saved workspace is corrupt.");
  const originalResume = ResumeSchema.safeParse(legacy.originalResume);
  return WorkspaceSchema.parse({
    version: 1,
    id: typeof legacy.id === "string" ? legacy.id : createId("workspace"),
    name: typeof legacy.name === "string" ? legacy.name : "Recovered resume",
    resume: resume.data,
    originalResume: originalResume.success ? originalResume.data : resume.data,
    originalLatex: typeof legacy.originalLatex === "string" ? legacy.originalLatex : null,
    generatedLatex: typeof legacy.generatedLatex === "string" ? legacy.generatedLatex : renderResumeToLatex(resume.data),
    manualLatex: typeof legacy.manualLatex === "string" ? legacy.manualLatex : null,
    manualLatexStale: Boolean(legacy.manualLatexStale),
    targetJob: legacy.targetJob ?? null,
    jobAnalysis: legacy.jobAnalysis ?? null,
    jobComparison: legacy.jobComparison ?? null,
    tailoringChanges: Array.isArray(legacy.tailoringChanges) ? legacy.tailoringChanges : [],
    unsupportedGaps: Array.isArray(legacy.unsupportedGaps) ? legacy.unsupportedGaps : [],
    proofreadingChanges: Array.isArray(legacy.proofreadingChanges) ? legacy.proofreadingChanges : [],
    resumeRevision: typeof legacy.resumeRevision === "string" ? legacy.resumeRevision : createId("revision"),
    lastCompiledSourceHash: typeof legacy.lastCompiledSourceHash === "string" ? legacy.lastCompiledSourceHash : null,
    updatedAt: typeof legacy.updatedAt === "string" ? legacy.updatedAt : new Date().toISOString(),
  });
}

import { openDB, type DBSchema } from "idb";
import { WorkspaceSchema, type PersistedWorkspaceRecord, type Workspace } from "@/features/workspace/schema";
import { ResumeSchema } from "@/features/resume/schema";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { CANONICAL_TEMPLATE_VERSION } from "@/features/latex/templates/canonical";
import { DEFAULT_PRESENTATION, ResumePresentationSchema } from "@/features/presentation/schema";
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
  if (legacy.version !== undefined && legacy.version !== 0 && legacy.version !== 1 && legacy.version !== 2 && legacy.version !== 3) throw new Error("The locally saved workspace uses an unsupported version.");
  const resume = ResumeSchema.safeParse(legacy.resume);
  if (!resume.success) throw new Error("The locally saved workspace is corrupt.");
  const originalResume = ResumeSchema.safeParse(legacy.originalResume);
  const legacyPresentation = legacy.presentation && typeof legacy.presentation === "object"
    ? legacy.presentation as Record<string, unknown>
    : {};
  const presentation = ResumePresentationSchema.safeParse({
    paperSize: legacyPresentation.paperSize,
    sections: legacyPresentation.sections,
  });
  const templateOptions = presentation.success ? presentation.data : DEFAULT_PRESENTATION;
  return WorkspaceSchema.parse({
    version: 4,
    id: typeof legacy.id === "string" ? legacy.id : createId("workspace"),
    name: typeof legacy.name === "string" ? legacy.name : "Recovered resume",
    resume: resume.data,
    originalResume: originalResume.success ? originalResume.data : resume.data,
    originalLatex: typeof legacy.originalLatex === "string" ? legacy.originalLatex : null,
    generatedLatex: renderResumeToLatex(resume.data, templateOptions),
    templateVersion: CANONICAL_TEMPLATE_VERSION,
    latexMode: typeof legacy.manualLatex === "string" ? "manual" : "generated",
    manualLatex: typeof legacy.manualLatex === "string" ? legacy.manualLatex : null,
    manualLatexStale: Boolean(legacy.manualLatexStale),
    compilerFiles: Array.isArray(legacy.compilerFiles) ? legacy.compilerFiles : [],
    presentation: templateOptions,
    guidanceContext: null,
    targetJob: legacy.targetJob ?? null,
    jobAnalysis: legacy.jobAnalysis ?? null,
    jobComparison: legacy.jobComparison ?? null,
    tailoringChanges: [],
    unsupportedGaps: Array.isArray(legacy.unsupportedGaps) ? legacy.unsupportedGaps : [],
    proofreadingChanges: [],
    resumeRevision: typeof legacy.resumeRevision === "string" ? legacy.resumeRevision : createId("revision"),
    lastCompiledSourceHash: typeof legacy.lastCompiledSourceHash === "string" ? legacy.lastCompiledSourceHash : null,
    lastCompiledPageCount: typeof legacy.lastCompiledPageCount === "number" ? legacy.lastCompiledPageCount : null,
    updatedAt: typeof legacy.updatedAt === "string" ? legacy.updatedAt : new Date().toISOString(),
  });
}

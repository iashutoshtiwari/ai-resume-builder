"use client";

import { create } from "zustand";
import { applyProofreadingChange, applyResumeChange, applyResumeChanges } from "@/features/changes/apply-change";
import { validateChangeAgainstResume } from "@/features/changes/validate-change";
import type { ProofreadingChange, ResumeChange, UnsupportedGap } from "@/features/changes/schema";
import type { JobAnalysis, JobComparison, TargetJob } from "@/features/jobs/schema";
import { renderResumeToLatex } from "@/features/latex/renderer";
import { DEFAULT_PRESENTATION, type ResumePresentation } from "@/features/presentation/schema";
import type { Resume } from "@/features/resume/schema";
import type { Workspace } from "@/features/workspace/schema";
import type { LatexProjectFile } from "@/features/workspace/schema";
import { clearWorkspace, loadWorkspace, saveWorkspace } from "@/lib/storage/workspace-db";
import { createId, hashText } from "@/lib/utils";

export type WorkspacePanel = "overview" | "experience" | "projects" | "skills" | "education" | "format" | "guidance" | "job" | "changes" | "proofread" | "latex";
type SaveStatus = "idle" | "saving" | "saved" | "error" | "corrupt";

type WorkspaceStore = {
  workspace: Workspace | null;
  pdfBlob: Blob | null;
  panel: WorkspacePanel;
  past: Resume[];
  future: Resume[];
  saveStatus: SaveStatus;
  hydrated: boolean;
  compileStatus: "idle" | "compiling" | "success" | "error";
  compileLogs: string;
  compileError: string | null;
  hydrate: () => Promise<void>;
  startWorkspace: (resume: Resume, originalLatex: string | null, name?: string) => Promise<void>;
  updateResume: (updater: (resume: Resume) => Resume) => void;
  undo: () => void;
  redo: () => void;
  setPanel: (panel: WorkspacePanel) => void;
  setTargetJob: (job: TargetJob | null) => void;
  setAnalysis: (analysis: JobAnalysis, comparison: JobComparison) => void;
  setTailoring: (changes: ResumeChange[], gaps: UnsupportedGap[]) => void;
  setProofreading: (changes: ProofreadingChange[]) => void;
  acceptProofreading: (id: string, editedAfter?: string) => { ok: boolean; message?: string };
  rejectProofreading: (id: string) => void;
  setChangeStatus: (id: string, status: ResumeChange["status"]) => void;
  acceptChange: (id: string, editedAfter?: string) => { ok: boolean; message?: string };
  acceptAllSafe: () => { applied: number; rejected: number };
  rejectRemaining: () => void;
  setManualLatex: (source: string | null) => void;
  resetManualLatex: () => void;
  setPresentation: (presentation: ResumePresentation) => void;
  addCompilerFiles: (files: LatexProjectFile[]) => void;
  removeCompilerFile: (id: string) => void;
  setCompilePending: () => void;
  setCompileSuccess: (pdf: Blob, sourceHash: string, logs: string) => void;
  setCompiledPageCount: (pageCount: number) => void;
  setCompileFailure: (message: string, logs: string) => void;
  resetWorkspace: () => Promise<void>;
};

function nextRevision(): string {
  return createId("revision");
}

function withResume(workspace: Workspace, resume: Resume): Workspace {
  return {
    ...workspace,
    resume,
    generatedLatex: renderResumeToLatex(resume, workspace.presentation),
    manualLatexStale: workspace.manualLatex !== null,
    resumeRevision: nextRevision(),
    updatedAt: new Date().toISOString(),
  };
}

let hydrationPromise: Promise<void> | null = null;

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: null,
  pdfBlob: null,
  panel: "overview",
  past: [],
  future: [],
  saveStatus: "idle",
  hydrated: false,
  compileStatus: "idle",
  compileLogs: "",
  compileError: null,

  hydrate: async () => {
    if (get().hydrated) return;
    if (hydrationPromise) return hydrationPromise;
    hydrationPromise = (async () => {
      try {
        const record = await loadWorkspace();
        if (get().workspace) {
          set({ hydrated: true });
          return;
        }
        set({ workspace: record?.workspace ?? null, pdfBlob: record?.pdfBlob ?? null, hydrated: true, saveStatus: record ? "saved" : "idle" });
      } catch {
        if (!get().workspace) set({ hydrated: true, saveStatus: "corrupt" });
      } finally {
        hydrationPromise = null;
      }
    })();
    return hydrationPromise;
  },
  startWorkspace: async (resume, originalLatex, name = "Primary resume") => {
    const presentation = DEFAULT_PRESENTATION;
    const generatedLatex = renderResumeToLatex(resume, presentation);
    const revision = await hashText(JSON.stringify(resume));
    const workspace: Workspace = {
      version: 3,
      id: createId("workspace"),
      name,
      resume,
      originalResume: resume,
      originalLatex,
      generatedLatex,
      manualLatex: null,
      manualLatexStale: false,
      compilerFiles: [],
      presentation,
      guidanceContext: null,
      targetJob: null,
      jobAnalysis: null,
      jobComparison: null,
      tailoringChanges: [],
      unsupportedGaps: [],
      proofreadingChanges: [],
      resumeRevision: revision,
      lastCompiledSourceHash: null,
      lastCompiledPageCount: null,
      updatedAt: new Date().toISOString(),
    };
    set({ workspace, pdfBlob: null, past: [], future: [], panel: "overview", hydrated: true, saveStatus: "saving" });
  },
  updateResume: (updater) => set((state) => {
    if (!state.workspace) return state;
    const resume = updater(state.workspace.resume);
    if (resume === state.workspace.resume) return state;
    return { workspace: withResume(state.workspace, resume), past: [...state.past.slice(-49), state.workspace.resume], future: [], saveStatus: "saving" };
  }),
  undo: () => set((state) => {
    if (!state.workspace || state.past.length === 0) return state;
    const resume = state.past.at(-1)!;
    return { workspace: withResume(state.workspace, resume), past: state.past.slice(0, -1), future: [state.workspace.resume, ...state.future].slice(0, 50), saveStatus: "saving" };
  }),
  redo: () => set((state) => {
    if (!state.workspace || state.future.length === 0) return state;
    const [resume, ...future] = state.future;
    return { workspace: withResume(state.workspace, resume), past: [...state.past.slice(-49), state.workspace.resume], future, saveStatus: "saving" };
  }),
  setPanel: (panel) => set({ panel }),
  setTargetJob: (targetJob) => set((state) => state.workspace ? { workspace: { ...state.workspace, targetJob, jobAnalysis: null, jobComparison: null, tailoringChanges: [], unsupportedGaps: [], updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setAnalysis: (jobAnalysis, jobComparison) => set((state) => state.workspace ? { workspace: { ...state.workspace, jobAnalysis, jobComparison, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setTailoring: (tailoringChanges, unsupportedGaps) => set((state) => state.workspace ? { workspace: { ...state.workspace, tailoringChanges, unsupportedGaps, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setProofreading: (proofreadingChanges) => set((state) => state.workspace ? { workspace: { ...state.workspace, proofreadingChanges, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  acceptProofreading: (id, editedAfter) => {
    const state = get();
    const workspace = state.workspace;
    const change = workspace?.proofreadingChanges.find((item) => item.id === id);
    if (!workspace || !change) return { ok: false, message: "Proofreading change not found." };
    if (change.resumeRevision !== workspace.resumeRevision) return { ok: false, message: "This change is stale. Run proofreading again." };
    const candidate = { ...change, ...(editedAfter ? { editedAfter } : {}) };
    try {
      const resume = applyProofreadingChange(workspace.resume, candidate);
      set({ workspace: { ...withResume(workspace, resume), proofreadingChanges: workspace.proofreadingChanges.map((item) => item.id === id ? { ...item, status: editedAfter ? "edited" : "accepted", ...(editedAfter ? { editedAfter } : {}) } : item) }, past: [...state.past.slice(-49), workspace.resume], future: [], saveStatus: "saving" });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "The change could not be applied." };
    }
  },
  rejectProofreading: (id) => set((state) => state.workspace ? { workspace: { ...state.workspace, proofreadingChanges: state.workspace.proofreadingChanges.map((change) => change.id === id ? { ...change, status: "rejected" as const } : change), updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setChangeStatus: (id, status) => set((state) => state.workspace ? { workspace: { ...state.workspace, tailoringChanges: state.workspace.tailoringChanges.map((change) => change.id === id ? { ...change, status } : change), updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  acceptChange: (id, editedAfter) => {
    const state = get();
    const workspace = state.workspace;
    const change = workspace?.tailoringChanges.find((item) => item.id === id);
    if (!workspace || !change) return { ok: false, message: "Suggestion not found." };
    if (change.resumeRevision !== workspace.resumeRevision) return { ok: false, message: "This suggestion is stale. Regenerate it before applying." };
    const candidate = editedAfter && change.type === "rewrite-text" ? { ...change, after: editedAfter, editedAfter, status: "edited" as const } : change;
    const validation = validateChangeAgainstResume(candidate, workspace.resume, workspace.jobAnalysis ?? undefined);
    if (!validation.valid) return { ok: false, message: validation.message };
    try {
      const resume = applyResumeChange(workspace.resume, candidate);
      set({ workspace: { ...withResume(workspace, resume), tailoringChanges: workspace.tailoringChanges.map((item) => item.id === id ? { ...item, status: editedAfter ? "edited" : "accepted", ...(editedAfter ? { editedAfter } : {}) } : item) }, past: [...state.past.slice(-49), workspace.resume], future: [], saveStatus: "saving" });
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "The suggestion could not be applied." };
    }
  },
  acceptAllSafe: () => {
    const state = get();
    const workspace = state.workspace;
    if (!workspace) return { applied: 0, rejected: 0 };
    const candidates = workspace.tailoringChanges.filter((change) => change.status === "pending" && change.risk === "safe" && change.resumeRevision === workspace.resumeRevision);
    const valid = candidates.filter((change) => validateChangeAgainstResume(change, workspace.resume, workspace.jobAnalysis ?? undefined).valid);
    try {
      const resume = applyResumeChanges(workspace.resume, valid);
      const ids = new Set(valid.map((change) => change.id));
      set({ workspace: { ...withResume(workspace, resume), tailoringChanges: workspace.tailoringChanges.map((change) => ids.has(change.id) ? { ...change, status: "accepted" as const } : change) }, past: [...state.past.slice(-49), workspace.resume], future: [], saveStatus: "saving" });
      return { applied: valid.length, rejected: candidates.length - valid.length };
    } catch {
      return { applied: 0, rejected: candidates.length };
    }
  },
  rejectRemaining: () => set((state) => state.workspace ? { workspace: { ...state.workspace, tailoringChanges: state.workspace.tailoringChanges.map((change) => change.status === "pending" ? { ...change, status: "rejected" as const } : change), updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setManualLatex: (manualLatex) => set((state) => state.workspace ? { workspace: { ...state.workspace, manualLatex, manualLatexStale: false, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  resetManualLatex: () => set((state) => state.workspace ? { workspace: { ...state.workspace, manualLatex: null, manualLatexStale: false, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setPresentation: (presentation) => set((state) => {
    if (!state.workspace) return state;
    return {
      workspace: {
        ...state.workspace,
        presentation,
        generatedLatex: renderResumeToLatex(state.workspace.resume, presentation),
        manualLatexStale: state.workspace.manualLatex !== null,
        lastCompiledSourceHash: null,
        lastCompiledPageCount: null,
        updatedAt: new Date().toISOString(),
      },
      saveStatus: "saving",
    };
  }),
  addCompilerFiles: (files) => set((state) => {
    if (!state.workspace) return state;
    const incomingNames = new Set(files.map((file) => file.name.toLowerCase()));
    const existing = state.workspace.compilerFiles.filter((file) => !incomingNames.has(file.name.toLowerCase()));
    return {
      workspace: { ...state.workspace, compilerFiles: [...existing, ...files].slice(-40), lastCompiledSourceHash: null, updatedAt: new Date().toISOString() },
      saveStatus: "saving",
    };
  }),
  removeCompilerFile: (id) => set((state) => state.workspace ? {
    workspace: { ...state.workspace, compilerFiles: state.workspace.compilerFiles.filter((file) => file.id !== id), lastCompiledSourceHash: null, updatedAt: new Date().toISOString() },
    saveStatus: "saving",
  } : state),
  setCompilePending: () => set({ compileStatus: "compiling", compileError: null, compileLogs: "" }),
  setCompileSuccess: (pdfBlob, lastCompiledSourceHash, compileLogs) => set((state) => state.workspace ? { pdfBlob, compileStatus: "success", compileLogs, compileError: null, workspace: { ...state.workspace, lastCompiledSourceHash, lastCompiledPageCount: null, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setCompiledPageCount: (lastCompiledPageCount) => set((state) => state.workspace ? { workspace: { ...state.workspace, lastCompiledPageCount, updatedAt: new Date().toISOString() }, saveStatus: "saving" } : state),
  setCompileFailure: (compileError, compileLogs) => set({ compileStatus: "error", compileError, compileLogs }),
  resetWorkspace: async () => {
    await clearWorkspace();
    set({ workspace: null, pdfBlob: null, past: [], future: [], saveStatus: "idle", compileStatus: "idle", compileLogs: "", compileError: null });
  },
}));

if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useWorkspaceStore.subscribe((state, previous) => {
    if (state.workspace === previous.workspace && state.pdfBlob === previous.pdfBlob) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const current = useWorkspaceStore.getState();
      if (!current.workspace) return;
      try {
        await saveWorkspace(current.workspace, current.pdfBlob ?? undefined);
        useWorkspaceStore.setState({ saveStatus: "saved" });
      } catch {
        useWorkspaceStore.setState({ saveStatus: "error" });
      }
    }, 750);
  });
}

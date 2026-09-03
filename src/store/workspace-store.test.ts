import { beforeEach, describe, expect, it } from "vitest";
import { sampleResume } from "@/features/resume/fixtures/sample-resume";
import { useWorkspaceStore } from "@/store/workspace-store";

describe("session history", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: null, pdfBlob: null, past: [], future: [], hydrated: true, saveStatus: "idle" });
  });

  it("supports bounded undo and redo without mutating snapshots", async () => {
    await useWorkspaceStore.getState().startWorkspace(sampleResume, null);
    const original = useWorkspaceStore.getState().workspace!.resume;
    useWorkspaceStore.getState().updateResume((resume) => ({ ...resume, basics: { ...resume.basics, headline: "Staff Engineer" } }));
    expect(useWorkspaceStore.getState().workspace!.resume.basics.headline).toBe("Staff Engineer");
    expect(original.basics.headline).toBe("Software Engineer");
    useWorkspaceStore.getState().undo();
    expect(useWorkspaceStore.getState().workspace!.resume.basics.headline).toBe("Software Engineer");
    useWorkspaceStore.getState().redo();
    expect(useWorkspaceStore.getState().workspace!.resume.basics.headline).toBe("Staff Engineer");
  });

  it("preserves manual source across structured edits until an explicit restore", async () => {
    await useWorkspaceStore.getState().startWorkspace(sampleResume, null);
    const generated = useWorkspaceStore.getState().workspace!.generatedLatex;
    const manual = `${generated}\n% user override`;

    useWorkspaceStore.getState().setManualLatex(manual);
    useWorkspaceStore.getState().updateResume((resume) => ({
      ...resume,
      basics: { ...resume.basics, headline: "Staff Engineer" },
    }));

    const overridden = useWorkspaceStore.getState().workspace!;
    expect(overridden.latexMode).toBe("manual");
    expect(overridden.manualLatex).toBe(manual);
    expect(overridden.manualLatexStale).toBe(true);
    expect(overridden.generatedLatex).toContain("Staff Engineer");

    useWorkspaceStore.getState().resetManualLatex();
    const restored = useWorkspaceStore.getState().workspace!;
    expect(restored.latexMode).toBe("generated");
    expect(restored.manualLatex).toBeNull();
    expect(restored.manualLatexStale).toBe(false);
  });
});

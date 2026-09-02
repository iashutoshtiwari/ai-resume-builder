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
});

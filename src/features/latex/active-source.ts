import type { Workspace } from "@/features/workspace/schema";

/** The single source used by the editor, compiler, preview, and .tex download. */
export function getActiveLatexSource(
  workspace: Pick<Workspace, "latexMode" | "manualLatex" | "generatedLatex">,
): string {
  if (workspace.latexMode === "manual" && workspace.manualLatex !== null) {
    return workspace.manualLatex;
  }
  return workspace.generatedLatex;
}

"use client";

import dynamic from "next/dynamic";
import { FilePlus2, RotateCcw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace-store";
import { createId } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const PROJECT_FILE = /\.(?:sty|cls|tex|bib|bst|bbx|cbx|def|cfg|fd|map|enc|tfm|vf|pfb|png|jpe?g|pdf|svg)$/i;

export function LatexPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setManual = useWorkspaceStore((state) => state.setManualLatex);
  const resetManual = useWorkspaceStore((state) => state.resetManualLatex);
  const addCompilerFiles = useWorkspaceStore((state) => state.addCompilerFiles);
  const removeCompilerFile = useWorkspaceStore((state) => state.removeCompilerFile);
  const source = workspace.manualLatex ?? workspace.generatedLatex;

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some((file) => !PROJECT_FILE.test(file.name))) {
      toast.error("That file type is not supported by the LaTeX project workspace.");
      return;
    }
    const incomingNames = new Set(selected.map((file) => file.name.toLowerCase()));
    const currentBytes = workspace.compilerFiles
      .filter((file) => !incomingNames.has(file.name.toLowerCase()))
      .reduce((sum, file) => sum + file.content.byteLength, 0);
    const selectedBytes = selected.reduce((sum, file) => sum + file.size, 0);
    if (selected.some((file) => file.size > 8_000_000) || currentBytes + selectedBytes > 25_000_000) {
      toast.error("Each project file must be under 8 MB and workspace files must total no more than 25 MB.");
      return;
    }
    const projectFiles = await Promise.all(selected.map(async (file) => ({
      id: createId("latex-file"),
      name: file.name,
      content: new Uint8Array(await file.arrayBuffer()),
    })));
    addCompilerFiles(projectFiles);
    toast.success(`${projectFiles.length} LaTeX project file${projectFiles.length === 1 ? "" : "s"} added`);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Source / LaTeX</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {workspace.manualLatex === null ? "Generated LaTeX Source" : "Manual LaTeX Override"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Structured form edits automatically update generated LaTeX unless manual override is active.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {workspace.manualLatexStale && (
            <Badge variant="outline" className="text-warning">
              <ShieldAlert className="size-3.5 mr-1" /> Override stale
            </Badge>
          )}
          {workspace.manualLatex !== null && (
            <Button size="sm" variant="outline" onClick={resetManual}>
              <RotateCcw className="size-3.5 mr-1" /> Reset to generated
            </Button>
          )}
        </div>
      </header>
      {workspace.manualLatexStale && (
        <div className="flex shrink-0 items-center justify-between border-b border-warning/30 bg-warning/5 px-5 py-2.5 text-xs text-muted-foreground">
          <span>Structured edits changed generated source. Keep this override or reset it.</span>
          <Button size="sm" variant="ghost" onClick={() => setManual(source)}>
            Keep override
          </Button>
        </div>
      )}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-2.5">
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-primary/40">
          <FilePlus2 className="size-3.5" /> Add project files
          <input
            type="file"
            multiple
            className="sr-only"
            accept=".sty,.cls,.tex,.bib,.bst,.bbx,.cbx,.def,.cfg,.fd,.map,.enc,.tfm,.vf,.pfb,.png,.jpg,.jpeg,.pdf,.svg"
            onChange={(event) => {
              void addFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <span className="text-[11px] text-muted-foreground">Custom styles, classes, fonts, bibliography, and images compile with this workspace.</span>
        {workspace.compilerFiles.map((file) => (
          <span key={file.id} className="inline-flex min-w-0 max-w-48 items-center gap-1 border border-border bg-background px-2 py-1 font-mono text-[10px]">
            <span className="truncate">{file.name}</span>
            <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground" onClick={() => removeCompilerFile(file.id)} aria-label={`Remove ${file.name}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative min-h-[400px] flex-1 w-full overflow-hidden">
        <MonacoEditor
          height="100%"
          width="100%"
          defaultLanguage="latex"
          theme="vs-dark"
          value={source}
          onChange={(value) => setManual(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "var(--font-geist-mono), monospace",
            wordWrap: "on",
            wrappingIndent: "indent",
            scrollBeyondLastLine: false,
            padding: { top: 14, bottom: 28 },
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: "on",
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}

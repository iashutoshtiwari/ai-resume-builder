"use client";

import dynamic from "next/dynamic";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace-store";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function LatexPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setManual = useWorkspaceStore((state) => state.setManualLatex);
  const resetManual = useWorkspaceStore((state) => state.resetManualLatex);
  const source = workspace.manualLatex ?? workspace.generatedLatex;

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


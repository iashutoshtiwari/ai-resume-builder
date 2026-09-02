"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auditResumeGuidance } from "@/features/guidance/audit";
import { GUIDANCE_CORPUS, GUIDANCE_SNAPSHOT_VERSION } from "@/features/guidance/corpus";
import { retrieveGuidance } from "@/features/guidance/retrieve";
import type { GuidanceFinding } from "@/features/guidance/schema";
import { hashCompileInput } from "@/features/latex/source-hash";
import { useWorkspaceStore } from "@/store/workspace-store";

export function GuidancePanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const source = workspace.manualLatex ?? workspace.generatedLatex;
  const [currentHash, setCurrentHash] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void hashCompileInput(source, workspace.compilerFiles).then((hash) => {
      if (alive) setCurrentHash(hash);
    });
    return () => {
      alive = false;
    };
  }, [source, workspace.compilerFiles]);

  const compiledCurrent = Boolean(
    workspace.lastCompiledSourceHash &&
    currentHash &&
    workspace.lastCompiledSourceHash === currentHash
  );

  const findings = useMemo(() => {
    return auditResumeGuidance({
      resume: workspace.resume,
      presentation: workspace.presentation,
      manualLatex: workspace.manualLatex !== null,
      pageCount: compiledCurrent ? workspace.lastCompiledPageCount : null,
      compiledCurrent,
    });
  }, [workspace.resume, workspace.presentation, workspace.manualLatex, workspace.lastCompiledPageCount, compiledCurrent]);

  const actionNeeded = findings.filter((f) => f.severity === "action");
  const reviewNeeded = findings.filter((f) => f.severity === "review");
  const passed = findings.filter((f) => f.severity === "passed");

  // Retrieved guidance relevant to target job or formatting
  const retrievedContext = useMemo(() => {
    if (workspace.targetJob) {
      return retrieveGuidance({
        task: "analyze",
        resume: workspace.resume,
        targetJob: workspace.targetJob,
        limit: 6,
      });
    }
    return retrieveGuidance({
      task: "format",
      resume: workspace.resume,
      limit: 6,
    });
  }, [workspace.resume, workspace.targetJob]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className="border-b border-border px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Guidance / ATS Audit</p>
        <div className="mt-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">EngineeringResumes Guidance</h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            {GUIDANCE_SNAPSHOT_VERSION}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Deterministic checks and advisory principles based on a curated snapshot of the r/EngineeringResumes community wiki. No arbitrary ATS score is computed.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 p-5">
        {/* Regional & Advisory Disclaimer */}
        <div className="rounded border border-blue-200/60 bg-blue-50/50 p-3.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="leading-relaxed">
              <span className="font-semibold">Advisory & Regional Notice:</span> This guidance reflects general technical hiring practices with a regional focus on the United States and Canada. Guidelines are advisory, evidence-backed rules of thumb rather than definitive software requirements. They never fabricate experience or replace genuine candidate evidence.
            </div>
          </div>
        </div>

        {/* Page Length Status */}
        <section className="rounded-lg border border-border bg-background p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="size-4 text-primary" /> Page Length Status
            </h3>
            {compiledCurrent && workspace.lastCompiledPageCount !== null ? (
              <Badge variant={workspace.lastCompiledPageCount === 1 ? "secondary" : "outline"} className="text-xs">
                {workspace.lastCompiledPageCount} page{workspace.lastCompiledPageCount === 1 ? "" : "s"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Needs compile
              </Badge>
            )}
          </div>

          {!compiledCurrent || workspace.lastCompiledPageCount === null ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Page count is verified after a successful local PDF compile of the current resume source. Click <span className="font-medium text-foreground">Compile</span> in the preview panel to update page length verification.
            </p>
          ) : workspace.lastCompiledPageCount === 1 ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Fits one page:</span> The current compiled document fits on one page, meeting the wiki&apos;s recommendation for the vast majority of early- to mid-career engineering candidates.
            </p>
          ) : (
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <span className="font-semibold">Spans {workspace.lastCompiledPageCount} pages:</span> The wiki advises a single page unless you have roughly 10+ years of relevant experience or senior/staff scope. Consider tightening vertical density or trimming less relevant bullets. Compilation and export remain available.
            </p>
          )}
        </section>

        {/* Summary counts bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-center">
            <div className="font-mono text-xl font-bold text-destructive">{actionNeeded.length}</div>
            <div className="text-[11px] font-medium text-muted-foreground">Action needed</div>
          </div>
          <div className="rounded-md border border-amber-300/40 bg-amber-500/5 p-3 text-center">
            <div className="font-mono text-xl font-bold text-amber-700 dark:text-amber-300">{reviewNeeded.length}</div>
            <div className="text-[11px] font-medium text-muted-foreground">Review</div>
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
            <div className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">{passed.length}</div>
            <div className="text-[11px] font-medium text-muted-foreground">Passed</div>
          </div>
        </div>

        {/* Action Needed Findings */}
        {actionNeeded.length > 0 && (
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-4" /> Action Needed ({actionNeeded.length})
            </h3>
            <div className="space-y-2">
              {actionNeeded.map((item) => (
                <FindingCard key={item.id} finding={item} />
              ))}
            </div>
          </section>
        )}

        {/* Review Findings */}
        {reviewNeeded.length > 0 && (
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="size-4" /> Recommended Review ({reviewNeeded.length})
            </h3>
            <div className="space-y-2">
              {reviewNeeded.map((item) => (
                <FindingCard key={item.id} finding={item} />
              ))}
            </div>
          </section>
        )}

        {/* Passed Findings */}
        {passed.length > 0 && (
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Passed Checks ({passed.length})
            </h3>
            <div className="space-y-2">
              {passed.map((item) => (
                <FindingCard key={item.id} finding={item} />
              ))}
            </div>
          </section>
        )}

        {/* Retrieved JD Relevance Guidance */}
        <section className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <BookOpen className="size-4 text-primary" />
                {workspace.targetJob ? "Retrieved Guidance for Target Role" : "Curated Wiki Advice"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {workspace.targetJob
                  ? "Deterministically ranked based on resume content, job description keywords, and task rules."
                  : "Key guidelines for formatting and content from the EngineeringResumes wiki."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {retrievedContext.chunks.map((chunk) => (
              <article key={chunk.id} className="rounded-lg border border-border bg-background p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold">{chunk.title}</h4>
                  <a
                    href={chunk.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
                  >
                    {chunk.sourceSection} <ExternalLink className="size-2.5" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{chunk.guidance}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {chunk.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {chunk.applicability === "us-canada" && (
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] text-blue-700 dark:text-blue-300">
                      US/Canada
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: GuidanceFinding }) {
  const corpusItem = GUIDANCE_CORPUS.find((c) => c.id === finding.ruleId);

  const borderClass =
    finding.severity === "action"
      ? "border-destructive/30 bg-destructive/5"
      : finding.severity === "review"
      ? "border-amber-300/40 bg-amber-500/5"
      : "border-emerald-500/25 bg-emerald-500/5";

  return (
    <div className={`rounded-md border p-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold">{finding.title}</span>
        {corpusItem && (
          <a
            href={corpusItem.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-primary hover:underline"
          >
            {corpusItem.sourceSection} <ExternalLink className="size-2.5" />
          </a>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{finding.message}</p>
      {finding.target && (
        <p className="mt-1.5 font-mono text-[10px] text-foreground/80 truncate">Target: {finding.target}</p>
      )}
    </div>
  );
}

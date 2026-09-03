"use client";

import { useMemo, useState } from "react";
import { diffWords } from "diff";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProofreadingResponse, ResumeChange } from "@/features/changes/schema";
import { GUIDANCE_CORPUS } from "@/features/guidance/corpus";
import { assessJobMatch } from "@/features/assessment/scoring";
import type { JobAnalysisResponse } from "@/features/jobs/schema";
import type { TailoredResumeResponse } from "@/lib/ai/provider";
import { useWorkspaceStore } from "@/store/workspace-store";

async function postAI<T extends object>(path: string, body: unknown): Promise<T> {
  const provider = useWorkspaceStore.getState().activeAiProvider;
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ai-provider": provider,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json() as T | { error?: { message?: string } };
  if (!response.ok) throw new Error("error" in result ? result.error?.message : "AI request failed.");
  return result as T;
}

function PanelHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  const provider = useWorkspaceStore((state) => state.activeAiProvider);
  const providerLabel = provider === "groq" ? "Groq LPU (Free)" : provider === "openrouter" ? "OpenRouter" : "Gemini Flash";

  return (
    <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <span className="font-mono text-[9px] text-muted-foreground border border-border/80 px-1.5 py-0.5 rounded-none bg-muted/40">
            via {providerLabel}
          </span>
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
      </div>
      {action}
    </header>
  );
}

export function JobPanel({ aiConfigured }: { aiConfigured: boolean }) {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setTargetJob = useWorkspaceStore((state) => state.setTargetJob);
  const setAnalysis = useWorkspaceStore((state) => state.setAnalysis);
  const applyTailoredResume = useWorkspaceStore((state) => state.applyTailoredResume);
  const restoreBaseline = useWorkspaceStore((state) => state.restoreBaseline);
  const setPanel = useWorkspaceStore((state) => state.setPanel);
  const [description, setDescription] = useState(workspace.targetJob?.description ?? "");
  const [role, setRole] = useState(workspace.targetJob?.role ?? "");
  const [company, setCompany] = useState(workspace.targetJob?.company ?? "");
  const [busy, setBusy] = useState<"analysis" | "tailor" | null>(null);

  async function analyze() {
    const targetJob = { description, ...(role ? { role } : {}), ...(company ? { company } : {}) };
    setTargetJob(targetJob);
    setBusy("analysis");
    try {
      const result = await postAI<JobAnalysisResponse>("/api/ai/analyze-job", { resume: workspace.resume, targetJob });
      setAnalysis(result.analysis, result.comparison);
      toast.success("Job analysis ready");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Analysis failed."); }
    finally { setBusy(null); }
  }

  async function tailor() {
    if (!workspace.targetJob || !workspace.jobAnalysis || !workspace.jobComparison) return;
    setBusy("tailor");
    try {
      const result = await postAI<TailoredResumeResponse>("/api/ai/tailor", {
        resume: workspace.resume,
        targetJob: workspace.targetJob,
        analysis: { analysis: workspace.jobAnalysis, comparison: workspace.jobComparison },
        resumeRevision: workspace.resumeRevision,
      });
      applyTailoredResume(result.tailoredResume, result.summary, result.changes, result.gaps);
      toast.success("Tailored resume generated and applied! Preview updated.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Tailoring failed."); }
    finally { setBusy(null); }
  }

  const jobMatch = useMemo(() => workspace.jobAnalysis ? assessJobMatch(workspace.resume, workspace.jobAnalysis) : null, [workspace.resume, workspace.jobAnalysis]);
  const requirements = new Map(workspace.jobAnalysis?.requirements.map((item) => [item.id, item.text]));

  return (
    <div>
      <PanelHeading
        eyebrow="Target / Job"
        title="Evidence coverage & Tailoring"
        copy="Deterministic matching distinguishes verified from transferable evidence and flags hard blockers."
        action={
          workspace.jobAnalysis && (
            <Button
              size="sm"
              disabled={busy !== null || !aiConfigured}
              onClick={() => void tailor()}
            >
              {busy === "tailor" ? (
                <>
                  <CircleDashed className="animate-spin" /> Tailoring resume…
                </>
              ) : (
                <>
                  <Sparkles /> Tailor Resume
                </>
              )}
            </Button>
          )
        }
      />
      <div className="space-y-5 p-5">
        {workspace.activeVariant === "tailored" && (
          <div className="rounded-none border border-primary/40 bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Tailored Resume Proposal Active</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  restoreBaseline();
                  toast.info("Restored baseline resume.");
                }}
              >
                <RotateCcw className="mr-1 size-3.5" /> Restore Baseline
              </Button>
            </div>
            {workspace.tailoringSummary && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{workspace.tailoringSummary}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPanel("changes")}>
                Review {workspace.tailoringChanges.length} Diffs
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="job-role">Role</Label>
            <Input id="job-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Senior Software Engineer" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="job-company">Company</Label>
            <Input id="job-company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" className="mt-1.5" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="job-description">Job description</Label>
            <span className="font-mono text-[10px] text-muted-foreground">{description.length.toLocaleString()} / 30,000</span>
          </div>
          <Textarea id="job-description" value={description} onChange={(event) => setDescription(event.target.value.slice(0, 30_000))} className="mt-1.5 min-h-44 resize-y" placeholder="Paste the target job description…" />
        </div>

        <Button disabled={!aiConfigured || description.trim().length < 40 || busy !== null} onClick={() => void analyze()}>
          {busy === "analysis" ? <><CircleDashed className="animate-spin" /> Analyzing requirements…</> : <><Sparkles /> Analyze evidence</>}
        </Button>

        {!aiConfigured && (
          <div className="border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">
            AI is disabled until an API key is configured.
          </div>
        )}

        {workspace.jobAnalysis && jobMatch && (
          <div className="space-y-4 border-t border-border pt-5">
            <section className="border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Apply Recommendation</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        jobMatch.recommendation === "Strong Apply"
                          ? "border-emerald-500/40 text-emerald-400"
                          : jobMatch.recommendation === "Apply"
                            ? "border-blue-500/40 text-blue-400"
                            : jobMatch.recommendation === "Stretch Apply"
                              ? "border-amber-500/40 text-amber-400"
                              : "border-red-500/40 text-red-400"
                      }
                    >
                      {jobMatch.recommendation}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      Match: {jobMatch.score} / 100
                    </span>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Screening Alignment</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {jobMatch.alignment}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{jobMatch.recommendationReason}</p>
            </section>

            {jobMatch.groups.blockers.length > 0 && (
              <section className="border border-destructive/40 bg-destructive/10">
                <div className="flex items-center justify-between border-b border-destructive/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-red-400">Mandatory Blocker Signals</h3>
                  </div>
                  <Badge variant="outline" className="border-destructive text-red-400">
                    {jobMatch.groups.blockers.length}
                  </Badge>
                </div>
                <div className="divide-y divide-destructive/20">
                  {jobMatch.groups.blockers.map((entry) => (
                    <div key={entry.requirementId} className="px-4 py-3">
                      <p className="text-sm font-medium">{requirements.get(entry.requirementId)}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{entry.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-400" />
                  <h3 className="text-sm font-medium">Exact Matches ({jobMatch.groups.strong.length})</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {jobMatch.groups.strong.map((entry) => (
                  <div key={entry.requirementId} className="px-4 py-3">
                    <p className="text-sm">{requirements.get(entry.requirementId)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.explanation}</p>
                    {entry.evidence && <p className="mt-1 font-mono text-[10px] text-primary">Evidence: {entry.evidence}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400" />
                  <h3 className="text-sm font-medium">Transferable & Partial ({jobMatch.groups.transferable.length})</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {jobMatch.groups.transferable.map((entry) => (
                  <div key={entry.requirementId} className="px-4 py-3">
                    <p className="text-sm">{requirements.get(entry.requirementId)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.explanation}</p>
                    {entry.evidence && <p className="mt-1 font-mono text-[10px] text-primary">Evidence: {entry.evidence}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-border">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Unrepresented Qualifications ({jobMatch.groups.gaps.length})</h3>
                </div>
              </div>
              <div className="divide-y divide-border">
                {jobMatch.groups.gaps.map((entry) => (
                  <div key={entry.requirementId} className="px-4 py-3">
                    <p className="text-sm">{requirements.get(entry.requirementId)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        <p className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          AI requests leave this browser and are processed by Google Gemini or OpenRouter. Suggestions remain unapplied until you approve them.
        </p>
      </div>
    </div>
  );
}

function WordDiff({ before, after }: { before: string; after: string }) {
  return <p className="text-sm leading-6">{diffWords(before, after).map((part, index) => <span key={index} className={part.added ? "bg-primary/15 text-primary underline decoration-primary/50" : part.removed ? "bg-destructive/15 text-red-300 line-through" : "text-muted-foreground"}>{part.value}</span>)}</p>;
}

function statusBadge(status: string, stale: boolean) {
  if (stale) return <Badge variant="outline" className="text-warning">Stale</Badge>;
  return <Badge variant="outline" className={status === "accepted" || status === "edited" ? "text-primary" : status === "rejected" ? "text-muted-foreground" : ""}>{status}</Badge>;
}

function GuidanceCitationBadges({ ruleIds }: { ruleIds?: string[] }) {
  if (!ruleIds || ruleIds.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Guidance citations</p>
      <div className="flex flex-wrap gap-1.5">
        {ruleIds.map((ruleId) => {
          const chunk = GUIDANCE_CORPUS.find((c) => c.id === ruleId);
          return (
            <span key={ruleId} className="inline-flex items-center gap-1 rounded-none border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-foreground">
              <span>{chunk?.title ?? ruleId}</span>
              {chunk?.sourceSection && (
                <span className="text-muted-foreground font-mono">({chunk.sourceSection})</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ChangeCard({ change }: { change: ResumeChange }) {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const accept = useWorkspaceStore((state) => state.acceptChange);
  const revert = useWorkspaceStore((state) => state.revertChange);
  const setStatus = useWorkspaceStore((state) => state.setChangeStatus);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(change.type === "rewrite-text" ? change.after : "");
  const stale = change.resumeRevision !== workspace.resumeRevision && change.status === "pending";
  const apply = (value?: string) => { const result = accept(change.id, value); if (!result.ok) toast.error(result.message); else toast.success("Change applied"); };
  return (
    <article className="border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{change.type.replace("-", " ")}</span>
          <Badge variant={change.risk === "safe" ? "secondary" : "outline"}>{change.risk}</Badge>
        </div>
        {statusBadge(change.status, stale)}
      </div>
      <div className="space-y-4 p-4">
        {change.type === "rewrite-text" && (editing ? <Textarea value={edited} onChange={(event) => setEdited(event.target.value)} className="min-h-24" /> : <WordDiff before={change.before} after={change.after} />)}
        {change.type === "remove-item" && <WordDiff before={change.before} after="" />}
        {change.type === "reorder-item" && <p className="text-sm text-muted-foreground">Move this item to the proposed position.</p>}
        <div>
          <p className="text-xs font-medium">Why</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{change.reason}</p>
        </div>
        {change.evidence.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resume evidence</p>
            <div className="flex flex-wrap gap-1.5">
              {change.evidence.map((ev, i) => (
                <span key={i} className="rounded-none border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[10px] text-primary">
                  {ev.type}{ev.quote ? `: “${ev.quote}”` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
        {change.jobRequirementIds.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Target requirement</p>
            <div className="flex flex-wrap gap-1.5">
              {change.jobRequirementIds.map((id) => {
                const req = workspace.jobAnalysis?.requirements.find((r) => r.id === id);
                return (
                  <span key={id} className="rounded-none border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {req?.text ?? id}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <GuidanceCitationBadges ruleIds={change.guidanceRuleIds} />
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" disabled={stale} onClick={() => apply(edited)}>Apply edited</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : change.status === "accepted" || change.status === "edited" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const res = revert(change.id);
                if (res.ok) toast.success("Change reverted to original");
                else toast.error(res.message);
              }}
            >
              <RotateCcw className="mr-1 size-3.5" /> Revert
            </Button>
          ) : (
            <>
              <Button size="sm" disabled={stale || change.status !== "pending"} onClick={() => apply()}>Accept</Button>
              {change.type === "rewrite-text" && (
                <Button size="sm" variant="outline" disabled={stale || change.status !== "pending"} onClick={() => setEditing(true)}>Edit & accept</Button>
              )}
              <Button size="sm" variant="ghost" disabled={change.status !== "pending"} onClick={() => setStatus(change.id, "rejected")}><X /> Reject</Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function ChangesPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const acceptAll = useWorkspaceStore((state) => state.acceptAllSafe);
  const rejectRemaining = useWorkspaceStore((state) => state.rejectRemaining);
  const pending = workspace.tailoringChanges.filter((change) => change.status === "pending").length;
  return <div><PanelHeading eyebrow="Review / Tailoring" title="Atomic proposals" copy="Every operation is revalidated against the current resume before application." action={pending > 0 && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={rejectRemaining}>Reject remaining</Button><Button size="sm" onClick={() => { const result = acceptAll(); toast.success(`${result.applied} safe changes applied`); }}>Accept all safe</Button></div>} /><div className="space-y-4 p-5">{workspace.tailoringChanges.length === 0 ? <EmptyReview label="No tailoring proposals yet" /> : workspace.tailoringChanges.map((change) => <ChangeCard key={change.id} change={change} />)}{workspace.unsupportedGaps.length > 0 && <section className="border border-border"><div className="border-b border-border px-4 py-3"><h3 className="text-sm font-medium">Unsupported gaps · not applicable</h3></div>{workspace.unsupportedGaps.map((gap) => <div key={gap.id} className="border-b border-border px-4 py-3 last:border-b-0"><p className="text-sm text-muted-foreground">{gap.explanation}</p></div>)}</section>}</div></div>;
}

function EmptyReview({ label }: { label: string }) { return <div className="grid min-h-56 place-items-center border border-dashed border-border text-center"><div><RefreshCw className="mx-auto size-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">Run the relevant AI review when you are ready.</p></div></div>; }

export function ProofreadPanel({ aiConfigured }: { aiConfigured: boolean }) {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setProofreading = useWorkspaceStore((state) => state.setProofreading);
  const accept = useWorkspaceStore((state) => state.acceptProofreading);
  const reject = useWorkspaceStore((state) => state.rejectProofreading);
  const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); try { const result = await postAI<ProofreadingResponse>("/api/ai/proofread", { resume: workspace.resume, resumeRevision: workspace.resumeRevision }); setProofreading(result.changes); toast.success(`${result.changes.length} proofreading changes found`); } catch (error) { toast.error(error instanceof Error ? error.message : "Proofreading failed."); } finally { setBusy(false); } }
  return <div><PanelHeading eyebrow="Review / Proofread" title="Minimal language corrections" copy="Meaning, facts, technologies, and metrics are preserved." action={<Button size="sm" disabled={!aiConfigured || busy} onClick={() => void run()}>{busy ? <CircleDashed className="animate-spin" /> : <Sparkles />} Run proofread</Button>} /><div className="space-y-4 p-5">{workspace.proofreadingChanges.length === 0 ? <EmptyReview label="No proofreading changes" /> : workspace.proofreadingChanges.map((change) => { const stale = change.resumeRevision !== workspace.resumeRevision && change.status === "pending"; return <article key={change.id} className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><Badge variant="outline">{change.category}</Badge>{statusBadge(change.status, stale)}</div><div className="space-y-4 p-4"><WordDiff before={change.before} after={change.after} /><p className="text-xs leading-5 text-muted-foreground">{change.explanation}</p><GuidanceCitationBadges ruleIds={change.guidanceRuleIds} /><div className="flex gap-2"><Button size="sm" disabled={stale || change.status !== "pending"} onClick={() => { const result = accept(change.id); if (result.ok) toast.success("Correction applied"); else toast.error(result.message); }}>Accept</Button><Button size="sm" variant="ghost" disabled={change.status !== "pending"} onClick={() => reject(change.id)}>Reject</Button></div></div></article>; })}</div></div>;
}

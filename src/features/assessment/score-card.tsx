"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assessResume,
  STAGE_LABEL,
  type CareerStage,
} from "@/features/assessment/scoring";
import type { Resume } from "@/features/resume/schema";
import { useWorkspaceStore } from "@/store/workspace-store";

const STAGES: CareerStage[] = [
  "student",
  "new-graduate",
  "early-career",
  "mid-level",
  "senior",
  "staff-principal",
  "career-changer",
  "returning-professional",
];

export function ScoreCard({ resume }: { resume: Resume }) {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const setCareerStageOverride = useWorkspaceStore(
    (state) => state.setCareerStageOverride,
  );
  const [expanded, setExpanded] = useState(false);

  const stageOverride = workspace?.careerStageOverride ?? undefined;
  const assessment = useMemo(
    () => assessResume(resume, stageOverride),
    [resume, stageOverride],
  );

  return (
    <section className="border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-none border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Career Stage Tier
              </span>
              <Badge variant="outline" className="text-xs">
                {assessment.careerStageLabel}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {assessment.careerStageExplanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Override:</span>
          <Select
            value={stageOverride ?? assessment.careerStage}
            onValueChange={(val) =>
              setCareerStageOverride(val === assessment.careerStage ? null : (val as CareerStage))
            }
          >
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage} value={stage} className="text-xs">
                  {STAGE_LABEL[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Resume Quality
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {assessment.quality}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
                <Badge
                  variant="outline"
                  className={
                    assessment.quality >= 75
                      ? "border-emerald-500/30 text-emerald-400"
                      : assessment.quality >= 55
                        ? "border-amber-500/30 text-amber-400"
                        : "border-red-500/30 text-red-400"
                  }
                >
                  {assessment.quality >= 75
                    ? "Solid"
                    : assessment.quality >= 55
                      ? "Improving"
                      : "Needs Polish"}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-muted-foreground"
            >
              {expanded ? (
                <>
                  Less <ChevronUp className="ml-1 size-3.5" />
                </>
              ) : (
                <>
                  Details <ChevronDown className="ml-1 size-3.5" />
                </>
              )}
            </Button>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Stage-weighted assessment of technical evidence, action verbs, and impact metrics.
          </p>
        </div>

        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            ATS Compatibility
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {assessment.ats}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
            <Badge
              variant="outline"
              className="border-primary/30 text-primary"
            >
              Single-column verified
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Single-column hierarchy, clear standard dates, clean bullet fragments, and recruiter readability.
          </p>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold text-foreground">
            Quality Dimension Breakdown
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {assessment.qualityBreakdown.map((item) => {
              const pct = Math.round((item.score / item.max) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-medium">
                      {item.score} / {item.max} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-none bg-border">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pct >= 75
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {assessment.recommendations.length > 0 && (
        <div className="border-t border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Recommended Improvements
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-none bg-primary" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

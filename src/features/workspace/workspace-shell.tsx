"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Code2,
  Columns2,
  FileCheck2,
  FilePenLine,
  GraduationCap,
  History,
  LayoutDashboard,
  Menu,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  Wrench,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChangesPanel, JobPanel, ProofreadPanel } from "@/features/workspace/ai-panels";
import { GuidancePanel } from "@/features/guidance/guidance-panel";
import { LatexPanel } from "@/features/workspace/latex-panel";
import { FormatPanel } from "@/features/presentation/format-panel";
import { EducationPanel, ExperiencePanel, OverviewPanel, ProjectsPanel, SkillsPanel } from "@/features/workspace/resume-panels";
import { useWorkspaceStore, type WorkspacePanel } from "@/store/workspace-store";

const PdfPreview = dynamic(() => import("@/features/workspace/pdf-preview").then((module) => module.PdfPreview), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[500px] place-items-center bg-[#d8dad7] text-xs text-zinc-500">
      Loading document preview…
    </div>
  ),
});

const nav: Array<{ id: WorkspacePanel; label: string; icon: typeof LayoutDashboard; group: string }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Resume" },
  { id: "experience", label: "Experience", icon: BriefcaseBusiness, group: "Resume" },
  { id: "projects", label: "Projects", icon: Wrench, group: "Resume" },
  { id: "skills", label: "Skills", icon: BookOpen, group: "Resume" },
  { id: "education", label: "Education", icon: GraduationCap, group: "Resume" },
  { id: "format", label: "Format", icon: SlidersHorizontal, group: "Resume" },
  { id: "guidance", label: "Guidance", icon: ShieldCheck, group: "Resume" },
  { id: "job", label: "Target Job", icon: Sparkles, group: "AI Tailoring" },
  { id: "changes", label: "Diffs & Changes", icon: FileCheck2, group: "AI Tailoring" },
  { id: "proofread", label: "Proofread", icon: FilePenLine, group: "AI Tailoring" },
  { id: "latex", label: "LaTeX Source", icon: Code2, group: "Source" },
];

function CurrentPanel({ aiConfigured }: { aiConfigured: boolean }) {
  const panel = useWorkspaceStore((state) => state.panel);
  if (panel === "overview") return <OverviewPanel />;
  if (panel === "experience") return <ExperiencePanel />;
  if (panel === "projects") return <ProjectsPanel />;
  if (panel === "skills") return <SkillsPanel />;
  if (panel === "education") return <EducationPanel />;
  if (panel === "format") return <FormatPanel />;
  if (panel === "guidance") return <GuidancePanel />;
  if (panel === "job") return <JobPanel aiConfigured={aiConfigured} />;
  if (panel === "changes") return <ChangesPanel />;
  if (panel === "proofread") return <ProofreadPanel aiConfigured={aiConfigured} />;
  return <LatexPanel />;
}

function ChangeCount() {
  const count = useWorkspaceStore(
    (state) => state.workspace?.tailoringChanges.filter((change) => change.status === "pending").length ?? 0
  );
  return count ? <Badge className="ml-auto h-5 min-w-5 px-1.5 text-[9px]">{count}</Badge> : null;
}

function Navigation({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const panel = useWorkspaceStore((state) => state.panel);
  const setPanel = useWorkspaceStore((state) => state.setPanel);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-card/45">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="grid size-7 shrink-0 place-items-center border border-primary/40 bg-primary/10">
            <FilePenLine className="size-3.5 text-primary" />
          </div>
          {!collapsed && <span className="truncate text-xs font-semibold">Resume Builder</span>}
        </Link>
        <Button size="icon" variant="ghost" onClick={onToggle} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <nav aria-label="Workspace sections" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {nav.map((item, index) => {
          const Icon = item.icon;
          const heading = index === 0 || nav[index - 1].group !== item.group;
          const button = (
            <button
              type="button"
              onClick={() => setPanel(item.id)}
              aria-current={panel === item.id ? "page" : undefined}
              className={`mb-1 flex h-9 w-full items-center gap-2 border-l-2 px-2 text-left text-xs transition-colors ${
                panel === item.id
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.id === "changes" && <ChangeCount />}
            </button>
          );

          return (
            <div key={item.id}>
              {heading && !collapsed && (
                <p className="mb-2 mt-4 px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground first:mt-0">
                  {item.group}
                </p>
              )}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                button
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && <p className="text-[10px] leading-4 text-muted-foreground">Local workspace · IndexedDB</p>}
      </div>
    </aside>
  );
}

export function WorkspaceShell({ aiConfigured }: { aiConfigured: boolean }) {
  const { hydrate, hydrated, workspace, saveStatus, past, future, undo, redo, panel, setPanel, compilerMode } = useWorkspaceStore();
  const [collapsed, setCollapsed] = useState(false);
  const [desktopView, setDesktopView] = useState<"split" | "editor" | "preview">("split");
  const [mobileTabOverride, setMobileTabOverride] = useState<"editor" | "ai" | "preview" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const activeMobileTab: "editor" | "ai" | "preview" =
    mobileTabOverride ??
    (panel === "job" || panel === "changes" || panel === "proofread" ? "ai" : "editor");

  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-center">
          <History className="mx-auto size-5 animate-pulse text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Restoring local workspace…</p>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-sm text-center">
          <Menu className="mx-auto size-5 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">No workspace found</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upload a resume PDF, Word doc, or open the sample workspace.</p>
          <Button asChild className="mt-5">
            <Link href="/">Upload Resume</Link>
          </Button>
        </div>
      </main>
    );
  }

  const pendingChanges = workspace.tailoringChanges.filter((c) => c.status === "pending").length;

  return (
    <main className="flex h-dvh min-h-[600px] flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile Drawer Trigger */}
          <div className="min-[1200px]:hidden">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border p-4">
                  <SheetTitle className="text-xs font-semibold">Resume Navigation</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto p-3">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMobileTabOverride(null);
                          setPanel(item.id);
                          setDrawerOpen(false);
                        }}
                        className={`mb-1 flex h-9 w-full items-center gap-2.5 rounded-sm px-3 text-left text-xs transition-colors ${
                          panel === item.id
                            ? "bg-primary/10 font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.id === "changes" && <ChangeCount />}
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="hidden font-medium text-xs text-muted-foreground hover:text-foreground sm:inline">
            ← Home
          </Link>
          <span className="truncate text-xs font-semibold sm:font-medium">{workspace.name}</span>
          <span className="hidden font-mono text-[9px] text-muted-foreground md:inline">
            REV {workspace.resumeRevision.slice(-8).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <span className="mr-1 hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:flex">
            <Save className="size-3" />
            {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save error" : "Saved"}
          </span>

          <Button size="icon" variant="ghost" className="size-8" disabled={past.length === 0} onClick={undo} aria-label="Undo">
            <Undo2 className="size-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="size-8" disabled={future.length === 0} onClick={redo} aria-label="Redo">
            <Redo2 className="size-3.5" />
          </Button>

          {/* Desktop View Mode Toggles */}
          <div className="hidden min-[1200px]:flex items-center gap-1 border-l border-border pl-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={desktopView === "split" ? "secondary" : "ghost"}
                  className="size-8"
                  onClick={() => setDesktopView("split")}
                  aria-label="Split view (Editor + PDF Preview)"
                >
                  <Columns2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Split View (Editor + PDF)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={desktopView === "editor" ? "secondary" : "ghost"}
                  className="size-8"
                  onClick={() => setDesktopView("editor")}
                  aria-label="Focus Editor (Full Width)"
                >
                  <PanelRight className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focus Editor (Full Width)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={desktopView === "preview" ? "secondary" : "ghost"}
                  className="size-8"
                  onClick={() => setDesktopView("preview")}
                  aria-label="Focus PDF Preview"
                >
                  <PanelLeft className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focus PDF Preview</TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setPanel("format")}
                className="hidden items-center gap-1.5 rounded border border-border bg-card/60 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground hover:border-foreground/30 hover:text-foreground md:inline-flex"
              >
                <span className={`size-1.5 rounded-full ${compilerMode === "cloud" ? "bg-sky-500" : compilerMode === "auto" ? "bg-amber-500" : "bg-emerald-500"}`} />
                {compilerMode === "cloud" ? "TeX Live (Cloud)" : compilerMode === "auto" ? "Auto Hybrid" : "Siglum WASM"}
              </button>
            </TooltipTrigger>
            <TooltipContent>Compiler: {compilerMode.toUpperCase()} (Click to open Format & Layout)</TooltipContent>
          </Tooltip>

          {!aiConfigured && (
            <Badge variant="outline" className="hidden text-warning sm:flex text-[9px]">
              AI offline
            </Badge>
          )}
        </div>
      </header>

      {/* Desktop 3-Column / View-Mode Layout */}
      <div
        className="hidden min-h-0 flex-1 min-[1200px]:grid"
        style={{
          gridTemplateColumns:
            desktopView === "editor"
              ? `${collapsed ? "52px" : "210px"} 1fr`
              : desktopView === "preview"
              ? `${collapsed ? "52px" : "210px"} 1fr`
              : `${collapsed ? "52px" : "210px"} minmax(480px, 1.05fr) minmax(420px, 0.95fr)`,
        }}
      >
        <Navigation collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

        {desktopView !== "preview" && (
          <div
            className={`flex min-h-0 flex-1 flex-col border-r border-border bg-background ${
              panel === "latex" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            <CurrentPanel aiConfigured={aiConfigured} />
          </div>
        )}

        {desktopView !== "editor" && <PdfPreview />}
      </div>

      {/* Mobile / Tablet Responsive Layout */}
      <div className="flex min-h-0 flex-1 flex-col min-[1200px]:hidden">
        {/* Main View Tabs */}
        <Tabs
          value={activeMobileTab}
          onValueChange={(val) => {
            const next = val as "editor" | "ai" | "preview";
            setMobileTabOverride(next);
            if (next === "editor" && (panel === "job" || panel === "changes" || panel === "proofread")) {
              setPanel("overview");
            } else if (next === "ai" && (panel !== "job" && panel !== "changes" && panel !== "proofread")) {
              setPanel("job");
            }
          }}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="border-b border-border bg-card/60 px-3 py-1.5">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor" className="text-xs">
                <FileText className="size-3.5 mr-1.5" /> Editor
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs relative">
                <Sparkles className="size-3.5 mr-1.5 text-primary" /> Tailor
                {pendingChanges > 0 && (
                  <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[8px] bg-primary text-primary-foreground">
                    {pendingChanges}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                PDF Preview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Sub-navigation for Editor */}
          {activeMobileTab === "editor" && (
            <div className="flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-1.5">
              {(["overview", "experience", "projects", "skills", "education", "format", "guidance", "latex"] as WorkspacePanel[]).map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant={panel === id ? "secondary" : "ghost"}
                  className="h-7 shrink-0 text-[11px] capitalize"
                  onClick={() => {
                    setMobileTabOverride(null);
                    setPanel(id);
                  }}
                >
                  {id}
                </Button>
              ))}
            </div>
          )}

          {/* Sub-navigation for AI Tailoring */}
          {activeMobileTab === "ai" && (
            <div className="flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-1.5">
              {(["job", "changes", "proofread"] as WorkspacePanel[]).map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant={panel === id ? "secondary" : "ghost"}
                  className="h-7 shrink-0 text-[11px] capitalize"
                  onClick={() => {
                    setMobileTabOverride(null);
                    setPanel(id);
                  }}
                >
                  {id === "job" ? "Target Job" : id === "changes" ? `Diffs (${pendingChanges})` : "Proofread"}
                </Button>
              ))}
            </div>
          )}

          <TabsContent value="editor" className="min-h-0 flex-1 overflow-y-auto">
            <CurrentPanel aiConfigured={aiConfigured} />
          </TabsContent>

          <TabsContent value="ai" className="min-h-0 flex-1 overflow-y-auto">
            <CurrentPanel aiConfigured={aiConfigured} />
          </TabsContent>

          <TabsContent value="preview" className="min-h-0 flex-1 overflow-hidden">
            <PdfPreview compact />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}


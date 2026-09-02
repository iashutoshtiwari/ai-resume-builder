"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state through useSortable. */

import { ArrowDown, ArrowUp, Check, Cloud, Columns2, Cpu, GripVertical, LayoutTemplate, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_PRESENTATION,
  type RenderedSection,
  type ResumePresentation,
} from "@/features/presentation/schema";
import { useWorkspaceStore } from "@/store/workspace-store";

const PRESETS: Array<{
  id: ResumePresentation["templateId"];
  name: string;
  description: string;
  preset: ResumePresentation;
}> = [
  {
    id: "canonical",
    name: "Canonical",
    description: "Centered header, ruled section headings, XCharter serif type, balanced density.",
    preset: {
      templateId: "canonical",
      fontFamily: "xcharter",
      paperSize: "letter",
      fontSize: 11,
      margin: 0.5,
      density: "balanced",
      sections: ["skills", "experience", "projects", "education"],
    },
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tighter vertical rhythm, 10.5pt type, 0.4in margins for content-heavy resumes.",
    preset: {
      templateId: "compact",
      fontFamily: "xcharter",
      paperSize: "letter",
      fontSize: 10.5,
      margin: 0.4,
      density: "compact",
      sections: ["skills", "experience", "projects", "education"],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Left-aligned header, restrained uppercase headings, TeX Gyre Heros sans-serif.",
    preset: {
      templateId: "minimal",
      fontFamily: "tex-gyre-heros",
      paperSize: "letter",
      fontSize: 11,
      margin: 0.5,
      density: "balanced",
      sections: ["skills", "experience", "projects", "education"],
    },
  },
];

const SECTION_LABELS: Record<RenderedSection, string> = {
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
};

const ALL_SECTIONS: RenderedSection[] = ["skills", "experience", "projects", "education"];

function moveSection(items: RenderedSection[], from: number, to: number): RenderedSection[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SortableSectionItem({
  id,
  index,
  total,
  onMove,
  onToggle,
  enabled,
}: {
  id: RenderedSection;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
  enabled: boolean;
}) {
  const sortable = useSortable({ id });

  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.5 : 1,
      }}
      className="flex items-center justify-between gap-3 border border-border bg-background px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={sortable.setActivatorNodeRef}
          {...sortable.attributes}
          {...sortable.listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${SECTION_LABELS[id]}`}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-sm font-medium">{SECTION_LABELS[id]}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label={`Move ${SECTION_LABELS[id]} up`}
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          aria-label={`Move ${SECTION_LABELS[id]} down`}
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <label className="ml-2 flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            disabled={enabled && total === 1}
            className="size-3.5 rounded border-border"
          />
          <span className="sr-only">Toggle ${SECTION_LABELS[id]}</span>
        </label>
      </div>
    </div>
  );
}

export function FormatPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setPresentation = useWorkspaceStore((state) => state.setPresentation);
  const compilerMode = useWorkspaceStore((state) => state.compilerMode);
  const setCompilerMode = useWorkspaceStore((state) => state.setCompilerMode);
  const presentation = workspace.presentation ?? DEFAULT_PRESENTATION;

  const update = (patch: Partial<ResumePresentation>) => {
    setPresentation({ ...presentation, ...patch });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const from = presentation.sections.indexOf(event.active.id as RenderedSection);
    const to = presentation.sections.indexOf(event.over.id as RenderedSection);
    if (from !== -1 && to !== -1) {
      update({ sections: arrayMove(presentation.sections, from, to) });
    }
  }

  function handleToggleSection(section: RenderedSection) {
    if (presentation.sections.includes(section)) {
      if (presentation.sections.length <= 1) return; // Keep at least one section
      update({ sections: presentation.sections.filter((s) => s !== section) });
    } else {
      update({ sections: [...presentation.sections, section] });
    }
  }

  function handleApplyPreset(preset: ResumePresentation) {
    setPresentation({
      ...preset,
      sections: presentation.sections.length > 0 ? presentation.sections : preset.sections,
    });
  }

  const isPresetActive = (item: typeof PRESETS[number]) => {
    return (
      presentation.templateId === item.preset.templateId &&
      presentation.fontFamily === item.preset.fontFamily &&
      presentation.fontSize === item.preset.fontSize &&
      presentation.margin === item.preset.margin &&
      presentation.density === item.preset.density
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className="border-b border-border px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Resume / Presentation</p>
        <div className="mt-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Format & Layout</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPresentation(DEFAULT_PRESENTATION)}
            className="text-xs"
          >
            <RotateCcw className="mr-1.5 size-3.5" /> Reset to canonical
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Deterministic single-column styling vetted against r/EngineeringResumes ATS guidelines. Changes invalidate the preview and require recompilation.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 p-5">
        {workspace.manualLatex !== null && (
          <div className="rounded border border-amber-300/80 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Manual LaTeX override in use:</span> Changing presentation options updates generated LaTeX in the background, but manual LaTeX edits take precedence until reset. The ATS format audit labels manual LaTeX as unverified.
          </div>
        )}

        {/* Style Presets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <LayoutTemplate className="size-4 text-primary" /> Style Presets
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground">Single-column</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PRESETS.map((item) => {
              const active = isPresetActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleApplyPreset(item.preset)}
                  className={`flex flex-col text-left rounded-lg border p-3.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  }`}
                  aria-pressed={active}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold">{item.name}</span>
                    {active && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{item.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Typography & Geometry Controls */}
        <section className="space-y-4 border-t border-border pt-5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-primary" /> Typography & Geometry
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Font Family */}
            <div className="space-y-1.5">
              <Label htmlFor="font-family-select" className="text-xs text-muted-foreground">
                Font Family
              </Label>
              <Select
                value={presentation.fontFamily}
                onValueChange={(value) => update({ fontFamily: value as ResumePresentation["fontFamily"] })}
              >
                <SelectTrigger id="font-family-select">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Serif Typography
                  </div>
                  <SelectItem value="xcharter">XCharter (Serif · #1 EngineeringResumes)</SelectItem>
                  <SelectItem value="latin-modern">Latin Modern (Serif · Classic Academic)</SelectItem>
                  <SelectItem value="newtx">New TX (Serif · Times Roman dense)</SelectItem>
                  <SelectItem value="newpx">New PX (Serif · Palatino executive)</SelectItem>
                  <SelectItem value="ebgaramond">EB Garamond (Serif · Traditional literary)</SelectItem>
                  <SelectItem value="libertine">Linux Libertine (Serif · Refined European)</SelectItem>

                  <div className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sans-Serif Typography
                  </div>
                  <SelectItem value="tex-gyre-heros">TeX Gyre Heros (Sans · Helvetica #1 tech)</SelectItem>
                  <SelectItem value="lato">Lato (Sans · Humanist tech)</SelectItem>
                  <SelectItem value="roboto">Roboto (Sans · Geometric neo-grotesque)</SelectItem>
                  <SelectItem value="sourcesanspro">Source Sans Pro (Sans · Adobe UI clean)</SelectItem>
                  <SelectItem value="inter">Inter (Sans · Screen interface standard)</SelectItem>
                  <SelectItem value="firasans">Fira Sans (Sans · Mozilla energetic tech)</SelectItem>

                  <div className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Monospace
                  </div>
                  <SelectItem value="inconsolata">Inconsolata (Code & Keywords)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Paper Size */}
            <div className="space-y-1.5">
              <Label htmlFor="paper-size-select" className="text-xs text-muted-foreground">
                Paper Size
              </Label>
              <Select
                value={presentation.paperSize}
                onValueChange={(value) => update({ paperSize: value as ResumePresentation["paperSize"] })}
              >
                <SelectTrigger id="paper-size-select">
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">US Letter (8.5 × 11 in · US/Canada default)</SelectItem>
                  <SelectItem value="a4">A4 (210 × 297 mm · International)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size-select" className="text-xs text-muted-foreground">
                  Body Font Size
                </Label>
                <span className="font-mono text-[10px] text-muted-foreground">min 10.5pt</span>
              </div>
              <Select
                value={String(presentation.fontSize)}
                onValueChange={(value) => update({ fontSize: Number(value) as ResumePresentation["fontSize"] })}
              >
                <SelectTrigger id="font-size-select">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10.5">10.5 pt (Compact / senior detail)</SelectItem>
                  <SelectItem value="11">11 pt (Recommended standard)</SelectItem>
                  <SelectItem value="12">12 pt (Large / relaxed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Margins */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="margin-select" className="text-xs text-muted-foreground">
                  Page Margins
                </Label>
                <span className="font-mono text-[10px] text-muted-foreground">min 0.4in</span>
              </div>
              <Select
                value={String(presentation.margin)}
                onValueChange={(value) => update({ margin: Number(value) as ResumePresentation["margin"] })}
              >
                <SelectTrigger id="margin-select">
                  <SelectValue placeholder="Select margin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.4">0.4 in (Maximum space)</SelectItem>
                  <SelectItem value="0.5">0.5 in (Balanced standard)</SelectItem>
                  <SelectItem value="0.65">0.65 in (Generous white space)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Density */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="density-select" className="text-xs text-muted-foreground">
                Vertical Density (Rhythm & Spacing)
              </Label>
              <Select
                value={presentation.density}
                onValueChange={(value) => update({ density: value as ResumePresentation["density"] })}
              >
                <SelectTrigger id="density-select">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact (Tight item separation and header gaps)</SelectItem>
                  <SelectItem value="balanced">Balanced (Standard resume whitespace and line height)</SelectItem>
                  <SelectItem value="relaxed">Relaxed (Generous spacing and increased linespread)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Section Ordering & Visibility */}
        <section className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Columns2 className="size-4 text-primary" /> Section Order & Visibility
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drag or use keyboard / arrows to reorder. The wiki recommends leading with Experience for experienced candidates, or Education for students.
              </p>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={presentation.sections} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {presentation.sections.map((section, index) => (
                  <SortableSectionItem
                    key={section}
                    id={section}
                    index={index}
                    total={presentation.sections.length}
                    onMove={(dir) => update({ sections: moveSection(presentation.sections, index, index + dir) })}
                    onToggle={() => handleToggleSection(section)}
                    enabled={true}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Disabled sections */}
          {ALL_SECTIONS.filter((s) => !presentation.sections.includes(s)).length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground font-medium">Disabled sections</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTIONS.filter((s) => !presentation.sections.includes(s)).map((section) => (
                  <Button
                    key={section}
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleSection(section)}
                    className="text-xs"
                  >
                    + Enable {SECTION_LABELS[section]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Compiler Engine */}
        <section className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Cpu className="size-4 text-primary" /> LaTeX Compiler Engine
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select your preferred compilation pipeline. Both options are 100% free and production-grade.
              </p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">Hybrid</span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setCompilerMode("wasm")}
              className={`flex flex-col text-left rounded-lg border p-3 transition-all ${
                compilerMode === "wasm"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-primary" /> Browser WASM
                </span>
                {compilerMode === "wasm" && <Check className="size-3.5 text-primary" />}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                Fast, instant, 100% offline & private. Runs directly in WebAssembly.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCompilerMode("cloud")}
              className={`flex flex-col text-left rounded-lg border p-3 transition-all ${
                compilerMode === "cloud"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Cloud className="size-3.5 text-primary" /> Cloud TeX Live
                </span>
                {compilerMode === "cloud" && <Check className="size-3.5 text-primary" />}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                Google Cloud Run ($0/mo). Full font inventory, tikz, any package.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCompilerMode("auto")}
              className={`flex flex-col text-left rounded-lg border p-3 transition-all ${
                compilerMode === "auto"
                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" /> Auto Hybrid
                </span>
                {compilerMode === "auto" && <Check className="size-3.5 text-primary" />}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                Fast local WASM with automatic fallback to Cloud TeX Live if needed.
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

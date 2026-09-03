"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state through useSortable. */

import { IconArrowDown, IconArrowUp, IconColumns, IconGripVertical, IconLock, IconWorld } from "@tabler/icons-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_PRESENTATION, type RenderedSection, type ResumePresentation } from "@/features/presentation/schema";
import { useWorkspaceStore } from "@/store/workspace-store";

const SECTION_LABELS: Record<RenderedSection, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
  achievements: "Achievements",
};

const ALL_SECTIONS = DEFAULT_PRESENTATION.sections;

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
}: {
  id: RenderedSection;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
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
          className="-m-1 cursor-grab touch-none p-1.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${SECTION_LABELS[id]}`}
        >
          <IconGripVertical className="size-4" />
        </button>
        <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
        <span className="text-sm font-medium">{SECTION_LABELS[id]}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${SECTION_LABELS[id]} up`}>
          <IconArrowUp className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Move ${SECTION_LABELS[id]} down`}>
          <IconArrowDown className="size-3.5" />
        </Button>
        <label className="ml-1.5 -m-1 flex cursor-pointer items-center justify-center p-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked onChange={onToggle} disabled={total === 1} className="size-4 rounded-none border-border" />
          <span className="sr-only">Hide {SECTION_LABELS[id]}</span>
        </label>
      </div>
    </div>
  );
}

export function FormatPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const setPresentation = useWorkspaceStore((state) => state.setPresentation);
  const presentation = workspace.presentation ?? DEFAULT_PRESENTATION;
  const update = (patch: Partial<ResumePresentation>) => setPresentation({ ...presentation, ...patch });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const from = presentation.sections.indexOf(event.active.id as RenderedSection);
    const to = presentation.sections.indexOf(event.over.id as RenderedSection);
    if (from !== -1 && to !== -1) update({ sections: arrayMove(presentation.sections, from, to) });
  }

  function toggleSection(section: RenderedSection) {
    if (presentation.sections.includes(section)) {
      if (presentation.sections.length > 1) update({ sections: presentation.sections.filter((item) => item !== section) });
    } else {
      update({ sections: [...presentation.sections, section] });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-card">
      <header className="border-b border-border px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Resume / Template</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Canonical format</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
          ArqeloCV locks typography, margins, spacing, headings, and entry layouts. Structured editing controls only content, section visibility, section order, and paper size.
        </p>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <section className="border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <IconLock className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">ArqeloCV template · version 1</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                11pt XCharter, 0.5-inch margins, ruled section headings, canonical bullets, and single-column structure are fixed. Use the LaTeX source editor only when you intentionally want to override the template.
              </p>
            </div>
          </div>
        </section>

        {workspace.latexMode === "manual" && (
          <div className="border border-warning/40 bg-warning/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
            Manual LaTeX override is active. Changes here update generated source in the background but do not replace your manual source.
          </div>
        )}

        <section className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold"><IconWorld className="size-4 text-primary" /> Paper size</h3>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="paper-size-select" className="text-xs text-muted-foreground">Approved page format</Label>
            <Select value={presentation.paperSize} onValueChange={(value) => update({ paperSize: value as ResumePresentation["paperSize"] })}>
              <SelectTrigger id="paper-size-select"><SelectValue placeholder="Select paper size" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">US Letter · North America</SelectItem>
                <SelectItem value="a4">A4 · International</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-5">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold"><IconColumns className="size-4 text-primary" /> Section order & visibility</h3>
            <p className="mt-1 text-xs text-muted-foreground">Drag or use the arrow buttons to reorder. Empty enabled sections are never rendered.</p>
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
                    onMove={(direction) => update({ sections: moveSection(presentation.sections, index, index + direction) })}
                    onToggle={() => toggleSection(section)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {ALL_SECTIONS.some((section) => !presentation.sections.includes(section)) && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">Hidden sections</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTIONS.filter((section) => !presentation.sections.includes(section)).map((section) => (
                  <Button key={section} size="sm" variant="outline" onClick={() => toggleSection(section)} className="text-xs">
                    + Enable {SECTION_LABELS[section]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

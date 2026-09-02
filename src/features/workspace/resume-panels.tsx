"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state through useSortable. */

import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Resume, TextItem } from "@/features/resume/schema";
import { createId } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="border-b border-border px-5 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{copy}</p></header>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string }) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label><Input id={id} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
}

function ConfirmDelete({ label, onDelete }: { label: string; onDelete: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label={`Delete ${label}`}><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {label}?</AlertDialogTitle><AlertDialogDescription>This removes the item and may make pending AI suggestions stale. You can still undo the edit during this session.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

export function OverviewPanel() {
  const workspace = useWorkspaceStore((state) => state.workspace)!;
  const update = useWorkspaceStore((state) => state.updateResume);
  const setBasics = (patch: Partial<Resume["basics"]>) => update((resume) => ({ ...resume, basics: { ...resume.basics, ...patch } }));
  return <div><SectionHeading eyebrow="Resume / Overview" title="Identity and contact" copy="Keep this factual. Structured edits regenerate the supported LaTeX source." /><div className="grid gap-5 p-5 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Full name" value={workspace.resume.basics.name} onChange={(name) => setBasics({ name })} /></div><Field label="Headline" value={workspace.resume.basics.headline} onChange={(headline) => setBasics({ headline })} placeholder="Software Engineer" /><Field label="Location" value={workspace.resume.basics.location} onChange={(location) => setBasics({ location })} /><Field label="Email" value={workspace.resume.basics.email} onChange={(email) => setBasics({ email })} /><Field label="Phone" value={workspace.resume.basics.phone} onChange={(phone) => setBasics({ phone })} /></div></div>;
}

function BulletEditor({ value, index, count, onText, onMove, onDelete, dragHandle }: { value: string; index: number; count: number; onText: (value: string) => void; onMove: (direction: -1 | 1) => void; onDelete: () => void; dragHandle?: React.ReactNode }) {
  return <div className="group grid grid-cols-[28px_1fr_auto] gap-2 border-t border-border py-3 first:border-t-0"><div className="flex flex-col items-center pt-2">{dragHandle}<span className="mt-1 font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span></div><Textarea value={value} onChange={(event) => onText(event.target.value)} className="min-h-20 resize-y border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" aria-label={`Bullet ${index + 1}`} /><div className="flex flex-col"><Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move bullet ${index + 1} up`}><ArrowUp /></Button><Button size="icon" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move bullet ${index + 1} down`}><ArrowDown /></Button><ConfirmDelete label={`bullet ${index + 1}`} onDelete={onDelete} /></div></div>;
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SortableBullet({ bullet, index, bullets, onChange }: { bullet: TextItem; index: number; bullets: TextItem[]; onChange: (items: TextItem[]) => void }) {
  const sortable = useSortable({ id: bullet.id });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.55 : 1 }}><BulletEditor value={bullet.text} index={index} count={bullets.length} onText={(text) => onChange(bullets.map((item) => item.id === bullet.id ? { ...item, text } : item))} onMove={(direction) => onChange(move(bullets, index, index + direction))} onDelete={() => onChange(bullets.filter((item) => item.id !== bullet.id))} dragHandle={<button type="button" ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label={`Drag bullet ${index + 1}`}><GripVertical className="size-3.5" /></button>} /></div>;
}

function SortableBulletList({ bullets, onChange }: { bullets: TextItem[]; onChange: (items: TextItem[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) { if (!event.over || event.active.id === event.over.id) return; const from = bullets.findIndex((item) => item.id === event.active.id); const to = bullets.findIndex((item) => item.id === event.over!.id); onChange(arrayMove(bullets, from, to)); }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={bullets.map((item) => item.id)} strategy={verticalListSortingStrategy}>{bullets.map((bullet, index) => <SortableBullet key={bullet.id} bullet={bullet} index={index} bullets={bullets} onChange={onChange} />)}</SortableContext></DndContext>;
}

export function ExperiencePanel() {
  const resume = useWorkspaceStore((state) => state.workspace!.resume);
  const update = useWorkspaceStore((state) => state.updateResume);
  const patchEntry = (id: string, patch: Partial<Resume["experience"][number]>) => update((current) => ({ ...current, experience: current.experience.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  return <div><SectionHeading eyebrow="Resume / Experience" title="Work experience" copy="Use concise, evidenced accomplishment statements. Reorder controls work with keyboard and pointer." /><div className="space-y-4 p-5">{resume.experience.map((entry) => <section key={entry.id} className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-medium">{entry.role || "Untitled role"}</p><ConfirmDelete label={entry.role || "experience"} onDelete={() => update((current) => ({ ...current, experience: current.experience.filter((item) => item.id !== entry.id) }))} /></div><div className="grid gap-4 p-4 sm:grid-cols-2"><Field label="Role" value={entry.role} onChange={(role) => patchEntry(entry.id, { role })} /><Field label="Company" value={entry.company} onChange={(company) => patchEntry(entry.id, { company })} /><Field label="Start date" value={entry.startDate} onChange={(startDate) => patchEntry(entry.id, { startDate })} /><Field label="End date" value={entry.endDate} onChange={(endDate) => patchEntry(entry.id, { endDate })} /><div className="sm:col-span-2"><SortableBulletList bullets={entry.bullets} onChange={(bullets) => patchEntry(entry.id, { bullets })} /><Button variant="ghost" size="sm" onClick={() => patchEntry(entry.id, { bullets: [...entry.bullets, { id: createId("bullet"), text: "New accomplishment" }] })}><Plus /> Add bullet</Button></div></div></section>)}<Button variant="outline" onClick={() => update((current) => ({ ...current, experience: [...current.experience, { id: createId("experience"), role: "New role", company: "Company", startDate: "", endDate: "Present", bullets: [] }] }))}><Plus /> Add experience</Button></div></div>;
}

export function ProjectsPanel() {
  const resume = useWorkspaceStore((state) => state.workspace!.resume);
  const update = useWorkspaceStore((state) => state.updateResume);
  const patchProject = (id: string, patch: Partial<Resume["projects"][number]>) => update((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  return <div><SectionHeading eyebrow="Resume / Projects" title="Selected projects" copy="List work that demonstrates relevant capability and real outcomes." /><div className="space-y-4 p-5">{resume.projects.map((project) => <section key={project.id} className="border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-medium">{project.name}</p><ConfirmDelete label={project.name} onDelete={() => update((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id) }))} /></div><div className="space-y-4 p-4"><Field label="Project name" value={project.name} onChange={(name) => patchProject(project.id, { name })} /><Field label="Description" value={project.description} onChange={(description) => patchProject(project.id, { description })} /><SortableBulletList bullets={project.bullets} onChange={(bullets) => patchProject(project.id, { bullets })} /><Button variant="ghost" size="sm" onClick={() => patchProject(project.id, { bullets: [...project.bullets, { id: createId("bullet"), text: "New project outcome" }] })}><Plus /> Add bullet</Button></div></section>)}<Button variant="outline" onClick={() => update((current) => ({ ...current, projects: [...current.projects, { id: createId("project"), name: "New project", technologies: [], links: [], bullets: [] }] }))}><Plus /> Add project</Button></div></div>;
}

export function SkillsPanel() {
  const resume = useWorkspaceStore((state) => state.workspace!.resume);
  const update = useWorkspaceStore((state) => state.updateResume);
  return <div><SectionHeading eyebrow="Resume / Skills" title="Skills inventory" copy="Keep only skills you can support in an interview." /><div className="space-y-4 p-5">{resume.skills.map((group) => <section key={group.id} className="border border-border p-4"><div className="flex gap-2"><Input value={group.name} aria-label="Skill group name" onChange={(event) => update((current) => ({ ...current, skills: current.skills.map((item) => item.id === group.id ? { ...item, name: event.target.value } : item) }))} /><ConfirmDelete label={group.name} onDelete={() => update((current) => ({ ...current, skills: current.skills.filter((item) => item.id !== group.id) }))} /></div><div className="mt-3 flex flex-wrap gap-2">{group.skills.map((skill, index) => <div key={skill.id} className="flex items-center border border-border bg-card"><Input value={skill.name} aria-label={`${group.name} skill ${index + 1}`} className="h-8 w-32 border-0" onChange={(event) => update((current) => ({ ...current, skills: current.skills.map((item) => item.id === group.id ? { ...item, skills: item.skills.map((entry) => entry.id === skill.id ? { ...entry, name: event.target.value } : entry) } : item) }))} /><Button size="icon" variant="ghost" className="size-8" aria-label={`Remove ${skill.name}`} onClick={() => update((current) => ({ ...current, skills: current.skills.map((item) => item.id === group.id ? { ...item, skills: item.skills.filter((entry) => entry.id !== skill.id) } : item) }))}><Trash2 /></Button></div>)}<Button size="sm" variant="ghost" onClick={() => update((current) => ({ ...current, skills: current.skills.map((item) => item.id === group.id ? { ...item, skills: [...item.skills, { id: createId("skill"), name: "New skill" }] } : item) }))}><Plus /> Add</Button></div></section>)}<Button variant="outline" onClick={() => update((current) => ({ ...current, skills: [...current.skills, { id: createId("skill-group"), name: "New group", skills: [] }] }))}><Plus /> Add skill group</Button></div></div>;
}

export function EducationPanel() {
  const resume = useWorkspaceStore((state) => state.workspace!.resume);
  const update = useWorkspaceStore((state) => state.updateResume);
  const patchEntry = (id: string, patch: Partial<Resume["education"][number]>) => update((current) => ({ ...current, education: current.education.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  return <div><SectionHeading eyebrow="Resume / Education" title="Education" copy="Degrees, institutions, dates, and supporting detail." /><div className="space-y-4 p-5">{resume.education.map((entry) => <section key={entry.id} className="border border-border bg-card"><div className="flex justify-end border-b border-border px-3 py-2"><ConfirmDelete label={entry.institution} onDelete={() => update((current) => ({ ...current, education: current.education.filter((item) => item.id !== entry.id) }))} /></div><div className="grid gap-4 p-4 sm:grid-cols-2"><Field label="Institution" value={entry.institution} onChange={(institution) => patchEntry(entry.id, { institution })} /><Field label="Degree" value={entry.degree} onChange={(degree) => patchEntry(entry.id, { degree })} /><Field label="Field" value={entry.field} onChange={(field) => patchEntry(entry.id, { field })} /><Field label="End date" value={entry.endDate} onChange={(endDate) => patchEntry(entry.id, { endDate })} /></div></section>)}</div></div>;
}

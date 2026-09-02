# Design System — Operate

## Thesis

AI Resume Builder is a resume review desk, not an AI dashboard. Evidence, editable source, atomic proposals, and document output remain visible as parts of one controlled workflow. The user is the author; AI output is review material.

## Visual language

- Near-black zinc workspace surfaces with paper-white PDF preview.
- Green is reserved for primary actions, supported evidence, accepted changes, and focus.
- Amber means stale or needs review; red means destructive or failed; every status also has text or an icon.
- Hairline borders establish hierarchy. Shadows are limited to the simulated paper and the import surface.
- Geist Sans carries interface text; Geist Mono carries revisions, counters, state, and source-oriented labels.
- The interface uses compact controls and square work surfaces with only modest control radii.

## Layout

- At 1200 px and above: collapsible navigation, structured editor, and PDF preview share the viewport.
- Below 1200 px: section navigation becomes horizontal and Resume/Preview switch through tabs.
- Import is a two-part composition: product position on the left, source acquisition on the right. It stacks on narrow screens.

## Interaction rules

- Compilation is explicit and never runs on edit.
- Generated LaTeX and manual overrides are separate. A structured edit marks an override stale.
- Resume bullets support pointer drag, keyboard drag, and explicit move-up/move-down controls.
- Consequential deletes require confirmation and remain undoable in the current session.
- AI changes are atomic and show word-level diffs, reason, risk, evidence count, and status.
- Stale proposals cannot be applied.
- Animations respect `prefers-reduced-motion`.

## Accessibility

- Native headings, navigation, labels, buttons, and dialogs are used throughout.
- Focus is always visible through a two-pixel green ring.
- State is never communicated by color alone.
- Compact icon actions have accessible names and tooltips where context is otherwise hidden.

## Provenance

This UI is code-first and uses no shipping raster imagery. The visual contract is declared in the root layout as `resume-review-desk-code-v1`.

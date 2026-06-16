# Project Backlog

Structured task queue for the Ess-Kay Yards / Galaxy SF platform. Used by the planner subagent to identify the next ready task.

## Status legend

- `[READY]` — fully specified and ready to be picked up by the planner
- `[IN_PROGRESS]` — currently being implemented (orchestrator marks this)
- `[BLOCKED]` — blocked on a dependency, external decision, or human input
- `[DONE]` — completed, with commit hash recorded
- `[NEEDS_HUMAN]` — requires direct human handling (architecture decisions, UX choices, migrations)

## Priority: high | medium | low
## Scope: single-file | multi-file | schema | docs

## Task schema

Every task uses this exact structure:

```
## [STATUS] TASK-XXX: Task title
**Priority:** high | medium | low
**Scope:** single-file | multi-file | schema | docs
**Files:** path/to/file1.tsx, path/to/file2.ts
**Depends on:** TASK-YYY (if applicable)

### Acceptance criteria
- [ ] specific testable criterion
- [ ] another testable criterion

### Context
Brief background on why this task exists.

### Notes
Implementation hints, related references, edge cases.
```

---

## Active queue

### [DONE] TASK-001: Empty state for parts list
**Priority:** low
**Scope:** single-file
**Files:** apps/esskay/src/app/admin/(protected)/products/PartsTableBody.tsx

#### Acceptance criteria
- [x] When the parts array is empty, the table shows a centered empty state instead of just headers
- [x] Empty state text: "No parts yet. Click Add Part to create your first one."
- [x] Empty state links to /admin/products/new
- [x] Uses existing design tokens (text-site-muted, font-display, etc.)

#### Context
Currently the parts list with no rows shows just headers, which is confusing.

#### Notes
Check packages/ui for an existing EmptyState primitive before building from scratch.

---

### [DONE] TASK-002: Standardize date formatting in shared util
**Priority:** medium
**Scope:** multi-file
**Commit:** 170cfe7
**Files:** apps/esskay/src/lib/format.ts, apps/esskay/src/app/admin/(protected)/products/[id]/VariantsTable.tsx, apps/esskay/src/app/admin/(protected)/products/PartsTableBody.tsx

#### Acceptance criteria
- [x] `formatDateAdded(dateStr: string): string` exists in apps/esskay/src/lib/format.ts (create file if missing)
- [x] Returns "MMM D, YYYY" format (e.g., "Jun 3, 2026")
- [x] Replace inline date formatting in VariantsTable.tsx and PartsTableBody.tsx with this util
- [x] No regression: dates still display in both views

#### Context
Date formatting is duplicated inline in at least two places.

#### Notes
Use `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.

#### Reviewer notes (WARN — not blocking)
- `format.ts` is esskay-only for now; if Galaxy SF needs date formatting, move to a shared package before duplicating.
- Empty-state guard in PartsTableBody was bundled into this commit (from TASK-001 work); harmless but outside scope.

---

### [READY] TASK-004: Add tooltip to Save Part button
**Priority:** low
**Scope:** single-file
**Files:** apps/esskay/src/app/admin/(protected)/products/ProductForm.tsx

#### Acceptance criteria
- [ ] Save Part button shows a tooltip on hover explaining when it's enabled vs disabled
- [ ] Tooltip text is helpful, not redundant with the button label
- [ ] Tooltip respects existing design tokens (no hardcoded colors)

#### Context
The Save Part button is disabled until required fields are filled. Users sometimes click it and wonder why nothing happens.

#### Notes
Use a native title attribute for simplicity, or a proper Tooltip component if one exists in packages/ui.

---

### [READY] TASK-005: Add aria-label to delete photo buttons
**Priority:** medium
**Scope:** single-file
**Files:** apps/esskay/src/app/admin/(protected)/products/PhotoUploader.tsx

#### Acceptance criteria
- [ ] Each photo's delete (X) button has an aria-label like "Remove photo {n}"
- [ ] Screen reader users can identify which photo each button removes
- [ ] No visual regression to the button

#### Context
Icon-only buttons need accessible labels. Currently the X buttons on uploaded photos are just glyphs.

---

### [NEEDS_HUMAN] TASK-003: Consolidate-on-add server logic
**Priority:** high
**Scope:** multi-file
**Files:** apps/esskay/src/app/admin/(protected)/products/actions.ts (createPart), apps/esskay/src/app/admin/(protected)/products/new/page.tsx

#### Why this is NEEDS_HUMAN
Architectural decisions on transaction boundaries, error handling for partial state, what happens if no keeper found. Mermaid sketched in docs/diagrams/. Amy drives this directly.

---

## Done

Tasks move here with commit hashes once completed.

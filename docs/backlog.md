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

### [READY] TASK-002: Standardize date formatting in shared util
**Priority:** medium
**Scope:** multi-file
**Files:** apps/esskay/src/lib/format.ts, apps/esskay/src/app/admin/(protected)/products/[id]/VariantsTable.tsx, apps/esskay/src/app/admin/(protected)/products/PartsTableBody.tsx

#### Acceptance criteria
- [ ] `formatDateAdded(dateStr: string): string` exists in apps/esskay/src/lib/format.ts (create file if missing)
- [ ] Returns "MMM D, YYYY" format (e.g., "Jun 3, 2026")
- [ ] Replace inline date formatting in VariantsTable.tsx and PartsTableBody.tsx with this util
- [ ] No regression: dates still display in both views

#### Context
Date formatting is duplicated inline in at least two places.

#### Notes
Use `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.

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

Copy a template below, paste it into `docs/backlog.md` in the Active queue section, fill in the fields, and increment the TASK number. The planner reads this file fresh on every iteration of the auto-iterate loop, so new tasks are picked up automatically at the next iteration based on priority.

---

## Standard task template

```markdown
### [READY] TASK-XXX: Short title
**Priority:** low | medium | high
**Scope:** single-file | multi-file | schema | docs
**Files:** path/to/file.tsx

#### Acceptance criteria
- [ ] criterion 1
- [ ] criterion 2

#### Context
Brief background.

#### Notes
Implementation hints, edge cases.
```

---

## NEEDS_HUMAN task template

```markdown
### [NEEDS_HUMAN] TASK-XXX: Short title
**Priority:** high | medium | low
**Files:** path/to/file.tsx

#### Why this is NEEDS_HUMAN
One paragraph explaining the judgment call required.
```

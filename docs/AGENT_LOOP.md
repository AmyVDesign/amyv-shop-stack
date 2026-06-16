# Agent Loop

How to run the multi-agent loop for backlog-driven implementation.

## The agents

1. **Planner** (`.claude/agents/planner.md`) — reads the backlog, picks next ready task, drafts a plan. Doesn't implement.
2. **Implementer** — Claude Code itself, the main agent, executes the plan.
3. **A11y Reviewer** (`.claude/agents/a11y-reviewer.md`) — verifies WCAG 2.2 AA compliance criterion by criterion. Outputs a structured table per criterion. NEW
4. **Reviewer** (`.claude/agents/reviewer.md`) — verifies general project conventions (UX, schema, privacy, diagrams). Outputs pass/warn/fail.

## How to invoke the loop (single iteration)

In Claude Code, paste:

> Use the planner agent to pick the next ready task from docs/backlog.md and draft an implementation plan. Then implement the plan as the main agent. After committing, use the a11y-reviewer agent to verify WCAG 2.2 AA compliance. If a11y-reviewer fails, halt and report findings. If a11y-reviewer passes, use the reviewer agent to verify general project conventions. If reviewer fails, halt and report findings. If both pass, update the task status to [DONE] with the commit hash in docs/backlog.md and commit that update.

## Auto-iterate sessions

Auto-iterate runs the loop continuously — planner picks a task, main agent implements and commits, a11y-reviewer and reviewer both verify, backlog is updated — then the planner picks the next task and repeats. The session ends when the backlog has no more READY tasks or a reviewer halts it with a failure. Designed for queued polish work where each task is self-contained and the outcomes are predictable enough that a reviewer can validate without a human in the loop.

**When to use it:**
- Batches of small, well-specified polish tasks (empty states, refactors, util extractions, copy edits, aria-label additions, etc.)
- When you won't be at the keyboard to babysit each iteration
- When tasks are independent — one task's implementation doesn't depend on decisions made in the previous iteration

**When NOT to use it:**
- Architectural changes
- UX decisions that need real-time judgment
- Schema migrations
- Anything tagged `[NEEDS_HUMAN]`
- When you're tired or distracted — the reviewers catch individual violations but compounding bugs across iterations are harder to unwind

**Invocation prompt (paste-ready):**

```
Run the agent loop in auto-iterate mode. Use the planner agent to pick the next READY task from docs/backlog.md and draft an implementation plan. Implement the plan as the main agent. After committing, invoke the a11y-reviewer agent to verify WCAG 2.2 AA compliance. If a11y-reviewer fails, halt and report. If it passes, invoke the reviewer agent to verify project conventions. If reviewer fails, halt and report. If both pass, update the task status to [DONE] with the commit hash in docs/backlog.md and commit that update. Then immediately invoke the planner again to pick the next READY task and repeat. Continue until the backlog has no READY tasks or one iteration fails review. Report final state with a summary of all tasks completed.
```

**Adding tasks mid-session:** You can edit `docs/backlog.md` and add new `[READY]` tasks while the loop is running. The planner reads the file fresh at the start of each iteration — it is not cached — so new tasks are picked up automatically at the next iteration based on priority.

**Stopping a session:** Stop the loop manually at any time. The current iteration finishes (or halts on reviewer failure) and the loop ends. The backlog is the source of truth for what was completed.

## What the loop is GOOD at

- UI polish (empty states, loading states, error messages)
- Refactoring (extracting utils, splitting large files)
- Test coverage additions
- Documentation updates
- Accessibility audits and fixes

## What the loop is NOT good at

- Architecture decisions (your two-layer model came from human judgment)
- UX decisions (the chip-vs-auto-fill reversal needed a human eye)
- Schema migrations (data integrity stakes too high)
- Anything client-facing on real customer data

## Safety boundaries

- Never automate `[NEEDS_HUMAN]` tasks
- Both a11y-reviewer and reviewer are safety nets; a failure in either halts the loop
- Each iteration burns API tokens; monitor costs for long auto-iterate runs
- Human review the backlog itself before adding new tasks

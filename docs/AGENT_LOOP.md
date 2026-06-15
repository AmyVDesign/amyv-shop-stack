# Agent Loop

How to run the multi-agent loop for backlog-driven implementation.

## The agents

1. **Planner** (`.claude/agents/planner.md`) — reads the backlog, picks next ready task, drafts a plan. Doesn't implement.
2. **Implementer** — Claude Code itself, the main agent, executes the plan.
3. **Reviewer** (`.claude/agents/reviewer.md`) — verifies against project conventions. Outputs pass/warn/fail.

## How to invoke the loop (single iteration)

In Claude Code, paste:

> Use the planner agent to pick the next ready task from docs/backlog.md and draft an implementation plan. Then implement the plan as the main agent. After committing, use the reviewer agent to verify against project conventions. If reviewer passes, update the task status to [DONE] with the commit hash in docs/backlog.md and commit that update. If reviewer fails, halt and report findings to me.

## Running multiple iterations (after the single-iteration version works)

> Repeat the loop above until either the backlog has no READY tasks or one iteration fails review. Report final state.

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
- The reviewer agent is the safety net; its failures halt the loop
- Each iteration burns API tokens; monitor costs for long auto-iterate runs
- Human review the backlog itself before adding new tasks

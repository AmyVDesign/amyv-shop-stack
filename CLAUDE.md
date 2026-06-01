# Start here

Before answering any question about this project, read PROJECT.md in the repo root — it is the canonical project specification covering business context, users, architecture, brand voice, legal compliance, accessibility, SEO, security, roadmap, risks, and decisions log. The `apps/esskay` app is the marina parts client platform — NOT a wholesale portal.

For product flow context before implementing features, reference docs/diagrams/ for canonical user-flow diagrams (Mermaid). The numbered prefix indicates portfolio order.

Auto-push enabled — every commit automatically pushes to origin/main via .git/hooks/post-commit.

## Self-check protocol (mandatory before claiming any task is done)

Before pausing at a checkpoint or saying a task is complete, run these checks and report results as a ✓ checklist. If any check fails, fix it before pausing — don't bring failures back to the user unless you genuinely cannot resolve them.

For any task touching TypeScript files:

- `cd apps/esskay && npx tsc --noEmit` → must produce no output (zero errors)
- `cd packages/ui && npx tsc --noEmit` if @amyv/ui was touched
- `pnpm install` from repo root if any package dependencies were added

For any task touching imports/exports:

- `grep -r` to verify references point where they should
- Zero lingering references to deleted code (example: no 'wholesale' references after wholesale removal)
- New components exported from `packages/ui/src/index.ts` if they belong in the shared UI package

For UI/styling changes:

- Dev server compiles cleanly (check the `pnpm dev:esskay` or `pnpm dev:galaxy` output for errors)
- Fonts load without console warnings
- No hardcoded colors or fonts in component files — everything goes through CSS tokens

Report format example:

```
✓ tsc esskay: clean
✓ tsc packages/ui: clean
✓ pnpm install: deps linked
✓ Dev server compiles: yes
✓ [feature-specific check]: passing
```

Database migrations get an additional check: after writing a migration, verify the SQL handles common Postgres quirks — drop DEFAULTs before ALTER COLUMN TYPE, drop dependent policies before changing the column they reference, drop dependent triggers before dropping their function with CASCADE.

## Diagram maintenance

`docs/diagrams/` uses a living + archived model:

- **Top-level files** (e.g., `docs/diagrams/add-part-flow.md`) are living documentation. Update them when an implementation meaningfully changes a flow — shipped nodes stay white, planned nodes stay light blue.
- **`docs/diagrams/archive/`** files are frozen historical snapshots. Never edit them except for typos or label corrections.
- **At phase boundaries:** before starting work on a new phase, copy the current top-level file into `archive/` with a phase-numbered name (e.g., `archive/03-add-part-flow-phase-2-2.md`), then continue updating the top-level file.

@AGENTS.md

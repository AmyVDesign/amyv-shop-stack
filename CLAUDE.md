# Start here

Before answering any question about this project, read PROJECT.md in the repo root — it is the canonical project specification covering business context, users, architecture, brand voice, legal compliance, accessibility, SEO, security, roadmap, risks, and decisions log. Esskay is the marina parts business owned by Amy's parents in Brewerton, NY — NOT a wholesale portal.

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

@AGENTS.md

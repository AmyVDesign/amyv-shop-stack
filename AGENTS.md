<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This monorepo pins specific versions:
- next@16.2.4
- react@19.2.4
- tailwindcss@^4

These have breaking changes from common training data. APIs, conventions, and file structure may differ from what you expect.

Before writing any Next.js-specific code:
1. Read the relevant guide in node_modules/next/dist/docs/
2. Heed any deprecation notices
3. When creating new apps or packages, match pinned versions exactly. No ^ ranges on next or react.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:monorepo-rules -->
# Monorepo conventions

This is a pnpm workspace. Apps in apps/, shared packages in packages/.

Package naming: @amyv/[name] (e.g., @amyv/ui, @amyv/galaxy, @amyv/esskay).

When adding shared logic, prefer extracting to a package over duplicating across apps. When code is genuinely app-specific (e.g., TotemConfigurator for Galaxy), keep it in apps/[name]/.

Read docs/MONOREPO-MIGRATION-PLAN.md for the canonical map of what lives where.
<!-- END:monorepo-rules -->

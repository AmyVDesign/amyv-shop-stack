# Phase 1.1: Monorepo Bootstrap — Claude Code Prompts

Three prompts that set up the monorepo, create empty packages, and extract shared bits from Galaxy. Run them one at a time, verify after each, commit, then move on.

---

## Before you start

1. **Pick a directory name** for the new monorepo. Suggested: `amyv-shop-stack`. Anything works.
2. **Create the directory** and `cd` into it.
3. **Create a `docs/` subfolder** and copy these planning docs into it:
   - `MONOREPO-MIGRATION-PLAN.md`
   - `SECURITY.md`
   - `ess-kay-yards-system-spec.md`
   - `ess-kay-yards-half-day-seo.md` (optional)
   - This file too: `PHASE-1-1-PROMPTS.md`
4. **Note the absolute path** to your existing `galaxy-sf` directory. You'll paste it into Prompt 1.1a. (Mac default is probably `/Users/amyv/galaxy-sf` — adjust if it's somewhere else.)
5. **Open Claude Code** in the new monorepo root: `claude` from the directory.
6. **Paste Prompt 1.1a** below into Claude Code.

After each prompt finishes, review the output, verify the deliverable, and commit:
```bash
git add -A && git commit -m "Phase 1.1X: <what was done>"
```

If anything goes wrong, `git reset --hard HEAD~1` and re-run.

---

## Prompt 1.1a — Bootstrap monorepo + move Galaxy in

```
I'm setting up a pnpm monorepo for two e-commerce apps: Galaxy SF (existing) and Ess-Kay Yards (new). Read docs/MONOREPO-MIGRATION-PLAN.md for the full plan before starting.

For this task (Phase 1.1a):

1. Initialize a pnpm workspace at the current directory. Create pnpm-workspace.yaml referencing apps/* and packages/*.

2. Create the directory structure:
   - apps/
   - packages/
   - docs/ (already exists with planning docs)

3. Copy my existing Galaxy code into apps/galaxy/. The source is at: /Users/amyv/galaxy-sf

   EXCLUDE node_modules, .next, .env*, and .git when copying. Use rsync with --exclude flags or cp followed by manual cleanup.

4. Update apps/galaxy/package.json:
   - name: "@amyv/galaxy"
   - Keep all dependency versions exactly as they are (next@16.2.4, react@19.2.4, etc.)

5. Create apps/esskay/ as a new Next.js app. CRITICAL: it must match Galaxy's exact stack:
   - next: "16.2.4" (exact pin, no ^)
   - react: "19.2.4" (exact pin, no ^)
   - react-dom: "19.2.4" (exact pin, no ^)
   - tailwindcss: "^4"
   - TypeScript, App Router, Tailwind, ESLint, src/ directory enabled
   - name: "@amyv/esskay"

6. Add a root package.json:
   - "name": "amyv-shop-stack" (match the directory name)
   - "private": true
   - "packageManager": pin to current pnpm version
   - "engines": { "node": ">=20" }
   - Scripts:
     - "dev:galaxy": "pnpm --filter @amyv/galaxy dev"
     - "dev:esskay": "pnpm --filter @amyv/esskay dev"
     - "build": "pnpm -r build"
     - "lint": "pnpm -r lint"

7. Add root .gitignore covering: node_modules, .next, .env*, .DS_Store, dist, .turbo, *.log

8. Create root AGENTS.md with this exact content:

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

9. Create root CLAUDE.md with the single line:
   @AGENTS.md

10. Mirror AGENTS.md and CLAUDE.md into apps/galaxy/ and apps/esskay/ (identical content).

11. Run pnpm install at the root.

12. Initialize git and make an initial commit: "Phase 1.1a: monorepo + Galaxy migrated in".

13. Verify:
    - pnpm --filter @amyv/galaxy dev boots Galaxy on a port and the homepage renders with the neon green hero
    - pnpm --filter @amyv/esskay dev boots Ess-Kay on a different port with the default Next.js starter
    - Both apps build without TypeScript errors

Show me the resulting file tree when done.
```

**Verify after 1.1a runs:**
- Both apps boot via the dev scripts
- File tree shows: `apps/`, `packages/` (empty), `docs/`, root `AGENTS.md`, `CLAUDE.md`, `package.json`, `.gitignore`, `pnpm-workspace.yaml`
- `git log` shows your initial commit
- AGENTS.md exists at root AND in both apps

---

## Prompt 1.1b — Create empty shared packages

```
Continuing Phase 1.1. Read docs/MONOREPO-MIGRATION-PLAN.md "Migration map" section before starting. This task creates empty package scaffolding only — no real code yet.

Create eight empty packages in packages/, each with this structure:

Packages:
- @amyv/ui
- @amyv/design-system
- @amyv/stripe
- @amyv/email
- @amyv/supabase
- @amyv/orders
- @amyv/admin
- @amyv/types

For each package, create:

1. packages/[name]/package.json:
   {
     "name": "@amyv/[name]",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts"
     }
   }

2. packages/[name]/tsconfig.json that extends ../../tsconfig.base.json:
   {
     "extends": "../../tsconfig.base.json",
     "include": ["src/**/*"]
   }

3. packages/[name]/src/index.ts:
   export const PACKAGE_NAME = "@amyv/[name]";

Also create root tsconfig.base.json with strict TypeScript defaults appropriate for Next.js 16 + React 19:
- target: ES2022
- module: ESNext
- moduleResolution: bundler
- jsx: preserve
- strict: true
- noUncheckedIndexedAccess: true
- skipLibCheck: true
- esModuleInterop: true
- isolatedModules: true
- forceConsistentCasingInFileNames: true

Run pnpm install. Verify:
- All eight package directories exist with all three files
- node_modules/@amyv/ contains symlinks to each package (workspace links)
- pnpm install completes without errors

Commit: "Phase 1.1b: empty shared packages scaffold"
```

**Verify after 1.1b runs:**
- 8 packages exist with `package.json`, `tsconfig.json`, `src/index.ts`
- Root `tsconfig.base.json` exists
- `pnpm install` runs clean
- `node_modules/@amyv/*` symlinks exist (proves workspace linking works)

---

## Prompt 1.1c — Extract obvious shared bits from Galaxy

```
Final part of Phase 1.1. Read docs/MONOREPO-MIGRATION-PLAN.md "Galaxy-specific" and "Shared packages" sections.

Three extractions, done sequentially. Stop and let me verify after each one.

═══════════════════════════════════════════════════
EXTRACTION 1: Lightbox → @amyv/ui
═══════════════════════════════════════════════════

1. Move apps/galaxy/src/components/Lightbox.tsx → packages/ui/src/Lightbox.tsx
2. Update packages/ui/src/index.ts to:
   export { default as Lightbox, type LightboxPost } from "./Lightbox";
3. Find every Galaxy file that imports Lightbox (check apps/galaxy/src/components/InstagramFeed.tsx and anywhere else) and update the import to: import { Lightbox } from "@amyv/ui"
4. Add to apps/galaxy/package.json dependencies: "@amyv/ui": "workspace:*"
5. Run pnpm install at root.
6. Run pnpm --filter @amyv/galaxy dev. Verify Lightbox still works: open the IG feed, click a photo, modal should open with Escape closing it.

STOP HERE. Don't proceed until I confirm.

═══════════════════════════════════════════════════
EXTRACTION 2: Split icons.tsx
═══════════════════════════════════════════════════

apps/galaxy/src/components/icons.tsx contains both generic icons (Menu, Close, Arrow, etc.) and brand icons (Instagram, Spotify).

1. Move generic icons to packages/ui/src/icons/ — you decide whether one file per icon or grouped (e.g., navigation.tsx, actions.tsx). Keep the IconProps interface and strokeAttrs helper in packages/ui/src/icons/types.ts or similar.
2. Export everything from packages/ui/src/icons/index.ts, then re-export from packages/ui/src/index.ts: export * from "./icons";
3. Keep brand icons (IconInstagram, IconSpotify) in apps/galaxy/src/components/icons.tsx (or split into brand-icons.tsx, your call).
4. Update Galaxy imports throughout: generic icons from "@amyv/ui", brand icons from local.
5. Run pnpm --filter @amyv/galaxy dev. Verify everything renders: nav menu works, mobile drawer opens, footer shows Instagram + Spotify icons.

STOP HERE. Don't proceed until I confirm.

═══════════════════════════════════════════════════
EXTRACTION 3: Design system pattern → @amyv/design-system
═══════════════════════════════════════════════════

Goal: extract the PATTERN (theme.ts type structure) but leave Galaxy's VALUES in apps/galaxy/.

1. Create packages/design-system/src/types.ts with these type definitions:

   export interface Theme {
     colors: {
       bg: string;
       bgAlt: string;
       border: string;
       text: string;
       muted: string;
       accent: string;
       accentDark: string;
       accentLight: string;
     };
     fonts: {
       heading: string;
       body: string;
       label: string;
     };
     spacing: {
       pagePx: string;
       pageMax: string;
       sectionY: string;
       cardPad: string;
     };
     radius: {
       sm: string;
       md: string;
       lg: string;
       full: string;
     };
   }

2. Create packages/design-system/src/css-template.ts: a function generateThemeCSS(theme: Theme): string that returns the :root block + @theme inline block as a CSS string. This will let each app generate its own globals.css from its theme values later.

3. Export both from packages/design-system/src/index.ts:
   export type { Theme } from "./types";
   export { generateThemeCSS } from "./css-template";

4. Update apps/galaxy/src/lib/theme.ts:
   - Import the Theme type from "@amyv/design-system"
   - Restructure Galaxy's existing COLORS, FONTS, SPACING, RADIUS exports to satisfy the Theme interface
   - Keep all current Galaxy values (the dark + neon palette) exactly as they are

5. Add to apps/galaxy/package.json dependencies: "@amyv/design-system": "workspace:*"

6. Run pnpm install, then pnpm --filter @amyv/galaxy dev. Verify Galaxy looks visually identical to before — same neon green hero, same dark background.

7. Galaxy's globals.css stays as-is for now. We'll genericize the CSS template later when Ess-Kay's design needs reveal a clean abstraction.

Commit: "Phase 1.1c: shared UI primitives + design system extracted from Galaxy"
```

**Verify after 1.1c runs:**
- Galaxy still boots and renders identically (compare visually to before)
- `@amyv/ui` exports `Lightbox` + generic icons
- `@amyv/design-system` exports `Theme` type + `generateThemeCSS`
- Galaxy's `theme.ts` uses the imported `Theme` type
- No broken imports anywhere

---

## What you'll have after Phase 1.1

- Functional pnpm monorepo with two Next.js apps
- Galaxy migrated, still working, still looks the same
- Ess-Kay app exists, renders default Next.js starter
- Eight empty shared packages with workspace linking
- Lightbox + generic icons + design system Theme type living in shared packages
- AGENTS.md propagated to root + both apps with version pinning callouts
- Clean git history rooted in the new monorepo

Next: Phase 1.2 (Supabase setup for both apps). I'll write that prompt fresh after seeing how 1.1 lands so it can adapt to whatever Claude Code chose for naming, file conventions, etc.

---

## Working notes

(Add notes here as you go: surprises, decisions Claude Code made, anything you want to revisit.)

- 
- 
- 

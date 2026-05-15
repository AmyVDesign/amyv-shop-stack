# Monorepo Migration Plan: Galaxy → Galaxy + Ess-Kay

Based on review of the existing `galaxy-sf` codebase. This replaces the original Phase 1.1 prompt (which assumed empty apps).

---

## What's actually in Galaxy today

### Built and working

- **Next.js 16 + React 19 + Tailwind 4** stack (very recent — `AGENTS.md` notes there are breaking changes from training data, so Claude Code must read `node_modules/next/dist/docs/` for current API)
- **Design token system:** `theme.ts` (JS constants) ↔ `globals.css` (`--site-*` vars) ↔ Tailwind v4 `@theme inline` mapping. Single source of truth pattern, well-documented in `theme.ts`.
- **Dark + neon aesthetic:** `#0a0a0f` background, `#39ff14` neon green accent. Currently placeholder values, designed to be swapped when real palette finalized.
- **Icon library** (`icons.tsx`, ~160 lines): stroke-based, `viewBox 0 0 20 20`, consistent `IconProps` interface. Includes generic icons (Menu, Close, Arrow) AND brand icons (Instagram, Spotify).
- **`PublicNav`** with mobile drawer
- **`PublicFooter`** with social links
- **`Lightbox`** (modal with Escape close + body scroll lock — fully generic, reusable as-is)
- **`InstagramFeed`** (pulls via Behold API; script tag is in root layout)
- **Homepage** with hero, totem feature, IG feed section, "what we do" copy
- **Shop list page** (hardcoded products, gradient placeholder tiles)
- **Product detail page** with interactive `TotemConfigurator` + `TotemSVG`
- **Route grouping:** `(public)` for storefront, `admin` for backend

### Stubbed / empty

- `lib/stripe.ts` — `// implementation TBD`
- `lib/resend.ts` — `// implementation TBD`
- `lib/supabase.ts` — `// implementation TBD`
- All admin pages — `<div/>`
- Contact page — `<div/>`

**Implication:** the integration libs aren't built yet. Lucky timing — we get to write them fresh in `packages/` instead of refactoring existing implementations.

---

## The migration map

### Shared packages (`packages/`)

| Package | Contents | Source |
|---------|----------|--------|
| `@small-shop/ui` | Lightbox, generic icons (Menu, Close, Arrow, etc.), future Button/Input/Label primitives | Galaxy `Lightbox.tsx`, generic icons from `icons.tsx` |
| `@small-shop/design-system` | Token PATTERN: theme.ts + globals.css template. Each app provides values. | Adapted from Galaxy `theme.ts` + `globals.css` |
| `@small-shop/stripe` | Checkout session helpers, webhook handlers, types | Built fresh (Galaxy stub deleted) |
| `@small-shop/email` | Resend templates: OrderConfirmed, OrderShipped, OrderDelivered. Branding tokens passed in. | Built fresh (Galaxy stub deleted) |
| `@small-shop/supabase` | Auth client (magic link), server/client client variants, auth middleware | Built fresh (Galaxy stub deleted) |
| `@small-shop/orders` | OrderProgressBar, OrderTrackingForm, lookupOrder util, Shippo webhook handler | Built fresh |
| `@small-shop/admin` | Admin layout shell, auth guard, orders table, status filters, quick actions | Built fresh |
| `@small-shop/types` | Shared Order, Customer, Product base types | Built fresh |

### Galaxy-specific (stays in `apps/galaxy/`)

- `TotemSVG.tsx`, `TotemConfigurator.tsx` (the configurator)
- `InstagramFeed.tsx` (Behold integration)
- Brand-specific icons: `IconInstagram`, `IconSpotify`
- Theme token VALUES (dark + neon palette)
- All page implementations (homepage hero, shop list, product detail with configurator)
- `PublicNav.tsx` and `PublicFooter.tsx` (Galaxy-branded; Ess-Kay gets its own variants)

### Ess-Kay-specific (built fresh in `apps/esskay/`)

- AI upload tool (Phase 2)
- Brand collection pages (Onan, Kohler, etc.)
- Brand tile + part card components
- Marina services pages (dockage, repair, storage)
- Theme token values (warm + family-owned + marine, very different from Galaxy)
- Page implementations
- Ess-Kay's own `PublicNav`, `PublicFooter`

---

## Why this split makes sense

**The token system pattern is shared, the values aren't.** Galaxy's neon green at `#39ff14` would look completely wrong on a marina site. But the *mechanism* (theme.ts + CSS vars + Tailwind `@theme inline`) is reusable. Each app imports the same scaffolding and provides its own values.

**The product page pattern doesn't transfer.** Galaxy's `shop/[slug]` has an interactive configurator. Ess-Kay's `p/[slug]` is informational ("hard-to-find Onan 131-0257 cooling pump, ships from Brewerton"). Different shape entirely. They share order logic but not page structure.

**Admin is essentially built fresh.** Galaxy has stubs for admin, so we don't lose anything by building the shared `packages/admin` from scratch. It'll serve both apps from day one.

**Lib files are perfect timing.** Stubs only. We write Stripe/Resend/Supabase integrations directly in `packages/` from the start, not as a refactor.

---

## Updated Phase 1.1 plan

The original Phase 1.1 prompt assumed both apps were empty. The new Phase 1.1 has more steps:

### Phase 1.1a: Set up the monorepo, move Galaxy in

1. Create new repo at the new location (`small-shop-stack` or similar)
2. Initialize pnpm workspace with `pnpm-workspace.yaml`
3. Move existing `galaxy-sf` contents into `apps/galaxy/`
4. Update Galaxy's package.json: rename to `@small-shop/galaxy`, scope dependencies properly
5. Create empty `apps/esskay/` via `pnpm create next-app` (matching Next 16, React 19, Tailwind 4)
6. Verify both apps boot:
   - `pnpm --filter @small-shop/galaxy dev`
   - `pnpm --filter @small-shop/esskay dev`

### Phase 1.1b: Create empty packages with stubs

7. Create empty `packages/` with proper package.jsons:
   - `@small-shop/ui`
   - `@small-shop/design-system`
   - `@small-shop/stripe`
   - `@small-shop/email`
   - `@small-shop/supabase`
   - `@small-shop/orders`
   - `@small-shop/admin`
   - `@small-shop/types`
8. Each package gets a `src/index.ts` with one placeholder export so workspace linking works.

### Phase 1.1c: Extract the obvious shared bits

9. Move Galaxy's `Lightbox.tsx` → `packages/ui/src/Lightbox.tsx`. Update Galaxy import.
10. Split `icons.tsx`: generic icons (Menu, Close, Arrow) → `packages/ui/src/icons/`; brand icons (Instagram, Spotify) stay in `apps/galaxy/src/components/icons.tsx`.
11. Extract the design token PATTERN into `packages/design-system/` with the values parameterized. Galaxy keeps its own values; Ess-Kay will pick its own later.
12. Verify Galaxy still builds and renders identically after the moves.

### Phase 1.1 deliverable

Both apps boot, packages exist with placeholder exports, Galaxy renders unchanged, Ess-Kay renders the default Next.js starter. Galaxy's Lightbox + generic icons are now imported from `@small-shop/ui`.

---

## Critical Next.js 16 note

`AGENTS.md` warns that Next.js 16 has breaking changes from common training data. This needs to:

1. Persist into the monorepo. Copy `AGENTS.md` and `CLAUDE.md` to the new repo root and into each app.
2. Be referenced in every Claude Code prompt: "Read `node_modules/next/dist/docs/` before writing Next.js-specific code."
3. Apply to Ess-Kay too. Ess-Kay's app should match Galaxy's Next 16 + React 19 stack so we're not maintaining two different framework versions.

---

## Open questions to resolve before Phase 1.1

- **Repo name:** `small-shop-stack`? `marina-and-galaxy`? Something else? Affects package naming convention.
- **Package scope:** `@small-shop/*` works as a placeholder. Use your real GitHub username if you want to publish or want personal branding (`@amyv/*`).
- **Galaxy git history:** preserve via `git mv` or start fresh? Start fresh is simpler; preserve via subtree merge if history matters.
- **Ess-Kay design tokens:** when do we pick the warm/marina palette? Could defer until Phase 3 (Storefront). Until then, default to neutral grays.

---

## Working notes

(Add notes here as you go: surprises, deviations, decisions made.)

- 
- 
- 

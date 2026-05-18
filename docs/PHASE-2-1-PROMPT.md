# Phase 2.1 — Admin Foundation: Auth, Layout, Parts List

## How Amy uses this file

1. Save this file in your repo at `docs/PHASE-2-1-PROMPT.md`.
2. Open Claude Code in the repo root (`cd ~/amyv-shop-stack`, then `claude`).
3. Paste below the `─── PROMPT BEGINS ───` line as your first message.
4. Claude Code pauses at four checkpoints during the build — review each before approving.

---

─── PROMPT BEGINS ───

You are Claude Code working in the `amyv-shop-stack` monorepo. Phase 1.2 (Supabase schema + RLS + typed client) is complete and committed as **758b0c2**. The Supabase project is linked, all 8 tables are live, and `@amyv/supabase` exports a typed client.

## Your goal in Phase 2.1

Build the admin foundation in `apps/esskay/`:

1. Supabase Auth (email magic link) for staff login
2. Protected `/admin` layout with sidebar navigation
3. Magic link login page
4. Parts list page reading from the real `products` table

**Scope discipline:** photo extraction, create/edit forms, and CRUD for other entities (customers, orders, wholesale, watch list) are **not** in this phase. Stub those nav items to placeholder pages and move on.

## Source of truth

`docs/ess-kay-yards-master-reference.docx` is canonical. Particularly:
- Section 4: Tech stack (Tailwind v4, React 19.2.4, Next.js 16.2.4 — exact pinning, no carets)
- Section 5: Data model (the columns you'll display)
- Section 11: Security / RLS (already applied, but understand it)
- Section 12: Brand & voice rules (strict)

## Brand voice rules (non-negotiable)

| Avoid in UI | Use instead |
|---|---|
| Dashboard | Home / Overview |
| Users | Staff / Customers / Shoppers |
| Products (UI label) | Parts |
| AI | Smart pre-fill / the system |
| Automation | Saves time / auto-fills |
| Onboarding | Getting set up |

**Database columns stay as `products` etc.** — only UI labels change. The data model is `products` but every visible label says "Parts."

**Colors:** cream backgrounds `#F8F5F0`, nautical navy `#0F3A57`, accent blue `#1E5F8E`. Warm marina vibe — no tech-startup gradients, no neon, no dark mode in this phase.

## What to build

### 1. Supabase clients for the esskay app

`apps/esskay/src/lib/supabase/`:
- `client.ts` — re-exports `createBrowserClient` from `@amyv/supabase/client`
- `server.ts` — wraps `createServerClient` from `@amyv/supabase/client` with Next.js `cookies()` from `next/headers`
- `middleware.ts` — auth middleware helper for protected routes that refreshes tokens

### 2. Next.js middleware

`apps/esskay/src/middleware.ts`:
- Match all paths except `/admin/login`, `/admin/auth/callback`, static assets
- For `/admin/*` paths: if user not signed in, redirect to `/admin/login`
- Refresh auth tokens on every matched request via the helper from step 1
- Use the standard Supabase SSR middleware pattern

### 3. Magic link login page

`apps/esskay/src/app/admin/login/page.tsx`:
- Client component
- Centered card on cream background
- Form: single email input + "Send magic link" button (navy)
- Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '${origin}/admin/auth/callback' } })`
- Success state replaces the form: "Check your email at `{email}` — we just sent you a sign-in link."
- Error state below the input if `signInWithOtp` fails

### 4. Auth callback

`apps/esskay/src/app/admin/auth/callback/route.ts`:
- Standard Supabase code exchange handler (server route)
- Reads `code` from query params, exchanges for session via `supabase.auth.exchangeCodeForSession(code)`
- On success: redirect to `/admin`
- On error: redirect to `/admin/login?error=callback_failed`

### 5. Admin layout (protected)

`apps/esskay/src/app/admin/layout.tsx`:
- Server component
- Fetches current user via `supabase.auth.getUser()` — if null, redirect to `/admin/login`
- Two-column layout: sidebar (240px, cream `#F8F5F0`) + main content area (white)
- Sidebar contains:
  - Logo / wordmark at top: "Ess-Kay Yards"
  - Nav items (use `next/link`, highlight active route):
    - **Home** (`/admin`)
    - **Parts** (`/admin/products`)
    - **Customers** (`/admin/customers`) — stub page
    - **Orders** (`/admin/orders`) — stub page
    - **Watch List** (`/admin/watch-list`) — stub page
    - **Wholesale** (`/admin/wholesale`) — stub page
  - Footer: signed-in email + Sign out button (form action that calls `supabase.auth.signOut()` then redirects to `/admin/login`)
- Active nav item: navy background `#0F3A57` with cream text. Inactive: cream background, navy text, hover state.

### 6. Home page

`apps/esskay/src/app/admin/page.tsx`:
- Server component
- Header: "Welcome back" — no "Dashboard" anywhere
- Three Card components in a row, each showing a count:
  - Parts in stock: `SELECT count(*) FROM products WHERE qty_on_hand > 0`
  - Orders pending Mom's review: `SELECT count(*) FROM orders WHERE qb_status = 'pending_mom_review'`
  - Watch list items: `SELECT count(*) FROM parts_watch_list WHERE status = 'open'`
- Each Card has: count (large, navy), label (small, gray), and is clickable to its detail page

### 7. Parts list page

`apps/esskay/src/app/admin/products/page.tsx`:
- Server component, fetches from `products` via typed Supabase client
- Order by `created_at DESC`, limit 50 (pagination is a later phase)
- Page header: "Parts" + "Add Part" button on right (stub link to `/admin/products/new`)
- Table columns:
  - Photo (first item in `photo_urls` array, or a small gray placeholder square if empty)
  - Title
  - SKU (monospace font)
  - Part Number
  - Manufacturer
  - Visibility (Badge)
  - Qty (shown as `qty_on_hand / qty_for_sale`, e.g. `5 / 3`)
  - Price (format cents as USD, e.g. `$24.95`)
- Visibility Badge colors:
  - public → green background, dark green text
  - internal → light gray bg, dark gray text
  - wholesale → blue bg, dark blue text
  - ebay_only → orange bg, dark orange text
- Empty state (no rows): centered message "No parts yet. Click **Add Part** to add your first one."
- Click a row → `/admin/products/[id]` (stub page for now, just shows the ID and a "Coming soon" message)

### 8. Stub pages for nav items

Create minimal pages for the other nav routes so clicking them doesn't 404:
- `/admin/customers/page.tsx`
- `/admin/orders/page.tsx`
- `/admin/watch-list/page.tsx`
- `/admin/wholesale/page.tsx`
- `/admin/products/new/page.tsx`
- `/admin/products/[id]/page.tsx`

Each just shows the section title and "Coming in a later phase" — keep it under 10 lines per file.

### 9. Reusable UI primitives in `packages/ui`

Build these in `packages/ui/src/` only as needed for the above pages. Match the design system colors. Export through `packages/ui/src/index.ts`.

- `Button` — variants: `primary` (navy bg, cream text), `secondary` (cream bg, navy border + text), `ghost` (transparent, navy text)
- `Input` — text/email/search types, navy focus ring
- `Badge` — colored pill, takes a color variant prop
- `Card` — white background, subtle navy border (`border-[#0F3A57]/10`), padding, optional title slot
- `Table`, `TableHeader`, `TableRow`, `TableCell` — semantic primitives with brand styling
- `EmptyState` — centered icon + message + optional CTA

Don't over-engineer. No animation libraries, no headless UI framework deps. Plain Tailwind v4 utility classes.

## Checkpoints — pause and ask before continuing

After each of these milestones, **stop and show me what you built. Wait for my "continue" or feedback.**

1. **Checkpoint 1** — After steps 1 (clients), 2 (middleware), 3 (login page), 4 (callback). Show me the auth flow.
2. **Checkpoint 2** — After steps 5 (admin layout), 6 (home page). Show me the layout and home.
3. **Checkpoint 3** — After step 7 (Parts list page). Show me the list + visibility badges.
4. **Checkpoint 4** — After step 8 (stubs) + step 9 (any final UI primitives). Final review before commit.

## Constraints

- **Exact dependency pins** — no `^` or `~`. Match existing repo style.
- **Tailwind v4 utility classes only** — no custom CSS files outside design tokens / globals.
- **All Supabase access through `@amyv/supabase`** — don't import `@supabase/supabase-js` directly anywhere except inside that package.
- **`pnpm dev:esskay`** on port 3001 must work cleanly when this is done.
- **Brand voice rules** are not negotiable — re-check every UI string before declaring done.

## When complete

- Running `pnpm dev:esskay` and navigating to `localhost:3001/admin` redirects to `/admin/login`
- Signing in with email gets a magic link; clicking it logs you in
- After auth, admin layout renders with sidebar; Home shows three count cards
- Clicking **Parts** shows the products table (empty for now since we haven't added any rows yet — empty state displays)
- Other nav items show "Coming in a later phase" stubs
- Sign out from the sidebar footer works
- Commit: `Phase 2.1: admin auth, layout, parts list`

─── PROMPT ENDS ───

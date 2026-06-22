# Phase 1.2 — Supabase Schema, RLS, and Typed Client

## How Amy uses this file

1. Save this file in your repo at `docs/PHASE-1-2-PROMPT.md`.
2. Open Claude Code in the repo root (`cd ~/amyv-shop-stack`, then `claude`).
3. Paste the contents below the `─── PROMPT BEGINS ───` line as your first message to Claude Code.
4. Claude Code will read it, then start building. It will pause for your approval before applying anything to the live Supabase project. You stay in control.

---

─── PROMPT BEGINS ───

You are Claude Code working in the `amyv-shop-stack` monorepo. This is Phase 1.2 of a multi-phase build for **Ess-Kay Yards Marina** — a marina in Brewerton, NY selling obsolete marine parts. Phase 1.1 is complete (monorepo bootstrap, 8 shared packages scaffolded, Lightbox + design-system extracted from the Galaxy app).

## Your goal in Phase 1.2

Set up the full Supabase database schema, configure Row Level Security on every table, wire up a typed Supabase client in the shared `@amyv/supabase` package, and prepare a clean migration that we can apply to the dev project.

## Source of truth

`docs/ess-kay-yards-master-reference.docx` is the canonical reference. Read it first if it's in the repo. Particularly Sections 5 (Data Model), 6 (Multi-channel Inventory), 7 (Owner QB review flow), and 11 (Security). The decisions captured there are non-negotiable:

- **Phone is the PRIMARY KEY for customers** (E.164 format), not email. Walk-in customers without email still get a record.
- **`visibility` enum on products**: `public`, `internal`, `wholesale`, `ebay_only`. Drives what shows on the website vs. internal-only vs. wholesale-only.
- **`qty_on_hand` and `qty_for_sale` are separate columns.** Physical reality vs. published. Prevents overselling across channels.
- **`qb_status` enum gates QuickBooks push**: `pending_mom_review` → `approved_for_qb` → `pushed_to_qb`. The owner must approve before any push.
- **`product_snapshot` jsonb on order_items**: receipts capture the product state at sale time so they stay accurate forever.
- **`inventory_movements` audit trail**: every quantity change logged with reason, who, when.
- **`source` + `source_ref`** on products: for tracing back to Shopify or Google Sheets origins during migration.

## Supabase project

- Project ref: `iobxyhhlpkffkkigpgoj`
- URL is in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key is in `.env.local` as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (safe for the browser; uses the `anon` role)
- Secret key is in `.env.local` as `SUPABASE_SECRET_KEY` (server-only; bypasses RLS)
- This is the new Supabase API key format (`sb_publishable_...` / `sb_secret_...`) — not the legacy JWT format.

## What to build

### 1. Supabase CLI bootstrap

Check whether `supabase` CLI is installed (`supabase --version`).

- **If not installed**: stop and print the install command for macOS: `brew install supabase/tap/supabase`. Then ask me to confirm installation before continuing.
- **If installed but `supabase/` directory doesn't exist in the repo**: run `supabase init`.
- **If not linked**: print instructions for `supabase login` and then `supabase link --project-ref iobxyhhlpkffkkigpgoj`. Do not run these yourself; they require browser auth and explicit consent.

### 2. Create the migration file

Path: `supabase/migrations/{YYYYMMDDHHMMSS}_phase_1_2_initial_schema.sql`

Structure the file in this order, with section comments:

#### Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

#### Enums

```sql
CREATE TYPE product_visibility AS ENUM ('public', 'internal', 'wholesale', 'ebay_only');
CREATE TYPE product_source AS ENUM ('manual', 'shopify_import', 'sheets_import');
CREATE TYPE qb_status AS ENUM ('pending_mom_review', 'approved_for_qb', 'pushed_to_qb');
CREATE TYPE inventory_movement_reason AS ENUM ('sale', 'return', 'manual_adjustment', 'migration', 'damaged', 'found_in_stock');
```

#### Tables

**`products`**
- `id uuid primary key default gen_random_uuid()`
- `sku text unique not null`
- `part_number text`
- `manufacturer text`
- `title text not null`
- `description text`
- `slug text unique not null` — SEO-friendly, e.g. `mercury-66043-impeller`
- `price_cents integer not null check (price_cents >= 0)`
- `qty_on_hand integer not null default 0 check (qty_on_hand >= 0)`
- `qty_for_sale integer not null default 0 check (qty_for_sale >= 0 and qty_for_sale <= qty_on_hand)`
- `visibility product_visibility not null default 'internal'`
- `acquired_date date`
- `compatibility text[] not null default '{}'` — verified compatibility
- `compatibility_likely text[] not null default '{}'` — best-guess, needs human verification
- `photo_urls text[] not null default '{}'`
- `source product_source not null default 'manual'`
- `source_ref text` — original ID from Shopify or Sheets
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**`customers`**
- `phone text primary key check (length(phone) between 8 and 20)` — assumed E.164 normalized by app layer via libphonenumber
- `email text`
- `first_name text`
- `last_name text`
- `address_line_1 text`, `address_line_2 text`, `city text`, `state text`, `postal_code text`, `country text default 'US'`
- `notes text`
- `created_at`, `updated_at` timestamptz

**`wholesale_partners`**
- `id uuid primary key default gen_random_uuid()`
- `name text unique not null` (seed: 'Singer Castle')
- `contact_email text`, `contact_phone text`
- `notes text`
- `created_at`, `updated_at` timestamptz

**`wholesale_allocations`**
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid not null references products(id) on delete cascade`
- `partner_id uuid not null references wholesale_partners(id) on delete cascade`
- `allocated_qty integer not null check (allocated_qty >= 0)`
- `partner_price_cents integer check (partner_price_cents >= 0)`
- `unique (product_id, partner_id)`
- `created_at`, `updated_at` timestamptz

**`orders`**
- `id uuid primary key default gen_random_uuid()`
- `customer_phone text references customers(phone) on delete restrict`
- `subtotal_cents`, `tax_cents`, `shipping_cents`, `total_cents` — integer not null default 0
- `qb_status qb_status not null default 'pending_mom_review'`
- `qb_invoice_id text`
- `qb_pushed_at timestamptz`
- `qb_push_error text`
- `notes text`
- `stripe_payment_intent_id text unique`
- `created_at`, `updated_at` timestamptz

**`order_items`**
- `id uuid primary key default gen_random_uuid()`
- `order_id uuid not null references orders(id) on delete cascade`
- `product_id uuid references products(id) on delete set null`
- `quantity integer not null check (quantity > 0)`
- `unit_price_cents integer not null check (unit_price_cents >= 0)`
- `product_snapshot jsonb not null` — frozen product state at sale time

**`parts_watch_list`**
- `id uuid primary key default gen_random_uuid()`
- `customer_phone text references customers(phone) on delete set null`
- `part_description text not null`
- `part_number text`, `manufacturer text`
- `sourcing_notes text`
- `status text not null default 'open' check (status in ('open', 'sourced', 'cancelled'))`
- `created_at`, `updated_at` timestamptz

**`inventory_movements`**
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid not null references products(id) on delete cascade`
- `delta integer not null` — positive for additions, negative for removals
- `reason inventory_movement_reason not null`
- `actor_id uuid references auth.users(id) on delete set null`
- `notes text`
- `order_id uuid references orders(id) on delete set null`
- `created_at timestamptz not null default now()` (no updated_at — movements are immutable)

#### Multi-channel inventory trigger (CRITICAL)

Per Section 6 of the master ref: **"Sum of (qty_for_sale + all wholesale allocations + ebay_held) must never exceed qty_on_hand."**

Build a trigger function `enforce_inventory_invariant()` that fires on INSERT or UPDATE of `products` and `wholesale_allocations`. The function should:

1. Compute the total claimed quantity for the affected product = `qty_for_sale` + SUM(`allocated_qty`) across all wholesale allocations.
2. If the total exceeds `qty_on_hand`, raise an exception with a clear message:
   ```
   Inventory invariant violated for product <sku>: claimed (qty_for_sale=X + wholesale=Y) exceeds qty_on_hand=Z
   ```
3. Include a code comment: `-- ebay_held is reserved for a future column; add to this sum when implemented.`

Attach the trigger to both `products` and `wholesale_allocations`.

#### Updated_at trigger

Standard pattern — create a `set_updated_at()` function that sets `NEW.updated_at = now()`, and attach a BEFORE UPDATE trigger to every table that has an `updated_at` column (all except `inventory_movements`).

#### Indexes

- `products`: `visibility`, `sku` (already unique), `manufacturer`, `part_number`, `slug` (already unique), `created_at`
- `orders`: `qb_status`, `customer_phone`, `created_at`, `stripe_payment_intent_id` (already unique)
- `order_items`: `order_id`, `product_id`
- `customers`: `email` where not null
- `inventory_movements`: `product_id`, `created_at`
- `parts_watch_list`: `status`, `customer_phone`
- `wholesale_allocations`: `partner_id`, `product_id`

### 3. Row Level Security

Enable RLS on every table. Then create policies per Section 11 of the master ref. Use the `anon` role for public-website requests (publishable key) and `authenticated` for logged-in staff.

| Table | `anon` (public website) | `authenticated` (staff) |
|---|---|---|
| `products` | SELECT where `visibility = 'public'` | full CRUD |
| `customers` | none | full CRUD |
| `orders` | INSERT only (guest checkout) | full CRUD |
| `order_items` | INSERT only (with order) | full CRUD |
| `wholesale_partners` | none | full CRUD |
| `wholesale_allocations` | none | full CRUD |
| `parts_watch_list` | INSERT only (customer requests) | full CRUD |
| `inventory_movements` | none | full CRUD |

Each policy gets a short SQL comment explaining intent. Example:

```sql
-- Public website (anon) can only browse products that are explicitly marked public.
-- Internal, wholesale, and ebay_only items are never exposed to unauthenticated requests.
CREATE POLICY products_public_select ON products
  FOR SELECT TO anon
  USING (visibility = 'public');
```

### 4. Seed data

Create `supabase/seed.sql`:
- One `wholesale_partners` row: `INSERT INTO wholesale_partners (name) VALUES ('Singer Castle') ON CONFLICT DO NOTHING;`

### 5. Typed client in `packages/supabase`

In `packages/supabase/`:

- Add deps (use exact pins, matching repo convention): `@supabase/supabase-js` and `@supabase/ssr`.
- Create `src/types.ts` with a temporary placeholder export — to be regenerated after the migration runs.
- Create `src/client.ts` exporting three factories:
  - `createBrowserClient()` — uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, for client components.
  - `createServerClient()` — uses the same publishable key with cookie handling for SSR/RSC.
  - `createServiceClient()` — uses `SUPABASE_SECRET_KEY`, bypasses RLS. **Add a JSDoc warning at the top of this function: must never be imported into client code; only for server-side scripts, route handlers, or background workers.**
- Update `package.json` `exports` field to expose `./client` and `./types`.
- Update `tsconfig.json` to extend the base config.
- Run `pnpm -F @amyv/supabase build` and confirm it passes.

### 6. Type generation script

Add to `packages/supabase/package.json`:

```json
"scripts": {
  "gen-types": "supabase gen types typescript --project-id iobxyhhlpkffkkigpgoj --schema public > src/types.ts"
}
```

### 7. Stop, show, ask

When you've created all the files above but **before** running `supabase db push`:

1. Print the migration file path and a summary of what was created (tables, enums, triggers, RLS policies, seed).
2. Print this exact line: **"Ready to apply this migration to the dev project (iobxyhhlpkffkkigpgoj)? Reply 'yes' to push, or tell me what to change."**
3. Wait for explicit approval before running `supabase db push`.
4. After push succeeds, run `pnpm -F @amyv/supabase gen-types` to regenerate the typed client.
5. Print a test query for verification in the Supabase SQL editor:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   (Should return: customers, inventory_movements, order_items, orders, parts_watch_list, products, wholesale_allocations, wholesale_partners — 8 tables.)

## Constraints

- Exact dependency pins, no `^` or `~`. Match the repo's existing style (Next 16.2.4, React 19.2.4, etc.).
- Do not modify Galaxy or other apps. This phase only touches `packages/supabase/` and `supabase/`.
- snake_case for DB, camelCase for TypeScript.
- Every SQL file ends with a final newline.
- Commit the migration to git only after Amy confirms the schema looks right. Use a commit message like `Phase 1.2: Supabase schema + RLS + typed client`.

─── PROMPT ENDS ───

# Project Specification

**Project:** Ess-Kay Yards Marina Platform (`apps/esskay`) + Galaxy Storefront (`apps/galaxy`), running on the `amyv-shop-stack` shared infrastructure.

**Owner:** Amy Vorchheimer
**Status:** Phase 2.1 shipped (admin foundation). Phase 2.2 in planning.
**Last updated:** Monday, May 18, 2026

---

## TL;DR

This is a production e-commerce platform for **two separate small businesses**, sharing one technical foundation:

- **Ess-Kay Yards** — a marina and obsolete-marine-parts business in Brewerton, NY, owned and operated by Amy's parents. Currently runs on Shopify with ~3,652 listed products plus inventory across eight Google Sheets tabs.
- **Galaxy SF** — an art and product shop selling handmade totems with a dark-neon aesthetic. The first client to ship on this stack.

The two apps share a `pnpm` monorepo with shared packages for UI, auth, payments, and email. The architecture demonstrates a repeatable **multi-tenant service model** — each new small-business client costs less than the previous one because most of the work lives in the shared layer.

---

## Why this exists

Ess-Kay Yards has run on Shopify for a decade. It works, but the platform charges a percentage of revenue for features the business doesn't use, and the Shopify catalog system isn't built for a business whose inventory is dominated by **obsolete and hard-to-find parts** — items that need rich provenance data (which boat, which year, which engine), photos taken on a workbench, and pricing that often comes from one-off conversations rather than catalog rules.

Beyond cost, the business needs:

- A workflow Amy's mom can actually use (she's change-averse, distrusts technical jargon, and is the QuickBooks gatekeeper)
- A path off the eight-Google-Sheets-tabs inventory system
- A storefront optimized for technical buyers (mechanics, restorers) rather than impulse shoppers

Galaxy SF, the first client on the stack, also has Shopify-shaped needs but a completely different aesthetic and buyer profile.

The platform serves both — and is designed so that a third client could be onboarded with a fraction of the effort the first two required.

---

## The architecture insight

The single most important decision in this project is the **monorepo with shared packages**, with each client getting its own deployed app.

```
amyv-shop-stack/
├── apps/
│   ├── esskay/    → admin.esskay.yards (parents' business)
│   └── galaxy/    → galaxysf.com (totem shop)
└── packages/
    ├── ui/            → Wordmark, Button, Badge, Card, Table, EmptyState
    ├── design-system/ → CSS tokens (colors, fonts, spacing)
    ├── supabase/      → typed database client
    ├── stripe/        → payments integration
    ├── orders/        → shared order logic
    ├── email/         → transactional email
    └── types/         → shared TypeScript types
```

Each app gets its own brand, its own URL, its own users, its own data. But authentication, database access, payment processing, email delivery, and UI primitives are all written once.

**The result:** when client #3 signs on, the discovery and design work is real, but the platform underneath is mostly free.

---

## Product architecture: the two-layer model

The system separates two concerns that look like one in most simple e-commerce models:

**Layer 1 — Internal admin view (always linked):**
Every product row is implicitly linked to other rows that share the same `part_number + manufacturer`. The Parts list shows each row separately (one per physical item or bulk lot), but the detail "profile" page surfaces every related listing in a Related Listings section. Staff always see the full picture: "we have 3 Mercury 1985 Carburetors total — one on the website, one on eBay, one in-store."

**Layer 2 — Customer-facing display (configurable per item):**
At upload time, the user chooses whether each new item:
- **Links** to an existing public product page (the new listing appears as a variant/option on the existing page), or
- **Creates** its own standalone public page (a fresh URL and listing)

Either way, the internal Layer 1 grouping remains intact.

**Why this matters:**
- Marina inventory is messy by nature (obsolete parts, varied conditions, multiple channels)
- Forcing all same-part items into a single rigid customer-facing structure removes the user's editorial control
- Forcing all same-part items into separate standalone listings loses the relationship internally
- Decoupling these two layers means staff get the truth and customers get the curation

**Implementation note:** Phase 2.2 implements this via shared `part_number + manufacturer` identifiers (Path A). Phase 3+ may promote to a formal `parts` (catalog) + `listings` (inventory items) table split (Path B) if usage shows the simpler model breaks down.

---

## Users

| Role | App | What they do |
|---|---|---|
| **Mom** (Amy's mother) | Ess-Kay admin | Reviews and approves orders before they push to QuickBooks. Eventually serves as super admin. |
| **Dad** (Amy's father) | Ess-Kay admin | Co-owner. Adds inventory from the workbench, manages part listings. |
| **Marina staff** (future) | Ess-Kay admin | Day-to-day order processing, parts identification, customer phone calls. |
| **Marina customers** | Ess-Kay storefront | Mechanics, boat restorers, owners hunting for parts that aren't manufactured anymore. |
| **Galaxy team** | Galaxy admin | Managing totem inventory, fulfillment, customer comms. |
| **Galaxy customers** | Galaxy storefront | Art buyers, design-aware shoppers drawn by the aesthetic. |
| **Amy** | Both | Designer, developer, owner, single point of contact. |

The most important constraint across all users: **parent-facing language never uses "AI," "agents," or "automation."** Mom and Dad distrust tech jargon. Photo-pre-fill is called "smart pre-fill" or "auto-fills from photo," never "AI." This rule propagates everywhere — UI copy, error messages, admin labels.

---

## Scope

### In scope (this project)

- Admin tools for inventory, orders, customers
- Customer-facing storefront with cart and checkout
- Payment processing via Stripe (hosted checkout, no PCI scope)
- Transactional email via Resend
- Photo-driven part data entry (the "smart pre-fill" feature)
- QuickBooks-ready order export workflow
- Migration of Shopify catalog and Google Sheets inventory
- Multi-tenant architecture that supports additional small-business clients

### Out of scope (intentionally)

- POS / in-store checkout (Dad will use the existing register)
- Slip rental management (marina operations stays on its current system)
- Boat brokerage features
- Wholesale partner allocation (**removed from the data model entirely** on May 18, 2026 — Mom and Dad don't do wholesale and never will)
- Custom mobile apps (responsive web is the answer)
- Multi-warehouse inventory (single physical location for both clients in the foreseeable future)

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| 1.1 | Monorepo bootstrap, Galaxy migrated in, shared packages scaffolded | ✅ Shipped |
| 1.2 | Supabase schema, RLS policies, typed client, Singer Castle seed | ✅ Shipped (commit `758b0c2`) |
| 2.1 | Admin foundation — auth, top nav, parts list, design tokens, primitives, wholesale removal | ✅ Shipped (commit `45538fb`, May 18, 2026) |
| 2.2 | Smart entry and Part profile pages (photo pre-fill, match detection, condition field, related listings) | 🔄 Planning |
| 2.3 | Legal & compliance foundation (Privacy, TOS, Refund, Shipping, Accessibility Statement, cookie consent, rate limiting) | 📋 Queued |
| 3 | Customer storefront, cart, Stripe checkout, order pipeline | 📋 Queued |
| 4 | Staff roles, audit logging, employee management, persistent sessions, Mom as super admin | 📋 Queued |
| 5 | Shopify catalog migration (~3,652 products) + inventory import from 8 Google Sheets tabs | 📋 Queued |
| 6 | QuickBooks export, abandoned cart, marketing email | 📋 Queued |

### Phase 2.2 — Smart entry and Part profile pages *(planned, not yet started)*

Goal: dramatically reduce time-to-add per part and surface inventory relationships that already exist implicitly in the data.

Deliverables:
1. **Photo-first entry path.** User uploads a photo of a part from their phone. System suggests Title, Manufacturer, and Part Number based on the image. User reviews and confirms or edits. Target: drop time-to-add from ~3 minutes to ~30 seconds per part. Parent-facing language: "smart pre-fill" — never "AI" or "automation."
2. **Match detection at upload.** When the entered Part Number + Manufacturer matches an existing record, the system surfaces a soft prompt: *"Same part as Mercury 1985 Carburetor — link or keep standalone?"* User chooses per item.
3. **Part profile detail page.** Clicking any part in the list opens a profile-style detail page showing that item plus a "Related Listings" section. Each related listing displays channel (Public / eBay / In-store), condition, price, status.
4. **`condition` enum field on products.** Values: `new`, `NOS` (new old stock), `used_good`, `used_fair`, `needs_rebuild`, `parts_only`. Schema migration required; backfill existing rows to `used_good` by default.
5. **(Maybe)** Bulk import improvements for the 8 Google Sheets tab migration. Defer if it adds scope.

Reference diagrams: `docs/diagrams/03-add-part-flow-phase-2-2.md`

---

## Brand and voice

### Ess-Kay Yards

- **Palette:** cream `#F8F5F0` (background), nautical navy `#0F3A57` (primary text and accent), accent blue `#1E5F8E`. Warm marina vibe — never tech-startup gradients.
- **Typography:** Source Serif 4 (display, wordmark), Inter (body). Both placeholders, swappable via two CSS variables.
- **Voice:** plainspoken, no jargon, helpful. The site is for people who know boats, not people who know e-commerce platforms.

### Galaxy SF

- **Palette:** `#0a0a0f` (background), `#39ff14` (neon accent). Dark, electric, deliberately handmade-feeling.
- **Voice:** confident, art-forward, slightly punk.

### Language rules (Ess-Kay, non-negotiable)

| Avoid | Use instead |
|---|---|
| Dashboard | Home / Overview |
| Users | Staff, Customers, or Shoppers (be specific) |
| Products (as a UI label) | Parts |
| AI | Smart pre-fill |
| Automation | Saves time / does this for you |
| Onboarding | Getting set up |

---

## Technical stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2.4 (App Router) | Mature, server-first, no client-only bottlenecks |
| UI | React 19.2.4 + Tailwind v4 | Tailwind v4's CSS variable model fits our design token system natively |
| Database & auth | Supabase (Postgres + RLS + Auth) | Row-level security replaces a chunk of backend code |
| Payments | Stripe Checkout / Elements | Keeps us on the simplest PCI questionnaire (SAQ A) |
| Email | Resend | Transactional only, no marketing in v1 |
| Hosting | Vercel | Edge cache, automatic HTTPS, preview deployments per PR |
| Monorepo | pnpm workspaces, Turborepo | Fast installs, shared package linking |
| Language | TypeScript, strict mode | Types generated directly from Supabase schema |

---

## Legal & compliance

The merchant (Amy's parents, eventually) bears all legal responsibility for the public storefront. Shopify provides templates and tooling but explicitly disclaims that any of it constitutes legal compliance. Migrating off Shopify does not change this — it just shifts who configures the controls.

### Required pages (before storefront launch)

All published at canonical URLs that match Shopify's pattern so customers find them in the expected place:

- `/policies/privacy-policy`
- `/policies/terms-of-service`
- `/policies/refund-policy`
- `/policies/shipping-policy`
- `/policies/accessibility-statement`

Each page lives as MDX in the repo with React component slots for variables (business name, address, last-updated date, processor list). A nightly job re-renders and archives previous versions in a `policy_versions` Postgres table — 7-year retention to align with US tax record-keeping.

### Implementation plan

| Requirement | Approach |
|---|---|
| Privacy Policy + TOS draft | Termly or Iubenda template ($10–30/mo), reviewed once by a maritime / small-business attorney (~$1,500–$3,000 one-time) |
| Refund Policy | Drafted with the attorney — marina cancellations, fuel sales, weather, seasonal slips all have specific terms that generic Shopify templates don't cover |
| Cookie consent banner | Cookiebot or Termly, single `<Script>` tag, gates analytics loaders by consent value |
| GPC honoring | Next.js middleware reads `Sec-GPC: 1` header and sets `sale_of_data=no` automatically |
| "Do Not Sell" page | `/policies/do-not-sell` form for US visitors, required by CCPA/CPRA |
| DSAR (data access / deletion) flow | Customer-facing form on the account page. Deletion fans out to Stripe `customer.delete`, Resend profile delete, our DB redact. 30-day SLA documented in the privacy policy. |
| DPAs (Data Processing Addendums) | Signed with every processor: Stripe, Vercel, Supabase, Resend, analytics. Stored in `docs/processors.md`. |

### What we deliberately don't do

- **Overlay accessibility widgets** (accessiBe, UserWay, AudioEye). US federal courts have repeatedly held these don't cure underlying WCAG failures, and the FTC fined accessiBe $1M in April 2025 for misleading WCAG-compliance claims. Treat as liability, not defense.
- **SOC 2 audit.** Costs $15K–$40K, only useful if we ever sell to enterprise customers. Document equivalent controls in a one-page security overview instead.
- **Per-user email marketing without explicit opt-in.** Mom would never agree to it anyway.

---

## Accessibility

**Target: WCAG 2.2 Level AA.** This is the US ADA standard, the EU Accessibility Act standard (in force since June 2025), and the de facto bar for retail e-commerce.

> **Note on "AAA":** AAA is the highest WCAG tier and is **aspirational** — the standard itself acknowledges not all AAA criteria can apply to every site. AA is what courts apply, what laws require, and what real e-commerce ships against.

### Concrete baseline

| Area | Requirement |
|---|---|
| **HTML structure** | One `<h1>` per page; semantic landmarks (`<header role="banner">`, `<nav>`, `<main>`, `<footer>`); skip-to-content link as first focusable element; `lang` attribute on `<html>` |
| **Keyboard** | Every interactive element reachable in source order; visible focus ring with 3:1 contrast; modal/drawer focus trap with Escape close; no `outline: none` without a replacement |
| **Forms** | Every input has a `<label for>` (never placeholder-only); `autocomplete` attributes on name/address/email/phone; inline errors with `aria-describedby` and `aria-live="polite"`; error summary at top of form on submit failure |
| **Color & type** | Body text contrast ≥ 4.5:1, large text ≥ 3:1; body copy ≥ 16px; color never the only signal; usable at 200% zoom and 320px viewport |
| **Media** | No autoplay; videos captioned; product photos with descriptive alt text (size, condition, distinguishing features for marine parts); decorative images get `alt=""` |
| **Testing** | `@axe-core/playwright` in CI on every PR; Lighthouse accessibility score threshold ≥ 95 (more conservative than Shopify's 90); manual NVDA + VoiceOver audit of the critical path quarterly |

An **Accessibility Statement** is published at `/policies/accessibility-statement` citing WCAG 2.2 AA, the contact email for issues, and the response timeline. This is required by the EAA for businesses serving EU customers and is the single biggest documented good-faith defense in ADA suits.

---

## SEO & performance

The Ess-Kay storefront is the SEO surface (the admin is internal-only and `noindex`).

### Page-level

- Server-rendered HTML with full meta tags for every product page
- `<title>` and `<meta name="description">` derived from product name, part number, manufacturer, fit (year/model/engine)
- Open Graph and Twitter Card meta for shareability
- `application/ld+json` Product schema with SKU, brand, price, availability — drives rich snippets in Google search results
- Canonical URLs, no duplicate-content traps

### Site-level

- `robots.txt` allowing the storefront, disallowing `/admin/*` and `/policies/do-not-sell`
- `sitemap.xml` auto-generated from the product database, refreshed nightly
- 301 redirects from old Shopify URLs to new product pages (preserves accumulated search authority — non-negotiable for a 10-year-old store)

### Performance

- Lighthouse performance score ≥ 90 on product pages (mobile and desktop)
- Largest Contentful Paint < 2.5s, Cumulative Layout Shift < 0.1
- Images served via Next.js `<Image>` with WebP/AVIF + responsive `srcset`
- Static generation for product pages, ISR for inventory changes

---

## Security

### Built in by default

- All database access mediated by Supabase Row-Level Security policies — unauthorized users cannot read data they shouldn't, even if the API surface leaks
- Server-side-only `SUPABASE_SECRET_KEY` (never exposed to the browser); browser uses the publishable key
- Stripe handles all card data — cards never touch our servers (SAQ A scope)
- HTTPS enforced everywhere by Vercel, HSTS preload eligible
- React's default XSS protection on all user-rendered content
- Argon2id password hashing handled by Supabase Auth
- Two-factor authentication available for admin/staff accounts (TOTP)

### Phase 2.3 hardening

- Rate limiting on `/admin/login` (currently unprotected against brute-force)
- Content Security Policy headers with SRI hashes on the checkout page (PCI DSS 4.0 requirement 6.4.3 / 11.6.1 — effective March 31, 2025; the responsibility falls on the merchant even with Stripe hosted fields)
- Audit logging beyond `inventory_movements` (orders, customer changes, admin actions)
- Role-based access in the admin (super_admin / admin / staff)

---

## Success criteria

The project is successful when:

1. **Mom can do her job without me.** She logs in, sees the orders queued for QuickBooks review, approves or edits them, and exports. No phone call to Amy required.
2. **Dad can add a part from a phone photo in under two minutes.** From the workbench, snap a photo, hit upload, smart pre-fill suggests title/manufacturer/category, he confirms or edits, lists it. Compare to the current Shopify flow which takes him 8–10 minutes per item.
3. **The storefront performs.** Lighthouse ≥ 90 across performance, accessibility, SEO. Organic traffic from Google ≥ what Shopify generated within 90 days of launch.
4. **Galaxy SF runs in parallel without interference.** Code changes for Galaxy don't break Ess-Kay and vice versa. The shared packages absorb the work.
5. **A third client can be onboarded in ≤ 30% of the time Galaxy or Ess-Kay took.** This is the test of whether the multi-tenant architecture pays for itself.

---

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mom rejects the new admin UX | Medium | High | Email+password instead of magic link (matches her Shopify mental model); plain-language UI copy; staged rollout where Shopify keeps running in parallel for 30 days |
| Shopify catalog migration introduces SKU mismatches | High | Medium | Dry-run migration script with diff report against current Shopify; manual reconciliation for items with conflicts |
| PCI DSS 4.0 script-monitoring requirement gets missed | Low | High | Strict CSP + SRI hashes on the checkout page; document compliance in the security overview |
| ADA demand letter post-launch | Low | High | WCAG 2.2 AA implementation from the start (not retrofitted); published Accessibility Statement; quarterly axe + manual audits documented |
| Single point of failure (Amy) | High | High | Full project specification in repo; CLAUDE.md keeps context portable; codebase documented well enough that another developer could pick it up |
| Cost overruns on third-party services | Low | Medium | Vercel, Supabase, Stripe all have generous free tiers; Cookiebot ~$15/mo; attorney one-time spend ~$2K; total predictable monthly cost < $100 |

---

## Decisions log

A running record of significant architectural and product decisions. Each entry: date, decision, why.

| Date | Decision | Why |
|---|---|---|
| 2026-05-15 | Singer Castle removed as a wholesale partner | Parents don't do wholesale; the feature was theoretical |
| 2026-05-15 | Phone (E.164) as primary key for customers | Marine customers rarely have email; phone is universal |
| 2026-05-15 | Email+password auth, not magic link | Parents' UX expectation — Shopify-style persistent sessions |
| 2026-05-15 | Top nav, not sidebar | Designer call — less screen real estate spent on navigation, faster scanning |
| 2026-05-18 | Wholesale removed from the database entirely | Cleaner schema; "never wholesale" is a strong commitment but worth the simplicity |
| 2026-05-18 | Visual Studio Code + Claude Code extension as the primary dev environment | Inline diffs, plan mode, no more Rewind menu confusion |
| 2026-05-18 | This Project Specification document created | Single source of truth for Claude Code context and portfolio use |

**May 18, 2026 — Two-column QTY display.** Parts list shows separate "For Sale" and "On Hand" columns instead of the previous single "X / Y" format. Both numbers need to be readable and sortable independently. Implemented in PartsTableBody.tsx.

**May 18, 2026 — Part detail "profile page" model (Path A).** When a user clicks a part in the list, the detail page shows that specific item plus a "Related Listings" section listing every other item with the same part_number + manufacturer. Each related listing shows channel (Public website / eBay / in-store), condition, price, and status. Rationale: marina inventory of obsolete parts arrives inconsistently and in varied conditions; staff and customers benefit from seeing the full history of a part across the business. Chose Path A (query by shared identifiers) over Path B (formal catalog + listings table split) because Path A delivers the UX with no schema migration; Path B can be promoted later if real usage demands it.

**May 18, 2026 — Two-layer product architecture.** The source-of-truth admin view is always linked; the public-facing display is configurable per item. Staff never lose the relationship between identical parts (internal admin view always groups by part_number + manufacturer). Customer-facing display can be either a unified product page (linked) or a standalone listing — chosen per item at upload time. This separates internal truth from external curation and survives messy real-world data.

**May 18, 2026 — Parts list row rule.** One row in the Parts list represents either one unique physical item OR one bulk lot of identical items. If items are truly identical (same condition, same source, interchangeable), they get one row with qty > 1. If any items differ in any way (different condition, source, photos), they get separate rows linked via shared part_number on the profile page. The qty_on_hand and qty_for_sale fields already support both cases — this is a workflow rule, not a schema change.

**May 18, 2026 — Diagrams as portfolio artifacts.** User-flow diagrams live in `docs/diagrams/` as numbered Mermaid markdown files. Historical files are snapshots and are not edited when flows change — new numbered files are created instead. The evolution from Phase 2.1 → 2.2 → 2.3 is the portfolio narrative, more valuable than always-current diagrams. Captured in CLAUDE.md as the "Diagram maintenance" rule.

**May 18, 2026 — RLS GRANT bug fix.** Discovered that the RLS policies created in earlier migrations were never paired with `GRANT SELECT` on the underlying tables for the anon/authenticated roles, causing the products page to silently return zero results. Added migration `20260518140000_grant_table_privileges.sql` granting full table access to authenticated and SELECT to anon (RLS policies still filter). Lesson: when adding RLS in Supabase via migration, always pair with GRANTs explicitly — the Supabase dashboard auto-grants but raw SQL migrations don't.

**May 29, 2026 — Auto-push to GitHub enabled.** All commits in this repo automatically push to origin/main via a `.git/hooks/post-commit` hook. Switched to SSH after HTTPS credential prompt failed. Risk accepted: occasional push of half-baked work in exchange for zero manual upkeep — acceptable for a solo portfolio project.

---

## Glossary

- **Monorepo** — a single Git repository containing multiple deployable applications and shared libraries
- **RLS (Row-Level Security)** — Postgres feature where the database itself enforces who can read or write each row, eliminating an entire class of authorization bugs
- **DSAR** — Data Subject Access Request, the GDPR/CCPA term for a customer asking what data you hold on them or asking to delete it
- **VPAT** — Voluntary Product Accessibility Template, the format used to publish accessibility conformance reports
- **PCI DSS SAQ A** — the shortest Payment Card Industry self-assessment questionnaire, available to merchants who use a hosted payment page (i.e., card data never touches your server)
- **GPC (Global Privacy Control)** — browser-set header that automatically signals "do not sell my data" to participating sites
- **EAA** — European Accessibility Act, in force since June 28, 2025

---

## Appendix: how to use this document

This document is the canonical source of truth for the project. It is read by:

1. **Claude Code at the start of every session** (referenced from `CLAUDE.md`)
2. **New developers** before touching the codebase
3. **Stakeholders** (Amy's parents, Galaxy SF team) who want to understand what's being built
4. **Hiring managers** reviewing Amy's portfolio — this doc lives at `amyvorchheimer.com/work/ess-kay-yards`

**When something changes that matters**, update the Decisions Log first, then the affected sections. Never delete history — append.

**When in doubt about whether to add something to this doc:** if it would help the next person who reads the codebase understand *why* a decision was made (not just *what* the code does), it belongs here.

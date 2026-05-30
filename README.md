# Ess-Kay Yards

Production e-commerce platform for a marina parts business. Built by a UX designer to demonstrate end-to-end product development with AI-assisted engineering.

**Status:** Phase 2.1 shipped · Phase 2.2 in design

---

## What this is

A real e-commerce platform replacing the Shopify storefront for a family-run marina in Brewerton, NY that specializes in obsolete and hard-to-find marine parts (~3,652 products in current catalog). It serves a real business — and doubles as a portfolio case study showing what a UX designer can ship today using AI-assisted engineering.

## Why I built it

I'm a UX designer. I wanted to demonstrate something specific: that a designer with strong product instincts and AI assistance can ship real, working software — not just hand off a Figma file. The marina was the right constraint to test it against because the users are change-averse, the inventory is messy in honest real-world ways, and there's no faking whether it works.

## What's built (Phase 2.1, shipped May 18, 2026)

- Supabase auth with email + password (chosen over magic link based on user research with the actual users)
- Admin parts list with visibility badges (Public / Internal / eBay Only)
- Separate For Sale / On Hand quantity tracking
- Top navigation (Home / Parts / Customers / Orders)
- Design tokens via CSS variables wired through Tailwind v4
- Shared UI primitives in `packages/ui` (Wordmark, Button, Badge, Card, Table, EmptyState)
- Row-level security on every data table with explicit role grants
- Multi-tenant monorepo architecture supporting additional client apps

## Tech stack

Next.js 16 · React 19 · Tailwind v4 · TypeScript · Supabase (Postgres + RLS) · pnpm workspaces · Node 24

## Key documents

- **[PROJECT.md](PROJECT.md)** — Canonical 17-section spec covering architecture, decisions log, brand/voice rules, roadmap, and compliance approach
- **[docs/diagrams/](docs/diagrams/)** — Numbered Mermaid user-flow diagrams showing phase-by-phase product evolution (Phase 2.1 current, Phase 2.2 evolution)
- **[CLAUDE.md](CLAUDE.md)** — Conventions for AI-assisted development (Self-check protocol, diagram maintenance rules, auto-push setup)

## Architecture highlight: the two-layer product model

Marina inventory of obsolete parts is messy by nature. The same part comes in repeatedly, in different conditions, sold across multiple channels (website, eBay, in-store). I designed a two-layer model to handle that:

- **Internal admin view — always linked.** Same-part items group by `part_number + manufacturer` regardless of public display. Staff always see the truth: "we have three Mercury 1985 Carburetors total — one public, one on eBay, one in-store."
- **Customer-facing display — configurable per item.** At upload, the user chooses whether each new item links to an existing public product page or creates its own standalone listing. The internal grouping never breaks.

Decoupling these layers means staff get the truth and customers get the curation. Full rationale in the Decisions Log section of [PROJECT.md](PROJECT.md).

## Build methodology

This project uses AI-assisted development. My role is product/design lead and reviewer; AI handles implementation under my direction. The pattern that works:

1. **Plan** with chat-based Claude (strategy, architecture, product calls)
2. **Execute** with Claude Code in VS Code (file edits, migrations, commits)
3. **Verify** with the Self-check protocol (TypeScript clean, dev server compiles, behavior confirmed) before any "done"
4. **Document** decisions and flow diagrams as the work happens — not after — so future sessions stay aligned

See [CLAUDE.md](CLAUDE.md) for the full protocol.

---

## About

Amy Vorchheimer — UX designer. Open to senior product, design, and design-engineering opportunities.

[LinkedIn](https://www.linkedin.com/in/amy-vorchheimer-ux-ui-ixd/) · [amyvdesign.com](https://amyvdesign.com/)

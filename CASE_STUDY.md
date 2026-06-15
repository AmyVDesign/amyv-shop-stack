# Marine Parts Platform — Case Study Notes

A running log of decisions, insights, and engineering moments worth telling. This document is for portfolio site copy, interview narratives, and future-me's memory of why things ended up the way they are.

## How to use this doc

Each entry follows the same shape:
- **Situation** — what was happening
- **Insight or decision** — what I noticed or chose
- **Outcome** — what shipped
- **Why it's worth telling** — the angle for portfolio / interview

Add entries as moments happen. Don't wait for a "polish phase" — by then the texture is lost.

---

## Project at a glance

Production e-commerce platform replacing Shopify for a marina parts business specializing in obsolete and hard-to-find marine parts. Built solo by a UX designer with AI-assisted engineering. Serves a real family business; doubles as a portfolio case study demonstrating end-to-end product development without an engineering team.

Stack: Next.js 16 · React 19 · Tailwind v4 · TypeScript · Supabase · pnpm workspaces · Anthropic Claude API for vision-driven smart pre-fill.

---

## Entries

### Photo-first form flow (UX inversion)

**Situation:** The product-add form had AI photo analysis bolted onto the side. Suggestions appeared as "Accept / Ignore" chips next to each form field, after the user had already typed.

**Insight:** The flow was inverted. By the time a user saw the AI suggestion for Part Number, they'd already typed Part Number. The chip was second-guessing work they'd already done, which felt adversarial rather than helpful.

**Decision:** Move photo upload to the top of the form, before any text inputs. Auto-fill the fields directly from the photo analysis. Remove the suggestion chips entirely. The photo becomes the entry point, not an enhancement.

**Outcome:** Mental model shifted from "AI second-guesses my typing" to "take a photo, the form fills itself in, review and finish." Cognitive load dropped significantly for the actual users (non-technical family members).

**Why it's worth telling:** Identifying the wrong affordance after you've built it requires letting go of work. The fix here was a structural reversal of the form, not a tweak. Shows designer-driven willingness to undo and rebuild when usage observation reveals the original framing was wrong.

---

### Model selection — Claude Sonnet over Opus

**Situation:** Building photo-based smart pre-fill via Claude vision API. Two model choices: Sonnet 4.6 or Opus 4.8.

**Decision:** Sonnet 4.6.

**Reasoning:**
- Task profile is vision + structured JSON output, not complex multi-step reasoning. That's Sonnet's sweet spot.
- Sonnet is faster — meaningful for live UX where suggestions appear within 2-5 seconds of upload
- At ~20 photos/week, Sonnet costs ~$1.60/month vs ~$6 for Opus. Cost wasn't the deciding factor, but it confirmed the choice.

**Outcome:** Demo feels snappy, suggestions are accurate, cost is negligible.

**Why it's worth telling:** Demonstrates engineering judgment over reflex. "I picked the most capable model" is a less interesting story than "I picked the right model for the task profile." Hiring managers reading this learn I understand the model landscape, not just that I'm aware Claude exists.

---

### Custom code reviewer subagent

**Situation:** After every commit, I was manually running the same six checks: TypeScript clean, no em dashes (project convention), no "AI" terminology in user-facing strings (parents are the actual users, the AI should be invisible), RLS on any new tables, no hardcoded hex colors outside the design tokens, no committed secrets.

**Decision:** Built a project-specific Claude Code subagent at `.claude/agents/reviewer.md` that runs these checks against each commit and outputs a structured pass/warn/fail report.

**Outcome:** Commits auto-reviewed against my own project conventions in seconds instead of minutes of manual grep-ing. The agent doesn't replace judgment; it catches the boring stuff so I can focus on design decisions.

**Why it's worth telling:** Shows AI leverage beyond "I use Claude Code." Building a custom subagent that enforces project-specific quality conventions is a step further: I'm not just consuming AI tools, I'm building specialized AI tooling for my own workflow.

---

### Backlog-driven agent loop

**Situation:** After the reviewer subagent was working, the next leverage step was to remove myself from the boring middle of tactical work. Polish tasks, refactors, util extractions, empty-state guards — these are real value but tedious.

**Decision:** Designed a multi-agent loop with three specialized agents:
1. **Planner subagent** reads `docs/backlog.md`, picks the highest-priority READY task, and outputs a structured implementation plan (approach, files, steps, commit message). Does not implement.
2. **Implementer** is Claude Code itself, the main agent, executing the plan.
3. **Reviewer subagent** verifies the commit against project conventions and outputs pass/warn/fail.

On a successful iteration, the orchestrator updates the backlog status to `[DONE]` with the commit hash. On failure, it halts and reports to me.

**Outcome:** First production iteration: TASK-002 (date formatting standardization) picked, implemented, reviewed, and merged in a single loop invocation. Reviewer caught scope creep (an unrelated empty-state guard was bundled in) and a shared-package suggestion (the date util should move to a monorepo package if Galaxy SF needs it). Loop halted cleanly when the only remaining task was tagged `[NEEDS_HUMAN]`.

**Why it's worth telling:** This is the actual "loops, not prompts" pattern that the next generation of AI-assisted development is moving toward. I'm not just using AI agents, I'm orchestrating them. The planner thinks about what to do, the implementer does it, the reviewer verifies. Each is specialized and bounded. The architecture is transferable to any project with a structured backlog.

---

### Inventory consolidation with history preservation

**Situation:** During test data cleanup, multiple "new" condition variants existed for the same canonical part because the original add-product flow created a row per addition. Needed to consolidate them into a single keeper row without losing the historical record of when each batch was added.

**Decision:** Two pieces:
1. `inventory_events` table — append-only log of qty deltas with date, note, product_id
2. Migration that backfilled events from existing rows BEFORE consolidating, so no history was lost in the cleanup

**Outcome:** Single source of truth in the products table (one keeper per canonical), full historical record in inventory_events. Future `createPart` for linked-new variants increments the keeper's qty and logs the event, instead of creating duplicate rows.

**Why it's worth telling:** Most data cleanup deduplicates and forgets. The right architecture for inventory respects time — when did each unit arrive, in what batch, at what condition. Shows data thinking that goes beyond "tables and columns" into "what does this data mean over time."

---

### Self-link cycle bug (defensive defense in depth)

**Situation:** After implementing canonical resolution (each variant chains to a root canonical via `linked_listing_id`), users editing certain products got `ERR_TOO_MANY_REDIRECTS`.

**Root cause:** Canonical resolution was following the chain back to the row being edited, creating a self-link — infinite loop.

**Fix:** Two-layer defense.
1. Code-level: `excludeId` parameter passed into canonical resolution so the row being edited is never returned as its own canonical
2. Schema-level: `CHECK (id != linked_listing_id)` constraint at the database level so the bug class becomes structurally impossible to recreate

**Outcome:** Bug fixed, and future occurrences prevented by design. Even a buggy server action can't create a self-link because the database refuses it.

**Why it's worth telling:** Belt-and-suspenders defensive programming. Senior engineers don't just fix the bug; they fix the bug class. Solving a problem once at the database constraint level prevents every future re-occurrence at the application level.

---

## Quotable paragraphs (ready for portfolio / interview)

### On AI-assisted development methodology

> My pattern is split-context. Planning happens with chat-based Claude (architecture, scope, product calls). Execution happens with Claude Code in VS Code (file edits, migrations, commits). I review and verify every step. AI handles implementation under my direction; I retain product judgment, design decisions, and the quality bar.

### On knowing when to undo

> Halfway through building the photo-analysis feature, I realized the affordance was inverted — suggestions were appearing AFTER users typed, which felt adversarial. Instead of tweaking the chip pattern, I restructured the form so photo upload came first and auto-filled the fields directly. The fix was structural, not cosmetic. Designer-driven willingness to undo and rebuild is part of getting the product right.

### On model selection

> I used Claude Sonnet 4.6 for the photo analysis rather than Opus. The task profile is vision + structured JSON output, not complex reasoning. Sonnet is faster, equally accurate on this task, and an order of magnitude cheaper. Hiring managers care about engineering judgment, not reflex toward the most expensive model.

---

## Sections to add as we go

- **Loom demo script** (when you record the walkthrough video)
- **Migration story** (when you import the 3,652 Shopify products)
- **Scaling moment** (when Galaxy SF reuses the shared `@amyv/ui` and `@amyv/design-system` packages)
- **Real-user feedback** (when your parents actually use the platform — their reactions are gold)

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

### Verification protocol in production: reviewer caught 4 violations before allowing ship

**Situation:** Built three design-system pages (landing, theme, style guide) under `/design-system`. First implementation attempt was technically functional. Reviewer subagent ran on the commit.

**What the reviewer caught:**
1. Em dashes in JSX text content across all three pages
2. Hardcoded hex value `border-[#2a2a35]` instead of a design-system token
3. Duplicate `<h2>` "Color tokens" on the theme page (semantic violation)
4. Brittle pattern: isDark hex array drifting from the underlying data

**Outcome:** Loop halted. Implementation agent was directed to fix each violation. Second attempt: tsc clean, pattern scans clean, semantic structure clean, no drift. Then committed.

**Why it's worth telling:** The reviewer subagent isn't a passing-checkbox. It catches real violations, halts work, and requires fixes before declaring done. That's V&V in production, not in a slide deck. Replace the project conventions with clinical safety conventions and the same architecture extends to surgical UI verification — specialized agents that refuse to ship non-compliant work, regardless of what the implementing agent generated.

---

### Accessibility-driven token refinement

**Situation:** Applied the coastal-modern palette to seven admin screens. The implementation plan specified azure-dark text on azure-light backgrounds for badges, coral-dark text on coral-light backgrounds, and azure-dark for secondary action buttons.

**What the a11y-reviewer caught:** Every one of those specifications failed WCAG 1.4.3 contrast minimum on its target background. The agent computed contrast ratios and cited the criterion:
- Azure-dark (#0284C7) on azure-light (#E0F2FE): 3.57:1 — fails 4.5:1
- Driftwood-dark (#8F7649) on driftwood-light (#F3EBDD): 3.65:1 — fails 4.5:1
- Coral-dark (#E5564A) on coral-light (#FFE4E0): 3.02:1 — fails 4.5:1
- Azure-dark on white (action buttons): 4.10:1 — fails 4.5:1
- Existing StockDot amber-500 on cream background: 1.97:1 — fails WCAG 1.4.11 (non-text contrast, 3.0:1 required)

**Decision:** Substitute navy (#0F3A57) as badge text across all three tinted backgrounds. Navy yields 9.9–10.4:1 on the light tints and 11.9:1 on white — well past the threshold. Bump the amber stock indicator to amber-700 (#B45309) to clear the non-text contrast floor.

**Outcome:** Five WCAG citations, five surgical fixes, single review pass. The original plan would have shipped visually coherent but technically inaccessible contrast. The badge strategy (tinted bg + navy text) became the documented rule in the style guide.

**Why it's worth telling:** The accessibility commitment isn't a final-stage audit; it's a structural gate that ships every commit. The a11y-reviewer agent doesn't check a list — it computes contrast ratios, cites the criterion, and refuses to pass work that fails. The implementation plan was wrong in a specific, measurable way. The verification layer caught it before the commit.

---

### Removing a feature that did not fit the business

**Situation:** The parts table showed a colored stock indicator (green, amber, red dot) next to the on-hand quantity, flagging low stock at a glance. It came from the instinct every inventory UI has: surface what is running low so someone can reorder.

**Insight:** The marina sells obsolete, one-of-a-kind Onan parts. There is nothing to reorder. A "low stock" signal implies an action that does not exist for this business, so the dot was visual noise dressed up as information. The right affordance for a generic shop is the wrong one here.

**Decision:** Remove the stock dots entirely. The on-hand number stays (still accurate, still accessible), only the status color comes off. Logged as reversible if the model ever changes.

**Outcome:** Cleaner table, one less thing competing for attention, and an interface that reflects how the business actually works rather than a default e-commerce pattern.

**Why it's worth telling:** Subtraction driven by domain understanding. Cutting a reasonable-looking feature because it does not map to the customer's reality is a stronger product signal than adding one.

---

### Design-system leverage: one edit, every table

**Situation:** A visual review of the admin flagged the table header as dated: a filled warm-grey band behind the column labels.

**Decision:** The fill lived on the shared Table component in the @amyv/ui package, not on the parts page. Removing one background class and keeping a single hairline border updated every table in the monorepo at once, across both the marina admin and the second client's app. The same pass standardized control corner-radius and left-aligned the quantity columns.

**Outcome:** Headers went from filled-band to borderless platform-wide from a one-line change.

**Why it's worth telling:** Design refinements compound through the shared component layer instead of being repeated per screen. The multi-tenant architecture is design-system reuse, not just code reuse.

---

### Treating accessibility as a verification protocol, not a checklist

**Situation:** WCAG compliance is usually a one-time audit near launch. On this platform it runs on every commit through a dedicated accessibility reviewer that halts the pipeline on any failure.

**Decision:** Formalize the reviewer gates as a written UI verification and validation protocol: seven WCAG 2.2 AA criteria as named test cases with methods and pass conditions, halt-on-fail semantics, and traceability from each commit to the criterion and the exact file and line.

**Outcome:** Accessibility became a documented, repeatable protocol rather than tribal knowledge, and the doc doubles as the record of how the design system stays AA compliant as it grows.

**Why it's worth telling:** Verification and validation is the language of regulated, high-stakes interface work. Showing AA compliance as an enforced protocol with traceable defect records, not a final-stage checklist, is the difference between "I made it accessible" and "I maintain accessibility as a process."

---

## Quotable paragraphs (ready for portfolio / interview)

### On AI-assisted development methodology

> My pattern is split-context. Planning happens with chat-based Claude (architecture, scope, product calls). Execution happens with Claude Code in VS Code (file edits, migrations, commits). I review and verify every step. AI handles implementation under my direction; I retain product judgment, design decisions, and the quality bar.

### On knowing when to undo

> Halfway through building the photo-analysis feature, I realized the affordance was inverted — suggestions were appearing AFTER users typed, which felt adversarial. Instead of tweaking the chip pattern, I restructured the form so photo upload came first and auto-filled the fields directly. The fix was structural, not cosmetic. Designer-driven willingness to undo and rebuild is part of getting the product right.

### On model selection

> I used Claude Sonnet 4.6 for the photo analysis rather than Opus. The task profile is vision + structured JSON output, not complex reasoning. Sonnet is faster, equally accurate on this task, and an order of magnitude cheaper. Hiring managers care about engineering judgment, not reflex toward the most expensive model.

---

### A living style guide, not just a markdown spec

**Situation:** After the coastal-modern palette pass and the a11y verification cycle,
the design system existed as a set of CSS variables in globals.css and a markdown
document. Neither stays automatically in sync as components change.

**Decision:** Build the style guide as a rendered admin route
(/admin/design-system) that reads token values at runtime via `getComputedStyle`,
renders all @amyv/ui components in every variant and state in the live token
environment, shows the five WCAG catches from the palette pass as before/after
swatch pairs, and demos the Galaxy SF theme by applying a `[data-theme="galaxy"]`
attribute to a preview container -- no component source changes required.

**Outcome:** One page that cannot drift from the code. Any change to globals.css
or @amyv/ui shows up in the style guide on the next reload, because it is
rendering the components in their actual environment, not screenshots or static
copies. The token hex values are read client-side at mount via `getComputedStyle(document.documentElement)`,
so the page satisfies the no-hardcoded-hex-in-source convention even while
displaying resolved hex strings.

**Why it's worth telling:** A static style guide is a documentation artifact that
requires a second person to keep in sync with the codebase. A living style guide
is a constraint: the code is the spec. Showing that distinction in a working demo
is more convincing than describing it in a slide.

---

### Layered verification: static gate plus runtime tests plus CI

**Situation:** Quality was enforced by two reviewer subagents that grep each diff. Effective,
but heuristic and dependent on the agent loop running.

**Decision:** Add a deterministic layer underneath the agents: component tests that assert no
accessibility violations at runtime (via axe-core in jsdom), unit tests on the rules I rely
on (quantity defense-in-depth, combobox keyboard handling), a Zod schema validating the vision
model output at the route boundary, and a GitHub Actions CI workflow that runs typecheck, lint,
and tests on every push and pull request independent of the agent loop.

The qty_for_sale rule was inline in the form. Extracting it to a pure helper
(src/lib/qty-guard.ts) made it testable with passing and failing cases and wired it into both
server actions for server-side enforcement, not just client-side validation.

The vision route previously trusted the model's JSON output with an unsafe type cast.
The Zod schema (src/lib/vision-schema.ts) parses and validates the model's output before
any field is read, returns a clean error on schema mismatch, and gives the test suite a
boundary to assert against with valid and invalid payloads.

**Outcome:** Accessibility, core logic, and untrusted model output are now verified by code
on every push, not only by review. The reviewer agents remain the heuristic gate for
conventions; the test suite and CI are the deterministic gate for correctness.

**Why it's worth telling:** A single reviewer is a checkpoint. A layered pipeline (types,
lint, runtime tests, boundary validation, CI) is a verification system. The second is what
high-stakes interface work actually requires, and it is the difference between catching issues
by inspection and catching them by construction.

---

### Runtime contrast verification in a real browser

**Situation:** The accessibility gate and the component tests are strong, but both are static or jsdom-based, so neither can verify computed color contrast. Contrast was the exact failure class the palette pass had to fix by hand.

**Decision:** Add a Playwright layer that runs axe-core in a real Chromium browser against the themed pages, with the color-contrast rule enabled, asserting zero serious or critical violations on the admin surface where the palette lives.

**Outcome:** Contrast is now verified by machine in the environment where it actually renders, closing the one gap the static and jsdom layers could not reach. A regression that drops a token below the minimum ratio fails a test instead of shipping.

**Why it's worth telling:** Knowing which check belongs at which layer is the point. Static grep for patterns, jsdom for structure and ARIA, a real browser for contrast and layout. Matching the verification method to what it can actually catch is the difference between testing theater and testing that holds.

---

### The blind spot my own gate had

**Situation:** The filter checkboxes used azure as the checked color. Azure on white is about 2.9:1, which fails WCAG 1.4.11 non-text contrast, yet it passed every automated check.

**Insight:** The gate verified text contrast (1.4.3) but had no non-text contrast criterion (1.4.11), and a control color set through accent-color is not a text color pair, so the static check could not see it. Automated axe does not cover 1.4.11 well either. The failure was real and invisible to tooling. I caught it by eye.

**Decision:** Fix the control color to azure-dark (about 4.1:1, passing) and add 1.4.11 to the a11y-reviewer so control and state contrast is checked going forward, with the azure-on-light trap named explicitly.

**Outcome:** The checkboxes pass, and the gate now covers the criterion that let the defect through.

**Why it's worth telling:** Knowing the limits of your own automation is the senior skill. Static and jsdom checks cannot see computed control contrast and axe does not automate 1.4.11, so this class needs a human and a named rule. Finding the hole in my own gate and closing it is a stronger story than a gate that never had one.

---

### Visual regression guarding the design system

**Situation:** Logic tests and accessibility checks pass even when the UI renders wrong. A token shift or a reverted style is invisible to them, exactly the class behind an earlier theme-not-rendering confusion.

**Decision:** Add Playwright visual regression with the living style-guide page as the primary baseline. Because that page renders the whole component library and token system, and a second shot captures the alternate theme, one small suite guards the look of the entire design system. Dynamic content is masked and animations are disabled so diffs stay meaningful.

**Outcome:** A color, layout, or token regression now surfaces as a failed pixel diff with a visible before and after, instead of shipping unnoticed.

**Why it's worth telling:** This closes the last gap in the verification stack. Logic, structure, contrast, and now appearance are each guarded by the check best suited to catch them. The style-guide page earns a second job as the visual baseline for everything it documents.

---

## Sections to add as we go

- **Loom demo script** (when you record the walkthrough video)
- **Migration story** (when you import the 3,652 Shopify products)
- **Scaling moment** (when Galaxy SF reuses the shared `@amyv/ui` and `@amyv/design-system` packages)
- **Real-user feedback** (when your parents actually use the platform — their reactions are gold)

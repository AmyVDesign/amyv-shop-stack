# Style Guide

The guidance. Voice, usage rules, accessibility commitments.

**Related:** [README.md](README.md) &middot; [THEME.md](THEME.md)

---

## Voice and tone

Direct, knowledgeable, never condescending. We sell obsolete parts to people who know what they need. Skip marketing language. Use part numbers, vendor names, and condition states precisely. Never use "AI" in customer-facing copy.

---

## Color usage rules

### The five-accent system

Ess-Kay Yards uses five brand accents with clear purpose boundaries:

| Accent | Use | Never |
|--------|-----|-------|
| **Navy** `#0F3A57` | Primary text, primary CTAs, headings, navigation | Body prose at small sizes (use `--site-text-soft` instead) |
| **Azure** `#0EA5E9` | Secondary buttons, links, hover states, info badges | Replacing navy in headings or primary CTAs |
| **Driftwood** `#B89968` | Warm grounding accent, neutral decorative borders, section dividers | State communication (stock, visibility, condition) |
| **Coral** `#F97766` | Attention only: featured, new, sale, just-arrived | Body text, decorative use, paired with azure on same screen |
| **Cream** `#F8F5F0` | Primary background | Foreground text or fills |

### Rules

- Do use navy for primary text, primary CTAs, and headings.
- Do use azure for secondary buttons, links, and hover states.
- Do use driftwood for warm neutral accents and decorative borders.
- Do use coral for attention callouts only (featured, new, sale, just-arrived).
- Do use semantic colors (red, amber, green) only for state: out of stock, low stock, in stock.
- **Do not** use coral as body text or paragraph copy.
- **Do not** use semantic colors decoratively (e.g., a green badge to mean "popular").
- **Do not** put more than two accents on the same screen. Navy + one accent works. Navy + azure + driftwood + coral on the same screen is too much.
- **Do not** use color as the sole indicator of state. Always pair with text, icon, or pattern.

### Maximum accent budget per screen

```
Navy (always)  +  one of [azure | driftwood | coral]
```

---

## Typography rules

| Token | Font | Use |
|-------|------|-----|
| `--font-display` | Source Serif 4 | H1, H2, H3 headings and editorial body copy. Sets the editorial character of the page. |
| `--font-body` | Inter | UI labels, form inputs, button text, dense data tables, navigation. Optimized for readability at small sizes. |
| `font-mono` | System monospace | Part numbers, SKUs, CSS variable references, code blocks. Never for prose. |

Never mix serifs and sans-serifs at the same hierarchy level. A Source Serif 4 H2 followed by an Inter paragraph is correct. Two competing font families in the same heading is not.

---

## Component selection guide

| Component | Use for | Not for |
|-----------|---------|---------|
| `<Button>` | Primary actions only: save, submit, confirm. | Navigation. For navigation, use a Link. |
| `<Badge>` | Status display: condition, visibility, stock state. | Selectable filters. For filters, use chip-style buttons with `aria-pressed`. |
| `<Card>` | Bounded content groups that carry their own context (product detail blocks, stat groups). Cards are flat: `border border-site-border rounded-xl`, no background fill. Use `<Card>`, do not hand-roll card divs. | Every section on a page. Cards add visual weight; use sparingly. |
| `<EmptyState>` | Any list or table with zero items. | Loading states. Use a skeleton or spinner for in-progress fetches. |

---

## Accessibility commitments

Enforced by the a11y-reviewer subagent on every commit.

1. WCAG 2.2 Level AA on every shipped commit.
2. Every form input has an associated label: visible `<label htmlFor>` or `aria-label`. (WCAG 1.3.1)
3. Every icon-only button has an `aria-label`. (WCAG 4.1.2)
4. Every interactive element is keyboard-accessible with Enter, Space, and Escape where applicable. (WCAG 2.1.1)
5. Body text contrast at least 4.5:1 against its background. Large text (18pt+ or 14pt+ bold) at least 3:1. (WCAG 1.4.3)
6. Visible focus indicators on all interactive elements. No `outline: none` without a ring replacement. (WCAG 2.4.7)
7. No positive `tabIndex` values anywhere in the component tree. (WCAG 2.4.3)
8. Color is never the sole indicator of state. Always pair with text, icon, or pattern. (WCAG 1.4.1)

### Contrast reference -- new palette

| Pair | Ratio | Pass? |
|------|-------|-------|
| Navy `#0F3A57` on cream `#F8F5F0` | ~9.4:1 | AA + AAA |
| Navy `#0F3A57` on white `#FFFFFF` | ~10.1:1 | AA + AAA |
| Navy `#0F3A57` on azure-light `#E0F2FE` | ~7.1:1 | AA + AAA |
| Muted `#6B6B6B` on cream `#F8F5F0` | ~4.7:1 | AA |
| Azure `#0EA5E9` on white `#FFFFFF` | ~2.9:1 | Large text / UI only |
| **Coral `#F97766` as text** | **fails 4.5:1** | **Do not use as text** |

Azure and coral **must not** be used as foreground text color on light backgrounds. They are for UI accents (borders, fills, icons) only.

---

## Do's and don'ts

### Color use

**Do:** Semantic use paired with text label.
> Red badge + "Out of stock" label. Color confirms the label; neither is the sole indicator.

**Don't:** Decorative semantic color.
> Red "Best seller" badge. Misleads users about urgency; semantic colors are reserved for state.

**Don't:** Coral as paragraph or body text.
> Coral fails the 4.5:1 contrast requirement on light backgrounds. Use navy or `--site-text-soft` for body copy.

### Spacing

**Do:** Consistent padding from the card primitive (`p-6`).

**Don't:** Ad-hoc inline padding values (`pt-3 pb-7 pl-4 pr-10`). Inconsistent across components.

### Page gutters

Admin pages inherit their horizontal and vertical gutter from the protected layout (`apps/esskay/src/app/admin/(protected)/layout.tsx`). The `<main>` element is the single source of page spacing.

**Do:** Let the layout supply the gutter. Page components start with `<div>` or `<section>`, no padding.

**Don't:** Add `px-*` or `py-*` to the outermost wrapper of an admin page. It creates inconsistent spacing when the layout gutter changes.

### Typography

**Do:** `font-display` heading followed by `font-body` paragraph. Clear typographic hierarchy.

**Don't:** Fonts swapped -- sans-serif heading, serif body. Hierarchy collapses; both levels compete.

---

## Enforcement

These rules are enforced programmatically by two reviewer subagents running on every commit:

- **a11y-reviewer** -- checks WCAG 2.2 AA criteria per-criterion with explicit pass/warn/fail output. See `.claude/agents/a11y-reviewer.md`.
- **reviewer** -- checks UX conventions, schema patterns, and privacy (no hardcoded hex, no "AI" in user-facing strings, no em dashes in JSX text content). See `.claude/agents/reviewer.md`.

---

## Motion

Motion communicates state change. It does not decorate.

### Affordance rule

Interactive elements signal interactivity through a **hover color shift**: a change in background color, border color, or text color. No element lifts, scales, or translates on hover. The visual affordance is color, not position.

### Current behavior by component

| Component | Hover | Focus | Active / selected |
|-----------|-------|-------|-------------------|
| `Button` primary | Background lightens: `bg-site-accent-dark` to `bg-site-accent` | n/a (pointer-only) | -- |
| `Button` secondary | Background tints: to `bg-site-accent-light` | n/a | -- |
| `Button` ghost | Underline appears | n/a | -- |
| AdminNav link | Text and bg tint: `text-site-accent-dark bg-site-accent-dark/8` | `ring-2 ring-site-accent-navy` | Same as hover |
| Filter/sort dropdown trigger | Border and bg tint: `border-site-accent-azure-dark bg-site-accent-azure-light/40` | -- | `border-site-accent-navy bg-site-accent-azure-light/40 text-site-accent-navy` |
| Search input | -- | `ring-2 ring-site-accent-navy` | -- |

All components use `transition-colors`. The motion tokens (`--site-duration-fast`, `--site-duration-base`, `--site-ease`) are defined in `globals.css` and applied in new component work; existing components will be migrated in a dedicated motion pass.

### Rules

- **Color shift, not lift.** Hover must not translate, scale, or shadow an element. Color change only.
- **Focus ring always.** No `outline: none` or `outline-hidden` without a `focus-visible:ring-2` replacement. Ring color is `site-accent-navy` for admin controls.
- **Token-driven timing.** New component work references `--site-duration-fast` (hover and small single-property transitions) or `--site-duration-base` (larger or multi-property transitions). No ad-hoc `ms` values in component files.
- **Prefers-reduced-motion.** The `globals.css` block collapses all durations to `0.01ms` automatically. Components do not need their own `prefers-reduced-motion` guards.

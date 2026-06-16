# Ess-Kay Yards Design System

Theme and style guide. Same system, two purposes.

**Contents:** [THEME.md](THEME.md) &middot; [STYLE_GUIDE.md](STYLE_GUIDE.md)

---

## The distinction

### Theme &middot; the configuration

The theme defines what visual values exist. CSS variables, color palettes, font scales, spacing tokens. Machine-readable. Swap the theme and the UI changes appearance without changing structure.

See [THEME.md](THEME.md) for all token values, type scale, spacing, and usage examples.

### Style guide &middot; the guidance

The style guide defines how to apply those values. Voice and tone, when to use which color, do's and don'ts, accessibility commitments. Human-readable. Survives any theme change because it governs intent, not implementation.

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for color rules, typography rules, component selection, and accessibility commitments.

---

## Why both matter

Themes without style guides produce inconsistent application of tokens. Style guides without themes produce unenforceable rules. Together they form a complete design system.

---

## Architecture note

This system spans two apps (Ess-Kay Yards and Galaxy SF) and is enforced by an a11y-reviewer subagent (WCAG 2.2 AA) and a reviewer subagent (project conventions) running on every commit. Both subagent definitions live in `.claude/agents/`.

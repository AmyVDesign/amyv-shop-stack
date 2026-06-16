# Theme

The configuration. CSS variables, color values, font scales.

**Related:** [README.md](README.md) &middot; [STYLE_GUIDE.md](STYLE_GUIDE.md)

---

## Typography

| Token | Value | Use |
|-------|-------|-----|
| `--font-display` | Source Serif 4 | H1, H2, H3 headings and editorial body copy |
| `--font-body` | Inter | UI labels, form inputs, button text, data tables, navigation |
| `font-mono` | System monospace | Part numbers, SKUs, CSS variable references, code blocks |

---

## Type scale

| Level | Size | Tailwind | Weight | Font |
|-------|------|----------|--------|------|
| H1 | 48px / 3rem | `text-5xl` | 600 | `font-display` |
| H2 | 30px / 1.875rem | `text-3xl` | 600 | `font-display` |
| H3 | 24px / 1.5rem | `text-2xl` | 600 | `font-display` |
| Body | 16px / 1rem | `text-base` | 400 | `font-body` |
| Small | 14px / 0.875rem | `text-sm` | 400 | `font-body` |

---

## Color tokens -- Ess-Kay Yards

Coastal-modern palette: cream, navy, azure, driftwood, coral.

### Core surfaces

| Label | Hex | CSS variable | Name |
|-------|-----|-------------|------|
| Background | `#F8F5F0` | `--site-bg` | Cream |
| Alt background | `#FDFCFA` | `--site-bg-alt` | Soft white |
| Border | `#E8E3D8` | `--site-border` | Warm sand |
| Text | `#0F3A57` | `--site-text` | Navy |
| Text soft | `#1A1A1A` | `--site-text-soft` | Near-black body |
| Muted | `#6B6B6B` | `--site-muted` | Muted gray |

### Brand accents

| Family | Base | Dark | Light | CSS variables |
|--------|------|------|-------|---------------|
| Navy | `#0F3A57` | `#0A2A40` | `#C9D6E0` | `--site-accent-navy` / `-dark` / `-light` |
| Azure | `#0EA5E9` | `#0284C7` | `#E0F2FE` | `--site-accent-azure` / `-dark` / `-light` |
| Driftwood | `#B89968` | `#8F7649` | `#F3EBDD` | `--site-accent-driftwood` / `-dark` / `-light` |
| Coral | `#F97766` | `#E5564A` | `#FFE4E0` | `--site-accent-coral` / `-dark` / `-light` |

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for when to use each accent.

---

## Color tokens -- Galaxy SF

Dark palette with neon green. Same token architecture, different values.

| Label | Hex | CSS variable | Name |
|-------|-----|-------------|------|
| Background | `#0a0a0f` | `--site-bg` | Deep black |
| Alt background | `#14141c` | `--site-bg-alt` | Dark card |
| Border | `#2a2a35` | `--site-border` | Dark border |
| Text | `#ffffff` | `--site-text` | White |
| Muted | `#9090a0` | `--site-muted` | Muted gray |
| Accent | `#39ff14` | `--site-accent` | Neon green |
| Accent dark | `#1f8a0a` | `--site-accent-dark` | Dark green |
| Accent light | `#c8ffb8` | `--site-accent-light` | Light green |

---

## Page layout

Admin content is centered and width-capped by the protected layout. The `<main>` element in `apps/esskay/src/app/admin/(protected)/layout.tsx` sets:

```
mx-auto w-full max-w-7xl px-8 py-8
```

`max-w-7xl` (80rem / 1280px) is the width dial -- change it in one place and every admin screen inherits the change. `px-8` is the horizontal gutter. Pages must set neither their own `max-w-*` nor their own `px-*`/`py-*` on the outermost wrapper.

---

## Spacing scale

| Name | Value | Tailwind |
|------|-------|---------|
| xs | 4px | `w-1` |
| sm | 8px | `w-2` |
| md | 16px | `w-4` |
| lg | 24px | `w-6` |
| xl | 32px | `w-8` |
| 2xl | 48px | `w-12` |
| 3xl | 64px | `w-16` |

---

## Border radius scale

| Name | px | Tailwind |
|------|----|----------|
| sm | 4 | `rounded-sm` |
| base | 6 | `rounded` |
| md | 8 | `rounded-md` |
| lg | 12 | `rounded-lg` |
| xl | 16 | `rounded-xl` (`--site-radius`) |
| 2xl | 20 | `rounded-2xl` (`--site-card-radius`) |
| full | -- | `rounded-full` |

Design-system tokens `--site-radius` (16px) and `--site-card-radius` (20px) map to `rounded-xl` and `rounded-2xl` respectively. Prefer the token over the raw Tailwind class in component style attributes.

---

## Typographic rhythm tokens

| Token | Value | Use |
|-------|-------|-----|
| `--site-heading-letter-spacing` | `0.04em` | All heading elements |
| `--label-tracking` | `0.12em` | Uppercase labels, small caps |
| `--site-body-size` | `16px` | Base font size |
| `--site-h2-size` | `clamp(24px, 2.8vw, 32px)` | Fluid H2 |

---

## Motion tokens

| Token | Value | Use |
|-------|-------|-----|
| `--site-duration-fast` | `120ms` | Hover, focus, and small single-property state transitions |
| `--site-duration-base` | `200ms` | Larger or multi-property transitions |
| `--site-ease` | `cubic-bezier(0.2, 0, 0, 1)` | Shared easing curve for all transitions |

A `prefers-reduced-motion: reduce` block in `globals.css` collapses every animation and transition duration to `0.01ms` and sets `scroll-behavior: auto`. Motion degrades to instant without removing the visual state change itself.

Reference the tokens in component styles rather than ad-hoc millisecond values:

```css
/* CSS property */
transition: background-color var(--site-duration-fast) var(--site-ease);
```

```tsx
{/* Tailwind arbitrary value */}
className="transition-colors [transition-duration:var(--site-duration-fast)] [transition-timing-function:var(--site-ease)]"
```

---

## How to consume

Reference CSS variables directly in component styles. Tailwind utilities are mapped to these variables via the `@theme inline` block in `globals.css`.

```css
/* CSS custom properties: direct usage */
color:            var(--site-text);
background:       var(--site-bg);
border-color:     var(--site-border);
font-family:      var(--font-display);
```

```tsx
/* Tailwind utility classes: preferred in components */
className="text-site-text bg-site-bg border-site-border font-display"

/* Every styling decision routes through these variables.
   No hardcoded hex values outside the design-system package. */
```

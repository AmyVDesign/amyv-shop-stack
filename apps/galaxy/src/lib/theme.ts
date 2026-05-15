/**
 * Site design tokens — single source of truth.
 *
 * These are placeholder values. When the real brand palette is
 * finalized, update the values here AND the matching --site-*
 * custom properties in src/app/globals.css. The two files must
 * stay in sync: globals.css drives runtime CSS; this file drives
 * anywhere you need the values in JS/TS (e.g. canvas, SVG, Framer).
 *
 * ── How to use in Tailwind classes ──────────────────────────────
 *  bg-site-bg          → var(--site-bg)
 *  text-site-accent    → var(--site-accent)
 *  border-site-border  → var(--site-border)
 *  text-site-muted     → var(--site-muted)
 *  (etc. — all --color-site-* tokens are mapped in @theme inline)
 *
 * ── How to use in JS/TS ─────────────────────────────────────────
 *  import { COLORS } from "@/lib/theme";
 *  style={{ background: COLORS.bg }}
 *
 * ── Where to update when real palette lands ──────────────────────
 *  1. COLORS values below
 *  2. :root block in src/app/globals.css (--site-* vars)
 */

import type { Theme } from "@amyv/design-system";

export const COLORS = {
  bg:           "#0a0a0f", // page background
  bgAlt:        "#14141c", // cards, sidebars, elevated surfaces
  border:       "#2a2a35", // default border / divider
  text:         "#ffffff", // primary text
  muted:        "#9090a0", // secondary / placeholder text
  accent:       "#39ff14", // neon green — primary brand accent
  accentDark:   "#1f8a0a", // darker accent for hover states / filled buttons
  accentLight:  "#c8ffb8", // lighter accent for tints / backgrounds
} as const;

export const FONTS = {
  heading: "system-ui, sans-serif", // TODO: replace with brand display font
  body:    "system-ui, sans-serif", // TODO: replace with brand body font
  label:   "system-ui, sans-serif", // TODO: replace with brand mono/label font
} as const;

export const SPACING = {
  pagePx:   "1rem",   // horizontal page padding (px-4)
  pageMax:  "72rem",  // max content width (max-w-6xl)
  sectionY: "6rem",   // vertical section padding (py-24)
  cardPad:  "2rem",   // inner card padding (p-8)
} as const;

export const RADIUS = {
  sm:   "0.25rem", // rounded-sm
  md:   "0.5rem",  // rounded-md
  lg:   "1rem",    // rounded-lg
  full: "9999px",  // rounded-full
} as const;

export const theme: Theme = {
  colors:  COLORS,
  fonts:   FONTS,
  spacing: SPACING,
  radius:  RADIUS,
};

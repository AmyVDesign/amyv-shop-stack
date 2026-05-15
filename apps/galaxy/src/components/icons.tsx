/**
 * Stroke-based icon library for The Galaxy SF.
 *
 * Conventions:
 *  - viewBox: 0 0 20 20
 *  - Default size: 20px
 *  - Default color: currentColor (inherits from CSS)
 *  - Stroke icons: fill="none", strokeWidth=2, round caps + joins
 *  - Brand mark exceptions (Instagram, Spotify): may use fill
 *    where the mark requires it; still accept the same IconProps.
 */

export interface IconProps {
  size?: number;
  color?: string;
}

const defaults = { size: 20, color: "currentColor" } satisfies Required<IconProps>;

// Shared stroke attrs applied to every stroke icon's <svg>
function strokeAttrs(size: number, color: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

// ── Directional ──────────────────────────────────────────────────

export function IconArrow({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="3" y1="10" x2="17" y2="10" />
      <polyline points="11,4 17,10 11,16" />
    </svg>
  );
}

export function IconArrowLeft({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="17" y1="10" x2="3" y2="10" />
      <polyline points="9,4 3,10 9,16" />
    </svg>
  );
}

// ── UI controls ──────────────────────────────────────────────────

export function IconClose({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="4" y1="4" x2="16" y2="16" />
      <line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  );
}

export function IconCheck({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <polyline points="3,10 8,15 17,5" />
    </svg>
  );
}

export function IconPlus({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="3" y1="10" x2="17" y2="10" />
    </svg>
  );
}

export function IconMenu({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="3" y1="6"  x2="17" y2="6"  />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="14" x2="17" y2="14" />
    </svg>
  );
}

// ── Commerce ─────────────────────────────────────────────────────

export function IconShoppingBag({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      {/* handle */}
      <path d="M7 8V6a3 3 0 0 1 6 0v2" />
      {/* body */}
      <rect x="3" y="8" width="14" height="10" rx="1" />
    </svg>
  );
}

export function IconMail({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <rect x="2" y="4" width="16" height="13" rx="2" />
      <path d="M2 7l8 6 8-6" />
    </svg>
  );
}

// ── Brand marks (filled exceptions) ──────────────────────────────

export function IconInstagram({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* outer rounded square */}
      <rect x="2" y="2" width="16" height="16" rx="5" />
      {/* lens circle */}
      <circle cx="10" cy="10" r="3.25" />
      {/* viewfinder dot — filled brand mark exception */}
      <circle cx="14.5" cy="5.5" r="0.75" fill={color} stroke="none" />
    </svg>
  );
}

export function IconSpotify({ size = defaults.size, color = defaults.color }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden
    >
      {/* outer circle */}
      <circle cx="10" cy="10" r="8" />
      {/* three signal arcs */}
      <path d="M6 8c2.2-1.2 5.8-1.2 8 0" />
      <path d="M6.8 11c1.8-1 4.6-1 6.4 0" />
      <path d="M7.7 14c1.3-.7 3.3-.7 4.6 0" />
    </svg>
  );
}

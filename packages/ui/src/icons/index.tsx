export type { IconProps } from "./types";
export { strokeAttrs } from "./types";
import { iconDefaults, strokeAttrs } from "./types";
import type { IconProps } from "./types";

// ── Directional ──────────────────────────────────────────────────

export function IconArrow({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="3" y1="10" x2="17" y2="10" />
      <polyline points="11,4 17,10 11,16" />
    </svg>
  );
}

export function IconArrowLeft({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="17" y1="10" x2="3" y2="10" />
      <polyline points="9,4 3,10 9,16" />
    </svg>
  );
}

// ── UI controls ──────────────────────────────────────────────────

export function IconClose({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="4" y1="4" x2="16" y2="16" />
      <line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  );
}

export function IconCheck({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <polyline points="3,10 8,15 17,5" />
    </svg>
  );
}

export function IconPlus({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="3" y1="10" x2="17" y2="10" />
    </svg>
  );
}

export function IconMenu({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <line x1="3" y1="6"  x2="17" y2="6"  />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="14" x2="17" y2="14" />
    </svg>
  );
}

// ── Commerce ─────────────────────────────────────────────────────

export function IconShoppingBag({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <path d="M7 8V6a3 3 0 0 1 6 0v2" />
      <rect x="3" y="8" width="14" height="10" rx="1" />
    </svg>
  );
}

export function IconMail({ size = iconDefaults.size, color = iconDefaults.color }: IconProps) {
  return (
    <svg {...strokeAttrs(size, color)} aria-hidden>
      <rect x="2" y="4" width="16" height="13" rx="2" />
      <path d="M2 7l8 6 8-6" />
    </svg>
  );
}

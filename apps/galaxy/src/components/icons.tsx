/**
 * Galaxy SF brand icons.
 * Generic icons (Menu, Close, Arrow, etc.) live in @amyv/ui.
 */

import type { IconProps } from "@amyv/ui";

export function IconInstagram({ size = 20, color = "currentColor" }: IconProps) {
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

export function IconSpotify({ size = 20, color = "currentColor" }: IconProps) {
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

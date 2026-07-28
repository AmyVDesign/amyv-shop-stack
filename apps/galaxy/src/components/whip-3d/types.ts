import type { Length } from "@/components/TotemSVG";

export type { Length };

/**
 * Not re-exported from TotemSVG: that component's Pattern
 * ("solid" | "rainbow" | "gradient") is an SVG-fill vocabulary, while the
 * 3D whip drives per-LED animation and needs a distinct set of states.
 */
export type Pattern = "rainbow" | "comet" | "pulse" | "galaxy" | "solid" | "off";

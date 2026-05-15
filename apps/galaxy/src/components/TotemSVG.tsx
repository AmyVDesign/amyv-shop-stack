/**
 * PLACEHOLDER ILLUSTRATION
 *
 * This SVG represents the totem product for the configurator.
 * Phase 2 should replace it with either:
 *   (a) real product photography (next/image with transparent bg), or
 *   (b) a 3D model viewer — e.g. <model-viewer> web component (Google)
 *       or a Three.js / React Three Fiber canvas for full interaction.
 *
 * The LED strip layer (group #led-layer) and its props are the
 * interface that a future 3D replacement should respect.
 */

export type Pattern = "solid" | "rainbow" | "gradient";
export type Length = "24in" | "36in" | "48in";

export interface TotemSVGProps {
  pattern: Pattern;
  color: string;   // hex — ignored when pattern === "rainbow"
  length: Length;
}

// Rendered SVG viewBox heights per length option
const VIEW_H: Record<Length, number> = {
  "24in": 280,
  "36in": 390,
  "48in": 500,
};

// Fixed layout constants (viewBox width = 120)
const W       = 120;
const CX      = W / 2;   // 60 — horizontal center
const CYL_X   = 19;      // cylinder left edge
const CYL_W   = 82;      // cylinder width
const CYL_RX  = 12;      // cylinder corner radius
const LED_X   = 50;      // LED strip left edge
const LED_W   = 20;      // LED strip width
const LED_RX  = 4;       // LED strip corner radius
const ELL_RY  = 8;       // ellipse y-radius for cylinder caps
const MARGINS = { top: 22, bot: 24 } as const;

export default function TotemSVG({ pattern, color, length }: TotemSVGProps) {
  const svgH = VIEW_H[length];

  // Derived cylinder geometry
  const cylTop = MARGINS.top;
  const cylBot = svgH - MARGINS.bot;
  const cylH   = cylBot - cylTop;

  // LED strip (inset 10px from cylinder ends)
  const ledTop = cylTop + 10;
  const ledH   = cylH - 20;

  // Fill source for the LED rect
  const ledFill =
    pattern === "solid"    ? color :
    pattern === "rainbow"  ? "url(#rainbow-fill)" :
    /* gradient */           "url(#gradient-fill)";

  // Color for the glow bloom (rainbow → neutral white)
  const glowColor = pattern === "rainbow" ? "#ffffff" : color;

  return (
    <svg
      viewBox={`0 0 ${W} ${svgH}`}
      style={{ height: "min(68vh, 520px)", width: "auto", display: "block" }}
      aria-label={`LED totem — ${pattern} pattern, ${length}`}
      role="img"
      overflow="visible"
    >
      <defs>
        {/* ── Glow bloom filter ─────────────────────────────────── */}
        {/* Outer diffuse glow */}
        <filter id="glow-outer" x="-200%" y="-5%" width="500%" height="110%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={11} />
        </filter>
        {/* Inner tight glow */}
        <filter id="glow-inner" x="-100%" y="-3%" width="300%" height="106%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={5} />
        </filter>

        {/* ── Cylinder glass highlight (horizontal) ─────────────── */}
        <linearGradient id="cyl-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"    stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="10%"   stopColor="#ffffff" stopOpacity={0.03} />
          <stop offset="72%"   stopColor="#ffffff" stopOpacity={0.00} />
          <stop offset="88%"   stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="100%"  stopColor="#ffffff" stopOpacity={0.14} />
        </linearGradient>

        {/* ── Top cap sheen (radial) ─────────────────────────────── */}
        <radialGradient id="cap-sheen" cx="35%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.30} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.00} />
        </radialGradient>

        {/* ── Rainbow gradient (vertical spectrum) ──────────────── */}
        <linearGradient id="rainbow-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"    stopColor="#ff0000" />
          <stop offset="14.3%" stopColor="#ff8800" />
          <stop offset="28.6%" stopColor="#ffff00" />
          <stop offset="42.9%" stopColor="#00ff44" />
          <stop offset="57.1%" stopColor="#00ffff" />
          <stop offset="71.4%" stopColor="#0055ff" />
          <stop offset="85.7%" stopColor="#9900ff" />
          <stop offset="100%"  stopColor="#ff0000" />
        </linearGradient>

        {/* ── Gradient pattern (selected color, top bright → dim) ─ */}
        <linearGradient id="gradient-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={1}    />
          <stop offset="60%"  stopColor={color} stopOpacity={0.65} />
          <stop offset="100%" stopColor={color} stopOpacity={0.08} />
        </linearGradient>
      </defs>

      {/* ── LAYER 1: Outer diffuse glow bloom ─────────────────────── */}
      <rect
        id="led-layer"
        x={LED_X - 18} y={ledTop - 8}
        width={LED_W + 36} height={ledH + 16}
        rx={10}
        fill={glowColor}
        opacity={0.28}
        filter="url(#glow-outer)"
      />

      {/* ── LAYER 2: Cylinder body (semi-transparent dark tube) ─────── */}
      <rect
        x={CYL_X} y={cylTop}
        width={CYL_W} height={cylH}
        rx={CYL_RX}
        fill="rgba(6, 6, 18, 0.72)"
      />

      {/* ── LAYER 3: Inner tight glow (sits inside cylinder) ─────────── */}
      <rect
        x={LED_X - 10} y={ledTop - 4}
        width={LED_W + 20} height={ledH + 8}
        rx={8}
        fill={glowColor}
        opacity={0.50}
        filter="url(#glow-inner)"
      />

      {/* ── LAYER 4: LED strip (sharp, colored) ──────────────────────── */}
      <rect
        x={LED_X} y={ledTop}
        width={LED_W} height={ledH}
        rx={LED_RX}
        fill={ledFill}
      />

      {/* ── LAYER 5: Cylinder glass highlight overlay ─────────────────── */}
      <rect
        x={CYL_X} y={cylTop}
        width={CYL_W} height={cylH}
        rx={CYL_RX}
        fill="url(#cyl-glass)"
      />

      {/* ── LAYER 6: Cylinder border stroke ──────────────────────────── */}
      <rect
        x={CYL_X} y={cylTop}
        width={CYL_W} height={cylH}
        rx={CYL_RX}
        fill="none"
        stroke="rgba(180, 200, 255, 0.20)"
        strokeWidth={1.5}
      />

      {/* ── LAYER 7: Bottom cap (closes the tube) ────────────────────── */}
      <ellipse
        cx={CX} cy={cylBot}
        rx={CYL_W / 2} ry={ELL_RY}
        fill="rgba(4, 4, 12, 0.92)"
        stroke="rgba(160, 180, 230, 0.18)"
        strokeWidth={1}
      />

      {/* ── LAYER 8: Top cap ──────────────────────────────────────────── */}
      <ellipse
        cx={CX} cy={cylTop}
        rx={CYL_W / 2} ry={ELL_RY}
        fill="rgba(22, 22, 46, 0.75)"
        stroke="rgba(180, 200, 255, 0.25)"
        strokeWidth={1}
      />

      {/* ── LAYER 9: Top cap sheen (reflection highlight) ────────────── */}
      <ellipse
        cx={CX} cy={cylTop}
        rx={CYL_W / 2} ry={ELL_RY}
        fill="url(#cap-sheen)"
      />

      {/* ── LAYER 10: Left edge vertical highlight line ───────────────── */}
      <line
        x1={CYL_X + 5} y1={cylTop + 14}
        x2={CYL_X + 5} y2={cylBot - 14}
        stroke="white"
        strokeOpacity={0.10}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

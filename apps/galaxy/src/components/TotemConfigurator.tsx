import type { Pattern, Length } from "@/components/TotemSVG";

// ── Option definitions ────────────────────────────────────────────

const PATTERNS: { value: Pattern; label: string }[] = [
  { value: "solid",    label: "Solid"    },
  { value: "rainbow",  label: "Rainbow"  },
  { value: "gradient", label: "Gradient" },
];

const SWATCHES = [
  { hex: "#39FF14", name: "Neon Green"    },
  { hex: "#FF10F0", name: "Hot Pink"      },
  { hex: "#00FFFF", name: "Electric Blue" },
  { hex: "#9D3CFF", name: "Purple"        },
  { hex: "#FF073A", name: "Red"           },
  { hex: "#FF8C00", name: "Orange"        },
  { hex: "#FFFF00", name: "Yellow"        },
  { hex: "#FFFFFF", name: "White"         },
] as const;

const LENGTHS: { value: Length; label: string }[] = [
  { value: "24in", label: '24"' },
  { value: "36in", label: '36"' },
  { value: "48in", label: '48"' },
];

// ── Component ─────────────────────────────────────────────────────

interface ConfiguratorProps {
  pattern: Pattern;
  color: string;
  length: Length;
  onPatternChange: (p: Pattern) => void;
  onColorChange:  (c: string)  => void;
  onLengthChange: (l: Length)  => void;
}

/** Shared styling for toggle-style option buttons. */
function toggleClass(active: boolean) {
  return [
    "px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
    active
      ? "bg-site-accent text-black"
      : "border border-site-border text-site-muted hover:border-site-muted hover:text-site-text",
  ].join(" ");
}

export default function TotemConfigurator({
  pattern,
  color,
  length,
  onPatternChange,
  onColorChange,
  onLengthChange,
}: ConfiguratorProps) {
  const colorName =
    SWATCHES.find((s) => s.hex.toUpperCase() === color.toUpperCase())?.name ??
    "Custom";

  const patternLabel =
    pattern.charAt(0).toUpperCase() + pattern.slice(1);

  return (
    <div className="flex flex-col gap-8">

      {/* ── Pattern ───────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-3 text-[10px] uppercase tracking-[0.4em] text-site-muted">
          Pattern
        </legend>
        <div className="flex gap-2">
          {PATTERNS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onPatternChange(value)}
              aria-pressed={pattern === value}
              className={toggleClass(pattern === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── Color (hidden when Rainbow) ───────────────────────────── */}
      {pattern !== "rainbow" && (
        <fieldset>
          <legend className="mb-3 text-[10px] uppercase tracking-[0.4em] text-site-muted">
            Color
          </legend>
          <div className="flex flex-wrap gap-3">
            {SWATCHES.map(({ hex, name }) => {
              const isSelected =
                hex.toUpperCase() === color.toUpperCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onColorChange(hex)}
                  aria-label={name}
                  aria-pressed={isSelected}
                  title={name}
                  className="relative h-8 w-8 rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent"
                  style={{ backgroundColor: hex }}
                >
                  {isSelected && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 ring-offset-site-bg"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* ── Length ────────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-3 text-[10px] uppercase tracking-[0.4em] text-site-muted">
          Length
        </legend>
        <div className="flex gap-2">
          {LENGTHS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onLengthChange(value)}
              aria-pressed={length === value}
              className={toggleClass(length === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* ── Add to cart ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full bg-site-accent py-4 text-sm font-bold uppercase tracking-widest text-black transition-opacity hover:opacity-85 active:opacity-70"
        >
          Add to Cart
        </button>

        {/* Configuration summary */}
        <p className="text-xs text-site-muted">
          <span className="text-site-text/60">Pattern:</span>{" "}
          {patternLabel}
          {pattern !== "rainbow" && (
            <>
              {" · "}
              <span className="text-site-text/60">Color:</span>{" "}
              {colorName}
            </>
          )}
          {" · "}
          <span className="text-site-text/60">Length:</span>{" "}
          {length}
        </p>
      </div>

    </div>
  );
}

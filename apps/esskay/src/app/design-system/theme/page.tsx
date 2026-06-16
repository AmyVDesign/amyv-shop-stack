import Link from 'next/link'

export const metadata = {
  title: 'Theme — Ess-Kay Yards Design System',
}

// Esskay color tokens — hex is the content here, not a styling decision
const ESSKAY_TOKENS = [
  { label: 'Background',      hex: '#f8f5f0', cssVar: '--site-bg',           name: 'Cream'         },
  { label: 'Alt background',  hex: '#ffffff', cssVar: '--site-bg-alt',       name: 'White'         },
  { label: 'Border',          hex: '#d4c9b8', cssVar: '--site-border',       name: 'Warm border'   },
  { label: 'Text',            hex: '#1a1a1a', cssVar: '--site-text',         name: 'Near-black'    },
  { label: 'Muted',           hex: '#6b6b6b', cssVar: '--site-muted',        name: 'Muted gray'    },
  { label: 'Accent',          hex: '#1e5f8e', cssVar: '--site-accent',       name: 'Nautical blue' },
  { label: 'Accent dark',     hex: '#0f3a57', cssVar: '--site-accent-dark',  name: 'Navy'          },
  { label: 'Accent light',    hex: '#b8d4e8', cssVar: '--site-accent-light', name: 'Sky blue'      },
]

const GALAXY_TOKENS = [
  { label: 'Background',      hex: '#0a0a0f', cssVar: '--site-bg',           name: 'Deep black',  dark: true  },
  { label: 'Alt background',  hex: '#14141c', cssVar: '--site-bg-alt',       name: 'Dark card',   dark: true  },
  { label: 'Border',          hex: '#2a2a35', cssVar: '--site-border',       name: 'Dark border', dark: true  },
  { label: 'Text',            hex: '#ffffff', cssVar: '--site-text',         name: 'White',       dark: false },
  { label: 'Muted',           hex: '#9090a0', cssVar: '--site-muted',        name: 'Muted gray',  dark: false },
  { label: 'Accent',          hex: '#39ff14', cssVar: '--site-accent',       name: 'Neon green',  dark: false },
  { label: 'Accent dark',     hex: '#1f8a0a', cssVar: '--site-accent-dark',  name: 'Dark green',  dark: true  },
  { label: 'Accent light',    hex: '#c8ffb8', cssVar: '--site-accent-light', name: 'Light green', dark: false },
]

const TYPE_SCALE = [
  { level: 'H1', size: '48px / 3rem',  tailwind: 'text-5xl',  weight: '600', font: 'font-display' },
  { level: 'H2', size: '30px / 1.875rem', tailwind: 'text-3xl', weight: '600', font: 'font-display' },
  { level: 'H3', size: '24px / 1.5rem', tailwind: 'text-2xl', weight: '600', font: 'font-display' },
  { level: 'Body', size: '16px / 1rem', tailwind: 'text-base', weight: '400', font: 'font-body'    },
  { level: 'Small', size: '14px / 0.875rem', tailwind: 'text-sm', weight: '400', font: 'font-body' },
]

const SPACING = [
  { name: 'xs',  px: 4,  tw: 'w-1',   value: '4px'  },
  { name: 'sm',  px: 8,  tw: 'w-2',   value: '8px'  },
  { name: 'md',  px: 16, tw: 'w-4',   value: '16px' },
  { name: 'lg',  px: 24, tw: 'w-6',   value: '24px' },
  { name: 'xl',  px: 32, tw: 'w-8',   value: '32px' },
  { name: '2xl', px: 48, tw: 'w-12',  value: '48px' },
  { name: '3xl', px: 64, tw: 'w-16',  value: '64px' },
]

const RADII = [
  { name: 'sm',    px: 4,  tw: 'rounded-sm'  },
  { name: 'base',  px: 6,  tw: 'rounded'     },
  { name: 'md',    px: 8,  tw: 'rounded-md'  },
  { name: 'lg',    px: 12, tw: 'rounded-lg'  },
  { name: 'xl',    px: 16, tw: 'rounded-xl'  },
  { name: '2xl',   px: 20, tw: 'rounded-2xl' },
  { name: 'full',  px: null, tw: 'rounded-full' },
]

function SectionDivider() {
  return <div className="border-t border-site-border my-20 md:my-28" />
}

export default function ThemePage() {
  return (
    <main className="min-h-screen bg-site-bg">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">

        {/* Back nav */}
        <Link
          href="/design-system"
          className="inline-flex items-center text-sm text-site-muted hover:text-site-text mb-12 transition-colors"
        >
          ← Design System
        </Link>

        {/* ── Header ────────────────────────────────────────────── */}
        <header className="mb-20 md:mb-28">
          <p className="font-mono text-xs uppercase tracking-widest text-site-muted mb-3">
            Theme
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-site-text mb-4 leading-tight">
            Ess-Kay Yards
          </h1>
          <p className="text-site-muted">
            The configuration. CSS variables, color values, font scales.
          </p>
        </header>

        {/* ── Typography ────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Typography
          </h2>

          <div className="space-y-8">
            {/* Source Serif 4 */}
            <div className="rounded-lg border border-site-border bg-white p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-site-muted">
                    <code>--font-display</code>
                  </p>
                  <p className="text-sm text-site-muted mt-0.5">Source Serif 4 · Headings &amp; editorial</p>
                </div>
              </div>
              <p className="font-display text-2xl text-site-text leading-snug">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            {/* Inter */}
            <div className="rounded-lg border border-site-border bg-white p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-site-muted">
                    <code>--font-body</code>
                  </p>
                  <p className="text-sm text-site-muted mt-0.5">Inter · UI labels, body copy, data</p>
                </div>
              </div>
              <p className="font-body text-2xl text-site-text">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>

            {/* Mono */}
            <div className="rounded-lg border border-site-border bg-white p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-site-muted">
                    <code>font-mono</code> (system)
                  </p>
                  <p className="text-sm text-site-muted mt-0.5">System monospace · Code, SKUs, part numbers</p>
                </div>
              </div>
              <p className="font-mono text-2xl text-site-text">
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ── Type scale ────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Type scale
          </h2>
          <div className="space-y-4">
            {TYPE_SCALE.map(({ level, size, tailwind, weight, font }) => (
              <div key={level} className="flex items-baseline gap-6 py-3 border-b border-site-border last:border-0">
                <div className="w-16 flex-shrink-0">
                  <p className="font-mono text-xs text-site-muted">{level}</p>
                  <p className="font-mono text-xs text-site-muted/60 mt-0.5">{size}</p>
                </div>
                <p
                  className={`text-site-text ${tailwind} ${font} leading-none`}
                  style={{ fontWeight: weight }}
                >
                  Aa
                </p>
                <code className="ml-auto font-mono text-xs text-site-muted whitespace-nowrap">
                  {tailwind}
                </code>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── Ess-Kay color tokens ──────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-2">
            Color tokens
          </h2>
          <p className="text-site-muted text-sm mb-8">Ess-Kay Yards &mdash; cream and nautical navy.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ESSKAY_TOKENS.map(({ label, hex, cssVar, name }) => (
              <div key={cssVar}>
                {/* Swatch — hex is the content, displayed as a visual token */}
                <div
                  className="w-20 h-20 rounded-lg border border-site-border mb-3"
                  style={{ backgroundColor: hex }}
                  aria-label={`${name} color swatch`}
                />
                <p className="text-xs font-medium text-site-text">{label}</p>
                <p className="font-mono text-xs text-site-muted">{hex}</p>
                <code className="font-mono text-xs text-site-muted/70 block mt-0.5">{cssVar}</code>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── Galaxy SF color tokens ────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-2">
            Color tokens &mdash; Galaxy SF
          </h2>
          <p className="text-site-muted text-sm mb-8">
            Dark palette with neon green.{' '}
            <span className="italic">Same architecture, different tokens.</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {GALAXY_TOKENS.map(({ label, hex, cssVar, name, dark }) => (
                <div key={cssVar}>
                  {/* Swatch — hex is the content, displayed as a visual token */}
                  <div
                    className={`w-20 h-20 rounded-lg mb-3 ${dark ? 'border border-white/20' : 'border border-site-border'}`}
                    style={{ backgroundColor: hex }}
                    aria-label={`${name} color swatch`}
                  />
                  <p className="text-xs font-medium text-site-text">{label}</p>
                  <p className="font-mono text-xs text-site-muted">{hex}</p>
                  <code className="font-mono text-xs text-site-muted/70 block mt-0.5">{cssVar}</code>
                </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── Spacing scale ─────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Spacing scale
          </h2>
          <div className="space-y-3">
            {SPACING.map(({ name, px, tw, value }) => (
              <div key={name} className="flex items-center gap-4">
                <code className="font-mono text-xs text-site-muted w-8 flex-shrink-0">{name}</code>
                <div
                  className="h-5 rounded bg-site-accent-light flex-shrink-0"
                  style={{ width: px }}
                  aria-label={`${value} spacing bar`}
                />
                <code className="font-mono text-xs text-site-muted">{tw}</code>
                <span className="font-mono text-xs text-site-muted/60">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── Border radius scale ───────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Border radius scale
          </h2>
          <div className="flex flex-wrap gap-6">
            {RADII.map(({ name, px, tw }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div
                  className={`w-14 h-14 border-2 border-site-accent bg-site-accent-light/30 ${tw}`}
                  aria-label={`${name} border radius`}
                />
                <code className="font-mono text-xs text-site-muted">{tw}</code>
                {px !== null && (
                  <span className="font-mono text-xs text-site-muted/60">{px}px</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── How to consume ────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-4">
            How to consume
          </h2>
          <p className="text-site-muted text-sm leading-relaxed mb-6 max-w-xl">
            Reference CSS variables directly in component styles. Tailwind utilities
            are mapped to these variables via the <code className="font-mono text-xs">@theme inline</code> block
            in <code className="font-mono text-xs">globals.css</code>.
          </p>
          <pre className="rounded-lg border border-site-border bg-white px-6 py-5 font-mono text-sm text-site-text overflow-x-auto leading-relaxed">
{`/* CSS custom properties: direct usage */
color:            var(--site-text);
background:       var(--site-bg);
border-color:     var(--site-border);
font-family:      var(--font-display);

/* Tailwind utility classes: preferred in components */
className="text-site-text bg-site-bg border-site-border font-display"

/* Every styling decision routes through these variables.
   No hardcoded hex values outside the design-system package. */`}
          </pre>
        </section>

        {/* ── Footer nav ────────────────────────────────────────── */}
        <div className="mt-20 md:mt-28 pt-8 border-t border-site-border flex flex-wrap gap-6">
          <Link href="/design-system" className="text-sm text-site-muted hover:text-site-text transition-colors">
            ← Design System
          </Link>
          <Link href="/design-system/style-guide" className="text-sm text-site-accent-dark hover:underline ml-auto">
            Style guide →
          </Link>
        </div>

      </div>
    </main>
  )
}

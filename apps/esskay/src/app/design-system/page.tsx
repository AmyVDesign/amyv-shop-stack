import Link from 'next/link'
import { IconArrow } from './_icons'

export const metadata = {
  title: 'Design System — Ess-Kay Yards',
}

export default function DesignSystemLanding() {
  return (
    <main className="min-h-screen bg-site-bg">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">

        {/* ── Header ────────────────────────────────────────────── */}
        <header className="mb-20 md:mb-28">
          <h1
            className="font-display text-4xl md:text-5xl font-semibold text-site-text mb-4 leading-tight"
            style={{ letterSpacing: 'var(--site-heading-letter-spacing)' }}
          >
            Ess-Kay Yards<br />Design System
          </h1>
          <p className="text-lg md:text-xl text-site-muted">
            Theme and style guide. Same system, two purposes.
          </p>
        </header>

        {/* ── The distinction ───────────────────────────────────── */}
        <section className="mb-20 md:mb-28">
          <h2
            className="font-display text-2xl font-semibold text-site-text mb-8"
            style={{ letterSpacing: 'var(--site-heading-letter-spacing)' }}
          >
            The distinction
          </h2>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Theme card */}
            <div
              className="rounded-[var(--site-card-radius)] border border-site-border bg-white p-8 flex flex-col"
            >
              <div className="mb-4">
                <span
                  className="font-mono text-xs uppercase text-site-muted"
                  style={{ letterSpacing: 'var(--label-tracking)' }}
                >
                  Theme &middot; the configuration
                </span>
              </div>
              <p className="text-site-muted text-sm leading-relaxed flex-1 mb-8">
                The theme defines what visual values exist. CSS variables, color
                palettes, font scales, spacing tokens. Machine-readable. Swap the
                theme and the UI changes appearance without changing structure.
              </p>
              <Link
                href="/design-system/theme"
                className="inline-flex items-center gap-2 self-start rounded-lg border border-site-text bg-white px-6 py-[11px] text-sm font-semibold text-site-text transition-colors hover:bg-site-bg"
                style={{ letterSpacing: '0.015em' }}
              >
                View the theme
                <IconArrow size={14} />
              </Link>
            </div>

            {/* Style guide card */}
            <div
              className="rounded-[var(--site-card-radius)] border border-site-border bg-white p-8 flex flex-col"
            >
              <div className="mb-4">
                <span
                  className="font-mono text-xs uppercase text-site-muted"
                  style={{ letterSpacing: 'var(--label-tracking)' }}
                >
                  Style guide &middot; the guidance
                </span>
              </div>
              <p className="text-site-muted text-sm leading-relaxed flex-1 mb-8">
                The style guide defines how to apply those values. Voice and tone,
                when to use which color, do&rsquo;s and don&rsquo;ts, accessibility commitments.
                Human-readable. Survives any theme change because it governs intent,
                not implementation.
              </p>
              <Link
                href="/design-system/style-guide"
                className="inline-flex items-center gap-2 self-start rounded-lg border border-site-text bg-white px-6 py-[11px] text-sm font-semibold text-site-text transition-colors hover:bg-site-bg"
                style={{ letterSpacing: '0.015em' }}
              >
                View the style guide
                <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why both matter ───────────────────────────────────── */}
        <section className="mb-20 md:mb-28">
          <h2
            className="font-display text-2xl font-semibold text-site-text mb-4"
            style={{ letterSpacing: 'var(--site-heading-letter-spacing)' }}
          >
            Why both matter
          </h2>
          <p className="text-site-muted leading-relaxed max-w-2xl">
            Themes without style guides produce inconsistent application of tokens.
            Style guides without themes produce unenforceable rules. Together they
            form a complete design system.
          </p>
        </section>

        {/* ── Architecture note ─────────────────────────────────── */}
        <footer className="border-t border-site-border pt-8">
          <p className="text-sm text-site-muted leading-relaxed">
            This system spans two apps (Ess-Kay Yards and Galaxy SF) and is enforced
            by an a11y-reviewer subagent (WCAG 2.2 AA) and a reviewer subagent
            (project conventions) running on every commit.
          </p>
        </footer>

      </div>
    </main>
  )
}

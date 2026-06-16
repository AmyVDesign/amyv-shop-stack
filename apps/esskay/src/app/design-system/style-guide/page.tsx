import Link from 'next/link'

export const metadata = {
  title: 'Style Guide — Ess-Kay Yards Design System',
}

function SectionDivider() {
  return <div className="border-t border-site-border my-20 md:my-28" />
}

function DoTag({ do: isDo }: { do: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isDo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isDo ? 'Do' : "Don't"}
    </span>
  )
}

export default function StyleGuidePage() {
  return (
    <main className="min-h-screen bg-site-bg">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">

        {/* Back nav */}
        <Link
          href="/design-system"
          className="inline-flex items-center text-sm text-site-muted hover:text-site-text mb-12 transition-colors"
        >
          &#8592; Design System
        </Link>

        {/* ── Header ────────────────────────────────────────────── */}
        <header className="mb-20 md:mb-28">
          <p className="font-mono text-xs uppercase tracking-widest text-site-muted mb-3">
            Style guide
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-site-text mb-4 leading-tight">
            Ess-Kay Yards
          </h1>
          <p className="text-site-muted">
            The guidance. Voice, usage rules, accessibility commitments.
          </p>
        </header>

        {/* ── Voice and tone ────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-4">
            Voice and tone
          </h2>
          <p className="text-site-muted leading-relaxed max-w-2xl">
            Direct, knowledgeable, never condescending. We sell obsolete parts to
            people who know what they need. Skip marketing language. Use part numbers,
            vendor names, and condition states precisely. Never use &ldquo;AI&rdquo; in
            customer-facing copy.
          </p>
        </section>

        <SectionDivider />

        {/* ── Color usage rules ─────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Color usage rules
          </h2>
          <ul className="space-y-4">
            {[
              {
                do: true,
                rule: 'Use nautical navy (',
                token: '--site-accent-dark',
                suffix: ') for primary CTAs and headings only.',
              },
              {
                do: false,
                rule: 'Use nautical navy for body text.',
              },
              {
                do: true,
                rule: 'Use cream (',
                token: '--site-bg',
                suffix: ') as the primary background.',
              },
              {
                do: false,
                rule: 'Use cream as a foreground color.',
              },
              {
                do: true,
                rule: 'Use semantic colors (red, amber, green) only for state: out of stock, low stock, in stock.',
              },
              {
                do: false,
                rule: 'Use semantic colors decoratively (e.g., a green badge to mean “popular”).',
              },
              {
                do: true,
                rule: 'Pair every color-coded state indicator with a text label or icon.',
              },
              {
                do: false,
                rule: 'Use color as the sole indicator of state.',
              },
              {
                do: true,
                rule: 'Use at most one accent color per screen.',
              },
            ].map(({ do: isDo, rule, token, suffix }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                    isDo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}
                  aria-hidden="true"
                >
                  {isDo ? '✓' : '✕'}
                </span>
                <p className="text-sm text-site-text leading-relaxed">
                  {rule}
                  {token && (
                    <code className="font-mono text-xs mx-0.5">{token}</code>
                  )}
                  {suffix}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <SectionDivider />

        {/* ── Typography rules ──────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Typography rules
          </h2>
          <div className="space-y-4">
            {[
              {
                font: 'Source Serif 4',
                token: '--font-display',
                when: 'H1, H2, H3 headings and editorial body copy. Sets the editorial character of the page.',
              },
              {
                font: 'Inter',
                token: '--font-body',
                when: 'UI labels, form inputs, button text, dense data tables, navigation. Optimized for readability at small sizes.',
              },
              {
                font: 'System monospace',
                token: 'font-mono',
                when: 'Part numbers, SKUs, CSS variable references, code blocks. Never for prose.',
              },
            ].map(({ font, token, when }) => (
              <div key={token} className="flex gap-4 py-4 border-b border-site-border last:border-0">
                <code className="font-mono text-xs text-site-muted pt-0.5 w-36 flex-shrink-0">{token}</code>
                <div>
                  <p className="text-sm font-medium text-site-text mb-1">{font}</p>
                  <p className="text-sm text-site-muted">{when}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-site-muted mt-6 leading-relaxed">
            Never mix serifs and sans-serifs at the same hierarchy level. A Source Serif 4
            H2 followed by an Inter paragraph is correct. Two competing font families in
            the same heading is not.
          </p>
        </section>

        <SectionDivider />

        {/* ── Component selection guide ─────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Component selection guide
          </h2>
          <div className="space-y-0 divide-y divide-site-border rounded-lg border border-site-border overflow-hidden">
            {[
              {
                component: 'Button',
                use: 'Primary actions only: save, submit, confirm.',
                notFor: 'Navigation. For navigation, use a Link.',
              },
              {
                component: 'Badge',
                use: 'Status display: condition, visibility, stock state.',
                notFor: 'Selectable filters. For filters, use chip-style buttons with aria-pressed.',
              },
              {
                component: 'Card',
                use: 'Bounded content groups that carry their own context (product detail blocks, stat groups).',
                notFor: 'Every section on a page. Cards add visual weight; use sparingly.',
              },
              {
                component: 'EmptyState',
                use: 'Any list or table with zero items must show an EmptyState.',
                notFor: 'Loading states. Use a skeleton or spinner for in-progress fetches.',
              },
            ].map(({ component, use, notFor }) => (
              <div key={component} className="px-5 py-4 bg-white">
                <p className="font-mono text-sm font-medium text-site-text mb-2">{`<${component}>`}</p>
                <div className="flex gap-2 text-xs text-site-muted">
                  <span className="flex-shrink-0 text-green-700 font-medium">Use for:</span>
                  <span>{use}</span>
                </div>
                <div className="flex gap-2 text-xs text-site-muted mt-1">
                  <span className="flex-shrink-0 text-red-600 font-medium">Not for:</span>
                  <span>{notFor}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ── Accessibility commitments ─────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-4">
            Accessibility commitments
          </h2>
          <p className="text-site-muted text-sm mb-6">
            These are enforced by the a11y-reviewer subagent on every commit.
          </p>
          <ul className="space-y-3">
            {[
              'WCAG 2.2 Level AA on every shipped commit.',
              'Every form input has an associated label: visible <label htmlFor> or aria-label. (WCAG 1.3.1)',
              'Every icon-only button has an aria-label. (WCAG 4.1.2)',
              'Every interactive element is keyboard-accessible with Enter, Space, and Escape where applicable. (WCAG 2.1.1)',
              'Body text contrast at least 4.5:1 against its background. Large text (18pt+ or 14pt+ bold) at least 3:1. (WCAG 1.4.3)',
              'Visible focus indicators on all interactive elements. No outline: none without a ring replacement. (WCAG 2.4.7)',
              'No positive tabIndex values anywhere in the component tree. (WCAG 2.4.3)',
              'Color is never the sole indicator of state. Always pair with text, icon, or pattern. (WCAG 1.4.1)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 text-site-accent text-xs flex-shrink-0">&#9632;</span>
                <p className="text-sm text-site-muted leading-relaxed">{item}</p>
              </li>
            ))}
          </ul>
        </section>

        <SectionDivider />

        {/* ── Do's and don'ts ───────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-8">
            Do&rsquo;s and don&rsquo;ts
          </h2>

          <div className="space-y-12">

            {/* 1 — Color use */}
            <div>
              <h3 className="text-sm font-medium text-site-text mb-4">Color use</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Do */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                  <div className="mb-3"><DoTag do /></div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                      <span aria-hidden="true">&#9679;</span>
                      Out of stock
                    </span>
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    Red badge paired with icon for out-of-stock. Semantic use &mdash; state, not decoration.
                  </p>
                </div>
                {/* Don't */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                  <div className="mb-3"><DoTag do={false} /></div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                      Best seller
                    </span>
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    Red badge used decoratively for marketing copy. Misleads users about urgency.
                  </p>
                </div>
              </div>
            </div>

            {/* 2 — Spacing */}
            <div>
              <h3 className="text-sm font-medium text-site-text mb-4">Spacing</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Do */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                  <div className="mb-3"><DoTag do /></div>
                  <div className="rounded-md border border-site-border bg-white p-6">
                    <div className="h-3 w-32 rounded bg-site-border mb-3" aria-hidden="true" />
                    <div className="h-2 w-full rounded bg-site-border/60 mb-2" aria-hidden="true" />
                    <div className="h-2 w-3/4 rounded bg-site-border/60" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    Consistent <code className="font-mono">p-6</code> padding from the card primitive.
                  </p>
                </div>
                {/* Don't */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                  <div className="mb-3"><DoTag do={false} /></div>
                  <div className="rounded-md border border-site-border bg-white pt-3 pb-7 pl-4 pr-10">
                    <div className="h-3 w-32 rounded bg-site-border mb-3" aria-hidden="true" />
                    <div className="h-2 w-full rounded bg-site-border/60 mb-2" aria-hidden="true" />
                    <div className="h-2 w-3/4 rounded bg-site-border/60" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    Ad-hoc inline padding values (<code className="font-mono">pt-3 pb-7 pl-4 pr-10</code>).
                    Inconsistent across components.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 — Typography */}
            <div>
              <h3 className="text-sm font-medium text-site-text mb-4">Typography</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Do */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                  <div className="mb-3"><DoTag do /></div>
                  <div className="rounded-md border border-site-border bg-white p-5">
                    <p className="font-display text-lg font-semibold text-site-text mb-2">
                      Heading in Source Serif
                    </p>
                    <p className="font-body text-sm text-site-muted leading-relaxed">
                      Body copy in Inter. Serif heading, sans-serif body &mdash; distinct hierarchy.
                    </p>
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    <code className="font-mono">font-display</code> heading,{' '}
                    <code className="font-mono">font-body</code> paragraph.
                    Clear typographic hierarchy.
                  </p>
                </div>
                {/* Don't */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                  <div className="mb-3"><DoTag do={false} /></div>
                  <div className="rounded-md border border-site-border bg-white p-5">
                    <p className="font-body text-lg font-semibold text-site-text mb-2">
                      Heading in Inter
                    </p>
                    <p className="font-display text-sm text-site-muted leading-relaxed">
                      Body copy in Source Serif. Same weight, same size, no hierarchy.
                    </p>
                  </div>
                  <p className="text-xs text-site-muted mt-3 leading-relaxed">
                    Fonts swapped &mdash; sans-serif heading, serif body. Hierarchy collapses; both levels compete.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <SectionDivider />

        {/* ── Enforcement ───────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl font-semibold text-site-text mb-4">
            Enforcement
          </h2>
          <p className="text-site-muted text-sm leading-relaxed max-w-2xl">
            These rules are enforced programmatically by two reviewer subagents running
            on every commit. The accessibility reviewer checks WCAG 2.2 AA criteria
            per-criterion with explicit pass/warn/fail output. The general reviewer checks
            UX conventions, schema patterns, and privacy. See{' '}
            <code className="font-mono text-xs">.claude/agents/a11y-reviewer.md</code> and{' '}
            <code className="font-mono text-xs">.claude/agents/reviewer.md</code>.
          </p>
        </section>

        {/* ── Footer nav ────────────────────────────────────────── */}
        <div className="mt-20 md:mt-28 pt-8 border-t border-site-border flex flex-wrap gap-6">
          <Link href="/design-system" className="text-sm text-site-muted hover:text-site-text transition-colors">
            &#8592; Design System
          </Link>
          <Link href="/design-system/theme" className="text-sm text-site-accent-dark hover:underline ml-auto">
            Theme &#8594;
          </Link>
        </div>

      </div>
    </main>
  )
}

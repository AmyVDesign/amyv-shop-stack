'use client'

import { useState, useSyncExternalStore } from 'react'
import {
  Button,
  Badge,
  Card,
  Wordmark,
  EmptyState,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  IconArrow,
  IconArrowLeft,
  IconClose,
  IconCheck,
  IconPlus,
  IconMenu,
  IconShoppingBag,
  IconMail,
} from '@amyv/ui'

// ── Token metadata ────────────────────────────────────────────────────────────

const SURFACE_TOKENS = [
  { token: '--site-bg',        label: 'Background' },
  { token: '--site-bg-alt',    label: 'Background alt' },
  { token: '--site-border',    label: 'Border' },
  { token: '--site-text',      label: 'Text' },
  { token: '--site-text-soft', label: 'Text soft' },
  { token: '--site-muted',     label: 'Muted' },
] as const

const ACCENT_GROUPS = [
  {
    name: 'Navy',
    usage: 'Primary: headings, CTAs, nav',
    tokens: [
      { token: '--site-accent-navy',       label: 'Navy' },
      { token: '--site-accent-navy-dark',  label: 'Navy dark' },
      { token: '--site-accent-navy-light', label: 'Navy light' },
    ],
  },
  {
    name: 'Azure',
    usage: 'Secondary: links, hover, info',
    tokens: [
      { token: '--site-accent-azure',       label: 'Azure' },
      { token: '--site-accent-azure-dark',  label: 'Azure dark' },
      { token: '--site-accent-azure-light', label: 'Azure light' },
    ],
  },
  {
    name: 'Driftwood',
    usage: 'Warm neutral: borders, decorative',
    tokens: [
      { token: '--site-accent-driftwood',       label: 'Driftwood' },
      { token: '--site-accent-driftwood-dark',  label: 'Driftwood dark' },
      { token: '--site-accent-driftwood-light', label: 'Driftwood light' },
    ],
  },
  {
    name: 'Coral',
    usage: 'Attention only: featured, new, sale',
    tokens: [
      { token: '--site-accent-coral',       label: 'Coral' },
      { token: '--site-accent-coral-dark',  label: 'Coral dark' },
      { token: '--site-accent-coral-light', label: 'Coral light' },
    ],
  },
] as const

const TOKEN_ALIASES = [
  { alias: '--site-accent',       resolves: 'var(--site-accent-azure)', purpose: 'Links, info, hover states' },
  { alias: '--site-accent-dark',  resolves: 'var(--site-accent-navy)',  purpose: 'Primary actions, headings' },
  { alias: '--site-accent-light', resolves: 'var(--site-accent-navy-light)', purpose: 'Subtle fills, active states' },
] as const

// ── a11y before/after dataset ─────────────────────────────────────────────────
// These four cases are the token-based contrast failures caught during the palette pass.
// A fifth case (amber dot) is rendered separately below with Tailwind utility classes.

const A11Y_CASES = [
  {
    id: 'azure-badge',
    criterion: 'WCAG 1.4.3',
    title: 'Azure badge text',
    failBg: 'var(--site-accent-azure-light)',
    failFg: 'var(--site-accent-azure-dark)',
    failRatio: '3.57:1',
    passBg: 'var(--site-accent-azure-light)',
    passFg: 'var(--site-accent-navy)',
    passRatio: '10.2:1',
    fix: 'Navy text replaces azure-dark on azure-light badge backgrounds.',
  },
  {
    id: 'driftwood-badge',
    criterion: 'WCAG 1.4.3',
    title: 'Driftwood badge text',
    failBg: 'var(--site-accent-driftwood-light)',
    failFg: 'var(--site-accent-driftwood-dark)',
    failRatio: '3.65:1',
    passBg: 'var(--site-accent-driftwood-light)',
    passFg: 'var(--site-accent-navy)',
    passRatio: '9.9:1',
    fix: 'Navy text replaces driftwood-dark on driftwood-light badge backgrounds.',
  },
  {
    id: 'coral-badge',
    criterion: 'WCAG 1.4.3',
    title: 'Coral badge text',
    failBg: 'var(--site-accent-coral-light)',
    failFg: 'var(--site-accent-coral-dark)',
    failRatio: '3.02:1',
    passBg: 'var(--site-accent-coral-light)',
    passFg: 'var(--site-accent-navy)',
    passRatio: '10.4:1',
    fix: 'Navy text replaces coral-dark on coral-light badge backgrounds.',
  },
  {
    id: 'action-button',
    criterion: 'WCAG 1.4.3',
    title: 'Secondary button text on white',
    failBg: 'white',
    failFg: 'var(--site-accent-azure-dark)',
    failRatio: '4.10:1',
    passBg: 'var(--site-bg)',
    passFg: 'var(--site-accent-navy)',
    passRatio: '11.9:1',
    fix: 'Navy replaces azure-dark for primary action and secondary button text.',
  },
] as const

// ── Helper components ─────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16">
      <h2 className="text-xl font-semibold text-site-text mb-6 pb-2 border-b border-site-border">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold uppercase text-site-muted mb-3" style={{ letterSpacing: 'var(--label-tracking)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Swatch({ token, label, resolved }: { token: string; label: string; resolved?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-14 rounded-lg border border-site-border"
        style={{ background: `var(${token})` }}
        role="img"
        aria-label={`${label} color swatch`}
      />
      <p className="text-xs font-mono text-site-text truncate">{token}</p>
      <p className="text-xs text-site-muted">{label}</p>
      {resolved && <p className="text-xs font-mono text-site-muted">{resolved}</p>}
    </div>
  )
}

function A11yCard({
  criterion, title, failBg, failFg, failRatio, passBg, passFg, passRatio, fix,
}: {
  criterion: string; title: string
  failBg: string; failFg: string; failRatio: string
  passBg: string; passFg: string; passRatio: string
  fix: string
}) {
  return (
    <div className="rounded-xl border border-site-border bg-site-bg-alt p-5 flex flex-col gap-4">
      <div>
        <span className="text-xs font-mono text-site-muted">{criterion}</span>
        <h3 className="text-sm font-semibold text-site-text mt-0.5">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-site-muted">Before</span>
          {/* Intentional contrast failure for documentation purposes */}
          <div
            className="rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ background: failBg, color: failFg }}
            aria-label={`Failing contrast example: ${failRatio}`}
          >
            Sample text
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-site-accent-coral" aria-hidden="true" />
            <span className="text-xs text-site-muted">{failRatio} -- fails</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-site-muted">After</span>
          <div
            className="rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ background: passBg, color: passFg }}
            aria-label={`Passing contrast example: ${passRatio}`}
          >
            Sample text
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-site-accent-navy" aria-hidden="true" />
            <span className="text-xs text-site-muted">{passRatio} -- passes</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-site-text">{fix}</p>
    </div>
  )
}

// ── Token reader (module-level so useSyncExternalStore can reference it) ──────

function readDesignTokens(): Record<string, string> {
  const style = getComputedStyle(document.documentElement)
  const allTokens = [
    ...SURFACE_TOKENS.map((t) => t.token),
    ...ACCENT_GROUPS.flatMap((g) => g.tokens.map((t) => t.token)),
  ]
  const resolved: Record<string, string> = {}
  for (const token of allTokens) {
    resolved[token] = style.getPropertyValue(token).trim()
  }
  return resolved
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  // Read resolved token values from the document root.
  // The root always carries Ess-Kay Yards tokens -- the Galaxy preview below
  // is scoped to its own container via data-theme, not the root.
  // useSyncExternalStore avoids a setState-in-effect while remaining SSR-safe.
  const tokenValues = useSyncExternalStore(
    () => () => {},   // tokens don't change at runtime -- no subscription needed
    readDesignTokens,
    (): Record<string, string> => ({}),
  )
  const [galaxyTheme, setGalaxyTheme] = useState(false)

  return (
    <div className="px-6 py-8 max-w-5xl">
      <a
        href="#ds-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-site-accent-navy focus:text-site-bg"
      >
        Skip to content
      </a>

      {/* Page header */}
      <div className="mb-12">
        <h1 className="text-3xl font-display font-semibold text-site-text mb-3">
          Design System
        </h1>
        <p className="text-sm text-site-muted max-w-prose">
          A living reference for the Ess-Kay Yards component library. Token values are
          read at runtime from CSS custom properties, so this page stays in sync with
          globals.css automatically. Components render in the same environment as
          production screens.
        </p>
        <nav aria-label="Design system sections" className="mt-5 flex flex-wrap gap-2">
          {[
            ['#color-tokens', 'Color tokens'],
            ['#typography', 'Typography'],
            ['#components', 'Components'],
            ['#accessibility', 'Accessibility'],
            ['#theme-swap', 'Theme swap'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-xs px-3 py-1.5 rounded-full border border-site-border text-site-text hover:border-site-accent-navy hover:text-site-accent-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <main id="ds-content">
        {/* ── Color tokens ──────────────────────────────────────────────── */}
        <Section id="color-tokens" title="Color tokens">
          <Sub title="Surfaces">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {SURFACE_TOKENS.map(({ token, label }) => (
                <Swatch key={token} token={token} label={label} resolved={tokenValues[token]} />
              ))}
            </div>
          </Sub>

          {ACCENT_GROUPS.map((group) => (
            <Sub key={group.name} title={`${group.name}: ${group.usage}`}>
              <div className="grid grid-cols-3 gap-4">
                {group.tokens.map(({ token, label }) => (
                  <Swatch key={token} token={token} label={label} resolved={tokenValues[token]} />
                ))}
              </div>
            </Sub>
          ))}

          <Sub title="Backward-compat aliases">
            <div className="rounded-xl border border-site-border overflow-hidden">
              <table className="w-full text-sm" aria-label="Backward-compat token aliases">
                <thead>
                  <tr className="border-b border-site-border bg-site-bg-alt">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-site-muted" style={{ letterSpacing: 'var(--label-tracking)' }}>ALIAS</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-site-muted" style={{ letterSpacing: 'var(--label-tracking)' }}>RESOLVES TO</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-site-muted" style={{ letterSpacing: 'var(--label-tracking)' }}>PURPOSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border">
                  {TOKEN_ALIASES.map((row) => (
                    <tr key={row.alias} className="bg-site-bg">
                      <td className="px-4 py-2.5 font-mono text-xs text-site-text">{row.alias}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-site-muted">{row.resolves}</td>
                      <td className="px-4 py-2.5 text-xs text-site-muted">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sub>
        </Section>

        {/* ── Typography ────────────────────────────────────────────────── */}
        <Section id="typography" title="Typography">
          <Sub title="Typefaces">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-site-border bg-site-bg-alt p-5">
                <p className="text-xs font-mono text-site-muted mb-2">--font-display</p>
                <p className="font-display text-2xl text-site-text leading-tight">Source Serif 4</p>
                <p className="font-display text-base text-site-text-soft mt-2">
                  Used for wordmarks, headings, and editorial moments.
                </p>
              </div>
              <div className="rounded-xl border border-site-border bg-site-bg-alt p-5">
                <p className="text-xs font-mono text-site-muted mb-2">--font-body</p>
                <p className="font-body text-2xl text-site-text leading-tight">Inter</p>
                <p className="font-body text-base text-site-text-soft mt-2">
                  Used for body copy, UI labels, and data tables.
                </p>
              </div>
            </div>
          </Sub>

          <Sub title="Type scale">
            <div className="space-y-4">
              {[
                { label: 'Display / font-display / 2.5rem', el: 'p', cls: 'font-display text-4xl text-site-text' },
                { label: 'H1 / font-semibold / 1.875rem', el: 'p', cls: 'text-3xl font-semibold text-site-text' },
                { label: 'H2 / var(--site-h2-size) / font-semibold', el: 'p', cls: 'text-[var(--site-h2-size)] font-semibold text-site-text' },
                { label: 'H3 / text-xl / font-semibold', el: 'p', cls: 'text-xl font-semibold text-site-text' },
                { label: 'Body / var(--site-body-size) / regular', el: 'p', cls: 'text-[var(--site-body-size)] text-site-text' },
                { label: 'Small / text-sm / muted', el: 'p', cls: 'text-sm text-site-muted' },
                { label: 'Label / text-xs / uppercase / tracked', el: 'p', cls: 'text-xs uppercase text-site-muted', style: { letterSpacing: 'var(--label-tracking)' } },
              ].map(({ label, cls, style }) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span className="w-64 shrink-0 text-xs text-site-muted font-mono">{label}</span>
                  <span className={cls} style={style}>Ess-Kay Yards</span>
                </div>
              ))}
            </div>
          </Sub>

          <Sub title="Design tokens">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { token: '--site-heading-letter-spacing', value: '0.04em' },
                { token: '--label-tracking',              value: '0.12em' },
                { token: '--site-radius',                 value: '16px' },
                { token: '--site-card-radius',            value: '20px' },
                { token: '--site-body-size',              value: '16px' },
                { token: '--site-h2-size',                value: 'clamp(24px, 2.8vw, 32px)' },
                { token: '--site-duration-fast',          value: '120ms' },
                { token: '--site-duration-base',          value: '200ms' },
              ].map(({ token, value }) => (
                <div key={token} className="rounded-lg border border-site-border bg-site-bg-alt px-3 py-2.5">
                  <p className="text-xs font-mono text-site-text truncate">{token}</p>
                  <p className="text-xs text-site-muted mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </Sub>
        </Section>

        {/* ── Components ────────────────────────────────────────────────── */}
        <Section id="components" title="Components">
          <p className="text-sm text-site-muted mb-6">
            All exports from{' '}
            <code className="font-mono text-xs bg-site-border/40 px-1 py-0.5 rounded">@amyv/ui</code>.
            Each component renders live. Changes to globals.css are reflected here
            on the next reload.
          </p>

          {/* Button */}
          <Sub title="Button -- variant x size x state">
            <div className="space-y-4">
              {(['primary', 'secondary', 'ghost'] as const).map((variant) => (
                <div key={variant} className="flex flex-wrap items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-mono text-site-muted">{variant}</span>
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <Button key={size} variant={variant} size={size}>
                      {size.toUpperCase()}
                    </Button>
                  ))}
                  <Button variant={variant} size="md" disabled>
                    Disabled
                  </Button>
                </div>
              ))}
            </div>
          </Sub>

          {/* Badge */}
          <Sub title="Badge -- all variants">
            <div className="flex flex-wrap gap-3">
              {(['green', 'gray', 'blue', 'orange'] as const).map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-site-muted mt-3">
              Badge uses Tailwind color utilities (bg-green-100, text-green-800, etc.)
              rather than --site-* tokens. Pending migration to design-system token pairing.
            </p>
          </Sub>

          {/* Card */}
          <Sub title="Card -- static and clickable">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <p className="text-sm text-site-text font-medium">Default card</p>
                <p className="text-xs text-site-muted mt-1">Static, no interaction.</p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-site-text">OE 147-0831</p>
                <p className="text-xs text-site-muted mt-1">Carburetor, New Old Stock</p>
                <p className="text-sm font-semibold text-site-accent-navy mt-2">$285.00</p>
              </Card>
              <Card onClick={() => {}}>
                <p className="text-sm text-site-text font-medium">Clickable card</p>
                <p className="text-xs text-site-muted mt-1">Hover to see border treatment.</p>
              </Card>
            </div>
            <p className="text-xs text-site-muted mt-3">
              Note: Card has a pre-existing hardcoded border value (border-[navy-hex]/10).
              Flagged for migration to --site-accent-navy with Tailwind opacity modifier.
            </p>
          </Sub>

          {/* Wordmark */}
          <Sub title="Wordmark -- sm / md / lg">
            <div className="flex flex-wrap items-end gap-8">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size} className="flex flex-col items-start gap-1.5">
                  <Wordmark size={size} />
                  <span className="text-xs text-site-muted">size={size}</span>
                </div>
              ))}
            </div>
          </Sub>

          {/* Table */}
          <Sub title="Table -- header and rows">
            <div className="rounded-xl border border-site-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell header>Part No.</TableCell>
                    <TableCell header>Description</TableCell>
                    <TableCell header>Condition</TableCell>
                    <TableCell header>Price</TableCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {[
                    { part: '147-0831', desc: 'Carburetor',        cond: 'NOS',  price: '$285.00' },
                    { part: '167-1185', desc: 'Voltage Regulator', cond: 'Used', price: '$95.00'  },
                    { part: '122-0836', desc: 'Control Panel',     cond: 'New',  price: '$340.00' },
                  ].map((row) => (
                    <TableRow key={row.part}>
                      <TableCell className="font-mono text-xs">{row.part}</TableCell>
                      <TableCell>{row.desc}</TableCell>
                      <TableCell>{row.cond}</TableCell>
                      <TableCell className="tabular-nums">{row.price}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </div>
          </Sub>

          {/* EmptyState */}
          <Sub title="EmptyState -- message with and without action">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-site-border overflow-hidden">
                <EmptyState message="No parts found matching your search." />
              </div>
              <div className="rounded-xl border border-site-border overflow-hidden">
                <EmptyState
                  message="No parts yet."
                  action={<Button size="sm">Add Part</Button>}
                />
              </div>
            </div>
          </Sub>

          {/* Icons */}
          <Sub title="Icons -- all exports">
            <div className="flex flex-wrap gap-5">
              {[
                { name: 'IconArrow',       Icon: IconArrow },
                { name: 'IconArrowLeft',   Icon: IconArrowLeft },
                { name: 'IconClose',       Icon: IconClose },
                { name: 'IconCheck',       Icon: IconCheck },
                { name: 'IconPlus',        Icon: IconPlus },
                { name: 'IconMenu',        Icon: IconMenu },
                { name: 'IconShoppingBag', Icon: IconShoppingBag },
                { name: 'IconMail',        Icon: IconMail },
              ].map(({ name, Icon }) => (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <div className="p-2.5 rounded-lg border border-site-border bg-site-bg-alt text-site-text">
                    <Icon size={20} />
                  </div>
                  <span className="text-xs text-site-muted">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-site-muted mt-3">
              All icons accept{' '}
              <code className="font-mono text-xs bg-site-border/40 px-1 py-0.5 rounded">size</code>
              {' '}(default: 20) and{' '}
              <code className="font-mono text-xs bg-site-border/40 px-1 py-0.5 rounded">color</code>
              {' '}(default: currentColor) props.
            </p>
          </Sub>
        </Section>

        {/* ── Accessibility ─────────────────────────────────────────────── */}
        <Section id="accessibility" title="Accessibility">
          <p className="text-sm text-site-muted mb-6 max-w-prose">
            Five contrast failures caught by the a11y reviewer during the coastal-modern palette pass.
            Each pair shows the original specification (left) alongside the corrected token
            pairing (right) with measured contrast ratios. The before examples are intentional
            contrast demonstrations.
          </p>

          {/* Cases 1-4: token-based failures */}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {A11Y_CASES.map(({ id, ...props }) => (
              <A11yCard key={id} {...props} />
            ))}
          </div>

          {/* Case 5: amber stock dot (WCAG 1.4.11, non-text contrast) */}
          <div className="rounded-xl border border-site-border bg-site-bg-alt p-5">
            <div className="mb-4">
              <span className="text-xs font-mono text-site-muted">WCAG 1.4.11</span>
              <h3 className="text-sm font-semibold text-site-text mt-0.5">Stock indicator dot (non-text contrast)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-site-muted">Before</span>
                {/* Intentional non-text contrast failure for documentation */}
                <div className="flex items-center gap-2 rounded-lg border border-site-border bg-site-bg px-3 py-2.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                  <span className="text-sm text-site-text tabular-nums">42</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-site-accent-coral" aria-hidden="true" />
                  <span className="text-xs text-site-muted">1.97:1 -- fails</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-site-muted">After</span>
                <div className="flex items-center gap-2 rounded-lg border border-site-border bg-site-bg px-3 py-2.5">
                  <span className="text-sm text-site-text tabular-nums">42</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-site-accent-navy" aria-hidden="true" />
                  <span className="text-xs text-site-muted">Dot removed</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-site-text mt-4">
              Amber-500 on cream yields 1.97:1, below the 3.0:1 floor for non-text graphics.
              The dot was removed entirely: for a one-of-a-kind inventory there is no reorder
              action, so a stock-level signal does not map to the business model. The
              numerical quantity carries the information without the failing color signal.
            </p>
          </div>
        </Section>

        {/* ── Theme swap ────────────────────────────────────────────────── */}
        <Section id="theme-swap" title="Theme swap">
          <p className="text-sm text-site-muted mb-5 max-w-prose">
            The shared component library targets CSS custom properties, not hardcoded
            colors. Applying a second token set via a data-theme attribute on a container
            re-themes every component beneath it without modifying any component source.
          </p>

          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGalaxyTheme((t) => !t)}
              aria-pressed={galaxyTheme}
              className="rounded-xl border border-site-border bg-site-bg-alt px-4 py-2 text-sm font-medium text-site-text hover:border-site-accent-navy hover:text-site-accent-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-navy"
            >
              {galaxyTheme ? 'Restore Ess-Kay Yards tokens' : 'Switch to Galaxy SF tokens'}
            </button>
            <span className="text-xs text-site-muted">
              Active: {galaxyTheme ? 'Galaxy SF' : 'Ess-Kay Yards'}
            </span>
          </div>

          {/* Token-themed preview container */}
          <div
            data-theme={galaxyTheme ? 'galaxy' : undefined}
            className="rounded-xl border border-site-border overflow-hidden p-6 transition-colors"
            style={{ background: 'var(--site-bg)' }}
          >
            <div className="mb-5">
              <Wordmark size="md" />
            </div>
            <div className="flex flex-wrap gap-3 mb-5">
              <Button variant="primary">Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              <Badge variant="green">In stock</Badge>
              <Badge variant="blue">Featured</Badge>
              <Badge variant="orange">Sale</Badge>
              <Badge variant="gray">Internal</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { part: '147-0831', desc: 'Carburetor, NOS',   price: '$285.00' },
                { part: '167-1185', desc: 'Voltage Regulator', price: '$95.00' },
              ].map((item) => (
                <div
                  key={item.part}
                  className="rounded-lg border p-4 text-sm"
                  style={{ borderColor: 'var(--site-border)', background: 'var(--site-bg-alt)' }}
                >
                  <p className="font-semibold" style={{ color: 'var(--site-text)' }}>{item.part}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--site-muted)' }}>{item.desc}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--site-accent-navy)' }}>{item.price}</p>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--site-muted)' }}>
              {galaxyTheme
                ? 'Galaxy SF tokens active via data-theme="galaxy". Button and Wordmark respond to the override; Badge uses Tailwind utilities and does not.'
                : 'Ess-Kay Yards tokens active. Toggle above to preview the Galaxy SF surface.'}
            </p>
          </div>

          <p className="text-xs text-site-muted mt-3">
            Badge intentionally does not change under the theme swap -- it uses
            hardcoded Tailwind color utilities rather than --site-* tokens. This
            documents the token migration gap, not a defect in the theme mechanism.
          </p>
        </Section>
      </main>
    </div>
  )
}

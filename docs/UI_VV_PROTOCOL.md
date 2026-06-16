# UI Verification and Validation Protocol

Platform: amyv-shop-stack (Ess-Kay Yards marina parts platform, Galaxy SF)

## Purpose

Defines how every front-end change is verified (built to defined criteria)
and validated (meets the real user's need) before it is declared done. Every
commit passes automated verification gates that can halt the pipeline on
failure. This document is the record of how the design system stays
accessible and convention-compliant as it grows.

## Definitions

- Verification: the UI meets defined criteria (WCAG 2.2 AA, project
  conventions). "Did we build it right."
- Validation: the UI meets the real user's need (non-technical operators:
  marina staff). "Did we build the right thing."
- Gate: an automated reviewer that can halt the pipeline on failure.
- Defect: a criterion violation. Must be fixed and re-committed before merge.

## Verification gates

Two gates run in series after every commit, before work is declared done:

1. Accessibility gate (a11y-reviewer): WCAG 2.2 AA. A single fail halts the
   loop. The implementer must fix and re-commit before the next gate runs.
2. Conventions gate (reviewer): project quality bar. Failures must be resolved
   before work is declared done.

Order: implementer commits, then accessibility gate, then conventions gate.
Either gate can independently halt the pipeline.

## Test suite A: accessibility verification (WCAG 2.2 AA)

Run against files in git diff HEAD~1 HEAD on every commit. Each criterion is a
named test case with a verification method and a pass condition.

| Test | Criterion | Verification method | Pass condition | On fail |
|---|---|---|---|---|
| A1 | WCAG 1.3.1 Info and Relationships | Every input, select, textarea has an associated label or aria-label / aria-labelledby | All form controls are programmatically labeled | halt |
| A2 | WCAG 1.4.1 Use of Color | Color-coded chips, badges, and status indicators pair color with a non-color signal (text or icon) | No element is distinguished by color alone | warn |
| A3 | WCAG 1.4.3 Contrast (Minimum) | New color pairs verified against the token palette in globals.css. Body text 4.5:1, large text 3:1 | All new combinations meet the minimum ratio | halt |
| A4 | WCAG 2.1.1 Keyboard | Custom interactive widgets expose onKeyDown for arrow keys, Enter, and Escape | Every custom control is keyboard operable | halt |
| A5 | WCAG 2.4.3 Focus Order | No positive tabIndex values | No tabIndex of 1 or higher | halt |
| A6 | WCAG 2.4.7 Focus Visible | No interactive element removes its focus ring without a replacement | Every focusable control has a visible focus state | halt |
| A7 | WCAG 4.1.2 Name, Role, Value | Icon-only buttons have aria-label, stateful controls expose state via aria attributes | All controls expose name, role, and value | halt |

Result semantics: pass, warn, fail, or n/a per criterion. A single fail sets
the overall status to FAIL and halts the loop. Warnings do not halt but are
recorded.

Traceability: every result cites the criterion number and the exact file and
line, for example "WCAG 2.4.7 fail at ProductForm.tsx:88." The reviewer output
table is the verification record for that commit.

## Test suite B: conventions verification

Run against the same diff by the conventions gate:

- TypeScript compiles clean (tsc --noEmit)
- No new TODO, FIXME, or console.log in the diff
- No em dashes in strings, comments, or JSX content
- No literal "AI" in user-facing strings (labels, headings, placeholders)
- No "None" placeholders in form fields (use action-oriented text)
- No hardcoded hex colors outside the design tokens
- New tables enable row level security with at least one policy
- Quantity integers never leak into public JSON-LD schema
- No secrets or real personal data committed

## Validation

Verification is automated. Validation is human, because "meets the user's
need" cannot be grepped. Validation methods:

- Manual screen-reader pass (NVDA or VoiceOver) of the critical path,
  performed on a recurring cadence.
- Keyboard-only walkthrough of the critical path.
- Direct observation of the actual non-technical operators using the flow.
  Design changes are traced back to observed friction. Two logged examples:
  the photo-first form inversion and the removal of stock indicators that did
  not fit a one-of-a-kind inventory.

## Defect handling

A fail halts the loop. The implementer fixes the defect, re-commits, and the
gates re-run. No change is declared done while any gate reports FAIL.

## Transferability

This protocol is built for a marina parts platform, but the architecture is
domain-independent: defined criteria, automated verification with halt-on-fail,
human validation against user need, and traceable defect records. The criteria
set is the only part that changes per domain.

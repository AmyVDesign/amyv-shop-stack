# LED Staff 3D Model

Platform: amyv-shop-stack (Galaxy SF)

## Purpose

Defines what `src/components/staff-3d/` is, the math it renders from, and
why it's built the way it is. Renders only, no photographs of the physical
product. This document covers the same ground as `docs/WHIP_MODEL.md` did
for the whip, in this file's own house style.

## Relationship to whip-3d

`staff-3d/` is a full, independent copy, it does not import from
`whip-3d/` and `whip-3d/` was not modified to produce it. The two products
share a remote pod, an LED section construction method, and a studio
lighting environment in concept, and the two prototypes' authors clearly
intended them to be the same unit (the staff prototype's own comments say
so directly). But the actual extraction into one shared implementation
that both products import is a later task, done deliberately, not an
oversight of this one. Where the two files' constants coincide (for
example, both remotes' pill-body color) that's the two products tuned to
the same real part, not a shared reference.

## Why procedural, not photogrammetry

Same reasoning as the whip: the staff's defining feature is 583
individually addressable LEDs animating in real time, split across two
remote-driven channels with a "mirror" pattern unique to this product. A
photogrammetry scan bakes one static unlit mesh with no way to drive
individual chips, no way to relight it, and every studio artifact from the
scan permanently fused into the geometry. Building the staff from its
actual construction, helix-wound strip under a shrink-wrap sleeve, on a
handle stack of bought and molded parts, gives an exact, relightable,
re-parametrizable model instead.

## Retunable dials

Three named constants in `dimensions.ts` are expected to change once real
measurements land against the physical product. They are kept as their
own named constants rather than folded into the values they scale, so a
retune touches one line each:

| Constant  | Controls                                            | Current value |
| --------- | ---------------------------------------------------- | ------------- |
| `S`       | Scales the whole radial cross-section (pole, strip, membrane) | 0.58 |
| `PER_TURN`| LED chips per helix turn, the strip's density        | 5.4 |
| `POD_H`   | Remote pod height. The pod's other faces, the bracket zone it clamps to, and the sticker between the pods are all ratios of it | 0.39 |

**Trap:** `COIL_TURNS` (9.681) is not a fourth free parameter, it's
pre-solved against `BR_H` (itself `POD_H * 1.25`) and `COIL_PITCH` so the
coil's open mouth parks 75° off the strip's top end, which is what lets
the splice leads run straight out of the jacket instead of doubling back.
If `POD_H` or `COIL_PITCH` changes, `COIL_TURNS` must be re-solved against
the new geometry, not rounded to the nearest whole turn, rounding walks
the mouth away from where the leads expect it and the splice stops
meeting the strip cleanly.

## Helix and strip-pitch math

Identical *method* to the whip, independently tuned constants. For
`t ∈ [0, 1]` across the LED section, `makeHelixBasis(y0, span, turns)`
returns a point and local frame, outward, tangent (tilted by the strip's
climb angle, `PITCH / 2π` rise per radian), and side (`tangent × outward`).
Every instanced mesh and the membrane's displacement are oriented off this
frame.

`R_POLE`, `STRIP_W`, `PITCH`, `R_WRAP` all carry `S`; `PER_TURN` does not
(it's a chip density, not a length). LED count is derived, not set
directly, from the same relationship as the whip's:

```
TURNS = SPAN / PITCH
COUNT = floor(TURNS * PER_TURN)
```

At current constants: `SPAN ≈ 5.08` world units, `TURNS ≈ 108`,
`COUNT = 583`.

## The displaced membrane

One continuous shrink-wrap surface sealed over the LED section and up over
the whole cable coil to its open mouth. Same core displacement terms as
the whip (chip bump, strip ridge, wrinkle noise, coil bulge, edge taper),
with two structural differences from the whip's version, both because the
staff's membrane has no dome cap sealing either end shut:

- **Detail envelope fades at both ends**, not just the bottom. The whip's
  top is sealed under a solid cap, so its chip/ridge/wrinkle detail runs
  at full strength right up to the cut. The staff's top opens directly
  into the coil-seal zone, so detail fades out approaching both `y0` and
  `y1`.
- **Edge taper applies at both cuts**, not just one. `eT` is the product
  of two independent smoothsteps (bottom and top) pulling the radius down
  to `R_POLE + 0.004·S` at each open end, instead of the whip's one-sided
  taper.

Sample density (`VSEG`) is derived from the *finest* pitch actually
present, `min(PITCH, COIL_PITCH)`, not a fixed absolute segment count.
An earlier version used a fixed height-segment count; slimming `S` then
quietly halved the samples per feature and the chip bumps stopped forming
without any error. Driving density off the tightest pitch present is what
keeps the displacement resolved regardless of how `S` changes.

## Instancing counts

At `COUNT = 583`:

| mesh    | instances | purpose                                       |
| ------- | --------- | ---------------------------------------------- |
| `shells`  | 583     | white LED package body                         |
| `dies`    | 583     | small colored die disc, per-instance color      |
| `glows`   | 583     | tight additive halo, per-instance color         |
| `glows2`  | 583     | wide, dim additive halo, per-instance color     |
| `pads`    | 1,166   | copper solder pads flanking each gap            |
| `comps`   | 583     | small silver passive component                  |
| `grooves` | 10      | molded vertical grooves around the foot's bell  |

The strip ribbon, its seam line, and the membrane are each one
non-instanced `BufferGeometry`, a continuous surface, not per-segment
tiles, so there are no visible seams between features.

## Patterns

`rainbow`, `comet`, `pulse`, and `galaxy` are painted by a *global* t
(each LED's position across the whole staff height,
`(y - BOT_Y) / STAFF_H`) rather than a t local to the LED section, so a pattern flows
continuously from foot to grip. `mirror` is the staff's own signature,
absent from the whip: `d = |t − 0.5| × 2` measures distance from the grip
outward, symmetric on both sides. `off` mutes the membrane to a frosted
white and raises the studio lights, same treatment as the whip.

## Palette module

`palette.ts` collects every material color (numeric `0xRRGGBB` three.js
literals) and every canvas-drawing color (CSS hex strings used inside
`textures.ts`) the staff uses, each as a named constant. This is a
deliberate exception to "no hardcoded hex in `.tsx`": three.js material
colors aren't CSS and can't become design tokens, so collecting and
naming them in one place is the equivalent discipline for a rendering
context that doesn't have one. Reviewers checking for hardcoded hex should
treat `palette.ts` (and the CSS-hex strings inside `textures.ts`, which
draw on a 2D canvas, not the DOM) as the intended location for these
values, not a violation to flag.

## Accessibility

- The pattern switcher is a `role="group"` of real `<button>` elements,
  each carrying `aria-pressed` to expose its state, matching the whip's
  dev route.
- Every button has an explicit visible focus ring
  (`focus-visible:outline-site-accent`), not just the browser default.
- The canvas has no inherent text alternative, so `StaffViewer` renders a
  visually-hidden (`sr-only`) description of the physical object and its
  current pattern alongside it, and marks the `<Canvas>` itself
  `aria-hidden` so assistive tech reads the description instead of an
  unlabeled canvas.
- Orbit (drag) is a supplementary way to inspect the model. Nothing about
  the product, its patterns, its geometry, its description, is only
  reachable by dragging; auto-rotate provides the same ambient view
  without input, and disables under `prefers-reduced-motion` along with
  the idle sway and per-frame pattern animation.

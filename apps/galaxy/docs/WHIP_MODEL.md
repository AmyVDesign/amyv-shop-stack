# LED whip 3D model

`src/components/whip-3d/` is a procedural react-three-fiber build of the
Galaxy SF LED whip: a `<WhipViewer>` client wrapper around a `<WhipModel>`
scene, ported geometry-for-geometry from the standalone prototype at
`docs/demos/whip-model-demo.html`. This document covers the renders and the
math behind them — it intentionally has no photos of the physical product.

## Why procedural, not photogrammetry

A photogrammetry scan gives one static, baked mesh: no way to relight it,
no way to drive individual LEDs, and every seam, hair, and shadow from the
scan session is permanently baked into the geometry and texture. The whip's
defining feature — 187 to 365 individually addressable LEDs animating in
real time — can't be represented by a scanned surface at all.

Building the whip from its actual construction (a helix-wound strip inside
a shrink-wrap film sleeve, on a tent-pole frame) instead means:

- Every LED is a real, separately colorable instance, not a baked-in glow.
- The geometry is exact and re-parametrizable — `length` regenerates a
  correctly-proportioned model instead of scaling a fixed scan.
- There's nothing to clean up: no scan noise, no turntable background
  bleeding into materials, no manual retopology.

## Helix and strip-pitch math

The LED strip winds up the pole as a helix. For a parameter `t ∈ [0, 1]`
(base to tip), `helixBasis(t)` in `dimensions.ts` returns the point and a
local frame:

- `a = t · TURNS · 2π` — the strip's total winding angle at `t`.
- `y = ledStartY + t · SPAN` — height, linear in `t`.
- `outward` — the radial unit vector `(cos a, 0, sin a)`.
- `tangent` — the helix's direction of travel, `(-sin a · R_WRAP, PITCH / 2π, cos a · R_WRAP)`,
  normalized. The `PITCH / 2π` term is the helix's rise per radian, so
  `tangent` tilts by exactly the strip's climb angle.
- `side` — `tangent × outward`, completing an orthonormal frame used to
  orient every instanced mesh (LED packages, pads, ribbon cross-section).

`PITCH`, `STRIP_W`, `PER_TURN`, and the pole/coil radii are fixed physical
properties of the strip and tent-pole hardware — they don't change with
`length`. Only `WHIP_H` (and so `SPAN`) scales per the `length` prop, using
the same 280 : 390 : 500 ratio as `TotemSVG`'s `VIEW_H` table. Because the
chip pitch is fixed, a longer span winds more turns of the same strip, and
LED count is *derived*, not set directly:

```
TURNS = SPAN / PITCH
COUNT = floor(TURNS * PER_TURN)   // PER_TURN = 5.4 chips per revolution
```

| length | SPAN (m) | turns | LED count |
| ------ | -------- | ----- | --------- |
| 24in   | 1.952    | 34.8  | 187       |
| 36in   | 2.876    | 51.2  | 276       |
| 48in   | 3.800    | 67.7  | 365       |

`CHIP_ARC` — the arc length between consecutive chips along the helix — is
`helixLenPerTurn / PER_TURN`, where `helixLenPerTurn = √((2π·R_WRAP)² + PITCH²)`
is the length of one full helix turn (circumference and rise combined,
Pythagorean since a helix is a straight line unrolled onto a cylinder).

## The unified membrane displacement

`Membrane.tsx` starts from a plain open cylinder (`CylinderGeometry`, 72
radial × 640 height segments) and displaces every vertex's radius in one
pass, so the whole shrink-wrap sleeve — LED section, connector, cable
coil, and cut edge — is a single seamless surface with no material breaks:

1. **Zone blend.** A smoothstep between `R_CONN` (resting radius over the
   bare connector) and `R_LED` (resting radius over the strip) fades in as
   `wy` crosses into the LED section, so the film's base diameter steps up
   smoothly where the strip begins.
2. **Chip bumps.** For each vertex, `dAcross`/`dAlong` measure distance (in
   the strip's local coordinates) to the nearest chip center along the
   helix. A 2D Gaussian (`A_CHIP · exp(-dAcross²) · exp(-dAlong²)`) raises
   the film directly over each LED package — this is what makes the strip's
   individual chips readable through the wrap.
3. **Strip ridge.** A second, wider Gaussian in `dAcross` alone
   (`A_RIDGE`) raises the film along the strip's whole centerline, independent
   of chip position — the continuous ridge visible between bumps.
4. **Wrinkle noise.** Two overlapping sine fields (different frequencies in
   `wy` and `θ`) simulate the film's characteristic creasing, scaled by
   `dipness` (stronger off the strip's centerline, where the film isn't
   pinned taut) and by `gather` — a Gaussian in `(1 - endT)` that multiplies
   wrinkle amplitude up to 4.2× near the top cut, where real shrink film
   bunches as it's heat-sealed.
5. **Coil bulges.** Below the connector, `nC` counts helix turns of the
   *cable* coil (a separate, coarser pitch than the LED strip). Wherever a
   vertex sits near a coil wrap (`d` small), a Gaussian bulge stands the
   film off the pole, giving the cable coil's own visible ridges through
   the film.
6. **Edge tapers.** A final smoothstep pulls the radius down to
   `R_POLE + 0.0035` as `wy` approaches the film's bottom cut, so the wrap
   reads as heat-shrunk tight to the pole at its open end rather than
   ending in a hard-edged tube.

The `pattern === "off"` state doesn't touch this displacement — it only
swaps the material from near-invisible clear film (`opacity 0.10`,
`roughness 0.04`) to a murky frosted white (`opacity 0.52`, `roughness
0.22`) and lifts the studio lights, matching an unlit product shot.

## Fold hierarchy and rope curve

The whip is three shock-corded tent-pole segments: the LED pole (fixed),
`seg2` (middle pole, pivoting at the top joint), and `seg3` (sleeve +
bottom pole + tip, nested inside `seg2` and pivoting at the lower joint).
Nesting `seg3` inside `seg2` means folding one segment carries the other
along for free — exactly like a real telescoping pole.

`folded` drives a single eased progress value `foldU ∈ [0, 1]` (`easeIO`,
a cubic in/out). `applyFold(e)` splits `e` into two half-length phases —
`seg3` drops out of its sleeve and swings first (`e ∈ [0, 0.5]`), then
`seg2` does the same relative to the top joint (`e ∈ [0.5, 1]`) — so the
two joints never open simultaneously, matching how you'd actually
disassemble one.

The braided shock cord across each open joint is rebuilt every frame from
the two joint sockets' *current world positions* (via `Object3D.localToWorld`,
which self-updates the matrix chain), not from the fold progress directly —
this is what makes the cord track the whip's idle sway correctly instead of
drifting out of sync. Each cord is one smooth curve: straight lead-outs
from each socket, joined by a single cubic Bézier whose control handles
extend along the sockets' own axes (continuous curvature, no visible
kinks), with a slight downward droop on the handles for gravity. The cord
mesh is hidden whenever the two sockets are closer than 7cm apart — i.e.
resting, unfolded.

## Instancing counts

Everything that repeats along the strip is one `InstancedMesh`, sized to
the length-dependent `COUNT` (see table above, using 48in as reference):

| mesh                 | instances     | purpose                              |
| --------------------- | -------------- | ------------------------------------ |
| `shells`               | `COUNT` (365)  | white LED package body               |
| `dies`                 | `COUNT` (365)  | small colored die disc, per-instance color |
| `glows`                | `COUNT` (365)  | tight additive halo, per-instance color |
| `glows2`               | `COUNT` (365)  | wide, dim additive halo, per-instance color |
| `pads`                 | `COUNT × 2`    | copper solder pads flanking each gap |
| `comps`                | `COUNT` (365)  | small silver passive component       |

The continuous strip ribbon and its seam line, and the shrink-wrap
membrane, are each a single non-instanced `BufferGeometry` — a strip or
sleeve reads as one unbroken surface, so instancing per-segment would only
add seams.

## Frosted vs. clear film states

| pattern       | film opacity | film roughness | clearcoat roughness | film color | lights                    |
| ------------- | ------------ | --------------- | -------------------- | ---------- | -------------------------- |
| lit (any pattern) | 0.10     | 0.04            | 0.06                  | white      | ambient 0.25 / key 0.55 / rim 0.5 |
| `"off"`       | 0.52         | 0.22            | 0.25                  | `#eff1f4`  | ambient 0.8 / key 1.3 / rim 0.9   |

The lit state keeps the film nearly invisible with a tight clearcoat, so
the LEDs and the strip's own detail read through it. The `"off"` state
raises opacity and roughness and desaturates toward white, so the product
still reads clearly as a physical object with no LEDs lit — and the
studio lights come up to compensate for the loss of the LEDs' own
illumination.

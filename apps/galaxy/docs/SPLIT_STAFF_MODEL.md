# Split LED Staff 3D Model

Platform: amyv-shop-stack (Galaxy SF)

## Purpose

Defines what `src/components/split-staff-3d/` is, the math it renders
from, and why it's built the way it is. Renders only, no photographs of
the physical product. This document covers the same ground as
`docs/STAFF_MODEL.md` did for the one-piece staff, in this file's own
house style.

## What this product is

A five-foot staff that unscrews into two halves at a threaded union in
the middle. Each half carries its own power bank, its own remote, its own
captive USB lead, and its own run of LEDs. It is not a variant of the
one-piece staff bolted together differently, it is a distinct physical
product with its own dev route (`/dev/split-staff`) and its own component
tree.

## Relationship to staff-3d and whip-3d

`split-staff-3d/` is a full, independent copy. It does not import from
`staff-3d/` or `whip-3d/`, and neither sibling tree was modified to
produce it. All three products share a remote pod, an LED section
construction method, and a studio lighting environment in concept, and
several of this product's own comments make clear where a part is "the
same part" as one of the siblings' (the port face layout, the captive
lead, the rubber's material). But the actual extraction into one shared
implementation that all three products import is a later task, done
deliberately, not an oversight of this one.

## Why procedural, not photogrammetry

Same reasoning as the siblings: the split staff's defining feature is two
independently addressable LED runs, each with its own remote-driven
channel, that also have to read correctly whether the halves are screwed
together or standing apart. A photogrammetry scan bakes one static unlit
mesh in one fixed pose, with no way to drive individual chips, no way to
show the joint coming apart, and every studio artifact from the scan
permanently fused into the geometry. Building the staff from its actual
construction, two helix-wound strips under shrink-wrap sleeves on a
symmetric handle stack, threaded together at the middle, gives an exact,
relightable, re-parametrizable, and explodable model instead.

## Retunable dials

Three named constants in `dimensions.ts` are expected to change once real
measurements land against the physical product. They are kept as their
own named constants rather than folded into the values they scale, so a
retune touches one line each:

| Constant   | Controls                                                        | Current value |
| ---------- | ---------------------------------------------------------------- | ------------- |
| `S`        | Scales the whole radial cross-section (pole, strip, membrane)    | 0.58          |
| `PER_TURN` | LED chips per helix turn, the strip's density                    | 5.4           |
| `POD_H`    | Remote pod height; the pod's other faces, the bracket zone it clamps to, and the sticker between the pods are all ratios of it | 0.26 |

## `mirrorY`: one set of numbers drives both ends

The single most load-bearing function in `dimensions.ts`:

```ts
export const mirrorY = (y: number) => BOT_Y + (TOP_Y - y);
```

Every dimension in this file (`HOLD_TOP`, `BR_TOP`, `COIL_TOP`, `POLE_TOP`,
the LED section bounds, and so on) is written once, for the upper half.
The lower half's equivalent is always `mirrorY(that same constant)`,
computed at the use site, never re-derived or given its own named
constant. This is deliberate: a single physical assembly (battery, holder,
bracket, coil, splice, LED run) is described once and reused at both
ends, so a retune of any of those numbers automatically stays correct at
both ends. Component props that need "which end" information take a
`dir: 1 | -1` (upper is `+1`) and compute their own local
`Y = (v) => dir > 0 ? v : mirrorY(v)` from it, matching the prototype's
own per-end closure.

`JOINT_Y`, the parting plane, is derived as `(BOT_Y + TOP_Y) / 2` rather
than typed in as `0`. It lands at zero because the joint band is
symmetric about the parting plane by construction, not because zero is
hardcoded.

## The threaded union

`JointLower.tsx` and `JointUpper.tsx` build the two halves of the joint:
a male spigot with helical threads, a frosted inner sleeve, a hex collar,
and a sticker sleeve carrying a plain white label on the lower half; a
female socket (open, double-sided, so the bore reads correctly) and a
plain slip coupling on the upper half. Every position in both files is
written from `JOINT_Y`, so the parting plane is one number: move it, and
both halves' geometry moves with it.

The yellow "Galaxy SF" handle sticker (`BracketTube.tsx`, `sticker`
prop) lives only on the upper bracket. The lower bracket is a plain tube:
the cap now rides on the lower battery, and the joint's own white label
carries the branding at that end instead.

## Each run is a whole number of strip turns

`dimensions.ts` rounds the LED section's turn count before deriving the
section bounds:

```ts
const SEC_TURNS_ROUNDED = Math.round((SEC_TOP - 0.175) / PITCH);
export const HALF_BAND = SEC_TOP - SEC_TURNS_ROUNDED * PITCH;
```

That rounding is what makes both section ends present helix angle zero to
their own coil, which is what lets a single turn count give an identical
short splice at both ends, with the leads landing on the strip's actual
end rather than up to a turn short of it. The joint band (`HALF_BAND`)
absorbs the rounding error, not the strip. Replacing the rounded value
with the unrounded ratio would reintroduce that gap.

## Coil handedness mirrors with the heights

`CoilAndSplice.tsx` computes the coil's winding direction as
`cd = COIL_DIR * dir`, not a fixed `COIL_DIR`. The strip's helix angle
rises with height at both ends, so the battery end's strip arrives at its
top from one side while the foot end's strip departs its bottom toward
the other. Winding both coils the same way (dropping the `* dir`) makes
the foot end's splice leads lie back over the strip instead of continuing
it, since the two ends are mirror images of each other, not translations.

The splice sweep (`dA` in `CoilAndSplice.tsx`) is computed as
`cd * (1 - (COIL_TURNS % 1)) * Math.PI * 2`, not as a separate constant.
`COIL_TURNS` (2.9) sets both how many wraps of cord there are AND, via its
fractional part, how far round the pole the splice leads travel: a sweep
of `(1 - .9) = .1` of a turn, 36 degrees. These are deliberately the same
number: the whole-turns part of `COIL_TURNS` is the coil's wrap count, the
fractional part is the sweep, and re-tuning one without the other breaks
the relationship the geometry depends on.

## The eject animation, at both ends

`BatteryEjectEnd.tsx` runs the one-piece staff's three-phase eject move
(lift, swing, drop, each on its own `clampP` window, deliberately not
sharing a parameter) independently at each end, in that end's own local
frame (`Y`, `base = dir > 0 ? 0 : Math.PI`). It is rendered once per half.
Both instances ease their own local `ejectT` ref from the same `ejected`
prop, using the same deterministic per-frame step, so the two ends stay
in lockstep without sharing any state, the same way the two
`LedInstances` paint their patterns from a shared prop without a shared
ref.

The captive lead's cord (`buildLeadCurve` in `BatteryEjectEnd.tsx`) is
built entirely in that end's own local frame: `exit`/`az` come straight
from the plug group's own `position`/`rotation.z`, not from a
world-space round trip. The plug is a direct child of the same group the
cable mesh is a child of, so its own position and z-rotation already are
the frame the cable curve needs. Converting to world space and back would
apply that group's transform twice, throwing the cord hundreds of
millimetres off once the halves separate, and the lower end would also
pick up its static 180 degree base rotation a second time.

## The exploded view

`SplitStaffModel.tsx` owns a `root` group holding the upper half's own
group (`staff`) and a pivot rig (`lowerRig`) that wraps the lower half's
group (`lower`). `lower` sits offset by `+EX_HALF_PIVOT` inside
`lowerRig`, which itself starts offset by `-EX_HALF_PIVOT`, so the two
cancel out and the assembly reads as one piece until the explode moves
them.

Exploding runs four phases, all on independent `clampP` windows:

1. **Lift** the upper half straight up off the threaded spigot. Nothing
   rotates here: the halves screw together, so separating them along the
   axis is what actually happens.
2. **Step aside**, moving the upper half out of the way horizontally.
3. **Turn the lower half over**, by rotating `lowerRig`, not `lower`
   directly, so the half spins about its own centre rather than sweeping
   a multi-unit arc through everything else on the way round.
4. **Settle**, both halves ending centred and standing vertically side by
   side over the same span of height, the lower half rising as the upper
   comes down so the pair doesn't end up sitting in the bottom of the
   frame.

Sharing one parameter between the turn and the drop (phases 3 and 4)
sweeps the lower half's far end back through the upper half on the way
round, the same failure mode the eject animation avoids by keeping lift,
swing, and drop on separate windows.

## Instancing, patterns, and everything else shared with staff-3d

The helix-basis math (`makeHelixBasis`), the strip ribbon and seam
builder, the strip circuitry (pads and components), the LED instancing
(shells, dies, glows, glows2), and the pattern set (`rainbow`, `comet`,
`pulse`, `galaxy`, `mirror`, `off`, painted by a *global* t spanning both
halves' sections continuously) are identical in method to the one-piece
staff's, independently tuned constants where the two products' physical
parts differ (pole radius, remote size, coil turns). See
`docs/STAFF_MODEL.md`'s equivalent sections for the shared reasoning; it
isn't repeated here.

The one meaningful difference is the membrane's coil-seal math
(`Membrane.tsx`), which carries an extra `ext.dir` factor the one-piece
version doesn't need, since the one-piece staff only ever seals over a
coil at the top of its single LED run. Here, `ext.dir` says which end of
THIS section the coil sits past (`+1` for the upper section's battery
end, `-1` for the lower section's foot end), so the detail envelope and
the coil bulge reach toward the correct side on each half.

## Palette module

`palette.ts` collects every material color (numeric `0xRRGGBB` three.js
literals) and every canvas-drawing color (CSS hex strings used inside
`textures.ts`) the split staff uses, each as a named constant, the same
deliberate exception to "no hardcoded hex in `.tsx`" that `staff-3d/`
documents. Colors that happen to match a sibling tree's value (the handle
white, the rubber black) are independently named here, not imported, per
the "own copy" convention.

## Accessibility

- The pattern switcher is a `role="group"` of real `<button>` elements
  (`aria-label="LED pattern"`), each carrying `aria-pressed`, matching the
  siblings' dev routes.
- The two assembly toggles ("Show it apart" / "Show it together" and
  "Eject battery to charge" / "Seat battery") share a second, separate
  `role="group"` (`aria-label="Assembly"`), each its own button, labelled
  for what it does rather than what it is, and each carrying
  `aria-pressed`.
- Every button has an explicit visible focus ring
  (`focus-visible:outline-site-accent`), not just the browser default.
- The canvas has no inherent text alternative, so `SplitStaffViewer`
  renders a visually-hidden (`sr-only`) description of the physical
  object and its current pattern alongside it, and marks the `<Canvas>`
  itself `aria-hidden` so assistive tech reads the description instead of
  an unlabeled canvas.
- Under `prefers-reduced-motion`, both the explode and the eject
  animation jump straight to their target state on the next frame instead
  of easing, the same `useReducedMotion` hook the sibling trees use.
- Orbit (drag) is a supplementary way to inspect the model. Nothing about
  the product, its patterns, its geometry, its assembled/exploded or
  seated/ejected state, its description, is only reachable by dragging;
  auto-rotate provides the same ambient view without input, and disables
  under `prefers-reduced-motion` along with the idle sway and per-frame
  pattern animation.

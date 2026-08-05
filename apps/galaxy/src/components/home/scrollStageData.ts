import * as THREE from "three";
import { computeDimensions } from "@/components/whip-3d/dimensions";

/**
 * Camera choreography for HeroScrollStage, hand-tuned against the reference
 * 48in whip build. WhipModel positions its whole assembly at
 * y = WHIP_OFFSET (see whip-3d/WhipModel.tsx), so every target below is
 * expressed as a local dimension constant plus WHIP_OFFSET to land in
 * world space.
 */
const DIMS = computeDimensions("48in");

type Vec3 = [number, number, number];

/**
 * Camera position at `radius` from `target` on the horizontal circle at
 * angle `theta`, raised or lowered by `verticalOffset`. Unlike a true
 * spherical parametrization collapsed through a polar angle, offset and
 * radius are independent here on purpose: at close range (the callout
 * keyframes) a coupled polar angle turns a small vertical bias into most
 * of the frame and points the camera over the subject instead of at it.
 * Camera.lookAt each frame handles centering the target, so this only
 * needs to place the camera somewhere sensible around it.
 */
function framePos(target: Vec3, radius: number, theta: number, verticalOffset: number): Vec3 {
  return [
    target[0] + radius * Math.cos(theta),
    target[1] + verticalOffset,
    target[2] + radius * Math.sin(theta),
  ];
}

// Release is a whole-product establishing shot: target the LED pole's own
// vertical center (near BASE_Y, where it meets the folded lower assembly),
// not the whole tall folded assembly's midpoint (world y=0) -- that
// centered the crop on the plain lower poles and pushed the lit strip off
// the top of frame.
const WIDE_TARGET_Y = DIMS.BASE_Y + DIMS.WHIP_OFFSET;
const RELEASE_TARGET: Vec3 = [0, WIDE_TARGET_Y, 0];

// The hero-pose tilt (see TILT_X/TILT_Z below) is applied to the model's
// outer group, which has no position of its own -- it rotates around
// world origin, not around the strip. A point that sits far from the
// origin (the strip does, at world y around 5) swings sideways and drops
// noticeably once rotated, so the untilted coordinates below aren't where
// the strip actually ends up on screen. HERO_TARGET is computed from the
// rotated position instead of the raw local one so the camera's lookAt
// tracks where the tilted strip really is.
export const TILT_X = THREE.MathUtils.degToRad(6);
export const TILT_Z = THREE.MathUtils.degToRad(48);
const HERO_TILT_EULER = new THREE.Euler(TILT_X, 0, TILT_Z, "XYZ");

// Camera.lookAt always centers this point in frame, so it's what decides
// how much of the strip's own length ends up above vs below center on
// screen. Near the bottom of the lit strip (rather than its midpoint)
// leaves most of the strip's length above the crossing point, which is
// what lets the top end reach the viewport's top edge instead of leaving
// a dead gap there with the cap visible.
const HERO_LED_TARGET_Y = DIMS.ledStartY + DIMS.SPAN * 0.0 + DIMS.WHIP_OFFSET;
const HERO_STRIP_CENTER = new THREE.Vector3(0, HERO_LED_TARGET_Y, 0).applyEuler(HERO_TILT_EULER);
// Small extra lateral push, on top of whatever sideways swing the tilt
// itself already added above, so the beam crosses behind the letters of
// GALAXY near the viewport's horizontal center rather than the gap
// between the two words.
const HERO_TARGET_X_PUSH = -0.3;
const HERO_TARGET: Vec3 = [
  HERO_STRIP_CENTER.x + HERO_TARGET_X_PUSH,
  HERO_STRIP_CENTER.y,
  HERO_STRIP_CENTER.z,
];

// Upper third of the LED strip -- membrane highlights gather tightest near
// ledEndY, but "upper third" per spec is the region's midpoint, not the tip.
const MEMBRANE_TARGET: Vec3 = [0, DIMS.ledEndY - DIMS.SPAN / 6 + DIMS.WHIP_OFFSET, 0];
// Midpoint of the LED helix.
const LED_TARGET: Vec3 = [0, (DIMS.ledStartY + DIMS.ledEndY) / 2 + DIMS.WHIP_OFFSET, 0];
// The power cable runs from the coil down the first folded pole segment
// (see whip-3d/lower-assembly/LowerAssembly.tsx: seg2 spans
// BASE_Y..BASE_Y-POLE_LEN, then the ferrule sits at its foot) before
// reaching the remote pod and continuing to the ferrule joint -- the
// remote itself sits roughly at that pole's foot, just above the ferrule.
const REMOTE_TARGET: Vec3 = [
  0.15,
  DIMS.BASE_Y - DIMS.POLE_LEN + DIMS.FERRULE_H / 2 + DIMS.WHIP_OFFSET,
  0.05,
];

export interface CameraKeyframe {
  t: number;
  pos: Vec3;
  target: Vec3;
}

// Release is the wide establishing shot: same angle/elevation family as
// the pre-tilt hero framing used to share. Hero has its own, much closer
// radius and elevation so the tilted strip's full run bleeds off the
// viewport edges instead of sitting centered with dark space around it
// (see applyAspectPullback below for how this holds up on narrow
// viewports, where it can't bleed both top and bottom at once).
const WIDE_THETA = 0.6;
const WIDE_VOFFSET = 1.2;
const RELEASE_RADIUS = 14;

const HERO_THETA = 0.6;
const HERO_VOFFSET = 0.6;
const HERO_RADIUS = 5.5;

/** Progress stops driving the camera timeline; also used by heroPresence. */
export const HERO_HOLD_END = 0.2; // headline + tilt hold through here
export const TILT_OUT_END = 0.36; // camera arrives at callout 1, tilt eased to 0
const K1_HOLD_END = 0.44;
const K2_START = 0.56;
const K2_HOLD_END = 0.64;
const K3_START = 0.76;
export const TILT_IN_START = 0.82; // last close-up ends, pull-back + tilt restore begins
export const TILT_IN_END = 0.97; // pull-back complete, release framing settled

// Close-up radii are pulled back enough that each subject reads at roughly
// half to two thirds of the frame with dark space around it, not edge to
// edge. Callout 2 stays the tightest of the three (chips resolve
// individually) but still keeps the strip in context rather than filling
// the viewport.
const HERO_POS = framePos(HERO_TARGET, HERO_RADIUS, HERO_THETA, HERO_VOFFSET);
const MEMBRANE_POS = framePos(MEMBRANE_TARGET, 3.0, 1.1, 0.15);
const LED_POS = framePos(LED_TARGET, 2.4, 0.3, 0.1);
const REMOTE_POS = framePos(REMOTE_TARGET, 2.0, 2.0, 0.15);
const RELEASE_POS = framePos(RELEASE_TARGET, RELEASE_RADIUS, WIDE_THETA, WIDE_VOFFSET);

/** Ordered camera stops the rig lerps through as scroll progress advances 0..1. */
export const KEYFRAMES: CameraKeyframe[] = [
  { t: 0.0, pos: HERO_POS, target: HERO_TARGET },
  { t: HERO_HOLD_END, pos: HERO_POS, target: HERO_TARGET },
  { t: TILT_OUT_END, pos: MEMBRANE_POS, target: MEMBRANE_TARGET },
  { t: K1_HOLD_END, pos: MEMBRANE_POS, target: MEMBRANE_TARGET },
  { t: K2_START, pos: LED_POS, target: LED_TARGET },
  { t: K2_HOLD_END, pos: LED_POS, target: LED_TARGET },
  { t: K3_START, pos: REMOTE_POS, target: REMOTE_TARGET },
  { t: TILT_IN_START, pos: REMOTE_POS, target: REMOTE_TARGET },
  { t: TILT_IN_END, pos: RELEASE_POS, target: RELEASE_TARGET },
  { t: 1.0, pos: RELEASE_POS, target: RELEASE_TARGET },
];

/** Static framing used for the prefers-reduced-motion fallback (no rig, no pin). */
export const STATIC_POSE: CameraKeyframe = KEYFRAMES[0];

export const smoothstep = (t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/** Writes the lerped camera pose for `progress` into the given scratch vectors. */
export function poseAt(progress: number, outPos: THREE.Vector3, outTarget: THREE.Vector3): void {
  const kfs = KEYFRAMES;
  let i = 0;
  while (i < kfs.length - 2 && progress > kfs[i + 1].t) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const span = b.t - a.t;
  const eased = smoothstep(span > 0 ? (progress - a.t) / span : 0);

  outPos.set(
    a.pos[0] + (b.pos[0] - a.pos[0]) * eased,
    a.pos[1] + (b.pos[1] - a.pos[1]) * eased,
    a.pos[2] + (b.pos[2] - a.pos[2]) * eased
  );
  outTarget.set(
    a.target[0] + (b.target[0] - a.target[0]) * eased,
    a.target[1] + (b.target[1] - a.target[1]) * eased,
    a.target[2] + (b.target[2] - a.target[2]) * eased
  );
}

// Three.js's `fov` is the VERTICAL field of view, so horizontal coverage
// shrinks a lot on a narrow portrait viewport even though vertical framing
// stays the same. The hero radius above was tuned against a landscape
// reference; on a narrower viewport the steep tilt swings the strip mostly
// outside that narrower horizontal cone, so it barely shows at all. Pulling
// the camera back along the same target-to-camera line (same crossing
// point, same angle, just farther away) restores enough horizontal
// coverage to keep the strip in frame.
//
// A full linear correction (matching the aspect ratio exactly) overcorrects:
// it also shrinks the strip's apparent vertical length, reopening a gap at
// both ends instead of just the horizontal one. There's no setting that
// gets both -- a 30-40 degree diagonal cannot span full viewport height
// while also staying within a portrait-narrow width (tan(30deg) alone
// already exceeds a typical phone's aspect ratio), so full top-and-bottom
// bleed is only achievable in landscape. The square root keeps the angle
// requirement (the actual acceptance test) intact and lets the strip stay
// large enough to still read as a dramatic corner-to-corner beam behind the
// headline, at the cost of exiting a side edge rather than the bottom one
// on narrow viewports.
const REFERENCE_ASPECT = 1440 / 900;

/** Writes an aspect-corrected camera position into `outPos`, pulling back on narrow viewports. */
export function applyAspectPullback(
  outPos: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number,
  weight: number
): void {
  const stretch = Math.max(1, Math.sqrt(REFERENCE_ASPECT / aspect));
  const pullBack = 1 + (stretch - 1) * weight;
  if (pullBack === 1) return;
  outPos.sub(target).multiplyScalar(pullBack).add(target);
}

/**
 * 1 through the hero hold, eases to 0 as the camera departs for the first
 * close-up, stays 0 through all three close-ups, eases back to 1 as the
 * camera pulls back to the release shot. Drives the model tilt so it reads
 * as a hero-pose trait that steps aside for the close-ups (the strip reads
 * vertical) and returns for the release.
 */
export function heroPresence(progress: number): number {
  if (progress <= HERO_HOLD_END) return 1;
  if (progress < TILT_OUT_END) {
    return 1 - smoothstep((progress - HERO_HOLD_END) / (TILT_OUT_END - HERO_HOLD_END));
  }
  if (progress <= TILT_IN_START) return 0;
  if (progress < TILT_IN_END) {
    return smoothstep((progress - TILT_IN_START) / (TILT_IN_END - TILT_IN_START));
  }
  return 1;
}

export interface CalloutWindow {
  fadeInStart: number;
  fadeInEnd: number;
  fadeOutStart: number;
  fadeOutEnd: number;
}

export interface Callout {
  id: string;
  heading: string;
  body: string;
  window: CalloutWindow;
  /** Viewport-percentage box position, tuned against the matching keyframe pose. */
  style: { top?: string; bottom?: string; left?: string; right?: string };
  /** Arrow line from the callout box toward the model region, tuned per position. */
  arrow: { rotate: string; origin: string };
}

export const CALLOUTS: Callout[] = [
  {
    id: "membrane",
    heading: "Sealed shrink wrap",
    body: "Rain and dust can't get in.",
    window: { fadeInStart: 0.28, fadeInEnd: 0.35, fadeOutStart: 0.41, fadeOutEnd: 0.47 },
    style: { top: "16%", right: "6%" },
    arrow: { rotate: "135deg", origin: "top right" },
  },
  {
    id: "led-strip",
    heading: "Remote-controlled colors",
    body: "Set the vibe from your pocket.",
    window: { fadeInStart: 0.48, fadeInEnd: 0.55, fadeOutStart: 0.61, fadeOutEnd: 0.67 },
    style: { top: "46%", left: "6%" },
    arrow: { rotate: "-45deg", origin: "top left" },
  },
  {
    id: "remote",
    heading: "Rechargeable battery",
    body: "Charge it like your phone.",
    // Shortened so it's fully gone well before the pull-back reaches the
    // release shot at TILT_IN_END -- the user should never see the wide
    // release shot arrive under lingering close-up copy.
    window: { fadeInStart: 0.69, fadeInEnd: 0.76, fadeOutStart: 0.8, fadeOutEnd: 0.84 },
    style: { bottom: "16%", right: "6%" },
    arrow: { rotate: "-135deg", origin: "bottom right" },
  },
];

export function windowOpacity(progress: number, w: CalloutWindow): number {
  if (progress <= w.fadeInStart || progress >= w.fadeOutEnd) return 0;
  if (progress < w.fadeInEnd) {
    return smoothstep((progress - w.fadeInStart) / (w.fadeInEnd - w.fadeInStart));
  }
  if (progress < w.fadeOutStart) return 1;
  return 1 - smoothstep((progress - w.fadeOutStart) / (w.fadeOutEnd - w.fadeOutStart));
}

const HEADLINE_FADE_END = 0.27;

/** Hero headline block: fully visible through the hold, fades out as the pan begins. */
export function headlineOpacity(progress: number): number {
  if (progress <= HERO_HOLD_END) return 1;
  if (progress >= HEADLINE_FADE_END) return 0;
  return 1 - smoothstep((progress - HERO_HOLD_END) / (HEADLINE_FADE_END - HERO_HOLD_END));
}

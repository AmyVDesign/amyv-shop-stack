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

// Wide shots target the LED pole's own vertical center (near BASE_Y, where
// it meets the folded lower assembly), not the whole tall folded
// assembly's midpoint (world y=0) -- that centered the crop on the plain
// lower poles and pushed the lit strip off the top of frame.
const WIDE_TARGET_Y = DIMS.BASE_Y + DIMS.WHIP_OFFSET;
// Behind and to the right of the centered headline overlay: look slightly
// left of the model's true (x=0) center so the model renders right-of-center.
const HERO_TARGET: Vec3 = [-1.4, WIDE_TARGET_Y, 0];
const RELEASE_TARGET: Vec3 = [0, WIDE_TARGET_Y, 0];

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

// Wide establishing shot: same radius/angle family for hero and release,
// just recentered (hero looks off-center to clear the headline; release
// looks dead-on since nothing needs to be dodged once the stage releases).
const WIDE_THETA = 0.6;
const WIDE_VOFFSET = 1.2;
const HERO_RADIUS = 12;
const RELEASE_RADIUS = 14;

/** Progress stops driving the camera timeline; also used by heroPresence. */
export const HERO_HOLD_END = 0.2; // headline + tilt hold through here
export const TILT_OUT_END = 0.36; // camera arrives at callout 1, tilt eased to 0
const K1_HOLD_END = 0.44;
const K2_START = 0.56;
const K2_HOLD_END = 0.64;
const K3_START = 0.76;
export const TILT_IN_START = 0.82; // last close-up ends, pull-back + tilt restore begins
export const TILT_IN_END = 0.97; // pull-back complete, release framing settled

const HERO_POS = framePos(HERO_TARGET, HERO_RADIUS, WIDE_THETA, WIDE_VOFFSET);
const MEMBRANE_POS = framePos(MEMBRANE_TARGET, 2.0, 1.1, 0.15);
const LED_POS = framePos(LED_TARGET, 1.3, 0.3, 0.1);
const REMOTE_POS = framePos(REMOTE_TARGET, 1.5, 2.0, 0.15);
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

const HERO_ROTATE_SPEED = 0.12; // rad/sec, y-axis spin during the hero hold only

export const TILT_X = THREE.MathUtils.degToRad(4);
export const TILT_Z = THREE.MathUtils.degToRad(10);
export const BOB_AMPLITUDE = 0.08;
export const BOB_ANGULAR_FREQ = (2 * Math.PI) / 4; // ~4s period

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

export function heroRotationDelta(progress: number, delta: number): number {
  return progress < HERO_HOLD_END ? delta * HERO_ROTATE_SPEED : 0;
}

/**
 * 1 through the hero hold, eases to 0 as the camera departs for the first
 * close-up, stays 0 through all three close-ups, eases back to 1 as the
 * camera pulls back to the release shot. Drives the model tilt and float
 * so both read as a hero-pose trait that steps aside for the close-ups and
 * returns for the release, not a constant background wobble.
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

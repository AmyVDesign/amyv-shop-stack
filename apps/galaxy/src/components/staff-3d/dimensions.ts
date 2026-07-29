import * as THREE from "three";

/**
 * Own copy of the whip's helix-basis approach, ported fresh from the staff
 * prototype (`led-staff-v21.html`). Every constant below is copied from the
 * prototype's own derivation, not re-derived, where the prototype computes
 * a number from another number, this file keeps that relationship rather
 * than folding it into a literal.
 *
 * Three retunable dials, kept as their own named constants per the
 * prototype's own comments (do not inline these into the values they
 * scale, they are expected to change once real measurements land):
 *   - S: scales the whole radial cross-section (pole, strip, membrane).
 *   - PER_TURN: LED chips per helix turn (density of the strip).
 *   - POD_H: remote pod height; the pod's other faces, the bracket zone it
 *     clamps to, and the sticker between the pods are all ratios of it.
 */

// A staff is thicker and longer than the whip: one solid pole, LED section
// mirrored down both halves is NOT used here (the prototype builds a single
// continuous section under the handle), grip in the middle, domed ends.
export const STAFF_H = 7.0;
export const TOP_Y = STAFF_H / 2;
export const BOT_Y = -STAFF_H / 2;

/**
 * S slims the whole LED cross-section. The battery measures 24mm on the
 * macro and the strip reads just under that beside it, so the finished
 * section is ~24.5mm rather than the 42mm it was. Every radial constant
 * below carries S; axial ones do not.
 */
export const S = 0.58;
/** LED chips per helix turn, the strip's density dial. */
export const PER_TURN = 5.4;
/**
 * The one dial for the remote. The pill's other faces, the bracket zone it
 * clamps to, and the sticker between the pods are all ratios of it, so
 * resizing the remote keeps that whole band in step.
 */
export const POD_H = 0.39; // was .44

export const R_POLE = 0.073 * S; // ~25mm tube
export const STRIP_W = 0.075 * S;
export const PITCH = STRIP_W * 1.08;
export const R_WRAP = R_POLE + 0.014 * S;

// ── Handle stack, derived top down ──
// Proportions taken off the macro: the power bank stands proud by ~3.87 of
// its own diameters, and the holder is roughly 0.8 of that. The LED section
// starts immediately under the cable mouth, which is what lets the splice
// leads run horizontally.
export const BAT_R = 0.0551; // 24mm power bank, a bought part, not scaled by S
export const BAT_H = 1.05;
export const HOLD_R = BAT_R * 1.32;
export const BR_R = HOLD_R * 0.94;
export const BAT_PROUD = BAT_R * 2 * 3.87; // proud length, in its own diameters
export const HOLD_TOP = TOP_Y - BAT_PROUD;
export const HOLD_H = 0.34;

export const POD_W = POD_H * 0.398;
export const POD_D = POD_H * 0.114;
export const POD_RAD = POD_H * 0.102;
export const BR_H = POD_H * 1.25;
export const BR_TOP = HOLD_TOP - HOLD_H;
export const COIL_TOP = BR_TOP - BR_H - 0.05;

// Moulded strain relief where the cable leaves the pod.
export const BOSS_LEN = 0.042;
export const BOSS_LAP = 0.007;

/**
 * COIL_DIR sets the winding handedness. It is negative so the cable is
 * already travelling the way the leads need to go when it reaches the
 * mouth, which lets them run straight out of the jacket.
 */
export const COIL_DIR = -1;
export const COIL_PITCH = 0.034 * S;
/**
 * TRAP: this fraction depends on BR_H and COIL_PITCH, it is not a free
 * parameter. It parks the coil's mouth 75 degrees off the strip's top end,
 * which is what lets the splice leads run straight out of the jacket
 * instead of doubling back. If POD_H (and so BR_H) or COIL_PITCH changes,
 * re-solve this value against the new geometry, do not round it to the
 * nearest whole turn, or the splice leads stop meeting the strip where
 * they should.
 */
export const COIL_TURNS = 9.681;
export const COIL_BOT = COIL_TOP - COIL_TURNS * COIL_PITCH;

// ONE continuous LED section: from below the splice to the foot.
export const SEC_BOT = BOT_Y + 0.4;
export const SEC_TOP = COIL_BOT - 0.026;
export const SEC_SPAN = SEC_TOP - SEC_BOT;
export const SEC_TURNS = SEC_SPAN / PITCH;
export const SEC_COUNT = Math.floor(SEC_TURNS * PER_TURN);
const HELIX_LEN_PER_TURN = Math.sqrt(Math.pow(Math.PI * 2 * R_WRAP, 2) + PITCH * PITCH);
export const SEC_CHIP_ARC = HELIX_LEN_PER_TURN / PER_TURN;

// The membrane must seal over the whole cable coil too, up to just past its
// open mouth.
export const SEC_TOP_EXT_Y = COIL_TOP + 0.06;

// ── Rubber foot ──
export const BELL_TOP = BOT_Y + 0.26;
export const COLLAR_TOP = SEC_BOT - 0.03;
export const COLLAR_H = COLLAR_TOP - BELL_TOP + 0.02; // .02 overlap into the bell

/** Bundled the same way whip-3d's WhipDimensions is, so the LED-section components take one `dims` prop each, matching that convention. */
export const LED_SECTION = {
  y0: SEC_BOT,
  y1: SEC_TOP,
  span: SEC_SPAN,
  turns: SEC_TURNS,
  count: SEC_COUNT,
  chipArc: SEC_CHIP_ARC,
  topExtY: SEC_TOP_EXT_Y,
} as const;
export type LedSectionDims = typeof LED_SECTION;

export interface HelixBasis {
  a: number;
  y: number;
  outward: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
}

/** Point/frame along the LED section's helix at t in [0, 1] (y0 to y1). */
export function makeHelixBasis(y0: number, span: number, turns: number) {
  return function helixBasis(t: number): HelixBasis {
    const a = t * turns * Math.PI * 2;
    const y = y0 + t * span;
    const outward = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const tangent = new THREE.Vector3(
      -Math.sin(a) * R_WRAP,
      PITCH / (Math.PI * 2),
      Math.cos(a) * R_WRAP
    ).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, outward).normalize();
    return { a, y, outward, tangent, side };
  };
}

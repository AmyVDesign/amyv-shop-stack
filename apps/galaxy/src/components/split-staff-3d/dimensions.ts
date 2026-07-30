import * as THREE from "three";

/**
 * Own copy, ported fresh from the split-staff prototype
 * (`led-staff-split-v11.html`), not shared with `staff-3d/` or `whip-3d/`.
 * Every constant below is copied from the prototype's own derivation, not
 * re-derived: where the prototype computes a number from another number,
 * this file keeps that relationship rather than folding it into a literal.
 *
 * This product is the one-piece staff unscrewed into two halves at a
 * threaded union. `mirrorY()` is the single source of truth for the lower
 * half: it maps any height on the upper half to its mirror image, so one
 * set of numbers (all written "upper", i.e. dir = +1) drives both ends.
 * Do not give the lower end its own constants.
 *
 * Three retunable dials, kept as their own named constants because they
 * are still set from photographs rather than measurements and are
 * expected to change:
 *   - S: scales the whole radial cross-section (pole, strip, membrane).
 *   - PER_TURN: LED chips per helix turn (density of the strip).
 *   - POD_H: remote pod height; the pod's other faces, the bracket zone it
 *     clamps to, and the sticker between the pods are all ratios of it.
 */

export const STAFF_H = 7.0;
export const TOP_Y = STAFF_H / 2;
export const BOT_Y = -STAFF_H / 2;

/** S slims the whole LED cross-section; every radial constant below carries it, axial ones do not. */
export const S = 0.58;
/** LED chips per helix turn, the strip's density dial. */
export const PER_TURN = 5.4;
/** The one dial for the remote; the pill's other faces, the bracket zone, and the sticker are all ratios of it. */
export const POD_H = 0.26; // was .39, remotes are smaller

export const R_POLE = 0.073 * S; // ~25mm tube
export const STRIP_W = 0.075 * S;
export const PITCH = STRIP_W * 1.08;
export const R_WRAP = R_POLE + 0.014 * S;

// ── Handle stack, derived top down ──
export const BAT_R = 0.0551; // 24mm power bank, a bought part, not scaled by S
export const HOLD_R = BAT_R * 1.32;
export const BR_R = HOLD_R * 0.94;
export const BAT_PROUD = BAT_R * 2 * 3.87; // proud length, in its own diameters
/**
 * One end assembly, used at BOTH ends. Sizes read off the macro with the
 * 24mm battery as the ruler: 59mm cap sitting 18mm past the tube end,
 * 52mm of tube showing, then a 52mm coupling.
 */
export const CAP_H2 = 0.27;
export const CAP_LAP = 0.082;
export const CAP_R = R_POLE * 2.07;
export const HOLD_TOP = TOP_Y - CAP_LAP - BAT_PROUD;
export const HOLD_H = 0.239; // was .34, too long

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
 * COIL_DIR sets the winding handedness (same sense as the one-piece
 * staff). It is combined with the per-end `dir` at each use site as
 * `cd = COIL_DIR * dir`: the coil's handedness mirrors along with the
 * heights. The strip's helix angle rises with height at both ends, so the
 * battery end's strip arrives at its top from one side while the foot
 * end's departs its bottom toward the other. Winding both coils the same
 * way makes the foot end's splice leads lie back over the strip instead
 * of continuing it. Do not drop the `* dir`.
 */
export const COIL_DIR = -1;
export const COIL_PITCH = 0.034 * S;
/**
 * The fraction on COIL_TURNS is what sets how far round the pole the
 * splice leads travel: sweep = (1 - frac) of a turn. .90 gives 36 degrees.
 * This is not a separate constant from the sweep: the whole number sets
 * how many wraps of cord there are and the fraction sets the sweep, and
 * they are deliberately the same number (see `dA` at each coil/splice use
 * site).
 */
export const COIL_TURNS = 2.9;
export const COIL_BOT = COIL_TOP - COIL_TURNS * COIL_PITCH;

// ── The joint ──
// A threaded union at JOINT_Y. The lower half carries a male threaded
// spigot pointing up, a hex collar under it and a sleeve with the sticker.
// The upper half carries the female socket that screws down over it, with
// a plain slip coupling above. JOINT_Y is the parting plane, so moving it
// moves everything on both sides.
export const SPIG_R = R_POLE * 1.3; // male threads
export const HEX_R = R_POLE * 1.72; // collar under them
export const SLV_R = R_POLE * 1.66; // sticker sleeve
export const SOCK_R = R_POLE * 1.72; // female socket
export const COUP_R = R_POLE * 1.66; // plain slip coupling

/**
 * Maps any height on the upper half to its opposite number. This is the
 * single source of truth for the lower half: do not give the lower end
 * its own constants, use `mirrorY` at the use site instead.
 */
export const mirrorY = (y: number) => BOT_Y + (TOP_Y - y);

export const SEC_TOP = COIL_BOT - 0.026;
export const SEC_BOT = mirrorY(SEC_TOP); // a true mirror, coil gap and all

/**
 * Each run is a WHOLE number of strip turns. That makes both sections
 * present the same angle to their own coil, which is what lets one turn
 * count give a short, identical splice at both ends, and it means the
 * leads can land on the section's actual end rather than up to a turn
 * short of it. The joint band absorbs the rounding, and lands within 2mm
 * of the macro. Do not replace the rounding with the unrounded ratio.
 */
const SEC_TURNS_ROUNDED = Math.round((SEC_TOP - 0.175) / PITCH);
export const HALF_BAND = SEC_TOP - SEC_TURNS_ROUNDED * PITCH;
/**
 * The joint band is symmetric about the parting plane, so this lands at
 * zero, but it is derived (not typed in) so that stays true if the band
 * geometry above ever changes.
 */
export const JOINT_Y = (BOT_Y + TOP_Y) / 2;

export const SOCK_H = HALF_BAND * 0.57;
export const COUP_H = HALF_BAND * 0.43;
export const HEX_H = HALF_BAND * 0.28;
export const SLV_H = HALF_BAND * 0.72;
export const SPIG_H = HALF_BAND * 0.44; // must stay inside the socket

export const UPPER_SEC_BOT = HALF_BAND;
export const LOWER_SEC_TOP = -HALF_BAND;

// ── LED sections ──
// Both sections share one span (SEC_TOP - UPPER_SEC_BOT, a whole number of
// strip turns by construction, see SEC_TURNS_ROUNDED above), so span/turns/
// count/chipArc are computed once and reused for both, matching "one set
// of numbers drives both ends."
export const SEC_SPAN = SEC_TOP - UPPER_SEC_BOT;
export const SEC_TURNS = SEC_SPAN / PITCH;
export const SEC_COUNT = Math.floor(SEC_TURNS * PER_TURN);
const HELIX_LEN_PER_TURN = Math.sqrt(Math.pow(Math.PI * 2 * R_WRAP, 2) + PITCH * PITCH);
export const SEC_CHIP_ARC = HELIX_LEN_PER_TURN / PER_TURN;

export interface LedSectionDims {
  y0: number;
  y1: number;
  span: number;
  turns: number;
  count: number;
  chipArc: number;
}

export const UPPER_LED_SECTION: LedSectionDims = {
  y0: UPPER_SEC_BOT,
  y1: SEC_TOP,
  span: SEC_SPAN,
  turns: SEC_TURNS,
  count: SEC_COUNT,
  chipArc: SEC_CHIP_ARC,
};
export const LOWER_LED_SECTION: LedSectionDims = {
  y0: SEC_BOT,
  y1: LOWER_SEC_TOP,
  span: SEC_SPAN,
  turns: SEC_TURNS,
  count: SEC_COUNT,
  chipArc: SEC_CHIP_ARC,
};

/**
 * Describes where this section's coil sits relative to it, for the
 * membrane's coil-seal bulge. `dir` says which end of the section the
 * coil sits past (+1 for the upper section's battery end, -1 for the
 * lower section's foot end), so the film can reach up on one half and
 * down on the other.
 */
export interface CoilSealExt {
  dir: 1 | -1;
  endY: number;
  coilTopY: number;
  coilPitch: number;
  coilTurns: number;
  coilDir: number;
}

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

// ── Root/half groups ──
// root holds both halves. The upper half's own group is a direct child of
// root; the lower half sits inside a pivot rig (`lowerRig`) whose only job
// is to let that half turn over about its own centre during the explode.
// lower sits half a half above lowerRig, so the two cancel out until the
// explode moves them.
export const EX_HALF_PIVOT = (TOP_Y - JOINT_Y) / 2;

// Pole. It stops short of the battery socket at each end: the tube is
// hollow up there and the battery drops into it. Both halves share one
// pole height because the socket gap is symmetric (mirrorY(POLE_TOP) to
// JOINT_Y on the lower half is the same length as JOINT_Y to POLE_TOP on
// the upper half).
export const POLE_TOP = HOLD_TOP - HOLD_H - 0.13;
export const POLE_H = POLE_TOP - JOINT_Y;

// ── Removable battery, port face, and captive lead (one end, built twice) ──
export const HANDLE_TOP = TOP_Y - CAP_LAP;
/**
 * 4.3 of its own diameters, off the loose-battery photo. It is an ordinary
 * 5000 mAh stick, so nearly all of it stands proud and the socket is only
 * about 10mm deep.
 */
export const BAT_H = BAT_R * 2 * 4.3;
export const BAT_BOT = HANDLE_TOP - BAT_H; // the port face, seated

export const OM_LEN = 0.064; // 14mm overmould
export const T_LEN = 0.055; // 12mm tongue
/** Where the cable leaves the overmould. */
export const PLUG_PIVOT_Y = BAT_BOT - T_LEN - OM_LEN;

// ── Explode ──
// Halves part upward off the spigot, step aside, then BOTH settle so they
// stand vertically beside each other over the same span of height. The
// lower half rises as the upper comes down, so the pair ends up centred
// rather than sitting in the bottom of the frame.
export const EX_LIFT = 0.45;
export const EX_SIDE = 0.3;
export const EX_HALF = (TOP_Y - JOINT_Y) / 2; // half a half, so both centre

// ── Eject, at both ends ──
// Each end works in its own frame, so the lower one reads correctly
// whether or not its half has been turned over.
export const PLUG_RISE = 0.2;
export const PLUG_TILT = 0.52;
export const EJ_SIDE = 0.3;
export const EJ_RISE = TOP_Y + 0.4 - BAT_BOT;
export const EJ_SETTLE = PLUG_PIVOT_Y + PLUG_RISE + Math.cos(PLUG_TILT) * (OM_LEN + T_LEN) - BAT_BOT;

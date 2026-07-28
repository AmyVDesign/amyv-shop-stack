import * as THREE from "three";
import type { Length } from "./types";

// Matches TotemSVG's VIEW_H ratio (280 / 390 / 500) so the three options
// read as the same relative lengths as the existing SVG configurator.
export const LENGTH_SCALE: Record<Length, number> = {
  "24in": 280 / 500,
  "36in": 390 / 500,
  "48in": 1,
};

export interface WhipDimensions {
  length: Length;
  WHIP_H: number;
  BASE_Y: number;
  TOP_Y: number;
  R_POLE: number;
  STRIP_W: number;
  PITCH: number;
  ledStartY: number;
  ledEndY: number;
  coilTopY: number;
  coilPitch: number;
  coilTurns: number;
  coilR: number;
  coilBotY: number;
  SPAN: number;
  TURNS: number;
  PER_TURN: number;
  COUNT: number;
  R_WRAP: number;
  POLE_LEN: number;
  FERRULE_H: number;
  JOINT2_DROP: number;
  helixLenPerTurn: number;
  CHIP_ARC: number;
  /** Local-space y of the bottom pole's open end (whip-group space, fold = 0). */
  yCursor: number;
  ASSEMBLY_BOTTOM: number;
  WHIP_OFFSET: number;
}

/**
 * Derives every geometry constant from the reference 48in build. Length only
 * scales the LED pole's own height (WHIP_H) — the strip pitch, chip count
 * per turn, and pole/hardware radii are fixed physical properties of the
 * strip and tent-pole tubing, so a shorter whip naturally winds fewer turns
 * (and so carries fewer LEDs) rather than shrinking every part uniformly.
 */
export function computeDimensions(length: Length): WhipDimensions {
  const scale = LENGTH_SCALE[length];

  const WHIP_H = 4.2 * scale;
  const BASE_Y = -WHIP_H / 2;
  const TOP_Y = WHIP_H / 2;

  const R_POLE = 0.05;
  const STRIP_W = 0.052;
  const PITCH = STRIP_W * 1.08;
  const PER_TURN = 5.4;
  const R_WRAP = R_POLE + 0.012;

  const ledStartY = BASE_Y + 0.34;
  const ledEndY = TOP_Y - 0.06;
  const SPAN = ledEndY - ledStartY;
  const TURNS = SPAN / PITCH;
  const COUNT = Math.floor(TURNS * PER_TURN);

  const coilTopY = ledStartY - 0.075;
  const coilPitch = 0.058;
  const coilTurns = 2.0;
  const coilR = R_POLE + 0.028;
  const coilBotY = coilTopY - coilTurns * coilPitch;

  const POLE_LEN = WHIP_H;
  const FERRULE_H = 0.48;
  const JOINT2_DROP = FERRULE_H + 0.05;

  const helixLenPerTurn = Math.sqrt(
    Math.pow(Math.PI * 2 * R_WRAP, 2) + PITCH * PITCH
  );
  const CHIP_ARC = helixLenPerTurn / PER_TURN;

  const yCursor = BASE_Y - 2 * POLE_LEN - JOINT2_DROP;
  const ASSEMBLY_BOTTOM = yCursor - R_POLE * 1.5;
  const WHIP_OFFSET = -(TOP_Y + 0.1 + ASSEMBLY_BOTTOM) / 2;

  return {
    length,
    WHIP_H,
    BASE_Y,
    TOP_Y,
    R_POLE,
    STRIP_W,
    PITCH,
    ledStartY,
    ledEndY,
    coilTopY,
    coilPitch,
    coilTurns,
    coilR,
    coilBotY,
    SPAN,
    TURNS,
    PER_TURN,
    COUNT,
    R_WRAP,
    POLE_LEN,
    FERRULE_H,
    JOINT2_DROP,
    helixLenPerTurn,
    CHIP_ARC,
    yCursor,
    ASSEMBLY_BOTTOM,
    WHIP_OFFSET,
  };
}

export interface HelixBasis {
  a: number;
  y: number;
  outward: THREE.Vector3;
  tangent: THREE.Vector3;
  side: THREE.Vector3;
}

/** Point/frame along the LED helix at t in [0, 1] (base to tip). */
export function makeHelixBasis(dims: WhipDimensions) {
  const { TURNS, ledStartY, SPAN, R_WRAP, PITCH } = dims;
  return function helixBasis(t: number): HelixBasis {
    const a = t * TURNS * Math.PI * 2;
    const y = ledStartY + t * SPAN;
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

"use client";

import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import {
  JOINT_Y,
  POLE_TOP,
  POLE_H,
  R_POLE,
  BR_R,
  BR_TOP,
  BR_H,
  COIL_TOP,
  COIL_PITCH,
  COIL_TURNS,
  COIL_DIR,
  mirrorY,
  UPPER_LED_SECTION,
  LOWER_LED_SECTION,
} from "./dimensions";
import { POLE_COLOR } from "./palette";
import type { SplitStaffPattern } from "./types";
import JointUpper from "./JointUpper";
import JointLower from "./JointLower";
import BracketTube from "./BracketTube";
import RemotePod from "./RemotePod";
import CoilAndSplice from "./CoilAndSplice";
import StripRibbon from "./StripRibbon";
import StripCircuitry from "./led/StripCircuitry";
import LedInstances from "./led/LedInstances";
import Membrane from "./Membrane";

interface HalfAssemblyProps {
  dir: 1 | -1;
  pattern: SplitStaffPattern;
  reducedMotion: boolean;
  poolMaterialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/**
 * One half's static geometry: its length of pole, its side of the
 * threaded union, its bracket tube (sticker on the upper half only, per
 * the prototype), its own remote, its own coil and splice, and its own
 * LED section (strip, circuitry, instances, membrane). The battery,
 * holder socket, and captive lead are NOT here: they're driven by
 * BatteryEjectEnd's own per-frame animation and rendered as a sibling of
 * this component, inside the same half group.
 */
export default function HalfAssembly({ dir, pattern, reducedMotion, poolMaterialRef }: HalfAssemblyProps) {
  const poleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: POLE_COLOR, roughness: 0.5, metalness: 0.05 }),
    []
  );

  const isOff = pattern === "off";
  const dims = dir > 0 ? UPPER_LED_SECTION : LOWER_LED_SECTION;
  const coilTopY = dir > 0 ? COIL_TOP : mirrorY(COIL_TOP);
  const podY = dir > 0 ? BR_TOP - BR_H / 2 : mirrorY(BR_TOP - BR_H / 2);
  const secLandY = dir > 0 ? dims.y1 : dims.y0;

  const poleY0 = dir > 0 ? JOINT_Y : mirrorY(POLE_TOP);
  const poleY1 = dir > 0 ? POLE_TOP : JOINT_Y;
  const poleCenter = (poleY0 + poleY1) / 2;

  const ext = useMemo(
    () => ({
      dir,
      endY: coilTopY + dir * 0.06,
      coilTopY,
      coilPitch: COIL_PITCH,
      coilTurns: COIL_TURNS,
      coilDir: COIL_DIR * dir,
    }),
    [dir, coilTopY]
  );

  return (
    <>
      <mesh material={poleMat} position={[0, poleCenter, 0]}>
        <cylinderGeometry args={[R_POLE, R_POLE, POLE_H, 28]} />
      </mesh>

      {dir > 0 ? <JointUpper /> : <JointLower />}

      <BracketTube
        centerY={dir > 0 ? BR_TOP - BR_H / 2 : mirrorY(BR_TOP - BR_H / 2)}
        sticker={dir > 0}
      />
      <RemotePod position={[BR_R + 0.007, podY, 0]} rotationY={Math.PI / 2} flip={dir < 0} />
      <CoilAndSplice dir={dir} coilTopY={coilTopY} podY={podY} secLandY={secLandY} />

      <StripRibbon dims={dims} />
      <StripCircuitry dims={dims} />
      <LedInstances dims={dims} pattern={pattern} reducedMotion={reducedMotion} poolMaterialRef={poolMaterialRef} />
      <Membrane dims={dims} ext={ext} isOff={isOff} />
    </>
  );
}

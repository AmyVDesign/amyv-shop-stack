"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WhipDimensions } from "./dimensions";

interface StripBaseProps {
  dims: WhipDimensions;
}

/** Solid black connector sleeve below the strip, plus a dark under-layer sitting just inside the membrane so gaps between LEDs read as strip, not bare pole. */
export default function StripBase({ dims }: StripBaseProps) {
  const { R_POLE, ledStartY, ledEndY, SPAN } = dims;

  const connectorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.3, metalness: 0.15 }),
    []
  );
  const underMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.45, metalness: 0.1 }),
    []
  );

  return (
    <>
      <mesh material={connectorMat} position={[0, ledStartY - 0.105, 0]}>
        <cylinderGeometry args={[R_POLE + 0.011, R_POLE + 0.009, 0.215, 26]} />
      </mesh>
      <mesh material={underMat} position={[0, (ledStartY + ledEndY) / 2, 0]}>
        <cylinderGeometry args={[R_POLE + 0.014, R_POLE + 0.014, SPAN, 36, 1, true]} />
      </mesh>
    </>
  );
}

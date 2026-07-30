"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BAT_R, HOLD_R, HOLD_H, HOLD_TOP, POLE_TOP, mirrorY } from "./dimensions";
import { HANDLE_WHITE, BORE_DARK, SOCKET_FLOOR_DARK } from "./palette";

interface HolderSocketProps {
  dir: 1 | -1;
}

/**
 * The battery's holder sleeve, at one end: an open, double-sided sleeve
 * the battery seats into, a dark bore running down to the top of the pole,
 * a floor closing the bottom of the bore, and a rim ring closing the gap
 * between the holder wall and the bore. Built at both ends via `dir`;
 * `mirrorY` (not a second set of constants) is what makes the lower end's
 * numbers correct.
 */
export default function HolderSocket({ dir }: HolderSocketProps) {
  const Y = (v: number) => (dir > 0 ? v : mirrorY(v));

  const rimMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );
  const holderMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: HANDLE_WHITE,
        roughness: 0.45,
        side: THREE.DoubleSide,
      }),
    []
  );
  const boreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: BORE_DARK, roughness: 0.9, side: THREE.DoubleSide }),
    []
  );
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SOCKET_FLOOR_DARK, roughness: 0.95 }),
    []
  );

  const rIn = BAT_R * 1.04;
  const rOut = HOLD_R;
  const boreH = HOLD_TOP - POLE_TOP;
  const boreR = BAT_R * 1.04;

  return (
    <>
      <mesh material={rimMat} rotation={[Math.PI / 2, 0, 0]} position={[0, Y(HOLD_TOP), 0]}>
        <torusGeometry args={[(rIn + rOut) / 2, (rOut - rIn) / 2, 8, 40]} />
      </mesh>
      <mesh material={holderMat} position={[0, Y(HOLD_TOP) - (dir * HOLD_H) / 2, 0]}>
        <cylinderGeometry args={[HOLD_R, HOLD_R, HOLD_H, 24, 1, true]} />
      </mesh>
      <mesh material={boreMat} position={[0, Y(POLE_TOP) + (dir * boreH) / 2, 0]}>
        <cylinderGeometry args={[boreR, boreR, boreH, 24, 1, true]} />
      </mesh>
      <mesh
        material={floorMat}
        rotation={[dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0]}
        position={[0, Y(POLE_TOP) + dir * 0.001, 0]}
      >
        <circleGeometry args={[boreR, 24]} />
      </mesh>
    </>
  );
}

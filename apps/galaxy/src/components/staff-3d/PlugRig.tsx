"use client";

import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import { T_LEN, OM_LEN, PLUG_PIVOT_Y } from "./dimensions";
import { HANDLE_WHITE, PLUG_TONGUE_METAL, PLUG_DIMPLE } from "./palette";

interface PlugRigProps {
  /** StaffModel's eject rig drives this group's position/rotation per frame. */
  groupRef: RefObject<THREE.Group | null>;
}

const DIMPLE_SIGNS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * The captive USB-A lead lives in the staff, not on the battery: a metal
 * tongue whose top sits exactly at the seated port face, a white overmould
 * below it, and (via StaffModel's eject rig) a short curved cable running
 * down into the pole. The battery pushes down onto it when seated;
 * ejecting lifts the battery off it. Group origin (local y = 0, seated at
 * PLUG_PIVOT_Y) is where the cable leaves the overmould; the overmould
 * spans local 0 to OM_LEN and the tongue OM_LEN to OM_LEN + T_LEN, so the
 * tongue's top lands exactly at the seated port face.
 */
export default function PlugRig({ groupRef }: PlugRigProps) {
  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );
  const tongueMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: PLUG_TONGUE_METAL, roughness: 0.32, metalness: 0.85 }),
    []
  );
  const dimpleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PLUG_DIMPLE, roughness: 0.6 }),
    []
  );
  const dimpleGeo = useMemo(() => new THREE.BoxGeometry(0.011, 0.011, 0.002), []);

  return (
    <group ref={groupRef} position={[0, PLUG_PIVOT_Y, 0]}>
      {/* overmould, local 0 to OM_LEN. 16 x 14 x 8mm */}
      <mesh material={whiteMat} position={[0, OM_LEN / 2, 0]}>
        <boxGeometry args={[0.073, OM_LEN, 0.038]} />
      </mesh>
      {/* metal tongue, local OM_LEN to OM_LEN + T_LEN. 12 x 4.5mm in section. */}
      <mesh material={tongueMat} position={[0, OM_LEN + T_LEN / 2, 0]}>
        <boxGeometry args={[0.055, T_LEN, 0.0207]} />
      </mesh>
      {/* the two shell dimples, the detail that makes a USB-A read as one */}
      {DIMPLE_SIGNS.map(([sx, sz]) => (
        <mesh
          key={`${sx}-${sz}`}
          geometry={dimpleGeo}
          material={dimpleMat}
          position={[sx * 0.012, OM_LEN + T_LEN * 0.55, sz * 0.0105]}
        />
      ))}
    </group>
  );
}

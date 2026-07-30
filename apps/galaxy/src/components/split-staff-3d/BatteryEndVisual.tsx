"use client";

import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { BAT_R, BAT_H, BAT_PROUD, BAT_BOT, TOP_Y, mirrorY } from "./dimensions";
import { HANDLE_WHITE } from "./palette";
import { buildBatteryDecalTexture, buildPortFaceTexture } from "./textures";
import RubberCap from "./RubberCap";

/** Set to "" to drop the wordmark for storefront renders. */
const BATTERY_BRAND = "SIXTHGU";

interface BatteryEndVisualProps {
  /** BatteryEjectEnd drives this group's position/rotation per frame. */
  groupRef: RefObject<THREE.Group | null>;
  dir: 1 | -1;
}

/**
 * One removable battery pack, built at both ends: narrow branded power
 * bank with hex power button and 4 charge dots, plus its port end (USB-A
 * output, USB-C input, and the round indicator). Lives in its own group
 * pivoted on the port face (local y = 0, seated at `Y(BAT_BOT)`), so the
 * eject animation lifts and tips it about the end you actually plug into.
 * The group carries a static `base` rotation (0 for the upper end, PI for
 * the lower), so every child below is built once, in local dir = +1
 * convention, and the lower end's flip comes free from the group's own
 * transform, the cap included: it sits on the dome end, so it stays on
 * while the battery is turned over, because the ports are at the other
 * end.
 */
export default function BatteryEndVisual({ groupRef, dir }: BatteryEndVisualProps) {
  const Y = (v: number) => (dir > 0 ? v : mirrorY(v));
  const base = dir > 0 ? 0 : Math.PI;

  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );

  const batCapGeo = useMemo(
    () => new THREE.SphereGeometry(BAT_R, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    []
  );

  const batteryDecal = useMemo(
    () => buildBatteryDecalTexture(BAT_R, BAT_PROUD, BATTERY_BRAND),
    []
  );
  useEffect(() => () => batteryDecal.texture.dispose(), [batteryDecal]);
  const batDecalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: batteryDecal.texture,
        transparent: true,
        roughness: 0.45,
      }),
    [batteryDecal]
  );

  // ── Port end (faces down into the tube when seated) ──
  const portFace = useMemo(() => buildPortFaceTexture(BAT_R), []);
  useEffect(() => () => portFace.texture.dispose(), [portFace]);
  const capWallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: HANDLE_WHITE,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    []
  );
  const capWallGeo = useMemo(
    () => new THREE.CylinderGeometry(portFace.R_FACE, portFace.R_FACE, 0.05, 24, 1, true),
    [portFace]
  );
  const faceGeo = useMemo(() => new THREE.CircleGeometry(portFace.R_FACE, 48), [portFace]);
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: portFace.texture, roughness: 0.5, metalness: 0.05 }),
    [portFace]
  );

  return (
    <group ref={groupRef} position={[0, Y(BAT_BOT), 0]} rotation={[0, 0, base]}>
      <RubberCap yOuter={TOP_Y + 0.04 - BAT_BOT} dir={1} />
      <mesh material={whiteMat} position={[0, BAT_H / 2, 0]}>
        <cylinderGeometry args={[BAT_R, BAT_R, BAT_H, 24]} />
      </mesh>
      <mesh geometry={batCapGeo} material={whiteMat} scale={[1, 0.78, 1]} position={[0, BAT_H, 0]} />
      <mesh
        geometry={new THREE.PlaneGeometry(batteryDecal.DW, batteryDecal.DH)}
        material={batDecalMat}
        position={[0, BAT_H - BAT_PROUD / 2, BAT_R + 0.004]}
      />
      <mesh geometry={capWallGeo} material={capWallMat} position={[0, 0.025, 0]} />
      {/* normal points -Y */}
      <mesh geometry={faceGeo} material={faceMat} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.0008, 0]} />
    </group>
  );
}

"use client";

import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { BAT_R, BAT_H, BAT_PROUD, BAT_BOT } from "./dimensions";
import { HANDLE_WHITE, PORT_HIGHLIGHT_AMBER } from "./palette";
import { buildBatteryDecalTexture, buildPortFaceTexture } from "./textures";

/** Set to "" to drop the wordmark for storefront renders. */
const BATTERY_BRAND = "SIXTHGU";

interface BatteryProps {
  /** StaffModel's eject rig drives this group's position/rotation per frame. */
  groupRef: RefObject<THREE.Group | null>;
  /** The highlight over the USB-C slot, faded in as the battery tips up. */
  ringMaterialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/**
 * The removable battery pack: narrow branded power bank with hex power
 * button and 4 charge dots, plus its port end (USB-A output, USB-C input,
 * and the round indicator, drawn to a canvas rather than cut as geometry).
 * Lives in its own group pivoted on the port face (local y = 0), seated at
 * BAT_BOT, so the eject animation lifts and tips it about the end you
 * actually plug into. Children are positioned in local coordinates from
 * that face.
 */
export default function Battery({ groupRef, ringMaterialRef }: BatteryProps) {
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

  // open-ended so its bottom disc cannot fight with the white tube's
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
    () =>
      new THREE.MeshStandardMaterial({ map: portFace.texture, roughness: 0.5, metalness: 0.05 }),
    [portFace]
  );
  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.013, 0.0018, 8, 28), []);

  return (
    <group ref={groupRef} position={[0, BAT_BOT, 0]}>
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
      <mesh geometry={faceGeo} material={faceMat} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.0008, 0]}>
        <mesh geometry={ringGeo} position={[portFace.highlight.x, portFace.highlight.y, 0.002]}>
          <meshBasicMaterial ref={ringMaterialRef} color={PORT_HIGHLIGHT_AMBER} transparent opacity={0} />
        </mesh>
      </mesh>
    </group>
  );
}

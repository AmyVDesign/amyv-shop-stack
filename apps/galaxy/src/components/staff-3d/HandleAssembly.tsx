"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  TOP_Y,
  BAT_R,
  BAT_H,
  BAT_PROUD,
  HOLD_R,
  HOLD_H,
  HOLD_TOP,
  BR_R,
  BR_H,
  BR_TOP,
  POD_H,
} from "./dimensions";
import { HANDLE_WHITE } from "./palette";
import { buildBatteryDecalTexture, buildStickerTexture } from "./textures";

/** Set to "" to drop the wordmark for storefront renders. */
const BATTERY_BRAND = "SIXTHGU";

/**
 * Top handle assembly, matched to the macros: removable battery pack
 * proud of a holder sleeve, then a bracket tube carrying the Galaxy SF
 * sticker (the two remote pods clamp onto this bracket, rendered by the
 * caller, not here).
 */
export default function HandleAssembly() {
  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );

  // ── Removable battery pack protruding from the holder ──
  // Narrow branded power bank with hex power button and 4 charge dots,
  // seated in a wider holder sleeve.
  const batCapGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(BAT_R, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    return geo;
  }, []);

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

  const stickerTexture = useMemo(() => buildStickerTexture(), []);
  useEffect(() => () => stickerTexture.dispose(), [stickerTexture]);
  const stickerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: stickerTexture,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
    [stickerTexture]
  );

  // wrapped onto the bracket tube as an arc, not a flat card, the arc
  // angle is derived from the sticker's printed width so the artwork keeps
  // its proportions whatever the pole radius is
  const stickerGeo = useMemo(() => {
    const stickR = BR_R + 0.003;
    const STICK_W = POD_H * 0.295;
    const STICK_H = POD_H * 1.091;
    const stickArc = STICK_W / stickR;
    return new THREE.CylinderGeometry(stickR, stickR, STICK_H, 32, 1, true, -stickArc / 2, stickArc);
  }, []);

  const handleTop = TOP_Y;
  const holdTop = HOLD_TOP;
  const brTop = BR_TOP;
  const brH = BR_H;

  return (
    <>
      <mesh material={whiteMat} position={[0, handleTop - BAT_H / 2, 0]}>
        <cylinderGeometry args={[BAT_R, BAT_R, BAT_H, 24]} />
      </mesh>
      <mesh
        geometry={batCapGeo}
        material={whiteMat}
        scale={[1, 0.78, 1]}
        position={[0, handleTop, 0]}
      />
      <mesh
        geometry={new THREE.PlaneGeometry(batteryDecal.DW, batteryDecal.DH)}
        material={batDecalMat}
        position={[0, handleTop - BAT_PROUD / 2, BAT_R + 0.004]}
      />

      <mesh material={whiteMat} position={[0, holdTop - HOLD_H / 2, 0]}>
        <cylinderGeometry args={[HOLD_R, HOLD_R, HOLD_H, 24]} />
      </mesh>

      <mesh material={whiteMat} position={[0, brTop - brH / 2, 0]}>
        <cylinderGeometry args={[BR_R, BR_R, brH, 24]} />
      </mesh>
      <mesh geometry={stickerGeo} material={stickerMat} position={[0, brTop - brH / 2, 0]} />
    </>
  );
}

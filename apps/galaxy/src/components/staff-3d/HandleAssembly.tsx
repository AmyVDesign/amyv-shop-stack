"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BAT_R, HOLD_R, HOLD_H, HOLD_TOP, POLE_TOP, BR_R, BR_H, BR_TOP, POD_H } from "./dimensions";
import { HANDLE_WHITE, BORE_DARK, SOCKET_FLOOR_DARK } from "./palette";
import { buildStickerTexture } from "./textures";

/**
 * Top handle assembly, matched to the macros: an open holder sleeve the
 * battery seats into (rendered by Battery, not here), with a dark bore
 * running down to the top of the pole, a floor closing the bottom of that
 * bore, and a rim ring closing the gap between the holder wall and the
 * bore so the mouth reads as a rim with thickness rather than a
 * zero-width edge, then a bracket tube carrying the Galaxy SF sticker (the
 * two remote pods clamp onto this bracket, rendered by the caller, not
 * here).
 */
export default function HandleAssembly() {
  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );

  // open-ended and double-sided so the inside of the sleeve reads correctly
  // once the battery is ejected out of it
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

  const holdTop = HOLD_TOP;
  const brTop = BR_TOP;
  const brH = BR_H;

  // dark bore running from the top of the pole up to the rim, with a floor
  // so you are looking into a socket rather than down an endless tube
  const rBore = BAT_R * 1.04;
  const boreH = HOLD_TOP - POLE_TOP;

  // rim ring closing the gap between holder wall and bore
  const rIn = BAT_R * 1.04;
  const rOut = HOLD_R;

  return (
    <>
      <mesh material={holderMat} position={[0, holdTop - HOLD_H / 2, 0]}>
        <cylinderGeometry args={[HOLD_R, HOLD_R, HOLD_H, 24, 1, true]} />
      </mesh>
      <mesh material={boreMat} position={[0, POLE_TOP + boreH / 2, 0]}>
        <cylinderGeometry args={[rBore, rBore, boreH, 24, 1, true]} />
      </mesh>
      <mesh material={floorMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, POLE_TOP + 0.001, 0]}>
        <circleGeometry args={[rBore, 24]} />
      </mesh>
      <mesh material={whiteMat} rotation={[Math.PI / 2, 0, 0]} position={[0, HOLD_TOP, 0]}>
        <torusGeometry args={[(rIn + rOut) / 2, (rOut - rIn) / 2, 8, 40]} />
      </mesh>

      <mesh material={whiteMat} position={[0, brTop - brH / 2, 0]}>
        <cylinderGeometry args={[BR_R, BR_R, brH, 24]} />
      </mesh>
      <mesh geometry={stickerGeo} material={stickerMat} position={[0, brTop - brH / 2, 0]} />
    </>
  );
}

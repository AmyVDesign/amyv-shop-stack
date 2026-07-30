"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BR_R, BR_H, POD_H } from "./dimensions";
import { HANDLE_WHITE } from "./palette";
import { buildStickerTexture } from "./textures";

interface BracketTubeProps {
  /** Vertical centre of the bracket tube. For the lower half this is the
   * mirror of the upper half's own centre (`mirrorY(BR_TOP - BR_H/2)`),
   * not independently derived. */
  centerY: number;
  /** Only the upper half carries the yellow handle sticker; the cap now
   * rides on the battery at the lower end and the plain filler tube there
   * has no decal. */
  sticker?: boolean;
}

/**
 * Bracket tube carrying the yellow Galaxy SF sticker on the upper half
 * only (the two remote pods clamp onto this bracket, rendered by the
 * caller, not here); a plain tube on the lower half.
 */
export default function BracketTube({ centerY, sticker = false }: BracketTubeProps) {
  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );

  const stickerTexture = useMemo(() => (sticker ? buildStickerTexture() : null), [sticker]);
  useEffect(() => () => stickerTexture?.dispose(), [stickerTexture]);
  const stickerMat = useMemo(
    () =>
      stickerTexture
        ? new THREE.MeshStandardMaterial({
            map: stickerTexture,
            roughness: 0.55,
            side: THREE.DoubleSide,
          })
        : null,
    [stickerTexture]
  );
  // wrapped onto the tube as an arc, not a flat card, the arc angle is
  // derived from the sticker's printed width so the artwork keeps its
  // proportions whatever the pole radius is
  const stickerGeo = useMemo(() => {
    if (!sticker) return null;
    const stickR = BR_R + 0.003;
    const STICK_W = POD_H * 0.295;
    const STICK_H = POD_H * 1.091;
    const stickArc = STICK_W / stickR;
    return new THREE.CylinderGeometry(stickR, stickR, STICK_H, 32, 1, true, -stickArc / 2, stickArc);
  }, [sticker]);

  return (
    <>
      <mesh material={whiteMat} position={[0, centerY, 0]}>
        <cylinderGeometry args={[BR_R, BR_R, BR_H, 24]} />
      </mesh>
      {stickerGeo && stickerMat && (
        <mesh geometry={stickerGeo} material={stickerMat} position={[0, centerY, 0]} />
      )}
    </>
  );
}

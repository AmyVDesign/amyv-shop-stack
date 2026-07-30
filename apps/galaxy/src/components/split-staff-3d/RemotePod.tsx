"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { POD_W, POD_H, POD_D, POD_RAD, BOSS_LEN, BOSS_LAP, S } from "./dimensions";
import { REMOTE_PILL_WHITE } from "./palette";
import { buildRemoteFaceTexture } from "./textures";

interface RemotePodProps {
  position: [number, number, number];
  rotationY: number;
  /** Flips the whole pod (body, face, and boss) over so the boss points at
   * its own half's strip. ONE remote lives on each half, not two clamped
   * on the same end, so unlike the one-piece staff's pair, this is called
   * once per half. */
  flip?: boolean;
}

/**
 * The rounded pill remote, decal face, and moulded strain-relief boss on
 * the lower end where the cable leaves, same unit as the whip's inline
 * remote and the one-piece staff's pods, ported fresh for the split
 * staff's single-remote-per-half mounting (own copy: see the top-level
 * note on why the three products don't share code yet).
 */
export default function RemotePod({ position, rotationY, flip = false }: RemotePodProps) {
  const faceTexture = useMemo(() => buildRemoteFaceTexture(), []);
  useEffect(() => () => faceTexture.dispose(), [faceTexture]);

  const pillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: REMOTE_PILL_WHITE, roughness: 0.5 }),
    []
  );
  const decalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: faceTexture, transparent: true, roughness: 0.5 }),
    [faceTexture]
  );

  const bodyGeo = useMemo(() => {
    const hw = POD_W / 2;
    const hh = POD_H / 2;
    const rad = POD_RAD;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + rad, -hh);
    shape.lineTo(hw - rad, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + rad);
    shape.lineTo(hw, hh - rad);
    shape.quadraticCurveTo(hw, hh, hw - rad, hh);
    shape.lineTo(-hw + rad, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - rad);
    shape.lineTo(-hw, -hh + rad);
    shape.quadraticCurveTo(-hw, -hh, -hw + rad, -hh);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: POD_D,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.009,
      bevelSegments: 2,
    });
    geo.translate(0, 0, -POD_D / 2);
    return geo;
  }, []);

  const decalGeo = useMemo(() => new THREE.PlaneGeometry(POD_W * 0.96, POD_H * 0.96), []);

  // strain relief boss on the bottom end, wider where it meets the pill
  // and tapering to the cable's own diameter
  const bossGeo = useMemo(
    () => new THREE.CylinderGeometry(0.017 * S * 2.4, 0.017 * S * 1.15, BOSS_LEN, 16),
    []
  );

  return (
    <group position={position} rotation={[0, rotationY, flip ? Math.PI : 0]}>
      <mesh geometry={bodyGeo} material={pillMat} />
      <mesh geometry={decalGeo} material={decalMat} position={[0, 0, POD_D / 2 + 0.011]} />
      <mesh
        geometry={bossGeo}
        material={pillMat}
        position={[0, -POD_H / 2 - BOSS_LEN / 2 + BOSS_LAP, 0]}
      />
    </group>
  );
}

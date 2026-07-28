"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { WhipDimensions } from "../dimensions";
import { buildRemoteFaceTexture } from "../textures";

interface CableAndRemoteProps {
  dims: WhipDimensions;
}

const CONNECTOR_SIDES = [-1, 1] as const;

/**
 * White power cable: two wraps around the coil under the shrink film, a
 * drooping run down to an inline remote (rounded body, printed decal face),
 * then a continuing drop that plugs into the bottom pole's open end. The
 * cable is split into two tubes that stop exactly at the remote's
 * connector tips, so it visually threads through the remote's center.
 */
export default function CableAndRemote({ dims }: CableAndRemoteProps) {
  const { coilTopY, coilPitch, coilTurns, coilR, coilBotY, BASE_Y, yCursor } = dims;

  const faceTexture = useMemo(() => buildRemoteFaceTexture(), []);
  useEffect(() => () => faceTexture.dispose(), [faceTexture]);

  const cordMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xededea, roughness: 0.6, metalness: 0 }),
    []
  );
  const pillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xf3f3ee, roughness: 0.5 }),
    []
  );
  const decalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: faceTexture, transparent: true, roughness: 0.5 }),
    [faceTexture]
  );

  const built = useMemo(() => {
    const wrapSteps = 26;
    const cablePts: THREE.Vector3[] = [];
    for (let i = 0; i <= wrapSteps; i++) {
      const ang = (i / wrapSteps) * coilTurns * Math.PI * 2;
      const y = coilTopY - (i / wrapSteps) * (coilTurns * coilPitch);
      cablePts.push(new THREE.Vector3(Math.cos(ang) * coilR, y, Math.sin(ang) * coilR));
    }
    // coil ends pointing +x; exit on that side below the film edge
    cablePts.push(
      new THREE.Vector3(0.11, coilBotY - 0.14, 0.05),
      new THREE.Vector3(0.17, coilBotY - 0.45, 0.09),
      new THREE.Vector3(0.2, BASE_Y - 1.15, 0.09),
      new THREE.Vector3(0.18, BASE_Y - 1.9, 0.05),
      new THREE.Vector3(0.14, yCursor + 0.55, 0.03),
      new THREE.Vector3(0.05, yCursor + 0.18, 0.01),
      new THREE.Vector3(0, yCursor + 0.03, 0) // plugs into the bottom pole end
    );
    const cableCurve = new THREE.CatmullRomCurve3(cablePts);

    // chunkier body with a flatter face: wider, smaller bevel
    const bW = 0.175;
    const bH = 0.44;
    const bD = 0.055;
    const rad = 0.045;
    const hw = bW / 2;
    const hh = bH / 2;
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
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: bD,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.009,
      bevelSegments: 2,
    });
    bodyGeo.translate(0, 0, -bD / 2);

    const decalGeo = new THREE.PlaneGeometry(bW * 0.96, bH * 0.96);

    // seat on the cable right-side up, face outward
    const tPos = 0.5;
    const remotePosition = cableCurve.getPointAt(tPos).clone();
    const rt = cableCurve.getTangentAt(tPos).normalize();
    if (rt.y < 0) rt.negate();
    const remoteQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      rt
    );
    remoteQuaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.15)
    );

    // the cable runs through the connector centers: two tubes that stop
    // exactly at the connector tips instead of one continuous tube
    function subCurve(t0: number, t1: number) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 48; i++) pts.push(cableCurve.getPointAt(t0 + (t1 - t0) * (i / 48)));
      return new THREE.CatmullRomCurve3(pts);
    }
    const gapHalf = (bH / 2 + 0.015) / cableCurve.getLength(); // tubes tuck inside the cones
    const cableAGeo = new THREE.TubeGeometry(subCurve(0, tPos - gapHalf), 220, 0.016, 8, false);
    const cableBGeo = new THREE.TubeGeometry(subCurve(tPos + gapHalf, 1), 140, 0.016, 8, false);

    return { bH, bD, bodyGeo, decalGeo, remotePosition, remoteQuaternion, cableAGeo, cableBGeo };
  }, [coilTopY, coilPitch, coilTurns, coilR, coilBotY, BASE_Y, yCursor]);

  const { bH, bD, bodyGeo, decalGeo, remotePosition, remoteQuaternion, cableAGeo, cableBGeo } = built;

  return (
    <>
      <mesh geometry={cableAGeo} material={cordMat} />
      <mesh geometry={cableBGeo} material={cordMat} />
      <group position={remotePosition} quaternion={remoteQuaternion}>
        <mesh geometry={bodyGeo} material={pillMat} />
        <mesh geometry={decalGeo} material={decalMat} position={[0, 0, bD / 2 + 0.011]} />
        {CONNECTOR_SIDES.map((s) => (
          <group key={s}>
            <mesh material={pillMat} position={[0, s * (bH / 2 + 0.008), 0]}>
              <cylinderGeometry args={[0.04, 0.037, 0.016, 14]} />
            </mesh>
            <mesh material={pillMat} position={[0, s * (bH / 2 + 0.022), 0]}>
              <cylinderGeometry args={[0.033, 0.037, 0.014, 14]} />
            </mesh>
            <mesh
              material={pillMat}
              position={[0, s * (bH / 2 + 0.058), 0]}
              rotation={[s < 0 ? Math.PI : 0, 0, 0]}
            >
              <cylinderGeometry args={[0.02, 0.034, 0.055, 12]} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

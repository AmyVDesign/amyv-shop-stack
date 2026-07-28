"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WhipDimensions } from "./dimensions";

interface UpperPoleProps {
  dims: WhipDimensions;
}

/** The LED-carrying pole tube plus its bulbous top cap (sealed under the shrink-wrap membrane, so it shares the membrane's glossy clearcoat). */
export default function UpperPole({ dims }: UpperPoleProps) {
  const { R_POLE, WHIP_H, TOP_Y } = dims;

  const poleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.5, metalness: 0.2 }),
    []
  );
  const capMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x0c0c0f,
        roughness: 0.22,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.4,
      }),
    []
  );

  const capGeo = useMemo(() => {
    const r0 = R_POLE + 0.015; // meets the membrane radius
    const capR = R_POLE * 1.15; // barely wider than the tube
    const capH = capR * 1.05; // small squashed hemisphere
    const pts = [
      new THREE.Vector2(r0, 0),
      new THREE.Vector2(capR, capH * 0.18),
      new THREE.Vector2(capR * 0.96, capH * 0.48),
      new THREE.Vector2(capR * 0.8, capH * 0.74),
      new THREE.Vector2(capR * 0.48, capH * 0.93),
      new THREE.Vector2(0.001, capH),
    ];
    return new THREE.LatheGeometry(pts, 26);
  }, [R_POLE]);

  return (
    <>
      <mesh material={poleMat}>
        <cylinderGeometry args={[R_POLE, R_POLE, WHIP_H, 24]} />
      </mesh>
      <mesh geometry={capGeo} material={capMat} position={[0, TOP_Y - 0.04, 0]} />
    </>
  );
}

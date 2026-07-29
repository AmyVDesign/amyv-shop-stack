"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { R_POLE, S, BOT_Y, COLLAR_TOP, COLLAR_H } from "./dimensions";
import { FOOT_RUBBER, FOOT_GROOVE } from "./palette";

const GROOVE_COUNT = 10;

/**
 * Black rubber foot: collar into a wide grooved bell, like the macro. The
 * collar runs up past the membrane's bottom cut so the film tucks into the
 * rubber instead of leaving bare pole showing.
 */
export default function Foot() {
  const footMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FOOT_RUBBER, roughness: 0.85, metalness: 0 }),
    []
  );
  const grooveMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FOOT_GROOVE, roughness: 0.9 }),
    []
  );
  const grooveGeo = useMemo(() => new THREE.BoxGeometry(0.012 * S, 0.12, 0.006 * S), []);

  const groovesRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const grooves = groovesRef.current;
    if (!grooves) return;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (let i = 0; i < GROOVE_COUNT; i++) {
      const a = (i / GROOVE_COUNT) * Math.PI * 2;
      const rr = R_POLE * 1.86;
      p.set(Math.cos(a) * rr, BOT_Y + 0.15, Math.sin(a) * rr);
      m.makeRotationY(-a + Math.PI / 2);
      m.setPosition(p);
      grooves.setMatrixAt(i, m);
    }
    grooves.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <mesh material={footMat} position={[0, COLLAR_TOP - COLLAR_H / 2, 0]}>
        <cylinderGeometry args={[R_POLE * 1.45, R_POLE * 1.55, COLLAR_H, 26]} />
      </mesh>
      <mesh material={footMat} position={[0, BOT_Y + 0.13, 0]}>
        <cylinderGeometry args={[R_POLE * 1.55, R_POLE * 2.15, 0.26, 26]} />
      </mesh>
      <mesh material={footMat} position={[0, BOT_Y + 0.012, 0]}>
        <cylinderGeometry args={[R_POLE * 2.15, R_POLE * 2.05, 0.03, 26]} />
      </mesh>
      <instancedMesh ref={groovesRef} args={[grooveGeo, grooveMat, GROOVE_COUNT]} />
    </>
  );
}

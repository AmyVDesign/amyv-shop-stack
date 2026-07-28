"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import type { WhipDimensions } from "../dimensions";
import { buildBraidTexture } from "../textures";
import Mouth from "./Mouth";

const GAP = 0.5;
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface LowerAssemblyProps {
  dims: WhipDimensions;
  folded: boolean;
  reducedMotion: boolean;
}

/**
 * Three shock-corded tent-pole segments below the LED pole; only the top
 * one (rendered elsewhere) carries LEDs. seg2 pivots at the top joint and
 * seg3 (sleeve + bottom pole + tip) pivots at the lower joint nested inside
 * it, so folding one swings the other along for free. The braided cord
 * meshes live at the scene root (via a portal) because their geometry is
 * rebuilt every frame from world-space joint positions — nesting them under
 * the swaying whip group would double-apply that transform.
 */
export default function LowerAssembly({ dims, folded, reducedMotion }: LowerAssemblyProps) {
  const { R_POLE, BASE_Y, POLE_LEN, FERRULE_H, JOINT2_DROP } = dims;
  const scene = useThree((s) => s.scene);

  const rootRef = useRef<THREE.Group>(null);
  const seg2Ref = useRef<THREE.Group>(null);
  const seg3Ref = useRef<THREE.Group>(null);
  const cordARef = useRef<THREE.Mesh>(null);
  const cordBRef = useRef<THREE.Mesh>(null);
  const foldURef = useRef(0);

  const braidTexture = useMemo(() => buildBraidTexture(), []);
  useEffect(() => () => braidTexture.dispose(), [braidTexture]);

  const ropeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: braidTexture,
        bumpMap: braidTexture,
        bumpScale: 0.004,
        roughness: 0.85,
        metalness: 0,
      }),
    [braidTexture]
  );
  const tubeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x101013, roughness: 0.45, metalness: 0.35 }),
    []
  );
  const ferruleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x121215, roughness: 0.78, metalness: 0 }),
    []
  );
  const mouthWallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.5, metalness: 0.2 }),
    []
  );
  const mouthInMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.9 }),
    []
  );
  const tipMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x0c0c0f,
        roughness: 0.32,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      }),
    []
  );

  const applyFold = useMemo(() => {
    return (e: number) => {
      const seg2 = seg2Ref.current;
      const seg3 = seg3Ref.current;
      if (!seg2 || !seg3) return;
      const p1 = Math.min(e / 0.5, 1);
      const p2 = Math.max((e - 0.5) / 0.5, 0);
      const drop1 = Math.min(p1 * 2, 1);
      const swing1 = Math.max(p1 * 2 - 1, 0);
      const drop2 = Math.min(p2 * 2, 1);
      const swing2 = Math.max(p2 * 2 - 1, 0);
      seg3.position.y = -POLE_LEN - drop1 * GAP;
      seg3.position.x = swing1 * R_POLE * 2.6;
      seg3.rotation.z = swing1 * Math.PI;
      seg2.position.y = BASE_Y - drop2 * GAP;
      seg2.position.x = -swing2 * R_POLE * 2.6;
      seg2.rotation.z = -swing2 * Math.PI;
    };
  }, [POLE_LEN, R_POLE, BASE_Y]);

  const scratch = useMemo(() => ({ dirA: new THREE.Vector3(), dirB: new THREE.Vector3() }), []);

  const stretchCord = useMemo(() => {
    return (
      mesh: THREE.Mesh,
      mouthA: THREE.Vector3,
      outA: THREE.Vector3,
      mouthB: THREE.Vector3,
      outB: THREE.Vector3
    ) => {
      const len = mouthA.distanceTo(mouthB);
      mesh.visible = len > 0.07;
      if (!mesh.visible) return;
      // Straight lead-outs joined by one cubic arc whose handles extend
      // along each tube's axis — continuous curvature, no visible corners.
      const lead = Math.min(0.1, len * 0.22);
      const dirA = scratch.dirA.copy(outA).sub(mouthA).normalize();
      const dirB = scratch.dirB.copy(outB).sub(mouthB).normalize();
      const pA = dirA.clone().multiplyScalar(lead).add(mouthA);
      const pB = dirB.clone().multiplyScalar(lead).add(mouthB);
      const h = Math.min(0.48, Math.max(0.2, pA.distanceTo(pB) * 0.85));
      const cA = pA.clone().addScaledVector(dirA, h);
      const cB = pB.clone().addScaledVector(dirB, h);
      cA.y -= h * 0.15;
      cB.y -= h * 0.15;
      const path = new THREE.CurvePath<THREE.Vector3>();
      path.add(new THREE.LineCurve3(mouthA.clone(), pA));
      path.add(new THREE.CubicBezierCurve3(pA.clone(), cA, cB, pB.clone()));
      path.add(new THREE.LineCurve3(pB.clone(), mouthB.clone()));
      const geo = new THREE.TubeGeometry(path, 48, 0.0065, 7, false);
      mesh.geometry.dispose();
      mesh.geometry = geo;
      braidTexture.repeat.set(Math.max(6, Math.round(len * 44)), 1);
    };
  }, [scratch, braidTexture]);

  const updateFold = useMemo(() => {
    const mA = new THREE.Vector3();
    const oA = new THREE.Vector3();
    const mB = new THREE.Vector3();
    const oB = new THREE.Vector3();
    const mC = new THREE.Vector3();
    const oC = new THREE.Vector3();
    const mD = new THREE.Vector3();
    const oD = new THREE.Vector3();
    return () => {
      const root = rootRef.current;
      const seg2 = seg2Ref.current;
      const seg3 = seg3Ref.current;
      const cordA = cordARef.current;
      const cordB = cordBRef.current;
      if (!root || !seg2 || !seg3 || !cordA || !cordB) return;
      if (foldURef.current > 0.002) {
        root.localToWorld(mA.set(0, BASE_Y, 0));
        root.localToWorld(oA.set(0, BASE_Y - 0.2, 0));
        seg2.localToWorld(mB.set(0, 0, 0));
        seg2.localToWorld(oB.set(0, 0.2, 0));
        stretchCord(cordA, mA, oA, mB, oB);

        seg2.localToWorld(mC.set(0, -POLE_LEN, 0));
        seg2.localToWorld(oC.set(0, -POLE_LEN - 0.2, 0));
        seg3.localToWorld(mD.set(0, 0, 0));
        seg3.localToWorld(oD.set(0, 0.2, 0));
        stretchCord(cordB, mC, oC, mD, oD);
      } else {
        cordA.visible = false;
        cordB.visible = false;
      }
    };
  }, [stretchCord, BASE_Y, POLE_LEN]);

  useFrame(() => {
    const target = folded ? 1 : 0;
    if (reducedMotion) {
      if (foldURef.current !== target) {
        foldURef.current = target;
        applyFold(easeIO(target));
        updateFold();
      }
      return;
    }
    if (Math.abs(target - foldURef.current) > 0.0005) {
      foldURef.current += (target - foldURef.current) * 0.045;
      applyFold(easeIO(foldURef.current));
    }
    updateFold();
  });

  return (
    <group ref={rootRef}>
      {/* LED pole's own bottom mouth — fixed, doesn't fold */}
      <Mouth y={BASE_Y + 0.002} flip R_POLE={R_POLE} wallMat={mouthWallMat} inMat={mouthInMat} />

      <group ref={seg2Ref} position={[0, BASE_Y, 0]}>
        <mesh material={tubeMat} position={[0, -POLE_LEN / 2, 0]}>
          <cylinderGeometry args={[R_POLE, R_POLE, POLE_LEN, 20]} />
        </mesh>
        <Mouth y={0.002} flip={false} R_POLE={R_POLE} wallMat={mouthWallMat} inMat={mouthInMat} />
        <Mouth y={-POLE_LEN - 0.002} flip R_POLE={R_POLE} wallMat={mouthWallMat} inMat={mouthInMat} />

        <group ref={seg3Ref} position={[0, -POLE_LEN, 0]}>
          <mesh material={ferruleMat} position={[0, -FERRULE_H / 2, 0]}>
            <cylinderGeometry args={[R_POLE * 1.24, R_POLE * 1.28, FERRULE_H, 20]} />
          </mesh>
          <mesh material={ferruleMat} position={[0, -FERRULE_H - 0.025, 0]}>
            <cylinderGeometry args={[R_POLE * 1.28, R_POLE * 1.08, 0.05, 20]} />
          </mesh>
          <mesh material={tubeMat} position={[0, -JOINT2_DROP - POLE_LEN / 2, 0]}>
            <cylinderGeometry args={[R_POLE, R_POLE, POLE_LEN, 20]} />
          </mesh>
          <mesh material={tipMat} scale={[1, 1.2, 1]} position={[0, -JOINT2_DROP - POLE_LEN - 0.02, 0]}>
            <sphereGeometry args={[R_POLE * 1.15, 18, 12]} />
          </mesh>
        </group>
      </group>

      {createPortal(
        <>
          <mesh ref={cordARef} material={ropeMat} visible={false}>
            <bufferGeometry />
          </mesh>
          <mesh ref={cordBRef} material={ropeMat} visible={false}>
            <bufferGeometry />
          </mesh>
        </>,
        scene
      )}
    </group>
  );
}

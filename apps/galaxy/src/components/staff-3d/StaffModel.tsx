"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { STAFF_H, R_POLE, BR_R, BR_TOP, BR_H, LED_SECTION } from "./dimensions";
import { POLE_COLOR, SCENE_BG } from "./palette";
import type { StaffPattern } from "./types";
import { useStudioEnvironment } from "./useStudioEnvironment";
import { useReducedMotion } from "./useReducedMotion";
import HandleAssembly from "./HandleAssembly";
import RemotePod from "./RemotePod";
import CableCoilAndLeads from "./CableCoilAndLeads";
import StripRibbon from "./StripRibbon";
import Membrane from "./Membrane";
import StripCircuitry from "./led/StripCircuitry";
import LedInstances from "./led/LedInstances";
import Foot from "./Foot";
import StudioLighting from "./StudioLighting";
import FloorPool from "./FloorPool";

export type { StaffPattern };

export interface StaffModelProps {
  pattern: StaffPattern;
  /** Drives the idle product sway; snaps off under prefers-reduced-motion. */
  autoRotate?: boolean;
}

/** Scene contents only, render inside a react-three-fiber <Canvas> (see StaffViewer). */
export default function StaffModel({ pattern, autoRotate = true }: StaffModelProps) {
  const reducedMotion = useReducedMotion();
  const isOff = pattern === "off";

  useStudioEnvironment();

  const staffGroupRef = useRef<THREE.Group>(null);
  const poolMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const poleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: POLE_COLOR, roughness: 0.5, metalness: 0.05 }),
    []
  );

  const sway = !reducedMotion && autoRotate;
  useFrame((state) => {
    const staff = staffGroupRef.current;
    if (!staff) return;
    staff.rotation.z = sway ? Math.sin(state.clock.elapsedTime * 0.6) * 0.01 : 0;
  });

  return (
    <>
      <color attach="background" args={[SCENE_BG]} />
      <fog attach="fog" args={[SCENE_BG, 10, 30]} />

      <StudioLighting isOff={isOff} />
      <FloorPool materialRef={poolMaterialRef} />

      <group ref={staffGroupRef}>
        <mesh material={poleMat}>
          <cylinderGeometry args={[R_POLE, R_POLE, STAFF_H, 28]} />
        </mesh>

        <HandleAssembly />
        {[-1, 1].map((side) => (
          <RemotePod
            key={side}
            position={[side * (BR_R + 0.007), BR_TOP - BR_H / 2, 0]}
            rotationY={side > 0 ? Math.PI / 2 : -Math.PI / 2}
          />
        ))}
        <CableCoilAndLeads dims={LED_SECTION} />

        <StripRibbon dims={LED_SECTION} />
        <StripCircuitry dims={LED_SECTION} />
        <LedInstances
          dims={LED_SECTION}
          pattern={pattern}
          reducedMotion={reducedMotion}
          poolMaterialRef={poolMaterialRef}
        />
        <Membrane dims={LED_SECTION} isOff={isOff} />

        <Foot />
      </group>
    </>
  );
}

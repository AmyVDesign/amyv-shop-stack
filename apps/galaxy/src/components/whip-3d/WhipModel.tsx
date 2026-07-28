"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { computeDimensions } from "./dimensions";
import type { Length, Pattern } from "./types";
import { useStudioEnvironment } from "./useStudioEnvironment";
import { useReducedMotion } from "./useReducedMotion";
import UpperPole from "./UpperPole";
import StripBase from "./StripBase";
import StripRibbon from "./StripRibbon";
import Membrane from "./Membrane";
import StudioLighting from "./StudioLighting";
import FloorPool from "./FloorPool";
import LedInstances from "./led/LedInstances";
import StripCircuitry from "./led/StripCircuitry";
import CableAndRemote from "./cable/CableAndRemote";
import LowerAssembly from "./lower-assembly/LowerAssembly";

export type { Pattern, Length };

export interface WhipModelProps {
  pattern: Pattern;
  /** Hex color used when pattern === "solid". */
  color?: string;
  length?: Length;
  /** Animates the tent-pole fold when toggled. */
  folded?: boolean;
  /** Drives the idle product sway; snaps off under prefers-reduced-motion. */
  autoRotate?: boolean;
}

/** Scene contents only — render inside a react-three-fiber <Canvas> (see WhipViewer). */
export default function WhipModel({
  pattern,
  color = "#39ff14",
  length = "48in",
  folded = false,
  autoRotate = true,
}: WhipModelProps) {
  const reducedMotion = useReducedMotion();
  const dims = useMemo(() => computeDimensions(length), [length]);
  const isOff = pattern === "off";

  useStudioEnvironment();

  const whipGroupRef = useRef<THREE.Group>(null);
  const poolMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const sway = !reducedMotion && autoRotate;
  useFrame((state) => {
    const whip = whipGroupRef.current;
    if (!whip) return;
    whip.rotation.z = sway ? Math.sin(state.clock.elapsedTime * 0.7) * 0.012 : 0;
  });

  return (
    <>
      <color attach="background" args={["#0a0910"]} />
      <fog attach="fog" args={["#0a0910", 8, 24]} />

      <StudioLighting isOff={isOff} />
      <FloorPool dims={dims} materialRef={poolMaterialRef} />

      <group ref={whipGroupRef} position={[0, dims.WHIP_OFFSET, 0]}>
        <UpperPole dims={dims} />
        <LedInstances
          dims={dims}
          pattern={pattern}
          color={color}
          reducedMotion={reducedMotion}
          poolMaterialRef={poolMaterialRef}
        />
        <StripCircuitry dims={dims} />
        <StripRibbon dims={dims} />
        <Membrane dims={dims} isOff={isOff} />
        <StripBase dims={dims} />
        <CableAndRemote dims={dims} />
        <LowerAssembly dims={dims} folded={folded} reducedMotion={reducedMotion} />
      </group>
    </>
  );
}

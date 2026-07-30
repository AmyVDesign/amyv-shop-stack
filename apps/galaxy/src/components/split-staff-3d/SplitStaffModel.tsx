"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EX_HALF_PIVOT, EX_LIFT, EX_SIDE, EX_HALF } from "./dimensions";
import { SCENE_BG } from "./palette";
import type { SplitStaffPattern } from "./types";
import { useStudioEnvironment } from "./useStudioEnvironment";
import { useReducedMotion } from "./useReducedMotion";
import HalfAssembly from "./HalfAssembly";
import BatteryEjectEnd from "./BatteryEjectEnd";
import StudioLighting from "./StudioLighting";
import FloorPool from "./FloorPool";

export type { SplitStaffPattern };

export interface SplitStaffModelProps {
  pattern: SplitStaffPattern;
  /** Both halves lifted off the threaded union and stood side by side. */
  exploded: boolean;
  /** Battery ejected out of its holder at both ends at once. */
  ejected: boolean;
  /** Drives the idle product sway; snaps off under prefers-reduced-motion. */
  autoRotate?: boolean;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clampP = (t: number, a: number, b: number) => smooth(Math.max(0, Math.min(1, (t - a) / (b - a))));

/** Scene contents only, render inside a react-three-fiber <Canvas> (see SplitStaffViewer). */
export default function SplitStaffModel({
  pattern,
  exploded,
  ejected,
  autoRotate = true,
}: SplitStaffModelProps) {
  const reducedMotion = useReducedMotion();

  useStudioEnvironment();

  const rootGroupRef = useRef<THREE.Group>(null);
  const staffGroupRef = useRef<THREE.Group>(null);
  const lowerRigGroupRef = useRef<THREE.Group>(null);
  const poolMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const explodeTRef = useRef(0);

  const sway = !reducedMotion && autoRotate;

  useFrame((state) => {
    const root = rootGroupRef.current;
    if (root) root.rotation.z = sway ? Math.sin(state.clock.elapsedTime * 0.6) * 0.01 : 0;

    const staff = staffGroupRef.current;
    const lowerRig = lowerRigGroupRef.current;
    if (!staff || !lowerRig) return;

    const target = exploded ? 1 : 0;
    let explodeT = explodeTRef.current;
    if (explodeT === target) return;

    if (reducedMotion) {
      explodeT = target;
    } else {
      const d = target - explodeT;
      explodeT += Math.sign(d) * Math.min(Math.abs(d), 0.014);
      if (Math.abs(target - explodeT) < 0.001) explodeT = target;
    }
    explodeTRef.current = explodeT;

    // Lifts the upper half straight up off the threaded spigot so the
    // joint is readable, steps aside, then BOTH halves settle so they
    // stand vertically beside each other over the same span of height.
    // Nothing rotates the upper half: the halves screw together, so
    // separating them along the axis is what actually happens. The lower
    // half turns over about its OWN centre (lowerRig), so the far end
    // does not sweep a multi-unit arc through everything on the way
    // round, and it rises as the upper comes down, so the pair ends up
    // centred rather than sitting in the bottom of the frame. These four
    // phases deliberately don't share a parameter: turning over and
    // coming down together sweeps the far end back through the other
    // half.
    const lift = clampP(explodeT, 0, 0.3); // straight up off the spigot
    const side = clampP(explodeT, 0.25, 0.55); // across, out of the way
    const flip = clampP(explodeT, 0.5, 0.8); // lower half turns over
    const settle = clampP(explodeT, 0.75, 1); // both to the same height

    staff.position.set(EX_SIDE * side, EX_LIFT * lift + (-EX_HALF - EX_LIFT) * settle, 0);
    lowerRig.rotation.z = Math.PI * flip;
    lowerRig.position.y = -EX_HALF + EX_HALF * settle;
  });

  return (
    <>
      <color attach="background" args={[SCENE_BG]} />
      <fog attach="fog" args={[SCENE_BG, 10, 30]} />

      <StudioLighting isOff={pattern === "off"} />
      <FloorPool materialRef={poolMaterialRef} />

      <group ref={rootGroupRef}>
        <group ref={staffGroupRef}>
          <HalfAssembly dir={1} pattern={pattern} reducedMotion={reducedMotion} poolMaterialRef={poolMaterialRef} />
          <BatteryEjectEnd dir={1} ejected={ejected} reducedMotion={reducedMotion} />
        </group>
        <group ref={lowerRigGroupRef} position={[0, -EX_HALF_PIVOT, 0]}>
          <group position={[0, EX_HALF_PIVOT, 0]}>
            <HalfAssembly dir={-1} pattern={pattern} reducedMotion={reducedMotion} poolMaterialRef={poolMaterialRef} />
            <BatteryEjectEnd dir={-1} ejected={ejected} reducedMotion={reducedMotion} />
          </group>
        </group>
      </group>
    </>
  );
}

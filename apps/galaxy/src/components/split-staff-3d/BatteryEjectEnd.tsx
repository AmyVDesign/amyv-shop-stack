"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BAT_BOT,
  PLUG_PIVOT_Y,
  PLUG_RISE,
  PLUG_TILT,
  EJ_SIDE,
  EJ_RISE,
  EJ_SETTLE,
  POLE_TOP,
  mirrorY,
} from "./dimensions";
import { HANDLE_WHITE } from "./palette";
import BatteryEndVisual from "./BatteryEndVisual";
import PlugRig from "./PlugRig";
import HolderSocket from "./HolderSocket";

interface BatteryEjectEndProps {
  dir: 1 | -1;
  ejected: boolean;
  reducedMotion: boolean;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clampP = (t: number, a: number, b: number) => smooth(Math.max(0, Math.min(1, (t - a) / (b - a))));

// Scratch, module-level (not hook state), mutated synchronously within a
// single frame's eject update, never read across renders.
const _up = new THREE.Vector3();

/**
 * Builds the short lead holding the plug in THIS end's own local frame.
 * The cable mesh is a child of the half's group, so the curve has to be
 * in that frame, not world: `exit`/`az` are the plug group's own
 * position/rotation.z, already the frame we want, not converted through
 * world space and back (that applies the half's transform twice, which
 * throws the cord hundreds of millimetres off once the halves separate,
 * and the lower one also picks up the 180 degree base rotation again).
 */
function buildLeadCurve(anchor: THREE.Vector3, exit: THREE.Vector3, az: number, d: 1 | -1) {
  _up.set(-Math.sin(az), Math.cos(az), 0);
  return new THREE.CubicBezierCurve3(
    anchor.clone(),
    anchor.clone().add(new THREE.Vector3(0.008, d * 0.09, 0)),
    exit.clone().addScaledVector(_up, -0.08),
    exit.clone()
  );
}

/**
 * Battery eject, at one end. Each end works in its own frame (see
 * `buildLeadCurve`), so the lower one reads correctly whether or not its
 * half has been turned over by the explode animation. Ejecting runs three
 * phases that deliberately do not share a parameter: lift straight up out
 * of the socket, swing out to the side and turn over, then drop to settle,
 * because turning over and coming down together sweeps the far end back
 * through the holder. Rendered once per half; both instances ease their
 * own local `ejectT` from the same `ejected` prop using the same
 * deterministic step, so they stay in lockstep without sharing state.
 */
export default function BatteryEjectEnd({ dir, ejected, reducedMotion }: BatteryEjectEndProps) {
  const Y = useMemo(() => (v: number) => (dir > 0 ? v : mirrorY(v)), [dir]);
  const base = dir > 0 ? 0 : Math.PI;

  const batGroupRef = useRef<THREE.Group>(null);
  const plugGroupRef = useRef<THREE.Group>(null);
  const cableMeshRef = useRef<THREE.Mesh>(null);
  const ejectTRef = useRef(0);

  const cableAnchor = useMemo(() => new THREE.Vector3(0, Y(POLE_TOP) + dir * 0.01, 0), [Y, dir]);
  const cableMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.5 }),
    []
  );
  const initialCableGeo = useMemo(() => {
    const exit = new THREE.Vector3(0, Y(PLUG_PIVOT_Y), 0);
    const curve = buildLeadCurve(cableAnchor, exit, base, dir);
    return new THREE.TubeGeometry(curve, 28, 0.0105, 8, false);
  }, [cableAnchor, Y, base, dir]);
  useEffect(() => {
    const mesh = cableMeshRef.current;
    return () => {
      mesh?.geometry.dispose();
    };
  }, []);

  useFrame(() => {
    const batGroup = batGroupRef.current;
    const plugGroup = plugGroupRef.current;
    const cableMesh = cableMeshRef.current;
    if (!batGroup || !plugGroup || !cableMesh) return;

    const target = ejected ? 1 : 0;
    let ejectT = ejectTRef.current;
    if (ejectT === target) return;

    if (reducedMotion) {
      ejectT = target;
    } else {
      const d = target - ejectT;
      ejectT += Math.sign(d) * Math.min(Math.abs(d), 0.016);
      if (Math.abs(target - ejectT) < 0.001) ejectT = target;
    }
    ejectTRef.current = ejectT;

    const lift = clampP(ejectT, 0, 0.4);
    const swing = clampP(ejectT, 0.35, 0.72);
    const drop = clampP(ejectT, 0.7, 1);

    batGroup.position.set(
      EJ_SIDE * swing,
      Y(BAT_BOT) + dir * (EJ_RISE * lift + (EJ_SETTLE - EJ_RISE) * drop),
      0
    );
    batGroup.rotation.z = base + dir * Math.PI * swing;

    plugGroup.position.y = Y(PLUG_PIVOT_Y) + dir * PLUG_RISE * lift;
    plugGroup.rotation.z = base - dir * PLUG_TILT * swing;

    const lead = buildLeadCurve(cableAnchor, plugGroup.position, plugGroup.rotation.z, dir);
    const oldGeo = cableMesh.geometry;
    cableMesh.geometry = new THREE.TubeGeometry(lead, 28, 0.0105, 8, false);
    oldGeo.dispose();
  });

  return (
    <>
      <BatteryEndVisual groupRef={batGroupRef} dir={dir} />
      <PlugRig groupRef={plugGroupRef} dir={dir} />
      <HolderSocket dir={dir} />
      <mesh ref={cableMeshRef} geometry={initialCableGeo} material={cableMat} />
    </>
  );
}

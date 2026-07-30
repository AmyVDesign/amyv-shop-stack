"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BAT_BOT,
  PLUG_PIVOT_Y,
  PLUG_RISE,
  PLUG_TILT,
  EJ_CLEAR,
  EJ_SIDE,
  EJ_REST,
  CABLE_ANCHOR,
} from "./dimensions";
import { HANDLE_WHITE } from "./palette";
import Battery from "./Battery";
import PlugRig from "./PlugRig";

interface BatteryEjectProps {
  ejected: boolean;
  reducedMotion: boolean;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clampPhase = (ejectT: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (ejectT - a) / (b - a)));

// Scratch, module-level (not hook state), mutated synchronously within a
// single frame's eject update, never read across renders.
const _up = new THREE.Vector3();

function buildLeadCurve(plugPosition: THREE.Vector3, plugQuaternion: THREE.Quaternion) {
  _up.set(0, 1, 0).applyQuaternion(plugQuaternion);
  return new THREE.CubicBezierCurve3(
    CABLE_ANCHOR.clone(),
    CABLE_ANCHOR.clone().add(new THREE.Vector3(0.01, 0.16, 0)), // inside the socket
    plugPosition.clone().addScaledVector(_up, -0.14), // eases onto the plug
    plugPosition.clone()
  );
}

/**
 * Eject animation: how you charge it. The battery lives in a group pivoted
 * on its port face (Battery); ejecting runs three phases that deliberately
 * don't share a parameter: lift straight up out of the socket, swing out
 * to the side and turn over at height, then drop to settle. Sharing one
 * parameter between the turn and the drop sweeps the far end back through
 * the holder, and swinging lower than EJ_CLEAR puts the dome end through
 * the plug (PlugRig), both found and fixed by numeric clearance checks in
 * the prototype, kept here as the same phase split with the same
 * constants. The captive lead rises and leans on the lift curve alone, so
 * it withdraws before any rotation starts.
 *
 * Drives the eased value with useFrame and mutates refs directly rather
 * than React state, since this runs every frame.
 */
export default function BatteryEject({ ejected, reducedMotion }: BatteryEjectProps) {
  const batGroupRef = useRef<THREE.Group>(null);
  const plugGroupRef = useRef<THREE.Group>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const cableMeshRef = useRef<THREE.Mesh>(null);
  const ejectTRef = useRef(0);

  const cableMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.5 }),
    []
  );
  const initialCableGeo = useMemo(() => {
    const curve = buildLeadCurve(new THREE.Vector3(0, PLUG_PIVOT_Y, 0), new THREE.Quaternion());
    return new THREE.TubeGeometry(curve, 32, 0.0105, 8, false);
  }, []);
  useEffect(() => {
    const mesh = cableMeshRef.current;
    return () => {
      mesh?.geometry.dispose();
    };
  }, []);

  useFrame(() => {
    const batGroup = batGroupRef.current;
    const plugGroup = plugGroupRef.current;
    const ringMaterial = ringMaterialRef.current;
    const cableMesh = cableMeshRef.current;
    if (!batGroup || !plugGroup || !ringMaterial || !cableMesh) return;

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

    // Three phases, deliberately not sharing a parameter. Turning over and
    // coming down at the same time swings the far end back through the
    // holder, so the swing happens up at EJ_CLEAR and the drop only starts
    // once it is out to the side and the right way up.
    const lift = smooth(clampPhase(ejectT, 0, 0.4)); // straight up out of the socket
    const swing = smooth(clampPhase(ejectT, 0.35, 0.72)); // out to the side, turning over
    const drop = smooth(clampPhase(ejectT, 0.7, 1)); // settle to staff height

    batGroup.position.set(
      EJ_SIDE * swing,
      BAT_BOT + (EJ_CLEAR - BAT_BOT) * lift + (EJ_REST - EJ_CLEAR) * drop,
      0
    );
    batGroup.rotation.z = Math.PI * swing;

    const tilt = swing;
    ringMaterial.opacity = tilt * 0.9;

    // the plug follows the battery out, then leans the opposite way so the
    // two do not stack on top of each other in the frame
    plugGroup.position.y = PLUG_PIVOT_Y + PLUG_RISE * lift;
    plugGroup.rotation.z = -PLUG_TILT * tilt;
    plugGroup.updateMatrixWorld(true);

    const lead = buildLeadCurve(plugGroup.position, plugGroup.quaternion);
    const oldGeo = cableMesh.geometry;
    cableMesh.geometry = new THREE.TubeGeometry(lead, 32, 0.0105, 8, false);
    oldGeo.dispose();
  });

  return (
    <>
      <Battery groupRef={batGroupRef} ringMaterialRef={ringMaterialRef} />
      <PlugRig groupRef={plugGroupRef} />
      <mesh ref={cableMeshRef} geometry={initialCableGeo} material={cableMat} />
    </>
  );
}

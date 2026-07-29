"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  type LedSectionDims,
  R_POLE,
  S,
  BR_R,
  BR_TOP,
  BR_H,
  POD_H,
  BOSS_LEN,
  BOSS_LAP,
  COIL_TOP,
  COIL_PITCH,
  COIL_TURNS,
  COIL_DIR,
} from "./dimensions";
import { HANDLE_WHITE, MOUTH_RING_DARK, WIRE_RED, WIRE_BLUE, WIRE_BLACK, WIRE_BLOB_SILVER } from "./palette";
import { FnCurve } from "./curves";

interface CableCoilAndLeadsProps {
  dims: LedSectionDims;
}

const WIRE_COLORS = [WIRE_RED, WIRE_BLUE, WIRE_BLACK];

/**
 * Tight cable coil: the white power cable wrapped ~10 turns, ending in an
 * open cut mouth. The leads start INSIDE that mouth and travel forward in
 * the cable's own direction, so they read as the conductors of the white
 * cord rather than three loose wires beside it. Both remotes carry a drop
 * cable that meets the coil where it has come round to that remote's own
 * side of the pole, with its landing tangent taken from the coil itself so
 * the join reads as one continuous cord.
 */
export default function CableCoilAndLeads({ dims }: CableCoilAndLeadsProps) {
  const { y1: SEC_TOP, turns: SEC_TURNS } = dims;

  const whiteMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45, side: THREE.DoubleSide }),
    []
  );
  const dropMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45 }),
    []
  );
  const ringMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: MOUTH_RING_DARK, roughness: 0.8, side: THREE.DoubleSide }),
    []
  );
  const blobMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: WIRE_BLOB_SILVER, roughness: 0.25, metalness: 0.9 }),
    []
  );

  const built = useMemo(() => {
    const cTurns = COIL_TURNS;
    const cPitch = COIL_PITCH;
    const cR = R_POLE + 0.012 * S;
    const R_JACKET = 0.017 * S;

    const coilCurve = new FnCurve((t) => {
      const a = COIL_DIR * t * cTurns * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * cR, COIL_TOP - t * cTurns * cPitch, Math.sin(a) * cR);
    });
    const coilGeo = new THREE.TubeGeometry(coilCurve, 360, R_JACKET, 10, false);

    // each remote's own drop cable, landing on the coil at the point where
    // it has come round to that remote's side of the pole
    const tipY = BR_TOP - BR_H / 2 - POD_H / 2 - BOSS_LEN + BOSS_LAP;
    function dropCableGeo(side: number, tCoil: number) {
      const podX = side * (BR_R + 0.007);
      const land = coilCurve.getPoint(tCoil);
      const a = COIL_DIR * tCoil * cTurns * Math.PI * 2;
      const ct = new THREE.Vector3(
        -Math.sin(a) * cR * COIL_DIR,
        -cPitch / (Math.PI * 2),
        Math.cos(a) * cR * COIL_DIR
      ).normalize();
      const drop = new THREE.CubicBezierCurve3(
        new THREE.Vector3(podX, tipY + 0.014, 0), // inside the boss
        new THREE.Vector3(podX, tipY - 0.026, 0), // leaves straight down
        land.clone().addScaledVector(ct, -0.038), // eases onto the coil
        land
      );
      return new THREE.TubeGeometry(drop, 48, R_JACKET, 10, false);
    }
    const dropGeoA = dropCableGeo(1, 0); // coil starts at +x
    const dropGeoB = dropCableGeo(-1, 1 / (2 * cTurns)); // half a turn to -x

    const A_MOUTH = COIL_DIR * cTurns * Math.PI * 2;
    const Y_MOUTH = COIL_TOP - cTurns * cPitch;

    // dark ring at the cut so the mouth reads as an opening
    const tan = new THREE.Vector3(-Math.sin(A_MOUTH), 0, Math.cos(A_MOUTH))
      .multiplyScalar(COIL_DIR * cR * Math.PI * 2)
      .setY(-cPitch)
      .normalize();
    const ringGeo = new THREE.CircleGeometry(R_JACKET * 0.72, 14);
    const ringQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      tan
    );
    const ringPosition: [number, number, number] = [
      Math.cos(A_MOUTH) * cR - tan.x * 0.004,
      Y_MOUTH - tan.y * 0.004,
      Math.sin(A_MOUTH) * cR - tan.z * 0.004,
    ];

    // red / blue / black leads: bunched inside the jacket, then fanning out
    // across the strip pads. Radii stay inside the membrane. The leads
    // continue the way the cable was already travelling, so the sweep
    // takes the sign of COIL_DIR rather than doubling back.
    const W_END_R = R_POLE + 0.009 * S;
    const A_STRIP = SEC_TURNS * Math.PI * 2;
    let dA = (A_STRIP - A_MOUTH) % (Math.PI * 2);
    if (COIL_DIR > 0 && dA < 0) dA += Math.PI * 2;
    if (COIL_DIR < 0 && dA > 0) dA -= Math.PI * 2;
    const A_IN = A_MOUTH - COIL_DIR * 0.34; // start buried in the jacket

    const wires = WIRE_COLORS.map((color, i) => {
      const yIn = Y_MOUTH + (0.34 * cPitch) / (Math.PI * 2) + (1 - i) * 0.009 * S; // in sheath
      const yEnd = SEC_TOP + 0.014 * S - i * 0.017 * S; // across pads
      const wCurve = new FnCurve((t) => {
        const a = A_IN + (A_MOUTH + dA - A_IN) * t;
        const u = Math.max(0, (a - A_MOUTH) / dA); // 0 while still inside the sheath
        const e = u * u * (3 - 2 * u);
        const r = cR + (W_END_R - cR) * e;
        const y = yIn + (yEnd - yIn) * e - 0.005 * S * Math.sin(Math.PI * u);
        return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      });
      const geo = new THREE.TubeGeometry(wCurve, 64, 0.0055 * S, 7, false);
      const end = wCurve.getPoint(1);
      return { color, geo, end };
    });

    const blobGeo = new THREE.SphereGeometry(0.011 * S, 10, 8);

    return { coilGeo, dropGeoA, dropGeoB, ringGeo, ringQuaternion, ringPosition, wires, blobGeo };
  }, [SEC_TOP, SEC_TURNS]);

  return (
    <>
      <mesh geometry={built.coilGeo} material={whiteMat} />
      <mesh geometry={built.dropGeoA} material={dropMat} />
      <mesh geometry={built.dropGeoB} material={dropMat} />
      <mesh
        geometry={built.ringGeo}
        material={ringMat}
        quaternion={built.ringQuaternion}
        position={built.ringPosition}
      />
      {built.wires.map((wire, i) => (
        <group key={i}>
          <mesh geometry={wire.geo}>
            <meshStandardMaterial color={wire.color} roughness={0.5} />
          </mesh>
          <mesh geometry={built.blobGeo} material={blobMat} scale={[1, 0.7, 1]} position={wire.end} />
        </group>
      ))}
    </>
  );
}

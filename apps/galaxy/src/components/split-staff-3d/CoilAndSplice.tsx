"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { R_POLE, S, COIL_PITCH, COIL_TURNS, COIL_DIR, BR_R, POD_H, BOSS_LEN, BOSS_LAP } from "./dimensions";
import { HANDLE_WHITE, MOUTH_RING_DARK, WIRE_RED, WIRE_BLUE, WIRE_BLACK, WIRE_BLOB_SILVER } from "./palette";
import { FnCurve } from "./curves";

interface CoilAndSpliceProps {
  dir: 1 | -1;
  /** COIL_TOP for the upper half, mirrorY(COIL_TOP) for the lower. */
  coilTopY: number;
  /** This half's own remote pod's centre height (BR_TOP - BR_H/2, mirrored for the lower half). */
  podY: number;
  /** The end of this half's own LED section that the splice leads land on: sec.y1 for the upper half, sec.y0 for the lower. */
  secLandY: number;
}

const WIRE_COLORS = [WIRE_RED, WIRE_BLUE, WIRE_BLACK];

/**
 * Tight cable coil, built once per half, with dir the only thing that
 * changes the heights: the cable keeps one handedness because one person
 * wound both, but the coil's own winding direction (`cd = COIL_DIR * dir`)
 * mirrors along with the heights, because the strip's helix angle rises
 * with height at both ends, so the battery end's strip arrives at its top
 * from one side while the foot end's departs its bottom toward the other.
 * The leads land on the strip at a FIXED short sweep from the cable mouth
 * (`dA`, derived from the SAME whole-turn count that sets the coil's wrap
 * count, not a separate constant), and the landing height is then solved
 * from the strip's own helix, so the red/blue/black runs stay short
 * whatever the coil turn count is.
 */
export default function CoilAndSplice({ dir, coilTopY, podY, secLandY }: CoilAndSpliceProps) {
  const coilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: HANDLE_WHITE, roughness: 0.45, side: THREE.DoubleSide }),
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
    const cd = COIL_DIR * dir;
    const ang = (t: number) => cd * t * cTurns * Math.PI * 2;

    const coilCurve = new FnCurve(
      (t) => new THREE.Vector3(Math.cos(ang(t)) * cR, coilTopY - dir * t * cTurns * cPitch, Math.sin(ang(t)) * cR)
    );
    const coilGeo = new THREE.TubeGeometry(coilCurve, 260, R_JACKET, 10, false);

    // one cable, from the single remote on this end
    const podX = BR_R + 0.007;
    const bossTip = podY - dir * (POD_H / 2 + BOSS_LEN - BOSS_LAP);
    const land = coilCurve.getPoint(0);
    const ct = new THREE.Vector3(0, (-dir * cPitch) / (Math.PI * 2), cR * cd).normalize();
    const dropCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(podX, bossTip + dir * 0.014, 0),
      new THREE.Vector3(podX, bossTip - dir * 0.026, 0),
      land.clone().addScaledVector(ct, -0.038),
      land
    );
    const dropGeo = new THREE.TubeGeometry(dropCurve, 48, R_JACKET, 10, false);

    const A_MOUTH = ang(1);
    const Y_MOUTH = coilTopY - dir * cTurns * cPitch;

    // dark ring at the cut so the mouth reads as an opening
    const tan = new THREE.Vector3(-Math.sin(A_MOUTH), 0, Math.cos(A_MOUTH))
      .multiplyScalar(cd * cR * Math.PI * 2)
      .setY(-dir * cPitch)
      .normalize();
    const ringGeo = new THREE.CircleGeometry(R_JACKET * 0.72, 14);
    const ringQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    const ringPosition: [number, number, number] = [
      Math.cos(A_MOUTH) * cR - tan.x * 0.004,
      Y_MOUTH - tan.y * 0.004,
      Math.sin(A_MOUTH) * cR - tan.z * 0.004,
    ];

    // red / blue / black leads: bunched inside the jacket, then fanning out
    // across the strip pads, landing on the end of the strip itself so the
    // run of chips and the leads read as one thing. Both section ends sit
    // at helix angle zero because each section is a whole number of turns,
    // so the sweep (dA) is the same at both.
    const W_END_R = R_POLE + 0.009 * S;
    const dA = cd * (1 - (cTurns % 1)) * Math.PI * 2;
    const A_IN = A_MOUTH - cd * 0.34;

    const wires = WIRE_COLORS.map((color, i) => {
      const yIn = Y_MOUTH + dir * ((0.34 * cPitch) / (Math.PI * 2) + (1 - i) * 0.009 * S);
      const yEnd = secLandY + dir * (0.014 * S - i * 0.017 * S);
      const wCurve = new FnCurve((t) => {
        const a = A_IN + (A_MOUTH + dA - A_IN) * t;
        const u = Math.max(0, (a - A_MOUTH) / dA);
        const e = u * u * (3 - 2 * u);
        const r = cR + (W_END_R - cR) * e;
        // sag squared, not sag: plain sin(pi*u) has a slope at both ends, so
        // the wire kinked where it left the jacket and again at the blob
        const sg = Math.sin(Math.PI * u);
        const y = yIn + (yEnd - yIn) * e - dir * 0.006 * S * sg * sg;
        return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      });
      const geo = new THREE.TubeGeometry(wCurve, 72, 0.0055 * S, 8, false);
      const end = wCurve.getPoint(1);
      return { color, geo, end };
    });

    const blobGeo = new THREE.SphereGeometry(0.011 * S, 10, 8);

    return { coilGeo, dropGeo, ringGeo, ringQuaternion, ringPosition, wires, blobGeo };
  }, [dir, coilTopY, podY, secLandY]);

  return (
    <>
      <mesh geometry={built.coilGeo} material={coilMat} />
      <mesh geometry={built.dropGeo} material={dropMat} />
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

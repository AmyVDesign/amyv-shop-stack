"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { JOINT_Y, SOCK_R, SOCK_H, COUP_R, COUP_H } from "./dimensions";
import { JOINT_WHITE } from "./palette";
import { FnCurve } from "./curves";

/** Helical thread, used for both the male spigot and the socket bore. */
function threadGeo(r: number, y0: number, y1: number, turns: number, rad: number) {
  const curve = new FnCurve(
    (t) =>
      new THREE.Vector3(
        Math.cos(t * turns * Math.PI * 2) * r,
        y0 + (y1 - y0) * t,
        Math.sin(t * turns * Math.PI * 2) * r
      )
  );
  return new THREE.TubeGeometry(curve, Math.round(turns * 14), rad, 6, false);
}

const SOCK_LEN = SOCK_H;
const SOCK_CENTER = JOINT_Y + SOCK_H / 2;
const SOCK_THREAD_Y0 = JOINT_Y + 0.01;
const SOCK_THREAD_Y1 = JOINT_Y + SOCK_H - 0.02;
const COUP_LEN = COUP_H;
const COUP_CENTER = JOINT_Y + SOCK_H + COUP_H / 2;

/**
 * Upper half of the threaded union: the female socket that screws down
 * over the lower half's spigot, open-ended and double-sided so the bore
 * reads correctly, with a plain slip coupling above it. Everything is
 * positioned from JOINT_Y so the parting plane is one number.
 */
export default function JointUpper() {
  const socketMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: JOINT_WHITE, roughness: 0.42, side: THREE.DoubleSide }),
    []
  );
  const whiteJ = useMemo(
    () => new THREE.MeshStandardMaterial({ color: JOINT_WHITE, roughness: 0.42 }),
    []
  );
  const sockThreadGeo = useMemo(
    () => threadGeo(SOCK_R - 0.011, SOCK_THREAD_Y0, SOCK_THREAD_Y1, 4, 0.004),
    []
  );

  return (
    <>
      <mesh material={socketMat} position={[0, SOCK_CENTER, 0]}>
        <cylinderGeometry args={[SOCK_R, SOCK_R, SOCK_LEN, 30, 1, true]} />
      </mesh>
      <mesh geometry={sockThreadGeo} material={whiteJ} />
      <mesh material={whiteJ} position={[0, COUP_CENTER, 0]}>
        <cylinderGeometry args={[COUP_R, COUP_R, COUP_LEN, 30]} />
      </mesh>
    </>
  );
}

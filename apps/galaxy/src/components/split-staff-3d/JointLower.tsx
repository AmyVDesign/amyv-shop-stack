"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { JOINT_Y, SPIG_R, SPIG_H, R_POLE, HEX_R, HEX_H, SLV_R, SLV_H } from "./dimensions";
import { JOINT_WHITE, JOINT_FROSTED } from "./palette";
import { buildJointLabelTexture } from "./textures";
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

/** A cylinder spanning [y0, y1], matching the prototype's `tube(r, y0, y1, ...)` helper. */
const tubeSpan = (y0: number, y1: number): [number, number] => [y1 - y0, (y0 + y1) / 2];

const [SPIG_LEN, SPIG_CENTER] = tubeSpan(JOINT_Y, JOINT_Y + SPIG_H);
const [SPIG_THREAD_Y0, SPIG_THREAD_Y1] = [JOINT_Y + 0.008, JOINT_Y + SPIG_H - 0.008];
const [FROSTED_LEN, FROSTED_CENTER] = tubeSpan(JOINT_Y - 0.02, JOINT_Y + SPIG_H * 0.88);
const [SLV_LEN, SLV_CENTER] = tubeSpan(JOINT_Y - HEX_H - SLV_H, JOINT_Y - HEX_H);

/**
 * Lower half of the threaded union: a male spigot with helical threads
 * pointing up, a frosted inner sleeve, a hex collar under it, and a sticker
 * sleeve carrying a plain white "The_Galaxy_SF" label (not the yellow
 * handle sticker, that stays on the upper bracket only). Everything is
 * positioned from JOINT_Y so the parting plane is one number.
 */
export default function JointLower() {
  const whiteJ = useMemo(
    () => new THREE.MeshStandardMaterial({ color: JOINT_WHITE, roughness: 0.42 }),
    []
  );
  const frosted = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: JOINT_FROSTED,
        roughness: 0.35,
        transparent: true,
        opacity: 0.93,
      }),
    []
  );

  const spigThreadGeo = useMemo(
    () => threadGeo(SPIG_R + 0.004, SPIG_THREAD_Y0, SPIG_THREAD_Y1, 4, 0.0045),
    []
  );

  const label = useMemo(() => buildJointLabelTexture(), []);
  useEffect(() => () => label.texture.dispose(), [label]);
  const labelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: label.texture, roughness: 0.5, side: THREE.DoubleSide }),
    [label]
  );
  const labelGeo = useMemo(() => {
    const LW = SLV_R * 1.55;
    const LH = LW / label.aspect;
    const arc = LW / (SLV_R + 0.002);
    return new THREE.CylinderGeometry(SLV_R + 0.002, SLV_R + 0.002, LH, 28, 1, true, -arc / 2, arc);
  }, [label]);

  return (
    <>
      <mesh material={whiteJ} position={[0, SPIG_CENTER, 0]}>
        <cylinderGeometry args={[SPIG_R, SPIG_R, SPIG_LEN, 26, 1, true]} />
      </mesh>
      <mesh geometry={spigThreadGeo} material={whiteJ} />
      <mesh material={frosted} position={[0, FROSTED_CENTER, 0]}>
        <cylinderGeometry args={[R_POLE * 0.84, R_POLE * 0.84, FROSTED_LEN, 22, 1, true]} />
      </mesh>
      <mesh material={whiteJ} position={[0, JOINT_Y - HEX_H / 2, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[HEX_R, HEX_R, HEX_H, 6]} />
      </mesh>
      <mesh material={whiteJ} position={[0, SLV_CENTER, 0]}>
        <cylinderGeometry args={[SLV_R, SLV_R, SLV_LEN, 30]} />
      </mesh>
      <mesh geometry={labelGeo} material={labelMat} position={[0, SLV_CENTER, 0]} />
    </>
  );
}

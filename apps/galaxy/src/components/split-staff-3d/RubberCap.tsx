"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { CAP_R, CAP_H2, S } from "./dimensions";
import { CAP_RUBBER } from "./palette";

interface RubberCapProps {
  /** Outer-most point of the cap along the axis. */
  yOuter: number;
  dir: 1 | -1;
}

const RIB_COUNT = 8;
const RIB_ANGLES = Array.from({ length: RIB_COUNT }, (_, i) => (i / RIB_COUNT) * Math.PI * 2);

/**
 * The same rubber cap at both ends: an open-ended collar into a shallow
 * dome with 8 moulded ribs. One part, used twice (dir is +1 for the closed
 * end pointing up).
 */
export default function RubberCap({ yOuter, dir }: RubberCapProps) {
  const capMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CAP_RUBBER, roughness: 0.85 }),
    []
  );
  const domeGeo = useMemo(
    () => new THREE.SphereGeometry(CAP_R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    []
  );
  const ribGeo = useMemo(() => new THREE.BoxGeometry(0.02 * S, CAP_H2 * 0.58, 0.01 * S), []);

  return (
    <>
      <mesh material={capMat} position={[0, yOuter - (dir * CAP_H2) / 2, 0]}>
        <cylinderGeometry args={[CAP_R, CAP_R, CAP_H2, 28, 1, true]} />
      </mesh>
      {/* flip rather than scale negative, which would invert the normals */}
      <mesh
        geometry={domeGeo}
        material={capMat}
        scale={[1, 0.3, 1]}
        rotation={[dir < 0 ? Math.PI : 0, 0, 0]}
        position={[0, yOuter, 0]}
      />
      {RIB_ANGLES.map((a, i) => (
        <mesh
          key={i}
          geometry={ribGeo}
          material={capMat}
          position={[Math.cos(a) * CAP_R * 0.99, yOuter - dir * CAP_H2 * 0.52, Math.sin(a) * CAP_R * 0.99]}
          rotation={[0, -a, 0]}
        />
      ))}
    </>
  );
}

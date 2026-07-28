import * as THREE from "three";

interface MouthProps {
  y: number;
  flip: boolean;
  R_POLE: number;
  wallMat: THREE.Material;
  inMat: THREE.Material;
}

/** Open tube mouth: a wall ring plus a recessed dark interior disc, so a joint reads as a hollow tube end rather than a capped pole. */
export default function Mouth({ y, flip, R_POLE, wallMat, inMat }: MouthProps) {
  return (
    <>
      <mesh
        material={wallMat}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, y, 0]}
      >
        <torusGeometry args={[R_POLE * 0.86, R_POLE * 0.16, 8, 22]} />
      </mesh>
      <mesh
        material={inMat}
        rotation={[flip ? -Math.PI / 2 : Math.PI / 2, 0, 0]}
        position={[0, y + (flip ? 0.03 : -0.03), 0]}
      >
        <circleGeometry args={[R_POLE * 0.74, 20]} />
      </mesh>
    </>
  );
}

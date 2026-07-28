"use client";

import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import type { WhipDimensions } from "./dimensions";
import { buildGlowTexture } from "./textures";

interface FloorPoolProps {
  dims: WhipDimensions;
  materialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/** Soft additive glow disc under the whip, tinted each frame to the average lit LED color by LedInstances. */
export default function FloorPool({ dims, materialRef }: FloorPoolProps) {
  const { ASSEMBLY_BOTTOM, WHIP_OFFSET } = dims;

  const glowTexture = useMemo(() => buildGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, ASSEMBLY_BOTTOM + WHIP_OFFSET - 0.05, 0]}
    >
      <circleGeometry args={[2.2, 40]} />
      <meshBasicMaterial
        ref={materialRef}
        map={glowTexture}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

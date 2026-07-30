"use client";

import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { BOT_Y } from "./dimensions";
import { buildGlowTexture } from "./textures";

interface FloorPoolProps {
  materialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/** Soft additive glow disc under the staff, tinted each frame to the average lit LED color by LedInstances. Own copy of the sibling trees' floor pool. */
export default function FloorPool({ materialRef }: FloorPoolProps) {
  const glowTexture = useMemo(() => buildGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOT_Y - 0.5, 0]}>
      <circleGeometry args={[3.0, 40]} />
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

"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeHelixBasis, type WhipDimensions } from "../dimensions";

interface StripCircuitryProps {
  dims: WhipDimensions;
}

/** Oval copper pads flanking a small silver component in every gap between LED packages, matching the macro strip photos. */
export default function StripCircuitry({ dims }: StripCircuitryProps) {
  const { COUNT, R_POLE, STRIP_W, CHIP_ARC } = dims;

  const padsRef = useRef<THREE.InstancedMesh>(null);
  const compsRef = useRef<THREE.InstancedMesh>(null);

  const padMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xc98850, roughness: 0.35, metalness: 0.85 }),
    []
  );
  const padGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(STRIP_W * 0.1, STRIP_W * 0.1, 0.003, 10);
    geo.scale(1, 1, 1.5);
    return geo;
  }, [STRIP_W]);
  const compMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.3, metalness: 0.8 }),
    []
  );
  const compGeo = useMemo(
    () => new THREE.BoxGeometry(CHIP_ARC * 0.14, 0.006, STRIP_W * 0.16),
    [CHIP_ARC, STRIP_W]
  );

  useEffect(() => {
    const pads = padsRef.current;
    const comps = compsRef.current;
    if (!pads || !comps) return;

    const helixBasis = makeHelixBasis(dims);
    const m = new THREE.Matrix4();
    const pv = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      const t = (i + 0.5) / (COUNT - 1);
      const b = helixBasis(Math.min(t, 1));
      [-1, 1].forEach((s, j) => {
        pv
          .copy(b.outward)
          .multiplyScalar(R_POLE + 0.011)
          .addScaledVector(b.side, s * STRIP_W * 0.26);
        pv.y += b.y;
        m.makeBasis(b.tangent, b.outward, b.side);
        m.setPosition(pv);
        pads.setMatrixAt(i * 2 + j, m);
      });
      pv.copy(b.outward).multiplyScalar(R_POLE + 0.012);
      pv.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pv);
      comps.setMatrixAt(i, m);
    }
    pads.instanceMatrix.needsUpdate = true;
    comps.instanceMatrix.needsUpdate = true;
  }, [dims, COUNT, R_POLE, STRIP_W]);

  return (
    <>
      <instancedMesh ref={padsRef} args={[padGeo, padMat, COUNT * 2]} />
      <instancedMesh ref={compsRef} args={[compGeo, compMat, COUNT]} />
    </>
  );
}

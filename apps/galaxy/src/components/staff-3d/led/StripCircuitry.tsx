"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeHelixBasis, type LedSectionDims, R_POLE, STRIP_W, S } from "../dimensions";
import { PAD_COPPER, COMPONENT_SILVER } from "../palette";

interface StripCircuitryProps {
  dims: LedSectionDims;
}

/**
 * Oval copper pads flanking a small silver component in every gap between
 * LED packages, matching the macro strip photos. Own copy of the whip's
 * circuitry builder.
 */
export default function StripCircuitry({ dims }: StripCircuitryProps) {
  const { y0, span, turns, count, chipArc } = dims;

  const padsRef = useRef<THREE.InstancedMesh>(null);
  const compsRef = useRef<THREE.InstancedMesh>(null);

  const padMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: PAD_COPPER, roughness: 0.35, metalness: 0.85 }),
    []
  );
  const padGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(STRIP_W * 0.1, STRIP_W * 0.1, 0.004 * S, 10);
    geo.scale(1, 1, 1.5);
    return geo;
  }, []);
  const compMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COMPONENT_SILVER, roughness: 0.3, metalness: 0.8 }),
    []
  );
  const compGeo = useMemo(
    () => new THREE.BoxGeometry(chipArc * 0.14, 0.008 * S, STRIP_W * 0.16),
    [chipArc]
  );

  useEffect(() => {
    const pads = padsRef.current;
    const comps = compsRef.current;
    if (!pads || !comps) return;

    const helixBasis = makeHelixBasis(y0, span, turns);
    const m = new THREE.Matrix4();
    const pv = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / (count - 1);
      const b = helixBasis(Math.min(t, 1));
      [-1, 1].forEach((s, j) => {
        pv
          .copy(b.outward)
          .multiplyScalar(R_POLE + 0.012 * S)
          .addScaledVector(b.side, s * STRIP_W * 0.26);
        pv.y += b.y;
        m.makeBasis(b.tangent, b.outward, b.side);
        m.setPosition(pv);
        pads.setMatrixAt(i * 2 + j, m);
      });
      pv.copy(b.outward).multiplyScalar(R_POLE + 0.013 * S);
      pv.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pv);
      comps.setMatrixAt(i, m);
    }
    pads.instanceMatrix.needsUpdate = true;
    comps.instanceMatrix.needsUpdate = true;
  }, [y0, span, turns, count]);

  return (
    <>
      <instancedMesh ref={padsRef} args={[padGeo, padMat, count * 2]} />
      <instancedMesh ref={compsRef} args={[compGeo, compMat, count]} />
    </>
  );
}

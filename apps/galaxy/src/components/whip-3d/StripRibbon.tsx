"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makeHelixBasis, type HelixBasis, type WhipDimensions } from "./dimensions";

interface StripRibbonProps {
  dims: WhipDimensions;
}

/** Traces the seam where each helix turn meets the next, offset to the strip's outer edge. */
class HelixEdgeCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly helixBasis: (t: number) => HelixBasis,
    private readonly R_POLE: number,
    private readonly STRIP_W: number
  ) {
    super();
  }

  getPoint(t: number): THREE.Vector3 {
    const b = this.helixBasis(t);
    const p = new THREE.Vector3()
      .copy(b.outward)
      .multiplyScalar(this.R_POLE + 0.015)
      .addScaledVector(b.side, this.STRIP_W * 0.5);
    p.y += b.y;
    return p;
  }
}

/**
 * A single parametric surface sweeping the whole helix, so the LED strip
 * reads as one unbroken spiral of tape from base to tip, crowned slightly
 * at the centerline so its edges cast a seam shadow. A thin tube traces the
 * seam where each turn meets the next.
 */
export default function StripRibbon({ dims }: StripRibbonProps) {
  const { R_POLE, STRIP_W } = dims;

  const ribbonGeo = useMemo(() => {
    const helixBasis = makeHelixBasis(dims);
    const SEGS = 1600;
    const W_SEGS = 4;
    const verts = new Float32Array((SEGS + 1) * (W_SEGS + 1) * 3);
    const idx: number[] = [];
    const vv = new THREE.Vector3();
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS;
      const b = helixBasis(t);
      for (let j = 0; j <= W_SEGS; j++) {
        const s = (j / W_SEGS) * 2 - 1; // -1..1 across the strip
        const lift = 0.01 - 0.004 * s * s; // crowned: edges sit lower
        vv
          .copy(b.outward)
          .multiplyScalar(R_POLE + lift)
          .addScaledVector(b.side, s * STRIP_W * 0.48);
        vv.y += b.y;
        const k = (i * (W_SEGS + 1) + j) * 3;
        verts[k] = vv.x;
        verts[k + 1] = vv.y;
        verts[k + 2] = vv.z;
      }
    }
    for (let i = 0; i < SEGS; i++) {
      for (let j = 0; j < W_SEGS; j++) {
        const a = i * (W_SEGS + 1) + j;
        const bq = a + W_SEGS + 1;
        idx.push(a, bq, a + 1, bq, bq + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, [dims, R_POLE, STRIP_W]);

  const ribbonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0b0b0d,
        roughness: 0.42,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
    []
  );

  const seamGeo = useMemo(() => {
    const edgeCurve = new HelixEdgeCurve(makeHelixBasis(dims), R_POLE, STRIP_W);
    return new THREE.TubeGeometry(edgeCurve, 1600, 0.0035, 5, false);
  }, [dims, R_POLE, STRIP_W]);

  const seamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x1a1a1e, transparent: true, opacity: 0.3 }),
    []
  );

  return (
    <>
      <mesh geometry={ribbonGeo} material={ribbonMat} />
      <mesh geometry={seamGeo} material={seamMat} />
    </>
  );
}

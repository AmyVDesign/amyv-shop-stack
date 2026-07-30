"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makeHelixBasis, type LedSectionDims, R_POLE, STRIP_W, S } from "./dimensions";
import { RIBBON_COLOR, SEAM_COLOR } from "./palette";
import { FnCurve } from "./curves";

interface StripRibbonProps {
  dims: LedSectionDims;
}

/**
 * A single parametric surface sweeping the whole helix, so the LED strip
 * reads as one unbroken spiral of tape from base to tip, crowned slightly
 * at the centerline so its edges cast a seam shadow. Own copy of the
 * sibling trees' ribbon builder; identical math to the one-piece staff's,
 * since a single run's helix doesn't care which half it's on.
 */
export default function StripRibbon({ dims }: StripRibbonProps) {
  const { y0, span, turns } = dims;

  const ribbonGeo = useMemo(() => {
    const helixBasis = makeHelixBasis(y0, span, turns);
    const SEGS = Math.round(span * 380);
    const W_SEGS = 4;
    const verts = new Float32Array((SEGS + 1) * (W_SEGS + 1) * 3);
    const idx: number[] = [];
    const vv = new THREE.Vector3();
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS;
      const b = helixBasis(t);
      for (let j = 0; j <= W_SEGS; j++) {
        const s = (j / W_SEGS) * 2 - 1;
        const lift = (0.012 - 0.005 * s * s) * S;
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
  }, [y0, span, turns]);

  const ribbonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: RIBBON_COLOR,
        roughness: 0.42,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
    []
  );

  const seamGeo = useMemo(() => {
    const helixBasis = makeHelixBasis(y0, span, turns);
    const edgeCurve = new FnCurve((t) => {
      const b = helixBasis(t);
      const p = new THREE.Vector3()
        .copy(b.outward)
        .multiplyScalar(R_POLE + 0.013 * S)
        .addScaledVector(b.side, STRIP_W * 0.5);
      p.y += b.y;
      return p;
    });
    return new THREE.TubeGeometry(edgeCurve, Math.round(span * 300), 0.0045 * S, 5, false);
  }, [y0, span, turns]);

  const seamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: SEAM_COLOR, transparent: true, opacity: 0.3 }),
    []
  );

  return (
    <>
      <mesh geometry={ribbonGeo} material={ribbonMat} />
      <mesh geometry={seamGeo} material={seamMat} />
    </>
  );
}

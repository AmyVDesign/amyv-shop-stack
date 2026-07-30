"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { type LedSectionDims, type CoilSealExt, R_POLE, STRIP_W, PITCH, PER_TURN, S } from "./dimensions";
import { MEMBRANE_CLEAR, MEMBRANE_FROSTED } from "./palette";

interface MembraneProps {
  dims: LedSectionDims;
  ext: CoilSealExt;
  isOff: boolean;
}

const smoothstep = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/**
 * ONE continuous shrink-wrap surface sealed over one half's LED section and
 * up over that half's cable coil to its open mouth, chip bumps, a strip
 * ridge, wrinkle noise fading in from both cut edges, coil bulges, and a
 * shrunk-tight taper at both ends. Own copy of the sibling trees' membrane
 * builder. `ext.dir` says which end of THIS section the coil sits past
 * (+1 for the upper section's battery end, -1 for the lower section's foot
 * end), so the detail envelope and the coil-seal bulge reach toward the
 * right side on each half, and the coil-bulge phase carries the same
 * `ext.dir` factor the coil winding itself does.
 */
export default function Membrane({ dims, ext, isOff }: MembraneProps) {
  const { y0, y1, span } = dims;

  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const { geometry, filmMid } = useMemo(() => {
    const F_TOP = ext.dir > 0 ? ext.endY : y1 + 0.04;
    const F_BOT = ext.dir < 0 ? ext.endY : y0 - 0.04;
    const FH = F_TOP - F_BOT;
    const FMID = (F_TOP + F_BOT) / 2;
    const RAD_SEG = 72;
    const finest = Math.min(PITCH, ext.coilPitch);
    const VSEG = Math.min(1800, Math.round(FH / (finest / 6)));

    const geo = new THREE.CylinderGeometry(1, 1, FH, RAD_SEG, VSEG, true);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();

    // The film must clear the tallest thing under it (the dies), or the
    // dies poke through wherever a bump fails to form.
    const R_CHIP_TOP = R_POLE + 0.027 * S;
    const R_BASE = R_CHIP_TOP + 0.003 * S;
    const A_CHIP = 0.011 * S;
    const A_RIDGE = 0.005 * S;
    const chipArc = dims.chipArc;

    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const wy = v.y + FMID;
      const theta = Math.atan2(v.z, v.x);
      const th = theta < 0 ? theta + Math.PI * 2 : theta;

      let r = R_BASE;
      const yRel = wy - y0;
      const n = yRel / PITCH;
      const k = Math.round(n - th / (Math.PI * 2));
      const centerN = k + th / (Math.PI * 2);
      const dAcross = (n - centerN) * PITCH;
      const chipC = centerN * PER_TURN;
      const fcp = chipC - Math.round(chipC);
      const dAlong = fcp * chipArc;
      const inZone = smoothstep(yRel / 0.05) * smoothstep((span - yRel) / 0.05);
      const bumpChip =
        A_CHIP *
        Math.exp(-Math.pow(dAcross / (STRIP_W * 0.5), 2)) *
        Math.exp(-Math.pow(dAlong / (chipArc * 0.5), 2));
      const bumpRidge = A_RIDGE * Math.exp(-Math.pow(dAcross / (STRIP_W * 0.6), 2));
      const dipness = 1 - Math.exp(-Math.pow(dAcross / (STRIP_W * 0.5), 2));
      const wrinkle =
        0.0026 *
        S *
        dipness *
        (Math.sin(wy * 120 + th * 9) * Math.sin(th * 31 + wy * 49) +
          0.5 * Math.sin(wy * 230 + th * 17));
      r += inZone * (bumpChip + bumpRidge + wrinkle);

      // extended region: film seals over this half's cable coil, bulging
      // over each coil turn like the macro photos
      const nC = (ext.dir * (ext.coilTopY - wy)) / ext.coilPitch;
      if (nC > -0.5 && nC < ext.coilTurns + 0.5) {
        let cf = (ext.coilDir * nC - th / (Math.PI * 2)) % 1;
        if (cf < 0) cf += 1;
        const dC = Math.min(cf, 1 - cf) * ext.coilPitch;
        const envC = smoothstep((nC + 0.25) / 0.5) * smoothstep((ext.coilTurns + 0.25 - nC) / 0.5);
        r += 0.026 * S * envC * Math.exp(-Math.pow(dC / 0.02, 2));
      }

      // shrink tight at both cut edges
      const eT = smoothstep((wy - F_BOT) / 0.06) * smoothstep((F_TOP - wy) / 0.06);
      r = R_POLE + 0.004 * S + (r - (R_POLE + 0.004 * S)) * eT;

      p.setXYZ(i, Math.cos(theta) * r, v.y, Math.sin(theta) * r);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();

    return { geometry: geo, filmMid: FMID };
  }, [y0, y1, span, dims.chipArc, ext]);

  // "off" = unlit product shot: film reads as murky frosted white instead
  // of near-invisible clear film.
  const opacity = isOff ? 0.52 : 0.1;
  const roughness = isOff ? 0.22 : 0.04;
  const clearcoatRoughness = isOff ? 0.25 : 0.06;
  const color = isOff ? MEMBRANE_FROSTED : MEMBRANE_CLEAR;

  return (
    <mesh geometry={geometry} position={[0, filmMid, 0]} renderOrder={2}>
      <meshPhysicalMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={opacity}
        roughness={roughness}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={clearcoatRoughness}
        envMapIntensity={2.0}
        depthWrite={false}
      />
    </mesh>
  );
}

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { WhipDimensions } from "./dimensions";

interface MembraneProps {
  dims: WhipDimensions;
  isOff: boolean;
}

const smoothstep = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/**
 * One continuous shrink-wrap surface: chip bumps and a strip ridge over the
 * LED section, wrinkle noise that gathers tighter near the top, a blend
 * down to the connector radius, coil bulges over the cable wrap, and a
 * shrunk-tight taper at the bottom cut edge. No seams — it's a single
 * displaced cylinder from film top to film bottom.
 */
export default function Membrane({ dims, isOff }: MembraneProps) {
  const { R_POLE, STRIP_W, PITCH, CHIP_ARC, PER_TURN, SPAN, ledStartY, coilTopY, coilPitch, coilTurns } =
    dims;

  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const { geometry, filmMid } = useMemo(() => {
    const FILM_TOP = dims.ledEndY + 0.02;
    const FILM_BOT = dims.coilBotY - 0.05;
    const FILM_H = FILM_TOP - FILM_BOT;
    const FILM_MID = (FILM_TOP + FILM_BOT) / 2;
    const RAD_SEG = 72;
    const H_SEG = 640;

    const geo = new THREE.CylinderGeometry(1, 1, FILM_H, RAD_SEG, H_SEG, true);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    const R_LED = R_POLE + 0.02; // rest radius over the strip
    const R_CONN = R_POLE + 0.017; // rest radius over the connector
    const A_CHIP = 0.009;
    const A_RIDGE = 0.004;

    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const wy = v.y + FILM_MID; // world y
      const theta = Math.atan2(v.z, v.x);
      const th = theta < 0 ? theta + Math.PI * 2 : theta;

      // Base radius blends from strip zone to connector zone
      const zoneT = smoothstep((wy - (ledStartY - 0.1)) / 0.06);
      let r = R_CONN + (R_LED - R_CONN) * zoneT;

      // Strip-zone detail, faded out below ledStartY
      const envLED = smoothstep((wy - (ledStartY - 0.05)) / 0.04);
      if (envLED > 0) {
        const yRel = wy - ledStartY;
        const n = yRel / PITCH;
        const k = Math.round(n - th / (Math.PI * 2));
        const centerN = k + th / (Math.PI * 2);
        const dAcross = (n - centerN) * PITCH;
        const chipC = centerN * PER_TURN;
        const fcp = chipC - Math.round(chipC);
        const dAlong = fcp * CHIP_ARC;
        const bumpChip =
          A_CHIP *
          Math.exp(-Math.pow(dAcross / (STRIP_W * 0.5), 2)) *
          Math.exp(-Math.pow(dAlong / (CHIP_ARC * 0.5), 2));
        const bumpRidge = A_RIDGE * Math.exp(-Math.pow(dAcross / (STRIP_W * 0.6), 2));
        const dipness = 1 - Math.exp(-Math.pow(dAcross / (STRIP_W * 0.5), 2));
        const endT = yRel / SPAN;
        const gather = 1 + 3.2 * Math.exp(-Math.pow((1 - endT) / 0.035, 2));
        const wrinkle =
          0.0022 *
          gather *
          dipness *
          (Math.sin(wy * 140 + th * 9) * Math.sin(th * 31 + wy * 57) +
            0.5 * Math.sin(wy * 260 + th * 17));
        r += envLED * (bumpRidge + bumpChip + wrinkle);
      }

      // Coil bulges below the connector top
      const nC = (coilTopY - wy) / coilPitch;
      if (nC > -0.5 && nC < coilTurns + 0.5) {
        let frac = (nC - th / (Math.PI * 2)) % 1;
        if (frac < 0) frac += 1;
        const d = Math.min(frac, 1 - frac) * coilPitch;
        const env = smoothstep((nC + 0.25) / 0.5) * smoothstep((coilTurns + 0.25 - nC) / 0.5);
        r += 0.031 * env * Math.exp(-Math.pow(d / 0.03, 2));
      }

      // Shrunk-tight bottom cut edge
      const botT = smoothstep((wy - FILM_BOT) / 0.055);
      r = R_POLE + 0.0035 + (r - (R_POLE + 0.0035)) * botT;

      p.setXYZ(i, Math.cos(theta) * r, v.y, Math.sin(theta) * r);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();

    return { geometry: geo, filmMid: FILM_MID };
  }, [
    dims,
    R_POLE,
    STRIP_W,
    PITCH,
    CHIP_ARC,
    PER_TURN,
    SPAN,
    ledStartY,
    coilTopY,
    coilPitch,
    coilTurns,
  ]);

  // "off" = unlit product shot: film reads as murky frosted white instead
  // of near-invisible clear film.
  const opacity = isOff ? 0.52 : 0.1;
  const roughness = isOff ? 0.22 : 0.04;
  const clearcoatRoughness = isOff ? 0.25 : 0.06;
  const color = isOff ? "#eff1f4" : "#ffffff";

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

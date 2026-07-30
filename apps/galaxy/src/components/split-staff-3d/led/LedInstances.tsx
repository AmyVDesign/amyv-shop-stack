"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeHelixBasis, type LedSectionDims, BOT_Y, STAFF_H, R_POLE, STRIP_W, S } from "../dimensions";
import type { SplitStaffPattern } from "../types";
import { buildGlowTexture } from "../textures";
import { SHELL_COLOR, LED_OFF_COLOR, LED_BLACK } from "../palette";

const OFF_COLOR = new THREE.Color(LED_OFF_COLOR);
const BLACK = new THREE.Color(LED_BLACK);
// Scratch buffers reused across paint() calls, module-level (not hook
// state), mutated synchronously within a single call, never read across
// renders.
const col = new THREE.Color();
const avg = new THREE.Color();
const ANIMATED_PATTERNS: ReadonlySet<SplitStaffPattern> = new Set([
  "rainbow",
  "comet",
  "pulse",
  "galaxy",
  "mirror",
]);

interface LedInstancesProps {
  dims: LedSectionDims;
  pattern: SplitStaffPattern;
  reducedMotion: boolean;
  poolMaterialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/**
 * White package + small bright die + tight halo per LED, so each pixel
 * reads as a discrete chip instead of merging into a glowing tube. Own
 * copy of the sibling trees' instancing builder, patterns are painted by
 * a *global* t (position across the whole staff height, spanning both
 * halves' sections continuously, exactly as the one-piece staff's), not
 * local-to-section t, so "mirror" reads symmetric from the grip outward
 * and the other patterns flow continuously from foot to foot across the
 * joint.
 */
export default function LedInstances({ dims, pattern, reducedMotion, poolMaterialRef }: LedInstancesProps) {
  const { y0, span, turns, count } = dims;

  const shellsRef = useRef<THREE.InstancedMesh>(null);
  const diesRef = useRef<THREE.InstancedMesh>(null);
  const glowsRef = useRef<THREE.InstancedMesh>(null);
  const glows2Ref = useRef<THREE.InstancedMesh>(null);

  const glowTexture = useMemo(() => buildGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const globalT = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const yv = y0 + (i / (count - 1)) * span;
      arr[i] = (yv - BOT_Y) / STAFF_H;
    }
    return arr;
  }, [y0, span, count]);

  useEffect(() => {
    const shells = shellsRef.current;
    const dies = diesRef.current;
    const glows = glowsRef.current;
    const glows2 = glows2Ref.current;
    if (!shells || !dies || !glows || !glows2) return;

    if (!dies.instanceColor) {
      dies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }
    if (!glows.instanceColor) {
      glows.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }
    if (!glows2.instanceColor) {
      glows2.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }

    const helixBasis = makeHelixBasis(y0, span, turns);
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const b = helixBasis(t);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.014 * S);
      pos.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pos);
      shells.setMatrixAt(i, m);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.022 * S);
      pos.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pos);
      dies.setMatrixAt(i, m);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.042 * S);
      pos.y = b.y;
      m.makeBasis(b.tangent, b.side, b.outward);
      m.setPosition(pos);
      glows.setMatrixAt(i, m);
      glows2.setMatrixAt(i, m);
    }
    shells.instanceMatrix.needsUpdate = true;
    dies.instanceMatrix.needsUpdate = true;
    glows.instanceMatrix.needsUpdate = true;
    glows2.instanceMatrix.needsUpdate = true;
  }, [y0, span, turns, count]);

  const paint = useMemo(() => {
    return (time: number) => {
      const dies = diesRef.current;
      const glows = glowsRef.current;
      const glows2 = glows2Ref.current;
      if (!dies || !glows || !glows2) return;

      avg.setRGB(0, 0, 0);
      let totalLit = 1; // starts at 1, matching the prototype, to avoid a divide-by-zero on "off"
      for (let i = 0; i < count; i++) {
        const t = globalT[i];
        let lit = true;
        if (pattern === "rainbow") {
          col.setHSL((t * 1.8 - time * 0.18) % 1, 1, 0.55);
        } else if (pattern === "comet") {
          const head = (time * 0.2) % 1.25;
          let d = head - t;
          if (d < 0) d += 1.25;
          const v = Math.max(0, 1 - d * 6);
          if (v < 0.02) lit = false;
          else col.setHSL(0.55, 1, 0.05 + v * 0.55);
        } else if (pattern === "pulse") {
          const v = 0.5 + 0.5 * Math.sin(time * 2.4 - t * 6);
          col.setHSL(0.9, 0.9, 0.06 + v * 0.5);
        } else if (pattern === "galaxy") {
          const v = 0.5 + 0.5 * Math.sin(t * 16 + time * 0.9);
          col.setHSL(0.72 - v * 0.22, 0.95, 0.16 + v * 0.42);
        } else if (pattern === "mirror") {
          // staff signature: symmetric from the grip outward
          const d = Math.abs(t - 0.5) * 2;
          col.setHSL((d * 1.4 - time * 0.22) % 1, 1, 0.55);
        } else {
          lit = false;
        }
        if (!lit) col.copy(OFF_COLOR);
        dies.setColorAt(i, col);
        glows.setColorAt(i, lit ? col : BLACK);
        glows2.setColorAt(i, lit ? col : BLACK);
        if (lit) {
          avg.r += col.r;
          avg.g += col.g;
          avg.b += col.b;
          totalLit++;
        }
      }
      if (dies.instanceColor) dies.instanceColor.needsUpdate = true;
      if (glows.instanceColor) glows.instanceColor.needsUpdate = true;
      if (glows2.instanceColor) glows2.instanceColor.needsUpdate = true;

      const pool = poolMaterialRef.current;
      if (pool) pool.color.setRGB(avg.r / totalLit, avg.g / totalLit, avg.b / totalLit);
    };
  }, [pattern, count, globalT, poolMaterialRef]);

  // Static paint whenever the pattern/motion-preference changes (covers
  // "off" and the reduced-motion case, neither of which get repainted
  // every frame below).
  useEffect(() => {
    paint(0);
  }, [paint, reducedMotion]);

  useFrame((state) => {
    if (reducedMotion) return;
    if (!ANIMATED_PATTERNS.has(pattern)) return;
    paint(state.clock.elapsedTime);
  });

  const shellGeo = useMemo(
    () => new THREE.BoxGeometry(STRIP_W * 0.52, 0.013 * S, STRIP_W * 0.52),
    []
  );
  const shellMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SHELL_COLOR, roughness: 0.55 }),
    []
  );
  const dieGeo = useMemo(
    () => new THREE.CylinderGeometry(STRIP_W * 0.21, STRIP_W * 0.21, 0.01 * S, 18),
    []
  );
  const dieMat = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const glowGeo = useMemo(() => new THREE.PlaneGeometry(0.15 * S, 0.15 * S), []);
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [glowTexture]
  );
  const glow2Geo = useMemo(() => new THREE.PlaneGeometry(0.4 * S, 0.4 * S), []);
  const glow2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        opacity: 0.32,
      }),
    [glowTexture]
  );

  return (
    <>
      <instancedMesh ref={shellsRef} args={[shellGeo, shellMat, count]} />
      <instancedMesh ref={diesRef} args={[dieGeo, dieMat, count]} />
      <instancedMesh ref={glowsRef} args={[glowGeo, glowMat, count]} />
      <instancedMesh ref={glows2Ref} args={[glow2Geo, glow2Mat, count]} />
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { makeHelixBasis, type WhipDimensions } from "../dimensions";
import type { Pattern } from "../types";
import { buildGlowTexture } from "../textures";

const OFF_COLOR = new THREE.Color(0x24210f);
const BLACK = new THREE.Color(0x000000);
// Scratch buffers reused across paint() calls — module-level (not hook
// state) since they're mutated synchronously within a single call and
// never read across renders.
const col = new THREE.Color();
const avg = new THREE.Color();
const ANIMATED_PATTERNS: ReadonlySet<Pattern> = new Set([
  "rainbow",
  "comet",
  "pulse",
  "galaxy",
]);

interface LedInstancesProps {
  dims: WhipDimensions;
  pattern: Pattern;
  color: string;
  reducedMotion: boolean;
  poolMaterialRef: RefObject<THREE.MeshBasicMaterial | null>;
}

/**
 * White package + small bright die + tight halo per LED, so each pixel
 * reads as a discrete chip instead of merging into a glowing tube. A wide,
 * dim second halo layer keeps the whip's overall glow without erasing the
 * per-pixel detail.
 */
export default function LedInstances({
  dims,
  pattern,
  color,
  reducedMotion,
  poolMaterialRef,
}: LedInstancesProps) {
  const shellsRef = useRef<THREE.InstancedMesh>(null);
  const diesRef = useRef<THREE.InstancedMesh>(null);
  const glowsRef = useRef<THREE.InstancedMesh>(null);
  const glows2Ref = useRef<THREE.InstancedMesh>(null);

  const glowTexture = useMemo(() => buildGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const { COUNT, R_POLE, STRIP_W } = dims;

  const ledT = useMemo(() => {
    const arr = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) arr[i] = i / (COUNT - 1);
    return arr;
  }, [COUNT]);

  useEffect(() => {
    const shells = shellsRef.current;
    const dies = diesRef.current;
    const glows = glowsRef.current;
    const glows2 = glows2Ref.current;
    if (!shells || !dies || !glows || !glows2) return;

    if (!dies.instanceColor) {
      dies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3);
    }
    if (!glows.instanceColor) {
      glows.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3);
    }
    if (!glows2.instanceColor) {
      glows2.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3);
    }

    const helixBasis = makeHelixBasis(dims);
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      const b = helixBasis(ledT[i]);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.013);
      pos.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pos);
      shells.setMatrixAt(i, m);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.02);
      pos.y = b.y;
      m.makeBasis(b.tangent, b.outward, b.side);
      m.setPosition(pos);
      dies.setMatrixAt(i, m);

      pos.copy(b.outward).multiplyScalar(R_POLE + 0.036);
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
  }, [dims, COUNT, ledT, R_POLE]);

  const paint = useMemo(() => {
    return (time: number) => {
      const dies = diesRef.current;
      const glows = glowsRef.current;
      const glows2 = glows2Ref.current;
      if (!dies || !glows || !glows2) return;

      avg.setRGB(0, 0, 0);
      for (let i = 0; i < COUNT; i++) {
        const t = ledT[i];
        let lit = true;
        if (pattern === "rainbow") {
          col.setHSL((t * 2.2 - time * 0.18) % 1, 1, 0.55);
        } else if (pattern === "comet") {
          const head = (time * 0.22) % 1.25;
          let d = head - t;
          if (d < 0) d += 1.25;
          const v = Math.max(0, 1 - d * 6);
          if (v < 0.02) lit = false;
          else col.setHSL(0.55, 1, 0.05 + v * 0.55);
        } else if (pattern === "pulse") {
          const v = 0.5 + 0.5 * Math.sin(time * 2.4 - t * 5);
          col.setHSL(0.9, 0.9, 0.06 + v * 0.5);
        } else if (pattern === "galaxy") {
          const v = 0.5 + 0.5 * Math.sin(t * 14 + time * 0.9);
          col.setHSL(0.72 - v * 0.22, 0.95, 0.16 + v * 0.42);
        } else if (pattern === "solid") {
          col.set(color);
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
        }
      }
      if (dies.instanceColor) dies.instanceColor.needsUpdate = true;
      if (glows.instanceColor) glows.instanceColor.needsUpdate = true;
      if (glows2.instanceColor) glows2.instanceColor.needsUpdate = true;

      const pool = poolMaterialRef.current;
      if (pool) pool.color.setRGB(avg.r / COUNT, avg.g / COUNT, avg.b / COUNT);
    };
  }, [pattern, color, COUNT, ledT, poolMaterialRef]);

  // Static paint whenever the pattern/color/length/motion-preference changes
  // (covers "off", "solid", and the reduced-motion case, none of which get
  // repainted every frame below).
  useEffect(() => {
    paint(0);
  }, [paint, reducedMotion]);

  useFrame((state) => {
    if (reducedMotion) return;
    if (!ANIMATED_PATTERNS.has(pattern)) return;
    paint(state.clock.elapsedTime);
  });

  const shellGeo = useMemo(
    () => new THREE.BoxGeometry(STRIP_W * 0.52, 0.01, STRIP_W * 0.52),
    [STRIP_W]
  );
  const shellMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.55 }),
    []
  );
  const dieGeo = useMemo(
    () => new THREE.CylinderGeometry(STRIP_W * 0.21, STRIP_W * 0.21, 0.008, 18),
    [STRIP_W]
  );
  const dieMat = useMemo(() => new THREE.MeshBasicMaterial(), []);
  const glowGeo = useMemo(() => new THREE.PlaneGeometry(0.11, 0.11), []);
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
  const glow2Geo = useMemo(() => new THREE.PlaneGeometry(0.3, 0.3), []);
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
      <instancedMesh ref={shellsRef} args={[shellGeo, shellMat, COUNT]} />
      <instancedMesh ref={diesRef} args={[dieGeo, dieMat, COUNT]} />
      <instancedMesh ref={glowsRef} args={[glowGeo, glowMat, COUNT]} />
      <instancedMesh ref={glows2Ref} args={[glow2Geo, glow2Mat, COUNT]} />
    </>
  );
}

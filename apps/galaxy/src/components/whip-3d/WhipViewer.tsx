"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { WhipModelProps } from "./WhipModel";

/**
 * WhipModel builds canvas-drawn textures and touches WebGL at mount time,
 * so it must never run during SSR. Its module is also loaded lazily here
 * (via a plain `import()` below) purely to know when to hide the skeleton —
 * next/dynamic's own `loading` option can't do that job, since whatever it
 * returns is reconciled inside <Canvas>, where only three.js objects (not
 * DOM) are valid children.
 */
const WhipModel = dynamic(() => import("./WhipModel"), { ssr: false });

export interface WhipViewerProps extends WhipModelProps {
  className?: string;
}

const INITIAL_THETA = 0.6;
const INITIAL_PHI = 1.35;
const INITIAL_DIST = 15;

function initialCameraPosition(): [number, number, number] {
  return [
    INITIAL_DIST * Math.sin(INITIAL_PHI) * Math.cos(INITIAL_THETA),
    INITIAL_DIST * Math.cos(INITIAL_PHI) * 0.7 + 0.3,
    INITIAL_DIST * Math.sin(INITIAL_PHI) * Math.sin(INITIAL_THETA),
  ];
}

/** "use client" wrapper: owns the Canvas, studio camera, and orbit controls around WhipModel. */
export default function WhipViewer({
  className,
  autoRotate = true,
  ...modelProps
}: WhipViewerProps) {
  const cameraPosition = useMemo(() => initialCameraPosition(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("./WhipModel").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${className ?? "h-full w-full"}`}>
      {!ready && (
        <div className="absolute inset-0 z-10 animate-pulse bg-site-bg-alt" aria-hidden="true" />
      )}
      <Canvas
        camera={{ position: cameraPosition, fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <WhipModel autoRotate={autoRotate} {...modelProps} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minDistance={1.8}
          maxDistance={32}
          minPolarAngle={0.5}
          maxPolarAngle={2.6}
          autoRotate={autoRotate}
          autoRotateSpeed={0.9}
        />
      </Canvas>
    </div>
  );
}

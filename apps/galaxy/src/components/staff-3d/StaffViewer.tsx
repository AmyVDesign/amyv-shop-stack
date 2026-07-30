"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { StaffModelProps } from "./StaffModel";

/**
 * StaffModel builds canvas-drawn textures and touches WebGL at mount time,
 * so it must never run during SSR. Its module is also loaded lazily here
 * (via a plain `import()` below) purely to know when to hide the skeleton.
 * next/dynamic's own `loading` option can't do that job, since whatever it
 * returns is reconciled inside <Canvas>, where only three.js objects (not
 * DOM) are valid children. Own copy of the whip's viewer wrapper pattern.
 */
const StaffModel = dynamic(() => import("./StaffModel"), { ssr: false });

const PATTERN_LABEL: Record<StaffModelProps["pattern"], string> = {
  rainbow: "rainbow",
  comet: "a comet chasing up the strip",
  pulse: "a slow pulse",
  galaxy: "a shifting galaxy pattern",
  mirror: "a pattern mirrored from the grip outward",
  off: "off, unlit",
};

export interface StaffViewerProps extends StaffModelProps {
  className?: string;
}

const INITIAL_THETA = 0.6;
const INITIAL_PHI = 1.35;
const INITIAL_DIST = 12;

function initialCameraPosition(): [number, number, number] {
  return [
    INITIAL_DIST * Math.sin(INITIAL_PHI) * Math.cos(INITIAL_THETA),
    INITIAL_DIST * Math.cos(INITIAL_PHI) * 0.7 + 0.3,
    INITIAL_DIST * Math.sin(INITIAL_PHI) * Math.sin(INITIAL_THETA),
  ];
}

/** "use client" wrapper: owns the Canvas, studio camera, and orbit controls around StaffModel. */
export default function StaffViewer({
  className,
  pattern,
  ejected,
  autoRotate = true,
}: StaffViewerProps) {
  const cameraPosition = useMemo(() => initialCameraPosition(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("./StaffModel").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${className ?? "h-full w-full"}`}>
      {/* Text alternative for the canvas (WCAG 1.1.1), orbit is a
          supplementary way to inspect the model, not the only one. */}
      <p className="sr-only">
        A rotating 3D render of the Galaxy SF LED staff: a five-foot handheld
        pole with an addressable LED strip wound down its lower section, a
        two-pod remote control clamped below the grip, and a rubber foot.
        Current pattern: {PATTERN_LABEL[pattern]}.
      </p>
      {!ready && (
        <div className="absolute inset-0 z-10 animate-pulse bg-site-bg-alt" aria-hidden="true" />
      )}
      <Canvas
        aria-hidden="true"
        camera={{ position: cameraPosition, fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <StaffModel pattern={pattern} ejected={ejected} autoRotate={autoRotate} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minDistance={2.0}
          maxDistance={26}
          minPolarAngle={0.5}
          maxPolarAngle={2.6}
          autoRotate={autoRotate}
          autoRotateSpeed={0.9}
        />
      </Canvas>
    </div>
  );
}

"use client";

import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import WhipModel from "@/components/whip-3d/WhipModel";
import { poseAt, heroPresence, KEYFRAMES, STATIC_POSE, TILT_X, TILT_Z } from "./scrollStageData";

// Scratch objects reused every frame -- never allocate inside useFrame.
const scratchPos = new THREE.Vector3();
const scratchTarget = new THREE.Vector3();

// Time-based exponential damping rate for the smoothed-progress follower.
const DAMPING_RATE = 6;

interface ScrollCameraRigProps {
  rawProgressRef: RefObject<number>;
  modelGroupRef: RefObject<THREE.Group | null>;
  /** Called every frame with the damped progress so the DOM overlay stays in sync. */
  onProgress: (smoothedProgress: number) => void;
}

/**
 * Lives inside <Canvas>. Raw scroll progress jumps around (a fast scroll can
 * land far from where the camera currently sits), so a smoothed follower is
 * advanced toward it here with time-based damping rather than consumed
 * directly -- frame-rate independent, and because it runs on R3F's own
 * render loop it keeps converging after the user stops scrolling instead of
 * stalling wherever the last scroll event left off. Camera pose and the DOM
 * overlay opacity writes (via onProgress) both read this same smoothed
 * value so they never drift out of sync with each other.
 */
function ScrollCameraRig({ rawProgressRef, modelGroupRef, onProgress }: ScrollCameraRigProps) {
  const smoothedRef = useRef(0);

  useFrame((state, delta) => {
    const raw = rawProgressRef.current;
    smoothedRef.current += (raw - smoothedRef.current) * (1 - Math.exp(-DAMPING_RATE * delta));
    const progress = smoothedRef.current;

    poseAt(progress, scratchPos, scratchTarget);
    state.camera.position.copy(scratchPos);
    state.camera.lookAt(scratchTarget);

    const group = modelGroupRef.current;
    if (group) {
      // Tilt is a hero-pose trait: full during the hero hold, eased to
      // nothing for the close-ups (so the strip reads vertical), eased
      // back in for the release shot. No spin, no float -- the hero pose
      // is a frozen totem, still until the user scrolls.
      const presence = heroPresence(progress);
      group.rotation.x = TILT_X * presence;
      group.rotation.z = TILT_Z * presence;
    }

    onProgress(progress);
  });
  return null;
}

export interface HeroStageSceneProps {
  /** Omit both for the static prefers-reduced-motion fallback (fixed pose, no rig). */
  rawProgressRef?: RefObject<number>;
  /** Called every frame with the rig's damped progress; required alongside rawProgressRef. */
  onProgress?: (smoothedProgress: number) => void;
}

/**
 * Scene contents for the scroll-driven hero stage. Reuses WhipModel directly
 * (not WhipViewer, which owns its own OrbitControls) so this rig is the only
 * thing driving the camera.
 */
export default function HeroStageScene({ rawProgressRef, onProgress }: HeroStageSceneProps) {
  const modelGroupRef = useRef<THREE.Group>(null);
  const startPose = rawProgressRef ? KEYFRAMES[0] : STATIC_POSE;

  return (
    <Canvas
      camera={{ position: startPose.pos, fov: 38, near: 0.1, far: 100 }}
      onCreated={({ camera }) => camera.lookAt(...startPose.target)}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
    >
      <group ref={modelGroupRef} rotation={rawProgressRef ? undefined : [TILT_X, 0, TILT_Z]}>
        <WhipModel pattern="rainbow" length="48in" autoRotate={!rawProgressRef} />
      </group>
      {rawProgressRef && onProgress && (
        <ScrollCameraRig
          rawProgressRef={rawProgressRef}
          modelGroupRef={modelGroupRef}
          onProgress={onProgress}
        />
      )}
    </Canvas>
  );
}

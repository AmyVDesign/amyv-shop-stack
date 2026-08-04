"use client";

import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import WhipModel from "@/components/whip-3d/WhipModel";
import {
  poseAt,
  heroRotationDelta,
  heroPresence,
  KEYFRAMES,
  STATIC_POSE,
  TILT_X,
  TILT_Z,
  BOB_AMPLITUDE,
  BOB_ANGULAR_FREQ,
} from "./scrollStageData";

// Scratch objects reused every frame -- never allocate inside useFrame.
const scratchPos = new THREE.Vector3();
const scratchTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

interface ScrollCameraRigProps {
  progressRef: RefObject<number>;
  modelGroupRef: RefObject<THREE.Group | null>;
}

/** Lives inside <Canvas>; lerps the camera along the keyframe poses each frame. */
function ScrollCameraRig({ progressRef, modelGroupRef }: ScrollCameraRigProps) {
  useFrame((state, delta) => {
    const progress = progressRef.current;
    poseAt(progress, scratchPos, scratchTarget);
    state.camera.position.lerp(scratchPos, 0.09);
    lookTarget.lerp(scratchTarget, 0.09);
    state.camera.lookAt(lookTarget);

    const group = modelGroupRef.current;
    if (group) {
      group.rotation.y += heroRotationDelta(progress, delta);

      // Tilt and float are hero-pose traits: full during the hero hold,
      // eased to nothing for the close-ups (so the strip reads vertical),
      // eased back in for the release shot.
      const presence = heroPresence(progress);
      group.rotation.x = TILT_X * presence;
      group.rotation.z = TILT_Z * presence;
      group.position.y = BOB_AMPLITUDE * Math.sin(state.clock.elapsedTime * BOB_ANGULAR_FREQ) * presence;
    }
  });
  return null;
}

export interface HeroStageSceneProps {
  /** Omit for the static prefers-reduced-motion fallback (fixed pose, no rig). */
  progressRef?: RefObject<number>;
}

/**
 * Scene contents for the scroll-driven hero stage. Reuses WhipModel directly
 * (not WhipViewer, which owns its own OrbitControls) so this rig is the only
 * thing driving the camera.
 */
export default function HeroStageScene({ progressRef }: HeroStageSceneProps) {
  const modelGroupRef = useRef<THREE.Group>(null);
  const startPose = progressRef ? KEYFRAMES[0] : STATIC_POSE;

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
      <group ref={modelGroupRef} rotation={progressRef ? undefined : [TILT_X, 0, TILT_Z]}>
        <WhipModel pattern="rainbow" length="48in" autoRotate={!progressRef} />
      </group>
      {progressRef && <ScrollCameraRig progressRef={progressRef} modelGroupRef={modelGroupRef} />}
    </Canvas>
  );
}

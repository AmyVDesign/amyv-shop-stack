import { useEffect } from "react";
import * as THREE from "three";
import { useStore } from "@react-three/fiber";
import { buildStudioEnvCanvas } from "./textures";

/** PMREM-converts the canvas-drawn studio softboxes into scene.environment. */
export function useStudioEnvironment() {
  const store = useStore();

  useEffect(() => {
    const { gl, scene } = store.getState();
    const envCanvas = buildStudioEnvCanvas();
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(gl);
    const renderTarget = pmrem.fromEquirectangular(envTex);
    scene.environment = renderTarget.texture;
    envTex.dispose();
    pmrem.dispose();

    return () => {
      renderTarget.texture.dispose();
      if (scene.environment === renderTarget.texture) scene.environment = null;
    };
  }, [store]);
}

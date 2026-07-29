import { useEffect } from "react";
import * as THREE from "three";
import { useStore } from "@react-three/fiber";
import { buildStudioEnvCanvas } from "./textures";

/**
 * Own copy of the whip's PMREM environment hook, same studio softboxes,
 * ported fresh rather than imported from whip-3d.
 */
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

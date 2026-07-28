interface StudioLightingProps {
  isOff: boolean;
}

/** Ambient fill + a cool rim light + a warm key point light, all fixed in world space (not attached to the whip group). Intensities lift for the "off" unlit product shot. */
export default function StudioLighting({ isOff }: StudioLightingProps) {
  return (
    <>
      <ambientLight color={0x8888aa} intensity={isOff ? 0.8 : 0.25} />
      <directionalLight color={0x6677ff} intensity={isOff ? 0.9 : 0.5} position={[-3, 2, -2]} />
      <pointLight color={0xffffff} intensity={isOff ? 1.3 : 0.55} distance={12} position={[2, 1, 3]} />
    </>
  );
}

import { LIGHT_AMBIENT, LIGHT_RIM, LIGHT_KEY } from "./palette";

interface StudioLightingProps {
  isOff: boolean;
}

/** Ambient fill + a cool rim light + a warm key point light, fixed in world space. Intensities lift for the "off" unlit product shot. Own copy of the sibling trees' lighting, split-staff-specific positions/distance. */
export default function StudioLighting({ isOff }: StudioLightingProps) {
  return (
    <>
      <ambientLight color={LIGHT_AMBIENT} intensity={isOff ? 0.8 : 0.25} />
      <directionalLight color={LIGHT_RIM} intensity={isOff ? 0.9 : 0.5} position={[-4, 3, -3]} />
      <pointLight color={LIGHT_KEY} intensity={isOff ? 1.3 : 0.55} distance={18} position={[3, 2, 4]} />
    </>
  );
}

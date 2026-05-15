export interface IconProps {
  size?: number;
  color?: string;
}

export const iconDefaults = { size: 20, color: "currentColor" } satisfies Required<IconProps>;

export function strokeAttrs(size: number, color: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

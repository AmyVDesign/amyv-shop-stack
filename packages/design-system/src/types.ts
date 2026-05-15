export interface Theme {
  colors: {
    bg: string;
    bgAlt: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentDark: string;
    accentLight: string;
  };
  fonts: {
    heading: string;
    body: string;
    label: string;
  };
  spacing: {
    pagePx: string;
    pageMax: string;
    sectionY: string;
    cardPad: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

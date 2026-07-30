/**
 * Every material color and canvas-drawing color used by the split staff
 * model, collected in one place. Three.js material colors are numeric
 * literals (0xRRGGBB) and canvas 2D colors are CSS hex strings, neither is
 * a design token, since neither renders through CSS. This module is the
 * deliberate, documented exception to "no hardcoded hex in .tsx": every
 * color the split staff uses lives here, named, instead of scattered as
 * inline literals through the geometry-building code. See
 * docs/SPLIT_STAFF_MODEL.md.
 *
 * Own copy, not shared with staff-3d/palette or whip-3d (the three
 * products' materials were independently tuned against different macro
 * photos and are not guaranteed to match numerically even where they look
 * similar, e.g. the handle white shared with the one-piece staff).
 */

// Scene
export const SCENE_BG = 0x0a0910;

// Pole and handle hardware (cream/white ABS, matched to the macro photos)
export const POLE_COLOR = 0xedebe5;
export const HANDLE_WHITE = 0xf2f1ec;
export const REMOTE_PILL_WHITE = 0xf3f3ee;

// LED strip construction
export const RIBBON_COLOR = 0x0b0b0d;
export const SEAM_COLOR = 0x1a1a1e;
export const SHELL_COLOR = 0xe6e2d8;
export const PAD_COPPER = 0xc98850;
export const COMPONENT_SILVER = 0xbfc3c7;

// Shrink-wrap membrane
export const MEMBRANE_CLEAR = 0xffffff;
export const MEMBRANE_FROSTED = 0xeff1f4;

// LED pattern colors
export const LED_OFF_COLOR = 0x24210f;
export const LED_BLACK = 0x000000;

// Cable, coil mouth, wire leads
export const MOUTH_RING_DARK = 0x2b2a28;
export const WIRE_RED = 0xc94040;
export const WIRE_BLUE = 0x3a55c9;
export const WIRE_BLACK = 0x141416;
export const WIRE_BLOB_SILVER = 0xc8ccd0;

// Battery socket (holder bore), at both ends
export const BORE_DARK = 0x1c1d20;
export const SOCKET_FLOOR_DARK = 0x141518;

// Captive USB-A lead, at both ends
export const PLUG_TONGUE_METAL = 0xb9bcc2;
export const PLUG_DIMPLE = 0x5a5e64;

// Rubber weather cap, at both ends (same rubber as the one-piece foot, own value)
export const CAP_RUBBER = 0x0c0c0e;

// The threaded union
export const JOINT_WHITE = 0xf4f3ee;
export const JOINT_FROSTED = 0xefeee8;

// Studio lighting
export const LIGHT_AMBIENT = 0x8888aa;
export const LIGHT_RIM = 0x6677ff;
export const LIGHT_KEY = 0xffffff;

// Canvas-drawn textures (CSS hex strings, not three.js numeric colors, but
// collected here for the same reason)
export const CanvasPalette = {
  remoteIcon: "#b0b6ab",
  remoteWave: "#4d5f56",
  batteryWordmark: "#C4C1B9",
  batteryHexOutline: "#B7B4AC",
  batteryChargeDash: "#4A4845",
  stickerBackground: "#EDE94A",
  stickerInk: "#232320",
  portFaceBg: "#F4F3EF",
  portGrooveOuter: "rgba(0,0,0,.13)",
  portGrooveInner: "rgba(0,0,0,.07)",
  portSlotBlack: "#141414",
  portSlotBlue: "#2E5AA8",
  portIndicatorFill: "#D5D8A4",
  portIndicatorStroke: "rgba(0,0,0,.30)",
  jointLabelBg: "#FAFAF7",
  jointLabelInk: "#161616",
} as const;

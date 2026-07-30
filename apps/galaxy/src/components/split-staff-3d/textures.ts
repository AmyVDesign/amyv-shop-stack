import * as THREE from "three";
import { CanvasPalette } from "./palette";

/**
 * Own copy of the sibling trees' canvas-texture builders, ported fresh
 * from the split-staff prototype. Not imported from staff-3d or whip-3d,
 * see the top-level note on why the three products don't share code yet.
 */

/**
 * Two softboxes + an overhead strip on a dark field, equirect-mapped. PMREM
 * turns this into the reflection environment that makes the shrink-wrap
 * membrane read as glossy film instead of flat plastic.
 */
export function buildStudioEnvCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, 512, 256);

  function softbox(x: number, y: number, w: number, h: number, bright: number) {
    const gr = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      2,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) / 2
    );
    gr.addColorStop(0, `rgba(255,255,255,${bright})`);
    gr.addColorStop(0.6, `rgba(255,255,255,${bright * 0.4})`);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
  }

  softbox(70, 30, 110, 170, 0.95);
  softbox(330, 60, 90, 130, 0.55);
  softbox(200, 10, 180, 36, 0.4);
  return canvas;
}

/** Radial falloff used for both the per-LED halos and the floor glow pool. */
export function buildGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,.45)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Printed remote face, drawn on a transparent canvas and applied as a
 * decal plane over the pod body, so the extrude UVs can't clip it. Same
 * unit as the whip's inline remote and the one-piece staff's pods.
 */
export function buildRemoteFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 640);

  ctx.fillStyle = CanvasPalette.remoteIcon;
  ctx.strokeStyle = CanvasPalette.remoteIcon;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 100px Helvetica, Arial, sans-serif";
  ctx.fillText("M", 152, 152);
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(120, 322, 46, -Math.PI * 0.32, Math.PI * 1.32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(120, 260);
  ctx.lineTo(120, 316);
  ctx.stroke();
  ctx.font = "500 120px Helvetica, Arial, sans-serif";
  ctx.fillText("♪", 158, 496);

  ctx.strokeStyle = CanvasPalette.remoteWave;
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(250, 6);
  ctx.bezierCurveTo(56, 118, 26, 222, 204, 260);
  ctx.bezierCurveTo(288, 296, 288, 362, 198, 402);
  ctx.bezierCurveTo(22, 456, 26, 558, 188, 588);
  ctx.quadraticCurveTo(232, 606, 252, 634);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

export interface BatteryDecal {
  texture: THREE.CanvasTexture;
  /** Decal plane size, world units. */
  DW: number;
  DH: number;
}

/**
 * Face decal spanning the battery's whole proud length: wordmark near the
 * top, flat-top hex power button low, 4 charge dashes just above the rim.
 * Pass brand = "" to drop the wordmark for storefront renders.
 */
export function buildBatteryDecalTexture(BAT_R: number, BAT_PROUD: number, brand: string): BatteryDecal {
  const DW = 0.072;
  const DH = BAT_PROUD; // decal plane size
  const PXU = 1778; // canvas px per world unit
  const cw = Math.round(DW * PXU);
  const ch = Math.round(DH * PXU);
  const bd = BAT_R * 2 * PXU; // battery diameter in canvas px

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, cw, ch);

  if (brand) {
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.263);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = CanvasPalette.batteryWordmark;
    ctx.font = `600 ${(bd * 0.095).toFixed(0)}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const tr = bd * 0.03; // manual letter spacing
    let tw = 0;
    for (const char of brand) tw += ctx.measureText(char).width + tr;
    let tx = -tw / 2;
    for (const char of brand) {
      ctx.fillText(char, tx, 0);
      tx += ctx.measureText(char).width + tr;
    }
    ctx.restore();
  }

  // flat-top hexagon outline (vertices left and right, as on the unit)
  ctx.strokeStyle = CanvasPalette.batteryHexOutline;
  ctx.lineWidth = bd * 0.017;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = cw * 0.5 + Math.cos(a) * bd * 0.167;
    const y = ch * 0.776 + Math.sin(a) * bd * 0.167;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // 4 charge dashes stacked just above the holder rim
  ctx.fillStyle = CanvasPalette.batteryChargeDash;
  const dw = bd * 0.1;
  const dh = bd * 0.045;
  const gap = bd * 0.119;
  for (let i = 0; i < 4; i++) {
    const yy = ch * 0.872 + i * gap;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cw * 0.5 - dw / 2, yy, dw, dh, dh * 0.4);
    else ctx.rect(cw * 0.5 - dw / 2, yy, dw, dh);
    ctx.fill();
  }

  return { texture: new THREE.CanvasTexture(canvas), DW, DH };
}

export interface PortFaceTexture {
  texture: THREE.CanvasTexture;
  /** Cap-wall and face radius, derived from the battery radius. */
  R_FACE: number;
}

/**
 * Port end of the battery (faces down into the tube when seated), drawn to
 * a canvas rather than cut as geometry: at 24mm across the slots are far
 * below the size where real recesses would read. Layout matches the white
 * unit: indicator upper left, USB-C upper right, USB-A below center. No
 * charge highlight on this model: unlike the one-piece staff's, this
 * battery does not carry a ring decal over the USB-C slot.
 */
export function buildPortFaceTexture(BAT_R: number): PortFaceTexture {
  const PX = 256;
  const MM = PX / 24; // canvas px per mm
  const canvas = document.createElement("canvas");
  canvas.width = PX;
  canvas.height = PX;
  const ctx = canvas.getContext("2d")!;
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
    else ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.closePath();
  };

  // white cap with a shallow groove ring, not the dark face the black unit has
  ctx.beginPath();
  ctx.arc(PX / 2, PX / 2, PX / 2, 0, Math.PI * 2);
  ctx.fillStyle = CanvasPalette.portFaceBg;
  ctx.fill();
  ctx.strokeStyle = CanvasPalette.portGrooveOuter;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(PX / 2, PX / 2, PX / 2 - 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = CanvasPalette.portGrooveInner;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(PX / 2, PX / 2, PX / 2 - 22, 0, Math.PI * 2);
  ctx.stroke();

  const UA = { x: 128, y: 150, w: 12 * MM, h: 4.5 * MM };
  const UC = { x: 168, y: 92, w: 8.3 * MM, h: 2.6 * MM };
  rr(UA.x, UA.y, UA.w, UA.h, 3);
  ctx.fillStyle = CanvasPalette.portSlotBlack;
  ctx.fill();
  rr(UA.x, UA.y + 4, UA.w - 12, UA.h - 16, 2);
  ctx.fillStyle = CanvasPalette.portSlotBlue;
  ctx.fill();
  rr(UC.x, UC.y, UC.w, UC.h, UC.h / 2);
  ctx.fillStyle = CanvasPalette.portSlotBlack;
  ctx.fill();
  rr(UC.x, UC.y, UC.w - 10, UC.h - 10, (UC.h - 10) / 2);
  ctx.fillStyle = CanvasPalette.portSlotBlue;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(92, 88, 22, 0, Math.PI * 2);
  ctx.fillStyle = CanvasPalette.portIndicatorFill;
  ctx.fill();
  ctx.strokeStyle = CanvasPalette.portIndicatorStroke;
  ctx.lineWidth = 3;
  ctx.stroke();

  const R_FACE = BAT_R * 1.005;
  return { texture: new THREE.CanvasTexture(canvas), R_FACE };
}

/** Yellow "The_Galaxy_SF" sticker with a camera glyph, wrapped onto the upper bracket tube as an arc. */
export function buildStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 352;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = CanvasPalette.stickerBackground;
  ctx.fillRect(0, 0, 96, 352);

  ctx.save();
  ctx.translate(48, 176);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = CanvasPalette.stickerInk;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 34px Helvetica, Arial, sans-serif";
  ctx.fillText("The_Galaxy_SF", -128, 2);
  ctx.restore();

  // camera glyph above the text
  ctx.strokeStyle = CanvasPalette.stickerInk;
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 18, 44, 44);
  ctx.beginPath();
  ctx.arc(48, 40, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = CanvasPalette.stickerInk;
  ctx.beginPath();
  ctx.arc(63, 26, 3.4, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

export interface JointLabelTexture {
  texture: THREE.CanvasTexture;
  /** Canvas aspect ratio (width / height), used to size the wrapped label. */
  aspect: number;
}

/**
 * White "The_Galaxy_SF" label on the lower half's sticker sleeve, black
 * text, not the yellow handle sticker (that one stays on the upper
 * bracket only).
 */
export function buildJointLabelTexture(): JointLabelTexture {
  const cw = 256;
  const ch = 96;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = CanvasPalette.jointLabelBg;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = CanvasPalette.jointLabelInk;
  ctx.font = "600 30px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("The_Galaxy_SF", cw / 2, ch / 2 + 2);

  return { texture: new THREE.CanvasTexture(canvas), aspect: cw / ch };
}

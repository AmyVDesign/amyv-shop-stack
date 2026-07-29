import * as THREE from "three";
import { CanvasPalette } from "./palette";

/**
 * Own copy of the whip's canvas-texture builders, ported fresh from the
 * staff prototype. Not imported from whip-3d, see the top-level note on
 * why the two products don't share code yet.
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
 * unit as the whip's inline remote.
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

/** Yellow "The_Galaxy_SF" sticker with a camera glyph, wrapped onto the bracket tube as an arc. */
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

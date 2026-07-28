import * as THREE from "three";

/**
 * Two softboxes + an overhead strip on a dark field, equirect-mapped. PMREM
 * turns this into the reflection environment that makes the shrink-wrap
 * membrane read as glossy film — long soft highlights stretching across the
 * surface — instead of flat plastic.
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

  softbox(70, 30, 110, 170, 0.95); // key, high left
  softbox(330, 60, 90, 130, 0.55); // fill, right
  softbox(200, 10, 180, 36, 0.4); // overhead strip
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

/** Diagonal two-tone weave used as both the color map and bump map for the shock cord. */
export function buildBraidTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#F2EFE7";
  ctx.fillRect(0, 0, 64, 32);
  ctx.lineCap = "round";

  ctx.strokeStyle = "#BFB9A8";
  ctx.lineWidth = 7;
  for (let x = -32; x <= 96; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, -2);
    ctx.lineTo(x + 32, 34);
    ctx.stroke();
  }
  ctx.strokeStyle = "#DAD5C6";
  ctx.lineWidth = 5;
  for (let x = -32; x <= 96; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x + 32, -2);
    ctx.lineTo(x, 34);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Printed remote face — drawn on a transparent canvas and applied as a
 * decal plane over the remote body, so the extrude UVs can't clip it.
 */
export function buildRemoteFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 640);

  ctx.fillStyle = "#b0b6ab";
  ctx.strokeStyle = "#b0b6ab";
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

  ctx.strokeStyle = "#4d5f56";
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

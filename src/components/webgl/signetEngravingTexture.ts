import * as THREE from 'three';

/**
 * SVG hex bounding box: the exact min/max of the outer hex points
 * (180,35),(274,89),(274,230),(180,327),(86,230),(86,89).
 */
export const SX0 = 86;
export const SX1 = 274;
export const SY0 = 35;
export const SY1 = 327;

const SVG_W = SX1 - SX0; // 188
const SVG_H = SY1 - SY0; // 292

export const TEX_W = 512;
export const TEX_H = Math.round((TEX_W * SVG_H) / SVG_W); // ≈ 795

/**
 * Maps a point in SVG-space (within the hex bounding box) to canvas-pixel space.
 * Top-left SVG corner → (0, 0); bottom-right → (TEX_W, TEX_H).
 */
export function svgToCanvas(sx: number, sy: number): [number, number] {
  return [((sx - SX0) / SVG_W) * TEX_W, ((sy - SY0) / SVG_H) * TEX_H];
}

/**
 * Builds a detail engraving texture from the SVG's inner detail lines:
 *   1. Dashed inner ring (inner hex)
 *   2. Five lime hairlines
 *   3. Two cyan chevrons
 *
 * Uses OffscreenCanvas when available (worker-safe), falls back to
 * document.createElement. colorSpace = SRGBColorSpace is mandatory because
 * THREE.ColorManagement is ON — canvas pixels are sRGB.
 */
export function buildEngravingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  // Scale factor: canvas px per SVG unit
  const s = TEX_W / SVG_W; // ≈ 2.723

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(TEX_W, TEX_H);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

  if (ctx !== null) {
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 0. Faint solid inner-hex outline — the SVG panel stroke rgba(163,255,18,0.22).
    // This replaces the old bright 3-D lime "frame" mesh: in logo.svg the inner hex
    // is just this faint etched line, NOT a glowing border.
    {
      const innerHex: Array<[number, number]> = [
        svgToCanvas(180, 72),
        svgToCanvas(238, 107),
        svgToCanvas(238, 211),
        svgToCanvas(180, 272),
        svgToCanvas(122, 211),
        svgToCanvas(122, 107),
      ];
      ctx.beginPath();
      innerHex.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(163,255,18,0.22)';
      ctx.lineWidth = 0.85 * s;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // Dashed inner ring — SVG pts (180,65),(246,104),(246,215),(180,285),(114,215),(114,104)
    {
      const ring: Array<[number, number]> = [
        svgToCanvas(180, 65),
        svgToCanvas(246, 104),
        svgToCanvas(246, 215),
        svgToCanvas(180, 285),
        svgToCanvas(114, 215),
        svgToCanvas(114, 104),
      ];
      ctx.beginPath();
      ring.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(163,255,18,0.32)';
      ctx.lineWidth = 0.9 * s;
      ctx.setLineDash([2 * s, 7 * s]);
      ctx.globalAlpha = 0.78;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Five lime hairlines
    {
      const lines: Array<[[number, number], [number, number]]> = [
        [svgToCanvas(130, 120), svgToCanvas(230, 120)],
        [svgToCanvas(206, 142), svgToCanvas(154, 177)],
        [svgToCanvas(130, 199), svgToCanvas(230, 199)],
        [svgToCanvas(180, 65), svgToCanvas(180, 104)],
        [svgToCanvas(180, 215), svgToCanvas(180, 285)],
      ];
      ctx.strokeStyle = 'rgba(163,255,18,0.18)';
      ctx.lineWidth = 1 * s;
      ctx.globalAlpha = 0.78;
      lines.forEach(([[x0, y0], [x1, y1]]) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
    }

    // (The two cyan chevrons that traced the top/bottom apexes were removed at the
    // user's request — at texture scale + grazing yaw they aliased into blue dashed
    // lines. The lime engraving detail is kept.)

    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a radial aura glow texture (256×256) matching the SVG
 * `zian-monolith-aura-gradient`: lime → cyan → blue → transparent.
 * Used as a sprite behind the signet body.
 */
export function buildAuraTexture(): THREE.CanvasTexture {
  const SIZE = 256;

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(SIZE, SIZE);
  } else {
    canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
  }

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

  if (ctx !== null) {
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(163,255,18,0.18)');
    grad.addColorStop(0.45, 'rgba(6,182,212,0.12)');
    grad.addColorStop(0.8, 'rgba(59,130,246,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  const tex = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

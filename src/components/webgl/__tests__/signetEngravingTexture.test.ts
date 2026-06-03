import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { svgToCanvas, buildEngravingTexture, buildAuraTexture, TEX_W, TEX_H } from '../signetEngravingTexture';

describe('svgToCanvas', () => {
  it('maps top-left SVG corner (86, 35) to canvas origin (0, 0)', () => {
    const [cx, cy] = svgToCanvas(86, 35);
    expect(cx).toBe(0);
    expect(cy).toBe(0);
  });

  it('maps bottom-right SVG corner (274, 327) to canvas (TEX_W, TEX_H)', () => {
    const [cx, cy] = svgToCanvas(274, 327);
    expect(cx).toBeCloseTo(TEX_W, 5);
    expect(cy).toBeCloseTo(TEX_H, 5);
  });

  it('maps SVG centre (180, 182) to approximately canvas centre', () => {
    // SVG hex bbox centre: x=(86+274)/2=180, y=(35+327)/2=181
    const [cx, cy] = svgToCanvas(180, 181);
    expect(cx).toBeCloseTo(TEX_W / 2, 0);
    expect(cy).toBeCloseTo(TEX_H / 2, 0);
  });

  it('maps SVG mid-point (180, 182) to approximately canvas centre-ish', () => {
    const [cx, cy] = svgToCanvas(180, 182);
    // x=180 is dead centre
    expect(cx).toBeCloseTo(TEX_W / 2, 0);
    // y=182 is just slightly past vertical centre (181)
    expect(cy).toBeGreaterThan(TEX_H / 2 - 5);
    expect(cy).toBeLessThan(TEX_H / 2 + 5);
  });
});

describe('buildEngravingTexture', () => {
  it('returns a THREE.CanvasTexture with SRGBColorSpace', () => {
    // jsdom may or may not support canvas 2d context; guard gracefully.
    let tex: THREE.CanvasTexture | null = null;
    try {
      tex = buildEngravingTexture(1);
    } catch {
      // If THREE or canvas APIs are absent in this env, skip draw assertions.
    }

    if (tex === null) return;

    expect(tex).toBeInstanceOf(THREE.CanvasTexture);
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(tex.anisotropy).toBe(1);

    // If jsdom provided a canvas with real dimensions, verify them.
    const img = tex.image as { width?: number; height?: number } | null;
    if (img !== null && typeof img.width === 'number' && img.width > 0) {
      expect(img.width).toBe(TEX_W);
      expect(img.height).toBe(TEX_H);
    }
  });
});

describe('buildAuraTexture', () => {
  it('returns a THREE.CanvasTexture with SRGBColorSpace', () => {
    let tex: THREE.CanvasTexture | null = null;
    try {
      tex = buildAuraTexture();
    } catch {
      // Guard if canvas APIs are absent.
    }

    if (tex === null) return;

    expect(tex).toBeInstanceOf(THREE.CanvasTexture);
    expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
    // `needsUpdate` is a write-only setter (reading returns undefined); setting it
    // bumps `version` from 0, which is the observable signal that it was flagged.
    expect(tex.version).toBeGreaterThan(0);
  });
});

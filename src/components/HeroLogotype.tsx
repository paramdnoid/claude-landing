import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/animations';

/**
 * The signature "ZIAN" wordmark.
 * The word is rasterized into a 2D canvas at high DPR and used as a texture
 * on a fullscreen plane. The fragment shader:
 *   - splits R/G/B sample offsets driven by pointer for chromatic aberration
 *   - adds slow value-noise warping for a breathing/ripple feel
 *   - injects timed radial ripples on click
 *   - tints the alpha-masked glyph with a vertical cyan -> violet gradient
 *
 * Why text-as-texture rather than three-mesh / SDF? It keeps font fidelity
 * (Geist Variable 900) without shipping a font atlas or msdfgen, and lets the
 * shader do all the motion work — which is the actual goal here.
 */

const MAX_RIPPLES = 4;

export default function HeroLogotype() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || typeof window === 'undefined') return;

    const reducedMotion = prefersReducedMotion();

    // --- Text canvas (the source texture) ---
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');
    if (!textCtx) return;

    const texture = new THREE.CanvasTexture(textCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    let width = mount.clientWidth;
    let height = mount.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const drawText = () => {
      const w = Math.max(1, Math.floor(width * dpr));
      const h = Math.max(1, Math.floor(height * dpr));
      textCanvas.width = w;
      textCanvas.height = h;
      textCtx.clearRect(0, 0, w, h);

      // Massive responsive type. Stretch the word ZIAN edge to edge.
      const text = 'ZIAN';
      // Start big; shrink-to-fit ~92% width.
      let fontSize = h * 0.7;
      const fontFamily =
        '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      textCtx.fillStyle = '#ffffff';
      textCtx.textBaseline = 'middle';
      textCtx.textAlign = 'center';
      // Use "900" weight; Geist Variable supports it.
      const setFont = (size: number) => {
        textCtx.font = `900 ${size}px ${fontFamily}`;
      };
      setFont(fontSize);
      const target = w * 0.94;
      let measured = textCtx.measureText(text).width;
      if (measured > 0) {
        fontSize = Math.min(h * 0.85, fontSize * (target / measured));
        setFont(fontSize);
        measured = textCtx.measureText(text).width;
      }
      // Letter-spacing trick — simulate -0.05em by scaling the canvas horizontally
      // around the center before drawing.
      textCtx.save();
      const tracking = 0.96; // -4% horizontal compression
      textCtx.translate(w / 2, h / 2);
      textCtx.scale(tracking, 1);
      textCtx.translate(-w / 2, -h / 2);
      textCtx.fillText(text, w / 2, h / 2);
      textCtx.restore();

      texture.needsUpdate = true;
    };

    drawText();

    // --- Three.js scene ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Ripple uniforms: vec3 (x, y, startTime). w<0 means inactive.
    const ripples: THREE.Vector4[] = Array.from(
      { length: MAX_RIPPLES },
      () => new THREE.Vector4(0, 0, 0, -1),
    );

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(width, height) },
      uRipples: { value: ripples },
      uColorA: { value: new THREE.Color('#00e5ff') },
      uColorB: { value: new THREE.Color('#a855f7') },
      uReduced: { value: reducedMotion ? 1 : 0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uPointerStrength;
        uniform sampler2D uTexture;
        uniform vec2 uResolution;
        uniform vec4 uRipples[${MAX_RIPPLES}];
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uReduced;

        // ---- value noise (cheap, smooth) ----
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float sampleAlpha(vec2 uv) {
          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
          return texture2D(uTexture, uv).a;
        }

        void main() {
          vec2 uv = vUv;
          // Aspect-correct distance so ripples are circular.
          float aspect = uResolution.x / max(uResolution.y, 1.0);

          // --- noise warp (gentle breathing) ---
          float t = uTime * 0.35;
          float n = vnoise(uv * 3.0 + vec2(t, -t * 0.6));
          float n2 = vnoise(uv * 6.0 - vec2(t * 0.4, t * 0.8));
          vec2 warp = vec2(n - 0.5, n2 - 0.5) * (0.012 + uPointerStrength * 0.02);
          warp *= (1.0 - uReduced);

          // --- ripple displacement ---
          vec2 rippleDisp = vec2(0.0);
          float rippleGlow = 0.0;
          for (int i = 0; i < ${MAX_RIPPLES}; i++) {
            vec4 r = uRipples[i];
            if (r.w < 0.0) continue;
            float age = uTime - r.w;
            if (age < 0.0 || age > 1.4) continue;
            vec2 d = vec2((uv.x - r.x) * aspect, uv.y - r.y);
            float dist = length(d);
            float wave = sin(dist * 28.0 - age * 14.0) * exp(-age * 3.0) * exp(-dist * 4.0);
            rippleDisp += normalize(d + 1e-5) * wave * 0.018;
            rippleGlow += max(0.0, wave) * 0.6;
          }

          // --- chromatic aberration driven by pointer ---
          vec2 toPointer = uv - (uPointer * 0.5 + 0.5);
          float pd = length(vec2(toPointer.x * aspect, toPointer.y));
          float chroma = (0.0035 + uPointerStrength * 0.012) * smoothstep(0.9, 0.0, pd);
          vec2 dir = normalize(toPointer + 1e-5);

          vec2 baseUv = uv + warp + rippleDisp;
          float aR = sampleAlpha(baseUv + dir * chroma);
          float aG = sampleAlpha(baseUv);
          float aB = sampleAlpha(baseUv - dir * chroma);

          // Combine into a glyph mask + glow
          float mask = max(aR, max(aG, aB));
          if (mask < 0.01 && rippleGlow < 0.02) discard;

          // Vertical gradient cyan -> violet
          vec3 grad = mix(uColorA, uColorB, smoothstep(0.0, 1.0, uv.y));
          // Subtle internal shading via noise so the glyph "breathes"
          float shade = 0.85 + 0.25 * vnoise(uv * 4.0 + uTime * 0.15);

          // Build per-channel color from aberrated samples to keep the fringe.
          vec3 fringe = vec3(aR, aG, aB);
          vec3 col = grad * shade * fringe;

          // Add ripple highlight as a soft white glow on top
          col += vec3(rippleGlow) * grad * 1.4;

          float alpha = mask + rippleGlow * 0.6;
          alpha = clamp(alpha, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Pointer ---
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointer = new THREE.Vector2(0, 0);
    let pointerStrengthTarget = 0;

    const localPointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerTarget.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerTarget.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    const onMove = (e: PointerEvent) => {
      localPointer(e.clientX, e.clientY);
      pointerStrengthTarget = 1;
    };
    const onLeave = () => {
      pointerStrengthTarget = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerout', onLeave);

    // --- Click ripple ---
    let nextRipple = 0;
    const onClick = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const slot = ripples[nextRipple % MAX_RIPPLES];
      slot.set(x, y, 0, performance.now() / 1000);
      // Re-bind start time relative to uTime clock below
      slot.w = -2; // sentinel; will be re-stamped at next tick
      nextRipple += 1;
    };
    // Use the renderer canvas so the parent's pointer-events:none doesn't block.
    // touch-action keeps vertical scroll working on touch devices.
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'pan-y pinch-zoom';
    renderer.domElement.addEventListener('pointerdown', onClick);

    // --- Resize ---
    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
      drawText();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // --- Visibility gating ---
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    // --- Render ---
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      const elapsed = clock.getElapsedTime();
      uniforms.uTime.value = elapsed;

      // Re-stamp pending ripple start times to elapsed (so wave timing matches uTime).
      for (let i = 0; i < ripples.length; i++) {
        if (ripples[i].w === -2) ripples[i].w = elapsed;
      }
      // Garbage-collect expired ripples.
      for (let i = 0; i < ripples.length; i++) {
        if (ripples[i].w >= 0 && elapsed - ripples[i].w > 1.5) ripples[i].w = -1;
      }

      pointer.lerp(pointerTarget, 0.08);
      uniforms.uPointer.value.copy(pointer);
      uniforms.uPointerStrength.value +=
        (pointerStrengthTarget - uniforms.uPointerStrength.value) * 0.06;

      renderer.render(scene, camera);
    };

    if (reducedMotion) {
      // Single static render, no rAF loop.
      renderer.render(scene, camera);
    } else {
      tick();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerout', onLeave);
      renderer.domElement.removeEventListener('pointerdown', onClick);
      ro.disconnect();
      io.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 -z-[1] flex items-center justify-center"
      // Reserve a deterministic box so the canvas has explicit size from first paint.
      style={{ contain: 'strict' }}
    />
  );
}

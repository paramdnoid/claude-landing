import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, SMAA, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import WebGLErrorBoundary from './WebGLErrorBoundary';
import Signet from '../Signet';
import SignetMesh3D from './SignetMesh3D';
import { prefersReducedMotion } from '../../lib/animations';

// Ceiling raised so the 42vw term governs through 4K (~806px @1920 → ~1613px
// @3840), keeping the signet a uniform 42% of viewport instead of capping early.
const SIZE = 'clamp(320px, 42vw, 1664px)';

// Dissolve the square canvas edges so the signet (and its bloom) floats in the
// hero instead of reading as a pasted-on panel. Elliptical to respect the
// taller-than-wide shield silhouette without clipping its points.
const EDGE_FADE = 'radial-gradient(ellipse 62% 70% at 50% 50%, #000 60%, transparent 100%)';

/**
 * Transparent R3F Canvas positioned at z-[1] (above all CSS scrim overlays).
 *
 * The signet renders as a polished obsidian monolith: brand-coloured IBL
 * reflections (drei Environment/Lightformer), a beveled gradient-lit lime Z,
 * and a post-processing stack (N8AO contact shadows, Bloom on the lime,
 * SMAA for crisp silhouette edges) under ACES tone mapping. No canvas-level
 * opacity — the crisp render composites directly over the hero gradient.
 */
export default function HeroSignet3D() {
  const rm = prefersReducedMotion();

  const fallback = (
    <div style={{ width: SIZE, height: SIZE, opacity: 0.25, mixBlendMode: 'overlay' }}>
      <Signet animated className='w-full h-full' />
    </div>
  );

  if (rm) return fallback;

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5], fov: 52 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.0;
          }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE,
          }}
        >
          <SignetMesh3D />
          <EffectComposer multisampling={0}>
            <N8AO halfRes aoSamples={6} aoRadius={0.35} intensity={1.1} />
            <Bloom intensity={0.42} luminanceThreshold={0.78} luminanceSmoothing={0.35} mipmapBlur />
            <SMAA />
          </EffectComposer>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

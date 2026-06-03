import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, SMAA, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
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
// Tightened to 46%/50% (transparent by 94%): the looser 64%/72% left the canvas
// corners only ~55% faded, so the square's edges showed as a visible box where
// they crossed the bright liquid gradient. These radii fade the canvas fully to
// transparent just outside the signet+aura, so the mark melts into the backdrop.
const EDGE_FADE = 'radial-gradient(ellipse 46% 50% at 50% 50%, #000 62%, transparent 94%)';

/**
 * Transparent R3F Canvas positioned at z-[1] (above all CSS scrim overlays).
 *
 * The signet renders as a polished obsidian monolith: brand-coloured IBL
 * reflections (drei Environment/Lightformer), a beveled gradient-lit lime Z,
 * and a post-processing stack (N8AO contact shadows, Bloom on the lime, Khronos
 * PBR Neutral tone mapping, SMAA for crisp silhouette edges). Tone mapping lives
 * in the composer, not on the renderer: @react-three/postprocessing forces
 * gl.toneMapping to NoToneMapping while mounted, so the effect owns it. Neutral
 * over ACES because it preserves the saturated brand lime (and rolls highlights
 * off without clipping them to white) instead of washing it toward yellow. No
 * canvas-level opacity — the crisp render composites directly over the hero.
 */
export default function HeroSignet3D({ inView = true }: { inView?: boolean }) {
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
          frameloop={inView ? 'always' : 'never'}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 8.3], fov: 38 }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE,
          }}
        >
          <SignetMesh3D />
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.5} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            <SMAA />
          </EffectComposer>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

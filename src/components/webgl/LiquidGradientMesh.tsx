import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import WebGL from 'three/examples/jsm/capabilities/WebGL.js';
import { ScrollTrigger } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';
import { liquidGradientFragment, liquidGradientVertex } from './liquidGradientShader';
import StaticGradientFallback from './StaticGradientFallback';

const webGL2Available = typeof document !== 'undefined' ? WebGL.isWebGL2Available() : true;

type Props = {
  /** id of the section that drives uScroll progress */
  scrollTriggerId?: string;
};

function GradientPlane({ scrollTriggerId }: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  // Impulse state — mutable ref, no re-render needed.
  // x,y hold the last NDC pointer position; strength starts at 0.
  const impulseRef = useRef({ x: 0, y: 0, strength: 0 });
  const reducedMotion = prefersReducedMotion();

  // Initial size is captured intentionally; the resize effect below keeps
  // uResolution in sync. We want stable uniforms across renders.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uImpulse: { value: new THREE.Vector3(0, 0, 0) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // mouse parallax
  useEffect(() => {
    const target = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', onMove);
    let raf = 0;
    const ease = () => {
      uniforms.uMouse.value.lerp(target, 0.06);
      raf = requestAnimationFrame(ease);
    };
    raf = requestAnimationFrame(ease);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [uniforms]);

  // pointer impulse — disabled when reducedMotion
  useEffect(() => {
    if (reducedMotion) return;
    const onDown = (e: PointerEvent) => {
      const ndcX = (e.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -((e.clientY / window.innerHeight) * 2 - 1);
      impulseRef.current = { x: ndcX, y: ndcY, strength: 1.0 };
    };
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('pointerdown', onDown);
    };
  }, [reducedMotion]);

  // scroll-driven uScroll
  useEffect(() => {
    if (!scrollTriggerId) return;
    const trigger = document.getElementById(scrollTriggerId);
    if (!trigger) return;
    const st = ScrollTrigger.create({
      trigger,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (materialRef.current) {
          (materialRef.current.uniforms.uScroll as { value: number }).value = self.progress;
        }
      },
    });
    return () => st.kill();
  }, [scrollTriggerId]);

  useFrame((_, dt) => {
    if (!materialRef.current) return;

    (materialRef.current.uniforms.uTime as { value: number }).value += dt;

    // Decay the impulse strength each frame (~0.7s half-life at 60fps)
    const imp = impulseRef.current;
    if (imp.strength > 0.001) {
      imp.strength *= Math.pow(0.05, dt); // exponential decay: ~0 in ~0.7s
      (materialRef.current.uniforms.uImpulse as { value: THREE.Vector3 }).value.set(
        imp.x,
        imp.y,
        imp.strength,
      );
    } else if (imp.strength > 0) {
      imp.strength = 0;
      (materialRef.current.uniforms.uImpulse as { value: THREE.Vector3 }).value.set(0, 0, 0);
    }
  });

  // Explicit disposal of the ShaderMaterial on unmount. We capture the
  // current ref value inside the effect so cleanup is robust even if React
  // clears the ref before running the cleanup callback.
  useEffect(() => {
    const material = materialRef.current;
    return () => {
      material?.dispose();
    };
  }, []);

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={liquidGradientVertex}
        fragmentShader={liquidGradientFragment}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function LiquidGradientMesh({ scrollTriggerId }: Props) {
  if (prefersReducedMotion() || !webGL2Available) {
    return <StaticGradientFallback />;
  }

  return (
    <Canvas
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      dpr={[1, 1.5]}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <GradientPlane scrollTriggerId={scrollTriggerId} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.45} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

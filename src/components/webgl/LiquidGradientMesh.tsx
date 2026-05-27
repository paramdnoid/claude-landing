import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { liquidGradientFragment, liquidGradientVertex } from './liquidGradientShader';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  /** id of the section that drives uScroll progress */
  scrollTriggerId?: string;
};

function GradientPlane({ scrollTriggerId }: Props) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // mouse
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
      onUpdate: (self) => {
        if (materialRef.current) {
          (materialRef.current.uniforms.uScroll as { value: number }).value = self.progress;
        }
      },
    });
    return () => st.kill();
  }, [scrollTriggerId]);

  useFrame((_, dt) => {
    if (materialRef.current) {
      (materialRef.current.uniforms.uTime as { value: number }).value += dt;
    }
  });

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
        <ChromaticAberration
          offset={[0.0008, 0.0008] as unknown as [number, number]}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}

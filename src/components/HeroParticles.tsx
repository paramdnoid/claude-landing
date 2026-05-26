import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroParticles() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    const cyan = new THREE.Color('#00e5ff');
    const violet = new THREE.Color('#a855f7');

    for (let i = 0; i < COUNT; i++) {
      // Hollow shell: radius biased OUTWARD so center stays clear for text
      const r = 5.5 + Math.pow(Math.random(), 0.6) * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.5;
      seeds[i] = Math.random();

      const mix = Math.random();
      const c = cyan.clone().lerp(violet, mix);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uScroll: { value: 0 },
        uSize: { value: 0.9 * renderer.getPixelRatio() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uScroll;
        uniform float uSize;
        attribute float aSeed;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vec3 p = position;
          float t = uTime * 0.5 + aSeed * 6.2831;
          p.x += sin(t) * 0.18;
          p.y += cos(t * 1.1) * 0.18;
          p.z += sin(t * 0.7) * 0.12;
          // pointer attraction
          vec2 toPointer = uPointer * 4.0 - p.xy * 0.0;
          float d = distance(p.xy, uPointer * 6.0);
          float k = smoothstep(4.0, 0.0, d) * 0.8;
          p.xy += normalize(uPointer * 6.0 - p.xy) * k;
          p.y -= uScroll * 0.8;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (220.0 / -mv.z);
          vColor = color;
          vAlpha = 0.55 + 0.45 * sin(t);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float r = length(uv);
          float a = smoothstep(0.5, 0.0, r);
          gl_FragColor = vec4(vColor * 0.85, a * vAlpha * 0.55);
          if (gl_FragColor.a < 0.02) discard;
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    scene.add(points);

    const pointer = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    const onMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      target.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let scrollY = 0;
    const onScroll = () => {
      scrollY = Math.min(1, window.scrollY / window.innerHeight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      mat.uniforms.uSize.value = 1.4 * renderer.getPixelRatio();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      pointer.lerp(target, 0.08);
      mat.uniforms.uTime.value = clock.getElapsedTime();
      mat.uniforms.uPointer.value.copy(pointer);
      mat.uniforms.uScroll.value = scrollY;
      points.rotation.y += 0.0008;
      points.rotation.x += 0.0003;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      io.disconnect();
      geom.dispose();
      mat.dispose();
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
      className="pointer-events-none absolute inset-0 -z-10"
    />
  );
}

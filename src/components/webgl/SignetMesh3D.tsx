import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { ScrollTrigger } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';

/** Map SVG `0 0 360 360` coords into the signet's local 3-D space. */
function sv(x: number, y: number): [number, number] {
  return [(x - 180) / 90, -(y - 182) / 90];
}

const HEX_OUTER: Array<[number, number]> = [
  sv(180, 35), sv(274, 89), sv(274, 230),
  sv(180, 327), sv(86, 230), sv(86, 89),
];

const HEX_INNER: Array<[number, number]> = [
  sv(180, 72), sv(238, 107), sv(238, 211),
  sv(180, 272), sv(122, 211), sv(122, 107),
];

const Z_PTS: Array<[number, number]> = [
  sv(114, 104), sv(246, 104), sv(246, 136), sv(174, 183), sv(246, 183),
  sv(246, 215), sv(114, 215), sv(114, 183), sv(186, 136), sv(114, 136),
];

function shapeFrom(pts: Array<[number, number]>): THREE.Shape {
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

/** Centroid of a polygon's vertices (used to scale a hex around its own centre). */
function centroid(pts: Array<[number, number]>): [number, number] {
  const sum = pts.reduce<[number, number]>((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  return [sum[0] / pts.length, sum[1] / pts.length];
}

/** A thin hex frame (outer ring with a smaller hex hole) — the crisp lime inlay. */
function buildFrameShape(): THREE.Shape {
  const [cx, cy] = centroid(HEX_INNER);
  const scaleAround = (s: number): Array<[number, number]> =>
    HEX_INNER.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
  const shape = shapeFrom(scaleAround(1));
  const holePts = scaleAround(0.9);
  const hole = new THREE.Path();
  holePts.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)));
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

/** Bake a vertical lime gradient into the Z so it reads as a lit solid, not a flat fill. */
function paintZGradient(geo: THREE.BufferGeometry): void {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (box === null) return;
  const minY = box.min.y;
  const spanY = box.max.y - box.min.y || 1;
  // Desaturated lime — keeps the brand hue but pulls the eye-searing saturation down.
  const bottom = new THREE.Color(0x55632e);
  const mid = new THREE.Color(0xaecb6b);
  const top = new THREE.Color(0xdce8b4);
  const pos = geo.attributes.position;
  if (pos === undefined) return;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const t = (pos.getY(i) - minY) / spanY;
    if (t < 0.5) c.copy(bottom).lerp(mid, t * 2);
    else c.copy(mid).lerp(top, (t - 0.5) * 2);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export default function SignetMesh3D() {
  const groupRef = useRef<THREE.Group>(null);
  const zMeshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const scrollRef = useRef(0);
  const rm = prefersReducedMotion();

  // --- Geometry ----------------------------------------------------------
  const hexGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(HEX_OUTER), {
      depth: 0.42, bevelEnabled: true,
      bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 12, curveSegments: 24,
    });
    geo.center();
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    return geo;
  }, []);

  // Front face plane of the body (z where the inlay + Z sit proud).
  const frontZ = useMemo(() => hexGeo.boundingBox?.max.z ?? 0.27, [hexGeo]);
  // geo.center() shifts the hex by its bounding-box centre; re-apply to align siblings.
  const yShift = useMemo(() => {
    const ys = HEX_OUTER.map(([, y]) => y);
    return -((Math.max(...ys) + Math.min(...ys)) / 2);
  }, []);

  // Raised inner bezel panel — layered depth, catches its own env highlight.
  const panelGeo = useMemo(() => {
    const [cx, cy] = centroid(HEX_INNER);
    const pts = HEX_INNER.map(([x, y]): [number, number] => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.86]);
    const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), {
      depth: 0.04, bevelEnabled: true,
      bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 6, curveSegments: 16,
    });
    geo.computeVertexNormals();
    return geo;
  }, []);

  const frameGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildFrameShape(), {
      depth: 0.05, bevelEnabled: true,
      bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 16,
    });
    geo.computeVertexNormals();
    return geo;
  }, []);

  const zGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(Z_PTS), {
      depth: 0.12, bevelEnabled: true,
      bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 6, curveSegments: 12,
    });
    geo.computeVertexNormals();
    paintZGradient(geo);
    return geo;
  }, []);

  // --- Materials ---------------------------------------------------------
  const hexMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x05060b, metalness: 0, roughness: 0.09,
    clearcoat: 1, clearcoatRoughness: 0.05,
    reflectivity: 0.7, envMapIntensity: 1.8, ior: 1.5,
    transmission: 0.16, thickness: 0.6, specularIntensity: 1,
    emissive: new THREE.Color(0x0a0e1a), emissiveIntensity: 0.35,
    iridescence: 0.3, iridescenceIOR: 1.35,
  }), []);

  const panelMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x080b14, metalness: 0.1, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.4,
    emissive: new THREE.Color(0x0c1226), emissiveIntensity: 0.5,
  }), []);

  const frameMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xa3ff12, metalness: 0.2, roughness: 0.3,
    emissive: new THREE.Color(0xa3ff12), emissiveIntensity: 0.5,
    clearcoat: 0.6, envMapIntensity: 1,
  }), []);

  const zMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.34, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1,
    // Low, muted emissive keeps the vertex-colour gradient (lit form) readable;
    // bloom catches the bright top edge instead of flattening the whole letter.
    emissive: new THREE.Color(0x6a7340), emissiveIntensity: 0.3,
  }), []);

  // --- Scroll tilt -------------------------------------------------------
  useEffect(() => {
    const trigger = document.getElementById('hero');
    if (trigger === null || rm) return;
    const st = ScrollTrigger.create({
      trigger, start: 'top top', end: 'bottom top',
      scrub: 1.5, invalidateOnRefresh: true,
      onUpdate(self) { scrollRef.current = self.progress; },
    });
    return () => st.kill();
  }, [rm]);

  useEffect(() => {
    return () => {
      hexGeo.dispose(); panelGeo.dispose(); frameGeo.dispose(); zGeo.dispose();
      hexMat.dispose(); panelMat.dispose(); frameMat.dispose(); zMat.dispose();
    };
  }, [hexGeo, panelGeo, frameGeo, zGeo, hexMat, panelMat, frameMat, zMat]);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (group === null) return;
    if (rm) { group.rotation.set(0.04, 0.32, 0); return; }
    timeRef.current += dt;
    // Stay front-facing: gentle sway around the viewer, never edge-on. Keeps the Z legible.
    group.rotation.y = Math.sin(timeRef.current * 0.32) * 0.38;
    group.rotation.x = Math.sin(timeRef.current * 0.24) * 0.05 + scrollRef.current * 0.14;
    // Subtle emissive breathe drives the bloom — reduced-motion-safe (gated above).
    const m = zMeshRef.current?.material;
    if (m instanceof THREE.MeshPhysicalMaterial) {
      m.emissiveIntensity = 0.35 + Math.sin(timeRef.current * 0.9) * 0.1;
    }
  });

  return (
    <>
      {/* Brand-coloured IBL: streak reflections sweep the obsidian clearcoat as it turns. */}
      <Environment background={false} resolution={256}>
        <color attach="background" args={['#05050a']} />
        <Lightformer intensity={4.5} color="#fff5ee" position={[0, 3, 2]} scale={[7, 2, 1]} />
        <Lightformer intensity={3} color="#ffffff" position={[-2, 4, 3]} scale={[2, 0.4, 1]} />
        <Lightformer intensity={2.2} color="#a3ff12" position={[-5, 2, 1]} scale={[1, 4, 1]} />
        <Lightformer intensity={2} color="#06b6d4" position={[5, -2, 1]} scale={[1.5, 4, 1]} />
        <Lightformer intensity={2.4} color="#0d9488" position={[1, -1, -4]} scale={[5, 5, 1]} />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 5]} intensity={2} color={0xfff5ee} />

      <group ref={groupRef} rotation={[0.04, 0.2, 0]}>
        {/* Obsidian monolith body */}
        <mesh geometry={hexGeo} material={hexMat} />

        {/* Recessed-reading bezel panel + crisp lime inlay frame */}
        <group position={[0, yShift, 0]}>
          <mesh geometry={panelGeo} material={panelMat} position={[0, 0, frontZ - 0.02]} />
          <mesh geometry={frameGeo} material={frameMat} position={[0, 0, frontZ + 0.01]} />
          {/* Z letterform, beveled and proud of the face */}
          <mesh ref={zMeshRef} geometry={zGeo} material={zMat} position={[0, 0, frontZ + 0.05]} />
        </group>
      </group>
    </>
  );
}

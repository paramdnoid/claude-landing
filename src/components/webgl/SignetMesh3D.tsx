import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { ScrollTrigger } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';
import { buildEngravingTexture, buildAuraTexture } from './signetEngravingTexture';

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

// Resting glow of the lime Z. Shared by the material's base value and the
// per-frame "breathe" baseline so the two never drift out of sync.
const Z_EMISSIVE_BASE = 0.24;
const Z_EMISSIVE_BREATHE = 0.08;

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

/**
 * Bake a vertical lime gradient into the Z so it reads as a lit solid, not a flat fill.
 * After baking, also brighten the top-bar region toward #ffffff→#d4ff6e (Z highlight layer,
 * matching the SVG `zian-monolith-z-highlight-gradient`).
 */
function paintZWithHighlights(geo: THREE.BufferGeometry): void {
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (box === null) return;
  const minY = box.min.y;
  const spanY = box.max.y - box.min.y || 1;
  // Brand-lime ramp lifted straight from logo.svg (#4a7300 → #a3ff12 → #d4ff6e),
  // biased dark→core: lighting + bloom create the bright tip, so the baked top
  // stays a saturated lime instead of a pale beige that reads as washed-out.
  const bottom = new THREE.Color(0x4a7300);
  const mid = new THREE.Color(0xa3ff12);
  const top = new THREE.Color(0xd4ff6e);
  // Highlight colours for top-bar region — light lime, NOT pure white. A white
  // target plus the bright IBL + bloom blew the top bar out to a flat white
  // stroke; the SVG's highlight is a translucent lift over lime, so keep it lime.
  const hiTop = new THREE.Color(0xf4ffe0);
  const hiMid = new THREE.Color(0xd4ff6e);
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  if (pos === undefined) return;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const h = new THREE.Color();
  // Top 16% of the Z's Y span = the top-bar highlight region.
  const topBarThreshold = minY + spanY * 0.84;
  // Lower-bar region: bottom 30% of Y span.
  const lowerBarThreshold = minY + spanY * 0.30;
  for (let i = 0; i < pos.count; i += 1) {
    const t = (pos.getY(i) - minY) / spanY;
    // Base lime ramp
    if (t < 0.5) c.copy(bottom).lerp(mid, t * 2);
    else c.copy(mid).lerp(top, (t - 0.5) * 2);

    // Highlight: only on front-ish faces (nrm.z > 0.1)
    const nz = nrm !== undefined ? nrm.getZ(i) : 0;
    if (nz > 0.1) {
      const y = pos.getY(i);
      if (y > topBarThreshold) {
        // Top bar — gentle highlight toward light lime (kept subtle so it reads
        // as a lit lime stroke, not a white bar that booms under bloom).
        const factor = Math.min((y - topBarThreshold) / (spanY * 0.16), 1) * 0.32;
        const th = (y - topBarThreshold) / (spanY * 0.16);
        h.copy(hiTop).lerp(hiMid, th);
        c.lerp(h, factor);
      } else if (y < lowerBarThreshold) {
        // Lower bar — very subtle lift, strongest at the very bottom. Normalised
        // over the bottom band and CLAMPED: lowerBarThreshold is a near-zero
        // absolute coord, so the old `1 - y/threshold` form overshot to ~7×,
        // blowing the bottom stroke out to white.
        const band = spanY * 0.30;
        const factor = Math.min(Math.max((lowerBarThreshold - y) / band, 0), 1) * 0.06;
        h.copy(hiMid);
        c.lerp(h, factor);
      }
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * Paint subtle facet tints on the obsidian shell to match the SVG's left/right
 * shell gradients (lime tint left, electric-blue tint right — the blue-palette
 * value #3b82f6, not the older indigo logo.svg still carries).
 * Uses smoothstep across x ∈ [-0.15, 0.15] to avoid a hard seam at x=0.
 * Keeps colors in the 0.05–0.12 opacity range so the body reads dark, not coloured.
 */
function paintShellFacets(geo: THREE.BufferGeometry): void {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  if (pos === undefined || nrm === undefined) return;

  // Base obsidian
  const obsidian = new THREE.Color(0x05060b);
  // Left tint: lime→cyan (SVG shell-left-gradient)
  const limeTop = new THREE.Color(0xa3ff12);
  const cyanMid = new THREE.Color(0x06b6d4);
  // Right tint: blue→cyan (SVG shell-right-gradient)
  const blueTop = new THREE.Color(0x3b82f6);

  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (box === null) return;
  const minY = box.min.y;
  const spanY = box.max.y - box.min.y || 1;

  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const tint = new THREE.Color();

  for (let i = 0; i < pos.count; i += 1) {
    c.copy(obsidian);

    const nz = nrm.getZ(i);
    if (nz > 0.3) {
      // Front-facing vertex — apply subtle side tints
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Vertical fade: stronger near top, none at bottom
      const vertFade = Math.max(0, (y - minY) / spanY);

      // Smoothstep blend across x seam to avoid hard line
      const blend = x < -0.15 ? 0.0 : x > 0.15 ? 1.0 :
        (t => t * t * (3 - 2 * t))((x + 0.15) / 0.30);

      // Left side tint (blend=0 → pure left colour)
      const leftIntensity = (1 - blend) * vertFade * 0.10;
      // Right side tint (blend=1 → pure right colour)
      const rightIntensity = blend * vertFade * 0.08;

      // Determine left colour from top (lime) to mid (cyan)
      const leftColor = limeTop.clone().lerp(cyanMid, 1 - vertFade);
      // Determine right colour
      const rightColor = blueTop.clone().lerp(cyanMid, 1 - vertFade);

      // Blend the two tints
      tint.copy(leftColor).lerp(rightColor, blend);
      const intensity = leftIntensity + rightIntensity;
      c.lerp(tint, Math.min(intensity, 0.12));
    }

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/** Build the rim ring geometry: HEX_OUTER shape with a scaled-in hole. */
function buildRimShape(holeScale: number): THREE.Shape {
  const [cx, cy] = centroid(HEX_OUTER);
  const shape = shapeFrom(HEX_OUTER);
  const holePts = HEX_OUTER.map(([x, y]): [number, number] => [
    cx + (x - cx) * holeScale,
    cy + (y - cy) * holeScale,
  ]);
  const hole = new THREE.Path();
  holePts.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)));
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

/**
 * Paint vertex colours on the rim ring, projecting each vertex onto the SVG's
 * rim-gradient axis (from sv(108,54) to sv(258,290)) to reproduce the
 * lime→cyan→blue→dark-indigo ramp.
 */
function paintRimGradient(geo: THREE.BufferGeometry): void {
  // Gradient axis endpoints in local 3-D space (same sv() mapping as the mesh)
  const ax = sv(108, 54);
  const bx = sv(258, 290);
  // Axis vector
  const adx = bx[0] - ax[0];
  const ady = bx[1] - ax[1];
  const lenSq = adx * adx + ady * ady;

  // Colour stops for the rim ramp. These follow the CURRENT blue palette
  // (#3b82f6 / #172554), which intentionally diverges from the stale indigo
  // (#6366f1 / #1e1b4b) still in logo.svg — do not "fix" these back to the SVG.
  const lime = new THREE.Color(0xa3ff12);
  const cyan = new THREE.Color(0x06b6d4);
  const blue = new THREE.Color(0x3b82f6);
  const darkIndigo = new THREE.Color(0x172554);

  const pos = geo.attributes.position;
  if (pos === undefined) return;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i += 1) {
    const px = pos.getX(i) - ax[0];
    const py = pos.getY(i) - ax[1];
    const t = Math.max(0, Math.min(1, (px * adx + py * ady) / lenSq));

    if (t < 0.42) c.copy(lime).lerp(cyan, t / 0.42);
    else if (t < 0.72) c.copy(cyan).lerp(blue, (t - 0.42) / 0.30);
    else c.copy(blue).lerp(darkIndigo, (t - 0.72) / 0.28);

    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * The dashed inner ring hexagon (SVG coords). MUST stay in sync with the dashed
 * ring drawn in `signetEngravingTexture.ts` — the gray frame's inner edge runs
 * exactly along this line, so both share the same hexagon.
 */
const DASHED_INNER: Array<[number, number]> = [
  sv(180, 65), sv(246, 104), sv(246, 215), sv(180, 285), sv(114, 215), sv(114, 104),
];

/**
 * Beveled frame ("Schrank") around the Z. The dashed inner line (DASHED_INNER)
 * is the frame's OUTER edge, and the band lies just INSIDE it (toward the Z) —
 * built from the same sv() coords the engraving uses, so the dashed line runs
 * exactly along the frame's outer edge all the way round.
 */
function buildZFrameShape(): THREE.Shape {
  const [cx, cy] = centroid(DASHED_INNER);
  const inner = DASHED_INNER.map(([x, y]): [number, number] => [
    cx + (x - cx) * 0.8, cy + (y - cy) * 0.8,
  ]);
  const shape = shapeFrom(DASHED_INNER);
  const hole = new THREE.Path();
  inner.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)));
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

export default function SignetMesh3D() {
  const groupRef = useRef<THREE.Group>(null);
  const zMeshRef = useRef<THREE.Mesh>(null);
  const rim1MeshRef = useRef<THREE.Mesh>(null);
  const auraMeshRef = useRef<THREE.Mesh>(null);
  const auraGroupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const scrollRef = useRef(0);
  const rm = prefersReducedMotion();

  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  // --- Geometry ----------------------------------------------------------
  const hexGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(HEX_OUTER), {
      depth: 0.42, bevelEnabled: true,
      bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 12, curveSegments: 24,
    });
    geo.center();
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    // Paint shell facets — vertex colours after normals are computed.
    paintShellFacets(geo);
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

  const zGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shapeFrom(Z_PTS), {
      depth: 0.12, bevelEnabled: true,
      bevelThickness: 0.02, bevelSize: 0.016, bevelSegments: 8, curveSegments: 12,
    });
    geo.computeVertexNormals();
    paintZWithHighlights(geo);
    return geo;
  }, []);

  // --- New detail geometries --------------------------------------------

  /**
   * Engraving plane: sits co-planar with the front face at +0.008 (NOT 0.06).
   * Keeping it this close is intentional: a large z-offset would cause the
   * texture to visually slide across the face during the ±22° yaw sway
   * (parallax artefact). At 0.008, the plane essentially tracks the face
   * surface through the full sway arc.
   */
  const engraveGeo = useMemo(() =>
    new THREE.PlaneGeometry(2.089, 3.244),
  []);

  /**
   * Rim ring (pass 1) — HEX_OUTER shape with 0.965 scaled hole.
   * Vertex colours baked from the SVG rim-gradient.
   */
  const rim1Geo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildRimShape(0.965), {
      depth: 0.02, bevelEnabled: false, curveSegments: 6,
    });
    geo.computeVertexNormals();
    paintRimGradient(geo);
    return geo;
  }, []);

  /**
   * Beveled "Schrank" frame wrapping the Z on all sides. Replaces the old
   * top/bottom rhombus facets (mirrored about the shield centre, so they read
   * with different proportions top vs bottom). One ring, centred on the Z.
   */
  const frameRingGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(buildZFrameShape(), {
      depth: 0.012, bevelEnabled: true,
      bevelThickness: 0.014, bevelSize: 0.016, bevelSegments: 3, curveSegments: 6,
    });
    geo.computeVertexNormals();
    return geo;
  }, []);

  /** Aura sprite plane: 2.6 × 3.0 local units, behind the body. */
  const auraGeo = useMemo(() => new THREE.PlaneGeometry(2.6, 3.0), []);

  // --- Textures ---------------------------------------------------------
  const engraveTex = useMemo(() => buildEngravingTexture(maxAnisotropy), [maxAnisotropy]);
  const auraTex = useMemo(() => buildAuraTexture(), []);

  // --- Materials ---------------------------------------------------------
  /**
   * Hex shell: vertex colours paint the subtle side tints.
   * Setting color=white ensures the vertex colour IS the final colour (no
   * multiplier darkening trap). vertexColors:true + color:white is the correct
   * idiom so the obsidian base baked into each vertex reads accurately.
   */
  const hexMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    color: new THREE.Color(0xffffff),
    metalness: 0, roughness: 0.09,
    clearcoat: 1, clearcoatRoughness: 0.05,
    reflectivity: 0.7, envMapIntensity: 1.3, ior: 1.5,
    transmission: 0.16, thickness: 0.6, specularIntensity: 1,
    emissive: new THREE.Color(0x0a0e1a), emissiveIntensity: 0.35,
    iridescence: 0.3, iridescenceIOR: 1.35,
  }), []);

  /**
   * Panel: faint cyan emissive tint to match SVG rgba(6,182,212,0.06) inner-hex fill.
   * Kept very subtle — the panel reads dark, the tint just lifts it off pure black.
   */
  const panelMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x080b14, metalness: 0.1, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.4,
    emissive: new THREE.Color(0x061820), emissiveIntensity: 0.40,
  }), []);

  const zMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.22, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1,
    // Brand-lime emissive reinforces the hue and feeds bloom cleanly; kept low so
    // the vertex-colour gradient (lit form) drives the look, not a flat glow.
    emissive: new THREE.Color(0x6cc70d), emissiveIntensity: Z_EMISSIVE_BASE,
  }), []);

  const engraveMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: engraveTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }), [engraveTex]);

  /** Rim ring — single pass, animated shimmer opacity. */
  const rim1Mat = useMemo(() => new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    toneMapped: false,
  }), []);

  const frameRingMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x636b78, metalness: 0.2, roughness: 0.22,
    clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.3,
    transparent: true, opacity: 0.9,
  }), []);

  const auraMat = useMemo(() => new THREE.MeshBasicMaterial({
    map: auraTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    opacity: 0.85,
  }), [auraTex]);

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

  // --- Dispose (extended to cover all new resources) --------------------
  useEffect(() => {
    return () => {
      hexGeo.dispose(); panelGeo.dispose(); zGeo.dispose();
      engraveGeo.dispose(); rim1Geo.dispose();
      frameRingGeo.dispose(); auraGeo.dispose();
      hexMat.dispose(); panelMat.dispose(); zMat.dispose();
      engraveMat.dispose(); rim1Mat.dispose();
      frameRingMat.dispose(); auraMat.dispose();
      engraveTex.dispose(); auraTex.dispose();
    };
  }, [
    hexGeo, panelGeo, zGeo,
    engraveGeo, rim1Geo, frameRingGeo, auraGeo,
    hexMat, panelMat, zMat,
    engraveMat, rim1Mat, frameRingMat, auraMat,
    engraveTex, auraTex,
  ]);

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (group === null) return;
    if (rm) { group.rotation.set(0.04, 0.32, 0); return; }
    timeRef.current += dt;
    const t = timeRef.current;

    // Stay front-facing: gentle sway around the viewer, never edge-on. Keeps the Z legible.
    group.rotation.y = Math.sin(t * 0.32) * 0.38;
    group.rotation.x = Math.sin(t * 0.24) * 0.05 + scrollRef.current * 0.14;

    // Z emissive breathe — drives bloom. Reduced-motion-safe (gated above).
    const m = zMeshRef.current?.material;
    if (m instanceof THREE.MeshPhysicalMaterial) {
      m.emissiveIntensity = Z_EMISSIVE_BASE + Math.sin(t * 0.9) * Z_EMISSIVE_BREATHE;
    }

    // Rim shimmer (5 s period, matches SVG .signet-rim)
    const rim1Mesh = rim1MeshRef.current;
    if (rim1Mesh !== null && rim1Mesh.material instanceof THREE.MeshBasicMaterial) {
      rim1Mesh.material.opacity = 0.88 + 0.12 * Math.sin(t * ((2 * Math.PI) / 5));
    }

    // Aura breathe (7 s period, matches SVG .signet-aura)
    const auraGroup = auraGroupRef.current;
    const auraMesh = auraMeshRef.current;
    if (auraGroup !== null && auraMesh !== null && auraMesh.material instanceof THREE.MeshBasicMaterial) {
      const phase = t * ((2 * Math.PI) / 7);
      auraMesh.material.opacity = 0.75 + 0.20 * Math.sin(phase);
      const sc = 1.015 + 0.025 * Math.sin(phase);
      auraGroup.scale.set(sc, sc, sc);
    }
  });

  return (
    <>
      {/* Brand-coloured IBL: streak reflections sweep the obsidian clearcoat as it turns. */}
      <Environment background={false} resolution={256}>
        <color attach="background" args={['#05050a']} />
        <Lightformer intensity={3.2} color="#ffffff" position={[0, 3, 2]} scale={[7, 2, 1]} />
        {/* Mirror of the top key below, so the lower half (and the bottom bevel
            facet) is lit the same as the crown — symmetric upper/lower reading. */}
        <Lightformer intensity={3.2} color="#ffffff" position={[0, -3, 2]} scale={[7, 2, 1]} />
        <Lightformer intensity={3} color="#ffffff" position={[-2, 4, 3]} scale={[2, 0.4, 1]} />
        <Lightformer intensity={3} color="#a3ff12" position={[-5, 2, 1]} scale={[1, 4, 1]} />
        <Lightformer intensity={2} color="#06b6d4" position={[5, -2, 1]} scale={[1.5, 4, 1]} />
        <Lightformer intensity={2.4} color="#3b82f6" position={[1, -1, -4]} scale={[5, 5, 1]} />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 5]} intensity={1.4} color={0xffffff} />

      <group ref={groupRef} rotation={[0.04, 0.2, 0]}>
        {/*
          Plasma aura halo — Billboard so it always faces the camera regardless
          of the body's yaw. renderOrder={-1} keeps it behind the body.
          Inside the rotating group so it stays aligned with the signet position.
        */}
        <Billboard renderOrder={-1}>
          <group ref={auraGroupRef} position={[0, 0.13, -0.6]}>
            <mesh ref={auraMeshRef} geometry={auraGeo} material={auraMat} />
          </group>
        </Billboard>

        {/* Obsidian monolith body — vertex colours provide the left/right facet tints */}
        <mesh geometry={hexGeo} material={hexMat} />

        {/* Recessed-reading bezel panel. No bright lime inlay frame: the SVG's
            inner hex is only a faint outline, baked into the engraving texture. */}
        <group position={[0, yShift, 0]}>
          <mesh geometry={panelGeo} material={panelMat} position={[0, 0, frontZ - 0.06]} />
          {/* Beveled "Schrank" frame wrapping the Z — symmetric on all sides */}
          <mesh geometry={frameRingGeo} material={frameRingMat} position={[0, 0, frontZ - 0.005]} />

          {/* Z letterform, beveled and proud of the face */}
          <mesh ref={zMeshRef} geometry={zGeo} material={zMat} position={[0, 0, frontZ + 0.05]} />

          {/*
            Engraving detail plane — co-planar with the front face at +0.008.
            The tiny z-offset is intentional: a larger offset would make the
            engraving texture slide across the face during the ±22° sway (parallax).
            At 0.008 it stays essentially flush with the surface through the full arc.
          */}
          <mesh
            geometry={engraveGeo}
            material={engraveMat}
            position={[0, 0.011, frontZ + 0.022]}
          />

          {/* Glowing multi-colour rim — single pass, 5 s shimmer (matches SVG .signet-rim).
              A second overlapping pass was removed: at 0.001 z-apart it z-fought and
              shimmered ("flattern") on the sides/bottom at grazing angles. */}
          <mesh ref={rim1MeshRef} geometry={rim1Geo} material={rim1Mat} position={[0, 0, frontZ + 0.005]} />

        </group>
      </group>
    </>
  );
}

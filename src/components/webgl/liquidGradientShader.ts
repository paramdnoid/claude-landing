export const liquidGradientVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const liquidGradientFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform vec2  uResolution;
  // uImpulse.xy = NDC pointer position (-1..1), uImpulse.z = strength (0..1, decays on CPU)
  uniform vec3  uImpulse;

  varying vec2 vUv;

  // Plasma palette
  const vec3 LIME   = vec3(0.639, 1.000, 0.071);   // #a3ff12
  const vec3 CYAN   = vec3(0.024, 0.714, 0.831);   // #06b6d4
  const vec3 INDIGO = vec3(0.388, 0.400, 0.945);   // #6366f1
  const vec3 DEEP   = vec3(0.078, 0.071, 0.196);   // #14122e
  const vec3 BG     = vec3(0.020, 0.020, 0.027);   // #050507

  // Hash + simplex-ish noise (Inigo Quilez)
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(
      dot(a, hash2(i)),
      dot(b, hash2(i + o)),
      dot(c, hash2(i + 1.0))
    );
    return dot(n, vec3(70.0));
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + 100.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uResolution.x / uResolution.y;

    // mouse parallax
    vec2 m = uMouse * 0.35;

    float t = uTime * 0.12;
    float s = uScroll;

    // pointer impulse ripple — decays via CPU-side uImpulse.z
    // Convert NDC impulse position to the same coordinate space as p
    vec2 impPos = vec2(uImpulse.x * 0.5 * (uResolution.x / uResolution.y), uImpulse.y * 0.5);
    float impDist = length(p - impPos);
    // Ripple envelope: narrow ring that expands (baked into strength falloff)
    float ripple = sin(impDist * 18.0 - uTime * 4.0) * exp(-impDist * 4.5) * uImpulse.z;

    // layered FBM domains — ripple perturbs the domain warp
    vec2 q = vec2(
      fbm(p * 1.6 + vec2(t, -t) + m + ripple * 0.28),
      fbm(p * 1.6 + vec2(-t * 0.7, t * 0.9) - m * 0.6 + ripple * 0.22)
    );

    vec2 r = vec2(
      fbm(p * 2.2 + q * 1.5 + vec2(1.7, 9.2) + t * 1.3),
      fbm(p * 2.2 + q * 1.5 + vec2(8.3, 2.8) - t * 1.1)
    );

    float f = fbm(p * 1.4 + r * 1.8 + ripple * 0.12);
    f = smoothstep(-0.6, 0.9, f);

    // build palette stops, shifted by scroll
    float stopA = clamp(f - 0.05 + s * 0.1, 0.0, 1.0);
    float stopB = clamp(f * 1.1 + 0.05 - s * 0.15, 0.0, 1.0);

    vec3 col = mix(INDIGO, CYAN, smoothstep(0.0, 0.55, stopA));
    col      = mix(col,    LIME,   smoothstep(0.55, 0.95, stopB));
    col      = mix(col,    DEEP,   smoothstep(0.0, 1.0, s) * 0.55);

    // hot core where r is brightest
    float core = smoothstep(0.6, 1.05, length(r));
    col += LIME * core * 0.25 * (1.0 - s);

    // impulse luminance flash near click point — subtle cyan/lime highlight
    float impGlow = exp(-impDist * 3.0) * uImpulse.z * 0.4;
    col = mix(col, col + CYAN * impGlow + LIME * impGlow * 0.4, 1.0);

    // vignette + scroll fade to bg
    float vig = smoothstep(1.05, 0.35, length(p));
    col = mix(BG, col, vig);
    col = mix(col, BG, s * s * 0.8);

    // film grain
    float grain = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.025;

    gl_FragColor = vec4(col, 1.0);
  }
`;

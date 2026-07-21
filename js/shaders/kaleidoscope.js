// Port of Unity "Unlit/KaleiName" (KaleiName.shader) to three.js.
// Animation constants are baked from KaleiName.mat.
// uTime maps to Unity's _Time.y (seconds).
import * as THREE from "three";

const TEXTURES = [
  { label: "My Name", url: "assets/textures/VictorName2.png" },
  { label: "My Face", url: "assets/textures/portrait2.jpg" },
];

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uTex;
uniform float uTime;        // Unity _Time.y, always running (drives the HSV color cycle)
uniform float uFracTime;    // fractal clock: frozen while in interactive mode
uniform float uInteractive; // 0 = auto anim, 1 = mouse-driven (smoothed in JS)
uniform vec2  uMouse;       // smoothed mouse in [-1, 1], canvas-relative

varying vec2 vUv;

const float PI = 3.14159265;

// Values from KaleiName.mat
const int   ITERATIONS    = 3;    // _Iterations (3.2 cast to int)
const float FRACTAL_TIME  = 0.0;  // _FractalTime
const float FRAC_OFFSET   = 0.15; // _FracOffset
const float ROT_MULT      = 0.39; // _RotMult
const float INTENSITY     = 0.72; // _Intensity
const float ANIM_DURATION = 4.0;  // _AnimDuration
const float FRACTAL_SPEED = 5.0;  // _FractalSpeed
// _NoRepeat = 1 (hardcoded in the final check)

// HLSL smoothstep accepts reversed edges; GLSL leaves that undefined, so make it explicit
float sstep(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec3 map(vec2 pos) {
  vec3 col = vec3(0.0);
  if (abs(pos.y) < 1.0)
    col = texture2D(uTex, pos).rgb;
  return col;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 rot(vec2 uv, float a) {
  return vec2(uv.x * cos(a) - uv.y * sin(a), uv.y * cos(a) + uv.x * sin(a));
}

// Same folding as Unity's Fractalize, but angle and offset are computed by the
// caller so the mouse can drive them directly in interactive mode.
vec2 fractalize(vec2 uv, float angle, float offset) {
  for (int i = 0; i < ITERATIONS; i++) {
    uv = abs(uv) - offset;
    uv = rot(uv, angle);
  }
  return uv;
}

void main() {
  // Remap UV from [0, 1] to [-1, 1]
  vec2 uv = vUv * 2.0 - 1.0;
  float animProgress01 = mod(uFracTime, ANIM_DURATION) / ANIM_DURATION;

  float fracFac = sstep(0.5, 0.35, animProgress01);
  float fracFac2 = sstep(0.85, 1.0, animProgress01);
  fracFac = max(fracFac, fracFac2);
  // Click: force full kaleidoscope
  fracFac = mix(fracFac, 1.0, uInteractive);

  float iTime = FRACTAL_TIME + FRACTAL_SPEED * uFracTime + 0.6 * sin(animProgress01 * PI * 10.0);

  // Auto values (original shader) blended with mouse-driven values.
  // Mouse controls angle/offset directly instead of the time multipliers,
  // otherwise the accumulated iTime would make them explode.
  float osc = sin(iTime * 0.5);
  osc *= osc;
  float angle  = iTime * ROT_MULT + uMouse.x * PI * uInteractive;
  float offset = mix(FRAC_OFFSET * osc, -0.05 + 0.45 * (uMouse.y * 0.5 + 0.5), uInteractive);

  vec2 fracUV = fractalize(uv, angle, offset);
  float factFactorSpace = clamp(length(uv) + fracFac + 1.5, 0.0, 1.0);
  uv = mix(uv, fracUV, factFactorSpace * fracFac);

  uv += 0.5;

  vec3 texCol = map(uv);

  vec3 col = vec3(texCol.r);

  vec3 c1 = hsv2rgb(vec3(uTime * 0.1,       0.8, 1.0));
  vec3 c2 = hsv2rgb(vec3(uTime * 0.1 + 0.7, 0.8, 1.0));

  float intensityBoost = 1.0 + min(sstep(0.45, 0.5, animProgress01), sstep(0.65, 0.5, animProgress01)) * 2.0;

  col += texCol.g * texCol.g * texCol.g * c1 * INTENSITY * intensityBoost;
  col += texCol.b * texCol.b * texCol.b * c2 * INTENSITY * intensityBoost;

  // _NoRepeat
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)
    col = vec3(0.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

async function init() {
  const canvas = document.getElementById("hero-canvas");
  const buttonsEl = document.getElementById("texture-buttons");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(
    TEXTURES.map(async (entry) => {
      const tex = await loader.loadAsync(entry.url);
      // Match Unity import settings (clamp) and gamma-space sampling
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.colorSpace = THREE.NoColorSpace;
      return tex;
    })
  );

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTex: { value: textures[0] },
      uTime: { value: 0 },
      uFracTime: { value: 0 },
      uInteractive: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    },
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  TEXTURES.forEach((entry, i) => {
    const btn = document.createElement("button");
    btn.className = "text-btn" + (i === 0 ? " active" : "");
    btn.textContent = entry.label;
    btn.addEventListener("click", () => {
      material.uniforms.uTex.value = textures[i];
      buttonsEl.querySelectorAll(".text-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    buttonsEl.appendChild(btn);
  });

  function resize() {
    const size = canvas.clientWidth;
    renderer.setSize(size, size, false);
  }
  window.addEventListener("resize", resize);
  resize();

  /* ---------------- Interaction ----------------
     Click toggles interactive mode: the fractal clock freezes (auto anim
     stops where it is) and the smoothed mouse drives rotation and fold
     offset. Click again to resume the auto animation seamlessly. */

  let interactive = false;
  const mouseTarget = { x: 0, y: 0 };
  const mouseSmooth = { x: 0, y: 0 };
  let fracClock = 0;
  let lastT = 0;

  canvas.addEventListener("pointerdown", () => {
    interactive = !interactive;
    canvas.classList.toggle("interactive", interactive);
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseTarget.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  });

  renderer.setAnimationLoop((t) => {
    const time = t / 1000;
    const dt = Math.min(time - lastT, 0.1);
    lastT = time;

    const u = material.uniforms;

    // Exponential smoothing for mode blend and mouse
    const kMode = 1 - Math.exp(-dt * 5);
    const kMouse = 1 - Math.exp(-dt * 7);
    u.uInteractive.value += ((interactive ? 1 : 0) - u.uInteractive.value) * kMode;
    mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * kMouse;
    mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * kMouse;
    u.uMouse.value.set(mouseSmooth.x, mouseSmooth.y);

    // The fractal clock only advances in auto mode (freezes gradually on click)
    fracClock += dt * (1 - u.uInteractive.value);

    u.uTime.value = time;
    u.uFracTime.value = fracClock;
    renderer.render(scene, camera);
  });
}

init();

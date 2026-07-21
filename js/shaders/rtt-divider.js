// Port of Unity "Unlit/KaleiNameLinear" (KaleiName_Linear.shader) to WebGL.
// Animation constants are baked from KaleiName_linear.mat.
// uTime maps to Unity's _Time.y (seconds).
//
// The shader is rendered once per frame into a single shared offscreen RTT,
// then blitted onto every <canvas class="rtt-divider"> on the page.
// _Ratio is driven by the HTML aspect ratio of the divider element.
(function () {
  const TEX_URL = "assets/textures/VictorName_linear.png";
  const MAX_RTT_WIDTH = 2048;

  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

  const FRAG = `
precision highp float;

uniform sampler2D uTex;
uniform float uTime;  // Unity _Time.y
uniform float uRatio; // _Ratio, driven by the HTML element aspect ratio

varying vec2 vUv;

const float PI = 3.14159265;

// Values from KaleiName_linear.mat
const int   ITERATIONS     = 4;    // _Iterations (4.2 cast to int)
const float FRACTAL_TIME   = 0.0;  // _FractalTime
const float FRAC_OFFSET_X  = 0.39; // _FracOffsetX
const float FRAC_OFFSET_Y  = 0.0;  // _FracOffsetY
const float ROT_MULT       = 0.0;  // _RotMult
const float FRACTAL_SPEED  = 1.05; // _FractalSpeed
const float INTENSITY      = 0.72; // _Intensity
const float ANIM_DURATION  = 4.0;  // _AnimDuration
const float SCALE_Y        = 0.15; // _ScaleY
const float SCROLL_X_SPEED = 0.1;  // _ScrollXSpeed

// Matches the html background (--bg: #0A0A0C) so the divider blends into the page
const vec3 BG_COLOR = vec3(10.0 / 255.0, 10.0 / 255.0, 12.0 / 255.0);

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

vec2 pingpong(vec2 t) {
  return 1.0 - abs(fract(t) * 2.0 - 1.0);
}

vec2 fractalize(vec2 uv, float iTime) {
  uv = pingpong(uv);

  for (int i = 0; i < ITERATIONS; i++) {
    uv = abs(uv) - vec2(FRAC_OFFSET_X, FRAC_OFFSET_Y);
    uv = rot(uv, sin(iTime) * ROT_MULT);
  }
  return uv;
}

void main() {
  // Remap UV from [0, 1] to [-1, 1]
  vec2 uv = vUv * 2.0 - 1.0;
  float animProgress01 = mod(uTime, ANIM_DURATION) / ANIM_DURATION;

  vec2 uv_original = uv;

  uv *= vec2(SCALE_Y * uRatio, SCALE_Y);

  uv = fractalize(uv, FRACTAL_TIME + FRACTAL_SPEED * uTime);

  uv.y /= 1.0 - abs(uv_original.x);

  float scroll = (uTime + 0.7 * sin(animProgress01 * PI * 2.0));
  vec3 texCol = map(uv + 0.5 + vec2(scroll * SCROLL_X_SPEED, 0.0));

  vec3 col = vec3(texCol.r);

  vec3 c1 = hsv2rgb(vec3(uTime * 0.1,       0.8, 1.0));
  vec3 c2 = hsv2rgb(vec3(uTime * 0.1 + 0.7, 0.8, 1.0));

  float intensityBoost = 1.0 + min(sstep(0.45, 0.5, animProgress01), sstep(0.65, 0.5, animProgress01)) * 2.0;

  float middleBoost = 1.0 - abs(uv_original.x);
  middleBoost *= middleBoost;

  col += texCol.g * texCol.g * texCol.g * c1 * INTENSITY * intensityBoost * middleBoost;
  col += texCol.b * texCol.b * texCol.b * c2 * INTENSITY * intensityBoost * middleBoost;

  if (abs(uv.y) > 0.4)
    col = BG_COLOR;

  // Also lift pure-black texture areas to the page background color
  col = max(col, BG_COLOR);

  gl_FragColor = vec4(col, 1.0);
}
`;

  /* ---------------- Shared RTT ---------------- */

  let rtt = null; // { canvas, gl, uTime, uRatio, texReady }

  function compile(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createRtt() {
    const canvas = document.createElement("canvas");
    // WebGL2 for NPOT texture + REPEAT wrap (source is 1024x350)
    const gl = canvas.getContext("webgl2", { antialias: true });
    if (!gl) return null;

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const state = {
      canvas,
      gl,
      uTime: gl.getUniformLocation(program, "uTime"),
      uRatio: gl.getUniformLocation(program, "uRatio"),
      texReady: false,
    };

    // Full quality source texture, mipmapped, repeat wrap (matches Unity import)
    const texture = gl.createTexture();
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const ext = gl.getExtension("EXT_texture_filter_anisotropic");
      if (ext) {
        const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
      }
      state.texReady = true;
    };
    img.src = TEX_URL;

    return state;
  }

  /* ---------------- Divider canvases ---------------- */

  const dividers = new Map(); // canvas -> { ctx, visible }

  function initDivider(canvas) {
    if (dividers.has(canvas)) return;
    const ctx = canvas.getContext("2d");
    const entry = { ctx, visible: false };
    new IntersectionObserver((entries) => {
      entry.visible = entries[0].isIntersecting;
    }).observe(canvas);
    dividers.set(canvas, entry);
  }

  function initAll(root) {
    (root || document).querySelectorAll("canvas.rtt-divider").forEach(initDivider);
    if (!rtt) rtt = createRtt();
  }

  window.initRttDividers = initAll;
  document.addEventListener("DOMContentLoaded", () => initAll());

  /* ---------------- Render loop ---------------- */

  const start = performance.now();

  function frame() {
    requestAnimationFrame(frame);
    if (!rtt || !rtt.texReady) return;

    // Drop canvases removed from the DOM (e.g. works page re-render on filter)
    for (const canvas of dividers.keys()) {
      if (!canvas.isConnected) dividers.delete(canvas);
    }

    const visible = [...dividers.entries()].filter(
      ([canvas, entry]) => entry.visible && canvas.clientWidth > 0
    );
    if (!visible.length) return;

    // Render the shared RTT once, sized after the first visible divider
    const ref = visible[0][0];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(Math.round(ref.clientWidth * dpr), MAX_RTT_WIDTH);
    const h = Math.max(Math.round(w * (ref.clientHeight / ref.clientWidth)), 1);

    const { canvas, gl, uTime, uRatio } = rtt;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.uniform1f(uRatio, 0.5 * (ref.clientWidth / ref.clientHeight));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Reuse the RTT on every visible divider
    for (const [target, entry] of visible) {
      const tw = Math.round(target.clientWidth * dpr);
      const th = Math.round(target.clientHeight * dpr);
      if (target.width !== tw || target.height !== th) {
        target.width = tw;
        target.height = th;
      }
      entry.ctx.drawImage(canvas, 0, 0, tw, th);
    }
  }

  requestAnimationFrame(frame);
})();

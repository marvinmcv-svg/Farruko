// "CARRETERA 167" — a night drive down PR-167 in Bayamón, the road La 167 is named after.
// Album covers ride past as roadside billboards, traffic smears into light trails,
// and holding the pointer (or Space) floors it to 167 km/h.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const FUEL = new THREE.Color('#ff5b1a');
const FOG = new THREE.Color('#160905');
const ROAD_HALF = 7; // 4 lanes of 3.5
const CAM_X = 1.75; // right-hand inside lane

const mod = (a, n) => ((a % n) + n) % n;

/* ------------------------------------------------------------------ shaders */

const fogChunk = /* glsl */ `
  uniform vec3 uFogColor; uniform float uFogDensity;
  vec3 applyFog(vec3 c, float depth) {
    float f = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
    return mix(c, uFogColor, clamp(f, 0.0, 1.0));
  }`;

const roadMaterial = (uniforms) => new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `
    varying vec3 vW; varying float vDepth;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      vec4 mv = viewMatrix * w;
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uOffset; uniform vec3 uFuel; uniform float uSpeed;
    varying vec3 vW; varying float vDepth;
    ${fogChunk}
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float line(float x, float c, float w) { return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(x) * 1.5, abs(x - c)); }
    void main() {
      float x = vW.x;
      float z = vW.z - uOffset;
      // Asphalt: dark, slightly glossy, with grit.
      float grit = hash(floor(vec2(x, z) * 18.0)) * 0.012;
      vec3 col = vec3(0.028, 0.028, 0.032) + grit;
      // Wet sheen: warm reflection of the horizon down the middle of each lane.
      float sheen = pow(1.0 - abs(fract(x / 3.5) - 0.5) * 2.0, 3.0) * 0.06;
      col += uFuel * sheen * smoothstep(10.0, 140.0, vDepth);
      // Edge lines (white), double centre line (fuel), dashed lane lines.
      float edge = line(x, -${ROAD_HALF.toFixed(1)} + 0.25, 0.14) + line(x, ${ROAD_HALF.toFixed(1)} - 0.25, 0.14);
      float centre = line(x, -0.14, 0.1) + line(x, 0.14, 0.1);
      float dashOn = step(fract(z / 9.0), 0.45);
      float dash = (line(x, -3.5, 0.12) + line(x, 3.5, 0.12)) * dashOn;
      col = mix(col, vec3(0.75), clamp(edge + dash, 0.0, 1.0) * 0.8);
      col = mix(col, uFuel * 2.2, clamp(centre, 0.0, 1.0));
      // Shoulder beyond the lines.
      col *= mix(1.0, 0.45, smoothstep(${ROAD_HALF.toFixed(1)}, ${ROAD_HALF.toFixed(1)} + 0.4, abs(x)));
      gl_FragColor = vec4(applyFog(col, vDepth), 1.0);
    }`,
});

const skyMaterial = (uniforms) => new THREE.ShaderMaterial({
  uniforms,
  depthWrite: false,
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uFuel; uniform vec3 uFogColor; uniform float uTime; uniform float uDrift;
    varying vec2 vUv;
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
      float h = uv.y; // 0 bottom .. 1 top, horizon at ~0.32
      float hz = 0.32;
      // Sky: carbon black overhead, burning orange at the horizon.
      vec3 sky = mix(uFogColor * 1.6, vec3(0.012, 0.012, 0.018), smoothstep(hz, 0.95, h));
      float glow = exp(-abs(h - hz) * 9.0);
      sky += uFuel * glow * 0.55;
      // A big low "sun" ring behind the city — the 167 emblem's halo.
      vec2 c = vec2(0.5, hz + 0.06);
      vec2 d = (uv - c) * vec2(2.2, 1.0);
      float r = length(d);
      float disc = smoothstep(0.215, 0.205, r);
      // horizontal scan gaps in the disc, scrolling slowly
      float bands = step(0.35, fract((uv.y - uTime * 0.01) * 60.0 * (1.0 - (uv.y - hz) * 1.5)));
      float lower = smoothstep(hz + 0.12, hz - 0.02, uv.y);
      sky = mix(sky, mix(uFuel * 1.6, vec3(1.0, 0.75, 0.45) * 1.4, smoothstep(0.0, 0.2, uv.y - hz)), disc * mix(1.0, bands, lower) * 0.9);
      sky += uFuel * smoothstep(0.5, 0.2, r) * 0.18;
      // Skyline silhouette (Bayamón at night) with lit windows.
      float x = uv.x * 90.0 + uDrift;
      float id = floor(x);
      float bh = hz + 0.008 + pow(hash(id * 1.7), 3.0) * 0.12 + hash(id + 3.1) * 0.02;
      float x2 = uv.x * 37.0 + uDrift * 0.4;
      float bh2 = hz + 0.02 + pow(hash(floor(x2) * 2.3), 2.0) * 0.16;
      float back = step(h, bh2);
      float front = step(h, bh);
      sky = mix(sky, vec3(0.03, 0.018, 0.016), back * 0.85);
      sky = mix(sky, vec3(0.008, 0.008, 0.01), front);
      vec2 win = vec2(fract(x * 3.0), fract(h * 260.0));
      float lit = step(0.6, hash2(floor(vec2(x * 3.0, h * 260.0)))) * step(0.3, win.x) * step(0.4, win.y);
      sky += front * lit * step(h, bh - 0.004) * vec3(1.0, 0.62, 0.3) * 0.5;
      gl_FragColor = vec4(sky, 1.0);
    }`,
});

// Radial speed blur + chromatic split + vignette, all scaled by speed.
const SpeedShader = {
  uniforms: { tDiffuse: { value: null }, uSpeed: { value: 0 }, uTime: { value: 0 }, uFocus: { value: new THREE.Vector2(0.5, 0.45) } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uSpeed; uniform float uTime; uniform vec2 uFocus;
    varying vec2 vUv;
    float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
    void main() {
      vec2 dir = vUv - uFocus;
      float dist = length(dir);
      float s = uSpeed * uSpeed;
      vec3 acc = vec3(0.0);
      const int N = 10;
      for (int i = 0; i < N; i++) {
        float t = float(i) / float(N - 1);
        vec2 o = dir * t * 0.11 * s * dist;
        float ca = 0.006 + 0.02 * s;
        acc.r += texture2D(tDiffuse, vUv - o - dir * ca * dist).r;
        acc.g += texture2D(tDiffuse, vUv - o).g;
        acc.b += texture2D(tDiffuse, vUv - o + dir * ca * dist).b;
      }
      vec3 col = acc / float(N);
      float vig = smoothstep(1.05, 0.25, dist * (1.0 + s * 0.5));
      col *= mix(0.35, 1.0, vig);
      col += (rnd(vUv * 500.0) - 0.5) * 0.018;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* ------------------------------------------------------------------ textures */

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0d0d10'; g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = '#e7eaef'; g.lineWidth = 8; g.strokeRect(14, 14, 996, 228);
  // shield
  g.save(); g.translate(130, 128); g.scale(1.7, 1.7);
  g.beginPath(); g.moveTo(0, -52); g.bezierCurveTo(22, -42, 42, -46, 52, -38); g.bezierCurveTo(52, 8, 30, 36, 0, 52); g.bezierCurveTo(-30, 36, -52, 8, -52, -38); g.bezierCurveTo(-42, -46, -22, -42, 0, -52); g.closePath();
  g.fillStyle = '#ff5b1a'; g.fill(); g.restore();
  g.fillStyle = '#0d0d10'; g.font = '900 64px "Big Shoulders Display", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('167', 130, 132);
  g.fillStyle = '#f2f1ee'; g.textAlign = 'left';
  g.font = '900 108px "Big Shoulders Display", Impact, sans-serif';
  g.fillText('BAYAMÓN', 250, 110);
  g.font = '600 34px "JetBrains Mono", monospace'; g.fillStyle = '#ff8a3d';
  g.fillText('CVRBON VRMOR  ·  NEXT EXIT →', 254, 190);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ main */

export function initRoad(canvas, { albums, reduced = false, onPass, onHover } = {}) {
  const small = window.innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = FOG.clone();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
  camera.position.set(CAM_X, 1.35, 6);

  const fog = { uFogColor: { value: FOG }, uFogDensity: { value: 0.0105 } };
  const shared = { uOffset: { value: 0 }, uFuel: { value: FUEL }, uSpeed: { value: 0 }, uTime: { value: 0 }, ...fog };

  // Road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2 + 6, 340, 1, 1), roadMaterial(shared));
  road.rotation.x = -Math.PI / 2;
  road.position.z = -160; // spans +10 → -330, where the sky plane sits
  scene.add(road);

  // Sky / skyline backdrop — far away, follows the camera horizontally.
  const skyU = { uFuel: { value: FUEL }, uFogColor: { value: FOG }, uTime: { value: 0 }, uDrift: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(900, 300), skyMaterial(skyU));
  sky.position.set(CAM_X, 300 * 0.5 - 300 * 0.32 - 1, -330);
  scene.add(sky);

  const fogBasic = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, fog: true, ...opts });
  scene.fog = new THREE.FogExp2(FOG, 0.0105);

  const dummy = new THREE.Object3D();
  const glow = glowTexture();

  /* -------- street lights (both sides) */
  const LAMP_S = 18, LAMP_N = small ? 14 : 20, LAMP_L = LAMP_S * LAMP_N;
  const poleGeo = new THREE.BoxGeometry(0.14, 7.5, 0.14); poleGeo.translate(0, 3.75, 0);
  const armGeo = new THREE.BoxGeometry(2.4, 0.1, 0.1); armGeo.translate(-1.2, 7.4, 0);
  const headGeo = new THREE.BoxGeometry(0.9, 0.12, 0.35); headGeo.translate(-2.2, 7.32, 0);
  const poles = new THREE.InstancedMesh(poleGeo, fogBasic('#15161a'), LAMP_N * 2);
  const arms = new THREE.InstancedMesh(armGeo, fogBasic('#15161a'), LAMP_N * 2);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.3, 0.45), toneMapped: false }), LAMP_N * 2);
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(0.9, 0.42, 0.16), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), LAMP_N * 2);
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(0.32, 0.12, 0.04), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), LAMP_N * 2);
  scene.add(poles, arms, heads, halos, pools);

  /* -------- traffic light trails */
  const CARS = small ? 26 : 44;
  const trailGeo = new THREE.BoxGeometry(0.06, 0.06, 1); trailGeo.translate(0, 0, -0.5);
  const trails = new THREE.InstancedMesh(trailGeo, new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), CARS * 2);
  scene.add(trails);
  const cars = Array.from({ length: CARS }, (_, i) => {
    const oncoming = i % 5 < 3;
    const lane = oncoming ? (Math.random() < 0.5 ? -1.75 : -5.25) : (Math.random() < 0.7 ? 5.25 : 1.75);
    return {
      oncoming, lane,
      z: -Math.random() * 300,
      v: oncoming ? 30 + Math.random() * 25 : 12 + Math.random() * 16,
      color: oncoming ? new THREE.Color(1.7, 1.6, 1.45) : (Math.random() < 0.75 ? new THREE.Color(2.6, 0.12, 0.04) : new THREE.Color(2.6, 0.9, 0.12)),
    };
  });
  cars.forEach((c, i) => { trails.setColorAt(i * 2, c.color); trails.setColorAt(i * 2 + 1, c.color); });

  /* -------- speed streaks (dust / drizzle) */
  const STREAKS = small ? 120 : 240;
  const streakGeo = new THREE.BoxGeometry(0.012, 0.012, 1); streakGeo.translate(0, 0, -0.5);
  const streaks = new THREE.InstancedMesh(streakGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.0, 0.9), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), STREAKS);
  scene.add(streaks);
  const dust = Array.from({ length: STREAKS }, () => ({
    x: CAM_X + (Math.random() - 0.5) * 30, y: Math.random() * 9, z: -Math.random() * 120,
  }));

  /* -------- billboards (album covers) */
  const loader = new THREE.TextureLoader();
  const covers = albums.map((a) => {
    const t = loader.load(a.cover);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
  const BB_S = 34, BB_N = 9, BB_L = BB_S * BB_N;
  const frameGeo = new THREE.BoxGeometry(5.9, 5.9, 0.2);
  const panelGeo = new THREE.PlaneGeometry(5.5, 5.5);
  const legGeo = new THREE.BoxGeometry(0.22, 4.2, 0.22); legGeo.translate(0, -2.1, 0);
  const neon = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.85, 0.22), toneMapped: false });
  const legMat = fogBasic('#121317');
  let nextCover = 0;
  const boards = Array.from({ length: BB_N }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const g = new THREE.Group();
    const frame = new THREE.Mesh(frameGeo, neon);
    frame.position.z = -0.12;
    const mat = new THREE.MeshBasicMaterial({ map: covers[0], color: new THREE.Color(0.92, 0.92, 0.92), fog: true });
    const panel = new THREE.Mesh(panelGeo, mat);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 5.9), fogBasic('#08080a'));
    back.position.z = -0.23; back.rotation.y = Math.PI;
    const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-1.8, -2.95, -0.2);
    const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(1.8, -2.95, -0.2);
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(0.3, 0.1, 0.03), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    spill.position.z = -0.3;
    g.add(spill, frame, back, panel, legL, legR);
    g.position.set(side * (ROAD_HALF + 5.2), 7.1, 12 - mod(i * BB_S, BB_L));
    g.rotation.y = -side * 0.42;
    scene.add(g);
    const b = { g, mat, panel, side, index: i, album: null };
    assign(b);
    return b;
  });
  function assign(b) {
    b.album = albums[nextCover % albums.length];
    b.mat.map = covers[nextCover % albums.length];
    b.mat.needsUpdate = true;
    nextCover++;
  }

  /* -------- overhead gantry sign */
  const gantry = new THREE.Group();
  const gPostGeo = new THREE.BoxGeometry(0.35, 8.6, 0.35); gPostGeo.translate(0, 4.3, 0);
  const gPostL = new THREE.Mesh(gPostGeo, legMat); gPostL.position.x = -ROAD_HALF - 0.8;
  const gPostR = new THREE.Mesh(gPostGeo, legMat); gPostR.position.x = ROAD_HALF + 0.8;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF * 2 + 2, 0.3, 0.3), legMat); beam.position.y = 8.4;
  const signTex = signTexture();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 2.4), new THREE.MeshBasicMaterial({ map: signTex, color: new THREE.Color(1.15, 1.15, 1.15), fog: true }));
  sign.position.set(3.2, 7.0, 0.2);
  const signLight = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.06, 0.12), neon); signLight.position.set(3.2, 8.25, 0.3);
  gantry.add(gPostL, gPostR, beam, sign, signLight);
  scene.add(gantry);
  const GANTRY_L = 260;

  /* -------- post-processing */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.35, 0.95);
  composer.addPass(bloom);
  const speedPass = new ShaderPass(SpeedShader);
  composer.addPass(speedPass);
  composer.addPass(new OutputPass());

  /* -------- state + input */
  const state = {
    speed: reduced ? 0 : 0.5, target: 0.5, offset: 0, scroll: 0,
    mx: 0, my: 0, smx: 0, smy: 0, hold: false, running: true, visible: true,
  };
  const CRUISE = 0.5;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w / 2, h / 2);
    camera.aspect = w / h;
    // Keep the road filling narrow (portrait) screens.
    camera.userData.baseFov = camera.aspect < 0.8 ? 78 : 62;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hovered = null;

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    state.mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.my = ((e.clientY - r.top) / r.height) * 2 - 1;
    ndc.set(state.mx, -state.my);
  }

  /* -------- update loop */
  let last = performance.now();
  let lastPassed = null;
  let raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!state.visible) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt, now / 1000);
    composer.render();
  }

  function step(dt, t) {
    // Speed: ease toward the target; accelerating is slower than braking feels.
    const target = reduced ? 0 : (state.hold ? 1 : CRUISE) + state.scroll * 0.35;
    const rate = target > state.speed ? 0.9 : 1.8;
    state.speed += (Math.min(target, 1) - state.speed) * Math.min(1, dt * rate);
    const sp = state.speed;
    const units = sp * 95; // world units per second
    state.offset += units * dt;

    shared.uOffset.value = state.offset;
    shared.uSpeed.value = sp;
    shared.uTime.value = t;
    skyU.uTime.value = t;
    speedPass.uniforms.uSpeed.value = Math.max(0, (sp - 0.35) / 0.65);
    speedPass.uniforms.uTime.value = t % 10;

    // Camera: steer with the pointer, shake a little when flat out.
    state.smx += (state.mx - state.smx) * Math.min(1, dt * 2.5);
    state.smy += (state.my - state.smy) * Math.min(1, dt * 2.5);
    const shake = Math.max(0, sp - 0.7) * 0.05;
    camera.position.x = CAM_X + state.smx * 1.4 + Math.sin(t * 37) * shake;
    camera.position.y = 1.35 - state.smy * 0.35 + state.scroll * 5 + Math.sin(t * 41) * shake * 0.6;
    camera.fov = camera.userData.baseFov + sp * sp * 26;
    camera.updateProjectionMatrix();
    camera.lookAt(CAM_X + state.smx * 2.6, 1.6 - state.scroll * 4 - state.smy * 0.8, -60);
    camera.rotation.z += -state.smx * 0.035;
    skyU.uDrift.value = state.smx * 1.5;
    sky.position.x = camera.position.x;

    // Street lights
    for (let i = 0; i < LAMP_N; i++) {
      const z = 10 - mod(i * LAMP_S - state.offset, LAMP_L);
      for (let s = 0; s < 2; s++) {
        const side = s ? 1 : -1;
        const k = i * 2 + s;
        const x = side * (ROAD_HALF + 1.4);
        dummy.position.set(x, 0, z); dummy.rotation.set(0, side > 0 ? 0 : Math.PI, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        poles.setMatrixAt(k, dummy.matrix); arms.setMatrixAt(k, dummy.matrix); heads.setMatrixAt(k, dummy.matrix);
        dummy.position.set(x - side * 2.2, 7.25, z); dummy.rotation.set(0, 0, 0); dummy.lookAt(camera.position); dummy.updateMatrix();
        halos.setMatrixAt(k, dummy.matrix);
        dummy.position.set(x - side * 3.2, 0.02, z); dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.updateMatrix();
        pools.setMatrixAt(k, dummy.matrix);
      }
    }
    [poles, arms, heads, halos, pools].forEach((m) => { m.instanceMatrix.needsUpdate = true; });

    // Traffic — relative motion; trail length grows with closing speed.
    for (let i = 0; i < CARS; i++) {
      const c = cars[i];
      const rel = c.oncoming ? c.v + units : units - c.v;
      c.z += rel * dt;
      if (c.z > 14) { c.z -= 300 + Math.random() * 40; }
      if (c.z < -320) { c.z += 300; }
      const len = 0.6 + Math.abs(rel) * 0.09 * (0.5 + sp);
      for (let s = 0; s < 2; s++) {
        dummy.position.set(c.lane + (s ? 0.75 : -0.75), 0.62, c.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, len);
        dummy.updateMatrix();
        trails.setMatrixAt(i * 2 + s, dummy.matrix);
      }
    }
    trails.instanceMatrix.needsUpdate = true;

    // Streaks
    const sl = 0.2 + sp * sp * 9;
    for (let i = 0; i < STREAKS; i++) {
      const d = dust[i];
      d.z += units * 1.1 * dt;
      if (d.z > 8) { d.z -= 120; d.x = camera.position.x + (Math.random() - 0.5) * 30; d.y = Math.random() * 9; }
      dummy.position.set(d.x, d.y, d.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, sl); dummy.updateMatrix();
      streaks.setMatrixAt(i, dummy.matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
    streaks.material.opacity = 0.06 + sp * 0.28;

    // Billboards — recycle with the next cover once they pass the camera.
    let nearest = null, nearestZ = -Infinity;
    for (const b of boards) {
      const prevZ = b.g.position.z;
      const z = 12 - mod(b.index * BB_S - state.offset, BB_L);
      if (z < prevZ - 50) assign(b); // wrapped to the back
      b.g.position.z = z;
      if (z < -8 && z > -90 && z > nearestZ) { nearestZ = z; nearest = b; }
    }
    if (nearest && nearest.album !== lastPassed) { lastPassed = nearest.album; onPass?.(nearest.album, nearest.side); }

    gantry.position.z = 12 - mod(140 - state.offset, GANTRY_L);

    // Hover a billboard → cursor + click opens that record.
    if (!reduced && onHover) {
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(boards.map((b) => b.panel), false)[0];
      const b = hit ? boards.find((x) => x.panel === hit.object) : null;
      const album = b && hit.distance < 90 ? b.album : null;
      if (album !== hovered) { hovered = album; onHover(album); }
    }
  }

  // Render a still frame for reduced motion, otherwise loop.
  if (reduced) { step(0.016, 0); composer.render(); }
  else raf = requestAnimationFrame(frame);

  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting && !document.hidden; }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => { state.visible = !document.hidden; });

  return {
    state,
    setPointer,
    setHold(v) { state.hold = v && !reduced; },
    setScroll(p) { state.scroll = p; if (reduced) { step(0.016, 0); composer.render(); } },
    get kmh() { return Math.round(state.speed * 167); },
    get hovered() { return hovered; },
    dispose() { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); },
  };
}

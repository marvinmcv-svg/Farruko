import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* Procedural 2x2 twill carbon-fibre weave, drawn on a canvas. */
function carbonTexture() {
  const s = 512, cell = 32;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0b0d';
  g.fillRect(0, 0, s, s);
  for (let y = 0; y < s / cell; y++) {
    for (let x = 0; x < s / cell; x++) {
      const horiz = ((x + y) >> 1) % 2 === 0;
      const grad = horiz
        ? g.createLinearGradient(x * cell, y * cell, x * cell, y * cell + cell)
        : g.createLinearGradient(x * cell, y * cell, x * cell + cell, y * cell);
      grad.addColorStop(0, '#0c0c0f');
      grad.addColorStop(0.5, horiz ? '#2c2e34' : '#1d1e23');
      grad.addColorStop(1, '#0c0c0f');
      g.fillStyle = grad;
      g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Glowing "167" emblem for the shield face. */
function emblemTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.font = '900 230px "Big Shoulders Display", Impact, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ff5b1a';
  g.shadowColor = '#ff5b1a';
  g.shadowBlur = 30;
  g.fillText('167', 256, 280);
  g.font = '700 46px "JetBrains Mono", monospace';
  g.shadowBlur = 10;
  g.fillText('CVRBON · VRMOR', 256, 120);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shieldShape(scale = 1) {
  const s = new THREE.Shape();
  const w = 1.25 * scale, h = 1.55 * scale;
  s.moveTo(0, h);
  s.bezierCurveTo(w * 0.45, h * 0.86, w * 0.8, h * 0.92, w, h * 0.78);
  s.bezierCurveTo(w * 1.02, h * 0.1, w * 0.72, -h * 0.55, 0, -h * 0.95);
  s.bezierCurveTo(-w * 0.72, -h * 0.55, -w * 1.02, h * 0.1, -w, h * 0.78);
  s.bezierCurveTo(-w * 0.8, h * 0.92, -w * 0.45, h * 0.86, 0, h);
  return s;
}

export function initHero(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const rig = new THREE.Group();
  scene.add(rig);

  // Shield body — carbon fibre with clearcoat.
  const carbon = carbonTexture();
  const bodyGeo = new THREE.ExtrudeGeometry(shieldShape(1), {
    depth: 0.28, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6, curveSegments: 48,
  });
  bodyGeo.center();
  // Remap UVs so the weave reads evenly across the face.
  const uv = bodyGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4, uv.getY(i) * 0.4);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshPhysicalMaterial({
      map: carbon, roughness: 0.38, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08, color: 0xffffff,
    }),
  );
  rig.add(body);

  // Chrome rim.
  const rimShape = shieldShape(1.09);
  rimShape.holes.push(new THREE.Path(shieldShape(1.0).getPoints(96).reverse()));
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 48,
  });
  rimGeo.center();
  const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0xe9edf2, metalness: 1, roughness: 0.14 }));
  rig.add(rim);

  // Emissive emblem on the face.
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.MeshBasicMaterial({ map: emblemTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  emblem.position.z = 0.27;
  rig.add(emblem);

  // Equalizer ring — bars orbiting the shield, pulsing to a synthetic 95 BPM groove.
  const BARS = 96;
  const barGeo = new THREE.BoxGeometry(0.035, 1, 0.035);
  barGeo.translate(0, 0.5, 0);
  const barMat = new THREE.MeshBasicMaterial({ color: 0xff5b1a, transparent: true, opacity: 0.85 });
  const bars = new THREE.InstancedMesh(barGeo, barMat, BARS);
  const ring = new THREE.Group();
  ring.add(bars);
  ring.rotation.set(0.32, 0, -0.18);
  scene.add(ring);
  const dummy = new THREE.Object3D();

  // Embers.
  const N = reduced ? 300 : 1400;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2.4 + Math.random() * 5;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 2] = Math.sin(a) * r - 2;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `
      attribute float seed; uniform float uTime; uniform float uPx; varying float vA;
      void main(){
        vec3 p = position;
        float t = uTime * (0.25 + seed * 0.5);
        p.y = mod(p.y + t + 4.5, 9.0) - 4.5;
        p.x += sin(t * 1.3 + seed * 20.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + seed * 4.0) * uPx * (6.0 / -mv.z);
        vA = smoothstep(4.5, 1.5, abs(p.y)) * (0.35 + seed * 0.65);
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        gl_FragColor = vec4(1.0, 0.42 + vA * 0.3, 0.12, a);
      }`,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // Lighting: hot orange key from below-left, cold chrome fill from top-right.
  const key = new THREE.PointLight(0xff5b1a, 40, 20);
  key.position.set(-3, -2, 3);
  scene.add(key);
  const fill = new THREE.PointLight(0x9fc4ff, 18, 20);
  fill.position.set(3, 3, 2);
  scene.add(fill);
  const sweep = new THREE.SpotLight(0xffffff, 60, 20, 0.35, 0.6);
  sweep.position.set(0, 4, 6);
  scene.add(sweep);

  // Interaction state.
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollP = 0;
  let visible = true;
  let baseX = 0, baseY = 0;
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the shield comfortably framed on portrait screens.
    camera.position.z = w / h < 0.8 ? 13 : 8.6;
    baseY = w / h < 0.8 ? -0.35 : 0;
    baseX = w / h > 1.2 ? 0.55 : 0;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const t0 = performance.now();
  const BPM = 95;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const beat = Math.pow(1 - ((t * BPM / 60) % 1), 4); // dembow-ish kick envelope

    rig.rotation.y = (reduced ? 0 : Math.sin(t * 0.4) * 0.35) + mouse.x * 0.6 + scrollP * Math.PI * 1.2;
    rig.rotation.x = mouse.y * 0.35 + Math.sin(t * 0.6) * 0.05;
    rig.position.y = baseY + Math.sin(t * 0.9) * 0.08 - scrollP * 1.5;
    rig.position.x = baseX;
    const s = 1 + beat * 0.02 - scrollP * 0.25;
    rig.scale.setScalar(s);

    ring.rotation.y = t * 0.25;
    ring.position.copy(rig.position);
    ring.scale.setScalar(rig.scale.x);
    for (let i = 0; i < BARS; i++) {
      const a = (i / BARS) * Math.PI * 2;
      const v = 0.08 + Math.abs(Math.sin(i * 0.7 + t * 2.2)) * 0.25 * (0.4 + beat) + Math.abs(Math.sin(i * 0.13 - t)) * 0.15;
      dummy.position.set(Math.cos(a) * 2.2, -v / 2, Math.sin(a) * 2.2);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(1, v, 1);
      dummy.updateMatrix();
      bars.setMatrixAt(i, dummy.matrix);
    }
    bars.instanceMatrix.needsUpdate = true;
    barMat.opacity = 0.55 + beat * 0.4;

    key.intensity = 30 + beat * 25;
    sweep.position.x = Math.sin(t * 0.7) * 5;
    pMat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  }
  frame();

  return {
    setScroll(p) { scrollP = p; },
  };
}

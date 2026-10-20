// Shared 3D engine: pixel-resolution rendering with toon shading, bloom and a
// dithered palette pass; first-person controller; billboards; particles;
// pixel-art hands overlay.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import content from '../content.js';
import { input } from '../core/input.js';
import { ui } from '../core/ui.js';
import { Interactor } from '../core/interact.js';
import { canvas, shade, light, mix, INK, outline } from '../core/sprites.js';
import { takePhoto } from '../core/photo.js';
import { state } from '../core/state.js';

export { THREE };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- shared renderer
let shared = null;
function getShared(stage) {
  if (shared) return shared;
  const c = document.createElement('canvas');
  c.className = 'hidden';
  stage.appendChild(c);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: c, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) {
    throw new Error(content.ui.webglError);
  }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const hands = document.createElement('canvas');
  hands.className = 'hidden';
  hands.style.pointerEvents = 'none';
  stage.appendChild(hands);
  shared = { renderer, canvas: c, hands, handsCtx: hands.getContext('2d') };
  return shared;
}

// 3-step toon ramp for crisp pixel-art shading
let ramp = null;
export function toonRamp() {
  if (ramp) return ramp;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  return ramp;
}
export function toon(color, opts = {}) {
  const { flatShading, ...rest } = opts; // toon has no flatShading: geometry normals decide
  return new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...rest });
}

// Canvas -> pixel texture (cached)
const texCache = new WeakMap();
export function pixelTex(c) {
  let t = texCache.get(c);
  if (!t) {
    t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(c, t);
  }
  return t;
}

// Billboard sprite of a pixel canvas, anchored at bottom center.
export function billboard(c, pxSize = 0.06, opts = {}) {
  const { centerY, ...mopts } = opts;
  const mat = new THREE.SpriteMaterial({ map: pixelTex(c), transparent: true, alphaTest: 0.5, fog: true, ...mopts });
  const s = new THREE.Sprite(mat);
  s.center.set(0.5, centerY ?? 0);
  s.scale.set(c.width * pxSize, c.height * pxSize, 1);
  s.userData.px = pxSize;
  s.setCanvas = (cv, flip = false) => {
    const t = pixelTex(cv);
    if (s.material.map !== t) { s.material.map = t; s.material.needsUpdate = true; }
    s.scale.set(cv.width * s.userData.px * (flip ? -1 : 1), cv.height * s.userData.px, 1);
  };
  return s;
}

// ---------------------------------------------------------------- post shader
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    levels: { value: 28.0 },
    tint: { value: new THREE.Color(1, 1, 1) },
    vignette: { value: 0.35 },
    vigColor: { value: new THREE.Color('#3b2350') },
    saturation: { value: 1.08 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float levels; uniform vec3 tint; uniform float vignette; uniform vec3 vigColor; uniform float saturation;
    varying vec2 vUv;
    float bayer4(vec2 p){ int x=int(mod(p.x,4.0)); int y=int(mod(p.y,4.0)); int i=x+y*4;
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for(int k=0;k<16;k++){ if(k==i) return m[k]/16.0; } return 0.0; }
    void main(){
      vec4 col = texture2D(tDiffuse, vUv);
      vec3 c = col.rgb * tint;
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(vec3(l), c, saturation);
      vec2 d = vUv - 0.5; float v = smoothstep(0.35, 0.9, length(d * vec2(1.1, 1.0)));
      c = mix(c, c * vigColor * 1.6, v * vignette);
      c += (bayer4(gl_FragCoord.xy) - 0.5) / levels;
      c = floor(c * levels + 0.5) / levels;
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// ---------------------------------------------------------------- sky dome
export function makeSky(stops, sunDir, opts = {}) {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      c0: { value: new THREE.Color(stops[0]) }, c1: { value: new THREE.Color(stops[1]) }, c2: { value: new THREE.Color(stops[2]) }, c3: { value: new THREE.Color(stops[3]) },
      sunDir: { value: sunDir.clone().normalize() }, sunCol: { value: new THREE.Color(opts.sun || '#fff0c0') }, sunSize: { value: opts.sunSize ?? 0.9985 }, glow: { value: opts.glow ?? 0.5 },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `
      uniform vec3 c0,c1,c2,c3,sunDir,sunCol; uniform float sunSize, glow; varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y, -0.2, 1.0);
        float t = clamp(1.0 - h * 1.6, 0.0, 1.0);
        vec3 c = t < 0.33 ? mix(c0, c1, t/0.33) : t < 0.66 ? mix(c1, c2, (t-0.33)/0.33) : mix(c2, c3, (t-0.66)/0.34);
        if (vDir.y < 0.0) c = c3;
        float s = dot(normalize(vDir), normalize(sunDir));
        c += sunCol * pow(max(s, 0.0), 12.0) * glow * 0.6;
        c += sunCol * pow(max(s, 0.0), 120.0) * glow;
        if (s > sunSize) c = mix(c, sunCol * 1.6, 0.9);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = -10; m.frustumCulled = false;
  m.setStops = (st) => { ['c0', 'c1', 'c2', 'c3'].forEach((k, i) => mat.uniforms[k].value.set(st[i])); };
  return m;
}

// ---------------------------------------------------------------- particles
export class Particles {
  constructor(n = 400, { size = 2, additive = false } = {}) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.life = new Float32Array(n); this.max = new Float32Array(n); this.kind = new Uint8Array(n); this.seed = new Float32Array(n);
    this.size = new Float32Array(n).fill(size); this.alpha = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { scale: { value: 1 } },
      vertexShader: 'attribute float psize; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, floor(min(psize * 2.5, psize * (1.0 + 2.0 / max(1.0, -mv.z))) * scale)); }',
      fragmentShader: 'varying vec3 vC; varying float vA; void main(){ if (vA < 0.02) discard; gl_FragColor = vec4(vC, vA); }',
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.geo = g;
  }
  emit(p, v, color, life = 3, { size, kind = 0 } = {}) {
    const i = this.i; this.i = (this.i + 1) % this.n;
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    const c = new THREE.Color(color); this.col.set([c.r, c.g, c.b], i * 3);
    this.life[i] = life; this.max[i] = life; this.kind[i] = kind; this.seed[i] = Math.random() * 10;
    if (size) this.size[i] = size;
    return i;
  }
  update(dt, t, wind = 0) {
    const { pos, vel, life, max, kind, seed, alpha } = this;
    for (let i = 0; i < this.n; i++) {
      if (life[i] <= 0) { alpha[i] = 0; continue; }
      life[i] -= dt;
      const k = kind[i];
      if (k === 1) { // petal flutter: air drag + a gentle fall toward a slow drift
        const drag = 1 - Math.min(1, dt * 0.25); vel[i * 3] *= drag; vel[i * 3 + 2] *= drag; vel[i * 3 + 1] = vel[i * 3 + 1] * drag - 0.55 * dt;
        vel[i * 3] += Math.sin(t * 2 + seed[i]) * dt * 0.8 + wind * dt; vel[i * 3 + 2] += Math.cos(t * 1.7 + seed[i]) * dt * 0.6;
      }
      if (k === 2) { vel[i * 3 + 1] -= 4 * dt; } // gravity
      if (k === 3) { vel[i * 3] = Math.sin(t * 0.7 + seed[i]) * 0.3; vel[i * 3 + 1] = Math.cos(t * 0.9 + seed[i] * 2) * 0.15; vel[i * 3 + 2] = Math.cos(t * 0.6 + seed[i]) * 0.3; } // firefly
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      const f = life[i] / max[i];
      let a = Math.min(1, f * 4, (1 - f) * 8);
      if (k === 3) a *= 0.4 + 0.6 * Math.max(0, Math.sin(t * 3 + seed[i] * 5));
      alpha[i] = a;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.alpha.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true; this.geo.attributes.psize.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- instanced grass/flowers
export function instancedBillboards(c, positions, { size = 0.06, wind = 1, fog = true, color = '#ffffff' } = {}) {
  const w = c.width * size, h = c.height * size;
  const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
  const g2 = g.clone(); g2.rotateY(Math.PI / 2);
  const geo = mergeGeos([g, g2]);
  const mat = new THREE.MeshBasicMaterial({ map: pixelTex(c), alphaTest: 0.5, side: THREE.DoubleSide, fog, color });
  const uniforms = { time: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.time = uniforms.time;
    sh.vertexShader = 'uniform float time;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ip = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
      float k = position.y / ${h.toFixed(3)};
      transformed.x += sin(time * 1.8 + ip.x * 0.4 + ip.z * 0.3) * 0.08 * k * k * ${wind.toFixed(2)};
      transformed.z += cos(time * 1.3 + ip.x * 0.3) * 0.05 * k * k * ${wind.toFixed(2)};`);
  };
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
  const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3();
  positions.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r ?? Math.random() * Math.PI);
    const sc = p.s ?? 1; s.set(sc, sc, sc);
    m.compose(new THREE.Vector3(p.x, p.y, p.z), q, s);
    mesh.setMatrixAt(i, m);
  });
  mesh.userData.uniforms = uniforms;
  return mesh;
}

export function mergeGeos(geos) {
  const pos = [], uv = [], nor = [], idx = []; let off = 0;
  for (const g of geos) {
    const p = g.attributes.position.array, u = g.attributes.uv.array, n = g.attributes.normal.array;
    pos.push(...p); uv.push(...u); nor.push(...n);
    const ix = g.index ? g.index.array : [...Array(p.length / 3).keys()];
    for (const i of ix) idx.push(i + off);
    off += p.length / 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}

// ---------------------------------------------------------------- hands
// Pixel-art hand sprites (right hand; the left is mirrored), outlined.
const handCache = new Map();
function handSprite(kind, skin, sleeve, cuff) {
  const key = kind + skin + sleeve + cuff;
  if (handCache.has(key)) return handCache.get(key);
  const [c, x] = canvas(24, 34);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const sk = skin, skS = shade(skin, 0.2), skL = light(skin, 0.35), sl = sleeve, slS = shade(sleeve, 0.18), cf = cuff;
  // sleeve
  P(4, 21, 15, 13, sl); P(15, 21, 4, 13, slS); P(5, 22, 2, 12, light(sl, 0.4));
  P(3, 19, 17, 3, cf); P(3, 19, 17, 1, light(cf, 0.3)); P(16, 20, 4, 2, shade(cf, 0.2));
  if (kind === 'open') {
    // palm-ish open hand with spread fingers
    P(5, 10, 13, 10, sk); P(6, 9, 11, 12, sk); P(15, 10, 3, 10, skS);
    P(5, 2, 3, 9, sk); P(9, 0, 3, 10, sk); P(13, 1, 3, 9, sk); P(17, 4, 3, 8, skS);
    P(5, 2, 1, 2, skL); P(9, 0, 1, 2, skL); P(13, 1, 1, 2, skL);
    P(1, 11, 4, 3, sk); P(0, 9, 3, 3, sk); P(0, 9, 1, 1, skL);
    P(8, 13, 7, 1, skS); P(7, 16, 6, 1, skS);
  } else {
    // relaxed back of hand, fingers curled forward
    P(5, 8, 13, 12, sk); P(6, 7, 11, 14, sk); P(15, 8, 3, 12, skS);
    P(5, 4, 3, 5, sk); P(8, 3, 3, 5, sk); P(11, 3, 3, 5, sk); P(14, 4, 3, 5, skS);
    P(5, 4, 3, 1, skL); P(8, 3, 3, 1, skL); P(11, 3, 3, 1, skL);
    P(8, 5, 1, 3, skS); P(11, 5, 1, 3, skS); P(14, 5, 1, 3, shade(skin, 0.3));
    P(2, 12, 4, 6, sk); P(2, 12, 1, 3, skL); P(3, 17, 3, 2, skS);
    P(7, 10, 2, 1, skL); P(10, 11, 2, 1, skL); P(6, 9, 1, 3, skL);
    P(9, 15, 1, 1, skS);
  }
  const o = outline(c, shade(skin, 0.7));
  handCache.set(key, o);
  return o;
}

// Draws Hazei's pixel hands into the overlay. pose: idle|walk|reach|flower|pet|rim|wave|camera|lantern|palm|none
export function drawHands(x, W, H, pose, t, { bob = 0, item, skin = content.hazeiLook.skin, sleeve = content.hazeiLook.top, cuff = content.hazeiLook.dress } = {}) {
  x.clearRect(0, 0, W, H);
  if (pose === 'none') return;
  const S = Math.max(1, Math.round(H / 100));
  const relaxed = handSprite('fist', skin, sleeve, cuff), open = handSprite('open', skin, sleeve, cuff);
  const draw = (img, cx, top, mirror = false, rot = 0) => {
    const w = img.width * S, h = img.height * S;
    x.save(); x.translate(Math.round(cx), Math.round(top));
    if (rot) x.rotate(rot);
    if (mirror) x.scale(-1, 1);
    x.drawImage(img, -w / 2, 0, w, h); x.restore();
  };
  const b = Math.round(bob * S * 0.6);
  const L = W * 0.2, R = W * 0.8;
  const low = H - 16 * S;
  switch (pose) {
    case 'walk': case 'idle': draw(relaxed, L, low + b, true, 0.12); draw(relaxed, R, low - b, false, -0.12); break;
    case 'reach': draw(relaxed, L, low + 4 * S, true, 0.12); draw(open, W * 0.62, H - 30 * S, false, -0.2); break;
    case 'pet': draw(relaxed, L, low + 4 * S, true, 0.12); draw(open, W * 0.55 + Math.sin(t * 7) * 4 * S, H - 26 * S, false, 0.15); break;
    case 'flower': {
      draw(relaxed, L, low + b, true, 0.12);
      const hx = R - 8 * S, hy = H - 26 * S - b;
      if (item) x.drawImage(item, Math.round(hx - item.width * S * 0.7), Math.round(hy - item.height * S + 6 * S), item.width * S * 1.4, item.height * S * 1.4);
      draw(relaxed, hx, hy, false, -0.25);
      break;
    }
    case 'rim': {
      const ry = H - 24 * S;
      x.fillStyle = '#6a4028'; x.fillRect(0, ry, W, 5 * S); x.fillStyle = '#b5794a'; x.fillRect(0, ry, W, 2 * S);
      for (let i = 0; i < W; i += 6 * S) { x.fillStyle = (i / (6 * S)) % 2 ? '#94603a' : '#b07a48'; x.fillRect(i, ry + 5 * S, 3 * S, H); x.fillStyle = (i / (6 * S)) % 2 ? '#b07a48' : '#94603a'; x.fillRect(i + 3 * S, ry + 5 * S, 3 * S, H); }
      x.fillStyle = 'rgba(40,20,30,.35)'; x.fillRect(0, ry + 5 * S, W, S);
      draw(relaxed, W * 0.28, ry - 8 * S, true, 0.5); draw(relaxed, W * 0.72, ry - 8 * S, false, -0.5);
      break;
    }
    case 'wave': draw(relaxed, L, low + 4 * S, true, 0.12); draw(open, R - 6 * S, H - 40 * S, false, Math.sin(t * 9) * 0.25); break;
    case 'lantern': draw(open, W * 0.38, H - 32 * S, true, 0.15); draw(open, W * 0.62, H - 32 * S, false, -0.15); break;
    case 'palm': {
      draw(relaxed, L, low + 4 * S, true, 0.12);
      draw(open, W * 0.58, H - 28 * S, false, -0.1);
      if (item) x.drawImage(item, Math.round(W * 0.58 - item.width * S), Math.round(H - 28 * S - item.height * S * 1.6), item.width * S * 2, item.height * S * 2);
      break;
    }
    case 'camera': {
      const cx = W / 2, cy = H - 26 * S;
      x.fillStyle = INK; x.fillRect(cx - 27 * S, cy - 15 * S, 54 * S, 32 * S);
      x.fillStyle = '#3a3346'; x.fillRect(cx - 26 * S, cy - 14 * S, 52 * S, 30 * S); x.fillStyle = '#f2ece2'; x.fillRect(cx - 26 * S, cy - 14 * S, 52 * S, 4 * S);
      x.fillStyle = '#1e1a28'; x.fillRect(cx - 10 * S, cy - 6 * S, 20 * S, 18 * S); x.fillStyle = '#7f9fdc'; x.fillRect(cx - 6 * S, cy - 2 * S, 8 * S, 6 * S);
      draw(relaxed, cx - 30 * S, cy - 2 * S, true, 0.6); draw(relaxed, cx + 30 * S, cy - 2 * S, false, -0.6);
      break;
    }
    default: draw(relaxed, L, low + b, true, 0.12); draw(relaxed, R, low - b, false, -0.12);
  }
}

// One of Hazei's fists at a point on the hands overlay, for poses driven from
// outside (holding the oars). (cx, cy) is where the fingers grip.
export function drawFist(x, H, cx, cy, mirror = false, rot = 0) {
  const S = Math.max(1, Math.round(H / 100));
  const img = handSprite('fist', content.hazeiLook.skin, content.hazeiLook.top, content.hazeiLook.dress);
  x.save(); x.translate(Math.round(cx), Math.round(cy)); if (rot) x.rotate(rot); if (mirror) x.scale(-1, 1);
  x.drawImage(img, (-img.width * S) / 2, -6 * S, img.width * S, img.height * S); x.restore();
}

// ---------------------------------------------------------------- world
export class World3D {
  constructor(game, opts = {}) {
    this.game = game; this.opts = opts; game.current = this; if (game.debug) game.THREE = THREE;
    const sh = getShared(game.stage);
    this.renderer = sh.renderer; this.canvas = sh.canvas; this.handsCanvas = sh.hands; this.hx = sh.handsCtx;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(opts.fov || 68, 16 / 9, 0.2, 1400);
    this.clock = 0; this.dead = false;
    this.interact = new Interactor();
    this.player = { pos: new THREE.Vector3(...(opts.start || [0, 0, 0])), yaw: opts.yaw || 0, pitch: opts.pitch || 0, vel: new THREE.Vector3(), eye: 1.5, speed: opts.speed || 3.4, walkT: 0 };
    this.mode = opts.mode || 'fp'; // fp | rail | look
    this.handPose = 'idle'; this.handItem = null;
    this.updaters = new Set();
    this.heightAt = opts.heightAt || (() => 0);
    this.walkable = opts.walkable || (() => true);
    this.lookTarget = null;
    this.fx = new Particles(900, { size: 2 });
    this.glow = new Particles(500, { size: 2, additive: true });
    this.scene.add(this.fx.points, this.glow.points);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), opts.bloom ?? 0.55, 0.5, opts.bloomThreshold ?? 0.72);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.onResize = () => this.resize();
    addEventListener('resize', this.onResize);
    this.resize();
    this.offTap = input.onTap((cx, cy) => this.opts.onTap?.(cx, cy));
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const cw = innerWidth, ch = innerHeight;
    const portrait = ch > cw * 1.1;
    let target = this.opts.res || (this.opts.hires === 'ultra' ? (portrait ? 1000 : 760) : this.opts.hires ? (portrait ? 540 : 400) : (portrait ? 300 : 216));
    if (this.qualityCap) target = Math.min(target, this.qualityCap);
    const physH = ch * dpr, physW = cw * dpr;
    let scale = Math.max(1, Math.round(physH / target));
    if (this.qualityCap && physH / scale > this.qualityCap) scale = Math.ceil(physH / this.qualityCap);
    const H = Math.ceil(physH / scale), W = Math.ceil(physW / scale);
    this.W = W; this.H = H; this.cssScale = scale / dpr;
    this.renderer.setSize(W, H, false);
    this.composer.setSize(W, H);
    this.bloom.resolution.set(W, H);
    for (const c of [this.canvas, this.handsCanvas]) {
      c.style.width = W * this.cssScale + 'px'; c.style.height = H * this.cssScale + 'px';
    }
    this.handsCanvas.width = W; this.handsCanvas.height = H;
    this.hx.imageSmoothingEnabled = false;
    this.camera.aspect = W / H; this.camera.updateProjectionMatrix();
    this.fx.mat.uniforms.scale.value = H / 216; this.glow.mat.uniforms.scale.value = H / 216;
  }

  toScreen(v) {
    const p = v.clone().project(this.camera);
    if (p.z > 1) return null;
    const ox = (innerWidth - this.W * this.cssScale) / 2, oy = (innerHeight - this.H * this.cssScale) / 2;
    return { x: ox + (p.x * 0.5 + 0.5) * this.W * this.cssScale, y: oy + (-p.y * 0.5 + 0.5) * this.H * this.cssScale };
  }

  setTime({ fog, fogNear = 20, fogFar = 140, ambient = '#ffffff', ambientI = 0.6, sun = '#ffffff', sunI = 1.2, sunPos = [40, 60, 20], hemiSky, hemiGround, hemiI = 0.4 }) {
    if (this.scene.fog) { this.scene.fog.color.set(fog); this.scene.fog.near = fogNear; this.scene.fog.far = fogFar; } else this.scene.fog = new THREE.Fog(fog, fogNear, fogFar);
    if (!this.amb) { this.amb = new THREE.AmbientLight(); this.sunL = new THREE.DirectionalLight(); this.hemi = new THREE.HemisphereLight(); this.scene.add(this.amb, this.sunL, this.hemi, this.sunL.target); }
    this.amb.color.set(ambient); this.amb.intensity = ambientI;
    this.sunL.color.set(sun); this.sunL.intensity = sunI; this.sunL.position.set(...sunPos);
    this.hemi.color.set(hemiSky || fog); this.hemi.groundColor.set(hemiGround || '#40304a'); this.hemi.intensity = hemiI;
  }

  add(obj) { this.scene.add(obj); return obj; }
  every(fn) { this.updaters.add(fn); return () => this.updaters.delete(fn); }
  say(text, pos, ms = 3000) { return ui.bubble(text, () => (this.dead ? null : this.toScreen(pos)), ms); }

  // Hazei's position on the ground
  get feet() { return this.player.pos; }

  start() {
    this.canvas.classList.remove('hidden');
    this.handsCanvas.classList.remove('hidden');
    this.game.view2d.show(false);
    input.setMode(this.opts.inputMode || (this.mode === 'fp' ? '3d' : 'none'), { action: this.opts.action !== false });
    this.done = new Promise((r) => { this._resolve = r; });
    this.last = performance.now();
    this.update(0.016); this.render();
    const loop = () => {
      if (this.dead) return;
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      // full speed while Hazei is looking at the game; only idle along when
      // the window is in the background
      if (this.game.focused === false && now - this.last < 250) return;
      const raw = (now - this.last) / 1000; const dt = Math.min(0.05, raw); this.last = now;
      if (this.game.paused) return;
      this.update(dt); this.render();
      if (this.game.focused !== false) this.adapt(raw);
    };
    this.raf = requestAnimationFrame(loop);
    return this.done;
  }

  finish(v) {
    if (this.dead) return;
    this.dead = true; cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.onResize);
    this.offTap?.(); this.interact.clear(); ui.prompt(null); ui.actions(null); ui.clearBubbles();
    this.opts.cleanup?.(this);
    this.hx.clearRect(0, 0, this.W, this.H);
    this.canvas.classList.add('hidden'); this.handsCanvas.classList.add('hidden');
    this.scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose?.()); });
    this.composer.dispose?.();
    this._resolve?.(v);
  }

  update(dt) {
    this.clock += dt;
    const P = this.player;
    // look
    const look = input.consumeLook();
    const sens = input.touch ? 0.0055 : 0.0042;
    if (this.mode !== 'rail') {
      P.yaw -= look.dx * sens; P.pitch -= look.dy * sens;
      if (!input.blocked) {
        if (input.keys.has('ArrowLeft') && this.mode === 'look') P.yaw += dt * 1.6;
        if (input.keys.has('ArrowRight') && this.mode === 'look') P.yaw -= dt * 1.6;
        if (input.keys.has('KeyQ')) P.yaw += dt * 1.8;
        if (input.keys.has('KeyR')) P.yaw -= dt * 1.8;
      }
      P.pitch = Math.max(this.opts.minPitch ?? -1.2, Math.min(this.opts.maxPitch ?? 1.2, P.pitch));
    }
    // move
    let moving = false;
    if (this.mode === 'fp' && !this.locked) {
      const f = input.moveY, s = input.moveX;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      let vx = (fx * f + rx * s), vz = (fz * f + rz * s);
      const m = Math.hypot(vx, vz);
      if (m > 1) { vx /= m; vz /= m; }
      const tvx = vx * P.speed, tvz = vz * P.speed;
      P.vel.x += (tvx - P.vel.x) * Math.min(1, dt * 8); P.vel.z += (tvz - P.vel.z) * Math.min(1, dt * 8);
      const nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.z * dt;
      if (this.walkable(nx, nz)) { P.pos.x = nx; P.pos.z = nz; }
      else if (this.walkable(nx, P.pos.z)) { P.pos.x = nx; P.vel.z *= 0.5; }
      else if (this.walkable(P.pos.x, nz)) { P.pos.z = nz; P.vel.x *= 0.5; }
      else { P.vel.x *= 0.2; P.vel.z *= 0.2; }
      const sp = Math.hypot(P.vel.x, P.vel.z);
      moving = sp > 0.4;
      if (moving) P.walkT += dt * sp * 2.2;
      const gy = this.heightAt(P.pos.x, P.pos.z);
      P.pos.y += (gy - P.pos.y) * Math.min(1, dt * 12);
    }
    this.moving = moving;
    // camera
    if (this.mode !== 'rail') {
      const bob = moving && !reduced ? Math.sin(P.walkT * 2) * 0.04 : 0;
      this.camera.position.set(P.pos.x, P.pos.y + P.eye + bob + (this.camOffsetY || 0), P.pos.z);
      const e = new THREE.Euler(P.pitch, P.yaw, (this.roll || 0), 'YXZ');
      this.camera.quaternion.setFromEuler(e);
    }
    // hands (drawn before updaters so they can paint overlays on top)
    const hp = this.handPose === 'idle' && moving ? 'walk' : this.handPose;
    drawHands(this.hx, this.W, this.H, this.hideHands ? 'none' : hp, this.clock, { bob: moving ? Math.sin(P.walkT * 2) * 3 : Math.sin(this.clock * 1.5) * 1, item: this.handItem });
    for (const fn of this.updaters) fn(dt, this.clock);
    this.opts.update?.(this, dt);
    this.fx.update(dt, this.clock, this.wind || 0.2);
    this.glow.update(dt, this.clock, 0);
    // interaction: horizontal distance + facing
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd);
    this.interact.update(dt, (it) => {
      if (it.always) return 0;
      const p = it.pos; if (!p) return Infinity;
      const dx = p.x - P.pos.x, dz = p.z - P.pos.z; const d = Math.hypot(dx, dz);
      const facing = d < 0.8 ? 1 : (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) || 1);
      return facing < 0.35 ? Infinity : d + (1 - facing) * 2;
    });
  }

  render() { this.composer.render(); }

  // Drop the internal resolution step by step if the device can't keep up.
  adapt(raw) {
    if (raw > 1) return; // tab switch
    this.realT = (this.realT || 0) + raw;
    this.fpsT = (this.fpsT || 0) + raw; this.fpsN = (this.fpsN || 0) + 1;
    if (this.fpsT < 2.5) return;
    const fps = this.fpsN / this.fpsT; this.fpsT = 0; this.fpsN = 0;
    if (this.realT < 3 || fps >= 24 || this.H <= 240) return; // only when it would really stutter
    this.qualityCap = Math.max(240, Math.round(this.H * 0.72));
    this.resize();
  }

  // the current view as a 2D canvas, without the hands overlay
  snap() {
    const prev = this.hideHands; this.hideHands = true;
    drawHands(this.hx, this.W, this.H, 'none', 0);
    this.render();
    const c = canvas(this.W, this.H)[0];
    c.getContext('2d').drawImage(this.canvas, 0, 0);
    this.hideHands = prev;
    return c;
  }

  async photo(caption, title) {
    await takePhoto(this.snap(), caption, title);
  }

  // Mino's Discord messages: once per visit of a map (not once per save), so
  // they show again when Hazei resumes or replays.
  toastOnce(key) { this.toasted = this.toasted || new Set(); if (this.toasted.has(key) || !content.toasts[key]) return; this.toasted.add(key); ui.toast(content.toasts[key]); }
}

// Simple low-poly helpers
let treeMat = null;
// A low-poly tree merged into a single mesh with vertex colours (one draw call).
export function lowTree(kind = 'round', h = 3, seed = 1) {
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const parts = [];
  const add = (geo, col, pos, rot, scl) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const m = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot || new THREE.Euler()), scl || new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    const c = new THREE.Color(col); const n = g.attributes.position.count; const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) { const k = 0.92 + r() * 0.16; for (let v = 0; v < 3; v++) arr.set([c.r * k, c.g * k, c.b * k], (i + v) * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    parts.push(g);
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const trunkCol = kind === 'cherry' ? '#5e3a30' : kind === 'pine' ? '#6a4430' : '#7a4a33';
  const tw = h / 3;
  add(new THREE.CylinderGeometry(0.11 * tw, 0.2 * tw, h * 0.6, 6), trunkCol, V(0, h * 0.3, 0));
  const pal = {
    round: [['#4f9a4f', '#5fae5a', '#6fbe5e', '#86cf6a'], '#a6dc7a'],
    golden: [['#d9943e', '#e9b45a', '#f2c46b', '#e08a4a'], '#ffe08a'],
    cherry: [['#e889a8', '#f4a1bb', '#f7b3c8', '#ffc8d8'], '#fff0f5'],
    pine: [['#2f6e4c', '#357a54', '#3e8a5f'], '#5aa878'],
  }[kind] || [['#5fae5a'], '#8fd36a'];
  const hue = r();
  const cols = pal[0];
  if (kind === 'pine') {
    for (let i = 0; i < 4; i++) add(new THREE.ConeGeometry(h * (0.4 - i * 0.08), h * 0.38, 7), cols[i % cols.length], V(0, h * (0.42 + i * 0.17), 0), new THREE.Euler(0, r() * 3, 0));
    add(new THREE.ConeGeometry(h * 0.06, h * 0.12, 5), pal[1], V(0, h * 1.12, 0));
  } else {
    if (kind === 'cherry') for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.05 * tw, 0.09 * tw, h * 0.4, 5), trunkCol, V(s * h * 0.12, h * 0.62, 0), new THREE.Euler(0, 0, -s * 0.7));
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r();
      const ring = i === 0 ? 0 : h * (0.18 + r() * 0.12);
      const s = h * (i === 0 ? 0.36 : 0.2 + r() * 0.1);
      const y = h * (i === 0 ? 0.78 : 0.62 + r() * 0.3);
      const col = cols[Math.floor((i + hue * 4)) % cols.length];
      add(new THREE.IcosahedronGeometry(s, 1), col, V(Math.cos(a) * ring, y, Math.sin(a) * ring), new THREE.Euler(r() * 3, r() * 3, r() * 3), V(1, 0.82 + r() * 0.2, 1));
    }
    for (let i = 0; i < 4; i++) { const a = r() * Math.PI * 2; add(new THREE.IcosahedronGeometry(h * 0.09, 0), pal[1], V(Math.cos(a) * h * 0.22, h * (0.88 + r() * 0.15), Math.sin(a) * h * 0.22)); }
  }
  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  if (!treeMat) treeMat = toon('#ffffff', { vertexColors: true });
  const mesh = new THREE.Mesh(geo, treeMat);
  const g = new THREE.Group(); g.add(mesh);
  g.userData.sway = r() * 6;
  return g;
}

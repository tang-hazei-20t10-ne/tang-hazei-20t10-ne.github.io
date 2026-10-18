// The mountain behind the school, with the city glittering below.
// Shared by chapter 8 (walk), chapter 9 (balloon) and chapter 10 (summit at night).
import { THREE, toon, lowTree, instancedBillboards, pixelTex } from './engine3d.js';
import { canvas, flowerSprite, FLOWER_TYPES } from '../core/sprites.js';

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));

export const PLAIN = -16;
export const SPOTS = {
  spawn: new THREE.Vector3(0, 0, 52),
  meadow: new THREE.Vector3(2, 0, 26),
  blanket: new THREE.Vector3(11, 0, 31),
  grove: new THREE.Vector3(-25, 0, 6),
  lake: new THREE.Vector3(20, 0, 4),
  boat: new THREE.Vector3(16.5, 0, 7),
  hill: new THREE.Vector3(-8, 0, -30),
  telescope: new THREE.Vector3(-6, 0, -25),
  swing: new THREE.Vector3(-14, 0, -24),
  lighthouse: new THREE.Vector3(30, 0, -22), // the lookout tower
  balloon: new THREE.Vector3(2, 0, -6),
  school: new THREE.Vector3(0, 0, 78),
  city: new THREE.Vector3(60, PLAIN, 190),
};

const POND = { x: 20, z: 4, r: 6.5, dip: 5 };
function baseHeight(x, z) {
  let h = 30 * gauss(x, z, -8, -30, 34) + 7 * gauss(x, z, 0, 22, 28) + 7 * gauss(x, z, 30, -22, 13) + 1.2;
  h += 0.6 * Math.sin(x * 0.15 + 1) * Math.cos(z * 0.13) + 0.35 * Math.sin(x * 0.37 + z * 0.21);
  const m = gauss(x, z, 2, 26, 13); // meadow plateau
  h = h * (1 - m * 0.6) + 8.5 * m * 0.6;
  const R = Math.hypot(x * 0.92, z - 6);
  const edge = sstep(60, 100, R);
  return h * (1 - edge * 0.7) + (PLAIN - h * 0.3) * edge;
}
export const pondLevel = () => baseHeight(POND.x, POND.z) - 1.6;
export function mountainHeight(x, z) { return baseHeight(x, z) - POND.dip * gauss(x, z, POND.x, POND.z, POND.r); }
export function mountainWalkable(x, z) {
  if (Math.hypot(x * 0.92, z - 6) > 57) return false;
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r && mountainHeight(x, z) < pondLevel() + 0.25) return false;
  return true;
}

function terrainMesh() {
  const size = 280, seg = 112;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, mountainHeight(pos.getX(i), pos.getZ(i)));
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const cols = new Float32Array(p.count * 3); const c = new THREE.Color();
  const grass = new THREE.Color('#6fc464'), grass2 = new THREE.Color('#9fd46a'), deep = new THREE.Color('#3f9a72'), rock = new THREE.Color('#b8a08a'), path = new THREE.Color('#d9c08a');
  const fields = ['#8fbf5a', '#b5c95a', '#7fb06a', '#d4c46a', '#6aa86a'].map((h) => new THREE.Color(h));
  for (let f = 0; f < p.count; f += 3) {
    const x = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, z = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const y = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3;
    const ny = (n.getY(f) + n.getY(f + 1) + n.getY(f + 2)) / 3;
    const nz = Math.sin(x * 1.7 + z * 2.3) * 0.5 + 0.5;
    if (y < PLAIN + 2.5) c.copy(fields[(Math.floor(x / 14) * 7 + Math.floor(z / 14) * 3 + 100) % fields.length]);
    else c.copy(grass).lerp(grass2, nz * 0.6).lerp(deep, sstep(14, 28, y) * 0.5);
    if (ny < 0.8 && y > PLAIN + 3) c.lerp(rock, sstep(0.8, 0.6, ny));
    // a winding dirt path from the school gate up toward the summit
    const pathX = Math.sin(z * 0.08) * 7 + (z < 0 ? (z * 0.15) : 0);
    if (Math.abs(x - pathX) < 1.4 && z > -26 && z < 56 && y > PLAIN + 3) c.lerp(path, 0.75);
    c.multiplyScalar(0.94 + nz * 0.08);
    for (let v = 0; v < 3; v++) cols.set([c.r, c.g, c.b], (f + v) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return new THREE.Mesh(g, toon('#ffffff', { vertexColors: true }));
}

export function waterMesh(colors = { deep: '#3f7fb0', shallow: '#7fd0d0', sparkle: '#fff2c8', fog: '#f5b07a' }, size = 20) {
  const geo = new THREE.CircleGeometry(size, 24).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color(colors.deep) }, shallow: { value: new THREE.Color(colors.shallow) }, sparkle: { value: new THREE.Color(colors.sparkle) }, fogC: { value: new THREE.Color(colors.fog) }, fogFar: { value: colors.fogFar || 400 }, sun: { value: new THREE.Vector3(-0.8, 0.2, -0.5).normalize() } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time, fogFar; uniform vec3 deep, shallow, sparkle, fogC, sun; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){
        vec2 p = vW.xz; float d = length(cameraPosition - vW);
        vec3 c = mix(deep, shallow, 0.5 + 0.5 * sin(p.x * 0.05));
        vec2 g = floor(p * 1.2);
        float w = sin(g.x * 0.35 + time * 1.2 + sin(g.y * 0.6) * 1.5) * sin(g.y * 0.5 - time * 0.9);
        c = mix(c, c * 1.18, step(0.82, w));
        vec3 v = normalize(vW - cameraPosition); vec3 rf = reflect(v, vec3(0.0, 1.0, 0.0));
        float s = pow(max(dot(rf, sun), 0.0), 60.0);
        c += sparkle * s * 1.6 * step(0.55, hash(g + floor(time * 3.0)));
        c = mix(c, fogC, smoothstep(60.0, fogFar, d));
        gl_FragColor = vec4(c, 0.92);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.userData.uniforms = mat.uniforms;
  return m;
}

function tuftCanvas(cols) {
  const [c, x] = canvas(8, 12);
  const blade = (bx, h, col, lean) => { x.fillStyle = col; for (let j = 0; j < h; j++) x.fillRect(bx + Math.round(lean * j / h), 11 - j, 1, 1); };
  blade(1, 7, cols[0], -1); blade(3, 10, cols[1], 0); blade(4, 8, cols[2], 1); blade(6, 6, cols[0], 1); blade(2, 5, cols[2], 0);
  return c;
}

// Wooden lookout tower with a little roof.
export function lookoutTower() {
  const g = new THREE.Group();
  const wood = toon('#9a6a48'), dark = toon('#6a4430'), roofM = toon('#c4587a');
  for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), wood); leg.position.set(x, 4.5, z); g.add(leg); }
  for (let y = 2; y < 9; y += 2.5) { for (const r of [0, Math.PI / 2]) { const brace = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.15, 0.15), dark); brace.position.set(0, y, 0); brace.rotation.y = r; const b2 = brace.clone(); brace.position.z = 1.4; b2.position.z = -1.4; if (r) { brace.position.set(1.4, y, 0); b2.position.set(-1.4, y, 0); } g.add(brace, b2); } }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 3.8), wood); deck.position.y = 9; g.add(deck);
  for (const [x, z, w, d] of [[0, 1.85, 3.8, 0.1], [0, -1.85, 3.8, 0.1], [1.85, 0, 0.1, 3.8], [-1.85, 0, 0.1, 3.8]]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), dark); rail.position.set(x, 10, z); g.add(rail); }
  for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), dark); post.position.set(x, 10.5, z); g.add(post); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), roofM); roof.position.y = 12.6; roof.rotation.y = Math.PI / 4; g.add(roof);
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.12), dark); ladder.position.set(0, 4.5, 1.9); ladder.rotation.x = -0.12; g.add(ladder);
  return g;
}

export function balloonMesh(colors = ['#f08fa8', '#fff3e0', '#f6c45f', '#7f9fdc']) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(3.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.78).toNonIndexed();
  const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const a = Math.atan2((pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3, (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3);
    c.set(colors[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % colors.length]);
    for (let v = 0; v < 3; v++) col.set([c.r, c.g, c.b], (i + v) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0) { const k = 1 + y / 3.6 * 0.45; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); } }
  geo.computeVertexNormals();
  const env = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true })); env.position.y = 7.2; g.add(env);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), toon('#a8703f')); basket.position.y = 0.5; g.add(basket);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), toon('#7a4a33')); rim.position.y = 1.05; g.add(rim);
  const ropeMat = new THREE.LineBasicMaterial({ color: '#5a4030' });
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 1.05, z), new THREE.Vector3(x * 2.4, 4.6, z * 2.4)]), ropeMat));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), new THREE.MeshBasicMaterial({ color: '#ffb84a' })); flame.position.y = 3.0; flame.visible = false; g.add(flame);
  const burner = new THREE.PointLight('#ffb060', 0, 12); burner.position.y = 3.2; g.add(burner);
  g.userData = { env, flame, burner };
  return g;
}

// ---------------------------------------------------------------- school
function windowTex(rows, cols, wall, win, lit = false, seed = 1) {
  const [c, x] = canvas(cols * 4, rows * 6);
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  x.fillStyle = lit ? '#000000' : wall; x.fillRect(0, 0, c.width, c.height);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (lit) { if (r() < 0.55) { x.fillStyle = ['#ffd27a', '#ffe9b0', '#ffb860', '#fff3d0'][Math.floor(r() * 4)]; x.fillRect(i * 4 + 1, j * 6 + 2, 2, 3); } }
    else { x.fillStyle = win; x.fillRect(i * 4 + 1, j * 6 + 2, 2, 3); }
  }
  const t = pixelTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function school() {
  const g = new THREE.Group();
  const wallMap = windowTex(3, 24, '#f6e6c8', '#6a8fb0');
  const body = new THREE.Mesh(new THREE.BoxGeometry(48, 12, 10), new THREE.MeshLambertMaterial({ map: wallMap })); body.position.y = 6; g.add(body);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(50, 1.2, 12), toon('#c4584a')); roof.position.y = 12.6; g.add(roof);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 17, 7), new THREE.MeshLambertMaterial({ map: windowTex(4, 6, '#f6e6c8', '#6a8fb0', false, 5) })); tower.position.set(0, 8.5, -1); g.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4, 4), toon('#c4584a')); towerRoof.position.set(0, 19, -1); towerRoof.rotation.y = Math.PI / 4; g.add(towerRoof);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), new THREE.MeshBasicMaterial({ color: '#fffaf0' })); clock.position.set(0, 14.5, -4.55); clock.rotation.y = Math.PI; g.add(clock);
  // schoolyard, fence with gate, flagpole
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(56, 16).rotateX(-Math.PI / 2), toon('#cdb795')); yard.position.set(0, 0.05, -12); g.add(yard);
  const fenceM = toon('#e8e2d8');
  for (let x = -27; x <= 27; x += 1.5) { if (Math.abs(x) < 2.5) continue; const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), fenceM); post.position.set(x, 0.7, -20); g.add(post); }
  for (const side of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(24.5, 0.12, 0.12), fenceM); rail.position.set(side * 15, 1.2, -20); g.add(rail); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 9, 6), toon('#c0c4cc')); pole.position.set(14, 4.5, -10); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), new THREE.MeshBasicMaterial({ color: '#e04848', side: THREE.DoubleSide })); flag.position.set(15, 8.2, -10); g.add(flag);
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.28, 5), new THREE.MeshBasicMaterial({ color: '#ffd23f', side: THREE.DoubleSide })); star.position.set(15, 8.2, -9.99); g.add(star);
  g.userData.flag = flag;
  return g;
}

// ---------------------------------------------------------------- city
export function city(rnd) {
  const g = new THREE.Group();
  const classes = [[6, 2], [12, 4], [22, 7], [36, 12]]; // height, floors(rows)
  const wallMap = windowTex(1, 3, '#ffffff', '#7a8aa8');
  const litMap = windowTex(4, 3, '#000', '#000', true, 9);
  const mats = [];
  const meshes = classes.map(([h, rows], k) => {
    const geo = new THREE.BoxGeometry(10, h, 10); geo.translate(0, h / 2, 0);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * rows);
    const mat = new THREE.MeshLambertMaterial({ map: wallMap, emissive: new THREE.Color('#ffc870'), emissiveMap: litMap, emissiveIntensity: 0.5 });
    mats.push(mat);
    return new THREE.InstancedMesh(geo, mat, 140);
  });
  const counts = [0, 0, 0, 0];
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); const pos = new THREE.Vector3();
  const tint = ['#f6e3cc', '#e8eef8', '#fde8e0', '#e8f0e0', '#f3dcc0', '#dfe4f2', '#fff1d6'];
  const lightPts = [];
  const river = (x, z) => Math.abs(z - (175 + x * 0.35)) < 9;
  for (let bx = -120; bx <= 250; bx += 14) for (let bz = 92; bz <= 320; bz += 14) {
    const inEast = bx > 70 && bz < 120;
    if (bz < 108 && bx < 70 && bx > -70) continue; // fields between school and city
    if (river(bx, bz)) continue;
    if (rnd() < 0.12) continue;
    const dc = Math.hypot(bx - 70, bz - 190);
    let k = dc < 50 ? (rnd() < 0.5 ? 3 : 2) : dc < 110 ? (rnd() < 0.5 ? 2 : 1) : (rnd() < 0.7 ? 0 : 1);
    if (inEast) k = Math.min(k, 1);
    if (counts[k] >= 140) continue;
    const s = 0.65 + rnd() * 0.35, hs = 0.8 + rnd() * 0.5;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
    m4.compose(pos.set(bx + (rnd() - 0.5) * 2, PLAIN, bz + (rnd() - 0.5) * 2), q, sc.set(s, hs, s));
    meshes[k].setMatrixAt(counts[k], m4); meshes[k].setColorAt(counts[k], new THREE.Color(tint[Math.floor(rnd() * tint.length)]));
    counts[k]++;
    // street lights at block corners
    lightPts.push(bx + 7, PLAIN + 0.8, bz + 7);
    if (rnd() < 0.5) lightPts.push(bx + 7, PLAIN + 0.8, bz);
  }
  meshes.forEach((m, k) => { m.count = counts[k]; m.instanceMatrix.needsUpdate = true; g.add(m); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lightPts, 3));
  const lights = new THREE.Points(lg, new THREE.PointsMaterial({ color: '#ffcf7a', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6 }));
  g.add(lights);
  // river
  const riverMesh = new THREE.Mesh(new THREE.PlaneGeometry(500, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#5a8ec0' }));
  riverMesh.rotation.y = -Math.atan(0.35); riverMesh.position.set(60, PLAIN + 0.05, 175 + 60 * 0.35); g.add(riverMesh);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 30), toon('#c4587a')); bridge.position.set(70, PLAIN + 1.2, 175 + 70 * 0.35); bridge.rotation.y = -Math.atan(0.35); g.add(bridge);
  // TV tower landmark with a blinking light
  const tv = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2, 60, 8), toon('#e8e2f0')); shaft.position.y = 30; tv.add(shaft);
  const pod = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), toon('#f08fa8')); pod.position.y = 46; tv.add(pod);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4a4a' })); beacon.position.y = 61; tv.add(beacon);
  tv.position.set(90, PLAIN, 205); g.add(tv);
  g.userData = { mats, lights, beacon };
  // night level 0..1: windows and street lights brighten
  g.userData.setNight = (k, t = 0) => {
    mats.forEach((m) => { m.emissiveIntensity = 0.35 + k * 1.4; m.color.setScalar(1 - k * 0.55); });
    lights.material.opacity = 0.3 + k * 0.7; lights.material.size = 2 + k * 1.5;
    beacon.visible = Math.floor(t * 1.2) % 2 === 0;
  };
  return g;
}

// Builds static mountain content into the world. Returns handles.
export function buildMountain(world) {
  const S = world.scene;
  S.add(terrainMesh());
  const far = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), toon('#86b05a')); far.position.y = PLAIN - 0.3; S.add(far);
  const H = mountainHeight;
  const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const at = (x, z) => new THREE.Vector3(x, H(x, z), z);

  // mountain pond
  const pond = waterMesh({ deep: '#4f8fc0', shallow: '#86d6cc', sparkle: '#fff2c8', fog: '#f3b27e' }, POND.r + 0.5);
  pond.position.set(POND.x, pondLevel(), POND.z); S.add(pond);
  world.every((dt, t) => { pond.userData.uniforms.time.value = t; });

  // grass tufts
  const tufts = [];
  for (let i = 0; i < 4600; i++) {
    const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120 + 6;
    if (Math.hypot(x * 0.92, z - 6) > 60) continue;
    const h = H(x, z); if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1) continue;
    tufts.push({ x, y: h, z, s: 0.7 + rnd() * 0.7 });
  }
  const tuft1 = instancedBillboards(tuftCanvas(['#6fa84a', '#8fc35a', '#a9d46a']), tufts.slice(0, tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  const tuft2 = instancedBillboards(tuftCanvas(['#7fb04f', '#9cc95f', '#c3d77a']), tufts.slice(tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  S.add(tuft1, tuft2);
  world.every((dt, t) => { tuft1.userData.uniforms.time.value = t; tuft2.userData.uniforms.time.value = t; });

  // decorative flowers
  const flowerMeshes = [];
  FLOWER_TYPES.forEach((ft, k) => {
    const list = [];
    for (let i = 0; i < 170; i++) {
      let x, z;
      if (rnd() < 0.6) { x = 2 + (rnd() - 0.5) * 34; z = 26 + (rnd() - 0.5) * 24; } else { x = (rnd() - 0.5) * 100; z = (rnd() - 0.5) * 100 + 6; }
      if (Math.hypot(x * 0.92, z - 6) > 58 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 1) continue;
      list.push({ x, y: H(x, z), z, s: 0.9 + rnd() * 0.4 });
    }
    const m = instancedBillboards(flowerSprite(ft.species, ft.colors[k % 2 ? 0 : ft.colors.length - 1]), list, { size: 0.04, color: '#fff4e4' });
    S.add(m); flowerMeshes.push(m);
  });
  world.every((dt, t) => flowerMeshes.forEach((m) => { m.userData.uniforms.time.value = t; }));

  // trees: cherry grove, scattered trees, a natural ring of trees at the edge
  const trees = [];
  const placeTree = (kind, x, z, h) => { const tr = lowTree(kind, h, Math.floor(rnd() * 1e6)); tr.position.copy(at(x, z)); tr.position.y -= 0.1; S.add(tr); trees.push(tr); return tr; };
  [[-22, 2], [-28, 8], [-31, 0], [-24, 12], [-19, 9], [-30, 15], [-17, 0], [-34, 6]].forEach(([x, z]) => placeTree('cherry', x, z, 4.2 + rnd() * 1.2));
  const clear = (x, z) => Math.hypot(x - SPOTS.meadow.x, z - SPOTS.meadow.z) < 12 || Math.hypot(x - POND.x, z - POND.z) < 10 || Math.hypot(x - SPOTS.balloon.x, z - SPOTS.balloon.z) < 8 || Math.hypot(x + 25, z - 6) < 12 || Math.hypot(x - 30, z + 22) < 6 || Math.hypot(x - SPOTS.hill.x, z - SPOTS.hill.z) < 9 || Math.hypot(x - SPOTS.spawn.x, z - SPOTS.spawn.z) < 7;
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2, r = 12 + rnd() * 38; const x = Math.cos(a) * r, z = Math.sin(a) * r + 6;
    if (clear(x, z)) continue;
    placeTree(rnd() < 0.3 ? 'pine' : rnd() < 0.3 ? 'golden' : 'round', x, z, 3 + rnd() * 2.5);
  }
  for (let i = 0; i < 70; i++) { // edge ring (soft boundary), with a gap toward the school gate
    const a = (i / 70) * Math.PI * 2 + rnd() * 0.05; if (Math.abs(Math.sin(a) - 1) < 0.02 && Math.cos(a) > -0.15 && Math.cos(a) < 0.15) continue;
    const r = 60 + rnd() * 4; const x = Math.cos(a) * r / 0.92, z = Math.sin(a) * r + 6;
    if (z > 55 && Math.abs(x) < 8) continue;
    placeTree(rnd() < 0.5 ? 'pine' : 'round', x, z, 4 + rnd() * 3);
  }
  const swingTree = placeTree('round', SPOTS.swing.x - 1.5, SPOTS.swing.z + 3.5, 6);
  world.every((dt, t) => trees.forEach((tr) => { tr.rotation.z = Math.sin(t * 0.9 + tr.userData.sway) * 0.015; }));

  // rocks
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, r = 20 + rnd() * 34; const x = Math.cos(a) * r, z = Math.sin(a) * r + 6;
    if (clear(x, z)) continue;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rnd() * 0.7, 0), toon(rnd() < 0.5 ? '#b8a894' : '#a0907e'));
    rock.position.copy(at(x, z)); rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); S.add(rock);
  }

  // school at the foot, city on the plain
  const sch = school(); sch.position.set(SPOTS.school.x, H(SPOTS.school.x, SPOTS.school.z - 18) - 0.3, SPOTS.school.z); S.add(sch);
  world.every((dt, t) => { sch.userData.flag.rotation.y = Math.sin(t * 2) * 0.2; });
  const cty = city(rnd); S.add(cty);

  // lookout tower
  const tower = lookoutTower(); tower.position.copy(at(SPOTS.lighthouse.x, SPOTS.lighthouse.z)); tower.position.y -= 0.2; tower.rotation.y = 0.5; S.add(tower);

  // telescope at the summit, pointed toward the city
  const tele = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 8), toon('#c9a24a')); tube.rotation.z = Math.PI / 2.6; tube.position.y = 1.25; tele.add(tube);
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 4), toon('#5a4030')); const a = i * 2.1; leg.position.set(Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.25); leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); tele.add(leg); }
  tele.position.copy(at(SPOTS.telescope.x, SPOTS.telescope.z));
  tele.rotation.y = Math.atan2(SPOTS.city.x - SPOTS.telescope.x, SPOTS.city.z - SPOTS.telescope.z) - Math.PI / 2; S.add(tele);

  // swing
  const swing = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), toon('#b5794a')); seat.position.y = 0.6; swing.add(seat);
  const ropeM = new THREE.LineBasicMaterial({ color: '#e8dcc0' });
  for (const x of [-0.45, 0.45]) swing.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.6, 0), new THREE.Vector3(x, 4.2, 0)]), ropeM));
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 5), toon('#7a4a33')); branch.rotation.z = Math.PI / 2; branch.position.y = 4.2; swing.add(branch);
  swing.position.copy(at(SPOTS.swing.x, SPOTS.swing.z)); S.add(swing);

  // picnic blanket
  const [bc, bx] = canvas(16, 16);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { bx.fillStyle = ((i >> 2) + (j >> 2)) % 2 ? '#f6efe4' : '#e66a7a'; bx.fillRect(i, j, 1, 1); }
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pixelTex(bc) }));
  blanket.position.copy(at(SPOTS.blanket.x, SPOTS.blanket.z)); blanket.position.y += 0.06; S.add(blanket);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), toon('#c98a54')); basket.position.copy(blanket.position).add(new THREE.Vector3(0.8, 0.18, -0.5)); S.add(basket);

  // boat on the pond
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), toon('#d9a066')); hull.position.y = 0.15; boat.add(hull);
  const hull2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 2.2), toon('#8a5a3a')); hull2.position.y = 0.36; boat.add(hull2);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 2.42), toon('#e05a7a')); stripe.position.y = 0.3; boat.add(stripe);
  boat.position.set(SPOTS.boat.x, pondLevel(), SPOTS.boat.z); boat.rotation.y = 0.6; S.add(boat);

  // balloon
  const balloon = balloonMesh(); balloon.position.copy(at(SPOTS.balloon.x, SPOTS.balloon.z)); S.add(balloon);
  world.every((dt, t) => { balloon.userData.env.position.y = 7.2 + Math.sin(t * 0.8) * 0.08; });

  return { trees, tower, lighthouse: tower, city: cty, school: sch, telescope: tele, swing, swingTree, blanket, boat, balloon, pond, at, rnd };
}

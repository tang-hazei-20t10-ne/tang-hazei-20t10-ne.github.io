// The mountain behind the school, with the city glittering below.
// Shared by chapter 8 (walk), chapter 9 (balloon) and chapter 10 (summit at night).
import { THREE, toon, lowTree, instancedBillboards, pixelTex, billboard } from './engine3d.js';
import { canvas, flowerSprite, FLOWER_TYPES, duckSprite, shade, light } from '../core/sprites.js';

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));

export const PLAIN = -16;
export const SPOTS = {
  spawn: new THREE.Vector3(0, 0, 53),
  meadow: new THREE.Vector3(2, 0, 26),
  blanket: new THREE.Vector3(10, 0, 31),
  grove: new THREE.Vector3(-23, 0, 6),
  lake: new THREE.Vector3(20, 0, 4),
  boat: new THREE.Vector3(15.6, 0, 8.2),
  pier: new THREE.Vector3(14.6, 0, 9.4),
  waterfall: new THREE.Vector3(20, 0, -3.2),
  hill: new THREE.Vector3(-7, 0, -27),
  deck: new THREE.Vector3(-7, 0, -27),
  telescope: new THREE.Vector3(-5.2, 0, -24.6),
  swing: new THREE.Vector3(-15, 0, -22),
  lighthouse: new THREE.Vector3(30, 0, -22), // the lookout tower
  balloon: new THREE.Vector3(-16, 0, -9),
  shrine: new THREE.Vector3(-27, 0, 12),
  school: new THREE.Vector3(0, 0, 80),
  city: new THREE.Vector3(60, PLAIN, 190),
  wheel: new THREE.Vector3(10, PLAIN, 150),
};

// Paths: polylines of [x, z]. Main path from the school gate to the summit plus branches.
export const PATHS = [
  [[0, 58], [1, 48], [3, 38], [3, 30], [1, 22], [0, 16], [-3, 8], [-4, 2], [-5, -6], [-6, -13], [-4, -19], [-1.5, -24], [-2.4, -27]],
  [[-4, 4], [-10, 5], [-16, 6], [-21, 7]], // grove
  [[0, 16], [6, 13], [11, 11], [14, 9.6]], // pond
  [[-5, -6], [3, -10], [12, -14], [20, -17], [27, -19]], // tower
  [[-4, -19], [-9, -20], [-13.5, -21]], // swing
];
export function pathDist(x, z) {
  let best = Infinity;
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) {
    const [ax, az] = p[i], [bx, bz] = p[i + 1];
    const dx = bx - ax, dz = bz - az; const L = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

const POND = { x: 20, z: 4, r: 6.5, dip: 5 };
const DECK = { x: -7, z: -27, r: 6.5 };
function rawHeight(x, z) {
  let h = 30 * gauss(x, z, -8, -30, 34) + 7 * gauss(x, z, 0, 22, 28) + 7 * gauss(x, z, 30, -22, 13) + 1.2;
  h += 0.6 * Math.sin(x * 0.15 + 1) * Math.cos(z * 0.13) + 0.35 * Math.sin(x * 0.37 + z * 0.21);
  h += 3.2 * gauss(x, z, 20, -5, 4.5); // rocky shelf behind the pond (waterfall)
  const m = gauss(x, z, 2, 26, 13);
  h = h * (1 - m * 0.6) + 8.5 * m * 0.6;
  return h;
}
const deckLevel = rawHeight(DECK.x, DECK.z) + 0.2;
const SCHOOL_PAD = { x: -13, z: 82, hw: 49, hd: 25 };
const SCHOOL_LEVEL = rawHeight(0, 57);
export const schoolLevel = () => SCHOOL_LEVEL;
function baseHeight(x, z) {
  let h = rawHeight(x, z);
  const d = Math.hypot(x - DECK.x, z - DECK.z);
  const f = 1 - sstep(DECK.r - 1, DECK.r + 5, d); // flatten the summit
  h = h * (1 - f) + deckLevel * f;
  const R = Math.hypot(x * 0.92, z - 6);
  const edge = sstep(60, 100, R);
  h = h * (1 - edge * 0.7) + (PLAIN - h * 0.3) * edge;
  // a flat terrace for the school, its yard and the football field
  const ox = Math.max(0, Math.abs(x - SCHOOL_PAD.x) - SCHOOL_PAD.hw), oz = Math.max(0, Math.abs(z - SCHOOL_PAD.z) - SCHOOL_PAD.hd);
  const sf = (1 - sstep(0, 12, ox)) * (1 - sstep(0, 12, oz));
  return h * (1 - sf) + SCHOOL_LEVEL * sf;
}
const POND_LEVEL = baseHeight(POND.x, POND.z) - 1.6;
export const pondLevel = () => POND_LEVEL;
export function mountainHeight(x, z) {
  let h = baseHeight(x, z) - POND.dip * gauss(x, z, POND.x, POND.z, POND.r);
  // a grassy bank around the pond so the water never floats above the ground
  const d = Math.hypot(x - POND.x, z - POND.z);
  if (d > 6.2 && d < 12) h = Math.max(h, POND_LEVEL + 0.25 - Math.max(0, d - 7.2) * 0.7);
  return h;
}
const DECK_TOP = deckLevel + 0.45;
export function inDeck(x, z) { return Math.abs(x - DECK.x) < 4.2 && Math.abs(z - DECK.z) < 4.2; }
// Height the player stands on (includes the summit deck and the pond pier).
export function surfaceHeight(x, z) {
  if (inDeck(x, z)) return DECK_TOP;
  return mountainHeight(x, z);
}
export function mountainWalkable(x, z) {
  if (Math.hypot(x * 0.92, z - 6) > 57) return false;
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r && mountainHeight(x, z) < pondLevel() + 0.25) return false;
  if (Math.hypot(x - SPOTS.waterfall.x, z - SPOTS.waterfall.z) < 2.2) return false;
  return true;
}

// ---------------------------------------------------------------- terrain
function terrainMesh() {
  const size = 280, seg = 140;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, mountainHeight(pos.getX(i), pos.getZ(i)));
  const g = geo.toNonIndexed(); g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const cols = new Float32Array(p.count * 3); const c = new THREE.Color();
  const grass = new THREE.Color('#72c866'), grass2 = new THREE.Color('#a4d86c'), deep = new THREE.Color('#3e9a6e'), rock = new THREE.Color('#b9a48e'), dirt = new THREE.Color('#d8bf8a');
  const pink = new THREE.Color('#f2b6c8'), mossy = new THREE.Color('#5fae68');
  const fields = ['#8fbf5a', '#b5c95a', '#7fb06a', '#d4c46a', '#6aa86a', '#c9b46a'].map((h) => new THREE.Color(h));
  for (let f = 0; f < p.count; f += 3) {
    const x = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, z = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const y = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3;
    const ny = (n.getY(f) + n.getY(f + 1) + n.getY(f + 2)) / 3;
    const nz = Math.sin(x * 1.7 + z * 2.3) * 0.5 + 0.5;
    const patch = Math.sin(x * 0.11 + Math.cos(z * 0.07) * 2) * Math.cos(z * 0.09 + x * 0.03);
    if (y < PLAIN + 2.5) c.copy(fields[(Math.floor(x / 14) * 7 + Math.floor(z / 14) * 3 + 100) % fields.length]);
    else {
      c.copy(grass).lerp(grass2, Math.max(0, patch) * 0.8 + nz * 0.15).lerp(deep, sstep(16, 30, y) * 0.45 + Math.max(0, -patch) * 0.25);
      if (Math.hypot(x - SPOTS.grove.x, z - SPOTS.grove.z) < 11) c.lerp(pink, 0.35 * (1 - Math.hypot(x - SPOTS.grove.x, z - SPOTS.grove.z) / 11) + nz * 0.1);
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 2.5) c.lerp(mossy, 0.5);
    }
    if (ny < 0.8 && y > PLAIN + 3) c.lerp(rock, sstep(0.82, 0.6, ny));
    const pd = pathDist(x, z);
    if (pd < 1.7 && y > PLAIN + 3) c.lerp(dirt, 0.85 * (1 - sstep(1.1, 1.7, pd)));
    c.multiplyScalar(0.95 + nz * 0.07);
    for (let v = 0; v < 3; v++) cols.set([c.r, c.g, c.b], (f + v) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return new THREE.Mesh(g, toon('#ffffff', { vertexColors: true }));
}

export function waterMesh(colors = { deep: '#3f7fb0', shallow: '#7fd0d0', sparkle: '#fff2c8', fog: '#f5b07a' }, size = 20, geo = null) {
  const g = geo || new THREE.CircleGeometry(size, 28).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color(colors.deep) }, shallow: { value: new THREE.Color(colors.shallow) }, sparkle: { value: new THREE.Color(colors.sparkle) }, fogC: { value: new THREE.Color(colors.fog) }, fogFar: { value: colors.fogFar || 500 }, sun: { value: new THREE.Vector3(-0.8, 0.2, -0.5).normalize() }, night: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time, fogFar, night; uniform vec3 deep, shallow, sparkle, fogC, sun; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){
        vec2 p = vW.xz; float d = length(cameraPosition - vW);
        vec3 c = mix(deep, shallow, 0.5 + 0.5 * sin(p.x * 0.05 + p.y * 0.03));
        vec2 g = floor(p * 1.2);
        float w = sin(g.x * 0.35 + time * 1.2 + sin(g.y * 0.6) * 1.5) * sin(g.y * 0.5 - time * 0.9);
        c = mix(c, c * 1.2, step(0.8, w));
        vec3 v = normalize(vW - cameraPosition); vec3 rf = reflect(v, vec3(0.0, 1.0, 0.0));
        float s = pow(max(dot(rf, sun), 0.0), 50.0);
        c += sparkle * s * 1.6 * step(0.55, hash(g + floor(time * 3.0)));
        c += vec3(1.0, 0.8, 0.45) * night * 0.35 * step(0.93, hash(g * 0.37 + floor(time * 2.0)));
        c = mix(c, fogC, smoothstep(60.0, fogFar, d));
        gl_FragColor = vec4(c, 0.93);
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.userData.uniforms = mat.uniforms;
  return m;
}

function tuftCanvas(cols, tall = false) {
  const [c, x] = canvas(8, tall ? 16 : 12);
  const H = c.height;
  const blade = (bx, h, col, lean) => { x.fillStyle = col; for (let j = 0; j < h; j++) x.fillRect(bx + Math.round(lean * j / h), H - 1 - j, 1, 1); };
  if (tall) { blade(1, 13, cols[0], -1); blade(3, 15, cols[1], 0); blade(5, 12, cols[2], 1); blade(6, 9, cols[0], 1); blade(2, 8, cols[2], 0); x.fillStyle = '#7a5a3a'; x.fillRect(3, 0, 1, 3); }
  else { blade(1, 7, cols[0], -1); blade(3, 10, cols[1], 0); blade(4, 8, cols[2], 1); blade(6, 6, cols[0], 1); blade(2, 5, cols[2], 0); }
  return c;
}
function fernCanvas() {
  const [c, x] = canvas(14, 10);
  for (let k = -3; k <= 3; k++) { const ang = k * 0.38; for (let r = 0; r < 7; r++) { x.fillStyle = r % 2 ? '#4f9a54' : '#6fbe62'; x.fillRect(Math.round(7 + Math.sin(ang) * r), Math.round(9 - Math.cos(ang) * r * 1.1), 1, 1); } }
  return c;
}
function mushroomCanvas() {
  const [c, x] = canvas(6, 6);
  x.fillStyle = '#f4efe6'; x.fillRect(2, 3, 2, 3);
  x.fillStyle = '#e04a4a'; x.fillRect(0, 1, 6, 2); x.fillRect(1, 0, 4, 1);
  x.fillStyle = '#fff'; x.fillRect(1, 1, 1, 1); x.fillRect(4, 2, 1, 1);
  return c;
}

// text board texture for signposts
function signTexture(text, col = '#d9a066') {
  const [c, x] = canvas(80, 16);
  x.fillStyle = shade(col, 0.35); x.fillRect(0, 0, 80, 16);
  x.fillStyle = col; x.fillRect(1, 1, 78, 14);
  x.fillStyle = light(col, 0.3); x.fillRect(1, 1, 78, 1);
  x.font = '14px VT323'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#4a2a1e'; x.fillText(text, 40, 8.5);
  return pixelTex(c);
}
function signpost(targets, at) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), toon('#7a4a33')); post.position.y = 1.2; g.add(post);
  targets.forEach(([label, tx, tz], i) => {
    const board = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ map: signTexture(label), side: THREE.DoubleSide });
    const plank = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.32), mat); plank.position.x = 0.85; board.add(plank);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 3), toon('#d9a066')); tip.rotation.z = -Math.PI / 2; tip.position.x = 1.75; board.add(tip);
    board.position.y = 2.05 - i * 0.42;
    board.rotation.y = Math.atan2(-(tz - at.z), tx - at.x);
    g.add(board);
  });
  return g;
}

function lampPost() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), toon('#6a4430')); pole.position.y = 0.75; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), toon('#6a4430')); arm.position.set(0.15, 1.45, 0); g.add(arm);
  const lan = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), new THREE.MeshBasicMaterial({ color: '#ffd48a' })); lan.position.set(0.32, 1.28, 0); g.add(lan);
  g.userData.lantern = lan;
  return g;
}

// Wooden lookout tower with a little roof.
export function lookoutTower() {
  const g = new THREE.Group();
  const wood = toon('#9a6a48'), dark = toon('#6a4430'), roofM = toon('#c4587a');
  for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), wood); leg.position.set(x, 4.5, z); g.add(leg); }
  for (let y = 2; y < 9; y += 2.5) for (const [x, z, rot] of [[0, 1.4, 0], [0, -1.4, 0], [1.4, 0, 1], [-1.4, 0, 1]]) { const brace = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.15, 0.15), dark); brace.position.set(x, y, z); if (rot) brace.rotation.y = Math.PI / 2; g.add(brace); }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 3.8), wood); deck.position.y = 9; g.add(deck);
  for (const [x, z, w, d] of [[0, 1.85, 3.8, 0.1], [0, -1.85, 3.8, 0.1], [1.85, 0, 0.1, 3.8], [-1.85, 0, 0.1, 3.8]]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), dark); rail.position.set(x, 10, z); g.add(rail); }
  for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 0.15), dark); post.position.set(x, 10.5, z); g.add(post); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), roofM); roof.position.y = 12.6; roof.rotation.y = Math.PI / 4; g.add(roof);
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.12), dark); ladder.position.set(0, 4.5, 1.9); ladder.rotation.x = -0.12; g.add(ladder);
  for (let y = 0.5; y < 9; y += 0.6) { const rung = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.16), wood); rung.position.set(0, y, 1.9 + (4.5 - y) * 0.12); g.add(rung); }
  // bunting flags around the roof
  const flagCols = ['#f08fa8', '#f6c45f', '#8fd3b6', '#7f9fdc'];
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 3), new THREE.MeshBasicMaterial({ color: flagCols[i % 4] })); f.rotation.x = Math.PI; f.position.set(Math.cos(a) * 2.1, 11.7, Math.sin(a) * 2.1); g.add(f); }
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
  g.userData = { env, flame, burner, basket, rim };
  return g;
}

// ---------------------------------------------------------------- school
function windowTex(rows, cols, wall, win, lit = false, seed = 1, palette) {
  const [c, x] = canvas(cols * 4, rows * 6);
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  x.fillStyle = lit ? '#000000' : wall; x.fillRect(0, 0, c.width, c.height);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if (lit) { if (r() < 0.6) { x.fillStyle = (palette || ['#ffd27a', '#ffe9b0', '#ffb860', '#fff3d0', '#ffd27a', '#bfe0ff'])[Math.floor(r() * (palette || [0, 0, 0, 0, 0, 0]).length)]; x.fillRect(i * 4 + 1, j * 6 + 2, 2, 3); } }
    else { x.fillStyle = win; x.fillRect(i * 4 + 1, j * 6 + 2, 2, 3); x.fillStyle = light(wall, 0.4); x.fillRect(i * 4, j * 6 + 5, 4, 1); }
  }
  const t = pixelTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function school() {
  const g = new THREE.Group();
  const wallMap = windowTex(3, 24, '#f6e6c8', '#6a8fb0');
  const body = new THREE.Mesh(new THREE.BoxGeometry(48, 12, 10), new THREE.MeshLambertMaterial({ map: wallMap })); body.position.y = 6; g.add(body);
  const mtri = new THREE.Shape([new THREE.Vector2(-6.2, 0), new THREE.Vector2(6.2, 0), new THREE.Vector2(0, 3.4)]); const mrg = new THREE.ExtrudeGeometry(mtri, { depth: 50, bevelEnabled: false }); mrg.translate(0, 0, -25); mrg.rotateY(Math.PI / 2); const roof = new THREE.Mesh(mrg, toon('#c4584a')); roof.position.y = 12; g.add(roof);
  for (const x of [-22, 22]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 22), new THREE.MeshLambertMaterial({ map: windowTex(2, 10, '#f6e6c8', '#6a8fb0', false, 3) })); wing.position.set(x, 4.5, 8); g.add(wing); const tri = new THREE.Shape([new THREE.Vector2(-4.8, 0), new THREE.Vector2(4.8, 0), new THREE.Vector2(0, 3)]); const rg = new THREE.ExtrudeGeometry(tri, { depth: 23, bevelEnabled: false }); rg.translate(0, 0, -11.5); const wr = new THREE.Mesh(rg, toon('#c4584a')); wr.position.set(x, 9, 8); g.add(wr); }
  const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 17, 7), new THREE.MeshLambertMaterial({ map: windowTex(4, 6, '#f6e6c8', '#6a8fb0', false, 5) })); tower.position.set(0, 8.5, -1); g.add(tower);
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4, 4), toon('#c4584a')); towerRoof.position.set(0, 19, -1); towerRoof.rotation.y = Math.PI / 4; g.add(towerRoof);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), new THREE.MeshBasicMaterial({ color: '#fffaf0' })); clock.position.set(0, 14.5, -4.55); clock.rotation.y = Math.PI; g.add(clock);
  const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: '#3a2633' })); hand.position.set(0, 14.8, -4.57); hand.rotation.y = Math.PI; g.add(hand);
  // yard, sports field, track
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(56, 18).rotateX(-Math.PI / 2), toon('#d8c49e')); yard.position.set(0, 0.05, -14); g.add(yard);
  const [fc, fx] = canvas(64, 32);
  fx.fillStyle = '#c4584a'; fx.fillRect(0, 0, 64, 32); fx.fillStyle = '#5fb35a'; fx.fillRect(4, 4, 56, 24);
  fx.fillStyle = '#ffffff'; fx.fillRect(4, 4, 56, 1); fx.fillRect(4, 27, 56, 1); fx.fillRect(4, 4, 1, 24); fx.fillRect(59, 4, 1, 24); fx.fillRect(32, 4, 1, 24);
  for (let a = 0; a < 40; a++) fx.fillRect(Math.round(32 + Math.cos(a / 40 * Math.PI * 2) * 5), Math.round(16 + Math.sin(a / 40 * Math.PI * 2) * 5), 1, 1);
  fx.fillRect(4, 11, 5, 1); fx.fillRect(4, 20, 5, 1); fx.fillRect(9, 11, 1, 10); fx.fillRect(55, 11, 5, 1); fx.fillRect(55, 20, 5, 1); fx.fillRect(54, 11, 1, 10);
  for (let i = 5; i < 60; i += 2) { fx.fillStyle = '#e8907a'; fx.fillRect(i, 1, 1, 1); fx.fillRect(i, 30, 1, 1); }
  const field = new THREE.Mesh(new THREE.PlaneGeometry(40, 20).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pixelTex(fc) })); field.position.set(-48, 0.06, 4); field.rotation.y = Math.PI / 2; g.add(field);
  for (const z of [-15, 15]) { const goal = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 0.15), toon('#ffffff')); goal.position.set(-48, 1, 4 + z); g.add(goal); }
  // basketball hoop
  const hp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.2), toon('#3a4a6a')); hp.position.set(20, 1.7, -14); g.add(hp);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.1), toon('#ffffff')); bb.position.set(20, 3.4, -13.8); g.add(bb);
  // fence + back gate arch
  const fenceM = toon('#e8e2d8');
  for (let x = -27; x <= 27; x += 1.5) { if (Math.abs(x) < 2.5) continue; const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), fenceM); post.position.set(x, 0.7, -23); g.add(post); }
  for (const side of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(24.5, 0.12, 0.12), fenceM); rail.position.set(side * 15, 1.2, -23); g.add(rail); }
  for (const x of [-2.4, 2.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.4), toon('#c4584a')); p.position.set(x, 1.6, -23); g.add(p); }
  const arch = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.7, 0.3), new THREE.MeshLambertMaterial({ map: signTexture('Cổng sau', '#f6c45f') })); arch.position.set(0, 3.2, -23); arch.rotation.y = Math.PI; g.add(arch);
  // flagpole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 9, 6), toon('#c0c4cc')); pole.position.set(14, 4.5, -10); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.3), new THREE.MeshBasicMaterial({ color: '#e04848', side: THREE.DoubleSide })); flag.position.set(15, 8.2, -10); g.add(flag);
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.28, 5), new THREE.MeshBasicMaterial({ color: '#ffd23f', side: THREE.DoubleSide })); star.position.set(15, 8.2, -9.99); g.add(star);
  // yard trees
  for (const [x, z] of [[-18, -16], [-10, -18], [10, -18], [26, -16], [-26, -10], [30, -6]]) { const t = lowTree('round', 4, Math.floor(x * 31 + z)); t.position.set(x, 0, z); g.add(t); }
  g.userData.flag = flag;
  return g;
}

// ---------------------------------------------------------------- city
function glassTex(lit = false, seed = 3) {
  const [c, x] = canvas(8, 16);
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (lit) { x.fillStyle = '#000'; x.fillRect(0, 0, 8, 16); for (let j = 0; j < 16; j += 2) for (let i = 0; i < 8; i += 2) if (r() < 0.45) { x.fillStyle = ['#ffe9b0', '#bfe0ff', '#ffd27a'][Math.floor(r() * 3)]; x.fillRect(i, j, 2, 1); } }
  else { for (let j = 0; j < 16; j++) { x.fillStyle = j % 2 ? '#7fa6d6' : '#a8c8f0'; x.fillRect(0, j, 8, 1); } x.fillStyle = '#5a7aa8'; x.fillRect(0, 0, 1, 16); x.fillRect(4, 0, 1, 16); x.fillStyle = '#e0f0ff'; x.fillRect(1, 2, 2, 1); }
  const t = pixelTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function city(rnd) {
  const g = new THREE.Group();
  // [height, v-repeat, u-repeat, glass]
  const classes = [[5, 1, 2, false], [11, 3, 2, false], [20, 5, 3, false], [34, 5, 2, true], [54, 8, 2, true]];
  const wallMap = windowTex(1, 1, '#ffffff', '#6a7a98');
  const litWall = windowTex(4, 4, '#000', '#000', true, 9);
  const glass = glassTex(false), glassLit = glassTex(true, 7);
  const mats = [];
  const meshes = classes.map(([h, rows, cols, isGlass]) => {
    const geo = new THREE.BoxGeometry(10, h, 10); geo.translate(0, h / 2, 0);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * cols, uv.getY(i) * rows);
    const mat = new THREE.MeshLambertMaterial({ map: isGlass ? glass : wallMap, emissive: new THREE.Color('#ffc870'), emissiveMap: isGlass ? glassLit : litWall, emissiveIntensity: 0.5 });
    mats.push(mat);
    return new THREE.InstancedMesh(geo, mat, 220);
  });
  const roofGeo = new THREE.ConeGeometry(7.4, 3.2, 4); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 1.6, 0);
  const roofs = new THREE.InstancedMesh(roofGeo, toon('#ffffff'), 220); let nroof = 0;
  const counts = new Array(classes.length).fill(0);
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3(); const pos = new THREE.Vector3();
  const tints = [
    ['#ffb8b0', '#ffd88a', '#a8e0c4', '#b0ccff', '#ffc4e0', '#fff1b0', '#f0f0f0'],
    ['#ffe0dc', '#fff0d0', '#dcf2e4', '#dce8ff', '#f4e0ff', '#ffffff', '#ffe8c8'],
    ['#fff4e8', '#e8f0ff', '#ffe8f0', '#e8fff4', '#fff8d8'],
    ['#d8e8ff', '#e8f0ff', '#cfe0ff', '#e0f4ff'],
    ['#d8e8ff', '#f0f4ff', '#cfd8ff'],
  ];
  const roofCols = ['#d9584a', '#e8803a', '#3f8a8a', '#c4587a', '#6a6ab0'];
  const lightPts = [], antennaPts = [], tops = [];
  const river = (x, z) => Math.abs(z - (175 + x * 0.35)) < 10;
  const park = (x, z) => Math.hypot(x - SPOTS.wheel.x, z - SPOTS.wheel.z) < 26;
  const blocks = [];
  for (let bx = -130; bx <= 260; bx += 14) for (let bz = 112; bz <= 340; bz += 14) {
    if (bz < 128 && bx < 80 && bx > -70) continue; // green belt behind the school
    if (river(bx, bz) || park(bx, bz)) continue;
    blocks.push([bx, bz]);
    if (rnd() < 0.14) continue;
    const dc = Math.hypot(bx - 72, bz - 212);
    let k = dc < 40 ? (rnd() < 0.45 ? 4 : 3) : dc < 80 ? (rnd() < 0.35 ? 3 : 2) : dc < 125 ? (rnd() < 0.5 ? 2 : 1) : (rnd() < 0.75 ? 0 : 1);
    if (counts[k] >= 220) continue;
    // two small houses per block in the outer ring, one building elsewhere
    const n = k === 0 ? 2 : 1;
    for (let j = 0; j < n; j++) {
      const s = k === 0 ? 0.42 + rnd() * 0.12 : 0.55 + rnd() * 0.3, hs = 0.8 + rnd() * 0.5;
      const ox = n === 2 ? (j ? 2.8 : -2.8) : (rnd() - 0.5) * 2;
      m4.compose(pos.set(bx + ox, PLAIN, bz + (rnd() - 0.5) * 3), q.identity(), sc.set(s, hs, s));
      meshes[k].setMatrixAt(counts[k], m4); meshes[k].setColorAt(counts[k], new THREE.Color(tints[k][Math.floor(rnd() * tints[k].length)]));
      counts[k]++;
      const top = PLAIN + classes[k][0] * hs;
      if (k === 0 && nroof < 220) { m4.compose(pos.clone().setY(top), q.identity(), sc.set(s, 1, s)); roofs.setMatrixAt(nroof, m4); roofs.setColorAt(nroof, new THREE.Color(roofCols[Math.floor(rnd() * roofCols.length)])); nroof++; }
      else tops.push([pos.x, top, pos.z, s * 10]);
      if (k >= 3) antennaPts.push(pos.x, top + 4, pos.z);
    }
    lightPts.push(bx + 7, PLAIN + 0.8, bz + 7);
    if (rnd() < 0.6) lightPts.push(bx + 7, PLAIN + 0.8, bz);
  }
  meshes.forEach((m, k) => { m.count = counts[k]; m.instanceMatrix.needsUpdate = true; g.add(m); });
  roofs.count = nroof; g.add(roofs);
  // rooftop details: water tanks / boxes and a few antennas
  const tankGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.6, 8); tankGeo.translate(0, 0.8, 0);
  const tanks = new THREE.InstancedMesh(tankGeo, toon('#c0c8d8'), tops.length);
  const boxGeo = new THREE.BoxGeometry(2.2, 1.2, 1.6); boxGeo.translate(0, 0.6, 0);
  const boxes = new THREE.InstancedMesh(boxGeo, toon('#8a8aa0'), tops.length);
  let nt = 0, nb = 0;
  tops.forEach(([x, y, z, w]) => {
    if (rnd() < 0.5) { m4.makeTranslation(x + (rnd() - 0.5) * w * 0.5, y, z + (rnd() - 0.5) * w * 0.5); tanks.setMatrixAt(nt++, m4); }
    if (rnd() < 0.6) { m4.makeTranslation(x + (rnd() - 0.5) * w * 0.4, y, z + (rnd() - 0.5) * w * 0.4); boxes.setMatrixAt(nb++, m4); }
  });
  tanks.count = nt; boxes.count = nb; g.add(tanks, boxes);
  // neon signs on facades
  const neonCols = ['#ff5aa8', '#5af0ff', '#ffe066', '#b48aff', '#7dff9a', '#ff8a3a'];
  const neonGeo = new THREE.PlaneGeometry(4, 1.2);
  const neons = neonCols.map((c) => new THREE.InstancedMesh(neonGeo, new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }), 40));
  const nn = new Array(neonCols.length).fill(0);
  tops.forEach(([x, y, z, w]) => {
    if (rnd() < 0.55) return;
    const k = Math.floor(rnd() * neonCols.length); if (nn[k] >= 40) return;
    const hy = PLAIN + 3 + rnd() * Math.max(1, y - PLAIN - 6);
    const face = rnd() < 0.5;
    m4.compose(pos.set(x + (face ? 0 : w / 2 + 0.05), hy, z + (face ? -w / 2 - 0.05 : 0)), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), face ? 0 : Math.PI / 2), sc.set(0.6 + rnd() * 0.8, 1, 1));
    neons[k].setMatrixAt(nn[k]++, m4);
  });
  neons.forEach((m, k) => { m.count = nn[k]; g.add(m); });
  // street grid ground
  const [rc, rx] = canvas(28, 28);
  rx.fillStyle = '#9a96a4'; rx.fillRect(0, 0, 28, 28); rx.fillStyle = '#5a5866'; rx.fillRect(0, 0, 28, 6); rx.fillRect(0, 0, 6, 28);
  rx.fillStyle = '#e8e0a0'; for (let i = 8; i < 28; i += 6) { rx.fillRect(i, 3, 3, 1); rx.fillRect(3, i, 1, 3); }
  rx.fillStyle = '#b8b4c0'; rx.fillRect(7, 7, 20, 20);
  const rt = pixelTex(rc); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(392 / 14, 238 / 14);
  const streets = new THREE.Mesh(new THREE.PlaneGeometry(392, 238).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: rt }));
  streets.position.set(-137 + 196, PLAIN + 0.15, 105 + 119); g.add(streets);
  // street trees + park trees
  const treeGeo = new THREE.IcosahedronGeometry(1.4, 0);
  const trees = new THREE.InstancedMesh(treeGeo, toon('#5fae5a'), 500); let ntr = 0;
  blocks.forEach(([bx, bz]) => { if (rnd() < 0.5 && ntr < 500) { m4.makeTranslation(bx + 6.5, PLAIN + 1.6, bz + (rnd() - 0.5) * 10); trees.setMatrixAt(ntr++, m4); } });
  for (let i = 0; i < 90 && ntr < 500; i++) { const a = rnd() * Math.PI * 2, r = 8 + rnd() * 17; m4.makeTranslation(SPOTS.wheel.x + Math.cos(a) * r, PLAIN + 1.6, SPOTS.wheel.z + Math.sin(a) * r); trees.setMatrixAt(ntr++, m4); }
  trees.count = ntr; g.add(trees);
  const parkGrass = new THREE.Mesh(new THREE.CircleGeometry(26, 24).rotateX(-Math.PI / 2), toon('#7fc464')); parkGrass.position.set(SPOTS.wheel.x, PLAIN + 0.25, SPOTS.wheel.z); g.add(parkGrass);
  // street lights
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lightPts, 3));
  const lights = new THREE.Points(lg, new THREE.PointsMaterial({ color: '#ffcf7a', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6 }));
  g.add(lights);
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute(antennaPts, 3));
  const antennas = new THREE.Points(ag, new THREE.PointsMaterial({ color: '#ff4a4a', size: 3, sizeAttenuation: false }));
  g.add(antennas);
  // cars: light points sliding along street lines
  const CARS = 140; const carPos = new Float32Array(CARS * 3), carCol = new Float32Array(CARS * 3);
  const cars = [];
  for (let i = 0; i < CARS; i++) {
    const alongX = rnd() < 0.5; const line = alongX ? 112 + Math.floor(rnd() * 16) * 14 : -130 + Math.floor(rnd() * 28) * 14;
    cars.push({ alongX, line: line - 5 + (rnd() < 0.5 ? -1 : 1), t: rnd(), sp: (0.006 + rnd() * 0.01) * (rnd() < 0.5 ? 1 : -1) });
    const c = new THREE.Color(rnd() < 0.5 ? '#fff4d8' : '#ff5a4a'); carCol.set([c.r, c.g, c.b], i * 3);
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(carPos, 3)); cg.setAttribute('color', new THREE.BufferAttribute(carCol, 3));
  const carPts = new THREE.Points(cg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.4 }));
  g.add(carPts);
  // river with sparkles + bridge with lights
  const riverGeo = new THREE.PlaneGeometry(520, 18).rotateX(-Math.PI / 2);
  const riverMesh = waterMesh({ deep: '#3f6fa8', shallow: '#6aa8d8', sparkle: '#fff2c8', fog: '#f3b27e', fogFar: 700 }, 0, riverGeo);
  riverMesh.rotation.y = -Math.atan(0.35); riverMesh.position.set(60, PLAIN + 0.35, 175 + 60 * 0.35);
  riverMesh.material.polygonOffset = true; riverMesh.material.polygonOffsetFactor = -2; riverMesh.material.polygonOffsetUnits = -2; riverMesh.renderOrder = 1; g.add(riverMesh);
  const bridgePts = [];
  for (const bxp of [10, 90]) {
    const bz = 175 + bxp * 0.35;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 30), toon('#c4587a')); bridge.position.set(bxp, PLAIN + 1.4, bz); bridge.rotation.y = -Math.atan(0.35); g.add(bridge);
    for (let k = -14; k <= 14; k += 2) for (const side of [-2.4, 2.4]) { const v = new THREE.Vector3(side, 2.2, k).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan(0.35)); bridgePts.push(bxp + v.x, PLAIN + v.y, bz + v.z); }
  }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.Float32BufferAttribute(bridgePts, 3));
  const bridgeLights = new THREE.Points(bgeo, new THREE.PointsMaterial({ color: '#fff0b0', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
  g.add(bridgeLights);
  // ferris wheel in the riverside park
  const wheel = new THREE.Group();
  const R = 16;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.35, 6, 40), toon('#f6f0ff')); wheel.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.2, 6, 30), toon('#f6f0ff')); wheel.add(ring2);
  for (let i = 0; i < 16; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.15, R * 2, 0.15), toon('#f6f0ff')); sp.rotation.z = (i / 16) * Math.PI; wheel.add(sp); }
  const cabinCols = ['#f08fa8', '#f6c45f', '#8fd3b6', '#7f9fdc', '#b49ae0'];
  const cabins = [];
  for (let i = 0; i < 16; i++) { const cb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.6), toon(cabinCols[i % 5])); wheel.add(cb); cabins.push(cb); }
  const wheelLightPts = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; wheelLightPts.push(Math.cos(a) * R, Math.sin(a) * R, 0.4); }
  const wlg = new THREE.BufferGeometry(); wlg.setAttribute('position', new THREE.Float32BufferAttribute(wheelLightPts, 3));
  const wlc = new Float32Array(64 * 3); wlg.setAttribute('color', new THREE.BufferAttribute(wlc, 3));
  const wheelLights = new THREE.Points(wlg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.4 }));
  wheel.add(wheelLights);
  wheel.position.set(SPOTS.wheel.x, PLAIN + R + 2.5, SPOTS.wheel.z); wheel.rotation.y = 0.5; g.add(wheel);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, R + 3, 0.6), toon('#d8d0e8')); leg.position.set(SPOTS.wheel.x + Math.cos(0.5) * s * 0, PLAIN + (R + 3) / 2, SPOTS.wheel.z); leg.rotation.y = 0.5; leg.rotation.z = s * 0.22; leg.translateX(s * 3.5); g.add(leg); }
  // TV tower landmark with a blinking light
  const tv = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.4, 70, 8), toon('#e8e2f0')); shaft.position.y = 35; tv.add(shaft);
  const pod = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 8), toon('#f08fa8')); pod.position.y = 52; tv.add(pod);
  const pod2 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 6), toon('#f6c45f')); pod2.position.y = 62; tv.add(pod2);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4a4a' })); beacon.position.y = 71; tv.add(beacon);
  tv.position.set(96, PLAIN, 212); g.add(tv);
  // low hills behind the city
  for (let i = 0; i < 9; i++) { const hill = new THREE.Mesh(new THREE.SphereGeometry(60 + i * 7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(i % 2 ? '#6a8a78' : '#5f7f74')); hill.scale.y = 0.35; hill.position.set(-200 + i * 70, PLAIN - 2, 400 + (i % 3) * 30); g.add(hill); }

  let nightK = 0;
  g.userData = { mats, lights, beacon, wheel };
  g.userData.update = (dt, t) => {
    wheel.rotation.z = t * 0.04;
    cabins.forEach((cb, i) => { const a = (i / 16) * Math.PI * 2 + t * 0.04; cb.position.set(Math.cos(a) * R, Math.sin(a) * R - 1, 0); cb.rotation.z = -t * 0.04; });
    for (let i = 0; i < 64; i++) { const c = new THREE.Color().setHSL(((i / 64) + t * 0.08) % 1, 0.9, 0.62); wlc.set([c.r, c.g, c.b], i * 3); }
    wlg.attributes.color.needsUpdate = true;
    cars.forEach((c, i) => { c.t = (c.t + c.sp * dt * 3 + 1) % 1; const p = c.t * (c.alongX ? 390 : 226); if (c.alongX) carPos.set([-130 + p, PLAIN + 0.6, c.line], i * 3); else carPos.set([c.line, PLAIN + 0.6, 112 + p], i * 3); });
    cg.attributes.position.needsUpdate = true;
    riverMesh.userData.uniforms.time.value = t;
    beacon.visible = Math.floor(t * 1.2) % 2 === 0;
    antennas.visible = Math.floor(t * 0.9 + 0.5) % 2 === 0;
  };
  // night level 0..1: windows, neon and street lights brighten
  g.userData.setNight = (k) => {
    nightK = k;
    mats.forEach((m) => { m.emissiveIntensity = 0.15 + k * 1.6; m.color.setScalar(1 - k * 0.6); }); roofs.material.color.setScalar(1 - k * 0.6);
    neons.forEach((m) => { m.material.color.multiplyScalar(1); m.visible = k > 0.08; });
    lights.material.opacity = 0.25 + k * 0.75; lights.material.size = 2 + k * 1.5;
    carPts.material.opacity = 0.2 + k * 0.8; bridgeLights.material.opacity = 0.3 + k * 0.7; wheelLights.material.opacity = 0.35 + k * 0.65;
    riverMesh.userData.uniforms.night.value = k;
  };
  return g;
}

// distant mountain ring + clouds for depth
function horizon(world) {
  const g = new THREE.Group();
  const cols = ['#8f86b8', '#7f8fb0', '#9a8ab0'];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    if (Math.sin(a) > 0.55 && Math.cos(a) > -0.6 && Math.cos(a) < 0.9) continue; // keep the city side open
    const r = 520 + (i % 3) * 60; const h = 70 + ((i * 37) % 60);
    const m = new THREE.Mesh(new THREE.ConeGeometry(110 + (i % 4) * 30, h, 5), toon(cols[i % 3]));
    m.position.set(Math.cos(a) * r, PLAIN + h / 2 - 10, Math.sin(a) * r + 40); m.rotation.y = i;
    g.add(m);
  }
  world.scene.add(g);
  const clouds = new THREE.Group();
  const cm = toon('#fff6f0');
  for (let i = 0; i < 16; i++) {
    const cl = new THREE.Group();
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(6 + Math.random() * 6, 0), cm); p.position.set(k * 7 - 14, Math.random() * 4, Math.random() * 6); p.scale.y = 0.55; cl.add(p); }
    const a = Math.random() * Math.PI * 2, r = 160 + Math.random() * 220;
    cl.position.set(Math.cos(a) * r, 60 + Math.random() * 50, Math.sin(a) * r);
    cl.userData.sp = 0.6 + Math.random() * 0.8;
    clouds.add(cl);
  }
  world.scene.add(clouds);
  world.every((dt) => clouds.children.forEach((c) => { c.position.x += c.userData.sp * dt; if (c.position.x > 400) c.position.x = -400; }));
  return { mountains: g, clouds };
}

// Builds static mountain content into the world. Returns handles.
// A wooden rowing boat: a rounded clinker-style hull with a pointed bow and a
// transom stern, two thwarts, a gunwale rail and a pair of oars in oarlocks.
// Its origin sits on the waterline; the bow points to +z.
// userData.oars holds the two oar groups (pivot at the oarlock, blade towards +x).
export function rowBoat() {
  const g = new THREE.Group();
  const L = 2.7, Wd = 0.62, D = 0.48, top = 0.3, NZ = 18, NA = 12;
  const half = (f) => (f > 0 ? Wd * Math.pow(Math.max(0, 1 - f * f), 0.55) : Wd * (1 - 0.32 * f * f));
  const sheer = (f) => top + 0.07 * f * f + (f > 0 ? 0.07 * f : 0);
  const keel = (f) => top - D * (f > 0 ? Math.pow(Math.max(0, 1 - f * f), 0.3) : 1 - 0.3 * f * f);
  const pos = [], col = [], idx = [];
  const C = { band: new THREE.Color('#f4efe6'), wood: new THREE.Color('#b5794a'), plank: new THREE.Color('#a06a40'), low: new THREE.Color('#5a7a8a') };
  for (let i = 0; i <= NZ; i++) {
    const f = -1 + (2 * i) / NZ, w = half(f), yt = sheer(f), yb = keel(f);
    for (let j = 0; j <= NA; j++) {
      const ph = -1 + (2 * j) / NA, x = w * Math.sin((ph * Math.PI) / 2), y = yt - (yt - yb) * Math.pow(Math.cos((ph * Math.PI) / 2), 0.8);
      pos.push(x, y, (f * L) / 2);
      // a pale band under the rail, planks in two tones, painted below the waterline
      const c = y > yt - 0.06 ? C.band : y < 0.02 ? C.low : Math.floor((yt - y) / 0.09) % 2 ? C.plank : C.wood;
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // close the transom
  const c0 = pos.length / 3; pos.push(0, (sheer(-1) + keel(-1)) / 2 + 0.05, -L / 2); col.push(C.wood.r, C.wood.g, C.wood.b);
  for (let j = 0; j < NA; j++) idx.push(c0, j + 1, j);
  const hg = new THREE.BufferGeometry();
  hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  hg.setIndex(idx); hg.computeVertexNormals();
  g.add(new THREE.Mesh(hg, toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide })));
  // floorboards, two thwarts, the rail along the sheer
  const dark = toon('#6a4028'), seat = toon('#c99566');
  // floorboards laid just above the waterline across the whole inside, so the
  // pond never shows through the hull
  const deckY = 0.08, deck = [];
  for (let i = 0; i <= NZ; i++) {
    const f = -1 + (2 * i) / NZ, yt = sheer(f), yb = keel(f);
    const c = (yt - deckY) / (yt - yb), ph = c >= 1 ? 0 : (Math.acos(Math.pow(Math.max(0, c), 1 / 0.8)) * 2) / Math.PI;
    deck.push([half(f) * Math.sin((ph * Math.PI) / 2) * 0.97, (f * L) / 2]);
  }
  const shp = new THREE.Shape(); deck.forEach(([w, z], i) => (i ? shp.lineTo(w, z) : shp.moveTo(w, z))); [...deck].reverse().forEach(([w, z]) => shp.lineTo(-w, z));
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shp).rotateX(Math.PI / 2), toon('#8a5a3a', { side: THREE.DoubleSide })); floor.position.y = deckY; g.add(floor);
  for (let k = -3; k <= 3; k++) { const seam = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.005, 2.2), toon('#6a4028')); seam.position.set(k * 0.12, deckY + 0.004, -0.1); g.add(seam); }
  for (const [z, w] of [[0.15, 1.12], [-0.85, 0.98]]) { const th = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.24), seat); th.position.set(0, 0.2, z); g.add(th); }
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= NZ; i++) { const f = -1 + (2 * i) / NZ; pts.push(new THREE.Vector3(sd * half(f), sheer(f) + 0.02, (f * L) / 2)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.035, 4), dark));
  }
  // oars: shaft out to +x from the oarlock, the grip inboard, a flat blade
  const oars = [];
  for (const sd of [-1, 1]) {
    const mount = new THREE.Group(); mount.position.set(sd * (half(0.07) + 0.02), sheer(0.07) + 0.04, 0.07); mount.scale.x = sd; g.add(mount);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), toon('#3a3346')); lock.position.y = -0.04; mount.add(lock);
    const oar = new THREE.Group(); oar.rotation.order = 'YZX'; mount.add(oar);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 6).rotateZ(Math.PI / 2), toon('#d9b07a')); shaft.position.x = 0.5; oar.add(shaft);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 6).rotateZ(Math.PI / 2), dark); grip.position.x = -0.42; oar.add(grip);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.03), toon('#c98a54')); blade.position.x = 1.42; oar.add(blade);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.035), toon('#e05a7a')); tip.position.x = 1.72; oar.add(tip);
    oar.userData.grip = new THREE.Vector3(-0.44, 0, 0); oar.userData.blade = new THREE.Vector3(1.45, 0, 0);
    oars.push(oar);
  }
  g.userData.oars = oars; g.userData.len = L; g.userData.beam = Wd;
  return g;
}

export function buildMountain(world) {
  const S = world.scene;
  S.add(terrainMesh());
  const far = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000).rotateX(-Math.PI / 2), toon('#86b05a')); far.position.y = PLAIN - 0.3; S.add(far);
  const hz = horizon(world);
  const H = mountainHeight;
  const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const at = (x, z) => new THREE.Vector3(x, H(x, z), z);
  const inside = (x, z) => Math.hypot(x * 0.92, z - 6) < 58;
  const nearPond = (x, z, m = 1) => Math.hypot(x - POND.x, z - POND.z) < POND.r + m;
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const sv = new THREE.Vector3(); const pv = new THREE.Vector3();

  // ---- pond, lilies, reeds, waterfall, pier, ducks
  const pond = waterMesh({ deep: '#4f8fc0', shallow: '#86d6cc', sparkle: '#fff2c8', fog: '#f3b27e' }, POND.r + 0.5);
  pond.position.set(POND.x, pondLevel(), POND.z); S.add(pond);
  const lilyGeo = new THREE.CircleGeometry(0.45, 7, 0.4, Math.PI * 1.8).rotateX(-Math.PI / 2);
  const lilies = new THREE.InstancedMesh(lilyGeo, toon('#5fb35a'), 18);
  const lilyFlowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshBasicMaterial({ color: '#ffc2d4' }), 8);
  for (let i = 0; i < 18; i++) { const a = rnd() * Math.PI * 2, r = 1.5 + rnd() * 4; m4.compose(pv.set(POND.x + Math.cos(a) * r, pondLevel() + 0.04, POND.z + Math.sin(a) * r), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6), sv.set(1, 1, 1)); lilies.setMatrixAt(i, m4); if (i < 8) { m4.makeTranslation(pv.x + 0.1, pv.y + 0.1, pv.z); lilyFlowers.setMatrixAt(i, m4); } }
  S.add(lilies, lilyFlowers);
  // waterfall over a rocky cliff on the north side
  const wf = SPOTS.waterfall; const wl = pondLevel(); const wfTop = Math.max(wl + 3.2, H(wf.x, wf.z - 1.2) + 0.4);
  const fallH = wfTop - wl;
  const rockCols = ['#9a8e86', '#b2a69a', '#867a74', '#a89c90'];
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1; const k = Math.floor(i / 2);
    const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + rnd() * 0.7, 0), toon(rockCols[i % 4]));
    rk.position.set(wf.x + side * (1.3 + rnd() * 0.6 + (k > 3 ? 0.8 : 0)), wl + k * fallH / 5 + 0.2, wf.z - 0.4 - rnd() * 0.8);
    rk.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); rk.scale.set(1, 1.2, 1); S.add(rk);
  }
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(2.4, fallH + 0.6, 1.2), toon('#7a7068')); cliff.position.set(wf.x, wl + fallH / 2, wf.z - 1.1); S.add(cliff);
  const lip = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), toon('#b2a69a')); lip.position.set(wf.x, wfTop + 0.2, wf.z - 1.2); lip.scale.set(1.6, 0.5, 1); S.add(lip);
  const fallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { time: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float time; varying vec2 vUv; float h(float x){ return fract(sin(x * 91.7) * 4375.5); } void main(){ float col = floor(vUv.x * 9.0); float s = fract(vUv.y * 3.0 + time * (1.4 + h(col) * 0.8) + h(col + 3.0)); vec3 c = mix(vec3(0.42,0.72,0.92), vec3(0.96,0.99,1.0), step(0.55, s)); c = mix(c, vec3(1.0), smoothstep(0.15, 0.0, vUv.y) * 0.8); float a = 0.92 * smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x); gl_FragColor = vec4(c, a); }' });
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(1.5, fallH, 1, 1), fallMat); fall.position.set(wf.x, wl + fallH / 2, wf.z - 0.45); S.add(fall);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(1.4, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })); foam.position.set(wf.x, wl + 0.05, wf.z + 0.3); S.add(foam);
  world.every((dt, t) => { foam.scale.setScalar(1 + Math.sin(t * 5) * 0.08); });
  // reeds + cattails around the pond
  const reeds = [];
  for (let i = 0; i < 70; i++) { const a = rnd() * Math.PI * 2, r = POND.r - 0.2 + rnd() * 1.6; const x = POND.x + Math.cos(a) * r, z = POND.z + Math.sin(a) * r; if (Math.hypot(x - SPOTS.pier.x, z - SPOTS.pier.z) < 2.5) continue; reeds.push({ x, y: Math.max(H(x, z), wl), z, s: 0.8 + rnd() * 0.5 }); }
  const reedMesh = instancedBillboards(tuftCanvas(['#4f8a4a', '#6aa85a', '#3f7a46'], true), reeds, { size: 0.07, color: '#fff0d8' }); S.add(reedMesh);
  // little wooden pier
  const pier = new THREE.Group();
  for (let i = 0; i < 5; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.5), toon(i % 2 ? '#b5794a' : '#a8703f')); pl.position.set(0, 0, i * 0.52); pier.add(pl); }
  for (const [x, z] of [[-0.6, 0], [0.6, 0], [-0.6, 2], [0.6, 2]]) { const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 5), toon('#6a4430')); pp.position.set(x, -0.5, z); pier.add(pp); }
  pier.position.set(SPOTS.pier.x, wl + 0.35, SPOTS.pier.z); pier.rotation.y = Math.atan2(POND.x - SPOTS.pier.x, POND.z - SPOTS.pier.z) + Math.PI; S.add(pier);
  // ducks
  const ducks = [];
  for (let i = 0; i < 3; i++) { const d = billboard(duckSprite(0), 0.05); d.position.set(POND.x, wl, POND.z); S.add(d); ducks.push({ d, ph: i * 2.1, r: 2 + i * 1.2 }); }

  // ---- grass, ferns, bushes, mushrooms
  const tufts = [];
  for (let i = 0; i < 5200; i++) {
    const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120 + 6;
    if (!inside(x, z) || nearPond(x, z) || pathDist(x, z) < 1.1 || inDeck(x, z)) continue;
    tufts.push({ x, y: H(x, z), z, s: 0.7 + rnd() * 0.8 });
  }
  const tuft1 = instancedBillboards(tuftCanvas(['#6fa84a', '#8fc35a', '#a9d46a']), tufts.slice(0, tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  const tuft2 = instancedBillboards(tuftCanvas(['#7fb04f', '#9cc95f', '#c3d77a']), tufts.slice(tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  S.add(tuft1, tuft2);
  const ferns = [];
  for (let i = 0; i < 260; i++) { const x = (rnd() - 0.5) * 110, z = (rnd() - 0.5) * 110 + 6; if (!inside(x, z) || nearPond(x, z) || pathDist(x, z) < 1.5 || inDeck(x, z)) continue; if (Math.hypot(x - SPOTS.meadow.x, z - SPOTS.meadow.z) < 12) continue; ferns.push({ x, y: H(x, z), z, s: 0.9 + rnd() * 0.6 }); }
  const fernMesh = instancedBillboards(fernCanvas(), ferns, { size: 0.08, color: '#fff0d8', wind: 0.6 }); S.add(fernMesh);
  const shrooms = [];
  for (let i = 0; i < 60; i++) { const x = -30 + rnd() * 70, z = -20 + rnd() * 50; if (!inside(x, z) || nearPond(x, z) || pathDist(x, z) < 1.5) continue; shrooms.push({ x, y: H(x, z), z, s: 1 }); }
  S.add(instancedBillboards(mushroomCanvas(), shrooms, { size: 0.05, wind: 0 }));
  // bushes (instanced blobs, two tones)
  const bushGeo = new THREE.IcosahedronGeometry(0.8, 0);
  const bushA = new THREE.InstancedMesh(bushGeo, toon('#4f9a54'), 220), bushB = new THREE.InstancedMesh(bushGeo, toon('#6fbe62'), 220);
  const bushFlowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 400);
  let nba = 0, nbb = 0, nbf = 0;
  const bfCols = ['#ffffff', '#ffc2d4', '#ffe066', '#c8a8ff'];
  for (let i = 0; i < 400 && nba < 220; i++) {
    const x = (rnd() - 0.5) * 112, z = (rnd() - 0.5) * 112 + 6;
    if (!inside(x, z) || nearPond(x, z, 2) || pathDist(x, z) < 2.2 || inDeck(x, z) || Math.hypot(x - SPOTS.meadow.x, z - SPOTS.meadow.z) < 9 || Math.hypot(x - SPOTS.balloon.x, z - SPOTS.balloon.z) < 6) continue;
    const s = 0.8 + rnd() * 0.9; const y = H(x, z) + 0.3 * s;
    m4.compose(pv.set(x, y, z), q.setFromEuler(new THREE.Euler(rnd(), rnd() * 6, rnd())), sv.set(s * 1.2, s * 0.8, s));
    (rnd() < 0.5 ? bushA : bushB).setMatrixAt(rnd() < 0.5 ? nba++ : nbb++, m4);
    if (rnd() < 0.4) for (let k = 0; k < 4 && nbf < 400; k++) { m4.makeTranslation(x + (rnd() - 0.5) * s * 1.4, y + s * 0.4 + rnd() * 0.3, z + (rnd() - 0.5) * s * 1.2); bushFlowers.setMatrixAt(nbf, m4); bushFlowers.setColorAt(nbf, new THREE.Color(bfCols[i % 4])); nbf++; }
  }
  bushA.count = Math.min(nba, 220); bushB.count = Math.min(nbb, 220); bushFlowers.count = nbf;
  S.add(bushA, bushB, bushFlowers);
  world.every((dt, t) => { [tuft1, tuft2, reedMesh, fernMesh].forEach((m) => { m.userData.uniforms.time.value = t; }); });

  // decorative flowers (denser in the meadow and along paths)
  const flowerMeshes = [];
  FLOWER_TYPES.forEach((ft, k) => {
    const list = [];
    for (let i = 0; i < 220; i++) {
      let x, z;
      const r = rnd();
      if (r < 0.55) { x = 2 + (rnd() - 0.5) * 34; z = 26 + (rnd() - 0.5) * 24; } else if (r < 0.8) { const p = PATHS[0][Math.floor(rnd() * (PATHS[0].length - 1))]; x = p[0] + (rnd() < 0.5 ? -1 : 1) * (1.6 + rnd() * 1.4); z = p[1] + (rnd() - 0.5) * 8; } else { x = (rnd() - 0.5) * 100; z = (rnd() - 0.5) * 100 + 6; }
      if (!inside(x, z) || nearPond(x, z) || pathDist(x, z) < 1.2 || inDeck(x, z)) continue;
      list.push({ x, y: H(x, z), z, s: 0.9 + rnd() * 0.4 });
    }
    const m = instancedBillboards(flowerSprite(ft.species, ft.colors[k % 2 ? 0 : ft.colors.length - 1]), list, { size: 0.04, color: '#fff4e4' });
    S.add(m); flowerMeshes.push(m);
  });
  world.every((dt, t) => flowerMeshes.forEach((m) => { m.userData.uniforms.time.value = t; }));

  // ---- trees
  const trees = [];
  const placeTree = (kind, x, z, h) => { const tr = lowTree(kind, h, Math.floor(rnd() * 1e6)); tr.position.copy(at(x, z)); tr.position.y -= 0.1; S.add(tr); trees.push(tr); return tr; };
  [[-20, 2], [-27, 9], [-30, 1], [-24, 13], [-18, 9], [-31, 15], [-17, -1], [-34, 6], [-22, 18], [-28, -3]].forEach(([x, z]) => placeTree('cherry', x, z, 4.2 + rnd() * 1.2));
  const clear = (x, z) => Math.hypot(x - SPOTS.meadow.x, z - SPOTS.meadow.z) < 12 || nearPond(x, z, 4) || Math.hypot(x - SPOTS.balloon.x, z - SPOTS.balloon.z) < 8 || Math.hypot(x - SPOTS.grove.x, z - SPOTS.grove.z) < 13 || Math.hypot(x - 30, z + 22) < 6 || Math.hypot(x - SPOTS.hill.x, z - SPOTS.hill.z) < 10 || Math.hypot(x - SPOTS.spawn.x, z - SPOTS.spawn.z) < 7 || pathDist(x, z) < 3;
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2, r = 12 + rnd() * 42; const x = Math.cos(a) * r, z = Math.sin(a) * r + 6;
    if (clear(x, z) || !inside(x, z)) continue;
    placeTree(rnd() < 0.3 ? 'pine' : rnd() < 0.3 ? 'golden' : 'round', x, z, 3 + rnd() * 2.8);
  }
  for (let i = 0; i < 90; i++) { // edge ring (soft boundary), with a gap toward the school gate
    const a = (i / 90) * Math.PI * 2 + rnd() * 0.04;
    const r = 59 + rnd() * 5; const x = Math.cos(a) * r / 0.92, z = Math.sin(a) * r + 6;
    if (z > 55 && Math.abs(x) < 9) continue;
    placeTree(rnd() < 0.55 ? 'pine' : 'round', x, z, 4.5 + rnd() * 3);
  }
  const swingTree = placeTree('round', SPOTS.swing.x - 1.2, SPOTS.swing.z - 3.2, 6.5);
  world.every((dt, t) => trees.forEach((tr) => { tr.rotation.z = Math.sin(t * 0.9 + tr.userData.sway) * 0.015; }));
  // fallen log with moss
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 4, 7), toon('#8a5a3a')); log.rotation.z = Math.PI / 2; log.rotation.y = 0.6; log.position.copy(at(-12, -4)).add(new THREE.Vector3(0, 0.3, 0)); S.add(log);
  const moss = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), toon('#5fae68')); moss.position.copy(log.position).add(new THREE.Vector3(0, 0.38, 0)); moss.rotation.y = 0.6; S.add(moss);
  // rocks
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, r = 14 + rnd() * 40; const x = Math.cos(a) * r, z = Math.sin(a) * r + 6;
    if (clear(x, z) || !inside(x, z)) continue;
    const s = 0.4 + rnd() * 0.9;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), toon(rnd() < 0.5 ? '#b8a894' : '#a0907e'));
    rock.position.copy(at(x, z)); rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); S.add(rock);
    if (rnd() < 0.5) { const mc = new THREE.Mesh(new THREE.DodecahedronGeometry(s * 0.6, 0), toon('#6fae62')); mc.position.copy(rock.position).add(new THREE.Vector3(0, s * 0.55, 0)); mc.scale.y = 0.35; S.add(mc); }
  }

  // ---- path: stepping stones + lamps + signposts
  const stoneGeo = new THREE.CylinderGeometry(0.3, 0.34, 0.1, 6);
  const stones = new THREE.InstancedMesh(stoneGeo, toon('#e4ded6'), 900); let ns = 0;
  const lamps = [];
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) {
    const [ax, az] = p[i], [bx, bz] = p[i + 1]; const L = Math.hypot(bx - ax, bz - az);
    for (let d = 0; d < L; d += 1.15) {
      const t = d / L; const x = ax + (bx - ax) * t + (rnd() - 0.5) * 0.7, z = az + (bz - az) * t + (rnd() - 0.5) * 0.7;
      if (inDeck(x, z) || ns >= 900) continue;
      m4.compose(pv.set(x, H(x, z) + 0.02, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 3), sv.set(0.9 + rnd() * 0.3, 1, 0.9 + rnd() * 0.3));
      stones.setMatrixAt(ns++, m4);
    }
  }
  stones.count = ns; S.add(stones);
  // lamps every ~9m along the main path (alternating sides)
  const main = PATHS[0]; let acc = 0, side = 1;
  for (let i = 0; i < main.length - 1; i++) {
    const [ax, az] = main[i], [bx, bz] = main[i + 1]; const L = Math.hypot(bx - ax, bz - az);
    const nx = -(bz - az) / L, nz = (bx - ax) / L;
    for (let d = 0; d < L; d += 1) { acc += 1; if (acc % 9 !== 0) continue; const t = d / L; const x = ax + (bx - ax) * t + nx * 1.7 * side, z = az + (bz - az) * t + nz * 1.7 * side; side *= -1; if (Math.hypot(x - DECK.x, z - DECK.z) < 8) continue; const lp = lampPost(); lp.position.copy(at(x, z)); lp.rotation.y = Math.atan2(-nx * side, -nz * side); S.add(lp); lamps.push(lp); }
  }
  const signs = [
    [new THREE.Vector3(-1.6, 0, 9), [['Đỉnh núi', -7, -27], ['Rừng anh đào', -23, 6], ['Đồi hoa', 2, 26]]],
    [new THREE.Vector3(1.8, 0, 17.5), [['Hồ trên núi', 20, 4], ['Đỉnh núi', -7, -27]]],
    [new THREE.Vector3(-3.4, 0, -7.5), [['Chòi ngắm cảnh', 30, -22], ['Đỉnh núi', -7, -27]]],
    [new THREE.Vector3(3.4, 0, 45), [['Lên núi', 2, 26]]],
  ];
  signs.forEach(([p, ts]) => { const sp = signpost(ts, p); sp.position.copy(at(p.x, p.z)); S.add(sp); });

  // ---- cherry grove: petal carpet, stone lantern, bench, little shrine bell
  const petalGeo = new THREE.PlaneGeometry(0.16, 0.16).rotateX(-Math.PI / 2);
  const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshBasicMaterial({ color: '#ffd0de' }), 700);
  for (let i = 0; i < 700; i++) { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 12; const x = SPOTS.grove.x + Math.cos(a) * r, z = SPOTS.grove.z + Math.sin(a) * r; m4.compose(pv.set(x, H(x, z) + 0.04, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6), sv.set(1, 1, 1)); petals.setMatrixAt(i, m4); petals.setColorAt(i, new THREE.Color(['#ffd0de', '#ffe4ec', '#f6b0c6'][i % 3])); }
  S.add(petals);
  const lantern = new THREE.Group();
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), toon('#b8b0a4')); lb.position.y = 0.45; lantern.add(lb);
  const lh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.75), toon('#c8c0b4')); lh.position.y = 1.15; lantern.add(lh);
  const lw = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.8), new THREE.MeshBasicMaterial({ color: '#ffd48a' })); lw.position.y = 1.15; lantern.add(lw);
  const lr = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.4, 4), toon('#a8a094')); lr.position.y = 1.6; lr.rotation.y = Math.PI / 4; lantern.add(lr);
  lantern.position.copy(at(SPOTS.grove.x + 2, SPOTS.grove.z - 3)); S.add(lantern);
  const bench = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.55), toon('#b5794a')); seat.position.y = 0.5; bench.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), toon('#b5794a')); back.position.set(0, 0.85, -0.25); bench.add(back);
  for (const x of [-0.85, 0.85]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), toon('#5a3e30')); leg.position.set(x, 0.25, 0); bench.add(leg); }
  bench.position.copy(at(SPOTS.grove.x - 1, SPOTS.grove.z + 3)); bench.rotation.y = 0.4; S.add(bench);
  const shrine = new THREE.Group();
  for (const x of [-0.9, 0.9]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), toon('#d94a3a')); p.position.set(x, 1.3, 0); shrine.add(p); }
  const top1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 0.3), toon('#d94a3a')); top1.position.y = 2.6; shrine.add(top1);
  const top2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.25), toon('#d94a3a')); top2.position.y = 2.2; shrine.add(top2);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), toon('#f6c45f')); bell.position.set(0, 1.85, 0); shrine.add(bell);
  const rope = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), toon('#f2e6c8')); rope.position.set(0, 1.3, 0); shrine.add(rope);
  shrine.position.copy(at(SPOTS.shrine.x, SPOTS.shrine.z)); shrine.rotation.y = Math.atan2(SPOTS.grove.x - SPOTS.shrine.x, SPOTS.grove.z - SPOTS.shrine.z); S.add(shrine);

  // ---- summit deck
  const deck = new THREE.Group();
  const plank = toon('#b5794a'), plank2 = toon('#a8703f'), dark = toon('#6a4430');
  for (let i = 0; i < 16; i++) { const pl = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 0.52), i % 2 ? plank : plank2); pl.position.set(0, DECK_TOP - 0.09, -4.05 + i * 0.54); deck.add(pl); }
  for (const [x, z, w, d, hgt] of [[0, -4.25, 8.6, 0.12, 0.95], [-4.25, 0, 0.12, 8.6, 0.95], [0, 4.25, 8.6, 0.12, 0.6]]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), dark); rail.position.set(x, DECK_TOP + hgt, z); deck.add(rail); }
  const postPts = [];
  for (let k = -4; k <= 4; k += 2) for (const [x, z, hh] of [[k, -4.25, 1.1], [-4.25, k, 1.1], [k, 4.25, 0.7]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, hh, 0.12), dark); p.position.set(x, DECK_TOP + hh / 2 - 0.05, z); deck.add(p); }
  for (const [x, z] of [[4.25, -4.25], [-4.25, -4.25], [-4.25, 4.25]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), dark); p.position.set(x, DECK_TOP + 1.3, z); deck.add(p); postPts.push(new THREE.Vector3(x, DECK_TOP + 2.6, z)); }
  // fairy lights strung between the tall posts along the back of the deck
  const fairy = []; const order = [0, 1, 2];
  for (let s = 0; s < 2; s++) { const a = postPts[order[s]], b = postPts[order[s + 1]]; for (let k = 0; k <= 14; k++) { const t = k / 14; fairy.push(a.x + (b.x - a.x) * t, a.y - Math.sin(t * Math.PI) * 0.7, a.z + (b.z - a.z) * t); } }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fairy, 3));
  const fcol = new Float32Array(fairy.length); for (let i = 0; i < fairy.length / 3; i++) { const c = new THREE.Color(['#ffe9a8', '#ffc2d4', '#bfe0ff', '#c8ffb0'][i % 4]); fcol.set([c.r, c.g, c.b], i * 3); }
  fg.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  const fairyLights = new THREE.Points(fg, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85 }));
  deck.add(fairyLights);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.8), plank); steps.position.set(4.7, DECK_TOP - 0.3, 0); deck.add(steps);
  const dbench = bench.clone(); dbench.position.set(-1.5, DECK_TOP, -3.3); deck.add(dbench);
  deck.position.set(DECK.x, 0, DECK.z); S.add(deck);

  // ---- school at the foot, city on the plain
  const sch = school(); sch.position.set(SPOTS.school.x, SCHOOL_LEVEL - 0.02, SPOTS.school.z); S.add(sch);
  const cty = city(rnd); S.add(cty);
  const dv = new THREE.Vector3(), dv2 = new THREE.Vector3();
  world.every((dt, t) => { sch.userData.flag.rotation.y = Math.sin(t * 2) * 0.2; cty.userData.update(dt, t); fallMat.uniforms.time.value = t; pond.userData.uniforms.time.value = t;
    // the ducks paddle their circles but swim clear of the boat and its oars:
    // inside an oval around the hull they are eased out to its edge
    const bq = boat.quaternion, bp = boat.position;
    ducks.forEach((o) => {
      const a = t * 0.25 + o.ph, want = dv.set(POND.x + Math.cos(a) * o.r, 0, POND.z + Math.sin(a) * o.r);
      const loc = want.clone().sub(bp).setY(0).applyQuaternion(bq.clone().invert());
      const ex = 2.9, ez = 2.2, k = Math.hypot(loc.x / ex, loc.z / ez);
      const push = k < 1 ? loc.clone().multiplyScalar(1 / Math.max(k, 0.05) - 1).setY(0).applyQuaternion(bq) : dv2.set(0, 0, 0);
      o.push = (o.push || new THREE.Vector3()).lerp(push, 1 - Math.exp(-dt * 7));
      o.d.position.set(want.x + o.push.x, wl + Math.sin(t * 2 + o.ph) * 0.02, want.z + o.push.z);
      o.d.setCanvas(duckSprite(Math.floor(t * 2 + o.ph) % 2), Math.sin(a) > 0);
    });
    if (Math.random() < dt * 14) world.fx.emit(new THREE.Vector3(wf.x + (Math.random() - 0.5) * 1.4, wl + 0.2, wf.z + 0.1), new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.8 + Math.random(), 0.4 + Math.random() * 0.4), '#ffffff', 0.7, { kind: 2 });
  });

  // ---- lookout tower
  const tower = lookoutTower(); tower.position.copy(at(SPOTS.lighthouse.x, SPOTS.lighthouse.z)); tower.position.y -= 0.2; tower.rotation.y = 0.5; S.add(tower);

  // ---- telescope on the deck, pointed toward the city
  const tele = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 8), toon('#c9a24a')); tube.rotation.z = Math.PI / 2.6; tube.position.y = 1.25; tele.add(tube);
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 4), toon('#5a4030')); const a = i * 2.1; leg.position.set(Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.25); leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); tele.add(leg); }
  deck.updateMatrixWorld();
  const tPos = deck.localToWorld(new THREE.Vector3(2.2, 0, 3.4)); tPos.y = DECK_TOP; SPOTS.telescope.copy(tPos);
  tele.position.copy(tPos);
  tele.rotation.y = Math.atan2(SPOTS.city.x - tPos.x, SPOTS.city.z - tPos.z) - Math.PI / 2; S.add(tele);

  // ---- swing
  const swing = new THREE.Group();
  const sseat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), toon('#b5794a')); sseat.position.y = 0.6; swing.add(sseat);
  const ropeM = new THREE.LineBasicMaterial({ color: '#e8dcc0' });
  for (const x of [-0.45, 0.45]) swing.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.6, 0), new THREE.Vector3(x, 4.2, 0)]), ropeM));
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 5), toon('#7a4a33')); branch.rotation.z = Math.PI / 2; branch.position.y = 4.2; swing.add(branch);
  swing.position.copy(at(SPOTS.swing.x, SPOTS.swing.z)); S.add(swing);

  // ---- picnic blanket in the meadow
  const [bc, bx] = canvas(16, 16);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { bx.fillStyle = ((i >> 2) + (j >> 2)) % 2 ? '#f6efe4' : '#e66a7a'; bx.fillRect(i, j, 1, 1); }
  const blanket = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.0).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pixelTex(bc) }));
  blanket.position.copy(at(SPOTS.blanket.x, SPOTS.blanket.z)); blanket.position.y += 0.06; S.add(blanket);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.35), toon('#c98a54')); basket.position.copy(blanket.position).add(new THREE.Vector3(0.8, 0.18, -0.5)); S.add(basket);
  // kite over the meadow
  const kite = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ color: '#f08fa8', side: THREE.DoubleSide })); kite.rotation.z = Math.PI / 4; S.add(kite);
  const kiteLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#fff6ea' })); S.add(kiteLine);
  world.every((dt, t) => { kite.position.copy(blanket.position).add(new THREE.Vector3(Math.sin(t * 0.4) * 3 - 4, 14 + Math.sin(t * 0.9) * 1.2, -6)); kite.rotation.y = Math.sin(t * 0.7) * 0.4; kiteLine.geometry.setFromPoints([basket.position, kite.position]); });

  // ---- rowing boat at the pier (the chapter moves it to a berth deep enough to float)
  const boat = rowBoat();
  boat.position.set(SPOTS.boat.x, wl, SPOTS.boat.z); boat.rotation.y = 0.6; S.add(boat);

  // ---- balloon
  const balloon = balloonMesh(); balloon.position.copy(at(SPOTS.balloon.x, SPOTS.balloon.z)); S.add(balloon);
  world.every((dt, t) => { balloon.userData.env.position.y = 7.2 + Math.sin(t * 0.8) * 0.08; });

  // lamps glow brighter as it gets dark
  const setLamps = (k) => lamps.forEach((l) => l.userData.lantern.material.color.set(k > 0.3 ? '#ffd48a' : '#e8c890'));

  return { trees, tower, lighthouse: tower, city: cty, school: sch, telescope: tele, swing, swingTree, blanket, boat, balloon, pond, deck, shrine, lamps, setLamps, fairyLights, at, rnd, deckTop: DECK_TOP, horizon: hz };
}

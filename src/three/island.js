// The golden-hour island, shared by chapter 8 (walk) and chapter 9 (balloon).
import { THREE, toon, lowTree, instancedBillboards, billboard, pixelTex } from './engine3d.js';
import { canvas, flowerSprite, FLOWER_TYPES, shade, light, mix } from '../core/sprites.js';

const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (x, z, cx, cz, r) => Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));

export const SPOTS = {
  spawn: new THREE.Vector3(0, 0, 52),
  meadow: new THREE.Vector3(2, 0, 26),
  blanket: new THREE.Vector3(11, 0, 31),
  grove: new THREE.Vector3(-25, 0, 6),
  lake: new THREE.Vector3(20, 0, 4),
  boat: new THREE.Vector3(12.5, 0, 10),
  hill: new THREE.Vector3(-23, 0, -24),
  telescope: new THREE.Vector3(-20, 0, -27),
  swing: new THREE.Vector3(-28, 0, -20),
  lighthouse: new THREE.Vector3(32, 0, -30),
  balloon: new THREE.Vector3(2, 0, -6),
  village: new THREE.Vector3(170, 0, -230),
};

export function islandHeight(x, z) {
  const r = Math.hypot(x * 0.95, z * 1.05);
  let h = 7 * (1 - sstep(18, 60, r)) - 3 * sstep(52, 72, r) + 0.6;
  h += 0.6 * Math.sin(x * 0.15 + 1) * Math.cos(z * 0.13) + 0.3 * Math.sin(x * 0.37 + z * 0.21);
  h += 9 * gauss(x, z, -24, -24, 13);
  h += 4 * gauss(x, z, 31, -30, 8);
  h -= 8.5 * gauss(x, z, 20, 4, 8.5);
  // meadow plateau
  const m = gauss(x, z, 2, 26, 14);
  h = h * (1 - m * 0.7) + 2.4 * m * 0.7;
  return h;
}

export function islandWalkable(x, z) {
  const h = islandHeight(x, z);
  if (h < 0.35) return false;
  // keep away from tree trunks / balloon basket loosely
  return true;
}

function terrainMesh() {
  const size = 160, seg = 80;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, islandHeight(pos.getX(i), pos.getZ(i)));
  const g = geo.toNonIndexed();
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  const cols = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const sand = new THREE.Color('#f2d29a'), wet = new THREE.Color('#d9b07a'), grass = new THREE.Color('#6fc464'), grass2 = new THREE.Color('#9fd46a'), rock = new THREE.Color('#b8a08a'), deep = new THREE.Color('#3f9a72'), under = new THREE.Color('#c4a27a');
  for (let f = 0; f < p.count; f += 3) {
    const y = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3;
    const x = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, z = (p.getZ(f) + p.getZ(f + 1) + p.getZ(f + 2)) / 3;
    const ny = (n.getY(f) + n.getY(f + 1) + n.getY(f + 2)) / 3;
    const nz = Math.sin(x * 1.7 + z * 2.3) * 0.5 + 0.5;
    if (y < 0.1) c.copy(under);
    else if (y < 0.7) c.copy(wet).lerp(sand, y / 0.7);
    else if (y < 1.2) c.copy(sand).lerp(grass, (y - 0.7) / 0.5);
    else c.copy(grass).lerp(grass2, nz * 0.6).lerp(deep, sstep(10, 17, y) * 0.5);
    if (ny < 0.8 && y > 1) c.lerp(rock, sstep(0.8, 0.6, ny));
    const k = 0.94 + nz * 0.08; c.multiplyScalar(k);
    for (let v = 0; v < 3; v++) cols.set([c.r, c.g, c.b], (f + v) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mesh = new THREE.Mesh(g, toon('#ffffff', { vertexColors: true }));
  mesh.receiveShadow = false;
  return mesh;
}

export function waterMesh(colors = { deep: '#3f7fb0', shallow: '#7fd0d0', sparkle: '#fff2c8', fog: '#f5b07a' }) {
  const geo = new THREE.PlaneGeometry(2400, 2400, 1, 1).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, fog: false,
    uniforms: { time: { value: 0 }, deep: { value: new THREE.Color(colors.deep) }, shallow: { value: new THREE.Color(colors.shallow) }, sparkle: { value: new THREE.Color(colors.sparkle) }, fogC: { value: new THREE.Color(colors.fog) }, fogFar: { value: colors.fogFar || 260 }, sun: { value: new THREE.Vector3(-0.8, 0.2, -0.5).normalize() } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      uniform float time, fogFar; uniform vec3 deep, shallow, sparkle, fogC, sun; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
      void main(){
        vec2 p = vW.xz;
        float d = length(cameraPosition - vW);
        float r = length(p * vec2(0.95, 1.05));
        float shore = 1.0 - smoothstep(46.0, 66.0, r);
        float lake = smoothstep(9.0, 3.0, length(p - vec2(20.0, 4.0)));
        vec3 c = mix(deep, shallow, max(shore * 0.85, lake * 0.7));
        // pixel wave stripes
        vec2 g = floor(p * 1.2);
        float w = sin(g.x * 0.35 + time * 1.2 + sin(g.y * 0.6) * 1.5) * sin(g.y * 0.5 - time * 0.9);
        c = mix(c, c * 1.18, step(0.82, w));
        // sun glint path
        vec3 v = normalize(vW - cameraPosition);
        vec3 rf = reflect(v, vec3(0.0, 1.0, 0.0));
        float s = pow(max(dot(rf, sun), 0.0), 60.0);
        float tw = step(0.55, hash(g + floor(time * 3.0)));
        c += sparkle * s * 1.6 * tw;
        // foam ring at shoreline
        float foam = smoothstep(0.6, 0.0, abs(r - 54.5 - sin(time * 0.8 + atan(p.y, p.x) * 6.0) * 0.8));
        c = mix(c, vec3(1.0, 0.98, 0.92), foam * 0.55 * step(0.5, hash(g)));
        c = mix(c, fogC, smoothstep(40.0, fogFar, d));
        gl_FragColor = vec4(c, 0.92);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.02;
  m.userData.uniforms = mat.uniforms;
  return m;
}

function tuftCanvas(cols) {
  const [c, x] = canvas(8, 12);
  const blade = (bx, h, col, lean) => { x.fillStyle = col; for (let j = 0; j < h; j++) x.fillRect(bx + Math.round(lean * j / h), 11 - j, 1, 1); };
  blade(1, 7, cols[0], -1); blade(3, 10, cols[1], 0); blade(4, 8, cols[2], 1); blade(6, 6, cols[0], 1); blade(2, 5, cols[2], 0);
  return c;
}

export function lighthouse() {
  const g = new THREE.Group();
  const white = toon('#fbf6ee'), red = toon('#e05a5a'), dark = toon('#3a3346');
  for (let i = 0; i < 6; i++) {
    const r0 = 2.2 - i * 0.22, r1 = 2.2 - (i + 1) * 0.22;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 2.2, 10), i % 2 ? red : white);
    m.position.y = 1.1 + i * 2.2; g.add(m);
  }
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.25, 10), dark); deck.position.y = 13.3; g.add(deck);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 8), new THREE.MeshBasicMaterial({ color: '#ffe9a8' })); glass.position.y = 14.1; g.add(glass);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.2, 8), red); cap.position.y = 15.4; g.add(cap);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.3), toon('#7a4a33')); door.position.set(0, 0.8, 2.1); g.add(door);
  // light beam
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2.2, 26, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.z = Math.PI / 2; beam.position.set(13, 14.1, 0);
  const pivot = new THREE.Group(); pivot.add(beam); g.add(pivot);
  g.userData.pivot = pivot; g.userData.glass = glass;
  return g;
}

export function balloonMesh(colors = ['#f08fa8', '#fff3e0', '#f6c45f', '#7f9fdc']) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(3.6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.78).toNonIndexed();
  const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 3) {
    const a = Math.atan2((pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3, (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3);
    const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % colors.length;
    c.set(colors[k]);
    for (let v = 0; v < 3; v++) col.set([c.r, c.g, c.b], (i + v) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // stretch to teardrop
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < 0) { const k = 1 + y / 3.6 * 0.45; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); } }
  geo.computeVertexNormals();
  const env = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true, flatShading: true }));
  env.position.y = 7.2; g.add(env);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), toon('#a8703f')); basket.position.y = 0.5; g.add(basket);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 1.6), toon('#7a4a33')); rim.position.y = 1.05; g.add(rim);
  const ropeMat = new THREE.LineBasicMaterial({ color: '#5a4030' });
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
    const geoL = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 1.05, z), new THREE.Vector3(x * 2.4, 4.6, z * 2.4)]);
    g.add(new THREE.Line(geoL, ropeMat));
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), new THREE.MeshBasicMaterial({ color: '#ffb84a' }));
  flame.position.y = 3.0; flame.visible = false; g.add(flame);
  const burner = new THREE.PointLight('#ffb060', 0, 12); burner.position.y = 3.2; g.add(burner);
  g.userData = { env, flame, burner };
  return g;
}

export function villageIsland() {
  const g = new THREE.Group();
  const land = new THREE.Mesh(new THREE.CylinderGeometry(34, 42, 6, 12), toon('#4f6a4a', { flatShading: true }));
  land.position.y = -2; g.add(land);
  const lightsPos = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2; const r = 6 + Math.random() * 24;
    const hx = Math.cos(a) * r, hz = Math.sin(a) * r;
    const hs = 2 + Math.random() * 2;
    const house = new THREE.Mesh(new THREE.BoxGeometry(hs, hs * 0.9, hs), toon(['#f3dcc0', '#fff1e0', '#e8c8a8'][i % 3]));
    house.position.set(hx, 1 + hs * 0.45, hz); g.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(hs * 0.85, hs * 0.7, 4), toon(['#c4587a', '#d96a5a', '#7f6fb0'][i % 3]));
    roof.position.set(hx, 1 + hs * 0.9 + hs * 0.35, hz); roof.rotation.y = Math.PI / 4; g.add(roof);
    for (let k = 0; k < 3; k++) lightsPos.push(new THREE.Vector3(hx + (Math.random() - 0.5) * 4, 2 + hs + Math.random() * 3, hz + (Math.random() - 0.5) * 4));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(lightsPos);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffcf6b', size: 3, sizeAttenuation: false, fog: false }));
  g.add(pts);
  const pagoda = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3, 12, 6), toon('#c4587a'));
  pagoda.position.y = 7; g.add(pagoda);
  g.userData.lights = pts;
  return g;
}

// Builds static island content into the world. Returns handles.
export function buildIsland(world, { pickable = true } = {}) {
  const S = world.scene;
  const terrain = terrainMesh(); S.add(terrain);
  const water = waterMesh({ deep: '#4f7fb5', shallow: '#86d6cc', sparkle: '#fff2c8', fog: '#f3b27e', fogFar: 300 });
  S.add(water);
  world.every((dt, t) => { water.userData.uniforms.time.value = t; });
  const H = islandHeight;
  const rnd = (() => { let s = 12345; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const at = (x, z) => new THREE.Vector3(x, H(x, z), z);

  // grass tufts
  const tufts = [];
  for (let i = 0; i < 4200; i++) {
    const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120; const h = H(x, z);
    if (h < 1.2 || h > 17) continue;
    if (Math.hypot(x - 20, z - 4) < 9) continue;
    tufts.push({ x, y: h, z, s: 0.7 + rnd() * 0.7 });
  }
  const tuft1 = instancedBillboards(tuftCanvas(['#6fa84a', '#8fc35a', '#a9d46a']), tufts.slice(0, tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  const tuft2 = instancedBillboards(tuftCanvas(['#7fb04f', '#9cc95f', '#c3d77a']), tufts.slice(tufts.length / 2), { size: 0.05, color: '#fff0d8' });
  S.add(tuft1, tuft2);
  world.every((dt, t) => { tuft1.userData.uniforms.time.value = t; tuft2.userData.uniforms.time.value = t; });

  // decorative flowers (instanced per type)
  const flowerMeshes = [];
  FLOWER_TYPES.forEach((ft, k) => {
    const list = [];
    for (let i = 0; i < 160; i++) {
      let x, z;
      if (rnd() < 0.6) { x = 2 + (rnd() - 0.5) * 34; z = 26 + (rnd() - 0.5) * 26; } else { x = (rnd() - 0.5) * 100; z = (rnd() - 0.5) * 100; }
      const h = H(x, z); if (h < 1.3) continue;
      list.push({ x, y: h, z, s: 0.9 + rnd() * 0.4 });
    }
    const m = instancedBillboards(flowerSprite(ft.species, ft.colors[k % 2 ? 0 : ft.colors.length - 1]), list, { size: 0.04, color: '#fff4e4' });
    S.add(m); flowerMeshes.push(m);
  });
  world.every((dt, t) => flowerMeshes.forEach((m) => { m.userData.uniforms.time.value = t; }));

  // trees
  const trees = [];
  const placeTree = (kind, x, z, h) => { const tr = lowTree(kind, h, Math.floor(rnd() * 1e6)); tr.position.copy(at(x, z)); tr.position.y -= 0.1; S.add(tr); trees.push(tr); return tr; };
  // cherry grove
  [[-22, 2], [-28, 8], [-31, 0], [-24, 12], [-19, 9], [-30, 15], [-17, 0], [-34, 6]].forEach(([x, z]) => placeTree('cherry', x, z, 4.2 + rnd() * 1.2));
  // round trees scattered
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2, r = 14 + rnd() * 34; const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const h = H(x, z); if (h < 1.6) continue;
    if (Math.hypot(x - SPOTS.meadow.x, z - SPOTS.meadow.z) < 12 || Math.hypot(x - 20, z - 4) < 11 || Math.hypot(x - SPOTS.balloon.x, z - SPOTS.balloon.z) < 8 || Math.hypot(x + 25, z - 6) < 12 || Math.hypot(x - 32, z + 30) < 7 || Math.hypot(x + 21, z + 26) < 6) continue;
    placeTree(rnd() < 0.25 ? 'pine' : rnd() < 0.3 ? 'golden' : 'round', x, z, 3 + rnd() * 2.5);
  }
  // swing tree on the hill
  const swingTree = placeTree('round', -29.5, -20, 6);
  world.every((dt, t) => trees.forEach((tr) => { tr.rotation.z = Math.sin(t * 0.9 + tr.userData.sway) * 0.015; }));

  // rocks
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, r = 30 + rnd() * 24; const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rnd() * 0.7, 0), toon(rnd() < 0.5 ? '#b8a894' : '#a0907e', { flatShading: true }));
    rock.position.copy(at(x, z)); rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); S.add(rock);
  }

  // dock at spawn
  const dock = new THREE.Group();
  for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.55), toon(i % 2 ? '#b5794a' : '#a8703f')); p.position.set(0, 0.55, 54 + i * 0.6); dock.add(p); }
  for (const z of [54, 57, 59]) for (const x of [-1.1, 1.1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6), toon('#7a4a33')); post.position.set(x, 0, z); dock.add(post); }
  S.add(dock);

  // lighthouse
  const lh = lighthouse(); lh.position.copy(at(SPOTS.lighthouse.x, SPOTS.lighthouse.z)); lh.position.y -= 0.3; S.add(lh);
  world.every((dt, t) => { lh.userData.pivot.rotation.y = t * 0.6; });

  // village far away
  const vil = villageIsland(); vil.position.copy(SPOTS.village); S.add(vil);

  // telescope
  const tele = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.1, 8), toon('#c9a24a')); tube.rotation.z = Math.PI / 2.6; tube.position.y = 1.25; tele.add(tube);
  for (let i = 0; i < 3; i++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 4), toon('#5a4030')); const a = i * 2.1; leg.position.set(Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.25); leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); tele.add(leg); }
  tele.position.copy(at(SPOTS.telescope.x, SPOTS.telescope.z)); tele.rotation.y = -0.9; S.add(tele);

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

  // boat
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.4), toon('#d9a066')); hull.position.y = 0.15; boat.add(hull);
  const hull2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 2.2), toon('#8a5a3a')); hull2.position.y = 0.36; boat.add(hull2);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 2.42), toon('#e05a7a')); stripe.position.y = 0.3; boat.add(stripe);
  boat.position.set(SPOTS.boat.x, 0, SPOTS.boat.z); boat.rotation.y = 0.6; S.add(boat);

  // balloon
  const balloon = balloonMesh(); balloon.position.copy(at(SPOTS.balloon.x, SPOTS.balloon.z)); S.add(balloon);
  world.every((dt, t) => { balloon.userData.env.position.y = 7.2 + Math.sin(t * 0.8) * 0.08; });

  return { terrain, water, trees, lighthouse: lh, village: vil, telescope: tele, swing, swingTree, blanket, boat, balloon, at, rnd };
}

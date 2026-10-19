// Chapter 12: the concert. A big hall, Hazei at a grand piano, a music-reactive
// light show, then the bouquet and the wish.
import content from '../content.js';
import { World3D, THREE, billboard, toon, pixelTex } from '../three/engine3d.js';
import { canvas, charSprite, LOOKS, flowerBig } from '../core/sprites.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { state } from '../core/state.js';
import { drawBouquet, wishParts, wishHTML, photoToAlbum } from '../core/photo.js';

const C = content.stage;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const STAGE_Y = 1.6;

function parseLRC(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const tags = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const words = line.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of tags) out.push({ t: +m[1] * 60 + +m[2], text: words });
  }
  return out.sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------- pieces
function beamMesh(color, len = 18, radius = 2.2) {
  const geo = new THREE.ConeGeometry(radius, len, 24, 1, true);
  geo.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: 0 }, len: { value: len } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; varying float vD; uniform float len; void main(){ vY = -position.y / len; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 color; uniform float intensity; varying float vY; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float a = intensity * pow(1.0 - vY, 1.2) * (0.25 + edge * 0.75) * 0.6 * smoothstep(2.0, 9.0, vD); gl_FragColor = vec4(color * a, a); }',
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 5;
  return m;
}

function grandPiano() {
  const g = new THREE.Group();
  const black = toon('#2e2b3c'), rim = toon('#4a4858'), gold = toon('#e8c070');
  // body: straight keyboard edge at z=0, curved tail toward +z
  const sh = new THREE.Shape();
  sh.moveTo(-0.78, 0); sh.lineTo(0.78, 0); sh.lineTo(0.78, 0.9);
  sh.quadraticCurveTo(0.7, 1.45, 0.25, 1.75); sh.quadraticCurveTo(0.0, 1.95, 0.0, 2.35);
  sh.lineTo(-0.78, 2.35); sh.lineTo(-0.78, 0);
  const body = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: false, curveSegments: 10 });
  body.rotateX(Math.PI / 2); body.translate(0, 1.0, 0); // shape y -> +z
  g.add(new THREE.Mesh(body, black));
  const top = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false, curveSegments: 10 });
  top.rotateX(Math.PI / 2); top.translate(0, 1.0, 0);
  const strip = new THREE.Mesh(top, rim); strip.position.y = -0.39; g.add(strip);
  // lid propped open on the right side
  const lidG = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false, curveSegments: 10 });
  lidG.rotateX(Math.PI / 2); lidG.translate(0.78, 0, 0);
  const lid = new THREE.Mesh(lidG, black); lid.position.set(-0.78, 1.03, 0); lid.rotation.z = -0.55; g.add(lid);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 4), gold); stick.position.set(-0.55, 1.3, 1.1); stick.rotation.z = 0.2; g.add(stick);
  // keyboard
  const [kc, kx] = canvas(52, 6);
  kx.fillStyle = '#fbf8f0'; kx.fillRect(0, 0, 52, 6);
  for (let i = 0; i < 52; i++) { kx.fillStyle = '#c8c0b4'; kx.fillRect(i, 0, 1, 6); }
  for (let i = 0; i < 52; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) { kx.fillStyle = '#1a1820'; kx.fillRect(i + 0.6, 0, 1, 3.6); }
  const keys = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.22), [rim, rim, new THREE.MeshLambertMaterial({ map: pixelTex(kc) }), rim, rim, rim]);
  keys.position.set(0, 0.72, -0.12); g.add(keys);
  const cheek = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.3), black); cheek.position.set(0, 0.64, -0.12); g.add(cheek);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.03), black); desk.position.set(0, 1.08, 0.25); desk.rotation.x = -0.25; g.add(desk);
  for (const [x, z] of [[-0.62, 0.12], [0.62, 0.12], [-0.4, 2.1]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.62, 6), black); leg.position.set(x, 0.31, z); g.add(leg); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 6), gold); cap.position.set(x, 0.02, z); g.add(cap); }
  const lyre = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.05), black); lyre.position.set(0, 0.32, 0.2); g.add(lyre);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.36), black); bench.position.set(0, 0.5, -0.62); g.add(bench);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.32), toon('#7a2a4a')); cushion.position.set(0, 0.56, -0.62); g.add(cushion);
  for (const [x, z] of [[-0.36, -0.48], [0.36, -0.48], [-0.36, -0.76], [0.36, -0.76]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.05), black); l.position.set(x, 0.24, z); g.add(l); }
  return g;
}

function micStand() {
  const g = new THREE.Group();
  const m = toon('#2a2a34');
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), m); g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), m); pole.position.y = 0.5; g.add(pole);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 5), m); boom.position.set(0.3, 1.05, 0); boom.rotation.z = -1.1; g.add(boom);
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.025, 0.16, 6), toon('#c0c4cc')); mic.position.set(0.64, 1.22, 0); mic.rotation.z = -1.1; g.add(mic);
  return g;
}

// an audience silhouette atlas (4 variants side by side), rim-lit on top
function crowdTexture() {
  const [c, x] = canvas(64, 20);
  const shapes = [[7, 6], [8, 7], [6, 6], [7, 5]];
  shapes.forEach(([hw, hh], i) => {
    const cx = i * 16 + 8;
    x.fillStyle = '#1c1530';
    x.fillRect(cx - 7, 11, 14, 9); x.fillRect(cx - 6, 10, 12, 1);
    x.fillRect(cx - hw / 2, 11 - hh - 1, hw, hh + 1); x.fillRect(cx - hw / 2 + 1, 11 - hh - 2, hw - 2, 1);
    if (i === 1) { x.fillRect(cx - 5, 3, 3, 4); x.fillRect(cx + 2, 3, 3, 4); } // buns
    if (i === 3) { x.fillRect(cx + 5, 2, 2, 8); } // raised arm
    x.fillStyle = '#5a4a8a';
    x.fillRect(cx - hw / 2 + 1, 11 - hh - 2, hw - 2, 1); x.fillRect(cx - 6, 10, 2, 1); x.fillRect(cx + 4, 10, 2, 1);
  });
  return pixelTex(c);
}

function screenCanvas() { const [c, x] = canvas(192, 80); return { c, x, tex: pixelTex(c) }; }

// ---------------------------------------------------------------- chapter
export default async function stage(game) {
  const world = new World3D(game, { hires: true, mode: 'rail', start: [0, 0, 20], bloom: 0.6, bloomThreshold: 0.8, fov: 55, inputMode: 'none' });
  const S = world.scene;
  world.setTime({ fog: '#0c0818', fogNear: 50, fogFar: 170, ambient: '#4a4a98', ambientI: 0.5, sun: '#8f9fff', sunI: 0.25, sunPos: [10, 30, 20], hemiSky: '#2a2a5a', hemiGround: '#0c0814', hemiI: 0.4 });
  world.grade.uniforms.vignette.value = 0.5;
  world.hideHands = true;
  const bg = new THREE.Mesh(new THREE.SphereGeometry(900, 8, 6), new THREE.MeshBasicMaterial({ color: '#07050e', side: THREE.BackSide, fog: false })); S.add(bg);

  // ---------------------------------------------------- the hall
  const W2 = 40, BACK = -22, FRONT = 92, CEIL = 34;
  const wallM = toon('#2a2040'), wallD = toon('#1c1630'), goldM = new THREE.MeshBasicMaterial({ color: '#e8b86a' });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, FRONT - BACK).rotateX(-Math.PI / 2), toon('#241a30')); floor.position.set(0, 0, (FRONT + BACK) / 2); S.add(floor);
  for (const sx of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, CEIL, FRONT - BACK), wallM); wall.position.set(sx * W2, CEIL / 2, (FRONT + BACK) / 2); S.add(wall);
    for (let z = 4; z < FRONT; z += 8) { // pilasters with warm light strips
      const pil = new THREE.Mesh(new THREE.BoxGeometry(1.6, CEIL, 1.4), wallD); pil.position.set(sx * (W2 - 0.8), CEIL / 2, z); S.add(pil);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.2, CEIL * 0.7, 0.2), goldM); strip.position.set(sx * (W2 - 1.65), CEIL * 0.45, z); S.add(strip);
      const sconce = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd8a0' })); sconce.position.set(sx * (W2 - 1.8), 6, z + 4); S.add(sconce);
    }
    // balconies
    for (const by of [9, 17]) {
      const bd = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 70), wallD); bd.position.set(sx * (W2 - 4.5), by, 46); S.add(bd);
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 70), toon('#5a2a3a')); front.position.set(sx * (W2 - 8.5), by + 0.9, 46); S.add(front);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 70), goldM); trim.position.set(sx * (W2 - 8.5), by + 1.5, 46); S.add(trim);
    }
  }
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W2 * 2, CEIL, 1), wallD); backWall.position.set(0, CEIL / 2, BACK); S.add(backWall);
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(W2 * 2, CEIL, 1), wallM); rearWall.position.set(0, CEIL / 2, FRONT); S.add(rearWall);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(W2 * 2, 1, FRONT - BACK), toon('#120c1e')); ceil.position.set(0, CEIL, (FRONT + BACK) / 2); S.add(ceil);
  const ceilPts = []; for (let i = 0; i < 500; i++) ceilPts.push((Math.random() - 0.5) * W2 * 1.9, CEIL - 0.6, BACK + 10 + Math.random() * (FRONT - BACK - 12));
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(ceilPts, 3));
  S.add(new THREE.Points(cg, new THREE.PointsMaterial({ color: '#ffe8c0', size: 2, sizeAttenuation: false, transparent: true, opacity: 0.7 })));
  for (const sx of [-1, 1]) { const ex = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.1), new THREE.MeshBasicMaterial({ color: '#3fe08a' })); ex.position.set(sx * 30, 4, FRONT - 0.6); S.add(ex); }

  // ---------------------------------------------------- the stage
  const deck = new THREE.Mesh(new THREE.BoxGeometry(36, STAGE_Y, 17), toon('#1a1424')); deck.position.set(0, STAGE_Y / 2, -8.5); S.add(deck);
  const deckTop = new THREE.Mesh(new THREE.BoxGeometry(36, 0.04, 17), toon('#1c1626')); deckTop.position.set(0, STAGE_Y + 0.02, -8.5); S.add(deckTop);
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, STAGE_Y, 32, 1, false, -Math.PI / 2, Math.PI), toon('#1a1424')); apron.position.set(0, STAGE_Y / 2, 0); S.add(apron);
  const apronTop = new THREE.Mesh(new THREE.CircleGeometry(9, 32, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), toon('#1c1626')); apronTop.position.set(0, STAGE_Y + 0.03, 0); S.add(apronTop);
  // LED edge strip along the stage front (chasing colours)
  const edgeN = 60; const edgeGeo = new THREE.BoxGeometry(0.55, 0.12, 0.12);
  const edge = new THREE.InstancedMesh(edgeGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), edgeN);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < edgeN; i++) {
    let x, z, rot = 0;
    if (i < 20) { x = -18 + i * 0.47; z = 0.05; } else if (i < 40) { const a = Math.PI - ((i - 20) / 19) * Math.PI; x = Math.cos(a) * 9.05; z = Math.sin(a) * 9.05; rot = -a + Math.PI / 2; } else { x = 9.1 + (i - 40) * 0.47; z = 0.05; }
    m4.makeRotationY(rot).setPosition(x, STAGE_Y - 0.15, z); edge.setMatrixAt(i, m4); edge.setColorAt(i, new THREE.Color('#ff6fb0'));
  }
  S.add(edge);
  // circular riser for the piano with a light ring
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.45, 32), toon('#2a2236')); riser.position.set(0, STAGE_Y + 0.22, -5.2); S.add(riser);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.06, 6, 48), new THREE.MeshBasicMaterial({ color: '#ffd8f0' })); ring.rotation.x = Math.PI / 2; ring.position.set(0, STAGE_Y + 0.44, -5.2); S.add(ring);
  const RISER_Y = STAGE_Y + 0.45;
  for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4 * (i + 1), 0.6), toon('#241c30')); st.position.set(13, 0.2 * (i + 1), 2.6 - i * 0.6); S.add(st); }
  // proscenium arch + curtains
  const prosM = toon('#3a1e30');
  for (const sx of [-1, 1]) { const pil = new THREE.Mesh(new THREE.BoxGeometry(3, 26, 3), prosM); pil.position.set(sx * 21, 13, -1.5); S.add(pil); const glow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 24, 0.25), goldM); glow.position.set(sx * 19.4, 13, 0); S.add(glow); }
  const header = new THREE.Mesh(new THREE.BoxGeometry(45, 3, 3), prosM); header.position.set(0, 25.5, -1.5); S.add(header);
  const headerGlow = new THREE.Mesh(new THREE.BoxGeometry(39, 0.25, 0.25), goldM); headerGlow.position.set(0, 23.9, 0); S.add(headerGlow);
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const cur = new THREE.Mesh(new THREE.BoxGeometry(0.7, 22, 0.7), toon(k % 2 ? '#7a1a3a' : '#8e2246')); cur.position.set(sx * (19 - k * 0.5), 12.5, -2.5 - k * 0.3); S.add(cur); }

  // big LED wall + two side screens
  const main = screenCanvas();
  const led = new THREE.Mesh(new THREE.PlaneGeometry(34, 14.2), new THREE.MeshBasicMaterial({ map: main.tex, fog: false, color: '#e8e0ee' })); led.position.set(0, 10.2, -16.6); S.add(led);
  const ledFrame = new THREE.Mesh(new THREE.BoxGeometry(35, 15.1, 0.4), toon('#0c0a12')); ledFrame.position.set(0, 10.2, -16.9); S.add(ledFrame);
  const side = canvas(48, 64); const sideTex = pixelTex(side[0]);
  for (const sx of [-1, 1]) {
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 8.8), new THREE.MeshBasicMaterial({ map: sideTex, fog: false })); scr.position.set(sx * 27, 13, 1); scr.rotation.y = -sx * 0.35; S.add(scr);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(7.2, 9.4, 0.3), toon('#0c0a12')); fr.position.copy(scr.position).add(new THREE.Vector3(sx * 0.05, 0, -0.2)); fr.rotation.y = scr.rotation.y; S.add(fr);
  }

  // trusses with moving heads
  const trussM = toon('#3a3a48');
  for (const z of [-2, -9, -15]) { const t = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 0.5), trussM); t.position.set(0, 18, z); S.add(t); }
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 18, 0.5), trussM); t.position.set(sx * 17, 9 + STAGE_Y, -9); S.add(t); }
  const palette = [['#ff6fb0', '#7fa0ff', '#ffd27a'], ['#b48aff', '#7fffd0', '#ff9a7a'], ['#ffffff', '#ffd27a', '#ff6fb0'], ['#5af0ff', '#b48aff', '#ff5aa8']];
  const beams = [];
  for (const [z, n] of [[-2, 9], [-9, 7]]) for (let i = 0; i < n; i++) {
    const b = beamMesh('#ffffff', 24, 2.6); b.position.set(-15 + (30 / (n - 1)) * i, 17.6, z);
    b.userData = { base: ((i / (n - 1)) - 0.5) * 0.7, ph: i * 1.1 + z, row: z, on: 0 };
    const fx = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); fx.position.copy(b.position).add(new THREE.Vector3(0, 0.2, 0)); S.add(fx);
    b.userData.fixture = fx; S.add(b); beams.push(b);
  }
  const fans = [];
  for (let i = 0; i < 8; i++) { const b = beamMesh('#ffffff', 30, 1.4); b.position.set(-14 + i * 4, STAGE_Y + 0.4, -14.5); b.rotation.x = Math.PI; b.userData = { ph: i * 0.8, on: 0 }; S.add(b); fans.push(b); }
  const lasers = [];
  const laserCols = ['#5aff8a', '#5af0ff', '#ff5aa8', '#b48aff'];
  for (let i = 0; i < 12; i++) {
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 110, 4); geo.translate(0, 55, 0);
    const l = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: laserCols[i % 4], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    l.position.set(-8 + (i % 6) * 3.2, STAGE_Y + 3 + (i < 6 ? 0 : 6), -15); l.rotation.x = Math.PI / 2; l.userData = { ph: i * 0.7 }; S.add(l); lasers.push(l);
  }
  // follow spot from the back of the hall
  const follow = beamMesh('#fff4e0', 96, 1.4); follow.position.set(0, 26, 84); S.add(follow);
  const key = new THREE.SpotLight('#fff0e0', 0, 120, 0.12, 0.5, 1); key.position.set(0, 26, 84); S.add(key, key.target);
  const wash = new THREE.PointLight('#ff8ab0', 0, 30); wash.position.set(-6, 8, -4); S.add(wash);
  const wash2 = new THREE.PointLight('#7fa0ff', 0, 30); wash2.position.set(6, 8, -4); S.add(wash2);
  const houseL = new THREE.PointLight('#ffd8a0', 30, 90, 1.2); houseL.position.set(0, 20, 40); S.add(houseL);
  const sideA = new THREE.PointLight('#ff6fb0', 20, 60, 1.2); sideA.position.set(-30, 14, 40); const sideB = new THREE.PointLight('#7fa0ff', 20, 60, 1.2); sideB.position.set(30, 14, 40); S.add(sideA, sideB);

  // ---------------------------------------------------- piano + Hazei + Mino
  const piano = grandPiano(); piano.position.set(0, RISER_Y, -5.6); S.add(piano);
  const mic = micStand(); mic.position.set(-0.9, RISER_Y, -6.0); S.add(mic);
  const hazei = billboard(charSprite(LOOKS.hazei(), { pose: 'piano', mood: 'normal' }), 0.045); hazei.position.set(0, RISER_Y + 0.22, -6.2); hazei.visible = false; S.add(hazei);
  hazei.material.color.set('#f0e6ee');
  const partner = billboard(charSprite(LOOKS.partner(), { pose: 'sit', mood: 'happy' }), 0.06); partner.position.set(0.8, 0.0, 10.4); partner.material.color.set('#d8cce0'); S.add(partner);

  // ---------------------------------------------------- audience (instanced silhouettes on raked tiers)
  const ROWS = 34, ROW0 = 11;
  const rowY = (r) => r * 0.42;
  const tierGeo = new THREE.BoxGeometry(70, 1, 1.25); tierGeo.translate(0, -0.5, 0);
  const tiers = new THREE.InstancedMesh(tierGeo, toon('#1e1428'), ROWS);
  const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(70, 0.5, 0.25), toon('#5a1a30'), ROWS);
  for (let r = 0; r < ROWS; r++) { m4.makeScale(1, rowY(r) + 0.02, 1).setPosition(0, rowY(r), ROW0 + r * 1.25); tiers.setMatrixAt(r, m4); m4.makeTranslation(0, rowY(r) + 0.3, ROW0 + r * 1.25 + 0.5); seats.setMatrixAt(r, m4); }
  S.add(tiers, seats);
  const people = [];
  for (let r = 0; r < ROWS; r++) for (let x = -32; x <= 32; x += 0.85) {
    if (r === 0 && Math.abs(x - 0.8) < 1) continue;
    if (Math.random() < 0.08) continue;
    people.push([x + (Math.random() - 0.5) * 0.3, rowY(r), ROW0 + r * 1.25 + 0.15, Math.floor(Math.random() * 4), 0]);
  }
  for (const sx of [-1, 1]) for (const by of [9, 17]) for (let z = 14; z < 80; z += 0.9) for (const dx of [0, 1.2, 2.4]) if (Math.random() < 0.85) people.push([sx * (W2 - 7.5 + dx), by + 0.3 + dx * 0.25, z, Math.floor(Math.random() * 4), sx]);
  const crowdGeo = new THREE.PlaneGeometry(0.9, 1.15); crowdGeo.translate(0, 0.575, 0);
  const crowdMat = new THREE.MeshBasicMaterial({ map: crowdTexture(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const crowdU = { time: { value: 0 }, energy: { value: 0.3 } };
  crowdMat.onBeforeCompile = (sh) => {
    sh.uniforms.time = crowdU.time; sh.uniforms.energy = crowdU.energy;
    sh.vertexShader = 'uniform float time; uniform float energy; attribute float variant;\n' + sh.vertexShader
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vec2((uv.x + variant) * 0.25, uv.y);')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 ip = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
        float ph = ip.x * 1.7 + ip.z * 0.9;
        transformed.x += sin(time * (1.4 + energy) + ph) * 0.12 * energy * (position.y / 1.15);
        transformed.y += max(0.0, sin(time * 4.0 + ph)) * 0.08 * energy;`);
  };
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, people.length);
  const variant = new Float32Array(people.length);
  people.forEach(([x, y, z, v, sx], i) => { m4.makeRotationY(sx ? -sx * Math.PI / 2 * 0.7 : 0).setPosition(x, y, z); crowd.setMatrixAt(i, m4); variant[i] = v; });
  crowdGeo.setAttribute('variant', new THREE.InstancedBufferAttribute(variant, 1));
  S.add(crowd);
  const stickIdx = people.map((_, i) => i).filter(() => Math.random() < 0.55);
  const stickPos = new Float32Array(stickIdx.length * 3), stickCol = new Float32Array(stickIdx.length * 3);
  const stickColors = ['#ff6fb0', '#7fe0ff', '#ffe066', '#b48aff', '#ffffff', '#7dff9a'];
  stickIdx.forEach((p, i) => { const c = new THREE.Color(stickColors[i % stickColors.length]); stickCol.set([c.r, c.g, c.b], i * 3); });
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(stickPos, 3)); sgeo.setAttribute('color', new THREE.BufferAttribute(stickCol, 3));
  S.add(new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95 })));

  // haze sheets drifting through the light
  const [hc, hx] = canvas(64, 64);
  for (let i = 0; i < 40; i++) { const g = hx.createRadialGradient(Math.random() * 64, Math.random() * 64, 0, Math.random() * 64, Math.random() * 64, 10 + Math.random() * 20); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); hx.fillStyle = g; hx.fillRect(0, 0, 64, 64); }
  const hazeTex = new THREE.CanvasTexture(hc);
  const hazes = [];
  for (let i = 0; i < 6; i++) { const hz = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), new THREE.MeshBasicMaterial({ map: hazeTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, color: '#b8a8ff' })); hz.position.set(0, 6 + i * 2, -10 + i * 6); hz.userData.ph = i; S.add(hz); hazes.push(hz); }

  // ---------------------------------------------------- screens
  let analyser = null, freq = null; const energy = { bass: 0, mid: 0, high: 0 };
  let lightsOn = 0, songPlaying = false, songF = 0, crowdEnergy = 0.3, scrT = 0;
  const drawMain = (t, e, f) => {
    const { x } = main; const W = 192, H = 80;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a2a'); g.addColorStop(1, '#3a1a4a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const sec = !songPlaying ? 0 : f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : 3;
    if (sec === 0) {
      for (let i = 0; i < 70; i++) { const tw = (Math.sin(t * 2 + i * 7.3) + 1) / 2; x.fillStyle = `rgba(255,248,230,${0.3 + tw * 0.7})`; x.fillRect((i * 53) % W, (i * 29) % (H - 10), 1, 1); }
      x.fillStyle = '#fff3d0'; for (let j = -9; j <= 9; j++) { const w = Math.round(Math.sqrt(81 - j * j)); x.fillRect(150 - w, 22 + j, w * 2, 1); }
    }
    if (sec === 1) for (let i = 0; i < 48; i++) { const v = freq ? freq[2 + i * 3] / 255 : 0; const h = Math.round(v * 60); x.fillStyle = `hsl(${(i * 7 + t * 40) % 360},90%,65%)`; x.fillRect(i * 4, H - h, 3, h); }
    if (sec === 2) for (let i = 0; i < 9; i++) { const k = ((t * 0.3 + i * 0.11) % 1); const img = flowerBig(['daisy', 'cosmos', 'tulip', 'sunflower', 'bluebell'][i % 5], ['#ffffff', '#f59ac0', '#f06d8a', '#ffd23f', '#7fa7f0'][i % 5]); const s = Math.round(20 + k * 26 + e * 8); x.globalAlpha = 1 - k * 0.6; x.drawImage(img, (i * 23 + 6) % (W - 20) - s / 2 + 10, H * 0.55 - s / 2 - Math.sin(i) * 14, s, s); x.globalAlpha = 1; }
    if (sec === 3) { const cx = W / 2, cy = H / 2; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2 + t * 0.4; const r = 10 + e * 50 + (i % 2) * 10; x.strokeStyle = `hsl(${(i * 11 + t * 60) % 360},90%,70%)`; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * r * 1.6, cy + Math.sin(a) * r); x.stroke(); } }
    x.font = '22px VT323'; x.textAlign = 'center';
    x.fillStyle = 'rgba(30,10,40,.7)'; x.fillText(C.screenTitle, W / 2 + 1, 34); x.fillStyle = '#ffd7e0'; x.fillText(C.screenTitle, W / 2, 33);
    x.font = '12px VT323'; x.fillStyle = '#e8d8ff'; x.fillText(C.screenSub, W / 2, 46);
    main.tex.needsUpdate = true;
  };
  const drawSide = (t, e) => {
    const [, x] = side; x.fillStyle = '#1a1030'; x.fillRect(0, 0, 48, 64);
    const g = x.createRadialGradient(24, 30, 4, 24, 30, 40); g.addColorStop(0, `rgba(255,140,200,${0.35 + e * 0.5})`); g.addColorStop(1, 'rgba(40,20,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 48, 64);
    const spr = hazei.material.map.image;
    x.imageSmoothingEnabled = false; x.drawImage(spr, 2, 0, 20, 22, 4, 6, 40, 44);
    x.fillStyle = 'rgba(0,0,0,.25)'; for (let j = 0; j < 64; j += 2) x.fillRect(0, j, 48, 1);
    x.fillStyle = '#ff4a4a'; if (Math.floor(t * 2) % 2) x.fillRect(3, 3, 3, 3);
    sideTex.needsUpdate = true;
  };

  // ---------------------------------------------------- camera rig
  const cam = world.camera;
  const look = new THREE.Vector3(0, 3, -5);
  const camPos = new THREE.Vector3(-15, STAGE_Y + 1.6, -8);
  const setCam = (p, l) => { camPos.copy(p); look.copy(l); };
  world.opts.update = () => { cam.position.copy(camPos); cam.lookAt(look); };

  // ---------------------------------------------------- music-reactive loop
  world.every((dt, t) => {
    if (analyser) {
      analyser.getByteFrequencyData(freq);
      const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += freq[i]; return s / ((b - a) * 255); };
      const tgt = { bass: avg(1, 8), mid: avg(8, 60), high: avg(60, 200) };
      for (const k in energy) energy[k] += (tgt[k] - energy[k]) * Math.min(1, dt * 12);
    } else for (const k in energy) energy[k] *= 0.95;
    const sec = songF < 0.25 ? 0 : songF < 0.5 ? 1 : songF < 0.75 ? 2 : 3;
    const cols = palette[songPlaying ? sec : 0];
    const climax = songPlaying && songF > 0.72 && songF < 0.92;
    beams.forEach((b, i) => {
      const u = b.userData;
      b.material.uniforms.color.value.set(cols[i % 3]);
      b.material.uniforms.intensity.value = u.on * (0.45 + (songPlaying ? energy.bass * 1.1 + Math.max(0, Math.sin(t * 2 + u.ph)) * 0.25 : 0));
      const swing = songPlaying ? 0.25 + energy.mid * 0.5 : 0.06;
      b.rotation.z = u.base + Math.sin(t * (0.5 + energy.mid) + u.ph) * swing;
      b.rotation.x = (u.row === -2 ? -0.55 : 0.25) + Math.cos(t * 0.35 + u.ph) * swing * 0.6;
      u.fixture.material.color.set(cols[i % 3]); u.fixture.visible = u.on > 0.1;
    });
    fans.forEach((b, i) => { b.material.uniforms.color.value.set(cols[(i + 1) % 3]); b.material.uniforms.intensity.value = b.userData.on * (songPlaying ? 0.35 + energy.bass * 0.8 : 0.2); b.rotation.z = Math.sin(t * 0.8 + b.userData.ph) * 0.45; b.rotation.x = Math.PI + Math.cos(t * 0.6 + b.userData.ph) * 0.25 - 0.25; });
    lasers.forEach((l) => { const on = songPlaying && (sec >= 2 || climax) ? Math.min(1, energy.bass * 1.6) : 0; l.material.opacity = on * 0.75; l.rotation.z = Math.sin(t * 0.9 + l.userData.ph) * 0.5; l.rotation.x = Math.PI / 2 - 0.12 - Math.abs(Math.sin(t * 0.5 + l.userData.ph)) * 0.18; });
    follow.material.uniforms.intensity.value = lightsOn * 0.35;
    follow.lookAt(hazei.position); follow.rotateX(-Math.PI / 2);
    key.target.position.copy(hazei.position); key.intensity = lightsOn * 380;
    wash.intensity = lightsOn * (30 + energy.bass * 90); wash2.intensity = lightsOn * (25 + energy.high * 90);
    wash.color.set(cols[0]); wash2.color.set(cols[1]);
    houseL.intensity = Math.max(10, 30 * (1 - lightsOn)); sideA.intensity = sideB.intensity = 20 + energy.bass * 60; sideA.color.set(cols[2]); sideB.color.set(cols[0]);
    world.bloom.strength = 0.55 + energy.bass * 0.7 + (climax ? 0.2 : 0);
    for (let i = 0; i < edgeN; i++) edge.setColorAt(i, new THREE.Color().setHSL(((i / edgeN) + t * 0.25) % 1, 0.9, 0.55 + (songPlaying ? energy.bass * 0.3 : 0)));
    edge.instanceColor.needsUpdate = true;
    ring.material.color.setHSL((t * 0.1) % 1, 0.6, 0.75 + energy.bass * 0.2);
    crowdEnergy += ((songPlaying ? 0.55 + energy.bass * 1.2 : 0.25) - crowdEnergy) * Math.min(1, dt * 2);
    crowdU.time.value = t; crowdU.energy.value = crowdEnergy;
    stickIdx.forEach((p, i) => { const [x, y, z] = people[p]; const ph = x * 1.7 + z * 0.9; stickPos.set([x + Math.sin(t * (1.4 + crowdEnergy) + ph) * 0.35 * crowdEnergy + 0.25, y + 1.45 + Math.max(0, Math.sin(t * 4 + ph)) * 0.08 * crowdEnergy + Math.cos(t * 3 + ph) * 0.12 * crowdEnergy, z], i * 3); });
    sgeo.attributes.position.needsUpdate = true;
    hazes.forEach((h) => { h.position.x = Math.sin(t * 0.05 + h.userData.ph) * 6; h.material.opacity = 0.02 + lightsOn * 0.03; });
    if (lightsOn > 0 && Math.random() < dt * (10 + energy.high * 40)) world.glow.emit(new THREE.Vector3((Math.random() - 0.5) * 30, STAGE_Y + 1 + Math.random() * 14, -14 + Math.random() * 16), new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.05, 0), '#fff2d8', 4, { kind: 3 });
    if (songPlaying && Math.random() < dt * (2 + energy.bass * 8)) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 30, 17, -12 + Math.random() * 14), new THREE.Vector3(0.2, -0.7, 0), ['#ffc2d4', '#ffd9e4', '#fff0f5', '#ffe9a8'][Math.floor(Math.random() * 4)], 12, { kind: 1 });
    if (climax && Math.random() < dt * 60) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 50, 30, 5 + Math.random() * 40), new THREE.Vector3((Math.random() - 0.5), -2.2, 0), ['#ff6fb0', '#ffe066', '#7fe0ff', '#b48aff', '#ffffff', '#7dff9a'][Math.floor(Math.random() * 6)], 10, { kind: 1, size: 3 });
    if (climax && energy.bass > 0.5) for (const sx of [-16, -10, 10, 16]) if (Math.random() < dt * 30) world.glow.emit(new THREE.Vector3(sx, STAGE_Y + 0.3, -0.6), new THREE.Vector3((Math.random() - 0.5) * 1.2, 7 + Math.random() * 4, (Math.random() - 0.5) * 1.2), Math.random() < 0.5 ? '#ffe9a8' : '#ffb04a', 1.1, { kind: 2, size: 3 });
    scrT -= dt; if (scrT <= 0) { scrT = 1 / 15; drawMain(t, energy.bass, songF); drawSide(t, energy.bass); }
  });

  audio.scene(null, [['crowd', 0.5]]);
  const fin = world.start();
  await game.enter({ dark: true });

  // ---------------------------------------------------- step onto the stage (from the wings)
  setCam(new THREE.Vector3(-16.5, STAGE_Y + 1.6, -7), new THREE.Vector3(0, STAGE_Y + 1.2, -6));
  await new Promise((resolve) => { world.interact.add({ always: true, label: content.prompts.stage, hold: 0.6, onDone: resolve }); });
  world.interact.clear();
  audio.sfx('whoosh');
  hazei.visible = true; hazei.material.transparent = true; hazei.material.opacity = 0;
  {
    const from = camPos.clone(), to = new THREE.Vector3(0, 22, 66);
    const lf = look.clone(), lt = new THREE.Vector3(0, 6, -6);
    for (let k = 0; k <= 1; k += 1 / 110) { setCam(from.clone().lerp(to, ease(k)).add(new THREE.Vector3(Math.sin(k * Math.PI) * -18, Math.sin(k * Math.PI) * 6, 0)), lf.clone().lerp(lt, ease(k))); hazei.material.opacity = Math.min(1, k * 2); await wait(16); }
  }
  hazei.material.opacity = 1;
  ui.note(C.intro, 3000);
  audio.setBeds([['crowd', 0.25]], 3);
  for (let i = 0; i < beams.length; i++) { beams[i].userData.on = 1; if (i % 2 === 0) audio.sfx('pop', { pitch: i }); await wait(140); }
  fans.forEach((f) => { f.userData.on = 1; });
  lightsOn = 1;
  await wait(900);

  // ---------------------------------------------------- song
  const buf = await audio.songBuffer();
  if (audio.songIsFallback) ui.note(content.ui.songMissing, 3500);
  if (audio.ctx.state !== 'running') {
    await new Promise((r) => { ui.actions([{ label: '▶ ' + content.ui.tapToPlay, cls: '', onClick: () => { audio.resume(); r(); } }]); });
    ui.actions(null);
  }
  let lyrics = [];
  try { const r = await fetch(content.song.lyrics); if (r.ok) lyrics = parseLRC(await r.text()); } catch { /* optional */ }
  audio.setBeds([], 2); audio.playMusic(null, 1.5);
  const fast = game.debug && new URLSearchParams(location.search).has('fast');
  const song = audio.playSong(buf);
  analyser = song.analyser; freq = new Uint8Array(analyser.frequencyBinCount);
  songPlaying = true;
  const RY = (y) => RISER_Y + y;
  const keys = [
    [0.0, [0, 22, 66], [0, 5, -6]],
    [0.1, [0, 13, 28], [0, RY(1.2), -6]],
    [0.2, [-22, 12, 20], [0, RY(1), -6]],
    [0.3, [5, RY(1.5), -3.6], [0, RY(0.9), -6.2]],
    [0.4, [1.6, RY(1.4), -2.4], [0, RY(0.95), -6.2]],
    [0.5, [0, 24, 6], [0, RY(0.5), -6]],
    [0.6, [8, RY(2.4), 6], [0, RY(1.0), -6]],
    [0.72, [0, 28, 84], [0, 6, -4]],
    [0.86, [18, 10, 30], [0, RY(1), -6]],
    [1.0, [0.8, RY(1.6), 0.5], [0, RY(0.95), -6.2]],
  ].map(([f, p, l]) => [f, new THREE.Vector3(...p), new THREE.Vector3(...l)]);
  let lyricIdx = -1; let mouthOpen = false, mouthT = 0;
  // debug only: seek buttons in the debug panel so the song needn't be heard in full
  const seekBar = game.debug ? document.getElementById('debug') : null;
  const seekBtns = seekBar ? [['⏪ 10s', -10], ['⏩ 10s', 10], ['⏩ 30s', 30], ['⏭ cuối bài', Infinity]].map(([label, d]) => {
    const b = el('button', 'seek', label);
    b.onclick = () => song.seek(d === Infinity ? song.duration - 4 : song.time + d);
    seekBar.appendChild(b); return b;
  }) : [];
  await new Promise((resolve) => {
    const stop = world.every((dt, t) => {
      const st = fast ? Math.min(song.time * (song.duration / 12), song.duration) : song.time;
      const f = songF = game.debugSongF ?? Math.min(1, Math.max(0, st / song.duration)); // debugSongF: jump the camera (debug only)
      let i = 0; while (i < keys.length - 2 && keys[i + 1][0] < f) i++;
      const [f0, p0, l0] = keys[i], [f1, p1, l1] = keys[i + 1];
      const k = ease(Math.min(1, (f - f0) / (f1 - f0)));
      setCam(p0.clone().lerp(p1, k).add(new THREE.Vector3(Math.sin(t * 0.4) * 0.2, Math.sin(t * 0.33) * 0.1, 0)), l0.clone().lerp(l1, k));
      // mouth: open/close at a relaxed, syllable-like pace while she sings
      mouthT -= dt;
      if (mouthT <= 0) {
        if (energy.mid > 0.26) { mouthOpen = !mouthOpen; mouthT = mouthOpen ? 0.34 + Math.random() * 0.16 : 0.18 + Math.random() * 0.1; }
        else { mouthOpen = false; mouthT = 0.2; }
      }
      const open = mouthOpen;
      // pick the view that matches where the camera is: from high above we
      // see the top of her head, from behind her back
      const v = camPos.clone().sub(hazei.position);
      const elev = Math.atan2(v.y, Math.hypot(v.x, v.z));
      const view = elev > 0.8 ? { top: true } : v.z < -0.3 ? { back: true } : {};
      hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'piano', frame: Math.floor(t * (1.6 + energy.mid * 1.6)), mood: open ? (energy.bass > 0.6 ? 'singHappy' : 'sing') : (Math.sin(t * 0.7) > 0.9 ? 'closed' : 'normal'), ...view }));
      partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'sitwave', frame: Math.floor(t * (f > 0.72 && f < 0.92 ? 1.5 : 1.0)), mood: 'happy' })); // slow wave along with the song
      if (lyrics.length) { let j = lyrics.length - 1; while (j >= 0 && lyrics[j].t > st) j--; if (j !== lyricIdx) { lyricIdx = j; ui.lyrics(j >= 0 ? lyrics[j].text : ''); } }
      if ((fast && song.time >= 12) || song.time >= song.duration + 0.3) { stop(); resolve(); }
    });
  });
  if (fast) song.stop();
  seekBtns.forEach((b) => b.remove());
  songPlaying = false; ui.lyrics('');

  // ---------------------------------------------------- applause, bouquet, wish
  audio.sfx('applause'); audio.setBeds([['crowd', 0.9]], 0.5);
  ui.note(C.applause, 3500);
  for (let i = 0; i < 300; i++) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 60, 28 + Math.random() * 4, Math.random() * 50 - 10), new THREE.Vector3(0.2, -1.6 - Math.random(), 0), ['#ffc2d4', '#ffe066', '#7fe0ff', '#b48aff', '#ffffff', '#f08fa8'][i % 6], 14, { kind: 1, size: 3 });
  hazei.userData.px = 0.058; // standing up: normal character scale
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'cheer', mood: 'happy' }));
  hazei.position.y = RISER_Y;
  setCam(new THREE.Vector3(6, 7, 26), new THREE.Vector3(0, RY(1), -4));
  await wait(1200);
  for (let k = 0; k <= 1; k += 1 / 50) { hazei.position.lerpVectors(new THREE.Vector3(0.9, RISER_Y, -6.2), new THREE.Vector3(-0.6, STAGE_Y, 0.4), k); if (k > 0.6) hazei.position.y = STAGE_Y; else hazei.position.y = RISER_Y; hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'walk', frame: Math.floor(k * 12) % 4, mood: 'happy' })); await wait(20); }
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'idle', mood: 'happy' }));
  // the audience takes photos: camera flashes and clicks all over the hall
  await wait(500);
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'cheer', mood: 'happy' }));
  setCam(new THREE.Vector3(0, 27, 58), new THREE.Vector3(0, STAGE_Y + 1, 4));
  const near = people.filter((p) => p[2] < 52);
  for (let i = 0; i < 46; i++) {
    const [px, py, pz] = near[Math.floor(Math.random() * near.length)];
    world.glow.emit(new THREE.Vector3(px, py + 1.4, pz), new THREE.Vector3(), '#ffffff', 0.2, { size: 10 });
    // and a crisp glint on screen over the audience, so each flash reads through the confetti
    const g = el('div', 'cam-glint'); g.style.left = (4 + Math.random() * 92) + '%'; g.style.top = (56 + Math.random() * 40) + '%';
    game.stage.appendChild(g); setTimeout(() => g.remove(), 420);
    if (i % 2 === 0) audio.sfx('snap');
    await wait(50 + Math.random() * 110);
  }
  // one of those photos, from the front row
  setCam(new THREE.Vector3(-0.5, STAGE_Y + 1.4, 7), new THREE.Vector3(-0.6, STAGE_Y + 1.0, 0.4));
  cam.position.copy(camPos); cam.lookAt(look);
  const stageShot = world.snap();
  audio.sfx('shutter'); ui.flash();
  await photoToAlbum(stageShot, { caption: C.stageCaption, title: C.stagePhoto });
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'idle', mood: 'happy' }));
  const path = [new THREE.Vector3(0.8, 0, 10.4), new THREE.Vector3(13, 0, 6), new THREE.Vector3(13, 0, 3.4), new THREE.Vector3(13, STAGE_Y, 0.4), new THREE.Vector3(0.7, STAGE_Y, 0.4)];
  for (let s = 0; s < path.length - 1; s++) {
    const a = path[s], b = path[s + 1]; const steps = Math.ceil(a.distanceTo(b) / 0.07);
    for (let k = 1; k <= steps; k++) {
      partner.position.lerpVectors(a, b, k / steps);
      partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'walk', frame: Math.floor(k / 4) % 4, mood: 'happy' }), b.x < a.x);
      setCam(new THREE.Vector3(4, 6, 20), partner.position.clone().lerp(new THREE.Vector3(0, STAGE_Y + 1.2, 0.4), 0.5).add(new THREE.Vector3(0, 0.8, 0)));
      await wait(16);
    }
  }
  partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'bouquet', mood: 'happy' }), true);
  setCam(new THREE.Vector3(0.05, STAGE_Y + 1.45, 5.2), new THREE.Vector3(0.05, STAGE_Y + 1.1, 0.4));
  audio.setBeds([['crowd', 0.3]], 2);
  audio.playMusic('hill', 3);
  await wait(900);
  await ui.dialog([{ who: 'partner', text: C.bouquetLine }]);
  const bq = drawBouquet(state.data.flowers, 288);
  if (bq.flowers.some((f) => f.gift)) await ui.dialog([{ who: 'partner', text: C.giftNote }]);
  partner.setCanvas(charSprite(LOOKS.partner(), { pose: 'idle', mood: 'happy' }), true);
  hazei.setCanvas(charSprite(LOOKS.hazei(), { pose: 'bouquet', mood: 'happy' }));
  audio.sfx('yay'); audio.sfx('sparkle');
  for (let k = 0; k < 18; k++) world.glow.emit(new THREE.Vector3(-0.3 + (Math.random() - 0.5), STAGE_Y + 1.6 + Math.random(), 0.6), new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.8, 0), ['#ff8fb0', '#ffe9a8', '#bfe0ff'][k % 3], 2);
  // a moment together: Hazei holding the flowers, Mino beside her, then a photo for the album
  setCam(new THREE.Vector3(0.05, STAGE_Y + 1.4, 6.2), new THREE.Vector3(0.05, STAGE_Y + 1.0, 0.4));
  await wait(3000);
  cam.position.copy(camPos); cam.lookAt(look);
  const bouquetShot = world.snap();
  audio.sfx('shutter'); ui.flash();
  await photoToAlbum(bouquetShot, { caption: C.bouquetCaption, title: C.bouquetPhoto });
  await wait(1500);
  await new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2 class="center">${esc(content.epilogue.bouquetLabel)}</h2><p class="sub center">${esc(C.happy)}</p>`);
      bq.canvas.className = 'photo-preview'; bq.canvas.style.width = 'min(288px, 70vw)'; bq.canvas.style.background = 'radial-gradient(#ffe9f0, #ffd2df)'; bq.canvas.style.borderRadius = '12px';
      s.appendChild(bq.canvas);
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const b = el('button', 'btn', esc(content.ui.next)); b.onclick = () => ui.closeModal(); row.appendChild(b); s.appendChild(row);
    }, { closeable: false });
  });
  const wp = wishParts(state.data);
  await new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2 class="center">${esc(C.wishTitle)}</h2>` + wishHTML(wp, 0.9));
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const b = el('button', 'btn', esc(C.toEpilogue)); b.onclick = () => ui.closeModal(); row.appendChild(b); s.appendChild(row);
      b.style.opacity = '0'; b.style.transition = 'opacity .8s'; setTimeout(() => { b.style.opacity = '1'; }, 7500);
    }, { closeable: false });
  });
  // linger on the two of them while the camera slowly eases back
  const from = camPos.clone(), to = new THREE.Vector3(0.05, STAGE_Y + 2.6, 13);
  for (let k = 0; k <= 1; k += 1 / 180) {
    const e = k * k * (3 - 2 * k);
    setCam(from.clone().lerp(to, e), new THREE.Vector3(0.05, STAGE_Y + 1.0 + e * 0.3, 0.4));
    if (Math.random() < 0.3) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 16, STAGE_Y + 9, Math.random() * 6 - 2), new THREE.Vector3(0.1, -1.2, 0), ['#ffc2d4', '#ffe066', '#7fe0ff', '#ffffff'][Math.floor(Math.random() * 4)], 10, { kind: 1, size: 3 });
    await wait(25);
  }
  await wait(1500);
  await game.leave(world, { dark: true, ms: 1400 });
  await fin;
  audio.stopAll(2);
}

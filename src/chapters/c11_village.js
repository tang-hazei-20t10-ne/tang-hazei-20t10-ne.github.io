// Chapter 11: lantern festival village at night, gentle never-fail games.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard, toon, pixelTex } from '../three/engine3d.js';
import { canvas, charSprite, LOOKS, fishSprite, mix, shade, light, emoteSprite } from '../core/sprites.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { Guide } from '../three/guide.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { state } from '../core/state.js';

const C = content.village;
const P = content.prompts;
const LANTERN_COLS = ['#ff5a5a', '#ff9a3a', '#ff7aa8', '#ffb83a', '#e85a8a'];

function cobbleTex() {
  const [c, x] = canvas(32, 32);
  x.fillStyle = '#4a4058'; x.fillRect(0, 0, 32, 32);
  for (let j = 0; j < 32; j += 4) for (let i = (j / 4) % 2 ? -3 : 0; i < 32; i += 7) { x.fillStyle = ['#6a5a78', '#5e5070', '#726282'][(i + j) % 3]; x.fillRect(i + 1, j + 1, 5, 2); x.fillStyle = '#8a7a98'; x.fillRect(i + 1, j + 1, 2, 1); }
  const t = pixelTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 30);
  return t;
}

// ---------------------------------------------------------------- props
// Bake static groups (houses, the gate) into one mesh per material, so the
// detailed street stays cheap to draw.
function mergeStatic(S, groups) {
  const buckets = new Map();
  for (const grp of groups) {
    grp.updateMatrixWorld(true);
    grp.traverse((m) => {
      if (!m.isMesh) return;
      const mat = m.material;
      const key = [mat.type, mat.color.getHexString(), mat.map ? mat.map.uuid : '', mat.transparent, mat.side].join('|');
      let b = buckets.get(key); if (!b) buckets.set(key, (b = { mat, geos: [] }));
      const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
      b.geos.push(g.index ? g.toNonIndexed() : g);
    });
    S.remove(grp);
  }
  for (const { mat, geos } of buckets.values()) S.add(new THREE.Mesh(mergeGeometries(geos), mat));
}
const stripeTex = (a, b, n = 8) => { const [c, x] = canvas(n * 4, 4); for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 4, 0, 4, 4); } return pixelTex(c); };
// the scalloped cloth edge hanging under an awning
function valanceTex(a, b) {
  const [c, x] = canvas(48, 8);
  for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 8, 0, 8, 4); x.fillRect(i * 8 + 1, 4, 6, 2); x.fillRect(i * 8 + 2, 6, 4, 1); }
  return pixelTex(c);
}
// a painted wooden sign in the pixel font
// (the board grows to fit the text; use signW() for the matching plane width)
function signTex(text, bg, fg) {
  const font = "18px 'VT323', monospace";
  const m = canvas(1, 1)[1]; m.font = font;
  const W = Math.max(64, Math.ceil(m.measureText(text).width) + 16);
  const [c, x] = canvas(W, 24);
  x.fillStyle = shade(bg, 0.4); x.fillRect(0, 0, W, 24); x.fillStyle = bg; x.fillRect(2, 2, W - 4, 20);
  x.fillStyle = light(bg, 0.25); x.fillRect(2, 2, W - 4, 2);
  x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, 13);
  return pixelTex(c);
}
const signW = (tex, h) => (h * tex.image.width) / tex.image.height;
// little pixel pictures for the food stalls' signs: skewers and a steaming bowl
function foodSignTex(bg, kind) {
  const [c, x] = canvas(48, 24);
  x.fillStyle = shade(bg, 0.4); x.fillRect(0, 0, 48, 24); x.fillStyle = bg; x.fillRect(2, 2, 44, 20);
  if (kind === 0) for (let k = 0; k < 3; k++) { const ox = 10 + k * 11; x.fillStyle = '#c89a6a'; x.fillRect(ox + 2, 4, 1, 17); ['#ffb3c6', '#fff3e0', '#9fd07a'].forEach((col, j) => { x.fillStyle = col; x.fillRect(ox, 5 + j * 4, 5, 4); }); }
  else { x.fillStyle = '#fff3e0'; x.fillRect(12, 13, 24, 6); x.fillRect(14, 19, 20, 2); x.fillStyle = '#e05a5a'; x.fillRect(12, 13, 24, 1); x.fillStyle = '#fff'; for (const sx of [17, 23, 29]) { x.fillRect(sx, 5, 1, 3); x.fillRect(sx + 1, 8, 1, 3); } }
  return pixelTex(c);
}
const glowMat = (col) => new THREE.MeshBasicMaterial({ color: col });
const BULB = new THREE.SphereGeometry(0.06, 6, 4);

// two-storey shophouse: lit shopfront, shuttered windows, a balcony, eaves with lanterns, a banner
function houseMesh(w, h, d, wall, roof, seed) {
  const g = new THREE.Group();
  const r = (k) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(wall)); b.position.y = h / 2; g.add(b);
  const fz = d / 2 + 0.01;
  // ground floor: a warm, open shopfront with a cloth awning
  const shop = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, 1.5), glowMat(r(1) < 0.75 ? '#f0b26a' : '#7a5a50')); shop.position.set(0, 0.85, fz); g.add(shop);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.12, 0.12), toon(shade(wall, 0.35))); frame.position.set(0, 1.66, fz); g.add(frame);
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.06, 0.8), new THREE.MeshLambertMaterial({ map: stripeTex(roof, '#fff3e0', 6) })); cloth.position.set(0, 1.85, fz + 0.38); cloth.rotation.x = 0.35; g.add(cloth);
  // upper floor: windows with shutters, some lit
  for (const sx of [-w * 0.25, w * 0.25]) {
    const lit = r(sx + 3) < 0.7;
    const wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.65), glowMat(lit ? '#ffd27a' : '#3a3050')); wdw.position.set(sx, h * 0.72, fz + 0.01); g.add(wdw);
    for (const o of [-0.4, 0.4]) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.7), toon(shade(roof, 0.1))); sh.position.set(sx + o, h * 0.72, fz + 0.02); g.add(sh); }
  }
  // balcony with a railing on the taller houses
  if (h > 3.4) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.1, 0.6), toon(shade(wall, 0.3))); slab.position.set(0, h * 0.72 - 0.45, fz + 0.3); g.add(slab);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.05, 0.05), toon('#6a4a3a')); rail.position.set(0, h * 0.72 - 0.05, fz + 0.58); g.add(rail);
    for (let i = 0; i <= 6; i++) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), toon('#6a4a3a')); post.position.set(-w * 0.35 + i * w * 0.7 / 6, h * 0.72 - 0.25, fz + 0.58); g.add(post); }
    if (r(7) < 0.6) for (let i = 0; i < 3; i++) { const pot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), toon(['#e05a7a', '#ffd23f', '#9fd07a'][i])); pot.position.set(-w * 0.2 + i * w * 0.2, h * 0.72 - 0.3, fz + 0.4); g.add(pot); }
  }
  // eaves overhang, tiled roof and a ridge
  const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, 0.16, d + 0.7), toon(shade(roof, 0.25))); eave.position.y = h + 0.08; g.add(eave);
  const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.5, 4), toon(roof)); rf.position.y = h + h * 0.25 + 0.1; rf.rotation.y = Math.PI / 4; g.add(rf);
  // a pair of red lanterns under the eaves
  for (const sx of [-w / 2 + 0.3, w / 2 - 0.3]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glowMat('#ff5a4a')); l.scale.y = 1.25; l.position.set(sx, h - 0.45, fz + 0.3); g.add(l);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6), toon('#3a2a2a')); cap.position.set(sx, h - 0.15, fz + 0.3); g.add(cap);
  }
  // a hanging cloth banner
  if (r(9) < 0.65) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.3), toon(['#e05a5a', '#f6c45f', '#7f9fdc', '#8fd3b6'][Math.floor(r(11) * 4)])); bn.position.set((r(13) < 0.5 ? -1 : 1) * (w / 2 - 0.35), h * 0.45 + 0.4, fz + 0.05); g.add(bn); }
  return g;
}

// a festival stall: striped awning with a scalloped edge and bulbs, a sign, and props for its game or food
function stallMesh(kind, color, label) {
  const g = new THREE.Group(); const upd = [];
  const wood = toon('#8a5a3a'), dark = toon('#5a3e30');
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1, 1), wood); counter.position.y = 0.5; g.add(counter);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.72), new THREE.MeshLambertMaterial({ map: stripeTex(color, '#fff3e0', 10) })); front.position.set(0, 0.5, 0.505); g.add(front);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.15), toon('#c89a6a')); top.position.y = 1.03; g.add(top);
  for (const x of [-1.32, 1.32]) for (const z of [0.5, -1.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.75, 0.1), dark); p.position.set(x, 1.37, z); g.add(p); }
  const awn = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.08, 2.5), new THREE.MeshLambertMaterial({ map: stripeTex(color, '#fff3e0', 8) })); awn.position.set(0, 2.78, -0.45); awn.rotation.x = 0.18; g.add(awn);
  const val = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 0.34), new THREE.MeshLambertMaterial({ map: valanceTex(color, '#fff3e0'), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); val.position.set(0, 2.4, 0.79); g.add(val);
  const bulbCols = ['#ffe9a8', '#ffb3c6', '#bfe0ff'];
  for (let i = 0; i < 11; i++) { const bl = new THREE.Mesh(BULB, glowMat(bulbCols[i % 3])); bl.position.set(-1.45 + i * 0.29, 2.2, 0.8); g.add(bl); }
  // the sign on top of the awning
  const signMap = label ? signTex(label, '#3a2633', '#ffe9a8') : foodSignTex('#3a2633', kind === 'food2' ? 1 : 0);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(2.9, signW(signMap, 0.5)), 0.5), new THREE.MeshBasicMaterial({ map: signMap }));
  sign.position.set(0, 3.15, 0.55); g.add(sign);
  if (kind === 'ring') {
    // tiers of bottles on a back shelf, plush prizes on top, rings on the counter
    for (let t = 0; t < 3; t++) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.4), wood); sh.position.set(0, 1.05 + t * 0.45, -1.3 + t * 0.05); g.add(sh);
      for (let i = 0; i < 7 - t * 2; i++) { const bt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 6), toon(['#8fd3b6', '#7f9fdc', '#f08fa8', '#f6c45f'][(i + t) % 4])); bt.position.set(-0.9 + t * 0.3 + i * 0.3, 1.24 + t * 0.45, -1.3 + t * 0.05); g.add(bt); }
    }
    for (const [x, col] of [[-1.0, '#c98a54'], [0, '#f4a6c0'], [1.0, '#fff3e0']]) {
      const bear = new THREE.Group(); const m = toon(col);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), m); bear.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m); head.position.y = 0.22; bear.add(head);
      for (const ex of [-0.09, 0.09]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), m); ear.position.set(ex, 0.33, 0); bear.add(ear); }
      bear.position.set(x, 2.15, -1.35); g.add(bear);
    }
    for (let i = 0; i < 4; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 4, 12), toon(['#ffd23f', '#ff6a6a', '#7fe0ff', '#9fd07a'][i])); ring.rotation.x = Math.PI / 2; ring.position.set(0.7 + (i % 2) * 0.1, 1.08 + i * 0.03, 0.15); g.add(ring); }
  } else if (kind === 'fish') {
    // a shallow tub of water with goldfish circling, fish in bags hanging from the awning
    const tub = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.9), toon('#5aa8d8')); tub.position.set(0, 1.1, 0); g.add(tub);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.75).rotateX(-Math.PI / 2), glowMat('#3f8fc0')); water.position.set(0, 1.17, 0); g.add(water);
    const fishes = [];
    for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.07).rotateX(-Math.PI / 2), glowMat(['#ff8a3d', '#ff5a3a', '#fff3e0', '#ffb04a'][i % 4])); f.position.y = 1.18; g.add(f); fishes.push({ f, ph: Math.random() * 6, sp: 0.6 + Math.random() * 0.6, rx: 0.5 + Math.random() * 0.4, rz: 0.15 + Math.random() * 0.15 }); }
    upd.push((t) => fishes.forEach((o) => { const a = t * o.sp + o.ph; o.f.position.x = Math.cos(a) * o.rx; o.f.position.z = Math.sin(a) * o.rz; o.f.rotation.y = -a; }));
    for (let i = 0; i < 5; i++) {
      const bag = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.55 })); bag.position.set(-1 + i * 0.5, 1.95, 0.55); g.add(bag);
      const fi = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), glowMat('#ff8a3d')); fi.position.copy(bag.position); g.add(fi);
      const str = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.25, 0.01), dark); str.position.set(bag.position.x, 2.15, 0.55); g.add(str);
    }
  } else if (kind === 'paint') {
    // racks of finished lanterns in every colour, paint pots and brushes on the counter
    const cols = ['#ff6a6a', '#ffb04a', '#ffd86a', '#8fd3b6', '#7fa7f0', '#b49ae0', '#ff8fb0'];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
      const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 8), glowMat(cols[(i + row * 3) % cols.length])); ln.position.set(-1.05 + i * 0.42, 2.05 - row * 0.5, -1.2 + row * 0.15); g.add(ln);
      const tas = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), glowMat('#ffe9a8')); tas.position.set(ln.position.x, ln.position.y - 0.2, ln.position.z); g.add(tas);
    }
    for (let i = 0; i < 6; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), toon(cols[i])); pot.position.set(-0.9 + i * 0.25, 1.12, 0.2); g.add(pot); }
    const brush = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.35), toon('#c89a6a')); brush.position.set(0.9, 1.1, 0.1); brush.rotation.y = 0.6; g.add(brush);
  } else {
    // food: a grill of skewers or a steaming pot, with buns on display
    const grill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.6), toon('#3a3038')); grill.position.set(-0.5, 1.12, 0); g.add(grill);
    const coals = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5).rotateX(-Math.PI / 2), glowMat('#ff6a3a')); coals.position.set(-0.5, 1.2, 0); g.add(coals);
    for (let i = 0; i < 6; i++) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.6), toon(['#c46a3a', '#ffb3c6', '#9fd07a'][i % 3])); sk.position.set(-0.95 + i * 0.18, 1.25, 0); g.add(sk); }
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.35, 10), toon('#8a8a9a')); pot.position.set(0.7, 1.24, -0.05); g.add(pot);
    for (let i = 0; i < 3; i++) { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), toon('#fff3e0')); bun.scale.y = 0.7; bun.position.set(0.3 + i * 0.2, 1.1, 0.35); g.add(bun); }
    g.userData.steam = [new THREE.Vector3(-0.5, 1.4, 0), new THREE.Vector3(0.7, 1.5, -0.05)];
  }
  g.userData.update = (t) => upd.forEach((f) => f(t));
  return g;
}

function miniCanvas(w = 160, h = 100) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.style.cssText = 'width:100%;max-width:520px;aspect-ratio:16/10;image-rendering:pixelated;display:block;margin:0 auto;border:3px solid #3a2633;border-radius:8px;touch-action:none;cursor:pointer';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  return [c, x];
}
const toCanvasXY = (c, e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * c.width, (e.clientY - r.top) / r.height * c.height]; };

// ---------------------------------------------------------------- games
function ringToss() {
  return new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>${esc(C.ring.title)}</h2><p class="sub">${esc(C.ring.hint)}</p>`);
      const [c, x] = miniCanvas(); s.appendChild(c);
      const msg = el('p', 'sub center', ''); msg.style.fontSize = '20px'; s.appendChild(msg);
      const bottles = [];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - r; i++) bottles.push({ x: 40 + i * 20 + r * 10, y: 70 - r * 16, col: ['#8fd3b6', '#7f9fdc', '#f08fa8', '#f6c45f'][(i + r) % 4], ring: false });
      let ring = null; let throws = 0; let t = 0; let done = false;
      const draw = () => {
        t += 1 / 60;
        x.fillStyle = '#2a2040'; x.fillRect(0, 0, 160, 100);
        for (let i = 0; i < 160; i += 8) { x.fillStyle = (i / 8) % 2 ? '#c4587a' : '#fff3e0'; x.fillRect(i, 0, 8, 10); }
        x.fillStyle = '#8a5a3a'; for (let r = 0; r < 3; r++) x.fillRect(25 + r * 10, 74 - r * 16, 110 - r * 20, 3);
        bottles.forEach((b) => { x.fillStyle = b.col; x.fillRect(b.x - 3, b.y - 10, 6, 10); x.fillRect(b.x - 1, b.y - 14, 2, 4); x.fillStyle = light(b.col, 0.4); x.fillRect(b.x - 2, b.y - 9, 1, 6); if (b.ring) { x.strokeStyle = '#ffd23f'; x.lineWidth = 1; x.strokeRect(b.x - 5, b.y - 6, 10, 3); } });
        if (ring) {
          ring.k = Math.min(1, ring.k + 1 / 30);
          const k = ring.k; const px = 80 + (ring.tx - 80) * k, py = 98 + (ring.ty - 98) * k - Math.sin(k * Math.PI) * 30;
          x.strokeStyle = '#ffd23f'; x.lineWidth = 2; x.beginPath(); x.ellipse(px, py, 6 - k * 2, 3, 0, 0, Math.PI * 2); x.stroke();
          if (k >= 1) { const hit = ring.hit; ring = null; if (hit) hit.ring = true; }
        }
        x.fillStyle = '#ffd23f'; x.fillRect(74, 94, 12, 3);
        if (!done || ring) requestAnimationFrame(draw);
      };
      draw();
      c.addEventListener('pointerdown', (e) => {
        if (ring || done) return;
        const [tx, ty] = toCanvasXY(c, e);
        throws++;
        const nearest = bottles.reduce((a, b) => (Math.hypot(b.x - tx, b.y - ty) < Math.hypot(a.x - tx, a.y - ty) ? b : a));
        const hit = throws >= 3 || Math.random() < 0.25 ? nearest : null;
        ring = { tx: hit ? hit.x : tx, ty: hit ? hit.y - 4 : ty, k: 0, hit };
        audio.sfx('whoosh');
        setTimeout(() => {
          if (hit) { audio.sfx('yay'); msg.textContent = C.ring.lines[1] + ' ' + C.ring.prize; done = true; const b = el('button', 'btn', esc(content.ui.next)); b.onclick = () => ui.closeModal(); s.appendChild(b); draw(); state.data.seen.prize = true; state.save(); }
          else { audio.sfx('pop'); msg.textContent = C.ring.lines[throws % 2 ? 0 : 2]; }
        }, 520);
      });
    });
  });
}

function goldfish() {
  return new Promise((resolve) => {
    let released = false;
    ui.onModalClose = () => resolve(released);
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>${esc(C.fish.title)}</h2><p class="sub">${esc(C.fish.hint)}</p>`);
      const [c, x] = miniCanvas(); s.appendChild(c);
      const fish = Array.from({ length: 7 }, (_, i) => ({ x: 20 + Math.random() * 120, y: 20 + Math.random() * 60, a: Math.random() * 6, sp: 10 + Math.random() * 10, col: ['#ff8a3d', '#ff5a3a', '#fff3e0', '#ffb04a'][i % 4], caught: false }));
      let net = null; let caught = 0; let t = 0;
      const row = el('div', 'row mt'); row.style.justifyContent = 'center'; s.appendChild(row);
      const draw = () => {
        if (!c.isConnected) return;
        t += 1 / 60;
        x.fillStyle = '#3f8fc0'; x.fillRect(0, 0, 160, 100);
        x.fillStyle = '#5aa8d8'; for (let i = 0; i < 20; i++) x.fillRect(((i * 37 + t * 8) % 170) - 5, (i * 23) % 100, 6, 1);
        x.fillStyle = '#e8dccb'; x.fillRect(0, 0, 160, 4); x.fillRect(0, 96, 160, 4); x.fillRect(0, 0, 4, 100); x.fillRect(156, 0, 4, 100);
        fish.forEach((f, i) => {
          if (f.caught) return;
          f.a += (Math.random() - 0.5) * 0.2; f.x += Math.cos(f.a) * f.sp / 60; f.y += Math.sin(f.a) * f.sp / 60;
          if (f.x < 12 || f.x > 148) f.a = Math.PI - f.a; if (f.y < 12 || f.y > 88) f.a = -f.a;
          f.x = Math.max(10, Math.min(150, f.x)); f.y = Math.max(10, Math.min(90, f.y));
          const img = fishSprite(Math.floor(t * 6 + i) % 2, f.col);
          x.save(); x.translate(Math.round(f.x), Math.round(f.y)); if (Math.cos(f.a) < 0) x.scale(-1, 1); x.drawImage(img, -5, -3); x.restore();
        });
        if (net) { net.k += 1 / 20; x.strokeStyle = '#fff6ea'; x.lineWidth = 1; x.beginPath(); x.arc(net.x, net.y, 8, 0, Math.PI * 2); x.stroke(); x.fillStyle = 'rgba(255,255,255,.25)'; x.fill(); if (net.k >= 1) net = null; }
        // bowl
        x.fillStyle = 'rgba(220,240,255,.8)'; x.fillRect(128, 74, 24, 18); x.fillStyle = '#7fc0e8'; x.fillRect(130, 80, 20, 11);
        for (let i = 0; i < caught; i++) x.drawImage(fishSprite(Math.floor(t * 4 + i) % 2, '#ff8a3d'), 131 + (i % 2) * 8, 80 + Math.floor(i / 2) * 4);
        requestAnimationFrame(draw);
      };
      draw();
      c.addEventListener('pointerdown', (e) => {
        const [tx, ty] = toCanvasXY(c, e);
        net = { x: tx, y: ty, k: 0 }; audio.sfx('splash');
        const f = fish.filter((f) => !f.caught).sort((a, b) => Math.hypot(a.x - tx, a.y - ty) - Math.hypot(b.x - tx, b.y - ty))[0];
        if (f && Math.hypot(f.x - tx, f.y - ty) < 22) {
          f.caught = true; caught++; audio.sfx('pop'); ui.note(C.fish.caught, 1200);
          if (caught === 3) { const b = el('button', 'btn', esc(C.fish.release)); b.onclick = () => { released = true; ui.closeModal(); }; row.appendChild(b); }
        }
      });
    });
  });
}

function paintLantern() {
  return new Promise((resolve) => {
    const colors = ['#ff6a6a', '#ffb04a', '#ffd86a', '#8fd3b6', '#7fa7f0', '#b49ae0', '#ff8fb0', '#fff6ea'];
    const sel = [0, 3, 2];
    let result = null;
    ui.onModalClose = () => resolve(result);
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>${esc(C.paint.title)}</h2><p class="sub">${esc(C.paint.hint)}</p>`);
      const prev = document.createElement('canvas'); prev.width = 24; prev.height = 32; prev.style.cssText = 'width:96px;height:128px;image-rendering:pixelated;display:block;margin:0 auto 8px';
      const drawPrev = () => {
        const x = prev.getContext('2d'); x.clearRect(0, 0, 24, 32);
        const body = colors[sel[0]], pat = colors[sel[1]], tas = colors[sel[2]];
        x.fillStyle = '#3a2633'; x.fillRect(11, 0, 2, 3); x.fillRect(6, 3, 12, 2); x.fillRect(6, 25, 12, 2);
        x.fillStyle = body; x.fillRect(4, 5, 16, 20); x.fillRect(2, 8, 20, 14);
        x.fillStyle = light(body, 0.35); x.fillRect(5, 7, 3, 15);
        x.fillStyle = pat; x.fillRect(9, 10, 6, 1); x.fillRect(11, 8, 2, 5); x.fillRect(6, 16, 2, 2); x.fillRect(16, 16, 2, 2); x.fillRect(10, 18, 4, 2); x.fillRect(2, 14, 20, 1);
        x.fillStyle = tas; for (let i = 0; i < 5; i++) x.fillRect(8 + i * 2, 27, 1, 5);
      };
      s.appendChild(prev); drawPrev();
      C.paint.parts.forEach((part, pi) => {
        s.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(part)}</div>`);
        const row = el('div', 'swatches');
        colors.forEach((col, ci) => { const b = el('button', 'swatch' + (sel[pi] === ci ? ' sel' : '')); b.style.background = col; b.setAttribute('aria-label', col); b.onclick = () => { sel[pi] = ci; row.querySelectorAll('.swatch').forEach((e, k) => e.classList.toggle('sel', k === ci)); drawPrev(); audio.sfx('tick'); }; row.appendChild(b); });
        s.appendChild(row);
      });
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const go = el('button', 'btn', '🏮 ' + esc(C.paint.release)); go.onclick = () => { result = sel.map((i) => colors[i]); ui.closeModal(); };
      row.appendChild(go); s.appendChild(row);
    });
  });
}

// ---------------------------------------------------------------- chapter
export default async function village(game) {
  const STREET_END = -78;
  const walkable = (x, z) => Math.abs(x) < 4.2 && z < 9 && z > STREET_END - 4;
  const world = new World3D(game, { start: [0, 0, 7], yaw: 0, pitch: 0.05, heightAt: (x, z) => (Math.abs(z + 34) < 2 ? 0.25 : 0), walkable, bloom: 0.55, bloomThreshold: 0.72 });
  const S = world.scene;
  world.add(makeSky(['#05061a', '#0b0d2a', '#1a1a46', '#33305e'], new THREE.Vector3(0.5, 0.55, -1), { sun: '#fff1c8', glow: 0.12, sunSize: 0.9996 }));
  world.setTime({ fog: '#1c1634', fogNear: 20, fogFar: 95, ambient: '#5a5aa0', ambientI: 0.55, sun: '#9fb0ff', sunI: 0.35, sunPos: [20, 40, -20], hemiSky: '#3a2f6a', hemiGround: '#1a1220', hemiI: 0.45 });
  // stars
  const sp = []; for (let i = 0; i < 600; i++) { const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.3; sp.push(new THREE.Vector3(Math.cos(a) * Math.cos(e) * 600, Math.sin(e) * 600, Math.sin(a) * Math.cos(e) * 600)); }
  S.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(sp), new THREE.PointsMaterial({ color: '#fff6e0', size: 1.5, sizeAttenuation: false, fog: false })));

  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 120).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: cobbleTex() }));
  ground.position.set(0, 0, -35); S.add(ground);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), toon('#24304a')); grass.position.y = -0.02; S.add(grass);
  // canal with stone banks, an arched bridge, floating lanterns drifting on the water
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(200, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2a4a7a' })); canal.position.set(0, 0.01, -34); S.add(canal);
  for (const z of [-32.4, -35.6]) { const bank = new THREE.Mesh(new THREE.BoxGeometry(200, 0.22, 0.3), toon('#6a6078')); bank.position.set(0, 0.1, z); S.add(bank); }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 4), toon('#8a5a3a')); bridge.position.set(0, 0.12, -34); S.add(bridge);
  for (const x of [-4, 4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 4.2), toon('#c4587a')); rail.position.set(x, 0.95, -34); S.add(rail);
    for (const z of [-36, -34.7, -33.3, -32]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.16), toon('#c4587a')); post.position.set(x, 0.5, z); S.add(post);
      if (z === -36 || z === -32) { const pl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat('#ffcf6b')); pl.position.set(x, 1.15, z); S.add(pl); }
    }
  }
  const floatGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.14, 6);
  const floaters = new THREE.InstancedMesh(floatGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 26);
  const floatState = Array.from({ length: 26 }, (_, i) => ({ x: -60 + Math.random() * 120, z: -34 + (Math.random() - 0.5) * 2.2, sp: 0.25 + Math.random() * 0.3, ph: Math.random() * 6 }));
  floatState.forEach((f, i) => floaters.setColorAt(i, new THREE.Color(['#ffb35a', '#ff8a6a', '#ffd27a', '#ff9ac8'][i % 4])));
  S.add(floaters);

  // the entrance gate with the festival's name and big lanterns
  const gate = new THREE.Group(); S.add(gate);
  {
    const S = gate; // build into the gate group
    const red = toon('#c4383a'), tile = toon('#3a2a3a');
    for (const x of [-4.9, 4.9]) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 5.6, 10), red); pil.position.set(x, 2.8, 2); S.add(pil);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), toon('#6a6078')); foot.position.set(x, 0.25, 2); S.add(foot);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.42, 0.55), red); beam.position.set(0, 5.4, 2); S.add(beam);
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.22, 0.4), red); beam2.position.set(0, 4.5, 2); S.add(beam2);
    const roofT = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.3, 1.5), tile); roofT.position.set(0, 5.8, 2); S.add(roofT);
    for (const x of [-6.3, 6.3]) { const tip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 1.5), tile); tip.position.set(x, 6.02, 2); tip.rotation.z = x < 0 ? -0.35 : 0.35; S.add(tip); }
    const gateMap = signTex(content.chapters[11]?.title || 'Lễ hội', '#c4383a', '#ffe9a8');
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(9, signW(gateMap, 0.95)), 0.95), new THREE.MeshBasicMaterial({ map: gateMap, side: THREE.DoubleSide })); sign.position.set(0, 4.95, 2.3); S.add(sign);
    for (const x of [-3.4, 3.4]) {
      const big = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), glowMat('#ff4a3a')); big.scale.y = 1.25; big.position.set(x, 3.6, 2); S.add(big);
      for (const y of [4.25, 2.95]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 8), toon('#ffcf4a')); cap.position.set(x, y, 2); S.add(cap); }
      const tas = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), glowMat('#ffcf4a')); tas.position.set(x, 2.65, 2); S.add(tas);
    }
  }

  // houses on both sides
  const houses = [gate];
  const walls = ['#f3dcc0', '#fff1e0', '#e8c8a8', '#f6e3cc'], roofs = ['#c4587a', '#d96a5a', '#7f6fb0', '#5a7aa0'];
  for (let z = 4, i = 0; z > STREET_END - 10; z -= 7, i++) for (const side of [-1, 1]) {
    const w = 4 + (i % 3), h = 3 + ((i + side + 3) % 3) * 0.8;
    const hm = houseMesh(w, h, 4, walls[(i + (side > 0 ? 1 : 0)) % 4], roofs[(i * 3 + (side > 0 ? 2 : 0)) % 4], i * 2 + (side > 0 ? 1 : 0));
    hm.position.set(side * (7 + w / 2), 0, z); hm.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; S.add(hm); houses.push(hm);
  }
  mergeStatic(S, houses);
  // lantern strings: across the street, plus long strings zig-zagging down it
  const lanternPts = [], lanternCols = [], strV = [];
  const string = (ax, ay, az, bx, by, bz, n, sag) => {
    let prev = null;
    for (let k = 0; k <= n; k++) {
      const t = k / n; const pt = [ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(t * Math.PI) * sag, az + (bz - az) * t];
      if (k > 0 && k < n) { lanternPts.push(...pt); const n5 = LANTERN_COLS.length, c = new THREE.Color(LANTERN_COLS[(((k + Math.round(az)) % n5) + n5) % n5]); lanternCols.push(c.r, c.g, c.b); }
      if (prev) strV.push(...prev, ...pt);
      prev = pt;
    }
  };
  for (let z = 4; z > STREET_END; z -= 5) string(-6.2, 4.4, z, 6.2, 4.4, z, 13, 0.9);
  for (let z = 4; z > STREET_END + 4; z -= 10) { string(-6, 5.2, z, 6, 5.2, z - 5, 14, 0.6); string(6, 5.2, z - 5, -6, 5.2, z - 10, 14, 0.6); }
  const lanGeo = new THREE.CylinderGeometry(0.17, 0.14, 0.32, 8);
  const lanMesh = new THREE.InstancedMesh(lanGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), lanternPts.length / 3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < lanternPts.length / 3; i++) { m4.makeTranslation(lanternPts[i * 3], lanternPts[i * 3 + 1] - 0.18, lanternPts[i * 3 + 2]); lanMesh.setMatrixAt(i, m4); lanMesh.setColorAt(i, new THREE.Color(lanternCols[i * 3], lanternCols[i * 3 + 1], lanternCols[i * 3 + 2]).multiplyScalar(0.72)); }
  S.add(lanMesh);
  const strG = new THREE.BufferGeometry(); strG.setAttribute('position', new THREE.Float32BufferAttribute(strV, 3));
  S.add(new THREE.LineSegments(strG, new THREE.LineBasicMaterial({ color: '#3a2a3a' })));
  const lights = [];
  for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight('#ff9a50', 10, 16, 1.3); pl.position.set(0, 3.5, 0); S.add(pl); lights.push(pl); }

  // sky lanterns rising slowly over the rooftops
  // (they start beyond the rooftops, away from the street, so none drifts right past the camera)
  const skyN = 70;
  const skyLan = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.6, 0.45), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), skyN);
  const skyX = () => (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 60);
  const skyState = Array.from({ length: skyN }, () => ({ x: skyX(), z: 10 - Math.random() * 160, y: 9 + Math.random() * 70, sp: 0.5 + Math.random() * 0.8, ph: Math.random() * 6 }));
  skyState.forEach((o, i) => skyLan.setColorAt(i, new THREE.Color(['#ff8a2a', '#ffa03a', '#ff7a3a', '#ffb24a'][i % 4]).multiplyScalar(0.75)));
  S.add(skyLan);

  // stalls
  const stalls = [
    { z: -6, x: -4.6, col: '#e05a7a', npc: LOOKS.bakerAunt, kind: 'food' },
    { z: -13, x: 4.6, col: '#f6c45f', npc: LOOKS.hatGuy, kind: 'ring', label: C.ring.title },
    { z: -22, x: -4.6, col: '#7f9fdc', npc: LOOKS.fruitUncle, kind: 'fish', label: C.fish.title },
    { z: -44, x: 4.6, col: '#8fd3b6', npc: LOOKS.florist, kind: 'paint', label: C.paint.title },
    { z: -52, x: -4.6, col: '#b49ae0', npc: LOOKS.barista, kind: 'food2' },
  ];
  stalls.forEach((st) => {
    const m = stallMesh(st.kind, st.col, st.label); m.position.set(st.x, 0, st.z); m.rotation.y = st.x < 0 ? Math.PI / 2 : -Math.PI / 2; S.add(m); st.m = m;
    const v = billboard(charSprite(st.npc, { pose: 'idle', mood: 'happy' }), 0.06); v.position.set(st.x + (st.x < 0 ? -0.9 : 0.9), 0, st.z); S.add(v); st.v = v;
  });
  // fireworks launcher
  const launcher = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), toon('#e05a5a')); tube.position.y = 0.6; tube.rotation.x = -0.2; launcher.add(tube);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1), toon('#8a5a3a')); box.position.y = 0.2; launcher.add(box);
  launcher.position.set(-3.2, 0, -60); S.add(launcher);

  // stage at the far end: a lit deck, a backdrop, a frame strung with bulbs
  const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 6), toon('#6a4a3a')); stageDeck.position.set(0, 0.6, STREET_END - 10); S.add(stageDeck);
  const stageBack = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ color: '#2a2456' })); stageBack.position.set(0, 4, STREET_END - 13); S.add(stageBack);
  for (const x of [-6.2, 6.2]) { const pole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 7.5, 0.25), toon('#3a2a3a')); pole.position.set(x, 3.75, STREET_END - 7.2); S.add(pole); }
  const truss = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.25, 0.25), toon('#3a2a3a')); truss.position.set(0, 7.4, STREET_END - 7.2); S.add(truss);
  for (let i = 0; i < 31; i++) { const bl = new THREE.Mesh(BULB, glowMat(['#ffe9a8', '#ffb3c6', '#bfe0ff'][i % 3])); bl.scale.setScalar(1.8); bl.position.set(-6.2 + i * 0.413, 7.15 - Math.sin((i / 30) * Math.PI) * 0.5, STREET_END - 7.1); S.add(bl); }
  const stageGlow = new THREE.PointLight('#ff9ac8', 10, 20); stageGlow.position.set(0, 5, STREET_END - 6); S.add(stageGlow);

  // ---- people
  // Most villagers are busy with each other: chatting in little groups, strolling,
  // queuing at stalls, kids chasing each other. Only a few face the street and
  // will talk to Hazei. Each one shows its front or its back depending on which
  // way it faces relative to the camera.
  const looks = [LOOKS.kidA, LOOKS.kidB, LOOKS.shopLady, LOOKS.fruitUncle, LOOKS.florist, LOOKS.hatGuy, LOOKS.barista, LOOKS.bakerAunt];
  const people = [];
  const person = (lk, x, z, face, o = {}) => {
    const b = billboard(charSprite(lk, { pose: 'idle' }), 0.06); b.position.set(x, 0, z); b.material.color.setScalar(0.85); S.add(b);
    const p = { b, lk, face: face.clone().normalize(), pose: o.pose || 'idle', mood: o.mood || 'normal', ph: Math.random() * 6, ...o };
    people.push(p); return p;
  };
  const kid = (lk) => lk.kind === 'kid';
  // chatting groups: two or three people facing the middle of their circle
  const groups = [];
  const groupSpots = [[-2.9, -1], [3.1, -8], [-3.2, -16.5], [2.6, -26], [-2.4, -38.5], [3.2, -40], [-3, -47], [2.8, -56], [-2.7, -63], [3, -69]];
  groupSpots.forEach(([gx, gz], gi) => {
    const n = gi % 3 === 0 ? 3 : 2; const members = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + gi;
      const x = gx + Math.cos(a) * 0.5, z = gz + Math.sin(a) * 0.5;
      const lk = looks[(gi * 3 + k) % looks.length];
      members.push(person(lk, x, z, new THREE.Vector3(gx - x, 0, gz - z), { mood: Math.random() < 0.5 ? 'happy' : 'normal', chat: true }));
    }
    groups.push({ members, emo: null, next: 1 + Math.random() * 4 });
  });
  // a few of the groups chat out loud when Hazei walks past (no button needed)
  const chatGroups = [0, 2, 4, 6, 8].map((gi, k) => ({ g: groups[gi], lines: (C.chatter || [])[k], i: 0, wait: 0.5 + k * 0.7 })).filter((c) => c.g && c.lines);
  // a few people facing the street who turn to talk with Hazei
  const talkers = [];
  [[-3.4, 3.5], [3.5, -4], [-3.5, -28.5], [3.4, -49], [-3.3, -58]].forEach(([x, z], i) => {
    const lk = looks[(i * 2 + 3) % looks.length];
    const p = person(lk, x, z, new THREE.Vector3(-x, 0, 1.2), { mood: 'happy', talker: true });
    talkers.push(p);
    world.interact.add({ pos: p.b.position, range: 1.9, hold: 0, label: P.talk, onDone: () => { world.say(C.npcs[i % C.npcs.length], p.b.position.clone().add(new THREE.Vector3(0, kid(lk) ? 1.7 : 2.1, 0)), 3000); audio.sfx('pop'); p.wave = 2.5; } });
  });
  // customers at the stalls, looking at the goods
  stalls.forEach((st, i) => {
    const x = st.x * 0.62, z = st.z + (i % 2 ? -0.9 : 0.9);
    person(looks[(i * 3 + 1) % looks.length], x, z, new THREE.Vector3(st.x - x, 0, 0));
  });
  // people leaning on the bridge rails, looking at the floating lanterns
  for (const [x, z] of [[-3.6, -33.4], [-3.6, -34.4], [3.6, -34.8]]) person(looks[Math.abs(Math.round(z * 7 + x)) % looks.length], x, z, new THREE.Vector3(Math.sign(x), 0, 0), { mood: 'happy' });
  // strollers walking up and down the street
  for (let i = 0; i < 9; i++) {
    const lane = (i % 2 ? 1 : -1) * (0.8 + (i % 3) * 0.7);
    const z0 = -2 - i * 7.5, len = 10 + (i % 4) * 4;
    person(looks[(i * 5 + 2) % looks.length], lane, z0, new THREE.Vector3(0, 0, -1), { pose: 'walk', walk: { z0, len, lane, dx: 0, sp: 0.7 + Math.random() * 0.5, k: Math.random() } });
  }
  // two kids chasing each other in circles near the entrance and the bridge
  for (const [cx, cz] of [[1.8, -3], [-1.6, -30]]) for (let k = 0; k < 2; k++) person(k ? LOOKS.kidB : LOOKS.kidA, cx, cz, new THREE.Vector3(1, 0, 0), { pose: 'walk', circle: { cx, cz, r: 1.1, a: k * 2.2, sp: 1.6 } });

  // crowd that gathers near the stage
  const crowd = [];
  for (let i = 0; i < 26; i++) {
    const lk = looks[i % looks.length];
    const b = billboard(charSprite(lk, { pose: i % 3 ? 'idle' : 'cheer', back: true }), 0.06);
    b.position.set((Math.random() - 0.5) * 7, 0, STREET_END - 2 + Math.random() * 6); b.material.color.setScalar(0.85); b.visible = false; S.add(b); crowd.push(b);
  }

  // per-frame life: facing, walking, chatting emotes, floating and rising lanterns
  const camXZ = new THREE.Vector3(), tmp = new THREE.Vector3();
  const updatePeople = (dt, t) => {
    camXZ.copy(world.camera.position); camXZ.y = 0;
    const pp = world.player.pos;
    for (const p of people) {
      if (p.walk) {
        const w = p.walk; w.k += dt * w.sp / w.len;
        const k = w.k % 2, fwd = k < 1;
        p.b.position.z = w.z0 - (fwd ? k : 2 - k) * w.len; p.face.set(0, 0, fwd ? -1 : 1);
        // step aside when passing Hazei instead of walking through her
        const close = Math.abs(p.b.position.z - pp.z) < 2.2 && Math.abs(w.lane + w.dx - pp.x) < 1.6;
        w.dx += ((close ? Math.sign(w.lane - pp.x || 1) * 1.6 : 0) - w.dx) * Math.min(1, dt * 3);
        p.b.position.x = Math.max(-4, Math.min(4, w.lane + w.dx));
      } else if (p.circle) {
        const c = p.circle; c.a += dt * c.sp;
        p.b.position.x = c.cx + Math.cos(c.a) * c.r; p.b.position.z = c.cz + Math.sin(c.a) * c.r; p.face.set(-Math.sin(c.a), 0, Math.cos(c.a));
      }
      // talkers turn toward Hazei when she comes close
      if (p.talker) { tmp.copy(pp).sub(p.b.position); tmp.y = 0; if (tmp.length() < 5) p.face.copy(tmp.normalize()); }
      tmp.copy(camXZ).sub(p.b.position); tmp.y = 0;
      const front = tmp.dot(p.face) > 0;
      const moving = p.walk || p.circle;
      const waving = p.wave > 0; if (waving) p.wave -= dt;
      const near = p.talker && pp.distanceTo(p.b.position) < 4;
      const pose = moving ? 'walk' : waving || (near && Math.sin(t * 1.3 + p.ph) > 0.6) ? 'wave' : p.chat && Math.sin(t * 0.9 + p.ph) > 0.75 ? 'hold' : p.pose;
      const frame = moving ? Math.floor(t * (p.circle ? 9 : 6) + p.ph) % 4 : Math.floor(t * 2 + p.ph) % 2;
      p.b.setCanvas(charSprite(p.lk, { pose, frame, mood: p.mood, back: !front }));
      if (!moving) p.b.position.y = Math.max(0, Math.sin(t * 2.4 + p.ph) * 0.025);
    }
    // a chatting group now and then shows what they're talking about
    for (const g of groups) {
      g.next -= dt;
      if (g.emo && g.next < 0) { S.remove(g.emo); g.emo = null; g.next = 2 + Math.random() * 5; }
      else if (!g.emo && g.next < 0) {
        const m = g.members[Math.floor(Math.random() * g.members.length)];
        g.emo = billboard(emoteSprite(['laugh', 'note', 'heart', 'wow', 'sparkle', 'q', 'thumb'][Math.floor(Math.random() * 7)]), 0.045);
        g.emo.position.copy(m.b.position).add(new THREE.Vector3(0, kid(m.lk) ? 1.75 : 2.15, 0)); S.add(g.emo); g.next = 1.6;
      }
    }
    // overheard chatter: one line at a time, alternating speakers, then a pause before it starts over
    for (const c of chatGroups) {
      const m0 = c.g.members[0].b.position;
      const near = pp.distanceTo(m0) < 10;
      if (!near) { c.i = 0; c.wait = Math.min(c.wait, 1); continue; }
      c.wait -= dt;
      if (c.wait > 0) continue;
      const who = c.g.members[c.i % c.g.members.length];
      const bub = world.say(c.lines[c.i], who.b.position.clone().add(new THREE.Vector3(0, kid(who.lk) ? 1.8 : 2.2, 0)), 2600);
      bub.b.classList.add('chatter');
      c.i++;
      if (c.i >= c.lines.length) { c.i = 0; c.wait = 9 + Math.random() * 6; } else c.wait = 2.9;
    }
    // stall life: goldfish circling, steam from the grills
    stalls.forEach((st) => {
      st.m.userData.update(t);
      for (const sp of st.m.userData.steam || []) if (Math.random() < dt * 2.5) world.glow.emit(st.m.localToWorld(sp.clone()).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4)), new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.35, 0), '#8a8296', 1.8, { size: 2 });
    });
    floatState.forEach((f, i) => { f.x += f.sp * dt; if (f.x > 60) f.x = -60; m4.makeTranslation(f.x, 0.08 + Math.sin(t * 1.5 + f.ph) * 0.03, f.z); floaters.setMatrixAt(i, m4); });
    floaters.instanceMatrix.needsUpdate = true;
    skyState.forEach((o, i) => { o.y += o.sp * dt; if (o.y > 85) { o.y = 9; o.x = skyX(); } m4.makeTranslation(o.x + Math.sin(t * 0.3 + o.ph) * 1.5, o.y, o.z); skyLan.setMatrixAt(i, m4); });
    skyLan.instanceMatrix.needsUpdate = true;
  };

  // ------------------------------------------------ interactions
  const stallItem = (st, label, fn) => world.interact.add({ pos: new THREE.Vector3(st.x * 0.75, 0, st.z), range: 2.4, hold: 0.3, label, onDone: fn });
  const G = C.guide;
  const stallPos = (st) => new THREE.Vector3(st.x * 0.75, 0, st.z);
  const guide = new Guide(world, { title: G.title, optionalTitle: G.optional, steps: [
    { id: 'stage', text: G.stage, label: G.m.stage, pos: new THREE.Vector3(0, 0, STREET_END + 2) },
    { id: 'ring', text: G.ring, short: G.m.ring, optional: true, pos: stallPos(stalls[1]) },
    { id: 'fish', text: G.fish, short: G.m.fish, optional: true, pos: stallPos(stalls[2]) },
    { id: 'paint', text: G.paint, short: G.m.paint, optional: true, pos: stallPos(stalls[3]) },
    { id: 'fireworks', text: G.fireworks, short: G.m.fireworks, optional: true, pos: launcher.position },
  ] });
  world.opts.cleanup = () => guide.destroy();
  stallItem(stalls[0], P.taste, async () => { world.say(C.npcs[3], stalls[0].v.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 2800); audio.sfx('yay'); for (let k = 0; k < 6; k++) world.glow.emit(world.player.pos.clone().add(new THREE.Vector3(0, 1.2, -1)), new THREE.Vector3((Math.random() - 0.5), 1, 0), '#ff8fb0', 1.4); });
  stallItem(stalls[4], P.taste, async () => { world.say(C.npcs[0], stalls[4].v.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 2800); audio.sfx('yay'); });
  stallItem(stalls[1], P.ring, async () => { await ringToss(); audio.sfx('chime'); guide.done('ring'); });
  stallItem(stalls[2], P.fish, async () => {
    const rel = await goldfish(); guide.done('fish');
    if (rel) {
      ui.note(C.fish.released, 3000); audio.sfx('splash');
      for (let k = 0; k < 20; k++) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 6, 0.1, -34 + (Math.random() - 0.5) * 2), new THREE.Vector3((Math.random() - 0.5) * 2, 0.05, (Math.random() - 0.5) * 0.4), '#ff8a3d', 3);
    }
  });
  stallItem(stalls[3], P.paint, async () => {
    const cols = await paintLantern();
    if (!cols) return;
    guide.done('paint');
    world.handPose = 'lantern';
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.6, 8), new THREE.MeshBasicMaterial({ color: cols[0] })); g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 8), new THREE.MeshBasicMaterial({ color: cols[1] })); g.add(band);
    const pl = new THREE.PointLight(cols[0], 4, 6); g.add(pl);
    const f = new THREE.Vector3(-Math.sin(world.player.yaw), 0, -Math.cos(world.player.yaw));
    g.position.copy(world.player.pos).addScaledVector(f, 1.2).add(new THREE.Vector3(0, 1.4, 0)); S.add(g);
    audio.sfx('chime'); ui.note(C.paint.released, 3500);
    world.every((dt, t) => { g.position.y += dt * 0.6; g.position.x += Math.sin(t * 0.5) * dt * 0.2; if (Math.random() < dt * 4) world.glow.emit(g.position.clone(), new THREE.Vector3(0, -0.2, 0), cols[2], 1.2); });
    await wait(1500); world.handPose = 'idle';
  });
  world.interact.add({ pos: launcher.position, range: 2.6, hold: 0.5, label: P.fireworks, onDone: async () => {
    ui.note(C.fireworks, 2500); guide.done('fireworks');
    for (let n = 0; n < 7; n++) {
      const from = new THREE.Vector3(-3.2 + (Math.random() - 0.5) * 2, 1, -66 - Math.random() * 10);
      const top = from.clone().add(new THREE.Vector3((Math.random() - 0.5) * 10, 22 + Math.random() * 10, -5));
      audio.sfx('launch');
      for (let k = 0; k <= 20; k++) { world.glow.emit(from.clone().lerp(top, k / 20), new THREE.Vector3(0, -0.5, 0), '#ffe9a8', 0.6); await wait(25); }
      audio.sfx('firework');
      const col = ['#ff6fb0', '#ffd86a', '#7fe0ff', '#b48aff', '#ff8a5a', '#8fffb0'][n % 6];
      for (let k = 0; k < 90; k++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 3); world.glow.emit(top, v, k % 5 ? col : '#ffffff', 2.4, { kind: 2, size: 3 }); }
      await wait(350);
    }
  } });

  // ------------------------------------------------ progression
  let ending = false;
  world.every((dt, t) => {
    const p = world.player.pos;
    // nearest lights follow the player for warm local light
    lights.forEach((l, i) => { l.position.set(i % 2 ? 3 : -3, 3.5, Math.round((p.z - 6 + i * 4) / 5) * 5); l.intensity = 9 + Math.sin(t * 3 + i) * 1.2; });
    updatePeople(dt, t);
    const nearStage = Math.max(0, Math.min(1, (-p.z - 45) / 25));
    crowd.forEach((b, i) => { b.visible = nearStage > i / crowd.length * 0.8; b.position.y = Math.max(0, Math.sin(t * 4 + i) * 0.04 * nearStage); });
    audio.setAmbienceLevel(1 - nearStage * 0.85, 0.5); audio.setMusicLevel(1 - nearStage * 0.9, 0.5);
    if (p.z < -48) world.toastOnce('village_stage');
    if (nearStage > 0.4 && !world._gather) { world._gather = true; ui.note(C.gather, 3000); }
    if (!ending && p.z < STREET_END + 2) { ending = true; game.leave(world, { dark: true }); }
    if (Math.random() < dt * 2) world.glow.emit(new THREE.Vector3((Math.random() - 0.5) * 10, 1 + Math.random() * 3, p.z - Math.random() * 20), new THREE.Vector3(0, 0.1, 0), '#ffcf8a', 4, { kind: 3 });
  });

  ui.actions([{ label: '📷 ' + content.ui.photo, onClick: () => world.photo(content.chapters[11].title, content.ui.photo) }]);
  audio.scene('village', [['crowd', 0.8]]);
  const fin = world.start();
  await game.enter({ dark: true });
  ui.controlsHint(input.touch ? content.ui.controls3DTouch : content.ui.controls3D, 6000);
  await wait(2000);
  ui.note(C.arrive, 3500);
  world.toastOnce('village_arrive');
  await fin;
}

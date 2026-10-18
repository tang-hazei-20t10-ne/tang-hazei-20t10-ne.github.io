// Chapter 11: lantern festival village at night, gentle never-fail games.
import content from '../content.js';
import { World3D, THREE, makeSky, billboard, toon, pixelTex } from '../three/engine3d.js';
import { canvas, charSprite, LOOKS, fishSprite, mix, shade, light } from '../core/sprites.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
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

function houseMesh(w, h, d, wall, roof) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(wall)); b.position.y = h / 2; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.55, 4), toon(roof)); r.position.y = h + h * 0.27; r.rotation.y = Math.PI / 4; g.add(r);
  // lit windows (emissive)
  const winM = new THREE.MeshBasicMaterial({ color: '#ffd27a' });
  for (const sx of [-w * 0.25, w * 0.25]) { const wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), winM); wdw.position.set(sx, h * 0.62, d / 2 + 0.01); g.add(wdw); }
  return g;
}

function stallMesh(color) {
  const g = new THREE.Group();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 1), toon('#8a5a3a')); counter.position.y = 0.5; g.add(counter);
  for (const x of [-1.15, 1.15]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), toon('#5a3e30')); p.position.set(x, 1.2, -0.4); g.add(p); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 1.4), toon(color)); roof.position.set(0, 2.4, -0.1); roof.rotation.x = 0.25; g.add(roof);
  const lan = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb04a' })); lan.position.set(0.9, 2.05, 0.4); g.add(lan);
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
  // canal & bridge
  const canal = new THREE.Mesh(new THREE.PlaneGeometry(200, 3).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2a4a7a' })); canal.position.set(0, 0.01, -34); S.add(canal);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 4), toon('#8a5a3a')); bridge.position.set(0, 0.12, -34); S.add(bridge);
  for (const x of [-4, 4]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 4), toon('#c4587a')); rail.position.set(x, 0.6, -34); S.add(rail); }

  // houses on both sides
  const walls = ['#f3dcc0', '#fff1e0', '#e8c8a8', '#f6e3cc'], roofs = ['#c4587a', '#d96a5a', '#7f6fb0', '#5a7aa0'];
  for (let z = 4, i = 0; z > STREET_END - 10; z -= 7, i++) for (const side of [-1, 1]) {
    const w = 4 + (i % 3), h = 3 + ((i + side + 3) % 3) * 0.8;
    const hm = houseMesh(w, h, 4, walls[(i + (side > 0 ? 1 : 0)) % 4], roofs[(i * 3 + (side > 0 ? 2 : 0)) % 4]);
    hm.position.set(side * (7 + w / 2), 0, z); hm.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; S.add(hm);
  }
  // lantern strings
  const lanternPts = [], lanternCols = [];
  for (let z = 4; z > STREET_END; z -= 5) {
    for (let k = 0; k <= 12; k++) {
      const t = k / 12; const x = -6 + t * 12; const y = 4.2 - Math.sin(t * Math.PI) * 0.9;
      lanternPts.push(x, y, z); const c = new THREE.Color(LANTERN_COLS[(k + Math.round(z)) % LANTERN_COLS.length]); lanternCols.push(c.r, c.g, c.b);
    }
  }
  // lanterns as small glowing paper cylinders (instanced)
  const lanGeo = new THREE.CylinderGeometry(0.17, 0.14, 0.32, 8);
  const lanMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const lanMesh = new THREE.InstancedMesh(lanGeo, lanMat, lanternPts.length / 3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < lanternPts.length / 3; i++) { m4.makeTranslation(lanternPts[i * 3], lanternPts[i * 3 + 1] - 0.18, lanternPts[i * 3 + 2]); lanMesh.setMatrixAt(i, m4); lanMesh.setColorAt(i, new THREE.Color(lanternCols[i * 3], lanternCols[i * 3 + 1], lanternCols[i * 3 + 2]).multiplyScalar(0.72)); }
  S.add(lanMesh);
  // the string
  const strV = []; for (let i = 0; i < lanternPts.length / 3 - 1; i++) { if ((i + 1) % 13 === 0) continue; strV.push(lanternPts[i * 3], lanternPts[i * 3 + 1], lanternPts[i * 3 + 2], lanternPts[i * 3 + 3], lanternPts[i * 3 + 4], lanternPts[i * 3 + 5]); }
  const strG = new THREE.BufferGeometry(); strG.setAttribute('position', new THREE.Float32BufferAttribute(strV, 3));
  S.add(new THREE.LineSegments(strG, new THREE.LineBasicMaterial({ color: '#3a2a3a' })));
  const lights = [];
  for (let i = 0; i < 4; i++) { const pl = new THREE.PointLight('#ff9a50', 10, 16, 1.3); pl.position.set(0, 3.5, 0); S.add(pl); lights.push(pl); }

  // stalls
  const stalls = [
    { z: -6, x: -4.6, col: '#e05a7a', npc: LOOKS.bakerAunt, kind: 'food' },
    { z: -13, x: 4.6, col: '#f6c45f', npc: LOOKS.hatGuy, kind: 'ring' },
    { z: -22, x: -4.6, col: '#7f9fdc', npc: LOOKS.fruitUncle, kind: 'fish' },
    { z: -44, x: 4.6, col: '#8fd3b6', npc: LOOKS.florist, kind: 'paint' },
    { z: -52, x: -4.6, col: '#b49ae0', npc: LOOKS.barista, kind: 'food' },
  ];
  stalls.forEach((st) => {
    const m = stallMesh(st.col); m.position.set(st.x, 0, st.z); m.rotation.y = st.x < 0 ? Math.PI / 2 : -Math.PI / 2; S.add(m);
    const v = billboard(charSprite(st.npc, { pose: 'idle', mood: 'happy' }), 0.06); v.position.set(st.x + (st.x < 0 ? -0.9 : 0.9), 0, st.z); S.add(v); st.v = v;
  });
  // fireworks launcher
  const launcher = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8), toon('#e05a5a')); tube.position.y = 0.6; tube.rotation.x = -0.2; launcher.add(tube);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1), toon('#8a5a3a')); box.position.y = 0.2; launcher.add(box);
  launcher.position.set(-3.2, 0, -60); S.add(launcher);

  // stage at the far end (simple silhouette, lit softly)
  const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 6), toon('#6a4a3a')); stageDeck.position.set(0, 0.6, STREET_END - 10); S.add(stageDeck);
  const stageBack = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ color: '#2a2456' })); stageBack.position.set(0, 4, STREET_END - 13); S.add(stageBack);
  const stageGlow = new THREE.PointLight('#ff9ac8', 10, 20); stageGlow.position.set(0, 5, STREET_END - 6); S.add(stageGlow);

  // villagers
  const looks = [LOOKS.kidA, LOOKS.kidB, LOOKS.shopLady, LOOKS.fruitUncle, LOOKS.florist, LOOKS.hatGuy, LOOKS.barista];
  const npcs = [];
  for (let i = 0; i < 14; i++) {
    const lk = looks[i % looks.length];
    const b = billboard(charSprite(lk, { pose: 'idle', mood: i % 2 ? 'happy' : 'normal' }), 0.06);
    const z = 2 - i * 4.6 + (Math.random() - 0.5) * 2; const x = (i % 2 ? 1 : -1) * (2.4 + Math.random() * 1.2);
    b.position.set(x, 0, z); S.add(b); npcs.push({ b, lk, home: new THREE.Vector3(x, 0, z), line: C.npcs[i % C.npcs.length], ph: Math.random() * 6 });
    world.interact.add({ pos: b.position, range: 1.8, hold: 0, label: P.talk, onDone: () => { world.say(C.npcs[i % C.npcs.length], b.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 3000); audio.sfx('pop'); } });
  }
  // crowd that gathers near the stage
  const crowd = [];
  for (let i = 0; i < 26; i++) {
    const lk = looks[i % looks.length];
    const b = billboard(charSprite(lk, { pose: i % 3 ? 'idle' : 'cheer' }), 0.06);
    b.position.set((Math.random() - 0.5) * 7, 0, STREET_END - 2 + Math.random() * 6); b.visible = false; S.add(b); crowd.push(b);
  }

  // ------------------------------------------------ interactions
  const stallItem = (st, label, fn) => world.interact.add({ pos: new THREE.Vector3(st.x * 0.75, 0, st.z), range: 2.4, hold: 0.3, label, onDone: fn });
  stallItem(stalls[0], P.taste, async () => { world.say(C.npcs[3], stalls[0].v.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 2800); audio.sfx('yay'); for (let k = 0; k < 6; k++) world.glow.emit(world.player.pos.clone().add(new THREE.Vector3(0, 1.2, -1)), new THREE.Vector3((Math.random() - 0.5), 1, 0), '#ff8fb0', 1.4); });
  stallItem(stalls[4], P.taste, async () => { world.say(C.npcs[0], stalls[4].v.position.clone().add(new THREE.Vector3(0, 2.1, 0)), 2800); audio.sfx('yay'); });
  stallItem(stalls[1], P.ring, async () => { await ringToss(); audio.sfx('chime'); });
  stallItem(stalls[2], P.fish, async () => {
    const rel = await goldfish();
    if (rel) {
      ui.note(C.fish.released, 3000); audio.sfx('splash');
      for (let k = 0; k < 20; k++) world.fx.emit(new THREE.Vector3((Math.random() - 0.5) * 6, 0.1, -34 + (Math.random() - 0.5) * 2), new THREE.Vector3((Math.random() - 0.5) * 2, 0.05, (Math.random() - 0.5) * 0.4), '#ff8a3d', 3);
    }
  });
  stallItem(stalls[3], P.paint, async () => {
    const cols = await paintLantern();
    if (!cols) return;
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
    ui.note(C.fireworks, 2500);
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
    npcs.forEach((n, i) => { n.b.position.y = Math.max(0, Math.sin(t * 3 + n.ph) * 0.03); });
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

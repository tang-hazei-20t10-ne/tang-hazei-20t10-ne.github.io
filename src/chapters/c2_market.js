// Chapter 2: morning market & photo booth.
import content from '../content.js';
import { Scene2D, drawGrassBlades } from '../two/engine2d.js';
import { TIMES } from '../core/palette.js';
import { canvas, mix, shade, light, LOOKS, randomFlower, flowerSprite, outline } from '../core/sprites.js';
import { ridgeStrip, cloudSprite, facadeStrip, cobbleStrip, stall, bunting, treeSprite, drawSway, lamp, rand } from '../two/props.js';
import { addNPC, addExit, intro, Pigeon, flyToChip } from '../two/common.js';
import { runBooth } from '../two/photobooth.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';

const C = content.market;
const P = content.prompts;

function boothSprite() {
  const [c, x] = canvas(46, 62);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(2, 10, 42, 52, '#e05a7a'); R(40, 10, 4, 52, shade('#e05a7a', 0.25)); R(2, 10, 42, 2, light('#e05a7a', 0.3));
  R(0, 4, 46, 8, '#3a2633'); R(2, 5, 42, 6, '#ffd23f');
  for (let i = 4; i < 44; i += 4) R(i, 6, 2, 4, (i / 4) % 2 ? '#fff6ea' : '#f08fa8');
  // curtain doorway
  R(8, 20, 22, 42, '#7a2a4a'); for (let i = 9; i < 30; i += 3) R(i, 20, 1, 42, '#5a1a3a'); R(8, 20, 22, 2, '#3a1a2a');
  // camera icon sign
  R(32, 22, 10, 8, '#3a3346'); R(35, 21, 4, 2, '#3a3346'); R(35, 24, 4, 4, '#7f9fdc'); R(36, 25, 1, 1, '#fff');
  // photo strips pinned
  R(32, 34, 5, 14, '#fffaf2'); R(33, 35, 3, 3, '#f59ac0'); R(33, 39, 3, 3, '#9ec1ff'); R(33, 43, 3, 3, '#ffd23f');
  R(38, 36, 4, 12, '#fffaf2'); R(39, 37, 2, 3, '#8fd36a'); R(39, 41, 2, 3, '#b49ae0');
  return outline(c);
}

function goods(kind) {
  const [c, x] = canvas(52, 12);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const r = rand(kind.length * 13);
  if (kind === 'bread') for (let i = 0; i < 6; i++) { const bx = 3 + i * 8; R(bx, 6, 7, 5, '#e8a85c'); R(bx + 1, 5, 5, 1, '#f2c47a'); R(bx + 2, 7, 1, 1, '#fbe2a8'); R(bx + 4, 8, 1, 1, '#fbe2a8'); }
  if (kind === 'flowers') for (let i = 0; i < 5; i++) { const bx = 3 + i * 10; R(bx, 6, 8, 6, '#7f9fdc'); R(bx, 6, 8, 1, '#a9c4ff'); for (let k = 0; k < 4; k++) { const f = randomFlower(r); R(bx + 1 + k * 2, 1 + (k % 2), 2, 2, f.color); R(bx + 1 + k * 2, 3, 1, 3, '#4f9a4a'); } }
  if (kind === 'hats') { for (let i = 0; i < 3; i++) { const bx = 3 + i * 14; R(bx, 8, 12, 2, '#f2d48a'); R(bx + 3, 5, 6, 3, '#e8c776'); R(bx + 3, 7, 6, 1, ['#e05a7a', '#7f9fdc', '#8fd3b6'][i]); } R(44, 7, 6, 2, '#1a1420'); R(45, 7, 1, 1, '#6a6a90'); R(48, 7, 1, 1, '#6a6a90'); }
  if (kind === 'fruit') for (let i = 0; i < 4; i++) { const bx = 2 + i * 12; R(bx, 7, 11, 5, '#a8703f'); const col = ['#ffc94d', '#e9473f', '#8fd36a', '#f59a3a'][i]; for (let k = 0; k < 4; k++) R(bx + 1 + k * 3 - (k % 2), 4 + (k % 2), 3, 3, col); }
  return outline(c);
}

function cartSprite() {
  const [c, x] = canvas(34, 30);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(2, 12, 28, 12, '#7fb0d8'); R(2, 12, 28, 2, '#a9cff0'); R(26, 12, 4, 12, shade('#7fb0d8', 0.2));
  R(4, 6, 8, 6, '#c0c0c8'); R(5, 5, 6, 1, '#e0e0e8'); R(16, 7, 10, 5, '#3a3346'); R(17, 8, 8, 2, '#f2a33a');
  R(0, 10, 34, 2, '#3a3346'); R(5, 24, 6, 6, '#3a3346'); R(7, 26, 2, 2, '#9a9aa8'); R(22, 24, 6, 6, '#3a3346'); R(24, 26, 2, 2, '#9a9aa8');
  R(30, 14, 4, 2, '#7a4a33');
  return outline(c);
}

export default async function market(game) {
  const W = 1180;
  const pal = TIMES.morning;
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 120, y: 10 + (i % 3) * 14, s: 20 + i, sp: 2 + i * 0.5 }));
  let cobble;
  const scene = new Scene2D(game, {
    id: 'market', worldW: W, time: 'morning', startX: 30,
    ambient: { motes: 1.5, leaves: 0.25 },
    light: { bloom: 0.25 },
    setup() { cobble = cobbleStrip(W, 40, 4); },
    drawBack(x, s) {
      const gy = s.groundY;
      x.drawImage(s.skyCanvas(), 0, 0);
      s.drawSun(x, Math.round(s.W * 0.18), Math.round(gy - 120), 9);
      for (const c of clouds) { const img = cloudSprite(c.s); x.drawImage(img, Math.round(((c.x + s.t * c.sp - s.cam * 0.05) % (s.W + 100)) - 50), c.y); }
      s.drawStrip(x, ridgeStrip(400, 60, { seed: 41, base: mix('#8fb0c8', pal.fog, 0.4), peak: 0.6, freq: 0.02, trees: 20, treeCol: mix('#7aa0a8', pal.fog, 0.3) }), 0.1, gy - 92);
      s.drawStrip(x, facadeStrip(600, 70, 3, pal.fog), 0.35, gy - 82);
      s.drawStrip(x, facadeStrip(700, 84, 7), 0.65, gy - 86);
      s.drawStrip(x, cobble, 1, gy - 10, { wrap: false });
      s.drawRays(x, Math.round(s.W * 0.18), Math.round(gy - 120), 0.045);
    },
    drawFront(x, s) {
      // bunting strings across the street (foreground parallax)
      const b = bunting(220);
      for (let i = -1; i < W / 200 + 1; i++) { const px = Math.round(i * 230 - s.cam * 1.05); if (px > -230 && px < s.W) x.drawImage(b, px, s.groundY - 78 + (i % 2) * 6); }
    },
  });

  // stalls & vendors
  const stalls = [
    { x: 150, aw: ['#e9809d', '#fff6ea'], g: 'bread', npc: LOOKS.bakerAunt },
    { x: 330, aw: ['#8fd3b6', '#fff6ea'], g: 'flowers', npc: LOOKS.florist },
    { x: 520, aw: ['#f6c45f', '#fff6ea'], g: 'hats', npc: LOOKS.hatGuy },
    { x: 700, aw: ['#7f9fdc', '#fff6ea'], g: 'fruit', npc: LOOKS.fruitUncle },
  ];
  const npcs = {};
  stalls.forEach((st, i) => {
    npcs[st.g] = addNPC(scene, st.npc, st.x + 6, { z: -12, dir: 1 });
    npcs[st.g].dy = -12;
    scene.addProp({ x: st.x, z: -10, img: stall(i + 1, st.aw, 56) });
    const gi = goods(st.g);
    scene.addProp({ x: st.x, z: -9, draw(ctx, camX, gy) { ctx.drawImage(gi, Math.round(st.x - camX - 26), Math.round(gy - 10 - 18 - 10)); } });
  });
  // lamps & trees
  [80, 430, 610, 880, 1050].forEach((lx, i) => scene.addProp({ x: lx, z: -11, img: lamp(false) }));
  [250, 800].forEach((tx, i) => { const sp = treeSprite('round', 0.9, 20 + i, { fruit: i ? null : '#ffd23f' }); scene.addProp({ x: tx, z: -13, draw(ctx, camX, gy, t) { drawSway(ctx, sp, tx - camX, gy - 13, t, 0.7, tx); } }); });
  // food cart with steam
  const cart = cartSprite();
  scene.addProp({ x: 900, z: -7, img: cart });
  let steamT = 0;
  // photo booth
  scene.addProp({ x: 1060, z: -10, img: boothSprite() });

  // kids
  const kidA = addNPC(scene, LOOKS.kidA, 600, { z: 4, dir: -1, lines: C.kids.lines });
  const kidB = addNPC(scene, LOOKS.kidB, 616, { z: 5, dir: -1, lines: C.kids.lines.slice().reverse() });
  // pigeons
  for (let i = 0; i < 6; i++) scene.addEntity(new Pigeon(240 + i * 22 + (i % 2) * 6, 2 + (i % 3)));

  // ---- interactions
  scene.interact.add({ x: 150, range: 22, hold: 0.3, label: P.taste, onDone: async () => {
    const h = scene.hazei;
    scene.say(npcs.bread, C.snack.lines[0], 2600);
    h.forcePose = 'hold'; h.hold = 'snack'; await wait(900);
    h.hold = null; h.forcePose = null; h.forceMood = 'happy'; audio.sfx('yay');
    scene.hearts(h.x, scene.groundY - 30, 5); scene.say(h, C.snack.react, 2600);
    scene.partner.emote('thumb');
    await wait(1600); h.forceMood = null;
    scene.say(npcs.bread, C.snack.lines[1], 2600);
  } });
  let gotFlower = false;
  scene.interact.add({ x: 330, range: 22, hold: 0.5, label: P.smell, onDone: async () => {
    const h = scene.hazei;
    h.forcePose = 'crouch'; h.forceMood = 'closed'; audio.sfx('sparkle');
    for (let i = 0; i < 10; i++) scene.spawn({ x: 330 + (Math.random() - 0.5) * 30, y: scene.groundY - 30, vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 6, life: 2.5, color: ['#ffc2d4', '#fff6a0', '#d9c2f0'][i % 3], size: 1, glow: true, wobble: 1 });
    await wait(1200); h.forcePose = null; h.forceMood = null;
    scene.say(h, C.flowers.react, 2400);
    if (!gotFlower) {
      gotFlower = true; await wait(1400);
      scene.say(npcs.flowers, C.flowers.lines[1], 3000);
      const f = { species: 'tulip', color: '#f06d8a' };
      h.forcePose = 'hold'; h.hold = 'flower'; await wait(800);
      game.addFlower(f); flyToChip(scene, h.x + 8, scene.groundY - 20, f);
      h.hold = null; h.forcePose = null; scene.partner.emote('heart');
    } else scene.say(npcs.flowers, C.flowers.lines[0], 2600);
  } });
  scene.interact.add({ x: 520, range: 22, hold: 0.3, label: P.tryOn, onDone: async () => {
    const h = scene.hazei;
    scene.say(npcs.hats, C.hats.lines[Math.floor(Math.random() * 2)], 2600);
    const pick = await new Promise((resolve) => {
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(C.hats.vendor)}</h2>`);
        const row = el('div', 'row');
        C.hats.items.forEach((name, i) => { const b = el('button', 'btn ' + (i === 2 ? 'soft' : ''), esc(name)); b.onclick = () => { ui.closeModal(); resolve(i); }; row.appendChild(b); });
        s.appendChild(row);
      });
      ui.onModalClose = () => resolve(-1);
    });
    if (pick < 0) return;
    if (pick === 0) { h.hat = !h.hat; }
    if (pick === 1) { h.sunglasses = !h.sunglasses; }
    if (pick === 2) { h.hat = false; h.sunglasses = false; }
    state.data.outfit = { hat: h.hat, glasses: h.sunglasses }; state.save();
    audio.sfx('pop'); scene.sparkles(h.x, scene.groundY - 26, 10);
    if (pick < 2) { await wait(400); scene.say(scene.partner, pick === 0 ? C.hats.reactHat : C.hats.reactGlasses, 2600); scene.partner.emote(pick === 0 ? 'heart' : 'thumb'); }
  } });
  scene.interact.add({ x: 700, range: 22, hold: 0, label: P.talk, onDone: async () => {
    scene.say(npcs.fruit, C.fruit.lines[scene._fruitI = ((scene._fruitI ?? -1) + 1) % 2], 3000);
    await wait(1200); scene.partner.emote('laugh');
  } });
  scene.interact.add({ x: 1060, range: 22, hold: 0.4, label: P.booth, onDone: async () => {
    const h = scene.hazei, p = scene.partner;
    scene.partnerAt(1048, 'idle', 1);
    h.locked = true;
    await runBooth((poseIdx) => { const map = ['heart', 'peace', 'idle', 'cheer', 'cheer', 'jump']; p.emote(['heart', 'thumb', 'heart', 'laugh', 'sparkle', 'star'][poseIdx]); h.forcePose = map[poseIdx]; setTimeout(() => { h.forcePose = null; }, 600); });
    h.locked = false; scene.partnerAt(null);
    scene.partner.emote('heart');
    scene.boothDone = true;
  } });

  addExit(scene, W - 30, C.exitSign.replace(' →', ''), { hint: C.exitHint });

  // steam + kids bounce
  const ou = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    ou?.(s, dt);
    steamT -= dt;
    if (steamT < 0) { steamT = 0.18; s.spawn({ x: 896 + Math.random() * 6, y: s.groundY - 7 - 26, vx: (Math.random() - 0.5) * 3, vy: -8 - Math.random() * 4, life: 2.2, color: '#ffffff', size: 2, wobble: 1, layer: 'mid' }); }
    const near = Math.abs(s.hazei.x - 608) < 40;
    kidA.forcePose = near ? (Math.floor(s.t * 3) % 2 ? 'wave' : 'idle') : (Math.floor(s.t * 2) % 4 === 0 ? 'jump' : null);
    kidB.forcePose = near ? 'cheer' : (Math.floor(s.t * 2 + 1) % 4 === 0 ? 'jump' : null);
  };

  audio.scene('market', [['crowd', 0.5], ['birds', 0.5]]);
  const done = scene.start();
  await intro(game, scene, C.intro);
  await done;
}

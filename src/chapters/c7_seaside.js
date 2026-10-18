// Chapter 7: seaside afternoon at golden hour.
import content from '../content.js';
import { Scene2D, drawGrassBlades } from '../two/engine2d.js';
import { lerpTime, ditherGradient } from '../core/palette.js';
import { canvas, mix, shade, light, outline, birdSprite } from '../core/sprites.js';
import { ridgeStrip, cloudSprite, bench as benchImg, rand } from '../two/props.js';
import { addBench, addExit, intro, Crab, addFlower } from '../two/common.js';
import { audio } from '../core/audio.js';
import { ui, wait } from '../core/ui.js';
import { state } from '../core/state.js';

const C = content.seaside;
const P = content.prompts;

function lanternSprite() {
  const [c, x] = canvas(9, 12);
  x.fillStyle = '#ffcf6b'; x.fillRect(1, 1, 7, 9); x.fillRect(0, 3, 9, 5);
  x.fillStyle = '#fff3c0'; x.fillRect(3, 3, 3, 5);
  x.fillStyle = '#e05a5a'; x.fillRect(1, 0, 7, 1); x.fillRect(1, 10, 7, 1);
  x.fillStyle = '#ffb04a'; x.fillRect(4, 11, 1, 1);
  return c;
}
function shellSprite(kind) {
  const [c, x] = canvas(7, 6);
  const col = ['#ffd2da', '#fff3e0', '#f6c4a0'][kind % 3];
  x.fillStyle = col; x.fillRect(1, 1, 5, 4); x.fillRect(0, 2, 7, 3);
  x.fillStyle = shade(col, 0.2); x.fillRect(2, 1, 1, 4); x.fillRect(4, 1, 1, 4);
  return outline(c, shade(col, 0.5));
}
function lighthouseFar() {
  const [c, x] = canvas(9, 24);
  for (let j = 0; j < 17; j++) { const w = Math.round(2 + j * 0.08); x.fillStyle = Math.floor(j / 4) % 2 ? '#d96a6a' : '#f6efe6'; x.fillRect(4 - w, 6 + j, w * 2 + 1, 1); }
  x.fillStyle = '#4a4458'; x.fillRect(1, 4, 7, 2); x.fillStyle = '#ffe9a8'; x.fillRect(2, 2, 5, 2); x.fillStyle = '#d96a6a'; x.fillRect(2, 0, 5, 2);
  return c;
}
function boatSprite() {
  const [c, x] = canvas(36, 22);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(2, 14, 32, 6, '#d9a066'); R(4, 20, 28, 2, '#a8703f'); R(2, 14, 32, 1, '#f0c890'); R(2, 17, 32, 1, '#e05a7a');
  R(17, 0, 2, 14, '#7a4a33'); R(19, 2, 10, 10, '#fff6ea'); R(19, 2, 10, 1, '#ffffff'); R(27, 3, 2, 8, '#e8dccb');
  return outline(c);
}

export default async function seaside(game) {
  const W = 1040;
  let progress = 0; let skyKey = ''; let skyC;
  const lh = lighthouseFar(); const boat = boatSprite();
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 130, y: 8 + (i % 3) * 12, s: 50 + i, sp: 1.5 + i * 0.4 }));
  let sand; const letters = { alpha: 0, reveal: 0, img: null, washing: 0 };
  const lanterns = [];
  const scene = new Scene2D(game, {
    id: 'seaside', worldW: W, time: 'afternoon', startX: 40,
    ambient: { motes: 1.5, moteColor: '#fff0c0' },
    light: { bloom: 0.35 },
    setup() {
      const r = rand(8); const [c, x] = canvas(W, 50);
      x.fillStyle = '#f2d29a'; x.fillRect(0, 0, W, 50);
      for (let i = 0; i < W * 4; i++) { x.fillStyle = r() < 0.5 ? '#e8c488' : '#fbe2b0'; x.fillRect(r() * W | 0, r() * 50 | 0, 1, 1); }
      for (let j = 30; j < 50; j++) for (let i = j % 2; i < W; i += 2) { x.fillStyle = '#dcb47a'; x.fillRect(i, j, 1, 1); }
      // boardwalk
      for (let i = 0; i < 280; i += 7) { x.fillStyle = i % 14 ? '#b5794a' : '#a8703f'; x.fillRect(i, 4, 6, 12); x.fillStyle = '#d9a066'; x.fillRect(i, 4, 6, 1); }
      sand = c;
    },
    drawBack(x, s) {
      const gy = s.groundY;
      const k = Math.round(progress * 5) / 5;
      const pal = lerpTime('afternoon', 'golden', k * 0.8);
      const key = s.W + 'x' + s.H + k;
      if (key !== skyKey) { [skyC] = canvas(s.W, s.H); ditherGradient(skyC.getContext('2d'), s.W, s.H, pal.sky, 0, 18); skyKey = key; s.pal = pal; s.vignette = null; }
      x.drawImage(skyC, 0, 0);
      const sx = Math.round(s.W * 0.78 - s.cam * 0.02), sy = Math.round(gy - 64 + progress * 18);
      s.drawSun(x, sx, sy, 12, pal.sun);
      for (const c of clouds) x.drawImage(cloudSprite(c.s, mix('#fff3e8', pal.sky[2], 0.3), mix(pal.sky[1], '#c97a9a', 0.35)), Math.round(((c.x + s.t * c.sp - s.cam * 0.04) % (s.W + 140)) - 70), c.y);
      // headland with lighthouse
      const hx = Math.round(880 * 0.15 - s.cam * 0.15 + s.W * 0.45);
      s.drawStrip(x, ridgeStrip(300, 36, { seed: 77, base: mix('#7a8fa8', pal.fog, 0.35), peak: 0.5, freq: 0.03, trees: 10, treeCol: mix('#6a8a8a', pal.fog, 0.3) }), 0.12, gy - 60);
      x.drawImage(lh, hx, gy - 60 - 14);
      if (Math.floor(s.t * 1.2) % 2) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.25; x.fillStyle = '#fff3c0'; x.fillRect(hx + 1, gy - 73, 7, 3); x.restore(); }
      // sea
      const seaTop = gy - 44;
      for (let j = seaTop; j < gy - 12; j++) { const t = (j - seaTop) / (gy - 12 - seaTop); x.fillStyle = mix(mix('#5f8fc8', pal.fog, 0.35), '#86d6cc', t); x.fillRect(0, j, s.W, 1); }
      // sun glitter path
      for (let i = 0; i < 40; i++) { const gx = sx + Math.round(Math.sin(i * 12.9 + s.t * 2) * (4 + i * 0.6)); const gyy = seaTop + 2 + i; if (gyy > gy - 13) break; if ((i + Math.floor(s.t * 6)) % 3 === 0) { x.fillStyle = '#fff6d0'; x.fillRect(gx, gyy, 2 + (i % 3), 1); } }
      // wave lines
      for (let k2 = 0; k2 < 18; k2++) { const wx = ((k2 * 67 + s.t * 6 - s.cam * 0.5) % (s.W + 40)) - 20; const wy = seaTop + 4 + (k2 * 7) % 26; x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(Math.round(wx), wy, 6 + (k2 % 4), 1); }
      // ground
      s.drawStrip(x, sand, 1, gy - 14, { wrap: false });
      // shore foam (rolling in & out)
      const foam = Math.sin(s.t * 0.8) * 3;
      for (let i = 0; i < s.W; i++) { const wx = i + Math.round(s.cam); const fy = Math.round(gy - 14 + foam + Math.sin(wx * 0.07 + s.t) * 1.5); x.fillStyle = 'rgba(134,214,204,.7)'; x.fillRect(i, gy - 15, 1, Math.max(0, fy - (gy - 15))); x.fillStyle = '#fffaf0'; x.fillRect(i, fy, 1, 1); }
      s.drawRays(x, sx, sy, 0.05);
    },
    drawFront(x, s) {
      // lanterns rising
      for (const l of lanterns) { const px = Math.round(l.x - s.cam), py = Math.round(l.y); x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.2; x.fillStyle = '#ffb04a'; x.fillRect(px - 3, py - 3, 15, 18); x.restore(); x.drawImage(lanternSprite(), px, py); }
      // gulls
      for (let i = 0; i < 3; i++) x.drawImage(birdSprite(Math.floor(s.t * 3 + i) % 2, '#fffaf0'), Math.round((i * 120 + s.t * 10) % (s.W + 60) - 30), 30 + i * 9 + Math.round(Math.sin(s.t + i) * 3));
    },
    update(s, dt) {
      progress = Math.max(progress, Math.min(1, s.hazei.x / (W - 100)));
      for (const l of lanterns) { l.y -= dt * 7; l.x += Math.sin(s.t * 0.8 + l.ph) * dt * 3; }
      if (letters.washing > 0) { letters.washing -= dt; letters.alpha = Math.max(0, letters.washing / 3); }
    },
  });

  // boardwalk railing posts + bench
  scene.addProp({ x: 140, z: -12, draw(ctx, camX, gy) { for (let i = 0; i < 280; i += 20) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(Math.round(i - camX), gy - 26, 2, 14); } ctx.fillStyle = '#a8703f'; ctx.fillRect(Math.round(-camX), gy - 26, 280, 2); } });
  addBench(scene, 170, { line: C.bench, sitLine: C.lighthouse });
  // beach umbrella
  scene.addProp({ x: 330, z: -6, draw(ctx, camX, gy) { const px = Math.round(330 - camX); ctx.fillStyle = '#7a4a33'; ctx.fillRect(px, gy - 36, 1, 30); for (let j = 0; j < 8; j++) { const w = 3 + j * 2; for (let i = -w; i < w; i++) { ctx.fillStyle = Math.floor((i + w) / 4) % 2 ? '#fff6ea' : '#e05a7a'; ctx.fillRect(px + i, gy - 44 + j, 1, 1); } } } });
  // beach flowers (pickable) near the dunes
  addFlower(scene, game, 300, -9, { species: 'cosmos', color: '#f59ac0' });
  addFlower(scene, game, 640, -9, { species: 'daisy', color: '#ffffff' });
  addFlower(scene, game, 860, -9, { species: 'poppy', color: '#ff8a3d' });
  // shells
  [[420, 4], [590, 6], [720, 3]].forEach(([sx, z], i) => {
    const img = shellSprite(i);
    const prop = scene.addProp({ x: sx, z, img });
    const it = scene.interact.add({ x: sx, range: 10, hold: 0.4, label: P.shell, onHold: () => { scene.hazei.forcePose = 'crouch'; }, onRelease: () => { scene.hazei.forcePose = null; }, onDone: async () => {
      scene.props.splice(scene.props.indexOf(prop), 1); scene.interact.remove(it);
      audio.sfx('pop'); scene.sparkles(sx, scene.groundY + z - 4, 8); scene.hazei.forcePose = null;
      scene.say(scene.hazei, C.shells[i], 2600); scene.partner.emote('wow');
    } });
  });
  // crabs
  scene.addEntity(new Crab(480, 8)); scene.addEntity(new Crab(800, 7));
  let crabSaid = false;
  // writing in the sand
  const sandX = 540;
  scene.addProp({ x: sandX, z: 10, draw(ctx, camX, gy) {
    if (!letters.img || letters.alpha <= 0) return;
    const w = Math.round(letters.img.width * letters.reveal);
    ctx.globalAlpha = letters.alpha; ctx.drawImage(letters.img, 0, 0, w, letters.img.height, Math.round(sandX - camX - letters.img.width / 2), gy + 2, w, letters.img.height); ctx.globalAlpha = 1;
  } });
  scene.interact.add({ x: sandX, range: 18, hold: 0.8, label: P.write, onHold: () => { scene.hazei.forcePose = 'crouch'; }, onRelease: () => { scene.hazei.forcePose = null; }, onDone: async () => {
    const h = scene.hazei; h.locked = true; h.forcePose = 'crouch';
    // render the name with the pixel font into sand-coloured pixels
    const name = content.playerName;
    const [c, x] = canvas(name.length * 9 + 4, 16);
    x.font = '16px VT323'; x.textBaseline = 'top'; x.fillStyle = '#b8884a'; x.fillText(name, 2, -1);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#b8884a'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    // add a heart
    letters.img = c; letters.alpha = 1; letters.reveal = 0;
    for (let k = 0; k <= 20; k++) { letters.reveal = k / 20; if (k % 4 === 0) audio.sfx('step'); await wait(90); }
    h.forcePose = null; h.forceMood = 'happy'; scene.partner.emote('thumb');
    await wait(2200);
    // a wave washes it away
    audio.sfx('wave'); letters.washing = 3;
    for (let i = 0; i < 30; i++) scene.spawn({ x: sandX + (Math.random() - 0.5) * 60, y: scene.groundY + 4, vx: (Math.random() - 0.5) * 10, vy: -4 - Math.random() * 4, life: 1.2, color: '#ffffff', size: 1 });
    await wait(2600);
    ui.note(C.sandWritten, 4000); h.forceMood = null; h.locked = false;
  } });
  // lantern
  scene.interact.add({ x: 780, range: 18, hold: 0.8, label: P.lantern, onHold: () => { scene.hazei.forcePose = 'hold'; scene.hazei.hold = 'lantern'; }, onRelease: () => { scene.hazei.forcePose = null; scene.hazei.hold = null; }, onDone: async () => {
    const h = scene.hazei;
    h.forcePose = 'cheer'; h.hold = null; audio.sfx('chime');
    lanterns.push({ x: h.x + 2, y: scene.groundY - 40, ph: Math.random() * 6 });
    scene.say(scene.partner, C.lantern, 2800); scene.partner.emote('sparkle');
    await wait(1600); h.forcePose = null;
    await wait(1600); ui.note(C.lanternWish, 3000);
  } });
  // pier & boat
  scene.addProp({ x: 980, z: -4, draw(ctx, camX, gy, t) {
    const px = Math.round(940 - camX);
    for (let i = 0; i < 100; i += 6) { ctx.fillStyle = i % 12 ? '#b5794a' : '#a8703f'; ctx.fillRect(px + i, gy - 8, 5, 4); }
    for (let i = 0; i < 100; i += 24) { ctx.fillStyle = '#7a4a33'; ctx.fillRect(px + i, gy - 4, 2, 10); }
    ctx.drawImage(boat, px + 40, Math.round(gy - 34 + Math.sin(t * 1.5) * 1.2));
  } });
  const ou = scene.cfg.update;
  scene.cfg.update = (s, dt) => { ou(s, dt); if (!crabSaid && Math.abs(s.hazei.x - 480) < 24) { crabSaid = true; s.say(s.partner, C.crab, 2600); } };
  addExit(scene, 930, C.exitSign.replace(' →', ''), { hint: C.exitHint, onExit: async () => {
    scene.partnerAt(scene.hazei.x - 14, 'idle');
    scene.partner.dir = 1;
    await ui.dialog([{ who: 'partner', text: C.boatLine }]);
    scene.partnerAt(scene.partner.x, 'wave', 1);
    scene.partner.emote('sparkle');
    await wait(1200);
    await game.leave(scene);
  } });

  audio.scene('seaside', [['waves', 1], ['gulls', 0.6], ['wind', 0.3]]);
  const done = scene.start();
  await intro(game, scene, C.intro);
  await done;
}

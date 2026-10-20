// Chapter 4: secondhand bookshop with a record corner and a sleeping cat.
import content from '../content.js';
import { Scene2D } from '../two/engine2d.js';
import { canvas, mix, shade, light, outline, LOOKS, flowerBig } from '../core/sprites.js';
import { rand } from '../two/props.js';
import { addNPC, addCat, addExit, intro } from '../two/common.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';

const C = content.bookshop;
const P = content.prompts;
const SPINES = ['#c4587a', '#7f9fdc', '#e8a15c', '#6aa07a', '#b49ae0', '#e05a5a', '#f6c45f', '#4f6a8a', '#8a5a3a', '#f08fa8', '#5f9e78', '#d9c7a8'];

function shelfSprite(seed, w = 60, h = 84) {
  const r = rand(seed);
  const [c, x] = canvas(w, h);
  const wood = '#8a5a3a', woodL = '#a8703f', woodS = '#6a4028';
  x.fillStyle = woodS; x.fillRect(0, 0, w, h);
  x.fillStyle = wood; x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h); x.fillRect(0, 0, w, 4);
  x.fillStyle = woodL; x.fillRect(1, 0, 1, h); x.fillRect(0, 1, w, 1);
  const rows = 4; const rh = Math.floor((h - 8) / rows);
  for (let k = 0; k < rows; k++) {
    const by = 4 + k * rh + rh - 3;
    x.fillStyle = wood; x.fillRect(0, by, w, 3); x.fillStyle = woodL; x.fillRect(0, by, w, 1);
    let bx = 5;
    while (bx < w - 6) {
      const bw = 2 + Math.floor(r() * 3), bh = rh - 6 - Math.floor(r() * 6);
      if (r() < 0.08) { bx += 3; continue; }
      const col = SPINES[Math.floor(r() * SPINES.length)];
      if (r() < 0.1 && bx < w - 14) { // lying stack
        for (let s = 0; s < 3; s++) { x.fillStyle = SPINES[Math.floor(r() * SPINES.length)]; x.fillRect(bx, by - 2 - s * 2, 9, 2); x.fillStyle = '#fff3e0'; x.fillRect(bx + 8, by - 2 - s * 2, 1, 2); }
        bx += 11; continue;
      }
      x.fillStyle = col; x.fillRect(bx, by - bh, bw, bh);
      x.fillStyle = light(col, 0.3); x.fillRect(bx, by - bh, 1, bh);
      x.fillStyle = shade(col, 0.3); x.fillRect(bx, by - bh + 3, bw, 1); x.fillRect(bx, by - 4, bw, 1);
      bx += bw + (r() < 0.2 ? 1 : 0);
    }
  }
  return outline(c, '#3a2633');
}

function counterSprite() {
  const [c, x] = canvas(54, 26);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(0, 8, 54, 4, '#b5794a'); R(0, 8, 54, 1, '#d9a066'); R(2, 12, 50, 14, '#8a5a3a'); for (let i = 6; i < 52; i += 9) R(i, 14, 1, 11, '#6a4028');
  R(34, 1, 12, 7, '#4a5a6a'); R(35, 2, 10, 3, '#9fd3c8'); R(36, 0, 8, 1, '#3a4a5a');
  R(6, 2, 10, 6, '#c4587a'); R(7, 3, 8, 1, '#fff3e0'); R(18, 4, 8, 4, '#7f9fdc');
  // bell
  R(26, 5, 4, 3, '#f6c45f'); R(27, 4, 2, 1, '#f6c45f');
  return outline(c);
}

function turntableSprite(spin = 0) {
  const [c, x] = canvas(40, 30);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(2, 16, 36, 3, '#b5794a'); R(4, 19, 2, 11, '#6a4028'); R(34, 19, 2, 11, '#6a4028');
  R(5, 9, 30, 7, '#5a3e36'); R(5, 9, 30, 1, '#7a5a4a');
  R(8, 6, 20, 4, '#1e1a24'); R(9, 5, 18, 1, '#2a2430'); R(16, 6, 4, 2, ['#e05a7a', '#f6c45f', '#7f9fdc'][spin % 3]);
  R(30, 4, 1, 6, '#c0c0c8'); R(26, 4, 5, 1, '#c0c0c8');
  // record crate
  R(0, 22, 0, 0, '#000');
  return outline(c);
}

function crateSprite() {
  const [c, x] = canvas(26, 18);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(0, 6, 26, 12, '#c98a54'); R(0, 6, 26, 1, '#e6ad74'); R(2, 10, 22, 1, '#a8703f');
  ['#e05a7a', '#7f9fdc', '#f6c45f', '#6aa07a', '#b49ae0'].forEach((col, i) => { R(2 + i * 5, 0 + (i % 2), 4, 8, col); R(3 + i * 5, 2 + (i % 2), 2, 2, '#1e1a24'); });
  return outline(c);
}

function bookCover(i) {
  const [c, x] = canvas(30, 40);
  const col = SPINES[(i * 5 + 2) % SPINES.length];
  x.fillStyle = shade(col, 0.3); x.fillRect(0, 0, 30, 40);
  x.fillStyle = col; x.fillRect(2, 0, 28, 40);
  x.fillStyle = light(col, 0.4); x.fillRect(5, 4, 22, 1); x.fillRect(5, 35, 22, 1);
  x.drawImage(flowerBig(['daisy', 'tulip', 'cosmos', 'sunflower', 'bluebell', 'lavender'][i % 6], ['#ffffff', '#f06d8a', '#f59ac0', '#ffd23f', '#7fa7f0', '#9b7fe0'][i % 6]), 0, 0, 20, 20, 6, 10, 20, 20);
  return outline(c);
}

function lampGlow(x, s, px, py) {
  x.fillStyle = '#3a2633'; x.fillRect(px, 0, 1, py - 4);
  x.fillStyle = '#e8a15c'; x.fillRect(px - 5, py - 4, 11, 4); x.fillStyle = '#ffe9a8'; x.fillRect(px - 3, py, 7, 1);
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 4; i > 0; i--) { x.globalAlpha = 0.04; x.fillStyle = '#ffcf8a'; const r = i * 9; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(px - w, py + j, w * 2, 1); } }
  x.restore();
}

export default async function bookshop(game) {
  const W = 640;
  const shelves = [shelfSprite(1), shelfSprite(2), shelfSprite(3), shelfSprite(4), shelfSprite(5)];
  const scene = new Scene2D(game, {
    id: 'bookshop', worldW: W, time: 'noon', startX: 30, groundFromBottom: 34,
    ambient: { motes: 5, moteColor: '#fff0c8' },
    light: { bloom: 0.25, tint: 'rgba(255,200,140,0.45)', vignette: '#3a2040' },
    drawBack(x, s) {
      const gy = s.groundY, camX = Math.round(s.cam);
      // wall
      x.fillStyle = '#e9c9a0'; x.fillRect(0, 0, s.W, gy);
      for (let i = -(camX % 12); i < s.W; i += 12) { x.fillStyle = '#e2bf94'; x.fillRect(i, 0, 5, gy); }
      for (let i = -(camX % 24); i < s.W; i += 24) for (let j = 8; j < gy - 40; j += 16) { x.fillStyle = '#f2d8b4'; x.fillRect(i + 2, j, 1, 1); x.fillRect(i + 1, j + 1, 3, 1); x.fillRect(i + 2, j + 2, 1, 1); }
      x.fillStyle = '#8a5a3a'; x.fillRect(0, gy - 30, s.W, 30); x.fillStyle = '#a8703f'; x.fillRect(0, gy - 30, s.W, 2);
      for (let i = -(camX % 20); i < s.W; i += 20) { x.fillStyle = '#7a4a33'; x.fillRect(i, gy - 26, 1, 26); }
      x.fillStyle = '#6a3a2a'; x.fillRect(0, 0, s.W, 6);
      // windows with light
      for (const wx of [70, 300, 520]) {
        const px = wx - camX; if (px < -80 || px > s.W + 40) continue;
        const wy = Math.max(10, gy - 120);
        x.fillStyle = '#5a3a2a'; x.fillRect(px - 2, wy - 2, 40, 44);
        x.fillStyle = '#bfe6f6'; x.fillRect(px, wy, 36, 40); x.fillStyle = '#e8f6ff'; x.fillRect(px, wy, 36, 14);
        x.fillStyle = '#8fd36a'; x.fillRect(px, wy + 28, 36, 12); x.fillStyle = '#6aa05a'; x.fillRect(px + 6, wy + 24, 10, 6);
        x.fillStyle = '#5a3a2a'; x.fillRect(px + 17, wy, 2, 40); x.fillRect(px, wy + 19, 36, 2);
        // light shaft
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.07 + Math.sin(s.t * 0.5 + wx) * 0.015; x.fillStyle = '#ffe2a8';
        x.beginPath(); x.moveTo(px, wy); x.lineTo(px + 36, wy); x.lineTo(px + 100, gy + 8); x.lineTo(px + 40, gy + 8); x.closePath(); x.fill(); x.restore();
      }
      // floor
      x.fillStyle = '#9a6a48'; x.fillRect(0, gy - 4, s.W, s.H - gy + 4);
      for (let j = gy - 4; j < s.H; j += 5) { x.fillStyle = '#8a5a3a'; x.fillRect(0, j, s.W, 1); }
      for (let i = -(camX % 26); i < s.W; i += 26) for (let j = gy - 4, k = 0; j < s.H; j += 5, k++) { x.fillStyle = '#7a4a33'; x.fillRect(i + (k % 2) * 13, j, 1, 5); }
      // rug
      const rx = 240 - camX; x.fillStyle = '#c4587a'; x.fillRect(rx, gy + 2, 120, 10); x.fillStyle = '#f6c45f'; x.fillRect(rx + 3, gy + 4, 114, 1); x.fillRect(rx + 3, gy + 9, 114, 1);
    },
    drawLight(x, s) {
      for (const lx of [130, 380, 560]) lampGlow(x, s, lx - Math.round(s.cam), Math.max(26, s.groundY - 100));
    },
  });

  // shelves (props)
  [[40, 0], [120, 1], [200, 2], [330, 3], [410, 4]].forEach(([sx, k]) => scene.addProp({ x: sx, z: -10, img: shelves[k] }));
  // plants
  const plant = (() => { const [c, x] = canvas(14, 22); x.fillStyle = '#c98a54'; x.fillRect(3, 14, 8, 8); x.fillStyle = '#e6ad74'; x.fillRect(3, 14, 8, 1); [[2, 6], [6, 2], [9, 7], [4, 10], [8, 11]].forEach(([a, b]) => { x.fillStyle = '#5fae5a'; x.fillRect(a, b, 4, 4); x.fillStyle = '#8fd36a'; x.fillRect(a, b, 2, 1); }); return outline(c); })();
  [[86, -8], [250, -9], [470, -8]].forEach(([px, z]) => scene.addProp({ x: px, z, img: plant }));
  // record corner
  let spin = 0;
  scene.addProp({ x: 300, z: -6, draw(ctx, camX, gy, t) { ctx.drawImage(turntableSprite(Math.floor(t * 8 * spin) % 3), Math.round(300 - camX - 20), Math.round(gy - 6 - 30)); } });
  scene.addProp({ x: 270, z: -5, img: crateSprite() });
  // counter & shopkeeper
  const lady = addNPC(scene, LOOKS.shopLady, 540, { z: -11, dir: -1 });
  lady.dy = -11;
  scene.addProp({ x: 545, z: -8, img: counterSprite() });
  // armchair + cat
  const chair = (() => { const [c, x] = canvas(30, 26); x.fillStyle = '#7f6fb0'; x.fillRect(2, 2, 26, 16); x.fillStyle = '#9a8ad0'; x.fillRect(4, 3, 22, 2); x.fillStyle = '#6a5a9a'; x.fillRect(0, 10, 6, 12); x.fillRect(24, 10, 6, 12); x.fillStyle = '#8a7ac0'; x.fillRect(4, 14, 22, 6); x.fillStyle = '#4a3a33'; x.fillRect(2, 22, 2, 4); x.fillRect(26, 22, 2, 4); return outline(c); })();
  scene.addProp({ x: 470, z: -7, img: chair });
  addCat(scene, 470, { z: -6, dy: -10, color: 'grey', line: C.cat, standX: 470 });

  // ---- interactions
  let bookI = 0;
  const readBook = async () => {
    const i = bookI++ % C.books.length; const b = C.books[i];
    audio.sfx('page');
    scene.hazei.forcePose = 'hold'; scene.hazei.hold = 'book';
    await new Promise((resolve) => {
      ui.onModalClose = resolve;
      ui.modal((s) => {
        const cov = document.createElement('canvas'); cov.width = 30; cov.height = 40; cov.getContext('2d').drawImage(bookCover(i), 0, 0);
        cov.style.cssText = 'width:90px;height:120px;image-rendering:pixelated;float:left;margin:0 16px 8px 0';
        s.appendChild(cov);
        s.insertAdjacentHTML('beforeend', `<h2>${esc(b.title)}</h2>${b.author ? `<p class="sub" style="margin:2px 0 0">${esc(b.author)}</p>` : ''}<p style="font-size:20px;line-height:1.55;font-weight:700;margin:10px 0 0">${esc(b.line)}</p><div style="clear:both"></div>`);
        const row = el('div', 'row mt'); row.style.justifyContent = 'flex-end'; const ok = el('button', 'btn soft', esc(content.ui.close)); ok.onclick = () => ui.closeModal(); row.appendChild(ok); s.appendChild(row);
      });
    });
    scene.hazei.forcePose = null; scene.hazei.hold = null;
    scene.partner.emote('thumb');
  };
  [40, 120, 200, 330, 410].forEach((sx) => scene.interact.add({ x: sx, range: 18, hold: 0.3, label: P.read, onDone: readBook }));
  scene.interact.add({ x: 285, range: 16, hold: 0.3, label: P.play, priority: 1, onDone: async () => {
    const pick = await new Promise((resolve) => {
      ui.onModalClose = () => resolve(-1);
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(C.recordsTitle)}</h2>`);
        const g = el('div', 'grid-opts');
        C.records.forEach((r, i) => { const b = el('button', 'opt', `<span class="n">♪ ${esc(r.title)}</span>${r.composer ? `<span class="d">${esc(r.composer)}</span>` : ''}`); b.onclick = () => { resolve(i); ui.onModalClose = null; ui.closeModal(); }; g.appendChild(b); });
        s.appendChild(g);
      });
    });
    if (pick < 0) return;
    audio.sfx('scratch'); spin = 1;
    const rec = C.records[pick];
    if (!(rec.file && await audio.playRecord(rec.file))) { audio.stopRecord(); audio.playMusic(rec.style, 1.2); }
    ui.note(`♪ ${rec.title}${rec.composer ? ' · ' + rec.composer : ''}`, 3500);
    scene.partner.emote('note');
    if (pick === 3) setTimeout(() => scene.say(scene.partner, C.partnerRecs[0], 3000), 1500);
  } });
  scene.interact.add({ x: 528, range: 16, hold: 0.4, label: P.bookmark, cond: () => !state.data.bookmark, onDone: async () => {
    scene.say(lady, C.bookmark.line, 3600);
    await wait(1600);
    state.set({ bookmark: true });
    audio.sfx('chime');
    scene.hazei.forcePose = 'hold'; scene.hazei.hold = 'book'; scene.hazei.forceMood = 'happy';
    scene.sparkles(scene.hazei.x + 8, scene.groundY - 22, 10);
    ui.note('🔖 ' + C.bookmark.name, 3000);
    await wait(1400); scene.hazei.forcePose = null; scene.hazei.hold = null; scene.hazei.forceMood = null;
    scene.partner.emote('thumb');
  } });

  // partner browses on his own now and then
  let browseT = 8;
  const ou = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    ou?.(s, dt);
    browseT -= dt;
    if (browseT < 0 && !s.partner.override && Math.abs(s.hazei.vx) < 1) {
      browseT = 14 + Math.random() * 8;
      const shelfX = [40, 120, 200, 330, 410].reduce((a, b) => (Math.abs(b - s.hazei.x) < Math.abs(a - s.hazei.x) && Math.abs(b - s.hazei.x) > 20 ? b : a), 40);
      s.partnerAt(shelfX, 'hold');
      s.partner.hold = 'book';
      setTimeout(() => { if (!s.dead) { s.partner.emote(['note', 'sparkle', 'laugh'][Math.floor(Math.random() * 3)]); } }, 1800);
      setTimeout(() => { if (!s.dead) { s.partnerAt(null); s.partner.hold = null; } }, 4200);
    }
    if (Math.abs(s.hazei.vx) > 1 && s.partner.override && s.partner.override.pose === 'hold') { s.partnerAt(null); s.partner.hold = null; }
  };

  addExit(scene, W - 36, C.exitSign.replace(' →', ''), { hint: C.exitHint });

  audio.scene('bookshop', [['room', 0.6], ['clock', 0.5]]);
  scene.cfg.cleanup = () => audio.stopRecord(1.2);
  const done = scene.start();
  await intro(game, scene, C.intro);
  await done;
}

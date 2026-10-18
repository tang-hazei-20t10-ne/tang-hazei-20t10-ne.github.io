// Chapter 6: café. Hazei picks a drink, the partner orders a Caramel Macchiato.
import content from '../content.js';
import { Scene2D, Character } from '../two/engine2d.js';
import { canvas, shade, light, outline, LOOKS, cupSprite, catSprite } from '../core/sprites.js';
import { ditherGradient, TIMES } from '../core/palette.js';
import { house, treeSprite } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';
import { upscale } from '../core/photo.js';

const C = content.cafe;

function tableSprite() {
  const [c, x] = canvas(40, 26);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(0, 0, 40, 4, '#f4efe6'); R(0, 0, 40, 1, '#ffffff'); R(1, 4, 38, 2, '#d8cfc0');
  R(18, 6, 4, 17, '#5a4a4a'); R(12, 23, 16, 3, '#5a4a4a'); R(19, 6, 1, 17, '#7a6a6a');
  return outline(c);
}
function chairSprite() {
  const [c, x] = canvas(16, 30);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(1, 0, 3, 22, '#b5794a'); R(1, 0, 1, 22, '#d9a066'); R(1, 16, 14, 3, '#b5794a'); R(1, 16, 14, 1, '#d9a066');
  R(2, 19, 2, 11, '#8a5a3a'); R(12, 19, 2, 11, '#8a5a3a'); R(4, 3, 1, 12, '#8a5a3a');
  return outline(c);
}
function machineSprite() {
  const [c, x] = canvas(30, 24);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  R(2, 2, 26, 16, '#c0c4cc'); R(2, 2, 26, 2, '#e0e4ec'); R(24, 4, 4, 14, '#9aa0aa');
  R(6, 18, 4, 3, '#3a3346'); R(18, 18, 4, 3, '#3a3346'); R(6, 21, 4, 3, '#fbf7ef'); R(18, 21, 4, 3, '#fbf7ef');
  R(10, 7, 10, 5, '#3a3346'); R(11, 8, 3, 3, '#e05a5a'); R(16, 8, 3, 3, '#8fd36a');
  return outline(c);
}

export default async function cafe(game) {
  let drink = null; const cups = [];
  let sky;
  const cat = { t: 0 };
  const scene = new Scene2D(game, {
    id: 'cafe', worldW: 0, walkable: false, hazei: false, partner: false, time: 'afternoon', inputMode: 'none', action: false, groundFromBottom: 30,
    light: { bloom: 0.3, tint: 'rgba(255,215,160,0.4)' },
    ambient: { motes: 3, moteColor: '#fff2d0' },
    drawBack(x, s) {
      const W = s.W, H = s.H, gy = s.groundY;
      // wall
      x.fillStyle = '#d8ecd8'; x.fillRect(0, 0, W, gy);
      for (let i = 0; i < W; i += 14) { x.fillStyle = '#cce2cc'; x.fillRect(i, 0, 7, gy); }
      x.fillStyle = '#f6efe2'; x.fillRect(0, gy - 26, W, 26); x.fillStyle = '#e8dccb'; x.fillRect(0, gy - 26, W, 2);
      for (let i = 0; i < W; i += 8) { x.fillStyle = '#ece2d2'; x.fillRect(i, gy - 22, 1, 22); }
      // big window on the left
      const wx0 = Math.round(W * 0.05), wx1 = Math.round(W * 0.45), wy0 = Math.max(10, gy - 112), wy1 = gy - 32;
      if (!sky || sky.width !== wx1 - wx0) { [sky] = canvas(wx1 - wx0, wy1 - wy0); ditherGradient(sky.getContext('2d'), sky.width, sky.height, TIMES.afternoon.sky, 0, 10); }
      x.drawImage(sky, wx0, wy0);
      x.save(); x.beginPath(); x.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); x.clip();
      const h1 = house(71, '#f6e3cc', '#d96a5a', 44, 30), h2 = house(72, '#fff1e0', '#7f9fdc', 36, 26);
      x.drawImage(h1, wx0 + 6, wy1 - 24 - h1.height + 10); x.drawImage(h2, wx0 + 70, wy1 - 24 - h2.height + 12);
      const tr = treeSprite('round', 0.8, 70); x.drawImage(tr.img, wx1 - 40, wy1 - 22 - tr.oy);
      x.fillStyle = '#cdb795'; x.fillRect(wx0, wy1 - 16, wx1 - wx0, 16); x.fillStyle = '#e2cfae'; x.fillRect(wx0, wy1 - 16, wx1 - wx0, 1);
      x.drawImage(catSprite('sleep', Math.floor(s.t * 0.8) % 2, 'orange'), wx0 + 48, wy1 - 28);
      x.restore();
      x.fillStyle = '#f6efe2'; x.fillRect(wx0 - 4, wy0 - 4, wx1 - wx0 + 8, 4); x.fillRect(wx0 - 4, wy1, wx1 - wx0 + 8, 5); x.fillRect(wx0 - 4, wy0, 4, wy1 - wy0); x.fillRect(wx1, wy0, 4, wy1 - wy0);
      x.fillRect(Math.round((wx0 + wx1) / 2) - 1, wy0, 3, wy1 - wy0);
      // plants on the sill
      [[wx0 + 8, '#5fae5a'], [wx1 - 16, '#79c06a']].forEach(([px, col]) => { x.fillStyle = '#e8a15c'; x.fillRect(px, wy1 - 6, 8, 6); x.fillStyle = col; x.fillRect(px - 1, wy1 - 12, 10, 6); x.fillStyle = light(col, 0.3); x.fillRect(px + 1, wy1 - 12, 3, 2); });
      // light from window
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.07; x.fillStyle = '#ffe6b8';
      x.beginPath(); x.moveTo(wx0, wy0); x.lineTo(wx1, wy0); x.lineTo(wx1 + 70, gy + 10); x.lineTo(wx0 + 70, gy + 10); x.closePath(); x.fill(); x.restore();
      // chalkboard menu
      const bx = Math.round(W * 0.56), by = Math.max(10, gy - 104);
      x.fillStyle = '#8a5a3a'; x.fillRect(bx - 2, by - 2, 54, 40); x.fillStyle = '#2f3f3a'; x.fillRect(bx, by, 50, 36);
      x.fillStyle = '#f4efe6'; for (let k = 0; k < 5; k++) { x.fillRect(bx + 5, by + 6 + k * 6, 22 - (k % 3) * 4, 1); x.fillRect(bx + 38, by + 6 + k * 6, 6, 1); }
      x.fillStyle = '#f08fa8'; x.fillRect(bx + 32, by + 26, 3, 3);
      // counter & barista area on the right
      const cx = Math.round(W * 0.72);
      x.fillStyle = '#e8dccb'; x.fillRect(cx, gy - 34, W - cx, 30); x.fillStyle = '#b5794a'; x.fillRect(cx - 2, gy - 36, W - cx + 2, 4); x.fillStyle = '#d9a066'; x.fillRect(cx - 2, gy - 36, W - cx + 2, 1);
      for (let i = cx + 6; i < W; i += 10) { x.fillStyle = '#d8cbb8'; x.fillRect(i, gy - 30, 1, 26); }
      x.drawImage(machineSprite(), cx + 18, gy - 36 - 24);
      // pendant lamps
      [0.3, 0.62, 0.86].forEach((f) => { const lx = Math.round(W * f); x.fillStyle = '#3a2633'; x.fillRect(lx, 0, 1, 18); x.fillStyle = '#f6c45f'; x.fillRect(lx - 4, 18, 9, 4); x.fillStyle = '#fff3c0'; x.fillRect(lx - 2, 22, 5, 1);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.05; x.fillStyle = '#ffd890'; for (let r = 26; r > 4; r -= 6) for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(lx - w, 22 + j, w * 2, 1); } x.restore(); });
      // floor
      x.fillStyle = '#c98a5a'; x.fillRect(0, gy - 4, W, H);
      for (let j = gy - 4; j < H; j += 6) for (let i = ((j / 6) % 2) * 6; i < W; i += 12) { x.fillStyle = '#b5794a'; x.fillRect(i, j, 6, 6); }
    },
    drawFront(x, s) {
      const gy = s.groundY, W = s.W;
      const tx = Math.round(W * 0.42);
      // drinks on the table with steam
      cups.forEach((c, i) => {
        const px = tx - 14 + i * 14 + (i ? 4 : 0), py = gy - 26 - c.img.height + 4;
        x.drawImage(c.img, px, py);
        if (c.hot && Math.floor(s.t * 3 + i) % 2 === 0) { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(px + 8 + Math.round(Math.sin(s.t * 2 + i) * 1), py - 4, 1, 3); x.fillRect(px + 10 + Math.round(Math.sin(s.t * 2 + i + 1) * 1), py - 7, 1, 3); }
      });
    },
  });
  const W = () => scene.W;
  const tx = () => Math.round(W() * 0.42);
  const table = tableSprite(), chair = chairSprite();
  scene.addProp({ z: -4, draw(ctx, camX, gy) { ctx.drawImage(table, tx() - 20, gy - 26); } });
  scene.addProp({ z: -7, draw(ctx, camX, gy) { ctx.drawImage(chair, tx() - 40, gy - 30); ctx.save(); ctx.translate(tx() + 40, 0); ctx.scale(-1, 1); ctx.drawImage(chair, 0, gy - 30); ctx.restore(); } });
  const hz = scene.addEntity(new Character(LOOKS.hazei(), 0, { z: -6, dir: 1 }));
  const pt = scene.addEntity(new Character(LOOKS.partner(), 0, { z: -6, dir: -1 }));
  const barista = scene.addEntity(new Character(LOOKS.barista, 0, { z: -12, dir: -1 }));
  hz.hat = state.data.outfit.hat; hz.sunglasses = state.data.outfit.glasses;
  hz.forcePose = 'sit'; pt.forcePose = 'sit'; hz.dy = -6; pt.dy = -6;
  let baristaX = null;
  const place = () => { hz.x = tx() - 26; pt.x = tx() + 26; barista.x = baristaX ?? Math.round(W() * 0.8); };
  place();
  scene.cfg.update = () => place();

  audio.scene('cafe', [['room', 0.8]]);
  const done = scene.start();
  await game.enter();
  await wait(2400);
  await ui.dialog(C.intro);

  // menu
  const choice = await new Promise((resolve) => {
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>☕ ${esc(C.menuTitle)}</h2>`);
      C.categories.forEach((cat) => {
        s.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(cat.name)}</div>`);
        const g = el('div', 'grid-opts');
        cat.items.forEach((it) => {
          const b = el('button', 'opt');
          const img = upscale(cupSprite(it.color, it.art, cat.name === content.cafe.categories[2].name ? 'glass' : 'mug'), 4); img.style.width = '64px'; img.style.height = '70px';
          b.append(img, el('span', 'n', esc(it.name)), el('span', 'd', esc(it.desc)));
          b.onclick = () => { audio.sfx('select'); ui.closeModal(); resolve({ it, glass: cat.name === content.cafe.categories[2].name }); };
          g.appendChild(b);
        });
        s.appendChild(g);
      });
    }, { closeable: false });
  });
  drink = choice.it; state.set({ drink: drink.id });
  hz.forceMood = 'happy'; setTimeout(() => { hz.forceMood = null; }, 1200);
  await wait(400);
  scene.say(pt, C.partnerOrder, 2800); pt.emote('thumb');
  await wait(2600);
  // barista brings the drinks
  barista.forcePose = 'hold'; barista.hold = 'snack';
  const from = W() * 0.8, to = tx() + 8;
  for (let k = 0; k <= 1; k += 0.02) { baristaX = from + (to - from) * k; barista.forcePose = 'walk'; barista.dir = -1; await wait(28); }
  barista.forcePose = 'give';
  cups.push({ img: cupSprite(drink.color, drink.art, choice.glass ? 'glass' : 'mug'), hot: !choice.glass && !['peach'].includes(drink.id) });
  cups.push({ img: cupSprite('#c98a54', true, 'mug'), hot: true });
  audio.sfx('clink');
  scene.say(barista, C.served, 3000);
  await wait(2200);
  barista.dir = 1;
  for (let k = 0; k <= 1; k += 0.02) { baristaX = to + (from - to) * k; barista.forcePose = 'walk'; barista.dir = 1; await wait(28); }
  barista.forcePose = null; barista.dir = -1;
  hz.emote('heart'); pt.emote('heart');
  scene.hearts(tx(), scene.groundY - 40, 6);
  await wait(800);
  await ui.dialog(C.moments);

  // cozy actions
  let leave;
  const left = new Promise((r) => { leave = r; });
  let sipI = 0;
  ui.actions([
    { label: '☕ ' + C.sip, onClick: async () => { audio.sfx('sip'); hz.forcePose = 'sip'; await wait(900); hz.forcePose = 'sit'; hz.forceMood = 'happy'; scene.say(hz, C.sipReact[sipI++ % C.sipReact.length], 2200); pt.emote(['heart', 'laugh', 'sparkle'][sipI % 3]); setTimeout(() => { hz.forceMood = null; }, 1500); } },
    { label: '🪟 ' + C.lookOut, onClick: () => { hz.dir = -1; ui.note(C.lookOutReact, 3000); pt.emote('heart'); setTimeout(() => { hz.dir = 1; }, 3000); } },
    { label: C.leave + ' →', cls: '', onClick: () => leave() },
  ]);
  await left;
  await game.leave(scene);
  await done;
}

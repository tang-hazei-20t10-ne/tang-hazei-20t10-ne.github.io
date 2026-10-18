// Chapter 5: omakase lunch at a tiny counter stall (Ichiraku-style). The camera
// is in the kitchen: the chef has his back to us, Hazei and Mino sit across the
// counter. Five rounds, two dishes each; every choice adds a line to the wish.
import content from '../content.js';
import { Scene2D, Character } from '../two/engine2d.js';
import { canvas, shade, light, mix, outline, LOOKS, dishSprite, charSprite } from '../core/sprites.js';
import { ditherGradient, TIMES } from '../core/palette.js';
import { ridgeStrip, house, treeSprite } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';
import { upscale } from '../core/photo.js';

const C = content.omakase;

function lantern(col = '#e05a5a') {
  const [c, x] = canvas(12, 18);
  x.fillStyle = '#3a2633'; x.fillRect(5, 0, 2, 3); x.fillRect(3, 3, 6, 1); x.fillRect(3, 15, 6, 1);
  x.fillStyle = col; x.fillRect(2, 4, 8, 11); x.fillRect(1, 6, 10, 7);
  x.fillStyle = light(col, 0.35); x.fillRect(3, 5, 2, 9);
  x.fillStyle = shade(col, 0.25); x.fillRect(1, 9, 10, 1); x.fillRect(1, 12, 10, 1);
  x.fillStyle = '#f6c45f'; x.fillRect(5, 16, 2, 2);
  return outline(c);
}
function potSprite() {
  const [c, x] = canvas(30, 26);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  P(2, 6, 26, 14, '#9aa0aa'); P(2, 6, 26, 2, '#c8ccd4'); P(24, 8, 4, 12, '#7a808a'); P(0, 9, 3, 3, '#5a5e66'); P(27, 9, 3, 3, '#5a5e66');
  P(4, 5, 22, 2, '#e8c890');
  P(1, 20, 28, 6, '#3a3346'); P(3, 21, 24, 2, '#e8603a'); P(5, 22, 20, 1, '#ffb04a');
  return outline(c);
}
function bowlsSprite() {
  const [c, x] = canvas(22, 16);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  for (let k = 0; k < 4; k++) { const y = 12 - k * 3; P(2 + k % 2, y, 18, 3, k % 2 ? '#fbf7ef' : '#f2ece2'); P(2 + k % 2, y, 18, 1, '#ffffff'); P(4 + k % 2, y + 1, 14, 1, '#c4584a'); }
  return outline(c);
}

export default async function omakase(game) {
  state.data.omakase = []; state.save();
  const served = [{ img: null, x: 0 }, { img: null, x: 0 }];
  const lan = lantern('#e05a5a'), pot = potSprite(), bowls = bowlsSprite();
  // a small booth in the middle of the screen; the rest is a quiet back alley
  const L = () => {
    const W = scene.W, H = scene.H;
    const ctop = Math.round(H * 0.6);
    const sw = Math.min(Math.round(W * 0.58), 250);
    const x0 = Math.round((W - sw) / 2), x1 = x0 + sw;
    return { W, H, ctop, x0, x1, sw, floor: ctop + 20, roof: Math.round(H * 0.16), norenB: Math.round(H * 0.33) };
  };
  let alley = null;
  const drawAlley = () => {
    const { W, H, ctop } = L();
    const [c, x] = canvas(W, H);
    ditherGradient(x, W, ctop, TIMES.noon.sky, 0, 10);
    x.drawImage(ridgeStrip(W, 60, { seed: 7, base: mix('#7fae78', '#cfe7f2', 0.35), peak: 0.5, freq: 0.03, trees: 24, treeCol: mix('#5f9a6a', '#cfe7f2', 0.25) }), 0, ctop - 74);
    // a small house far on the left and leafy trees behind a wooden fence
    const hs = house(31, '#f6e3cc', '#c4584a', 40, 28); x.drawImage(hs, Math.round(W * 0.06), ctop - 16 - hs.height + 6);
    [[0.18, 1.0, 3], [0.82, 1.15, 5], [0.95, 0.9, 6], [0.03, 0.8, 8]].forEach(([fx, sz, sd]) => { const t = treeSprite('round', sz, sd); x.drawImage(t.img, Math.round(W * fx) - t.ox, ctop - 12 - t.oy); });
    for (let i = 0; i < W; i += 7) { x.fillStyle = '#c99a6a'; x.fillRect(i, ctop - 26, 5, 16); x.fillStyle = '#e0b888'; x.fillRect(i, ctop - 26, 5, 1); }
    x.fillStyle = '#a8784a'; x.fillRect(0, ctop - 21, W, 2); x.fillRect(0, ctop - 15, W, 2);
    // street
    x.fillStyle = '#d9c7a8'; x.fillRect(0, ctop - 10, W, H); x.fillStyle = '#e8d8bc'; x.fillRect(0, ctop - 10, W, 1);
    for (let j = ctop - 6; j < H; j += 5) for (let i = (j % 2) * 4; i < W; i += 9) { x.fillStyle = '#ccb898'; x.fillRect(i, j, 5, 1); }
    // a street lamp and a potted plant by the booth
    const lx = Math.round(W * 0.88); x.fillStyle = '#3f3a4f'; x.fillRect(lx, ctop - 70, 2, 62); x.fillRect(lx - 4, ctop - 72, 10, 3); x.fillStyle = '#ffe9a8'; x.fillRect(lx - 3, ctop - 69, 8, 4);
    return c;
  };
  const scene = new Scene2D(game, {
    id: 'omakase', worldW: 0, walkable: false, hazei: false, partner: false, time: 'noon', inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.25, tint: 'rgba(255,190,120,0.45)', vignette: '#2a1428' },
    ambient: { motes: 1.5, moteColor: '#ffe2b0' },
    drawBack(x, s) {
      const { W, H, ctop, x0, x1, sw, roof, norenB } = L();
      if (!alley || alley.width !== W || alley.height !== H) alley = drawAlley();
      x.drawImage(alley, 0, 0);
      // booth: two posts, a small pitched roof with tiles
      x.fillStyle = '#5a3423'; x.fillRect(x0 - 6, roof, 6, ctop - roof + 20); x.fillRect(x1, roof, 6, ctop - roof + 20);
      x.fillStyle = '#7a4a33'; x.fillRect(x0 - 5, roof, 2, ctop - roof + 20); x.fillRect(x1 + 1, roof, 2, ctop - roof + 20);
      for (let j = 0; j < 14; j++) { const inset = 14 - j; x.fillStyle = j % 3 === 0 ? '#6a3a2a' : '#4a2a1e'; x.fillRect(x0 - 18 + inset, roof - 14 + j, sw + 36 - inset * 2, 1); }
      x.fillStyle = '#8a5a3a'; x.fillRect(x0 - 18, roof - 1, sw + 36, 3); x.fillStyle = '#a8703f'; x.fillRect(x0 - 18, roof - 1, sw + 36, 1);
      // signboard on the roof
      const bw = 44; x.fillStyle = '#3a2633'; x.fillRect(Math.round((x0 + x1) / 2 - bw / 2) - 1, roof - 25, bw + 2, 12); x.fillStyle = '#f4efe6'; x.fillRect(Math.round((x0 + x1) / 2 - bw / 2), roof - 24, bw, 10);
      { const cx = Math.round((x0 + x1) / 2), by = roof - 18; // a little steaming bowl
        x.fillStyle = '#c4584a'; x.fillRect(cx - 6, by, 12, 2); x.fillRect(cx - 5, by + 2, 10, 1); x.fillRect(cx - 3, by + 3, 6, 1);
        x.fillStyle = '#e8b86a'; x.fillRect(cx - 5, by - 1, 10, 1);
        x.fillStyle = '#9a8a9a'; for (const dx of [-3, 0, 3]) { x.fillRect(cx + dx, by - 3, 1, 1); x.fillRect(cx + dx + 1, by - 5, 1, 1); }
        x.fillStyle = '#3a2633'; x.fillRect(cx + 3, by - 6, 1, 5); x.fillRect(cx + 5, by - 6, 1, 5); }
      // noren: three short flaps
      const flaps = 3, gap = 3, fw = Math.floor((sw - gap * (flaps - 1)) / flaps);
      for (let k = 0; k < flaps; k++) {
        const fx = x0 + k * (fw + gap);
        for (let j = roof + 2; j < norenB; j++) {
          const sway = Math.round(Math.sin(s.t * 1.2 + k + j * 0.05) * ((j - roof) / (norenB - roof)) * 1.5);
          x.fillStyle = (j - roof) % 9 === 0 ? '#3a4e80' : '#2f3f6a'; x.fillRect(fx + sway, j, fw, 1);
        }
        x.fillStyle = '#f4efe6'; const cx = fx + fw / 2, cy = Math.round((roof + norenB) / 2);
        for (let a = 0; a < 24; a++) x.fillRect(Math.round(cx + Math.cos(a / 24 * Math.PI * 2) * 4), Math.round(cy + Math.sin(a / 24 * Math.PI * 2) * 4), 1, 1);
        x.fillRect(Math.round(cx) - 1, cy - 1, 3, 3);
      }
      // lanterns hanging from the roof corners
      [[x0 - 14, roof + 2], [x1 + 2, roof + 2]].forEach(([lx, ly], i) => {
        const yy = ly + Math.round(Math.sin(s.t * 1.1 + i) * 1);
        x.drawImage(lan, lx, yy);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.08; x.fillStyle = '#ffb060';
        for (let r = 20; r > 4; r -= 5) for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(lx + 6 - w, yy + 10 + j, w * 2, 1); }
        x.restore();
      });
    },
    drawFront(x) {
      const { H, ctop, floor, x0, x1, sw } = L();
      // counter
      x.fillStyle = '#e8c89a'; x.fillRect(x0 - 4, ctop, sw + 8, 6); x.fillStyle = '#f6e0b8'; x.fillRect(x0 - 4, ctop, sw + 8, 1); x.fillStyle = '#c9a070'; x.fillRect(x0 - 4, ctop + 5, sw + 8, 1);
      for (let i = x0; i < x1; i += 21) { x.fillStyle = '#d8b484'; x.fillRect(i, ctop + 2, 10, 1); }
      x.fillStyle = '#7a4a33'; x.fillRect(x0, ctop + 6, sw, 14);
      x.fillStyle = '#6a4028'; x.fillRect(x0, ctop + 12, sw, 1);
      for (let i = x0 + 8; i < x1 - 12; i += 16) { x.fillStyle = (i - x0) % 32 ? '#f2ece2' : '#c4584a'; x.fillRect(i, ctop + 8, 6, 3); x.fillStyle = '#3a2633'; x.fillRect(i + 9, ctop + 15, 2, 4); }
      // kitchen floor between the posts
      x.fillStyle = '#5a4a48'; x.fillRect(x0, floor, sw, H - floor);
      for (let j = floor; j < H; j += 6) for (let i = x0 + ((j / 6) % 2) * 6; i < x1; i += 12) { x.fillStyle = '#4a3c3c'; x.fillRect(i, j, 6, 1); }
      served.forEach((d) => { if (d.img) x.drawImage(d.img, Math.round(d.x - d.img.width / 2), ctop - d.img.height + 6); });
      const cs = charSprite(LOOKS.chef, { pose: chefPose, frame: chefFrame, back: true });
      x.drawImage(cs, Math.round(x0 + sw * 0.2) - 12, floor - 32);
      x.drawImage(bowls, x0 + 4, floor - bowls.height + 2);
      x.drawImage(pot, x1 - 34, floor - pot.height + 4);
    },
    drawLight(x) {
      const { ctop, x0, sw, roof } = L();
      const lx = Math.round(x0 + sw * 0.55), ly = roof + 6;
      x.fillStyle = '#3a2633'; x.fillRect(lx, roof, 1, 6);
      x.fillStyle = '#f6c45f'; x.fillRect(lx - 6, ly, 13, 4); x.fillStyle = '#fff3c0'; x.fillRect(lx - 4, ly + 4, 9, 1);
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.07; x.fillStyle = '#ffd890';
      x.beginPath(); x.moveTo(lx - 6, ly + 4); x.lineTo(lx + 7, ly + 4); x.lineTo(lx + 50, ctop + 4); x.lineTo(lx - 50, ctop + 4); x.closePath(); x.fill(); x.restore();
    },
  });
  let chefPose = 'idle', chefFrame = 0;

  // guests sit across the counter, facing us (and the chef)
  const pt = scene.addEntity(new Character(LOOKS.partner(), 0, { z: 0, dir: -1 }));
  const hz = scene.addEntity(new Character(LOOKS.hazei(), 0, { z: 0, dir: 1 }));
  hz.forcePose = 'sit'; pt.forcePose = 'sit';
  const place = () => {
    const { ctop, x0, sw } = L();
    const gy = scene.groundY;
    hz.x = Math.round(x0 + sw * 0.5); pt.x = Math.round(x0 + sw * 0.72);
    hz.dy = pt.dy = ctop - 4 - gy;
    served[0].x = hz.x - 16; served[1].x = pt.x + 18;
  };
  place();
  scene.cfg.onResize = place;
  scene.cfg.update = (s, dt) => {
    place();
    const { x1, floor } = L();
    if (Math.random() < dt * 6) s.spawn({ x: x1 - 25 + Math.random() * 12, y: floor - 24, vx: (Math.random() - 0.5) * 3, vy: -8 - Math.random() * 5, life: 2.4, color: '#ffffff', size: 2, wobble: 1, screen: true, layer: 'front' });
  };

  audio.scene('omakase', [['room', 0.5]]);
  const done = scene.start();
  await game.enter();
  await wait(2400);
  await ui.dialog(C.intro);

  for (let r = 0; r < C.rounds.length; r++) {
    const round = C.rounds[r];
    ui.note(`${C.roundWord} ${r + 1} · ${round.name}`, 2200);
    for (let k = 0; k < 6; k++) { chefPose = 'hold'; chefFrame = k; audio.sfx('tick'); await wait(220); }
    chefPose = 'idle';
    const pick = await new Promise((resolve) => {
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(C.roundWord)} ${r + 1} · ${esc(round.name)}</h2><p class="sub">${esc(C.choose)}</p>`);
        const g = el('div', 'grid-opts'); g.style.gridTemplateColumns = 'repeat(auto-fit,minmax(200px,1fr))';
        round.options.forEach((o, i) => {
          const b = el('button', 'opt');
          const big = upscale(dishSprite(o.sprite), 4); big.style.width = '128px'; big.style.height = '96px'; big.style.imageRendering = 'pixelated';
          b.append(big, el('span', 'n', esc(o.dish)), el('span', 'd', esc(o.short)));
          b.onclick = () => { audio.sfx('select'); resolve(i); ui.closeModal(); };
          g.appendChild(b);
        });
        s.appendChild(g);
      }, { closeable: false });
    });
    const opt = round.options[pick];
    state.data.omakase[r] = pick; state.save();
    chefPose = 'give'; chefFrame = 1; audio.sfx('pop');
    await wait(350);
    served[0].img = dishSprite(opt.sprite); served[1].img = dishSprite(opt.sprite);
    scene.sparkles(served[0].x, L().ctop - 12, 10);
    await wait(300); chefPose = 'idle';
    hz.forceMood = 'surprise'; await wait(500); hz.forceMood = null;
    await ui.dialog([{ who: 'chef', text: opt.chef }]);
    hz.forcePose = 'hold'; hz.hold = 'snack'; await wait(700);
    hz.forcePose = 'sit'; hz.hold = null; hz.forceMood = 'happy'; audio.sfx('yay');
    scene.sparkles(hz.x, L().ctop - 20, 8);
    pt.emote(['thumb', 'sparkle', 'laugh', 'thumb', 'star'][r]);
    ui.note('✨ ' + C.fragmentNote, 2400);
    audio.sfx('sparkle');
    await wait(1800);
    hz.forceMood = null;
    served[0].img = null; served[1].img = null;
  }
  await ui.dialog(C.outro);
  await game.leave(scene);
  await done;
}

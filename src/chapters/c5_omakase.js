// Chapter 5: omakase lunch at a tiny counter stall (Ichiraku-style). The camera
// is in the kitchen: the chef has his back to us, Hazei and Mino sit across the
// counter. Five rounds, two dishes each; every choice adds a line to the wish.
import content from '../content.js';
import { Scene2D, Character } from '../two/engine2d.js';
import { canvas, shade, light, outline, LOOKS, dishSprite, charSprite } from '../core/sprites.js';
import { ditherGradient, TIMES } from '../core/palette.js';
import { facadeStrip } from '../two/props.js';
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
  let sky = null, street = null;
  const L = () => {
    const W = scene.W, H = scene.H;
    const ctop = Math.round(H * 0.6);
    return { W, H, ctop, floor: ctop + 20, roof: Math.round(H * 0.07), norenB: Math.round(H * 0.27) };
  };
  const scene = new Scene2D(game, {
    id: 'omakase', worldW: 0, walkable: false, hazei: false, partner: false, time: 'noon', inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.25, tint: 'rgba(255,190,120,0.45)', vignette: '#2a1428' },
    ambient: { motes: 1.5, moteColor: '#ffe2b0' },
    drawBack(x, s) {
      const { W, H, ctop, roof, norenB } = L();
      // outside: a sunny street seen past the guests
      if (!sky || sky.width !== W) { [sky] = canvas(W, ctop); ditherGradient(sky.getContext('2d'), W, ctop, TIMES.noon.sky, 0, 10); street = facadeStrip(W + 80, Math.round(ctop * 0.55), 12); }
      x.drawImage(sky, 0, 0);
      x.drawImage(street, -20, ctop - street.height - 8);
      x.fillStyle = '#d9c7a8'; x.fillRect(0, ctop - 10, W, 10); x.fillStyle = '#e8d8bc'; x.fillRect(0, ctop - 10, W, 1);
      // stall frame: posts + roof
      x.fillStyle = '#5a3423'; x.fillRect(0, 0, 10, H); x.fillRect(W - 10, 0, 10, H);
      x.fillStyle = '#7a4a33'; x.fillRect(2, 0, 2, H); x.fillRect(W - 8, 0, 2, H);
      x.fillStyle = '#4a2a1e'; x.fillRect(0, 0, W, roof);
      for (let i = 0; i < W; i += 7) { x.fillStyle = '#5e3828'; x.fillRect(i, 0, 3, roof - 2); }
      x.fillStyle = '#8a5a3a'; x.fillRect(0, roof - 3, W, 3); x.fillStyle = '#a8703f'; x.fillRect(0, roof - 3, W, 1);
      // noren curtains with a gentle sway
      const flaps = 5, gap = 3, fw = Math.floor((W - 20 - gap * (flaps - 1)) / flaps);
      for (let k = 0; k < flaps; k++) {
        const fx = 10 + k * (fw + gap);
        for (let j = roof; j < norenB; j++) {
          const sway = Math.round(Math.sin(s.t * 1.2 + k + j * 0.05) * ((j - roof) / (norenB - roof)) * 1.5);
          x.fillStyle = (j - roof) % 9 === 0 ? '#3a4e80' : '#2f3f6a'; x.fillRect(fx + sway, j, fw, 1);
        }
        x.fillStyle = '#f4efe6'; const cx = fx + fw / 2, cy = Math.round((roof + norenB) / 2);
        for (let a = 0; a < 24; a++) x.fillRect(Math.round(cx + Math.cos(a / 24 * Math.PI * 2) * 4), Math.round(cy + Math.sin(a / 24 * Math.PI * 2) * 4), 1, 1);
        x.fillRect(Math.round(cx) - 1, cy - 1, 3, 3);
      }
      // hanging lanterns at the corners
      [[14, roof], [W - 26, roof]].forEach(([lx, ly], i) => {
        const yy = ly + Math.round(Math.sin(s.t * 1.1 + i) * 1);
        x.drawImage(lan, lx, yy);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.08; x.fillStyle = '#ffb060';
        for (let r = 20; r > 4; r -= 5) for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(lx + 6 - w, yy + 10 + j, w * 2, 1); }
        x.restore();
      });
    },
    drawFront(x) {
      const { W, H, ctop, floor } = L();
      // counter: light wood top + the kitchen-side face toward us
      x.fillStyle = '#e8c89a'; x.fillRect(10, ctop, W - 20, 6); x.fillStyle = '#f6e0b8'; x.fillRect(10, ctop, W - 20, 1); x.fillStyle = '#c9a070'; x.fillRect(10, ctop + 5, W - 20, 1);
      for (let i = 14; i < W - 14; i += 21) { x.fillStyle = '#d8b484'; x.fillRect(i, ctop + 2, 10, 1); }
      x.fillStyle = '#7a4a33'; x.fillRect(10, ctop + 6, W - 20, 14);
      x.fillStyle = '#6a4028'; x.fillRect(10, ctop + 12, W - 20, 1);
      for (let i = 20; i < W - 30; i += 16) { x.fillStyle = i % 32 ? '#f2ece2' : '#c4584a'; x.fillRect(i, ctop + 8, 6, 3); x.fillStyle = '#3a2633'; x.fillRect(i + 9, ctop + 15, 2, 4); }
      // kitchen floor
      x.fillStyle = '#5a4a48'; x.fillRect(10, floor, W - 20, H - floor);
      for (let j = floor; j < H; j += 6) for (let i = 10 + ((j / 6) % 2) * 6; i < W - 10; i += 12) { x.fillStyle = '#4a3c3c'; x.fillRect(i, j, 6, 1); }
      // dishes on the counter in front of each guest
      served.forEach((d) => { if (d.img) x.drawImage(d.img, Math.round(d.x - d.img.width / 2), ctop - d.img.height + 6); });
      // the chef (back to us) stands between us and the counter
      const cs = charSprite(LOOKS.chef, { pose: chefPose, frame: chefFrame, back: true });
      x.drawImage(cs, Math.round(W * 0.28) - 12, floor - 32);
      // kitchen props closest to us
      x.drawImage(bowls, 16, floor - bowls.height + 2);
      x.drawImage(pot, W - 52, floor - pot.height + 4);
    },
    drawLight(x) {
      const { W, ctop } = L();
      const lx = Math.round(W * 0.56), ly = 18;
      x.fillStyle = '#3a2633'; x.fillRect(lx, 8, 1, ly - 8);
      x.fillStyle = '#f6c45f'; x.fillRect(lx - 6, ly, 13, 4); x.fillStyle = '#fff3c0'; x.fillRect(lx - 4, ly + 4, 9, 1);
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.07; x.fillStyle = '#ffd890';
      x.beginPath(); x.moveTo(lx - 6, ly + 4); x.lineTo(lx + 7, ly + 4); x.lineTo(lx + 60, ctop + 4); x.lineTo(lx - 60, ctop + 4); x.closePath(); x.fill(); x.restore();
    },
  });
  let chefPose = 'idle', chefFrame = 0;

  // guests sit across the counter, facing us (and the chef)
  const pt = scene.addEntity(new Character(LOOKS.partner(), 0, { z: 0, dir: -1 }));
  const hz = scene.addEntity(new Character(LOOKS.hazei(), 0, { z: 0, dir: 1 }));
  hz.forcePose = 'sit'; pt.forcePose = 'sit';
  const place = () => {
    const { W, ctop } = L();
    const gy = scene.groundY;
    hz.x = Math.round(W * 0.5); pt.x = Math.round(W * 0.68);
    hz.dy = pt.dy = ctop - 4 - gy;
    served[0].x = hz.x - 18; served[1].x = pt.x + 20;
  };
  place();
  scene.cfg.onResize = place;
  scene.cfg.update = (s, dt) => {
    place();
    const { W, floor } = L();
    if (Math.random() < dt * 6) s.spawn({ x: W - 37 + Math.random() * 14, y: floor - 24, vx: (Math.random() - 0.5) * 3, vy: -8 - Math.random() * 5, life: 2.4, color: '#ffffff', size: 2, wobble: 1, screen: true, layer: 'front' });
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

// Chapter 5: omakase lunch. Five rounds, two dishes each; every choice adds
// a fragment to Hazei's wish.
import content from '../content.js';
import { Scene2D, Character } from '../two/engine2d.js';
import { canvas, shade, light, outline, LOOKS, dishSprite } from '../core/sprites.js';
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

export default async function omakase(game) {
  state.data.omakase = []; state.save();
  const served = []; // { img } per seat
  let chef, hz, pt;
  const lan = lantern('#e05a5a'), lan2 = lantern('#fff3e0');
  const scene = new Scene2D(game, {
    id: 'omakase', worldW: 0, walkable: false, hazei: false, partner: false, time: 'noon', inputMode: 'none', action: false, groundFromBottom: 46,
    light: { bloom: 0.3, tint: 'rgba(255,190,120,0.4)', vignette: '#2a1428' },
    ambient: { motes: 2, moteColor: '#ffe2b0' },
    drawBack(x, s) {
      const W = s.W, H = s.H, gy = s.groundY;
      // wall: warm wood slats
      x.fillStyle = '#7a4a33'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < W; i += 6) { x.fillStyle = i % 12 ? '#8a5a3a' : '#6a4028'; x.fillRect(i, 0, 3, gy); }
      // shelf with bottles & bowls
      const sy = Math.max(26, gy - 74);
      x.fillStyle = '#5a3423'; x.fillRect(0, sy, W, 3); x.fillStyle = '#a8703f'; x.fillRect(0, sy, W, 1);
      for (let i = 10; i < W - 10; i += 18) {
        const k = (i / 18) % 4;
        if (k === 0) { x.fillStyle = '#e8f0e0'; x.fillRect(i, sy - 12, 5, 12); x.fillRect(i + 1, sy - 15, 3, 3); x.fillStyle = '#c4587a'; x.fillRect(i, sy - 8, 5, 3); }
        else if (k === 1) { x.fillStyle = '#3f6a5a'; x.fillRect(i, sy - 10, 6, 10); x.fillRect(i + 2, sy - 13, 2, 3); }
        else if (k === 2) { x.fillStyle = '#f2ece2'; x.fillRect(i - 1, sy - 4, 9, 4); x.fillStyle = '#7f9fdc'; x.fillRect(i - 1, sy - 3, 9, 1); }
        else { x.fillStyle = '#c98a54'; x.fillRect(i, sy - 7, 7, 7); x.fillStyle = '#e6ad74'; x.fillRect(i, sy - 7, 7, 1); }
      }
      // menu plaques
      for (let i = 0; i < 9; i++) {
        const px = Math.round(W * 0.08 + i * W * 0.1), py = sy + 10;
        x.fillStyle = '#3a2633'; x.fillRect(px - 1, py - 1, 12, 22); x.fillStyle = '#f2e2c4'; x.fillRect(px, py, 10, 20);
        x.fillStyle = '#3a2633'; for (let k = 0; k < 4; k++) { x.fillRect(px + 3, py + 3 + k * 4, 4, 1); x.fillRect(px + 4 + (k % 2), py + 4 + k * 4, 1, 2); }
        x.fillStyle = '#c4587a'; x.fillRect(px + 7, py + 16, 2, 2);
      }
      // noren curtain
      const nx = Math.round(W * 0.18), nw = Math.round(W * 0.64);
      x.fillStyle = '#2f3f6a'; x.fillRect(nx, 0, nw, Math.max(18, sy - 10));
      for (let i = nx + Math.round(nw / 4); i < nx + nw; i += Math.round(nw / 4)) { x.fillStyle = '#7a4a33'; x.fillRect(i, 6, 2, Math.max(12, sy - 16)); }
      for (let i = nx; i < nx + nw; i += 8) { x.fillStyle = '#e8eef8'; x.fillRect(i + 2, Math.max(10, sy - 18), 4, 1); x.fillRect(i + 1, Math.max(11, sy - 17), 1, 1); x.fillRect(i + 6, Math.max(11, sy - 17), 1, 1); }
      x.fillStyle = '#e8eef8'; x.fillRect(Math.round(W / 2) - 5, 6, 10, 10); x.fillStyle = '#e05a5a'; x.fillRect(Math.round(W / 2) - 3, 8, 6, 6);
      // lanterns
      [[0.08, lan], [0.92, lan], [0.3, lan2], [0.7, lan2]].forEach(([fx, img], i) => {
        const lx = Math.round(W * fx) - 6, ly = 6 + Math.round(Math.sin(s.t * 1.2 + i) * 1);
        x.drawImage(img, lx, ly);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.07; x.fillStyle = '#ffb060';
        for (let r = 22; r > 4; r -= 6) { for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(lx + 6 - w, ly + 10 + j, w * 2, 1); } }
        x.restore();
      });
    },
    drawFront(x, s) {
      const W = s.W, gy = s.groundY;
      // counter (foreground)
      const ct = gy - 22;
      x.fillStyle = '#e8c89a'; x.fillRect(0, ct, W, 6); x.fillStyle = '#f6e0b8'; x.fillRect(0, ct, W, 1); x.fillStyle = '#c9a070'; x.fillRect(0, ct + 5, W, 1);
      for (let i = 0; i < W; i += 23) { x.fillStyle = '#d8b484'; x.fillRect(i, ct + 2, 12, 1); }
      x.fillStyle = '#6a4028'; x.fillRect(0, ct + 6, W, s.H - ct);
      for (let i = 0; i < W; i += 14) { x.fillStyle = '#5a3423'; x.fillRect(i, ct + 8, 1, s.H); }
      // dishes on the counter
      served.forEach((d) => { if (d.img) x.drawImage(d.img, Math.round(d.x - d.img.width / 2), ct - d.img.height + 4); });
      // hand-off sparkle trail
    },
  });

  const cxp = (f) => Math.round(scene.W * f);
  chef = scene.addEntity(new Character(LOOKS.chef, 0, { z: -8, dir: 1 }));
  pt = scene.addEntity(new Character(LOOKS.partner(), 0, { z: -6, dir: -1 }));
  hz = scene.addEntity(new Character(LOOKS.hazei(), 0, { z: -6, dir: -1 }));
  const place = () => {
    chef.x = cxp(0.3); hz.x = cxp(0.58); pt.x = cxp(0.72);
    served[0] = { ...(served[0] || {}), x: cxp(0.58) - 20 }; served[1] = { ...(served[1] || {}), x: cxp(0.72) - 20 };
  };
  place();
  scene.cfg.onResize = place;
  hz.forcePose = 'sit'; pt.forcePose = 'sit'; hz.dy = -19; pt.dy = -19; chef.dy = -13;
  hz.hat = state.data.outfit.hat; hz.sunglasses = state.data.outfit.glasses;
  scene.cfg.update = () => { place(); };

  const sayChef = (t, ms) => scene.say(chef, t, ms);

  audio.scene('omakase', [['room', 0.5]]);
  const done = scene.start();
  await game.enter();
  await wait(2400);
  await ui.dialog(C.intro);

  for (let r = 0; r < C.rounds.length; r++) {
    const round = C.rounds[r];
    ui.note(`${C.roundWord} ${r + 1} · ${round.name}`, 2200);
    chef.forcePose = 'hold'; audio.sfx('tick'); await wait(350); audio.sfx('tick'); await wait(350); audio.sfx('tick');
    await wait(700);
    chef.forcePose = null;
    const pick = await new Promise((resolve) => {
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(C.roundWord)} ${r + 1} · ${esc(round.name)}</h2><p class="sub">${esc(C.choose)}</p>`);
        const g = el('div', 'grid-opts'); g.style.gridTemplateColumns = 'repeat(auto-fit,minmax(200px,1fr))';
        round.options.forEach((o, i) => {
          const b = el('button', 'opt');
          const big = upscale(dishSprite(o.sprite), 4); big.style.width = '128px'; big.style.height = '96px'; big.style.imageRendering = 'pixelated';
          b.append(big, el('span', 'n', esc(o.dish)), el('span', 'd', esc(o.short)));
          b.onclick = () => { audio.sfx('select'); ui.closeModal(); resolve(i); };
          g.appendChild(b);
        });
        s.appendChild(g);
      }, { closeable: false });
    });
    const opt = round.options[pick];
    state.data.omakase[r] = pick; state.save();
    // chef serves
    chef.forcePose = 'give'; audio.sfx('pop');
    await wait(400);
    served[0].img = dishSprite(opt.sprite); served[1].img = dishSprite(round.options[pick].sprite);
    scene.sparkles(served[0].x, scene.groundY - 22, 10);
    chef.forcePose = null;
    hz.forceMood = 'surprise'; await wait(500); hz.forceMood = null;
    await ui.dialog([{ who: 'chef', text: opt.chef }]);
    // eat
    hz.forcePose = 'hold'; hz.hold = 'snack'; await wait(700);
    hz.forcePose = 'sit'; hz.hold = null; hz.forceMood = 'happy'; audio.sfx('yay');
    scene.hearts(hz.x, scene.groundY - 36, 5);
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

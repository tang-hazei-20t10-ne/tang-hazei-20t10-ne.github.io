// Photo booth: four frames, each with a backdrop and a pose; produces a strip.
import content from '../content.js';
import { canvas, charSprite, LOOKS, flowerSprite, heartSprite, randomFlower, mix, light, shade } from '../core/sprites.js';
import { ditherGradient } from '../core/palette.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { upscale, dateLabel, savePhoto } from '../core/photo.js';
import { rand } from './props.js';

const B = content.market.booth;

function drawBackdrop(x, kind, w, h) {
  const r = rand(kind * 7 + 3);
  if (kind === 0) { // flower garden
    ditherGradient(x, w, h, ['#bfe6ff', '#e6f6ff', '#d8f0c8'], 0, 8);
    x.fillStyle = '#8fd36a'; x.fillRect(0, h - 22, w, 22);
    for (let i = 0; i < 30; i++) { const f = randomFlower(r); x.drawImage(flowerSprite(f.species, f.color), (r() * w) | 0, h - 28 + (r() * 16 | 0)); }
  } else if (kind === 1) { // sea
    ditherGradient(x, w, h, ['#7cc4f0', '#c8ecf9', '#ffe9c8'], 0, 8);
    x.fillStyle = '#4f9fd8'; x.fillRect(0, h * 0.55, w, h * 0.2);
    for (let i = 0; i < w; i += 6) { x.fillStyle = '#bfe6ff'; x.fillRect(i + (r() * 3 | 0), h * 0.6 + (r() * 8 | 0), 3, 1); }
    x.fillStyle = '#f2d29a'; x.fillRect(0, h * 0.75, w, h);
    x.fillStyle = '#fff6d8'; for (let j = -6; j <= 6; j++) { const ww = Math.round(Math.sqrt(36 - j * j)); x.fillRect(w * 0.78 - ww, h * 0.22 + j, ww * 2, 1); }
  } else if (kind === 2) { // starry
    ditherGradient(x, w, h, ['#141a3e', '#2c2a6a', '#6a4a8a'], 0, 8);
    for (let i = 0; i < 40; i++) { x.fillStyle = r() < 0.3 ? '#ffe9a8' : '#fff'; x.fillRect(r() * w | 0, r() * h * 0.8 | 0, 1, 1); }
    x.fillStyle = '#fff3d0'; for (let j = -5; j <= 5; j++) { const ww = Math.round(Math.sqrt(25 - j * j)); x.fillRect(w * 0.2 - ww, h * 0.25 + j, ww * 2, 1); }
  } else { // candy
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { x.fillStyle = ((i + j) >> 3) % 2 ? '#ffd2e0' : '#fff0f5'; x.fillRect(i, j, 1, 1); }
    for (let i = 0; i < 10; i++) x.drawImage(heartSprite(['#ef5a7a', '#f590a8', '#ffb3c6'][i % 3]), r() * (w - 8) | 0, r() * (h - 30) | 0);
  }
}

const POSES = [
  { hz: { pose: 'heart', mood: 'happy' }, pt: { pose: 'heart', mood: 'happy' } },
  { hz: { pose: 'peace', mood: 'happy' }, pt: { pose: 'peace', mood: 'normal' } },
  { hz: { pose: 'idle', mood: 'closed' }, pt: { pose: 'idle', mood: 'happy' }, lean: true },
  { hz: { pose: 'idle', mood: 'silly' }, pt: { pose: 'cheer', mood: 'silly' } },
  { hz: { pose: 'cheer', mood: 'happy', hat: true }, pt: { pose: 'idle', mood: 'happy', sunglasses: true } },
  { hz: { pose: 'jump', mood: 'happy' }, pt: { pose: 'jump', mood: 'happy' } },
];

export function boothFrame(backdrop, pose, w = 64, h = 52) {
  const [c, x] = canvas(w, h);
  drawBackdrop(x, backdrop, w, h);
  const p = POSES[pose];
  const hz = charSprite(LOOKS.hazei(), p.hz);
  const pt = charSprite(LOOKS.partner(), p.pt);
  const gap = p.lean ? 15 : 19;
  const cx = w / 2;
  // partner on the left facing right, Hazei on the right facing left
  x.drawImage(pt, Math.round(cx - gap / 2 - 12), h - 30);
  x.save(); x.translate(Math.round(cx + gap / 2), 0); x.scale(-1, 1); x.drawImage(hz, -12, h - 30); x.restore();
  if (p.lean) x.drawImage(heartSprite('#ef5a7a'), cx - 4, h - 42);
  return c;
}

export function boothStrip(frames) {
  const fw = 64, fh = 52, pad = 6, top = 6, bottom = 22;
  const [c, x] = canvas(fw + pad * 2, top + frames.length * (fh + pad) + bottom);
  x.fillStyle = '#fffaf2'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#f2e6d6'; x.fillRect(0, c.height - 1, c.width, 1);
  frames.forEach((f, i) => { x.fillStyle = '#3a2633'; x.fillRect(pad - 1, top + i * (fh + pad) - 1, fw + 2, fh + 2); x.drawImage(f, pad, top + i * (fh + pad)); });
  const big = upscale(c, 6);
  const bx = big.getContext('2d');
  bx.fillStyle = '#c4587a'; bx.textAlign = 'center';
  bx.font = '40px VT323'; bx.fillText(B.stripTitle, big.width / 2, big.height - 62);
  bx.fillStyle = '#9a7f8e'; bx.font = '28px VT323'; bx.fillText(dateLabel(), big.width / 2, big.height - 30);
  return big;
}

function preview(c, size = 96) {
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  o.getContext('2d').drawImage(c, 0, 0);
  o.style.width = size + 'px'; o.style.height = Math.round(size * c.height / c.width) + 'px'; o.style.imageRendering = 'pixelated';
  return o;
}

// Runs the booth flow. Returns when the strip is saved.
export async function runBooth(onFlash) {
  const frames = [];
  for (let i = 0; i < 4; i++) {
    const choice = await new Promise((resolve) => {
      let bd = i % 4, ps = i;
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(B.title)}</h2><p class="sub">${esc(i === 0 ? B.intro : '')} ${esc(B.frame)} ${i + 1}/4</p>`);
        const pv = el('div', 'center'); s.appendChild(pv);
        const redraw = () => { pv.innerHTML = ''; pv.appendChild(preview(upscale(boothFrame(bd, ps), 3), 240)); };
        s.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(B.chooseBackdrop)}</div>`);
        const g1 = el('div', 'grid-opts'); g1.style.gridTemplateColumns = 'repeat(auto-fill,minmax(110px,1fr))';
        B.backdrops.forEach((name, k) => {
          const o = el('button', 'opt' + (k === bd ? ' sel' : ''));
          const [bc, bx] = canvas(32, 24); drawBackdrop(bx, k, 32, 24);
          o.append(preview(bc, 64), el('span', 'n', esc(name)));
          o.onclick = () => { bd = k; g1.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === k)); audio.sfx('select'); redraw(); };
          g1.appendChild(o);
        });
        s.appendChild(g1);
        s.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(B.choosePose)}</div>`);
        const g2 = el('div', 'grid-opts'); g2.style.gridTemplateColumns = 'repeat(auto-fill,minmax(110px,1fr))';
        B.poses.forEach((name, k) => {
          const o = el('button', 'opt' + (k === ps ? ' sel' : ''), `<span class="n">${esc(name)}</span>`);
          o.onclick = () => { ps = k; g2.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === k)); audio.sfx('select'); redraw(); };
          g2.appendChild(o);
        });
        s.appendChild(g2);
        const row = el('div', 'row mt'); row.style.justifyContent = 'center';
        const go = el('button', 'btn', '📷 ' + esc(content.ui.photo)); go.onclick = () => { ui.closeModal(); resolve({ bd, ps }); };
        row.appendChild(go); s.appendChild(row);
        redraw();
      }, { closeable: false });
    });
    // countdown
    for (const n of B.countdown) { ui.note(n, 600); audio.sfx(n === B.countdown[3] ? 'shutter' : 'tick'); await wait(n === B.countdown[3] ? 200 : 650); }
    ui.flash(); onFlash?.(choice.ps);
    frames.push(boothFrame(choice.bd, choice.ps));
    await wait(500);
  }
  const strip = boothStrip(frames);
  audio.sfx('yay');
  await savePhoto(strip, { title: B.title, kind: 'strip', filename: 'dai-anh-hazei.png' });
  ui.note(B.done, 3000);
}

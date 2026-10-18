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
    for (let i = 0; i < 14; i++) { x.fillStyle = ['#f6c45f', '#7f9fdc', '#8fd3b6', '#f08fa8'][i % 4]; const sx = r() * (w - 6) | 0, sy = r() * (h - 30) | 0; x.fillRect(sx + 1, sy, 1, 3); x.fillRect(sx, sy + 1, 3, 1); }
  }
}

const POSES = [
  { hz: { pose: 'peace', mood: 'happy' }, pt: { pose: 'peace', mood: 'happy' } },
  { hz: { pose: 'idle', mood: 'silly' }, pt: { pose: 'cheer', mood: 'silly' } },
  { hz: { pose: 'wave', mood: 'happy' }, pt: { pose: 'wave', mood: 'happy' }, five: true },
  { hz: { pose: 'idle', mood: 'happy' }, pt: { pose: 'idle', mood: 'happy' }, close: true },
  { hz: { pose: 'jump', mood: 'happy' }, pt: { pose: 'jump', mood: 'happy' } },
  { hz: { pose: 'idle', mood: 'normal', sunglasses: true }, pt: { pose: 'idle', mood: 'normal', sunglasses: true } },
];

export function boothFrame(backdrop, pose, w = 64, h = 52) {
  const [c, x] = canvas(w, h);
  drawBackdrop(x, backdrop, w, h);
  const p = POSES[pose];
  const hz = charSprite(LOOKS.hazei(), p.hz);
  const pt = charSprite(LOOKS.partner(), p.pt);
  const gap = p.close ? 14 : p.five ? 24 : 19;
  const cx = w / 2;
  // partner on the left facing right, Hazei on the right facing left
  x.drawImage(pt, Math.round(cx - gap / 2 - 12), h - 30);
  x.save(); x.translate(Math.round(cx + gap / 2), 0); x.scale(-1, 1); x.drawImage(hz, -12, h - 30); x.restore();
  if (p.five) { x.fillStyle = '#ffe066'; [[0, -3], [0, 3], [-3, 0], [3, 0], [-2, -2], [2, 2], [2, -2], [-2, 2]].forEach(([dx, dy]) => x.fillRect(Math.round(cx + dx), h - 22 + dy, 1, 1)); }
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
// Runs the whole booth inside one window: pick backdrop + pose, countdown on
// the preview, flash, the new photo grows big then drops into the strip.
export async function runBooth(onFlash) {
  const frames = [];
  let bd = 0, ps = 0, idx = 0, busy = false;
  let finish;
  const finished = new Promise((r) => { finish = r; });
  ui.modal((s) => {
    s.classList.add('booth');
    s.insertAdjacentHTML('beforeend', `<h2>${esc(B.title)}</h2><p class="sub booth-sub"></p>`);
    const wrap = el('div', 'booth-wrap'); s.appendChild(wrap);
    const strip = el('div', 'booth-strip'); wrap.appendChild(strip);
    const slots = [0, 1, 2, 3].map(() => { const d = el('div', 'booth-slot'); strip.appendChild(d); return d; });
    strip.insertAdjacentHTML('beforeend', `<div class="booth-strip-title">${esc(B.stripTitle)}</div>`);
    const right = el('div', 'booth-right'); wrap.appendChild(right);
    const pv = el('div', 'booth-pv'); right.appendChild(pv);
    const count = el('div', 'booth-count'); pv.appendChild(count);
    const sub = s.querySelector('.booth-sub');
    const redraw = () => {
      pv.querySelector('canvas')?.remove();
      pv.prepend(preview(upscale(boothFrame(bd, ps), 3), 260));
      sub.textContent = `${idx === 0 ? B.intro + ' ' : ''}${B.frame} ${idx + 1}/4`;
      slots.forEach((d, i) => d.classList.toggle('next', i === idx));
    };
    right.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(B.chooseBackdrop)}</div>`);
    const g1 = el('div', 'grid-opts booth-opts');
    B.backdrops.forEach((name, k) => {
      const o = el('button', 'opt' + (k === bd ? ' sel' : ''));
      const [bc, bx] = canvas(32, 24); drawBackdrop(bx, k, 32, 24);
      o.append(preview(bc, 56), el('span', 'n', esc(name)));
      o.onclick = () => { if (busy) return; bd = k; g1.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === k)); audio.sfx('select'); redraw(); };
      g1.appendChild(o);
    });
    right.appendChild(g1);
    right.insertAdjacentHTML('beforeend', `<div class="menu-cat">${esc(B.choosePose)}</div>`);
    const g2 = el('div', 'grid-opts booth-opts');
    B.poses.forEach((name, k) => {
      const o = el('button', 'opt' + (k === ps ? ' sel' : ''), `<span class="n">${esc(name)}</span>`);
      o.onclick = () => { if (busy) return; ps = k; g2.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === k)); audio.sfx('select'); redraw(); };
      g2.appendChild(o);
    });
    right.appendChild(g2);
    const row = el('div', 'row mt'); row.style.justifyContent = 'center';
    const go = el('button', 'btn', '📷 ' + esc(content.ui.photo));
    row.appendChild(go); right.appendChild(row);
    redraw();

    go.onclick = async () => {
      if (busy) return; busy = true; s.classList.add('busy');
      // countdown on the preview
      for (const n of B.countdown.slice(0, 3)) { count.textContent = n; count.classList.remove('pop'); void count.offsetWidth; count.classList.add('pop'); audio.sfx('tick'); await wait(650); }
      count.textContent = '';
      audio.sfx('shutter'); onFlash?.(ps);
      const fl = el('div', 'booth-flash'); pv.appendChild(fl); setTimeout(() => fl.remove(), 500);
      const shot = boothFrame(bd, ps); frames.push(shot);
      // the photo grows big in the middle of the screen, then drops into its slot
      const big = upscale(shot, 6); big.className = 'booth-photo';
      const r0 = pv.querySelector('canvas').getBoundingClientRect();
      const W = Math.min(innerWidth * 0.7, 520), H = W * shot.height / shot.width;
      Object.assign(big.style, { left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px' });
      document.body.appendChild(big);
      await wait(260);
      Object.assign(big.style, { left: (innerWidth - W) / 2 + 'px', top: (innerHeight - H) / 2 + 'px', width: W + 'px', height: H + 'px', transform: 'rotate(-2deg)' });
      await wait(1500);
      const r1 = slots[idx].getBoundingClientRect();
      Object.assign(big.style, { left: r1.left + 'px', top: r1.top + 'px', width: r1.width + 'px', height: r1.height + 'px', transform: 'none', borderWidth: '2px' });
      await wait(650);
      big.remove();
      const thumb = preview(shot, 10); thumb.style.width = '100%'; thumb.style.height = '100%';
      slots[idx].innerHTML = ''; slots[idx].appendChild(thumb); slots[idx].classList.add('filled');
      audio.sfx('pop');
      idx++;
      if (idx >= 4) { finish(); return; }
      bd = idx % B.backdrops.length; ps = idx % B.poses.length;
      g1.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === bd));
      g2.querySelectorAll('.opt').forEach((e, j) => e.classList.toggle('sel', j === ps));
      redraw();
      busy = false; s.classList.remove('busy');
    };
  }, { closeable: false });
  await finished;
  await wait(500);
  const strip = boothStrip(frames);
  audio.sfx('yay');
  await savePhoto(strip, { title: B.title, kind: 'strip', filename: 'dai-anh-hazei.png' });
  ui.note(B.done, 3000);
}

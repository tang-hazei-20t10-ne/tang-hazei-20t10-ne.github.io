// Polaroids, photo-booth strips, wish cards and bouquet compositions.
import content from '../content.js';
import { canvas, flowerBig, randomFlower, shade, mix } from './sprites.js';
import { album } from './state.js';
import { ui, el, esc } from './ui.js';
import { audio } from './audio.js';

const FONT_PX = "'VT323', monospace";
const FONT_BODY = "'Nunito', sans-serif";

export function dateLabel() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Upscale a pixel canvas with nearest neighbour.
export function upscale(src, scale) {
  const [c, x] = canvas(Math.round(src.width * scale), Math.round(src.height * scale));
  x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export function polaroid(src, caption) {
  // crop to 4:3-ish window from centre, scale to ~600px wide
  const sw = src.width, sh = src.height;
  const ar = 4 / 3;
  let cw = sw, ch = Math.round(sw / ar);
  if (ch > sh) { ch = sh; cw = Math.round(sh * ar); }
  const sx = Math.floor((sw - cw) / 2), sy = Math.floor((sh - ch) / 2);
  const W = 640; const scale = W / cw;
  const H = Math.round(ch * scale);
  const pad = 32, bottom = 120;
  const [c, x] = canvas(W + pad * 2, H + pad + bottom);
  x.fillStyle = '#fffaf2'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#efe4d6'; x.fillRect(0, c.height - 4, c.width, 4);
  x.imageSmoothingEnabled = false;
  x.drawImage(src, sx, sy, cw, ch, pad, pad, W, H);
  // soft vignette inside the photo
  const g = x.createRadialGradient(pad + W / 2, pad + H / 2, H * 0.3, pad + W / 2, pad + H / 2, H * 0.9);
  g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(1, 'rgba(60,30,50,0.25)');
  x.fillStyle = g; x.fillRect(pad, pad, W, H);
  x.fillStyle = '#3a2633'; x.textAlign = 'center';
  x.font = `44px ${FONT_PX}`; x.fillText(caption || content.ui.photoCaptionDefault, c.width / 2, H + pad + 58);
  x.font = `26px ${FONT_PX}`; x.fillStyle = '#9a7f8e'; x.fillText(`${content.playerName} · ${dateLabel()}`, c.width / 2, H + pad + 92);
  return c;
}

export function downloadCanvas(c, name) {
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png'); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

// Shows a freshly taken photo, stores it in the album.
export async function savePhoto(c, { title, kind = 'photo', filename = 'hazei-anh.png' } = {}) {
  const dataUrl = c.toDataURL('image/png');
  await album.add({ kind, title, dataUrl });
  return new Promise((resolve) => {
    ui.onModalClose = resolve;
    ui.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>${esc(title || content.ui.photo)}</h2><p class="sub">${esc(content.ui.photoSaved)}</p>`);
      const img = new Image(); img.src = dataUrl; img.className = 'photo-preview'; s.appendChild(img);
      const row = el('div', 'row mt'); row.style.justifyContent = 'center';
      const dl = el('button', 'btn', esc(content.ui.download)); dl.onclick = () => downloadCanvas(c, filename);
      const ok = el('button', 'btn soft', esc(content.ui.next)); ok.onclick = () => ui.closeModal();
      row.append(dl, ok); s.appendChild(row);
    });
  });
}

// Camera snapshot with shutter + flash, then polaroid preview.
export async function takePhoto(srcCanvas, caption, title) {
  audio.sfx('shutter'); ui.flash();
  const snap = canvas(srcCanvas.width, srcCanvas.height);
  snap[1].drawImage(srcCanvas, 0, 0);
  const p = polaroid(snap[0], caption);
  await savePhoto(p, { title: title || content.ui.photo, filename: `hazei-${Date.now()}.png` });
}

// ---------------------------------------------------------------- bouquet
// Always at least MIN stems; gift flowers fill quietly.
export function bouquetFlowers(picked, min = 11) {
  const list = picked.slice(-21).map((f) => ({ ...f, gift: false }));
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  while (list.length < min) list.push({ ...randomFlower(r), gift: true });
  return list;
}

export function drawBouquet(picked, size = 256) {
  const flowers = bouquetFlowers(picked);
  const S = 96; // pixel canvas
  const [c, x] = canvas(S, S);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const cx = 48, base = 78;
  // stems
  const n = flowers.length;
  const heads = flowers.map((f, i) => {
    const ring = i < 1 ? 0 : i < 7 ? 1 : 2;
    const k = ring === 0 ? 0 : ring === 1 ? (i - 1) / 6 : (i - 7) / Math.max(1, n - 7);
    const ang = ring === 0 ? -Math.PI / 2 : -Math.PI / 2 + (k - 0.5) * (ring === 1 ? 2.2 : 2.9) + (ring === 2 ? 0.12 : 0);
    const rad = ring === 0 ? 4 : ring === 1 ? 16 : 27;
    return { f, x: Math.round(cx + Math.cos(ang) * rad * 1.1), y: Math.round(40 + Math.sin(ang) * rad * 0.8 + (ring === 2 ? 6 : 0)), ring };
  });
  x.strokeStyle = '#4f9a4a'; x.lineWidth = 1;
  heads.forEach((h) => {
    const steps = 40;
    for (let s = 0; s <= steps; s++) { const t = s / steps; P(Math.round(h.x + (cx - h.x) * t), Math.round(h.y + (base - h.y) * t), 1, 1, s % 7 === 0 ? '#6dbb5a' : '#4f9a4a'); }
  });
  // leaves / greenery
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i / 8 - 0.5) * 3.0; const lx = Math.round(cx + Math.cos(a) * 30), ly = Math.round(46 + Math.sin(a) * 22); P(lx - 2, ly, 5, 2, '#6dbb5a'); P(lx - 1, ly - 1, 3, 1, '#8fd36a'); }
  // baby's breath
  for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 22; P(Math.round(cx + Math.cos(a) * r), Math.round(40 + Math.sin(a) * r * 0.7), 1, 1, '#fffaf2'); }
  // heads: back ring first
  [...heads].sort((a, b) => b.ring - a.ring).forEach((h) => { const img = flowerBig(h.f.species, h.f.color); x.drawImage(img, h.x - 10, h.y - 10); });
  // wrapping paper
  const paper = '#f6dfe6', paperS = shade(paper, 0.18);
  for (let j = 0; j < 30; j++) {
    const y = 56 + j; const half = Math.max(3, 26 - j * 0.85);
    P(Math.round(cx - half), y, Math.round(half * 2), 1, j % 6 === 0 ? mix(paper, '#fff', 0.4) : paper);
    P(Math.round(cx + half - 3), y, 3, 1, paperS);
  }
  // paper folds
  for (let j = 0; j < 14; j++) { P(cx - 26 + j, 56 + j, 1, 1, paperS); P(cx + 25 - j, 56 + j, 1, 1, paperS); }
  // ribbon
  P(cx - 8, 70, 16, 3, '#e05a7a'); P(cx - 12, 67, 5, 4, '#e05a7a'); P(cx + 7, 67, 5, 4, '#e05a7a'); P(cx - 2, 69, 4, 5, '#c4587a');
  P(cx - 4, 73, 2, 9, '#e05a7a'); P(cx + 2, 73, 2, 8, '#e05a7a');
  const out = upscale(c, size / S);
  return { canvas: out, flowers };
}

// ---------------------------------------------------------------- wish
// The wish collects one line from every choice made during the day:
// the donut at the fair, the five omakase dishes and the café drink.
export function wishParts(choices = {}) {
  const frags = [];
  const donut = content.market.snack.donuts[choices.donut];
  if (donut) frags.push(donut.fragment);
  content.omakase.rounds.forEach((r, i) => {
    const ch = (choices.omakase || [])[i];
    frags.push(ch != null ? r.options[ch].fragment : content.wish.defaultFragments[i]);
  });
  const drink = content.cafe.fragments[choices.drink];
  if (drink) frags.push(drink);
  return { opening: content.wish.opening, fragments: frags, closing: content.wish.closing, footer: content.wish.footer };
}

export function wishHTML(parts, stagger = 0.5) {
  return `<div class="wish"><div class="open">${esc(parts.opening)}</div><ul>${parts.fragments.map((f, i) => `<li style="animation-delay:${(i + 1) * stagger}s">${esc(f)}</li>`).join('')}</ul><div class="close" style="animation-delay:${(parts.fragments.length + 1) * stagger}s">${esc(parts.closing)}</div><div class="foot" style="animation-delay:${(parts.fragments.length + 2) * stagger}s">${esc(parts.footer)}</div></div>`;
}

function wrap(x, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

export function wishCard(parts, bouquetPicked) {
  const W = 900, H = 1200;
  const [c, x] = canvas(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a2556'); g.addColorStop(0.55, '#7a4a7e'); g.addColorStop(1, '#f39a8a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,248,230,${0.3 + Math.random() * 0.7})`; const s = Math.random() < 0.1 ? 4 : 2; x.fillRect(Math.random() * W | 0, Math.random() * H * 0.6 | 0, s, s); }
  // card
  x.fillStyle = '#fff8ee'; x.fillRect(60, 300, W - 120, H - 360);
  x.fillStyle = '#3a2633'; x.fillRect(60, 300, W - 120, 6); x.fillRect(60, H - 66, W - 120, 6); x.fillRect(60, 300, 6, H - 360); x.fillRect(W - 66, 300, 6, H - 360);
  const bq = drawBouquet(bouquetPicked, 300).canvas;
  x.imageSmoothingEnabled = false; x.drawImage(bq, W / 2 - 150, 40);
  x.fillStyle = '#c4587a'; x.textAlign = 'center';
  x.font = `64px ${FONT_PX}`; x.fillText(content.wish.cardTitle, W / 2, 390);
  x.textAlign = 'left'; x.fillStyle = '#3a2633';
  let y = 460;
  x.font = `bold 34px ${FONT_BODY}`; x.fillText(parts.opening, 110, y); y += 60;
  x.font = `600 30px ${FONT_BODY}`;
  for (const f of parts.fragments) {
    const lines = wrap(x, f, W - 260);
    x.fillStyle = '#e05a7a'; x.fillText('✿', 110, y); x.fillStyle = '#3a2633';
    lines.forEach((l) => { x.fillText(l, 150, y); y += 42; });
    y += 8;
  }
  y += 16;
  x.font = `bold 30px ${FONT_BODY}`;
  wrap(x, parts.closing, W - 220).forEach((l) => { x.fillText(l, 110, y); y += 44; });
  x.textAlign = 'center'; x.fillStyle = '#c4587a'; x.font = `48px ${FONT_PX}`;
  x.fillText(parts.footer, W / 2, Math.min(H - 110, y + 60));
  return c;
}

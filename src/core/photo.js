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

// A photo taken during a scene: saved to the album, it grows big in the middle
// of the screen, then shrinks away into the album button.
export async function photoToAlbum(src, { caption, title } = {}) {
  const p = polaroid(src, caption);
  const dataUrl = p.toDataURL('image/png');
  await album.add({ kind: 'photo', title: title || content.ui.photo, dataUrl });
  const hud = document.getElementById('hud'), hidden = hud?.classList.contains('hidden');
  if (hidden) ui.hud(true);
  const img = new Image(); img.src = dataUrl; img.className = 'album-fly'; img.alt = '';
  const W = Math.min(innerWidth * 0.6, 460), H = W * p.height / p.width;
  const box = (l, t, w, h) => ({ left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
  Object.assign(img.style, box((innerWidth - W * 0.15) / 2, (innerHeight - H * 0.15) / 2, W * 0.15, H * 0.15), { opacity: '0' });
  document.body.appendChild(img);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  Object.assign(img.style, box((innerWidth - W) / 2, (innerHeight - H) / 2, W, H), { opacity: '1', transform: 'rotate(-3deg)' });
  await new Promise((r) => setTimeout(r, 2600));
  const btn = hud?.querySelector('.album')?.getBoundingClientRect();
  const tx = btn?.width ? btn.left + btn.width / 2 : innerWidth - 40, ty = btn?.width ? btn.top + btn.height / 2 : 30;
  Object.assign(img.style, box(tx - 14, ty - 11, 28, 22), { opacity: '0.3', transform: 'rotate(0deg)', borderWidth: '2px' });
  await new Promise((r) => setTimeout(r, 750));
  img.remove(); audio.sfx('pop');
  const b = hud?.querySelector('.album'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  await new Promise((r) => setTimeout(r, 600));
  if (hidden) ui.hud(false);
}

// ---------------------------------------------------------------- bouquet
// Always at least MIN stems; gift flowers fill quietly.
// Sunflowers stay out of the bouquet.
const inBouquet = (f) => f.species !== 'sunflower';
export function bouquetFlowers(picked, min = 11) {
  const list = picked.filter(inBouquet).slice(-21).map((f) => ({ ...f, gift: false }));
  let seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  while (list.length < min) { const f = randomFlower(r); if (inBouquet(f)) list.push({ ...f, gift: true }); }
  return list;
}

// A round, full bouquet: flower heads packed in a dome over leaves and baby's
// breath, a fan of paper behind, a folded paper cone in front and a bow.
// opts.paper sets the wrapping colour. Returns the canvas, the flowers and
// where the cone gathers (in the 96px drawing), for hands to hold it.
export function drawBouquet(picked, size = 256, { paper = '#f6dfe6' } = {}) {
  const flowers = bouquetFlowers(picked);
  const S = 96;
  const [c, x] = canvas(S, S);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  let seed = 11; const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const cx = 48;
  const paperL = mix(paper, '#ffffff', 0.45), paperS = shade(paper, 0.16), paperD = shade(paper, 0.3);
  // paper fan behind the flowers, with a scalloped edge
  for (let j = 0; j < 40; j++) {
    const y = 18 + j, half = 34 - j * 0.55;
    P(cx - half, y, half * 2, 1, j < 2 ? paperL : paper);
    P(cx - half, y, 2, 1, paperS); P(cx + half - 2, y, 2, 1, paperS);
  }
  for (let i = 0; i < 9; i++) { const sx = cx - 34 + i * 8.5; P(sx, 16, 6, 2, paperL); P(sx + 1, 15, 4, 1, paperL); }
  // leaves fanning out between the heads
  const leaf = (lx, ly, a, len, col) => { for (let k = 0; k < len; k++) { const w = k < len / 2 ? 1 + k / 2 : 1 + (len - k) / 2; P(lx + Math.cos(a) * k - w / 2, ly + Math.sin(a) * k, Math.max(1, w), 1, col); } };
  for (let i = 0; i < 13; i++) { const a = -Math.PI + 0.15 + (i / 12) * (Math.PI - 0.3); leaf(cx + Math.cos(a) * 12, 46 + Math.sin(a) * 9, a, 24 + (i % 3) * 4, i % 2 ? '#4f9a4a' : '#6dbb5a'); }
  // flower heads in a dome: a crown, then rows widening toward the front
  const rows = [[1, 0, 12], [4, 26, 20], [5, 40, 29], [5, 52, 39], [4, 44, 47]];
  const spots = [];
  rows.forEach(([n, span, y]) => { for (let i = 0; i < n; i++) spots.push([cx + (n === 1 ? 0 : -span / 2 + (i * span) / (n - 1)) + (r() - 0.5) * 3, y + (r() - 0.5) * 3]); });
  // every spot gets a head (repeating the flowers if there are fewer of them)
  spots.forEach(([hx, hy], i) => { const f = flowers[i % flowers.length]; x.drawImage(flowerBig(f.species, f.color), Math.round(hx - 10), Math.round(hy - 10)); });
  // baby's breath sprinkled around the dome
  for (let i = 0; i < 40; i++) { const a = -Math.PI * r(), rr = 22 + r() * 14; const bx = cx + Math.cos(a) * rr * 1.15, by = 34 + Math.sin(a) * rr * 0.75; P(bx, by, 1, 1, '#fffaf2'); if (r() < 0.3) P(bx + 1, by, 1, 1, '#f3ead8'); }
  // the paper cone in front: two folded panels gathered at the bottom
  const top = 50, bot = 88, grip = { x: cx, y: 70 };
  for (let j = 0; j <= bot - top; j++) {
    const y = top + j, k = j / (bot - top), half = 27 * (1 - k) + 4 * k;
    P(cx - half, y, half, 1, paper);
    P(cx, y, half, 1, paperS);
    P(cx - half, y, 1, 1, paperD); P(cx + half - 1, y, 1, 1, paperD);
  }
  for (let i = 0; i < 54; i += 6) { P(cx - 27 + i, top, 3, 1, paperL); }
  for (let j = 0; j < 18; j++) { P(cx - 19 + j * 0.8, top + 2 + j * 1.2, 1, 1, paperL); P(cx + 18 - j * 0.8, top + 2 + j * 1.2, 1, 1, paperD); }
  // satin bow where the cone is gathered, with two tails
  const bow = '#e05a7a', bowD = '#b83f62', bowL = '#f39ab4';
  P(cx - 13, 66, 11, 6, bow); P(cx + 2, 66, 11, 6, bow); P(cx - 12, 66, 9, 1, bowL); P(cx + 3, 66, 9, 1, bowL);
  P(cx - 13, 71, 11, 1, bowD); P(cx + 2, 71, 11, 1, bowD);
  P(cx - 3, 65, 6, 8, bowD); P(cx - 2, 66, 4, 6, bow);
  for (let k = 0; k < 10; k++) { P(cx - 3 - k * 0.6, 73 + k, 3, 1, k % 4 ? bow : bowD); P(cx + 1 + k * 0.6, 73 + k, 3, 1, k % 4 ? bow : bowD); }
  const out = upscale(c, size / S);
  return { canvas: out, flowers, grip };
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

// The wish card: every line wraps inside the card, and the card grows taller
// when there is more to say.
export function wishCard(parts, bouquetPicked) {
  const W = 900, PADX = 110, TEXT_W = W - PADX * 2;
  const m = canvas(1, 1)[1];
  const fonts = { open: `bold 34px ${FONT_BODY}`, frag: `600 30px ${FONT_BODY}`, close: `bold 30px ${FONT_BODY}`, foot: `48px ${FONT_PX}` };
  const lines = (font, text, w) => { m.font = font; return wrap(m, text, w); };
  const openL = lines(fonts.open, parts.opening, TEXT_W);
  const fragL = parts.fragments.map((f) => lines(fonts.frag, f, TEXT_W - 40));
  const closeL = lines(fonts.close, parts.closing, TEXT_W);
  const footL = lines(fonts.foot, parts.footer, W - 160);
  // measure the content, then size the canvas to it
  const cardTop = 330, titleY = cardTop + 90;
  let y = titleY + 70;
  y += openL.length * 46 + 14;
  fragL.forEach((ls) => { y += ls.length * 42 + 8; });
  y += 16 + closeL.length * 44 + 30;
  const footY = y + 20;
  y = footY + (footL.length - 1) * 52 + 50;
  const H = Math.max(1200, y + 60);
  const [c, x] = canvas(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a2556'); g.addColorStop(0.55, '#7a4a7e'); g.addColorStop(1, '#f39a8a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,248,230,${0.3 + Math.random() * 0.7})`; const st = Math.random() < 0.1 ? 4 : 2; x.fillRect(Math.random() * W | 0, Math.random() * 300 | 0, st, st); }
  // card
  const cardH = H - cardTop - 60;
  x.fillStyle = '#fff8ee'; x.fillRect(60, cardTop, W - 120, cardH);
  x.fillStyle = '#3a2633'; x.fillRect(60, cardTop, W - 120, 6); x.fillRect(60, cardTop + cardH - 6, W - 120, 6); x.fillRect(60, cardTop, 6, cardH); x.fillRect(W - 66, cardTop, 6, cardH);
  // the bouquet sits on top of the card
  const bq = drawBouquet(bouquetPicked, 384).canvas;
  x.imageSmoothingEnabled = false; x.drawImage(bq, W / 2 - 192, cardTop - 330);
  x.fillStyle = '#c4587a'; x.textAlign = 'center';
  x.font = `64px ${FONT_PX}`; x.fillText(content.wish.cardTitle, W / 2, titleY);
  x.textAlign = 'left'; x.fillStyle = '#3a2633';
  y = titleY + 70;
  x.font = fonts.open; openL.forEach((l) => { x.fillText(l, PADX, y); y += 46; }); y += 14;
  x.font = fonts.frag;
  fragL.forEach((ls) => {
    x.fillStyle = '#e05a7a'; x.fillText('✿', PADX, y); x.fillStyle = '#3a2633';
    ls.forEach((l) => { x.fillText(l, PADX + 40, y); y += 42; });
    y += 8;
  });
  y += 16;
  x.font = fonts.close; closeL.forEach((l) => { x.fillText(l, PADX, y); y += 44; });
  x.textAlign = 'center'; x.fillStyle = '#c4587a'; x.font = fonts.foot;
  footL.forEach((l, i) => x.fillText(l, W / 2, footY + i * 52));
  return c;
}

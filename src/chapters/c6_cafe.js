// Chapter 6: café. Hazei picks a drink, the partner orders a salted coffee.
// A small, warm corner café: walnut wainscot and plank floor, an arched window
// onto a garden, plants on every ledge, fairy lights under the ceiling beam.
import content from '../content.js';
import { Scene2D, Character } from '../two/engine2d.js';
import { canvas, shade, light, outline, LOOKS, cupSprite, catSprite, butterflySprite } from '../core/sprites.js';
import { ditherGradient, TIMES } from '../core/palette.js';
import { house, treeSprite, bushSprite, fence } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';
import { upscale, photoToAlbum } from '../core/photo.js';
import { paintStatue, showPair, minoFigure, miniFigure, statuePhoto, MINO_PICK } from './cafe_statue.js';

const C = content.cafe;
const S = C.statue;

const WD = { dk: '#4e3326', md: '#6e4630', lt: '#8c5c3e', hi: '#b07a52', top: '#c99566', lip: '#e0b07a' };
const G = { dk: '#3f6e43', md: '#56925a', lt: '#78b36a', hi: '#9fd07f', stem: '#4d6b38' };
const BRASS = ['#b8862e', '#d8a84a', '#f2cf7a'];
const PLASTER = '#efe2c8';

const R = (x, a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
// filled ellipse, row by row so the edges stay crisp
const ell = (x, cx, cy, rx, ry, col) => {
  x.fillStyle = col;
  for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j / (ry + 0.5)) ** 2))); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); }
};
const ln = (x, x0, y0, x1, y1, col) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  x.fillStyle = col; for (let k = 0; k <= n; k++) x.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1);
};
// a pointed leaf growing from (bx, by) towards angle a; its upper half catches the light
const leaf = (x, bx, by, a, len, wd, col, hi) => {
  const c = Math.cos(a), s = Math.sin(a), r = Math.ceil(len) + 1;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const u = i * c + j * s, v = -i * s + j * c;
    const uu = (u - len / 2) / (len / 2), vv = v / (wd * (1 - Math.abs(uu) * 0.3));
    if (uu * uu + vv * vv > 1) continue;
    x.fillStyle = hi && j < -0.3 * len * Math.abs(c) + 0.2 && v * Math.sign(c || 1) < 0 ? hi : col;
    x.fillRect(Math.round(bx + i), Math.round(by + j), 1, 1);
  }
};
// a trailing pothos stem, leaves alternating left and right
const vine = (x, x0, y0, n, seed) => {
  for (let k = 0; k < n; k++) {
    const px = x0 + Math.round(Math.sin(k * 0.55 + seed) * 1.5), py = y0 + k * 2;
    R(x, px, py, 1, 2, G.stem);
    if (k % 2 === 0 || k === n - 1) { const sd = (k >> 1) % 2 ? 1 : -2; R(x, px + sd, py + 1, 2, 2, (k + seed) % 3 ? G.md : G.dk); R(x, px + sd, py + 1, 1, 1, G.lt); }
  }
};
// a tapering pot, base centre (px, by)
const pot = (x, px, by, w, h, col) => {
  for (let j = 0; j < h; j++) { const ww = Math.round(w - (j / h) * w * 0.25); R(x, px - ww / 2, by - h + j, ww, 1, col); R(x, px + ww / 2 - 2, by - h + j, 2, 1, shade(col, 0.15)); }
  R(x, px - w / 2 - 1, by - h, w + 2, 2, light(col, 0.12)); R(x, px - w / 2 - 1, by - h, w + 2, 1, light(col, 0.3));
  R(x, px - w / 2 + 1, by - h + 2, w - 2, 1, shade(col, 0.25));
};

// planter hanging from the beam: macramé cords, a ceramic pot, pothos spilling down
function hanger(x, px, top, py, seed) {
  for (let j = top; j < py; j++) { const f = (j - top) / (py - top); R(x, px - Math.round(f * 4), j, 1, 1, '#d9c6a0'); R(x, px + Math.round(f * 4), j, 1, 1, '#cbb790'); }
  R(x, px - 1, top, 3, 2, BRASS[1]);
  R(x, px - 5, py, 11, 5, '#ece4d4'); R(x, px - 5, py, 11, 1, '#fbf6ec'); R(x, px + 3, py + 1, 2, 4, '#d4c8b4'); R(x, px - 4, py + 5, 9, 1, '#cbbda6');
  R(x, px - 5, py + 2, 11, 1, '#d9b48c');
  for (let k = 0; k < 5; k++) leaf(x, px - 4 + k * 2, py + 1, -Math.PI / 2 + (k - 2) * 0.55, 5, 1.6, k % 2 ? G.md : G.dk, G.lt);
  vine(x, px - 5, py + 3, 8 + (seed % 4), seed); vine(x, px + 5, py + 2, 12 + (seed % 3), seed + 2); vine(x, px, py + 5, 5, seed + 4);
}
// fiddle-leaf fig in a woven basket, base centre (px, by)
function fig(x, px, by, h) {
  R(x, px, by - h + 4, 1, h - 12, '#6a4a34');
  // a bare trunk, then a crown of big leaves, widest a little below the top
  const n = Math.max(4, Math.floor(h * 0.55 / 4)), crown = h * 0.58;
  for (let k = n; k >= 0; k--) {
    const f = k / n, y = by - h + 4 + f * crown, sd = k % 2 ? 1 : -1;
    const a = k === 0 ? -Math.PI / 2 : (sd > 0 ? -0.75 + f * 0.5 : Math.PI + 0.75 - f * 0.5);
    leaf(x, px, y, a, 7 + Math.sin(f * Math.PI) * 4, 3.6, k % 3 === 1 ? G.dk : G.md, G.lt);
  }
  for (let j = 0; j < 10; j++) {
    const w = Math.round(14 - j * 0.35);
    R(x, px - w / 2, by - 10 + j, w, 1, j % 3 === 2 ? '#a8804a' : '#c9a46a');
    for (let i = (j % 2) * 2; i < w; i += 4) R(x, px - w / 2 + i, by - 10 + j, 1, 1, '#b48e56');
  }
  R(x, px - 8, by - 11, 16, 2, '#dcbb80');
}
// monstera in a terracotta pot: a fan of big split leaves
function monstera(x, px, by) {
  const lv = [[-2.35, 14, 0], [-1.95, 18, 1], [-1.45, 20, 0], [-1.0, 16, 1], [-0.65, 12, 0], [-2.7, 10, 1]];
  lv.forEach(([a, len, k]) => {
    const ex = px + Math.cos(a) * len, ey = by - 11 + Math.sin(a) * len;
    ln(x, px, by - 11, ex, ey, G.stem);
  });
  lv.forEach(([a, len, k]) => {
    const ex = px + Math.cos(a) * len, ey = by - 11 + Math.sin(a) * len;
    const la = a + (Math.cos(a) < 0 ? -0.6 : 0.6);
    leaf(x, ex, ey, la, 11, 4.6, k ? G.dk : G.md, G.lt);
    // the splits, cut in from the leaf edge
    const c = Math.cos(la), s = Math.sin(la);
    for (const u of [3, 5.5, 8]) for (const sd of [-1, 1]) {
      R(x, ex + c * u - s * sd * 3.6, ey + s * u + c * sd * 3.6, 1, 1, G.stem);
      R(x, ex + c * u - s * sd * 2.6, ey + s * u + c * sd * 2.6, 1, 1, G.stem);
    }
  });
  pot(x, px, by, 15, 11, '#c8714a');
}

// the garden seen through the window, with the spot where the cat suns itself
function gardenView(w, h) {
  const [c, x] = canvas(w, h);
  ditherGradient(x, w, h, TIMES.afternoon.sky, 0, 10);
  for (let i = 0; i < w; i++) { const y = Math.round(h * 0.56 + Math.sin(i * 0.045 + 1) * 3 + Math.sin(i * 0.13) * 1.2); R(x, i, y, 1, h - y, '#a9c79c'); }
  const cot = house(71, '#f6e3cc', '#d96a5a', 28, 18); x.drawImage(cot, Math.round(w * 0.38), Math.round(h * 0.66) - cot.height);
  const t1 = treeSprite('round', 0.45, 5, { leaf: '#86bb72' }); x.drawImage(t1.img, Math.round(w * 0.16) - t1.ox, Math.round(h * 0.64) - t1.oy);
  for (let i = 0; i < w; i++) { const y = Math.round(h * 0.68 + Math.sin(i * 0.04 + 2) * 2); R(x, i, y, 1, h - y, '#8cbf72'); R(x, i, y, 1, 1, '#a9d48a'); }
  const t2 = treeSprite('round', 0.75, 71); x.drawImage(t2.img, Math.round(w * 0.84) - t2.ox, Math.round(h * 0.8) - t2.oy);
  const fc = fence(w + 8, '#f4ece0'); x.drawImage(fc, -4, Math.round(h * 0.72) - 6);
  // a warm patch of sun on the lawn
  for (let j = Math.round(h * 0.8); j < h; j++) for (let i = 0; i < w; i++) if (((i + j) & 3) === 0 && Math.abs(i - w * 0.5) < w * 0.2) R(x, i, j, 1, 1, '#b4dc90');
  const flowers = ['#f7a8c0', '#fff3c8', '#f6c45f', '#f29a7a'];
  for (let i = -6, n = 0; i < w; i += 20, n++) {
    if (Math.abs(i + 13 - w * 0.5) < w * 0.17) continue; // leave the sunny spot open for the cat
    x.drawImage(bushSprite(n + 3, n % 2 ? '#62a058' : '#6fae5f', flowers[n % 4]), i, h - 14);
  }
  return c;
}

// the whole room minus the things that move, painted once per screen size
function paintRoom(W, H, gy) {
  const [c, x] = canvas(W, H);
  const lay = layout(W, H, gy);
  const { wx0, wx1, wy0, wy1, ah, wainTop, wallBase, tx, cx } = lay;

  // plaster wall, a little darker up under the beam, with a faint sprig stencil
  R(x, 0, 0, W, wainTop, PLASTER);
  for (let j = 6; j < 22; j++) for (let i = (j % 2); i < W; i += 2) if (j < 14 || (i + j) % 4 === 0) R(x, i, j, 1, 1, '#e4d3b4');
  for (let j = 30, row = 0; j < wainTop - 8; j += 22, row++) for (let i = 8 + (row % 2) * 12; i < W; i += 24) {
    R(x, i, j, 1, 5, '#e6d5b6'); R(x, i - 1, j + 1, 1, 1, '#e6d5b6'); R(x, i + 1, j + 2, 1, 1, '#e6d5b6'); R(x, i - 1, j + 3, 1, 1, '#e6d5b6');
  }
  // walnut wainscot: a moulded rail and raised panels
  R(x, 0, wainTop, W, wallBase - wainTop, WD.md);
  for (let px = 3; px < W; px += 24) {
    const pw = 18, py = wainTop + 6, ph = wallBase - wainTop - 11;
    R(x, px, py, pw, ph, WD.dk); R(x, px + 1, py + 1, pw - 1, ph - 1, WD.lt); R(x, px + 2, py + 2, pw - 3, ph - 3, WD.md);
    R(x, px + 2, py + 2, pw - 3, 1, shade(WD.md, 0.12));
  }
  R(x, 0, wainTop, W, 3, WD.top); R(x, 0, wainTop, W, 1, WD.lip); R(x, 0, wainTop + 3, W, 1, WD.dk);
  R(x, 0, wainTop - 1, W, 1, '#d9c6a6');

  // plank floor, rows widening towards us
  for (let y = wallBase, k = 0; y < H; k++) {
    const h = 2 + Math.round(k * 0.9), len = 22 + h * 5, off = (k * 17) % len;
    for (let px = -off, n = 0; px < W; px += len, n++) {
      R(x, px, y, len, h, ['#c58a58', '#b98050', '#cf9762'][(n * 7 + k * 3) % 3]);
      R(x, px, y, 1, h, '#9a6640');
    }
    R(x, 0, y, W, 1, '#a8724a');
    y += h;
  }
  R(x, 0, wallBase - 3, W, 3, WD.dk); R(x, 0, wallBase - 3, W, 1, WD.lt);
  // a round woven rug under the table
  const rx = Math.min(54, Math.round(W * 0.2));
  ell(x, tx, gy - 3, rx, 6, '#9a5240'); ell(x, tx, gy - 3, rx - 2, 5, '#c26e52'); ell(x, tx, gy - 3, rx - 5, 4, '#ecd8ae');
  ell(x, tx, gy - 3, rx - 12, 3, '#8a9a5b'); ell(x, tx, gy - 3, rx - 14, 2, '#ecd8ae'); ell(x, tx, gy - 3, rx - 24, 1, '#c26e52');
  for (let i = -rx + 6; i < rx - 6; i += 4) R(x, tx + i, gy - 3 + ((i >> 2) % 2 ? -4 : 4), 1, 1, '#d8b47c');

  // ceiling beam
  R(x, 0, 0, W, 6, WD.dk); R(x, 0, 5, W, 1, WD.lt); R(x, 0, 6, W, 1, '#cdb894');
  for (let i = 18; i < W; i += 46) R(x, i, 1, 1, 3, WD.md);

  // ---- the arched window
  const ww = wx1 - wx0, wh = wy1 - wy0;
  const span = (j, grow = 0) => { // [left, right] of the arch opening on row j (relative to wy0)
    if (j >= ah) return [-grow, ww + grow];
    const dy = (ah - j) / (ah + grow), hw = (ww / 2 + grow) * Math.sqrt(Math.max(0, 1 - dy * dy));
    return [Math.round(ww / 2 - hw), Math.round(ww / 2 + hw)];
  };
  for (let j = -4; j < wh + 1; j++) { const [l, r] = span(j, 4); if (r > l) R(x, wx0 + l, wy0 + j, r - l, 1, j < 0 || l < -2 ? WD.md : WD.md); }
  for (let j = -4; j < wh; j++) { const [l, r] = span(j, 4); if (r > l) R(x, wx0 + l, wy0 + j, 1, 1, WD.hi); }
  const view = gardenView(ww, wh);
  for (let j = 0; j < wh; j++) { const [l, r] = span(j); if (r > l) x.drawImage(view, l, j, r - l, 1, wx0 + l, wy0 + j, r - l, 1); }
  // glazing bars: two uprights, a transom where the arch springs, a rail across the middle
  const bars = [Math.round(ww / 3), Math.round(ww * 2 / 3)];
  for (let j = 0; j < wh; j++) { const [l, r] = span(j); bars.forEach((b) => { if (b > l && b < r) { R(x, wx0 + b - 1, wy0 + j, 2, 1, WD.md); R(x, wx0 + b - 1, wy0 + j, 1, 1, WD.lt); } }); }
  const mid = Math.round(ah + (wh - ah) * 0.5);
  [ah, mid].forEach((j) => { R(x, wx0, wy0 + j, ww, 2, WD.md); R(x, wx0, wy0 + j, ww, 1, WD.lt); });
  // light glancing off the glass
  x.save(); x.globalAlpha = 0.18; for (let j = 0; j < 10; j++) { R(x, wx0 + 6 + j, wy0 + ah + 4 + j, 3, 1, '#ffffff'); R(x, wx0 + ww / 3 + 5 + j, wy0 + mid + 4 + j, 2, 1, '#ffffff'); } x.restore();
  // sill with a few pots
  R(x, wx0 - 6, wy1, ww + 12, 4, WD.top); R(x, wx0 - 6, wy1, ww + 12, 1, WD.lip); R(x, wx0 - 6, wy1 + 4, ww + 12, 1, WD.dk); R(x, wx0 - 3, wy1 + 5, ww + 6, 1, '#d9c6a6');
  if (ww > 60) {
    pot(x, wx0 + 8, wy1, 7, 6, '#c8714a'); for (let k = 0; k < 4; k++) leaf(x, wx0 + 8, wy1 - 6, -Math.PI / 2 + (k - 1.5) * 0.5, 5, 1.4, G.md, G.lt);
    pot(x, wx1 - 10, wy1, 8, 6, '#e9e1d2'); ell(x, wx1 - 10, wy1 - 8, 4, 2, G.dk); [[-3, -9], [0, -11], [3, -9], [-1, -8]].forEach(([dx, dy], k) => R(x, wx1 - 10 + dx, wy1 + dy, 2, 2, ['#f08fa8', '#fff3c8', '#f08fa8', '#f6c45f'][k]));
    R(x, wx1 - 22, wy1 - 6, 3, 6, '#7f9fdc'); R(x, wx1 - 22, wy1 - 6, 1, 6, '#a9c0ec'); ln(x, wx1 - 21, wy1 - 7, wx1 - 22, wy1 - 12, G.stem); R(x, wx1 - 23, wy1 - 13, 2, 2, '#fff3c8');
  }
  // linen curtains on a brass rod, tied back
  const rodY = wy0 - 8;
  R(x, wx0 - 12, rodY, ww + 24, 1, BRASS[1]); R(x, wx0 - 13, rodY - 1, 2, 3, BRASS[2]); R(x, wx1 + 11, rodY - 1, 2, 3, BRASS[2]);
  const tieY = wy0 + Math.round(wh * 0.55);
  [[wx0 - 10, 1], [wx1 + 10, -1]].forEach(([ox, dir]) => {
    for (let y = rodY + 1; y < wy1 + 2; y++) {
      const w = y < tieY ? Math.round(11 - (y - rodY) / (tieY - rodY) * 6) : Math.round(5 + Math.min(4, (y - tieY) * 0.35));
      for (let i = 0; i < w; i++) R(x, dir > 0 ? ox + i : ox - i, y, 1, 1, i % 3 === 1 ? '#8fa784' : i === w - 1 ? '#7d9573' : '#a8bf9b');
    }
    R(x, dir > 0 ? ox : ox - 6, tieY, 7, 2, BRASS[1]); R(x, dir > 0 ? ox : ox - 6, tieY, 7, 1, BRASS[2]);
  });

  // ---- between the window and the counter: botanical prints over a little shelf
  const m0 = wx1 + 16, m1 = cx - 22;
  if (m1 - m0 > 30) {
    const sy = wainTop - 26, mx = Math.round((m0 + m1) / 2);
    const frame = (fx, fy, fw, fh, k) => {
      R(x, fx, fy, fw, fh, WD.dk); R(x, fx + 1, fy + 1, fw - 2, fh - 2, '#f8f1e2'); R(x, fx, fy, fw, 1, WD.lt);
      R(x, fx + fw / 2, fy + 4, 1, fh - 7, G.stem);
      for (let q = 0; q < 3; q++) { leaf(x, fx + fw / 2, fy + 6 + q * 3, -0.6 - (k ? 0.2 : 0), 4, 1.3, k ? '#8aa86a' : G.md); leaf(x, fx + fw / 2, fy + 6 + q * 3, Math.PI + 0.6, 4, 1.3, k ? '#8aa86a' : G.md); }
      if (k) R(x, fx + fw / 2 - 1, fy + 3, 3, 2, '#e9a0a8');
      R(x, fx + 1, fy + fh, fw, 1, 'rgba(70,40,20,.25)');
    };
    frame(mx - 17, sy - 34, 14, 19, 0); frame(mx + 3, sy - 30, 14, 15, 1);
    R(x, m0 + 2, sy, m1 - m0 - 4, 3, WD.top); R(x, m0 + 2, sy, m1 - m0 - 4, 1, WD.lip); R(x, m0 + 2, sy + 3, m1 - m0 - 4, 1, WD.dk);
    R(x, m0 + 5, sy + 4, 2, 4, WD.dk); R(x, m1 - 7, sy + 4, 2, 4, WD.dk);
    // a jar of beans, a stack of books, a pothos trailing over the edge
    R(x, m0 + 6, sy - 9, 7, 9, '#dfeef0'); R(x, m0 + 7, sy - 6, 5, 6, '#6b4632'); R(x, m0 + 6, sy - 10, 7, 2, BRASS[1]); R(x, m0 + 7, sy - 8, 1, 6, '#ffffff');
    [['#b8664e', 13], ['#4f6b5a', 11], ['#e2c48a', 12]].forEach(([col, bw], k) => { R(x, m0 + 17, sy - 3 - k * 3, bw, 3, col); R(x, m0 + 17, sy - 3 - k * 3, bw, 1, light(col, 0.2)); });
    pot(x, m1 - 11, sy, 8, 6, '#e9e1d2'); for (let k = 0; k < 4; k++) leaf(x, m1 - 11, sy - 6, -Math.PI / 2 + (k - 1.5) * 0.6, 5, 1.6, k % 2 ? G.md : G.dk, G.lt);
    vine(x, m1 - 14, sy - 3, 10, 2); vine(x, m1 - 8, sy - 2, 7, 5);
    // a fig in the corner by the counter
    if (m1 - m0 > 50) fig(x, m1 + 8, gy - 4, Math.min(58, gy - wainTop + 22));
  }
  // monstera in the corner by the window
  if (W > 200) monstera(x, Math.max(10, wx0 - 4), gy - 6);

  // ---- behind the counter: a chalk menu and a shelf of mugs
  const bw = Math.min(W - cx - 14, 60);
  if (bw > 18) {
    const bx = cx + 7 + Math.round((W - cx - 14 - bw) / 2), by = Math.max(14, gy - 112), bh = 26;
    R(x, bx - 2, by - 2, bw + 4, bh + 4, WD.md); R(x, bx - 2, by - 2, bw + 4, 1, WD.hi); R(x, bx, by, bw, bh, '#2f3f3a');
    const ch = '#efeadf';
    // a little cup doodle with steam, then chalk lines with prices
    R(x, bx + 4, by + 12, 7, 5, ch); R(x, bx + 5, by + 13, 5, 3, '#2f3f3a'); R(x, bx + 11, by + 13, 2, 2, ch); R(x, bx + 3, by + 18, 9, 1, ch);
    R(x, bx + 6, by + 6, 1, 2, '#c9d2cc'); R(x, bx + 7, by + 4, 1, 2, '#c9d2cc'); R(x, bx + 9, by + 7, 1, 3, '#c9d2cc');
    for (let k = 0; k < 4 && bw > 30; k++) { R(x, bx + 17, by + 5 + k * 5, bw - 30 - (k % 2) * 6, 1, ch); R(x, bx + bw - 8, by + 5 + k * 5, 4, 1, '#f2cf7a'); }
    leaf(x, bx + bw - 3, by + bh - 2, -2.4, 5, 1.6, '#a8d39a'); R(x, bx + 14, by + bh - 4, 2, 2, '#f08fa8');
    const sy = gy - 72;
    R(x, cx + 4, sy, W - cx - 4, 3, WD.top); R(x, cx + 4, sy, W - cx - 4, 1, WD.lip); R(x, cx + 4, sy + 3, W - cx - 4, 1, WD.dk);
    ['#fbf7ef', '#e9a0a8', '#9cc27a', '#fbf7ef', '#7f9fdc', '#f2cf7a', '#fbf7ef'].forEach((col, k) => {
      const mx = cx + 8 + k * 9; if (mx + 8 > W) return;
      R(x, mx, sy - 6, 6, 6, col); R(x, mx + 6, sy - 5, 2, 3, col); R(x, mx + 4, sy - 6, 2, 6, shade(col, 0.12)); R(x, mx, sy - 6, 6, 1, light(col, 0.3));
    });
  }

  // fairy lights strung under the beam, and the planters hanging from it
  for (let i = 0; i < W; i++) { const f = (i % 48) / 48; R(x, i, 8 + Math.round(Math.sin(f * Math.PI) * 5), 1, 1, '#5a4636'); }
  hanger(x, wx0 + Math.round(ww * 0.18), 7, Math.min(Math.max(20, wy0 - 2), 34), 3);
  if (W > 220) hanger(x, Math.round((cx + W) / 2) + 14, 7, 22, 7);
  // brass pendant lamps
  lay.lamps.forEach(([lx, ly]) => {
    R(x, lx, 7, 1, ly - 7, '#3a2a22');
    [3, 5, 7, 9, 11].forEach((w, j) => { R(x, lx - (w >> 1), ly + j, w, 1, j === 4 ? BRASS[0] : BRASS[1]); R(x, lx - (w >> 1) + 1, ly + j, 1, 1, BRASS[2]); });
    R(x, lx - 2, ly + 5, 5, 1, '#fff3c0');
  });

  // warm light: the window's shaft across the floor, glows under the lamps
  x.save(); x.globalCompositeOperation = 'lighter';
  x.globalAlpha = 0.06; x.fillStyle = '#ffe2b0';
  x.beginPath(); x.moveTo(wx0, wy0 + ah); x.lineTo(wx1, wy0 + ah); x.lineTo(wx1 + 60, H); x.lineTo(wx0 + 60, H); x.closePath(); x.fill();
  x.fillStyle = '#ffd890';
  lay.lamps.forEach(([lx, ly]) => { for (let r = 30; r > 4; r -= 6) { x.globalAlpha = 0.045; ell(x, lx, ly + 7, r, Math.round(r * 0.8), '#ffd890'); } });
  x.restore();
  return c;
}

// where everything sits for a given screen size
function layout(W, H, gy) {
  const wx0 = Math.round(W * 0.06), wx1 = Math.round(W * 0.4);
  const wy1 = gy - 52, wy0 = Math.max(22, gy - (H > 220 ? 170 : 124));
  const tx = Math.round(W * 0.42), cx = Math.round(W * 0.72);
  const ah = Math.min(16, Math.round((wx1 - wx0) * 0.16));
  const lampY = Math.max(16, gy - 104);
  const lamps = [[tx, lampY]];
  if (cx - tx > 90) lamps.push([Math.round((tx + cx) / 2) + 14, lampY - 10]);
  return { wx0, wx1, wy0, wy1, ah, wainTop: gy - 46, wallBase: gy - 16, tx, cx, lamps };
}

// the counter's front, drawn over the barista standing behind it
function paintCounter(W, H, gy) {
  const [c, x] = canvas(W, H);
  const cx = Math.round(W * 0.72), top = gy - 22, base = gy - 9;
  x.globalAlpha = 0.3; R(x, cx - 3, base, W - cx + 3, 2, '#3a2418'); x.globalAlpha = 1;
  R(x, cx, top + 3, W - cx, base - top - 3, WD.md);
  for (let px = cx + 4; px + 12 <= W - 2; px += 17) {
    const ph = base - top - 12;
    R(x, px, top + 6, 13, ph, WD.dk); R(x, px + 1, top + 7, 12, ph - 1, WD.lt); R(x, px + 2, top + 8, 10, ph - 3, WD.md);
  }
  R(x, cx, base - 3, W - cx, 3, WD.dk);
  R(x, cx, base - 6, W - cx, 1, BRASS[1]); R(x, cx, base - 7, W - cx, 1, BRASS[2]);
  R(x, cx, top + 3, 1, base - top - 3, WD.lt);
  R(x, cx - 3, top, W - cx + 3, 3, WD.top); R(x, cx - 3, top, W - cx + 3, 1, WD.lip); R(x, cx - 3, top + 3, W - cx + 3, 1, WD.dk);
  // a cake under a glass dome at the near end
  const dx = cx + 9;
  R(x, dx - 7, top - 1, 15, 1, '#e9e1d2'); R(x, dx, top - 3, 1, 2, '#e9e1d2');
  R(x, dx - 4, top - 8, 9, 5, '#fbeee0'); R(x, dx - 4, top - 6, 9, 1, '#f08fa8'); R(x, dx - 4, top - 8, 9, 1, '#fff8f0'); R(x, dx - 1, top - 10, 2, 2, '#e05a5a');
  x.globalAlpha = 0.35; ell(x, dx, top - 8, 7, 6, '#e8f6ff'); x.globalAlpha = 0.8;
  for (let j = -6; j <= 0; j++) { const w = Math.round(7 * Math.sqrt(1 - (j / 6.5) ** 2)); R(x, dx - w, top - 8 + j, 1, 1, '#f4fbff'); R(x, dx + w, top - 8 + j, 1, 1, '#c8dce8'); }
  R(x, dx - 1, top - 16, 3, 2, '#f4fbff'); x.globalAlpha = 1;
  // a classic lever espresso machine at the far end, with a little herb pot
  if (W - cx > 70) {
    const mx = W - 18, my = top;
    R(x, mx - 9, my - 15, 18, 13, '#c8784a'); R(x, mx - 9, my - 15, 18, 2, '#e09a68'); R(x, mx + 6, my - 13, 3, 11, '#a85f38');
    R(x, mx - 7, my - 21, 14, 6, BRASS[1]); R(x, mx - 5, my - 23, 10, 2, BRASS[1]); R(x, mx - 1, my - 26, 2, 3, BRASS[0]); R(x, mx - 6, my - 21, 2, 6, BRASS[2]);
    ell(x, mx, my - 10, 2, 2, '#fbf7ef'); R(x, mx, my - 11, 1, 2, '#3a2a22');
    R(x, mx - 7, my - 2, 4, 2, '#3a3346'); R(x, mx + 3, my - 2, 4, 2, '#3a3346'); R(x, mx - 11, my - 2, 4, 1, '#3a2a22');
    R(x, mx - 8, my - 1, 16, 1, '#9aa0aa');
    pot(x, mx - 22, top, 6, 5, '#c8714a'); for (let k = 0; k < 3; k++) leaf(x, mx - 22, top - 5, -Math.PI / 2 + (k - 1) * 0.6, 4, 1.3, G.md, G.lt);
  }
  return c;
}

function tableSprite() {
  const [c, x] = canvas(38, 26);
  R(x, 0, 0, 38, 3, WD.lt); R(x, 0, 0, 38, 1, WD.hi); R(x, 1, 3, 36, 1, WD.dk);
  // a crocheted doily hanging over the front edge
  R(x, 12, 0, 14, 1, '#fbf6ec'); for (let i = 12; i < 26; i += 2) R(x, i, 1, 1, 2, '#fbf6ec');
  R(x, 17, 4, 4, 2, WD.md); R(x, 18, 6, 2, 14, WD.md); R(x, 17, 9, 4, 2, WD.lt); R(x, 18, 6, 1, 14, WD.lt);
  R(x, 17, 20, 4, 2, WD.md); R(x, 12, 22, 14, 2, WD.md); R(x, 10, 24, 4, 2, WD.dk); R(x, 24, 24, 4, 2, WD.dk); R(x, 12, 22, 14, 1, WD.lt);
  return outline(c);
}
// bentwood chair, back on the left
function chairSprite() {
  const [c, x] = canvas(16, 30);
  for (let j = 0; j <= 14; j++) for (let i = 0; i <= 8; i++) { const d = ((i - 4) / 4) ** 2 + ((j - 7) / 7) ** 2; if (d <= 1 && d > 0.45) R(x, i, j, 1, 1, j < 4 ? WD.lt : WD.md); }
  R(x, 1, 6, 2, 13, WD.md); R(x, 1, 6, 1, 13, WD.lt);
  R(x, 1, 16, 14, 2, WD.md); R(x, 1, 16, 14, 1, WD.hi); R(x, 2, 18, 12, 1, WD.dk);
  R(x, 2, 19, 2, 11, WD.md); R(x, 12, 19, 2, 11, WD.md); R(x, 4, 19, 1, 9, WD.dk); R(x, 11, 19, 1, 9, WD.dk);
  R(x, 3, 25, 10, 1, WD.dk);
  return outline(c);
}
// drinks sized for the table: a mug on a saucer, or a tall glass with a straw
function smallCup(color, art, glass) {
  if (glass) {
    const [c, x] = canvas(7, 12);
    R(x, 1, 2, 5, 10, 'rgba(230,245,255,.75)'); R(x, 2, 4, 3, 7, color); R(x, 2, 4, 3, 1, light(color, 0.35)); R(x, 2, 5, 1, 5, light(color, 0.2));
    R(x, 4, 0, 1, 5, '#f08fa8'); R(x, 1, 11, 5, 1, '#d8e8f0');
    return outline(c);
  }
  const [c, x] = canvas(11, 8);
  R(x, 2, 1, 6, 5, '#fbf7ef'); R(x, 6, 1, 2, 5, '#e6ddd0');
  R(x, 2, 1, 6, 1, color); R(x, 3, 1, 3, 1, light(color, 0.25)); if (art) R(x, 4, 1, 1, 1, '#fff8ee');
  R(x, 8, 2, 2, 1, '#fbf7ef'); R(x, 9, 3, 1, 1, '#fbf7ef'); R(x, 8, 4, 2, 1, '#fbf7ef');
  R(x, 0, 6, 11, 1, '#f4efe6'); R(x, 1, 7, 9, 1, '#d9cfc0');
  return outline(c);
}

export default async function cafe(game) {
  let drink = null; const cups = [];
  const sill = []; // painted figures drying on the window sill
  let room = null, counter = null;
  const scene = new Scene2D(game, {
    id: 'cafe', worldW: 0, walkable: false, hazei: false, partner: false, time: 'afternoon', inputMode: 'none', action: false, groundFromBottom: 30,
    light: { bloom: 0.3, tint: 'rgba(255,215,160,0.32)' },
    ambient: { motes: 3, moteColor: '#fff2d0' },
    drawBack(x, s) {
      const W = s.W, H = s.H, gy = s.groundY;
      if (!room || room.width !== W || room.height !== H) { room = paintRoom(W, H, gy); counter = null; }
      x.drawImage(room, 0, 0);
      const { wx0, wx1, wy0, wy1, ah } = layout(W, H, gy), ww = wx1 - wx0, wh = wy1 - wy0;
      // the cat sunning itself in the garden, and a butterfly over the flowers
      x.drawImage(catSprite('sleep', Math.floor(s.t * 0.8) % 2, 'orange'), wx0 + Math.round(ww * 0.5) - 9, wy1 - 17);
      sill.forEach((im, i) => im && x.drawImage(im, wx0 + Math.round(ww * 0.18) + i * 15, wy1 - im.height + 1));
      x.save(); x.beginPath(); x.rect(wx0, wy0 + ah + 2, ww, wh - ah - 2); x.clip();
      const bt = s.t * 0.35, bx = wx0 + ww * (0.5 + 0.4 * Math.sin(bt)), by = wy0 + wh * (0.62 + 0.1 * Math.sin(bt * 2.3));
      x.drawImage(butterflySprite(Math.floor(s.t * 6) % 2, '#f6c45f'), Math.round(bx), Math.round(by));
      x.restore();
      // fairy lights twinkling
      for (let i = 4, k = 0; i < W; i += 8, k++) {
        const f = (i % 48) / 48, y = 9 + Math.round(Math.sin(f * Math.PI) * 5), on = 0.65 + 0.35 * Math.sin(s.t * 1.6 + k * 1.9);
        R(x, i, y, 1, 1, ['#ffe39a', '#ffc8a0', '#fff1c8'][k % 3]);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.18 * on; R(x, i - 1, y - 1, 3, 3, '#ffd890'); x.restore();
      }
    },
    drawFront(x, s) {
      const gy = s.groundY, W = s.W;
      const tx = Math.round(W * 0.42);
      // drinks on the table with steam
      cups.forEach((c, i) => {
        const px = tx - 2 + (i ? 7 : -c.img.width + 1), py = gy - 25 - c.img.height;
        x.drawImage(c.img, px, py);
        if (c.hot && Math.floor(s.t * 3 + i) % 2 === 0) { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(px + 4 + Math.round(Math.sin(s.t * 2 + i)), py - 3, 1, 2); x.fillRect(px + 6 + Math.round(Math.sin(s.t * 2 + i + 1)), py - 5, 1, 2); }
      });
    },
  });
  const W = () => scene.W;
  const tx = () => Math.round(W() * 0.42);
  const table = tableSprite(), chair = chairSprite();
  // a bud vase in the middle of the table
  scene.addProp({ z: -4, draw(ctx, camX, gy) {
    ctx.drawImage(table, tx() - 19, gy - 26);
    R(ctx, tx() - 1, gy - 30, 3, 4, '#dfeef0'); R(ctx, tx() - 1, gy - 30, 1, 4, '#ffffff'); R(ctx, tx(), gy - 34, 1, 4, G.stem); R(ctx, tx() + 1, gy - 33, 1, 1, G.lt);
    R(ctx, tx() - 1, gy - 36, 3, 2, '#f08fa8'); R(ctx, tx(), gy - 37, 1, 1, '#f7b8c8'); R(ctx, tx(), gy - 35, 1, 1, '#f6c45f');
  } });
  scene.addProp({ z: -7, draw(ctx, camX, gy) { ctx.drawImage(chair, tx() - 40, gy - 30); ctx.save(); ctx.translate(tx() + 40, 0); ctx.scale(-1, 1); ctx.drawImage(chair, 0, gy - 30); ctx.restore(); } });
  scene.addProp({ z: -11, draw(ctx, camX, gy) { if (!counter || counter.width !== W() || counter.height !== scene.H) counter = paintCounter(W(), scene.H, gy); ctx.drawImage(counter, 0, 0); } });
  const hz = scene.addEntity(new Character(LOOKS.hazei(), 0, { z: -6, dir: 1 }));
  const pt = scene.addEntity(new Character(LOOKS.partner(), 0, { z: -6, dir: -1 }));
  const barista = scene.addEntity(new Character(LOOKS.barista, 0, { z: -14, dir: -1 }));
  hz.forcePose = 'sit'; pt.forcePose = 'sit'; hz.dy = -6; pt.dy = -6;
  let baristaX = null;
  // the barista stands on a step behind the counter and comes down it to serve
  const place = () => {
    hz.x = tx() - 26; pt.x = tx() + 26; barista.x = baristaX ?? Math.round(W() * 0.8);
    barista.dy = -Math.round(4 * Math.max(0, Math.min(1, (barista.x - W() * 0.72 + 4) / 10)));
  };
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
  const lc = (n) => n.charAt(0).toLowerCase() + n.slice(1);
  scene.say(pt, C.partnerOrder.replace('{nuoc}', lc(drink.name)), 3600); pt.emote('thumb');
  await wait(3400);
  // barista brings the drinks
  barista.forcePose = 'hold'; barista.hold = 'snack';
  const from = W() * 0.8, to = tx() + 8;
  for (let k = 0; k <= 1; k += 0.02) { baristaX = from + (to - from) * k; barista.forcePose = 'walk'; barista.dir = -1; await wait(28); }
  barista.forcePose = 'give';
  cups.push({ img: smallCup(drink.color, drink.art, choice.glass), hot: !choice.glass && !['peach'].includes(drink.id) });
  cups.push({ img: smallCup(C.partnerDrinkColor, true, false), hot: true });
  audio.sfx('clink');
  scene.say(barista, C.served, 3000);
  await wait(2200);
  barista.dir = 1;
  for (let k = 0; k <= 1; k += 0.02) { baristaX = to + (from - to) * k; barista.forcePose = 'walk'; barista.dir = 1; await wait(28); }
  barista.forcePose = null; barista.dir = -1;
  hz.emote('sparkle'); pt.emote('thumb');
  scene.sparkles(tx(), scene.groundY - 36, 10);
  await wait(800);
  await ui.dialog(C.moments);
  // the barista brings over a tray of plaster figures
  await wait(500);
  scene.say(barista, S.offer, 3600);
  await wait(2800);
  await ui.dialog([{ who: 'partner', text: S.invite }]);

  // cozy actions
  let leave;
  const left = new Promise((r) => { leave = r; });
  let sipI = 0, his = null, busy = false;
  const paint = async () => {
    if (busy) return;
    busy = true;
    const res = await paintStatue();
    if (res) {
      hz.forceMood = 'happy'; setTimeout(() => { hz.forceMood = null; }, 1500);
      if (!his) { his = minoFigure(MINO_PICK[res.id]); await showPair(res.img, his, S.show); }
      await photoToAlbum(statuePhoto(res.img, his), { caption: S.caption, title: S.photoTitle });
      sill[0] = miniFigure(res.img); sill[1] = miniFigure(his);
      audio.sfx('clink'); scene.say(barista, S.dry, 2800);
      hz.emote('sparkle'); pt.emote('laugh');
      setActions();
    }
    busy = false;
  };
  const setActions = () => ui.actions([
    { label: '🎨 ' + (his ? S.again : S.action), cls: his ? '' : 'gold', onClick: paint },
    { label: '☕ ' + C.sip, onClick: async () => { audio.sfx('sip'); hz.forcePose = 'sip'; await wait(900); hz.forcePose = 'sit'; hz.forceMood = 'happy'; scene.say(hz, C.sipReact[sipI++ % C.sipReact.length], 2200); pt.emote(['thumb', 'laugh', 'sparkle'][sipI % 3]); setTimeout(() => { hz.forceMood = null; }, 1500); } },
    { label: '🪟 ' + C.lookOut, onClick: () => { hz.dir = -1; ui.note(C.lookOutReact, 3000); pt.emote('note'); setTimeout(() => { hz.dir = 1; }, 3000); } },
    { label: C.leave + ' →', cls: '', onClick: () => leave() },
  ]);
  setActions();
  await left;
  await game.leave(scene);
  await done;
}

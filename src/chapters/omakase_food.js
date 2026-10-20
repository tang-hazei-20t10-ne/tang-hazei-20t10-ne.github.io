// Food for the omakase chapter. Every dish and every step of making it is
// drawn with a "pen" that rasterises shapes straight onto the target at any
// scale, so the same plate stays crisp on the counter, in the menu and in the
// close-up of the chef's board. Dishes are seen from above at an angle, like
// the camera: circles are squashed to ellipses (ry = 0.55 rx).
import { mix, shade, light } from '../core/sprites.js';

const SQ = 0.55;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a)); // progress of t inside [a, b]
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

export function pen(x, ox, oy, s) {
  const X = (u) => Math.round(ox + u * s), Y = (v) => Math.round(oy + v * s);
  const p = {
    x, s, ox, oy,
    sub(u, v, k) { return pen(x, ox + u * s, oy + v * s, s * k); },
    rect(a, b, w, h, c) { const x0 = X(a), y0 = Y(b), x1 = Math.max(x0 + 1, X(a + w)), y1 = Math.max(y0 + 1, Y(b + h)); x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); },
    // filled ellipse; `from`/`to` keep only a horizontal band of it (-1 top .. 1 bottom)
    ell(cx, cy, rx, ry, c, from = -1, to = 1) {
      const pcx = ox + cx * s, pcy = oy + cy * s, prx = rx * s, pry = Math.max(0.5, ry * s);
      x.fillStyle = c;
      for (let y = Math.floor(pcy - pry); y < Math.ceil(pcy + pry); y++) {
        const v = (y + 0.5 - pcy) / pry; if (v < from || v > to || Math.abs(v) > 1) continue;
        const w = prx * Math.sqrt(1 - v * v), a = Math.round(pcx - w), b = Math.round(pcx + w);
        if (b > a) x.fillRect(a, y, b - a, 1);
        else if (prx < 0.8) x.fillRect(Math.round(pcx - 0.5), y, 1, 1);
      }
    },
    poly(pts, c) {
      const P = pts.map(([u, v]) => [ox + u * s, oy + v * s]);
      let y0 = Infinity, y1 = -Infinity; for (const q of P) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      x.fillStyle = c;
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const yy = y + 0.5, xs = [];
        for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if ((a[1] <= yy) !== (b[1] <= yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((m, n) => m - n);
        for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) x.fillRect(a, y, b - a, 1); }
      }
    },
    line(a, b, c, d, col, w = 0) {
      const x0 = ox + a * s, y0 = oy + b * s, x1 = ox + c * s, y1 = oy + d * s;
      const k = Math.max(1, Math.round(w * s)), n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      x.fillStyle = col;
      for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + (x1 - x0) * i / n - k / 2), Math.round(y0 + (y1 - y0) * i / n - k / 2), k, k);
    },
    dot(a, b, col, r = 0) { const k = Math.max(1, Math.round(r * s)); x.fillStyle = col; x.fillRect(Math.round(ox + a * s - k / 2), Math.round(oy + b * s - k / 2), k, k); },
    alpha(a, fn) { const o = x.globalAlpha; x.globalAlpha = o * a; fn(); x.globalAlpha = o; },
  };
  return p;
}

// a small deterministic random, so speckles stay put frame to frame
const rnd = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------------------------------------------------------- tableware
function roundPlate(p, rx, col, rim) {
  p.ell(0, 1.6, rx, rx * SQ, shade(rim, 0.3));
  p.ell(0, 0, rx, rx * SQ, rim);
  p.ell(0, 0, rx * 0.86, rx * 0.86 * SQ, col);
  p.ell(0, 0.6, rx * 0.6, rx * 0.6 * SQ, shade(col, 0.06));
  p.ell(0, 0.3, rx * 0.56, rx * 0.56 * SQ, col);
  p.ell(-rx * 0.5, -rx * 0.36, rx * 0.22, rx * 0.04, light(rim, 0.55));
}
function slab(p, w, d, top, side, x = 0, y = 0) {
  p.rect(x - w / 2, y + d / 2, w, 2, side);
  p.rect(x - w / 2, y - d / 2, w, d, top);
  p.rect(x - w / 2, y - d / 2, w, 0.6, light(top, 0.25));
}
function geta(p) { // wooden sushi board on two little feet
  p.rect(-17, 7, 3, 2.6, '#8a5a32'); p.rect(14, 7, 3, 2.6, '#8a5a32');
  slab(p, 36, 15, '#dcb07a', '#a87848');
  for (let i = 0; i < 5; i++) p.line(-16, -5 + i * 2.6, 16, -5.4 + i * 2.6, '#cfa06a', 0.3);
}
// an upright cylinder (cup, glass, pot) whose top rim sits at y = top
function cyl(p, cx, top, r, h, body, bodyS, rim) {
  p.ell(cx, top + h, r, r * SQ, bodyS);
  p.rect(cx - r, top, r * 2, h, body);
  p.rect(cx + r * 0.45, top, r * 0.55, h, bodyS);
  p.ell(cx, top + h, r * 0.55, r * SQ * 0.7, body, -1, 0.2);
  p.rect(cx - r * 0.8, top + 1, r * 0.18, h - 1, light(body, 0.35));
  p.ell(cx, top, r, r * SQ, rim);
}
function leaf(p, x, y, w, h, col, vein) {
  p.ell(x, y, w, h, col);
  p.line(x - w * 0.9, y, x + w * 0.9, y - h * 0.15, vein, 0.25);
  for (let k = -2; k <= 2; k++) p.line(x + k * w * 0.3, y - h * 0.05, x + k * w * 0.3 + w * 0.2, y - h * 0.7, vein, 0.2);
}
function flower(p, x, y, r, petal, centre) {
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; p.ell(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7 * 0.7, r * 0.55, r * 0.42, petal); }
  p.ell(x, y, r * 0.3, r * 0.25, centre);
}

// ---------------------------------------------------------------- pieces
// A rounded oblong block lying on the plate, turned by `a`, from height z0 up
// by h; `bulge` lifts its middle so a slice on top drapes down at both ends.
function loaf(p, x, y, a, L, W, z0, h, top, side, bulge = 0) {
  const c = Math.cos(a), sn = Math.sin(a);
  const ring = (z) => {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const t = i / 28 * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
      const u = L / 2 * Math.sign(ct) * Math.abs(ct) ** 0.5, v = W / 2 * Math.sign(st) * Math.abs(st) ** 0.5;
      const zz = z + bulge * (1 - (2 * u / L) ** 2);
      pts.push([x + u * c - v * sn, y + (u * sn + v * c) * SQ - zz]);
    }
    return pts;
  };
  for (let k = 0; k < Math.max(1, Math.ceil(h * 2)); k++) p.poly(ring(z0 + k * 0.5), side);
  p.poly(ring(z0 + h), top);
  return (u, v, z = 0) => [x + u * c - v * sn, y + (u * sn + v * c) * SQ - (z0 + h + z + bulge * (1 - (2 * u / L) ** 2))];
}
function riceBlock(p, x, y, w = 5.6, a = 0) { // an oblong mound of sushi rice
  p.ell(x + 0.5, y + 1, w * 1.05, w * 0.36, 'rgba(90,60,30,0.16)');
  const at = loaf(p, x, y, a, w * 1.8, w * 0.9, 0, 2.6, '#f8f6f0', '#e4ddcc');
  for (let i = 0; i < 16; i++) p.dot(...at((rnd(i + x) - 0.5) * w * 1.6, (rnd(i * 3 + x) - 0.5) * w * 0.7), i % 3 ? '#e2dccc' : '#ffffff', 0.35);
  return at;
}
// a nigiri: rice with a slice draped over it
function nigiri(p, x, y, a, top, side) {
  riceBlock(p, x, y, 5.4, a);
  return loaf(p, x, y, a, 11.4, 5.2, 2.2, 0.8, top, side, 1.1);
}
function fishSlice(p, x, y, base, line, edge, w = 3.4, h = 2.4) {
  // a long slice standing slightly tilted: lit cut face, a darker side, the blood line
  const q = (dx, dy) => [x + dx, y + dy];
  p.poly([q(-w * 0.55, -h * 1.1), q(w * 0.45, -h * 1.25), q(w * 0.75, h * 0.9), q(-w * 0.3, h * 1.05)], shade(base, 0.32));
  p.poly([q(-w * 0.45, -h), q(w * 0.38, -h * 1.12), q(w * 0.62, h * 0.8), q(-w * 0.22, h * 0.92)], base);
  p.poly([q(-w * 0.45, -h), q(-w * 0.32, -h * 1.02), q(-w * 0.12, h * 0.91), q(-w * 0.22, h * 0.92)], line);
  p.line(x + w * 0.1, y - h * 0.9, x + w * 0.3, y + h * 0.5, edge, 0.35);
}
function shrimpCurl(p, x, y, size, col, crisp = 0) {
  // a curled shrimp: a chain of segments round an arc, tail fanned at the end
  const n = 7;
  for (let k = n - 1; k >= 0; k--) {
    const a = Math.PI * (0.15 + k / n * 1.05), r = size * 0.9;
    const sx = x + Math.cos(a) * r, sy = y - Math.sin(a) * r * 0.6, sr = size * (0.5 - k * 0.035);
    p.ell(sx, sy + 0.3, sr, sr * 0.75, shade(col, 0.22));
    p.ell(sx, sy, sr, sr * 0.75, col);
    if (crisp) for (let j = 0; j < 3; j++) p.dot(sx - sr * 0.5 + rnd(k * 7 + j) * sr, sy - sr * 0.4 + rnd(k * 5 + j) * sr * 0.6, light(col, 0.4), 0.45);
    else p.line(sx - sr * 0.6, sy - sr * 0.1, sx + sr * 0.4, sy - sr * 0.5, light(col, 0.3), 0.25);
  }
  const ta = Math.PI * 1.25, tx = x + Math.cos(ta) * size * 0.95, ty = y - Math.sin(ta) * size * 0.55;
  p.poly([[tx, ty], [tx - size * 0.55, ty + size * 0.35], [tx - size * 0.15, ty + size * 0.55], [tx + size * 0.1, ty + size * 0.25]], '#e0563a');
  p.line(tx - size * 0.3, ty + size * 0.3, tx, ty + size * 0.1, '#a83a28', 0.25);
}

// ---------------------------------------------------------------- dishes
// Each dish is drawn around its plate centre (0, 0) with a plate radius ~18.
// `o` turns parts on as they get made: see the recipes below.
const ALL = { all: true };
const has = (o, k, d = 1) => (o.all ? d : o[k] ?? 0);

export const DISHES = {
  chawanmushi(p, o = ALL) {
    roundPlate(p, 16, '#f4f1ea', '#3f5a8a');
    p.poly([[9, 3.2], [16.5, 0.4], [17.2, 1.4], [10, 4.6]], '#d8ac78'); p.ell(9, 3.8, 2.2, 1.3, '#c99a68');
    if (!has(o, 'cup')) return;
    cyl(p, 0, -12, 8.6, 11, '#a8ccbc', '#86ad9e', '#f4f1ea');
    p.rect(-8.6, -6, 17.2, 1, '#3f5a8a'); p.rect(-8.6, -4.6, 17.2, 0.5, '#3f5a8a');
    for (let k = 0; k < 5; k++) p.ell(-6 + k * 3, -8.4, 0.7, 0.5, '#3f5a8a');
    p.ell(0, -12, 7.4, 7.4 * SQ, '#e9e4d8');
    const fill = has(o, 'fill'), set = has(o, 'set');
    if (fill > 0) {
      const col = mix('#f0c050', '#f4dc90', set);
      p.ell(0, -12 + (1 - fill) * 0.8, 7.2 * Math.sqrt(fill), 7.2 * SQ * Math.sqrt(fill), col);
      if (fill > 0.6) p.ell(-3.2, -13.4, 2.2, 0.45, set > 0.5 ? '#fff4c8' : '#ffe9a0');
    }
    if (has(o, 'top')) {
      p.ell(-2.6, -12.2, 2.3, 1.2, '#f08a7a'); p.ell(-3, -12.5, 1.3, 0.6, '#f8c0b0'); p.line(-4, -11.8, -1.6, -12.6, '#d86a5a', 0.25);
      p.ell(2.6, -11.4, 1.3, 0.85, '#c8d84a'); p.ell(2.3, -11.7, 0.5, 0.3, '#e8f08a');
      p.ell(1.2, -13.6, 1.4, 0.8, '#a8784a'); p.ell(1.2, -13.9, 0.9, 0.4, '#c8986a');
    }
    if (has(o, 'leaf')) { p.line(-0.5, -12.2, 1.5, -15, '#5a9a4a', 0.3); leaf(p, 2.2, -15.2, 1.7, 0.9, '#5aaa4a', '#3f7a3a'); leaf(p, 0.2, -15.6, 1.4, 0.8, '#6abc5a', '#3f7a3a'); }
  },

  tofu(p, o = ALL) {
    roundPlate(p, 17, '#2f2b35', '#4a4454');
    const sauce = has(o, 'sauce');
    if (sauce > 0) { p.ell(0.5, 1.2, 12 * sauce, 6.2 * sauce, '#4a2a1e'); p.ell(-3 * sauce, 0, 4 * sauce, 0.8 * sauce, '#7a4a32'); }
    if (!has(o, 'tofu')) return;
    p = p.sub(0, -has(o, 'lift', 0) * 9, 1); // still in the chef's hands, coming down
    const h = 7;
    p.rect(-6.5, -h + 3.4, 13, h, '#ece6d6'); p.rect(4.5, -h + 3.4, 2, h, '#d8cfbb');
    p.rect(-6.5, -h - 3.4, 13, 6.8, '#fbf8ef'); p.rect(-6.5, -h - 3.4, 13, 0.6, '#ffffff');
    p.line(-6.5, -h + 3.4, 6.5, -h + 3.4, '#ddd6c4', 0.3);
    for (const cx of [-2.2, 2.2]) { p.line(cx, -h - 3.4, cx, -h + 3.4, '#e6dfcd', 0.3); p.line(cx, -h + 3.4, cx, 3.4, '#d8d0bc', 0.3); }
    if (has(o, 'ginger')) {
      p.ell(-1.2, -h - 0.6, 2.4, 1.3, '#f0d488'); for (let i = 0; i < 6; i++) p.dot(-2.6 + rnd(i) * 2.8, -h - 1.3 + rnd(i + 9) * 1.4, '#e2bf62', 0.3);
      for (let i = 0; i < 5; i++) { const xx = 1 + rnd(i + 3) * 4, yy = -h - 2.4 + rnd(i + 7) * 3.4; p.ell(xx, yy, 0.6, 0.4, '#7cc05a'); p.dot(xx, yy, '#d8f0b0', 0.25); }
    }
    const n = Math.round(has(o, 'flowers', 5));
    const fl = [[-3.6, -h - 1.8, '#8a5ac8', '#f6d04a'], [3.4, -h + 0.6, '#f6d04a', '#e8803a'], [-8.5, 3, '#f6a0c0', '#fff2a0'], [9, -1, '#c8a0f0', '#f6d04a'], [2, -h - 2.8, '#f6a0c0', '#fff2a0']];
    for (let i = 0; i < n; i++) flower(p, fl[i][0], fl[i][1], 1.6, fl[i][2], fl[i][3]);
  },

  hamachi(p, o = ALL) {
    roundPlate(p, 18, '#eef2f2', '#7a9ab0');
    const dk = has(o, 'daikon');
    if (dk > 0) { p.ell(-2, -3.6, 8.4 * dk, 3.8 * dk, '#d6dcd8'); p.ell(-2, -4, 8 * dk, 3.4 * dk, '#fbfbf6'); for (let i = 0; i < 18 * dk; i++) { const xx = -9 + rnd(i) * 14, yy = -6.4 + rnd(i + 20) * 4.4; p.line(xx, yy, xx + 2.2, yy - 0.5, '#d8dedb', 0.3); } }
    if (has(o, 'shiso')) leaf(p, -6.5, -6, 5, 2.6, '#3f8a3a', '#6ab85a');
    const n = Math.round(has(o, 'slices', 5));
    for (let i = 0; i < n; i++) fishSlice(p, -7.4 + i * 3.4, -1.4 + Math.abs(i - 2) * 0.5, '#f6dccb', '#e0907e', '#fff6ee', 4.4, 3);
    if (has(o, 'lemon')) { p.ell(10.5, -3.5, 2.8, 1.5, '#f6e07a'); p.ell(10.5, -3.5, 2.2, 1.1, '#fbf0b0'); p.line(9, -3.5, 12, -3.5, '#f0d060', 0.2); }
    if (has(o, 'wasabi')) { p.ell(9.5, 3.4, 2.2, 1.3, '#94bc44'); for (let i = 0; i < 4; i++) p.dot(8.4 + rnd(i) * 2.2, 2.8 + rnd(i + 4) * 1.2, '#c4e080', 0.35); }
  },

  otoro(p, o = ALL) {
    slab(p, 36, 19, '#34323a', '#22212a');
    for (let i = 0; i < 12; i++) p.dot(-16 + rnd(i) * 32, -8 + rnd(i + 30) * 16, '#3e3c46', 0.5);
    if (has(o, 'shiso')) leaf(p, -9, -4.5, 5, 2.4, '#3f8a3a', '#6ab85a');
    const n = Math.round(has(o, 'slices', 3));
    for (let i = 0; i < n; i++) {
      const x = -5 + i * 6.2, y = -0.6 + (i % 2) * 0.4;
      p.rect(x - 3.2, y + 1.8, 6.4, 1.6, '#d48a86');
      p.rect(x - 3.2, y - 2.4, 6.4, 4.2, '#f2b6ae'); p.ell(x, y - 2.4, 3.2, 0.7, '#f6c4bc');
      for (let k = 0; k < 3; k++) p.line(x - 2.8 + k * 1.9, y - 2.2, x - 1.4 + k * 1.9, y + 1.6, '#fdeae4', 0.35);
      p.line(x - 2.8, y + 2.6, x + 2.8, y + 2.6, '#f4c4c0', 0.25);
    }
    const salt = has(o, 'salt');
    for (let i = 0; i < 10 * salt; i++) p.dot(-6 + rnd(i + 50) * 14, -2.6 + rnd(i + 60) * 3, '#ffffff', 0.35);
    if (has(o, 'gold')) { p.poly([[5, -3.6], [6.6, -4.2], [7.2, -3], [5.6, -2.6]], '#f2c84a'); p.dot(6.1, -3.6, '#fff4b0', 0.5); }
    if (has(o, 'wasabi')) { p.ell(12.5, 3.5, 2, 1.2, '#94bc44'); p.dot(12, 3, '#c4e080', 0.4); }
  },

  hotate(p, o = ALL) {
    geta(p);
    if (has(o, 'gari')) for (let k = 0; k < 3; k++) p.ell(12.5 + k * 0.5, 2 - k * 0.8, 2.2, 1, ['#f2b8b4', '#f6c8c4', '#f8d4d0'][k]);
    const n = Math.round(has(o, 'pieces', 2));
    // two pieces set on a slant, the back one a little to the right
    for (let i = 0; i < n; i++) {
      const x = -6 + i * 11, y = 2.6 - i * 3.6, g = has(o, 'glaze');
      // a thick scallop opened over the rice: ivory, a peach edge, a soy sheen once brushed
      const at = nigiri(p, x, y, -0.32, mix('#f7edd8', '#f0d6a6', g * 0.6), mix('#e8bc92', '#cf9460', g * 0.6));
      p.poly([at(-3.6, -1.3, 0.3), at(3.4, -1.5, 0.3), at(3, 0.4, 0.3), at(-3.2, 0.6, 0.3)], mix('#fdf8ee', '#f8e6c0', g * 0.6));
      p.line(...at(-3.4, -1.1, 0.5), ...at(1.6, -1.4, 0.5), '#ffffff', 0.3);
      if (g) p.alpha(0.5 * g, () => { p.line(...at(-4, 1, 0.2), ...at(4, 0.8, 0.2), '#c88848', 0.35); p.dot(...at(2.4, -0.6, 0.6), '#ffffff', 0.45); });
      if (has(o, 'yuzu')) for (let k = 0; k < 5; k++) p.dot(...at(-1.5 + rnd(k + i * 9) * 3, -0.8 + rnd(k + 11) * 1.4, 0.5), '#f2c43a', 0.4);
    }
  },

  uni(p, o = ALL) {
    geta(p);
    if (has(o, 'gari')) for (let k = 0; k < 3; k++) p.ell(12.5 + k * 0.5, 2 - k * 0.8, 2.2, 1, ['#f2b8b4', '#f6c8c4', '#f8d4d0'][k]);
    const n = Math.round(has(o, 'pieces', 2));
    for (let i = 0; i < n; i++) {
      const x = -7 + i * 12, y = 1.5;
      const nori = has(o, 'nori');
      if (nori) {
        p.ell(x, y, 5, 2.6, '#18221c'); p.rect(x - 5, y - 6, 10, 6, '#1e2a24');
        for (let k = 0; k < 4; k++) p.line(x - 4 + k * 2.6, y - 5.6, x - 4 + k * 2.6, y - 0.4, '#2e3e34', 0.3);
        p.rect(x + 2.4, y - 6, 2.6, 6, '#16201a');
        p.ell(x, y - 6, 5, 2.6, '#1e2a24'); p.ell(x, y - 6, 4.2, 2.1, '#f6f3ea');
      } else riceBlock(p, x, y, 4.6);
      const u = Math.round(has(o, 'uni', 4));
      const lumps = [[-2, -7.2], [1.8, -7.4], [-0.3, -6.4], [0.2, -8.4]];
      for (let k = 0; k < u; k++) { const [a, b] = lumps[k]; p.ell(x + a, y + b + 0.4, 2, 1.2, '#d0782a'); p.ell(x + a, y + b, 1.9, 1.1, '#f0a03a'); p.ell(x + a - 0.6, y + b - 0.4, 0.8, 0.35, '#f8cc78'); }
    }
  },

  tempura(p, o = ALL) {
    slab(p, 36, 21, '#2a2226', '#160f12');
    p.rect(-18, -10.5, 36, 0.8, '#a83a3a');
    if (has(o, 'paper')) { const d = -has(o, 'paperLift', 0) * 12; p.poly([[-13, -8 + d], [9, -9.5 + d], [12, 7 + d], [-10, 8 + d]], '#f8f4ea'); p.line(-11.5, d, 10.5, -1.2 + d, '#e8e2d2', 0.3); }
    const n = Math.round(has(o, 'shrimp', 2));
    for (let i = 0; i < n; i++) shrimpCurl(p, i ? 4.5 : -5.5, i ? -1.5 : 3.5, 4.6, i ? '#e6aa40' : '#ecb84e', 1);
    if (has(o, 'lemon')) { p.poly([[8, 4], [13, 2.2], [12.4, 5.2]], '#f6e07a'); p.line(8, 4, 13, 2.2, '#e8c440', 0.4); }
    if (has(o, 'sauce')) { cyl(p, 12, -6, 3.6, 3, '#3a2a30', '#2a1c22', '#d8c8b0'); p.ell(12, -6, 3, 1.6, '#6a3a1e'); p.ell(12.6, -6.8, 1.5, 0.8, '#f8f6ee'); p.dot(12.6, -7.3, '#f2c060', 0.5); }
  },

  anago(p, o = ALL) {
    slab(p, 36, 15, '#f4f1ea', '#c9c2b6');
    p.rect(-18, 6.2, 36, 0.6, '#3f5a8a');
    const n = Math.round(has(o, 'pieces', 2));
    const glaze = has(o, 'glaze', 1);
    for (let i = 0; i < n; i++) {
      const x = -6.5 + i * 12, y = 2.6 - i * 3.4;
      const body = mix('#c08a5a', '#8a4422', glaze), dark = mix('#9a6a3e', '#4a200e', glaze);
      const at = nigiri(p, x, y, -0.3, body, dark);
      for (let k = 0; k < 4; k++) p.line(...at(-3.8 + k * 2.5, -2, 0.1), ...at(-3.2 + k * 2.5, 2, 0.1), mix(dark, '#2a1008', 0.6), 0.4);
      if (glaze > 0.5) { p.line(...at(-3.6, -1, 0.3), ...at(0, -1.3, 0.3), '#f0b878', 0.35); p.dot(...at(3, 0, 0.3), '#e8a868', 0.4); }
      if (has(o, 'sansho')) for (let k = 0; k < 6; k++) p.dot(...at(-3 + rnd(k + i * 7) * 6, -1 + rnd(k + 3) * 2, 0.3), '#7a9a3a', 0.4);
    }
  },

  mochi(p, o = ALL) {
    roundPlate(p, 15, '#f4f1ea', '#e0a0b0');
    if (has(o, 'leaf')) leaf(p, -7, 2.5, 6, 2.4, '#4f8a3a', '#7ab85a');
    const half = (x, y, flip) => {
      p.ell(x + 0.3, y + 0.6, 5.4, 4.4, '#e6ded6');
      p.ell(x, y, 5.4, 4.4, '#fbf8f4');
      p.ell(x, y + 0.2, 4.2, 3.4, '#5a3040'); p.ell(x - 0.4 * flip, y - 0.1, 4.1, 3.3, '#6a3a4a');
      p.ell(x, y, 3.1, 2.7, '#e8404a'); p.ell(x - 0.6, y - 0.6, 1.4, 1.2, '#f8b0b0'); p.ell(x, y + 0.2, 0.9, 1.5, '#fbd0d0');
      for (let k = 0; k < 5; k++) p.dot(x - 2 + rnd(k + x) * 4, y - 1.8 + rnd(k + 5) * 3.6, '#f6e080', 0.35);
      for (let k = 0; k < 4; k++) p.dot(x - 4 + rnd(k + 20) * 8, y - 4 + rnd(k + 22) * 1.2, '#ffffff', 0.4);
    };
    if (has(o, 'halves')) {
      // the other half lies dome-up behind, dusted with starch
      p.ell(5.4, -1.6, 5.8, 3.6, '#e6ded6'); p.ell(5.2, -2.4, 5.6, 3.4, '#fbf8f4'); p.ell(3.6, -3.6, 2.4, 1.2, '#ffffff');
      for (let k = 0; k < 6; k++) p.dot(2 + rnd(k + 40) * 7, -4.5 + rnd(k + 41) * 3.5, '#ffffff', 0.4);
      half(-3.6, -2.6, 1);
    }
  },

  matcha(p, o = ALL) {
    roundPlate(p, 14, '#f4f1ea', '#c9b8a0');
    p.poly([[8, 4], [15, 1.6], [15.5, 2.6], [8.8, 5.2]], '#d8c8a8'); p.ell(7.6, 4.8, 1.8, 1, '#c8b898');
    // glass with the pudding set inside
    const r = 6.6, top = -15, h = 14;
    p.ell(0, top + h, r, r * SQ, '#b8d4dc');
    p.rect(-r, top + 1.5, r * 2, h - 1.5, '#86b44a'); p.ell(0, top + h - 0.6, r * 0.92, r * SQ * 0.9, '#78a640');
    p.rect(r * 0.4, top + 1.5, r * 0.6, h - 1.5, '#74a03c');
    p.rect(-r, top + 1, 0.8, h, '#e6f4f6'); p.rect(r - 0.8, top + 1, 0.8, h, '#a8c4cc');
    p.rect(-r + 1.6, top + 3, 0.6, h - 6, '#f4fcfc');
    const sauce = has(o, 'sauce');
    p.ell(0, top + 1.4, r * 0.96, r * SQ * 0.9, sauce ? '#5a8a2a' : '#9ac45a');
    p.ell(0, top, r, r * SQ, '#e6f4f6'); p.ell(0, top + 0.3, r * 0.9, r * SQ * 0.82, sauce ? '#5a8a2a' : '#9ac45a');
    const cream = has(o, 'cream');
    if (cream > 0) {
      const k = cream;
      p.ell(0, top - 0.6, 4.4 * k, 2.2 * k, '#efe8d8'); p.ell(0, top - 1.2, 4.2 * k, 2 * k, '#fffdf6');
      if (k > 0.5) { p.ell(0, top - 2.6, 3 * k, 1.5 * k, '#f4eee2'); p.ell(0, top - 3, 2.8 * k, 1.3 * k, '#fffdf6'); }
      if (k > 0.85) { p.ell(0.3, top - 4.2, 1.3, 0.8, '#fffdf6'); p.dot(0.6, top - 4.8, '#ffffff', 0.4); }
    }
    if (has(o, 'beans')) for (const [a, b] of [[-3, -0.6], [-1.8, 0.4], [3.2, -0.2], [2.2, 0.6]]) { p.ell(a, top + b, 0.9, 0.6, '#6a2a2a'); p.dot(a - 0.3, top + b - 0.2, '#a85a5a', 0.3); }
    if (has(o, 'mint')) { leaf(p, 2, top - 4.6, 1.6, 0.8, '#4f9a4a', '#2f6a2a'); leaf(p, 3.2, top - 3.8, 1.3, 0.7, '#5aaa4a', '#2f6a2a'); }
    const dust = has(o, 'dust');
    for (let i = 0; i < 12 * dust; i++) p.dot(-3.5 + rnd(i + 70) * 7, top - 3 + rnd(i + 80) * 3, '#7aa83a', 0.35);
  },
};

export function drawDish(p, kind, o) { (DISHES[kind] || DISHES.chawanmushi)(p, o || ALL); }

// a small canvas of a plated dish, for the menu
export function dishThumb(kind, w = 96, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  drawDish(pen(x, w / 2, h * 0.56, w / 46), kind);
  return c;
}

// ---------------------------------------------------------------- close-up
// The chef's board seen from the guests' side, in a 240 x 135 design space.
// Prep happens on the left of the board, plating on the right. The chef's
// arms reach in from the top of the frame.
const PREP = [76, 54], PLATE = [164, 56], DS = 2.3, HS = 1.5; // HS: size of the chef's hands
let TOPY = 0; // the design-space y of the top of the screen (above 0 on tall screens)
const SKIN = '#f0bf94', SKIN_S = '#d49c74', COAT = '#fbfaf5', COAT_S = '#dcd8ce';

function backdrop(p) {
  p.rect(-200, TOPY, 640, 400, '#e9cc9e');
  for (let i = Math.floor(TOPY / 5.3) - 1; i < 40; i++) p.line(-200, 4 + i * 5.3, 440, 3 + i * 5.3 + (i % 3), i % 2 ? '#e2c494' : '#f0d8ae', 0.4);
  p.rect(-200, Math.min(0, TOPY), 640, 7 - Math.min(0, TOPY), COAT); p.rect(-200, 6, 640, 1.2, COAT_S);
  // the board
  p.rect(30, 90, 180, 3, '#b88a5a');
  p.rect(28, 84, 184, 6, '#c99a68');
  p.rect(28, 18, 184, 66, '#f2dcae');
  for (let i = 0; i < 12; i++) p.line(30, 22 + i * 5.4, 210, 21 + i * 5.4 + (i % 2), '#ead0a0', 0.35);
  p.rect(28, 18, 184, 0.8, '#fbeccc');
  // a sharpening stone and a small dish of water by the board
  p.rect(214, 40, 22, 9, '#8a8f98'); p.rect(214, 49, 22, 2, '#6a6e76'); p.rect(214, 40, 22, 1, '#a8adb6');
  p.ell(222, 68, 9, 5, '#d8d2c6'); p.ell(222, 67.4, 7.5, 4, '#a8c8d8');
}
function arm(p, sx, sy, hx, hy, hold) {
  const dx = hx - sx, dy = hy - sy, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy * 5 * HS, ny = ux * 5 * HS;
  // sleeve rolled up to the elbow, then a bare forearm down to the hand
  const fa = 9 * HS, mx = hx - ux * fa, my = hy - uy * fa;
  p.poly([[sx + nx, sy + ny], [mx + nx * 0.9, my + ny * 0.9], [mx - nx * 0.9, my - ny * 0.9], [sx - nx, sy - ny]], COAT);
  p.poly([[sx - nx * 0.4, sy - ny * 0.4], [mx - nx * 0.4, my - ny * 0.4], [mx - nx * 0.9, my - ny * 0.9], [sx - nx, sy - ny]], COAT_S);
  p.poly([[mx + nx * 0.62, my + ny * 0.62], [hx + nx * 0.5, hy + ny * 0.5], [hx - nx * 0.5, hy - ny * 0.5], [mx - nx * 0.62, my - ny * 0.62]], SKIN);
  p.poly([[mx - nx * 0.2, my - ny * 0.2], [hx - nx * 0.2, hy - ny * 0.2], [hx - nx * 0.5, hy - ny * 0.5], [mx - nx * 0.62, my - ny * 0.62]], SKIN_S);
  // the rolled cuff
  p.poly([[mx + nx * 1.02 - ux * 3, my + ny * 1.02 - uy * 3], [mx + nx * 1.02 + ux * 1.4, my + ny * 1.02 + uy * 1.4], [mx - nx * 1.02 + ux * 1.4, my - ny * 1.02 + uy * 1.4], [mx - nx * 1.02 - ux * 3, my - ny * 1.02 - uy * 3]], COAT);
  p.line(mx + nx * 1.02 - ux * 0.8, my + ny * 1.02 - uy * 0.8, mx - nx * 1.02 - ux * 0.8, my - ny * 1.02 - uy * 0.8, COAT_S, 0.6);
  const cx = hx + dx / l * 3.2 * HS, cy = hy + dy / l * 3.2 * HS;
  p.ell(cx, cy + 0.9, 4.4 * HS, 3.4 * HS, SKIN_S);
  p.ell(cx, cy, 4.2 * HS, 3.2 * HS, SKIN);
  p.ell(cx - 1.2 * HS, cy - 1.2 * HS, 1.8 * HS, 0.8 * HS, '#f8d4b0');
  if (hold !== 'flat') for (let k = -1; k <= 1; k++) p.line(cx + dx / l * 1.6 * HS + k * 1.6 * HS, cy + dy / l * 1.6 * HS - 1, cx + dx / l * 3 * HS + k * 1.6 * HS, cy + dy / l * 3 * HS + 0.6, SKIN_S, 0.45);
}
function hands(p, L, R) {
  // the chef leans over the counter: his shoulders are high above the frame, so the arms come in steeply from the top
  if (L) arm(p, 62, Math.min(0, TOPY) - 46, L[0], L[1], L[2]);
  if (R) arm(p, 178, Math.min(0, TOPY) - 46, R[0], R[1], R[2]);
}
function knife(p, x, y, a = 0, L = 30) {
  const c = Math.cos(a), s = Math.sin(a), T = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  p.poly([T(-L, 0.2), T(0, -1.8), T(0, 1.4), T(-L * 0.9, 1.3)], '#d4d9e0');
  p.line(...T(-L * 0.93, -0.2), ...T(0, -1.5), '#f4f6fa', 0.4);
  p.line(...T(-L * 0.9, 1.2), ...T(0, 1.3), '#9aa2ae', 0.4);
  p.poly([T(0, -1.9), T(2, -1.9), T(2, 1.7), T(0, 1.7)], '#ece6da');
  p.poly([T(2, -1.6), T(14, -1.4), T(14, 1.3), T(2, 1.4)], '#6a4a32');
  p.line(...T(3, -0.9), ...T(13, -0.8), '#8a6a4a', 0.4);
}
// a knife whose tip is at (tx, ty), held up at angle a; returns where the hand grips it
function knifeTip(p, tx, ty, a = -1.35, L = 21) { // a shorter blade for cutting straight down
  const c = Math.cos(a), s = Math.sin(a), x = tx + L * c, y = ty + L * s;
  knife(p, x, y, a, L);
  return [x + 9 * c, y + 9 * s - 2];
}
// an ellipse turned by angle a (for things tipped over)
function tiltEll(p, cx, cy, rx, ry, a, col) {
  const c = Math.cos(a), s = Math.sin(a), pts = [];
  for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2, u = Math.cos(t) * rx, v = Math.sin(t) * ry; pts.push([cx + u * c - v * s, cy + u * s + v * c]); }
  p.poly(pts, col);
}
function bowl(p, cx, cy, r, col, inner, fillCol, fill = 1) {
  p.ell(cx, cy + r * 0.32, r * 0.92, r * SQ * 0.9, shade(col, 0.3));
  p.ell(cx, cy, r, r * SQ, col);
  p.ell(cx, cy, r * 0.84, r * 0.84 * SQ, inner);
  if (fillCol && fill > 0) p.ell(cx, cy + 0.6 * (1 - fill), r * 0.78 * Math.sqrt(fill), r * 0.78 * SQ * Math.sqrt(fill), fillCol);
}
function chopsticks(p, x, y, a = -0.5, gap = 1.2) {
  for (const g of [-gap / 2, gap / 2]) p.line(x + g, y, x + g + Math.cos(a) * 22, y + Math.sin(a) * 22, '#c99a68', 0.7);
}
function steam(p, x, y, T, n = 3, k = 1) {
  for (let i = 0; i < n; i++) {
    const ph = (T * 0.5 + i / n) % 1;
    p.alpha((1 - ph) * 0.55 * k, () => p.ell(x + Math.sin(T * 2 + i * 2) * 2 + (i - 1) * 3, y - ph * 16, 2 + ph * 2.4, 1.4 + ph * 1.6, '#ffffff'));
  }
}
const toB = (c, u, v) => [c[0] + u * DS, c[1] + v * DS]; // dish units near PREP/PLATE -> board

// Each recipe is a list of steps; every step draws the whole close-up at
// progress t (0..1) and may name sound effects at fractions of its length.
const R = {
  chawanmushi: [
    { dur: 2.6, sfx: [[0.05, 'whisk'], [0.45, 'whisk']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      bowl(pp, 0, 0, 12, '#f4f1ea', '#e8e2d6', '#f2c050', 1);
      for (let i = 0; i < 6; i++) pp.dot(-4 + rnd(i) * 8, -2 + rnd(i + 3) * 4, '#fbe090', 0.5);
      const a = T * 9, tx = Math.cos(a) * 4, ty = Math.sin(a) * 1.6;
      pp.alpha(0.5, () => pp.ell(tx * 0.5, ty * 0.5, 4, 1.2, '#f8d878'));
      drawDish(p.sub(...PLATE, DS), 'chawanmushi', { cup: 1 });
      const [hx, hy] = toB(PREP, tx, ty);
      chopsticks(p, hx, hy, -0.9 + Math.sin(a) * 0.1);
      hands(p, toB(PREP, -11, 1).concat('flat'), [hx + 12, hy - 16]);
    } },
    { dur: 2.8, sfx: [[0.1, 'pour']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      const k = ease(seg(t, 0.1, 0.9));
      drawDish(dp, 'chawanmushi', { cup: 1, fill: k });
      // a fine sieve over the cup, the bowl tipped over it
      dp.ell(0, -14, 7.6, 3.6, '#9aa0aa'); dp.ell(0, -14, 6.8, 3.1, '#c8ccd2');
      for (let i = -3; i <= 3; i++) dp.line(i * 2, -16.6, i * 2, -11.4, '#aeb4bc', 0.15);
      dp.rect(7.2, -14.6, 9, 1, '#6a4a32');
      // the bowl tips further as it empties; a ribbon of custard runs into the sieve
      const bp = p.sub(PLATE[0] - 9 * DS, PLATE[1] - 19.5 * DS, DS), tilt = 0.25 + k * 0.25;
      tiltEll(bp, 0.6, 1.8, 7.8, 4.6, tilt, '#cfc6b8');
      tiltEll(bp, 0, 0, 8, 4.2, tilt, '#f4f1ea');
      tiltEll(bp, 0.4, 0.1, 6.8, 3.4, tilt, '#e6dfd2');
      if (k < 0.97) tiltEll(bp, 1.4 + k, 0.5 + k * 0.4, 5.6 * (1 - k * 0.6), 2.6 * (1 - k * 0.6), tilt, '#f2c050');
      if (t > 0.08 && t < 0.92) {
        const lx = 8 * Math.cos(tilt) - 9, ly = 8 * Math.sin(tilt) - 19.5, w = Math.sin(T * 9) * 0.15;
        dp.line(lx, ly, lx + 0.8 + w, -14.2, '#f2c050', 1.1); dp.line(lx - 0.2, ly, lx + 0.4 + w, -14.6, '#fbe090', 0.35);
        for (let i = 0; i < 3; i++) dp.dot(-3 + i * 2.6, -11 + ((T * 2.5 + i / 3) % 1) * 3, '#f2c050', 0.5); // drips through the mesh
      }
      hands(p, toB(PLATE, -17, -19), toB(PLATE, -1, -21));
    } },
    { dur: 3.2, sfx: [[0.05, 'pop'], [0.18, 'pop'], [0.45, 'steam']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'chawanmushi', { cup: 1, fill: 1, top: t > 0.25 ? 1 : 0, set: seg(t, 0.4, 1) });
      if (t < 0.25) { const y = -24 + seg(t, 0, 0.22) * 11; dp.ell(-2.6, y, 2.3, 1.2, '#f08a7a'); dp.ell(2.6, y - 2, 1.3, 0.85, '#c8d84a'); }
      // the steamer lid comes down and the steam rises
      if (t > 0.35) {
        const lid = seg(t, 0.35, 0.5) - seg(t, 0.85, 1);
        dp.alpha(lid, () => { dp.ell(0, -13, 10.5, 5.4, '#c99a68'); dp.ell(0, -14, 10, 5, '#e0b884'); for (let i = 0; i < 5; i++) dp.line(-8 + i * 4, -17, -8 + i * 4, -10, '#c99a68', 0.3); });
        steam(dp, 0, -18, T, 4, lid);
      }
      hands(p, t < 0.3 ? toB(PLATE, -5, -18) : null, t < 0.3 ? null : [PLATE[0] + 34, 30]);
    } },
    { dur: 2.2, sfx: [[0.4, 'pop'], [0.8, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'chawanmushi', { cup: 1, fill: 1, top: 1, set: 1, leaf: t > 0.45 ? 1 : 0 });
      steam(dp, 0, -17, T, 2, 0.6);
      const y = t < 0.45 ? -24 + seg(t, 0, 0.45) * 9 : -15;
      if (t < 0.45) leaf(dp, 1.5, y, 1.7, 0.9, '#5aaa4a', '#3f7a3a');
      if (t < 0.7) { const [hx, hy] = toB(PLATE, 3, y - 2); p.line(hx - 1, hy, hx + 8, hy - 14, '#9aa0aa', 0.5); p.line(hx + 1, hy, hx + 10, hy - 14, '#9aa0aa', 0.5); hands(p, null, [hx + 10, hy - 16]); }
    } },
  ],

  tofu: [
    { dur: 2.6, sfx: [[0.15, 'splash']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      bowl(pp, 0, 2, 13, '#3f5a8a', '#2f4a78', '#9cc8e0', 1);
      for (let i = 0; i < 3; i++) { const r = ((T * 0.6 + i / 3) % 1) * 9; pp.alpha(1 - r / 9, () => { pp.ell(0, 2, r, r * SQ, '#c8e4f0'); pp.ell(0, 2, Math.max(0, r - 0.6), Math.max(0, r - 0.6) * SQ, '#9cc8e0'); }); }
      const up = ease(seg(t, 0.2, 0.8)), y = 2 - up * 12;
      pp.rect(-6, y - 4, 12, 6, '#ece6d6'); pp.rect(-6, y - 8, 12, 4.6, '#fbf8ef');
      if (up > 0.3) for (let i = 0; i < 3; i++) pp.dot(-4 + i * 4, y + 3 + ((T * 3 + i) % 1) * 6, '#c8e4f0', 0.6);
      drawDish(p.sub(...PLATE, DS), 'tofu', {});
      hands(p, toB(PREP, -9, y - 2).concat('flat'), toB(PREP, 9, y - 2).concat('flat'));
    } },
    { dur: 2.6, sfx: [[0.3, 'chop'], [0.62, 'chop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      pp.rect(-9, -2, 18, 7, '#ece6d6'); pp.rect(-9, -9, 18, 7.2, '#fbf8ef'); pp.rect(5, -2, 4, 7, '#d8cfbb');
      if (t > 0.32) pp.line(-3, -9, -3, 5, '#ddd6c4', 0.3);
      if (t > 0.64) pp.line(3, -9, 3, 5, '#ddd6c4', 0.3);
      drawDish(p.sub(...PLATE, DS), 'tofu', {});
      const cut = t < 0.5 ? -3 : 3, ph = (t * 2) % 1, down = ph < 0.6 ? ph / 0.6 : 1 - (ph - 0.6) / 0.4;
      const [kx, ky] = toB(PREP, cut, -11 + down * 16);
      hands(p, toB(PREP, -13, -3).concat('flat'), knifeTip(p, kx, ky));
    } },
    { dur: 3.0, sfx: [[0.12, 'pop'], [0.32, 'pour']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      if (t < 0.22) { // the cut block is set down first
        drawDish(dp, 'tofu', { tofu: 1, lift: 1 - ease(seg(t, 0, 0.18)) });
        hands(p, toB(PLATE, -10, -6).concat('flat'), toB(PLATE, 10, -6).concat('flat'));
        return;
      }
      drawDish(dp, 'tofu', { tofu: 1, sauce: ease(seg(t, 0.25, 0.92)) });
      // a little jug pours around the tofu
      const a = (t - 0.2) * Math.PI * 1.7, jx = Math.cos(a) * 9, jy = 2 + Math.sin(a) * 4;
      if (t > 0.15 && t < 0.92) dp.line(jx, jy - 9, jx, jy, '#5a3424', 0.6);
      dp.ell(jx + 1, jy - 12, 3.4, 2.2, '#f4f1ea'); dp.rect(jx - 2.4, jy - 14, 6.8, 2.4, '#f4f1ea'); dp.ell(jx + 1, jy - 14, 3.4, 1.4, '#6a3a24');
      hands(p, null, toB(PLATE, jx + 6, jy - 14));
    } },
    { dur: 3.0, sfx: [[0.2, 'pop'], [0.38, 'pop'], [0.56, 'pop'], [0.74, 'pop'], [0.9, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      const n = Math.floor(seg(t, 0.1, 0.95) * 5.99);
      drawDish(dp, 'tofu', { tofu: 1, sauce: 1, ginger: 1, flowers: n });
      if (n < 5) {
        const k = (seg(t, 0.1, 0.95) * 6) % 1, tx = [-3.6, 3.4, -8.5, 9, 2][n], ty = [-8.8, -6.4, 3, -1, -9.8][n];
        const y = ty - (1 - k) * 8;
        flower(dp, tx, y, 1.6, ['#8a5ac8', '#f6d04a', '#f6a0c0', '#c8a0f0', '#f6a0c0'][n], '#f6d04a');
        const [hx, hy] = toB(PLATE, tx, y - 1);
        p.line(hx - 1, hy, hx + 8, hy - 14, '#9aa0aa', 0.5); p.line(hx + 1, hy, hx + 10, hy - 14, '#9aa0aa', 0.5);
        hands(p, null, [hx + 10, hy - 16]);
      }
    } },
  ],

  hamachi: sashimiRecipe('hamachi'),
  otoro: sashimiRecipe('otoro'),

  hotate: nigiriRecipe('hotate'),
  uni: nigiriRecipe('uni'),

  tempura: [
    { dur: 2.6, sfx: [[0.3, 'whisk']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      bowl(pp, 0, 2, 12, '#f4f1ea', '#e8e2d6', '#f2ead0', 1);
      for (let i = 0; i < 10; i++) pp.dot(-6 + rnd(i) * 12, -1 + rnd(i + 9) * 5, '#e2d8b8', 0.7);
      const dip = Math.sin(seg(t, 0.15, 0.85) * Math.PI), y = -10 + dip * 9;
      shrimpCurl(pp, 2, y, 4.2, mix('#f4b8a8', '#f4ead6', seg(t, 0.4, 0.6)), 0);
      drawDish(p.sub(...PLATE, DS), 'tempura', {});
      const [hx, hy] = toB(PREP, 4, y - 2);
      chopsticks(p, hx, hy, -0.95);
      hands(p, toB(PREP, -12, 2).concat('flat'), [hx + 12, hy - 18]);
    } },
    { dur: 3.2, sfx: [[0.12, 'sizzle'], [0.55, 'sizzle']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      cyl(pp, 0, -4, 13, 7, '#5a5e66', '#3e4148', '#8a8f98');
      pp.ell(0, -4, 11.4, 6, mix('#d8a040', '#c88a30', 0.5));
      const g = seg(t, 0.1, 0.95);
      shrimpCurl(pp, -2, -1, 4.6, mix('#f4ead6', '#e8b24a', g), g > 0.4 ? 1 : 0);
      for (let i = 0; i < 14; i++) { const a = rnd(i) * Math.PI * 2, r = 3 + rnd(i + 5) * 7, ph = (T * 3 + rnd(i + 9)) % 1; pp.dot(-2 + Math.cos(a) * r, -3 + Math.sin(a) * r * SQ - ph * 1.2, '#fff4c0', 0.5 * (1 - ph) + 0.2); }
      steam(pp, 0, -10, T, 3, 0.5);
      drawDish(p.sub(...PLATE, DS), 'tempura', {});
      const [hx, hy] = toB(PREP, 0, -3);
      chopsticks(p, hx, hy, -1.0);
      hands(p, null, [hx + 11, hy - 20]);
    } },
    { dur: 2.4, sfx: [[0.3, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      slab(pp, 22, 13, '#9aa0aa', '#6a6e76', 0, 2); for (let i = 0; i < 8; i++) pp.line(-10 + i * 2.8, -4.4, -10 + i * 2.8, 8.4, '#c8ccd2', 0.3);
      pp.rect(-9, -3, 18, 10, '#f8f4ea');
      shrimpCurl(pp, -2, 3.5, 4.6, '#e8b24a', 1);
      shrimpCurl(pp, 5, 2.5, 4.6, '#e8b24a', 1);
      steam(pp, 1, -2, T, 3, 0.4);
      // a sheet of washi is laid on the tray to soak up the last of the oil
      const lift = 1 - ease(seg(t, 0.05, 0.45));
      drawDish(p.sub(...PLATE, DS), 'tempura', { paper: 1, paperLift: lift });
      if (t < 0.55) hands(p, toB(PLATE, -11, -lift * 12).concat('flat'), toB(PLATE, 11, -1 - lift * 12).concat('flat'));
    } },
    { dur: 2.6, sfx: [[0.2, 'pop'], [0.45, 'pop'], [0.7, 'pop'], [0.9, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'tempura', { paper: 1, shrimp: t > 0.15 ? (t > 0.4 ? 2 : 1) : 0, lemon: t > 0.6 ? 1 : 0, sauce: t > 0.78 ? 1 : 0 });
      steam(dp, 0, -4, T, 3, 0.4);
      const [hx, hy] = toB(PLATE, t < 0.4 ? -2 : 6, -4);
      if (t < 0.6) { chopsticks(p, hx, hy, -0.95); hands(p, null, [hx + 12, hy - 18]); }
    } },
  ],

  anago: [
    { dur: 3.0, sfx: [[0.1, 'sizzle']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      // a little charcoal grill with the eel on skewers
      slab(pp, 26, 12, '#3a3436', '#2a2426', 0, 2);
      for (let i = 0; i < 9; i++) { const g = 0.6 + 0.4 * Math.sin(T * 4 + i); pp.ell(-9 + i * 2.3, 2 + (i % 2), 1.4, 0.9, mix('#7a2a1a', '#ff8a3a', g)); }
      for (let i = 0; i < 6; i++) pp.line(-12 + i * 4.8, -3, -12 + i * 4.8, 7, '#8a8f98', 0.3);
      const c = mix('#d8b088', '#b07040', seg(t, 0, 1));
      pp.rect(-10, -4, 20, 4.4, c); pp.ell(-10, -1.8, 1, 2.2, c); pp.ell(10, -1.8, 1, 2.2, c);
      for (let k = 0; k < 5; k++) pp.line(-8 + k * 4, -3.8, -7 + k * 4, 0.2, mix(c, '#3a1a0a', seg(t, 0.3, 1) * 0.6), 0.35);
      pp.line(-14, -3, 14, -3.4, '#d8d2c6', 0.35); pp.line(-14, -0.4, 14, -0.8, '#d8d2c6', 0.35);
      steam(pp, 0, -6, T, 3, 0.7);
      drawDish(p.sub(...PLATE, DS), 'anago', {});
      hands(p, toB(PREP, -15, -2), toB(PREP, 15, -3));
    } },
    { dur: 3.0, sfx: [[0.2, 'sizzle'], [0.6, 'sizzle']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      slab(pp, 26, 12, '#3a3436', '#2a2426', 0, 2);
      for (let i = 0; i < 9; i++) { const g = 0.6 + 0.4 * Math.sin(T * 5 + i); pp.ell(-9 + i * 2.3, 2 + (i % 2), 1.4, 0.9, mix('#7a2a1a', '#ff8a3a', g)); }
      const gl = seg(t, 0.1, 0.9), c = mix('#b07040', '#8a4a26', gl);
      pp.rect(-10, -4, 20, 4.4, c);
      for (let k = 0; k < 5; k++) pp.line(-8 + k * 4, -3.8, -7 + k * 4, 0.2, '#4a2010', 0.35);
      if (gl > 0.3) { pp.ell(-4, -3, 3, 0.5, '#e8a868'); pp.ell(4, -2.4, 2, 0.4, '#d89a5a'); }
      pp.line(-14, -3, 14, -3.4, '#d8d2c6', 0.35); pp.line(-14, -0.4, 14, -0.8, '#d8d2c6', 0.35);
      for (let i = 0; i < 3; i++) { const f = (T * 2 + i / 3) % 1; pp.alpha(1 - f, () => pp.ell(-6 + i * 6, 1 - f * 6, 1.2, 1.8 - f, '#ffb04a')); }
      steam(pp, 0, -6, T, 3, 0.8);
      drawDish(p.sub(...PLATE, DS), 'anago', {});
      // a brush sweeps along the fillet
      const bx = -9 + ((t * 2.2) % 1) * 18;
      pp.line(bx, -3, bx + 5, -14, '#c99a68', 0.7); pp.ell(bx, -2.6, 1.4, 0.9, '#5a2814');
      hands(p, null, toB(PREP, bx + 6, -16));
    } },
    { dur: 2.6, sfx: [[0.25, 'chop'], [0.6, 'pop'], [0.8, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      if (t < 0.55) {
        pp.rect(-10, -4, 9.6, 4.4, '#8a4a26'); pp.rect(0.4, -4, 9.6, 4.4, '#8a4a26');
        pp.ell(-4, -3, 3, 0.5, '#e8a868');
        const down = t < 0.25 ? seg(t, 0, 0.25) : 1;
        const [kx, ky] = toB(PREP, 0.2, -12 + down * 12.6);
        hands(p, toB(PREP, -12, -2).concat('flat'), knifeTip(p, kx, ky));
      }
      drawDish(p.sub(...PLATE, DS), 'anago', { pieces: t < 0.55 ? 0 : t < 0.75 ? 1 : 2, glaze: 1 });
      if (t >= 0.55) hands(p, null, toB(PLATE, t < 0.75 ? -7 : 6, -6).concat('flat'));
    } },
    { dur: 2.2, sfx: [[0.3, 'whisk'], [0.85, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'anago', { pieces: 2, glaze: 1, sansho: t > 0.5 ? 1 : 0 });
      if (t < 0.7) {
        for (let i = 0; i < 8; i++) { const f = (T * 1.6 + i / 8) % 1; dp.dot(-6 + rnd(i) * 12, -14 + f * 10, '#7a9a3a', 0.45); }
        dp.rect(-1.5, -20, 3, 4, '#3a2a30'); dp.ell(0, -16, 1.5, 0.7, '#2a1c22');
        hands(p, null, toB(PLATE, 3, -20));
      }
    } },
  ],

  mochi: [
    { dur: 3.0, sfx: [[0.3, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      const k = ease(seg(t, 0.15, 0.85));
      // the strawberry sits in the chef's palm and the bean paste closes round it
      pp.ell(0, 1, 6.5 + k, 5.6 + k * 0.6, '#6a3a4a');
      pp.ell(0, 1, 6.5 + k, 5.6 + k * 0.6, '#5a3040', 0.2, 1);
      pp.alpha(1 - k * 0.85, () => { pp.ell(0, -1, 4.6, 4, '#e8404a'); pp.ell(-1.4, -2.4, 1.6, 1.2, '#f88a8a'); for (let i = 0; i < 7; i++) pp.dot(-3 + rnd(i) * 6, -3 + rnd(i + 4) * 5, '#f6e080', 0.4); });
      if (k < 0.3) { pp.rect(-1.5, -5.8, 3, 1.4, '#4f9a4a'); }
      drawDish(p.sub(...PLATE, DS), 'mochi', { leaf: 1 });
      hands(p, toB(PREP, -7, 5).concat('flat'), toB(PREP, 6 - k * 2, -3));
    } },
    { dur: 3.0, sfx: [[0.2, 'pop'], [0.7, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      const k = ease(seg(t, 0.1, 0.85));
      pp.ell(0, 3, 12 - k * 4, (12 - k * 4) * SQ, '#fbf8f4');
      pp.ell(0, 3 - k * 3, 7.5, 6.4 - (1 - k) * 2, k > 0.5 ? '#fbf8f4' : '#6a3a4a');
      if (k > 0.5) { pp.ell(-2, -1.5, 2.4, 1.6, '#ffffff'); }
      for (let i = 0; i < 12; i++) pp.dot(-8 + rnd(i) * 16, -4 + rnd(i + 30) * 10, '#ffffff', 0.5);
      drawDish(p.sub(...PLATE, DS), 'mochi', { leaf: 1 });
      hands(p, toB(PREP, -10, 2 - k * 2).concat('flat'), toB(PREP, 10, 2 - k * 2).concat('flat'));
    } },
    { dur: 3.4, sfx: [[0.22, 'chop'], [0.45, 'pop'], [0.72, 'pop'], [0.92, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      if (t < 0.6) {
        const pp = p.sub(...PREP, DS);
        const g = ease(seg(t, 0.3, 0.5)) * 2.6; // the halves part
        if (g > 0) {
          // the cut faces: white mochi, a ring of bean paste, the strawberry in the middle
          for (const sd of [-1, 1]) {
            pp.ell(sd * g, 0.4, 7.5, 6.4, '#e6ded6', sd < 0 ? -1 : -1, 1);
            pp.ell(sd * g, 0, 7.5, 6.4, '#fbf8f4');
          }
          pp.rect(-g, -6, g * 2, 12.4, '#efe6dc');
          pp.ell(0, 0, Math.max(0.6, g * 0.9), 4.6, '#6a3a4a'); pp.ell(0, 0, Math.max(0.4, g * 0.6), 3.2, '#e8404a');
        } else { pp.ell(0, 0.4, 7.5, 6.4, '#e6ded6'); pp.ell(0, 0, 7.5, 6.4, '#fbf8f4'); }
        pp.ell(-2 - g, -2, 2.4, 1.6, '#ffffff');
        if (t < 0.3) {
          const down = ease(seg(t, 0, 0.26)), [kx, ky] = toB(PREP, 0, -8.5 + down * 15);
          hands(p, toB(PREP, -11, 0).concat('flat'), knifeTip(p, kx, ky));
        } else hands(p, toB(PREP, -10 - g, 1).concat('flat'), toB(PREP, 10 + g, 1).concat('flat'));
        drawDish(dp, 'mochi', { leaf: 1 });
      } else {
        drawDish(dp, 'mochi', { leaf: 1, halves: 1 });
        if (t < 0.75) hands(p, toB(PLATE, -11, -2).concat('flat'), toB(PLATE, 11, -2).concat('flat'));
      }
    } },
  ],

  matcha: [
    { dur: 3.0, sfx: [[0.05, 'whisk'], [0.35, 'whisk'], [0.65, 'whisk']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      bowl(pp, 0, 2, 12, '#3a3036', '#4a3e44', mix('#4f7a2a', '#9ac45a', seg(t, 0, 1)), 1);
      const fr = seg(t, 0.15, 1);
      for (let i = 0; i < 30 * fr; i++) pp.dot(-7 + rnd(i) * 14, -1 + rnd(i + 40) * 5.4, '#c4e08a', 0.45);
      const w = Math.sin(T * 14) * 4, wy = Math.cos(T * 7) * 1.2;
      pp.ell(w, 1 + wy, 2.4, 1.2, '#d8c08a'); for (let k = -2; k <= 2; k++) pp.line(w + k * 0.8, 1 + wy, w + k * 0.5, -7 + wy, '#e8d4a0', 0.3);
      pp.rect(w - 1, -16 + wy, 2, 9, '#c99a68');
      drawDish(p.sub(...PLATE, DS), 'matcha', {});
      hands(p, toB(PREP, w + 1, -16 + wy), toB(PREP, 13, 3).concat('flat'));
    } },
    { dur: 2.6, sfx: [[0.2, 'pour']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'matcha', { sauce: t > 0.6 ? 1 : 0 });
      if (t > 0.15 && t < 0.75) { dp.line(-1, -19, 0, -15, '#4f7a2a', 0.7); dp.alpha(seg(t, 0.15, 0.6), () => dp.ell(0, -14.6, 5.4, 2.6, '#5a8a2a')); }
      const bp = p.sub(PLATE[0] - 6 * DS, PLATE[1] - 21 * DS, DS);
      bp.ell(0, 0, 6, 3.2, '#3a3036'); bp.ell(1.2, -0.4, 4.4, 2.2, '#4f7a2a');
      hands(p, toB(PLATE, -11, -21), null);
    } },
    { dur: 3.4, sfx: [[0.15, 'pour'], [0.5, 'pop'], [0.62, 'pop'], [0.75, 'whisk'], [0.92, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      const cream = ease(seg(t, 0.05, 0.45));
      drawDish(dp, 'matcha', { sauce: 1, cream, beans: t > 0.5 ? 1 : 0, mint: t > 0.62 ? 1 : 0, dust: seg(t, 0.72, 0.95) });
      if (t < 0.45) { // piping bag
        dp.poly([[-1, -18 - cream * 3], [4, -30], [10, -26], [1, -17 - cream * 3]], '#f4f1ea'); dp.line(-0.5, -17.5 - cream * 3, 0, -16 - cream * 3, '#fffdf6', 0.6);
        hands(p, null, toB(PLATE, 7, -28));
      } else if (t > 0.7 && t < 0.97) { // a fine sieve tapped over the top
        const tap = Math.abs(Math.sin(T * 12)) * 0.6;
        dp.ell(0, -24 + tap, 5, 2.4, '#9aa0aa'); dp.ell(0, -24 + tap, 4.2, 2, '#c8ccd2'); dp.rect(4.6, -24.6 + tap, 8, 1, '#6a4a32');
        for (let i = 0; i < 6; i++) { const f = (T * 2 + i / 6) % 1; dp.dot(-3 + rnd(i) * 6, -22 + f * 4, '#7aa83a', 0.4); }
        hands(p, null, toB(PLATE, 13, -24));
      }
    } },
  ],
};

function sashimiRecipe(kind) {
  const toro = kind === 'otoro';
  const fish = toro ? '#f2b6ae' : '#f6dccb', line = toro ? '#fdeae4' : '#d47a6a';
  const block = (pp, cut) => { // the loin on the board; it gets shorter as slices come off
    const w = 20 - cut * 2.4;
    pp.rect(-10, -2, w, 6, shade(fish, 0.12)); pp.rect(-10, -7, w, 5.2, fish);
    for (let k = 0; k < 5; k++) pp.line(-9 + k * 4, -6.6, -8 + k * 4, -2.4, line, 0.35);
    if (!toro) pp.rect(-10, -7, w, 1, '#c86a5a');
    return -10 + w;
  };
  const fallen = (pp, n) => { for (let i = 0; i < n; i++) fishSlice(pp, 14 + i * 1.2, 4 - i * 0.8, fish, toro ? '#f8d4cc' : line, '#fff4ec', 3, 2.2); };
  return [
    { dur: 2.4, sfx: [[0.3, 'pop'], [0.7, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS); block(pp, 0);
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, kind, toro ? { shiso: t > 0.5 ? 1 : 0 } : { daikon: ease(seg(t, 0.05, 0.55)), shiso: t > 0.65 ? 1 : 0 });
      hands(p, null, toB(PLATE, -4, -6 - Math.sin(t * Math.PI) * 6).concat('flat'));
    } },
    { dur: 3.4, sfx: [[0.12, 'chop'], [0.45, 'chop'], [0.78, 'chop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      const c = Math.min(2.99, t * 3), n = Math.floor(c), ph = c - n;
      const end = block(pp, n + (ph > 0.7 ? 1 : 0));
      fallen(pp, n + (ph > 0.7 ? 1 : 0));
      drawDish(p.sub(...PLATE, DS), kind, toro ? { shiso: 1 } : { daikon: 1, shiso: 1 });
      // one long pull from heel to tip, angled into the loin
      const pull = ph < 0.7 ? ph / 0.7 : 1, [kx, ky] = toB(PREP, end - 1 + 8 - pull * 22, -6 + pull * 4);
      knife(p, kx + 20, ky, -0.25);
      hands(p, toB(PREP, -14, -4).concat('flat'), [kx + 26, ky - 6]);
    } },
    { dur: 2.6, sfx: [[0.2, 'pop'], [0.4, 'pop'], [0.6, 'pop'], [0.8, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      const total = toro ? 3 : 5, n = Math.min(total, Math.floor(seg(t, 0.1, 0.9) * (total + 0.99)));
      fallen(pp, Math.max(0, 3 - n));
      drawDish(p.sub(...PLATE, DS), kind, toro ? { shiso: 1, slices: n } : { daikon: 1, shiso: 1, slices: n });
      const [hx, hy] = toB(PLATE, toro ? -5 + n * 6 : -6 + n * 3.4, -3);
      if (n < total) { chopsticks(p, hx, hy, -0.95); hands(p, null, [hx + 12, hy - 18]); }
    } },
    toro ? { dur: 2.8, sfx: [[0.2, 'whisk'], [0.7, 'pop'], [0.9, 'sparkle']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'otoro', { shiso: 1, slices: 3, salt: seg(t, 0.05, 0.5), gold: t > 0.7 ? 1 : 0, wasabi: t > 0.85 ? 1 : 0 });
      if (t < 0.5) { for (let i = 0; i < 6; i++) { const f = (T * 1.8 + i / 6) % 1; dp.dot(-4 + rnd(i) * 10, -14 + f * 11, '#ffffff', 0.4); } hands(p, null, toB(PLATE, 2, -18)); }
      else if (t < 0.75) { const y = -12 + seg(t, 0.5, 0.7) * 8; dp.poly([[5, y], [6.6, y - 0.6], [7.2, y + 0.6], [5.6, y + 1]], '#f2c84a'); const [hx, hy] = toB(PLATE, 6, y); p.line(hx - 1, hy, hx + 8, hy - 14, '#9aa0aa', 0.5); p.line(hx + 1, hy, hx + 10, hy - 14, '#9aa0aa', 0.5); hands(p, null, [hx + 10, hy - 16]); }
    } } : { dur: 2.8, sfx: [[0.1, 'whisk'], [0.4, 'whisk'], [0.75, 'pop'], [0.9, 'sparkle']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS);
      // fresh wasabi on a sharkskin grater, rubbed in circles
      slab(pp, 12, 16, '#9aa890', '#6a7860', 0, 0); for (let i = 0; i < 18; i++) pp.dot(-5 + rnd(i) * 10, -7 + rnd(i + 8) * 14, '#b8c4ac', 0.4);
      const a = T * 8, wx = Math.cos(a) * 2, wy = Math.sin(a) * 2;
      if (t < 0.6) { pp.rect(wx - 1.6, wy - 9, 3.2, 9, '#7aa040'); pp.ell(wx, wy, 1.6, 0.9, '#c4e080'); }
      pp.ell(0, 4, 2.6 * seg(t, 0, 0.6), 1.4 * seg(t, 0, 0.6), '#94bc44');
      drawDish(p.sub(...PLATE, DS), 'hamachi', { daikon: 1, shiso: 1, slices: 5, lemon: t > 0.6 ? 1 : 0, wasabi: t > 0.75 ? 1 : 0 });
      if (t < 0.6) hands(p, toB(PREP, -8, 6).concat('flat'), toB(PREP, wx, wy - 10));
    } },
  ];
}

function nigiriRecipe(kind) {
  const uni = kind === 'uni';
  const tub = (pp) => { pp.ell(-4, -10, 9, 4.6, '#a87040'); pp.ell(-4, -10.6, 8.2, 4.1, '#c08a52'); pp.ell(-4, -10.8, 7.2, 3.5, '#f7f4ec'); for (let i = 0; i < 8; i++) pp.dot(-9 + rnd(i) * 10, -12 + rnd(i + 3) * 3, '#e6e1d4', 0.4); };
  return [
    { dur: 2.8, sfx: [[0.3, 'pop'], [0.6, 'pop'], [0.8, 'pop']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS); tub(pp);
      const k = ease(seg(t, 0.3, 0.9));
      const w = 3.4 + k * (uni ? 1.2 : 2.2);
      if (t > 0.25) riceBlock(pp, 6, 6, w);
      drawDish(p.sub(...PLATE, DS), kind, { gari: 1, pieces: 0 });
      const press = Math.abs(Math.sin(t * Math.PI * 3)) * 2;
      hands(p, toB(PREP, t < 0.25 ? -4 : 0, t < 0.25 ? -10 : 7).concat('flat'), toB(PREP, 9, 2 - press));
    } },
    uni ? { dur: 2.6, sfx: [[0.3, 'page']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS); tub(pp);
      const k = ease(seg(t, 0.1, 0.8));
      riceBlock(pp, 6, 6, 4.6);
      // the nori strip wraps round the rice
      pp.rect(6 - 5, 0, 10 * k, 6, '#1e2a24'); if (k > 0.5) pp.ell(6, 6, 5, 2.6, '#18221c', -1, 1);
      if (k < 0.95) pp.rect(6 - 5 + 10 * k, -1, 9 * (1 - k), 1.6, '#1e2a24');
      drawDish(p.sub(...PLATE, DS), 'uni', { gari: 1, pieces: 0 });
      hands(p, toB(PREP, -2, 4).concat('flat'), toB(PREP, 6 + 10 * k, 0));
    } } : { dur: 2.8, sfx: [[0.3, 'pop'], [0.55, 'tick'], [0.7, 'tick'], [0.85, 'tick']], draw(p, t, T) {
      const pp = p.sub(...PREP, DS); tub(pp);
      riceBlock(pp, 6, 6);
      const y = t < 0.4 ? -8 + seg(t, 0.1, 0.4) * 9.8 : 1.8;
      pp.ell(6, y, 5.9, 2.9, '#ece0c6'); pp.ell(6, y - 0.5, 4.8, 2.1, '#fbf4e2'); pp.line(2.6, y - 0.4, 9.2, y - 0.1, '#e2d2b2', 0.3);
      drawDish(p.sub(...PLATE, DS), 'hotate', { gari: 1, pieces: 0 });
      const press = t > 0.5 ? Math.abs(Math.sin((t - 0.5) * Math.PI * 6)) * 1.5 : 0;
      hands(p, toB(PREP, -2, 8).concat('flat'), toB(PREP, 7, y - 4 + press).concat('flat'));
    } },
    uni ? { dur: 3.0, sfx: [[0.25, 'pop'], [0.45, 'pop'], [0.65, 'pop'], [0.85, 'pop']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      const n = Math.min(4, Math.floor(seg(t, 0.15, 0.95) * 4.99));
      drawDish(dp, 'uni', { gari: 1, nori: 1, pieces: 2, uni: n });
      // a little wooden spoon brings each lump over
      const k = (seg(t, 0.15, 0.95) * 5) % 1, sx = n % 2 ? 5 : -7, sy = -8.4 - Math.sin(k * Math.PI) * 3;
      dp.ell(sx, sy, 2.4, 1.4, '#d8ac78'); if (k < 0.6) dp.ell(sx, sy - 0.3, 1.8, 1, '#f0a03a'); dp.line(sx + 2, sy - 0.6, sx + 6, sy - 5, '#d8ac78', 0.6);
      hands(p, null, toB(PLATE, sx + 6.5, sy - 6.5));
    } } : { dur: 2.6, sfx: [[0.2, 'whisk'], [0.65, 'pop']], draw(p, t, T) {
      const dp = p.sub(...PLATE, DS);
      drawDish(dp, 'hotate', { gari: 1, pieces: 2, glaze: seg(t, 0.05, 0.6), yuzu: t > 0.65 ? 1 : 0 });
      if (t < 0.6) { const bx = -12 + ((t * 2.4) % 1) * 24; dp.line(bx, -4.5, bx + 5, -16, '#c99a68', 0.7); dp.ell(bx, -4.2, 1.3, 0.8, '#5a2a1a'); hands(p, null, toB(PLATE, bx + 6, -18)); }
      else { for (let i = 0; i < 5; i++) { const f = (T * 1.5 + i / 5) % 1; dp.dot(-6 + rnd(i) * 14, -12 + f * 7, '#f2cc3a', 0.45); } dp.ell(4, -16, 2.6, 2.2, '#f2cc3a'); hands(p, null, toB(PLATE, 6, -18)); }
    } },
    { dur: 2.0, sfx: [[0.3, 'pop'], [0.85, 'sparkle']], draw(p, t, T) {
      drawDish(p.sub(...PLATE, DS), kind, ALL);
      if (t < 0.4) hands(p, null, toB(PLATE, 6, -6).concat('flat'));
    } },
  ];
}

export const RECIPES = R;

// Draws one frame of the close-up into a W x H canvas context.
// `band` is the part of the screen (fractions of H) left clear by the dialog box.
export function drawCloseup(x, W, H, kind, step, t, T, done = false, band = [0, 1]) {
  // frame the working area (about 186 x 100 design units, centred on 121, 46) as close as the clear band allows
  const y0 = band[0] * H, hv = (band[1] - band[0]) * H;
  const f = Math.min(W / 186, hv / 100);
  const ox = W / 2 - 121 * f, oy = y0 + hv / 2 - 46 * f;
  TOPY = -oy / f;
  const p = pen(x, ox, oy, f);
  backdrop(p);
  const steps = R[kind] || R.chawanmushi;
  if (done) {
    const dp = p.sub(PLATE[0] - 44, PLATE[1] + 8, DS * 1.15);
    drawDish(dp, kind, ALL);
    return;
  }
  steps[Math.min(step, steps.length - 1)].draw(p, clamp(t), T);
}

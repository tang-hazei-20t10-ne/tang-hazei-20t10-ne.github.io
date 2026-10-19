// Chapter 3: the car ride. The camera sits on the dashboard looking back into
// the cabin: Hazei (passenger, screen left) and Mino (driving, screen right) in
// the front seats. The cabin is drawn in one-point perspective: the headliner
// and both doors run back toward the rear of the car, each door has its window
// (front door near and big, rear door small), and the rear windscreen sits in
// the middle at the back, showing the road running away behind us.
// Corners are rounded everywhere so the car reads soft rather than boxy.
// (File keeps its old name so saves stay valid.)
import content from '../content.js';
import { Scene2D } from '../two/engine2d.js';
import { TIMES, ditherGradient } from '../core/palette.js';
import { canvas, shade, light, charSprite, LOOKS, emoteSprite } from '../core/sprites.js';
import { treeSprite, ridgeStrip, rand } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait } from '../core/ui.js';

const C = content.train;
const lerp = (a, b, t) => a + (b - a) * t;

// warm, light interior palette
const COL = {
  headliner: '#efe6da', headSeam: '#e2d6c6', headShade: '#ddd0be', pillar: '#e8ddcf', pillarS: '#d6c8b6',
  door: '#d8c6b0', doorS: '#c6b29a', armrest: '#b89c80', handle: '#d9d2c8',
  rubber: '#8a7a74', shelf: '#b9a38c', floor: '#b7a28c',
  rear: '#cdb9a2', rearSeam: '#bba68e', rearHead: '#c3ad95',
  seat: '#dcc4a6', seatS: '#c7ab8b', seatL: '#ead8be', stitch: '#b8956f',
  dashTop: '#cbb59b', dashTopL: '#dccab2', dashFace: '#bca68c', wood: '#a8744e', woodL: '#c58e62',
  console: '#a69482', screen: '#2c3c56', vent: '#dad5cc', ventSlat: '#a39d94',
  wheel: '#5e4a42', wheelL: '#7c665a',
  // scenery, shared by the side windows and the rear windscreen so they match
  hill: '#9fc0a8', hillTree: '#86ac90', grass: '#86bf6a', grassL: '#9fd07a', grassFar: '#a4d488', road: '#a89f9c', roadEdge: '#f4efe6',
};

// how far a rounded corner of radius r cuts in, d pixels from the edge
const ci = (d, r) => (d >= r ? 0 : r - Math.round(Math.sqrt(r * r - (r - d - 0.5) ** 2)));

// pixel rounded rectangle: r for the top corners, rb for the bottom ones
function rrect(x, x0, y0, w, h, r, col, rb = 0) {
  x.fillStyle = col; x0 = Math.round(x0); y0 = Math.round(y0); w = Math.round(w); h = Math.round(h);
  for (let j = 0; j < h; j++) {
    const ins = Math.max(ci(j, r), rb ? ci(h - 1 - j, rb) : 0);
    if (w - 2 * ins > 0) x.fillRect(x0 + ins, y0 + j, w - 2 * ins, 1);
  }
}

export default async function car(game) {
  let travel = 0, totalDur = 60, rideEnded = false;
  let sideStrip = null, skyC = null, rearC = null;
  const freq = new Uint8Array(128);
  let beat = 0, emoteT = 0;
  const pe = { k: 'note', t: 0 }; // Mino's emote
  const he = { k: 'heart', t: 0 }; // Hazei's emote
  const roadTrees = [treeSprite('round', 0.8, 61), treeSprite('pine', 0.8, 62), treeSprite('round', 0.7, 63)];

  // cabin geometry (pixel space)
  const L = (W, H) => {
    const rx0 = Math.round(W * 0.27), rx1 = Math.round(W * 0.73), ry0 = Math.round(H * 0.07), ry1 = Math.round(H * 0.58);
    return {
      rx0, rx1, ry0, ry1,
      // rear windscreen: sloped glass, narrower at the top
      rw: { yt: Math.round(H * 0.095), yb: Math.round(H * 0.265), xt0: Math.round(W * 0.335), xt1: Math.round(W * 0.665), xb0: Math.round(W * 0.295), xb1: Math.round(W * 0.705) },
      // door windows: top line and beltline as functions of the distance into the car (0 = by the camera, 1 = rear)
      winTop: (k) => Math.round(lerp(H * 0.02, ry0 + H * 0.03, k)),
      belt: (k) => Math.round(lerp(H * 0.5, H * 0.27, k)),
      frontWin: [0, 0.56], bPillar: [0.56, 0.63], rearWin: [0.63, 0.93],
      dash: Math.round(H * 0.68),
      seatL: Math.round(W * 0.3), seatR: Math.round(W * 0.7), seatW: Math.round(W * 0.25),
      sc: Math.max(2, Math.round(H / 64)),
    };
  };

  // a long strip of scenery (sky, hills, trees, grass) sampled column by column in the side windows
  function buildSideStrip(h) {
    const w = 420;
    const [c, x] = canvas(w, h);
    ditherGradient(x, w, h, TIMES.morning.sky, 0, 8);
    x.drawImage(ridgeStrip(w, Math.round(h * 0.45), { seed: 12, base: COL.hill, peak: 0.6, freq: 0.03, trees: 18, treeCol: COL.hillTree }), 0, Math.round(h * 0.3));
    const r = rand(5);
    for (let i = 0; i < 14; i++) { const t = treeSprite(r() < 0.4 ? 'pine' : 'round', 0.7 + r() * 0.5, 60 + i); x.drawImage(t.img, Math.round(i * 31 + r() * 12 - t.ox), h - 8 - t.oy); }
    x.fillStyle = COL.grass; x.fillRect(0, h - 10, w, 10); x.fillStyle = COL.grassL; x.fillRect(0, h - 10, w, 1);
    return c;
  }

  // the view out of the rear windscreen: the same hills and trees, the road running away behind us
  function drawRearView(w, h) {
    if (!rearC || rearC.width !== w || rearC.height !== h) rearC = canvas(w, h)[0];
    const x = rearC.getContext('2d'); x.imageSmoothingEnabled = false;
    const hz = Math.round(h * 0.5), vx = w / 2, gh = h - hz;
    x.drawImage(skyC, 0, 0, w, hz + 2);
    const ridge = ridgeStrip(w, Math.round(h * 0.4), { seed: 12, base: COL.hill, peak: 0.6, freq: 0.05, trees: 10, treeCol: COL.hillTree });
    x.drawImage(ridge, 0, hz - ridge.height + 2);
    // fields, lighter toward the horizon
    for (let j = hz; j < h; j++) { x.fillStyle = (j - hz) < gh * 0.25 ? COL.grassFar : (j - hz) < gh * 0.55 ? COL.grassL : COL.grass; x.fillRect(0, j, w, 1); }
    // perspective: a point at depth z sits gh/z below the horizon
    const yAt = (z) => hz + gh / z;
    for (let j = hz + 1; j < h; j++) {
      const z = gh / (j - hz), half = Math.max(1, (w * 0.3) / z);
      x.fillStyle = COL.road; x.fillRect(Math.round(vx - half), j, Math.round(half * 2), 1);
      x.fillStyle = COL.roadEdge; x.fillRect(Math.round(vx - half), j, 1, 1); x.fillRect(Math.round(vx + half) - 1, j, 1, 1);
    }
    // centre dashes drifting away toward the horizon
    for (let i = 0; i < 7; i++) {
      const z = 1 + ((i / 7 + travel * 0.35) % 1) * 12;
      const y0 = Math.round(yAt(z + 0.45)), y1 = Math.round(yAt(z));
      const dw = Math.max(1, Math.round(3 / z));
      x.fillStyle = COL.roadEdge; x.fillRect(Math.round(vx - dw / 2), y0, dw, Math.max(1, y1 - y0));
    }
    // roadside trees on both sides, receding (far ones first)
    const trees = [];
    for (let i = 0; i < 6; i++) for (const side of [-1, 1]) {
      const p = (i / 6 + travel * 0.3 + (side > 0 ? 0.08 : 0)) % 1;
      trees.push({ z: 0.9 + p * 10, side, t: roadTrees[(i + (side > 0 ? 1 : 0)) % roadTrees.length] });
    }
    trees.sort((a, b) => b.z - a.z);
    for (const { z, side, t } of trees) {
      const s = 0.75 / z, gx = vx + side * (w * 0.48) / z, gy = yAt(z);
      const tw = Math.max(1, Math.round(t.img.width * s)), th = Math.max(1, Math.round(t.img.height * s));
      x.drawImage(t.img, Math.round(gx - t.ox * s), Math.round(gy - t.oy * s), tw, th);
    }
    return rearC;
  }

  // walks the rows of the rear windscreen (a trapezoid with rounded corners), grown by g pixels
  const windscreenRows = (rw, g, r, fn) => {
    const h = rw.yb - rw.yt + 2 * g;
    for (let j = 0; j < h; j++) {
      const k = Math.min(1, Math.max(0, (j - g) / (rw.yb - rw.yt)));
      const ins = Math.max(ci(j, r + g), ci(h - 1 - j, r + g));
      const xl = Math.round(lerp(rw.xt0, rw.xb0, k)) - g + ins, xr = Math.round(lerp(rw.xt1, rw.xb1, k)) + g - ins;
      if (xr > xl) fn(rw.yt - g + j, xl, xr, j - g);
    }
  };

  // fill a region bounded by two horizontal lines, with linear left/right edges
  const rowQuad = (x, y0, y1, xl0, xl1, xr0, xr1, col) => {
    x.fillStyle = col;
    for (let j = y0; j < y1; j++) { const k = (j - y0) / Math.max(1, y1 - y0); const xl = Math.round(lerp(xl0, xl1, k)), xr = Math.round(lerp(xr0, xr1, k)); if (xr > xl) x.fillRect(xl, j, xr - xl, 1); }
  };
  const line = (x, ax, ay, bx, by, col, wdt = 1) => {
    x.fillStyle = col; const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= n; i++) x.fillRect(Math.round(lerp(ax, bx, i / n)), Math.round(lerp(ay, by, i / n)), 1, wdt);
  };

  function drawSideWall(x, s, l, side, bob) {
    const W = s.W, H = s.H;
    // wall spans from the screen edge (near) to the rear face (far)
    const xn = side < 0 ? 0 : W, xf = side < 0 ? l.rx0 : l.rx1;
    const at = (k) => Math.round(lerp(xn, xf, k));
    const span = (k0, k1, fn) => {
      const a = at(k0), b = at(k1);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      for (let i = lo; i < hi; i++) { const k = (i - xn) / (xf - xn); fn(i, k, Math.min(i - lo, hi - 1 - i), i - lo, hi - 1 - i); }
    };
    // door panel (whole wall first), with the roof rail above the windows
    span(0, 1, (i, k) => {
      const yr = Math.round(lerp(0, l.ry0, k)) + bob, yb = Math.round(lerp(H, l.ry1, k)) + bob, yt = l.winTop(k) + bob;
      x.fillStyle = COL.door; x.fillRect(i, yr, 1, yb - yr);
      x.fillStyle = COL.pillar; x.fillRect(i, yr, 1, Math.max(0, yt - yr));
      x.fillStyle = COL.headShade; x.fillRect(i, yr, 1, 2);
      // the window band starts as trim; windows are cut into it
      x.fillStyle = COL.pillar; x.fillRect(i, yt - 1, 1, l.belt(k) + bob - yt + 3);
    });
    // windows with rounded corners and the scenery streaming past (toward the back of the car)
    const sh = sideStrip.height;
    const drawWin = ([k0, k1], speed) => span(k0, k1, (i, k, dMin, dLo, dHi) => {
      // the screen edge isn't a window edge, so no rounding there
      const d = k0 === 0 ? (side < 0 ? dHi : dLo) : dMin;
      const rT = Math.round(lerp(14, 5, k)), rB = Math.round(lerp(5, 2, k));
      const yt = l.winTop(k) + bob + ci(d, rT), yb = l.belt(k) + bob - ci(d, rB);
      if (yb <= yt) return;
      const sx = (((i * side * -1) + travel * speed) % sideStrip.width + sideStrip.width) % sideStrip.width;
      x.drawImage(sideStrip, Math.floor(sx), 0, 1, sh, i, yt, 1, yb - yt);
      x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(i, yt, 1, Math.round((yb - yt) * 0.28));
      // rubber seal around the glass
      x.fillStyle = COL.rubber;
      if (d === 0) x.fillRect(i, yt - 1, 1, yb - yt + 2);
      else { x.fillRect(i, yt - 1, 1, 1); x.fillRect(i, yb, 1, 1); }
    });
    drawWin(l.frontWin, 220);
    drawWin(l.rearWin, 160);
    // the C pillar beside the rear windscreen, a touch darker
    span(l.rearWin[1], 1, (i, k) => { const yt = l.winTop(k) + bob, yb = l.belt(k) + bob; x.fillStyle = COL.pillarS; x.fillRect(i, yt - 1, 1, yb - yt + 2); });
    // door: rounded armrest, darker lower panel, a chrome handle on the front door, a speaker grille
    span(0, 1, (i, k) => {
      const yb = Math.round(lerp(H, l.ry1, k)) + bob, belt = l.belt(k) + bob;
      const arm = Math.round(lerp(H * 0.66, H * 0.4, k)) + bob, ah = Math.max(2, Math.round(lerp(6, 2, k)));
      x.fillStyle = light(COL.door, 0.2); x.fillRect(i, belt + 1, 1, 1);
      x.fillStyle = COL.armrest; x.fillRect(i, arm, 1, ah);
      x.fillStyle = light(COL.armrest, 0.2); x.fillRect(i, arm, 1, 1);
      x.fillStyle = COL.doorS; x.fillRect(i, arm + ah, 1, Math.max(0, yb - arm - ah));
    });
    span(0.3, 0.42, (i, k, d) => { const y = Math.round(lerp(H * 0.58, H * 0.36, k)) + bob; x.fillStyle = COL.handle; x.fillRect(i, y + (d === 0 ? 1 : 0), 1, d === 0 ? 1 : 3); });
    span(0.08, 0.3, (i, k, d) => {
      const y = Math.round(lerp(H * 0.78, H * 0.5, k)) + bob, h = Math.round(lerp(14, 6, k)), c = ci(d, Math.round(h / 2));
      x.fillStyle = shade(COL.doorS, 0.06); x.fillRect(i, y + c, 1, h - 2 * c);
      if ((i + y) % 2) { x.fillStyle = shade(COL.doorS, 0.16); for (let j = y + c + 1; j < y + h - c - 1; j += 2) x.fillRect(i, j, 1, 1); }
    });
  }

  const scene = new Scene2D(game, {
    id: 'train', worldW: 0, walkable: false, hazei: false, partner: false, time: 'morning',
    inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.22, tint: 'rgba(255,236,205,0.3)' },
    drawBack(x, s) {
      const W = s.W, H = s.H, l = L(W, H), rw = l.rw;
      const bob = s.bob || 0;
      if (!sideStrip || sideStrip.height !== Math.round(H * 0.5)) sideStrip = buildSideStrip(Math.round(H * 0.5));
      if (!skyC) { [skyC] = canvas(64, 32); ditherGradient(skyC.getContext('2d'), 64, 32, TIMES.morning.sky, 0, 8); }
      // headliner (ceiling): soft shading toward the sides so it reads curved, seams to the back, a dome light
      x.fillStyle = COL.headliner; x.fillRect(0, 0, W, H);
      for (const f of [0.2, 0.4, 0.6, 0.8]) line(x, Math.round(W * f), 0, Math.round(lerp(l.rx0, l.rx1, f)), l.ry0 + bob, COL.headSeam);
      for (const [a, b] of [[0, l.rx0], [W, l.rx1]]) {
        const dir = a === 0 ? 1 : -1;
        line(x, a + dir * 2, 0, b + dir * 2, l.ry0 + bob, COL.headSeam, 2);
        line(x, a + dir * 6, 0, b + dir * 3, l.ry0 + bob, COL.headSeam);
      }
      const dl = Math.round(W / 2);
      rrect(x, dl - 10, Math.round(H * 0.03) + bob, 20, 6, 3, COL.pillarS, 3); rrect(x, dl - 8, Math.round(H * 0.03) + 1 + bob, 16, 4, 2, '#fff6dc', 2);
      // the rear face of the cabin, rounded into the roof: C pillars around the rear windscreen, parcel shelf, rear bench
      rrect(x, l.rx0, l.ry0 + bob, l.rx1 - l.rx0, l.ry1 - l.ry0, 12, COL.pillar);
      rrect(x, l.rx0, l.ry0 + bob, l.rx1 - l.rx0, 2, 0, COL.headShade);
      windscreenRows(rw, 2, 6, (y, xl, xr) => { x.fillStyle = COL.rubber; x.fillRect(xl, y + bob, xr - xl, 1); });
      const view = drawRearView(rw.xb1 - rw.xb0, rw.yb - rw.yt);
      windscreenRows(rw, 0, 6, (y, xl, xr, j) => {
        x.drawImage(view, xl - rw.xb0, j, xr - xl, 1, xl, y + bob, xr - xl, 1);
        // glass sheen and thin defroster lines
        if (j < (rw.yb - rw.yt) * 0.3) { x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(xl, y + bob, xr - xl, 1); }
        if (j > 6 && j % 8 === 0) { x.fillStyle = 'rgba(150,110,90,.13)'; x.fillRect(xl + 8, y + bob, xr - xl - 16, 1); }
      });
      const shelfY = rw.yb + 2;
      rrect(x, l.rx0 + 3, shelfY + bob, l.rx1 - l.rx0 - 6, 5, 0, COL.shelf, 2); x.fillStyle = shade(COL.shelf, 0.15); x.fillRect(l.rx0 + 5, shelfY + 4 + bob, l.rx1 - l.rx0 - 10, 1);
      // teddy bear on the parcel shelf
      const tb = Math.round(W * 0.34), ty = shelfY + bob;
      rrect(x, tb, ty - 9, 11, 10, 4, '#c98a54', 2); rrect(x, tb - 1, ty - 12, 4, 4, 2, '#c98a54', 2); rrect(x, tb + 8, ty - 12, 4, 4, 2, '#c98a54', 2);
      x.fillStyle = '#3a2633'; x.fillRect(tb + 3, ty - 6, 1, 1); x.fillRect(tb + 7, ty - 6, 1, 1); rrect(x, tb + 3, ty - 4, 5, 3, 1, '#ecc090', 1);
      // rear bench: rounded back cushions and headrests
      const rs0 = shelfY + 5, bw = l.rx1 - l.rx0 - 6;
      rrect(x, l.rx0 + 3, rs0 + bob, bw, l.ry1 - rs0, 7, COL.rear);
      for (const f of [1 / 3, 2 / 3]) { const sx = Math.round(l.rx0 + 3 + bw * f); x.fillStyle = COL.rearSeam; x.fillRect(sx, rs0 + 3 + bob, 1, l.ry1 - rs0 - 3); }
      for (let i = l.rx0 + 10; i < l.rx1 - 8; i += 9) { x.fillStyle = shade(COL.rear, 0.04); x.fillRect(i, rs0 + 7 + bob, 1, l.ry1 - rs0 - 9); }
      x.fillStyle = light(COL.rear, 0.2); x.fillRect(l.rx0 + 9, rs0 + 1 + bob, bw - 12, 1);
      for (const f of [0.18, 0.5, 0.82]) {
        const hx = Math.round(lerp(l.rx0, l.rx1, f));
        x.fillStyle = '#c8c2b8'; x.fillRect(hx - 5, rs0 + bob, 1, 3); x.fillRect(hx + 4, rs0 + bob, 1, 3);
        rrect(x, hx - 11, rs0 - 9 + bob, 22, 10, 4, COL.rearHead, 2); x.fillStyle = light(COL.rearHead, 0.25); x.fillRect(hx - 7, rs0 - 8 + bob, 14, 1);
      }
      // a pink bag on the back seat
      const bg = Math.round(W * 0.64), by = rs0 + 8 + bob;
      x.fillStyle = '#c4587a'; x.fillRect(bg + 3, by - 5, 2, 5); x.fillRect(bg + 11, by - 5, 2, 5); x.fillRect(bg + 4, by - 6, 8, 1);
      rrect(x, bg, by, 16, 12, 3, '#f08fa8', 2); x.fillStyle = light('#f08fa8', 0.25); x.fillRect(bg + 3, by + 1, 10, 1);
      // carpeted floor running back to the rear footwell
      rowQuad(x, l.ry1 + bob, H, l.rx0, 0, l.rx1, W, COL.floor);
      x.fillStyle = shade(COL.floor, 0.12); x.fillRect(l.rx0, l.ry1 + bob, l.rx1 - l.rx0, 2);
      // both side walls with their door windows
      drawSideWall(x, s, l, -1, bob);
      drawSideWall(x, s, l, 1, bob);
      // front seats: rounded leather backs with side bolsters, pillowy headrests
      for (const cx of [l.seatL, l.seatR]) {
        const sw = l.seatW, top = Math.round(H * 0.42) + bob, x0 = cx - sw / 2;
        rrect(x, x0, top, sw, H - top, 11, COL.seatS);
        rrect(x, x0 + 6, top + 3, sw - 12, H - top - 3, 8, COL.seat);
        x.fillStyle = COL.seatL; x.fillRect(Math.round(x0 + 12), top + 3, Math.round(sw - 24), 1); x.fillRect(Math.round(x0 + 2), top + 6, 2, 1); x.fillRect(Math.round(x0 + sw - 4), top + 6, 2, 1);
        x.fillStyle = COL.stitch; for (let j = top + 10; j < H; j += 3) { x.fillRect(Math.round(x0 + 6), j, 1, 1); x.fillRect(Math.round(x0 + sw - 7), j, 1, 1); }
        const hw = Math.round(sw * 0.48), ht = Math.round(H * 0.1), hy = top - ht - 6;
        x.fillStyle = '#c8c2b8'; x.fillRect(cx - 7, hy + ht - 2, 2, 9); x.fillRect(cx + 5, hy + ht - 2, 2, 9);
        rrect(x, cx - hw / 2, hy, hw, ht, 6, COL.seatS, 5);
        rrect(x, cx - hw / 2 + 2, hy + 1, hw - 4, ht - 3, 5, COL.seat, 4);
        x.fillStyle = COL.seatL; x.fillRect(Math.round(cx - hw / 2 + 6), hy + 2, hw - 12, 1);
      }
      // centre console between the seats: padded armrest lid and a cup holder with a drink
      const cc0 = Math.round(W * 0.445), cc1 = Math.round(W * 0.555), ct = Math.round(H * 0.6) + bob;
      rrect(x, cc0, ct + 4, cc1 - cc0, H - ct, 3, COL.console);
      x.fillStyle = shade(COL.console, 0.15); x.fillRect(cc0 + 2, ct + 10, cc1 - cc0 - 4, 1);
      rrect(x, cc0 - 1, ct, cc1 - cc0 + 2, 8, 4, COL.seat, 3);
      x.fillStyle = COL.seatL; x.fillRect(cc0 + 4, ct + 1, cc1 - cc0 - 8, 1);
      const cup = Math.round(W / 2) - 5;
      rrect(x, cup, ct - 10, 10, 11, 1, '#f4ece0', 2); x.fillStyle = '#8a5a3a'; x.fillRect(cup, ct - 7, 10, 3);
      x.fillStyle = '#f08fa8'; x.fillRect(cup + 6, ct - 15, 1, 6);
    },
    drawFront(x, s) {
      const W = s.W, H = s.H, l = L(W, H), sc = l.sc;
      const bob = s.bob || 0;
      // the two friends, facing us; Hazei sways a little with the music
      const sway = Math.round(Math.sin(s.t * 2.6) * beat * 2);
      const people = [
        { look: LOOKS.hazei(), cx: l.seatL, mood: he.t > 0 ? 'happy' : (Math.sin(s.t * 0.7) > 0.96 ? 'blink' : (beat > 0.55 ? 'happy' : 'normal')), dx: sway, emote: he },
        { look: LOOKS.partner(), cx: l.seatR, mood: pe.t > 0 ? 'happy' : (Math.sin(s.t * 0.6 + 1) > 0.96 ? 'blink' : 'normal'), dx: 0, emote: pe },
      ];
      for (const p of people) {
        const spr = charSprite(p.look, { pose: 'idle', mood: p.mood, frame: 0 });
        const top = Math.round(H * 0.31) + bob;
        const left = p.cx - 12 * sc + p.dx;
        x.drawImage(spr, left, top, spr.width * sc, spr.height * sc);
        // seatbelt across the chest
        x.fillStyle = '#6a5e66';
        const by = top + 16 * sc, len = 8 * sc, bw = Math.max(2, sc - 1);
        for (let k = 0; k < len; k++) x.fillRect(left + (p.cx === l.seatL ? 7 * sc + k : 17 * sc - k), by + Math.round(k * 0.9), bw, bw);
        if (p.emote.t > 0) { const e = emoteSprite(p.emote.k); x.drawImage(e, left + 15 * sc, top - 2 * sc, e.width * 2, e.height * 2); }
      }
      // steering wheel in front of Mino, drawn first so the dashboard hides its lower half:
      // a round leather rim, two side spokes and the hub with a little pink badge
      {
        // the wheel tilts back toward Mino, so from here it reads as a wide ellipse below his chin
        const d = l.dash, wx = l.seatR, wy = d - 2, ry = Math.round(H * 0.095), rx = Math.round(H * 0.16), t = Math.max(4, Math.round(H * 0.022));
        for (let j = -ry - 1; j <= 3; j++) for (let i = -rx - 1; i <= rx + 1; i++) {
          const e = (i / rx) ** 2 + (j / ry) ** 2, ei = (i / (rx - t)) ** 2 + (j / (ry - t)) ** 2;
          if (e > 1 || ei < 1) continue;
          // light on the upper inner edge, shade along the outer edge
          const ein = (i / (rx - t + 1.5)) ** 2 + (j / (ry - t + 1.5)) ** 2;
          x.fillStyle = e > 0.9 ? shade(COL.wheel, 0.18) : (ein < 1 && j < -ry * 0.3) ? COL.wheelL : COL.wheel;
          x.fillRect(wx + i, wy + j, 1, 1);
        }
        // side spokes from the hub to the rim
        for (const side of [-1, 1]) {
          const a = wx + side * 9, b = wx + side * (rx - t + 1);
          x.fillStyle = COL.wheel; x.fillRect(Math.min(a, b), wy - 3, Math.abs(b - a), 5);
          x.fillStyle = COL.wheelL; x.fillRect(Math.min(a, b), wy - 3, Math.abs(b - a), 1);
        }
        rrect(x, wx - 11, wy - 8, 22, 11, 4, shade(COL.wheel, 0.1), 2);
        rrect(x, wx - 9, wy - 7, 18, 8, 3, COL.wheelL, 2);
        rrect(x, wx - 3, wy - 5, 6, 3, 1, '#f08fa8', 1);
      }
      // dashboard: a gently curved padded top, wood trim, light lower face
      const d = l.dash;
      for (let i = 0; i < W; i++) {
        const u = (i - W / 2) / (W / 2), y = d + Math.round(6 * u * u);
        x.fillStyle = COL.dashFace; x.fillRect(i, y, 1, H - y);
        x.fillStyle = COL.dashTop; x.fillRect(i, y, 1, 7); x.fillStyle = COL.dashTopL; x.fillRect(i, y, 1, 2);
        x.fillStyle = COL.wood; x.fillRect(i, y + 9, 1, 4); x.fillStyle = COL.woodL; x.fillRect(i, y + 9, 1, 1);
        if (i % 17 < 6) { x.fillStyle = shade(COL.wood, 0.12); x.fillRect(i, y + 11, 1, 1); }
      }
      // glovebox on Hazei's side, with rounded corners
      const gb0 = Math.round(W * 0.1), gb1 = Math.round(W * 0.36), gy = d + 18;
      rrect(x, gb0, gy, gb1 - gb0, H - gy + 2, 5, shade(COL.dashFace, 0.12));
      rrect(x, gb0 + 1, gy + 1, gb1 - gb0 - 2, H - gy, 4, COL.dashFace);
      rrect(x, Math.round((gb0 + gb1) / 2) - 7, gy + 5, 14, 3, 1, COL.vent, 1);
      // centre stack: two vents, the stereo screen with an equaliser
      const cw = Math.round(W * 0.2), cx0 = Math.round(W / 2 - cw / 2);
      rrect(x, cx0 - 4, d + 3, cw + 8, H - d, 6, COL.console);
      x.fillStyle = light(COL.console, 0.15); x.fillRect(cx0 + 2, d + 3, cw - 4, 1);
      for (const vx of [cx0 + 1, cx0 + cw - 17]) { rrect(x, vx, d + 7, 16, 8, 3, COL.vent, 3); x.fillStyle = COL.ventSlat; for (let k = 0; k < 3; k++) x.fillRect(vx + 2, d + 9 + k * 2, 12, 1); }
      const sx0 = cx0 + 2, sy0 = d + 18, sw2 = cw - 4, sh2 = 13;
      rrect(x, sx0 - 1, sy0 - 1, sw2 + 2, sh2 + 2, 3, shade(COL.console, 0.25), 3);
      rrect(x, sx0, sy0, sw2, sh2, 2, COL.screen, 2);
      const bars = 12, bwid = Math.floor((sw2 - 6) / bars);
      for (let i = 0; i < bars; i++) {
        const v = (freq[2 + i * 4] || 0) / 255; const hgt = Math.max(1, Math.round(v * (sh2 - 3)));
        x.fillStyle = `hsl(${320 - i * 10},80%,70%)`; x.fillRect(sx0 + 3 + i * bwid, sy0 + sh2 - 2 - hgt, Math.max(1, bwid - 1), hgt);
      }
      // rear-view mirror on the windscreen with a flower air freshener
      const mx = Math.round(W / 2);
      x.fillStyle = '#cfc8be'; x.fillRect(mx - 1, 0, 2, 2); rrect(x, mx - 22, 1, 44, 10, 3, '#cfc8be', 4);
      rrect(x, mx - 20, 2, 40, 7, 2, '#a8c4d8', 3); x.fillStyle = '#d8e8f2'; x.fillRect(mx - 17, 3, 10, 1);
      const swing = Math.sin(s.t * 2.2 + (s.bump || 0)) * 0.35, ax0 = mx - 30;
      const fx = ax0 + Math.round(Math.sin(swing) * 9), fy = 4 + Math.round(Math.cos(swing) * 9);
      x.strokeStyle = '#b8a890'; x.lineWidth = 1; x.beginPath(); x.moveTo(mx - 22, 5); x.lineTo(ax0, 4); x.lineTo(fx, fy); x.stroke();
      x.fillStyle = '#f08fa8'; for (const [ax, ay] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) rrect(x, fx + ax - 2, fy + 4 + ay - 2, 4, 4, 1, '#f08fa8', 1);
      x.fillStyle = '#ffe066'; x.fillRect(fx - 1, fy + 3, 3, 3);
      // dappled sunlight sweeping through the car
      x.save(); x.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const px = ((travel * 55 + k * 140) % (W + 160)) - 80;
        x.globalAlpha = 0.05 + 0.03 * Math.sin(s.t * 1.7 + k);
        x.fillStyle = '#fff2c8'; x.beginPath(); x.moveTo(px, 0); x.lineTo(px + 40, 0); x.lineTo(px - 20, H); x.lineTo(px - 60, H); x.closePath(); x.fill();
      }
      x.restore();
    },
  });
  scene.cfg.cleanup = () => { audio.stopRecord(1.5); };

  let arriveResolve; const arrived = new Promise((r) => { arriveResolve = r; });
  const say = (who, text, ms = 2800) => {
    const l = L(scene.W, scene.H);
    const px = who === 'pt' ? l.seatR : l.seatL;
    return ui.bubble(text, () => (scene.dead ? null : scene.view.toScreen(px, scene.H * 0.28)), ms);
  };
  const arrive = () => {
    if (rideEnded) return; rideEnded = true;
    say('pt', C.arrive, 4000);
    ui.actions([{ label: C.arriveButton + ' →', cls: '', onClick: () => arriveResolve() }]);
  };

  scene.cfg.update = (s, dt) => {
    travel += dt;
    // gentle road bumps
    s.bumpT = (s.bumpT ?? 2) - dt;
    if (s.bumpT < 0) { s.bumpT = 1.5 + Math.random() * 3; s.bumpV = 1.6; s.bump = (s.bump || 0) + 1; }
    s.bumpV = Math.max(0, (s.bumpV || 0) - dt * 6);
    s.bob = Math.round(Math.sin(s.t * 14) * s.bumpV);
    // music energy for the stereo display and Hazei swaying along
    const rec = audio.record;
    if (rec?.analyser) { rec.analyser.getByteFrequencyData(freq); let sum = 0; for (let i = 1; i < 10; i++) sum += freq[i]; beat += (sum / (9 * 255) - beat) * Math.min(1, dt * 8); }
    else { for (let i = 0; i < freq.length; i++) freq[i] = Math.max(0, freq[i] - 4); beat *= 0.95; }
    if (pe.t > 0) pe.t -= dt;
    if (he.t > 0) he.t -= dt;
    emoteT -= dt;
    if (emoteT < 0) { emoteT = 6 + Math.random() * 6; if (Math.random() < 0.5) { pe.k = ['note', 'laugh', 'sparkle'][Math.floor(Math.random() * 3)]; pe.t = 1.8; } else { he.k = ['note', 'sparkle', 'heart'][Math.floor(Math.random() * 3)]; he.t = 1.8; } }
    // the button only shows once the song has played a while
    const heard = audio.record?.el ? audio.record.el.currentTime : travel;
    if (!s.earlyBtn && heard >= (C.arriveAfter ?? 50)) { s.earlyBtn = true; if (!rideEnded) ui.actions([{ label: C.arriveButton + ' →', cls: 'soft', onClick: () => arriveResolve() }]); }
    if (travel >= totalDur) arrive();
  };

  audio.scene(null, [['rumble', 0.35], ['wind', 0.2]]);
  const done = scene.start();
  await game.enter();
  // the car stereo starts the song; the ride ends with it
  const song = C.carSong;
  const playing = song?.file && await audio.playRecord(song.file, { loop: false, gain: 0.16, onEnd: () => arrive() });
  if (playing) { totalDur = Infinity; ui.note(`♪ ${C.nowPlaying}: ${song.title}`, 4000); }
  else audio.playMusic('trainUp', 1.5);
  await wait(2400);
  await ui.dialog(C.intro);
  if (game.debug && new URLSearchParams(location.search).has('fast')) totalDur = 20;
  await arrived;
  await game.leave(scene);
  await done;
}

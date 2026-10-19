// Chapter 3: the car ride. The camera sits on the dashboard looking back into
// the cabin: Hazei (passenger, screen left) and Mino (driving, screen right) in
// the front seats. The cabin is drawn in one-point perspective: the headliner
// and both doors run back toward the rear of the car, each door has its window
// (front door near and big, rear door small), and the rear windscreen sits in
// the middle at the back. (File keeps its old name so saves stay valid.)
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
  headliner: '#efe6da', headSeam: '#e2d6c6', pillar: '#e8ddcf', pillarS: '#d6c8b6',
  door: '#d8c6b0', doorS: '#c6b29a', armrest: '#b89c80', handle: '#d9d2c8',
  rubber: '#8a7a74', shelf: '#b9a38c',
  rear: '#cdb9a2', rearSeam: '#bba68e', rearHead: '#c3ad95',
  seat: '#dcc4a6', seatS: '#c7ab8b', seatL: '#ead8be', stitch: '#b8956f',
  dashTop: '#cbb59b', dashTopL: '#dccab2', dashFace: '#bca68c', wood: '#a8744e', woodL: '#c58e62',
  console: '#a69482', screen: '#2c3c56', vent: '#dad5cc', ventSlat: '#a39d94',
  wheel: '#5e4a42', wheelL: '#7c665a',
};

export default async function car(game) {
  let travel = 0, totalDur = 60, rideEnded = false;
  let video = null, credit = null;
  let sideStrip = null, skyC = null;
  const freq = new Uint8Array(128);
  let beat = 0, emoteT = 0;
  const pe = { k: 'note', t: 0 }; // Mino's emote
  const he = { k: 'heart', t: 0 }; // Hazei's emote

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
    x.drawImage(ridgeStrip(w, Math.round(h * 0.45), { seed: 12, base: '#9fc0a8', peak: 0.6, freq: 0.03, trees: 18, treeCol: '#86ac90' }), 0, Math.round(h * 0.3));
    const r = rand(5);
    for (let i = 0; i < 14; i++) { const t = treeSprite(r() < 0.4 ? 'pine' : 'round', 0.7 + r() * 0.5, 60 + i); x.drawImage(t.img, Math.round(i * 31 + r() * 12 - t.ox), h - 8 - t.oy); }
    x.fillStyle = '#86bf6a'; x.fillRect(0, h - 10, w, 10); x.fillStyle = '#9fd07a'; x.fillRect(0, h - 10, w, 1);
    return c;
  }

  // fill a region bounded by two vertical lines, with linear top/bottom edges
  const colQuad = (x, x0, x1, yt0, yt1, yb0, yb1, col) => {
    x.fillStyle = col;
    for (let i = x0; i < x1; i++) { const k = (i - x0) / Math.max(1, x1 - x0); const yt = Math.round(lerp(yt0, yt1, k)), yb = Math.round(lerp(yb0, yb1, k)); if (yb > yt) x.fillRect(i, yt, 1, yb - yt); }
  };
  // fill a region bounded by two horizontal lines, with linear left/right edges
  const rowQuad = (x, y0, y1, xl0, xl1, xr0, xr1, col) => {
    x.fillStyle = col;
    for (let j = y0; j < y1; j++) { const k = (j - y0) / Math.max(1, y1 - y0); const xl = Math.round(lerp(xl0, xl1, k)), xr = Math.round(lerp(xr0, xr1, k)); if (xr > xl) x.fillRect(xl, j, xr - xl, 1); }
  };
  const line = (x, ax, ay, bx, by, col) => {
    x.fillStyle = col; const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= n; i++) x.fillRect(Math.round(lerp(ax, bx, i / n)), Math.round(lerp(ay, by, i / n)), 1, 1);
  };

  function drawSideWall(x, s, l, side, bob) {
    const W = s.W, H = s.H;
    // wall spans from the screen edge (near) to the rear face (far)
    const xn = side < 0 ? 0 : W, xf = side < 0 ? l.rx0 : l.rx1;
    const at = (k) => Math.round(lerp(xn, xf, k));
    const span = (k0, k1, fn) => {
      const a = at(k0), b = at(k1);
      const lo = Math.min(a, b), hi = Math.max(a, b);
      for (let i = lo; i < hi; i++) { const k = (i - xn) / (xf - xn); fn(i, k); }
    };
    // door panel (whole wall first)
    span(0, 1, (i, k) => { const yt = Math.round(lerp(0, l.ry0, k)) + bob, yb = Math.round(lerp(H, l.ry1, k)) + bob; x.fillStyle = COL.door; x.fillRect(i, yt, 1, yb - yt); });
    // windows with the scenery streaming past (toward the back of the car)
    const sh = sideStrip.height;
    const drawWin = ([k0, k1], speed) => span(k0, k1, (i, k) => {
      const yt = l.winTop(k) + bob, yb = l.belt(k) + bob; if (yb <= yt) return;
      const sx = (((i * side * -1) + travel * speed) % sideStrip.width + sideStrip.width) % sideStrip.width;
      x.drawImage(sideStrip, Math.floor(sx), 0, 1, sh, i, yt, 1, yb - yt);
      // soft glass sheen near the top
      x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(i, yt, 1, Math.round((yb - yt) * 0.28));
    });
    drawWin(l.frontWin, 220);
    drawWin(l.rearWin, 160);
    // window rubber seals along top and beltline, B pillar, C pillar
    span(0, 1, (i, k) => { const yt = l.winTop(k) + bob, yb = l.belt(k) + bob; x.fillStyle = COL.rubber; x.fillRect(i, yt - 1, 1, 1); x.fillRect(i, yb, 1, 2); x.fillStyle = COL.pillar; x.fillRect(i, Math.round(lerp(0, l.ry0, k)) + bob, 1, Math.max(0, yt - 1 - Math.round(lerp(0, l.ry0, k)) - bob)); });
    span(l.bPillar[0], l.bPillar[1], (i, k) => { const yt = l.winTop(k) + bob, yb = l.belt(k) + bob; x.fillStyle = COL.pillar; x.fillRect(i, yt - 1, 1, yb - yt + 2); });
    span(l.rearWin[1], 1, (i, k) => { const yt = l.winTop(k) + bob, yb = l.belt(k) + bob; x.fillStyle = COL.pillarS; x.fillRect(i, yt - 1, 1, yb - yt + 2); });
    // door: armrest line, darker lower panel, a chrome handle on the front door, a speaker grille
    span(0, 1, (i, k) => {
      const yb = Math.round(lerp(H, l.ry1, k)) + bob, belt = l.belt(k) + bob;
      const arm = Math.round(lerp(H * 0.66, H * 0.4, k)) + bob;
      x.fillStyle = COL.armrest; x.fillRect(i, arm, 1, Math.max(2, Math.round(lerp(5, 2, k))));
      x.fillStyle = COL.doorS; x.fillRect(i, arm + Math.round(lerp(5, 2, k)), 1, Math.max(0, yb - arm));
      x.fillStyle = light(COL.door, 0.2); x.fillRect(i, belt + 2, 1, 1);
    });
    span(0.3, 0.42, (i, k) => { const y = Math.round(lerp(H * 0.58, H * 0.36, k)) + bob; x.fillStyle = COL.handle; x.fillRect(i, y, 1, 3); });
    span(0.08, 0.3, (i, k) => { const y = Math.round(lerp(H * 0.8, H * 0.5, k)) + bob; if ((i + y) % 2) { x.fillStyle = shade(COL.doorS, 0.15); x.fillRect(i, y, 1, Math.round(lerp(10, 5, k))); } });
  }

  const scene = new Scene2D(game, {
    id: 'train', worldW: 0, walkable: false, hazei: false, partner: false, time: 'morning',
    inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.22, tint: 'rgba(255,236,205,0.3)' },
    drawBack(x, s) {
      const W = s.W, H = s.H, l = L(W, H), rw = l.rw;
      const bob = s.bob || 0;
      s.rw = rw;
      if (!sideStrip || sideStrip.height !== Math.round(H * 0.5)) sideStrip = buildSideStrip(Math.round(H * 0.5));
      if (!skyC) { [skyC] = canvas(64, 32); ditherGradient(skyC.getContext('2d'), 64, 32, TIMES.morning.sky, 0, 8); }
      // headliner (ceiling) with seams running to the back and a dome light
      x.fillStyle = COL.headliner; x.fillRect(0, 0, W, H);
      for (const f of [0.2, 0.4, 0.6, 0.8]) line(x, Math.round(W * f), 0, Math.round(lerp(l.rx0, l.rx1, f)), l.ry0 + bob, COL.headSeam);
      const dl = Math.round(W / 2);
      x.fillStyle = COL.pillarS; x.fillRect(dl - 9, Math.round(H * 0.035) + bob, 18, 5); x.fillStyle = '#fff6dc'; x.fillRect(dl - 7, Math.round(H * 0.035) + 1 + bob, 14, 3);
      // the rear face of the cabin: C pillars around the rear windscreen, parcel shelf, rear bench
      x.fillStyle = COL.pillar; x.fillRect(l.rx0, l.ry0 + bob, l.rx1 - l.rx0, l.ry1 - l.ry0);
      rowQuad(x, rw.yt - 2 + bob, rw.yb + 2 + bob, rw.xt0 - 2, rw.xb0 - 2, rw.xt1 + 2, rw.xb1 + 2, COL.rubber);
      if (video) rowQuad(x, rw.yt + bob, rw.yb + bob, rw.xt0, rw.xb0, rw.xt1, rw.xb1, '#a8cce6');
      else { x.save(); x.beginPath(); x.moveTo(rw.xt0, rw.yt + bob); x.lineTo(rw.xt1, rw.yt + bob); x.lineTo(rw.xb1, rw.yb + bob); x.lineTo(rw.xb0, rw.yb + bob); x.closePath(); x.clip(); drawRoad(x, rw, bob); x.restore(); }
      // little defroster lines on the glass
      x.fillStyle = 'rgba(160,120,100,.35)'; for (let j = rw.yt + 6; j < rw.yb - 2; j += 5) { const k = (j - rw.yt) / (rw.yb - rw.yt); x.fillRect(Math.round(lerp(rw.xt0, rw.xb0, k)) + 6, j + bob, Math.round(lerp(rw.xt1 - rw.xt0, rw.xb1 - rw.xb0, k)) - 12, 1); }
      const shelfY = rw.yb + 2;
      x.fillStyle = COL.shelf; x.fillRect(l.rx0, shelfY + bob, l.rx1 - l.rx0, 5); x.fillStyle = shade(COL.shelf, 0.15); x.fillRect(l.rx0, shelfY + 4 + bob, l.rx1 - l.rx0, 1);
      // teddy bear and a bag on the parcel shelf / back seat
      const tb = Math.round(W * 0.34);
      x.fillStyle = '#c98a54'; x.fillRect(tb, shelfY - 8 + bob, 10, 10); x.fillRect(tb, shelfY - 11 + bob, 3, 3); x.fillRect(tb + 7, shelfY - 11 + bob, 3, 3);
      x.fillStyle = '#3a2633'; x.fillRect(tb + 3, shelfY - 5 + bob, 1, 1); x.fillRect(tb + 6, shelfY - 5 + bob, 1, 1); x.fillStyle = '#ecc090'; x.fillRect(tb + 3, shelfY - 3 + bob, 4, 2);
      const rs0 = shelfY + 5;
      x.fillStyle = COL.rear; x.fillRect(l.rx0 + 2, rs0 + bob, l.rx1 - l.rx0 - 4, l.ry1 - rs0);
      for (let i = l.rx0 + 8; i < l.rx1 - 6; i += 12) { x.fillStyle = COL.rearSeam; x.fillRect(i, rs0 + 4 + bob, 1, l.ry1 - rs0 - 4); }
      x.fillStyle = light(COL.rear, 0.2); x.fillRect(l.rx0 + 2, rs0 + bob, l.rx1 - l.rx0 - 4, 2);
      for (const f of [0.18, 0.5, 0.82]) { const hx = Math.round(lerp(l.rx0, l.rx1, f)); x.fillStyle = COL.rearHead; x.fillRect(hx - 11, rs0 - 7 + bob, 22, 10); x.fillStyle = light(COL.rearHead, 0.25); x.fillRect(hx - 10, rs0 - 7 + bob, 20, 2); }
      const bg = Math.round(W * 0.64);
      x.fillStyle = '#f08fa8'; x.fillRect(bg, rs0 + 8 + bob, 16, 12); x.fillStyle = '#c4587a'; x.fillRect(bg + 3, rs0 + 3 + bob, 10, 2); x.fillRect(bg + 3, rs0 + 3 + bob, 2, 5); x.fillRect(bg + 11, rs0 + 3 + bob, 2, 5);
      // carpeted floor running back to the rear footwell
      rowQuad(x, l.ry1 + bob, H, l.rx0, 0, l.rx1, W, '#b7a28c');
      x.fillStyle = shade('#b7a28c', 0.12); x.fillRect(l.rx0, l.ry1 + bob, l.rx1 - l.rx0, 2);
      // both side walls with their door windows
      drawSideWall(x, s, l, -1, bob);
      drawSideWall(x, s, l, 1, bob);
      // front seats (leather) with headrests
      for (const cx of [l.seatL, l.seatR]) {
        const sw = l.seatW, top = Math.round(H * 0.43) + bob;
        rowQuad(x, top - 4, top, cx - sw / 2 + 6, cx - sw / 2, cx + sw / 2 - 6, cx + sw / 2, COL.seat);
        x.fillStyle = COL.seatS; x.fillRect(cx - sw / 2, top, sw, H - top);
        x.fillStyle = COL.seat; x.fillRect(cx - sw / 2 + 6, top, sw - 12, H - top);
        x.fillStyle = COL.seatL; x.fillRect(cx - sw / 2 + 6, top, sw - 12, 2);
        x.fillStyle = COL.stitch; for (let j = top + 5; j < H; j += 3) { x.fillRect(cx - sw / 2 + 6, j, 1, 1); x.fillRect(cx + sw / 2 - 7, j, 1, 1); }
        const hw = Math.round(sw * 0.48), ht = Math.round(H * 0.1), hy = top - ht - 7;
        x.fillStyle = COL.seatS; x.fillRect(cx - hw / 2, hy, hw, ht); x.fillStyle = COL.seat; x.fillRect(cx - hw / 2 + 2, hy + 1, hw - 4, ht - 3); x.fillStyle = COL.seatL; x.fillRect(cx - hw / 2 + 3, hy + 1, hw - 6, 2);
        x.fillStyle = '#c8c2b8'; x.fillRect(cx - 7, hy + ht, 2, 7); x.fillRect(cx + 5, hy + ht, 2, 7);
      }
      // centre console between the seats: padded armrest lid and a cup holder with a drink
      const cc0 = Math.round(W * 0.445), cc1 = Math.round(W * 0.555), ct = Math.round(H * 0.6) + bob;
      rowQuad(x, ct, ct + 6, cc0 + 4, cc0, cc1 - 4, cc1, COL.seat);
      x.fillStyle = COL.seatL; x.fillRect(cc0 + 4, ct, cc1 - cc0 - 8, 1);
      x.fillStyle = COL.console; x.fillRect(cc0, ct + 6, cc1 - cc0, H - ct);
      x.fillStyle = shade(COL.console, 0.15); x.fillRect(cc0, ct + 6, cc1 - cc0, 2);
      const cup = Math.round(W / 2) - 5;
      x.fillStyle = '#f4ece0'; x.fillRect(cup, ct - 10, 10, 11); x.fillStyle = '#8a5a3a'; x.fillRect(cup, ct - 7, 10, 3);
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
      // dashboard: padded top, wood trim, light lower face
      const d = l.dash;
      x.fillStyle = COL.dashFace; x.fillRect(0, d, W, H - d);
      x.fillStyle = COL.dashTop; x.fillRect(0, d, W, 7); x.fillStyle = COL.dashTopL; x.fillRect(0, d, W, 2);
      x.fillStyle = COL.wood; x.fillRect(0, d + 9, W, 4); x.fillStyle = COL.woodL; x.fillRect(0, d + 9, W, 1);
      for (let i = 3; i < W; i += 17) { x.fillStyle = shade(COL.wood, 0.12); x.fillRect(i, d + 11, 6, 1); }
      // glovebox on Hazei's side
      const gb0 = Math.round(W * 0.1), gb1 = Math.round(W * 0.36);
      x.fillStyle = shade(COL.dashFace, 0.12); x.fillRect(gb0, d + 17, gb1 - gb0, 1); x.fillRect(gb0, d + 17, 1, H - d); x.fillRect(gb1, d + 17, 1, H - d);
      x.fillStyle = COL.vent; x.fillRect(Math.round((gb0 + gb1) / 2) - 6, d + 22, 12, 2);
      // centre stack: two vents, the stereo screen with an equaliser
      const cw = Math.round(W * 0.2), cx0 = Math.round(W / 2 - cw / 2);
      x.fillStyle = COL.console; x.fillRect(cx0 - 4, d + 4, cw + 8, H - d);
      x.fillStyle = light(COL.console, 0.15); x.fillRect(cx0 - 4, d + 4, cw + 8, 1);
      for (const vx of [cx0, cx0 + cw - 16]) { x.fillStyle = COL.vent; x.fillRect(vx, d + 7, 16, 8); x.fillStyle = COL.ventSlat; for (let k = 0; k < 3; k++) x.fillRect(vx + 1, d + 9 + k * 2, 14, 1); }
      const sx0 = cx0 + 2, sy0 = d + 17, sw2 = cw - 4, sh2 = 13;
      x.fillStyle = shade(COL.console, 0.25); x.fillRect(sx0 - 1, sy0 - 1, sw2 + 2, sh2 + 2);
      x.fillStyle = COL.screen; x.fillRect(sx0, sy0, sw2, sh2);
      const bars = 12, bwid = Math.floor((sw2 - 6) / bars);
      for (let i = 0; i < bars; i++) {
        const v = (freq[2 + i * 4] || 0) / 255; const hgt = Math.max(1, Math.round(v * (sh2 - 3)));
        x.fillStyle = `hsl(${320 - i * 10},80%,70%)`; x.fillRect(sx0 + 3 + i * bwid, sy0 + sh2 - 2 - hgt, Math.max(1, bwid - 1), hgt);
      }
      // steering wheel in front of Mino (warm brown leather), with his hands on it
      const wx = l.seatR, wy = d + Math.round(H * 0.12), rx = Math.round(W * 0.12), ry = Math.round(H * 0.13);
      x.strokeStyle = COL.wheel; x.lineWidth = Math.max(4, sc + 2);
      x.beginPath(); x.ellipse(wx, wy, rx, ry, 0, Math.PI, Math.PI * 2); x.stroke();
      x.strokeStyle = COL.wheelL; x.lineWidth = 1; x.beginPath(); x.ellipse(wx, wy - 2, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
      x.fillStyle = COL.wheel; x.fillRect(wx - 3, wy - ry, 6, ry); x.fillRect(Math.round(wx - rx * 0.6), wy - 3, Math.round(rx * 1.2), 5);
      x.fillStyle = COL.wheelL; x.fillRect(wx - 6, wy - 8, 12, 7); x.fillStyle = '#f08fa8'; x.fillRect(wx - 2, wy - 6, 4, 3);
      const skin = content.partnerLook.skin, sleeve = content.partnerLook.top;
      for (const side of [-1, 1]) {
        const hx = Math.round(wx + side * rx * 0.86), hy = Math.round(wy - ry * 0.55);
        x.fillStyle = sleeve; x.fillRect(hx - 3 - side * 2, hy + 3, 7, 10);
        x.fillStyle = skin; x.fillRect(hx - 3, hy - 3, 7, 7); x.fillStyle = shade(skin, 0.2); x.fillRect(hx - 3, hy + 2, 7, 1);
      }
      // rear-view mirror on the windscreen with a flower air freshener
      const mx = Math.round(W / 2);
      x.fillStyle = '#cfc8be'; x.fillRect(mx - 1, 0, 2, 2); x.fillRect(mx - 22, 1, 44, 9);
      x.fillStyle = '#a8c4d8'; x.fillRect(mx - 20, 2, 40, 6); x.fillStyle = '#d8e8f2'; x.fillRect(mx - 18, 2, 10, 2);
      const swing = Math.sin(s.t * 2.2 + (s.bump || 0)) * 0.35, ax0 = mx - 30;
      const fx = ax0 + Math.round(Math.sin(swing) * 9), fy = 4 + Math.round(Math.cos(swing) * 9);
      x.strokeStyle = '#b8a890'; x.lineWidth = 1; x.beginPath(); x.moveTo(mx - 22, 5); x.lineTo(ax0, 4); x.lineTo(fx, fy); x.stroke();
      x.fillStyle = '#f08fa8'; for (const [ax, ay] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) x.fillRect(fx + ax - 2, fy + 4 + ay - 2, 4, 4);
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

  // pixel fallback for the rear windscreen: the road running away behind us
  function drawRoad(x, rw, bob) {
    const x0 = rw.xb0, ww = rw.xb1 - rw.xb0, y0 = rw.yt + bob, hh = rw.yb - rw.yt;
    x.drawImage(skyC, x0, y0, ww, hh);
    const hz = y0 + Math.round(hh * 0.45), vx = x0 + ww / 2, yb = y0 + hh;
    x.fillStyle = '#7fb466'; x.fillRect(x0, hz, ww, yb - hz);
    x.fillStyle = '#8a8890';
    for (let j = hz; j < yb; j++) { const k = (j - hz) / (yb - hz); const half = 2 + k * ww * 0.35; x.fillRect(vx - half, j, half * 2, 1); }
    for (let i = 0; i < 6; i++) { const k = ((i / 6) + travel * 0.6) % 1; const y = hz + k * k * (yb - hz); x.fillStyle = '#f4efe6'; x.fillRect(vx - 1 - k * 2, Math.round(y), 2 + k * 4, Math.max(1, Math.round(k * 4))); }
  }

  // real footage in the rear windscreen, clipped to its sloped shape
  const placeVideo = (rw) => {
    const bob = scene.bob || 0;
    const a = scene.view.toScreen(rw.xb0, rw.yt + bob), b = scene.view.toScreen(rw.xb1, rw.yb + bob);
    const inset = ((rw.xt0 - rw.xb0) / (rw.xb1 - rw.xb0)) * 100;
    Object.assign(video.style, { left: a.x + 'px', top: a.y + 'px', width: (b.x - a.x) + 'px', height: (b.y - a.y) + 'px', clipPath: `polygon(${inset}% 0, ${100 - inset}% 0, 100% 100%, 0 100%)` });
    if (credit) Object.assign(credit.style, { left: a.x + 10 + 'px', top: b.y - 14 + 'px' });
  };
  try {
    const r = await fetch(C.video, { method: 'HEAD' });
    if (r.ok && (r.headers.get('content-type') || '').startsWith('video')) {
      video = document.createElement('video');
      Object.assign(video, { src: C.video, muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto' });
      video.setAttribute('playsinline', '');
      video.style.cssText = 'position:absolute;object-fit:cover;pointer-events:none;z-index:2;filter:saturate(1.05) brightness(1.05)';
      game.stage.appendChild(video);
      video.play().catch(() => {});
      if (C.videoCredit) { credit = document.createElement('div'); credit.textContent = C.videoCredit; credit.style.cssText = 'position:absolute;z-index:3;font:9px/1 Nunito,sans-serif;color:#fff;opacity:.6;text-shadow:0 1px 2px #000;pointer-events:none'; game.stage.appendChild(credit); }
    }
  } catch { video = null; }
  scene.cfg.cleanup = () => { video?.remove(); credit?.remove(); audio.stopRecord(1.5); };

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
    if (video && s.rw) placeVideo(s.rw);
    // music energy for the stereo display and Hazei swaying along
    const rec = audio.record;
    if (rec?.analyser) { rec.analyser.getByteFrequencyData(freq); let sum = 0; for (let i = 1; i < 10; i++) sum += freq[i]; beat += (sum / (9 * 255) - beat) * Math.min(1, dt * 8); }
    else { for (let i = 0; i < freq.length; i++) freq[i] = Math.max(0, freq[i] - 4); beat *= 0.95; }
    if (pe.t > 0) pe.t -= dt;
    if (he.t > 0) he.t -= dt;
    emoteT -= dt;
    if (emoteT < 0) { emoteT = 6 + Math.random() * 6; if (Math.random() < 0.5) { pe.k = ['note', 'laugh', 'sparkle'][Math.floor(Math.random() * 3)]; pe.t = 1.8; } else { he.k = ['note', 'sparkle', 'heart'][Math.floor(Math.random() * 3)]; he.t = 1.8; } }
    if (!s.earlyBtn && travel > 15) { s.earlyBtn = true; if (!rideEnded) ui.actions([{ label: C.arriveButton + ' →', cls: 'soft', onClick: () => arriveResolve() }]); }
    if (travel >= totalDur) arrive();
  };

  audio.scene(null, [['rumble', 0.35], ['wind', 0.2]]);
  const done = scene.start();
  await game.enter();
  // the car stereo starts the song; the ride ends with it
  const song = C.carSong;
  const playing = song?.file && await audio.playRecord(song.file, { loop: false, onEnd: () => arrive() });
  if (playing) { totalDur = Infinity; ui.note(`♪ ${C.nowPlaying}: ${song.title}`, 4000); }
  else audio.playMusic('trainUp', 1.5);
  await wait(2400);
  await ui.dialog(C.intro);
  if (game.debug && new URLSearchParams(location.search).has('fast')) totalDur = 20;
  await arrived;
  await game.leave(scene);
  await done;
}

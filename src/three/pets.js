// Detailed pixel sprites for the dog and cat on the hill: a shiba with cream
// markings and a curled tail, an orange tabby that naps curled up and sits up
// when petted. Drawn at about twice the resolution of the small 2D sprites, so
// the billboards use a smaller pixel size.
import { canvas, outline, shade, light, INK } from '../core/sprites.js';

const cache = new Map();
const cached = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };
function painter(x) {
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  // ellipse, optionally lit from the upper left: hi on top-left rim, lo on the bottom-right
  const E = (cx, cy, rx, ry, col, hi, lo) => {
    for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
      const nx = (i + 0.5 - cx) / rx, ny = (j + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const k = nx * 0.45 + ny * 0.9;
      x.fillStyle = lo && k > 0.55 && d > 0.35 ? lo : hi && k < -0.6 && d > 0.3 ? hi : col;
      x.fillRect(i, j, 1, 1);
    }
  };
  const T = (a, b, c, col) => {
    const minx = Math.floor(Math.min(a[0], b[0], c[0])), maxx = Math.ceil(Math.max(a[0], b[0], c[0]));
    const miny = Math.floor(Math.min(a[1], b[1], c[1])), maxy = Math.ceil(Math.max(a[1], b[1], c[1]));
    const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
    x.fillStyle = col;
    for (let j = miny; j <= maxy; j++) for (let i = minx; i <= maxx; i++) {
      const pt = [i + 0.5, j + 0.5], d1 = s(pt, a, b), d2 = s(pt, b, c), d3 = s(pt, c, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) x.fillRect(i, j, 1, 1);
    }
  };
  return { P, E, T };
}

// ---------------------------------------------------------------- dog
const FUR = '#e3924a', FUR_HI = '#f2ae68', FUR_LO = '#b86e34', CREAM = '#fff3e0', CREAM_LO = '#efd8bc';
// frame: walk 0-3 / wag 0-1; mood: normal | happy; pose: stand | sit. Faces right.
export function dogHD(frame = 0, mood = 'normal', pose = 'stand') {
  return cached(`dogHD${frame}${mood}${pose}`, () => {
    const [c, x] = canvas(50, 38);
    const { P, E, T } = painter(x);
    const G = 37; // ground row
    const happy = mood === 'happy';
    let hx, hy; // head centre
    if (pose === 'sit') {
      const wag = frame % 2;
      // tail curled up behind, wagging
      E(9 + wag, 21, 4.5, 4.5, FUR, FUR_HI, FUR_LO); E(9 + wag, 21, 2, 2, CREAM);
      // far front leg, haunch, body leaning up, near front leg
      P(28, 24, 3, G - 24, FUR_LO); P(28, G - 2, 4, 2, CREAM_LO);
      E(16, 29, 8, 7, FUR, FUR_HI, FUR_LO);
      E(23, 22, 7.5, 9, FUR, FUR_HI, FUR_LO);
      E(27, 24, 4, 6.5, CREAM, null, CREAM_LO); // chest
      P(13, G - 3, 7, 3, CREAM); // hind paw
      P(31, 24, 4, G - 24, FUR); P(31, 24, 1, G - 24, FUR_HI); P(31, G - 6, 4, 6, CREAM); P(31, G - 1, 5, 1, CREAM_LO);
      hx = 31; hy = 11;
    } else {
      const bob = frame % 2;
      const sw = [[0, 0], [2, -1], [0, 0], [-2, -1]][frame % 4]; // stride: near pair swings, far pair opposite
      const leg = (lx, dx, lift, col, sock) => { P(lx + dx, 24 - bob, 3, G - 24 + bob - lift, col); P(lx + dx, G - 4 - lift, 3, 4, sock); P(lx + dx, G - 1 - lift, 4, 1, CREAM_LO); };
      // far legs
      leg(12, -sw[0], sw[1] ? 0 : 0, FUR_LO, CREAM_LO); leg(32, -sw[0], 0, FUR_LO, CREAM_LO);
      // tail curled over the back
      E(10, 13 - bob, 4.5, 4.5, FUR, FUR_HI, FUR_LO); E(10.5, 13 - bob, 2, 2, CREAM);
      // body, haunch, belly and chest
      E(22, 20 - bob, 13, 6.5, FUR, FUR_HI, FUR_LO);
      E(13, 21 - bob, 6, 6, FUR, FUR_HI, FUR_LO);
      E(23, 25 - bob, 9, 2.2, CREAM, null, CREAM_LO);
      E(33, 21 - bob, 4, 5, CREAM, null, CREAM_LO);
      // near legs
      leg(14, sw[0], -sw[1], FUR, CREAM); leg(34, sw[0], -sw[1], FUR, CREAM);
      hx = 37; hy = 11 - bob;
    }
    // collar with a little tag
    P(hx - 5, hy + 5, 6, 2, '#e05a5a'); P(hx - 2, hy + 7, 2, 2, '#ffd23f');
    // head: skull, ears, cream cheeks and muzzle, nose, eye with the shiba brow dot
    T([hx - 5, hy - 2], [hx - 3, hy - 9], [hx, hy - 3], FUR); T([hx - 4, hy - 3], [hx - 3, hy - 7], [hx - 1.5, hy - 3.5], '#f5b5a8');
    T([hx + 0, hy - 3], [hx + 3, hy - 9], [hx + 5, hy - 2], FUR_LO);
    E(hx, hy, 6.5, 5.5, FUR, FUR_HI, FUR_LO);
    E(hx + 1, hy + 3.5, 5, 2.5, CREAM, null, CREAM_LO);
    E(hx + 6.5, hy + 2, 4, 2.6, CREAM, null, CREAM_LO);
    P(hx + 9, hy + 0, 2, 2, INK); P(hx + 9, hy + 0, 1, 1, '#6a5a6a');
    if (happy) {
      P(hx + 2, hy - 1, 1, 1, INK); P(hx + 3, hy - 2, 2, 1, INK); P(hx + 5, hy - 1, 1, 1, INK); // ^ eye
      P(hx + 5, hy + 4, 4, 1, INK); P(hx + 6, hy + 5, 2, 2, '#f07a8a'); // open mouth, tongue
    } else {
      P(hx + 3, hy - 2, 2, 3, INK); P(hx + 3, hy - 2, 1, 1, '#ffffff');
      P(hx + 6, hy + 4, 3, 1, shade(CREAM_LO, 0.2));
    }
    P(hx + 3, hy - 4, 2, 1, CREAM);
    return outline(c, shade(FUR_LO, 0.55));
  });
}

// ---------------------------------------------------------------- cat
const TAB = '#f0a256', TAB_HI = '#f8c07a', TAB_LO = '#c97a3a', STRIPE = '#b0602c', WHITE = '#fff6ec';
// pose: sleep (curled, breathing frames) | happy (sitting up, tail swishing)
export function catHD(pose = 'sleep', frame = 0) {
  return cached(`catHD${pose}${frame}`, () => {
    if (pose === 'sleep') {
      const [c, x] = canvas(42, 26);
      const { P, E, T } = painter(x);
      const br = frame % 2;
      // curled body with tabby stripes over the back
      E(19, 16 - br * 0.5, 15, 8 + br * 0.5, TAB, TAB_HI, TAB_LO);
      for (const sx of [9, 14, 19, 24]) { P(sx, 9 - br, 2, 4, STRIPE); P(sx + 1, 13 - br, 1, 2, STRIPE); }
      // tail wrapped round the front, ringed, white tip
      E(17, 22, 13, 2.6, TAB, TAB_HI, TAB_LO);
      for (const sx of [8, 13, 18, 23]) P(sx, 20, 2, 4, STRIPE);
      E(28, 22, 2.5, 2.2, WHITE);
      // head tucked down on the paws
      E(31, 15, 7.5, 6, TAB, TAB_HI, TAB_LO);
      T([25, 12], [26, 5], [30, 10], TAB); T([26, 11], [26.5, 7.5], [28.5, 10], '#f5b5a8');
      T([32, 10], [36, 5], [37, 12], TAB_LO);
      P(29, 10, 1, 3, STRIPE); P(31, 9, 1, 3, STRIPE); P(33, 10, 1, 2, STRIPE);
      E(33, 18, 4, 2.6, WHITE); P(30, 21, 6, 2, WHITE); // muzzle, tucked paws
      // closed eyes, nose
      P(28, 15, 3, 1, INK); P(27, 14, 1, 1, INK); P(34, 15, 3, 1, INK); P(37, 14, 1, 1, INK);
      P(32, 17, 2, 1, '#f08fa8');
      return outline(c, shade(TAB_LO, 0.55));
    }
    const [c, x] = canvas(32, 36);
    const { P, E, T } = painter(x);
    const sw = frame % 2;
    // tail swishing up beside her
    for (let k = 0; k < 9; k++) P(3 + Math.round(Math.sin(k * 0.5 + sw * 1.2) * 2), 31 - k * 2, 3, 3, k % 3 === 2 ? STRIPE : TAB);
    // sitting body, white chest, front paws
    E(16, 26, 9, 9, TAB, TAB_HI, TAB_LO);
    for (const sx of [9, 22]) P(sx, 21, 2, 6, STRIPE);
    E(16, 25, 4.5, 6, WHITE);
    P(11, 32, 4, 3, WHITE); P(17, 32, 4, 3, WHITE); P(15, 33, 1, 2, TAB_LO);
    // head
    E(16, 12, 8.5, 7, TAB, TAB_HI, TAB_LO);
    T([8, 9], [9, 0], [14, 6], TAB); T([9.5, 8], [10, 3], [12.5, 6], '#f5b5a8');
    T([18, 6], [23, 0], [24, 9], TAB_LO); T([19.5, 6], [22, 3], [22.5, 8], '#f5b5a8');
    P(13, 5, 1, 3, STRIPE); P(16, 5, 1, 3, STRIPE); P(19, 5, 1, 3, STRIPE);
    E(16, 15.5, 4.5, 3, WHITE);
    // happy closed eyes, pink nose and cheeks, whiskers
    P(10, 11, 1, 1, INK); P(11, 10, 2, 1, INK); P(13, 11, 1, 1, INK);
    P(19, 11, 1, 1, INK); P(20, 10, 2, 1, INK); P(22, 11, 1, 1, INK);
    P(15, 14, 2, 1, '#f08fa8'); P(15, 16, 1, 1, INK); P(16, 16, 1, 1, INK);
    P(9, 14, 2, 1, '#f7a8b8'); P(21, 14, 2, 1, '#f7a8b8');
    return outline(c, shade(TAB_LO, 0.55));
  });
}

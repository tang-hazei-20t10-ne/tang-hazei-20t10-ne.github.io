// Chapter 5: omakase lunch in a tiny counter shop. The camera sits high at the
// near end of the counter and looks diagonally down along it: Hazei and Mino sit
// on the left, the chef stands on the right between them and sets each dish
// down on their mats. Five rounds, two dishes each; every choice adds a line to
// the wish. The room is a small 3D box projected by hand and filled pixel by
// pixel, so the counter keeps crisp edges.
import content from '../content.js';
import { Scene2D } from '../two/engine2d.js';
import { canvas, shade, light, mix, outline, LOOKS, dishSprite, charSprite, emoteSprite } from '../core/sprites.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { state } from '../core/state.js';
import { upscale } from '../core/photo.js';

const C = content.omakase;

// ---------------------------------------------------------------- small props
function spr(w, h, fn) { const [c, x] = canvas(w, h); fn((a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); }); return outline(c); }
const teaCup = () => spr(6, 7, (P) => { P(0, 1, 6, 6, '#6f8a76'); P(0, 1, 6, 1, '#b8d0b4'); P(1, 2, 4, 1, '#3f5a4a'); P(4, 2, 1, 5, '#566f5e'); });
const towel = () => spr(9, 4, (P) => { P(0, 0, 9, 4, '#f6f3ec'); P(0, 3, 9, 1, '#d8d2c6'); P(2, 1, 1, 2, '#e4ded2'); P(6, 1, 1, 2, '#e4ded2'); });
const bigBowl = () => spr(22, 14, (P) => {
  P(1, 5, 20, 7, '#d8642e'); P(3, 12, 16, 2, '#b04a20'); P(1, 5, 20, 1, '#f08a4a'); P(3, 6, 3, 5, '#f4a060');
  P(4, 1, 14, 4, '#c4542a'); P(4, 1, 14, 1, '#e87a40'); P(9, 0, 4, 1, '#3a2633'); P(10, -1, 2, 1, '#3a2633');
});
const sakeSet = () => spr(10, 12, (P) => { P(1, 0, 3, 2, '#e8e2d6'); P(0, 2, 5, 10, '#f2ece2'); P(0, 6, 5, 2, '#3f5a8a'); P(6, 8, 4, 4, '#f2ece2'); P(6, 8, 4, 1, '#ffffff'); });
const vase = () => spr(10, 20, (P) => {
  P(3, 12, 4, 8, '#3f5a8a'); P(3, 12, 1, 8, '#6a86b8'); P(4, 11, 2, 1, '#2f4470');
  P(5, 3, 1, 8, '#5a3a2a'); P(6, 5, 3, 1, '#5a3a2a'); P(2, 6, 3, 1, '#5a3a2a');
  [[4, 1], [7, 3], [8, 5], [1, 5], [6, 7], [3, 3]].forEach(([a, b]) => { P(a, b, 2, 2, '#f6a8c0'); P(a, b, 1, 1, '#ffe0ea'); });
});
const riceTub = () => spr(20, 10, (P) => { P(1, 3, 18, 6, '#c08a52'); P(2, 2, 16, 2, '#f6f1e6'); P(3, 1, 14, 1, '#fbf8f0'); P(1, 5, 18, 1, '#8a5a32'); P(1, 8, 18, 1, '#8a5a32'); P(12, 0, 2, 3, '#e8d2a8'); });
const potSprite = () => spr(30, 26, (P) => {
  P(2, 6, 26, 14, '#9aa0aa'); P(2, 6, 26, 2, '#c8ccd4'); P(24, 8, 4, 12, '#7a808a'); P(0, 9, 3, 3, '#5a5e66'); P(27, 9, 3, 3, '#5a5e66');
  P(4, 5, 22, 2, '#e8c890'); P(1, 20, 28, 6, '#3a3346'); P(3, 21, 24, 2, '#e8603a'); P(5, 22, 20, 1, '#ffb04a');
});
const lampSprite = () => spr(10, 9, (P) => { P(4, 0, 2, 2, '#3a2633'); P(1, 2, 8, 5, '#f4e2bc'); P(0, 4, 10, 3, '#f4e2bc'); P(1, 2, 8, 1, '#fff6dc'); P(0, 7, 10, 1, '#d8c094'); P(3, 8, 4, 1, '#fff3c0'); });

export default async function omakase(game) {
  state.data.omakase = []; state.save();
  const props = { tea: teaCup(), towel: towel(), bowl: bigBowl(), sake: sakeSet(), vase: vase(), tub: riceTub(), pot: potSprite(), lamp: lampSprite() };
  const big = new Map(); // integer-scaled copies of sprites, so pixels stay crisp
  const scaled = (img, s) => {
    if (s === 1) return img;
    let m = big.get(img); if (!m) big.set(img, (m = new Map()));
    let c = m.get(s);
    if (!c) { const [cc, x] = canvas(img.width * s, img.height * s); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, cc.width, cc.height); m.set(s, (c = cc)); }
    return c;
  };

  // World units are sprite pixels: a character is ~30 tall. x runs across the
  // counter (guests at -x, chef at +x), y up from the floor, z along the counter.
  const TOP = 14, HALF = 15, LEN = 150; // counter top height, half width, length
  const SEAT = [{ x: -23, z: 28 }, { x: -23, z: 57 }]; // Hazei (near), Mino
  const CHEF = { x: 26, z: 41 };
  const mat = (i) => ({ x: -5, z: SEAT[i].z }); // where a guest's plate sits

  let view = null;
  const V = () => {
    const W = scene.W, H = scene.H;
    if (view && view.W === W && view.H === H) return view;
    const S = Math.max(1, Math.min(Math.floor(W / 62), Math.floor(H / 58)));
    // a long lens from high up the chef's end: little perspective, so everyone
    // stays the same size and the counter fills the frame
    const tgt = [0, 14, 41], eye = [tgt[0] + 80, tgt[1] + 125, tgt[2] - 200];
    const f = norm(sub(tgt, eye)), r = norm(cross([0, 1, 0], f)), u = cross(f, r);
    const dist = Math.hypot(...sub([0, 20, CHEF.z], eye));
    const F = S * dist; // one world unit is S pixels at the chef's and guests' depth
    const cx = W / 2, cy = H / 2 + 4 * S;
    const P = (X, Y, Z) => { const d = sub([X, Y, Z], eye); const z = dot(d, f); return { x: cx + F * dot(d, r) / z, y: cy - F * dot(d, u) / z, d: z }; };
    return (view = { W, H, S, P, eye, F });
  };

  // crisp scanline polygon fill (no anti-aliasing on the low-res canvas)
  const poly = (x, pts, col) => {
    let y0 = Infinity, y1 = -Infinity; for (const p of pts) { y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    x.fillStyle = col;
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(x.canvas.height, Math.ceil(y1)); y++) {
      const yy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a.y <= yy) !== (b.y <= yy)) xs.push(a.x + (yy - a.y) / (b.y - a.y) * (b.x - a.x)); }
      xs.sort((m, n) => m - n);
      for (let k = 0; k + 1 < xs.length; k += 2) { const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]); if (xb > xa) x.fillRect(xa, y, xb - xa, 1); }
    }
  };
  const quad = (x, pts, col) => { const { P } = V(); poly(x, pts.map((p) => P(...p)), col); };
  const line = (x, a, b, col, w = 1) => {
    const { P } = V(); const p = P(...a), q = P(...b);
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y))));
    x.fillStyle = col; for (let i = 0; i <= n; i++) x.fillRect(Math.round(p.x + (q.x - p.x) * i / n), Math.round(p.y + (q.y - p.y) * i / n), w, w);
  };
  // a sprite standing on a world point; `row` is the sprite row that touches it
  const put = (x, img, X, Y, Z, row = img.height, flip = false, shrink = 0) => {
    // props further down the counter shrink (in whole pixel steps)
    const { S, P, F } = V(); const p = P(X, Y, Z);
    const k = Math.max(1, Math.min(S, Math.round(F / p.d)) - shrink), s = scaled(img, k);
    const left = Math.round(p.x - s.width / 2), top = Math.round(p.y - row * k);
    if (!flip) x.drawImage(s, left, top);
    else { x.save(); x.translate(left + s.width, 0); x.scale(-1, 1); x.drawImage(s, 0, top); x.restore(); }
    return { x: p.x, y: top };
  };
  const box = (x, x0, x1, y0, y1, z0, z1, cols) => {
    // the faces this camera can see: top, the near end (-z) and the +x side
    const sx = V().eye[0] > x1 ? x1 : V().eye[0] < x0 ? x0 : null;
    if (sx !== null) quad(x, [[sx, y0, z0], [sx, y0, z1], [sx, y1, z1], [sx, y1, z0]], cols.side);
    quad(x, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], cols.front);
    quad(x, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], cols.top);
  };

  // ---------------------------------------------------------------- layers
  // back: walls, floor, the chef's prep counter, stools (everything behind the guests)
  const drawBackLayer = () => {
    const { W, H, S } = V();
    const [c, x] = canvas(W, H);
    x.fillStyle = '#2a1c1e'; x.fillRect(0, 0, W, H);
    // ceiling, far wall and the left wall of glass cabinets
    quad(x, [[-46, 96, -60], [56, 96, -60], [56, 96, 170], [-46, 96, 170]], '#2e2226');
    quad(x, [[-46, 0, 170], [56, 0, 170], [56, 96, 170], [-46, 96, 170]], '#6a4a38');
    quad(x, [[-46, 0, -60], [-46, 0, 170], [-46, 96, 170], [-46, 96, -60]], '#5a3a2c');
    for (let z = -50; z < 165; z += 28) {
      quad(x, [[-46, 26, z + 2], [-46, 26, z + 25], [-46, 88, z + 25], [-46, 88, z + 2]], '#8a5a3a');
      quad(x, [[-46, 29, z + 4], [-46, 29, z + 23], [-46, 85, z + 23], [-46, 85, z + 4]], '#1e1a24');
      quad(x, [[-46, 29, z + 4], [-46, 29, z + 9], [-46, 85, z + 9], [-46, 85, z + 4]], '#2c2834');
      line(x, [-46, 56, z + 4], [-46, 56, z + 23], '#8a5a3a', S);
      // bottles glinting inside
      for (let k = 0; k < 4; k++) line(x, [-46, 58, z + 7 + k * 4], [-46, 66 + (k % 2) * 4, z + 7 + k * 4], ['#4f7a5a', '#c48a4a', '#6a4a8a', '#b8b0a0'][k], S);
    }
    quad(x, [[-46, 0, -60], [-46, 0, 170], [-46, 24, 170], [-46, 24, -60]], '#4a2e22');
    // right wall behind the chef, hung with a long brown curtain
    quad(x, [[56, 0, -60], [56, 0, 170], [56, 96, 170], [56, 96, -60]], '#7a5a44');
    for (let z = 36; z < 168; z += 12) { quad(x, [[56, 8, z], [56, 8, z + 6], [56, 84, z + 6], [56, 84, z]], '#8a6448'); line(x, [56, 8, z + 6], [56, 84, z + 6], '#6a4a34'); }
    line(x, [56, 85, -60], [56, 85, 170], '#c9a070', S);
    // floor planks
    quad(x, [[-46, 0, -60], [56, 0, -60], [56, 0, 170], [-46, 0, 170]], '#4a3830');
    for (let k = -44; k < 56; k += 8) line(x, [k, 0, -60], [k, 0, 170], '#3e2e28');
    // stools for the guests
    SEAT.forEach((s) => box(x, s.x - 4, s.x + 4, 0, 9, s.z - 4, s.z + 4, { top: '#5a3423', front: '#3e2418', side: '#4a2c1e' }));
    return c;
  };
  // fore: the chef's back counter, which hides his legs from this side
  const drawForeLayer = () => {
    const { W, H } = V();
    const [c, x] = canvas(W, H);
    // the chef's back counter: he stands between it and the guests' counter
    box(x, 34, 48, 0, 15, -20, 160, { top: '#9a6a44', front: '#5a3423', side: '#6a4028' });
    line(x, [34, 15, -20], [34, 15, 160], '#b88458');
    put(x, props.tub, 41, 15, 70, 10);
    put(x, props.sake, 41, 15, 92, 12, false, 1);
    put(x, props.pot, 41, 15, 112, 26, false, 1);
    return c;
  };
  // the counter and everything that stays on it
  const drawCounterLayer = () => {
    const { W, H, S, P } = V();
    const [c, x] = canvas(W, H);
    box(x, -HALF, HALF, 0, TOP, 0, LEN, { top: '#ecd2a6', front: '#b8875a', side: '#c89a68' });
    // grain along the slab, a lighter lip on the chef's edge
    for (let k = -HALF + 2; k < HALF; k += 3) line(x, [k, TOP, 2 + ((k * 13) & 15)], [k, TOP, LEN - 4 - ((k * 7) & 31)], (k & 1) ? '#e2c494' : '#f4dcb2');
    line(x, [HALF, TOP, 0], [HALF, TOP, LEN], '#fbe8c6', S);
    line(x, [-HALF, TOP, 0], [HALF, TOP, 0], '#fbe8c6', S);
    // a toe kick in shadow under the chef's side
    quad(x, [[HALF, 0, 0], [HALF, 0, LEN], [HALF, 3, LEN], [HALF, 3, 0]], '#6a4a34');
    // place settings: a washi mat, chopsticks on a rest, tea, a rolled towel
    for (let i = 0; i < 2; i++) {
      const { x: mx, z: mz } = mat(i);
      quad(x, [[mx - 7, TOP, mz - 8], [mx + 6, TOP, mz - 8], [mx + 6, TOP, mz + 8], [mx - 7, TOP, mz + 8]], '#f8f4ea');
      line(x, [mx - 7, TOP, mz - 8], [mx - 7, TOP, mz + 8], '#e0d8c6');
      line(x, [-13, TOP, mz - 6], [-13, TOP, mz + 6], '#c9a070', S);
      quad(x, [[-14, TOP, mz + 6], [-12, TOP, mz + 6], [-12, TOP, mz + 8], [-14, TOP, mz + 8]], '#c4584a');
      put(x, props.tea, -10, TOP, mz + 12, 7);
      put(x, props.towel, -12, TOP, mz - 12, 4);
    }
    // the chef's thick cutting board, a lacquered bowl, a vase at the far end
    box(x, 3, 13, TOP, TOP + 2, CHEF.z - 8, CHEF.z + 8, { top: '#f2dcae', front: '#c99a68', side: '#d8ac78' });
    put(x, props.bowl, 6, TOP, 92, 14, false, 1);
    put(x, props.sake, -6, TOP, 104, 12, false, 1);
    put(x, props.vase, 2, TOP, 124, 20, false, 1);
    return c;
  };

  // ---------------------------------------------------------------- state
  const plates = [null, null]; // { img, X, Y, Z, steam }
  const chef = { pose: 'idle', frame: 0, mood: 'normal', blink: 3 };
  const guests = [
    { look: LOOKS.hazei(), pose: 'sit', hold: null, mood: 'normal', emo: null, emoT: 0, blink: 2 },
    { look: LOOKS.partner(), pose: 'sit', hold: null, mood: 'normal', emo: null, emoT: 0, blink: 4 },
  ];
  const emote = (g, kind, dur = 1.8) => { g.emo = kind; g.emoT = dur; g.emoMax = dur; };
  let back = null, counter = null, fore = null, layerKey = '';

  const scene = new Scene2D(game, {
    id: 'omakase', worldW: 0, walkable: false, hazei: false, partner: false, time: 'noon', inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.22, tint: 'rgba(255,180,110,0.38)', vignette: '#1e1018' },
    ambient: { motes: 0.8, moteColor: '#ffe2b0' },
    drawBack(x) {
      const { W, H } = V();
      if (layerKey !== W + 'x' + H) { view = null; V(); back = drawBackLayer(); counter = drawCounterLayer(); fore = drawForeLayer(); layerKey = W + 'x' + H; }
      x.drawImage(back, 0, 0);
    },
    drawFront(x, s) {
      const { S } = V();
      // guests sit behind the counter (from here), Mino further along than Hazei
      const heads = [];
      for (const i of [1, 0]) {
        const g = guests[i], st = SEAT[i];
        const sp = charSprite(g.look, { pose: g.pose, frame: 0, mood: g.blink < 0 ? 'blink' : g.mood, hold: g.hold });
        heads[i] = put(x, sp, st.x, 9, st.z, 28);
      }
      x.drawImage(counter, 0, 0);
      plates.forEach((p) => { if (p) put(x, p.img, p.X, p.Y, p.Z, 20, false, 1); }); // dishes a size smaller than people
      // the chef stands on the right, facing the guests
      const cs = charSprite(LOOKS.chef, { pose: chef.pose, frame: chef.frame, mood: chef.blink < 0 ? 'blink' : chef.mood });
      put(x, cs, CHEF.x, 0, CHEF.z, 28, true);
      x.drawImage(fore, 0, 0);
      guests.forEach((g, i) => {
        if (g.emoT <= 0) return;
        const k = 1 - g.emoT / g.emoMax, pop = k < 0.1 ? Math.round((0.1 - k) * 20) * S : 0;
        const e = scaled(emoteSprite(g.emo), Math.max(1, S - 1));
        // Hazei's bubble sits out to her left, Mino's straight above his head
        const ex = i ? heads[i].x - e.width / 2 : heads[i].x - 12 * S - e.width, ey = i ? heads[i].y - 10 * S : heads[i].y + 2 * S;
        x.drawImage(e, Math.round(ex), ey + pop + Math.round(Math.sin(s.t * 4)) * S);
      });
    },
    drawLight(x, s) {
      const { S, P } = V();
      // pendant lamps over each seat and pools of warm light on the counter
      [SEAT[0].z, SEAT[1].z, 90].forEach((z, i) => {
        const top = P(-2, 96, z), lp = P(-2, 60 + Math.sin(s.t * 0.8 + i) * 0.3, z);
        x.fillStyle = '#1e1418'; x.fillRect(Math.round(lp.x), Math.round(top.y), 1, Math.round(lp.y - top.y));
        const ls = scaled(props.lamp, S); x.drawImage(ls, Math.round(lp.x - ls.width / 2), Math.round(lp.y));
        x.save(); x.globalCompositeOperation = 'lighter';
        x.globalAlpha = 0.09;
        for (let r = 12; r > 3; r -= 3) { const ring = []; for (let a = 0; a < 16; a++) ring.push(P(-3 + Math.cos(a / 16 * Math.PI * 2) * r, TOP, z + Math.sin(a / 16 * Math.PI * 2) * r)); poly(x, ring, '#ffd890'); }
        x.globalAlpha = 0.12; for (let r = 7 * S; r > 2 * S; r -= 2 * S) for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(Math.round(lp.x) - w, Math.round(lp.y + 5 * S) + j, w * 2, 1); }
        x.restore();
      });
    },
  });

  scene.cfg.update = (s, dt) => {
    const { S, P } = V();
    for (const g of [...guests, chef]) { g.blink -= dt; if (g.blink < -0.12) g.blink = 2 + Math.random() * 3; if (g.emoT > 0) g.emoT -= dt; }
    // steam from the stock pot and from freshly served dishes
    if (Math.random() < dt * 4) { const p = P(41, 30, 112); s.spawn({ x: p.x + (Math.random() - 0.5) * 8 * S, y: p.y, vx: (Math.random() - 0.5) * 3, vy: -6 - Math.random() * 4, life: 2, color: '#ffffff', size: S, wobble: 1, screen: true, layer: 'mid' }); }
    plates.forEach((pl) => {
      if (!pl || pl.fly || !(pl.steam > 0)) return;
      pl.steam -= dt;
      if (Math.random() < dt * 4) { const p = P(pl.X, pl.Y + 10, pl.Z); s.spawn({ x: p.x + (Math.random() - 0.5) * 10 * S, y: p.y, vx: (Math.random() - 0.5) * 2, vy: -5 - Math.random() * 3, life: 1.5, color: '#ffffff', size: S, wobble: 1, screen: true, layer: 'front' }); }
    });
  };

  // a dish travels between the chef's hands and a mat, in world space
  const hands = (i) => ({ X: 8, Y: TOP + 2, Z: CHEF.z + (i ? 4 : -4) }); // off the board
  const fly = (p, from, to, dur) => new Promise((resolve) => {
    p.fly = true; const t0 = performance.now();
    const step = () => {
      if (scene.dead) return resolve();
      const k = Math.min(1, (performance.now() - t0) / (dur * 1000)), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      p.X = from.X + (to.X - from.X) * e; p.Z = from.Z + (to.Z - from.Z) * e;
      p.Y = from.Y + (to.Y - from.Y) * e + Math.sin(k * Math.PI) * 5;
      if (k < 1) requestAnimationFrame(step); else { p.fly = false; resolve(); }
    };
    step();
  });
  const serve = async (i, img) => {
    chef.pose = 'give'; chef.frame = 1;
    const p = { img, ...hands(i), steam: 2.5 };
    plates[i] = p;
    await fly(p, hands(i), { X: mat(i).x, Y: TOP, Z: mat(i).z }, 0.6);
    audio.sfx('pop');
    const { S, P } = V(); const at = P(p.X, TOP + 6, p.Z);
    scene.sparkles(at.x, at.y - 2 * S, 6);
    emote(guests[i], i ? 'thumb' : 'wow', 1.3);
    await wait(300);
  };
  const clear = async () => {
    chef.pose = 'give'; chef.frame = 0;
    for (let i = 0; i < 2; i++) {
      const p = plates[i]; if (!p) continue;
      await fly(p, { X: p.X, Y: p.Y, Z: p.Z }, hands(i), 0.45);
      plates[i] = null;
    }
    chef.pose = 'idle';
  };

  audio.scene('omakase', [['room', 0.5]]);
  const done = scene.start();
  await game.enter();
  await wait(2400);
  await ui.dialog(C.intro);

  for (let r = 0; r < C.rounds.length; r++) {
    const round = C.rounds[r];
    if (r) await clear();
    ui.note(`${C.roundWord} ${r + 1} · ${round.name}`, 2200);
    const pick = await new Promise((resolve) => {
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<h2>${esc(C.roundWord)} ${r + 1} · ${esc(round.name)}</h2><p class="sub">${esc(C.choose)}</p>`);
        const g = el('div', 'grid-opts'); g.style.gridTemplateColumns = 'repeat(auto-fit,minmax(200px,1fr))';
        round.options.forEach((o, i) => {
          const b = el('button', 'opt');
          const img = upscale(dishSprite(o.sprite), 4); img.style.width = '128px'; img.style.height = '96px'; img.style.imageRendering = 'pixelated';
          b.append(img, el('span', 'n', esc(o.dish)), el('span', 'd', esc(o.short)));
          b.onclick = () => { audio.sfx('select'); resolve(i); ui.closeModal(); };
          g.appendChild(b);
        });
        s.appendChild(g);
      }, { closeable: false });
    });
    const opt = round.options[pick];
    state.data.omakase[r] = pick; state.save();
    // the chef prepares it on his board, then sets one down for each of them
    chef.mood = 'normal';
    for (let k = 0; k < 6; k++) { chef.pose = 'hold'; chef.frame = k; if (k % 2 === 0) audio.sfx('tick'); await wait(220); }
    const img = dishSprite(opt.sprite);
    await serve(0, img);
    await serve(1, img);
    chef.pose = 'idle'; chef.mood = 'happy';
    await wait(400);
    await ui.dialog([{ who: 'chef', text: opt.chef }]);
    chef.mood = 'normal';
    // they eat: a bite each, a little out of step
    for (let k = 0; k < 3; k++) {
      guests[0].pose = 'hold'; guests[0].hold = 'snack'; if (k) { guests[1].pose = 'hold'; guests[1].hold = 'snack'; }
      await wait(320);
      for (const g of guests) { g.pose = 'sit'; g.hold = null; }
      await wait(260);
    }
    guests[0].mood = 'happy'; audio.sfx('yay');
    const { S, P } = V(); const hz = P(SEAT[0].x, 34, SEAT[0].z);
    scene.sparkles(hz.x, hz.y, 8);
    emote(guests[0], ['sparkle', 'star', 'sparkle', 'star', 'sparkle'][r]);
    emote(guests[1], ['thumb', 'sparkle', 'laugh', 'thumb', 'star'][r]);
    ui.note('✨ ' + C.fragmentNote, 2400);
    audio.sfx('sparkle');
    await wait(1800);
    guests[0].mood = 'normal';
  }
  await clear();
  await ui.dialog(C.outro);
  await game.leave(scene);
  await done;
}

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

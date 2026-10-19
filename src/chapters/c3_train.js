// Chapter 3: countryside train ride. Passive sightseeing through the window.
import content from '../content.js';
import { Scene2D } from '../two/engine2d.js';
import { TIMES, lerpTime, ditherGradient } from '../core/palette.js';
import { canvas, mix, shade, light, charSprite, LOOKS, birdSprite, emoteSprite } from '../core/sprites.js';
import { state } from '../core/state.js';
import { ridgeStrip, cloudSprite, house, rand } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait, esc, el } from '../core/ui.js';

const C = content.train;

// Sights in order, each lasting `dur` seconds of travel.
const SIGHTS = [
  { id: 'terraces', dur: 12 },
  { id: 'lake', dur: 11 },
  { id: 'tunnel', dur: 7 },
  { id: 'town', dur: 10 },
  { id: 'kids', dur: 9 },
  { id: 'balloons', dur: 11 },
];

function terraceStrip(w, h) {
  const [c, x] = canvas(w, h);
  const cols = ['#d9c25a', '#c8b84a', '#e6cf6a', '#b8c050'];
  for (let k = 0; k < 7; k++) {
    const y0 = Math.round(h * 0.25 + k * h * 0.11);
    for (let i = 0; i < w; i++) {
      const y = y0 + Math.round(Math.sin(i * 0.03 + k) * 4);
      x.fillStyle = cols[k % 4]; x.fillRect(i, y, 1, h - y);
      x.fillStyle = light(cols[k % 4], 0.35); x.fillRect(i, y, 1, 1);
      x.fillStyle = shade(cols[k % 4], 0.3); x.fillRect(i, y + Math.round(h * 0.11) - 1, 1, 1);
      if ((i + k * 3) % 5 === 0) { x.fillStyle = shade(cols[k % 4], 0.12); x.fillRect(i, y + 2, 1, 2); }
    }
  }
  return c;
}

export default async function train(game) {
  let totalDur = SIGHTS.reduce((a, s) => a + s.dur, 0);
  let travel = 0; // seconds of travel
  let speed = 1;
  let video = null;
  let sightIdx = -1;
  let skyKey = '', skyC;
  const seats = { hz: null, pt: null };
  const scene = new Scene2D(game, {
    id: 'train', worldW: 0, walkable: false, hazei: false, partner: false, time: 'morning',
    inputMode: 'none', action: false, groundFromBottom: 34,
    light: { bloom: 0.2, tint: 'rgba(255,230,190,0.35)' },
    drawBack(x, s) {
      const W = s.W, H = s.H;
      const f = Math.min(1, travel / totalDur);
      const pal = lerpTime('morning', 'noon', f);
      const win = { x0: Math.round(W * 0.12), x1: Math.round(W * 0.88), y0: Math.round(H * 0.1), y1: Math.round(H - 74) };
      s.win = win;
      const key = W + 'x' + H + Math.round(f * 5);
      if (key !== skyKey) { [skyC] = canvas(W, H); ditherGradient(skyC.getContext('2d'), W, H, pal.sky, 0, 16); skyKey = key; }
      // --- outside view, clipped to window
      x.save(); x.beginPath(); x.rect(win.x0, win.y0, win.x1 - win.x0, win.y1 - win.y0); x.clip();
      const sight = currentSight();
      const off = travel * 60; // pixels travelled (near layer)
      const vh = win.y1 - win.y0;
      if (sight.id === 'tunnel') {
        x.fillStyle = '#0d0b1a'; x.fillRect(win.x0, win.y0, win.x1 - win.x0, vh);
        // starry ceiling: glowworm-like dots drifting
        const r = rand(5);
        for (let i = 0; i < 260; i++) {
          const sx = ((r() * 1400 - off * 0.8) % 1400 + 1400) % 1400; if (sx > W) continue;
          const sy = win.y0 + r() * vh * 0.9; const tw = 0.5 + 0.5 * Math.sin(s.t * 3 + i);
          x.globalAlpha = 0.4 + tw * 0.6; x.fillStyle = i % 4 ? '#bfe6ff' : '#fff2b0'; x.fillRect(Math.round(sx), Math.round(sy), 1, 1); if (i % 7 === 0) { x.globalAlpha = tw * 0.3; x.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3); }
        }
        x.globalAlpha = 1;
        // tunnel ribs passing
        for (let i = 0; i < 6; i++) { const rx = ((i * 90 - off * 1.6) % 540 + 540) % 540 - 40; x.fillStyle = '#1e1a2e'; x.fillRect(Math.round(rx), win.y0, 12, vh); }
      } else {
        x.drawImage(skyC, 0, 0);
        const sunX = Math.round(W * 0.7), sunY = Math.round(win.y0 + vh * 0.18);
        s.drawSun(x, sunX, sunY, 7, pal.sun);
        for (let i = 0; i < 5; i++) { const cl = cloudSprite(30 + i); x.drawImage(cl, Math.round(((i * 140 - off * 0.05) % (W + 140) + W + 140) % (W + 140) - 70), win.y0 + 4 + (i % 3) * 10); }
        const fogc = pal.fog;
        const scroll = (strip, k, y) => { const w = strip.width; const sx = Math.round(off * k) % w; for (let px = -sx; px < W; px += w) x.drawImage(strip, px, Math.round(y)); };
        scroll(ridgeStrip(380, 50, { seed: 61, base: mix('#8aa0c0', fogc, 0.45), peak: 0.7, freq: 0.025, rough: 0.6 }), 0.05, win.y1 - vh * 0.62);
        if (sight.id === 'terraces') { scroll(terraceStrip(420, Math.round(vh * 0.55)), 0.35, win.y1 - vh * 0.55); }
        else if (sight.id === 'lake') {
          scroll(ridgeStrip(400, 40, { seed: 71, base: mix('#6f9a78', fogc, 0.3), peak: 0.5, trees: 30, treeCol: '#5f8a66' }), 0.2, win.y1 - vh * 0.5);
          x.fillStyle = '#7fc0dc'; x.fillRect(win.x0, Math.round(win.y1 - vh * 0.28), W, Math.round(vh * 0.28));
          for (let i = 0; i < 40; i++) { const lx = ((i * 37 - off * 0.3) % W + W) % W; x.fillStyle = i % 3 ? '#bfe6f6' : '#fff6d8'; x.fillRect(Math.round(lx), Math.round(win.y1 - vh * 0.26 + (i * 7) % Math.round(vh * 0.24)), 3, 1); }
        } else if (sight.id === 'town') {
          scroll(ridgeStrip(380, 60, { seed: 81, base: mix('#88b070', fogc, 0.2), peak: 0.8, freq: 0.012 }), 0.18, win.y1 - vh * 0.55);
          const hs = Array.from({ length: 8 }, (_, i) => house(40 + i, ['#f6e3cc', '#fff1e0', '#f3dcc0'][i % 3], ['#d96a5a', '#7f9fdc', '#c4587a'][i % 3], 28, 22));
          for (let i = 0; i < 12; i++) { const hx = ((i * 55 - off * 0.18) % 660 + 660) % 660 - 40; const h = hs[i % 8]; x.drawImage(h, Math.round(hx), Math.round(win.y1 - vh * 0.48 - (i % 3) * 6 + Math.sin(i) * 4)); }
        } else if (sight.id === 'kids' || sight.id === 'balloons') {
          scroll(ridgeStrip(420, 40, { seed: 91, base: mix('#7fb466', fogc, 0.15), peak: 0.4, trees: 16, treeCol: '#5f9256' }), 0.25, win.y1 - vh * 0.42);
          if (sight.id === 'balloons') {
            for (let i = 0; i < 5; i++) { const bx = ((i * 160 - off * 0.04) % (W + 160) + W + 160) % (W + 160) - 80; const by = win.y0 + 14 + (i % 3) * 16 + Math.sin(s.t * 0.5 + i) * 3; drawBalloon(x, Math.round(bx), Math.round(by), ['#f08fa8', '#f6c45f', '#7f9fdc', '#8fd3b6', '#b49ae0'][i], 1 + (i % 2) * 0.4); }
          }
        }
        // near field: fence posts & grass rushing
        x.fillStyle = '#6fae5a'; x.fillRect(win.x0, win.y1 - 10, W, 10);
        for (let i = 0; i < 30; i++) { const px = ((i * 23 - off * 1.4) % 690 + 690) % 690 - 30; x.fillStyle = '#5a9a4a'; x.fillRect(Math.round(px), win.y1 - 14, 2, 14); x.fillStyle = '#8fd36a'; x.fillRect(Math.round(px), win.y1 - 14, 2, 1); }
        if (sight.id === 'kids') {
          const kx = Math.round(W * 0.85 - ((travel - sightStart(4)) / SIGHTS[4].dur) * W * 1.2);
          const k1 = charSprite(LOOKS.kidA, { pose: Math.floor(s.t * 4) % 2 ? 'wave' : 'cheer', mood: 'happy', frame: Math.floor(s.t * 4) });
          const k2 = charSprite(LOOKS.kidB, { pose: Math.floor(s.t * 4 + 1) % 2 ? 'wave' : 'cheer', mood: 'happy', frame: Math.floor(s.t * 4) });
          x.drawImage(k1, kx, win.y1 - 34); x.drawImage(k2, kx + 18, win.y1 - 34);
        }
        // birds
        for (let i = 0; i < 3; i++) x.drawImage(birdSprite(Math.floor(s.t * 4 + i) % 2), Math.round(win.x0 + 30 + i * 9 + Math.sin(s.t * 0.3) * 20), Math.round(win.y0 + 20 + (i % 2) * 4));
      }
      x.restore();
      // --- interior
      drawInterior(x, s, win, sight.id === 'tunnel');
    },
    drawFront(x, s) {
      const { hz, pt } = seats;
      const gy = s.groundY;
      const cx = Math.round(s.W / 2);
      // passengers sitting on the bench, facing the viewer
      const sway = Math.round(Math.sin(s.t * 6) * 0.5);
      const hzS = charSprite(LOOKS.hazei(), { pose: hz.pose, mood: hz.mood, frame: Math.floor(s.t * 6), hat: hz.hat, sunglasses: hz.sun, hold: hz.hold });
      const ptS = charSprite(LOOKS.partner(), { pose: pt.pose, mood: pt.mood, frame: Math.floor(s.t * 6), hold: pt.hold });
      x.drawImage(ptS, cx - 26, gy - 30 + sway);
      x.save(); x.translate(cx + 2, 0); x.scale(-1, 1); x.drawImage(hzS, -24, gy - 30 + sway); x.restore();
      if (pt.emoteT > 0) { x.drawImage(emoteSprite(pt.emote), cx - 20, gy - 48); }
    },
  });

  function sightStart(i) { let t = 0; for (let k = 0; k < i; k++) t += SIGHTS[k].dur; return t; }
  function currentSight() { let t = travel; for (const s of SIGHTS) { if (t < s.dur) return s; t -= s.dur; } return SIGHTS[SIGHTS.length - 1]; }

  seats.hz = { pose: 'sit', mood: 'normal', hat: false, sun: false, hold: null };
  seats.pt = { pose: 'sit', mood: 'normal', hold: null, emoteT: 0, emote: 'heart' };

  const say = (who, text, ms = 2800) => {
    const cx = scene.W / 2; const px = who === 'pt' ? cx - 14 : cx + 12;
    return ui.bubble(text, () => (scene.dead ? null : scene.view.toScreen(px, scene.groundY - 38)), ms);
  };
  const emote = (k) => { seats.pt.emote = k; seats.pt.emoteT = 1.6; };

  scene.cfg.update = (s, dt) => {
    travel += dt * speed;
    const i = SIGHTS.indexOf(currentSight());
    if (i !== sightIdx) {
      sightIdx = i;
      const sid = SIGHTS[i].id;
      if (travel > 1 && !video) ui.note(C.sights[sid], 3200);
      if (sid === 'tunnel') audio.setAmbienceLevel(0.6); else audio.setAmbienceLevel(1);
      if (sid === 'kids') setTimeout(() => emote('wow'), 1500);
    }
    const hz = seats.hz, pt = seats.pt;
    if (pt.emoteT > 0) pt.emoteT -= dt;
    hz.pose = 'sit'; hz.mood = Math.sin(s.t * 0.7) > 0.97 ? 'blink' : 'normal';
    pt.mood = Math.sin(s.t * 0.6 + 1) > 0.97 ? 'blink' : 'normal';
    if (video && s.win) placeVideo(s.win);
    if (!s.earlyBtn && travel > 15) { s.earlyBtn = true; ui.actions([{ label: C.arriveButton + ' →', cls: 'soft', onClick: () => arriveResolve() }]); }
    if (travel >= totalDur && !s.arrived) { s.arrived = true; arrive(); }
  };

  let arriveResolve; const arrived = new Promise((r) => { arriveResolve = r; });
  const arrive = async () => {
    speed = 0; scene.earlyBtn = true;
    audio.setBeds([['birds', 0.6]], 3);
    say('pt', C.arrive, 4000);
    ui.actions([{ label: C.arriveButton + ' →', cls: '', onClick: () => arriveResolve() }]);
  };

  // real footage in the window, if provided
  const placeVideo = (win) => {
    const a = scene.view.toScreen(win.x0, win.y0), b = scene.view.toScreen(win.x1, win.y1);
    Object.assign(video.style, { left: a.x + 'px', top: a.y + 'px', width: (b.x - a.x) + 'px', height: (b.y - a.y) + 'px' });
    if (credit) Object.assign(credit.style, { left: a.x + 6 + 'px', top: b.y - 18 + 'px' });
  };
  let credit = null;
  try {
    const r = await fetch(C.video, { method: 'HEAD' });
    if (r.ok && (r.headers.get('content-type') || '').startsWith('video')) {
      video = document.createElement('video');
      Object.assign(video, { src: C.video, muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto' });
      video.setAttribute('playsinline', '');
      video.style.cssText = 'position:absolute;object-fit:cover;pointer-events:none;z-index:2;filter:saturate(1.1) contrast(1.03)';
      game.stage.appendChild(video);
      if (C.videoCredit) { credit = document.createElement('div'); credit.textContent = C.videoCredit; credit.style.cssText = 'position:absolute;z-index:3;font:11px/1 Nunito,sans-serif;color:#fff;opacity:.7;text-shadow:0 1px 2px #000;pointer-events:none'; game.stage.appendChild(credit); }
      video.play().catch(() => {});
      totalDur = 60;
    }
  } catch { video = null; }
  scene.cfg.cleanup = () => { video?.remove(); credit?.remove(); };

  audio.scene('trainUp', [['train', 0.5]]);
  const done = scene.start();
  await game.enter();
  await wait(2400);
  await ui.dialog(C.intro);
  if (game.debug && new URLSearchParams(location.search).has('fast')) speed = 6;
  if (game.debug) game.trainJump = (t) => { travel = t; };
  await arrived;
  await game.leave(scene);
  await done;
}


function drawBalloon(x, cx, cy, col, s = 1) {
  const r = Math.round(7 * s);
  for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j) * (j > 0 ? 1 - j / (r * 2.2) : 1)); x.fillStyle = (j + r) % 4 < 2 ? col : light(col, 0.3); x.fillRect(cx - w, cy + j, w * 2, 1); }
  x.fillStyle = '#5a4030'; x.fillRect(cx - 3, cy + r + 1, 1, 3); x.fillRect(cx + 2, cy + r + 1, 1, 3);
  x.fillStyle = '#a8703f'; x.fillRect(cx - 3, cy + r + 4, 6, 3);
}

function drawInterior(x, s, win, dark) {
  const W = s.W, H = s.H;
  const wall = dark ? '#5a3a40' : '#8a5a48', wallL = light(wall, 0.18), wallS = shade(wall, 0.25);
  // walls around the window
  x.fillStyle = wall;
  x.fillRect(0, 0, W, win.y0); x.fillRect(0, win.y1, W, H - win.y1); x.fillRect(0, 0, win.x0, H); x.fillRect(win.x1, 0, W - win.x1, H);
  // wood panelling stripes
  for (let i = 0; i < W; i += 10) { x.fillStyle = wallS; x.fillRect(i, win.y1 + 6, 1, H); }
  x.fillStyle = '#6a3a3a'; x.fillRect(0, win.y1 + 4, W, 3);
  // window frame
  x.fillStyle = '#e8d6b8'; x.fillRect(win.x0 - 4, win.y0 - 4, win.x1 - win.x0 + 8, 4); x.fillRect(win.x0 - 4, win.y1, win.x1 - win.x0 + 8, 5); x.fillRect(win.x0 - 4, win.y0, 4, win.y1 - win.y0); x.fillRect(win.x1, win.y0, 4, win.y1 - win.y0);
  x.fillStyle = '#c9b494'; x.fillRect(Math.round((win.x0 + win.x1) / 2) - 2, win.y0, 4, win.y1 - win.y0);
  x.fillStyle = '#fff4dc'; x.fillRect(win.x0 - 4, win.y0 - 4, win.x1 - win.x0 + 8, 1);
  // curtains tied back
  x.fillStyle = '#c4587a'; x.fillRect(win.x0 - 10, win.y0 - 6, 10, win.y1 - win.y0 + 8); x.fillRect(win.x1, win.y0 - 6, 10, win.y1 - win.y0 + 8);
  x.fillStyle = '#e07a9a'; x.fillRect(win.x0 - 9, win.y0 - 6, 2, win.y1 - win.y0 + 8); x.fillRect(win.x1 + 1, win.y0 - 6, 2, win.y1 - win.y0 + 8);
  x.fillStyle = '#ffd23f'; x.fillRect(win.x0 - 11, Math.round((win.y0 + win.y1) / 2), 12, 2); x.fillRect(win.x1 - 1, Math.round((win.y0 + win.y1) / 2), 12, 2);
  // luggage rack
  x.fillStyle = '#c9a24a'; x.fillRect(0, Math.max(2, win.y0 - 12), W, 2); for (let i = 4; i < W; i += 8) x.fillRect(i, Math.max(2, win.y0 - 12), 1, 6);
  // window sill table
  x.fillStyle = '#b5794a'; x.fillRect(win.x0 + 10, win.y1 + 4, win.x1 - win.x0 - 20, 4); x.fillStyle = '#d9a066'; x.fillRect(win.x0 + 10, win.y1 + 4, win.x1 - win.x0 - 20, 1);
  // bench seat back
  const gy = s.groundY;
  x.fillStyle = '#4f6a8a'; x.fillRect(Math.round(W * 0.2), gy - 26, Math.round(W * 0.6), 20); x.fillStyle = '#6a88aa'; x.fillRect(Math.round(W * 0.2), gy - 26, Math.round(W * 0.6), 2);
  for (let i = Math.round(W * 0.2) + 6; i < W * 0.8; i += 12) { x.fillStyle = '#44607e'; x.fillRect(i, gy - 22, 1, 14); }
  x.fillStyle = '#3f5670'; x.fillRect(Math.round(W * 0.18), gy - 6, Math.round(W * 0.64), 8); x.fillStyle = '#5a7896'; x.fillRect(Math.round(W * 0.18), gy - 6, Math.round(W * 0.64), 2);
  // floor
  x.fillStyle = '#5a3e36'; x.fillRect(0, gy + 2, W, H - gy - 2);
  for (let i = 0; i < W; i += 16) { x.fillStyle = '#4a3230'; x.fillRect(i, gy + 2, 1, H); }
  // warm lamp glow in the tunnel
  if (dark) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.12; x.fillStyle = '#ffcf8a'; x.fillRect(0, 0, W, H); x.restore(); }
}

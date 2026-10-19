// Chapter 3: the car ride. The camera sits on the dashboard looking back into
// the car: Hazei (passenger, screen left) and Mino (driving, screen right) in
// the front seats, the back seat behind them, scenery through the rear window.
// (The file keeps its old name so saves and chapter ids stay the same.)
import content from '../content.js';
import { Scene2D } from '../two/engine2d.js';
import { TIMES, ditherGradient } from '../core/palette.js';
import { canvas, shade, charSprite, LOOKS, emoteSprite } from '../core/sprites.js';
import { treeSprite } from '../two/props.js';
import { audio } from '../core/audio.js';
import { ui, wait } from '../core/ui.js';

const C = content.train;

export default async function car(game) {
  let travel = 0, totalDur = 60, rideEnded = false;
  let video = null, credit = null;
  let skyC = null, skyKey = '';
  const freq = new Uint8Array(128);
  let beat = 0, emoteT = 0;
  const pe = { k: 'note', t: 0 }; // Mino's emote
  const he = { k: 'heart', t: 0 }; // Hazei's emote

  // cabin layout in pixel space
  const L = (W, H) => ({
    win: { x0: Math.round(W * 0.31), x1: Math.round(W * 0.69), y0: Math.round(H * 0.11), y1: Math.round(H * 0.28) },
    rearTop: Math.round(H * 0.3), rearBot: Math.round(H * 0.6),
    dash: Math.round(H * 0.68),
    seatL: Math.round(W * 0.3), seatR: Math.round(W * 0.7), seatW: Math.round(W * 0.25),
    sc: Math.max(2, Math.round(H / 64)),
  });

  // pixel fallback for the rear window: the road running away behind us
  function drawRoad(x, w, bob) {
    const ww = w.x1 - w.x0, hh = w.y1 - w.y0;
    x.save(); x.beginPath(); x.rect(w.x0, w.y0 + bob, ww, hh); x.clip();
    x.drawImage(skyC, w.x0, w.y0 + bob, ww, hh);
    const hz = w.y0 + bob + Math.round(hh * 0.45), vx = w.x0 + ww / 2, yb = w.y1 + bob;
    x.fillStyle = '#7fb466'; x.fillRect(w.x0, hz, ww, yb - hz);
    x.fillStyle = '#6a6870';
    for (let j = hz; j < yb; j++) { const k = (j - hz) / (yb - hz); const half = 2 + k * ww * 0.5; x.fillRect(vx - half, j, half * 2, 1); }
    for (let i = 0; i < 6; i++) { const k = ((i / 6) + travel * 0.6) % 1; const y = hz + k * k * (yb - hz); x.fillStyle = '#f4efe6'; x.fillRect(vx - 1 - k * 2, Math.round(y), 2 + k * 4, Math.max(1, Math.round(k * 4))); }
    x.restore();
  }

  const scene = new Scene2D(game, {
    id: 'train', worldW: 0, walkable: false, hazei: false, partner: false, time: 'morning',
    inputMode: 'none', action: false, groundFromBottom: 0,
    light: { bloom: 0.18, tint: 'rgba(255,230,190,0.3)' },
    drawBack(x, s) {
      const W = s.W, H = s.H, l = L(W, H), w = l.win;
      s.win = w;
      const bob = s.bob || 0;
      const key = W + 'x' + H;
      if (key !== skyKey) { [skyC] = canvas(64, 32); ditherGradient(skyC.getContext('2d'), 64, 32, TIMES.morning.sky, 0, 8); skyKey = key; }
      // headliner + cabin walls
      x.fillStyle = '#d9cfc2'; x.fillRect(0, 0, W, H);
      for (let j = 0; j < w.y0; j += 3) { x.fillStyle = '#d0c5b7'; x.fillRect(0, j, W, 1); }
      x.fillStyle = '#4a4650'; x.fillRect(0, w.y0 - 4, W, H);
      x.fillStyle = '#5a5662'; x.fillRect(0, w.y0 - 4, W, 2);
      // rear window frame (the scenery itself is the video overlay, or a pixel fallback)
      x.fillStyle = '#2a2830'; x.fillRect(w.x0 - 4, w.y0 - 4 + bob, w.x1 - w.x0 + 8, w.y1 - w.y0 + 8);
      if (!video) drawRoad(x, w, bob);
      else { x.fillStyle = '#9fc8e8'; x.fillRect(w.x0, w.y0 + bob, w.x1 - w.x0, w.y1 - w.y0); }
      // rear quarter windows with trees streaming past
      for (const side of [-1, 1]) {
        const qx0 = side < 0 ? Math.round(W * 0.06) : Math.round(W * 0.73), qx1 = side < 0 ? Math.round(W * 0.27) : Math.round(W * 0.94);
        x.save(); x.beginPath();
        if (side < 0) { x.moveTo(qx0 + 10, w.y0 + 4 + bob); x.lineTo(qx1, w.y0 + bob); x.lineTo(qx1, w.y1 + bob); x.lineTo(qx0, w.y1 + bob); }
        else { x.moveTo(qx0, w.y0 + bob); x.lineTo(qx1 - 10, w.y0 + 4 + bob); x.lineTo(qx1, w.y1 + bob); x.lineTo(qx0, w.y1 + bob); }
        x.closePath(); x.clip();
        x.drawImage(skyC, qx0, w.y0 + bob, qx1 - qx0, w.y1 - w.y0);
        const span = qx1 - qx0 + 60;
        for (let i = 0; i < 6; i++) {
          const tr = treeSprite(i % 3 ? 'round' : 'pine', 0.8, 40 + i);
          const px = qx0 - 30 + ((i * 47 + travel * 140 * -side) % span + span) % span;
          x.drawImage(tr.img, Math.round(px - tr.ox), w.y1 + bob - tr.oy + 6);
        }
        x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(qx0, w.y0 + bob, qx1 - qx0, Math.round((w.y1 - w.y0) * 0.35));
        x.restore();
      }
      // rear seat bench and headrests
      const rt = l.rearTop + bob, rb = l.rearBot + bob;
      x.fillStyle = '#6a6470'; x.fillRect(Math.round(W * 0.08), rt + 6, Math.round(W * 0.84), rb - rt);
      x.fillStyle = '#7a7480'; x.fillRect(Math.round(W * 0.08), rt + 6, Math.round(W * 0.84), 3);
      for (let i = Math.round(W * 0.12); i < W * 0.9; i += 14) { x.fillStyle = '#5e5864'; x.fillRect(i, rt + 12, 1, rb - rt - 12); }
      for (const f of [0.22, 0.5, 0.78]) { const hx = Math.round(W * f); x.fillStyle = '#5e5864'; x.fillRect(hx - 13, rt - 6, 26, 12); x.fillStyle = '#726c78'; x.fillRect(hx - 12, rt - 6, 24, 2); }
      // a teddy bear and a bag on the back seat
      const bx = Math.round(W * 0.14);
      x.fillStyle = '#c98a54'; x.fillRect(bx, rt + 14, 14, 14); x.fillRect(bx + 1, rt + 9, 4, 4); x.fillRect(bx + 9, rt + 9, 4, 4); x.fillStyle = '#3a2633'; x.fillRect(bx + 4, rt + 18, 1, 1); x.fillRect(bx + 9, rt + 18, 1, 1); x.fillStyle = '#e8b880'; x.fillRect(bx + 5, rt + 21, 4, 3);
      const gx = Math.round(W * 0.83);
      x.fillStyle = '#f08fa8'; x.fillRect(gx, rt + 16, 18, 14); x.fillStyle = '#c4587a'; x.fillRect(gx + 4, rt + 10, 10, 2); x.fillRect(gx + 4, rt + 10, 2, 6); x.fillRect(gx + 12, rt + 10, 2, 6);
      // front seats (backs) with headrests
      for (const cx of [l.seatL, l.seatR]) {
        const sw = l.seatW, top = Math.round(H * 0.43) + bob;
        x.fillStyle = '#3a3640'; x.fillRect(cx - sw / 2, top, sw, H - top); x.fillRect(cx - sw / 2 + 3, top - 3, sw - 6, 3);
        x.fillStyle = '#48444e'; x.fillRect(cx - sw / 2 + 4, top + 2, sw - 8, H - top);
        x.fillStyle = '#524e58'; x.fillRect(cx - sw / 2 + 4, top + 2, sw - 8, 2);
        const hw = Math.round(sw * 0.5), ht = Math.round(H * 0.11);
        x.fillStyle = '#3a3640'; x.fillRect(cx - hw / 2, top - ht - 6, hw, ht); x.fillStyle = '#48444e'; x.fillRect(cx - hw / 2 + 2, top - ht - 5, hw - 4, 2);
        x.fillStyle = '#9a9aa8'; x.fillRect(cx - 6, top - 6, 2, 6); x.fillRect(cx + 4, top - 6, 2, 6);
      }
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
        x.fillStyle = '#2a2830';
        const by = top + 16 * sc, len = 8 * sc, bw = Math.max(2, sc - 1);
        for (let k = 0; k < len; k++) x.fillRect(left + (p.cx === l.seatL ? 7 * sc + k : 17 * sc - k), by + Math.round(k * 0.9), bw, bw);
        if (p.emote.t > 0) { const e = emoteSprite(p.emote.k); x.drawImage(e, left + 15 * sc, top - 2 * sc, e.width * 2, e.height * 2); }
      }
      // dashboard
      const d = l.dash;
      x.fillStyle = '#2e2c34'; x.fillRect(0, d, W, H - d);
      x.fillStyle = '#3e3c46'; x.fillRect(0, d, W, 3);
      x.fillStyle = '#26242c'; x.fillRect(0, d + 3, W, 1);
      // padded top edge, glovebox on Hazei's side, air vents by the console
      x.fillStyle = '#36343e'; x.fillRect(0, d + 4, W, 5); x.fillStyle = '#44424c'; x.fillRect(0, d + 4, W, 1);
      const gb0 = Math.round(W * 0.08), gb1 = Math.round(W * 0.34);
      x.fillStyle = '#26242c'; x.fillRect(gb0, d + 16, gb1 - gb0, 1); x.fillRect(gb0, d + 16, 1, H - d); x.fillRect(gb1, d + 16, 1, H - d);
      x.fillStyle = '#4a4852'; x.fillRect(Math.round((gb0 + gb1) / 2) - 5, d + 22, 10, 2);
      const cw = Math.round(W * 0.2), cx0 = Math.round(W / 2 - cw / 2);
      for (const vx of [cx0 - 22, cx0 + cw + 4]) { x.fillStyle = '#1a1820'; x.fillRect(vx, d + 11, 18, 10); x.fillStyle = '#3a3842'; for (let k = 0; k < 4; k++) x.fillRect(vx + 1, d + 12 + k * 2 + 1, 16, 1); }
      // centre console stereo with a little equaliser
      x.fillStyle = '#1a1820'; x.fillRect(cx0, d + 6, cw, H - d - 6);
      x.fillStyle = '#0e1a22'; x.fillRect(cx0 + 3, d + 9, cw - 6, 12);
      const bars = 12, bwid = Math.floor((cw - 10) / bars);
      for (let i = 0; i < bars; i++) {
        const v = (freq[2 + i * 4] || 0) / 255; const hgt = Math.max(1, Math.round(v * 10));
        x.fillStyle = `hsl(${180 + i * 12},80%,60%)`; x.fillRect(cx0 + 5 + i * bwid, d + 20 - hgt, Math.max(1, bwid - 1), hgt);
      }
      // steering wheel in front of Mino, with his hands on it
      const wx = l.seatR, wy = d + Math.round(H * 0.12), rx = Math.round(W * 0.12), ry = Math.round(H * 0.13);
      x.strokeStyle = '#1a1820'; x.lineWidth = Math.max(4, sc + 2);
      x.beginPath(); x.ellipse(wx, wy, rx, ry, 0, Math.PI, Math.PI * 2); x.stroke();
      x.strokeStyle = '#4a4850'; x.lineWidth = 1; x.beginPath(); x.ellipse(wx, wy - 1, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
      x.fillStyle = '#1a1820'; x.fillRect(wx - 3, wy - ry, 6, ry); x.fillRect(Math.round(wx - rx * 0.6), wy - 3, Math.round(rx * 1.2), 5);
      x.fillStyle = '#c4587a'; x.fillRect(wx - 3, wy - 6, 6, 4);
      const skin = content.partnerLook.skin, sleeve = content.partnerLook.top;
      for (const side of [-1, 1]) {
        const hx = Math.round(wx + side * rx * 0.86), hy = Math.round(wy - ry * 0.55);
        x.fillStyle = sleeve; x.fillRect(hx - 3 - side * 2, hy + 3, 7, 10);
        x.fillStyle = skin; x.fillRect(hx - 3, hy - 3, 7, 7); x.fillStyle = shade(skin, 0.2); x.fillRect(hx - 3, hy + 2, 7, 1);
      }
      // rear-view mirror with a swinging flower air freshener
      const mx = Math.round(W / 2);
      // mirror sits on the windshield above the rear-window view; the freshener hangs beside it
      x.fillStyle = '#2a2830'; x.fillRect(mx - 1, 0, 2, 2); x.fillRect(mx - 22, 1, 44, 9);
      x.fillStyle = '#9fb8c8'; x.fillRect(mx - 20, 2, 40, 6); x.fillStyle = '#c8dce8'; x.fillRect(mx - 18, 2, 10, 2);
      const swing = Math.sin(s.t * 2.2 + (s.bump || 0)) * 0.35, ax0 = mx - 30;
      const fx = ax0 + Math.round(Math.sin(swing) * 9), fy = 4 + Math.round(Math.cos(swing) * 9);
      x.strokeStyle = '#e8e2d8'; x.lineWidth = 1; x.beginPath(); x.moveTo(mx - 22, 5); x.lineTo(ax0, 4); x.lineTo(fx, fy); x.stroke();
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

  // real footage in the rear window, if provided
  const placeVideo = (win) => {
    const bob = scene.bob || 0;
    const a = scene.view.toScreen(win.x0, win.y0 + bob), b = scene.view.toScreen(win.x1, win.y1 + bob);
    Object.assign(video.style, { left: a.x + 'px', top: a.y + 'px', width: (b.x - a.x) + 'px', height: (b.y - a.y) + 'px', borderRadius: Math.round(scene.view.cssScale * 3) + 'px' });
    if (credit) Object.assign(credit.style, { left: a.x + 6 + 'px', top: b.y - 16 + 'px' });
  };
  try {
    const r = await fetch(C.video, { method: 'HEAD' });
    if (r.ok && (r.headers.get('content-type') || '').startsWith('video')) {
      video = document.createElement('video');
      Object.assign(video, { src: C.video, muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto' });
      video.setAttribute('playsinline', '');
      video.style.cssText = 'position:absolute;object-fit:cover;pointer-events:none;z-index:2;filter:saturate(1.05) brightness(1.03)';
      game.stage.appendChild(video);
      video.play().catch(() => {});
      if (C.videoCredit) { credit = document.createElement('div'); credit.textContent = C.videoCredit; credit.style.cssText = 'position:absolute;z-index:3;font:10px/1 Nunito,sans-serif;color:#fff;opacity:.65;text-shadow:0 1px 2px #000;pointer-events:none'; game.stage.appendChild(credit); }
    }
  } catch { video = null; }
  scene.cfg.cleanup = () => { video?.remove(); credit?.remove(); audio.stopRecord(1.5); };

  let arriveResolve; const arrived = new Promise((r) => { arriveResolve = r; });
  const say = (who, text, ms = 2800) => {
    const l = L(scene.W, scene.H);
    const px = who === 'pt' ? l.seatR : l.seatL;
    return ui.bubble(text, () => (scene.dead ? null : scene.view.toScreen(px, scene.H * 0.22)), ms);
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
    if (video && s.win) placeVideo(s.win);
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

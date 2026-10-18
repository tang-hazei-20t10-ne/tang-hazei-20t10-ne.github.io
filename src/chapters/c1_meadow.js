// Chapter 1: dawn meadow walk.
import content from '../content.js';
import { Scene2D, drawGrassBlades } from '../two/engine2d.js';
import { TIMES, lerpTime, ditherGradient } from '../core/palette.js';
import { canvas, mix, shade } from '../core/sprites.js';
import { ridgeStrip, cloudSprite, treeSprite, drawSway, bushSprite, fence, windmillBody, drawWindmillBlades, house } from '../two/props.js';
import { groundStrip, flowerPatch, decoFlowers, addDog, addBench, Butterfly, butterflyLanding, Chicken, addExit, intro } from '../two/common.js';
import { audio } from '../core/audio.js';
import { ui, wait } from '../core/ui.js';
import { polaroid, savePhoto } from '../core/photo.js';
import { state } from '../core/state.js';

const C = content.meadow;

export default async function meadow(game) {
  const W = 980;
  const skies = [lerpTime('dawn', 'dawn', 0), lerpTime('dawn', 'morning', 0.35)];
  let skyKey = '', skyC = null;
  let progress = 0;
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 90 + Math.random() * 40, y: 12 + Math.random() * 40, s: 3 + i, sp: 1 + Math.random() * 2 }));
  const chickens = [];
  const butterflies = [];
  let ground;

  const scene = new Scene2D(game, {
    id: 'meadow', worldW: W, time: 'dawn', startX: 36,
    ambient: { motes: 2.5, petals: 0.4, petalColor: '#fff6ea' },
    light: { bloom: 0.35 },
    setup(s) {
      ground = groundStrip(W, 60, { grass: '#7fb466', path: '#e6c58f', pathY: 9, pathH: 9, seed: 3 });
    },
    drawBack(x, s) {
      const gy = s.groundY;
      // sky shifts from dawn to morning as she walks
      const k = Math.round(progress * 6) / 6;
      const key = s.W + 'x' + s.H + k;
      const pal = lerpTime('dawn', 'morning', k * 0.45);
      if (key !== skyKey) { [skyC] = canvas(s.W, s.H); ditherGradient(skyC.getContext('2d'), s.W, s.H, pal.sky, 0, 18); skyKey = key; s.pal = pal; s.vignette = null; }
      x.drawImage(skyC, 0, 0);
      // sun rises
      const sx = Math.round(s.W * 0.72 - s.cam * 0.03), sy = Math.round(gy - 66 - progress * 40);
      s.drawSun(x, sx, sy, 11, pal.sun);
      s._sun = [sx, sy];
      // clouds
      for (const c of clouds) {
        const img = cloudSprite(c.s, mix('#fff3e8', pal.sky[2], 0.25), mix(pal.sky[1], '#9a7fb8', 0.3));
        let px = ((c.x + s.t * c.sp - s.cam * 0.05) % (s.W + 120)) - 60;
        x.drawImage(img, Math.round(px), Math.round(c.y));
      }
      // layered hills with atmospheric tint
      const fog = pal.fog;
      s.drawStrip(x, ridgeStrip(420, 70, { seed: 11, base: mix('#8f7ab8', fog, 0.45), peak: 0.75, rough: 0.7, freq: 0.02, snow: false }), 0.08, gy - 82);
      s.drawStrip(x, ridgeStrip(380, 60, { seed: 21, base: mix('#7f9a8a', fog, 0.35), peak: 0.6, rough: 0.5, freq: 0.025, trees: 24, treeCol: mix('#6a8a76', fog, 0.3) }), 0.2, gy - 62);
      s.drawStrip(x, ridgeStrip(460, 50, { seed: 31, base: mix('#79a865', fog, 0.15), peak: 0.5, rough: 0.4, freq: 0.018, trees: 18, treeCol: '#5f9256' }), 0.4, gy - 44);
      // village in the distance near the end
      const vx = Math.round(820 - s.cam * 0.6);
      [[0, '#f6e3cc', '#d96a5a'], [52, '#fff1e0', '#7f9fdc'], [100, '#f3dcc0', '#c4587a']].forEach(([o, w, r], i) => { const h = house(i + 1, mix(w, fog, 0.2), mix(r, fog, 0.2), 40, 28); x.drawImage(h, vx + o, gy - 30 - h.height + 18); });
      // ground strip (world space)
      s.drawStrip(x, ground, 1, gy - 12, { wrap: false });
      // light rays from the sun
      s.drawRays(x, sx, sy, 0.07);
    },
    drawFront(x, s) {
      drawGrassBlades(x, s, s.H - 1, { density: 0.7, colors: ['#4f8f4a', '#5fa356', '#6fb45e'], height: 8, parallax: 1.2, seed: 2 });
      drawGrassBlades(x, s, s.groundY + 6, { density: 0.35, colors: ['#8fc56e', '#a6d47c'], height: 4, seed: 7 });
    },
    update(s, dt) {
      progress = Math.max(progress, Math.min(1, s.hazei.x / (W - 120)));
      // windmill blades
      s.mill = (s.mill || 0) + dt * 0.5;
      if (state.data.flowers.length && !s._toldPocket) s._toldPocket = true;
    },
  });

  // ---- props
  const T = (kind, size, seed, x, z, colors) => { const sp = treeSprite(kind, size, seed, colors); scene.addProp({ x, z, draw(ctx, camX, gy, t) { drawSway(ctx, sp, x - camX, gy + z, t, 1, x * 0.1); } }); };
  T('round', 1.2, 2, 18, -12); T('round', 0.9, 5, 120, -14, { fruit: '#ef6a5a' }); T('pine', 1.1, 3, 300, -15);
  T('round', 1.3, 8, 470, -14); T('cherry', 1.1, 4, 690, -13); T('round', 1.0, 9, 900, -14);
  scene.addProp({ x: 60, z: -11, img: bushSprite(2, '#5fae5a', '#fff6ea') });
  scene.addProp({ x: 250, z: -10, img: bushSprite(3, '#64b05a', '#f59ac0') });
  scene.addProp({ x: 560, z: -11, img: bushSprite(5, '#5fae5a', '#ffd23f') });
  scene.addProp({ x: 610, z: -9, img: fence(64) });
  scene.addProp({ x: 674, z: -9, img: fence(48) });
  // windmill
  const mill = windmillBody();
  scene.addProp({ x: 520, z: -16, draw(ctx, camX, gy) {
    const px = Math.round(520 - camX), py = Math.round(gy - 16);
    ctx.drawImage(mill, px - 18, py - 64);
    drawWindmillBlades(ctx, px, py - 52, scene.mill || 0, 28);
  } });
  decoFlowers(scene, 0, W, -10, 34, 4);
  decoFlowers(scene, 0, W, 10, 14, 8);

  // pickable flowers
  flowerPatch(scene, game, 150, 5, 60, [-7, -3], 11);
  flowerPatch(scene, game, 330, 4, 50, [-7, -3], 12);
  flowerPatch(scene, game, 740, 6, 80, [-7, -3], 13);

  // butterflies
  [[170, 0], [360, 1], [770, 2], [800, 3]].forEach(([bx], i) => butterflies.push(scene.addEntity(new Butterfly(bx, scene.groundY - 26 - i * 3))));
  scene.cfg.onResize = (s) => butterflies.forEach((b, i) => { b.ay = s.groundY - 26 - i * 3; });
  butterflyLanding(scene, butterflies, C.butterfly);

  // dog
  addDog(scene, 250, { line: C.dog });
  // bench
  addBench(scene, 420, { line: C.bench, sitLine: C.benchSit });
  // chickens near the windmill fence
  for (let i = 0; i < 4; i++) chickens.push(scene.addEntity(new Chicken(600 + i * 20, -4 + (i % 2) * 2, i === 2 ? '#e8a15c' : '#fffaf0')));
  scene.interact.add({ x: 640, range: 30, hold: 0.5, label: content.prompts.feed, onDone: () => {
    audio.sfx('pop');
    for (let i = 0; i < 14; i++) scene.spawn({ x: scene.hazei.x + 6 * scene.hazei.dir, y: scene.groundY - 14, vx: scene.hazei.dir * (10 + Math.random() * 20), vy: -20 - Math.random() * 10, g: 80, life: 0.7, color: '#f2d16b', size: 1 });
    chickens.forEach((c) => { c.feed = 3; c.feedX = scene.hazei.x + scene.hazei.dir * (14 + Math.random() * 16); });
    scene.say(scene.partner, C.chickens[Math.floor(Math.random() * C.chickens.length)], 2400);
    audio.setBeds([['birds', 1], ['wind', 0.6], ['chickens', 1]]);
  } });
  // Mino offers to take a photo of Hazei at the sunrise spot
  const askPhoto = async () => {
    const h = scene.hazei, p = scene.partner;
    h.locked = true; h.target = null;
    scene.partnerAt(h.x - 50, 'idle', 1);
    await wait(900);
    const pick = await ui.dialog([{ who: 'partner', text: C.photoAsk, choices: C.photoChoices }]);
    if (pick === 0) {
      h.dir = -1; h.forcePose = 'peace'; h.forceMood = 'happy';
      scene.partnerAt(h.x - 50, 'hold', 1);
      scene.say(p, C.photoReady, 2400);
      for (let i = 0; i < 3; i++) { audio.sfx('tick'); await wait(600); }
      // Mino is behind the camera, so he is not in the shot
      p.visible = false; scene.draw();
      const v = scene.view.canvas; const cw = Math.min(v.width, 176), ch = Math.min(v.height, 132);
      const cx = Math.max(0, Math.min(v.width - cw, Math.round(h.x - scene.cam - cw / 2))), cy = Math.max(0, Math.min(v.height - ch, scene.groundY + 22 - ch));
      const crop = document.createElement('canvas'); crop.width = cw; crop.height = ch;
      crop.getContext('2d').drawImage(v, cx, cy, cw, ch, 0, 0, cw, ch);
      p.visible = true;
      audio.sfx('shutter'); ui.flash();
      await wait(500);
      await savePhoto(polaroid(crop, C.photoCaption), { title: content.ui.photo, filename: 'hazei-binh-minh.png' });
      p.emote('thumb');
    } else scene.say(p, C.photoNo, 1600);
    h.forcePose = null; h.forceMood = null; h.locked = false; scene.partnerAt(null);
  };
  let millSaid = false, photoAsked = false;
  const ou = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    ou(s, dt);
    if (!millSaid && Math.abs(s.hazei.x - 520) < 30) { millSaid = true; s.say(s.partner, C.windmill, 3000); }
    if (!photoAsked && s.hazei.x > 470 && !s.hazei.locked && !s.interact.busy) { photoAsked = true; askPhoto(); }
  };

  addExit(scene, W - 40, C.exitSign.replace(' →', ''), { hint: C.exitHint });

  audio.scene('dawn', [['birds', 1], ['wind', 0.6]]);
  const done = scene.start();
  await intro(game, scene, C.intro);
  await done;
}

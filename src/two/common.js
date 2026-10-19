// Shared 2D gameplay pieces: flowers, pets, benches, butterflies, NPCs, exits.
import content from '../content.js';
import { canvas, flowerSprite, flowerBig, randomFlower, dogSprite, catSprite, chickenSprite, butterflySprite, pigeonSprite, duckSprite, crabSprite, light, shade, mix } from '../core/sprites.js';
import { ui, wait } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { state } from '../core/state.js';
import { input } from '../core/input.js';
import { takePhoto } from '../core/photo.js';
import { Character } from './engine2d.js';
import { bench as benchImg, signpost, rand } from './props.js';

const P = content.prompts;
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

// ---------------------------------------------------------------- ground
export function groundStrip(w, h, { grass = '#79b062', grassDark, grassLight, path = '#e2c590', pathY = 10, pathH = 8, seed = 1, edge = 'grass', speck = true } = {}) {
  const r = rand(seed);
  const [c, x] = canvas(w, h);
  const gd = grassDark || shade(grass, 0.18), gl = grassLight || light(grass, 0.25);
  x.fillStyle = grass; x.fillRect(0, 2, w, h);
  // irregular top edge
  for (let i = 0; i < w; i++) {
    const e = Math.round(Math.sin(i * 0.21) + Math.sin(i * 0.057 + 2) * 1.2 + 1.4);
    x.fillStyle = gl; x.fillRect(i, e, 1, 2);
    x.fillStyle = grass; x.fillRect(i, e + 2, 1, 1);
  }
  if (speck) for (let i = 0; i < w * h * 0.03; i++) { x.fillStyle = r() < 0.5 ? gd : gl; x.fillRect(r() * w | 0, 4 + r() * (h - 4) | 0, r() < 0.3 ? 2 : 1, 1); }
  // darker band toward bottom (depth)
  for (let j = Math.round(h * 0.65); j < h; j++) for (let i = (j % 2); i < w; i += 2) { x.fillStyle = gd; x.fillRect(i, j, 1, 1); }
  if (path) {
    const ps = shade(path, 0.15), pl = light(path, 0.3);
    for (let i = 0; i < w; i++) {
      const wob = Math.round(Math.sin(i * 0.03) * 1.2);
      x.fillStyle = path; x.fillRect(i, pathY + wob, 1, pathH);
      x.fillStyle = pl; x.fillRect(i, pathY + wob, 1, 1);
      x.fillStyle = ps; x.fillRect(i, pathY + wob + pathH - 1, 1, 1);
    }
    for (let i = 0; i < w / 6; i++) { const px = r() * w | 0, py = pathY + 2 + (r() * (pathH - 3) | 0); x.fillStyle = r() < 0.5 ? ps : pl; x.fillRect(px, py, 2, 1); }
  }
  return c;
}

// ---------------------------------------------------------------- flowers
export function flyToChip(scene, xw, yw, flower) {
  const p = scene.view.toScreen(xw - Math.round(scene.cam), yw);
  const target = ui.flowerChipRect();
  ui.flowers(state.data.flowers.length, true);
  const t = ui.flowerChipRect();
  const tx = (t.width ? t.left + t.width / 2 : innerWidth - 60), ty = (t.height ? t.top + t.height / 2 : 30);
  const c = document.createElement('canvas'); c.width = c.height = 40;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(flowerBig(flower.species, flower.color), 0, 0, 40, 40);
  Object.assign(c.style, { position: 'fixed', left: p.x - 20 + 'px', top: p.y - 20 + 'px', width: '40px', height: '40px', zIndex: 60, pointerEvents: 'none', imageRendering: 'pixelated' });
  document.body.appendChild(c);
  const dx = tx - p.x, dy = ty - p.y;
  const anim = c.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)' },
    { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 80}px) scale(1.3) rotate(-30deg)`, offset: 0.4 },
    { transform: `translate(${dx}px, ${dy}px) scale(.5) rotate(20deg)`, opacity: 0.7 },
  ], { duration: 900, easing: 'cubic-bezier(.5,0,.4,1)' });
  anim.onfinish = () => c.remove();
  void target;
}

// Adds a pickable flower prop at world x (z = depth offset).
export function addFlower(scene, game, x, z = -5, flower = randomFlower()) {
  const prop = scene.addProp({ x, z, flower, draw(ctx, camX, gy, t) {
    const sway = Math.round(Math.sin(t * 1.6 + x * 0.1) * 0.8);
    const img = flowerSprite(flower.species, flower.color, Math.max(-1, Math.min(1, sway)));
    ctx.drawImage(img, Math.round(x - camX) - 4, Math.round(gy + z) - 14);
    // gentle twinkle so pickable flowers read as interactive
    const tw = (t * 0.8 + x * 0.37) % 3;
    if (tw < 0.5) { const a = Math.sin(tw / 0.5 * Math.PI); ctx.globalAlpha = a; ctx.fillStyle = '#fffbe0'; const px = Math.round(x - camX) + 3, py = Math.round(gy + z) - 15; ctx.fillRect(px, py - 1, 1, 3); ctx.fillRect(px - 1, py, 3, 1); ctx.globalAlpha = 1; }
  } });
  const item = scene.interact.add({
    x, range: 9, hold: 0.55, label: P.pick,
    onHold: () => { scene.hazei.forcePose = 'crouch'; },
    onRelease: () => { scene.hazei.forcePose = null; },
    onDone: async () => {
      const h = scene.hazei;
      h.locked = true;
      scene.props.splice(scene.props.indexOf(prop), 1);
      scene.interact.remove(item);
      audio.sfx('pluck');
      scene.sparkles(x, scene.groundY + z - 8, 6, flower.color);
      h.forcePose = 'hold'; h.hold = 'flower'; h.dir = 1;
      await wait(500);
      game.addFlower(flower);
      flyToChip(scene, h.x + 8, scene.groundY - 20, flower);
      h.hold = null; h.forcePose = null; h.locked = false;
      const n = state.data.flowers.length;
      if (scene.partner) {
        if (state.once('firstFlowerLine')) scene.say(scene.partner, content.meadow.firstFlower);
        else if (Math.random() < 0.15) scene.say(scene.partner, pickOne(content.meadow.flowerReacts), 2000);
        scene.partner.emote(n % 3 ? 'thumb' : 'sparkle');
      }
      scene.onFlowerPicked?.(n);
    },
  });
  return prop;
}

export function flowerPatch(scene, game, x0, count, spread = 60, zRange = [-7, -3], seed = 5) {
  const r = rand(seed);
  for (let i = 0; i < count; i++) addFlower(scene, game, Math.round(x0 + (i / Math.max(1, count - 1)) * spread + (r() - 0.5) * 6), Math.round(zRange[0] + r() * (zRange[1] - zRange[0])), randomFlower(r));
}

// Non-pickable decorative flowers (drawn as a cluster sprite)
export function decoFlowers(scene, x0, x1, z, n, seed = 9) {
  const r = rand(seed);
  const list = [];
  for (let i = 0; i < n; i++) list.push({ x: x0 + r() * (x1 - x0), f: randomFlower(r), dz: Math.round(r() * 3) });
  scene.addProp({ x: x0, z, draw(ctx, camX, gy, t) {
    for (const it of list) {
      const px = Math.round(it.x - camX); if (px < -10 || px > scene.W + 10) continue;
      const sw = Math.max(-1, Math.min(1, Math.round(Math.sin(t * 1.6 + it.x * 0.1) * 0.8)));
      ctx.drawImage(flowerSprite(it.f.species, it.f.color, sw), px - 4, Math.round(gy + z + it.dz) - 14);
    }
  } });
}

// ---------------------------------------------------------------- dog
export class Dog {
  constructor(x, z = 2) { this.x = x; this.z = z; this.dir = -1; this.vx = 0; this.t = 0; this.mood = 'normal'; this.state = 'idle'; this.followT = 0; this.petting = false; this.sit = false; }
  update(dt, scene) {
    this.t += dt;
    const h = scene.hazei; const d = h.x - this.x;
    if (this.petting) { this.vx = 0; this.mood = 'happy'; this.sit = true; }
    else if (this.state === 'follow' && this.followT > 0) {
      this.followT -= dt;
      const tgt = h.x - h.dir * 34; // trot along behind Mino, out of the way
      const dd = tgt - this.x;
      this.vx = Math.abs(dd) > 4 ? Math.sign(dd) * Math.min(60, Math.abs(dd) * 2.5) : 0;
      this.mood = Math.abs(h.vx) > 1 ? 'happy' : 'normal';
      this.sit = !this.vx;
      if (this.followT <= 0) this.state = 'idle';
    } else if (Math.abs(d) < 70 && Math.abs(d) > 28) { this.vx = Math.sign(d) * 28; this.sit = false; this.mood = 'happy'; }
    else { this.vx = 0; this.sit = Math.abs(d) < 70; this.mood = Math.abs(d) < 30 ? 'happy' : 'normal'; }
    this.x += this.vx * dt;
    if (this.vx) this.dir = Math.sign(this.vx); else if (Math.abs(d) < 80) this.dir = Math.sign(d) || this.dir;
  }
  draw(ctx, camX, gy) {
    const moving = Math.abs(this.vx) > 1;
    const frame = moving ? Math.floor(this.t * 9) % 4 : (this.mood === 'happy' ? Math.floor(this.t * 6) % 2 : 0);
    const s = dogSprite(frame, this.mood, this.sit && !moving ? 'sit' : 'stand');
    const px = Math.round(this.x - camX), py = Math.round(gy + this.z);
    ctx.fillStyle = 'rgba(40,20,50,0.2)'; ctx.fillRect(px - 7, py, 14, 2);
    ctx.save(); if (this.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(s, -11, py - 15); } else ctx.drawImage(s, px - 11, py - 15); ctx.restore();
  }
}

export function addDog(scene, x, { name, line, followFor = 45 } = {}) {
  const dog = scene.addEntity(new Dog(x));
  scene.dog = dog;
  scene.interact.add({
    x, range: 15, hold: 1.1, label: P.pet,
    cond: () => { scene.interact.items.forEach((i) => { if (i.dogItem) i.x = dog.x; }); return true; },
    dogItem: true,
    onHold: (p) => {
      dog.petting = true; scene.hazei.forcePose = 'crouch'; scene.hazei.dir = Math.sign(dog.x - scene.hazei.x) || 1;
      scene.partnerAt(dog.x + (dog.x > scene.hazei.x ? 14 : -14), 'crouch');
      if (Math.random() < 0.08) scene.hearts(dog.x, scene.groundY - 14, 1);
      if (!dog._purr || scene.t - dog._purr > 0.9) { dog._purr = scene.t; audio.sfx('pet'); }
    },
    onRelease: () => { dog.petting = false; scene.hazei.forcePose = null; scene.partnerAt(null); },
    onDone: async () => {
      audio.sfx('woof'); scene.hearts(dog.x, scene.groundY - 14, 6);
      scene.hazei.forcePose = 'crouch'; scene.hazei.forceMood = 'happy';
      await wait(900);
      dog.petting = false; scene.hazei.forcePose = null; scene.hazei.forceMood = null;
      scene.partnerAt(null);
      if (line && state.once('dogLine' + scene.cfg.id)) scene.say(scene.partner, line, 3200);
      scene.partner?.emote('laugh');
      dog.state = 'follow'; dog.followT = followFor;
    },
  });
  return dog;
}

// ---------------------------------------------------------------- cat
export class Cat {
  constructor(x, z = 0, color = 'grey', dy = 0) { this.x = x; this.z = z; this.dy = dy; this.t = 0; this.color = color; this.happy = 0; this.dir = 1; }
  update(dt) { this.t += dt; if (this.happy > 0) this.happy -= dt; }
  draw(ctx, camX, gy) {
    const s = this.happy > 0 ? catSprite('happy', Math.floor(this.t * 3) % 2, this.color) : catSprite('sleep', Math.floor(this.t * 0.8) % 2, this.color);
    const px = Math.round(this.x - camX), py = Math.round(gy + this.z + this.dy);
    ctx.drawImage(s, px - 9, py - 13);
    if (this.happy <= 0 && Math.floor(this.t * 0.7) % 3 === 0) { ctx.fillStyle = '#9fb0e8'; const k = (this.t * 0.7) % 1; ctx.globalAlpha = 1 - k; ctx.fillRect(px + 6 + Math.round(k * 4), py - 16 - Math.round(k * 8), 3, 1); ctx.fillRect(px + 8 + Math.round(k * 4), py - 15 - Math.round(k * 8), 1, 1); ctx.fillRect(px + 6 + Math.round(k * 4), py - 14 - Math.round(k * 8), 3, 1); ctx.globalAlpha = 1; }
  }
}

export function addCat(scene, x, { z = 0, dy = 0, color = 'grey', line, standX } = {}) {
  const cat = scene.addEntity(new Cat(x, z, color, dy));
  scene.interact.add({
    x: standX ?? x, range: 16, hold: 1.0, label: P.pet,
    onHold: () => { scene.hazei.forcePose = dy < -4 ? 'pet' : 'crouch'; cat.happy = 0.5; if (!cat._p || scene.t - cat._p > 1.2) { cat._p = scene.t; audio.sfx('purr'); } },
    onRelease: () => { scene.hazei.forcePose = null; },
    onDone: async () => {
      audio.sfx('meow'); cat.happy = 3; scene.hearts(x, scene.groundY + z + dy - 12, 5);
      scene.hazei.forceMood = 'happy'; await wait(800); scene.hazei.forceMood = null; scene.hazei.forcePose = null;
      if (line) scene.say(scene.partner || scene.hazei, line, 2600);
      scene.partner?.emote('laugh');
    },
  });
  return cat;
}

// ---------------------------------------------------------------- bench
export function addBench(scene, x, { z = -3, line, sitLine, onSit, onStand } = {}) {
  const img = benchImg();
  scene.addProp({ x, z, img });
  let sitting = false;
  const sit = async () => {
    const h = scene.hazei;
    sitting = true; h.locked = true; h.target = null;
    h.x = x - 17; h.z = z + 1; h.dy = -6; h.forcePose = 'sit'; h.dir = 1;
    scene.partnerAt(x + 19, 'sit', -1);
    if (scene.partner) { scene.partner._sitZ = true; }
    audio.sfx('pop');
    if (line && state.once('bench' + scene.cfg.id + x)) scene.say(scene.partner, line, 2600);
    await wait(1200);
    if (sitLine) ui.note(sitLine, 3000);
    scene.partner?.emote('note');
    onSit?.();
  };
  const stand = () => {
    const h = scene.hazei; sitting = false;
    h.dy = 0; h.z = 0; h.forcePose = null; h.locked = false;
    scene.partnerAt(null); onStand?.();
  };
  scene.interact.add({ x, range: 22, hold: 0.3, label: () => (sitting ? P.stand : P.sit), onDone: () => (sitting ? stand() : sit()) });
  // partner sitting offset handled through a draw hook
  const origUpdate = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    origUpdate?.(s, dt);
    const p = s.partner;
    if (p) { const seated = p.override && p.override.pose === 'sit' && Math.abs(p.x - p.override.x) < 2; p.dy = seated ? -6 : 0; p.z = seated ? z : -2; }
    if (sitting && input.moveX !== 0) stand();
  };
  return { get sitting() { return sitting; }, stand };
}

// ---------------------------------------------------------------- butterflies
export class Butterfly {
  constructor(x, y, color) { this.ax = x; this.ay = y; this.x = x; this.y = y; this.t = Math.random() * 10; this.color = color || ['#f6c45f', '#f59ac0', '#9ec1ff', '#ffffff'][Math.floor(Math.random() * 4)]; this.landed = null; this.z = 20; }
  update(dt, scene) {
    this.t += dt;
    if (this.landed) {
      const h = scene.hazei;
      const tx = h.x + 9 * h.dir, ty = scene.groundY - 16;
      this.x += (tx - this.x) * Math.min(1, dt * 3); this.y += (ty - this.y) * Math.min(1, dt * 3);
      if (Math.abs(h.vx) > 1) this.landed = null;
      return;
    }
    this.x = this.ax + Math.sin(this.t * 0.7) * 22 + Math.sin(this.t * 2.3) * 4;
    this.y = this.ay + Math.sin(this.t * 1.3) * 8 + Math.sin(this.t * 5) * 2;
  }
  draw(ctx, camX, gy) {
    const s = butterflySprite(this.landed ? Math.floor(this.t * 2) % 2 : Math.floor(this.t * 10) % 2, this.color);
    ctx.drawImage(s, Math.round(this.x - camX - 4), Math.round(this.y - 3));
  }
}

// Butterflies that land on Hazei's hand if she stands still near them.
export function butterflyLanding(scene, butterflies, line) {
  let stillT = 0;
  const orig = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    orig?.(s, dt);
    const h = s.hazei;
    if (Math.abs(h.vx) < 1 && !h.locked) stillT += dt; else stillT = 0;
    if (stillT > 2.2) {
      const b = butterflies.find((b) => !b.landed && Math.abs(b.x - h.x) < 50);
      if (b) {
        b.landed = true; stillT = -6;
        h.forcePose = 'hold'; h.dir = h.dir || 1;
        setTimeout(() => { if (h.forcePose === 'hold' && !h.hold) h.forcePose = null; }, 3500);
        audio.sfx('sparkle');
        if (state.once('butterfly' + s.cfg.id) && line) s.say(s.partner || s.hazei, line, 3000);
        s.partner?.emote('wow');
      }
    }
  };
}

// ---------------------------------------------------------------- simple critters
export class Chicken {
  constructor(x, z, color) { this.x = x; this.hx = x; this.z = z; this.t = Math.random() * 5; this.dir = 1; this.vx = 0; this.color = color || '#fffaf0'; this.next = 1 + Math.random() * 2; this.peck = 0; this.feed = 0; }
  update(dt, scene) {
    this.t += dt; this.next -= dt;
    if (this.feed > 0) { this.feed -= dt; const tx = this.feedX; this.vx = Math.abs(tx - this.x) > 3 ? Math.sign(tx - this.x) * 25 : 0; if (!this.vx) this.peck = 0.3; }
    else if (this.next < 0) { this.next = 1 + Math.random() * 2.5; const r = Math.random(); if (r < 0.4) { this.vx = (Math.random() < 0.5 ? -1 : 1) * 14; } else { this.vx = 0; if (r < 0.8) this.peck = 0.8; } }
    if (this.peck > 0) this.peck -= dt;
    this.x += this.vx * dt;
    if (Math.abs(this.x - this.hx) > 40 && this.feed <= 0) this.vx = Math.sign(this.hx - this.x) * 14;
    if (this.vx) this.dir = Math.sign(this.vx);
  }
  draw(ctx, camX, gy) {
    const f = this.peck > 0 ? (Math.floor(this.t * 6) % 2 ? 2 : 0) : (Math.abs(this.vx) > 0 ? Math.floor(this.t * 8) % 2 : 0);
    const s = chickenSprite(f, this.color);
    const px = Math.round(this.x - camX), py = Math.round(gy + this.z);
    ctx.save(); if (this.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(s, -6, py - 11); } else ctx.drawImage(s, px - 6, py - 11); ctx.restore();
  }
}

export class Pigeon {
  constructor(x, z) { this.x = x; this.z = z; this.t = Math.random() * 5; this.fly = 0; this.y = 0; this.vx = 0; this.dir = Math.random() < 0.5 ? -1 : 1; this.home = x; }
  update(dt, scene) {
    this.t += dt;
    const h = scene.hazei;
    if (!this.fly && h && Math.abs(h.x - this.x) < 18 && Math.abs(h.vx) > 1) { this.fly = 1; this.vx = (this.x > h.x ? 1 : -1) * (30 + Math.random() * 20); this.vy = -40; audio.sfx('whoosh'); if (!scene._pigeonLine && scene.partner) { scene._pigeonLine = true; scene.say(scene.partner, content.market.pigeons, 2200); } }
    if (this.fly) {
      this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 10 * dt; this.dir = Math.sign(this.vx);
      if (this.y < -140) { this.fly = 0; this.y = 0; this.x = this.home + (Math.random() - 0.5) * 60; this.vx = 0; }
    } else if (Math.random() < dt * 0.4) { this.dir *= -1; }
  }
  draw(ctx, camX, gy) {
    const f = this.fly ? 2 + (Math.floor(this.t * 10) % 2) : Math.floor(this.t * 2) % 2;
    const s = pigeonSprite(f);
    const px = Math.round(this.x - camX), py = Math.round(gy + this.z + this.y);
    ctx.save(); if (this.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(s, -6, py - 9); } else ctx.drawImage(s, px - 6, py - 9); ctx.restore();
  }
}

export class Crab {
  constructor(x, z) { this.x = x; this.z = z; this.t = 0; this.vx = 12; this.home = x; this.hide = 0; }
  update(dt, scene) {
    this.t += dt;
    if (Math.abs(this.x - this.home) > 30) this.vx = -Math.sign(this.x - this.home) * 12;
    if (Math.random() < dt * 0.3) this.vx = -this.vx;
    this.x += this.vx * dt;
  }
  draw(ctx, camX, gy) { ctx.drawImage(crabSprite(Math.floor(this.t * 8) % 2), Math.round(this.x - camX) - 6, Math.round(gy + this.z) - 8); }
}

export class Duck {
  constructor(x, y) { this.x = x; this.y = y; this.home = x; this.t = Math.random() * 4; this.dir = 1; this.vx = 6; this.target = null; }
  update(dt) {
    this.t += dt;
    if (this.target != null) { const d = this.target - this.x; this.vx = Math.abs(d) > 2 ? Math.sign(d) * 16 : 0; if (!this.vx) this.target = null; }
    else if (Math.abs(this.x - this.home) > 26) this.vx = -Math.sign(this.x - this.home) * 6;
    this.x += this.vx * dt; if (this.vx) this.dir = Math.sign(this.vx);
  }
  draw(ctx, camX) {
    const px = Math.round(this.x - camX), py = Math.round(this.y + Math.sin(this.t * 2) * 0.6);
    const s = duckSprite(Math.floor(this.t * 2) % 2);
    ctx.save(); if (this.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(s, -6, py - 8); } else ctx.drawImage(s, px - 6, py - 8); ctx.restore();
  }
}

// ---------------------------------------------------------------- NPC
export function addNPC(scene, look, x, { z = -4, dir = -1, lines = [], label = P.talk, onTalk, idle = true, pose } = {}) {
  const npc = scene.addEntity(new Character(look, x, { z, dir }));
  npc.update = ((orig) => function (dt) { this.vx = 0; orig.call(this, dt); if (pose) this.forcePose = pose; })(npc.update);
  let i = 0;
  if (lines.length || onTalk) {
    scene.interact.add({ x, range: 16, hold: 0, label, onDone: async () => {
      npc.dir = Math.sign(scene.hazei.x - npc.x) || dir;
      if (onTalk) await onTalk(npc, i);
      else { scene.say(npc, lines[i % lines.length], 3000); }
      i++;
      setTimeout(() => { npc.dir = dir; }, 3500);
    } });
  }
  return npc;
}

// ---------------------------------------------------------------- exit
export function addExit(scene, x, text, { hint, onExit } = {}) {
  const img = signpost();
  scene.addProp({ x: x + 8, z: -8, img });
  scene.addProp({ x: x + 8, z: -7, draw(ctx, camX, gy) {
    // small glowing arrow hint above sign
    const px = Math.round(x + 8 - camX), py = Math.round(gy - 40 + Math.sin(scene.t * 3) * 2);
    ctx.fillStyle = '#fff6ea'; ctx.fillRect(px - 2, py, 5, 1); ctx.fillRect(px - 1, py + 1, 3, 1); ctx.fillRect(px, py + 2, 1, 1);
  } });
  let hinted = false;
  const orig = scene.cfg.update;
  scene.cfg.update = (s, dt) => {
    orig?.(s, dt);
    if (!hinted && hint && s.hazei.x > x - 70) { hinted = true; s.partner ? s.say(s.partner, hint, 3400) : ui.note(hint); }
  };
  // the prompt covers everything from the sign to the end of the map, so walking past it doesn't lose it
  const lo = x + 8 - 18, hi = Math.max(x + 8 + 18, scene.maxX ?? 0);
  scene.interact.add({ x: (lo + hi) / 2, range: (hi - lo) / 2, hold: 0.35, label: `${content.prompts.next}: ${text}`, onDone: onExit || (() => scene.game.leave(scene)) });
}

// Shared intro: fade in, title card, partner lines.
export async function intro(game, scene, lines, { delay = 2400, photo = true } = {}) {
  await game.enter();
  await wait(delay);
  if (lines?.length) await ui.dialog(lines);
  ui.controlsHint(input.touch ? content.ui.controls2DTouch : content.ui.controls2D);
  if (photo) ui.actions([{ label: '📷 ' + content.ui.photo, onClick: () => takePhoto(scene.view.canvas, content.chapters[game.chapterIndex].title, content.ui.photo) }]);
}

// 2D side-view scene engine: pixel view, characters, partner AI, particles,
// lighting and the shared interaction system.
import content from '../content.js';
import { canvas, charSprite, LOOKS, emoteSprite, heartSprite, petalSprite, mix } from '../core/sprites.js';
import { TIMES, ditherGradient } from '../core/palette.js';
import { input } from '../core/input.js';
import { ui } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { Interactor } from '../core/interact.js';
import { state } from '../core/state.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- view
export class PixelView {
  constructor(stage) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hidden';
    stage.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
  }
  resize() {
    const dpr = Math.min(3, devicePixelRatio || 1);
    const cw = innerWidth, ch = innerHeight;
    const portrait = ch > cw * 1.1;
    const target = portrait ? 300 : 192;
    const physH = ch * dpr, physW = cw * dpr;
    const scale = Math.max(1, Math.round(physH / target));
    this.scale = scale; this.dpr = dpr;
    this.H = Math.ceil(physH / scale); this.W = Math.ceil(physW / scale);
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.cssScale = scale / dpr;
    this.canvas.style.width = this.W * this.cssScale + 'px';
    this.canvas.style.height = this.H * this.cssScale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    this.onResize?.();
  }
  show(on) { this.canvas.classList.toggle('hidden', !on); }
  toScreen(px, py) {
    const ox = (innerWidth - this.W * this.cssScale) / 2, oy = (innerHeight - this.H * this.cssScale) / 2;
    return { x: ox + px * this.cssScale, y: oy + py * this.cssScale };
  }
  toPixel(cx, cy) {
    const ox = (innerWidth - this.W * this.cssScale) / 2, oy = (innerHeight - this.H * this.cssScale) / 2;
    return { x: (cx - ox) / this.cssScale, y: (cy - oy) / this.cssScale };
  }
}

// ---------------------------------------------------------------- character
export class Character {
  constructor(look, x, opts = {}) {
    this.look = look; this.x = x; this.z = opts.z || 0; this.dy = 0;
    this.dir = opts.dir || 1; this.vx = 0; this.speed = opts.speed || 40;
    this.pose = 'idle'; this.frame = 0; this.animT = Math.random() * 3; this.mood = 'normal';
    this.blinkT = 2 + Math.random() * 3; this.emoteK = null; this.emoteT = 0;
    this.hat = false; this.sunglasses = false; this.hold = null;
    this.forcePose = null; this.forceMood = null;
    this.target = null; this.visible = true;
  }
  emote(kind, dur = 1.8) { this.emoteK = kind; this.emoteT = dur; this.emoteMax = dur; }
  update(dt) {
    this.animT += dt;
    this.blinkT -= dt;
    if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 3.5;
    if (this.emoteT > 0) this.emoteT -= dt;
    const moving = Math.abs(this.vx) > 1;
    this.x += this.vx * dt;
    if (moving) this.dir = Math.sign(this.vx);
    if (this.forcePose) { this.pose = this.forcePose; this.frame = Math.floor(this.animT * 4) % 4; }
    else if (moving) { this.pose = 'walk'; this.frame = Math.floor(this.animT * 7) % 4; }
    else { this.pose = 'idle'; this.frame = Math.floor(this.animT * 1.4) % 2; }
    this.mood = this.forceMood || (this.blinkT < 0 ? 'blink' : 'normal');
  }
  sprite() {
    return charSprite(this.look, { pose: this.pose, frame: this.pose === 'idle' || this.pose === 'walk' ? this.frame : this.frame % 2, mood: this.mood, hat: this.hat, sunglasses: this.sunglasses, hold: this.hold });
  }
  draw(x, camX, groundY) {
    if (!this.visible) return;
    const s = this.sprite();
    const px = Math.round(this.x - camX), py = Math.round(groundY + this.z + this.dy);
    // soft shadow
    if (this.dy > -4) { x.fillStyle = 'rgba(40,20,50,0.22)'; x.fillRect(px - 6, py, 12, 2); x.fillRect(px - 4, py + 2, 8, 1); }
    x.save();
    if (this.dir < 0) { x.translate(px, 0); x.scale(-1, 1); x.drawImage(s, -12, py - 28); }
    else x.drawImage(s, px - 12, py - 28);
    x.restore();
    if (this.emoteT > 0) {
      const e = emoteSprite(this.emoteK);
      const k = 1 - this.emoteT / this.emoteMax;
      const pop = k < 0.1 ? Math.round((0.1 - k) * 30) : 0;
      const bob = Math.round(Math.sin(this.animT * 4) * 1);
      x.drawImage(e, px - 6 + this.dir * 6, py - 46 + pop + bob - (this.pose === 'sit' ? -4 : 0));
    }
  }
}

// ---------------------------------------------------------------- scene
export class Scene2D {
  constructor(game, cfg) {
    this.game = game; this.cfg = cfg; game.current = this;
    this.view = game.view2d;
    this.worldW = cfg.worldW || 800;
    this.timeName = cfg.time || 'morning';
    this.pal = TIMES[this.timeName];
    this.props = []; this.entities = []; this.particles = [];
    this.t = 0; this.cam = 0; this.dead = false;
    this.interact = new Interactor();
    this.walkable = cfg.walkable ?? true;
    this.minX = cfg.minX ?? 16; this.maxX = cfg.maxX ?? this.worldW - 16;
    if (cfg.hazei !== false) {
      this.hazei = new Character(LOOKS.hazei(), cfg.startX ?? 40, { speed: 42 });
      this.hazei.hat = state.data.outfit.hat; this.hazei.sunglasses = state.data.outfit.glasses;
      this.entities.push(this.hazei);
    }
    if (cfg.partner !== false) {
      this.partner = new Character(LOOKS.partner(), (cfg.startX ?? 40) - 18, { z: -2, speed: 44 });
      this.partner.lag = 0;
      this.entities.push(this.partner);
    }
    this.cam = this.hazei ? Math.max(0, this.hazei.x - this.view.W / 2) : 0;
    this.offTap = input.onTap((cx, cy) => this.onTap(cx, cy));
    this.vignette = null;
    this.view.onResize = () => { this.vignette = null; this.skyKey = null; this.cfg.onResize?.(this); };
    this.idleT = 0;
  }

  get W() { return this.view.W; }
  get H() { return this.view.H; }
  get groundY() { return this.H - (this.cfg.groundFromBottom ?? 30); }

  // ---------------------------------------------------------- helpers
  addProp(p) { this.props.push(p); return p; }
  addEntity(e) { this.entities.push(e); return e; }
  say(ch, text, ms = 2800) {
    return ui.bubble(text, () => (this.dead ? null : this.view.toScreen(ch.x - Math.round(this.cam), this.groundY + ch.z + ch.dy - 34)), ms);
  }
  sayAt(xw, yw, text, ms = 2800) { return ui.bubble(text, () => (this.dead ? null : this.view.toScreen(xw - Math.round(this.cam), yw)), ms); }
  react(kind, text) {
    if (!this.partner) return;
    this.partner.emote(kind);
    if (text) this.say(this.partner, text);
  }
  hearts(xw, yw, n = 4) {
    for (let i = 0; i < n; i++) this.spawn({ x: xw + (Math.random() - 0.5) * 10, y: yw - Math.random() * 4, vx: (Math.random() - 0.5) * 10, vy: -14 - Math.random() * 10, life: 1.6 + Math.random() * 0.6, sprite: heartSprite(['#ef5a7a', '#f590a8', '#ffb3c6'][i % 3]), wobble: 1 });
  }
  sparkles(xw, yw, n = 8, col = '#fff2b0') {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 10 + Math.random() * 25; this.spawn({ x: xw, y: yw, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, life: 0.6 + Math.random() * 0.5, color: col, size: 1, glow: true, drag: 2 }); }
  }
  spawn(p) { p.age = 0; this.particles.push(p); return p; }
  distTo(xw) { return Math.abs((this.hazei?.x ?? 0) - xw); }

  // Places the partner beside Hazei (pose: 'idle'|'sit'|'crouch'), or clears it.
  partnerAt(x, pose = 'idle', dir) { if (this.partner) this.partner.override = x == null ? null : { x, pose, dir }; }

  onTap(cx, cy) {
    if (!this.hazei || !this.walkable || this.hazei.locked) return;
    const p = this.view.toPixel(cx, cy);
    this.hazei.target = Math.max(this.minX, Math.min(this.maxX, p.x + Math.round(this.cam)));
  }

  addExit(x, signText, onExit) {
    this.addProp({ x, z: -6, img: this.cfg.signImg, kind: 'sign' });
    this.interact.add({ label: content.prompts.next, range: 16, hold: 0.35, x, onDone: onExit || (() => this.finish()) });
  }

  // ---------------------------------------------------------- loop
  start() {
    this.view.show(true);
    input.setMode(this.cfg.inputMode || (this.walkable ? '2d' : 'none'), { action: this.cfg.action !== false });
    this.cfg.setup?.(this);
    this.update(0.016);
    this.draw();
    this.done = new Promise((r) => { this._resolve = r; });
    this.last = performance.now();
    const loop = () => {
      if (this.dead) return;
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (this.game.paused) return;
      this.update(dt); this.draw();
    };
    this.raf = requestAnimationFrame(loop);
    return this.done;
  }
  finish(v) {
    if (this.dead) return;
    this.dead = true; cancelAnimationFrame(this.raf);
    this.offTap?.(); this.interact.clear(); ui.prompt(null); ui.actions(null); ui.clearBubbles();
    this.view.onResize = null;
    this.cfg.cleanup?.(this);
    this._resolve?.(v);
  }

  update(dt) {
    this.t += dt;
    const h = this.hazei;
    if (h) {
      let mx = h.locked ? 0 : input.moveX;
      if (mx) h.target = null;
      if (!mx && h.target != null && !h.locked) {
        const d = h.target - h.x;
        if (Math.abs(d) < 2) h.target = null; else mx = Math.sign(d);
      }
      h.vx = this.walkable ? mx * h.speed : 0;
      h.update(dt);
      h.x = Math.max(this.minX, Math.min(this.maxX, h.x));
      if (Math.abs(h.vx) > 1) { this.idleT = 0; if (Math.floor(h.animT * 7) % 2 === 0 && !this._stepped) { this._stepped = true; } else if (Math.floor(h.animT * 7) % 2) this._stepped = false; } else this.idleT += dt;
    }
    if (this.partner) this.updatePartner(dt);
    for (const e of this.entities) if (e !== h && e !== this.partner) e.update?.(dt, this);
    this.cfg.update?.(this, dt);
    // particles
    const wind = Math.sin(this.t * 0.6) * 6 + 8;
    for (const p of this.particles) {
      p.age += dt;
      if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
      p.vy += (p.g || 0) * dt;
      p.x += (p.vx + (p.windy ? wind : 0)) * dt + (p.wobble ? Math.sin(p.age * 6) * 0.3 : 0);
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    this.ambient(dt);
    // camera
    if (h) {
      const look = this.cfg.lookAhead ?? 0.12;
      const tgt = Math.max(0, Math.min(this.worldW - this.W, h.x - this.W / 2 + h.dir * this.W * look));
      this.cam += (tgt - this.cam) * Math.min(1, dt * 2.2);
      if (this.worldW <= this.W) this.cam = -(this.W - this.worldW) / 2;
    }
    if (h) this.interact.update(dt, (it) => Math.abs(h.x - it.x));
  }

  updatePartner(dt) {
    const p = this.partner, h = this.hazei;
    if (!h) { p.vx = 0; p.update(dt); return; }
    const o = p.override;
    if (o) {
      const d = o.x - p.x;
      if (Math.abs(d) > 1.5) { p.forcePose = null; p.vx = Math.sign(d) * Math.min(p.speed * 1.2, Math.abs(d) * 4 + 10); }
      else { p.vx = 0; p.x = o.x; p.forcePose = o.pose === 'idle' ? null : o.pose; if (o.dir) p.dir = o.dir; else p.dir = Math.sign(h.x - p.x) || p.dir; }
      p.update(dt);
      if (!p.vx && o.dir) p.dir = o.dir; else if (!p.vx) p.dir = Math.sign(h.x - p.x) || p.dir;
      return;
    }
    p.forcePose = null;
    const behind = h.x - h.dir * 16;
    const d = behind - p.x;
    const hMoving = Math.abs(h.vx) > 1;
    if (hMoving) p.lag += dt; else p.lag = 0;
    if (Math.abs(d) > 3 && (p.lag > 0.25 || !hMoving)) {
      p.vx = Math.sign(d) * Math.min(p.speed * 1.15, Math.abs(d) * 3 + 6);
    } else p.vx = 0;
    p.update(dt);
    if (!p.vx) p.dir = Math.sign(h.x - p.x) || p.dir;
    p.x = Math.max(this.minX - 10, Math.min(this.maxX + 10, p.x));
    // idle chatter: tiny random emote when standing still a while
    if (!hMoving && this.idleT > 6 && Math.random() < dt * 0.08 && p.emoteT <= 0) p.emote(['thumb', 'note', 'laugh', 'sparkle'][Math.floor(Math.random() * 4)]);
  }

  ambient(dt) {
    const a = this.cfg.ambient || {};
    if (reduced) return;
    const camX = this.cam;
    if (a.petals && Math.random() < dt * a.petals) this.spawn({ x: camX + Math.random() * (this.W + 60) - 30, y: -4, vx: -6 + Math.random() * 4, vy: 8 + Math.random() * 6, windy: true, life: 14, sprite: petalSprite(a.petalColor || ['#ffc2d4', '#ffd9e4', '#fff0f5'][Math.floor(Math.random() * 3)], Math.floor(Math.random() * 2)), wobble: 1, layer: 'front' });
    if (a.motes && Math.random() < dt * a.motes) this.spawn({ x: camX + Math.random() * this.W, y: this.groundY - Math.random() * this.H * 0.7, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, life: 5 + Math.random() * 4, color: a.moteColor || '#fff4c8', size: 1, glow: true, twinkle: true, wobble: 1 });
    if (a.fireflies && Math.random() < dt * a.fireflies) this.spawn({ x: camX + Math.random() * this.W, y: this.groundY - 4 - Math.random() * 50, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4, life: 6 + Math.random() * 4, color: '#e9ff9a', size: 1, glow: 2, twinkle: true, wobble: 1 });
    if (a.leaves && Math.random() < dt * a.leaves) this.spawn({ x: camX + this.W + 10, y: Math.random() * this.groundY, vx: -12 - Math.random() * 8, vy: 4, windy: true, life: 16, sprite: petalSprite(['#9bd770', '#f6c45f', '#7fbf6a'][Math.floor(Math.random() * 3)], Math.floor(Math.random() * 2)), wobble: 1, layer: 'front' });
  }

  // ---------------------------------------------------------- drawing
  skyCanvas() {
    const key = this.W + 'x' + this.H + this.timeName + (this.cfg.skyStops || this.pal.sky).join();
    if (this.skyKey === key) return this._sky;
    const [c, x] = canvas(this.W, this.H);
    ditherGradient(x, this.W, this.H, this.cfg.skyStops || this.pal.sky, 0, 18);
    this._sky = c; this.skyKey = key;
    return c;
  }
  drawStrip(x, strip, parallax, y, { wrap = true, offset = 0 } = {}) {
    const sx = Math.round(this.cam * parallax + offset);
    if (!wrap) { x.drawImage(strip, -sx, Math.round(y)); return; }
    const w = strip.width;
    let start = -(((sx % w) + w) % w);
    for (let px = start; px < this.W; px += w) x.drawImage(strip, px, Math.round(y));
  }
  drawSun(x, sx, sy, r = 10, col) {
    const c = col || this.pal.sun;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 5; i >= 1; i--) {
      x.globalAlpha = 0.05; x.fillStyle = mix(c, this.pal.fog, 0.4);
      const rr = r + i * 7;
      for (let j = -rr; j <= rr; j += 1) { const w = Math.round(Math.sqrt(rr * rr - j * j)); x.fillRect(sx - w, sy + j, w * 2, 1); }
    }
    x.restore();
    x.fillStyle = c;
    for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(sx - w, sy + j, w * 2, 1); }
  }
  drawRays(x, sx, sy, alpha = 0.06, col) {
    if (reduced && alpha > 0.04) alpha = 0.04;
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = col || this.pal.light;
    for (let i = 0; i < 6; i++) {
      const a0 = 0.5 + i * 0.32 + Math.sin(this.t * 0.15 + i) * 0.05;
      const w = 0.06 + (i % 3) * 0.03;
      x.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(this.t * 0.4 + i * 1.7));
      const L = this.W * 1.6;
      x.beginPath(); x.moveTo(sx, sy);
      x.lineTo(sx + Math.cos(a0) * L, sy + Math.sin(a0) * L);
      x.lineTo(sx + Math.cos(a0 + w) * L, sy + Math.sin(a0 + w) * L);
      x.closePath(); x.fill();
    }
    x.restore();
  }
  drawWorld(x) {
    const camX = Math.round(this.cam), gy = this.groundY;
    const list = [...this.props, ...this.entities].filter((o) => !o.hidden);
    list.sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const o of list) {
      if (o instanceof Character) { o.draw(x, camX, gy); continue; }
      if (o.draw) { o.draw(x, camX, gy, this.t, this); continue; }
      if (!o.img) continue;
      const px = Math.round(o.x - camX), py = Math.round(gy + (o.z || 0) + (o.dy || 0));
      const w = o.img.width;
      if (px + w < -40 || px - w > this.W + 40) continue;
      x.drawImage(o.img, px - Math.round(o.ax ?? w / 2), py - (o.ay ?? o.img.height));
    }
  }
  drawParticles(x, layer) {
    const camX = Math.round(this.cam);
    for (const p of this.particles) {
      if ((p.layer || 'mid') !== layer) continue;
      const k = p.age / p.life;
      const fade = k > 0.8 ? (1 - k) / 0.2 : k < 0.08 ? k / 0.08 : 1;
      const px = Math.round(p.x - (p.screen ? 0 : camX)), py = Math.round(p.y);
      if (p.sprite) { x.globalAlpha = fade; x.drawImage(p.sprite, px - (p.sprite.width >> 1), py - (p.sprite.height >> 1)); x.globalAlpha = 1; continue; }
      let a = fade;
      if (p.twinkle) a *= 0.5 + 0.5 * Math.sin(p.age * 5 + p.x);
      if (p.glow) { x.globalAlpha = a * 0.25; x.fillStyle = p.color; x.fillRect(px - 1, py - 1, 3, 3); if (p.glow === 2) { x.globalAlpha = a * 0.12; x.fillRect(px - 2, py - 2, 5, 5); } }
      x.globalAlpha = a; x.fillStyle = p.color; x.fillRect(px, py, p.size || 1, p.size || 1);
      x.globalAlpha = 1;
    }
  }
  post(x) {
    const L = this.cfg.light || {};
    // color grade
    if (L.tint !== false) { x.save(); x.globalCompositeOperation = 'soft-light'; x.fillStyle = L.tint || this.pal.tint.replace(/[\d.]+\)$/, '0.5)'); x.fillRect(0, 0, this.W, this.H); x.restore(); }
    // bloom: square the image (multiply) to keep highlights, blur by downscale, screen it back
    if (L.bloom !== 0) {
      const bw = Math.max(1, Math.round(this.W / 4)), bh = Math.max(1, Math.round(this.H / 4));
      if (!this.bloomC || this.bloomC.width !== bw || this.bloomC.height !== bh) { this.bloomC = document.createElement('canvas'); this.bloomC.width = bw; this.bloomC.height = bh; this.bloomX = this.bloomC.getContext('2d'); this.bloomX.imageSmoothingEnabled = true; }
      const bx = this.bloomX;
      bx.globalCompositeOperation = 'copy'; bx.drawImage(this.view.canvas, 0, 0, bw, bh);
      bx.globalCompositeOperation = 'multiply'; bx.drawImage(this.bloomC, 0, 0); bx.drawImage(this.bloomC, 0, 0); bx.drawImage(this.bloomC, 0, 0);
      x.save(); x.imageSmoothingEnabled = true; x.globalCompositeOperation = 'screen'; x.globalAlpha = L.bloom ?? 0.3;
      x.drawImage(this.bloomC, 0, 0, this.W, this.H); x.restore();
      x.imageSmoothingEnabled = false;
    }
    // vignette
    if (!this.vignette) {
      const [c, vx] = canvas(this.W, this.H);
      const g = vx.createRadialGradient(this.W / 2, this.H * 0.45, Math.min(this.W, this.H) * 0.35, this.W / 2, this.H * 0.5, Math.max(this.W, this.H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, (L.vignette || this.pal.shadow) + '66');
      vx.fillStyle = g; vx.fillRect(0, 0, this.W, this.H);
      this.vignette = c;
    }
    x.drawImage(this.vignette, 0, 0);
  }
  draw() {
    const x = this.view.ctx;
    x.imageSmoothingEnabled = false;
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    if (this.cfg.drawBack) this.cfg.drawBack(x, this);
    else x.drawImage(this.skyCanvas(), 0, 0);
    this.drawParticles(x, 'back');
    this.drawWorld(x);
    this.drawParticles(x, 'mid');
    this.cfg.drawFront?.(x, this);
    this.drawParticles(x, 'front');
    this.cfg.drawLight?.(x, this);
    this.post(x);
    this.cfg.drawOverlay?.(x, this);
  }
}

// Grass tufts along the ground that sway with wind; call per frame.
export function drawGrassBlades(x, scene, y, { density = 0.5, colors = ['#5fae5a', '#79c06a', '#9bd770'], height = 5, parallax = 1, seed = 3 } = {}) {
  const camX = Math.round(scene.cam * parallax);
  const t = scene.t;
  const step = Math.max(1, Math.round(1 / density));
  const start = Math.floor(camX / step) * step;
  for (let wx = start; wx < camX + scene.W + step; wx += step) {
    const h = ((wx * 7919 + seed * 31) % 97) / 97;
    const hh = Math.round(height * (0.5 + h));
    const sway = Math.sin(t * 1.8 + wx * 0.07) * 1.2 + Math.sin(t * 0.7 + wx * 0.013) * 0.8;
    const col = colors[(wx * 13 + seed) % colors.length];
    const px = wx - camX;
    x.fillStyle = col;
    for (let j = 0; j < hh; j++) x.fillRect(px + Math.round(sway * (j / hh) * (j / hh)), y - j, 1, 1);
  }
}

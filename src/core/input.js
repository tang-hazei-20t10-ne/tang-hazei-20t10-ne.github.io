// Unified keyboard / mouse / touch input for 2D and 3D chapters.
const ACTION_KEYS = new Set(['KeyE', 'Space', 'Enter', 'KeyF']);

class Input {
  constructor() {
    this.keys = new Set();
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.mode = 'none';
    this.btn = { left: false, right: false, act: false };
    this.joy = { x: 0, y: 0 };
    this.look = { dx: 0, dy: 0 };
    this.actionHeld = false;
    this.actionPressed = false;
    this.blocked = false; // true while a dialog/modal is open
    this.tapHandlers = new Set();
    this.lastMoveInput = 0;
  }

  init(root) {
    this.root = root;
    if (this.touch) document.body.classList.add('touch');
    addEventListener('keydown', (e) => {
      if (e.repeat && ACTION_KEYS.has(e.code)) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (ACTION_KEYS.has(e.code) && !this.blocked) { this.actionPressed = true; }
      this.lastMoveInput = performance.now();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.btn.left = this.btn.right = this.btn.act = false; });

    // mouse look (drag) + clicks on the game surface
    let drag = null;
    root.addEventListener('pointerdown', (e) => {
      if (e.target !== root && !e.target.matches('canvas')) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false };
    });
    addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 8) drag.moved = true;
      if (this.mode === '3d' && !this.blocked) { this.look.dx += dx; this.look.dy += dy; }
    });
    const up = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && performance.now() - drag.t < 400 && !this.blocked) this.tapHandlers.forEach((fn) => fn(e.clientX, e.clientY));
      drag = null;
    };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
  }

  // Touch controls DOM (built once, toggled per mode)
  buildTouch(layer) {
    const pad2 = document.createElement('div');
    pad2.className = 'touch-pad hidden';
    pad2.innerHTML = `<button class="tbtn left" aria-label="trái">◀</button><button class="tbtn right" aria-label="phải">▶</button>`;
    const pad3 = document.createElement('div');
    pad3.className = 'touch-pad hidden';
    pad3.innerHTML = `<div class="joy"><i></i></div>`;
    const act = document.createElement('div');
    act.className = 'touch-pad hidden';
    act.innerHTML = `<button class="tbtn act" aria-label="tương tác"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#fff" d="M2 4h4v1h1v1h2V5h1V4h4v1h1v4h-1v1h-1v1h-1v1h-1v1h-1v1H8v-1H7v-1H6v-1H5v-1H4V9H3V5h-1z"/></svg></button>`;
    layer.append(pad2, pad3, act);
    this.pads = { pad2, pad3, act };
    this.actBtn = act.querySelector('.act');
    const hold = (el, key) => {
      const on = (e) => { e.preventDefault(); e.stopPropagation(); this.btn[key] = true; el.classList.add('on'); if (key === 'act' && !this.blocked) this.actionPressed = true; el.setPointerCapture?.(e.pointerId); };
      const off = () => { this.btn[key] = false; el.classList.remove('on'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
    };
    hold(pad2.querySelector('.left'), 'left');
    hold(pad2.querySelector('.right'), 'right');
    hold(this.actBtn, 'act');
    // joystick
    const joy = pad3.querySelector('.joy'); const knob = joy.querySelector('i');
    let jid = null;
    const move = (e) => {
      const r = joy.getBoundingClientRect();
      let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      let y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      this.joy.x = x; this.joy.y = y;
      knob.style.transform = `translate(${x * 36}px, ${y * 36}px)`;
    };
    joy.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); jid = e.pointerId; joy.setPointerCapture(e.pointerId); move(e); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) move(e); });
    const jend = () => { jid = null; this.joy.x = this.joy.y = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
  }

  setMode(mode, { action = true } = {}) {
    this.mode = mode;
    if (!this.pads) return;
    const t = this.touch;
    this.pads.pad2.classList.toggle('hidden', !(t && mode === '2d'));
    this.pads.pad3.classList.toggle('hidden', !(t && mode === '3d'));
    this.pads.act.classList.toggle('hidden', !(t && action && (mode === '2d' || mode === '3d')));
    document.body.classList.toggle('game-2d', mode === '2d');
    document.body.classList.toggle('game-3d', mode === '3d');
    this.joy.x = this.joy.y = 0;
  }
  setActionReady(ready) { if (this.actBtn) this.actBtn.classList.toggle('ready', !!ready); }

  get moveX() {
    if (this.blocked) return 0;
    let x = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.btn.left) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.btn.right) x += 1;
    if (this.mode === '3d') x += this.joy.x;
    return Math.max(-1, Math.min(1, x));
  }
  get moveY() { // forward = +1
    if (this.blocked) return 0;
    let y = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y += 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y -= 1;
    y -= this.joy.y;
    return Math.max(-1, Math.min(1, y));
  }
  get action() {
    if (this.blocked) return false;
    for (const k of ACTION_KEYS) if (this.keys.has(k)) return true;
    return this.btn.act;
  }
  // consume one-shot press
  pressed() { const p = this.actionPressed; this.actionPressed = false; return p && !this.blocked; }
  consumeLook() { const l = { ...this.look }; this.look.dx = this.look.dy = 0; return l; }
  onTap(fn) { this.tapHandlers.add(fn); return () => this.tapHandlers.delete(fn); }
}

export const input = new Input();

// Step-by-step guidance for the open 3D maps: a small task list, a floating
// marker over the current goal (with distance), soft markers on nearby
// optional things, and an arrow on the screen edge when the goal is off-screen.
import { THREE } from './engine3d.js';
import { esc } from '../core/ui.js';
import { audio } from '../core/audio.js';

const CSS = `
#guide { position:absolute; left:calc(10px + var(--safe-l)); top:calc(48px + var(--safe-t)); z-index:31; width:min(300px, 46vw); font-family:var(--body); color:#3a2633; background:rgba(255,246,234,.92); border:3px solid #3a2633; border-radius:10px; box-shadow:0 4px 0 rgba(30,15,25,.3); overflow:hidden; pointer-events:auto; }
#guide .gh { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:5px 10px 6px; background:#f08fa8; color:#fff; font-family:var(--pixel); font-size:21px; cursor:pointer; user-select:none; }
#guide .gh small { font-size:16px; opacity:.9; }
#guide ul { list-style:none; margin:0; padding:6px 8px 8px; }
#guide li { display:flex; gap:7px; align-items:flex-start; padding:3px 2px; font-size:14px; font-weight:700; line-height:1.3; color:#6b4f5e; }
#guide li i { font-style:normal; width:16px; flex:none; text-align:center; }
#guide li.cur { color:#3a2633; background:#ffe6ec; border-radius:6px; }
#guide li.cur i { color:#e05a7a; animation:gpulse 1s infinite; }
#guide li.done { color:#a99aa4; text-decoration:line-through; }
#guide li.done i { color:#5fae68; }
#guide .sep { font-family:var(--pixel); font-size:16px; color:#c4587a; padding:6px 2px 0; }
#guide.min ul { display:none; }
#guide .cur-only { display:none; padding:6px 10px 8px; font-size:14px; font-weight:800; }
#guide.min .cur-only { display:block; }
@keyframes gpulse { 50% { transform:translateX(2px); } }
.gmark { position:absolute; z-index:29; transform:translate(-50%,-100%); pointer-events:none; display:flex; flex-direction:column; align-items:center; gap:2px; transition:opacity .3s; }
.gmark .gem { width:14px; height:14px; transform:rotate(45deg); background:#fff6ea; border:3px solid #3a2633; box-shadow:0 0 0 3px rgba(255,255,255,.35); animation:gbob 1.2s ease-in-out infinite; }
.gmark.main .gem { width:20px; height:20px; background:#ffd23f; box-shadow:0 0 14px 4px rgba(255,214,90,.8); }
.gmark .lbl { font-family:var(--pixel); font-size:18px; color:#fff; background:rgba(58,38,51,.78); padding:1px 8px 3px; border-radius:6px; white-space:nowrap; }
.gmark .stem { width:3px; height:16px; background:linear-gradient(#ffd23f, rgba(255,210,63,0)); }
@keyframes gbob { 50% { transform:rotate(45deg) translate(-3px,-3px); } }
.garrow { position:absolute; z-index:29; width:0; height:0; pointer-events:none; }
.garrow b { position:absolute; left:-15px; top:-15px; width:30px; height:30px; display:grid; place-items:center; background:#ffd23f; border:3px solid #3a2633; border-radius:50%; box-shadow:0 0 12px rgba(255,214,90,.8); }
.garrow b::after { content:''; border-left:9px solid #3a2633; border-top:6px solid transparent; border-bottom:6px solid transparent; margin-left:3px; }
.garrow span { position:absolute; left:50%; top:20px; transform:translateX(-50%); font-family:var(--pixel); font-size:16px; color:#fff; background:rgba(58,38,51,.78); padding:0 6px 2px; border-radius:5px; white-space:nowrap; }
@media (max-width:700px) { #guide { width:min(240px, 60vw); } #guide li { font-size:13px; } }
`;

export class Guide {
  // steps: [{ id, text, pos: Vector3 | () => Vector3, optional, total, hidden, label }]
  constructor(world, { title = 'Việc có thể làm', optionalTitle = 'Thêm nếu thích', steps = [], startMin = false } = {}) {
    this.world = world; this.steps = steps.map((s) => ({ count: 0, done: false, ...s }));
    this.title = title; this.optionalTitle = optionalTitle;
    if (!document.getElementById('guide-css')) { const st = document.createElement('style'); st.id = 'guide-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.el = document.createElement('div'); this.el.id = 'guide';
    if (startMin || innerWidth < 700 || innerHeight < 520) this.el.classList.add('min');
    this.layer = document.createElement('div'); this.layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:29';
    world.game.app.append(this.layer, this.el);
    this.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target.closest('.gh')) this.el.classList.toggle('min'); });
    this.marks = new Map();
    this.arrow = document.createElement('div'); this.arrow.className = 'garrow'; this.arrow.innerHTML = '<b></b><span></span>'; this.layer.appendChild(this.arrow);
    this.override = null; // { pos, label } — e.g. a star to look at
    this.render();
    this.off = world.every(() => this.update());
    if (world.game.debug) window.__guide = this;
  }
  step(id) { return this.steps.find((s) => s.id === id); }
  done(id) { const s = this.step(id); if (!s || s.done) return; s.done = true; audio.sfx('chime', { up: 7 }); this.render(); }
  progress(id, n) { const s = this.step(id); if (!s) return; s.count = n; if (s.total && n >= s.total) this.done(id); else this.render(); }
  show(id, on = true) { const s = this.step(id); if (s) { s.hidden = !on; this.render(); } }
  setText(id, text) { const s = this.step(id); if (s) { s.text = text; this.render(); } }
  get current() {
    if (this.forced) return this.step(this.forced);
    return this.steps.find((s) => !s.done && !s.hidden && !s.optional) || null;
  }
  force(id) { this.forced = id; this.render(); }
  label(s) { return s.text + (s.total ? ` (${Math.min(s.count, s.total)}/${s.total})` : ''); }
  render() {
    const cur = this.current;
    const main = this.steps.filter((s) => !s.optional && !s.hidden), opt = this.steps.filter((s) => s.optional && !s.hidden);
    const li = (s) => `<li class="${s.done ? 'done' : s === cur ? 'cur' : ''}"><i>${s.done ? '✔' : s === cur ? '▶' : '•'}</i><span>${esc(this.label(s))}</span></li>`;
    const nDone = main.filter((s) => s.done).length;
    this.el.innerHTML = `<div class="gh"><span>${esc(this.title)}</span><small>${nDone}/${main.length} ▾</small></div>`
      + `<div class="cur-only">${cur ? '▶ ' + esc(this.label(cur)) : '✔'}</div>`
      + `<ul>${main.map(li).join('')}${opt.length ? `<li class="sep">${esc(this.optionalTitle)}</li>` + opt.map(li).join('') : ''}</ul>`;
  }
  posOf(s) { return typeof s.pos === 'function' ? s.pos() : s.pos; }
  update() {
    const w = this.world; const cam = w.camera; const p = w.player.pos;
    const cur = this.current;
    const ox = (innerWidth - w.W * w.cssScale) / 2, oy = (innerHeight - w.H * w.cssScale) / 2;
    const vw = w.W * w.cssScale, vh = w.H * w.cssScale;
    const active = new Set();
    const target = this.override || (cur && cur.pos ? { pos: this.posOf(cur), label: cur.label || cur.text, main: true } : null);
    const items = [];
    if (target) items.push({ key: 'main', ...target, main: true });
    if (!this.override) for (const s of this.steps) {
      if (s === cur || s.done || s.hidden || !s.pos) continue;
      const v = this.posOf(s); if (!v) continue;
      if (Math.hypot(v.x - p.x, v.z - p.z) < 28) items.push({ key: s.id, pos: v, label: s.short || '', main: false });
    }
    for (const it of items) {
      active.add(it.key);
      let m = this.marks.get(it.key);
      if (!m) { m = document.createElement('div'); m.className = 'gmark' + (it.main ? ' main' : ''); m.innerHTML = '<div class="lbl"></div><div class="gem"></div>' + (it.main ? '<div class="stem"></div>' : ''); this.layer.appendChild(m); this.marks.set(it.key, m); }
      m.classList.toggle('main', !!it.main);
      const top = it.pos.clone(); if (!it.sky) top.y += it.main ? 2.6 : 1.8;
      const d = Math.hypot(it.pos.x - p.x, it.pos.z - p.z);
      const s = w.toScreen(top);
      const onScreen = s && s.x > ox + 10 && s.x < ox + vw - 10 && s.y > oy + 10 && s.y < oy + vh - 10;
      const lbl = m.querySelector('.lbl');
      const text = it.main ? (it.sky ? it.label : `${it.label} · ${Math.round(d)}m`) : it.label;
      lbl.textContent = text; lbl.style.display = text ? '' : 'none';
      if (onScreen && (it.main ? d > 2.2 || it.sky : d > 1.6)) { m.style.opacity = '1'; m.style.left = s.x + 'px'; m.style.top = s.y + 'px'; } else m.style.opacity = '0';
      if (it.main) {
        // edge arrow when off-screen
        if (!onScreen && (d > 2.5 || it.sky)) {
          const v = top.clone().applyMatrix4(cam.matrixWorldInverse);
          let ang = Math.atan2(-v.y, v.x);
          if (v.z > 0) ang = v.x >= 0 ? 0.35 : Math.PI - 0.35; // behind: point down-left / down-right
          const cx = ox + vw / 2, cy = oy + vh / 2; const rx = vw / 2 - 50, ry = vh / 2 - 60;
          this.arrow.style.display = ''; this.arrow.style.left = cx + Math.cos(ang) * rx + 'px'; this.arrow.style.top = cy + Math.sin(ang) * ry + 'px';
          this.arrow.querySelector('b').style.transform = `rotate(${ang}rad)`;
          this.arrow.querySelector('span').textContent = it.sky ? it.label : `${it.label} · ${Math.round(d)}m`;
        } else this.arrow.style.display = 'none';
      }
    }
    if (!target) this.arrow.style.display = 'none';
    for (const [k, m] of this.marks) if (!active.has(k)) { m.remove(); this.marks.delete(k); }
  }
  hide(on) { this.el.style.display = on ? 'none' : ''; this.layer.style.display = on ? 'none' : ''; }
  destroy() { this.off?.(); this.el.remove(); this.layer.remove(); }
}

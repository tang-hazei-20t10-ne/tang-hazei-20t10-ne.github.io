// Reusable "hold to interact" system shared by the 2D and 3D chapters.
// item: { label, range, hold (seconds, 0 = tap), onDone(), onHold(p), cond(), once, priority }
import { input } from './input.js';
import { ui } from './ui.js';

export class Interactor {
  constructor() {
    this.items = new Set();
    this.current = null;
    this.progress = 0;
    this.holding = false;
    this.busy = false;
    this.enabled = true;
    // the prompt itself is pressable (mouse users)
    const p = ui.promptEl;
    if (!p.dataset.wired) {
      p.dataset.wired = '1';
      p.style.pointerEvents = 'auto';
      p.addEventListener('pointerdown', (e) => { e.stopPropagation(); input.btn.act = true; if (!input.blocked) input.actionPressed = true; });
      const off = () => { input.btn.act = false; };
      p.addEventListener('pointerup', off); p.addEventListener('pointerleave', off); p.addEventListener('pointercancel', off);
    }
  }
  add(item) { this.items.add(item); return item; }
  remove(item) { this.items.delete(item); if (this.current === item) this.current = null; }
  clear() { this.items.clear(); this.current = null; ui.prompt(null); }

  update(dt, dist) {
    if (this.busy || !this.enabled || input.blocked) { if (!input.blocked) ui.prompt(null); this.holding = false; this.progress = 0; input.actionPressed = false; return; }
    let best = null, bd = Infinity;
    for (const it of this.items) {
      if (it.cond && !it.cond()) continue;
      const d = dist(it);
      const score = d - (it.priority || 0);
      if (d <= (it.range ?? 16) && score < bd) { bd = score; best = it; }
    }
    if (best !== this.current) { this.progress = 0; this.holding = false; this.current = best; }
    if (!best) { ui.prompt(null); input.actionPressed = false; return; }
    if (input.pressed()) this.holding = true;
    const hold = best.hold ?? 0.6;
    if (this.holding && (input.action || hold === 0)) {
      this.progress = hold === 0 ? 1 : this.progress + dt / hold;
      best.onHold?.(Math.min(1, this.progress), dt);
    } else {
      this.holding = false;
      if (this.progress > 0) { this.progress = Math.max(0, this.progress - dt * 2.5); best.onRelease?.(); }
    }
    const label = typeof best.label === 'function' ? best.label() : best.label;
    ui.prompt(label, Math.min(1, this.progress));
    if (this.progress >= 1) {
      const it = best;
      this.progress = 0; this.holding = false; this.busy = true; ui.prompt(null);
      if (it.once) this.remove(it);
      Promise.resolve()
        .then(() => it.onDone?.())
        .catch((e) => console.warn(e))
        .finally(() => { this.busy = false; input.actionPressed = false; });
    }
  }
}

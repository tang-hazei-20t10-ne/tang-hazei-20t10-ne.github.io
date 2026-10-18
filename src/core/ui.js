// DOM overlay: dialogue, prompts, bubbles, toasts, modals, HUD, transitions.
import content from '../content.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { state, album } from './state.js';
import { avatar, flowerBig } from './sprites.js';

const T = content.ui;
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function whoName(who) {
  if (who === 'partner') return content.partnerName;
  if (who === 'hazei') return content.playerName;
  if (who === 'chef') return content.omakase.chefName;
  return who;
}

class UI {
  init(app) {
    this.app = app;
    this.layer = el('div'); this.layer.id = 'hud';
    this.layer.innerHTML = `
      <div class="chapter-chip" hidden></div>
      <div class="hud-top">
        <div class="hud-chip flowers" title="${esc(T.flowersCount)}" hidden><canvas width="20" height="20"></canvas><span>0</span></div>
        <button class="hud-btn album" aria-label="${esc(T.album)}"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#3a2633" d="M1 4h3l1-2h6l1 2h3v10H1z"/><path fill="#fff6ea" d="M2 5h12v8H2z"/><path fill="#3a2633" d="M6 6h4v1h1v1h1v3h-1v1h-1v1H6v-1H5v-1H4V8h1V7h1z"/><path fill="#7f9fdc" d="M6 8h4v3H6z"/></svg></button>
        <button class="hud-btn mute" aria-label="${esc(T.mute)}"></button>
      </div>
      <div class="settings-pop px-box"><label>${esc(T.volume)} <input type="range" min="0" max="1" step="0.05"></label></div>
      <div class="rotate-hint">${esc(T.rotateHint)}</div>`;
    this.dialogEl = el('div', 'px-box'); this.dialogEl.id = 'dialog';
    this.dialogEl.innerHTML = '<div class="name"></div><div class="text"></div><div class="choices"></div><div class="more">▼</div>';
    this.promptEl = el('div', 'px-box'); this.promptEl.id = 'prompt';
    this.promptEl.innerHTML = '<div class="key"><svg viewBox="0 0 38 38"><circle class="bg" cx="19" cy="19" r="16"/><circle class="fg" cx="19" cy="19" r="16" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg><b>E</b></div><span></span>';
    this.toasts = el('div'); this.toasts.id = 'toasts';
    this.noteEl = el('div'); this.noteEl.id = 'note';
    this.actionsEl = el('div'); this.actionsEl.id = 'actions';
    this.modalEl = el('div'); this.modalEl.id = 'modal';
    this.fadeEl = el('div'); this.fadeEl.id = 'fade';
    this.titleEl = el('div', 'title-card');
    this.hintEl = el('div', 'controls-hint gone');
    this.lyricsEl = el('div'); this.lyricsEl.id = 'lyrics';
    this.errorEl = el('div'); this.errorEl.id = 'error';
    this.pauseEl = el('div'); this.pauseEl.id = 'pause'; this.pauseEl.textContent = T.paused;
    this.bubbleLayer = el('div'); this.bubbleLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:35';
    app.append(this.bubbleLayer, this.layer, this.toasts, this.noteEl, this.actionsEl, this.promptEl, this.dialogEl, this.titleEl, this.hintEl, this.lyricsEl, this.modalEl, this.fadeEl, this.errorEl, this.pauseEl);
    input.buildTouch(this.layer);

    // HUD buttons
    const muteBtn = this.layer.querySelector('.mute');
    const pop = this.layer.querySelector('.settings-pop');
    const range = pop.querySelector('input');
    const s = state.data.settings;
    range.value = s.volume;
    const drawMute = () => {
      muteBtn.innerHTML = s.muted
        ? '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#3a2633" d="M2 6h3l4-3v10L5 10H2z"/><path fill="#c4587a" d="M11 6h1v1h1V6h1v1h-1v1h1v1h-1V8h-1v1h-1V8h1V7h-1z"/></svg>'
        : '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#3a2633" d="M2 6h3l4-3v10L5 10H2z"/><path fill="#3a2633" d="M11 5h1v1h1v4h-1v1h-1v-1h1V6h-1zM13 3h1v1h1v8h-1v1h-1v-1h1V4h-1z"/></svg>';
      muteBtn.setAttribute('aria-label', s.muted ? T.unmute : T.mute);
    };
    drawMute();
    let popTimer;
    muteBtn.addEventListener('click', () => {
      s.muted = !s.muted; audio.setMuted(s.muted); state.save(); drawMute();
      pop.classList.add('open'); clearTimeout(popTimer); popTimer = setTimeout(() => pop.classList.remove('open'), 3500);
    });
    range.addEventListener('input', () => { s.volume = +range.value; if (s.muted && s.volume > 0) { s.muted = false; drawMute(); audio.setMuted(false); } audio.setVolume(s.volume); state.save(); clearTimeout(popTimer); popTimer = setTimeout(() => pop.classList.remove('open'), 3500); });
    this.layer.querySelector('.album').addEventListener('click', () => this.showAlbum());
    this.flowerChip = this.layer.querySelector('.flowers');
    const fc = this.flowerChip.querySelector('canvas').getContext('2d');
    fc.imageSmoothingEnabled = false; fc.drawImage(flowerBig('cosmos', '#f59ac0'), 0, 0, 20, 20);
    this.chapterChip = this.layer.querySelector('.chapter-chip');

    // dialogue advance via keys/click
    this.dialogEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.choices')) this.advance(); });
    addEventListener('keydown', (e) => {
      if (this.dialogOpen && ['Space', 'Enter', 'KeyE'].includes(e.code) && !e.repeat) { e.preventDefault(); this.advance(); }
      if (e.code === 'Escape' && this.modalEl.classList.contains('open') && this.modalCloseable) this.closeModal();
    });

    this.bubbles = new Set();
    const tick = () => { this.updateBubbles(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------- HUD
  hud(show) { this.layer.classList.toggle('hidden', !show); }
  chapter(label) { this.chapterChip.hidden = !label; this.chapterChip.textContent = label || ''; }
  flowers(n, bump = false) {
    this.flowerChip.hidden = n <= 0 && !bump;
    this.flowerChip.querySelector('span').textContent = n;
    if (bump) { this.flowerChip.classList.remove('bump'); void this.flowerChip.offsetWidth; this.flowerChip.classList.add('bump'); }
  }
  flowerChipRect() { return this.flowerChip.getBoundingClientRect(); }

  // ---------------------------------------------------------- dialogue
  updateBlock() {
    const open = this.dialogOpen || this.modalEl.classList.contains('open');
    input.blocked = open;
    document.body.classList.toggle('has-dialog', open);
  }
  async dialog(lines, opts = {}) {
    let result = null;
    for (const line of lines) {
      const r = await this.line(line.who, line.text, line.choices, opts);
      if (line.choices) result = r;
    }
    return result;
  }
  line(who, text, choices, opts = {}) {
    return new Promise((resolve) => {
      const d = this.dialogEl;
      const name = d.querySelector('.name'); const tx = d.querySelector('.text'); const ch = d.querySelector('.choices'); const more = d.querySelector('.more');
      name.className = 'name ' + (who || '');
      name.textContent = who ? whoName(who) : '';
      name.style.display = who ? '' : 'none';
      ch.innerHTML = ''; more.style.display = 'none';
      d.classList.add('show'); this.dialogOpen = true; this.updateBlock();
      const chars = [...text]; let i = 0; let done = false;
      tx.textContent = '';
      const finish = () => {
        done = true; clearInterval(this.typeTimer); tx.textContent = text;
        if (choices) {
          choices.forEach((c, idx) => {
            const b = el('button', 'btn soft', esc(c));
            b.addEventListener('click', (e) => { e.stopPropagation(); audio.sfx('select'); this.closeDialog(); resolve(idx); });
            ch.appendChild(b);
          });
          ch.querySelector('button')?.focus({ preventScroll: true });
        } else more.style.display = '';
      };
      this.advance = () => {
        if (!done) { finish(); return; }
        if (choices) return;
        audio.sfx('tick');
        this.closeDialog(opts.keepOpen); resolve(null);
      };
      if (reduced || opts.instant) finish();
      else {
        let tick = 0;
        this.typeTimer = setInterval(() => {
          if (i >= chars.length) { finish(); return; }
          tx.textContent += chars[i++];
          if (++tick % 3 === 0 && chars[i - 1] !== ' ') audio.sfx('tick');
        }, 28);
      }
    });
  }
  closeDialog() { this.dialogEl.classList.remove('show'); this.dialogOpen = false; this.updateBlock(); }
  advance() { /* replaced while a line is shown */ }

  // ---------------------------------------------------------- bubbles
  // pos: () => ({x, y}) in CSS px, updated per frame
  bubble(text, pos, ms = 2800) {
    const b = el('div', 'bubble', esc(text));
    this.bubbleLayer.appendChild(b);
    const item = { b, pos };
    this.bubbles.add(item);
    this.updateBubbles();
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); this.bubbles.delete(item); }, 400); }, ms);
    return item;
  }
  updateBubbles() {
    for (const it of this.bubbles) {
      const p = it.pos(); if (!p) continue;
      const w = it.b.offsetWidth / 2 + 6;
      const x = Math.max(w, Math.min(innerWidth - w, p.x));
      it.b.style.left = x + 'px'; it.b.style.top = Math.max(50, p.y) + 'px';
    }
  }
  clearBubbles() { for (const it of this.bubbles) it.b.remove(); this.bubbles.clear(); }

  // ---------------------------------------------------------- prompt
  prompt(label, progress = 0) {
    if (!label) { this.promptEl.classList.remove('show'); input.setActionReady(false); this.promptLabel = null; return; }
    if (label !== this.promptLabel) {
      this.promptEl.querySelector('span').textContent = label;
      this.promptEl.querySelector('b').textContent = input.touch ? '♥' : 'E';
      this.promptLabel = label;
    }
    this.promptEl.classList.add('show');
    input.setActionReady(true);
    this.promptEl.querySelector('.fg').setAttribute('stroke-dashoffset', String(100.5 * (1 - progress)));
  }

  // ---------------------------------------------------------- toast / note / title
  toast(text, who = 'partner') {
    const t = el('div', 'toast');
    const av = this.avatarEl(who);
    const body = el('div', '', `<div class="who">${esc(who === 'partner' ? content.discord.partnerHandle : content.discord.hazeiHandle)}<small>${esc(content.discord.voiceChannel)}</small></div><div class="msg">${esc(text)}</div>`);
    t.append(av, body);
    this.toasts.appendChild(t);
    audio.sfx('notify');
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 600); }, 5200);
  }
  avatarEl(who) {
    const src = content.avatars[who];
    if (src) { const i = new Image(); i.src = src; i.alt = ''; return i; }
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(avatar(who, 64), 0, 0);
    return c;
  }
  note(text, ms = 3200) {
    clearTimeout(this.noteTimer);
    this.noteEl.textContent = text; this.noteEl.classList.add('show');
    this.noteTimer = setTimeout(() => this.noteEl.classList.remove('show'), ms);
  }
  async titleCard(index, title, sub) {
    this.titleEl.innerHTML = `<div class="k">${esc(T.chapterWord)} ${index}</div><div class="t">${esc(title)}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}`;
    this.titleEl.classList.add('show');
    await wait(2600);
    this.titleEl.classList.remove('show');
  }
  controlsHint(text, ms = 7000) {
    this.hintEl.textContent = text; this.hintEl.classList.remove('gone');
    clearTimeout(this.hintTimer); this.hintTimer = setTimeout(() => this.hintEl.classList.add('gone'), ms);
  }
  hideHint() { this.hintEl.classList.add('gone'); }

  // ---------------------------------------------------------- actions bar
  actions(list) {
    this.actionsEl.innerHTML = '';
    for (const a of list || []) {
      const b = el('button', 'btn ' + (a.cls || 'soft'), esc(a.label));
      b.addEventListener('click', (e) => { e.stopPropagation(); a.onClick(b); });
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.actionsEl.appendChild(b);
    }
  }

  // ---------------------------------------------------------- modal
  modal(build, { closeable = true } = {}) {
    this.modalEl.innerHTML = '';
    const sheet = el('div', 'sheet px-box');
    this.modalEl.appendChild(sheet);
    this.modalCloseable = closeable;
    if (closeable) {
      const x = el('button', 'btn soft x', '✕'); x.setAttribute('aria-label', T.close);
      x.addEventListener('click', () => this.closeModal());
      sheet.appendChild(x);
    }
    this.modalEl.classList.add('open');
    this.updateBlock();
    build(sheet);
    return sheet;
  }
  closeModal() {
    this.modalEl.classList.remove('open'); this.modalEl.innerHTML = ''; this.updateBlock();
    const cb = this.onModalClose; this.onModalClose = null; cb?.();
  }

  async showAlbum() {
    const items = await album.list();
    this.modal((s) => {
      s.insertAdjacentHTML('beforeend', `<h2>${esc(T.album)}</h2>`);
      if (!items.length) { s.insertAdjacentHTML('beforeend', `<p class="sub">${esc(T.albumEmpty)}</p>`); return; }
      const g = el('div', 'album-grid');
      items.forEach((it, i) => {
        const f = el('figure');
        const img = new Image(); img.src = it.dataUrl; img.alt = it.title || '';
        const a = el('a', 'btn soft', esc(T.download)); a.href = it.dataUrl; a.download = `hazei-${i + 1}.png`; a.style.fontSize = '18px';
        f.append(img, a); g.appendChild(f);
      });
      s.appendChild(g);
    });
  }

  // ---------------------------------------------------------- transitions
  fade(on, { dark = false, ms = 900 } = {}) {
    this.fadeEl.style.transitionDuration = ms + 'ms';
    this.fadeEl.classList.toggle('dark', dark);
    this.fadeEl.classList.toggle('on', on);
    return wait(ms + 50);
  }
  flash() { const f = el('div', 'flash'); this.app.appendChild(f); setTimeout(() => f.remove(), 600); }
  lyrics(text) { this.lyricsEl.textContent = text || ''; }
  error(msg) {
    this.errorEl.innerHTML = `<div class="px-box"><h3>${esc(T.errorTitle)}</h3><p>${esc(msg || T.errorBody)}</p><button class="btn">${esc(T.reload)}</button></div>`;
    this.errorEl.querySelector('button').onclick = () => location.reload();
    this.errorEl.classList.add('open');
  }
  paused(on) { this.pauseEl.classList.toggle('open', on); }
}

export const ui = new UI();
export { esc, el };

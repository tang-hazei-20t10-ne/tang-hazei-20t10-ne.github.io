import '@fontsource/vt323/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './style.css';
import content from './content.js';
import { state } from './core/state.js';
import { audio } from './core/audio.js';
import { input } from './core/input.js';
import { ui, wait, esc } from './core/ui.js';
import { PixelView } from './two/engine2d.js';
import { randomFlower } from './core/sprites.js';

const CHAPTERS = {
  discord: () => import('./chapters/c0_discord.js'),
  meadow: () => import('./chapters/c1_meadow.js'),
  market: () => import('./chapters/c2_market.js'),
  train: () => import('./chapters/c3_train.js'),
  bookshop: () => import('./chapters/c4_bookshop.js'),
  omakase: () => import('./chapters/c5_omakase.js'),
  cafe: () => import('./chapters/c6_cafe.js'),
  seaside: () => import('./chapters/c7_seaside.js'),
  island: () => import('./chapters/c8_island.js'),
  balloon: () => import('./chapters/c9_balloon.js'),
  hill: () => import('./chapters/c10_hill.js'),
  village: () => import('./chapters/c11_village.js'),
  stage: () => import('./chapters/c12_stage.js'),
  epilogue: () => import('./chapters/c13_epilogue.js'),
};
const ORDER = content.chapters.map((c) => c.id);
const DEBUG = new URLSearchParams(location.search).has('debug');

const app = document.getElementById('app');
const stage = document.createElement('div');
stage.id = 'stage';
app.appendChild(stage);

const game = {
  stage, app, paused: false, debug: DEBUG,
  view2d: null,
  chapterIndex: 0,
  // fade in from the transition color and show the chapter title card
  async enter({ title = true, dark = false } = {}) {
    const meta = content.chapters[this.chapterIndex];
    ui.chapter(meta.title && this.chapterIndex > 0 && this.chapterIndex < ORDER.length - 1 ? meta.title : '');
    if (this.handoff) {
      const h = this.handoff; this.handoff = null;
      ui.fadeEl.style.transitionDuration = '0ms'; ui.fadeEl.classList.remove('on');
      h.style.transition = 'opacity 1.4s ease';
      await wait(60); h.style.opacity = '0';
      await wait(1400); h.remove();
    } else await ui.fade(false, { dark, ms: 1100 });
    ui.hud(true);
    if (title && this.chapterIndex > 0 && meta.title) ui.titleCard(this.chapterIndex, meta.title, meta.time);
  },
  async leave(scene, { dark = false, ms = 1100 } = {}) {
    await ui.fade(true, { dark, ms });
    scene?.finish?.();
  },
  addFlower(f) {
    state.data.flowers.push(f); state.save();
    ui.flowers(state.data.flowers.length, true);
  },
};

// ------------------------------------------------------------ boot
function loadingScreen() {
  const L = document.createElement('div');
  L.id = 'loading';
  L.innerHTML = `<div><div class="title">${esc(content.discord.activityName)}</div><div class="hint">${esc(content.ui.loading)}</div><div class="bar"><i></i></div><div class="cta"></div></div>`;
  app.appendChild(L);
  document.getElementById('boot')?.remove();
  return L;
}

async function boot() {
  state.load();
  audio.volume = state.data.settings.volume; audio.muted = state.data.settings.muted;
  ui.init(app);
  input.init(stage);
  game.view2d = new PixelView(stage);
  ui.hud(false);
  ui.flowers(state.data.flowers.length);

  const L = loadingScreen();
  const bar = L.querySelector('.bar i'); const hint = L.querySelector('.hint');
  let hi = 0;
  const hintTimer = setInterval(() => { hint.textContent = content.ui.loadingHints[hi++ % content.ui.loadingHints.length]; }, 1100);
  const steps = [
    document.fonts ? Promise.all([document.fonts.load("24px 'VT323'", 'Hành trình'), document.fonts.load("700 18px 'Nunito'", 'Hành trình'), document.fonts.load("600 18px 'Nunito'", 'ữ')]).catch(() => {}) : Promise.resolve(),
    CHAPTERS.discord(),
    CHAPTERS[ORDER.includes(state.data.chapter) ? state.data.chapter : 'discord'](),
    audio.loadSong(content.song.file),
    wait(900),
  ];
  let done = 0;
  await Promise.all(steps.map((p) => Promise.resolve(p).then(() => { done++; bar.style.width = (done / steps.length) * 100 + '%'; })));
  clearInterval(hintTimer);
  hint.textContent = '';
  // warm the rest of the chapters in the background (code-split chunks)
  setTimeout(() => ORDER.forEach((id) => CHAPTERS[id]().catch(() => {})), 1500);

  const cta = L.querySelector('.cta');
  const resumable = state.data.started && state.data.chapter && state.data.chapter !== 'discord' && ORDER.includes(state.data.chapter);
  const start = await new Promise((resolve) => {
    if (resumable) {
      const idx = ORDER.indexOf(state.data.chapter);
      cta.innerHTML = `<div class="hint">${esc(content.ui.resumeTitle)} · ${esc(content.chapters[idx].title)}</div><div class="resume"><button class="btn">${esc(content.ui.resume)}</button><button class="btn soft">${esc(content.ui.restart)}</button></div>`;
      const [go, re] = cta.querySelectorAll('button');
      go.onclick = () => resolve(state.data.chapter);
      re.onclick = () => {
        cta.innerHTML = `<div class="hint">${esc(content.ui.restartConfirm)}</div><div class="resume"><button class="btn">${esc(content.ui.yes)}</button><button class="btn soft">${esc(content.ui.no)}</button></div>`;
        const [y, n] = cta.querySelectorAll('button');
        y.onclick = () => { state.reset(); ui.flowers(0); resolve('discord'); };
        n.onclick = () => resolve(state.data.chapter);
      };
      go.focus();
    } else {
      cta.innerHTML = `<button class="btn">${esc(content.ui.tapToStart)}</button>`;
      const b = cta.querySelector('button'); b.focus();
      b.onclick = () => resolve(ORDER.includes(state.data.chapter) ? state.data.chapter : 'discord');
    }
  });
  audio.init();
  audio.setVolume(state.data.settings.volume); audio.setMuted(state.data.settings.muted);
  ui.fadeEl.classList.add('on'); ui.fadeEl.style.transitionDuration = '0ms';
  if (start === 'discord') ui.fadeEl.classList.add('dark');
  L.classList.add('gone');
  setTimeout(() => L.remove(), 900);
  run(start);
}

async function run(id) {
  let i = ORDER.indexOf(id);
  if (i < 0) i = 0;
  while (i < ORDER.length) {
    const cid = ORDER[i];
    game.chapterIndex = i;
    state.set({ chapter: cid, started: true });
    try {
      const mod = await CHAPTERS[cid]();
      const next = await mod.default(game);
      if (next === 'restart') { i = 0; continue; }
    } catch (e) {
      console.error(e);
      ui.error();
      return;
    }
    if (!game.handoff && !ui.fadeEl.classList.contains('on')) await ui.fade(true);
    i++;
  }
}

// ------------------------------------------------------------ global
document.addEventListener('visibilitychange', () => {
  game.paused = document.hidden;
  if (document.hidden) audio.suspend(); else audio.resume();
});
// Background window (another app in front): scenes slow down to a crawl to
// save power; they return to full speed the moment the window is focused.
game.focused = document.hasFocus();
addEventListener('focus', () => { game.focused = true; });
addEventListener('blur', () => { game.focused = false; });
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { game.focused = true; }, true);
addEventListener('error', (e) => console.warn('runtime', e.message));
addEventListener('unhandledrejection', (e) => console.warn('promise', e.reason));

if (DEBUG) {
  const d = document.createElement('div');
  d.id = 'debug';
  d.innerHTML = `<button class="tog">${esc(content.ui.debugTitle)}</button>` + ORDER.map((id, i) => `<button data-ch="${id}">${i} ${id}</button>`).join('') + '<button data-act="flowers">+5 hoa</button><button data-act="reset">reset</button>';
  d.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('tog')) { d.classList.toggle('min'); return; }
    if (b.dataset.ch) { state.set({ chapter: b.dataset.ch, started: true }); location.reload(); }
    if (b.dataset.act === 'flowers') { for (let k = 0; k < 5; k++) state.data.flowers.push(randomFlower()); state.save(); ui.flowers(state.data.flowers.length, true); }
    if (b.dataset.act === 'reset') { state.reset(); location.reload(); }
  });
  document.body.appendChild(d);
  window.__game = game; window.__state = state; window.__audio = audio;
}

boot().catch((e) => { console.error(e); ui.error(); });

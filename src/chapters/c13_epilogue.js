// Epilogue: back in the Discord voice channel, final messages, wish and album.
import content from '../content.js';
import { CSS, ICON, avatarNode, now, DISCORD_LOGO } from './c0_discord.js';
import { ui, wait, esc, el } from '../core/ui.js';
import { audio } from '../core/audio.js';
import { input } from '../core/input.js';
import { state, album } from '../core/state.js';
import { drawBouquet, wishParts, wishCard, downloadCanvas } from '../core/photo.js';
import { canvas, flowerBig } from '../core/sprites.js';

const D = content.discord;
const E = content.epilogue;

const EXTRA_CSS = `
.dc-ep-tiles { display:flex; gap:10px; padding:12px 16px; background:#000; flex:none; }
.dc-ep-tiles .dc-tile { width:min(200px,38vw); }
.dc-ep-tiles .dc-tile canvas, .dc-ep-tiles .dc-tile img { width:48px; height:48px; }
.dc-att { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; margin-top:6px; max-width:560px; }
.dc-att figure { margin:0; background:#2b2d31; border:1px solid #232428; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; }
.dc-att img, .dc-att canvas { width:100%; display:block; image-rendering:pixelated; background:#1e1f22; }
.dc-att figcaption { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:6px 8px; font-size:12px; color:#b5bac1; }
.dc-att a, .dc-att button { color:#00a8fc; font-size:12px; background:none; border:0; padding:0; cursor:pointer; text-decoration:none; font-weight:700; }
.dc-wish { margin-top:4px; background:#2b2d31; border-left:4px solid #f08fa8; border-radius:4px; padding:12px 14px; max-width:560px; color:#dbdee1; }
.dc-wish .o { color:#ffb3c6; font-weight:800; font-size:17px; } .dc-wish ul { margin:6px 0; padding-left:20px; } .dc-wish li { margin:3px 0; line-height:1.4; }
.dc-wish .f { color:#ffb3c6; font-weight:800; margin-top:8px; }
.dc-keep { display:flex; gap:12px; align-items:center; background:#2b2d31; border-radius:8px; padding:10px 12px; max-width:420px; margin-top:6px; }
.dc-keep canvas { width:44px; height:64px; image-rendering:pixelated; flex:none; }
.dc-keep b { color:#f2f3f5; display:block; } .dc-keep small { color:#b5bac1; font-size:13px; }
.dc-ep-actions { display:flex; gap:8px; flex-wrap:wrap; padding:0 16px 16px; }
.dc-ep-actions .dc-btn.ghost { background:#4e5058; } .dc-ep-actions .dc-btn.ghost:hover { background:#6d6f78; }
`;

function bookmarkArt() {
  const [c, x] = canvas(11, 16);
  x.fillStyle = '#3a2633'; x.fillRect(0, 0, 11, 16);
  x.fillStyle = '#fff3e0'; x.fillRect(1, 1, 9, 14);
  x.fillStyle = '#f7e2c6'; x.fillRect(1, 12, 9, 3);
  x.drawImage(flowerBig('daisy', '#ffffff'), 0, 0, 20, 20, 1, 3, 9, 9);
  x.fillStyle = '#e05a7a'; x.fillRect(5, 0, 1, 2);
  return c;
}

export default async function epilogue(game) {
  const style = el('style', '', CSS + EXTRA_CSS); document.head.appendChild(style);
  const root = el('div', 'dc');
  game.app.appendChild(root);
  ui.hud(false); ui.chapter(''); input.setMode('none');
  audio.playMusic('hill', 3); audio.setBeds([], 1); audio.setMusicLevel(0.6);

  root.innerHTML = `
    <nav class="dc-rail"><div class="dc-ico">${DISCORD_LOGO}</div><div class="dc-sep"></div><div class="dc-ico active">${esc(D.serverInitials)}</div></nav>
    <aside class="dc-side">
      <div class="top"><span>${esc(D.serverName)}</span></div>
      <div class="dc-list"><div class="dc-cat">Kênh chat</div>${D.textChannels.map((c) => `<div class="dc-item">${ICON.hash}${esc(c)}</div>`).join('')}<div class="dc-cat">Kênh thoại</div><div class="dc-item active">${ICON.speaker}${esc(D.voiceChannel)}</div><div class="dc-voice-users"></div></div>
      <div class="dc-vc on"><b>${ICON.speaker}${esc(D.voiceConnected)}</b><small>${esc(D.voiceChannel)} / ${esc(D.serverName)}</small></div>
      <div class="dc-user"><div class="av"></div><div class="nm">${esc(D.hazeiHandle)}<small>${esc(D.online)}</small></div><div class="ic">${ICON.mic}${ICON.head}${ICON.gear}</div></div>
    </aside>
    <main class="dc-main">
      <div class="dc-head">${ICON.speaker}${esc(D.voiceChannel)}</div>
      <div class="dc-ep-tiles"></div>
      <div class="dc-msgs"><div class="spacer"></div></div>
      <div class="dc-typing"><span><i></i> <i></i> <i></i></span><span><b>${esc(D.partnerHandle)}</b> ${esc(D.typing)}</span></div>
      <div class="dc-ep-actions"></div>
    </main>
    <aside class="dc-members"><div class="dc-cat">${esc(D.online)} — 2</div></aside>`;
  root.querySelector('.dc-user .av').appendChild(avatarNode('hazei'));
  const vu = root.querySelector('.dc-voice-users');
  const uP = el('div', 'u speak'); uP.append(avatarNode('partner'), document.createTextNode(D.partnerHandle));
  const uH = el('div', 'u'); uH.append(avatarNode('hazei'), document.createTextNode(D.hazeiHandle));
  vu.append(uP, uH);
  const tiles = root.querySelector('.dc-ep-tiles');
  const tP = el('div', 'dc-tile p speak'); tP.append(avatarNode('partner'), el('div', 'lbl', esc(D.partnerHandle)));
  const tH = el('div', 'dc-tile h'); tH.append(avatarNode('hazei'), el('div', 'lbl', esc(D.hazeiHandle)));
  tiles.append(tP, tH);
  const speak = setInterval(() => { const p = Math.random() < 0.7; tP.classList.toggle('speak', p); uP.classList.toggle('speak', p); }, 650);
  const msgs = root.querySelector('.dc-msgs');
  const typing = root.querySelector('.dc-typing');
  const actions = root.querySelector('.dc-ep-actions');

  await ui.fade(false, { dark: true, ms: 1200 });
  audio.sfx('join');

  let lastFrom = null;
  const addMsg = (from, node) => {
    const first = from !== lastFrom; lastFrom = from;
    const m = el('div', 'dc-msg' + (first ? ' first' : ''));
    const av = el('div', 'av'); if (first) av.appendChild(avatarNode(from));
    const body = el('div', ''); body.style.minWidth = '0';
    if (first) body.appendChild(el('div', 'meta', `<b class="${from === 'partner' ? 'p' : 'h'}">${esc(from === 'partner' ? D.partnerHandle : D.hazeiHandle)}</b><small>${esc(D.today)} ${now()}</small>`));
    body.appendChild(typeof node === 'string' ? el('div', 'tx', esc(node)) : node);
    m.append(av, body); msgs.appendChild(m);
    msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
  };
  const type = async (ms) => { typing.classList.add('on'); await wait(ms); typing.classList.remove('on'); };

  await wait(800);
  for (const t of E.messages) { await type(Math.min(2400, 700 + t.length * 30)); addMsg('partner', t); audio.sfx('notify'); await wait(500); }

  // wish
  const parts = wishParts(state.data);
  await type(1800);
  addMsg('partner', el('div', 'dc-wish', `<div class="o">${esc(parts.opening)}</div><ul>${parts.fragments.map((f) => `<li>${esc(f)}</li>`).join('')}</ul><div>${esc(parts.closing)}</div><div class="f">${esc(parts.footer)}</div>`));
  audio.sfx('chime');
  await wait(1200);

  // attachments
  await type(1400);
  const att = el('div', '');
  att.appendChild(el('div', 'tx', esc(E.attachmentsLabel) + ' 📎'));
  const grid = el('div', 'dc-att');
  const fig = (node, caption, dl) => {
    const f = el('figure'); f.appendChild(node);
    const cap = el('figcaption', '', `<span>${esc(caption)}</span>`);
    const b = el('button', '', esc(content.ui.download)); b.onclick = dl; cap.appendChild(b);
    f.appendChild(cap); grid.appendChild(f);
  };
  const bq = drawBouquet(state.data.flowers, 192).canvas;
  bq.style.background = 'radial-gradient(#ffe9f0, #ffd2df)';
  fig(bq, E.bouquetLabel, () => downloadCanvas(drawBouquet(state.data.flowers, 576).canvas, 'bo-hoa-cua-hazei.png'));
  const card = wishCard(parts, state.data.flowers);
  const cardPrev = el('img'); cardPrev.src = card.toDataURL('image/png'); cardPrev.alt = '';
  fig(cardPrev, E.wishLabel, () => downloadCanvas(card, 'loi-chuc-20-10.png'));
  const photos = await album.list();
  photos.forEach((p, i) => { const img = new Image(); img.src = p.dataUrl; img.alt = p.title || ''; fig(img, p.title || content.ui.photo, () => { const a = document.createElement('a'); a.href = p.dataUrl; a.download = `hazei-${i + 1}.png`; a.click(); }); });
  att.appendChild(grid);
  if (state.data.bookmark) {
    const k = el('div', 'dc-keep');
    const bc = document.createElement('canvas'); bc.width = 44; bc.height = 64; const bx = bc.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(bookmarkArt(), 0, 0, 44, 64);
    k.append(bc, el('div', '', `<b>${esc(content.bookshop.bookmark.name)}</b><small>${esc(content.bookshop.bookmark.desc)}</small>`));
    att.appendChild(k);
  }
  addMsg('partner', att);
  audio.sfx('notify');
  await wait(900);
  await type(1200);
  addMsg('partner', E.signoff);
  audio.sfx('heart');

  // actions
  const save = el('button', 'dc-btn blurple', esc(content.wish.saveCard)); save.onclick = () => downloadCanvas(card, 'loi-chuc-20-10.png');
  const all = el('button', 'dc-btn', esc(E.downloadAll)); all.onclick = async () => {
    downloadCanvas(card, 'loi-chuc-20-10.png'); await wait(300);
    downloadCanvas(drawBouquet(state.data.flowers, 576).canvas, 'bo-hoa-cua-hazei.png');
    for (let i = 0; i < photos.length; i++) { await wait(300); const a = document.createElement('a'); a.href = photos[i].dataUrl; a.download = `hazei-${i + 1}.png`; a.click(); }
  };
  const replay = el('button', 'dc-btn ghost', '↺ ' + esc(E.replay));
  actions.append(save, all, replay);
  msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });

  const result = await new Promise((resolve) => {
    replay.onclick = () => {
      ui.modal((s) => {
        s.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:18px">${esc(E.replayConfirm)}</p>`);
        const row = el('div', 'row'); const y = el('button', 'btn', esc(content.ui.yes)); const n = el('button', 'btn soft', esc(content.ui.no));
        y.onclick = () => { ui.closeModal(); resolve('restart'); }; n.onclick = () => ui.closeModal();
        row.append(y, n); s.appendChild(row);
      });
    };
  });
  clearInterval(speak);
  await ui.fade(true, { dark: true });
  root.remove(); style.remove();
  state.reset({ keepAlbum: true }); ui.flowers(0);
  audio.stopAll(1);
  return result;
}

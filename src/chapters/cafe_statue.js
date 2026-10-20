// Plaster-figure painting at the café: pick a little white figure, tap a part to
// fill it with paint or dab details with a fine brush. The finished figure goes
// on the window sill to dry and into the album.
import content from '../content.js';
import { canvas, shade, light, outline, hex2rgb, INK } from '../core/sprites.js';
import { audio } from '../core/audio.js';
import { ui, esc, el } from '../core/ui.js';

const C = content.cafe.statue;
export const SW = 36, SH = 46;
const PLASTER = '#f3eee6';
const GOLD = '#e3b44a';
const PAINTS = ['#fbf7ef', '#f6e3c4', '#f7b6c8', '#e9607a', '#f29a52', '#f6d35f', '#a8dcb0', '#5fa865', '#9cc9ee', '#5b7fd0', '#b9a3e3', '#a0704c', '#3a2633', 'gold'];

// Shapes are laid down in order, later ones on top.
// e: ellipse cx cy rx ry · r: rect x y w h [flat] · t: triangle · z: trapezoid y h top-left top-right bottom-left bottom-right · p: pixels
const FIGURES = {
  cat: [
    ['e', 'base', 18, 41, 15, 3],
    ['e', 'tail', 29, 34, 4, 3],
    ['e', 'body', 18, 31, 11, 9],
    ['e', 'belly', 18, 33, 6, 6],
    ['e', 'feet', 13, 39, 3, 2], ['e', 'feet', 23, 39, 3, 2],
    ['e', 'paw', 27, 24, 3, 4], ['e', 'paw', 28, 18, 3, 3],
    ['t', 'ears', [8, 13], [10, 4], [16, 10]], ['t', 'ears', [20, 10], [26, 4], [28, 13]],
    ['t', 'inner', [10, 11], [11, 7], [14, 10]], ['t', 'inner', [22, 10], [25, 7], [26, 11]],
    ['e', 'head', 18, 16, 10, 8],
    ['r', 'eyes', 13, 15, 2, 3, 1], ['r', 'eyes', 21, 15, 2, 3, 1],
    ['e', 'cheeks', 11, 19.5, 1.6, 1], ['e', 'cheeks', 25, 19.5, 1.6, 1],
    ['r', 'nose', 17, 19, 2, 1],
    ['r', 'collar', 10, 23, 16, 2],
    ['e', 'bell', 18, 26, 2, 2],
  ],
  bunny: [
    ['e', 'base', 18, 41, 14, 3],
    ['e', 'ears', 13.5, 10, 3, 7.5], ['e', 'ears', 22.5, 10, 3, 7.5],
    ['e', 'inner', 13.5, 10, 1.2, 5.5], ['e', 'inner', 22.5, 10, 1.2, 5.5],
    ['e', 'body', 18, 32, 10, 8.5],
    ['e', 'feet', 13, 39, 3.5, 2], ['e', 'feet', 23, 39, 3.5, 2],
    ['e', 'head', 18, 20, 9, 7],
    ['r', 'eyes', 13, 19, 2, 3, 1], ['r', 'eyes', 21, 19, 2, 3, 1],
    ['e', 'cheeks', 11, 24, 1.6, 1], ['e', 'cheeks', 25, 24, 1.6, 1],
    ['r', 'nose', 17, 23, 2, 1],
    ['e', 'leaves', 16.5, 26.5, 1.2, 2.2], ['e', 'leaves', 19.5, 26.5, 1.2, 2.2],
    ['t', 'carrot', [14, 28], [22, 28], [18, 38]],
    ['e', 'paws', 13.5, 30, 2.5, 2.2], ['e', 'paws', 22.5, 30, 2.5, 2.2],
  ],
  bear: [
    ['e', 'base', 18, 41, 15, 3],
    ['e', 'ears', 10, 10, 3.5, 3.5], ['e', 'ears', 26, 10, 3.5, 3.5],
    ['e', 'inner', 10, 10, 1.6, 1.6], ['e', 'inner', 26, 10, 1.6, 1.6],
    ['e', 'body', 18, 31, 11, 9.5],
    ['e', 'belly', 18, 33, 7, 6],
    ['e', 'feet', 12.5, 39, 3.5, 2.2], ['e', 'feet', 23.5, 39, 3.5, 2.2],
    ['e', 'head', 18, 17, 10, 8],
    ['e', 'muzzle', 18, 20.5, 4, 2.8],
    ['e', 'nose', 18, 19.5, 1.6, 1],
    ['r', 'eyes', 13, 15, 2, 3, 1], ['r', 'eyes', 21, 15, 2, 3, 1],
    ['e', 'cheeks', 10.5, 20, 1.6, 1], ['e', 'cheeks', 25.5, 20, 1.6, 1],
    ['e', 'heart', 15.8, 30, 2.6, 2.4], ['e', 'heart', 20.2, 30, 2.6, 2.4], ['t', 'heart', [13, 31], [23, 31], [18, 36.5]],
    ['e', 'paws', 12.5, 31, 2.6, 2.6], ['e', 'paws', 23.5, 31, 2.6, 2.6],
  ],
  cactus: [
    ['e', 'body', 18, 17, 6.5, 11],
    ['e', 'arms', 9.5, 14, 2.6, 4.5], ['e', 'arms', 11.5, 19, 3.5, 2.2],
    ['e', 'arms', 26.5, 11, 2.6, 4], ['e', 'arms', 24.5, 16, 3.5, 2.2],
    ['p', 'spines', [[15, 10], [21, 9], [18, 23], [22, 21], [14, 21], [9, 12], [27, 9]]],
    ['e', 'flower', 18, 6, 3.4, 2.4],
    ['e', 'fcenter', 18, 6, 1.2, 1],
    ['r', 'eyes', 15, 15, 1, 2, 1], ['r', 'eyes', 20, 15, 1, 2, 1],
    ['e', 'cheeks', 13.5, 18, 1.4, 0.9], ['e', 'cheeks', 22.5, 18, 1.4, 0.9],
    ['r', 'soil', 11, 27, 14, 2],
    ['z', 'pot', 30, 12, 10, 26, 12.5, 23.5],
    ['r', 'rim', 8, 28, 20, 3],
  ],
};
// ---------------------------------------------------------------- figure maps
const built = new Map();
function figure(id) {
  if (built.has(id)) return built.get(id);
  const keys = [], reg = new Int16Array(SW * SH).fill(-1), lev = new Int8Array(SW * SH), edge = new Uint8Array(SW * SH);
  const kid = (k) => { let i = keys.indexOf(k); if (i < 0) { keys.push(k); i = keys.length - 1; } return i; };
  const set = (i, j, r, l) => { if (i >= 0 && j >= 0 && i < SW && j < SH) { reg[j * SW + i] = r; lev[j * SW + i] = l; } };
  for (const s of FIGURES[id]) {
    const r = kid(s[1]);
    if (s[0] === 'e') {
      // lit from the upper left, with a small glint on the bigger rounds
      const [, , cx, cy, rx, ry] = s;
      for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
        const nx = (i + 0.5 - cx) / rx, ny = (j + 0.5 - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        const k = nx * 0.6 + ny * 0.8;
        let l = k > 0.5 ? -1 : k < -0.45 ? 1 : 0;
        if (rx >= 3 && (nx + 0.4) ** 2 + (ny + 0.5) ** 2 < 0.05) l = 2;
        set(i, j, r, l);
      }
    } else if (s[0] === 'r') {
      const [, , x, y, w, h, flat] = s;
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, r, flat ? (i === x && j === y ? 2 : 0) : i === x || j === y ? 1 : i === x + w - 1 || j === y + h - 1 ? -1 : 0);
    } else if (s[0] === 't') {
      const [, , a, b, c] = s;
      for (let j = Math.floor(Math.min(a[1], b[1], c[1])); j <= Math.max(a[1], b[1], c[1]); j++) {
        const row = [];
        for (let i = Math.floor(Math.min(a[0], b[0], c[0])); i <= Math.max(a[0], b[0], c[0]); i++) {
          const px = i + 0.5, py = j + 0.5;
          const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]), d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]), d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
          if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) row.push(i);
        }
        row.forEach((i, k) => set(i, j, r, k === 0 ? 1 : k === row.length - 1 ? -1 : 0));
      }
    } else if (s[0] === 'z') {
      const [, , y, h, a0, a1, b0, b1] = s;
      for (let k = 0; k < h; k++) {
        const f = k / (h - 1), l0 = Math.round(a0 + (b0 - a0) * f), l1 = Math.round(a1 + (b1 - a1) * f);
        for (let i = l0; i < l1; i++) set(i, y + k, r, i === l0 ? 1 : i >= l1 - 2 ? -1 : 0);
      }
    } else if (s[0] === 'p') s[2].forEach(([i, j]) => set(i, j, r, 0));
  }
  // a fine groove where one part meets another
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
    const k = j * SW + i, r = reg[k]; if (r < 0) continue;
    const rr = i + 1 < SW ? reg[k + 1] : -1, rb = j + 1 < SH ? reg[k + SW] : -1;
    if ((rr >= 0 && rr !== r) || (rb >= 0 && rb !== r)) edge[k] = 1;
  }
  const F = { id, keys, reg, lev, edge };
  built.set(id, F);
  return F;
}

const toneCache = new Map();
const tone = (col, l, e) => {
  const key = col + l + e; let v = toneCache.get(key);
  if (!v) {
    let c = l === 1 ? light(col, 0.22) : l === -1 ? shade(col, 0.2) : l === 2 ? light(col, 0.5) : col;
    if (e) c = shade(c, 0.18);
    toneCache.set(key, (v = hex2rgb(c)));
  }
  return v;
};
const twinkle = (k, f) => { const h = Math.sin(k * 12.9898 + f * 78.233) * 43758.5453; return h - Math.floor(h); };

// paint state -> outlined canvas. colors: per region index; over: brush dabs by pixel
export function renderFigure(F, colors, over, t = 0, anim = null) {
  const [c, x] = canvas(SW, SH);
  const img = x.createImageData(SW, SH), d = img.data, f = Math.floor(t * 3);
  for (let k = 0; k < SW * SH; k++) {
    const r = F.reg[k]; if (r < 0) continue;
    let col = over.get(k) ?? colors[r] ?? PLASTER;
    if (anim && r === anim.r && !over.has(k) && Math.hypot((k % SW) - anim.x, Math.floor(k / SW) - anim.y) > anim.rad) col = anim.old ?? PLASTER;
    const gold = col === 'gold';
    let rgb = tone(gold ? GOLD : col, F.lev[k], F.edge[k]);
    if (gold && twinkle(k, f) < 0.07) rgb = hex2rgb('#fff6c8');
    d[k * 4] = rgb[0]; d[k * 4 + 1] = rgb[1]; d[k * 4 + 2] = rgb[2]; d[k * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return outline(c, INK);
}
// a small copy for the window sill
export function miniFigure(src, w = 13, h = 17) {
  const [c, x] = canvas(w - 2, h - 2);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 1, 1, SW - 2, SH - 2, 0, 0, w - 2, h - 2);
  const d = x.getImageData(0, 0, w - 2, h - 2);
  for (let k = 3; k < d.data.length; k += 4) d.data[k] = d.data[k] > 110 ? 255 : 0;
  x.putImageData(d, 0, 0);
  const [o, ox] = canvas(w, h); ox.drawImage(c, 1, 1);
  return outline(o, INK);
}
// the album picture: the figure on the café table, paint pots beside it
export function statuePhoto(mine) {
  const [c, x] = canvas(120, 90);
  x.fillStyle = '#efe2c8'; x.fillRect(0, 0, 120, 90);
  x.fillStyle = '#e6d5b6'; for (let j = 8; j < 60; j += 14) for (let i = (j % 28 ? 12 : 0) + 6; i < 120; i += 24) x.fillRect(i, j, 1, 4);
  x.fillStyle = '#6e4630'; x.fillRect(0, 56, 120, 16); x.fillStyle = '#c99566'; x.fillRect(0, 56, 120, 2);
  x.fillStyle = '#8c5c3e'; x.fillRect(0, 70, 120, 20); x.fillStyle = '#b07a52'; x.fillRect(0, 70, 120, 1);
  x.globalAlpha = 0.25; x.fillStyle = '#3a2418'; x.fillRect(40, 79, 40, 2); x.globalAlpha = 1;
  x.drawImage(mine, 42, 35);
  // paint pots and a brush beside it
  [['#f7b6c8', 24], ['#5fa865', 29]].forEach(([col, px]) => { x.fillStyle = '#fbf7ef'; x.fillRect(px, 74, 4, 4); x.fillStyle = col; x.fillRect(px, 74, 4, 1); });
  x.fillStyle = '#c99566'; x.fillRect(100, 76, 12, 1); x.fillStyle = '#3a2633'; x.fillRect(98, 76, 2, 1);
  x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.08; x.fillStyle = '#ffe2b0';
  x.beginPath(); x.moveTo(0, 0); x.lineTo(50, 0); x.lineTo(110, 90); x.lineTo(60, 90); x.closePath(); x.fill(); x.restore();
  return c;
}

// ---------------------------------------------------------------- the modal
const toXY = (cv, e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height]; };
const big = (src, k) => { const [c, x] = canvas(src.width * k, src.height * k); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height); return c; };

// Resolves to { id, img } with the painted figure, or null if closed.
export function paintStatue() {
  return new Promise((resolve) => {
    let result = null;
    ui.onModalClose = () => resolve(result);
    ui.modal((s) => {
      s.classList.add('statue');
      s.insertAdjacentHTML('beforeend', `<h2>🎨 ${esc(C.pickTitle)}</h2><p class="sub">${esc(C.pickHint)}</p>`);
      const g = el('div', 'grid-opts');
      Object.keys(FIGURES).forEach((id) => {
        const b = el('button', 'opt');
        const pv = big(renderFigure(figure(id), [], new Map()), 3); pv.style.cssText = 'width:72px;height:92px';
        b.append(pv, el('span', 'n', esc(C.figures[id])));
        b.onclick = () => { audio.sfx('select'); studio(s, id); };
        g.appendChild(b);
      });
      s.appendChild(g);
    });
    function studio(s, id) {
      const F = figure(id);
      s.querySelectorAll(':scope > :not(.x)').forEach((n) => n.remove());
      s.insertAdjacentHTML('beforeend', `<h2>🎨 ${esc(C.figures[id])}</h2><p class="sub">${esc(C.hint)}</p>`);
      const wrap = el('div', 'statue-wrap'); s.appendChild(wrap);
      const OX = 8, OY = 2, cv = document.createElement('canvas'); cv.width = SW + 16; cv.height = SH + 6; cv.className = 'stage';
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      wrap.appendChild(cv);
      const side = el('div', 'statue-side'); wrap.appendChild(side);
      const now = el('div', 'now', ''); side.appendChild(now);
      let colors = [], over = new Map(), paint = PAINTS[2], tool = 'fill', anim = null;
      const undo = [];
      const snap = () => { undo.push({ colors: colors.slice(), over: new Map(over) }); if (undo.length > 40) undo.shift(); undoB.disabled = false; };
      // paints
      const sw = el('div', 'swatches');
      PAINTS.forEach((col, i) => {
        const b = el('button', 'swatch' + (col === paint ? ' sel' : '') + (col === 'gold' ? ' gold' : ''));
        if (col !== 'gold') b.style.background = col;
        b.title = C.paints[i]; b.setAttribute('aria-label', C.paints[i]);
        b.onclick = () => { paint = col; sw.querySelectorAll('.swatch').forEach((e) => e.classList.toggle('sel', e === b)); audio.sfx('tick'); };
        sw.appendChild(b);
      });
      side.appendChild(sw);
      // tools
      const tr = el('div', 'tool-row');
      const fillB = el('button', 'btn soft on', '🪣 ' + esc(C.tools.fill)), brushB = el('button', 'btn soft', '🖌️ ' + esc(C.tools.brush));
      const setTool = (t) => { tool = t; fillB.classList.toggle('on', t === 'fill'); brushB.classList.toggle('on', t === 'brush'); audio.sfx('tick'); };
      fillB.onclick = () => setTool('fill'); brushB.onclick = () => setTool('brush');
      const undoB = el('button', 'btn soft', '↶ ' + esc(C.tools.undo)); undoB.disabled = true;
      undoB.onclick = () => { const u = undo.pop(); if (!u) return; colors = u.colors; over = u.over; anim = null; undoB.disabled = !undo.length; audio.sfx('page'); };
      tr.append(fillB, brushB, undoB); side.appendChild(tr);
      const doneB = el('button', 'btn gold', '✨ ' + esc(C.tools.done));
      doneB.onclick = () => { audio.sfx('yay'); result = { id, img: renderFigure(F, colors, over) }; ui.closeModal(); };
      const dr = el('div', 'row'); dr.appendChild(doneB); side.appendChild(dr);

      const t0 = performance.now();
      const draw = () => {
        if (!cv.isConnected) return;
        const t = (performance.now() - t0) / 1000;
        if (anim) { anim.rad = (performance.now() - anim.at) / 1000 * 90; if (anim.rad > 60) anim = null; }
        // a soft backdrop and the little table the figure stands on
        x.fillStyle = '#fbf3e6'; x.fillRect(0, 0, cv.width, cv.height);
        x.fillStyle = '#f4e6cf'; for (let j = 0; j < cv.height; j += 2) for (let i = (j / 2) % 2; i < cv.width; i += 4) x.fillRect(i, j, 1, 1);
        x.fillStyle = '#c99566'; x.fillRect(0, cv.height - 4, cv.width, 4); x.fillStyle = '#e0b07a'; x.fillRect(0, cv.height - 4, cv.width, 1);
        x.globalAlpha = 0.18; x.fillStyle = '#3a2418'; x.fillRect(OX + 4, cv.height - 4, SW - 8, 1); x.globalAlpha = 1;
        x.drawImage(renderFigure(F, colors, over, t, anim), OX, OY);
        requestAnimationFrame(draw);
      };
      draw();

      const at = (e) => { const [px, py] = toXY(cv, e); const i = Math.floor(px - OX), j = Math.floor(py - OY); return i >= 0 && j >= 0 && i < SW && j < SH ? [i, j, F.reg[j * SW + i]] : [i, j, -1]; };
      const label = (r) => { now.textContent = r >= 0 ? `${C.painting}: ${C.parts[F.keys[r]] || ''}` : ''; };
      let last = null;
      const dab = (i, j) => { const k = j * SW + i; if (i >= 0 && j >= 0 && i < SW && j < SH && F.reg[k] >= 0) over.set(k, paint); };
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const [i, j, r] = at(e);
        if (tool === 'fill') {
          if (r < 0) return;
          snap();
          anim = { r, x: i, y: j, rad: 0, at: performance.now(), old: colors[r] };
          colors[r] = paint;
          for (const k of [...over.keys()]) if (F.reg[k] === r) over.delete(k);
          audio.sfx('pop', { pitch: (r * 3) % 7 }); label(r);
          return;
        }
        snap(); cv.setPointerCapture(e.pointerId); last = [i, j]; dab(i, j); audio.sfx('tick'); label(r);
      });
      cv.addEventListener('pointermove', (e) => {
        if (tool === 'fill' || !last) return;
        const [i, j] = at(e), n = Math.max(Math.abs(i - last[0]), Math.abs(j - last[1]), 1);
        for (let k = 1; k <= n; k++) dab(Math.round(last[0] + (i - last[0]) * k / n), Math.round(last[1] + (j - last[1]) * k / n));
        last = [i, j];
      });
      const up = () => { last = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    }
  });
}

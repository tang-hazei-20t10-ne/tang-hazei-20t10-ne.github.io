// Pixel prop & background generators for 2D scenes. All procedural, cached.
import { canvas, outline, shade, light, mix, INK } from '../core/sprites.js';

const cache = new Map();
const cached = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };
export function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const disc = (x, cx, cy, r, col, sx = 1, sy = 1) => {
  x.fillStyle = col;
  for (let j = -r; j <= r; j++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r - j * j)) * sx);
    x.fillRect(Math.round(cx - w), Math.round(cy + j * sy), w * 2 + 1, Math.ceil(sy));
  }
};

// Round, cherry or pine tree. Returns { img, ox, oy } with pivot at trunk base.
export function treeSprite(kind = 'round', size = 1, seed = 1, colors = {}) {
  return cached(`tree${kind}${size}${seed}${JSON.stringify(colors)}`, () => {
    const r = rand(seed);
    const S = Math.round(40 * size);
    const W = S + 8, H = Math.round(S * 1.4) + 6;
    const [c, x] = canvas(W, H);
    const base = colors.leaf || (kind === 'cherry' ? '#f4a6c0' : kind === 'pine' ? '#3e8a5f' : '#5fae5a');
    const dark = shade(base, 0.3), lite = light(base, 0.35);
    const trunk = colors.trunk || '#7a4a33';
    const cx = W / 2;
    const tH = Math.round(S * 0.45);
    x.fillStyle = trunk; x.fillRect(cx - 2, H - tH - 1, 4, tH);
    x.fillStyle = shade(trunk, 0.3); x.fillRect(cx + 1, H - tH - 1, 1, tH);
    x.fillStyle = trunk; x.fillRect(cx - 4, H - 3, 8, 2);
    if (kind === 'pine') {
      for (let i = 0; i < 4; i++) {
        const w = Math.round(S * (0.5 - i * 0.09)), y = H - tH - i * Math.round(S * 0.22);
        for (let j = 0; j < S * 0.32; j++) { const ww = Math.round(w * (j / (S * 0.32))); x.fillStyle = j > S * 0.26 ? dark : base; x.fillRect(cx - ww, y - S * 0.32 + j, ww * 2, 1); x.fillStyle = lite; x.fillRect(cx - ww, y - S * 0.32 + j, Math.max(1, ww * 0.5), 1); }
      }
    } else {
      const blobs = [];
      const cy = H - tH - S * 0.32;
      blobs.push([cx, cy, S * 0.36]);
      for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2; blobs.push([cx + Math.cos(a) * S * 0.25, cy + Math.sin(a) * S * 0.18, S * (0.18 + r() * 0.12)]); }
      blobs.forEach(([bx, by, br]) => disc(x, bx, by + 2, Math.round(br), dark));
      blobs.forEach(([bx, by, br]) => disc(x, bx, by, Math.round(br * 0.92), base));
      blobs.forEach(([bx, by, br]) => disc(x, bx - br * 0.25, by - br * 0.3, Math.round(br * 0.5), lite));
      // leaf texture speckles
      for (let i = 0; i < S * 1.5; i++) {
        const px = Math.round(cx + (r() - 0.5) * S * 0.9), py = Math.round(cy + (r() - 0.5) * S * 0.7);
        const d = x.getImageData(px, py, 1, 1).data; if (d[3] < 200) continue;
        x.fillStyle = r() < 0.5 ? dark : lite; x.fillRect(px, py, 1, 1);
      }
      if (kind === 'cherry') for (let i = 0; i < S * 0.6; i++) { const px = Math.round(cx + (r() - 0.5) * S * 0.8), py = Math.round(cy + (r() - 0.5) * S * 0.6); const d = x.getImageData(px, py, 1, 1).data; if (d[3] < 200) continue; x.fillStyle = '#fff0f5'; x.fillRect(px, py, 1, 1); }
      if (kind === 'round' && colors.fruit) for (let i = 0; i < 6; i++) { const px = Math.round(cx + (r() - 0.5) * S * 0.6), py = Math.round(cy + (r() - 0.5) * S * 0.4); x.fillStyle = colors.fruit; x.fillRect(px, py, 2, 2); }
    }
    return { img: outline(c, colors.outline || shade(base, 0.65)), ox: Math.round(W / 2), oy: H - 1, canopyH: Math.round(H - tH) };
  });
}

// Draw a sprite with a wind sway applied to its upper part.
export function drawSway(x, s, px, py, t, amp = 1, phase = 0) {
  const img = s.img; const h = img.height; const top = s.canopyH || h;
  const step = 2;
  for (let j = 0; j < h; j += step) {
    const k = j < top ? (1 - j / top) : 0;
    const off = Math.round(Math.sin(t * 1.4 + phase + j * 0.05) * amp * k * k * 2);
    x.drawImage(img, 0, j, img.width, step, Math.round(px - s.ox + off), Math.round(py - s.oy + j), img.width, step);
  }
}

export function bushSprite(seed = 1, col = '#5fae5a', flowers = null) {
  return cached(`bush${seed}${col}${flowers}`, () => {
    const r = rand(seed);
    const [c, x] = canvas(26, 14);
    for (let i = 0; i < 5; i++) disc(x, 5 + i * 4 + r() * 2, 9 - r() * 3, 4 + Math.round(r() * 2), shade(col, 0.25));
    for (let i = 0; i < 5; i++) disc(x, 5 + i * 4 + r() * 2, 8 - r() * 3, 3 + Math.round(r() * 2), col);
    for (let i = 0; i < 8; i++) { x.fillStyle = light(col, 0.35); x.fillRect(4 + r() * 18 | 0, 4 + r() * 4 | 0, 2, 1); }
    if (flowers) for (let i = 0; i < 6; i++) { x.fillStyle = flowers; x.fillRect(3 + r() * 20 | 0, 4 + r() * 7 | 0, 2, 2); }
    x.clearRect(0, 13, 26, 1);
    return outline(c, shade(col, 0.6));
  });
}

export function bench(color = '#b5794a') {
  return cached('bench' + color, () => {
    const [c, x] = canvas(30, 16);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(2, 2, 26, 2, color); P(2, 5, 26, 2, color); P(2, 2, 26, 1, light(color, 0.3));
    P(1, 9, 28, 2, color); P(1, 9, 28, 1, light(color, 0.3)); P(1, 11, 28, 1, shade(color, 0.3));
    P(4, 4, 2, 12, '#4a3a44'); P(24, 4, 2, 12, '#4a3a44'); P(3, 12, 4, 1, '#4a3a44'); P(23, 12, 4, 1, '#4a3a44');
    return outline(c);
  });
}

export function signpost(text = '→') {
  return cached('sign' + text, () => {
    const [c, x] = canvas(26, 26);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(12, 8, 3, 18, '#7a4a33'); P(13, 8, 1, 18, '#9a6a43');
    P(2, 4, 20, 8, '#d9a066'); P(22, 6, 2, 4, '#d9a066'); P(24, 7, 1, 2, '#d9a066'); P(2, 4, 20, 1, '#f0c890'); P(2, 11, 20, 1, '#a8703f');
    P(6, 7, 10, 1, '#7a4a33'); P(14, 6, 1, 3, '#7a4a33'); P(15, 7, 1, 1, '#7a4a33');
    return outline(c);
  });
}

export function lamp(lit = false) {
  return cached('lamp' + lit, () => {
    const [c, x] = canvas(12, 40);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(5, 8, 2, 31, '#3f3a4f'); P(3, 37, 6, 3, '#3f3a4f');
    P(2, 2, 8, 7, lit ? '#ffe59a' : '#cfd8e0'); P(1, 1, 10, 2, '#3f3a4f'); P(4, 0, 4, 1, '#3f3a4f'); P(2, 8, 8, 1, '#3f3a4f');
    return outline(c);
  });
}

export function fence(len = 40, color = '#e9dcc8') {
  return cached('fence' + len + color, () => {
    const [c, x] = canvas(len, 12);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(0, 3, len, 2, color); P(0, 7, len, 2, color); P(0, 3, len, 1, light(color, 0.3));
    for (let i = 1; i < len; i += 8) { P(i, 0, 3, 12, color); P(i + 2, 1, 1, 11, shade(color, 0.2)); P(i + 1, 0, 1, 1, light(color, 0.3)); }
    return outline(c);
  });
}

export function windmillBody() {
  return cached('windmill', () => {
    const [c, x] = canvas(36, 64);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    for (let j = 0; j < 50; j++) { const w = Math.round(8 + j * 0.24); P(18 - w, 14 + j, w * 2, 1, j % 9 === 0 ? '#e8dccb' : '#f6efe2'); P(18 + w - 3, 14 + j, 3, 1, '#d8c8b4'); }
    for (let j = 0; j < 12; j++) { const w = Math.round(10 - j * 0.8); P(18 - w, 3 + j, w * 2, 1, '#c4587a'); P(18 + w - 2, 3 + j, 2, 1, '#9a3f5e'); }
    P(15, 50, 6, 14, '#7a4a33'); P(15, 50, 6, 1, '#5a3423'); P(11, 28, 5, 6, '#7fb0d8'); P(20, 36, 5, 6, '#7fb0d8'); P(11, 28, 5, 1, '#5a6a8a'); P(20, 36, 5, 1, '#5a6a8a');
    return outline(c);
  });
}

export function drawWindmillBlades(x, cx, cy, ang, len = 26) {
  for (let b = 0; b < 4; b++) {
    const a = ang + b * Math.PI / 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 2; r < len; r++) {
      const px = Math.round(cx + ca * r), py = Math.round(cy + sa * r);
      x.fillStyle = '#5a3a2a'; x.fillRect(px, py, 1, 1);
      if (r > 6) { const nx = -sa, ny = ca; for (let w = 1; w < 5; w++) { x.fillStyle = (r + w) % 4 === 0 ? '#d8c8b4' : '#fffaf0'; x.fillRect(Math.round(px + nx * w), Math.round(py + ny * w), 1, 1); } }
    }
  }
  x.fillStyle = '#3a2a2a'; x.fillRect(cx - 2, cy - 2, 4, 4);
}

export function house(seed = 1, wall = '#f6e3cc', roof = '#d96a5a', w = 44, h = 34) {
  return cached(`house${seed}${wall}${roof}${w}${h}`, () => {
    const r = rand(seed);
    const [c, x] = canvas(w + 6, h + 18);
    const P = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); };
    const top = 18;
    P(3, top, w, h, wall); P(3 + w - 3, top, 3, h, shade(wall, 0.15));
    for (let j = 0; j < 16; j++) { const inset = Math.round(16 - j); P(3 + inset - 3, 2 + j, w - inset * 2 + 6, 1, j === 15 ? shade(roof, 0.3) : j % 3 === 0 ? light(roof, 0.15) : roof); }
    P(3, top - 1, w, 2, shade(roof, 0.3));
    const win = (wx, wy) => { P(wx, wy, 8, 8, '#ffe8a8'); P(wx, wy, 8, 1, '#5a4a5a'); P(wx + 3, wy, 1, 8, '#fff6d8'); P(wx, wy + 3, 8, 1, '#fff6d8'); P(wx - 1, wy + 8, 10, 1, '#8a5a3a'); };
    win(8, top + 6); if (w > 36) win(w - 12, top + 6);
    const dx = Math.round(w / 2 - 3 + (r() - 0.5) * 6);
    P(dx, top + h - 13, 8, 13, '#8a5a3a'); P(dx + 1, top + h - 12, 6, 12, '#a8703f'); P(dx + 5, top + h - 6, 1, 1, '#ffd23f');
    if (r() < 0.6) { P(w - 6, 4, 4, 8, '#9a6a5a'); P(w - 7, 3, 6, 2, '#7a4a3a'); }
    return outline(c);
  });
}

// ---------------------------------------------------------------- strips
// Rolling ridgeline (mountains/hills) strip with lit edge and shading.
export function ridgeStrip(w, h, { seed = 1, base, peak = 0.6, rough = 0.5, freq = 0.012, lit, snow = false, trees = 0, treeCol } = {}) {
  return cached(`ridge${w}${h}${seed}${base}${peak}${rough}${freq}${snow}${trees}`, () => {
    const r = rand(seed);
    const [c, x] = canvas(w, h);
    const ph = [r() * 10, r() * 10, r() * 10];
    const heights = [];
    for (let i = 0; i < w; i++) {
      const v = Math.sin(i * freq + ph[0]) * 0.5 + Math.sin(i * freq * 2.3 + ph[1]) * 0.3 * rough + Math.sin(i * freq * 5.1 + ph[2]) * 0.15 * rough;
      heights.push(Math.round(h * (1 - peak) + (v * 0.5 + 0.5) * -h * peak * 0.9 + h * peak * 0.4));
    }
    const dark = shade(base, 0.18), lite = lit || light(base, 0.25);
    for (let i = 0; i < w; i++) {
      const top = Math.max(0, heights[i]);
      x.fillStyle = base; x.fillRect(i, top, 1, h - top);
      const slope = (heights[i + 1] ?? heights[i]) - (heights[i - 1] ?? heights[i]);
      x.fillStyle = slope > 0 ? lite : dark; x.fillRect(i, top, 1, 2);
      if (snow && top < h * 0.45) { x.fillStyle = '#f6f2ff'; x.fillRect(i, top, 1, Math.max(1, Math.round((h * 0.45 - top) * 0.5))); }
      // vertical dither shading toward bottom
      for (let j = top + 6; j < h; j += 3) if (((i + j) % 4 === 0) && j > top + (h - top) * 0.5) { x.fillStyle = dark; x.fillRect(i, j, 1, 1); }
    }
    if (trees) {
      const tc = treeCol || shade(base, 0.25);
      for (let k = 0; k < trees; k++) {
        const i = Math.floor(r() * w); const top = heights[i]; const s = 2 + Math.floor(r() * 3);
        disc(x, i, top - s + 2, s, tc); x.fillStyle = tc; x.fillRect(i, top - 1, 1, 3);
        disc(x, i - 1, top - s + 1, Math.max(1, s - 2), light(tc, 0.2));
      }
    }
    return c;
  });
}

export function cloudSprite(seed = 1, col = '#fff8f0', shadeCol) {
  return cached(`cloud${seed}${col}`, () => {
    const r = rand(seed);
    const w = 40 + Math.floor(r() * 30);
    const [c, x] = canvas(w, 18);
    const sc = shadeCol || mix(col, '#c9a8d8', 0.35);
    const n = 4 + Math.floor(r() * 3);
    const blobs = [];
    for (let i = 0; i < n; i++) blobs.push([6 + (i / (n - 1)) * (w - 12), 11 - r() * 5, 4 + Math.round(r() * 4)]);
    blobs.forEach(([a, b, rr]) => disc(x, a, b + 1, rr, sc));
    blobs.forEach(([a, b, rr]) => disc(x, a, b - 1, rr - 1, col));
    x.clearRect(0, 15, w, 3);
    x.fillStyle = sc; x.fillRect(3, 14, w - 6, 1);
    return c;
  });
}

// Generic stall with awning: returns canvas; pivot bottom-left.
export function stall(seed = 1, awning = ['#e9809d', '#fff6ea'], w = 56) {
  return cached(`stall${seed}${awning}${w}`, () => {
    const [c, x] = canvas(w + 4, 52);
    const P = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a, b, ww, hh); };
    P(4, 14, 2, 38, '#7a4a33'); P(w - 4, 14, 2, 38, '#7a4a33');
    // awning stripes with scalloped edge
    for (let i = 0; i < w; i++) { const col = Math.floor(i / 6) % 2 ? awning[1] : awning[0]; P(i + 2, 4, 1, 10, col); P(i + 2, 4, 1, 1, light(col, 0.3)); }
    for (let i = 0; i < w; i += 6) { const col = Math.floor(i / 6) % 2 ? awning[1] : awning[0]; P(i + 3, 14, 4, 2, col); P(i + 4, 16, 2, 1, col); }
    P(2, 2, w, 2, shade(awning[0], 0.3));
    // counter
    P(1, 34, w + 2, 4, '#c98a54'); P(1, 34, w + 2, 1, '#e6ad74'); P(3, 38, w - 2, 14, '#a8703f'); P(3, 38, w - 2, 1, shade('#a8703f', 0.3));
    for (let i = 6; i < w; i += 10) P(i, 41, 1, 10, shade('#a8703f', 0.2));
    return outline(c);
  });
}

export function bunting(w, colors = ['#f08fa8', '#f6c45f', '#8fd3b6', '#7f9fdc', '#fff6ea']) {
  return cached('bunting' + w, () => {
    const [c, x] = canvas(w, 12);
    for (let i = 0; i < w; i++) { const y = Math.round(2 + Math.sin((i / w) * Math.PI) * 3); x.fillStyle = '#6b4f5e'; x.fillRect(i, y, 1, 1); }
    for (let i = 4, k = 0; i < w - 4; i += 9, k++) {
      const y = Math.round(3 + Math.sin((i / w) * Math.PI) * 3);
      x.fillStyle = colors[k % colors.length];
      for (let j = 0; j < 6; j++) x.fillRect(i + Math.floor(j / 2), y + j, 6 - j, 1);
    }
    return c;
  });
}

// Row of pastel two-storey shopfronts (background strip).
export function facadeStrip(w, h, seed = 1, fog = null) {
  return cached(`facade${w}${h}${seed}${fog}`, () => {
    const r = rand(seed);
    const [c, x] = canvas(w, h);
    const walls = ['#f6e3cc', '#fde8e0', '#e8f0e0', '#e6e4f6', '#fff1d6', '#f2d9c4'];
    const roofs = ['#d96a5a', '#7f9fdc', '#c4587a', '#6aa07a', '#e8a15c'];
    let px = 0;
    while (px < w) {
      const bw = 34 + Math.floor(r() * 26), bh = Math.round(h * (0.62 + r() * 0.3));
      let wall = walls[Math.floor(r() * walls.length)], roof = roofs[Math.floor(r() * roofs.length)];
      if (fog) { wall = mix(wall, fog, 0.25); roof = mix(roof, fog, 0.25); }
      const top = h - bh;
      x.fillStyle = wall; x.fillRect(px, top, bw, bh);
      x.fillStyle = shade(wall, 0.12); x.fillRect(px + bw - 2, top, 2, bh);
      x.fillStyle = roof; x.fillRect(px - 2, top - 4, bw + 4, 5); x.fillStyle = light(roof, 0.25); x.fillRect(px - 2, top - 4, bw + 4, 1);
      x.fillStyle = shade(roof, 0.3); x.fillRect(px - 2, top + 1, bw + 4, 1);
      for (let fy = top + 6; fy < h - 20; fy += 16) for (let fx = px + 5; fx < px + bw - 8; fx += 12) {
        x.fillStyle = '#5a4a5a'; x.fillRect(fx - 1, fy - 1, 9, 10);
        x.fillStyle = r() < 0.3 ? '#ffe8a8' : '#bfe0f0'; x.fillRect(fx, fy, 7, 8);
        x.fillStyle = '#fff'; x.fillRect(fx + 1, fy + 1, 2, 1);
        if (r() < 0.5) { x.fillStyle = roof; x.fillRect(fx - 1, fy + 8, 9, 2); x.fillStyle = ['#f08fa8', '#ffd23f', '#9b7fe0'][Math.floor(r() * 3)]; x.fillRect(fx, fy + 7, 2, 1); x.fillRect(fx + 4, fy + 7, 2, 1); }
      }
      // ground floor door
      x.fillStyle = shade(wall, 0.35); x.fillRect(px + bw / 2 - 5, h - 16, 10, 16);
      x.fillStyle = '#8a5a3a'; x.fillRect(px + bw / 2 - 4, h - 15, 8, 15);
      px += bw + 1 + Math.floor(r() * 3);
    }
    return outline(c, '#4a3a4a');
  });
}

export function cobbleStrip(w, h, seed = 2, base = '#d9c7a8') {
  return cached(`cobble${w}${h}${seed}${base}`, () => {
    const r = rand(seed);
    const [c, x] = canvas(w, h);
    x.fillStyle = shade(base, 0.2); x.fillRect(0, 0, w, h);
    for (let j = 0; j < h; j += 4) {
      const off = (j / 4) % 2 ? 3 : 0;
      for (let i = -off; i < w; i += 7) {
        const col = mix(base, ['#e8d6b8', '#cdb795', '#e2cfae'][Math.floor(r() * 3)], 0.5);
        x.fillStyle = col; x.fillRect(i + 1, j + 1, 5, 2);
        x.fillStyle = light(col, 0.3); x.fillRect(i + 1, j + 1, 3, 1);
      }
    }
    x.fillStyle = light(base, 0.35); x.fillRect(0, 0, w, 1);
    for (let j = Math.round(h * 0.6); j < h; j++) for (let i = j % 2; i < w; i += 2) { x.fillStyle = shade(base, 0.25); x.fillRect(i, j, 1, 1); }
    return c;
  });
}

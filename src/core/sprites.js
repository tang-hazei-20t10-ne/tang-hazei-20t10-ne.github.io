// Procedural pixel-art sprites. Everything is drawn pixel by pixel on small
// canvases, outlined automatically and cached, so 2D scenes and 3D billboards
// share one consistent look.
import content from '../content.js';

export const INK = '#2b1b28';

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false;
  return [c, x];
}

// ---------------------------------------------------------------- color utils
export function hex2rgb(h) {
  const n = parseInt(h.slice(1), 16);
  return h.length === 4
    ? [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17]
    : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgb2hex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
// Hue-shifted shading: shadows lean purple, highlights lean warm.
export const shade = (c, t = 0.25) => mix(c, '#3b2350', t);
export const light = (c, t = 0.3) => mix(c, '#fff4d6', t);

// Add a 1px outline around opaque pixels (outside only).
export function outline(src, color = INK, { diagonal = false } = {}) {
  const w = src.width, h = src.height;
  const [c, x] = canvas(w, h);
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const op = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 40;
  x.fillStyle = color;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (op(i, j)) continue;
    if (op(i - 1, j) || op(i + 1, j) || op(i, j - 1) || op(i, j + 1) || (diagonal && (op(i - 1, j - 1) || op(i + 1, j - 1) || op(i - 1, j + 1) || op(i + 1, j + 1)))) x.fillRect(i, j, 1, 1);
  }
  x.drawImage(src, 0, 0);
  return c;
}

export function flipX(src) {
  const [c, x] = canvas(src.width, src.height);
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}

const cache = new Map();
function cached(key, fn) {
  let v = cache.get(key);
  if (!v) { v = fn(); cache.set(key, v); }
  return v;
}

// ---------------------------------------------------------------- characters
// look: { kind:'hazei'|'partner'|'npc', hair, hairStyle, skin, top, dress, bottom, shoes, glasses, apron, chefHat, ... }
export const LOOKS = {
  hazei: () => ({ kind: 'hazei', hairStyle: 'long', ...content.hazeiLook }),
  partner: () => ({ kind: 'partner', ...content.partnerLook }),
  chef: { kind: 'npc', hair: '#4a3a33', hairStyle: 'short', skin: '#f2c49c', top: '#fbfbf6', bottom: '#3c3a4a', shoes: '#2f2a33', chefHat: true, beard: true },
  barista: { kind: 'npc', hair: '#6b3f2a', hairStyle: 'bun', skin: '#f7d2b4', top: '#e9dccb', bottom: '#4b3b38', shoes: '#3a2a2a', apron: '#4f6b5a' },
  bakerAunt: { kind: 'npc', hair: '#2e2329', hairStyle: 'bun', skin: '#f0c19c', top: '#f6a85e', bottom: '#7a4a5e', shoes: '#4a2f2a', apron: '#fff4e6' },
  florist: { kind: 'npc', hair: '#8a4b3a', hairStyle: 'long', skin: '#ffd9bd', top: '#9fd3a8', dress: '#5f9e78', shoes: '#4a3a2a', apron: '#fff4e6' },
  hatGuy: { kind: 'npc', hair: '#2a2028', hairStyle: 'messy', skin: '#e9b48e', top: '#f2d16b', bottom: '#46627a', shoes: '#2f2a33', strawHat: true },
  fruitUncle: { kind: 'npc', hair: '#d9d4d0', hairStyle: 'short', skin: '#e0a882', top: '#7bb3d9', bottom: '#5a4a3a', shoes: '#3a2a2a', apron: '#c96b4b' },
  shopLady: { kind: 'npc', hair: '#cfc6cf', hairStyle: 'bun', skin: '#f2c8a8', top: '#b48fd1', dress: '#7a5f9e', shoes: '#4a3a3a', glasses: true },
  kidA: { kind: 'kid', hair: '#3a2a22', hairStyle: 'short', skin: '#ffd2b0', top: '#ff9f6b', bottom: '#4a6fa8', shoes: '#fff' },
  kidB: { kind: 'kid', hair: '#2a1d22', hairStyle: 'pig', skin: '#f7c9a7', top: '#ffe066', dress: '#ef7d9a', shoes: '#c4587a' },
};

const FACE = { eyeL: 9, eyeR: 14 };

export function charSprite(look, o = {}) {
  const pose = o.pose || 'idle';
  const frame = o.frame || 0;
  const mood = o.mood || 'normal';
  const hat = o.hat || look.strawHat; const sung = o.sunglasses;
  const view = o.top ? 'top' : o.back ? 'back' : '';
  const key = [look.kind, look.hair, look.top, look.dress, look.bottom, look.hairStyle, look.glasses, look.apron, pose, frame, mood, hat, sung, look.chefHat, o.hold || '', view].join('|');
  return cached(key, () => outline(o.top ? drawTop(look, frame) : o.back ? drawBack(look, pose, frame) : drawChar(look, pose, frame, mood, hat, sung, o.hold)));
}

// Seen from straight above (camera high over a seated player): crown of the
// head with a parting, long hair over the shoulders, arms reaching forward.
function drawTop(L, frame) {
  const [c, x] = canvas(24, 30);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const hair = L.hair || '#333', hairL = light(hair, 0.22), hairS = shade(hair, 0.25);
  const top = L.top || '#fff', topS = shade(top, 0.18), skin = L.skin || '#ffdcc4';
  const dress = L.dress || L.bottom || top;
  // lap / skirt toward the camera (bottom of the sprite)
  P(6, 18, 12, 6, dress); P(6, 23, 12, 1, shade(dress, 0.2));
  // shoulders
  P(3, 12, 18, 6, top); P(3, 16, 18, 2, topS);
  // arms reaching forward to the keys, hands moving a little
  const a = frame % 2;
  P(3, 15, 3, 9, top); P(18, 15, 3, 9, top);
  P(4 + a, 24, 3, 3, skin); P(17 - a, 24, 3, 3, skin);
  // head from above: round crown, long hair spilling over the back/shoulders
  P(5, 3, 14, 12, hairS); P(4, 5, 16, 8, hairS);
  P(6, 4, 12, 10, hair); P(5, 6, 14, 6, hair);
  P(11, 4, 2, 9, shade(hair, 0.4)); // parting
  P(8, 5, 2, 3, hairL); P(14, 6, 2, 2, hairL);
  P(4, 12, 3, 5, hair); P(17, 12, 3, 5, hair); P(9, 1, 6, 3, hairS); // hair over shoulders & down the back
  P(9, 15, 6, 1, skin); // a glimpse of forehead/nose toward the front
  return c;
}

// Seen from behind (used for the chef, who faces the customers).
function drawBack(L, pose, frame) {
  const [c, x] = canvas(24, 34);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const top = L.top || '#fff', topS = shade(top, 0.18), hair = L.hair || '#333', skin = L.skin || '#f2c49c';
  const headY = 6, bodyY = 16;
  // torso + arms (raised a little when working)
  P(7, bodyY, 10, 12, top); P(7, bodyY, 2, 12, topS); P(15, bodyY, 2, 12, topS);
  const up = pose === 'give' || pose === 'hold' ? (frame % 2 ? -3 : -2) : 0;
  P(4, bodyY + 1 + up, 3, 6, top); P(17, bodyY + 1 + up, 3, 6, top);
  P(4, bodyY + 7 + up, 3, 1, skin); P(17, bodyY + 7 + up, 3, 1, skin);
  if (L.apron || L.chefHat) { P(8, bodyY + 6, 8, 1, '#c9c2b8'); P(11, bodyY + 6, 2, 3, '#c9c2b8'); P(10, bodyY + 9, 1, 2, '#c9c2b8'); P(13, bodyY + 9, 1, 2, '#c9c2b8'); }
  P(L.dress ? 6 : 8, bodyY + 12, L.dress ? 12 : 8, 6, L.dress || L.bottom || '#3c3a4a');
  // neck, ears, back of the head
  P(10, headY + 9, 4, 2, skin);
  P(5, headY + 1, 14, 9, hair); P(6, headY, 12, 10, hair); P(4, headY + 4, 1, 2, skin); P(19, headY + 4, 1, 2, skin);
  P(8, headY + 1, 4, 1, light(hair, 0.25));
  if (L.chefHat) { const hy = headY - 7; P(7, hy, 10, 6, '#fbfbf6'); P(6, hy + 1, 12, 3, '#fbfbf6'); P(7, hy + 5, 10, 2, '#e8e2d8'); P(16, hy + 1, 1, 4, '#e2dcd2'); }
  // towel tied around the head, ramen-chef style
  else if (L.towel) { P(5, headY + 3, 14, 2, '#f4f1ea'); P(17, headY + 4, 3, 3, '#f4f1ea'); }
  // long hair falls down the back
  if (L.hairStyle === 'long') { P(6, headY + 9, 12, 9, hair); P(7, headY + 18, 10, 2, hair); P(8, headY + 3, 2, 12, light(hair, 0.18)); }
  return c;
}

function drawChar(L, pose, frame, mood, hat, sunglasses, hold) {
  const W = 24, H = 34;
  const [c, x] = canvas(W, H);
  const P = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
  const kid = L.kind === 'kid';
  const skin = L.skin || '#ffdcc4';
  const skinS = shade(skin, 0.22);
  const hair = L.hair || '#2a1b24';
  const hairL = light(hair, 0.22);
  const hairS = shade(hair, 0.25);
  const top = L.top || '#fff';
  const topS = shade(top, 0.22);
  const dress = L.dress;
  const bottom = L.bottom || dress || '#556';
  const shoes = L.shoes || '#333';

  // vertical layout
  let drop = 0; // body drop (sit/crouch)
  let bob = 0;
  if (pose === 'idle') bob = frame % 2 ? 1 : 0;
  if (pose === 'walk') bob = frame % 2 ? -1 : 0;
  if (pose === 'sit' || pose === 'piano' || pose === 'sitwave') drop = 4;
  if (pose === 'crouch') drop = 6;
  if (pose === 'jump') bob = -3;
  const oy = (kid ? 5 : 2) + drop + bob; // head top offset
  const headY = oy + 4;
  const bodyY = headY + 10; // torso top
  const torsoH = kid ? 4 : 6;
  const legY = bodyY + torsoH + (dress ? 2 : 0);

  // --- long back hair (behind body)
  if (L.hairStyle === 'long') {
    P(5, headY + 2, 14, 12 - (kid ? 3 : 0), hairS);
    P(6, headY + 13, 12, 3, hairS);
    P(7, headY + 15, 10, 1, hairS);
  }

  // --- legs
  const legLen = kid ? (dress ? 1 : 3) : (dress ? 2 : 4);
  const showLegs = pose !== 'sit' && pose !== 'piano' && pose !== 'sitwave';
  if (showLegs) {
    let l = 0, r = 0;
    if (pose === 'walk') { if (frame === 1) l = -1; if (frame === 3) r = -1; }
    if (pose === 'jump') { l = -1; r = -1; }
    const legCol = dress ? skin : bottom;
    const lh = pose === 'crouch' ? 2 : legLen;
    P(8, legY + l, 3, lh, legCol); P(13, legY + r, 3, lh, legCol);
    if (!dress) { P(10, legY + l, 1, lh, shade(legCol, 0.2)); P(15, legY + r, 1, lh, shade(legCol, 0.2)); }
    P(8, legY + lh + l, 3, 2, shoes); P(13, legY + lh + r, 3, 2, shoes);
    P(8, legY + lh + l, 3, 1, light(shoes, 0.2));
    P(13, legY + lh + r, 3, 1, light(shoes, 0.2));
  } else {
    // sitting: thighs forward
    const legCol = dress ? skin : bottom;
    P(9, legY - 1, 8, 3, dress || legCol);
    P(16, legY + 1, 2, 3, legCol);
    P(16, legY + 4, 3, 2, shoes);
  }

  // --- torso
  P(7, bodyY, 10, torsoH + 1, top);
  P(16, bodyY + 1, 1, torsoH, topS);
  if (L.kind === 'partner') { // hoodie strings + pocket
    P(10, bodyY, 4, 1, L.topAccent || light(top, 0.5));
    P(10, bodyY + 1, 1, 2, L.topAccent || '#fff'); P(13, bodyY + 1, 1, 2, L.topAccent || '#fff');
    P(9, bodyY + 4, 6, 2, topS);
  }
  if (L.kind === 'hazei') { P(10, bodyY, 4, 1, '#ffffff'); P(11, bodyY + 1, 2, 1, '#f08fa8'); }
  if (L.apron) { P(9, bodyY + 1, 6, torsoH + (dress ? 3 : 1), L.apron); P(9, bodyY + 1, 6, 1, shade(L.apron, 0.15)); }
  if (L.chefHat) { P(9, bodyY + 1, 1, 1, '#c9c2b8'); P(9, bodyY + 3, 1, 1, '#c9c2b8'); P(14, bodyY + 1, 1, 1, '#c9c2b8'); P(14, bodyY + 3, 1, 1, '#c9c2b8'); }
  // skirt / dress
  if (dress && pose !== 'sit') {
    const sy = bodyY + torsoH - 1;
    P(7, sy, 10, 2, dress); P(6, sy + 2, 12, 2, dress); P(5, sy + 4 - (kid ? 1 : 0), 14, 1, dress);
    P(17, sy + 2, 1, 2, shade(dress, 0.22)); P(18, sy + 4 - (kid ? 1 : 0), 1, 1, shade(dress, 0.22));
    P(8, sy + 1, 1, 3, light(dress, 0.25));
    if (L.kind === 'hazei') { P(7, sy, 10, 1, shade(dress, 0.12)); }
  } else if (!dress && !kid) {
    P(7, bodyY + torsoH, 10, 1, bottom);
  }

  // --- arms
  const armY = bodyY + 1;
  let la = 0, ra = 0;
  if (pose === 'walk') { la = frame === 1 ? 1 : frame === 3 ? -1 : 0; ra = -la; }
  const armL = (yy) => { P(5, yy, 2, 4, top); P(5, yy + 4, 2, 1, skin); };
  const armR = (yy) => { P(17, yy, 2, 4, topS); P(17, yy + 4, 2, 1, skin); };
  const armUpR = () => { P(17, armY - 4, 2, 5, topS); P(17, armY - 6, 2, 2, skin); };
  const armUpL = () => { P(5, armY - 4, 2, 5, top); P(5, armY - 6, 2, 2, skin); };
  const armFwdR = () => { P(17, armY, 3, 2, topS); P(20, armY, 2, 2, skin); };
  switch (pose) {
    case 'wave': armL(armY + la); armUpR(); if (frame % 2) P(19, armY - 7, 1, 2, skin); break;
    case 'sitwave': { // seated, one hand up swaying slowly left/right
      armL(armY); const sx = frame % 2 ? 2 : 0;
      P(17, armY - 1, 2, 2, topS);
      P(18 + sx / 2, headY + 2, 2, bodyY - headY - 2, topS);
      P(18 + sx, headY - 3, 3, 5, skin); P(18 + sx, headY - 4, 1, 1, skin); P(20 + sx, headY - 4, 1, 1, skin); break;
    }
    case 'cheer': armUpL(); armUpR(); break;
    case 'heart': // hands above head
      P(5, armY - 3, 2, 4, top); P(17, armY - 3, 2, 4, topS); P(6, headY - 3, 3, 2, skin); P(15, headY - 3, 3, 2, skin); break;
    case 'peace': armL(armY); P(16, armY - 2, 2, 3, topS); P(17, headY + 5, 2, 3, skin); P(17, headY + 3, 1, 2, skin); P(19, headY + 3, 1, 2, skin); break;
    case 'hold': case 'give': case 'pet': armL(armY); armFwdR(); break;
    case 'sing': armL(armY); P(16, armY, 2, 3, topS); P(14, headY + 8, 2, 3, skin); P(14, headY + 7, 2, 2, '#3a3a44'); P(14, headY + 6, 2, 1, '#9a9aa8'); break;
    case 'bouquet': P(6, armY + 2, 3, 2, top); P(15, armY + 2, 3, 2, topS); break;
    case 'piano': { // both arms reaching down to the keys, hands moving
      const a = frame % 2 ? 1 : 0, b = frame % 2 ? 0 : 1;
      P(6, armY, 2, 3, top); P(16, armY, 2, 3, topS);
      P(7, armY + 3, 2, 2, top); P(15, armY + 3, 2, 2, topS);
      P(8 + a, armY + 5 - a, 2, 2, skin); P(14 - b, armY + 5 - b, 2, 2, skin);
      break;
    }
    case 'sip': armL(armY); P(16, armY, 2, 3, topS); P(15, headY + 9, 2, 2, skin); break;
    default: armL(armY + la); armR(armY + ra);
  }

  // --- head
  P(6, headY, 12, 10, skin); P(5, headY + 1, 14, 8, skin);
  P(18, headY + 2, 1, 6, skinS);
  // ears
  P(4, headY + 4, 1, 2, skin);

  // --- hair
  const hs = L.hairStyle || 'short';
  P(6, headY - 2, 12, 2, hair); P(5, headY - 1, 14, 3, hair);
  P(4, headY, 2, 4, hair); P(18, headY, 2, 3, hair);
  P(8, headY - 2, 4, 1, hairL); P(7, headY - 1, 2, 1, hairL);
  // fringe
  P(5, headY + 2, 3, 1, hair); P(9, headY + 2, 2, 1, hair); P(12, headY + 2, 4, 1, hair); P(17, headY + 2, 2, 1, hair);
  P(5, headY + 3, 1, 1, hair); P(13, headY + 3, 2, 1, hair); P(18, headY + 3, 1, 1, hair);
  if (hs === 'long') {
    P(4, headY + 3, 2, 11, hair); P(18, headY + 3, 2, 9, hair);
    P(4, headY + 4, 1, 8, hairL);
    P(5, headY + 12, 2, 3, hair); P(18, headY + 11, 1, 2, hair);
  } else if (hs === 'messy') {
    P(7, headY - 3, 2, 1, hair); P(12, headY - 3, 3, 1, hair); P(18, headY + 2, 2, 3, hair);
  } else if (hs === 'bun') {
    P(9, headY - 5, 6, 3, hair); P(10, headY - 6, 4, 1, hair); P(10, headY - 5, 2, 1, hairL);
  } else if (hs === 'pig') {
    P(2, headY + 3, 3, 4, hair); P(19, headY + 3, 3, 4, hair); P(3, headY + 2, 2, 1, '#ef7d9a'); P(19, headY + 2, 2, 1, '#ef7d9a');
  } else { // short
    P(4, headY + 3, 1, 3, hair); P(18, headY + 3, 2, 2, hair);
  }

  // --- face
  const ex1 = FACE.eyeL, ex2 = FACE.eyeR, ey = headY + 5;
  const eye = '#2a1a24';
  if (mood === 'happy' || mood === 'closed' || mood === 'singHappy') {
    for (const ex of [ex1, ex2]) { P(ex, ey + 1, 1, 1, eye); P(ex + 1, ey, 1, 1, eye); P(ex + 2, ey + 1, 1, 1, eye); }
  } else if (mood === 'blink') {
    P(ex1, ey + 1, 2, 1, eye); P(ex2, ey + 1, 2, 1, eye);
  } else if (mood === 'silly') {
    P(ex1, ey, 1, 1, eye); P(ex1 + 1, ey + 1, 1, 1, eye); P(ex1, ey + 2, 1, 1, eye);
    P(ex2 + 1, ey, 1, 1, eye); P(ex2, ey + 1, 1, 1, eye); P(ex2 + 1, ey + 2, 1, 1, eye);
  } else {
    P(ex1, ey, 2, 2, eye); P(ex2, ey, 2, 2, eye);
    P(ex1, ey, 1, 1, '#ffffff'); P(ex2, ey, 1, 1, '#ffffff');
    if (mood === 'surprise') { P(ex1, ey - 1, 2, 1, eye); P(ex2, ey - 1, 2, 1, eye); }
  }
  // blush
  P(ex1 - 1, ey + 2, 2, 1, '#f5a0a8'); P(ex2 + 1, ey + 2, 2, 1, '#f5a0a8');
  // mouth
  const my = ey + 3;
  if (mood === 'happy' || mood === 'silly') { P(12, my, 2, 1, '#b8506a'); P(12, my + 1, 2, 1, '#e97f95'); }
  else if (mood === 'surprise' || pose === 'sing' || mood === 'sing' || mood === 'singHappy') { P(12, my, 2, 2, '#8a3a52'); P(12, my + 1, 2, 1, '#e97f95'); }
  else P(12, my, 2, 1, '#c26a7e');
  if (L.beard) { P(8, my - 1, 9, 2, L.hair); P(10, my + 1, 5, 1, L.hair); P(12, my, 2, 1, '#c26a7e'); }

  if (L.glasses) {
    const g = '#3b2b33';
    P(ex1 - 1, ey - 1, 4, 1, g); P(ex1 - 1, ey + 2, 4, 1, g); P(ex1 - 1, ey - 1, 1, 4, g); P(ex1 + 2, ey - 1, 1, 4, g);
    P(ex2 - 1, ey - 1, 4, 1, g); P(ex2 - 1, ey + 2, 4, 1, g); P(ex2 - 1, ey - 1, 1, 4, g); P(ex2 + 2, ey - 1, 1, 4, g);
    P(ex1 + 3, ey, 2, 1, g);
    P(ex1, ey - 1 + 1, 1, 1, 'rgba(255,255,255,.0)');
  }
  if (sunglasses) {
    P(ex1 - 1, ey - 1, 10, 1, '#1a1420'); P(ex1 - 1, ey, 4, 2, '#1a1420'); P(ex2 - 1, ey, 4, 2, '#1a1420');
    P(ex1, ey, 1, 1, '#6a6a90'); P(ex2, ey, 1, 1, '#6a6a90');
  }
  if (hat) {
    const hy = headY - 4;
    P(7, hy - 1, 10, 3, '#e8c776'); P(8, hy - 2, 8, 1, '#e8c776');
    P(7, hy + 1, 10, 1, '#e05a7a');
    P(2, hy + 2, 20, 2, '#f2d48a'); P(3, hy + 4, 18, 1, shade('#f2d48a', 0.2));
    P(9, hy - 1, 2, 1, light('#e8c776', 0.4));
  }
  if (L.chefHat) {
    const hy = headY - 7;
    P(7, hy, 10, 6, '#fbfbf6'); P(6, hy + 1, 12, 3, '#fbfbf6'); P(7, hy + 5, 10, 2, '#e8e2d8'); P(16, hy + 1, 1, 4, '#e2dcd2');
  }
  // hold item
  if (hold && (pose === 'hold' || pose === 'give')) {
    if (hold === 'flower') { P(21, armY - 4, 1, 5, '#4f9a4a'); P(20, armY - 6, 3, 2, '#f08fa8'); P(21, armY - 7, 1, 1, '#f08fa8'); P(21, armY - 6, 1, 1, '#ffe066'); }
    if (hold === 'snack') { P(20, armY - 2, 3, 3, '#f2b766'); P(20, armY - 2, 3, 1, '#c9813a'); }
    if (hold === 'book') { P(19, armY - 3, 4, 5, '#c4587a'); P(19, armY - 3, 1, 5, '#fff3e0'); }
    if (hold === 'lantern') { P(19, armY - 6, 4, 5, '#ffcf6b'); P(19, armY - 6, 4, 1, '#c4587a'); P(20, armY - 4, 2, 2, '#fff7d6'); }
  }
  if (pose === 'bouquet') {
    const by = bodyY - 2;
    P(9, by + 3, 6, 6, '#f3e3c8'); P(10, by + 8, 4, 2, '#e4cba4');
    const cols = ['#f08fa8', '#ffd23f', '#9b7fe0', '#ffffff', '#e9473f', '#7fa7f0'];
    [[8, by], [11, by - 1], [14, by], [9, by + 2], [13, by + 2], [11, by + 1]].forEach(([fx, fy], i) => { P(fx, fy, 3, 2, cols[i]); });
    P(11, by + 6, 2, 1, '#e05a7a');
  }
  return c;
}

// Square avatar for Discord screens (head crop on a soft background).
export function avatar(which, size = 128) {
  return cached('avatar' + which + size, () => {
    const look = which === 'hazei' ? LOOKS.hazei() : LOOKS.partner();
    const spr = charSprite(look, { pose: 'idle', mood: 'happy' });
    const [c, x] = canvas(32, 32);
    const bg = which === 'hazei' ? ['#ffd1dc', '#ffb3c6'] : ['#c9d8ff', '#a9bff2'];
    x.fillStyle = bg[0]; x.fillRect(0, 0, 32, 32);
    x.fillStyle = bg[1]; for (let i = 0; i < 32; i += 4) x.fillRect(0, 20 + (i % 8 ? 0 : 1), 32, 1);
    x.fillStyle = bg[1]; x.fillRect(0, 24, 32, 8);
    x.drawImage(spr, 0, 0, 24, 26, 4, 6, 24, 26);
    const [o, ox] = canvas(size, size);
    ox.imageSmoothingEnabled = false; ox.drawImage(c, 0, 0, size, size);
    return o;
  });
}

// ---------------------------------------------------------------- animals
export function dogSprite(frame = 0, mood = 'normal', pose = 'stand') {
  return cached(`dog${frame}${mood}${pose}`, () => {
    const [c, x] = canvas(22, 16);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const fur = '#e89a52', furS = shade(fur, 0.2), cream = '#fff1dc';
    const sitting = pose === 'sit';
    const by = sitting ? 7 : 6;
    // tail (curled), wags with frame
    const tw = frame % 2;
    P(2 + tw, by - 3, 3, 2, fur); P(1 + tw, by - 2, 2, 3, fur); P(3 + tw, by - 3, 1, 1, cream);
    // body
    if (sitting) { P(4, by, 9, 6, fur); P(5, by + 5, 8, 2, fur); P(9, by + 2, 4, 4, cream); }
    else { P(3, by, 12, 5, fur); P(4, by + 3, 10, 2, cream); P(3, by, 12, 1, light(fur, 0.15)); }
    // legs
    if (!sitting) {
      const a = frame === 1 ? 1 : 0, b = frame === 3 ? 1 : 0;
      P(4, by + 5 - a, 2, 3 + a, furS); P(7, by + 5 - b, 2, 3 + b, fur); P(11, by + 5 - b, 2, 3 + b, furS); P(13, by + 5 - a, 2, 3 + a, fur);
      P(4, by + 7, 2, 1, cream); P(13, by + 7, 2, 1, cream);
    } else { P(11, by + 6, 2, 2, fur); P(6, by + 6, 3, 2, furS); }
    // head
    const hx = sitting ? 10 : 12, hy = by - 6;
    P(hx, hy + 1, 8, 6, fur); P(hx + 1, hy, 6, 1, fur);
    P(hx + 4, hy + 3, 5, 4, cream); P(hx + 8, hy + 4, 1, 2, cream);
    P(hx, hy - 2, 2, 3, fur); P(hx + 5, hy - 2, 2, 3, fur); P(hx + 1, hy - 1, 1, 1, '#f5b5a8'); P(hx + 6, hy - 1, 1, 1, '#f5b5a8');
    P(hx + 8, hy + 3, 1, 1, INK);
    if (mood === 'happy') { P(hx + 3, hy + 3, 1, 1, INK); P(hx + 4, hy + 2, 1, 1, INK); P(hx + 5, hy + 3, 1, 1, INK); P(hx + 6, hy + 6, 2, 2, '#f07a8a'); }
    else { P(hx + 4, hy + 2, 2, 2, INK); P(hx + 4, hy + 2, 1, 1, '#fff'); }
    P(hx + 2, hy + 5, 2, 1, '#f5a0a8');
    return outline(c);
  });
}

export function catSprite(pose = 'sleep', frame = 0, color = 'grey') {
  return cached(`cat${pose}${frame}${color}`, () => {
    const [c, x] = canvas(18, 14);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const fur = color === 'orange' ? '#f0a55c' : color === 'black' ? '#3a3340' : '#aaa3bb';
    const stripe = shade(fur, 0.25); const belly = color === 'black' ? '#5a5060' : '#fff4ea';
    if (pose === 'sleep') {
      const br = frame % 2; // breathing
      P(3, 6 - br, 12, 6 + br, fur); P(2, 8, 14, 4, fur); P(4, 5 - br, 9, 1, fur);
      P(6, 6 - br, 1, 3, stripe); P(9, 6 - br, 1, 3, stripe); P(12, 6 - br, 1, 3, stripe);
      // tail wrap
      P(2, 11, 12, 2, stripe); P(13, 10, 2, 2, stripe);
      // head
      P(10, 5, 7, 6, fur); P(10, 3, 2, 2, fur); P(15, 3, 2, 2, fur); P(11, 4, 1, 1, '#f5b5a8'); P(15, 4, 1, 1, '#f5b5a8');
      P(11, 8, 2, 1, INK); P(14, 8, 2, 1, INK); P(13, 9, 1, 1, '#f08fa8'); P(12, 10, 3, 1, belly);
    } else {
      // sitting cat facing right
      const tail = frame % 2;
      P(2, 6 + tail, 2, 5, fur); P(1, 5 + tail, 2, 2, fur);
      P(4, 6, 8, 7, fur); P(7, 8, 5, 5, belly); P(5, 7, 1, 3, stripe);
      P(6, 12, 2, 1, fur); P(10, 12, 2, 1, fur);
      P(8, 1, 8, 6, fur); P(8, -1 + 0, 2, 2, fur); P(14, 0, 2, 2, fur);
      P(8, 0, 2, 2, fur); P(9, 1, 1, 1, '#f5b5a8'); P(14, 1, 1, 1, '#f5b5a8');
      if (pose === 'happy') { P(9, 4, 1, 1, INK); P(10, 3, 1, 1, INK); P(13, 3, 1, 1, INK); P(14, 4, 1, 1, INK); }
      else { P(9, 3, 2, 2, '#5c8a4a'); P(13, 3, 2, 2, '#5c8a4a'); P(10, 3, 1, 1, INK); P(14, 3, 1, 1, INK); }
      P(12, 5, 1, 1, '#f08fa8'); P(9, 5, 1, 1, '#f5a0a8'); P(15, 5, 1, 1, '#f5a0a8');
    }
    return outline(c);
  });
}

export function chickenSprite(frame = 0, color = '#fffaf0') {
  return cached(`chick${frame}${color}`, () => {
    const [c, x] = canvas(12, 12);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const peck = frame === 2;
    P(2, 5, 7, 4, color); P(1, 4, 2, 3, color); P(3, 6, 4, 2, shade(color, 0.12));
    const hy = peck ? 5 : 2;
    P(7, hy, 3, 4, color); P(8, hy - 1, 2, 1, '#e9473f'); P(10, hy + 1, 1, 1, '#f2a33a'); P(9, hy + 1, 1, 1, INK); P(9, hy + 3, 1, 1, '#e9473f');
    P(4, 9, 1, 2, '#f2a33a'); P(6, 9, 1, 2, '#f2a33a');
    return outline(c);
  });
}

export function duckSprite(frame = 0) {
  return cached(`duck${frame}`, () => {
    const [c, x] = canvas(12, 10);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const by = frame % 2;
    P(1, 4 + by, 8, 4, '#fffaf0'); P(0, 3 + by, 2, 2, '#fffaf0'); P(2, 5 + by, 4, 2, '#e8e2d8');
    P(6, 0 + by, 4, 4, '#fffaf0'); P(10, 2 + by, 2, 1, '#f2a33a'); P(8, 1 + by, 1, 1, INK);
    return outline(c);
  });
}

export function pigeonSprite(frame = 0) {
  return cached(`pig${frame}`, () => {
    const [c, x] = canvas(12, 10);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    if (frame >= 2) { // flying
      const up = frame === 2;
      P(3, 4, 6, 3, '#9fa3b8'); P(8, 3, 3, 3, '#8a8fa8');
      if (up) { P(2, 0, 3, 4, '#c3c6d6'); P(6, 1, 3, 3, '#c3c6d6'); } else { P(1, 6, 4, 2, '#c3c6d6'); P(6, 6, 3, 2, '#c3c6d6'); }
      P(11, 4, 1, 1, '#f2a33a'); P(9, 4, 1, 1, INK);
    } else {
      P(2, 4, 7, 4, '#9fa3b8'); P(1, 5, 2, 2, '#7a7f96'); P(4, 5, 3, 2, '#c3c6d6');
      const hy = frame === 1 ? 3 : 1;
      P(7, hy, 3, 4, '#8a8fa8'); P(7, hy + 3, 3, 1, '#7ec2a0'); P(10, hy + 1, 1, 1, '#f2a33a'); P(8, hy + 1, 1, 1, INK);
      P(4, 8, 1, 2, '#e9737a'); P(6, 8, 1, 2, '#e9737a');
    }
    return outline(c);
  });
}

export function butterflySprite(frame = 0, color = '#f6c45f') {
  return cached(`bfly${frame}${color}`, () => {
    const [c, x] = canvas(9, 7);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(4, 2, 1, 4, INK);
    if (frame % 2 === 0) { P(1, 0, 3, 3, color); P(5, 0, 3, 3, color); P(2, 3, 2, 2, shade(color, 0.15)); P(5, 3, 2, 2, shade(color, 0.15)); P(2, 1, 1, 1, '#fff'); P(6, 1, 1, 1, '#fff'); }
    else { P(3, 0, 1, 3, color); P(5, 0, 1, 3, color); P(3, 3, 1, 2, shade(color, 0.15)); P(5, 3, 1, 2, shade(color, 0.15)); }
    return c;
  });
}

export function crabSprite(frame = 0) {
  return cached(`crab${frame}`, () => {
    const [c, x] = canvas(13, 9);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const r = '#ef6a4a';
    P(3, 3, 7, 4, r); P(4, 2, 5, 1, r); P(4, 1, 1, 1, INK); P(8, 1, 1, 1, INK);
    P(1, 1 + (frame % 2), 2, 2, r); P(10, 1 + ((frame + 1) % 2), 2, 2, r);
    P(2, 7, 1, 1, r); P(4, 7 - (frame % 2), 1, 2, r); P(8, 7 - ((frame + 1) % 2), 1, 2, r); P(10, 7, 1, 1, r);
    P(5, 4, 3, 1, light(r, 0.3));
    return outline(c);
  });
}

export function birdSprite(frame = 0, color = '#3b2b40') {
  return cached(`bird${frame}${color}`, () => {
    const [c, x] = canvas(7, 4);
    x.fillStyle = color;
    if (frame % 2) { x.fillRect(0, 2, 2, 1); x.fillRect(2, 1, 1, 1); x.fillRect(3, 2, 1, 1); x.fillRect(4, 1, 1, 1); x.fillRect(5, 2, 2, 1); }
    else { x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 2, 1); x.fillRect(3, 2, 1, 1); x.fillRect(4, 1, 2, 1); x.fillRect(6, 0, 1, 1); }
    return c;
  });
}

export function fishSprite(frame = 0, color = '#ff8a3d') {
  return cached(`fish${frame}${color}`, () => {
    const [c, x] = canvas(10, 7);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    P(3, 2, 5, 3, color); P(2, 3, 1, 1, color); P(8, 3, 1, 1, color);
    P(0, 1 + (frame % 2), 2, 2, light(color, 0.3)); P(0, 3 + (frame % 2), 2, 2, light(color, 0.3));
    P(6, 2, 1, 1, INK); P(4, 2, 2, 1, light(color, 0.4));
    return outline(c);
  });
}

// ---------------------------------------------------------------- flowers
export const FLOWER_TYPES = [
  { species: 'daisy', colors: ['#ffffff', '#fff3b0'] },
  { species: 'tulip', colors: ['#f06d8a', '#ffb347', '#e94f5b', '#f7a1c4'] },
  { species: 'poppy', colors: ['#e9473f', '#ff8a3d'] },
  { species: 'lavender', colors: ['#9b7fe0', '#b79cf0'] },
  { species: 'sunflower', colors: ['#ffd23f'] },
  { species: 'cosmos', colors: ['#f59ac0', '#ffffff', '#d66fa8'] },
  { species: 'bluebell', colors: ['#7fa7f0', '#a9c4ff'] },
];
export function randomFlower(r = Math.random) {
  const t = FLOWER_TYPES[Math.floor(r() * FLOWER_TYPES.length)];
  return { species: t.species, color: t.colors[Math.floor(r() * t.colors.length)] };
}

// Small in-world flower: ~7x12, base at bottom center.
export function flowerSprite(species, color, sway = 0) {
  return cached(`fl${species}${color}${sway}`, () => {
    const [c, x] = canvas(9, 14);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const stem = '#4f9a4a', leaf = '#6dbb5a';
    const tall = species === 'sunflower' ? 0 : 3;
    const sx = 4 + sway;
    P(4, 8, 1, 6, stem); P(sx, tall + 4, 1, 4, stem);
    P(2, 10, 2, 1, leaf); P(5, 9, 2, 1, leaf);
    const hx = sx, hy = tall + 2;
    const cs = shade(color, 0.2);
    switch (species) {
      case 'daisy': P(hx - 2, hy, 5, 1, color); P(hx, hy - 2, 1, 5, color); P(hx - 1, hy - 1, 3, 3, color); P(hx, hy, 1, 1, '#ffc93a'); break;
      case 'tulip': P(hx - 1, hy - 1, 3, 3, color); P(hx - 1, hy - 2, 1, 1, color); P(hx + 1, hy - 2, 1, 1, color); P(hx + 1, hy, 1, 2, cs); break;
      case 'poppy': P(hx - 2, hy - 1, 5, 3, color); P(hx - 1, hy - 2, 3, 1, color); P(hx, hy, 1, 1, '#2b1b28'); P(hx + 2, hy, 1, 2, cs); break;
      case 'lavender': for (let i = 0; i < 5; i++) P(hx - (i % 2), hy - 2 + i, 2, 1, i % 2 ? color : cs); break;
      case 'sunflower': P(hx - 2, hy - 2, 5, 5, color); P(hx - 3, hy, 7, 1, color); P(hx, hy - 3, 1, 7, color); P(hx - 1, hy - 1, 3, 3, '#7a4a2a'); break;
      case 'cosmos': P(hx - 2, hy - 1, 5, 3, color); P(hx - 1, hy - 2, 3, 5, color); P(hx, hy, 1, 1, '#ffd23f'); break;
      case 'bluebell': P(hx - 1, hy - 2, 3, 1, stem); P(hx - 2, hy - 1, 2, 2, color); P(hx + 1, hy - 1, 2, 2, color); P(hx - 1, hy + 1, 2, 2, color); break;
      default: P(hx - 1, hy - 1, 3, 3, color);
    }
    return outline(c, shade(color, 0.6));
  });
}

// Large flower head for the bouquet & UI (16x16 head on a long stem).
export function flowerBig(species, color) {
  return cached(`flb${species}${color}`, () => {
    const [c, x] = canvas(20, 20);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const cs = shade(color, 0.22), cl = light(color, 0.35);
    const cx = 10, cy = 10;
    const disc = (r, col) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) P(cx + i, cy + j, 1, 1, col); };
    switch (species) {
      case 'daisy':
        for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2; for (let r = 3; r < 8; r++) P(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), 1, 1, r > 6 ? cs : color); }
        disc(3, '#ffc93a'); P(cx - 1, cy - 2, 2, 1, '#ffe27a'); break;
      case 'tulip':
        P(cx - 5, cy - 3, 10, 9, color); P(cx - 4, cy + 6, 8, 2, color); P(cx - 5, cy - 6, 3, 4, color); P(cx - 1, cy - 7, 3, 5, cl); P(cx + 3, cy - 6, 3, 4, color);
        P(cx + 2, cy - 2, 3, 8, cs); P(cx - 4, cy - 2, 1, 6, cl); break;
      case 'poppy':
        disc(7, color); P(cx - 7, cy - 1, 2, 3, cs); P(cx + 4, cy + 2, 3, 3, cs); disc(2, '#2b1b28'); P(cx - 4, cy - 5, 3, 2, cl); break;
      case 'lavender':
        for (let i = 0; i < 9; i++) { P(cx - 2 + (i % 2), cy - 8 + i * 2, 4, 2, i % 2 ? color : cs); P(cx - 1, cy - 8 + i * 2, 1, 1, cl); }
        break;
      case 'sunflower':
        for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; for (let r = 4; r < 9; r++) P(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), 1, 1, r > 7 ? cs : color); }
        disc(4, '#7a4a2a'); P(cx - 2, cy - 2, 2, 2, '#9a6a3a'); break;
      case 'cosmos':
        for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; for (let r = 2; r < 8; r++) { const w = r > 5 ? 2 : 1; P(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), w, w, r > 6 ? cs : color); } }
        disc(2, '#ffd23f'); break;
      case 'bluebell':
        for (let i = 0; i < 3; i++) { const bx = cx - 6 + i * 5, by = cy - 4 + (i % 2) * 5; P(bx, by, 5, 4, color); P(bx - 1, by + 4, 7, 1, cs); P(bx + 1, by, 1, 2, cl); }
        break;
      default: disc(6, color);
    }
    return outline(c, shade(color, 0.65));
  });
}

// ---------------------------------------------------------------- emotes
const EMO = {
  heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  note: ['..XXXX', '..X..X', '..X..X', 'XXX.XX', 'XXX.XX'],
  laugh: ['X...X', '.X.X.', '.....', 'XXXXX', '.XXX.'],
  thumb: ['..X..', '.XX..', 'XXXXX', 'XXXXX', 'XXXX.', 'XXXX.'],
  wow: ['.X.', '.X.', '.X.', '.X.', '...', '.X.'],
  sparkle: ['...X...', '...X...', '..XXX..', 'XXXXXXX', '..XXX..', '...X...', '...X...'],
  zzz: ['XXXX', '..X.', '.X..', 'XXXX'],
  q: ['.XXX.', 'X...X', '...X.', '..X..', '.....', '..X..'],
  sweat: ['.X.', 'XXX', 'XXX', '.X.'],
  star: ['..X..', '.XXX.', 'XXXXX', '.X.X.'],
};
const EMO_COL = { heart: '#ef5a7a', note: '#7f6fd9', laugh: '#e8833a', thumb: '#f2a33a', wow: '#e9473f', sparkle: '#f6c45f', zzz: '#7f9fdc', q: '#7f6fd9', sweat: '#7fc0f0', star: '#f6c45f' };
export function emoteSprite(kind) {
  return cached('emo' + kind, () => {
    const pat = EMO[kind] || EMO.heart;
    const [c, x] = canvas(13, 14);
    x.fillStyle = '#fffaf2'; x.fillRect(1, 1, 11, 10); x.fillRect(0, 2, 13, 8); x.fillRect(5, 11, 3, 1); x.fillRect(6, 12, 1, 1);
    const w = pat[0].length, h = pat.length;
    const ox = Math.floor((13 - w) / 2), oy = Math.floor((12 - h) / 2);
    x.fillStyle = EMO_COL[kind] || '#ef5a7a';
    pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') x.fillRect(ox + i, oy + j, 1, 1); }));
    return outline(c);
  });
}
export function heartSprite(color = '#ef5a7a') {
  return cached('heart' + color, () => {
    const [c, x] = canvas(9, 8);
    x.fillStyle = color;
    EMO.heart.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') x.fillRect(i + 1, j + 1, 1, 1); }));
    x.fillStyle = '#fff'; x.fillRect(2, 2, 1, 1);
    return outline(c, shade(color, 0.6));
  });
}
export function petalSprite(color = '#ffc2d4', frame = 0) {
  return cached('petal' + color + frame, () => {
    const [c, x] = canvas(3, 3);
    x.fillStyle = color;
    if (frame % 2) { x.fillRect(0, 1, 3, 1); x.fillRect(1, 0, 1, 1); } else { x.fillRect(0, 0, 2, 2); x.fillRect(2, 2, 1, 1); }
    return c;
  });
}

// ---------------------------------------------------------------- food (omakase / cafe)
export function dishSprite(kind) {
  return cached('dish' + kind, () => {
    const [c, x] = canvas(32, 24);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const plate = (col = '#f4efe6') => { P(3, 16, 26, 4, col); P(5, 20, 22, 1, shade(col, 0.2)); P(4, 15, 24, 1, light(col, 0.3)); };
    switch (kind) {
      case 'chawanmushi':
        P(9, 8, 14, 11, '#3f5f7a'); P(8, 8, 16, 2, '#567a96'); P(10, 9, 12, 2, '#f7e1a0'); P(11, 9, 2, 1, '#9fd770'); P(17, 9, 2, 1, '#ef7d6a'); P(9, 19, 14, 2, '#2f4a60'); break;
      case 'tofu':
        plate('#e8f0f4'); P(9, 9, 14, 7, '#fbf7ee'); P(9, 9, 14, 1, '#ffffff'); P(22, 10, 1, 6, '#e2dccf');
        P(11, 8, 2, 2, '#f59ac0'); P(15, 7, 2, 2, '#ffd23f'); P(19, 8, 2, 2, '#9b7fe0'); P(13, 10, 1, 1, '#6dbb5a'); P(18, 10, 1, 1, '#6dbb5a'); break;
      case 'hamachi':
        plate('#2f2a33'); for (let i = 0; i < 3; i++) { P(7 + i * 7, 10, 6, 6, '#f6c9b0'); P(7 + i * 7, 10, 6, 1, '#fde3d4'); P(10 + i * 7, 12, 3, 4, '#e9a08a'); } P(24, 8, 3, 3, '#6dbb5a'); break;
      case 'otoro':
        plate('#2f2a33'); for (let i = 0; i < 3; i++) { P(7 + i * 7, 10, 6, 6, '#f39aa6'); for (let k = 0; k < 3; k++) P(7 + i * 7, 11 + k * 2, 6, 1, '#ffd2da'); } P(25, 9, 2, 2, '#9fd770'); break;
      case 'hotate':
        plate(); P(7, 11, 18, 4, '#fbfbf6'); P(7, 10, 18, 2, '#fff4e4'); P(9, 7, 14, 4, '#f6e2c4'); P(9, 7, 14, 1, '#fff3de'); P(14, 6, 4, 1, '#ffd2a0'); break;
      case 'uni':
        plate(); P(7, 11, 18, 4, '#fbfbf6'); P(6, 7, 20, 5, '#2f4a3a'); P(8, 4, 16, 4, '#f6a83a'); P(9, 4, 3, 2, '#ffc864'); P(15, 4, 3, 2, '#ffc864'); P(21, 4, 2, 2, '#ffc864'); break;
      case 'tempura':
        plate('#f1e2c4'); P(6, 9, 18, 6, '#f2c46b'); P(8, 8, 14, 2, '#f8db8a'); P(23, 6, 4, 4, '#ef6a4a'); P(25, 4, 2, 3, '#ef6a4a'); P(9, 10, 2, 2, '#fbe7a6'); P(14, 11, 2, 2, '#fbe7a6'); P(4, 12, 4, 4, '#9fd770'); break;
      case 'anago':
        plate(); P(7, 11, 18, 4, '#fbfbf6'); P(6, 7, 20, 5, '#7a4a2a'); P(6, 7, 20, 1, '#a86a3a'); for (let i = 0; i < 4; i++) P(8 + i * 5, 8, 2, 3, '#5a3220'); break;
      case 'mochi':
        plate('#f6dbe4'); P(9, 7, 14, 9, '#fff3f5'); P(8, 9, 16, 6, '#fff3f5'); P(10, 6, 12, 1, '#fff9fa'); P(13, 3, 6, 5, '#e9473f'); P(14, 2, 4, 1, '#6dbb5a'); P(14, 4, 1, 1, '#ffd2d2'); break;
      case 'matcha':
        plate('#efe6d2'); P(9, 7, 14, 10, '#86b06a'); P(9, 7, 14, 2, '#a6cc86'); P(8, 16, 16, 1, '#6a8f52'); P(13, 4, 6, 3, '#fff8ea'); P(15, 3, 2, 1, '#e9473f'); break;
      default: plate();
    }
    return outline(c);
  });
}

export function cupSprite(color, art = false, kind = 'mug') {
  return cached('cup' + color + art + kind, () => {
    const [c, x] = canvas(20, 22);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    if (kind === 'glass') {
      P(5, 4, 10, 15, 'rgba(230,245,255,.7)'); P(6, 7, 8, 12, color); P(6, 7, 8, 1, light(color, 0.35)); P(11, 1, 1, 7, '#f08fa8'); P(5, 19, 10, 1, '#d8e8f0'); P(6, 8, 1, 9, light(color, 0.2));
    } else {
      P(2, 16, 16, 3, '#f4efe6'); P(3, 19, 14, 1, '#d9cfc0');
      P(4, 6, 12, 10, '#fbf7ef'); P(16, 8, 3, 5, '#fbf7ef'); P(17, 9, 1, 3, 'rgba(0,0,0,0)');
      P(4, 6, 12, 2, color); P(5, 6, 10, 1, light(color, 0.25)); P(14, 8, 2, 8, '#e6ddd0');
      if (art) { P(8, 6, 2, 1, '#fff8ee'); P(11, 6, 2, 1, '#fff8ee'); P(9, 7, 3, 1, '#fff8ee'); }
    }
    return outline(c);
  });
}

// Donut seen slightly from above. kind: sweet | savory, glaze colour, toppings.
export function donutSprite(d) {
  return cached('donut' + d.id, () => {
    const [c, x] = canvas(18, 13);
    const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const dough = '#e0a868', doughS = shade(dough, 0.25);
    // ring body
    for (let j = 0; j < 13; j++) for (let i = 0; i < 18; i++) {
      const dx = (i - 8.5) / 8.5, dy = (j - 6) / 5.6; const r = dx * dx + dy * dy;
      const hole = ((i - 8.5) / 2.6) ** 2 + ((j - 5.2) / 1.8) ** 2;
      if (r <= 1 && hole > 1) P(i, j, 1, 1, j > 8 ? doughS : dough);
    }
    // glaze on top
    for (let j = 0; j < 9; j++) for (let i = 1; i < 17; i++) {
      const dx = (i - 8.5) / 7.6, dy = (j - 5) / 4.4; const r = dx * dx + dy * dy;
      const hole = ((i - 8.5) / 3) ** 2 + ((j - 5.2) / 2) ** 2;
      if (r <= 1 && hole > 1 && !(j > 6 && (i % 4 === 0))) P(i, j, 1, 1, d.glaze);
    }
    P(4, 2, 3, 1, light(d.glaze, 0.4));
    if (d.sprinkles) [[3, 4, '#ff6fb0'], [6, 1, '#7fe0ff'], [12, 2, '#ffe066'], [14, 5, '#8fd36a'], [10, 7, '#ffffff'], [5, 7, '#b48aff']].forEach(([a, b, col]) => P(a, b, 2, 1, col));
    if (d.id === 'floss') { for (let k = 0; k < 14; k++) P(2 + ((k * 7) % 14), 1 + ((k * 5) % 7), 2, 1, k % 2 ? '#c8803a' : '#a86a2a'); P(5, 3, 1, 1, '#5fae5a'); P(11, 2, 1, 1, '#5fae5a'); P(13, 6, 1, 1, '#5fae5a'); }
    if (d.id === 'cheese') { P(3, 6, 2, 3, '#ffd860'); P(13, 6, 2, 4, '#ffd860'); P(7, 1, 1, 1, '#e8503a'); P(10, 3, 1, 1, '#e8503a'); P(5, 3, 1, 1, '#e8503a'); }
    if (d.id === 'strawberry') { P(6, 1, 1, 1, '#ffffff'); P(12, 3, 1, 1, '#ffffff'); P(4, 5, 1, 1, '#ffffff'); }
    return outline(c, '#5a3423');
  });
}

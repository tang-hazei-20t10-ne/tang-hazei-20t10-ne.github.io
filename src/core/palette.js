// One shared palette for the whole day. Every scene picks a time of day and
// pulls sky, fog, light and shadow colors from here so chapters feel related.
import { mix } from './sprites.js';

export const TIMES = {
  dawn: { sky: ['#5d4f8f', '#b07aa8', '#f3a0a6', '#ffd09a'], sun: '#fff0c4', fog: '#f4b9b0', light: '#ffe2bc', shadow: '#5a4475', ground: '#7fb06a', water: '#9aa9d8', tint: 'rgba(255,170,160,0.10)' },
  morning: { sky: ['#6bb3e8', '#93ccef', '#c4e6f5', '#f2f5df'], sun: '#fffbe6', fog: '#cfe7f2', light: '#fff6dc', shadow: '#55628f', ground: '#79c06a', water: '#68b9d8', tint: 'rgba(255,240,200,0.06)' },
  noon: { sky: ['#5aa6e6', '#82c0ee', '#b6def6', '#e8f6fb'], sun: '#ffffff', fog: '#d6ecf6', light: '#fffaf0', shadow: '#4f5d8c', ground: '#76c266', water: '#5eb4dc', tint: 'rgba(255,250,230,0.04)' },
  afternoon: { sky: ['#5f9ad8', '#8fb8e6', '#f2cf9e', '#ffd8a0'], sun: '#fff1c8', fog: '#f3d6b4', light: '#ffe6b8', shadow: '#5a4f84', ground: '#86b860', water: '#6aa6cf', tint: 'rgba(255,200,120,0.10)' },
  golden: { sky: ['#4b5a9e', '#c77a9a', '#f5a46a', '#ffd27a'], sun: '#fff0b0', fog: '#f5b07a', light: '#ffcf8a', shadow: '#4e3b72', ground: '#9ab45a', water: '#e59a7e', tint: 'rgba(255,150,80,0.14)' },
  dusk: { sky: ['#252a5c', '#5a3f7c', '#c45a7a', '#f39a6a'], sun: '#ffc68a', fog: '#8a5a8a', light: '#ff9e7a', shadow: '#2d2550', ground: '#56704f', water: '#6a5a8a', tint: 'rgba(200,90,140,0.14)' },
  night: { sky: ['#0b0d26', '#141a3e', '#232a5a', '#3a3a72'], sun: '#fff6d8', fog: '#2a2d5a', light: '#9fb0ff', shadow: '#0e0f24', ground: '#2c3d48', water: '#1e2a52', tint: 'rgba(60,70,160,0.18)' },
};

export function lerpTime(a, b, t) {
  const A = TIMES[a], B = TIMES[b];
  const out = {};
  for (const k of Object.keys(A)) {
    if (Array.isArray(A[k])) out[k] = A[k].map((c, i) => mix(c, B[k][i], t));
    else if (A[k].startsWith('#')) out[k] = mix(A[k], B[k], t);
    else out[k] = t < 0.5 ? A[k] : B[k];
  }
  return out;
}

// Dithered vertical gradient through several stops, rendered at pixel res.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
export function ditherGradient(x, w, h, stops, y0 = 0, bands = 14) {
  const n = stops.length - 1;
  const colorAt = (t) => {
    const f = Math.min(n - 1e-6, Math.max(0, t * n));
    const i = Math.floor(f);
    return mix(stops[i], stops[i + 1], f - i);
  };
  for (let j = 0; j < h; j++) {
    const t = j / Math.max(1, h - 1);
    const q = t * bands;
    const b0 = Math.floor(q), fr = q - b0;
    const c0 = colorAt(b0 / bands), c1 = colorAt(Math.min(bands, b0 + 1) / bands);
    for (let i = 0; i < w; i += 1) {
      const th = BAYER[(j % 4) * 4 + (i % 4)];
      x.fillStyle = fr > th ? c1 : c0;
      // run-length: draw until the threshold result changes
      let k = i + 1;
      while (k < w && (fr > BAYER[(j % 4) * 4 + (k % 4)]) === (fr > th)) k++;
      x.fillRect(i, y0 + j, k - i, 1);
      i = k - 1;
    }
  }
}
export { BAYER };

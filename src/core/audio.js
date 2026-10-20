// Generated audio: soft generative music, nature beds and SFX, all synthesized
// with WebAudio so there are no licensed assets. The finale song is a file.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Seeded random so generated melodies loop consistently.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ------------------------------------------------------------ instruments
// Each instrument: (ctx, dest, time, midi, dur, vel)
function env(ctx, g, t, a, peak, d, sustain = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}

const INST = {
  pad(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03 * vel, t + Math.min(1.2, dur * 0.4));
    g.gain.setValueAtTime(0.03 * vel, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.8);
    f.connect(g); g.connect(dest);
    for (const det of [-7, 6]) {
      const o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(f); o.start(t); o.stop(t + dur + 1);
    }
  },
  pluck(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.5);
    env(ctx, g, t, 0.005, 0.12 * vel, 1.1);
    f.connect(g); g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(m + 12);
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o.connect(f); o2.connect(g2); g2.connect(f);
    o.start(t); o2.start(t); o.stop(t + 1.3); o2.stop(t + 1.3);
  },
  keys(ctx, dest, t, m, dur, vel = 1) { // soft electric piano
    const g = ctx.createGain();
    env(ctx, g, t, 0.01, 0.1 * vel, Math.max(0.6, dur) * 1.6);
    g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const mod = ctx.createOscillator(); mod.frequency.value = mtof(m) * 2;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(mtof(m) * 1.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.6);
    mod.connect(mg); mg.connect(o.frequency);
    o.connect(g); o.start(t); mod.start(t);
    const end = t + Math.max(0.6, dur) * 1.6 + 0.1; o.stop(end); mod.stop(end);
  },
  bell(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    env(ctx, g, t, 0.003, 0.07 * vel, 2.4);
    g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const mod = ctx.createOscillator(); mod.frequency.value = mtof(m) * 3.5;
    const mg = ctx.createGain(); mg.gain.setValueAtTime(mtof(m) * 0.8, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.5);
    mod.connect(mg); mg.connect(o.frequency);
    o.connect(g); o.start(t); mod.start(t); o.stop(t + 2.6); mod.stop(t + 2.6);
  },
  koto(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    env(ctx, g, t, 0.002, 0.13 * vel, 0.9);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = mtof(m) * 2; f.Q.value = 1.2;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(mtof(m) * 1.01, t); o.frequency.exponentialRampToValueAtTime(mtof(m), t + 0.08);
    o.connect(f); f.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.1);
  },
  bass(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    env(ctx, g, t, 0.01, 0.11 * vel, Math.max(0.3, dur * 0.9));
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m);
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o.start(t); o2.start(t); o.stop(t + dur + 0.2); o2.stop(t + dur + 0.2);
  },
  flute(ctx, dest, t, m, dur, vel = 1) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06 * vel, t + 0.08);
    g.gain.setValueAtTime(0.055 * vel, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.15);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m);
    const vib = ctx.createOscillator(); vib.frequency.value = 5;
    const vg = ctx.createGain(); vg.gain.value = 3;
    vib.connect(vg); vg.connect(o.frequency);
    o.connect(g); g.connect(dest); o.start(t); vib.start(t); o.stop(t + dur + 0.2); vib.stop(t + dur + 0.2);
  },
};

// Percussion uses a shared noise buffer.
function noiseBuffer(ctx, seconds = 2, color = 'white') {
  const len = Math.floor(ctx.sampleRate * seconds);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}

function perc(ctx, dest, noise, t, kind, vel = 1) {
  const src = ctx.createBufferSource(); src.buffer = noise;
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  if (kind === 'kick') {
    const o = ctx.createOscillator(); const og = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
    env(ctx, og, t, 0.004, 0.35 * vel, 0.28);
    o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.35);
    return;
  }
  if (kind === 'hat') { f.type = 'highpass'; f.frequency.value = 7000; env(ctx, g, t, 0.002, 0.04 * vel, 0.05); }
  if (kind === 'shaker') { f.type = 'bandpass'; f.frequency.value = 5000; env(ctx, g, t, 0.01, 0.03 * vel, 0.08); }
  if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6; env(ctx, g, t, 0.002, 0.12 * vel, 0.16); }
  if (kind === 'brush') { f.type = 'bandpass'; f.frequency.value = 3000; env(ctx, g, t, 0.03, 0.03 * vel, 0.18); }
  if (kind === 'clack') { f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3; env(ctx, g, t, 0.002, 0.18 * vel, 0.07); }
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t, Math.random() * 1.5); src.stop(t + 0.4);
}

// ------------------------------------------------------------ music presets
// prog: chords as semitone arrays relative to root. scale: melody scale.
const MAJ = [0, 2, 4, 7, 9]; // major pentatonic
const MAJ7 = [0, 2, 4, 5, 7, 9, 11];
const HIRA = [0, 2, 3, 7, 8];
const PRESETS = {
  dawn: { root: 67, bpm: 92, beats: 4, prog: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], scale: MAJ, mel: 'pluck', mel2: 'bell', density: 0.5, pad: true, bass: true, drums: 'shaker', keys: true },
  market: { root: 67, bpm: 112, beats: 4, prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: MAJ, mel: 'pluck', density: 0.6, pad: false, bass: 'bossa', drums: 'shaker', keys: true },
  // upbeat ride: pop drums, bouncy bass, busy plucked melody
  trainUp: { root: 67, bpm: 128, beats: 4, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: MAJ, mel: 'pluck', mel2: 'bell', density: 0.7, pad: true, bass: 'bounce', drums: 'pop', keys: true },
  train1: { root: 65, bpm: 100, beats: 4, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], scale: MAJ, mel: 'flute', density: 0.5, pad: true, bass: true, drums: 'shaker' },
  train2: { root: 69, bpm: 96, beats: 4, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: MAJ, mel: 'bell', density: 0.45, pad: true, bass: true, drums: 'brush' },
  train3: { root: 64, bpm: 116, beats: 4, prog: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]], scale: MAJ, mel: 'pluck', density: 0.6, pad: false, bass: true, drums: 'shaker' },
  train4: { root: 62, bpm: 88, beats: 4, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], scale: MAJ, mel: 'keys', density: 0.4, pad: true, bass: true, drums: 'brush' },
  jazz: { root: 62, bpm: 120, beats: 4, swing: 0.33, prog: [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11], [9, 13, 16, 19]], scale: MAJ7, mel: 'keys', density: 0.5, pad: false, bass: 'walk', drums: 'brush', keys: true },
  lofi: { root: 65, bpm: 84, beats: 4, swing: 0.2, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], scale: MAJ, mel: 'keys', density: 0.4, pad: true, bass: true, drums: 'lofi', crackle: true },
  waltz: { root: 67, bpm: 138, beats: 3, prog: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], scale: MAJ, mel: 'flute', density: 0.55, pad: false, bass: 'waltz', keys: true },
  bossa: { root: 64, bpm: 124, beats: 4, prog: [[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [2, 5, 9, 12]], scale: MAJ7, mel: 'flute', density: 0.45, pad: false, bass: 'bossa', drums: 'bossa', keys: true },
  bookshop: { root: 65, bpm: 92, beats: 4, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]], scale: MAJ, mel: 'keys', density: 0.4, pad: true, bass: true, drums: 'brush' },
  omakase: { root: 67, bpm: 84, beats: 4, prog: [[0, 4, 7], [5, 9, 12], [2, 7, 9], [7, 11, 14]], scale: [0, 2, 5, 7, 9], mel: 'koto', density: 0.45, pad: true, bass: true, drums: 'brush' },
  cafe: { root: 67, bpm: 120, beats: 4, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], scale: MAJ7, mel: 'keys', density: 0.4, pad: false, bass: 'bossa', drums: 'bossa', keys: true },
  seaside: { root: 65, bpm: 96, beats: 4, prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], scale: MAJ, mel: 'pluck', mel2: 'bell', density: 0.5, pad: true, bass: true, drums: 'shaker' },
  island: { root: 67, bpm: 100, beats: 4, prog: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]], scale: MAJ, mel: 'pluck', mel2: 'flute', density: 0.55, pad: true, bass: true, drums: 'shaker', keys: true },
  balloon: { root: 65, bpm: 90, beats: 4, prog: [[0, 4, 7, 14], [5, 9, 12, 19], [9, 12, 16, 23], [7, 11, 14, 21]], scale: MAJ, mel: 'bell', mel2: 'flute', density: 0.45, pad: true, bass: true, drums: 'brush' },
  hill: { root: 64, bpm: 80, beats: 4, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]], scale: MAJ, mel: 'bell', density: 0.35, pad: true, bass: true, drums: 'brush' },
  village: { root: 67, bpm: 108, beats: 4, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], scale: MAJ, mel: 'flute', mel2: 'koto', density: 0.55, pad: true, bass: true, drums: 'festival' },
};

class MusicPlayer {
  constructor(audio, preset) {
    this.a = audio; this.p = preset;
    this.out = audio.ctx.createGain(); this.out.gain.value = 0.0001;
    this.out.connect(audio.musicBus);
    this.dry = audio.ctx.createGain(); this.dry.connect(this.out);
    this.wet = audio.ctx.createGain(); this.wet.gain.value = 0.35; this.wet.connect(audio.reverb);
    this.reverbOut = this.out; // reverb returns through musicBus already
    this.beatDur = 60 / preset.bpm;
    this.bar = 0; this.next = audio.ctx.currentTime + 0.1;
    this.rand = rng(preset.root * 31 + preset.bpm);
    this.motif = this.makeMotif();
    this.timer = setInterval(() => this.tick(), 60);
  }
  makeMotif() {
    const r = this.rand; const notes = [];
    const steps = this.p.beats * 2 * 2; // 2 bars of eighths
    for (let i = 0; i < steps; i++) notes.push(r() < this.p.density ? Math.floor(r() * 7) : null);
    return notes;
  }
  fadeIn(t = 2) { const g = this.out.gain; const now = this.a.ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(Math.max(g.value, 0.0001), now); g.linearRampToValueAtTime(1, now + t); }
  stop(t = 2) {
    const g = this.out.gain; const now = this.a.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.0001, now + t);
    setTimeout(() => { clearInterval(this.timer); try { this.out.disconnect(); } catch { /* */ } }, t * 1000 + 3000);
  }
  tick() {
    const ctx = this.a.ctx;
    while (this.next < ctx.currentTime + 0.4) { this.scheduleBar(this.next); this.next += this.beatDur * this.p.beats; this.bar++; }
  }
  scheduleBar(t0) {
    const { p, a } = this; const ctx = a.ctx; const B = this.beatDur;
    const chord = p.prog[this.bar % p.prog.length];
    const root = p.root;
    const dest = this.dry; const wet = this.wet;
    const play = (inst, time, m, dur, vel, w = true) => { INST[inst](ctx, dest, time, m, dur, vel); if (w) INST[inst](ctx, wet, time, m, dur, vel * 0.5); };
    if (p.pad) chord.forEach((n) => INST.pad(ctx, dest, t0, root + n, B * p.beats, 0.8));
    if (p.keys) {
      for (let b = 0; b < p.beats; b++) {
        if (p.beats === 3 && b === 0) continue;
        if (p.bpm > 100 && b % 2 === 0 && p.beats === 4) continue;
        chord.slice(0, 3).forEach((n) => INST.keys(ctx, dest, t0 + b * B + (p.swing && b % 2 ? B * p.swing * 0.5 : 0), root + n - 12 + 12, B * 0.8, 0.45));
      }
    }
    // bass
    if (p.bass === 'walk') {
      const walk = [chord[0], chord[1], chord[2], chord[1] + 1];
      walk.forEach((n, i) => INST.bass(ctx, dest, t0 + i * B, root - 24 + n, B * 0.9, 0.9));
    } else if (p.bass === 'bounce') {
      [[0, 0], [0.5, 12], [1.5, 0], [2, 7], [2.5, 12], [3.5, 7]].forEach(([b, o]) => INST.bass(ctx, dest, t0 + b * B, root - 24 + chord[0] + o, B * 0.45, 0.85));
    } else if (p.bass === 'waltz') INST.bass(ctx, dest, t0, root - 24 + chord[0], B, 1);
    else if (p.bass === 'bossa') {
      [[0, chord[0]], [1.5, chord[2] - 12], [2, chord[0]], [3.5, chord[2] - 12]].forEach(([b, n]) => INST.bass(ctx, dest, t0 + b * B, root - 24 + n, B * 0.6, 0.8));
    } else if (p.bass) {
      INST.bass(ctx, dest, t0, root - 24 + chord[0], B * 2, 0.8);
      INST.bass(ctx, dest, t0 + 2 * B, root - 24 + chord[0] + (chord[2] - chord[0] > 6 ? 7 : 0), B * 2, 0.6);
    }
    // drums
    const nz = a.noise;
    if (p.drums === 'brush') for (let b = 0; b < p.beats; b++) perc(ctx, dest, nz, t0 + b * B, 'brush', b % 2 ? 1 : 0.6);
    if (p.drums === 'shaker') for (let s = 0; s < p.beats * 2; s++) perc(ctx, dest, nz, t0 + s * B / 2, 'shaker', s % 2 ? 0.6 : 1);
    if (p.drums === 'lofi') { perc(ctx, dest, nz, t0, 'kick', 0.6); perc(ctx, dest, nz, t0 + 2.5 * B, 'kick', 0.4); perc(ctx, dest, nz, t0 + B, 'snare', 0.4); perc(ctx, dest, nz, t0 + 3 * B, 'snare', 0.4); for (let s = 0; s < 8; s++) perc(ctx, dest, nz, t0 + s * B / 2 + (s % 2 ? B * 0.1 : 0), 'hat', 0.6); }
    if (p.drums === 'bossa') { [0, 1.5, 3, 4.5, 6].forEach((s) => perc(ctx, dest, nz, t0 + s * B / 2 * 1.0, 'clack', 0.25)); for (let s = 0; s < 8; s++) perc(ctx, dest, nz, t0 + s * B / 2, 'shaker', 0.5); }
    if (p.drums === 'pop') {
      for (const b of [0, 1.5, 2, 3.5]) perc(ctx, dest, nz, t0 + b * B, 'kick', b % 2 === 0 ? 0.65 : 0.4);
      perc(ctx, dest, nz, t0 + B, 'snare', 0.55); perc(ctx, dest, nz, t0 + 3 * B, 'snare', 0.55);
      for (let s8 = 0; s8 < 8; s8++) perc(ctx, dest, nz, t0 + s8 * B / 2, 'hat', s8 % 2 ? 0.9 : 0.5);
      if (this.bar % 4 === 3) for (let k = 0; k < 4; k++) perc(ctx, dest, nz, t0 + (3 + k / 4) * B, 'snare', 0.25 + k * 0.08); // little fill
    }
    if (p.drums === 'festival') { perc(ctx, dest, nz, t0, 'kick', 0.5); perc(ctx, dest, nz, t0 + 2 * B, 'kick', 0.4); for (let s = 0; s < 8; s++) perc(ctx, dest, nz, t0 + s * B / 2, 'shaker', s % 2 ? 0.4 : 0.8); }
    if (p.crackle) for (let i = 0; i < 6; i++) perc(ctx, dest, nz, t0 + Math.random() * B * p.beats, 'hat', 0.25);
    // melody (eighth notes from motif, varied every 4 bars)
    const half = (this.bar % 2) * p.beats * 2;
    const vary = Math.floor(this.bar / 4) % 2;
    for (let s = 0; s < p.beats * 2; s++) {
      const deg = this.motif[half + s];
      if (deg == null) continue;
      const sc = p.scale;
      let idx = deg + (vary && s % 3 === 0 ? 1 : 0);
      const oct = Math.floor(idx / sc.length);
      const m = root + 12 + sc[idx % sc.length] + oct * 12;
      const swing = p.swing && s % 2 ? B * p.swing : 0;
      const inst = p.mel2 && (s + this.bar) % 5 === 0 ? p.mel2 : p.mel;
      play(inst, t0 + s * B / 2 + swing, m, B * (p.mel === 'flute' ? 0.9 : 0.5), 0.8);
    }
  }
}

// ------------------------------------------------------------ nature beds
class Bed {
  constructor(audio, kind) {
    this.a = audio; this.kind = kind; const ctx = audio.ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0.0001; this.out.connect(audio.ambBus);
    this.nodes = []; this.timers = [];
    const loopNoise = (buf, type, freq, q, gain) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      s.connect(f); f.connect(g); g.connect(this.out); s.start();
      this.nodes.push(s); return { s, f, g };
    };
    const lfo = (param, rate, depth, base) => {
      const o = ctx.createOscillator(); o.frequency.value = rate;
      const g = ctx.createGain(); g.gain.value = depth; o.connect(g); g.connect(param); param.value = base; o.start(); this.nodes.push(o);
    };
    const every = (min, max, fn) => {
      const go = () => { fn(ctx.currentTime + 0.05); this.timers.push(setTimeout(go, (min + Math.random() * (max - min)) * 1000)); };
      this.timers.push(setTimeout(go, Math.random() * max * 1000));
    };
    if (kind === 'wind') { const n = loopNoise(audio.brown, 'bandpass', 500, 0.6, 0.35); lfo(n.f.frequency, 0.07, 250, 500); lfo(n.g.gain, 0.11, 0.15, 0.3); }
    if (kind === 'windHigh') { const n = loopNoise(audio.brown, 'bandpass', 900, 0.5, 0.55); lfo(n.f.frequency, 0.05, 400, 900); }
    if (kind === 'waves') { const n = loopNoise(audio.noise, 'lowpass', 600, 0.5, 0.0); lfo(n.g.gain, 0.12, 0.13, 0.14); lfo(n.f.frequency, 0.12, 300, 700); }
    if (kind === 'rumble') loopNoise(audio.brown, 'lowpass', 160, 0.7, 0.6);
    if (kind === 'crowd') { const n = loopNoise(audio.noise, 'bandpass', 600, 0.9, 0.05); lfo(n.g.gain, 0.3, 0.02, 0.05); every(0.4, 1.4, (t) => this.murmur(t)); }
    if (kind === 'room') { const n = loopNoise(audio.noise, 'bandpass', 450, 1.2, 0.025); every(3, 8, (t) => this.clink(t)); }
    if (kind === 'birds') every(1.2, 4.5, (t) => this.chirp(t));
    if (kind === 'gulls') every(4, 9, (t) => this.gull(t));
    if (kind === 'crickets') every(0.25, 0.7, (t) => this.cricket(t));
    if (kind === 'train') { loopNoise(audio.brown, 'lowpass', 140, 0.7, 0.55); const go = () => { const t = ctx.currentTime + 0.05; perc(ctx, this.out, audio.noise, t, 'clack', 0.6); perc(ctx, this.out, audio.noise, t + 0.16, 'clack', 0.45); this.timers.push(setTimeout(go, 1300)); }; go(); }
    if (kind === 'chickens') every(5, 11, (t) => this.cluck(t));
    if (kind === 'clock') { const go = () => { perc(ctx, this.out, audio.noise, ctx.currentTime + 0.02, 'clack', 0.08); this.timers.push(setTimeout(go, 1000)); }; go(); }
  }
  chirp(t) {
    const ctx = this.a.ctx; const n = 2 + Math.floor(Math.random() * 4); const base = 2400 + Math.random() * 1800;
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(); const g = ctx.createGain(); const tt = t + i * 0.11;
      o.frequency.setValueAtTime(base, tt); o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.5), tt + 0.06);
      env(ctx, g, tt, 0.01, 0.03, 0.07); o.connect(g); g.connect(this.out); o.start(tt); o.stop(tt + 0.1);
    }
  }
  gull(t) {
    const ctx = this.a.ctx;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 3;
      const g = ctx.createGain(); const tt = t + i * 0.32;
      o.frequency.setValueAtTime(1200, tt); o.frequency.exponentialRampToValueAtTime(800, tt + 0.25);
      env(ctx, g, tt, 0.02, 0.02, 0.25); o.connect(f); f.connect(g); g.connect(this.out); o.start(tt); o.stop(tt + 0.3);
    }
  }
  cricket(t) {
    const ctx = this.a.ctx; const f0 = 4200 + Math.random() * 600;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(); const g = ctx.createGain(); const tt = t + i * 0.045;
      o.frequency.value = f0; env(ctx, g, tt, 0.005, 0.012, 0.03); o.connect(g); g.connect(this.out); o.start(tt); o.stop(tt + 0.05);
    }
  }
  murmur(t) {
    const ctx = this.a.ctx; const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 500; f.Q.value = 4;
    const g = ctx.createGain(); const base = 160 + Math.random() * 120; const d = 0.3 + Math.random() * 0.6;
    o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * (0.85 + Math.random() * 0.3), t + d);
    env(ctx, g, t, 0.06, 0.012, d); o.connect(f); f.connect(g); g.connect(this.out); o.start(t); o.stop(t + d + 0.2);
  }
  clink(t) { INST.bell(this.a.ctx, this.out, t, 96 + Math.floor(Math.random() * 5), 0.2, 0.25); }
  cluck(t) {
    const ctx = this.a.ctx;
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(); o.type = 'square'; const g = ctx.createGain(); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
      const tt = t + i * 0.13; o.frequency.setValueAtTime(500, tt); o.frequency.exponentialRampToValueAtTime(380, tt + 0.08);
      env(ctx, g, tt, 0.005, 0.02, 0.07); o.connect(f); f.connect(g); g.connect(this.out); o.start(tt); o.stop(tt + 0.1);
    }
  }
  fadeIn(t = 2, level = 1) { const g = this.out.gain; const now = this.a.ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(Math.max(0.0001, g.value), now); g.linearRampToValueAtTime(level, now + t); }
  setLevel(level, t = 1) { this.fadeIn(t, level); }
  stop(t = 2) {
    const g = this.out.gain; const now = this.a.ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.0001, now + t);
    this.timers.forEach(clearTimeout); this.timers = [];
    setTimeout(() => { this.nodes.forEach((n) => { try { n.stop(); } catch { /* */ } }); try { this.out.disconnect(); } catch { /* */ } }, t * 1000 + 200);
  }
}

const SFX_TRIM = {
  flame: -9, firework: -6, pop: -3, select: -3, yay: -2,
  shutter: 9, snap: 8, quack: 6, launch: 7, whoosh: 5, scratch: 5, page: 4, woof: 4, sip: 6,
  sizzle: -12, whisk: 16, pour: 8,
};

// ------------------------------------------------------------ main audio
class AudioEngine {
  constructor() { this.ctx = null; this.music = null; this.musicName = null; this.beds = new Map(); this.volume = 0.5; this.muted = false; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 1.2; this.musicBus.connect(this.master);
    this.ambBus = ctx.createGain(); this.ambBus.gain.value = 1.05; this.ambBus.connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 1.35; this.sfxBus.connect(this.master);
    this.songBus = ctx.createGain(); this.songBus.gain.value = 0.75; this.songBus.connect(this.master);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this.impulse(2.8);
    const rg = ctx.createGain(); rg.gain.value = 0.5; this.reverb.connect(rg); rg.connect(this.musicBus);
    this.sfxVerb = ctx.createGain(); this.sfxVerb.gain.value = 0.3; this.sfxVerb.connect(this.reverb);
    this.noise = noiseBuffer(ctx, 2); this.brown = noiseBuffer(ctx, 4, 'brown');
    this.applyVolume();
    // iOS unlock
    const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
  }
  impulse(sec) {
    const ctx = this.ctx; const len = Math.floor(ctx.sampleRate * sec); const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  get ready() { return !!this.ctx; }
  applyVolume() { if (!this.ctx) return; this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05); }
  setVolume(v) { this.volume = v; this.applyVolume(); }
  setMuted(m) { this.muted = m; this.applyVolume(); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  playMusic(name, fade = 2.5) {
    if (!this.ctx || name === this.musicName) return;
    if (this.music) this.music.stop(fade);
    this.musicName = name; this.music = null;
    if (name && PRESETS[name]) { this.music = new MusicPlayer(this, PRESETS[name]); this.music.fadeIn(fade); }
  }
  setMusicLevel(v, t = 1.5) { if (this.ctx) this.musicBus.gain.setTargetAtTime(v * 1.2, this.ctx.currentTime, t / 3); }
  setAmbienceLevel(v, t = 1.5) { if (this.ctx) this.ambBus.gain.setTargetAtTime(v * 1.05, this.ctx.currentTime, t / 3); }
  // beds: array of names or {name: level}
  setBeds(list, fade = 2) {
    if (!this.ctx) return;
    const want = new Map((list || []).map((b) => (typeof b === 'string' ? [b, 1] : [b[0], b[1]])));
    for (const [k, bed] of this.beds) if (!want.has(k)) { bed.stop(fade); this.beds.delete(k); }
    for (const [k, lvl] of want) {
      if (!this.beds.has(k)) { const bed = new Bed(this, k); bed.fadeIn(fade, lvl); this.beds.set(k, bed); } else this.beds.get(k).setLevel(lvl, fade);
    }
  }
  scene(music, beds) { this.playMusic(music); this.setBeds(beds); this.setMusicLevel(1); this.setAmbienceLevel(1); }
  stopAll(fade = 1.5) { this.playMusic(null, fade); this.setBeds([], fade); }

  sfx(name, opt = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx; const t = ctx.currentTime + 0.01;
    // per-effect trim (dB), measured so no effect jumps out of the scene or gets lost in it
    let out = this.sfxBus, wet = this.sfxVerb;
    const trim = SFX_TRIM[name];
    if (trim) {
      const k = Math.pow(10, trim / 20);
      out = ctx.createGain(); out.gain.value = k; out.connect(this.sfxBus);
      wet = ctx.createGain(); wet.gain.value = k; wet.connect(this.sfxVerb);
    }
    const both = (fn) => { fn(out); fn(wet); };
    const nz = this.noise;
    switch (name) {
      case 'pluck': both((d) => { INST.pluck(ctx, d, t, 84, 0.2, 0.8); INST.bell(ctx, d, t + 0.08, 91, 0.3, 0.6); }); perc(ctx, out, nz, t, 'brush', 2); break;
      case 'pet': for (let i = 0; i < 3; i++) both((d) => INST.bell(ctx, d, t + i * 0.12, [76, 79, 84][i], 0.2, 0.5)); break;
      case 'heart': both((d) => { INST.bell(ctx, d, t, 81, 0.2, 0.6); INST.bell(ctx, d, t + 0.1, 88, 0.2, 0.6); }); break;
      case 'chime': [72, 76, 79, 84].forEach((m, i) => both((d) => INST.bell(ctx, d, t + i * 0.09, m + (opt.up || 0), 0.3, 0.6))); break;
      case 'sparkle': for (let i = 0; i < 5; i++) both((d) => INST.bell(ctx, d, t + i * 0.06, 96 - i * 2 + Math.floor(Math.random() * 3), 0.2, 0.35)); break;
      case 'page': perc(ctx, out, nz, t, 'brush', 4); perc(ctx, out, nz, t + 0.08, 'shaker', 3); break;
      case 'pop': both((d) => INST.pluck(ctx, d, t, 79 + (opt.pitch || 0), 0.1, 0.9)); break;
      case 'tick': INST.pluck(ctx, out, t, 91, 0.05, 0.4); break;
      case 'select': both((d) => { INST.pluck(ctx, d, t, 76, 0.1, 0.7); INST.pluck(ctx, d, t + 0.07, 83, 0.1, 0.7); }); break;
      case 'step': perc(ctx, out, nz, t, 'shaker', 0.8); break;
      case 'shutter': perc(ctx, out, nz, t, 'clack', 1.4); perc(ctx, out, nz, t + 0.07, 'snare', 0.5); break;
      case 'snap': perc(ctx, out, nz, t, 'clack', 0.35 + Math.random() * 0.25); perc(ctx, out, nz, t + 0.05 + Math.random() * 0.03, 'clack', 0.2); break;
      case 'splash': { const s = ctx.createBufferSource(); s.buffer = nz; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2500, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.4); const g = ctx.createGain(); env(ctx, g, t, 0.01, 0.25, 0.45); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.6); break; }
      case 'oar': { const s = ctx.createBufferSource(); s.buffer = nz; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.35); const g = ctx.createGain(); env(ctx, g, t, 0.02, 0.1, 0.4); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.5); break; }
      case 'whoosh': { const s = ctx.createBufferSource(); s.buffer = nz; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2500, t + 0.6); const g = ctx.createGain(); env(ctx, g, t, 0.25, 0.12, 0.6); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 1); break; }
      case 'flame': { const s = ctx.createBufferSource(); s.buffer = this.brown; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 1.6); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 1.7); break; }
      case 'purr': { const s = ctx.createBufferSource(); s.buffer = this.brown; s.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; const g = ctx.createGain(); g.gain.value = 0; const o = ctx.createOscillator(); o.frequency.value = 24; const og = ctx.createGain(); og.gain.value = 0.35; o.connect(og); og.connect(g.gain); const m = ctx.createGain(); env(ctx, m, t, 0.2, 0.9, 1.4); s.connect(f); f.connect(g); g.connect(m); m.connect(out); s.start(t); o.start(t); s.stop(t + 1.8); o.stop(t + 1.8); break; }
      case 'woof': for (let i = 0; i < 2; i++) { const o = ctx.createOscillator(); o.type = 'sawtooth'; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = ctx.createGain(); const tt = t + i * 0.22; o.frequency.setValueAtTime(420, tt); o.frequency.exponentialRampToValueAtTime(260, tt + 0.1); env(ctx, g, tt, 0.005, 0.08, 0.1); o.connect(f); f.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.15); } break;
      case 'meow': { const o = ctx.createOscillator(); o.type = 'triangle'; const g = ctx.createGain(); o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(900, t + 0.15); o.frequency.linearRampToValueAtTime(500, t + 0.45); env(ctx, g, t, 0.05, 0.06, 0.45); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.55); break; }
      case 'quack': for (let i = 0; i < 2; i++) { const o = ctx.createOscillator(); o.type = 'square'; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2; const g = ctx.createGain(); const tt = t + i * 0.18; o.frequency.setValueAtTime(330, tt); o.frequency.exponentialRampToValueAtTime(260, tt + 0.12); env(ctx, g, tt, 0.005, 0.07, 0.12); o.connect(f); f.connect(g); g.connect(out); o.start(tt); o.stop(tt + 0.15); } break;
      case 'notify': both((d) => { INST.bell(ctx, d, t, 84, 0.2, 0.7); INST.bell(ctx, d, t + 0.09, 79, 0.2, 0.6); }); break;
      case 'send': INST.pluck(ctx, out, t, 88, 0.05, 0.5); break;
      case 'join': [67, 72, 79].forEach((m, i) => both((d) => INST.bell(ctx, d, t + i * 0.08, m, 0.2, 0.7))); break;
      case 'firework': { perc(ctx, out, nz, t, 'kick', 1.2); for (let i = 0; i < 14; i++) perc(ctx, out, nz, t + 0.25 + Math.random() * 0.9, 'hat', 1.6); break; }
      case 'launch': { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(1800, t + 0.8); env(ctx, g, t, 0.05, 0.02, 0.8); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.9); break; }
      case 'applause': {
        // a full hall: dense hand claps that swell then fade over ~7s, plus a cheering crowd
        const bus = ctx.createGain(); bus.gain.value = 1.2; bus.connect(out);
        const dur = 7;
        for (let i = 0; i < 900; i++) {
          const k = Math.pow(Math.random(), 0.6) * dur; // denser near the start
          const env = k < 0.6 ? k / 0.6 : 1 - (k - 0.6) / (dur - 0.6) * 0.85;
          const tt = t + k;
          const src = ctx.createBufferSource(); src.buffer = nz;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 1800; f.Q.value = 1.2;
          const g = ctx.createGain(); const v = (0.25 + Math.random() * 0.3) * env;
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(Math.max(0.001, v), tt + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.07 + Math.random() * 0.05);
          src.connect(f); f.connect(g); g.connect(bus); src.start(tt, Math.random() * 1.5); src.stop(tt + 0.15);
        }
        // crowd roar ("woo"): filtered noise swell + a few rising voice-like tones
        const roar = ctx.createBufferSource(); roar.buffer = this.brown; roar.loop = true;
        const rf = ctx.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 700; rf.Q.value = 0.8;
        const rg = ctx.createGain(); rg.gain.setValueAtTime(0.0001, t); rg.gain.linearRampToValueAtTime(0.9, t + 0.8); rg.gain.linearRampToValueAtTime(0.5, t + 3); rg.gain.linearRampToValueAtTime(0.0001, t + dur);
        roar.connect(rf); rf.connect(rg); rg.connect(bus); roar.start(t); roar.stop(t + dur + 0.1);
        for (let i = 0; i < 14; i++) {
          const tt = t + 0.2 + Math.random() * 2.5; const o = ctx.createOscillator(); o.type = 'sawtooth';
          const f0 = 260 + Math.random() * 260; o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * 1.5, tt + 0.35); o.frequency.exponentialRampToValueAtTime(f0 * 1.2, tt + 0.9);
          const vf = ctx.createBiquadFilter(); vf.type = 'bandpass'; vf.frequency.value = 1100; vf.Q.value = 3;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(0.03, tt + 0.1); g.gain.linearRampToValueAtTime(0.0001, tt + 1);
          o.connect(vf); vf.connect(g); g.connect(bus); o.start(tt); o.stop(tt + 1.05);
        }
        break;
      }
      case 'jingle': {
        // small brass bell shaken by a rope: bright inharmonic partials, struck a few times
        const bus = ctx.createGain(); bus.gain.value = 0.9; bus.connect(out); bus.connect(this.sfxVerb);
        const strike = (tt, f0, v) => {
          for (const [ratio, amp, decay] of [[1, 1, 1.6], [2.76, 0.55, 0.9], [5.4, 0.35, 0.5], [8.93, 0.22, 0.3], [13.3, 0.12, 0.18]]) {
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f0 * ratio * (1 + (Math.random() - 0.5) * 0.004);
            const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.09 * amp * v, tt + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, tt + decay);
            o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + decay + 0.05);
          }
          // metallic tick of the clapper
          const n = ctx.createBufferSource(); n.buffer = nz; const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 6000;
          const ng = ctx.createGain(); ng.gain.setValueAtTime(0.06 * v, tt); ng.gain.exponentialRampToValueAtTime(0.0001, tt + 0.03);
          n.connect(hf); hf.connect(ng); ng.connect(bus); n.start(tt, Math.random()); n.stop(tt + 0.05);
        };
        const hits = [[0, 1], [0.14, 0.8], [0.26, 0.9], [0.42, 0.6], [0.6, 0.7], [0.85, 0.4], [1.15, 0.3]];
        hits.forEach(([dt, v], i) => strike(t + dt + Math.random() * 0.03, (i % 2 ? 1480 : 1320) * (1 + (Math.random() - 0.5) * 0.02), v));
        break;
      }
      case 'yay': both((d) => [72, 76, 79, 84, 88].forEach((m, i) => INST.pluck(ctx, d, t + i * 0.07, m, 0.2, 0.7))); break;
      case 'sip': perc(ctx, out, nz, t, 'shaker', 1.5); perc(ctx, out, nz, t + 0.2, 'shaker', 1.2); break;
      case 'clink': INST.bell(ctx, out, t, 98, 0.1, 0.5); INST.bell(ctx, out, t + 0.03, 103, 0.1, 0.3); break;
      case 'wave': { const s = ctx.createBufferSource(); s.buffer = nz; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1600, t + 1); f.frequency.linearRampToValueAtTime(300, t + 2.5); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 1); g.gain.linearRampToValueAtTime(0.0001, t + 2.8); s.loop = true; s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 3); break; }
      case 'scratch': for (let i = 0; i < 3; i++) perc(ctx, out, nz, t + i * 0.05, 'brush', 2); break;
      // kitchen sounds for the omakase close-ups
      case 'chop': perc(ctx, out, nz, t, 'clack', 0.9); perc(ctx, out, nz, t + 0.01, 'kick', 0.25); break;
      case 'whisk': for (let i = 0; i < 7; i++) perc(ctx, out, nz, t + i * 0.075, 'brush', 0.9 + (i % 2) * 0.4); break;
      case 'pour': case 'sizzle': case 'steam': {
        const len = name === 'sizzle' ? 1.6 : name === 'pour' ? 1.1 : 1.4;
        const s = ctx.createBufferSource(); s.buffer = nz; s.loop = true;
        const f = ctx.createBiquadFilter();
        if (name === 'sizzle') { f.type = 'highpass'; f.frequency.value = 3200; }
        else if (name === 'pour') { f.type = 'bandpass'; f.Q.value = 3; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1300, t + len); }
        else { f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.value = 1800; }
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(name === 'sizzle' ? 0.32 : 0.22, t + 0.12); g.gain.linearRampToValueAtTime(0.0001, t + len);
        s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + len + 0.1);
        if (name === 'sizzle') for (let i = 0; i < 10; i++) perc(ctx, out, nz, t + Math.random() * len * 0.8, 'hat', 0.35);
        break;
      }
      default: break;
    }
  }

  // A one-off musical sting
  sting(notes, inst = 'bell', gap = 0.12) {
    if (!this.ctx) return; const t = this.ctx.currentTime + 0.02;
    notes.forEach((m, i) => { INST[inst](this.ctx, this.sfxBus, t + i * gap, m, 0.4, 0.7); INST[inst](this.ctx, this.sfxVerb, t + i * gap, m, 0.4, 0.5); });
  }

  // ---------------------------------------------------------- record player
  // Plays an audio file in a loop through the music bus (so mute/volume apply).
  // Resolves false if the file is missing, so callers can fall back.
  // `gain` evens out loud masters (about 0.35 for a -15 LUFS pop track).
  async playRecord(url, { loop = true, onEnd, gain = 0.55 } = {}) {
    this.stopRecord();
    if (!this.ctx) return false;
    const el = new Audio(url); el.loop = loop; el.preload = 'auto';
    if (onEnd) el.onended = onEnd;
    const ok = await new Promise((res) => { el.oncanplay = () => res(true); el.onerror = () => res(false); setTimeout(() => res(false), 8000); });
    if (!ok) return false;
    const src = this.ctx.createMediaElementSource(el);
    const g = this.ctx.createGain(); g.gain.value = 0.0001;
    const analyser = this.ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.7;
    // the analyser listens before the gain so visualisers don't depend on the level
    src.connect(g); g.connect(this.musicBus); src.connect(analyser);
    g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 1.2);
    this.playMusic(null, 1);
    try { await el.play(); } catch { return false; }
    this.record = { el, g, analyser };
    return true;
  }
  stopRecord(fade = 1) {
    const r = this.record; if (!r) return; this.record = null;
    r.g.gain.cancelScheduledValues(this.ctx.currentTime);
    r.g.gain.setValueAtTime(r.g.gain.value, this.ctx.currentTime);
    r.g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + fade);
    setTimeout(() => { r.el.pause(); r.el.src = ''; }, fade * 1000 + 100);
  }

  // ---------------------------------------------------------- song
  async loadSong(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('missing');
      this.songBytes = await r.arrayBuffer();
      return true;
    } catch { this.songBytes = null; return false; }
  }
  async songBuffer() {
    if (this.songBuf) return this.songBuf;
    if (this.songBytes) {
      try { this.songBuf = await this.ctx.decodeAudioData(this.songBytes.slice(0)); this.songIsFallback = false; return this.songBuf; } catch { /* fall through */ }
    }
    this.songBuf = await renderFallbackSong(this.ctx.sampleRate);
    this.songIsFallback = true;
    return this.songBuf;
  }
  playSong(buf) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.75;
    const g = ctx.createGain(); g.gain.value = 1;
    src.connect(g); g.connect(analyser); analyser.connect(this.songBus);
    const startAt = ctx.currentTime + 0.05;
    src.start(startAt);
    return {
      src, analyser, startAt, duration: buf.duration,
      get time() { return ctx.currentTime - this.startAt; },
      stop() { try { this.src.stop(); } catch { /* */ } },
      // jump to a point in the song (debug fast-forward): a buffer source can't seek, so start a new one
      seek(t) {
        t = Math.max(0, Math.min(buf.duration - 0.05, t));
        this.stop();
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(g);
        const at = ctx.currentTime + 0.02;
        s.start(at, t); this.src = s; this.startAt = at - t;
      },
    };
  }
}

// A gentle ~80s instrumental used when assets/song.mp3 is not supplied.
async function renderFallbackSong(rate) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const dur = 82;
  const ctx = new OAC(2, Math.floor(rate * dur), rate);
  const bus = ctx.createGain(); bus.gain.value = 0.9; bus.connect(ctx.destination);
  const verb = ctx.createConvolver();
  const len = Math.floor(rate * 2.5); const ib = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) { const d = ib.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
  verb.buffer = ib; const vg = ctx.createGain(); vg.gain.value = 0.35; verb.connect(vg); vg.connect(bus);
  const noise = noiseBuffer(ctx, 2);
  const bpm = 84; const B = 60 / bpm; const root = 60;
  const prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
  const mel = [
    [4, 1], [7, 1], [9, 1], [7, 1], [4, 2], [2, 2], [0, 1], [2, 1], [4, 2], [2, 1], [0, 1], [2, 4],
    [4, 1], [7, 1], [12, 1], [11, 1], [9, 2], [7, 2], [9, 1], [7, 1], [4, 2], [5, 1], [4, 1], [2, 4],
  ];
  const bars = Math.floor((dur - 4) / (B * 4));
  for (let bar = 0; bar < bars; bar++) {
    const t0 = 1 + bar * B * 4; const ch = prog[bar % 4];
    const section = bar < 4 ? 0 : bar < 12 ? 1 : bar < 20 ? 2 : 1;
    ch.forEach((n) => INST.pad(ctx, bus, t0, root - 12 + n, B * 4, section === 2 ? 1 : 0.7));
    if (section > 0) { INST.bass(ctx, bus, t0, root - 24 + ch[0], B * 2, 0.9); INST.bass(ctx, bus, t0 + 2 * B, root - 24 + ch[0], B * 2, 0.7); }
    for (let b = 0; b < 4; b++) ch.forEach((n, i) => INST.keys(ctx, bus, t0 + b * B + i * 0.02, root + n, B, 0.35));
    if (section === 2) for (let b = 0; b < 4; b++) { perc(ctx, bus, noise, t0 + b * B, b % 2 ? 'snare' : 'kick', 0.7); perc(ctx, bus, noise, t0 + b * B + B / 2, 'hat', 0.6); }
    else if (section === 1) for (let b = 0; b < 4; b++) perc(ctx, bus, noise, t0 + b * B, 'brush', 0.8);
  }
  // melody over bars 4..
  let t = 1 + 4 * B * 4; let loops = 0;
  while (t < dur - 6 && loops < 3) {
    for (const [d, beats] of mel) {
      if (t > dur - 6) break;
      const m = root + 12 + d;
      INST.flute(ctx, bus, t, m, beats * B * 0.92, 1); INST.flute(ctx, verb, t, m, beats * B * 0.92, 0.8);
      if (loops > 0) INST.bell(ctx, verb, t, m + 12, 0.3, 0.3);
      t += beats * B;
    }
    loops++;
  }
  return ctx.startRendering();
}

export const audio = new AudioEngine();
export const MUSIC_PRESETS = PRESETS;

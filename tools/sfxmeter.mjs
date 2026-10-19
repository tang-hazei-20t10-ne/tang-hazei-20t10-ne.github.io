// Sound-effect loudness: plays each sfx alone (music and ambience muted) and
// prints its loudest 50 ms window and peak, in dBFS at the master bus.
import { chromium } from 'playwright';
const names = process.argv.slice(2);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await p.addInitScript(() => { localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'discord', started: false })); });
await p.goto((process.env.URL || 'http://localhost:5199/') + '?debug');
await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
await p.waitForTimeout(1500);
const res = await p.evaluate(async (names) => {
  const a = window.__audio; a.setMusicLevel(0, 0.01); a.setAmbienceLevel(0, 0.01); a.playMusic(null, 0.01);
  await new Promise((r) => setTimeout(r, 1200));
  const an = a.ctx.createAnalyser(); an.fftSize = 2048; a.master.connect(an);
  const buf = new Float32Array(2048); const out = [];
  for (const n of names) {
    a.sfx(n);
    const dur = n === 'applause' ? 7000 : n === 'jingle' ? 4000 : 1800;
    let win = 0, peak = 0; const t0 = performance.now();
    while (performance.now() - t0 < dur) { an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) { s += v * v; peak = Math.max(peak, Math.abs(v)); } win = Math.max(win, s / buf.length); await new Promise((r) => setTimeout(r, 30)); }
    out.push([n, 10 * Math.log10(win + 1e-12), 20 * Math.log10(peak + 1e-12)]);
    await new Promise((r) => setTimeout(r, 600));
  }
  return { out, vol: a.volume };
}, names);
console.log('master volume', res.vol);
for (const [n, w, pk] of res.out.sort((x, y) => y[1] - x[1])) console.log(n.padEnd(10), 'loudest', w.toFixed(1).padStart(6), 'dB   peak', pk.toFixed(1).padStart(6), 'dB');
await b.close();

import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:5199/?debug'); await p.click('#loading .btn', { timeout: 20000 }); await p.waitForTimeout(1500);
const r = await p.evaluate(async () => {
  const a = window.__audio; const out = {};
  for (const name of ['applause', 'jingle', 'pet', 'chime']) {
    const off = new OfflineAudioContext(2, 44100 * 8, 44100);
    const save = { ctx: a.ctx, sfxBus: a.sfxBus, sfxVerb: a.sfxVerb };
    a.ctx = off; a.sfxBus = off.destination; a.sfxVerb = off.createGain();
    a.sfx(name);
    Object.assign(a, save);
    const buf = await off.startRendering(); const d = buf.getChannelData(0);
    let pk = 0, ss = 0, n = 0; for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); pk = Math.max(pk, v); if (v > 1e-4) { ss += v * v; n++; } }
    out[name] = { peakDb: (20 * Math.log10(pk)).toFixed(1), rmsDb: (10 * Math.log10(ss / Math.max(1, n))).toFixed(1), activeSec: (n / 44100).toFixed(1) };
  }
  return out;
});
console.log(JSON.stringify(r, null, 1)); await b.close();

// Loudness meter: node tools/meter.mjs <chapter> [settleMs] [measureMs] [actions...]
// Taps the master bus (before the compressor) and prints the average and peak level in dBFS.
import { chromium } from 'playwright';
const [,, ch = 'meadow', settle = '6000', dur = '8000', ...acts] = process.argv;
const url = process.env.URL || 'http://localhost:5199/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await page.addInitScript(([ch]) => {
  if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: ch, started: ch !== 'discord' })); }
}, [ch]);
await page.goto(url + (process.env.Q || '?debug'));
await page.waitForSelector('#loading .btn', { timeout: 20000 });
await page.click('#loading .btn');
await page.waitForTimeout(+settle);
for (const a of acts) {
  const [cmd, arg] = a.split(':');
  if (cmd === 'key') { await page.keyboard.down(arg); await page.waitForTimeout(100); await page.keyboard.up(arg); }
  else if (cmd === 'wait') await page.waitForTimeout(+arg);
  else if (cmd === 'eval') await page.evaluate(decodeURIComponent(a.slice(5)));
}
const r = await page.evaluate(async (dur) => {
  const a = window.__audio; const an = a.ctx.createAnalyser(); an.fftSize = 2048; a.master.connect(an);
  const buf = new Float32Array(2048); let sum = 0, n = 0, peak = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < dur) {
    an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) { s += v * v; peak = Math.max(peak, Math.abs(v)); }
    sum += s / buf.length; n++; await new Promise((r) => setTimeout(r, 50));
  }
  return { rms: 10 * Math.log10(sum / n + 1e-12), peak: 20 * Math.log10(peak + 1e-12), vol: a.volume, state: a.ctx.state };
}, +dur);
console.log(ch.padEnd(10), 'avg', r.rms.toFixed(1), 'dB  peak', r.peak.toFixed(1), 'dB  vol', r.vol, r.state);
await browser.close();

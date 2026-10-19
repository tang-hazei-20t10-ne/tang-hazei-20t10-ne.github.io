// Checks the 3D chapters hand over to each other: starts at the island and,
// in each chapter, leaves through the same game.leave() the real ending uses.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/GL Driver/.test(m.text())) errs.push('console: ' + m.text()); });
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'island', started: true, flowers: [{ species: 'tulip', color: '#f06d8a' }] })); } });
await p.goto('http://localhost:5199/?debug&fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const ch = () => p.evaluate(() => window.__state.data.chapter);
const t0 = Date.now(); let last = '';
while (Date.now() - t0 < 600000) {
  const c = await ch();
  if (c !== last) { console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's', c); last = c; if (c === 'epilogue') { await p.waitForTimeout(25000); break; } await p.waitForTimeout(6000); }
  if (c === 'stage') {
    // start the song, jump to its end, then click through the ending
    await p.keyboard.down('KeyE'); await p.waitForTimeout(1200); await p.keyboard.up('KeyE');
    await p.evaluate(() => document.querySelectorAll('#debug .seek')[3]?.click());
  } else if (c !== 'balloon') {
    await p.evaluate(() => { const w = window.__guide?.world; if (w && !w.dead && !w._left) { w._left = true; window.__game.leave(w); } });
  }
  await p.keyboard.press('Space');
  await p.evaluate(() => { const e = [...document.querySelectorAll('#modal .sheet button, #dialog .choices button, #actions .btn')].find((x) => x.offsetParent && !x.disabled && !/📷|Chụp|Tải/.test(x.textContent)); e?.click(); });
  await p.waitForTimeout(1500);
}
await p.screenshot({ path: 'test-shots/chain3d-end.png' });
console.log(errs.length ? [...new Set(errs)].join('\n') : 'no errors');
await b.close();

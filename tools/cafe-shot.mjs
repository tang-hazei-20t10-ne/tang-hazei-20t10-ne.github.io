// Screenshots the café chapter: the empty room, then with drinks served.
// usage: node cafe-shot.mjs <tag>   (env W, H)
import { chromium } from 'playwright';
const W = +(process.env.W || 1280), H = +(process.env.H || 720), tag = process.argv[2] || 'cafe';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'cafe', started: true })); } });
await p.goto('http://localhost:5199/?fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const hide = (v) => p.evaluate((v) => { for (const s of ['#dialog', '#modal', '#actions', '#debug']) { const e = document.querySelector(s); if (e) e.style.visibility = v; } }, v);
await p.waitForTimeout(3500); await hide('hidden'); await p.screenshot({ path: `../test-shots/${tag}-room.png` }); await hide('');
const t0 = Date.now();
while (Date.now() - t0 < 60000) {
  if (await p.$('#actions .btn')) break;
  const opt = await p.$('#modal .opt'); if (opt) { await p.screenshot({ path: `../test-shots/${tag}-menu.png` }); await opt.evaluate((e) => e.click()); }
  await p.keyboard.press('Space'); await p.waitForTimeout(400);
}
await p.waitForTimeout(800); await hide('hidden'); await p.screenshot({ path: `../test-shots/${tag}-served.png` });
console.log(errs.length ? errs : 'no errors');
await b.close();

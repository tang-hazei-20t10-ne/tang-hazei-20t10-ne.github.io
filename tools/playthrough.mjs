// Monkey playthrough: starts a fresh game in fast debug mode and keeps
// advancing (dialogs, walking, interacting, choosing options) until the
// epilogue, logging each chapter it reaches and any errors.
import { chromium } from 'playwright';
const LIMIT = +(process.env.LIMIT || 900) * 1000;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/GL Driver/.test(m.text())) errs.push('console: ' + m.text()); });
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.clear(); indexedDB.deleteDatabase('hazei-album'); } });
await p.goto('http://localhost:5199/?debug&fast');
await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const t0 = Date.now(); let last = '', since = Date.now();
const chapter = () => p.evaluate(() => window.__state?.data?.chapter).catch(() => '?');
while (Date.now() - t0 < LIMIT) {
  const ch = await chapter();
  if (ch !== last) { console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's', ch, errs.length ? '(errors so far: ' + errs.length + ')' : ''); last = ch; since = Date.now(); if (ch === 'epilogue') { await p.waitForTimeout(20000); break; } }
  if (Date.now() - since > 150000) { console.log('stuck in', ch); await p.screenshot({ path: `test-shots/stuck-${ch}.png` }); since = Date.now() + 1e9; }
  const start = await p.$('#loading:not(.gone) .btn'); if (start) await start.click({ timeout: 1000 }).catch(() => {});
  await p.keyboard.press('Space');
  await p.keyboard.down('KeyW'); await p.waitForTimeout(500); await p.keyboard.up('KeyW');
  await p.keyboard.down('KeyE'); await p.waitForTimeout(800); await p.keyboard.up('KeyE');
  const btn = await p.$('#modal .sheet button.btn:not([disabled]):not(.soft), #modal .sheet .opt, #modal .sheet button:not([disabled]), #dialog .choices button:not([disabled]), .dc-reply, .dc-btn.pulse, .dc-tile.act, .dc-btn, #actions .btn:not(.soft), #actions .btn');
  if (btn) await btn.click({ timeout: 1000 }).catch(() => {});
  await p.waitForTimeout(200);
}
await p.screenshot({ path: 'test-shots/playthrough-end.png' });
const n = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('hazei-album', 1); r.onsuccess = () => { try { const q = r.result.transaction('photos').objectStore('photos').count(); q.onsuccess = () => res(q.result); } catch { res(0); } }; r.onerror = () => res(-1); }));
console.log('album photos', n);
console.log(errs.length ? [...new Set(errs)].join('\n') : 'no errors');
await b.close();

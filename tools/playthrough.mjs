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
await p.addInitScript((start) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.clear(); indexedDB.deleteDatabase('hazei-album'); if (start) localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: start, started: true })); } }, process.env.START || '');
await p.goto('http://localhost:5199/?debug&fast');
await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const t0 = Date.now(); let last = '', since = Date.now(), step = 0;
const chapter = () => p.evaluate(() => window.__state?.data?.chapter).catch(() => '?');
while (Date.now() - t0 < LIMIT) {
  const ch = await chapter();
  if (ch !== last) { console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(4) + 's', ch, errs.length ? '(errors so far: ' + errs.length + ')' : ''); last = ch; since = Date.now(); if (ch === 'epilogue') { await p.waitForTimeout(20000); break; } }
  if (Date.now() - since > 240000) { console.log('stuck in', ch); await p.screenshot({ path: `test-shots/stuck-${ch}.png` }); since = Date.now() + 1e9; }
  const start = await p.$('#loading:not(.gone) .btn'); if (start) await start.evaluate((e) => e.click()).catch(() => {});
  await p.keyboard.press('Space');
  // walk (forward in 3D, right in 2D) and interact
  await p.keyboard.down('KeyW'); await p.keyboard.down('KeyD'); await p.waitForTimeout(1200); await p.keyboard.up('KeyW'); await p.keyboard.up('KeyD');
  // interact only every few steps, so benches and swings don't hold it in place
  if ((step = (step || 0) + 1) % 3 === 0) { await p.keyboard.down('KeyE'); await p.waitForTimeout(900); await p.keyboard.up('KeyE'); }
  // pick one of the visible buttons, skipping taking/downloading photos (clicked directly: the debug panel may sit on top)
  await p.evaluate(() => {
    const all = [...document.querySelectorAll('#modal .sheet button, #modal .sheet .opt, #dialog .choices button, .dc-reply, .dc-btn, .dc-tile.act, #actions .btn')]
      .filter((e) => e.offsetParent && !e.disabled && !/Tải|Chơi lại|Lưu thiệp/.test(e.textContent) && !(e.closest('#actions') && /📷|Chụp/.test(e.textContent)));
    const pick = all.find((e) => /Tiếp|Đóng|→/.test(e.textContent)) || all[Math.floor(Math.random() * all.length)];
    pick?.click();
  }).catch(() => {});
  await p.waitForTimeout(200);
}
await p.screenshot({ path: 'test-shots/playthrough-end.png' });
const n = await p.evaluate(() => new Promise((res) => { const r = indexedDB.open('hazei-album', 1); r.onsuccess = () => { try { const q = r.result.transaction('photos').objectStore('photos').count(); q.onsuccess = () => res(q.result); } catch { res(0); } }; r.onerror = () => res(-1); }));
console.log('album photos', n);
console.log(errs.length ? [...new Set(errs)].join('\n') : 'no errors');
await b.close();

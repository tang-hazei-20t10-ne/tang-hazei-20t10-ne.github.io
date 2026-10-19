// Smoke test: opens every chapter, pokes at it (dialogs, walking, interacting,
// tapping the action buttons) and reports page errors and console errors.
import { chromium } from 'playwright';
const chapters = process.argv.slice(2).length ? process.argv.slice(2) : ['discord', 'meadow', 'market', 'train', 'bookshop', 'omakase', 'cafe', 'seaside', 'island', 'balloon', 'hill', 'village', 'stage', 'epilogue'];
const touch = !!process.env.TOUCH;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
let total = 0;
for (const ch of chapters) {
  const ctx = await b.newContext(touch ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/GL Driver|favicon/.test(m.text())) errs.push('console: ' + m.text()); });
  p.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(`http ${r.status()}: ${r.url()}`); });
  await p.addInitScript((c) => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: c, started: c !== 'discord' })); } }, ch);
  await p.goto('http://localhost:5199/?debug');
  await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
  await p.waitForTimeout(4000);
  for (let i = 0; i < 6; i++) {
    await p.keyboard.press('Space'); await p.waitForTimeout(400);
    await p.keyboard.down('KeyW'); await p.waitForTimeout(700); await p.keyboard.up('KeyW');
    await p.keyboard.down('KeyE'); await p.waitForTimeout(700); await p.keyboard.up('KeyE');
    // tap the first visible option or action, if any
    const btn = await p.$('#modal .sheet button:not([disabled]), #dialog .choices button:not([disabled]), .dc-reply, #actions .btn');
    if (btn) await btn.click({ timeout: 1500 }).catch(() => {});
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: `test-shots/smoke-${touch ? 'm-' : ''}${ch}.png` });
  console.log(ch.padEnd(10), errs.length ? '\n  ' + [...new Set(errs)].join('\n  ') : 'ok');
  total += errs.length;
  await ctx.close();
}
console.log('total problems', total);
await b.close();

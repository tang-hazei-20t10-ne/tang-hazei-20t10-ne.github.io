import { chromium } from 'playwright';
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: W, height: H }, hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'omakase', started: true })); } });
await p.goto('http://localhost:5199/?debug&fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const tag = process.env.TAG || 'o';
let n = 0; const shot = (k) => p.screenshot({ path: `test-shots/${tag}-${k}.png` });
const t0 = Date.now(); let shots = 0, rounds = 0;
while (Date.now() - t0 < 120000) {
  const opt = await p.$('#modal .opt');
  if (opt) { rounds++; await opt.evaluate((e) => e.click()); if (rounds <= 1) for (let k = 0; k < 8; k++) { await p.waitForTimeout(350); await shot('r1-' + k); } continue; }
  const ch = await p.evaluate(() => window.__state?.data?.chapter);
  if (ch !== 'omakase') break;
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
}
console.log('rounds', rounds, 'chapter', await p.evaluate(() => window.__state?.data?.chapter), errs.length ? errs : 'no errors');
await b.close();

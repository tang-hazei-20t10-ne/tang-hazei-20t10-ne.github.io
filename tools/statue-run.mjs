// Plays the café statue painting: picks a figure, fills parts, brushes a stroke,
// finishes, and screenshots each stage.  usage: node statue-run.mjs <tag> [figure index]  (env W, H, TOUCH)
import { chromium } from 'playwright';
const W = +(process.env.W || 1280), H = +(process.env.H || 720), tag = process.argv[2] || 'st', pick = +(process.argv[3] || 0);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: W, height: H }, hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'cafe', started: true })); } });
await p.goto('http://localhost:5199/?fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
const shot = (k) => p.screenshot({ path: `../test-shots/${tag}-${k}.png` });
const t0 = Date.now();
while (Date.now() - t0 < 60000) {
  if (await p.$('#actions .btn')) break;
  const opt = await p.$('#modal .opt'); if (opt) await opt.evaluate((e) => e.click());
  await p.keyboard.press('Space'); await p.waitForTimeout(400);
}
await p.waitForTimeout(500); await shot('actions');
await p.click('#actions .btn');
await p.waitForSelector('#modal .opt'); await p.waitForTimeout(300); await shot('pick');
await (await p.$$('#modal .opt'))[pick].click();
await p.waitForSelector('canvas.stage');
const box = await (await p.$('canvas.stage')).boundingBox();
const at = (i, j) => [box.x + (i + 8 + 0.5) / 52 * box.width, box.y + (j + 2 + 0.5) / 52 * box.height];
const sw = async (n) => (await p.$$('#modal .swatch'))[n].click();
const tap = async (i, j) => { const [x, y] = at(i, j); await p.mouse.click(x, y); await p.waitForTimeout(120); };
// a palette per part, tapped at points that land on each figure
const plan = [[4, [18, 31]], [0, [18, 33]], [4, [18, 12]], [12, [13, 16]], [12, [21, 16]], [2, [11, 20]], [3, [18, 19]], [8, [18, 41]], [13, [18, 26]], [3, [18, 23]], [4, [10, 9]], [2, [11, 9]], [4, [29, 34]], [0, [28, 18]]];
for (const [c, [i, j]] of plan) { await sw(c); await tap(i, j); }
await shot('mid');
await (await p.$$('.tool-row .btn'))[1].click(); await sw(3);
{ const [x0, y0] = at(14, 30), [x1, y1] = at(22, 30); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move(x1, y1, { steps: 8 }); await p.mouse.up(); }
await p.waitForTimeout(300); await shot('studio');
await (await p.$$('.tool-row .btn'))[2].click(); await p.waitForTimeout(200);
await (await p.$$('.tool-row .btn'))[0].click();
await p.click('.statue-side .btn.gold');
await p.waitForSelector('.statue-pair'); await p.waitForTimeout(300); await shot('pair');
await p.click('#modal .btn');
await p.waitForTimeout(1400); await shot('album');
await p.waitForTimeout(4500); await shot('sill');
console.log(errs.length ? errs : 'no errors');
await b.close();

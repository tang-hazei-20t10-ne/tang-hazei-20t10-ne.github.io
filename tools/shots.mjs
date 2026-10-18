// Screenshot helper: node tools/shots.mjs <chapter> [w] [h] [waitMs] [actions...]
import { chromium } from 'playwright';
const [,, ch = 'discord', w = '1280', h = '720', waitMs = '4000', ...acts] = process.argv;
const url = process.env.URL || 'http://localhost:5199/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(process.env.DPR || 1), hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.addInitScript(([ch]) => {
  const k = 'hazei-journey-v1';
  const cur = JSON.parse(localStorage.getItem(k) || '{}');
  if (!sessionStorage.getItem('init')) { sessionStorage.setItem('init', 1); localStorage.setItem(k, JSON.stringify({ ...cur, chapter: ch, started: ch !== 'discord', ...(window.__seed || {}) })); }
}, [ch]);
await page.goto(url + (process.env.Q || '?debug&fast'));
await page.waitForSelector('#loading .btn', { timeout: 20000 });
await page.click('#loading .btn');
let i = 0;
const shot = async (name) => { await page.screenshot({ path: `test-shots/${ch}-${name || i++}.png` }); };
await page.waitForTimeout(+waitMs);
for (const a of acts) {
  const [cmd, arg, arg2] = a.split(':');
  if (cmd === 'shot') await shot(arg);
  else if (cmd === 'wait') await page.waitForTimeout(+arg);
  else if (cmd === 'key') { await page.keyboard.down(arg); await page.waitForTimeout(+(arg2 || 100)); await page.keyboard.up(arg); }
  else if (cmd === 'hold') { await page.keyboard.down(arg); await page.waitForTimeout(+arg2); await page.keyboard.up(arg); }
  else if (cmd === 'click') await page.click(arg.replace(/~/g, ':'), { timeout: 5000 }).catch((e) => logs.push('click fail ' + arg));
  else if (cmd === 'eval') await page.evaluate(decodeURIComponent(arg));
  else if (cmd === 'mouse') { await page.mouse.click(+arg, +arg2); }
  else if (cmd === 'drag') { const [x1, y1, x2, y2] = arg.split(',').map(Number); await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 10 }); await page.mouse.up(); }
}
await shot('final');
console.log(logs.join('\n') || 'no console errors');
await browser.close();

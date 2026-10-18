import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('requestfailed', (r) => errs.push('failed ' + r.url()));
await p.goto('https://tang-hazei-20t10-ne.github.io/');
await p.waitForSelector('#loading .btn', { timeout: 30000 });
await p.screenshot({ path: 'test-shots/live-loading.png' });
await p.click('#loading .btn'); await p.waitForTimeout(4000);
await p.screenshot({ path: 'test-shots/live-discord.png' });
// jump through chapters via saved state to load each chunk from the live site
for (const ch of ['meadow', 'island', 'stage']) {
  await p.evaluate((c) => { localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: c, started: true })); location.reload(); }, ch);
  await p.waitForSelector('#loading .btn', { timeout: 30000 }); await p.click('#loading .btn'); await p.waitForTimeout(6000);
  await p.screenshot({ path: `test-shots/live-${ch}.png` });
}
await p.evaluate(() => localStorage.clear());
console.log(errs.filter((e) => !/GPU stall|ReadPixels/.test(e)).join('\n') || 'no errors');
await b.close();

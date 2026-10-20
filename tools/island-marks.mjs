// Stands a few steps from each guide target on the hill and screenshots its marker.
// usage: node island-marks.mjs <tag>
import { chromium } from 'playwright';
const tag = process.argv[2] || 'mk';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'island', started: true })); } });
await p.goto('http://localhost:5199/?debug&fast&d=' + (process.env.DIST || 7)); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
await p.waitForTimeout(7000);
for (let i = 0; i < 6; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(300); }
const ids = await p.evaluate(() => window.__guide.steps.filter((s) => s.pos).map((s) => s.id));
for (const id of ids) {
  const ok = await p.evaluate((id) => {
    const w = window.__game.current, s = window.__guide.step(id), v = window.__guide.posOf(s); if (!v) return false;
    
    const from = v.clone(); from.z += +(new URLSearchParams(location.search).get("d") || 7); const pl = w.player;
    pl.pos.set(from.x, w.opts.heightAt ? w.opts.heightAt(from.x, from.z) : v.y, from.z); pl.yaw = 0; pl.pitch = -0.05; return true;
  }, id);
  if (!ok) continue;
  await p.waitForTimeout(900);
  await p.screenshot({ path: `../test-shots/${tag}-${id}.png` });
}
console.log(ids.join(' '), errs.length ? errs : 'no errors');
await b.close();

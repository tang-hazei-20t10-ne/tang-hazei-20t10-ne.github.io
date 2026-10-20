// Screenshots the festival street from a few fixed viewpoints.
// usage: node village-shot.mjs <tag>   (env W, H)
import { chromium } from 'playwright';
const W = +(process.env.W || 1280), H = +(process.env.H || 720), tag = process.argv[2] || 'vil';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/GL Driver/.test(m.text()) && errs.push(m.text()));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'village', started: true })); } });
await p.goto('http://localhost:5199/?debug&fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
await p.waitForTimeout(6000);
await p.addStyleTag({ content: '#dialog,#debug,#hud,#prompt,#actions,.bubble,#note,#title{visibility:hidden!important}' });
const views = { start: [0, 7, 0, 0.05], left: [2, -12, 0.9, 0.12], right: [-2, -22, -0.9, 0.12], canal: [0, -27, 0, 0.1], far: [0, -60, 0, 0.08], stage: [-3, -72, -0.35, 0.15] };
for (const [k, [x, z, yaw, pitch]] of Object.entries(views)) {
  await p.evaluate(([x, z, yaw, pitch]) => { const pl = window.__game.current.player; pl.pos.set(x, 0, z); pl.yaw = yaw; pl.pitch = pitch; }, [x, z, yaw, pitch]);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `../test-shots/${tag}-${k}.png` });
}
console.log(errs.length ? errs : 'no errors');
await b.close();

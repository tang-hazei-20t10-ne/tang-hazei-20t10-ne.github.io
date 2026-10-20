// Rides the rowing boat on the hill's pond and screenshots the trip.
// usage: node boat-run.mjs <tag>   (env W, H)
import { chromium } from 'playwright';
const W = +(process.env.W || 1280), H = +(process.env.H || 720), tag = process.argv[2] || 'boat';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/GL Driver/.test(m.text()) && errs.push(m.text()));
await p.addInitScript(() => { if (!sessionStorage.getItem('i')) { sessionStorage.setItem('i', 1); localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: 'island', started: true })); } });
await p.goto('http://localhost:5199/?debug&fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
await p.waitForTimeout(7000);
for (let i = 0; i < 6; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(300); }
console.log(await p.evaluate(async () => {
  const m = await import('/src/three/mountain.js'); const wl = m.pondLevel(); const out = ['water ' + wl.toFixed(2)];
  for (const r of [4, 4.6, 5.2, 5.8, 6.3]) { let s = ''; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; s += (m.mountainHeight(20 + Math.cos(a) * r, 4 + Math.sin(a) * r) - wl).toFixed(1).padStart(6); } out.push('r' + r + s); }
  out.push('boat ' + (m.mountainHeight(15.6, 8.2) - wl).toFixed(2));
  return out.join('\n');
}));
console.log(await p.evaluate(() => { const { curve, depth } = window.__boatRoute; let worst = -9; const bad = []; for (let k = 0; k < 200; k++) { const q = curve.getPointAt(k / 200), tg = curve.getTangentAt(k / 200); for (const o of [-1.4, 0, 1.4]) for (const w of [-0.65, 0.65]) { const d = depth(q.x + tg.x * o - tg.z * w, q.z + tg.z * o + tg.x * w); if (d > -0.4) bad.push((k / 200).toFixed(3) + '@' + d.toFixed(2)); worst = Math.max(worst, d); } } return 'route length ' + curve.getLength().toFixed(1) + ', shallowest under the hull ' + worst.toFixed(2) + ' ' + [...new Set(bad)].slice(0, 30).join(' ')  + ' berth ' + curve.points[0].x.toFixed(1) + ',' + curve.points[0].z.toFixed(1); }));
await p.addStyleTag({ content: '#debug,#hud,.quest,#toasts{visibility:hidden!important}' });
// walk up to the boat, facing it
await p.evaluate(() => { const w = window.__game.current, bt = w.scene.getObjectByName?.('boat'); const pl = w.player; pl.pos.set(13.6, pl.pos.y, 10.6); pl.yaw = Math.atan2(-(15.6 - 13.6), -(8.2 - 10.6)); pl.pitch = -0.25; });
await p.waitForTimeout(1200); await p.screenshot({ path: `../test-shots/${tag}-0.png` });
await p.evaluate(() => { const w = window.__game.current; const it = [...w.interact.items].find((i) => i.pos === w.scene.userData.boatPos || /thuyền/i.test(i.label || '')); it.onDone(); });
await p.evaluate(() => { const w = window.__game.current, boat = [...w.interact.items].find((i) => /thuyền/i.test(i.label || '')).pos; const ducks = []; w.scene.traverse((o) => { if (o.isSprite && Math.abs(o.position.y - boat.y) < 0.2 && o !== boat) ducks.push(o); }); window.__duckMin = 9; const T = window.__game.current; const b = T.scene.children.find((o) => o.userData?.oars); T.every(() => { const inv = b.quaternion.clone().invert(); for (const d of ducks) { const l = d.position.clone().sub(b.position).applyQuaternion(inv); window.__duckMin = Math.min(window.__duckMin, Math.hypot(l.x / 2.4, l.z / 1.6)); } }); });
const t0 = Date.now();
for (const t of [0.4, 1.5, 3, 5, 8, 11, 14, 17, 20]) { await p.waitForTimeout(Math.max(0, t * 1000 - (Date.now() - t0))); await p.screenshot({ path: `../test-shots/${tag}-${t}.png` }); }
{ const t1 = Date.now(); while (Date.now() - t1 < 40000 && await p.evaluate(() => window.__game.current.locked)) await p.waitForTimeout(250); console.log('ride over after', ((Date.now() - t0) / 1000).toFixed(1) + 's real,', (await p.evaluate(() => window.__rideTime))?.toFixed(1) + 's game time, back on shore:', !(await p.evaluate(() => window.__game.current.locked))); await p.screenshot({ path: `../test-shots/${tag}-end.png` }); }
console.log('closest duck (1 = touching an oar tip or the bow)', await p.evaluate(() => window.__duckMin.toFixed(2)));
console.log(errs.length ? errs : 'no errors');
await b.close();

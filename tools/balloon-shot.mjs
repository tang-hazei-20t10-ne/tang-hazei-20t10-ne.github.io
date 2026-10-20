// The balloon basket and the hill telescope up close, then the balloon ride.
// usage: node balloon-shot.mjs <tag>
import { chromium } from 'playwright';
const tag = process.argv[2] || 'bal';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const errs = [];
const open = async (chapter) => {
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((ch) => { localStorage.setItem('hazei-journey-v1', JSON.stringify({ chapter: ch, started: true })); }, chapter);
  await p.goto('http://localhost:5199/?debug&fast'); await p.waitForSelector('#loading .btn'); await p.click('#loading .btn');
  await p.waitForTimeout(7000); for (let i = 0; i < 6; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(250); }
  await p.addStyleTag({ content: '#guide,#debug,.gmark,.garrow{visibility:hidden!important}' });
  return p;
};
const look = (p, obj, dx, dy, dz) => p.evaluate(([obj, dx, dy, dz]) => {
  const w = window.__game.current, o = window.__guide.step(obj).obj, v = o.getWorldPosition(o.position.clone());
  const pl = w.player; pl.pos.set(v.x + dx, v.y + dy - pl.eye + 1.5, v.z + dz); pl.yaw = Math.atan2(dx, dz); pl.pitch = -Math.atan2(dy + 0.3, Math.hypot(dx, dz));
}, [obj, dx, dy, dz]);
{
  const p = await open('island');
  await look(p, 'telescope', 1.6, 0.4, 1.4); await p.waitForTimeout(900); await p.screenshot({ path: `../test-shots/${tag}-tele.png` });
  await look(p, 'telescope', -1.2, 0.6, -1.8); await p.waitForTimeout(900); await p.screenshot({ path: `../test-shots/${tag}-tele2.png` });
  await look(p, 'balloon', 3.2, 1.2, 3.2); await p.waitForTimeout(900); await p.screenshot({ path: `../test-shots/${tag}-basket.png` });
  await p.close();
}
{
  const p = await open('balloon');
  for (const [k, yaw, pitch] of [['ride', null, null], ['down', null, -0.55], ['up', null, 0.9], ['side', 1.6, -0.2]]) {
    await p.evaluate(([yaw, pitch]) => { const pl = window.__game.current.player; if (yaw !== null) pl.yaw += yaw; if (pitch !== null) pl.pitch = pitch; }, [yaw, pitch]);
    await p.waitForTimeout(1500); await p.screenshot({ path: `../test-shots/${tag}-${k}.png` });
  }
  await p.close();
}
console.log(errs.length ? errs : 'no errors');
await b.close();

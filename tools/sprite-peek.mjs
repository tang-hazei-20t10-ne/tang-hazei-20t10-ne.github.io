// Renders a character sprite big for close inspection:
//   node tools/sprite-peek.mjs <look> [pose[:mood]...]   (a LOOKS entry)
//   node tools/sprite-peek.mjs chef5 [pose[:mood]...]    (the omakase chef)
import { chromium } from 'playwright';
const [,, look = 'chef5', ...poses] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 420 } });
await p.goto('http://localhost:5199/');
await p.evaluate(async ([look, poses]) => {
  const m = await import('/src/core/sprites.js');
  const draw = look === 'chef5' ? (await import('/src/chapters/c5_omakase.js')).chefSprite : null;
  document.body.innerHTML = ''; document.body.style.background = '#c8a070';
  for (const ps of poses.length ? poses : ['idle', 'give', 'hold']) {
    const [pose, mood = 'normal'] = ps.split(':');
    const s = draw ? draw(pose, 0, mood) : m.charSprite(m.LOOKS[look], { pose, mood }); const c = document.createElement('canvas');
    c.width = s.width * 10; c.height = s.height * 10; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, c.width, c.height);
    c.style.margin = '8px'; document.body.appendChild(c);
  }
}, [look, poses]);
await p.screenshot({ path: 'test-shots/sprite-peek.png' }); await b.close();

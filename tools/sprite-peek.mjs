// Renders a character sprite big for close inspection: node tools/sprite-peek.mjs <look> [poses...]
import { chromium } from 'playwright';
const [,, look = 'chef', ...poses] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 420 } });
await p.goto('http://localhost:5199/');
await p.evaluate(async ([look, poses]) => {
  const m = await import('/src/core/sprites.js');
  document.body.innerHTML = ''; document.body.style.background = '#c8a070';
  for (const ps of poses.length ? poses : ['idle', 'give', 'hold']) {
    const [pose, mood] = ps.split(':');
    const s = m.charSprite(m.LOOKS[look], { pose, mood }); const c = document.createElement('canvas');
    c.width = s.width * 10; c.height = s.height * 10; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, c.width, c.height);
    c.style.margin = '8px'; document.body.appendChild(c);
  }
}, [look, poses]);
await p.screenshot({ path: 'test-shots/sprite-peek.png' }); await b.close();

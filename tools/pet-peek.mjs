// Shows the hill's dog and cat sprites big.  usage: node pet-peek.mjs
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 760 } });
await p.goto('http://localhost:5199/');
await p.evaluate(async () => {
  const m = await import('/src/three/pets.js');
  document.body.innerHTML = ''; document.body.style.cssText = 'background:#7fb069;display:flex;flex-wrap:wrap;gap:16px;padding:12px;margin:0';
  const sp = [m.dogHD(0), m.dogHD(1), m.dogHD(2), m.dogHD(3), m.dogHD(0, 'happy'), m.dogHD(0, 'normal', 'sit'), m.dogHD(1, 'happy', 'sit'), m.catHD('sleep', 0), m.catHD('sleep', 1), m.catHD('happy', 0), m.catHD('happy', 1)];
  for (const s of sp) { const c = document.createElement('canvas'); c.width = s.width * 6; c.height = s.height * 6; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(s, 0, 0, c.width, c.height); document.body.appendChild(c); }
});
await p.screenshot({ path: '../test-shots/pets.png' });
await b.close();

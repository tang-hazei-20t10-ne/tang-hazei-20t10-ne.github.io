import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 480 } });
await p.goto('http://localhost:5199/?debug'); await p.waitForTimeout(1500);
await p.evaluate(async () => {
  const S = await import('/src/core/sprites.js');
  document.body.innerHTML = ''; document.body.style.background = '#2a2236';
  const L = S.LOOKS.hazei();
  const views = [{ pose: 'piano' }, { pose: 'piano', top: true }, { pose: 'piano', top: true, frame: 1 }, { pose: 'piano', back: true }, { pose: 'piano', mood: 'sing' }];
  for (const v of views) { const c = S.charSprite(L, v); const o = document.createElement('canvas'); o.width = c.width * 6; o.height = c.height * 6; const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); o.style.margin = '8px'; document.body.appendChild(o); }
  const P = S.LOOKS.partner(); for (const f of [0, 1]) { const c = S.charSprite(P, { pose: 'sitwave', frame: f, mood: 'happy' }); const o = document.createElement('canvas'); o.width = c.width * 6; o.height = c.height * 6; const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); o.style.margin = '8px'; document.body.appendChild(o); }
});
await p.screenshot({ path: 'test-shots/sprites.png' }); await b.close();

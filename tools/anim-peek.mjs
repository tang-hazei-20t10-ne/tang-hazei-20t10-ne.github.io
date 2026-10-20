// Contact sheet of one recipe's close-up: a row per step, columns at progress 0.05..0.95; last row the finished plate.
// node tools/anim-peek.mjs <kind> [cols]
import { chromium } from 'playwright';
const [,, kind, cols = '5'] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1700, height: 900 } });
await p.goto('http://localhost:5199/src/chapters/omakase_food.js');
await p.evaluate(async ([kind, cols]) => {
  const f = await import('/src/chapters/omakase_food.js');
  document.body.innerHTML = ''; document.body.style.cssText = 'background:#222;margin:0;display:grid;grid-template-columns:repeat(' + cols + ',auto);gap:4px;padding:4px;justify-content:start';
  const steps = f.RECIPES[kind];
  for (let i = 0; i <= steps.length; i++) for (let j = 0; j < cols; j++) {
    const t = cols == 1 ? 1 : 0.03 + j * 0.94 / (cols - 1);
    const c = document.createElement('canvas'); c.width = 320; c.height = 180;
    f.drawCloseup(c.getContext('2d'), 320, 180, kind, i, t, t * 1.3, i === steps.length);
    c.style.width = '320px'; c.style.height = '180px'; c.style.imageRendering = 'pixelated'; document.body.appendChild(c);
  }
}, [kind, +cols]);
await p.screenshot({ path: `../test-shots/anim-${kind}.png`, fullPage: true }); await b.close();

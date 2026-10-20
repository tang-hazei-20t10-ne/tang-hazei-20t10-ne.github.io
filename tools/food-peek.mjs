// Renders the omakase food for review: node tools/food-peek.mjs [dishes|<kind> [t]]
//   dishes      every plated dish, big, on one sheet
//   <kind> [t]  each close-up step of that recipe at progress t (default 0.6), then the finished plate
import { chromium } from 'playwright';
const [,, what = 'dishes', tt = '0.6'] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
await p.goto('http://localhost:5199/src/chapters/omakase_food.js'); // a plain page on the dev server (not the game)
await p.evaluate(async ([what, tt]) => {
  const f = await import('/src/chapters/omakase_food.js');
  document.body.innerHTML = ''; document.body.style.cssText = 'background:#3a2a2a;margin:0;display:flex;flex-wrap:wrap;gap:6px;padding:6px';
  const add = (c, scale) => { c.style.width = c.width * scale + 'px'; c.style.height = c.height * scale + 'px'; c.style.imageRendering = 'pixelated'; document.body.appendChild(c); };
  if (what === 'dishes') {
    for (const k of Object.keys(f.DISHES)) { const c = f.dishThumb(k, 120, 80); c.style.background = '#e9cc9e'; add(c, 2); }
    return;
  }
  const steps = f.RECIPES[what];
  for (let i = 0; i <= steps.length; i++) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 180;
    f.drawCloseup(c.getContext('2d'), 320, 180, what, i, +tt, 1.3, i === steps.length);
    add(c, 2);
  }
}, [what, tt]);
await p.screenshot({ path: `../test-shots/food-${what}.png`, fullPage: true }); await b.close();

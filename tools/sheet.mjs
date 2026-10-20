// Tiles screenshots into one sheet: node sheet.mjs out.png cols width a.png b.png ...
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [,, out, cols, w, ...files] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: cols * w + 20, height: 400 } });
const imgs = files.map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="width:${w}px;display:block"><div style="color:#ccc;font:11px sans-serif">${path.basename(f)}</div>`);
await p.setContent(`<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:4px">${imgs.map((i) => '<div>' + i + '</div>').join('')}</body>`);
await p.screenshot({ path: out, fullPage: true }); await b.close();

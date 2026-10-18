// node tools/grid.mjs out.png a.png b.png ... -> 2-column contact sheet
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const [, , out, ...files] = process.argv;
const imgs = files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 400 } });
await p.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#000}img{width:100%}</style>${imgs}`);
await p.screenshot({ path: out, fullPage: true }); await b.close();

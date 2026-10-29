// Quick captures for review: node scripts/capture.mjs <out-dir> <width>x<height> [query] [scrollY|full ...]
// Example: node scripts/capture.mjs qa-captures 1440x900 '?static' full
import { mkdirSync } from 'node:fs';
import { launch } from './browser.mjs';

const [out = 'qa-captures', size = '1440x900', query = '', ...stops] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const base = process.env.QA_BASE || 'http://localhost:4397/';
mkdirSync(out, { recursive: true });

const browser = await launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(base + query, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2300);
const tag = `${width}x${height}${query.replace(/[^a-z0-9]+/gi, '-')}`;
for (const stop of stops.length ? stops : ['0']) {
  if (stop === 'full') {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise(r => requestAnimationFrame(() => r())); }
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
    continue;
  }
  const y = stop.endsWith('vh') ? parseFloat(stop) / 100 * height : Number(stop);
  await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(250);
  await page.evaluate(() => Promise.all([...document.images].filter(i => i.getBoundingClientRect().bottom > 0 && i.getBoundingClientRect().top < innerHeight).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
  await page.waitForTimeout(80);
  await page.screenshot({ path: `${out}/${tag}-${stop}.png` });
}
console.log('done', tag, await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.body.scrollHeight })));
await browser.close();

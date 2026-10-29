// Side-by-side and blend of the page against the approved board, per scene.
//   QA_BASE=http://localhost:4397/ node scripts/board-compare.mjs [1440x900]
// Writes qa-captures/compare-<size>-{hero,scenes}.png and prints the mean
// difference of each pair (0 = identical, 255 = opposite).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.QA_BASE || 'http://localhost:4397/';
const [w, h] = (process.argv[2] || '1440x900').split('x').map(Number);
mkdirSync(join(ROOT, 'qa-captures'), { recursive: true });

const browser = await launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.goto(base + '?static', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  await document.fonts.ready;
  for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  scrollTo(0, 0);
  await Promise.all([...document.images].map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
});
const shot = (await page.screenshot({ fullPage: true })).toString('base64');
const board = readFileSync(join(ROOT, 'references/estudo-modelo2.jpg')).toString('base64');
const geo = await page.evaluate(() => {
  const s = getComputedStyle(document.querySelector('.hero-frame'));
  const f = document.querySelector('.hero-frame').getBoundingClientRect();
  const uh = parseFloat(s.width) / 891;
  const inside = document.querySelector('.inside');
  const u = parseFloat(getComputedStyle(inside.querySelector('.frame')).width) / 891;
  const frameLeft = inside.querySelector('.frame').getBoundingClientRect().left;
  return { uh, heroLeft: f.left, u, frameLeft, insideTop: inside.getBoundingClientRect().top + scrollY };
});

const out = await page.evaluate(async ({ shot, board, geo }) => {
  const load = async (b64, type) => createImageBitmap(await (await fetch(`data:${type};base64,${b64}`)).blob());
  const [S, B] = await Promise.all([load(shot, 'image/png'), load(board, 'image/jpeg')]);
  function pair(sx, sy, sw, sh, bx, by, bw, bh) {
    const c = new OffscreenCanvas(sw * 2 + 16, sh);
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(B, bx, by, bw, bh, 0, 0, sw, sh);
    x.drawImage(S, sx, sy, sw, sh, sw + 16, 0, sw, sh);
    const a = x.getImageData(0, 0, sw, sh).data;
    const b = x.getImageData(sw + 16, 0, sw, sh).data;
    let sum = 0; for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    return { canvas: c, diff: sum / (a.length / 4 * 3) };
  }
  const hero = pair(Math.round(geo.heroLeft), 0, Math.round(891 * geo.uh), Math.round(558 * geo.uh), 0, 0, 891, 558);
  const scenes = pair(Math.round(geo.frameLeft), Math.round(geo.insideTop), Math.round(891 * geo.u), Math.round((1765 - 558) * geo.u), 0, 558, 891, 1765 - 558);
  const url = async c => { const blob = await c.convertToBlob({ type: 'image/png' }); const r = new FileReader(); return new Promise(res => { r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(blob); }); };
  return { hero: { diff: hero.diff, png: await url(hero.canvas) }, scenes: { diff: scenes.diff, png: await url(scenes.canvas) } };
}, { shot, board, geo });

for (const k of ['hero', 'scenes']) {
  writeFileSync(join(ROOT, `qa-captures/compare-${w}x${h}-${k}.png`), Buffer.from(out[k].png, 'base64'));
  console.log(`${k.padEnd(7)} mean diff vs board: ${out[k].diff.toFixed(1)} / 255`);
}
await browser.close();

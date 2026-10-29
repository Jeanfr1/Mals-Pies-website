// Real captures of the production build for the README (.github/assets/).
//   npm run build && npm run preview   (port 4397)
//   node scripts/readme-assets.mjs && python3 scripts/readme-compose.py
// Frames and raw shots go to scripts/out/readme/; the composer frames them.
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'scripts/out/readme');
const base = process.env.QA_BASE || 'http://localhost:4397/';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'frames'), { recursive: true });
const browser = await launch();

async function settle(page) {
  await page.evaluate(() => document.querySelectorAll('[data-motion-toggle]').forEach(b => { b.textContent = 'Pause motion'; }));
  await page.waitForTimeout(350);
  await page.evaluate(() => Promise.all([...document.images].filter(i => {
    const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
  }).map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

// 1 · hero scroll GIF frames (motion on, no intro), 1440 x 900 ---------------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '?nointro', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const cadence = await page.evaluate(async () => {
    const t = []; let last = performance.now();
    for (let i = 0; i < 30; i++) { await new Promise(r => requestAnimationFrame(r)); const n = performance.now(); t.push(n - last); last = n; }
    t.sort((a, b) => a - b); return t[15];
  });
  console.log('rAF median', cadence.toFixed(1), 'ms');
  const end = await page.evaluate(() => document.querySelector('.range').offsetTop + document.querySelector('.range').offsetHeight * 0.55);
  const N = 64;
  for (let i = 0; i < N; i++) {
    const y = Math.round(end * (i / (N - 1)) ** 1.08);
    await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
    await settle(page);
    await page.screenshot({ path: join(OUT, 'frames', `f_${String(i).padStart(4, '0')}.png`) });
  }
  await page.close();
}

// 2 · desktop sections (static, the board as approved) -------------------------
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '?static', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const stops = await page.evaluate(() => {
    const top = s => document.querySelector(s).offsetTop;
    return { hero: 0, inside: top('.inside') - 40, range: top('.range') - 20, visit: document.body.scrollHeight - innerHeight };
  });
  for (const [name, y] of Object.entries(stops)) {
    await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
    await settle(page);
    await page.screenshot({ path: join(OUT, `desktop-${name}.png`) });
  }
  await page.close();
}

// 3 · phone screens (static), 390 x 844 @2x ----------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + '?static', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const stops = await page.evaluate(() => {
    const top = s => document.querySelector(s).offsetTop;
    return { hero: 0, range: top('.inside'), sweets: top('.sweets'), visit: document.body.scrollHeight - innerHeight };
  });
  for (const [name, y] of Object.entries(stops)) {
    await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
    await settle(page);
    await page.screenshot({ path: join(OUT, `mobile-${name}.png`) });
  }
  await ctx.close();
}

// 4 · banner rendered with the site's own fonts and images ----------------------
{
  const asset = f => 'data:' + (f.endsWith('.woff2') ? 'font/woff2' : 'image/webp') + ';base64,' + readFileSync(join(ROOT, 'src/assets', f)).toString('base64');
  const page = await browser.newPage({ viewport: { width: 1600, height: 520 } });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Anton;src:url(${asset('fonts/anton.woff2')})}
    @font-face{font-family:Barlow;font-weight:600;src:url(${asset('fonts/barlow-condensed-600.woff2')})}
    @font-face{font-family:Serif;font-weight:700;src:url(${asset('fonts/source-serif-4-bold.woff2')})}
    html,body{margin:0;width:1600px;height:520px;overflow:hidden}
    body{position:relative;background:#F1ECE5 url(${asset('img/paper-1400.webp')}) center/cover;font-family:Barlow}
    body::after{content:'';position:absolute;inset:0;background:rgba(255,247,237,.18)}
    .seal{position:absolute;left:76px;top:56px;width:112px;z-index:2}
    .label{position:absolute;left:210px;top:84px;font:600 22px Barlow;letter-spacing:.32em;text-transform:uppercase;color:#151311;z-index:2}
    .place{position:absolute;left:210px;top:120px;font:700 24px Serif;color:#151311;z-index:2}
    h1{position:absolute;left:74px;top:200px;margin:0;font:400 152px/1 Anton;color:#D81920;letter-spacing:-.005em;white-space:nowrap;scale:1.06 1;transform-origin:0 0;z-index:2}
    .pie{position:absolute;right:-40px;top:-10px;width:470px;rotate:-6deg;z-index:3;filter:drop-shadow(0 30px 40px rgba(60,30,10,.25))}
    .crumbs{position:absolute;right:360px;top:190px;width:120px;z-index:1}
    .bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:#D81920;z-index:4}
  </style></head><body>
    <img class="seal" src="${asset('img/seal-240.webp')}">
    <div class="label">Mal’s Pies &amp; Pastries</div>
    <div class="place">Oonoonba, Townsville</div>
    <h1>HOT. FLAKY. LOCAL.</h1>
    <img class="crumbs" src="${asset('img/crumbs.webp')}">
    <img class="pie" src="${asset('img/pie-1400.webp')}">
    <div class="bar"></div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, 'banner.png') });
  await page.close();
}

await browser.close();
console.log('captures in', OUT);

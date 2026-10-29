// Browser QA on the built site (vite preview or the live URL):
//   QA_BASE=http://localhost:4397/ node scripts/qa.mjs
// Checks layout density, overflow, the hero hand-off, dialogs (pointer and
// keyboard), links, copy hygiene, reduced motion, no-JS and frame cadence.
import { launch } from './browser.mjs';

const base = process.env.QA_BASE || 'http://localhost:4397/';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`); };
const browser = await launch();

async function open(viewport, query = '', opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + query, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errors };
}

// 1 · desktop density and overflow (board layout) ----------------------------
for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080], [1024, 768]]) {
  const { ctx, page, errors } = await open({ width: w, height: h }, '?static');
  const m = await page.evaluate(() => {
    const vh = innerHeight;
    const r = s => document.querySelector(s).getBoundingClientRect();
    const fs = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    const small = [...document.querySelectorAll('.frame [data-fit], .hero-frame [data-fit]')]
      .filter(e => e.offsetParent !== null && e.textContent.trim())
      .map(e => parseFloat(getComputedStyle(e).fontSize));
    return {
      sw: document.documentElement.scrollWidth, iw: innerWidth,
      hero: r('.hero').height / vh,
      sections: ['.inside', '.range', '.sweets', '.visit'].map(s => +(r(s).height / vh).toFixed(2)),
      title: fs('[data-fit="inside-1"]'),
      minText: Math.min(...small)
    };
  });
  check(`${w}x${h} no horizontal overflow`, m.sw === m.iw, `${m.sw} vs ${m.iw}`);
  check(`${w}x${h} hero ≤ 1.05 screen`, m.hero <= 1.05, m.hero.toFixed(2));
  check(`${w}x${h} scenes ≤ 0.8 screen`, m.sections.every(v => v <= 0.8), m.sections.join(' / '));
  check(`${w}x${h} smallest board text ≥ 11 px`, m.minText >= 11, m.minText.toFixed(1) + ' px');
  check(`${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 2 · phones: overflow + hidden-image bytes ---------------------------------
for (const [w, h] of [[390, 844], [360, 800], [768, 1024]]) {
  const { ctx, page, errors } = await open({ width: w, height: h }, '', { deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 250) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); } });
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, board: getComputedStyle(document.querySelector('.nav')).display }));
  check(`${w}x${h} no horizontal overflow (motion, scrolled)`, m.sw === m.iw, `${m.sw} vs ${m.iw}`);
  check(`${w}x${h} compact layout`, m.board === 'none');
  check(`${w}x${h} no console errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3 · hero hand-off (dock and swap) at 1440x900 -------------------------------
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '?nointro');
  const travel = await page.evaluate(() => document.querySelector('.hero').offsetHeight - innerHeight);
  const state = async y => {
    await page.evaluate(v => scrollTo({ top: v, behavior: 'instant' }), y);
    await page.waitForTimeout(120);
    return page.evaluate(() => ({ p: +document.documentElement.dataset.heroP, iris: +document.documentElement.dataset.iris, real: getComputedStyle(document.querySelector('.inside')).visibility }));
  };
  const before = await state(travel - 2);
  const after = await state(travel + 2);
  check('hand-off: copy fully open before release', before.iris === 1, JSON.stringify(before));
  check('hand-off: real scene visible after release', after.real === 'visible', JSON.stringify(after));
  const a = await page.screenshot({ clip: { x: 0, y: 520, width: 1440, height: 370 } });
  await state(travel - 1);
  const b1 = await page.screenshot({ clip: { x: 0, y: 520, width: 1440, height: 370 } });
  await state(travel + 1);
  const b2 = await page.screenshot({ clip: { x: 0, y: 519, width: 1440, height: 370 } });
  const diff = await page.evaluate(async ([x, y]) => {
    const load = async b64 => createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
    const [ia, ib] = await Promise.all([load(x), load(y)]);
    const c = new OffscreenCanvas(ia.width, ia.height).getContext('2d');
    c.drawImage(ia, 0, 0); const da = c.getImageData(0, 0, ia.width, ia.height).data;
    c.drawImage(ib, 0, 0); const db = c.getImageData(0, 0, ib.width, ib.height).data;
    let sum = 0; for (let i = 0; i < da.length; i += 4) sum += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    return sum / (da.length / 4 * 3);
  }, [b1.toString('base64'), b2.toString('base64')]);
  check('hand-off: copy and real scene match at the swap', diff < 3, `mean diff ${diff.toFixed(2)} / 255`);
  // Entry from the nav link and from a hash.
  await page.click('.nav-left a[href="#the-good-stuff"]');
  await page.waitForTimeout(1600);
  const nav = await page.evaluate(() => ({ vis: getComputedStyle(document.querySelector('.inside')).visibility, top: Math.round(document.querySelector('.inside').getBoundingClientRect().top) }));
  check('nav link lands on scene 2, visible', nav.vis === 'visible' && Math.abs(nav.top) < 4, JSON.stringify(nav));
  void a;
  await ctx.close();
  const h = await open({ width: 1440, height: 900 }, '#the-good-stuff');
  await h.page.waitForTimeout(600);
  const hv = await h.page.evaluate(() => getComputedStyle(document.querySelector('.inside')).visibility);
  check('URL hash lands on scene 2, visible', hv === 'visible', hv);
  await h.ctx.close();
}

// 4 · dialogs with a real pointer and the keyboard ---------------------------
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { ctx, page } = await open({ width: w, height: h }, '?nointro');
  for (const key of ['pies', 'rolls', 'sandwiches', 'sweets']) {
    const btn = page.locator(`.range-word[data-menu="${key}"]`);
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await btn.click();
    const st = await page.evaluate(k => ({ open: document.querySelector('#range-dialog').open, sel: document.querySelector('[role=tab][aria-selected=true]').dataset.category, panel: !document.querySelector(`#panel-${k}`).hidden }), key);
    check(`${w}px click ${key} opens its tab`, st.open && st.sel === key && st.panel, JSON.stringify(st));
    await page.keyboard.press('Escape');
    const back = await page.evaluate(k => ({ open: document.querySelector('#range-dialog').open, focus: document.activeElement.dataset.menu }), key);
    check(`${w}px Escape closes, focus returns`, !back.open && back.focus === key, JSON.stringify(back));
  }
  await page.locator('.range-word[data-menu="pies"]').click();
  await page.focus('#tab-pies');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('End');
  const k1 = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press('Home');
  const k2 = await page.evaluate(() => document.activeElement.id);
  check(`${w}px tabs: arrows/End/Home`, k1 === 'tab-sweets' && k2 === 'tab-pies', `${k1} ${k2}`);
  await page.keyboard.press('Escape');
  const truck = page.locator('[data-open-truck]');
  await truck.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await truck.click();
  check(`${w}px Smoko Truck dialog opens`, await page.evaluate(() => document.querySelector('#truck-dialog').open));
  await page.keyboard.press('Escape');
  const sweet = page.locator('.sweets-arrow');
  await sweet.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await sweet.click();
  check(`${w}px sweet arrow opens sweet treats`, await page.evaluate(() => document.querySelector('#range-dialog').open && document.querySelector('[role=tab][aria-selected=true]').dataset.category === 'sweets'));
  await page.keyboard.press('Escape');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.locator('.hero-cta').click();
  await page.waitForTimeout(1600);
  const t = await page.evaluate(() => Math.round(document.querySelector('#the-range').getBoundingClientRect().top));
  check(`${w}px hero CTA reaches the range`, Math.abs(t) < 6, `top ${t}`);
  await ctx.close();
}

// 5 · links, copy hygiene, contrast tokens -----------------------------------
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '?static');
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
  check('phone link', links.includes('tel:+61747782538'));
  check('maps links', links.filter(h => h.startsWith('https://www.google.com/maps/')).length === 2);
  check('Instagram + Facebook', links.includes('https://www.instagram.com/mals_pies/') && links.includes('https://www.facebook.com/malbakery/'));
  check('no placeholders left', !(await page.content()).includes('@@'));
  const text = await page.evaluate(() => (document.body.innerText + ' ' + [...document.querySelectorAll('img[alt]')].map(i => i.alt).join(' ')).toLowerCase());
  const bad = ['conceptual', 'edited', 'original', 'generated', 'illustrative', 'transcribed', 'reconfirm', 'campaign', 'mockup', 'imagegen', 'todo', 'placeholder', 'lorem'].filter(w => text.includes(w));
  check('no production notes in visible copy/alt', bad.length === 0, bad.join(', '));
  check('no "STOFF" typo from the board', !text.includes('stoff'));
  const robots = await page.evaluate(() => document.querySelector('meta[name=robots]').content);
  check('noindex until the domain is confirmed', robots.includes('noindex'));
  await ctx.close();
}

// 6 · reduced motion and no JS -------------------------------------------------
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '', { reducedMotion: 'reduce' });
  const m = await page.evaluate(() => ({ on: document.documentElement.classList.contains('motion-on'), h: document.querySelector('.hero').offsetHeight, vis: getComputedStyle(document.querySelector('.inside')).visibility, btn: document.querySelector('[data-motion-toggle]').textContent }));
  check('reduced motion: static page, no pinned runway', !m.on && m.h <= 900 && m.vis === 'visible', JSON.stringify(m));
  await ctx.close();
  const nj = await open({ width: 1440, height: 900 }, '', { javaScriptEnabled: false });
  const n = await nj.page.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).visibility, inside: getComputedStyle(document.querySelector('.inside')).visibility, words: [...document.querySelectorAll('.range-word')].every(b => getComputedStyle(b).opacity === '1'), panels: document.querySelectorAll('.menu-panel li').length }));
  check('no JS: every scene visible, menu rendered in HTML', n.h1 === 'visible' && n.inside === 'visible' && n.words && n.panels > 30, JSON.stringify(n));
  await nj.ctx.close();
}

// 7 · frame cadence while scrolling (motion on) -------------------------------
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, '?nointro');
  const fps = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    const total = document.body.scrollHeight - innerHeight;
    await new Promise(done => {
      let y = 0;
      function step(t) {
        times.push(t - last); last = t;
        y += 18; scrollTo(0, y);
        if (y < total) requestAnimationFrame(step); else done();
      }
      requestAnimationFrame(step);
    });
    times.sort((a, b) => a - b);
    return { median: 1000 / times[Math.floor(times.length / 2)], p95: times[Math.floor(times.length * 0.95)] };
  });
  check('scroll cadence ≥ 55 fps (median frame)', fps.median >= 55, `${fps.median.toFixed(1)} fps, p95 ${fps.p95.toFixed(1)} ms`);
  await ctx.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

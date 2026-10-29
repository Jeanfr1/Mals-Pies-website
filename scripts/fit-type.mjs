// Fit every board text to its measured ink box (estudo-modelo2.jpg, board px).
// The fonts are measured in Chromium (canvas ink metrics, kerning included), so
// the generated sizes, horizontal scales and tracking reproduce the approved
// board. Output: src/styles/board-type.css (board layout only).
// Run: node scripts/fit-type.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = {
  anton: { family: 'Anton', weight: 400, file: 'anton.woff2' },
  barlow: { family: 'Barlow Condensed', weight: 600, file: 'barlow-condensed-600.woff2' },
  serif: { family: 'Source Serif 4', weight: 700, file: 'source-serif-4-bold.woff2' }
};

// Section origins on the board (y of each scene's top edge).
const Y = { hero: 0, inside: 558, range: 846, sweets: 1155, visit: 1420 };

// box: [x0, capTop, x1, baseline] in board px. mode: 'scale' (horizontal scale)
// or 'track' (letter-spacing). lead: [iconWidth, gap] before the text.
// lines: extra lines under the first (multi-line labels), pitch in board px.
const ITEMS = [
  // 1 · hero (units: --uh)
  { id: 'nav-l1', s: 'hero', font: 'barlow', text: 'THE BAKERY', box: [92, 48, 167, 56], mode: 'track' },
  { id: 'nav-l2', s: 'hero', font: 'barlow', text: 'THE GOOD STUFF', box: [206, 48, 309, 56], mode: 'track' },
  { id: 'nav-r1', s: 'hero', font: 'barlow', text: 'SMOKO TRUCK', box: [595, 48, 677, 56], mode: 'track' },
  { id: 'nav-r2', s: 'hero', font: 'barlow', text: 'FIND US', box: [721, 48, 766, 56], mode: 'track' },
  { id: 'title-1', s: 'hero', font: 'anton', text: 'HOT.', box: [37, 87, 311, 216], mode: 'scale' },
  { id: 'title-2', s: 'hero', font: 'anton', text: 'FLAKY.', box: [38, 225, 369, 333], mode: 'scale' },
  { id: 'title-3', s: 'hero', font: 'anton', text: 'LOCAL.', box: [38, 339, 430, 457], mode: 'scale' },
  { id: 'sub-1', s: 'hero', font: 'serif', text: 'Mal’s Pies & Pastries', box: [37, 467, 207, 481], mode: 'scale' },
  { id: 'sub-2', s: 'hero', font: 'serif', text: 'Baked in Townsville.', box: [37, 488, 206, 502], mode: 'scale', capFrom: 'sub-1' },
  { id: 'cta-row', s: 'hero', font: 'barlow', text: 'FIND YOUR FAVOURITE', box: [38, 519, 178, 530], mode: 'track' },
  { id: 'callout-flaky', s: 'hero', font: 'barlow', text: 'FLAKY PASTRY', box: [743, 115, 823, 126], mode: 'track' },
  { id: 'callout-steak', s: 'hero', font: 'barlow', text: 'STEAK PIE', box: [399, 410, 460, 422], mode: 'track' },
  // 2 · the inside story (units: --u)
  { id: 'inside-1', s: 'inside', font: 'anton', text: 'THE INSIDE', box: [36, 578, 352, 665], mode: 'scale' },
  { id: 'inside-2', s: 'inside', font: 'anton', text: 'STORY.', box: [40, 671, 245, 758], mode: 'scale' },
  { id: 'caption', s: 'inside', font: 'serif', text: 'Pies. Sausage rolls. Everyday favourites.', box: [619, 814, 866, 824], mode: 'scale' },
  // 3 · the range
  { id: 'eyebrow', s: 'range', font: 'barlow', text: 'THE DAILY LINE-UP.', box: [39, 867, 217, 875], mode: 'track' },
  { id: 'explore', s: 'range', font: 'barlow', text: 'EXPLORE THE RANGE', box: [37, 1121, 153, 1131], mode: 'track' },
  { id: 'note-pies', s: 'range', font: 'barlow', text: 'FAVOURITES', box: [214, 903, 293, 915], mode: 'track', lead: [13, 7], pitch: 15 },
  { id: 'note-rolls', s: 'range', font: 'barlow', text: 'SAUSAGE', box: [333, 957, 381, 969], mode: 'track', lead: [13, 7], pitch: 15 },
  { id: 'note-sandwiches', s: 'range', font: 'barlow', text: '& HEARTY', box: [506, 1009, 562, 1021], mode: 'track', lead: [13, 7], pitch: 15.5 },
  { id: 'note-sweets', s: 'range', font: 'barlow', text: 'GOODIES', box: [603, 1114, 651, 1126], mode: 'track', lead: [13, 7], pitch: 15.5 },
  // Category words: rotated about the left end of their baseline.
  { id: 'word-pies', s: 'range', font: 'anton', text: 'PIES', rot: { x: 40, y: 965, x1: 185, cap: 66, angle: -8 } },
  { id: 'word-rolls', s: 'range', font: 'anton', text: 'ROLLS', rot: { x: 99, y: 1038, x1: 299, cap: 70, angle: -8 } },
  { id: 'word-sandwiches', s: 'range', font: 'anton', text: 'SANDWICHES', rot: { x: 178, y: 1094, x1: 478, cap: 67, angle: -8 } },
  { id: 'word-sweets', s: 'range', font: 'anton', text: 'SWEET TREATS', rot: { x: 281, y: 1148, x1: 595, cap: 61, angle: -7 } },
  // 4 · sweet
  { id: 'sweet', s: 'sweets', font: 'anton', text: 'SWEET.', box: [36, 1171, 434, 1317], mode: 'scale' },
  { id: 'sweet-1', s: 'sweets', font: 'serif', text: 'Worth making', box: [43, 1333, 301, 1366], mode: 'scale' },
  { id: 'sweet-2', s: 'sweets', font: 'serif', text: 'room for.', box: [43, 1367, 199, 1400], mode: 'scale', capFrom: 'sweet-1' },
  // 5 · find us
  { id: 'visit-1', s: 'visit', font: 'anton', text: 'YOUR LOCAL', box: [39, 1622, 207, 1657], mode: 'scale' },
  { id: 'visit-2', s: 'visit', font: 'anton', text: 'GOOD STUFF.', box: [40, 1661, 212, 1696], mode: 'scale' },
  { id: 'visit-3', s: 'visit', font: 'anton', text: 'ON THE ROAD.', box: [741, 1666, 867, 1693], mode: 'scale' },
  { id: 'foot-address-row', s: 'visit', font: 'barlow', text: '56 Abbott Street, Oonoonba, Townsville', box: [58, 1724, 236, 1735], mode: 'track', lead: [11, 10] },
  { id: 'foot-phone-row', s: 'visit', font: 'barlow', text: '(07) 4778 2538', box: [279, 1724, 344, 1735], mode: 'track', lead: [9, 11] },
  { id: 'foot-directions', s: 'visit', font: 'barlow', text: 'GET DIRECTIONS', box: [366, 1724, 442, 1734], mode: 'track' },
  { id: 'foot-truck', s: 'visit', font: 'barlow', text: 'ASK ABOUT THE SMOKO TRUCK', box: [680, 1724, 821, 1734], mode: 'track' }
];

const r = n => Math.round(n * 100) / 100;

async function main() {
  const browser = await launch();
  const page = await browser.newPage();
  const faces = Object.values(FONTS).map(f => {
    const b64 = readFileSync(join(ROOT, 'src/assets/fonts', f.file)).toString('base64');
    return `@font-face{font-family:'${f.family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${f.weight}}`;
  }).join('');
  await page.setContent(`<style>${faces}</style><div id="probe"></div>`);
  await page.evaluate(async fonts => {
    await Promise.all(Object.values(fonts).map(f => document.fonts.load(`${f.weight} 100px '${f.family}'`)));
  }, FONTS);

  // Per font: baseline position in a line-height:1 box, cap ratio.
  const metrics = await page.evaluate(fonts => {
    const out = {};
    for (const [key, f] of Object.entries(fonts)) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;top:0;left:0;font:${f.weight} 1000px/1 '${f.family}';white-space:nowrap`;
      d.innerHTML = 'H<span style="display:inline-block;width:0;height:0"></span>';
      document.body.appendChild(d);
      const base = d.querySelector('span').getBoundingClientRect().bottom - d.getBoundingClientRect().top;
      d.remove();
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${f.weight} 1000px '${f.family}'`;
      const cap = ctx.measureText('H').actualBoundingBoxAscent;
      out[key] = { base: base / 1000, cap: cap / 1000 };
    }
    return out;
  }, FONTS);

  const measure = (font, text, size, spacing = 0) => page.evaluate(({ f, text, size, spacing }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${f.weight} ${size}px '${f.family}'`;
    ctx.letterSpacing = `${spacing}px`;
    const m = ctx.measureText(text);
    return { left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight };
  }, { f: FONTS[font], text, size, spacing });

  const fitted = {};
  const rules = [];
  for (const it of ITEMS) {
    const k = it.s === 'hero' ? '--uh' : '--u';
    const oy = Y[it.s];
    const fm = metrics[it.font];
    if (it.rot) {
      const { x, y, x1, cap, angle } = it.rot;
      const F = cap / fm.cap;
      const m = await measure(it.font, it.text, 1000);
      const ink = (m.left + m.right) * F / 1000;
      const along = (x1 - x) / Math.cos(angle * Math.PI / 180);
      const sx = along / ink;
      const left = x + m.left * F / 1000 * sx;
      const top = y - oy - fm.base * F;
      fitted[it.id] = { F, sx };
      rules.push(`[data-fit="${it.id}"]{left:calc(${r(left)} * var(${k}));top:calc(${r(top)} * var(${k}));font-size:calc(${r(F)} * var(${k}));scale:${r(sx * 1000) / 1000} 1;rotate:${angle}deg;transform-origin:0 ${r(fm.base)}em}`);
      continue;
    }
    const [x0, capTop, x1, baseline] = it.box;
    const capPx = it.capFrom ? fitted[it.capFrom].cap : baseline - capTop;
    const F = capPx / fm.cap;
    const target = x1 - x0;
    let decl = '';
    let left;
    if (it.mode === 'scale') {
      const m = await measure(it.font, it.text, F);
      const sx = target / (m.left + m.right);
      left = x0 + m.left * sx;
      decl = `scale:${r(sx * 1000) / 1000} 1`;
      fitted[it.id] = { F, cap: capPx, sx };
    } else {
      const m0 = await measure(it.font, it.text, F);
      const n = [...it.text].length;
      let ls = (target - (m0.left + m0.right)) / (n - 1);
      const m1 = await measure(it.font, it.text, F, ls);
      ls += (target - (m1.left + m1.right)) / (n - 1);
      left = x0 + m0.left;
      decl = `letter-spacing:calc(${r(ls)} * var(${k}))`;
      fitted[it.id] = { F, cap: capPx, ls };
    }
    if (it.lead) left -= it.lead[0] + it.lead[1];
    const top = baseline - oy - fm.base * F;
    const extra = it.pitch ? `;line-height:${r(it.pitch / F * 1000) / 1000}` : '';
    const lead = it.lead ? `;--lead-w:${r(it.lead[0] / F * 1000) / 1000}em;--lead-gap:${r(it.lead[1] / F * 1000) / 1000}em` : '';
    rules.push(`[data-fit="${it.id}"]{left:calc(${r(left)} * var(${k}));top:calc(${r(top)} * var(${k}));font-size:calc(${r(F)} * var(${k}));${decl}${extra}${lead}}`);
  }
  await browser.close();

  const css = `/* Generated by scripts/fit-type.mjs from the approved board. Do not edit by hand. */
@media (min-width: 1000px) and (min-aspect-ratio: 5/4) {
${rules.map(x => '  ' + x).join('\n')}
}
`;
  writeFileSync(join(ROOT, 'src/styles/board-type.css'), css);
  writeFileSync(join(ROOT, 'scripts/out/fit.json'), JSON.stringify({ metrics, fitted }, null, 1));
  console.log('metrics', metrics);
  for (const [id, v] of Object.entries(fitted)) console.log(id.padEnd(18), Object.entries(v).map(([a, b]) => `${a}=${r(b)}`).join(' '));
}

main().catch(e => { console.error(e); process.exit(1); });

// Scroll-driven scenes. One rAF render per scroll/resize event, transforms and
// clip-paths only, every value derived from the current scroll position (so the
// page scrubs both ways and lands in the same state from a link or a reload).
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const board = matchMedia('(min-width: 1000px) and (min-aspect-ratio: 5/4)');
const fine = matchMedia('(pointer: fine)');
const connection = navigator.connection;
const params = new URLSearchParams(location.search);
const STORE = 'mals.motion.paused';

const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const ease = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);
const span = (t, a, b) => clamp((t - a) / (b - a));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const el = {
  hero: $('.hero'), stage: $('.hero-stage'), food: $('.food-move'), foodImg: $('.food-move img'),
  lines: $$('.hero-line'), copy: $('.hero-copy'), callouts: $$('.callout'),
  inside: $('.inside'), insidePhoto: $('.inside > .inside-photo'),
  ghost: $('.inside-ghost'), ghostPhoto: $('.inside-ghost .inside-photo'), ghostLines: $$('.inside-ghost .line-in'), ghostCaption: $('.inside-ghost .inside-caption'),
  range: $('.range'), seal: $('.range-seal'), eyebrow: $('.range-eyebrow'), words: $$('.range-word .word-in'),
  notes: $$('.range-note'), explore: $('.range-explore'),
  sweets: $('.sweets'), sweetsPhoto: $('.sweets-photo'), sweetsImg: $('.sweets-photo img'), letters: $$('.sweets-title span'),
  sweetsLines: $$('.sweets-line'), sweetsArrow: $('.sweets-arrow'),
  visit: $('.visit'), shop: $('.visit-shop'), shopImg: $('.visit-shop img'), truck: $('.visit-truck'), truckImg: $('.visit-truck img'),
  seam: $('.visit-seam'), visitLines: $$('.visit-title .line-in'), contacts: $$('.contact-frame > *:not(.contact-divider)')
};
const touched = new Set();
const set = (node, prop, value) => { if (!node) return; touched.add(node); node.style[prop] = value; };

let paused = false;
try { paused = localStorage.getItem(STORE) === '1'; } catch (_) { /* storage is optional */ }
let on = false;
let frame = 0;
let introTimer = 0;
const pointer = { x: 0, y: 0 };

// Entry progress: 0 when the scene's top reaches the bottom of the screen,
// 1 once 85 % of it (or of the screen, for tall scenes) is in view.
function entry(rect, vh) {
  return clamp((vh - rect.top) / (0.85 * Math.min(vh, rect.height)));
}

function renderHero(vh, vw) {
  const travel = Math.max(1, el.hero.offsetHeight - el.stage.offsetHeight);
  const top = el.hero.getBoundingClientRect().top;
  const p = clamp(-top / travel);
  html.dataset.heroP = p.toFixed(3);
  if (p > 0.03) finishIntro();

  const unit = vh / 900;
  const push = ease(p);
  const px = fine.matches && board.matches ? pointer.x * 9 : 0;
  const py = fine.matches && board.matches ? pointer.y * 6 : 0;
  // Phones: the camera also tilts down so the crust stays above the docked scene.
  const lift = board.matches ? 28 * unit * push : -0.24 * vh * push;
  set(el.food, 'transform', `translate(${(-px).toFixed(1)}px, ${(lift - py).toFixed(1)}px) rotate(${(-1.4 * push).toFixed(3)}deg) scale(${(1 + 0.23 * push).toFixed(4)})`);

  el.lines.forEach((line, i) => {
    const e = smooth(span(p, 0.1 + i * 0.05, 0.42 + i * 0.05));
    set(line, 'transform', `translateY(${(-(50 + i * 22) * e).toFixed(1)}%)`);
    set(line, 'opacity', (1 - e).toFixed(3));
  });
  const fade = smooth(span(p, 0.04, 0.24));
  set(el.copy, 'opacity', (1 - fade).toFixed(3));
  set(el.copy, 'transform', `translateY(${(-24 * unit * fade).toFixed(1)}px)`);
  el.copy.inert = fade > 0.9;
  el.callouts.forEach(c => set(c, 'opacity', (1 - smooth(span(p, 0, 0.16))).toFixed(3)));

  // Iris: a copy of scene 2 docked in the pinned stage opens from the pie's
  // filling; the real scene rises into the same slot and takes over there.
  const g = el.ghost.getBoundingClientRect();
  const f = el.foodImg.getBoundingClientRect();
  const fx = f.left + f.width * 0.354 - g.left;
  const fy = clamp(f.top + f.height * 0.463 - g.top, g.height * 0.12, g.height * 0.6);
  const far = Math.max(Math.hypot(fx, fy), Math.hypot(g.width - fx, fy), Math.hypot(fx, g.height - fy), Math.hypot(g.width - fx, g.height - fy));
  const iris = ease(span(p, 0.26, 0.7));
  html.dataset.iris = iris.toFixed(3);
  set(el.ghost, 'clipPath', iris >= 1 ? 'none' : `circle(${(iris * far * 1.02).toFixed(1)}px at ${fx.toFixed(1)}px ${fy.toFixed(1)}px)`);
  set(el.ghostPhoto, 'transform', `scale(${(1.24 - 0.24 * ease(span(p, 0.26, 0.84))).toFixed(4)})`);
  el.ghostLines.forEach((line, i) => {
    const e = ease(span(p, 0.58 + i * 0.07, 0.86 + i * 0.07));
    set(line, 'transform', `translateY(${((1 - e) * 106).toFixed(1)}%)`);
  });
  const c = ease(span(p, 0.76, 0.98));
  set(el.ghostCaption, 'opacity', c.toFixed(3));
  set(el.ghostCaption, 'transform', `translateX(${((1 - c) * 28 * unit).toFixed(1)}px)`);

  const r = el.inside.getBoundingClientRect();
  const docked = r.top <= vh - r.height + 0.5;
  set(el.inside, 'visibility', docked ? 'visible' : 'hidden');
  const after = Math.max(0, (vh - r.height) - r.top);
  set(el.insidePhoto, 'transform', `translateY(${Math.min(after * 0.07, r.height * 0.08).toFixed(1)}px)`);
}

function renderRange(vh) {
  const r = el.range.getBoundingClientRect();
  if (r.top > vh + 50 || r.bottom < -50) return;
  const e = entry(r, vh);
  const drift = clamp((vh - r.top) / (vh + r.height));
  const s = ease(span(e, 0, 0.7));
  set(el.seal, 'transform', `rotate(${(-38 * (1 - s) + 10 * drift).toFixed(2)}deg) scale(${(0.8 + 0.2 * s).toFixed(4)})`);
  set(el.seal, 'opacity', s.toFixed(3));
  const ey = ease(span(e, 0.02, 0.3));
  set(el.eyebrow, 'opacity', ey.toFixed(3));
  set(el.eyebrow, 'transform', `translateY(${((1 - ey) * 12).toFixed(1)}px)`);
  el.words.forEach((w, i) => {
    const t = ease(span(e, 0.1 + i * 0.1, 0.48 + i * 0.1));
    set(w, 'transform', `translateX(${((t - 1) * 104).toFixed(2)}%)`);
  });
  el.notes.forEach((n, i) => {
    const t = ease(span(e, 0.32 + i * 0.1, 0.62 + i * 0.1));
    set(n, 'opacity', t.toFixed(3));
    set(n, 'transform', `translateX(${((t - 1) * 14).toFixed(1)}px)`);
  });
  const x = ease(span(e, 0.66, 0.96));
  set(el.explore, 'opacity', x.toFixed(3));
  set(el.explore, 'transform', `translateY(${((1 - x) * 10).toFixed(1)}px)`);
}

function renderSweets(vh) {
  const r = el.sweets.getBoundingClientRect();
  if (r.top > vh + 50 || r.bottom < -50) return;
  const e = entry(r, vh);
  const open = ease(span(e, 0, 0.55));
  set(el.sweetsPhoto, 'clipPath', `inset(${(24 * (1 - open)).toFixed(2)}% 0 ${(24 * (1 - open)).toFixed(2)}% 0)`);
  const drift = clamp((vh - r.top) / (vh + r.height));
  set(el.sweetsImg, 'transform', `translateY(${((drift - 0.5) * -4).toFixed(2)}%) scale(${(1.2 - 0.2 * open).toFixed(4)})`);
  el.letters.forEach((l, i) => {
    const t = ease(span(e, 0.16 + i * 0.06, 0.44 + i * 0.06));
    set(l, 'transform', `translateY(${((1 - t) * -46).toFixed(1)}%) scale(${(1 + 0.32 * (1 - t)).toFixed(3)})`);
    set(l, 'opacity', t.toFixed(3));
  });
  el.sweetsLines.forEach((l, i) => {
    const t = ease(span(e, 0.5 + i * 0.1, 0.8 + i * 0.1));
    set(l, 'opacity', t.toFixed(3));
    set(l, 'translate', `0 ${((1 - t) * 0.35).toFixed(3)}em`);
  });
  const a = ease(span(e, 0.74, 1));
  set(el.sweetsArrow, 'opacity', a.toFixed(3));
  set(el.sweetsArrow, 'transform', `translateX(${((a - 1) * 18).toFixed(1)}px)`);
}

function renderVisit(vh) {
  const r = el.visit.getBoundingClientRect();
  if (r.top > vh + 50 || r.bottom < -50) return;
  const e = entry(r, vh);
  const a = ease(span(e, 0, 0.55));
  const b = ease(span(e, 0.12, 0.7));
  const stacked = !board.matches;
  if (stacked) {
    set(el.shop, 'clipPath', `inset(0 ${((1 - a) * 100).toFixed(2)}% 0 0)`);
    const tr = el.truck.getBoundingClientRect();
    const tb = ease(clamp((vh - tr.top) / (0.7 * Math.min(vh, tr.height))));
    set(el.truck, 'clipPath', `inset(0 0 0 ${((1 - tb) * 100).toFixed(2)}%)`);
    set(el.truckImg, 'transform', `translateX(${((1 - tb) * 22).toFixed(2)}%)`);
  } else {
    set(el.shop, 'clipPath', `inset(0 ${((1 - a) * 100).toFixed(2)}% 0 0)`);
    set(el.truck, 'clipPath', `inset(0 0 0 ${((1 - b) * 100).toFixed(2)}%)`);
    set(el.truckImg, 'transform', `translateX(${((1 - b) * 24).toFixed(2)}%)`);
  }
  set(el.shopImg, 'transform', `translateX(${((a - 1) * 6).toFixed(2)}%) scale(${(1.08 - 0.08 * a).toFixed(4)})`);
  set(el.seam, 'transform', `scaleY(${ease(span(e, 0.3, 0.7)).toFixed(4)})`);
  el.visitLines.forEach((l, i) => {
    const t = ease(span(e, 0.36 + i * 0.08, 0.7 + i * 0.08));
    set(l, 'transform', `translateY(${((1 - t) * 106).toFixed(1)}%)`);
  });
  el.contacts.forEach((c, i) => {
    const t = ease(span(e, 0.5 + i * 0.06, 0.82 + i * 0.06));
    set(c, 'opacity', t.toFixed(3));
    set(c, 'translate', `0 ${((1 - t) * 10).toFixed(1)}px`);
  });
}

function render() {
  frame = 0;
  if (!on || document.hidden) return;
  const vh = innerHeight;
  const vw = document.documentElement.clientWidth;
  renderHero(vh, vw);
  renderRange(vh);
  renderSweets(vh);
  renderVisit(vh);
}
function schedule() { if (on && !frame) frame = requestAnimationFrame(render); }

function finishIntro() {
  clearTimeout(introTimer);
  html.classList.remove('is-entering');
}
function startIntro() {
  if (!on || scrollY > 40 || document.hidden || params.has('nointro')) return;
  html.classList.add('is-entering');
  introTimer = setTimeout(finishIntro, 2050);
}

function allowed() {
  return !paused && !reduce.matches && !(connection && connection.saveData) && !params.has('static');
}

function apply() {
  const next = allowed();
  // Keep the scene at the centre of the screen in place while the layout changes.
  const probe = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
  const anchor = probe && probe.closest('section, footer');
  const before = anchor ? anchor.getBoundingClientRect().top : 0;
  on = next;
  html.classList.toggle('motion-on', on);
  html.classList.toggle('motion-paused', !on);
  if (!on) {
    finishIntro();
    touched.forEach(node => node.removeAttribute('style'));
    touched.clear();
    if (el.copy) el.copy.inert = false;
  }
  if (anchor && anchor !== el.hero) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
  updateToggles();
  render();
}

function updateToggles() {
  const locked = reduce.matches || Boolean(connection && connection.saveData);
  $$('[data-motion-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(!on));
    button.textContent = locked ? 'Motion reduced' : on ? 'Pause motion' : 'Resume motion';
    button.disabled = locked;
  });
}

export function initMotion() {
  $$('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    paused = on;
    try { localStorage.setItem(STORE, paused ? '1' : '0'); } catch (_) { /* optional */ }
    apply();
  }));
  reduce.addEventListener('change', apply);
  board.addEventListener('change', () => { render(); });
  if (connection && connection.addEventListener) connection.addEventListener('change', apply);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishIntro(); else schedule(); });
  el.stage.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse') return;
    const r = el.stage.getBoundingClientRect();
    pointer.x = (ev.clientX - r.left) / r.width * 2 - 1;
    pointer.y = (ev.clientY - r.top) / r.height * 2 - 1;
    schedule();
  }, { passive: true });
  el.stage.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; schedule(); }, { passive: true });

  apply();
  if (on && scrollY < 40) {
    const img = el.foodImg;
    Promise.all([
      document.fonts ? document.fonts.ready : null,
      img && img.decode ? img.decode().catch(() => {}) : null
    ]).then(startIntro);
  }
}

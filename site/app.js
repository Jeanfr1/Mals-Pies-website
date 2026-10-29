(() => {
  'use strict';
  const html = document.documentElement;
  html.classList.add('js');
  const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 700px)');
  const connection = navigator.connection;
  const stage = document.querySelector('.hero-stage');
  const runway = document.querySelector('.hero-runway');
  const range = document.querySelector('.line-up');
  const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
  let preference = false;
  try { preference = localStorage.getItem('mals-motion-off') === 'true'; } catch (_) { /* Storage is optional. */ }
  let off = false;
  let frame = 0;
  let introTimer = 0;
  let heroVisible = true;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = t => t * t * (3 - 2 * t);

  function finishIntro() {
    clearTimeout(introTimer);
    stage.classList.remove('is-entering');
  }
  function startIntro() {
    if (off || !heroVisible || document.hidden || window.scrollY > 80) return;
    finishIntro();
    void stage.offsetWidth;
    stage.classList.add('is-entering');
    introTimer = window.setTimeout(finishIntro, 2050);
  }
  function updateMotion() {
    const nextOff = preference || systemReduced.matches || Boolean(connection && connection.saveData);
    const reference = document.elementFromPoint(Math.round(window.innerWidth / 2), Math.round(window.innerHeight / 2));
    const section = reference && reference.closest('[data-scene]');
    const before = section && section !== runway ? section.getBoundingClientRect().top : null;
    off = nextOff;
    html.classList.toggle('motion-off', off);
    if (off) {
      finishIntro();
      stage.querySelector('.site-header').inert = false;
      stage.querySelector('.hero-copy').inert = false;
      html.style.setProperty('--hero-progress', '0');
      html.style.setProperty('--hero-exit', '0');
      html.style.setProperty('--handoff', '0');
      html.style.setProperty('--lineup-shift', '0px');
      html.style.setProperty('--pointer-x', '0');
      html.style.setProperty('--pointer-y', '0');
      document.querySelectorAll('.scene-photo').forEach(img => img.style.removeProperty('transform'));
    }
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(off));
      const systemLock = systemReduced.matches || Boolean(connection && connection.saveData);
      button.textContent = off ? (systemLock ? 'Reduced motion' : 'Resume motion') : 'Pause motion';
      button.disabled = Boolean(systemLock);
      if (systemLock) button.title = 'Motion is reduced to match your device preference.';
      else button.removeAttribute('title');
    });
    if (before !== null) {
      const after = section.getBoundingClientRect().top;
      window.scrollBy({ top: after - before, behavior: 'instant' });
    }
    schedule();
  }
  function render() {
    frame = 0;
    if (off || document.hidden) return;
    const view = window.innerHeight;
    const rect = runway.getBoundingClientRect();
    const travel = Math.max(1, runway.offsetHeight - stage.offsetHeight);
    const p = clamp(-rect.top / travel);
    stage.querySelector('.site-header').inert = p > .79;
    stage.querySelector('.hero-copy').inert = p > .79;
    html.style.setProperty('--hero-progress', p.toFixed(4));
    html.style.setProperty('--hero-exit', ease(clamp((p - .38) / .44)).toFixed(4));
    html.style.setProperty('--handoff', ease(clamp((p - .72) / .28)).toFixed(4));
    if (p > .04) finishIntro();
    document.querySelectorAll('.photographic-scene .scene-photo').forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.top >= view + 60 || r.bottom <= -60) return;
      const centre = (r.top + r.height / 2 - view / 2) / Math.max(view, r.height);
      img.style.transform = `translateY(${(clamp(centre, -.8, .8) * (narrow.matches ? 10 : 22)).toFixed(2)}px) scale(1.035)`;
    });
    const rr = range.getBoundingClientRect();
    html.style.setProperty('--lineup-shift', `${(clamp(rr.top / view, -.4, 1) * (narrow.matches ? 8 : 16)).toFixed(2)}px`);
  }
  function schedule() { if (!frame && !off && !document.hidden) frame = requestAnimationFrame(render); }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    preference = !off;
    try { localStorage.setItem('mals-motion-off', String(preference)); } catch (_) { /* No persistence required. */ }
    updateMotion();
  }));
  document.getElementById('replay-intro').addEventListener('click', startIntro);
  systemReduced.addEventListener('change', updateMotion);
  if (connection && connection.addEventListener) connection.addEventListener('change', updateMotion);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishIntro();
    else schedule();
  });

  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      if (!heroVisible) finishIntro();
    });
    heroObserver.observe(runway);
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('is-waiting');
      entry.target.classList.add('is-visible');
      reveals.unobserve(entry.target);
    }), { threshold: .1, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > window.innerHeight && !off) el.classList.add('is-waiting');
      reveals.observe(el);
    });
  }
  stage.addEventListener('pointermove', event => {
    if (off || narrow.matches || event.pointerType !== 'mouse') return;
    const rect = stage.getBoundingClientRect();
    html.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 2 - 1).toFixed(3));
    html.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 2 - 1).toFixed(3));
  }, { passive: true });
  stage.addEventListener('pointerleave', () => {
    html.style.setProperty('--pointer-x', '0');
    html.style.setProperty('--pointer-y', '0');
  }, { passive: true });
  document.querySelectorAll('.mobile-nav a').forEach(link => link.addEventListener('click', () => {
    document.querySelector('.mobile-nav').open = false;
  }));

  const rangeDialog = document.getElementById('range-dialog');
  const truckDialog = document.getElementById('truck-dialog');
  const tabs = [...document.querySelectorAll('[data-category]')];
  let lastOpener = null;
  function selectCategory(key, focus = false) {
    const data = window.MALS_DATA[key];
    if (!data) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.category === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    document.getElementById('category-panel').setAttribute('aria-labelledby', `tab-${key}`);
    document.getElementById('category-title').textContent = data.title;
    document.getElementById('category-description').textContent = data.description;
    const list = document.getElementById('category-items');
    list.replaceChildren(...data.items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
  }
  function openDialog(dialog, opener) {
    finishIntro();
    lastOpener = opener;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('modal-open');
    } else {
      dialog.setAttribute('open', '');
      dialog.scrollIntoView({ behavior: 'instant' });
      dialog.querySelector('button').focus();
    }
  }
  document.querySelectorAll('[data-menu]').forEach(button => button.addEventListener('click', () => {
    selectCategory(button.dataset.menu);
    openDialog(rangeDialog, button);
  }));
  document.querySelectorAll('[data-open-truck]').forEach(button => button.addEventListener('click', () => openDialog(truckDialog, button)));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCategory(tab.dataset.category));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectCategory(tabs[next].dataset.category, true);
    });
  });
  [rangeDialog, truckDialog].forEach(dialog => {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (lastOpener) lastOpener.focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside && typeof dialog.close === 'function') dialog.close();
    });
  });
  selectCategory('pies');
  updateMotion();
  if (!off && window.scrollY < 80) {
    const heroImage = document.querySelector('.hero-food');
    const assetsReady = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImage.decode ? heroImage.decode().catch(() => {}) : Promise.resolve()
    ]);
    assetsReady.then(startIntro);
  }
})();

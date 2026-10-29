// The range and Smoko Truck dialogs: native <dialog>, tabs with arrow keys,
// Home/End, Escape to close and focus back on the control that opened it.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function initDialogs() {
  const rangeDialog = $('#range-dialog');
  const truckDialog = $('#truck-dialog');
  const tabs = $$('[role="tab"]', rangeDialog);
  let opener = null;

  function select(key, focus = false) {
    tabs.forEach(tab => {
      const on = tab.dataset.category === key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(`#panel-${tab.dataset.category}`).hidden = !on;
      if (on && focus) tab.focus();
    });
  }

  function open(dialog, from) {
    opener = from;
    document.documentElement.classList.remove('is-entering');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('modal-open');
    } else {
      dialog.setAttribute('open', '');
    }
  }

  $$('[data-menu]').forEach(button => button.addEventListener('click', () => {
    select(button.dataset.menu);
    open(rangeDialog, button);
  }));
  $$('[data-open-truck]').forEach(button => button.addEventListener('click', () => open(truckDialog, button)));

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.category));
    tab.addEventListener('keydown', ev => {
      const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(ev.key in keys)) return;
      ev.preventDefault();
      const next = (keys[ev.key] + tabs.length) % tabs.length;
      select(tabs[next].dataset.category, true);
    });
  });

  [rangeDialog, truckDialog].forEach(dialog => {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (opener) opener.focus({ preventScroll: true });
    });
    // A click on the backdrop (outside the sheet) closes it.
    dialog.addEventListener('click', ev => {
      if (ev.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const outside = ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      if (outside) dialog.close();
    });
  });

  // Phones: close the section menu once a link is chosen.
  const mobileNav = $('.mobile-nav');
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => { mobileNav.open = false; }));
}

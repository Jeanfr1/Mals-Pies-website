import { defineConfig } from 'vite';
import { MENU, CONTACT } from './src/data/menu.js';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Content that must work without JS is rendered into the built HTML from the
// same data module the dialog script reads (menu panels, contact links).
function bakeryContent() {
  return {
    name: 'mals-content',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const panels = Object.entries(MENU).map(([key, cat], i) => `
      <div class="menu-panel" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}" tabindex="0"${i ? ' hidden' : ''}>
        <h3>${esc(cat.title)}</h3>
        <p>${esc(cat.description)}</p>
        <ul class="menu-list">${cat.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
      </div>`).join('');
        const tabs = Object.entries(MENU).map(([key, cat], i) =>
          `<button type="button" role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${i ? 'false' : 'true'}"${i ? ' tabindex="-1"' : ''} data-category="${key}">${esc(cat.tab)}</button>`).join('');
        return html
          .replace('<!--@menu-tabs-->', tabs)
          .replace('<!--@menu-panels-->', panels)
          .replaceAll('@@PHONE_HREF@@', CONTACT.phoneHref)
          .replaceAll('@@PHONE@@', CONTACT.phoneDisplay)
          .replaceAll('@@ADDRESS@@', CONTACT.address)
          .replaceAll('@@MAPS@@', esc(CONTACT.maps))
          .replaceAll('@@INSTAGRAM@@', CONTACT.instagram)
          .replaceAll('@@FACEBOOK@@', CONTACT.facebook)
          // Source comments (TODOs, notes for the team) never reach the visitor.
          .replace(/<!--(?!\[)[\s\S]*?-->\n?/g, '');
      }
    }
  };
}

export default defineConfig({
  plugins: [bakeryContent()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    cssCodeSplit: false
  }
});

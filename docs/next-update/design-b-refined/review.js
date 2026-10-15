// Static review only. No Firebase, account persistence, game launch or reward writes.
const sheet = document.getElementById('menu-sheet');
const menu = document.getElementById('open-menu');
const preview = document.getElementById('preview-dialog');
menu.addEventListener('click', () => { sheet.showModal(); menu.setAttribute('aria-expanded', 'true'); });
sheet.addEventListener('close', () => menu.setAttribute('aria-expanded', 'false'));
document.querySelectorAll('[data-preview]').forEach(el => el.addEventListener('click', event => {
  event.preventDefault();
  if (sheet.open) sheet.close();
  document.getElementById('preview-title').textContent = el.dataset.preview;
  preview.showModal();
}));
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => document.getElementById(el.dataset.close).close()));
fetch('brand-config.json').then(r => { if (!r.ok) throw Error('BRAND_CONFIG_FAILED'); return r.json(); }).then(config => {
  document.querySelectorAll('[data-brand-image]').forEach(img => { img.src = config.src; img.alt = config.alt; });
  document.querySelectorAll('.logo-note').forEach(note => { note.hidden = !config.temporary; });
}).catch(() => { /* Local-file viewing keeps the same safe static placeholder. */ });

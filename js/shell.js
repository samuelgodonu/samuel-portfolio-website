import { $, $$ } from './util.js';

export function initShell() {
  const root = document.documentElement;
  const btn = $('[data-theme-toggle]');
  const apply = t => {
    root.dataset.theme = t;
    if (btn) {
      btn.textContent = t === 'dark' ? 'Light theme' : 'Dark theme';
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  };
  apply(root.dataset.theme || 'dark');
  btn?.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(t);
    try { localStorage.setItem('sg-theme', t); } catch { /* storage blocked */ }
  });

  const toggle = $('.nav-toggle');
  const menu = $('#menu');
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu?.addEventListener('click', e => {
    if (e.target.closest('a')) { menu.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); }
  });

  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
}

// Highlights the nav link of the section currently on screen.
export function watchSections() {
  const links = new Map($$('#menu a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
  if (!links.size || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.removeAttribute('aria-current'));
        links.get(en.target.id)?.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s && !s.hidden) io.observe(s); });
}

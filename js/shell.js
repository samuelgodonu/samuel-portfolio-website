import { $, $$ } from './util.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initShell() {
  const root = document.documentElement;
  root.classList.add('js');
  const btn = $('[data-theme-toggle]');
  const apply = t => {
    root.dataset.theme = t;
    if (btn) {
      btn.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };
  apply(root.dataset.theme || 'light');
  btn?.addEventListener('click', () => {
    const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(t);
    try { localStorage.setItem('sg-theme', t); } catch { /* storage blocked */ }
  });

  const toggle = $('.nav-toggle'), menu = $('#menu');
  toggle?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu?.addEventListener('click', e => {
    if (e.target.closest('a')) { menu.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); }
  });

  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  // scroll progress bar + back-to-top
  const bar = document.createElement('div'); bar.id = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.prepend(bar);
  const top = document.createElement('button');
  top.id = 'totop'; top.type = 'button'; top.className = 'btn small primary no-print'; top.textContent = 'Back to top'; top.setAttribute('aria-label', 'Back to top');
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  document.body.appendChild(top);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(scrollY / h, 1) : 0})`;
      top.classList.toggle('show', scrollY > 700);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

// Fades elements in as they scroll into view. Call again after rendering new content.
let io = null;
export function reveal(rootEl = document) {
  const els = $$('.reveal:not(.in)', rootEl);
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(e => e.classList.add('in')); return; }
  io ||= new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e, i) => { if (!e.style.getPropertyValue('--d')) e.style.setProperty('--d', `${(i % 4) * 0.07}s`); io.observe(e); });
}

// Highlights the nav link of the section currently on screen.
export function watchSections() {
  const links = new Map($$('#menu a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
  if (!links.size || !('IntersectionObserver' in window)) return;
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.removeAttribute('aria-current'));
        links.get(en.target.id)?.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s && !s.hidden) spy.observe(s); });
}

import { $, $$, esc } from './util.js';
import { img } from './util.js';

// Accessible picture viewer: Esc closes, arrows navigate, focus is trapped and restored.
export function openLightbox(items, start, opener) {
  let i = start;
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Picture viewer');
  lb.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
    <button class="lb-btn close" type="button">Close</button>
    <button class="lb-btn prev" type="button" aria-label="Previous picture">Prev</button>
    <button class="lb-btn next" type="button" aria-label="Next picture">Next</button>`;
  document.body.appendChild(lb);
  document.body.style.overflow = 'hidden';

  const show = n => {
    i = (n + items.length) % items.length;
    const im = $('img', lb); im.src = img(items[i].image, 1800); im.alt = items[i].caption || '';
    const fc = $('figcaption', lb); fc.textContent = items[i].caption || '';
    if (items[i].sub) { const s = document.createElement('small'); s.textContent = items[i].sub; fc.appendChild(s); }
  };
  const close = () => { lb.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); opener?.focus(); };
  const onKey = e => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  lb.addEventListener('click', e => {
    if (e.target.closest('.close') || e.target === lb) close();
    else if (e.target.closest('.prev')) show(i - 1);
    else if (e.target.closest('.next')) show(i + 1);
  });
  document.addEventListener('keydown', onKey);
  show(i); $('.close', lb).focus();
}
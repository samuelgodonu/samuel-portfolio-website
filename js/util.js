export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s = '') =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Turns plain text into paragraphs. Blank line = new paragraph. Always escaped.
export const paras = (t = '') =>
  String(t || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

// Cloudinary images are resized and compressed automatically.
export function img(url, w = 1200) {
  if (!url) return '';
  if (/res\.cloudinary\.com/.test(url) && url.includes('/upload/') && !/\/upload\/[^/]*(f_auto|q_auto|w_)/.test(url)) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${w}/`);
  }
  return url;
}

// Blocks javascript: and other unsafe link types.
export function safeUrl(u) {
  try {
    const x = new URL(u, location.href);
    return ['http:', 'https:', 'mailto:'].includes(x.protocol) ? u : '#';
  } catch { return '#'; }
}

export const slugify = (s = '') =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const byOrder = (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0);

export function toast(msg, kind = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

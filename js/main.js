import { load, loadSettings, getFirebase } from './data.js';
import { $, $$, esc, paras, img, safeUrl } from './util.js';
import { initShell, reveal, watchSections } from './shell.js';
import { openLightbox } from './lightbox.js';

initShell();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const hideSection = id => { const s = document.getElementById(id); if (s) s.hidden = true; $$(`[data-for="${id}"]`).forEach(a => (a.hidden = true)); };
const showSection = id => { const s = document.getElementById(id); if (s) s.hidden = false; $$(`[data-for="${id}"]`).forEach(a => (a.hidden = false)); };

/* ---------- settings ---------- */
const SOCIALS = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['x', 'X'], ['instagram', 'Instagram'], ['website', 'P.kreatif Designs']];

function applySettings(s) {
  $$('[data-s]').forEach(el => { if (s[el.dataset.s]) el.textContent = s[el.dataset.s]; });
  document.title = `${s.name} | ${s.title || 'Chemical Engineering'}`;
  $$('[data-mail]').forEach(a => { if (s.email) { a.href = 'mailto:' + s.email; if (!a.dataset.keep) a.textContent = s.email; } else a.hidden = true; });
  $$('[data-resume]').forEach(a => { if (s.resumeUrl) a.href = safeUrl(s.resumeUrl); else a.hidden = true; });

  const soc = SOCIALS.filter(([k]) => s[k]);
  $('#socials').innerHTML = soc.map(([k, l]) => `<li><a href="${esc(safeUrl(s[k]))}" target="_blank" rel="noopener"><span>${l}</span><span aria-hidden="true">↗</span></a></li>`).join('');
  $('#hero-social').innerHTML = soc.slice(0, 3).map(([k, l]) => `<a href="${esc(safeUrl(s[k]))}" target="_blank" rel="noopener">${l} ↗</a>`).join('');

  setPortrait(s);
  $('#story').innerHTML = paras(s.story || s.bio);
  const now = [['Learning', s.learning], ['Building', s.building], ['Reading', s.reading]].filter(n => n[1]);
  $('#now').innerHTML = now.map(([k, v]) => `<div><b>${k}</b>${esc(v)}</div>`).join('');
  $('#facts').innerHTML = [['University', s.university], ['Location', s.location], ['Memberships', s.memberships]].filter(f => f[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

  roles((s.roles || '').split(',').map(x => x.trim()).filter(Boolean));
}

/* ---------- portrait: shows your photo, keeps the placeholder if the file is missing ---------- */
function setPortrait(s) {
  if (!s.portrait) return;
  ['#hero-portrait', '#about-portrait'].forEach(sel => {
    const box = $(sel);
    const im = new Image();
    im.alt = `Portrait of ${s.name}`; im.decoding = 'async';
    im.style.objectPosition = s.portraitFocus || '50% 25%';
    im.onload = () => box.replaceChildren(im);
    im.onerror = () => console.warn(`Portrait not found: ${s.portrait}`);
    im.src = img(s.portrait, 900);
  });
}

/* ---------- hero: typed roles + tilt ---------- */
function roles(list) {
  const el = $('#role-text');
  if (!list.length) { el.parentElement.hidden = true; return; }
  el.textContent = list[0];
  if (reduce || list.length < 2) { $('.caret')?.remove(); return; }
  let i = 0, j = list[0].length, deleting = true;
  const tick = () => {
    if (deleting) {
      j--; el.textContent = list[i].slice(0, j);
      if (j <= 0) { deleting = false; i = (i + 1) % list.length; return setTimeout(tick, 300); }
      return setTimeout(tick, 35);
    }
    j++; el.textContent = list[i].slice(0, j);
    if (j >= list[i].length) { deleting = true; return setTimeout(tick, 1900); }
    setTimeout(tick, 70);
  };
  setTimeout(tick, 1900);
}

(function tilt() {
  const box = $('#hero-visual'), card = $('#hero-portrait');
  if (reduce || !matchMedia('(pointer: fine)').matches) return;
  box.addEventListener('pointermove', e => {
    const r = box.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
  });
  box.addEventListener('pointerleave', () => (card.style.transform = ''));
})();

function marquee(societies, fallbackNames) {
  // Prefer the societies list (name + logo). Fall back to the plain memberships text.
  const items = societies.length ? societies : fallbackNames.map(name => ({ name }));
  if (!items.length) return;
  const initials = n => (n.match(/[A-Z]/g) || [n[0]]).join('').slice(0, 3);
  const one = items.map(i => `
    <span class="soc"><span class="soc-logo">${i.logo ? `<img src="${esc(img(i.logo, 200))}" alt="" loading="lazy">` : `<b>${esc(initials(i.name))}</b>`}</span><span>${esc(i.name)}</span></span>`).join('');
  const track = $('#marq-track');
  // if a logo file is missing, show the initials inside the same circle
  track.addEventListener('error', e => {
    if (e.target.tagName !== 'IMG') return;
    const name = e.target.closest('.soc')?.lastElementChild.textContent || '';
    e.target.parentElement.innerHTML = `<b>${esc(initials(name))}</b>`;
  }, true);
  $('#affil').hidden = false;
  track.innerHTML = reduce ? one : one.repeat(6);
  if (reduce) track.style.cssText = 'flex-wrap:wrap;justify-content:center;width:auto;padding-inline:1rem';
  else track.style.setProperty('--dur', `${items.length * 9}s`);
  const sr = $('#marq-sr');
  sr.textContent = 'Student member of ' + items.map(i => i.fullName || i.name).join(', ');
  sr.classList.remove('hp'); sr.style.cssText = 'position:absolute;left:-9999px';
}

/* ---------- carousel: advances by itself every 5 seconds ---------- */
function carousel(slides) {
  const root = $('#carousel'), sec = $('#highlights');
  if (!slides.length) { sec.hidden = true; return; }
  root.innerHTML = `
    <div class="car-viewport"><ul class="car-track">${slides.map((s, i) => `
      <li class="car-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
        <img src="${esc(img(s.image, 1600))}" alt="${esc(s.alt || s.title)}" ${i ? 'loading="lazy"' : ''}>
        <div class="car-cap"><h3>${esc(s.title)}</h3>${s.subtitle ? `<p>${esc(s.subtitle)}</p>` : ''}
        ${s.link ? `<a class="btn small" href="${esc(safeUrl(s.link))}">${esc(s.linkLabel || 'View')}</a>` : ''}</div>
      </li>`).join('')}</ul></div>
    ${slides.length > 1 ? `<div class="car-ctrl"><div class="dots" role="group" aria-label="Choose slide">${slides.map((_, i) => `<button type="button" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}</div></div>` : ''}`;
  const track = $('.car-track', root), items = $$('.car-slide', root), dots = $$('.dots button', root);
  let idx = 0, timer = null, hovering = false;
  const go = n => {
    idx = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    items.forEach((el, i) => el.toggleAttribute('inert', i !== idx));
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === idx)));
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { stop(); if (!reduce && !hovering && slides.length > 1) timer = setInterval(() => go(idx + 1), 2000); };
  root.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { go(Number(b.dataset.i)); start(); } });
  root.addEventListener('mouseenter', () => { hovering = true; stop(); });
  root.addEventListener('mouseleave', () => { hovering = false; start(); });
  root.addEventListener('focusin', () => { hovering = true; stop(); });
  root.addEventListener('focusout', () => { hovering = false; start(); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { go(idx - 1); start(); } if (e.key === 'ArrowRight') { go(idx + 1); start(); } });
  let x0 = null; const vp = $('.car-viewport', root);
  vp.addEventListener('pointerdown', e => { x0 = e.clientX; });
  vp.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1)); start(); } });
  vp.addEventListener('pointercancel', () => { x0 = null; });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  go(0); start();
}

/* ---------- projects: search + filter ---------- */
function projects(items, upcoming = []) {
  const grid = $('#project-grid');
  if (!items.length && !upcoming.length) { hideSection('work'); return; }
  if (upcoming.length) {
    const soon = $('#project-soon'); soon.hidden = false;
    soon.innerHTML = `<span>More fields coming soon:</span>` + upcoming.map(u => `<span class="chip-soon">${esc(u)}<em>soon</em></span>`).join('');
  }
  if (!items.length) { $('#project-search').closest('.toolbar').hidden = true; return; }
  const cats = ['All', ...new Set(items.map(p => p.category).filter(Boolean))];
  let cat = 'All', q = '';
  const draw = () => {
    const hits = items.filter(p => (cat === 'All' || p.category === cat) &&
      (!q || [p.title, p.summary, p.role, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q)));
    $('#project-count').textContent = `Showing ${hits.length} of ${items.length} project${items.length === 1 ? '' : 's'}`;
    grid.innerHTML = hits.length ? hits.map(p => `
      <a class="frame project reveal" href="project.html?id=${encodeURIComponent(p.id)}">
        <div class="cover">${p.cover ? `<img src="${esc(img(p.cover, 800))}" alt="" loading="lazy">` : ''}<span class="go">View project →</span></div>
        <div class="body">
          <span class="cat">${esc(p.category || '')}${p.date ? ' · ' + esc(p.date) : ''}</span>
          <h3>${esc(p.title)}</h3>
          ${p.role ? `<span class="role">${esc(p.role)}</span>` : ''}
          <p>${esc(p.summary || '')}</p>
          <div class="tags">${(p.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
      </a>`).join('') : '<p class="empty-note">No projects match your search.</p>';
    reveal(grid);
  };
  const f = $('#project-filters');
  if (cats.length > 2) {
    f.innerHTML = cats.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
    f.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      cat = b.textContent; draw();
    });
  } else f.hidden = true;
  $('#project-search').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
  draw();
}

/* ---------- experience tabs ---------- */
function experience(items) {
  if (!items.length) { hideSection('experience'); return; }
  showSection('experience');
  const order = ['Education', 'Experience', 'Leadership'];
  const types = [...new Set(items.map(i => i.type || 'Experience'))].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const tabs = $('#xp-tabs'), list = $('#xp-list');
  let cur = types[0];
  const draw = () => {
    $$('button', tabs).forEach(b => { const on = b.dataset.t === cur; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    list.setAttribute('aria-labelledby', `tab-${types.indexOf(cur)}`);
    list.innerHTML = items.filter(i => (i.type || 'Experience') === cur).map(i => `
      <li><div class="when">${esc(i.period || i.year || '')}</div>
      <div><h3>${esc(i.title)}</h3>${i.org ? `<p class="org">${esc(i.org)}</p>` : ''}${i.description ? `<p>${esc(i.description)}</p>` : ''}</div></li>`).join('');
  };
  tabs.innerHTML = types.map((t, i) => `<button class="chip-btn" type="button" role="tab" id="tab-${i}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = b.dataset.t; draw(); } });
  tabs.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const i = types.indexOf(cur), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + types.length) % types.length;
    cur = types[n]; draw(); $(`#tab-${n}`).focus();
  });
  draw();
}

/* ---------- skills ---------- */
const LEVEL = { 'Learning': 33, 'Working knowledge': 66, 'Strong': 100 };
function skills(items) {
  if (!items.length) { hideSection('skills'); return; }
  showSection('skills');
  const groups = {};
  items.forEach(s => (groups[s.category || 'Other'] ||= []).push(s));
  $('#skills-grid').innerHTML = Object.entries(groups).map(([c, list]) => `
    <div class="frame skillbox reveal"><h3>${esc(c)}</h3>${list.map(s => `
      <div class="skill"><div class="top"><span style="font:inherit;color:inherit">${esc(s.name)}</span>${s.level ? `<span>${esc(s.level)}</span>` : ''}</div>
      ${LEVEL[s.level] ? `<div class="meter" role="img" aria-label="${esc(s.level)}"><i style="--w:${LEVEL[s.level]}%"></i></div>` : ''}</div>`).join('')}</div>`).join('');
}

/* ---------- research (shows "coming soon" until you add one) ---------- */
function research(items) {
  showSection('research');
  $('#research-list').innerHTML = items.length ? items.map(r => `
    <li class="reveal"><div class="meta">${esc(r.year || '')}<br>${esc(r.type || '')}${r.status ? `<br>${esc(r.status)}` : ''}</div>
    <div><h3>${r.link ? `<a href="${esc(safeUrl(r.link))}">${esc(r.title)}</a>` : esc(r.title)}</h3>${r.abstract ? `<p>${esc(r.abstract)}</p>` : ''}</div></li>`).join('')
    : `<li class="reveal"><div class="meta">Coming soon</div><div><h3>Research is on the way</h3><p>Studies, reports and literature work will be posted here.</p></div></li>`;
}

/* ---------- hackathons + awards: rounded cards with an image slot ---------- */
const initialsOf = t => (String(t).match(/\b[A-Za-z0-9]/g) || ['·']).slice(0, 2).join('').toUpperCase();
const card = ({ title, link, image, meta, result, text, linkLabel }) => `
  <article class="frame cardx reveal">
    <div class="cardx-img">${image ? `<img src="${esc(img(image, 800))}" alt="" loading="lazy">` : `<b aria-hidden="true">${esc(initialsOf(title))}</b>`}</div>
    <div class="cardx-body">
      <h3>${esc(title)}</h3>
      ${meta ? `<span class="meta">${esc(meta)}</span>` : ''}
      ${result ? `<span class="result">${esc(result)}</span>` : ''}
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${link ? `<p><a href="${esc(safeUrl(link))}" target="_blank" rel="noopener">${esc(linkLabel)} ↗</a></p>` : ''}
    </div>
  </article>`;

function hackathons(items, awards) {
  if (!items.length && !awards.length) { hideSection('hackathons'); return; }
  showSection('hackathons');
  $('#hack-h').hidden = !items.length; $('#award-h').hidden = !awards.length;
  $('#hack-grid').innerHTML = items.map(h => card({ title: h.name, link: h.link, image: h.image, meta: [h.date, h.role].filter(Boolean).join(' · '), result: h.result, text: h.description, linkLabel: 'Read more' })).join('');
  $('#awards-grid').innerHTML = awards.map(a => card({ title: a.title, link: a.link, image: a.image, meta: [a.issuer, a.year].filter(Boolean).join(' · '), text: a.description, linkLabel: 'View certificate' })).join('');
}

/* ---------- gallery: albums, and a title on every picture ---------- */
function gallery(items) {
  if (!items.length) { hideSection('gallery'); return; }
  showSection('gallery');
  const grid = $('#gallery-grid'); let current = items;
  const title = g => g.title || g.caption || '';
  const draw = album => {
    current = items.filter(g => album === 'All' || g.album === album);
    grid.innerHTML = current.map((g, i) => `
      <button type="button" data-i="${i}" aria-label="Enlarge: ${esc(title(g) || 'picture ' + (i + 1))}">
        <img src="${esc(img(g.image, 700))}" alt="${esc(title(g))}" loading="lazy">
        ${title(g) || g.album ? `<span class="tile-cap">${title(g) ? `<b>${esc(title(g))}</b>` : ''}${g.album ? `<small>${esc(g.album)}</small>` : ''}</span>` : ''}
      </button>`).join('');
  };
  const albums = ['All', ...new Set(items.map(g => g.album).filter(Boolean))];
  const f = $('#gallery-filters');
  if (albums.length > 2) {
    f.innerHTML = albums.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
    f.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', f).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(b.textContent); });
  } else f.hidden = true;
  grid.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    openLightbox(current.map(g => ({ image: g.image, caption: title(g), sub: [g.album, g.description].filter(Boolean).join(' · ') })), Number(b.dataset.i), b);
  });
  draw('All');
}

/* ---------- contact ---------- */
function contact(settings) {
  const form = $('#contact-form'), status = $('#form-status'), btn = $('#send-btn');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements['bot-field'].value) return;
    btn.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
    const fd = new FormData(form); let ok = false;
    try { ok = (await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() })).ok; } catch { /* offline or running locally */ }
    const fb = await getFirebase();
    if (fb) {
      try {
        await fb.fs.addDoc(fb.fs.collection(fb.db, 'messages'), { name: String(fd.get('name')).slice(0, 100), email: String(fd.get('email')).slice(0, 200), message: String(fd.get('message')).slice(0, 3000), read: false, createdAt: fb.fs.serverTimestamp() });
        ok = true;
      } catch (err) { console.warn(err); }
    }
    btn.disabled = false;
    if (ok) { form.reset(); status.textContent = 'Message sent. Thank you, I will reply by email.'; }
    else { status.className = 'form-status err'; status.textContent = `The message could not be sent from here. Please email ${settings.email || 'me'} directly.`; }
  });
}

/* ---------- boot ---------- */
(async function () {
  const [settings, slides, projs, tl, sk, res, hacks, awards, gal, socs] = await Promise.all([
    loadSettings(), load('slides'), load('projects'), load('timeline'), load('skills'), load('research'), load('hackathons'), load('awards'), load('gallery'), load('societies')
  ]);
  applySettings(settings);
  marquee(socs, (settings.memberships || '').split(',').map(x => x.trim()).filter(Boolean));
  carousel(slides); projects(projs, (settings.upcoming || '').split(',').map(x => x.trim()).filter(Boolean));
  experience(tl); skills(sk); research(res); hackathons(hacks, awards); gallery(gal);
  contact(settings);
  reveal(); watchSections();
})().catch(e => console.error('Site failed to load', e));
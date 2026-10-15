import { load, loadSettings, getFirebase } from './data.js';
import { $, $$, esc, paras, img, safeUrl } from './util.js';
import { initShell, reveal, watchSections } from './shell.js';
import { study, at, sgn } from './study.js';
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

  if (s.portrait) {
    const tag = `<img src="${esc(img(s.portrait, 900))}" alt="Portrait of ${esc(s.name)}">`;
    $('#hero-portrait').innerHTML = tag; $('#about-portrait').innerHTML = tag;
  }
  $('#story').innerHTML = paras(s.story || s.bio);
  const now = [['Learning', s.learning], ['Building', s.building], ['Reading', s.reading]].filter(n => n[1]);
  $('#now').innerHTML = now.map(([k, v]) => `<div><b>${k}</b>${esc(v)}</div>`).join('');
  $('#facts').innerHTML = [['University', s.university], ['Location', s.location], ['Memberships', s.memberships]].filter(f => f[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

  roles((s.roles || '').split(',').map(x => x.trim()).filter(Boolean));
  marquee([...(s.memberships || '').split(',').map(x => x.trim()).filter(Boolean)]);
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

function marquee(items) {
  if (!items.length) return;
  const wrap = $('#affil'); wrap.hidden = false;
  const one = items.map(i => `<span>${esc(i)}</span>`).join('');
  $('#marq-track').innerHTML = reduce ? one : one + one + one + one;
  if (reduce) $('#marq-track').style.cssText = 'flex-wrap:wrap;justify-content:center;width:auto;padding-inline:1rem';
  $('#marq-sr').textContent = 'Student member of ' + items.join(', ');
  $('#marq-sr').classList.remove('hp'); $('#marq-sr').style.cssText = 'position:absolute;left:-9999px';
}

/* ---------- carousel ---------- */
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
    <div class="car-ctrl">
      <button type="button" data-a="prev" aria-label="Previous slide">Prev</button>
      <button type="button" data-a="next" aria-label="Next slide">Next</button>
      <button type="button" data-a="pause" aria-pressed="false">Pause</button>
      <div class="dots">${slides.map((_, i) => `<button type="button" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}</div>
    </div>`;
  const track = $('.car-track', root), items = $$('.car-slide', root), dots = $$('.dots button', root), pauseBtn = $('[data-a="pause"]', root);
  let idx = 0, timer = null, paused = reduce, hovering = false;
  const go = n => {
    idx = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    items.forEach((el, i) => el.toggleAttribute('inert', i !== idx));
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === idx)));
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { stop(); if (!paused && !hovering && slides.length > 1) timer = setInterval(() => go(idx + 1), 5500); };
  const sync = () => { pauseBtn.textContent = paused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-pressed', String(paused)); };
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'prev') go(idx - 1); else if (b.dataset.a === 'next') go(idx + 1);
    else if (b.dataset.a === 'pause') { paused = !paused; sync(); } else if (b.dataset.i) go(Number(b.dataset.i));
    start();
  });
  root.addEventListener('mouseenter', () => { hovering = true; start(); });
  root.addEventListener('mouseleave', () => { hovering = false; start(); });
  root.addEventListener('focusin', () => { hovering = true; start(); });
  root.addEventListener('focusout', () => { hovering = false; start(); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });
  let x0 = null; const vp = $('.car-viewport', root);
  vp.addEventListener('pointerdown', e => { x0 = e.clientX; });
  vp.addEventListener('pointerup', e => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1)); start(); } });
  vp.addEventListener('pointercancel', () => { x0 = null; });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  sync(); go(0); start();
}

/* ---------- projects: search + filter ---------- */
function projects(items) {
  const grid = $('#project-grid');
  if (!items.length) { hideSection('work'); return; }
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

/* ---------- interactive simulation widget ---------- */
async function simWidget() {
  try {
    const d = await study(), T = d.temperatures;
    const m = k => d.metrics.find(x => x.key === k);
    const cool = m('cooler'), oct = m('octane'), reb = m('reboiler');
    const mags = cool.values.map(Math.abs), lo = Math.min(...mags), hi = Math.max(...mags);
    const X = t => 24 + ((t - T[0]) / (T[T.length - 1] - T[0])) * 272;
    const Y = v => 100 - ((Math.abs(v) - lo) / (hi - lo)) * 76;
    const pts = T.map((t, i) => `${X(t).toFixed(1)},${Y(cool.values[i]).toFixed(1)}`).join(' ');
    const svg = $('#sw-spark');
    svg.innerHTML = `<line class="axis" x1="24" y1="108" x2="296" y2="108"/>
      <polyline class="ln" points="${pts}"/>
      ${T.map((t, i) => `<circle cx="${X(t).toFixed(1)}" cy="${Y(cool.values[i]).toFixed(1)}" r="3.5" fill="var(--ink)"/>`).join('')}
      <circle class="dotm" id="sw-dot" r="7" cx="0" cy="0"/>
      <text x="24" y="10">Heat removed by cooler (kW)</text>
      <text x="24" y="120">${T[0]} °C</text><text x="296" y="120" text-anchor="end">${T[T.length - 1]} °C</text>`;
    const range = $('#sw-range'), dot = $('#sw-dot');
    const row = (l, v, u) => `<div><dt>${l}</dt><dd><b>${v}</b> ${u}</dd></div>`;
    const upd = () => {
      const t = Number(range.value);
      $('#sw-val').textContent = t;
      const exact = T.includes(t);
      $('#sw-badge').textContent = exact ? 'Simulated case' : 'Interpolated, not simulated';
      $('#sw-badge').classList.toggle('sim', exact);
      const c = at(cool, T, t);
      dot.setAttribute('cx', X(t).toFixed(1)); dot.setAttribute('cy', Y(c).toFixed(1));
      $('#sw-readout').innerHTML = row('Cooler duty', sgn(cool, c), 'kW') + row('n-Octane flow', sgn(oct, at(oct, T, t)), 'kmol/h') + row('Reboiler duty', sgn(reb, at(reb, T, t)), 'kW');
    };
    range.addEventListener('input', upd); upd();
  } catch (e) { console.warn(e); hideSection('simulation'); }
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

/* ---------- research / hackathons / gallery ---------- */
function research(items) {
  if (!items.length) { hideSection('research'); return; }
  showSection('research');
  $('#research-list').innerHTML = items.map(r => `
    <li class="reveal"><div class="meta">${esc(r.year || '')}<br>${esc(r.type || '')}${r.status ? `<br>${esc(r.status)}` : ''}</div>
    <div><h3>${r.link ? `<a href="${esc(safeUrl(r.link))}">${esc(r.title)}</a>` : esc(r.title)}</h3>${r.abstract ? `<p>${esc(r.abstract)}</p>` : ''}</div></li>`).join('');
}

function hackathons(items, awards) {
  if (!items.length && !awards.length) { hideSection('hackathons'); return; }
  showSection('hackathons');
  $('#hack-grid').innerHTML = items.map(h => `
    <article class="frame reveal">${h.image ? `<img src="${esc(img(h.image, 800))}" alt="" loading="lazy">` : ''}
      <h3>${h.link ? `<a href="${esc(safeUrl(h.link))}" target="_blank" rel="noopener">${esc(h.name)}</a>` : esc(h.name)}</h3>
      <p class="muted mono" style="margin:.3rem 0 0;font-size:.88rem">${[h.date, h.role].filter(Boolean).map(esc).join(' · ')}</p>
      ${h.result ? `<span class="result">${esc(h.result)}</span>` : ''}
      ${h.description ? `<p class="muted" style="margin:0">${esc(h.description)}</p>` : ''}</article>`).join('');
  $('#awards-list').innerHTML = awards.map(a => `<li class="reveal"><span>${esc(a.title)}</span><span>${[a.issuer, a.year].filter(Boolean).map(esc).join(' · ')}</span></li>`).join('');
}

function gallery(items) {
  if (!items.length) { hideSection('gallery'); return; }
  showSection('gallery');
  const grid = $('#gallery-grid'); let current = items;
  const draw = album => {
    current = items.filter(g => album === 'All' || g.album === album);
    grid.innerHTML = current.map((g, i) => `<button type="button" data-i="${i}" aria-label="Enlarge: ${esc(g.caption || 'picture ' + (i + 1))}"><img src="${esc(img(g.image, 700))}" alt="${esc(g.caption || '')}" loading="lazy"></button>`).join('');
  };
  const albums = ['All', ...new Set(items.map(g => g.album).filter(Boolean))];
  const f = $('#gallery-filters');
  if (albums.length > 2) {
    f.innerHTML = albums.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
    f.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', f).forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(b.textContent); });
  } else f.hidden = true;
  grid.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openLightbox(current, Number(b.dataset.i), b); });
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
  const [settings, slides, projs, tl, sk, res, hacks, awards, gal] = await Promise.all([
    loadSettings(), load('slides'), load('projects'), load('timeline'), load('skills'), load('research'), load('hackathons'), load('awards'), load('gallery')
  ]);
  applySettings(settings);
  carousel(slides); projects(projs); simWidget();
  experience(tl); skills(sk); research(res); hackathons(hacks, awards); gallery(gal);
  contact(settings);
  reveal(); watchSections();
})().catch(e => console.error('Site failed to load', e));

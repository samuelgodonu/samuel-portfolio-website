import { load, loadSettings, getFirebase, json } from './data.js';
import { $, $$, esc, paras, img, safeUrl } from './util.js';
import { initShell, watchSections } from './shell.js';

initShell();

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function hideSection(id) {
  const s = document.getElementById(id);
  if (s) s.hidden = true;
  $$(`[data-for="${id}"]`).forEach(a => (a.hidden = true));
}
function showSection(id) {
  const s = document.getElementById(id);
  if (s) s.hidden = false;
}

/* ---------- settings ---------- */
const SOCIALS = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['x', 'X'], ['instagram', 'Instagram'], ['website', 'P.kreatif Designs / website']];

function applySettings(s) {
  $$('[data-s]').forEach(el => { if (s[el.dataset.s]) el.textContent = s[el.dataset.s]; });
  document.title = `${s.name} | ${s.title || 'Chemical Engineering'}`;
  $$('[data-mail]').forEach(a => {
    if (s.email) { a.href = 'mailto:' + s.email; if (!a.dataset.keep) a.textContent = s.email; } else a.hidden = true;
  });
  $$('[data-resume]').forEach(a => {
    if (s.resumeUrl) a.href = safeUrl(s.resumeUrl); else a.hidden = true;
  });
  $('#socials').innerHTML = SOCIALS.filter(([k]) => s[k])
    .map(([k, l]) => `<li><a href="${esc(safeUrl(s[k]))}" target="_blank" rel="noopener"><span>${l}</span><span aria-hidden="true">↗</span></a></li>`).join('');

  $('#story').innerHTML = paras(s.story || s.bio);
  if (s.portrait) $('#portrait').innerHTML = `<img src="${esc(img(s.portrait, 800))}" alt="Portrait of ${esc(s.name)}">`;
  const facts = [['University', s.university], ['Location', s.location], ['Memberships', s.memberships]].filter(f => f[1]);
  $('#facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
}

/* ---------- hero + band readouts from the study data ---------- */
async function readouts() {
  try {
    const d = await json('temperature-study');
    const m = k => d.metrics.find(x => x.key === k);
    const i = d.temperatures.indexOf(100);
    const row = (label, val, unit) => `<div><dt>${label}</dt><dd><b>${val}</b> ${unit}</dd></div>`;
    const f = (k, idx) => m(k).values[idx].toFixed(m(k).decimals);
    $('#hero-readout').innerHTML =
      `<div class="cap"><dt>Base case, reactor outlet 100 °C</dt><dd></dd></div>` +
      row('n-Octane flow', f('octane', i), 'kmol/h') + row('Cooler duty', f('cooler', i), 'kW') + row('Reboiler duty', f('reboiler', i), 'kW');
    const last = d.temperatures.length - 1;
    $('#band-readout').innerHTML =
      row(`Cooler duty at ${d.temperatures[0]} °C`, f('cooler', 0), 'kW') +
      row(`Cooler duty at ${d.temperatures[last]} °C`, f('cooler', last), 'kW') +
      row('n-Octane flow, all cases', f('octane', 0), 'kmol/h') +
      row('Reboiler duty, all cases', f('reboiler', 0), 'kW');
  } catch (e) { console.warn(e); $('#sim')?.setAttribute('hidden', ''); }
}

/* ---------- carousel ---------- */
function carousel(slides) {
  const root = $('#carousel');
  const sec = $('#highlights');
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
  const syncPause = () => { pauseBtn.textContent = paused ? 'Play' : 'Pause'; pauseBtn.setAttribute('aria-pressed', String(paused)); };

  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'prev') go(idx - 1);
    else if (b.dataset.a === 'next') go(idx + 1);
    else if (b.dataset.a === 'pause') { paused = !paused; syncPause(); }
    else if (b.dataset.i) go(Number(b.dataset.i));
    start();
  });
  root.addEventListener('mouseenter', () => { hovering = true; start(); });
  root.addEventListener('mouseleave', () => { hovering = false; start(); });
  root.addEventListener('focusin', () => { hovering = true; start(); });
  root.addEventListener('focusout', () => { hovering = false; start(); });
  root.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });

  // swipe
  let x0 = null;
  const vp = $('.car-viewport', root);
  vp.addEventListener('pointerdown', e => { x0 = e.clientX; });
  vp.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { go(idx + (dx < 0 ? 1 : -1)); start(); }
  });
  vp.addEventListener('pointercancel', () => { x0 = null; });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  syncPause(); go(0); start();
}

/* ---------- projects ---------- */
function projects(items) {
  const grid = $('#project-grid');
  if (!items.length) { hideSection('work'); return; }
  const cats = ['All', ...new Set(items.map(p => p.category).filter(Boolean))];
  const draw = cat => {
    grid.innerHTML = items.filter(p => cat === 'All' || p.category === cat).map(p => `
      <a class="frame project" href="project.html?id=${encodeURIComponent(p.id)}">
        <div class="cover">${p.cover ? `<img src="${esc(img(p.cover, 800))}" alt="" loading="lazy">` : ''}</div>
        <div class="body">
          <span class="cat">${esc(p.category || '')}${p.date ? ' · ' + esc(p.date) : ''}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.summary || '')}</p>
          <div class="tags">${(p.tags || []).slice(0, 4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
      </a>`).join('');
  };
  const f = $('#project-filters');
  if (cats.length > 2) {
    f.innerHTML = cats.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
    f.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      draw(b.textContent);
    });
  } else f.hidden = true;
  draw('All');
}

/* ---------- research ---------- */
function research(items) {
  if (!items.length) { hideSection('research'); return; }
  showSection('research');
  $('#research-list').innerHTML = items.map(r => `
    <li>
      <div class="meta">${esc(r.year || '')}<br>${esc(r.type || '')}${r.status ? `<br>${esc(r.status)}` : ''}</div>
      <div><h3>${r.link ? `<a href="${esc(safeUrl(r.link))}">${esc(r.title)}</a>` : esc(r.title)}</h3>
      ${r.abstract ? `<p>${esc(r.abstract)}</p>` : ''}</div>
    </li>`).join('');
}

/* ---------- hackathons + awards ---------- */
function hackathons(items, awards) {
  if (!items.length && !awards.length) { hideSection('hackathons'); return; }
  showSection('hackathons');
  $('#hack-grid').innerHTML = items.map(h => `
    <article class="frame">
      ${h.image ? `<img src="${esc(img(h.image, 800))}" alt="" loading="lazy">` : ''}
      <h3>${h.link ? `<a href="${esc(safeUrl(h.link))}" target="_blank" rel="noopener">${esc(h.name)}</a>` : esc(h.name)}</h3>
      <p class="muted mono" style="margin:.3rem 0 0;font-size:.88rem">${[h.date, h.role].filter(Boolean).map(esc).join(' · ')}</p>
      ${h.result ? `<span class="result">${esc(h.result)}</span>` : ''}
      ${h.description ? `<p class="muted" style="margin:0">${esc(h.description)}</p>` : ''}
    </article>`).join('');
  $('#awards-list').innerHTML = awards.map(a =>
    `<li><span>${esc(a.title)}</span><span>${[a.issuer, a.year].filter(Boolean).map(esc).join(' · ')}</span></li>`).join('');
}

/* ---------- gallery + lightbox ---------- */
function gallery(items) {
  if (!items.length) { hideSection('gallery'); return; }
  showSection('gallery');
  const grid = $('#gallery-grid');
  let current = items;
  const draw = album => {
    current = items.filter(g => album === 'All' || g.album === album);
    grid.innerHTML = current.map((g, i) => `
      <button type="button" data-i="${i}" aria-label="Enlarge: ${esc(g.caption || 'picture ' + (i + 1))}">
        <img src="${esc(img(g.image, 700))}" alt="${esc(g.caption || '')}" loading="lazy">
      </button>`).join('');
  };
  const albums = ['All', ...new Set(items.map(g => g.album).filter(Boolean))];
  const f = $('#gallery-filters');
  if (albums.length > 2) {
    f.innerHTML = albums.map((c, i) => `<button class="chip-btn" type="button" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
    f.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', f).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      draw(b.textContent);
    });
  } else f.hidden = true;
  draw('All');

  let lb = null, i = 0, opener = null;
  const show = n => {
    i = (n + current.length) % current.length;
    $('img', lb).src = img(current[i].image, 1800);
    $('img', lb).alt = current[i].caption || '';
    $('figcaption', lb).textContent = current[i].caption || '';
  };
  const close = () => { lb?.remove(); lb = null; document.removeEventListener('keydown', onKey); opener?.focus(); };
  const onKey = e => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('button', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  grid.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    opener = b;
    lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Picture viewer');
    lb.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-btn close" type="button">Close</button>
      <button class="lb-btn prev" type="button" aria-label="Previous picture">Prev</button>
      <button class="lb-btn next" type="button" aria-label="Next picture">Next</button>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', ev => {
      if (ev.target.closest('.close') || ev.target === lb) close();
      else if (ev.target.closest('.prev')) show(i - 1);
      else if (ev.target.closest('.next')) show(i + 1);
    });
    document.addEventListener('keydown', onKey);
    show(Number(b.dataset.i));
    $('.close', lb).focus();
  });
}

/* ---------- about: timeline + skills ---------- */
function about(timeline, skills) {
  $('#timeline').innerHTML = timeline.map(t =>
    `<li><span class="yr">${esc(t.year)}</span><h3>${esc(t.title)}</h3>${t.description ? `<p>${esc(t.description)}</p>` : ''}</li>`).join('');
  const groups = {};
  skills.forEach(s => (groups[s.category || 'Other'] ||= []).push(s));
  $('#skills').innerHTML = Object.entries(groups).map(([c, list]) =>
    `<div class="skillgroup"><h3>${esc(c)}</h3><div class="tags">${list.map(s => `<span class="tag">${esc(s.name)}</span>`).join('')}</div></div>`).join('');
  if (!timeline.length && !skills.length) $('#about .about > div:last-child').hidden = true;
}

/* ---------- contact ---------- */
function contact(settings) {
  const form = $('#contact-form'), status = $('#form-status'), btn = $('#send-btn');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements['bot-field'].value) return; // bot
    btn.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
    const fd = new FormData(form);
    let ok = false;
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() });
      ok = r.ok;
    } catch { /* offline or running locally */ }
    const fb = await getFirebase();
    if (fb) {
      try {
        await fb.fs.addDoc(fb.fs.collection(fb.db, 'messages'), {
          name: String(fd.get('name')).slice(0, 100), email: String(fd.get('email')).slice(0, 200),
          message: String(fd.get('message')).slice(0, 3000), read: false, createdAt: fb.fs.serverTimestamp()
        });
        ok = true;
      } catch (err) { console.warn(err); }
    }
    btn.disabled = false;
    if (ok) { form.reset(); status.textContent = 'Message sent. Thank you, I will reply by email.'; }
    else {
      status.className = 'form-status err';
      status.textContent = `The message could not be sent from here. Please email ${settings.email || 'me'} directly.`;
    }
  });
}

/* ---------- boot ---------- */
(async function () {
  const [settings, slides, projs, res, hacks, awards, gal, tl, skills] = await Promise.all([
    loadSettings(), load('slides'), load('projects'), load('research'), load('hackathons'),
    load('awards'), load('gallery'), load('timeline'), load('skills')
  ]);
  applySettings(settings);
  readouts();
  carousel(slides);
  projects(projs);
  research(res);
  hackathons(hacks, awards);
  gallery(gal);
  about(tl, skills);
  contact(settings);
  watchSections();
})().catch(e => console.error('Site failed to load', e));

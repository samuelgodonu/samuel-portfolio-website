import { load } from './data.js';
import { $, $$, esc, paras, img, safeUrl } from './util.js';
import { initShell, reveal } from './shell.js';
import { openLightbox } from './lightbox.js';

initShell();

function ytId(u) {
  try {
    const x = new URL(u); let id = null;
    if (x.hostname === 'youtu.be') id = x.pathname.slice(1);
    else if (x.hostname.endsWith('youtube.com')) {
      if (x.pathname === '/watch') id = x.searchParams.get('v');
      else { const m = x.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/); id = m && m[1]; }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

function videoHTML(url, title) {
  const id = ytId(url);
  if (id) return `<div class="video" data-yt="${id}"><button type="button" style="background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')" aria-label="Play video: ${esc(title)}"><span>Play video</span></button></div>`;
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return `<div class="video"><video controls preload="metadata" src="${esc(safeUrl(url))}"></video></div>`;
  return `<p><a class="btn" href="${esc(safeUrl(url))}" target="_blank" rel="noopener">Watch the video ↗</a></p>`;
}

(async function () {
  const root = $('#project');
  const id = new URLSearchParams(location.search).get('id');
  const items = await load('projects');
  const p = items.find(x => x.id === id);

  if (!p) {
    root.innerHTML = `<a class="crumb" href="index.html#work">← All work</a><h1>Project not found</h1><p class="summary">The link may be old. Go back to the list of projects.</p><a class="btn primary" href="index.html#work">See all work</a>`;
    return;
  }
  document.title = `${p.title} | Samuel Godonu`;

  const links = [];
  if (p.demo) links.push(`<a class="btn primary" href="${esc(safeUrl(p.demo))}">${p.demo.startsWith('simulation') ? 'Open the interactive explorer' : 'Visit the project'}</a>`);
  if (p.github) links.push(`<a class="btn" href="${esc(safeUrl(p.github))}" target="_blank" rel="noopener">GitHub</a>`);

  const files = p.files || [], pics = p.images || [], results = p.results || [];
  const nav = [['overview', 'Overview', true], ['results', 'Results', results.length], ['video', 'Video', p.video], ['pictures', 'Pictures', pics.length], ['files', 'Files', files.length]].filter(n => n[2]);
  const idx = items.findIndex(x => x.id === id), next = items[(idx + 1) % items.length];

  root.innerHTML = `
    <a class="crumb" href="index.html#work">← All work</a>
    <h1>${esc(p.title)}</h1>
    <p class="summary">${esc(p.summary || '')}</p>
    <div class="chips">${[p.role, p.category, p.date].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    ${p.cover ? `<div class="hero-img"><img src="${esc(img(p.cover, 1600))}" alt=""></div>` : ''}
    ${links.length ? `<div class="linkrow">${links.join('')}</div>` : ''}
    ${nav.length > 2 ? `<nav class="subnav" aria-label="On this page">${nav.map(([k, l]) => `<a href="#${k}">${l}</a>`).join('')}</nav>` : ''}

    <div class="cols">
      <div>
        <div class="psec" id="overview"><h2>Overview</h2>${paras(p.content)}
          ${p.limitations ? `<div class="note"><h3>Assumptions and limitations</h3>${paras(p.limitations)}</div>` : ''}</div>
        ${p.video ? `<div class="psec" id="video"><h2>Video</h2>${videoHTML(p.video, p.title)}</div>` : ''}
        ${pics.length ? `<div class="psec" id="pictures"><h2>Pictures</h2><div class="gal-mini">${pics.map((u, i) => `<button type="button" data-i="${i}" aria-label="Enlarge picture ${i + 1}"><img src="${esc(img(u, 500))}" alt="" loading="lazy"></button>`).join('')}</div></div>` : ''}
      </div>
      <aside>
        ${results.length ? `<div class="psec" id="results"><h2>Key results</h2><ul class="ticks">${results.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
        ${(p.tags || []).length ? `<div class="psec"><h2>Tools and topics</h2><div class="tags" style="padding-top:0">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>` : ''}
        ${files.length ? `<div class="psec" id="files"><h2>Files</h2><div class="linkrow" style="flex-direction:column;align-items:flex-start">${files.map(f => `<a class="btn" href="${esc(safeUrl(f.url))}" download>${esc(f.label)}</a>`).join('')}</div></div>` : ''}
      </aside>
    </div>
    ${items.length > 1 ? `<p style="margin-top:3.5rem"><a class="btn" href="project.html?id=${encodeURIComponent(next.id)}">Next project: ${esc(next.title)} →</a></p>` : ''}`;

  // video facade: load YouTube only when the visitor presses play
  const v = $('[data-yt]');
  v?.addEventListener('click', () => {
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0" title="${esc(p.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });
  $('.gal-mini')?.addEventListener('click', e => {
    const b = e.target.closest('button'); if (b) openLightbox(pics.map(u => ({ image: u, caption: '' })), Number(b.dataset.i), b);
  });

  // highlight the current section in the in-page nav
  const links2 = $$('.subnav a');
  if (links2.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) links2.forEach(a => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + en.target.id)));
    }), { rootMargin: '-35% 0px -55% 0px' });
    nav.forEach(([k]) => { const s = document.getElementById(k); if (s) spy.observe(s); });
  }
  reveal();
})().catch(e => { console.error(e); $('#project').innerHTML = '<p>Could not load this project. Refresh the page to try again.</p>'; });

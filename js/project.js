import { load } from './data.js';
import { $, esc, paras, img, safeUrl } from './util.js';
import { initShell } from './shell.js';

initShell();

(async function () {
  const root = $('#project');
  const id = new URLSearchParams(location.search).get('id');
  const items = await load('projects');
  const p = items.find(x => x.id === id);

  if (!p) {
    root.innerHTML = `<a class="crumb" href="index.html#work">← All work</a>
      <h1>Project not found</h1><p class="summary">The link may be old. Go back to the list of projects.</p>
      <a class="btn primary" href="index.html#work">See all work</a>`;
    return;
  }

  document.title = `${p.title} | Samuel Godonu`;
  const links = [];
  if (p.demo) links.push(`<a class="btn primary" href="${esc(safeUrl(p.demo))}">${p.demo.startsWith('simulation') ? 'Open the interactive explorer' : 'Visit the project'}</a>`);
  if (p.github) links.push(`<a class="btn" href="${esc(safeUrl(p.github))}" target="_blank" rel="noopener">GitHub</a>`);
  (p.files || []).forEach(f => links.push(`<a class="btn" href="${esc(safeUrl(f.url))}" download>${esc(f.label)}</a>`));

  const idx = items.findIndex(x => x.id === id);
  const next = items[(idx + 1) % items.length];

  root.innerHTML = `
    <a class="crumb" href="index.html#work">← All work</a>
    <h1>${esc(p.title)}</h1>
    <p class="muted mono" style="font-size:.92rem;margin-bottom:.5rem">${[p.category, p.date].filter(Boolean).map(esc).join(' · ')}</p>
    <p class="summary">${esc(p.summary || '')}</p>
    ${p.cover ? `<div class="frame hero-img"><img src="${esc(img(p.cover, 1600))}" alt=""></div>` : ''}
    ${links.length ? `<div class="linkrow">${links.join('')}</div>` : ''}
    <div class="cols">
      <div>
        <h2>Overview</h2>
        ${paras(p.content)}
        ${p.limitations ? `<div class="note"><h3>Assumptions and limitations</h3>${paras(p.limitations)}</div>` : ''}
      </div>
      <aside>
        ${(p.results || []).length ? `<h2>Key results</h2><ul class="ticks">${p.results.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        ${(p.tags || []).length ? `<h2 style="margin-top:2rem">Tools and topics</h2><div class="tags" style="padding-top:0">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      </aside>
    </div>
    ${(p.images || []).length ? `<div class="gal-mini">${p.images.map(u => `<a href="${esc(img(u, 1800))}" target="_blank" rel="noopener"><img src="${esc(img(u, 500))}" alt="" loading="lazy"></a>`).join('')}</div>` : ''}
    ${items.length > 1 ? `<p style="margin-top:3rem"><a class="btn" href="project.html?id=${encodeURIComponent(next.id)}">Next project: ${esc(next.title)}</a></p>` : ''}`;
})().catch(e => { console.error(e); $('#project').innerHTML = '<p>Could not load this project. Refresh the page to try again.</p>'; });

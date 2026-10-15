import { load, loadSettings } from './data.js';
import { $, esc, safeUrl } from './util.js';
import { initShell } from './shell.js';

initShell();

const item = i => `<div class="sum-item"><b>${esc(i.title)}</b>${i.org ? `<span>${esc(i.org)}</span><br>` : ''}<small>${esc(i.period || i.year || '')}</small>${i.description ? `<p class="muted" style="margin:.2rem 0 0;font-size:.97rem">${esc(i.description)}</p>` : ''}</div>`;

(async function () {
  const [s, tl, projs, sk, aw] = await Promise.all([loadSettings(), load('timeline'), load('projects'), load('skills'), load('awards')]);
  document.title = `2-minute summary | ${s.name}`;
  $('#s-name').textContent = s.name;
  $('#s-sub').textContent = [s.title, s.university].filter(Boolean).join(' · ');
  $('#s-contact').textContent = [s.email, s.location].filter(Boolean).join(' · ');
  $('#s-bio').innerHTML = `<p>${esc(s.bio || '')}</p>`;
  const by = t => tl.filter(i => (i.type || 'Experience') === t);
  $('#s-edu').innerHTML = by('Education').map(item).join('') || '<p class="muted">—</p>';
  $('#s-exp').innerHTML = by('Experience').map(item).join('') || '<p class="muted">—</p>';
  $('#s-lead').innerHTML = by('Leadership').map(item).join('') || '<p class="muted">—</p>';
  const feat = projs.filter(p => p.featured).concat(projs.filter(p => !p.featured)).slice(0, 3);
  $('#s-proj').innerHTML = feat.map(p => `<div class="sum-item"><b><a href="project.html?id=${encodeURIComponent(p.id)}">${esc(p.title)}</a></b><small>${esc([p.role, p.date].filter(Boolean).join(' · '))}</small><p class="muted" style="margin:.2rem 0 0;font-size:.97rem">${esc(p.summary || '')}</p></div>`).join('');
  const groups = {}; sk.forEach(x => (groups[x.category || 'Other'] ||= []).push(x.name));
  $('#s-skills').innerHTML = Object.entries(groups).map(([c, l]) => `<div class="sum-item"><b>${esc(c)}</b><span class="muted">${l.map(esc).join(', ')}</span></div>`).join('');
  $('#s-awards').innerHTML = aw.map(a => `<div class="sum-item"><b>${esc(a.title)}</b><small>${esc([a.issuer, a.year].filter(Boolean).join(' · '))}</small></div>`).join('') || '<p class="muted">—</p>';
  $('#s-links').innerHTML = ['linkedin', 'github', 'website'].filter(k => s[k]).map(k => `<div class="sum-item"><a href="${esc(safeUrl(s[k]))}" target="_blank" rel="noopener">${esc(s[k].replace(/^https?:\/\//, ''))}</a></div>`).join('');
  document.querySelectorAll('[data-resume]').forEach(a => { if (s.resumeUrl) a.href = safeUrl(s.resumeUrl); else a.hidden = true; });
  $('#print-btn').addEventListener('click', () => print());
})().catch(e => console.error(e));

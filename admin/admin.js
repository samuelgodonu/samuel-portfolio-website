import { firebaseEnabled, cloudinary, cloudinaryEnabled } from '../js/config.js';
import { getFirebase, getAuthKit, json } from '../js/data.js';
import { $, $$, esc, slugify, toast, byOrder } from '../js/util.js';

/* ================= Content types ================= */
const PUB = { k: 'published', l: 'Show on site', t: 'bool' };
const ORD = { k: 'order', l: 'Order', t: 'number', help: 'Smaller numbers appear first' };

const COLS = {
  projects: {
    label: 'Projects', single: 'project', title: 'title', sub: 'category', img: 'cover',
    fields: [
      { k: 'id', l: 'Page address', t: 'text', help: 'lowercase-with-dashes, set once', createOnly: true },
      { k: 'title', l: 'Title', t: 'text', req: 1 },
      { k: 'summary', l: 'Short summary', t: 'textarea', req: 1, rows: 3 },
      { k: 'role', l: 'Your role', t: 'text', help: 'e.g. Process modelling and analysis' },
      { k: 'category', l: 'Field or category', t: 'combo', opts: ['Process simulation', 'Design and leadership'], help: 'Type a new field (e.g. Energy systems) and a new filter button appears on the site' },
      { k: 'date', l: 'Date or period', t: 'text', help: 'e.g. 2026 or 2020 – present' },
      { k: 'cover', l: 'Cover image', t: 'image' },
      { k: 'content', l: 'Overview', t: 'textarea', rows: 9, help: 'Blank line = new paragraph' },
      { k: 'results', l: 'Key results', t: 'lines', help: 'One result per line' },
      { k: 'limitations', l: 'Assumptions and limitations', t: 'textarea', rows: 4 },
      { k: 'tags', l: 'Tags', t: 'tags', help: 'Separate with commas' },
      { k: 'video', l: 'Video link', t: 'url', help: 'YouTube link or a .mp4 file' },
      { k: 'demo', l: 'Demo or project link', t: 'url' },
      { k: 'github', l: 'GitHub link', t: 'url' },
      { k: 'files', l: 'Download files', t: 'files', help: 'One per line: Label | link' },
      { k: 'images', l: 'More pictures', t: 'images', help: 'One image link per line' },
      { k: 'featured', l: 'Featured', t: 'bool' }, ORD, PUB
    ]
  },
  slides: {
    label: 'Carousel', single: 'slide', title: 'title', sub: 'subtitle', img: 'image',
    fields: [
      { k: 'title', l: 'Title', t: 'text', req: 1 }, { k: 'subtitle', l: 'Subtitle', t: 'text' },
      { k: 'image', l: 'Image', t: 'image', req: 1 }, { k: 'alt', l: 'Image description', t: 'text', help: 'For screen readers' },
      { k: 'link', l: 'Button link', t: 'url' }, { k: 'linkLabel', l: 'Button text', t: 'text' }, ORD, PUB
    ]
  },
  research: {
    label: 'Research', single: 'research item', title: 'title', sub: 'type',
    fields: [
      { k: 'title', l: 'Title', t: 'text', req: 1 },
      { k: 'type', l: 'Type', t: 'select', opts: ['Simulation study', 'Paper', 'Report', 'Poster', 'Literature review', 'Other'] },
      { k: 'year', l: 'Year', t: 'text' }, { k: 'status', l: 'Status', t: 'text', help: 'e.g. Completed, In progress' },
      { k: 'abstract', l: 'Abstract', t: 'textarea', rows: 6 }, { k: 'link', l: 'Link or file', t: 'url' }, ORD, PUB
    ]
  },
  hackathons: {
    label: 'Hackathons', single: 'hackathon', title: 'name', sub: 'result', img: 'image',
    fields: [
      { k: 'name', l: 'Event name', t: 'text', req: 1 }, { k: 'date', l: 'Date', t: 'text' },
      { k: 'role', l: 'Your role', t: 'text' }, { k: 'result', l: 'Result', t: 'text', help: 'e.g. Certificate of Excellence' },
      { k: 'description', l: 'What happened', t: 'textarea', rows: 5 },
      { k: 'image', l: 'Picture', t: 'image' }, { k: 'link', l: 'Link', t: 'url' }, ORD, PUB
    ]
  },
  societies: {
    label: 'Societies', single: 'society', title: 'name', sub: 'fullName', img: 'logo',
    fields: [
      { k: 'name', l: 'Short name', t: 'text', req: 1, help: 'e.g. SPE' }, { k: 'fullName', l: 'Full name', t: 'text' },
      { k: 'logo', l: 'Logo', t: 'image', help: 'Shown inside a circle' }, { k: 'link', l: 'Website', t: 'url' }, ORD, PUB
    ]
  },
  awards: {
    label: 'Certificates', single: 'certificate or award', title: 'title', sub: 'issuer', img: 'image',
    fields: [
      { k: 'title', l: 'Title', t: 'text', req: 1 }, { k: 'issuer', l: 'Issued by', t: 'text' }, { k: 'year', l: 'Year', t: 'text' },
      { k: 'image', l: 'Picture of the certificate', t: 'image', help: 'Shown inside the card' },
      { k: 'description', l: 'Details', t: 'textarea', rows: 4 }, { k: 'link', l: 'Link', t: 'url' }, ORD, PUB
    ]
  },
  gallery: {
    label: 'Gallery', single: 'picture', title: 'title', sub: 'album', img: 'image',
    fields: [
      { k: 'image', l: 'Picture', t: 'image', req: 1 },
      { k: 'title', l: 'Title of the event or picture', t: 'text', req: 1 },
      { k: 'album', l: 'Album', t: 'combo', opts: ['Lab', 'Designs', 'Events'], help: 'Pick one, or type a new album name' },
      { k: 'description', l: 'Extra details', t: 'textarea', rows: 3 }, ORD, PUB
    ]
  },
  timeline: {
    label: 'Experience', single: 'entry', title: 'title', sub: 'org',
    fields: [
      { k: 'type', l: 'Group', t: 'select', opts: ['Education', 'Experience', 'Leadership'] },
      { k: 'title', l: 'Title or role', t: 'text', req: 1 }, { k: 'org', l: 'Organisation', t: 'text' },
      { k: 'period', l: 'Period', t: 'text', help: 'e.g. Sep 2020 – present' }, { k: 'year', l: 'Start year', t: 'text', req: 1 },
      { k: 'description', l: 'Details', t: 'textarea', rows: 3 }, ORD, PUB
    ]
  },
  skills: {
    label: 'Skills', single: 'skill', title: 'name', sub: 'category',
    fields: [
      { k: 'name', l: 'Skill or tool', t: 'text', req: 1 },
      { k: 'category', l: 'Group', t: 'text', help: 'e.g. Process engineering, Tools' },
      { k: 'level', l: 'Level', t: 'select', opts: ['Learning', 'Working knowledge', 'Strong'] }, ORD, PUB
    ]
  }
};

const SETTINGS_FIELDS = [
  { k: 'name', l: 'Your name', t: 'text', req: 1 },
  { k: 'kicker', l: 'Line above your name', t: 'text' },
  { k: 'status', l: 'Status chip', t: 'text', help: 'e.g. Open to internships' },
  { k: 'roles', l: 'Rotating focus areas', t: 'text', help: 'Comma separated' },
  { k: 'carouselSeconds', l: 'Carousel speed', t: 'number', help: 'Seconds each slide stays, from 2 to 30' },
  { k: 'upcoming', l: 'Upcoming project fields', t: 'text', help: 'Comma separated. Shown as "coming soon" under Work' },
  { k: 'headline', l: 'Homepage headline sentence', t: 'text' },
  { k: 'bio', l: 'Short bio', t: 'textarea', rows: 3 },
  { k: 'story', l: 'About story', t: 'textarea', rows: 10, help: 'Blank line = new paragraph' },
  { k: 'portrait', l: 'Portrait photo', t: 'image' },
  { k: 'portraitFocus', l: 'Portrait focus', t: 'text', help: 'Which part of the photo stays in frame, e.g. 50% 20% (higher second number shows lower part)' },
  { k: 'email', l: 'Public email', t: 'text' },
  { k: 'location', l: 'Location', t: 'text' }, { k: 'university', l: 'University', t: 'text' },
  { k: 'memberships', l: 'Memberships', t: 'text', help: 'Comma separated' },
  { k: 'availability', l: 'Availability line', t: 'text' },
  { k: 'learning', l: 'Currently learning', t: 'text' }, { k: 'building', l: 'Currently building', t: 'text' }, { k: 'reading', l: 'Currently reading', t: 'text' },
  { k: 'resumeUrl', l: 'CV link (PDF)', t: 'url', help: 'Upload the PDF to Cloudinary or place it in the repo and use e.g. files/cv.pdf' },
  { k: 'linkedin', l: 'LinkedIn', t: 'url' }, { k: 'github', l: 'GitHub', t: 'url' }, { k: 'x', l: 'X (Twitter)', t: 'url' },
  { k: 'instagram', l: 'Instagram', t: 'url' }, { k: 'website', l: 'Other website', t: 'url' }
];

/* ================= State ================= */
let fb = null, kit = null, user = null, tab = 'overview', seedErr = '';
const view = $('#view');
const show = id => ['setup', 'login', 'app'].forEach(x => ($('#' + x).hidden = x !== id));

function fail(e) {
  console.error(e);
  const denied = e?.code === 'permission-denied';
  toast(denied ? 'Permission denied. Check that the user ID in firestore.rules matches your account (see Overview).' : (e?.message || 'Something went wrong.'), 'err');
}

/* ================= Data helpers ================= */
const colRef = n => fb.fs.collection(fb.db, n);
async function fetchAll(n) {
  const snap = await fb.fs.getDocs(colRef(n));
  return snap.docs.map(d => ({ ...d.data(), id: d.id })).sort(byOrder);
}

/* ================= Boot ================= */
(async function init() {
  if (!firebaseEnabled) return show('setup');
  fb = await getFirebase(); kit = await getAuthKit();
  if (!fb || !kit) { show('setup'); return; }
  kit.mod.onAuthStateChanged(kit.auth, async u => {
    user = u;
    if (u) {
      show('app'); drawTabs();
      view.innerHTML = '<p class="muted">Loading your content…</p>';
      await autoSeed();
      render();
    } else show('login');
  });
})();

$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, err = $('#login-err'); err.textContent = '';
  try { await kit.mod.signInWithEmailAndPassword(kit.auth, f.email.value.trim(), f.password.value); }
  catch (x) {
    const bad = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];
    err.textContent = bad.includes(x.code) ? 'Email or password is incorrect.' : x.code === 'auth/too-many-requests' ? 'Too many attempts. Wait a few minutes and try again.' : 'Could not sign in. Check your connection and try again.';
  }
});
$('#signout-btn').addEventListener('click', () => kit.mod.signOut(kit.auth));

/* ================= Tabs ================= */
function drawTabs() {
  const tabs = [['overview', 'Overview'], ...Object.entries(COLS).map(([k, c]) => [k, c.label]), ['messages', 'Messages'], ['settings', 'Site settings']];
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button class="tab" type="button" data-tab="${k}" aria-current="${k === tab}">${esc(l)}</button>`).join('');
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  tab = b.dataset.tab; drawTabs(); render(); view.focus();
});

async function render() {
  view.innerHTML = '<p class="muted">Loading…</p>';
  try {
    if (tab === 'overview') await renderOverview();
    else if (tab === 'messages') await renderMessages();
    else if (tab === 'settings') await renderSettings();
    else await renderCollection(tab);
  } catch (e) { fail(e); view.innerHTML = `<p class="err-text">Could not load this section. ${esc(e.code || e.message || '')}</p>`; }
}

/* ================= Overview ================= */
async function renderOverview() {
  const state = await fb.fs.getDoc(fb.fs.doc(fb.db, 'meta', 'state')).catch(() => null);
  const seeded = state?.exists() && state.data().seeded;
  const counts = await Promise.all(Object.keys(COLS).map(async k => [k, (await fb.fs.getDocs(colRef(k))).size]));
  let unread = 0;
  try { unread = (await fb.fs.getDocs(colRef('messages'))).docs.filter(d => !d.data().read).length; } catch { /* rules not set yet */ }
  view.innerHTML = `
    <div class="bar"><h1>Overview</h1><a class="btn" href="../index.html" target="_blank" rel="noopener">View website</a></div>
    ${seeded ? '' : `<div class="note"><h3>Your website is still reading the local files</h3>
      <p>${seedErr ? esc(seedErr) : 'Import the starter content once. After that, everything you edit here appears on the live site.'}</p>
      <button class="btn primary" id="seed-btn" type="button">Import starter content</button></div>`}
    <div class="stat">${counts.map(([k, n]) => `<div><b>${n}</b><span>${esc(COLS[k].label)}</span></div>`).join('')}<div><b>${unread}</b><span>Unread messages</span></div></div>
    <h2 style="font-size:1.2rem;margin-bottom:.6rem">Your user ID</h2>
        <p class="uid">${esc(user.uid)}</p>
    ${seeded ? `<p style="margin-top:2rem"><button class="btn small" id="seed-btn" type="button">Re-import starter content</button> <span class="muted">Overwrites items that have the same ID.</span></p>` : ''}`;
  $('#seed-btn')?.addEventListener('click', seed);
}

// Copies the content of the /data folder into the database (no questions asked).
async function seedNow() {
  const batch = fb.fs.writeBatch(fb.db);
  for (const k of Object.keys(COLS)) {
    const items = await json(k);
    items.forEach(it => { const { id, ...rest } = it; batch.set(fb.fs.doc(fb.db, k, id), rest); });
  }
  batch.set(fb.fs.doc(fb.db, 'settings', 'site'), await json('settings'));
  batch.set(fb.fs.doc(fb.db, 'meta', 'state'), { seeded: true, at: fb.fs.serverTimestamp() });
  await batch.commit();
}

// First sign-in: if the database is still empty, bring your current site content in automatically.
async function autoSeed() {
  seedErr = '';
  try {
    const state = await fb.fs.getDoc(fb.fs.doc(fb.db, 'meta', 'state')).catch(() => null);
    if (state?.exists() && state.data().seeded) return;
    await seedNow();
    toast('Your current site content is now in the dashboard. You can edit, delete or add items.');
  } catch (e) {
    console.error(e);
    seedErr = e?.code === 'permission-denied'
      ? 'The database refused the import. Put your user ID (shown below) into firestore.rules, publish the rules in Firebase (Firestore Database > Rules), wait a minute, then press the button.'
      : `The import did not finish: ${e?.message || 'unknown error'}. Press the button to try again.`;
  }
}

async function seed() {
  if (!confirm('Copy the starter content from the data folder into your database? Items with the same ID will be overwritten.')) return;
  try {
    await seedNow();
    toast('Starter content imported. Your site now reads from the database.');
    render();
  } catch (e) { fail(e); }
}

/* ================= Collection list ================= */
async function renderCollection(key) {
  const c = COLS[key];
  const items = await fetchAll(key);
  view.innerHTML = `
    <div class="bar"><h1>${esc(c.label)}</h1><div class="actions"><button class="btn primary" id="add" type="button">Add ${esc(c.single)}</button></div></div>
    ${items.length ? `<div id="rows">${items.map((it, i) => `
      <div class="row" data-id="${esc(it.id)}">
        ${c.img && it[c.img] ? `<img class="thumb" src="${esc(it[c.img])}" alt="">` : '<span class="thumb"></span>'}
        <div><div class="t">${esc(it[c.title] || '(untitled)')}${it.published === false ? '<span class="pill warn">Hidden</span>' : ''}</div><div class="s">${esc(it[c.sub] || '')}</div></div>
        <div class="ops">
          <button class="btn small" data-a="up" type="button" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>Up</button>
          <button class="btn small" data-a="down" type="button" aria-label="Move down" ${i === items.length - 1 ? 'disabled' : ''}>Down</button>
          <button class="btn small" data-a="edit" type="button">Edit</button>
          <button class="btn small danger" data-a="del" type="button">Delete</button>
        </div>
      </div>`).join('')}</div>`
      : `<div class="empty">No ${esc(c.label.toLowerCase())} yet. Use “Add ${esc(c.single)}”, or import the starter content from Overview.</div>`}`;
  $('#add').addEventListener('click', () => openForm(key, null, items));
  $('#rows')?.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.closest('.row').dataset.id, it = items.find(x => x.id === id);
    if (b.dataset.a === 'edit') openForm(key, it, items);
    else if (b.dataset.a === 'del') {
      if (!confirm(`Delete “${it[c.title] || 'this item'}”? This cannot be undone.`)) return;
      try { await fb.fs.deleteDoc(fb.fs.doc(fb.db, key, id)); toast('Deleted.'); render(); } catch (x) { fail(x); }
    } else move(key, items, id, b.dataset.a === 'up' ? -1 : 1);
  });
}

async function move(key, items, id, dir) {
  const i = items.findIndex(x => x.id === id), j = i + dir;
  if (j < 0 || j >= items.length) return;
  const arr = items.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
  try {
    const batch = fb.fs.writeBatch(fb.db);
    arr.forEach((it, n) => batch.update(fb.fs.doc(fb.db, key, it.id), { order: (n + 1) * 10 }));
    await batch.commit(); render();
  } catch (e) { fail(e); }
}

/* ================= Form dialog ================= */
const dlg = $('#dlg');

function fieldHTML(f, v, editing) {
  const id = 'f_' + f.k, val = v ?? '';
  const label = `<label for="${id}">${esc(f.l)}${f.req ? ' *' : ''}${f.help ? ` <small>${esc(f.help)}</small>` : ''}</label>`;
  let input;
  switch (f.t) {
    case 'bool': return `<div class="fld checkfld"><input type="checkbox" id="${id}" name="${f.k}" ${v !== false && (v || f.k === 'published') ? 'checked' : ''}><label for="${id}" style="font-weight:600">${esc(f.l)}</label></div>`;
    case 'textarea': input = `<textarea id="${id}" name="${f.k}" rows="${f.rows || 4}">${esc(val)}</textarea>`; break;
    case 'number': input = `<input id="${id}" name="${f.k}" type="number" step="1" value="${esc(val)}">`; break;
    case 'select': input = `<select id="${id}" name="${f.k}">${f.opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
    case 'combo': input = `<input id="${id}" name="${f.k}" list="dl_${f.k}" value="${esc(val)}" autocomplete="off"><datalist id="dl_${f.k}">${f.opts.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`; break;
    case 'tags': input = `<input id="${id}" name="${f.k}" value="${esc((v || []).join(', '))}">`; break;
    case 'lines': case 'images': input = `<textarea id="${id}" name="${f.k}" rows="${f.t === 'images' ? 3 : 5}">${esc((v || []).join('\n'))}</textarea>` +
      (f.t === 'images' ? `<div class="line"><input type="file" accept="image/*" multiple data-up-multi="${f.k}" aria-label="Choose pictures to upload"><span class="s muted" data-st="${f.k}"></span></div>` : ''); break;
    case 'files': input = `<textarea id="${id}" name="${f.k}" rows="3">${esc((v || []).map(x => `${x.label} | ${x.url}`).join('\n'))}</textarea>`; break;
    case 'image': input = `<div class="imgfld"><input id="${id}" name="${f.k}" value="${esc(val)}" placeholder="Paste an image link, or upload below">
        <div class="line"><input type="file" accept="image/*" data-up="${f.k}" aria-label="Choose a picture to upload"><span class="muted" data-st="${f.k}"></span></div>
        <img data-prev="${f.k}" alt="" ${val ? `src="${esc(val)}"` : 'hidden'}></div>`; break;
    default: input = `<input id="${id}" name="${f.k}" type="${f.t === 'url' ? 'text' : 'text'}" value="${esc(val)}" ${f.createOnly && editing ? 'disabled' : ''} ${f.t === 'url' ? 'inputmode="url" placeholder="https://… or a file path"' : ''}>`;
  }
  return `<div class="fld">${label}${input}</div>`;
}

async function uploadImage(file) {
  if (!cloudinaryEnabled) throw new Error('Image upload is not set up yet. Paste an image link instead, or add your Cloudinary details to js/config.js.');
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('That picture is over 10 MB. Resize it and try again.');
  const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', cloudinary.uploadPreset);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || 'Upload failed.');
  return j.secure_url;
}

function collect(fields, form) {
  const out = {};
  for (const f of fields) {
    const el = form.elements[f.k]; if (!el) continue;
    switch (f.t) {
      case 'bool': out[f.k] = el.checked; break;
      case 'number': out[f.k] = el.value === '' ? 0 : Number(el.value); break;
      case 'tags': out[f.k] = el.value.split(',').map(s => s.trim()).filter(Boolean); break;
      case 'lines': case 'images': out[f.k] = el.value.split('\n').map(s => s.trim()).filter(Boolean); break;
      case 'files': out[f.k] = el.value.split('\n').map(l => { const [a, ...b] = l.split('|'); const url = b.join('|').trim(); return url ? { label: a.trim() || url, url } : null; }).filter(Boolean); break;
      default: out[f.k] = el.value.trim();
    }
  }
  return out;
}

function openForm(key, item, items = []) {
  const isSettings = key === 'settings';
  const c = isSettings ? { fields: SETTINGS_FIELDS, single: 'settings' } : COLS[key];
  const editing = Boolean(item);
  const fields = c.fields;
  const data = item || (isSettings ? {} : { published: true, order: (items.reduce((m, x) => Math.max(m, Number(x.order) || 0), 0)) + 1 });

  dlg.innerHTML = `<h2 id="dlg-title">${isSettings ? 'Site settings' : (editing ? 'Edit' : 'Add') + ' ' + esc(c.single)}</h2>
    <form id="f" novalidate>${fields.map(f => fieldHTML(f, data[f.k], editing)).join('')}
      <p class="err-text" id="f-err" role="alert"></p>
      <div class="dlg-actions"><button class="btn" type="button" data-cancel>Cancel</button><button class="btn primary" type="submit">Save</button></div>
    </form>`;
  dlg.showModal();

  const form = $('#f', dlg);
  dlg.querySelector('[data-cancel]').addEventListener('click', () => dlg.close());

  dlg.onchange = async e => {
    const single = e.target.dataset?.up, multi = e.target.dataset?.upMulti;
    const k = single || multi; if (!k || !e.target.files.length) return;
    const st = dlg.querySelector(`[data-st="${k}"]`); st.textContent = 'Uploading…';
    try {
      const urls = [];
      for (const file of e.target.files) urls.push(await uploadImage(file));
      if (single) { form.elements[k].value = urls[0]; const p = dlg.querySelector(`[data-prev="${k}"]`); p.src = urls[0]; p.hidden = false; }
      else form.elements[k].value = [form.elements[k].value.trim(), ...urls].filter(Boolean).join('\n');
      st.textContent = 'Uploaded.';
    } catch (x) { st.textContent = ''; $('#f-err', dlg).textContent = x.message; }
    e.target.value = '';
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#f-err', dlg); err.textContent = '';
    const out = collect(fields, form);
    const missing = fields.find(f => f.req && !String(out[f.k] ?? '').trim());
    if (missing) { err.textContent = `${missing.l} is required.`; form.elements[missing.k].focus(); return; }
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true;
    try {
      if (isSettings) await fb.fs.setDoc(fb.fs.doc(fb.db, 'settings', 'site'), out);
      else {
        let id = item?.id;
        if (!id) {
          if (key === 'projects') {
            id = slugify(out.id || out.title);
            if (!id) throw new Error('Add a title or a page address.');
            if ((await fb.fs.getDoc(fb.fs.doc(fb.db, key, id))).exists()) throw new Error('A project with that page address already exists. Change the address.');
          } else id = `${slugify(out[c.title] || key) || key}-${Date.now().toString(36)}`;
        }
        delete out.id;
        await fb.fs.setDoc(fb.fs.doc(fb.db, key, id), out);
      }
      dlg.close(); toast('Saved. The live site updates on the next page load.'); render();
    } catch (x) { err.textContent = x.code === 'permission-denied' ? 'Permission denied. Check the user ID in firestore.rules (see Overview).' : x.message; btn.disabled = false; }
  });
}

/* ================= Settings ================= */
async function renderSettings() {
  const s = await fb.fs.getDoc(fb.fs.doc(fb.db, 'settings', 'site'));
  const cur = s.exists() ? s.data() : await json('settings');
  view.innerHTML = `<div class="bar"><h1>Site settings</h1><button class="btn primary" id="edit-set" type="button">Edit settings</button></div>
    <dl class="readout">${SETTINGS_FIELDS.filter(f => f.t !== 'textarea').map(f => `<div><dt>${esc(f.l)}</dt><dd>${esc(cur[f.k] || '—')}</dd></div>`).join('')}</dl>`;
  $('#edit-set').addEventListener('click', () => openForm('settings', cur));
}

/* ================= Messages ================= */
async function renderMessages() {
  const snap = await fb.fs.getDocs(colRef('messages'));
  const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  view.innerHTML = `<div class="bar"><h1>Messages</h1></div>` + (msgs.length ? msgs.map(m => `
    <div class="msg ${m.read ? '' : 'unread'}" data-id="${esc(m.id)}">
      <div class="t">${esc(m.name)} <span class="muted">· ${esc(m.email)} · ${esc(m.createdAt?.toDate?.().toLocaleString() || '')}</span></div>
      <p>${esc(m.message)}</p>
      <div class="ops" style="display:flex;gap:.4rem;flex-wrap:wrap">
        <a class="btn small" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message')}">Reply by email</a>
        <button class="btn small" data-a="read" type="button">${m.read ? 'Mark unread' : 'Mark read'}</button>
        <button class="btn small danger" data-a="del" type="button">Delete</button>
      </div></div>`).join('') : '<div class="empty">No messages yet. Messages sent through the contact form appear here once the database is connected.</div>');
  view.onclick = async e => {
    const b = e.target.closest('button[data-a]'); if (!b || tab !== 'messages') return;
    const id = b.closest('.msg').dataset.id, m = msgs.find(x => x.id === id);
    try {
      if (b.dataset.a === 'read') await fb.fs.updateDoc(fb.fs.doc(fb.db, 'messages', id), { read: !m.read });
      else if (confirm('Delete this message?')) await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'messages', id));
      else return;
      render();
    } catch (x) { fail(x); }
  };
}

/* ================= Backup ================= */
$('#export-btn').addEventListener('click', async () => {
  try {
    const out = { exportedAt: new Date().toISOString() };
    for (const k of Object.keys(COLS)) out[k] = await fetchAll(k);
    const s = await fb.fs.getDoc(fb.fs.doc(fb.db, 'settings', 'site')); out.settings = s.exists() ? s.data() : {};
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { fail(e); }
});
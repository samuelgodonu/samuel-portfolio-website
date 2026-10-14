import { firebaseConfig, firebaseEnabled } from './config.js';
import { byOrder } from './util.js';

const V = '10.12.2';
const CDN = `https://www.gstatic.com/firebasejs/${V}/`;

let fbP = null;
export function getFirebase() {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (!fbP) {
    fbP = (async () => {
      const [{ initializeApp }, fs] = await Promise.all([
        import(CDN + 'firebase-app.js'),
        import(CDN + 'firebase-firestore.js')
      ]);
      const app = initializeApp(firebaseConfig);
      return { app, fs, db: fs.getFirestore(app) };
    })().catch(e => { console.warn('Firebase unavailable, using local JSON.', e); return null; });
  }
  return fbP;
}

let authP = null;
export function getAuthKit() {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (!authP) {
    authP = (async () => {
      const fb = await getFirebase();
      if (!fb) return null;
      const mod = await import(CDN + 'firebase-auth.js');
      return { mod, auth: mod.getAuth(fb.app) };
    })();
  }
  return authP;
}

// The public site only reads from Firebase after you press "Import starter content"
// in the dashboard. Until then it reads the /data/*.json files.
let liveP = null;
function isLive() {
  if (!liveP) {
    liveP = (async () => {
      const fb = await getFirebase();
      if (!fb) return false;
      try {
        const s = await fb.fs.getDoc(fb.fs.doc(fb.db, 'meta', 'state'));
        return s.exists() && s.data().seeded === true;
      } catch (e) { console.warn(e); return false; }
    })();
  }
  return liveP;
}

export async function json(name) {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`Could not load ${name}.json`);
  return r.json();
}

export async function load(name, { includeHidden = false } = {}) {
  let items = null;
  if (await isLive()) {
    try {
      const fb = await getFirebase();
      const snap = await fb.fs.getDocs(fb.fs.collection(fb.db, name));
      items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) { console.warn(e); }
  }
  if (!items) items = await json(name).catch(() => []);
  return items.filter(i => includeHidden || i.published !== false).sort(byOrder);
}

export async function loadSettings() {
  const base = await json('settings').catch(() => ({}));
  if (await isLive()) {
    try {
      const fb = await getFirebase();
      const s = await fb.fs.getDoc(fb.fs.doc(fb.db, 'settings', 'site'));
      if (s.exists()) return { ...base, ...s.data() };
    } catch (e) { console.warn(e); }
  }
  return base;
}

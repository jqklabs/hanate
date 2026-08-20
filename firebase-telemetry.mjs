/** Firebase Analytics + Firestore 이벤트 로그 (스펙 정의 이벤트만) */
const SDK = '11.6.0';

/** @returns {string} */
function getUid() {
  try {
    let id = localStorage.getItem('hwatro_uid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('hwatro_uid', id);
    }
    return id;
  } catch (_) {
    return 'anon_' + Math.random().toString(36).slice(2, 12);
  }
}

/** @param {Record<string, unknown>} params */
function sanitizeParams(params) {
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(params)) {
    if (n >= 25) break;
    const key = String(k).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    else out[key] = String(v ?? '').slice(0, 100);
    n++;
  }
  return out;
}

/** @param {Record<string, unknown>} config */
export async function setup(config) {
  if (!config?.apiKey || !config?.projectId) return null;

  const { initializeApp } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`
  );
  const { getAnalytics, logEvent, setUserId, isSupported, setDebugModeEnabled } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-analytics.js`
  );
  const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`
  );
  const { getAuth, signInAnonymously } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`
  );

  const app = initializeApp(config);
  const uid = getUid();

  const auth = getAuth(app);
  const db = getFirestore(app);
  let firestoreReady = false;
  try {
    await signInAnonymously(auth);
    firestoreReady = !!auth.currentUser;
  } catch (_) {}

  let analytics = null;
  if (await isSupported()) {
    analytics = getAnalytics(app);
    try {
      const q = new URLSearchParams(globalThis.location?.search || '');
      if (q.get('ga_debug') === '1') setDebugModeEnabled(analytics, true);
    } catch (_) {}
    setUserId(analytics, uid);
  }

  if (!analytics && !firestoreReady) return null;

  /** 최초 1회 — users/{uid} 에 is_invite·og_image·locale 기록 (Rules: read 불가 → getDoc 대신 localStorage) */
  async function registerUser(isInvite, ogImage, locale) {
    if (!firestoreReady) return;
    try {
      if (localStorage.getItem('hwatro_user_reg') === uid) return;
    } catch (_) {}
    try {
      const payload = {
        is_invite: isInvite ? 1 : 0,
        created_at: serverTimestamp(),
      };
      const og = String(ogImage || '').slice(0, 32);
      if (og) payload.og_image = og;
      const loc = String(locale || '').slice(0, 8);
      if (loc === 'kr' || loc === 'en' || loc === 'jp') payload.locale = loc;
      await setDoc(doc(db, 'users', uid), payload);
      try { localStorage.setItem('hwatro_user_reg', uid); } catch (_) {}
    } catch (_) {}
  }

  /** @param {string} name @param {Record<string, unknown>} params */
  function persistFirestore(name, params) {
    if (!firestoreReady) return;
    const clean = sanitizeParams(params);
    addDoc(collection(db, 'events'), {
      uid,
      event: String(name).slice(0, 40),
      params: clean,
      ts: serverTimestamp(),
    }).catch(() => {});
  }

  /** @param {string} name @param {Record<string, unknown>} params */
  function track(name, params) {
    const clean = sanitizeParams(params);
    if (analytics) logEvent(analytics, String(name).slice(0, 40), clean);
    persistFirestore(name, params);
  }

  /** @param {{ durationSec: number, sessionPlaySec: number }} payload */
  function sendRun(payload) {
    track('run_end', {
      duration_sec: payload.durationSec,
      session_play_sec: payload.sessionPlaySec,
    });
  }

  return { track, sendRun, registerUser, uid };
}

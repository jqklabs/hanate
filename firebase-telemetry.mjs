/** Firebase Analytics 런 통계 (index.html UI 레이어에서만 import) */
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

/** @param {Record<string, unknown>} config */
export async function setup(config) {
  if (!config?.apiKey || !config?.projectId) return null;

  const { initializeApp } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`
  );
  const { getAnalytics, logEvent, setUserId, isSupported } = await import(
    `https://www.gstatic.com/firebasejs/${SDK}/firebase-analytics.js`
  );

  const app = initializeApp(config);
  if (!(await isSupported())) return null;

  const analytics = getAnalytics(app);
  const uid = getUid();
  setUserId(analytics, uid);

  /** @param {Record<string, unknown>} payload */
  function sendRun(payload) {
    logEvent(analytics, 'run_end', {
      outcome: String(payload.outcome || ''),
      reason: String(payload.reason || '').slice(0, 100),
      month: Number(payload.month) || 0,
      duration_sec: Number(payload.durationSec) || 0,
      gwang_played: Number(payload.gwangPlayed) || 0,
      go_count: Number(payload.goCount) || 0,
      discards_used: Number(payload.discardsUsed) || 0,
      shop_spent: Number(payload.shopSpent) || 0,
      best_single: Number(payload.bestSingle) || 0,
      total_earned: Number(payload.totalEarned) || 0,
      joker_count: Array.isArray(payload.jokerIds) ? payload.jokerIds.length : 0,
      seed: Number(payload.seed) || 0,
      won: payload.outcome === 'win' ? 1 : 0,
    });
  }

  return { sendRun, uid };
}

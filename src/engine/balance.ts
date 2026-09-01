// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
export const ROUNDS = 12;
export const TARGETS = [160, 240, 340, 500, 740, 1100, 1650, 2500, 3800, 5800, 9000, 14000];
export const JOKER_SLOT_MAX = 5;
export function jokerSlotCount(month) {
  return Math.min(JOKER_SLOT_MAX, Math.max(1, month | 0));
}
export const BOSS_ROUNDS = [3, 6, 9, 12];
export const MILD_BOSSES = ['pibak', 'gwangbak', 'meongbak'];
// 고 무제한: 1~2고는 기존 1.6/2.2, 3고부터 (n-2)² 가속.
// 보너스 ceil(n×m/2). 1~2월만 +1 — 후반 월 비례 인플레는 그대로 두고 초반 주막만 연다.
export const goMult = (n) => {
  const n0 = Math.max(0, n | 0);
  const extra = Math.max(0, n0 - 2);
  return Math.round((1 + 0.6 * n0 + 0.05 * extra * extra) * 100) / 100;
};
export const goBonus = (n, m) => {
  const n0 = n | 0, m0 = m | 0;
  if (n0 <= 0 || m0 <= 0) return 0;
  return Math.ceil(n0 * m0 / 2) + (m0 <= 2 ? 1 : 0);
};
// n고 문턱 점수. 고 선언 시 이미 넘어 있는 문턱은 전부 소급 인정("밀치기 고") —
// 선언 단계는 항상 "아직 못 넘은 첫 문턱"이라 목표 > 현재 점수가 보장되고, 즉시 재충족 연쇄는 불가.
export const goThreshold = (base, n) => Math.ceil(base * goMult(n));
// 현재 점수가 이미 넘은 최대 고 단계 (cur 미만으로는 내려가지 않음)
export const goLevelReached = (base, score, cur = 0) => {
  let k = cur;
  while (score >= goThreshold(base, k + 1)) k++;
  return k;
};


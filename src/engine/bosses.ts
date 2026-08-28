// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
// ── 박 라운드 디버프 6종 ──────────────────────────────────
export const BOSSES = [
  { id: 'pibak',    name: '피박',        desc: '피·쌍피의 카드 칩이 0 (족보 판정에는 카운트)' },
  { id: 'gwangbak', name: '광박',        desc: '광·비광의 카드 칩이 0' },
  { id: 'meongbak', name: '멍박',        desc: '열끗의 카드 칩이 0' },
  { id: 'no_shake', name: '흔들기 금지', desc: '같은 달 2장/3장/총통 족보가 무조합으로 강등 (흔들기 특수패도 무효)' },
  { id: 'bibaram',  name: '비바람',      desc: '이 판 동안 버리기 사용 불가' },
  { id: 'angae',    name: '안개',        desc: '손패 중 2장이 뒷면으로 온다 (내는 순간 공개 · 정렬로 추론 가능)' },
];
export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b]));


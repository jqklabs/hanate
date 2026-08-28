// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { Card, ScoreEnv } from './types';
import { computeScore } from './score';

// ── 손패 최적 조합 탐색 (춘향 훈수 · 봇 시뮬레이션 공용) ────
export function* combosOf(arr, k, start = 0, cur = []) {
  if (cur.length === k) { yield [...cur]; return; }
  for (let i = start; i <= arr.length - (k - cur.length); i++) {
    cur.push(arr[i]);
    yield* combosOf(arr, k, i + 1, cur);
    cur.pop();
  }
}
// 뒷면 카드는 제외하고 1~5장 전 부분집합을 평가
export function evaluateHand(hand, env) {
  const avail = hand.filter((c) => !c.faceDown);
  let best = null;
  for (let k = 1; k <= Math.min(5, avail.length); k++) {
    for (const sub of combosOf(avail, k)) {
      const r = computeScore(sub, env);
      if (!best || r.score > best.score) best = { cards: [...sub], ...r };
    }
  }
  return best;
}


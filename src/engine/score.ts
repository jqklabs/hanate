// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { Card, ScoreEnv, ScoreResult, JokerCtx } from './types';
import { baseChip, effType, oegilTypeMatch } from './cards';
import { detectHandInfo, HAND_BY_ID } from './hands';
import { JOKER_BY_ID } from './jokers';

/** 박으로 실제 잃은 카드 칩. 피박보험이면 0. */
export function bakChipLoss(cards, env) {
  const boss = env.boss;
  if (!boss || !['pibak', 'gwangbak', 'meongbak'].includes(boss)) return 0;
  if ((env.jokerIds || []).includes('pibak_boheom')) return 0;
  const withBak = cards.reduce((s, c) => s + cardChip(c, env), 0);
  const without = cards.reduce((s, c) => s + cardChip(c, { ...env, boss: null }), 0);
  return Math.max(0, without - withBak);
}
export function scoreJokerCtx(cards, handId, core, env) {
  const heldCount = env.heldTotal != null
    ? Math.max(0, env.heldTotal - cards.length)
    : (env.heldCount || 0);
  return {
    cards, handId, core,
    boss: env.boss,
    mitjangChips: env.mitjangChips || 0,
    isFirstPlay: !!env.isFirstPlay,
    isLastPlay: !!env.isLastPlay,
    discardsLeft: env.discardsLeft || 0,
    heldCount,
    geumjulMult: env.geumjulMult || 0,
    gotaryeongMult: env.gotaryeongMult || 0,
    oegilKind: env.oegilKind || null,
  };
}
// ── 카드 1장의 칩 (기본칩 → 거꾸로 ×20 → 이달의 패 ×2 → 박 0) ──
// env: { boss, jokerIds, mitjangChips, seasonMonth?, flatBaseChip?, baseChipMult? }
export function cardChip(c, env) {
  let chip = env.flatBaseChip ? env.flatBaseChip : baseChip(c);
  const t = effType(c);
  const ids = env.jokerIds || [];
  const chipMult = env.baseChipMult || (ids.includes('geokkuro') ? 20 : 1);
  if (chipMult !== 1) chip *= chipMult;
  if (env.seasonMonth && c.month === env.seasonMonth) chip *= 2; // 이달의 패
  if (env.oegilKind && !oegilTypeMatch(c, env.oegilKind)) chip = 0;
  const bakCovered = ids.includes('pibak_boheom') || ids.includes('yeokbak');
  if (!bakCovered) {
    if (env.boss === 'pibak' && (t === 'pi' || t === 'ssangpi')) chip = 0;
    if (env.boss === 'gwangbak' && t === 'kwang') chip = 0;
    if (env.boss === 'meongbak' && t === 'yeol') chip = 0;
  }
  return chip;
}


// ── 점수 계산 (순수 함수 — 프리뷰와 실정산이 공유) ─────────
// 족보 기본칩 없음. (코어 카드칩) × 족보 배수 + 나머지(flat).
// 반환: { handId, chips, mult, flat, score, kwangPlayed }
export function computeScore(cards, env) {
  const biAsNormal = (env.jokerIds || []).includes('bigwang_usan');
  let { handId, core } = detectHandInfo(cards, { biAsNormal });
  if (env.boss === 'no_shake' && ['month2', 'month3', 'chongtong'].includes(handId)) {
    handId = 'none';
    core = [...cards]; // 무조합 강등 시엔 전부 코어 (배수 1이라 결과 동일)
  }
  const hd = HAND_BY_ID[handId];
  let chips = 0;
  let mult = hd.mult;
  if ((env.jokerIds || []).includes('geokkuro')) mult = 1 / hd.mult;
  let flat = 0;

  const coreSet = new Set(core);
  for (const c of cards) {
    const v = cardChip(c, env);
    if (coreSet.has(c)) chips += v; else flat += v;
  }

  const ctx = scoreJokerCtx(cards, handId, core, env);
  // +칩 특수패는 배수 밖(flat)으로만 가산
  for (const id of env.jokerIds) { const j = JOKER_BY_ID[id]; if (j.addChips) flat += j.addChips(ctx); }
  for (const id of env.jokerIds) { const j = JOKER_BY_ID[id]; if (j.addMult)  mult  += j.addMult(ctx); }
  if (env.binjariMult) mult += env.binjariMult;
  for (const id of env.jokerIds) { const j = JOKER_BY_ID[id]; if (j.xMult)    mult  *= j.xMult(ctx); }

  return {
    handId, core, chips, mult, flat,
    score: Math.floor(chips * mult + flat),
    kwangPlayed: cards.filter((c) => c.type === 'kwang').length,
  };
}

/** 해당 특수패가 이번 내기에 기여한 점수 (leave-one-out) */
export function jokerMarginalGain(cards, env, jokerId) {
  if (!env.jokerIds.includes(jokerId)) return 0;
  const withAll = computeScore(cards, env).score;
  const without = computeScore(cards, {
    ...env,
    jokerIds: env.jokerIds.filter((id) => id !== jokerId),
  }).score;
  return withAll - without;
}


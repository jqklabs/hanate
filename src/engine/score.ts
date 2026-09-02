// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { Card, ScoreEnv, ScoreResult, JokerCtx } from './types';
import { baseChip, effType, oegilTypeMatch } from './cards';
import { handCandidates, handRank, HAND_BY_ID } from './hands';
import { JOKER_BY_ID, geoulNeighborIds, mergeScoredMonths } from './jokers';

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
    money: env.money || 0,
    playedHandIds: env.playedHandIds || [],
    gameunNuneMult: env.gameunNuneMult || 0,
    // scoredMonths가 있으면 이번 내기 카드 월을 합쳐 채택(12번째 달에서 바로 금수강산)
    paldoyuramMonths: env.scoredMonths
      ? mergeScoredMonths(env.scoredMonths, cards).length
      : (env.paldoyuramMonths || 0),
  };
}
// ── 카드 1장의 칩 (기본칩 → 뒤집기 ×20 → 이달의 패 ×2 → 박 0) ──
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
// 성립 족보가 여러 개면 최종 점수가 큰 쪽을 채택 (동점이면 HANDS 앞쪽).
// 반환: { handId, chips, mult, flat, score, kwangPlayed }
function scoreFixedHand(cards, env, handId, core) {
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
  const ids = env.jokerIds || [];
  // +칩 특수패는 배수 밖(flat)으로만 가산
  for (const id of ids) { const j = JOKER_BY_ID[id]; if (j?.addChips) flat += j.addChips(ctx); }
  for (const id of ids) { const j = JOKER_BY_ID[id]; if (j?.addMult)  mult  += j.addMult(ctx); }
  if (env.binjariMult) mult += env.binjariMult;
  for (const id of ids) { const j = JOKER_BY_ID[id]; if (j?.xMult)    mult  *= j.xMult(ctx); }
  // 거울 — 양옆을 한 번 더. 거울은 다시 복사하지 않음
  for (const id of geoulNeighborIds(ids)) {
    const j = JOKER_BY_ID[id];
    if (!j) continue;
    if (j.addChips) flat += j.addChips(ctx);
    if (j.addMult) mult += j.addMult(ctx);
    if (j.xMult) mult *= j.xMult(ctx);
  }

  return {
    handId, core, chips, mult, flat,
    score: Math.floor(chips * mult + flat),
    kwangPlayed: cards.filter((c) => c.type === 'kwang').length,
  };
}

export function computeScore(cards, env) {
  const biAsNormal = (env.jokerIds || []).includes('bigwang_usan');
  let cands = handCandidates(cards, { biAsNormal });
  if (env.boss === 'no_shake') {
    cands = cands
      .map((c) => (['month2', 'month3', 'chongtong'].includes(c.handId)
        ? { handId: 'none', core: [...cards] }
        : c))
      // 무조합 강등 중복 제거
      .filter((c, i, arr) => c.handId !== 'none' || arr.findIndex((x) => x.handId === 'none') === i);
  }
  if (!cands.length) cands = [{ handId: 'none', core: [...cards] }];

  let best = null;
  for (const cand of cands) {
    const r = scoreFixedHand(cards, env, cand.handId, cand.core);
    if (!best
      || r.score > best.score
      || (r.score === best.score && handRank(r.handId) < handRank(best.handId))) {
      best = r;
    }
  }
  return best;
}

/** 해당 특수패가 이번 내기에 기여한 점수 (leave-one-out). 암흑은 이득 계산 안 함. */
export function jokerMarginalGain(cards, env, jokerId) {
  if (!env.jokerIds.includes(jokerId)) return 0;
  if (JOKER_BY_ID[jokerId]?.rarity === 'dark') return 0;
  const withAll = computeScore(cards, env).score;
  const without = computeScore(cards, {
    ...env,
    jokerIds: env.jokerIds.filter((id) => id !== jokerId),
  }).score;
  return withAll - without;
}


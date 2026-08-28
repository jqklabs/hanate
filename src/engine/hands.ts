// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { Card, HandInfo } from './types';
import { baseChip, effType, piCount } from './cards';

// ── 족보표 (배열 순서 = 판정 우선순위) ─────────────────────
export const HANDS = [
  { id: 'ogwang',     name: '오광',           mult: 12 },
  { id: 'sagwang',    name: '사광',           mult: 8  },
  { id: 'chongtong',  name: '총통',           mult: 7  },
  { id: 'godori',     name: '고도리',         mult: 6  },
  { id: 'bigodori',   name: '비고도리',       mult: 5  },
  { id: 'samgwang',   name: '삼광',           mult: 5  },
  { id: 'bisamgwang', name: '비삼광',         mult: 4  },
  { id: 'dan',        name: '홍단/청단/초단', mult: 4  },
  { id: 'byeongpung', name: '병풍',           mult: 3  },
  { id: 'month3',     name: '폭탄',           mult: 3  },
  { id: 'yeol3',      name: '열끗 셋',        mult: 3  },
  { id: 'tti3',       name: '띠 셋',          mult: 3  },
  { id: 'pi5',        name: '피 5장',         mult: 2  },
  { id: 'month2',     name: '같은 달 2장',    mult: 2  },
  { id: 'none',       name: '무조합',         mult: 1  },
];
export const HAND_BY_ID = Object.fromEntries(HANDS.map((h) => [h.id, h]));
export const DAN_LABEL = { hongdan: '홍단', cheongdan: '청단', chodan: '초단' };

/** 연출·프리뷰용 표시명 (족보 id/표 이름은 유지) */
export function handDisplayName(handId, core) {
  if (handId === 'month2' && core && core.length)
    return `${core[0].month}월 2장`;
  if (handId === 'dan' && core && core.length) {
    for (const t of ['hongdan', 'cheongdan', 'chodan']) {
      // 비광우산으로 비단이 초단에 섞인 경우도 초단으로 표시
      if (core.every((c) => c.tags.includes(t) || (t === 'chodan' && c.tags.includes('bi_tti'))))
        return DAN_LABEL[t];
    }
  }
  return HAND_BY_ID[handId] ? HAND_BY_ID[handId].name : handId;
}


// ── 족보 판정 (고정 우선순위, 첫 매치) ─────────────────────
// core = 족보를 구성한 카드들 — 이 카드들의 칩만 배수를 타고, 나머지는 배수 없이 가산.
// "N장 이상" 족보(열끗셋·띠셋)는 기본칩 높은 N장만 코어, 초과분은 flat.
export function topByBaseChip(arr, n) {
  return [...arr].sort((a, b) => baseChip(b) - baseChip(a) || a.uid - b.uid).slice(0, n);
}
/** opts.biAsNormal — 비광우산: 12월을 삼광·고도리·초단에 일반패처럼 편입 */
export function detectHandInfo(cards, opts = {}) {
  const biAsNormal = !!opts.biAsNormal;
  const kw = cards.filter((c) => c.type === 'kwang');
  const byMonth = {};
  for (const c of cards) (byMonth[c.month] = byMonth[c.month] || []).push(c);
  const monthGroups = Object.values(byMonth).sort((a, b) => b.length - a.length);
  const maxMonth = monthGroups.length ? monthGroups[0].length : 0;

  if (kw.length === 5) return { handId: 'ogwang', core: kw };
  if (kw.length === 4) return { handId: 'sagwang', core: kw };
  if (maxMonth >= 4) return { handId: 'chongtong', core: monthGroups[0] };
  // 고도리: 우산 있으면 12월 제비도 새 자리로 셈 → 비고도리 대신 고도리
  const birds = cards.filter((c) =>
    c.tags.includes('godori') || (biAsNormal && c.tags.includes('biyeol')));
  if (birds.length === 3) return { handId: 'godori', core: birds };
  // 비고도리: 12월 제비 + 고도리 새 2장 (2·4·8 중 둘) — 우산 없을 때만
  if (!biAsNormal) {
    const swallow = cards.filter((c) => c.tags.includes('biyeol'));
    const godoriOnly = cards.filter((c) => c.tags.includes('godori'));
    if (swallow.length >= 1 && godoriOnly.length >= 2) {
      return { handId: 'bigodori', core: [swallow[0], ...topByBaseChip(godoriOnly, 2)] };
    }
  }
  // 삼광: 우산 있으면 비광 포함도 삼광 (비삼광 아님)
  if (kw.length === 3) {
    const bi = kw.some((c) => c.tags.includes('bikwang'));
    return { handId: (!biAsNormal && bi) ? 'bisamgwang' : 'samgwang', core: kw };
  }
  for (const t of ['hongdan', 'cheongdan', 'chodan']) {
    // 초단: 우산 있으면 비단(12월 띠)도 초단 자리
    const set = cards.filter((c) =>
      c.tags.includes(t) || (biAsNormal && t === 'chodan' && c.tags.includes('bi_tti')));
    if (set.length === 3) return { handId: 'dan', core: set };
  }
  // 병풍: 연속된 달 5개 (스트레이트 · 달마다 칩 최고 1장 코어)
  const monthsAsc = Object.keys(byMonth).map(Number).sort((a, b) => a - b);
  let bestRun = [];
  let run = [];
  for (const m of monthsAsc) {
    if (!run.length || m === run[run.length - 1] + 1) run.push(m);
    else run = [m];
    if (run.length > bestRun.length) bestRun = run;
  }
  if (bestRun.length >= 5) {
    return {
      handId: 'byeongpung',
      core: bestRun.slice(0, 5).map((m) => topByBaseChip(byMonth[m], 1)[0]),
    };
  }
  if (maxMonth >= 3) return { handId: 'month3', core: topByBaseChip(monthGroups[0], 3) };
  const yeol = cards.filter((c) => effType(c) === 'yeol');
  if (yeol.length >= 3) return { handId: 'yeol3', core: topByBaseChip(yeol, 3) };
  // 비단(12월 띠)은 전통 룰대로 띠 셋에서 제외 — 우산 있으면 띠 셋·초단 모두 편입
  const tti = cards.filter((c) =>
    c.type === 'tti' && (!c.tags.includes('bi_tti') || biAsNormal));
  if (tti.length >= 3) return { handId: 'tti3', core: topByBaseChip(tti, 3) };
  // 피5: 쌍피=2 환산 합 ≥5. 피/쌍피만 코어, 나머지(열끗 등)는 flat
  const piCards = cards.filter((c) => piCount(c) > 0);
  if (piCards.reduce((s, c) => s + piCount(c), 0) >= 5)
    return { handId: 'pi5', core: piCards };
  if (maxMonth >= 2) {
    // 짝이 여럿이면 기본칩 합이 높은 쪽을 족보 코어로 (플레이어에게 유리하게, 결정적)
    let best = null, bestSum = -1;
    for (const g of monthGroups) {
      if (g.length < 2) continue;
      const s = g.reduce((a, c) => a + baseChip(c), 0);
      if (s > bestSum) { bestSum = s; best = g; }
    }
    return { handId: 'month2', core: topByBaseChip(best, 2) };
  }
  return { handId: 'none', core: [...cards] };
}
export function detectHand(cards, opts) { return detectHandInfo(cards, opts).handId; }

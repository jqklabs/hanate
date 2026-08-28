// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { Card, CardType, OegilKind } from './types';

// ── 카드 데이터 (한국식 화투 48장) ─────────────────────────
export const MONTHS = [
  { n: 1,  name: '송학'   },
  { n: 2,  name: '매조'   },
  { n: 3,  name: '벚꽃'   },
  { n: 4,  name: '흑싸리' },
  { n: 5,  name: '난초'   },
  { n: 6,  name: '모란'   },
  { n: 7,  name: '홍싸리' },
  { n: 8,  name: '공산'   },
  { n: 9,  name: '국진'   },
  { n: 10, name: '단풍'   },
  { n: 11, name: '오동'   },
  { n: 12, name: '비'     },
];
export function hanjaMonth(n) { return `${n}月`; }

// type: kwang | yeol | tti | ssangpi | pi
// tags: hongdan | cheongdan | chodan | bi_tti | godori | bikwang | biyeol
// art: Assets/ 상대경로 (UI용, 엔진 로직에는 미사용)
export function buildDeck() {
  const d = [];
  const add = (month, type, tags = [], art) =>
    d.push({ month, type, tags, faceDown: false, art });
  add(1, 'kwang', [], 'Assets/01_january/1-gwang.webp');
  add(1, 'tti', ['hongdan'], 'Assets/01_january/1-tti-hongdan.webp');
  add(1, 'pi', [], 'Assets/01_january/1-pi-1.webp');
  add(1, 'pi', [], 'Assets/01_january/1-pi-2.webp');
  add(2, 'yeol', ['godori'], 'Assets/02_february/2-yeolkkeut-warbler.webp');
  add(2, 'tti', ['hongdan'], 'Assets/02_february/2-tti-hongdan.webp');
  add(2, 'pi', [], 'Assets/02_february/2-pi-1.webp');
  add(2, 'pi', [], 'Assets/02_february/2-pi-2.webp');
  add(3, 'kwang', [], 'Assets/03_march/3-gwang.webp');
  add(3, 'tti', ['hongdan'], 'Assets/03_march/3-tti-hongdan.webp');
  add(3, 'pi', [], 'Assets/03_march/3-pi-1.webp');
  add(3, 'pi', [], 'Assets/03_march/3-pi-2.webp');
  add(4, 'yeol', ['godori'], 'Assets/04_april/4-yeolkkeut.webp');
  add(4, 'tti', ['chodan'], 'Assets/04_april/4-tti-chodan.webp?v=2');
  add(4, 'pi', [], 'Assets/04_april/4-pi-1.webp');
  add(4, 'pi', [], 'Assets/04_april/4-pi-2.webp');
  add(5, 'yeol', [], 'Assets/05_may/5-yeolkkeut.webp');
  add(5, 'tti', ['chodan'], 'Assets/05_may/5-tti-chodan.webp?v=2');
  add(5, 'pi', [], 'Assets/05_may/5-pi-1.webp');
  add(5, 'pi', [], 'Assets/05_may/5-pi-2.webp');
  add(6, 'yeol', [], 'Assets/06_june/6-yeolkkeut.webp');
  add(6, 'tti', ['cheongdan'], 'Assets/06_june/6-tti-cheongdan.webp');
  add(6, 'pi', [], 'Assets/06_june/6-pi-1.webp');
  add(6, 'pi', [], 'Assets/06_june/6-pi-2.webp');
  add(7, 'yeol', [], 'Assets/07_july/7-yeolkkeut.webp');
  add(7, 'tti', ['chodan'], 'Assets/07_july/7-tti-chodan.webp?v=2');
  add(7, 'pi', [], 'Assets/07_july/7-pi-1.webp');
  add(7, 'pi', [], 'Assets/07_july/7-pi-2.webp');
  add(8, 'kwang', [], 'Assets/08_august/8-gwang.webp?v=2');
  add(8, 'yeol', ['godori'], 'Assets/08_august/8-yeolkkeut.webp?v=2');
  add(8, 'pi', [], 'Assets/08_august/8-pi-1.webp');
  add(8, 'pi', [], 'Assets/08_august/8-pi-2.webp');
  add(9, 'yeol', [], 'Assets/09_september/9-yeolkkeut.webp');
  add(9, 'tti', ['cheongdan'], 'Assets/09_september/9-tti-cheongdan.webp');
  add(9, 'pi', [], 'Assets/09_september/9-pi-1.webp');
  add(9, 'pi', [], 'Assets/09_september/9-pi-2.webp');
  add(10, 'yeol', [], 'Assets/10_october/10-yeolkkeut.webp');
  add(10, 'tti', ['cheongdan'], 'Assets/10_october/10-tti-cheongdan.webp');
  add(10, 'pi', [], 'Assets/10_october/10-pi-1.webp');
  add(10, 'pi', [], 'Assets/10_october/10-pi-2.webp');
  add(11, 'kwang', [], 'Assets/11_november/11-gwang.webp');
  add(11, 'ssangpi', [], 'Assets/11_november/11-pi-3.webp');
  add(11, 'pi', [], 'Assets/11_november/11-pi-1.webp');
  add(11, 'pi', [], 'Assets/11_november/11-pi-2.webp');
  add(12, 'kwang', ['bikwang'], 'Assets/12_december/12-gwang-umbrella.webp');
  add(12, 'yeol', ['biyeol'], 'Assets/12_december/12-yeolkkeut-swallow.webp');
  add(12, 'tti', ['bi_tti'], 'Assets/12_december/12-tti-bitti.webp');
  add(12, 'ssangpi', [], 'Assets/12_december/12-pi-ssangpi.webp');
  d.forEach((c, i) => (c.uid = i));
  return d;
}

export const CHIP = { kwang: 12, yeol: 8, tti: 6, ssangpi: 5, pi: 2 };
export const effType = (c) => c.type;
export const baseChip = (c) => CHIP[effType(c)];
export const OEGIL_KINDS = ['kwang', 'yeol', 'tti', 'pi'];
export function oegilTypeMatch(c, kind) {
  if (!kind) return true;
  const t = effType(c);
  if (kind === 'pi') return t === 'pi' || t === 'ssangpi';
  return t === kind;
}
export function oegilHandMatch(handId, kind) {
  if (kind === 'kwang') return ['ogwang', 'sagwang', 'samgwang', 'bisamgwang'].includes(handId);
  if (kind === 'yeol') return ['yeol3', 'godori', 'bigodori'].includes(handId);
  if (kind === 'tti') return ['dan', 'tti3'].includes(handId);
  if (kind === 'pi') return handId === 'pi5';
  return false;
}
// 쌍피 = 피 2장 환산 (고스톱 관례). 피5 족보 판정용.
export const piCount = (c) => { const t = effType(c); return t === 'ssangpi' ? 2 : t === 'pi' ? 1 : 0; };


// 맞은편 달: 1↔7, 2↔8, … 6↔12
export function oppositeMonth(m) { return m <= 6 ? m + 6 : m - 6; }
export function hasMatdaePair(cards) {
  const months = new Set(cards.map((c) => c.month));
  for (const m of months) if (months.has(oppositeMonth(m))) return true;
  return false;
}
export function matdaeCards(cards) {
  const months = new Set(cards.map((c) => c.month));
  return cards.filter((c) => months.has(oppositeMonth(c.month)));
}

// @ts-nocheck — 엔진 본문은 기존 JS를 옮긴 것. 시그니처는 types.ts가 정본.
import type { JokerDef, Rarity, RngFn } from './types';
import { effType, oegilHandMatch, hasMatdaePair } from './cards';
import { ROUNDS } from './balance';

// ── 특수패 34종 (커먼 / 레어 / 에픽 / 레전더리 / 암흑) ────
// 오버레이 붓글씨(SSRock)에 없는 한글: 암·묻·잃 등. 제목·패 이름은 있는 글자만.
// 훅 ctx: scoreJokerCtx(...)
export const JOKERS = [
  // ── 커먼 ───────────────────────────────────────────────
  { id: 'gwangpari', name: '광팔이', icon: '💰', rarity: 'common', price: 3, kind: '경제',
    desc: '낸 광 한 장마다 1냥. 한 판에 세 번까지.' },
  { id: 'pi_merchant', name: '피장사', icon: '🧺', rarity: 'common', price: 4, kind: '+점수',
    desc: '낸 피마다 4점, 쌍피마다 8점을 배수 밖에서 더합니다.',
    addChips: (x) => x.cards.reduce((s, c) => s + (effType(c) === 'pi' ? 4 : effType(c) === 'ssangpi' ? 8 : 0), 0) },
  { id: 'meongtta', name: '멍따', icon: '🐂', rarity: 'common', price: 4, kind: '+점수',
    desc: '낸 멍(열끗)마다 6점을 배수 밖에서 더합니다.',
    addChips: (x) => x.cards.filter((c) => effType(c) === 'yeol').length * 6 },
  { id: 'jjokjipge', name: '쪽집게', icon: '🎯', rarity: 'common', price: 4, kind: '+배수',
    desc: '쪽(같은 달 두 장)을 내면 배수가 2 올라갑니다.',
    addMult: (x) => (x.handId === 'month2' ? 2 : 0) },
  { id: 'ssangpi_sarang', name: '쌍피보따리', icon: '🧧', rarity: 'common', price: 4, kind: '+점수',
    desc: '낸 쌍피마다 12점을 배수 밖에서 더합니다.',
    addChips: (x) => x.cards.filter((c) => effType(c) === 'ssangpi').length * 12 },
  { id: 'tti_jjang', name: '띠장수', icon: '🎀', rarity: 'common', price: 4, kind: '+점수',
    desc: '낸 띠마다 5점을 배수 밖에서 더합니다.',
    addChips: (x) => x.cards.filter((c) => effType(c) === 'tti').length * 5 },
  { id: 'cheotsu', name: '첫수', icon: '☝️', rarity: 'common', price: 4, kind: '+배수',
    desc: '그 판의 첫 내기에 배수가 4 올라갑니다.',
    addMult: (x) => (x.isFirstPlay ? 4 : 0) },
  { id: 'janson', name: '잔손', icon: '✋', rarity: 'common', price: 4, kind: '+점수',
    desc: '내기 뒤 손에 남은 장마다 5점을 배수 밖에서 더합니다.',
    addChips: (x) => x.heldCount * 5 },
  { id: 'makpan', name: '막판뒤집기', icon: '🔄', rarity: 'common', price: 4, kind: '+배수',
    desc: '마지막 내기에, 남은 버리기 1회마다 배수가 2 올라갑니다.',
    addMult: (x) => (x.isLastPlay ? x.discardsLeft * 2 : 0) },
  // ── 레어 ───────────────────────────────────────────────
  { id: 'ssakssuri', name: '싹쓸이', icon: '🧹', rarity: 'rare', price: 6, kind: '+점수',
    desc: '다섯 장을 딱 맞춰 내면 35점을 배수 밖에서 더합니다.',
    addChips: (x) => (x.cards.length === 5 ? 35 : 0) },
  { id: 'godori_kkun', name: '고도리꾼', icon: '🐦', rarity: 'rare', price: 6, kind: '+배수',
    desc: '족보에 포함되는 고도리 새(2·4·8월 멍)마다 배수가 3만큼 증가합니다.',
    addMult: (x) => x.core.filter((c) => c.tags.includes('godori')).length * 3 },
  { id: 'dangol', name: '단골', icon: '🏮', rarity: 'rare', price: 7, kind: '+배수',
    desc: '홍단·청단·초단이나 띠셋을 내면 배수가 7 올라갑니다.',
    addMult: (x) => (x.handId === 'dan' || x.handId === 'tti3' ? 7 : 0) },
  { id: 'heundeulgi', name: '흔들기', icon: '🌀', rarity: 'rare', price: 7, kind: '×배수',
    desc: '같은 달을 두 장 이상 내면 배수가 1.5배가 됩니다. 흔들기 금지 판에서는 효과가 없습니다.',
    xMult: (x) => {
      if (x.boss === 'no_shake') return 1;
      const m = {};
      for (const c of x.cards) { m[c.month] = (m[c.month] || 0) + 1; if (m[c.month] >= 2) return 1.5; }
      return 1;
    } },
  { id: 'gwang_sujip', name: '광모이', icon: '🌟', rarity: 'rare', price: 6, kind: '+점수',
    desc: '낸 광마다 10점을 배수 밖에서 더합니다. 비광도 포함됩니다.',
    addChips: (x) => x.cards.filter((c) => c.type === 'kwang').length * 10 },
  { id: 'pi_ohjang', name: '피오장', icon: '🖐️', rarity: 'rare', price: 6, kind: '+배수',
    desc: '피 다섯 장 족보를 내면 배수가 3 올라갑니다.',
    addMult: (x) => (x.handId === 'pi5' ? 3 : 0) },
  { id: 'chodan_aeho', name: '초단꾼', icon: '🌿', rarity: 'rare', price: 6, kind: '+배수',
    desc: '족보에 포함되는 초단마다 배수가 2만큼 증가합니다.',
    addMult: (x) => x.core.filter((c) => c.tags.includes('chodan')).length * 2 },
  { id: 'matdae', name: '맞대', icon: '⚔️', rarity: 'rare', price: 7, kind: '+배수',
    desc: '한 수에 월 차이가 6인 쌍(1–7, 2–8…)이 있으면 배수가 6 올라갑니다.',
    addMult: (x) => (hasMatdaePair(x.cards) ? 6 : 0) },
  { id: 'geumjul', name: '금줄', icon: '🪢', rarity: 'rare', price: 7, kind: '성장',
    desc: '박으로 실제 잃은 칩 10점마다 영구로 배수가 1 올라갑니다. 팔면 초기화됩니다.',
    addMult: (x) => x.geumjulMult },
  { id: 'gotaryeong', name: '고타령', icon: '🥁', rarity: 'rare', price: 7, kind: '성장',
    desc: '고를 두 번 선언할 때마다 영구로 배수가 1 올라갑니다. 팔면 초기화됩니다.',
    addMult: (x) => x.gotaryeongMult },
  // ── 에픽 ───────────────────────────────────────────────
  { id: 'bigwang_usan', name: '비광우산', icon: '☔', rarity: 'epic', price: 9, kind: '×배수',
    desc: '12월 패를 삼광·고도리·초단·띠셋에 쓸 수 있게 해 줍니다(비삼광·비고도리 대신). 족보에 포함되는 12월이 있으면 배수가 2배가 됩니다. 무조합에는 적용되지 않습니다.',
    xMult: (x) => {
      if (x.handId === 'none') return 1;
      return x.core.some((c) => c.month === 12) ? 2 : 1;
    } },
  { id: 'poktan', name: '폭탄', icon: '💥', rarity: 'epic', price: 10, kind: '×배수',
    desc: '폭탄(같은 달 세 장)이나 총통을 내면 배수가 3배가 됩니다.',
    xMult: (x) => (x.handId === 'month3' || x.handId === 'chongtong' ? 3 : 1) },
  { id: 'mitjang', name: '밑장빼기', icon: '🎴', rarity: 'epic', price: 9, kind: '성장',
    desc: '버릴 때마다 영구로 10점이 쌓입니다. 점수는 배수 밖에서 더해지며, 팔면 초기화됩니다.',
    addChips: (x) => x.mitjangChips },
  { id: 'pibak_boheom', name: '피박보험', icon: '🛡️', rarity: 'epic', price: 9, kind: '방어',
    desc: '피박·광박·멍박을 막아 주고, 판을 끝낼 때 냥을 1개 더 받습니다.' },
  { id: 'yeol_janchi', name: '멍잔치', icon: '🍶', rarity: 'epic', price: 10, kind: '×배수',
    desc: '멍셋(열끗 셋)을 내면 배수가 2배가 됩니다.',
    xMult: (x) => (x.handId === 'yeol3' ? 2 : 1) },
  { id: 'samgwang_nori', name: '삼광판', icon: '✨', rarity: 'epic', price: 10, kind: '+배수',
    desc: '족보에 포함되는 광마다 배수가 3만큼 증가합니다. 비광도 포함됩니다.',
    addMult: (x) => x.core.filter((c) => c.type === 'kwang').length * 3 },
  // ── 레전더리 ───────────────────────────────────────────
  { id: 'sipidal', name: '열두사철', icon: '🗓️', rarity: 'legendary', price: 13, kind: '+배수',
    desc: '낸 패에 섞인 달 수마다 배수가 2씩 올라갑니다.',
    addMult: (x) => new Set(x.cards.map((c) => c.month)).size * 2 },
  { id: 'ogwang_kkum', name: '오광소원', icon: '👑', rarity: 'legendary', price: 14, kind: '×배수',
    desc: '광을 세 장 이상 내면 배수가 2.5배가 됩니다. 비광도 포함됩니다.',
    xMult: (x) => (x.cards.filter((c) => c.type === 'kwang').length >= 3 ? 2.5 : 1) },
  { id: 'paewang', name: '명인', icon: '🥋', rarity: 'legendary', price: 15, kind: '×배수',
    desc: '족보가 성립하면 배수가 2배가 됩니다. 무조합에는 적용되지 않습니다.',
    xMult: (x) => (x.handId !== 'none' ? 2 : 1) },
  // ── 암흑 (암흑 주막 전용) ────────────────────────────────
  { id: 'mudgo_double', name: '더블로 가', icon: '♠️', rarity: 'dark', price: 16, kind: '변환',
    desc: '버리기 2회를 줄입니다. 모든 화투패의 기본 칩이 20이 됩니다. 이달의 패 ×2, 박 0은 그 위에 그대로 적용됩니다.' },
  { id: 'binjari', name: '모두가 빈 자리', icon: '◻', rarity: 'dark', price: 18, kind: '올인',
    desc: '사는 즉시 보유 특수패를 전부 반값에 팝니다. 슬롯이 모두 잠기고, 이후 모든 내기에 (팔기 직전 보유 수 × 10) 배수를 더합니다.' },
  { id: 'hansu_allin', name: '한 수 올인', icon: '❶', rarity: 'dark', price: 17, kind: '도박',
    desc: '내기가 1회로 줄어듭니다. 그 내기 배수가 4배가 됩니다.',
    xMult: () => 4 },
  { id: 'geokkuro', name: '거꾸로', icon: '🔃', rarity: 'dark', price: 16, kind: '변환',
    desc: '족보 배수가 역수가 됩니다. 오광 ×12는 ×1/12. 모든 화투패의 기본 칩이 20배가 됩니다. 이달의 패 ×2, 박 0은 그 위에 그대로 적용됩니다.' },
  { id: 'yeokbak', name: '역박', icon: '⚔', rarity: 'dark', price: 17, kind: '도박',
    desc: '피박·광박·멍박의 칩 0을 무시합니다. 그 박 라운드에서는 배수가 2배가 됩니다.',
    xMult: (x) => (x.boss && ['pibak', 'gwangbak', 'meongbak'].includes(x.boss) ? 2 : 1) },
  { id: 'oegil', name: '외길', icon: '一', rarity: 'dark', price: 17, kind: '올인',
    desc: '살 때 광·열끗·띠·피 중 하나를 고릅니다. 그 종류만 칩이 남고 배수가 8배가 됩니다. 그 종류 족보면 한 번 더 2배입니다.',
    xMult: (x) => (x.oegilKind ? (oegilHandMatch(x.handId, x.oegilKind) ? 16 : 8) : 1) },
];
export const JOKER_BY_ID = Object.fromEntries(JOKERS.map((j) => [j.id, j]));
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];
export const RARITY_MONTH_MAX = 14;
export const GOTARYEONG_GOES_PER_MULT = 2;
export function gotaryeongMultFromGoes(goes) {
  return Math.floor(Math.max(0, goes) / GOTARYEONG_GOES_PER_MULT);
}
/** 상점 티어 — 1~14월. t=(m-1)/11 이라 14월은 t≈1.18, 커먼 약 40%. */
export function rarityWeightsForMonth(month) {
  const m = Math.max(1, Math.min(RARITY_MONTH_MAX, month | 0));
  const t = (m - 1) / (ROUNDS - 1);
  const legendary = 0.004 + t * 0.022; // 0.4% → 12월 2.6% → 14월 ~3.0%
  const epic      = 0.025 + t * 0.205;
  const rare      = 0.160 + t * 0.115;
  const common    = 1 - rare - epic - legendary;
  return { common, rare, epic, legendary };
}
export function shopRarityMonth(month, dark) {
  const m = month | 0;
  if (!dark) return Math.max(1, Math.min(ROUNDS, m));
  return Math.max(1, Math.min(RARITY_MONTH_MAX, m + 2));
}
/** 암흑 오퍼 확률. 밤에서 친 고×0.5 + 1 %. */
export function darkOfferChance(nightGo) {
  return ((nightGo | 0) * 0.5 + 1) / 100;
}
export function rollJokerRarity(rngFn, month) {
  const w = rarityWeightsForMonth(month == null ? 1 : month);
  const r = rngFn();
  if (r < w.common) return 'common';
  if (r < w.common + w.rare) return 'rare';
  if (r < w.common + w.rare + w.epic) return 'epic';
  return 'legendary';
}
export function rollShopRarity(rngFn, month, { dark = false, nightGo = 0 } = {}) {
  if (dark && rngFn() < darkOfferChance(nightGo)) return 'dark';
  return rollJokerRarity(rngFn, shopRarityMonth(month, dark));
}


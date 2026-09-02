/** 화투 한 장. uid는 buildDeck이 부여하고, 손패 선택은 이 값으로만 한다. */
export type CardType = 'kwang' | 'yeol' | 'tti' | 'ssangpi' | 'pi';
export type CardTag =
  | 'hongdan' | 'cheongdan' | 'chodan' | 'bi_tti'
  | 'godori' | 'bikwang' | 'biyeol';

export interface Card {
  month: number;
  type: CardType;
  tags: CardTag[] | string[];
  faceDown: boolean;
  art?: string;
  uid?: number;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'dark';
export type OegilKind = 'kwang' | 'yeol' | 'tti' | 'pi';

export interface ScoreEnv {
  boss?: string | null;
  jokerIds?: string[];
  mitjangChips?: number;
  seasonMonth?: number;
  flatBaseChip?: number;
  baseChipMult?: number;
  oegilKind?: OegilKind | null;
  binjariMult?: number;
  heldTotal?: number;
  heldCount?: number;
  isFirstPlay?: boolean;
  isLastPlay?: boolean;
  discardsLeft?: number;
  geumjulMult?: number;
  gotaryeongMult?: number;
  money?: number;
  playedHandIds?: string[];
  gameunNuneMult?: number;
  /** 팔도유람 — 런 중 이미 득점한 월. 있으면 이번 내기 카드와 합쳐 계산. */
  scoredMonths?: number[];
  /** scoredMonths 없을 때 테스트·간이용 월 수 */
  paldoyuramMonths?: number;
}

export interface JokerCtx {
  cards: Card[];
  handId: string;
  core: Card[];
  boss?: string | null;
  mitjangChips: number;
  isFirstPlay: boolean;
  isLastPlay: boolean;
  discardsLeft: number;
  heldCount: number;
  geumjulMult: number;
  gotaryeongMult: number;
  oegilKind: OegilKind | null;
  money: number;
  playedHandIds: string[];
  gameunNuneMult: number;
  paldoyuramMonths: number;
}

export interface JokerDef {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  price: number;
  kind: string;
  desc: string;
  addChips?: (ctx: JokerCtx) => number;
  addMult?: (ctx: JokerCtx) => number;
  xMult?: (ctx: JokerCtx) => number;
}

export interface HandDef {
  id: string;
  name: string;
  mult: number;
}

export interface HandInfo {
  handId: string;
  core: Card[];
}

export interface ScoreResult {
  handId: string;
  core: Card[];
  chips: number;
  mult: number;
  flat: number;
  score: number;
  kwangPlayed: number;
}

export type RngFn = () => number;

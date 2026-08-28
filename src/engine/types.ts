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

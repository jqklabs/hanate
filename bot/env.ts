/** 십이화 헤드리스 환경 — 사람이 고르는 수(패·버리기·고·상점·외길)를 그대로 연다. */
import * as E from '../src/engine/index.ts';
import type { Card, OegilKind } from '../src/engine/types';

export const ACT = {
  TOGGLE0: 0, TOGGLE1: 1, TOGGLE2: 2, TOGGLE3: 3,
  TOGGLE4: 4, TOGGLE5: 5, TOGGLE6: 6, TOGGLE7: 7,
  PLAY: 8,
  DISCARD: 9,
  GO: 10,
  STOP: 11,
  BUY0: 12, BUY1: 13, BUY2: 14,
  REROLL: 15,
  NEXT: 16,
  SELL0: 17, SELL1: 18, SELL2: 19, SELL3: 20, SELL4: 21,
  NIGHT_YES: 22,
  NIGHT_NO: 23,
  OEGIL_KWANG: 24, OEGIL_YEOL: 25, OEGIL_TTI: 26, OEGIL_PI: 27,
  CHUNHYANG: 28,
  BOSS0: 29, BOSS1: 30,
  HINT_PLAY: 31,
  HINT_DISCARD: 32,
} as const;
export const N_ACTIONS = 33;
export const OEGIL_ACT: { act: number; kind: OegilKind }[] = [
  { act: ACT.OEGIL_KWANG, kind: 'kwang' },
  { act: ACT.OEGIL_YEOL, kind: 'yeol' },
  { act: ACT.OEGIL_TTI, kind: 'tti' },
  { act: ACT.OEGIL_PI, kind: 'pi' },
];

export type Phase = 'play' | 'gostop' | 'nightask' | 'shop' | 'oegil' | 'dead' | 'win';

export interface EnvInfo {
  month: number;
  night: boolean;
  go: number;
  death: string | null;
  darkShop: number;
  darkBought: string[];
  jokers: string[];
}

const BOSS_IDS = E.BOSSES.map((b) => b.id);
const JOKER_IDS = E.JOKERS.map((j) => j.id);
const TAGS = ['godori', 'hongdan', 'cheongdan', 'chodan', 'bikwang', 'biyeol', 'bi_tti'] as const;
const TYPES = ['kwang', 'yeol', 'tti', 'ssangpi', 'pi'] as const;
const HAND_IDS = E.HANDS.map((h) => h.id);
const HAND_FEAT = 1 + TYPES.length + 2 + 1 + TAGS.length;
const SHOP_FEAT = 3;
const SEL_FEAT = 3 + HAND_IDS.length;
export const OBS_DIM =
  18 + (BOSS_IDS.length + 1) + JOKER_IDS.length + 8 * HAND_FEAT + 3 * SHOP_FEAT + SEL_FEAT;

function rarityN(r: string) {
  return ({ common: 0.2, rare: 0.4, epic: 0.6, legendary: 0.8, dark: 1 }[r] || 0);
}

type RngBox = { a: number };

function rngFrom(box: RngBox): () => number {
  return () => {
    let a = box.a;
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    box.a = a;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function copyCard(c: Card): Card {
  return { month: c.month, type: c.type, tags: [...c.tags], faceDown: c.faceDown, art: c.art, uid: c.uid };
}

export class HwatuEnv {
  rngBox: RngBox = { a: 1 };
  rng: () => number = () => 0.5;
  phase: Phase = 'play';
  round = 1;
  night = false;
  money = 5;
  jokers: string[] = [];
  jokerPaid: number[] = [];
  oegilKind: OegilKind | null = null;
  binjariMult = 0;
  slotsLocked = false;
  mitjang = 0;
  geumjulLost = 0;
  geumjulMult = 0;
  gotaryeongGoes = 0;
  scoredMonths: number[] = [];
  usedBosses: string[] = [];
  nextBoss: string | null = null;
  bossCandidates: string[] = [];
  boss: string | null = null;
  deck: Card[] = [];
  hand: Card[] = [];
  selected = new Set<number>();
  toggleCount = 0;
  score = 0;
  baseTarget = 0;
  target = 0;
  goLevel = 0;
  playsLeft = 4;
  discardsLeft = 4;
  firstPlay = true;
  playedHandIds: string[] = [];
  gameunNuneMult = 0;
  shopOffers: { id: string; price: number; rarity: string; sold: boolean }[] = [];
  rerollCost = 2;
  darkShop = false;
  nightGo = 0;
  darkShops = 0;
  darkBought: string[] = [];
  death: string | null = null;
  monthsCleared = 0;
  pendingOegil = -1;
  chunhyangNext = false;

  reset(seed: number) {
    this.rngBox = { a: seed >>> 0 };
    this.rng = rngFrom(this.rngBox);
    this.phase = 'play';
    this.round = 1;
    this.night = false;
    this.money = 5;
    this.jokers = [];
    this.jokerPaid = [];
    this.oegilKind = null;
    this.binjariMult = 0;
    this.slotsLocked = false;
    this.mitjang = 0;
    this.geumjulLost = 0;
    this.geumjulMult = 0;
    this.gotaryeongGoes = 0;
    this.scoredMonths = [];
    this.usedBosses = [];
    this.nextBoss = null;
    this.bossCandidates = [];
    this.darkShops = 0;
    this.darkBought = [];
    this.death = null;
    this.monthsCleared = 0;
    this.pendingOegil = -1;
    this.chunhyangNext = false;
    this.playedHandIds = [];
    this.gameunNuneMult = 0;
    this.selected.clear();
    this.toggleCount = 0;
    this.startDay();
    return this.observe();
  }

  clone(): HwatuEnv {
    const e = new HwatuEnv();
    e.rngBox = { a: this.rngBox.a };
    e.rng = rngFrom(e.rngBox);
    e.phase = this.phase;
    e.round = this.round;
    e.night = this.night;
    e.money = this.money;
    e.jokers = [...this.jokers];
    e.jokerPaid = [...this.jokerPaid];
    e.oegilKind = this.oegilKind;
    e.binjariMult = this.binjariMult;
    e.slotsLocked = this.slotsLocked;
    e.mitjang = this.mitjang;
    e.geumjulLost = this.geumjulLost;
    e.geumjulMult = this.geumjulMult;
    e.gotaryeongGoes = this.gotaryeongGoes;
    e.scoredMonths = [...this.scoredMonths];
    e.usedBosses = [...this.usedBosses];
    e.nextBoss = this.nextBoss;
    e.bossCandidates = [...this.bossCandidates];
    e.boss = this.boss;
    e.deck = this.deck.map(copyCard);
    e.hand = this.hand.map(copyCard);
    e.selected = new Set(this.selected);
    e.toggleCount = this.toggleCount;
    e.score = this.score;
    e.baseTarget = this.baseTarget;
    e.target = this.target;
    e.goLevel = this.goLevel;
    e.playsLeft = this.playsLeft;
    e.discardsLeft = this.discardsLeft;
    e.firstPlay = this.firstPlay;
    e.playedHandIds = [...this.playedHandIds];
    e.gameunNuneMult = this.gameunNuneMult;
    e.shopOffers = this.shopOffers.map((o) => ({ ...o }));
    e.rerollCost = this.rerollCost;
    e.darkShop = this.darkShop;
    e.nightGo = this.nightGo;
    e.darkShops = this.darkShops;
    e.darkBought = [...this.darkBought];
    e.death = this.death;
    e.monthsCleared = this.monthsCleared;
    e.pendingOegil = this.pendingOegil;
    e.chunhyangNext = this.chunhyangNext;
    return e;
  }

  private startPlays() {
    return this.jokers.includes('hansu_allin') ? 1 : 4;
  }
  private startDiscards() {
    if (this.boss === 'bibaram') return 0;
    return this.jokers.includes('mudgo_double') ? 2 : 4;
  }
  private refill() {
    while (this.hand.length < 8 && this.deck.length) this.hand.push(this.deck.pop()!);
    this.applyAngae();
  }
  private applyAngae() {
    if (this.boss !== 'angae') return;
    const up = this.hand.filter((c) => !c.faceDown);
    let down = this.hand.filter((c) => c.faceDown).length;
    E.shuffle(up, this.rng);
    for (const c of up) {
      if (down >= 2) break;
      c.faceDown = true;
      down++;
    }
  }
  private env() {
    return {
      boss: this.boss,
      jokerIds: this.jokers,
      mitjangChips: this.mitjang,
      seasonMonth: this.round,
      night: this.night,
      isFirstPlay: this.firstPlay,
      isLastPlay: this.playsLeft === 1,
      discardsLeft: this.discardsLeft,
      heldTotal: this.hand.length,
      geumjulMult: this.jokers.includes('geumjul') ? this.geumjulMult : 0,
      gotaryeongMult: this.jokers.includes('gotaryeong')
        ? E.gotaryeongMultFromGoes(this.gotaryeongGoes) : 0,
      flatBaseChip: this.jokers.includes('mudgo_double') ? 20 : 0,
      baseChipMult: this.jokers.includes('geokkuro') ? 20 : 0,
      oegilKind: this.oegilKind,
      binjariMult: this.binjariMult,
      money: this.money,
      playedHandIds: this.playedHandIds,
      gameunNuneMult: this.jokers.includes('gameun_nun') ? this.gameunNuneMult : 0,
      scoredMonths: this.jokers.includes('paldoyuram') ? this.scoredMonths : undefined,
    };
  }
  private startDay() {
    this.night = false;
    this.darkShop = false;
    this.nightGo = 0;
    this.boss = E.BOSS_ROUNDS.includes(this.round) ? (this.nextBoss || this.pickBoss(this.round)) : null;
    if (this.boss) this.usedBosses.push(this.boss);
    this.nextBoss = null;
    this.bossCandidates = [];
    this.dealTable(E.TARGETS[this.round - 1]);
  }
  private startNight() {
    this.night = true;
    this.darkShop = false;
    this.dealTable(E.TARGETS[this.round - 1] * 2);
  }
  private dealTable(base: number) {
    this.deck = E.shuffle(E.buildDeck(), this.rng);
    this.hand = [];
    this.selected.clear();
    this.toggleCount = 0;
    this.score = 0;
    this.goLevel = 0;
    this.baseTarget = base;
    this.target = base;
    this.playsLeft = this.startPlays();
    this.discardsLeft = this.startDiscards();
    if (this.jokers.includes('morachigi')) {
      const next = E.applyMorachigiResources(this.playsLeft, this.discardsLeft);
      this.playsLeft = next.plays;
      this.discardsLeft = next.discards;
    }
    this.gameunNuneMult = 0;
    this.playedHandIds = [];
    this.firstPlay = true;
    this.refill();
    this.phase = 'play';
  }
  private pickBoss(round: number) {
    const pool = (round === 3 ? E.MILD_BOSSES : BOSS_IDS).filter((id) => !this.usedBosses.includes(id));
    if (!pool.length) return null;
    return pool[Math.floor(this.rng() * pool.length)];
  }
  private cardsLeft() {
    return this.hand.length + this.deck.length;
  }
  private hasDark() {
    return this.jokers.some((id) => E.JOKER_BY_ID[id]?.rarity === 'dark');
  }
  private openSlots() {
    if (this.slotsLocked) return 0;
    return E.jokerSlotCount(this.round);
  }
  picked(): Card[] {
    return this.hand.filter((c) => this.selected.has(c.uid));
  }

  private playCards(cards: Card[]) {
    for (const c of cards) c.faceDown = false;
    const result = E.computeScore(cards, this.env());
    const got = result.score;
    this.score += got;
    if (this.jokers.includes('geumjul')) {
      this.geumjulLost += E.bakChipLoss(cards, this.env());
      this.geumjulMult = Math.floor(this.geumjulLost / 10);
    }
    this.playedHandIds.push(result.handId);
    this.scoredMonths = E.mergeScoredMonths(this.scoredMonths, cards);
    if (this.jokers.includes('gameun_nun')) this.gameunNuneMult = 0;
    this.firstPlay = false;
    const ids = new Set(cards.map((c) => c.uid));
    this.hand = this.hand.filter((c) => !ids.has(c.uid));
    this.selected.clear();
    this.toggleCount = 0;
    this.playsLeft--;
    if (this.score < this.target) this.refill();
    return got;
  }
  private afterClear() {
    if (this.night) {
      this.nightGo = this.goLevel;
      this.darkShop = true;
      this.settle(2);
      this.openShop();
      return 0.8;
    }
    if (this.round >= 2 && this.goLevel >= 3) {
      this.settle(1);
      this.phase = 'nightask';
      return 0.15;
    }
    this.settle(1);
    if (this.round >= E.ROUNDS) {
      this.phase = 'win';
      return 8;
    }
    this.openShop();
    return 0;
  }
  private settle(mul: number) {
    const interest = Math.min(Math.floor(this.money / 6), 3) * mul;
    const base = (E.BOSS_ROUNDS.includes(this.round) ? 5 : 3) * mul;
    const goB = (this.goLevel > 0 ? E.goBonus(this.goLevel, this.round) : 0) * mul;
    const ins = (this.jokers.includes('pibak_boheom') ? 1 : 0) * mul;
    this.money += interest + base + this.playsLeft * mul + goB + ins;
    if (!this.night) this.monthsCleared = this.round;
  }
  private openShop() {
    if (this.night) this.darkShops++;
    this.rerollCost = 2;
    this.shopOffers = this.genOffers();
    this.bossCandidates = [];
    const next = this.round + 1;
    if (E.BOSS_ROUNDS.includes(next)) {
      if (next === E.ROUNDS) {
        const pool = BOSS_IDS.filter((id) => !this.usedBosses.includes(id));
        E.shuffle(pool, this.rng);
        this.bossCandidates = pool.slice(0, 2);
        this.nextBoss = this.bossCandidates[0] || null;
      } else {
        this.nextBoss = this.pickBoss(next);
      }
    }
    this.phase = 'shop';
  }
  private genOffers() {
    const owned = new Set(this.jokers);
    const dark = this.darkShop && !this.hasDark();
    const pool = E.JOKERS.filter((j) => !owned.has(j.id) && (j.rarity !== 'dark' || dark));
    const offers = [];
    for (let i = 0; i < 3; i++) {
      const avail = pool.filter((j) => !offers.some((o) => o.id === j.id));
      if (!avail.length) break;
      const want = E.rollShopRarity(this.rng, this.round, { dark, nightGo: this.nightGo });
      let cands = avail.filter((j) => j.rarity === want);
      if (!cands.length) {
        for (const r of E.RARITY_ORDER) {
          cands = avail.filter((j) => j.rarity === r);
          if (cands.length) break;
        }
      }
      if (!cands.length) cands = avail;
      const j = cands[Math.floor(this.rng() * cands.length)];
      offers.push({ id: j.id, price: j.price, rarity: j.rarity, sold: false });
    }
    return offers;
  }

  legal(): boolean[] {
    const m = Array(N_ACTIONS).fill(false);
    if (this.phase === 'play') {
      const n = this.picked().length;
      for (let i = 0; i < 8; i++) if (this.hand[i] && this.toggleCount < 16) m[ACT.TOGGLE0 + i] = true;
      m[ACT.PLAY] = this.playsLeft > 0 && n >= 1 && n <= 5;
      m[ACT.DISCARD] = this.discardsLeft > 0 && this.deck.length > 0 && n >= 1 && n <= 5;
      m[ACT.HINT_PLAY] = this.playsLeft > 0 && this.hand.some((c) => !c.faceDown);
      m[ACT.HINT_DISCARD] = this.discardsLeft > 0 && this.deck.length > 0 && this.hand.length > 0;
    } else if (this.phase === 'gostop') {
      m[ACT.STOP] = true;
      m[ACT.GO] = this.round !== E.ROUNDS;
    } else if (this.phase === 'nightask') {
      m[ACT.NIGHT_YES] = true;
      m[ACT.NIGHT_NO] = true;
    } else if (this.phase === 'oegil') {
      for (const { act } of OEGIL_ACT) m[act] = true;
    } else if (this.phase === 'shop') {
      m[ACT.NEXT] = true;
      m[ACT.REROLL] = this.money >= this.rerollCost;
      m[ACT.CHUNHYANG] = this.money >= 3 && !this.chunhyangNext;
      if (this.bossCandidates.length) {
        m[ACT.BOSS0] = !!this.bossCandidates[0];
        m[ACT.BOSS1] = !!this.bossCandidates[1];
      }
      const slots = this.openSlots();
      for (let i = 0; i < 3; i++) {
        const o = this.shopOffers[i];
        if (!o || o.sold) continue;
        if (this.jokers.length >= slots) continue;
        if (this.money < o.price) continue;
        if (o.rarity === 'dark' && this.hasDark()) continue;
        m[ACT.BUY0 + i] = true;
      }
      for (let i = 0; i < this.jokers.length && i < 5; i++) m[ACT.SELL0 + i] = true;
    }
    return m;
  }

  step(action: number): { reward: number; done: boolean } {
    if (this.phase === 'dead' || this.phase === 'win') return { reward: 0, done: true };
    const legal = this.legal();
    if (!legal[action]) {
      const fallback = legal.findIndex(Boolean);
      if (fallback < 0) return this.die('stuck');
      action = fallback;
    }
    if (this.phase === 'play') {
      if (action >= ACT.TOGGLE0 && action <= ACT.TOGGLE7) return this.doToggle(action - ACT.TOGGLE0);
      if (action === ACT.HINT_PLAY) return this.doHintPlay();
      if (action === ACT.HINT_DISCARD) return this.doHintDiscard();
      if (action === ACT.DISCARD) return this.doDiscard();
      return this.doPlay();
    }
    if (this.phase === 'gostop') return action === ACT.GO ? this.doGo() : this.doStop();
    if (this.phase === 'nightask') return action === ACT.NIGHT_YES ? this.doNight(true) : this.doNight(false);
    if (this.phase === 'oegil') return this.doOegil(action);
    return this.doShop(action);
  }

  private doToggle(i: number) {
    const c = this.hand[i];
    if (!c) return { reward: -0.02, done: false };
    if (this.selected.has(c.uid)) this.selected.delete(c.uid);
    else this.selected.add(c.uid);
    this.toggleCount++;
    if (this.toggleCount >= 16) {
      this.selected.clear();
      return { reward: -0.15, done: false };
    }
    return { reward: -0.001, done: false };
  }
  private doHintPlay() {
    const best = E.evaluateHand(this.hand, this.env());
    if (!best?.cards?.length) return this.die('empty');
    this.selected = new Set(best.cards.map((c) => c.uid));
    return this.doPlay();
  }
  private doHintDiscard() {
    const best = E.evaluateHand(this.hand, this.env());
    const keep = new Set((best?.cards || []).map((c) => c.uid));
    const junk = this.hand.filter((c) => !keep.has(c.uid) && !c.faceDown)
      .sort((a, b) => E.baseChip(a) - E.baseChip(b)).slice(0, 3);
    if (!junk.length) return { reward: -0.02, done: false };
    this.selected = new Set(junk.map((c) => c.uid));
    return this.doDiscard();
  }
  private doPlay() {
    const cards = this.picked();
    if (!cards.length) return this.die('empty');
    const got = this.playCards(cards);
    let reward = Math.min(0.08, got / Math.max(80, this.target));
    if (this.score >= this.target) {
      if (this.round === E.ROUNDS && !this.night) {
        this.phase = 'win';
        return { reward: reward + 8, done: true };
      }
      this.phase = 'gostop';
      return { reward: reward + 0.2, done: false };
    }
    if (this.playsLeft <= 0 || this.cardsLeft() === 0) {
      return this.die(this.goLevel > 0 ? 'gobak' : 'miss');
    }
    return { reward, done: false };
  }
  private doDiscard() {
    const cards = this.picked();
    if (!cards.length) return { reward: -0.02, done: false };
    this.discardsLeft--;
    if (this.jokers.includes('mitjang')) this.mitjang += 10;
    if (this.jokers.includes('gameun_nun')) {
      const n = cards.filter((c) => c.type === 'kwang').length;
      this.gameunNuneMult = E.gameunNuneXMult(n);
    }
    const drop = new Set(cards.map((c) => c.uid));
    this.hand = this.hand.filter((c) => !drop.has(c.uid));
    this.selected.clear();
    this.toggleCount = 0;
    this.refill();
    return { reward: -0.005, done: false };
  }
  private doGo() {
    const next = E.goLevelReached(this.baseTarget, this.score, this.goLevel) + 1;
    this.goLevel = next;
    this.target = E.goThreshold(this.baseTarget, next);
    this.playsLeft++;
    if (this.jokers.includes('gotaryeong')) this.gotaryeongGoes++;
    this.refill();
    this.selected.clear();
    this.toggleCount = 0;
    if (this.score >= this.target) {
      this.phase = 'gostop';
      return { reward: 0.12, done: false };
    }
    this.phase = 'play';
    return { reward: 0.04 * next, done: false };
  }
  private doStop() {
    const extra = this.afterClear();
    if (this.phase === 'win') return { reward: 1 + extra, done: true };
    return { reward: 0.35 * this.round + extra + (this.goLevel >= 3 ? 0.15 : 0), done: false };
  }
  private doNight(yes: boolean) {
    if (!yes) {
      if (this.round >= E.ROUNDS) {
        this.phase = 'win';
        return { reward: 8, done: true };
      }
      this.openShop();
      return { reward: 0, done: false };
    }
    this.startNight();
    return { reward: 0.2, done: false };
  }
  private doOegil(action: number) {
    const hit = OEGIL_ACT.find((x) => x.act === action);
    const kind = hit?.kind || 'pi';
    const i = this.pendingOegil;
    this.pendingOegil = -1;
    this.phase = 'shop';
    return this.finishBuy(i, kind);
  }
  private finishBuy(i: number, oegilKind: OegilKind | null = null) {
    const o = this.shopOffers[i];
    if (!o || o.sold) return { reward: -0.02, done: false };
    this.money -= o.price;
    o.sold = true;
    this.jokers.push(o.id);
    this.jokerPaid.push(o.price);
    if (o.id === 'oegil') this.oegilKind = oegilKind || 'pi';
    if (o.id === 'binjari') this.applyBinjari();
    if (E.JOKER_BY_ID[o.id]?.rarity === 'dark') this.darkBought.push(o.id);
    const bonus = o.rarity === 'dark' ? 0.9
      : o.rarity === 'legendary' ? 0.35
      : o.rarity === 'epic' ? 0.2
      : o.id === 'pibak_boheom' || o.id === 'heundeulgi' || o.id === 'paewang' ? 0.25
      : 0.08;
    return { reward: bonus, done: false };
  }
  private applyBinjari() {
    const n = this.jokers.length;
    this.binjariMult = n * 10;
    let refund = 0;
    for (const p of this.jokerPaid) refund += Math.floor(p / 2);
    this.money += refund;
    this.jokers = [];
    this.jokerPaid = [];
    this.oegilKind = null;
    this.mitjang = 0;
    this.geumjulLost = 0;
    this.geumjulMult = 0;
    this.gotaryeongGoes = 0;
    this.gameunNuneMult = 0;
    this.playedHandIds = [];
    this.slotsLocked = true;
  }
  private sellJoker(i: number) {
    const id = this.jokers[i];
    if (!id) return { reward: -0.02, done: false };
    this.money += Math.floor(this.jokerPaid[i] / 2);
    if (id === 'mitjang') this.mitjang = 0;
    if (id === 'geumjul') { this.geumjulLost = 0; this.geumjulMult = 0; }
    if (id === 'gotaryeong') this.gotaryeongGoes = 0;
    if (id === 'gameun_nun') this.gameunNuneMult = 0;
    if (id === 'oegil') this.oegilKind = null;
    this.jokers.splice(i, 1);
    this.jokerPaid.splice(i, 1);
    return { reward: 0.02, done: false };
  }
  private doShop(action: number) {
    if (action === ACT.REROLL) {
      this.money -= this.rerollCost;
      this.rerollCost++;
      this.shopOffers = this.genOffers();
      return { reward: -0.02, done: false };
    }
    if (action === ACT.CHUNHYANG) {
      this.money -= 3;
      this.chunhyangNext = true;
      return { reward: -0.02, done: false };
    }
    if (action === ACT.BOSS0 || action === ACT.BOSS1) {
      const b = this.bossCandidates[action === ACT.BOSS0 ? 0 : 1];
      if (b) this.nextBoss = b;
      return { reward: 0, done: false };
    }
    if (action >= ACT.SELL0 && action <= ACT.SELL4) return this.sellJoker(action - ACT.SELL0);
    if (action >= ACT.BUY0 && action <= ACT.BUY2) {
      const i = action - ACT.BUY0;
      const o = this.shopOffers[i];
      if (!o || o.sold) return { reward: -0.02, done: false };
      if (o.id === 'oegil') {
        this.pendingOegil = i;
        this.phase = 'oegil';
        return { reward: 0, done: false };
      }
      return this.finishBuy(i);
    }
    this.round++;
    this.chunhyangNext = false;
    this.startDay();
    return { reward: 0.08 * this.round, done: false };
  }
  private die(reason: string) {
    this.phase = 'dead';
    this.death = reason;
    const pen = reason === 'gobak' ? -1.4 : -1;
    return { reward: pen - (12 - this.monthsCleared) * 0.05, done: true };
  }

  observe(): Float32Array {
    const x = new Float32Array(OBS_DIM);
    let i = 0;
    const put = (v: number) => { x[i++] = v; };
    put(this.round / 12);
    put(this.night ? 1 : 0);
    put(this.score / Math.max(1, this.target));
    put(this.goLevel / 8);
    put(this.playsLeft / 7);
    put(this.discardsLeft / 4);
    put(Math.min(1, this.money / 30));
    put(this.cardsLeft() / 48);
    put(this.baseTarget / 12000);
    put(this.darkShop ? 1 : 0);
    put(this.jokers.length / 5);
    put(this.mitjang / 80);
    put(this.geumjulMult / 8);
    put((this.phase === 'play' ? 0.15 : this.phase === 'gostop' ? 0.3 : this.phase === 'nightask' ? 0.45 : this.phase === 'oegil' ? 0.6 : this.phase === 'shop' ? 0.8 : 1));
    put(this.monthsCleared / 12);
    put(this.rerollCost / 8);
    put(this.selected.size / 5);
    put(this.chunhyangNext ? 1 : 0);

    const bix = this.boss ? BOSS_IDS.indexOf(this.boss) + 1 : 0;
    for (let k = 0; k < BOSS_IDS.length + 1; k++) put(k === bix ? 1 : 0);
    for (const id of JOKER_IDS) put(this.jokers.includes(id) ? 1 : 0);

    for (let h = 0; h < 8; h++) {
      const c = this.hand[h];
      if (!c) { i += HAND_FEAT; continue; }
      put(c.faceDown ? 0 : c.month / 12);
      for (const t of TYPES) put(!c.faceDown && c.type === t ? 1 : 0);
      put(this.selected.has(c.uid) ? 1 : 0);
      put(c.faceDown ? 1 : 0);
      put(c.faceDown ? 0 : E.baseChip(c) / 12);
      for (const t of TAGS) put(!c.faceDown && c.tags.includes(t) ? 1 : 0);
    }
    for (let s = 0; s < 3; s++) {
      const o = this.shopOffers[s];
      if (!o || o.sold || this.phase !== 'shop') { i += SHOP_FEAT; continue; }
      put(rarityN(o.rarity));
      put(o.price / 18);
      put(this.money >= o.price ? 1 : 0);
    }
    const pick = this.picked();
    if (pick.length >= 1 && pick.length <= 5) {
      const r = E.computeScore(pick.map((c) => ({ ...c, faceDown: false })), this.env());
      put(r.score / Math.max(80, this.target));
      put(pick.length / 5);
      put(r.mult / 12);
      const hx = HAND_IDS.indexOf(r.handId);
      for (let h = 0; h < HAND_IDS.length; h++) put(h === hx ? 1 : 0);
    }
    return x;
  }

  info(): EnvInfo {
    return {
      month: this.monthsCleared,
      night: this.night,
      go: this.goLevel,
      death: this.death,
      darkShop: this.darkShops,
      darkBought: [...this.darkBought],
      jokers: [...this.jokers],
    };
  }
}

const SHOP_PRI: Record<string, number> = {
  mudgo_double: 95, geokkuro: 94, yeokbak: 88, hansu_allin: 70, oegil: 60, binjari: 40,
  paewang: 92, geoul: 90, paldoyuram: 86, ogwang_kkum: 84, heundeulgi: 82, pibak_boheom: 80,
  mitjang: 78, gotaryeong: 76, geumjul: 74, dangol: 72, yeol_janchi: 70,
  jaecheong: 69, gameun_nun: 68, poktan: 67, morachigi: 66, godori_kkun: 65, bigwang_usan: 64,
  samgwang_nori: 62, jeondangpo: 58,
  ssakssuri: 55, gwang_sujip: 54, pi_ohjang: 52, chodan_aeho: 50, matdae: 48,
  gwangpari: 40, pi_merchant: 38, meongtta: 36, jjokjipge: 34, ssangpi_sarang: 32,
  tti_jjang: 30, cheotsu: 28, janson: 26, makpan: 24,
};

function playEnv(env: HwatuEnv) {
  return {
    boss: env.boss, jokerIds: env.jokers, mitjangChips: env.mitjang,
    seasonMonth: env.round, night: env.night, isFirstPlay: env.firstPlay,
    isLastPlay: env.playsLeft === 1, discardsLeft: env.discardsLeft,
    heldTotal: env.hand.length, geumjulMult: env.geumjulMult,
    gotaryeongMult: env.jokers.includes('gotaryeong') ? E.gotaryeongMultFromGoes(env.gotaryeongGoes) : 0,
    flatBaseChip: env.jokers.includes('mudgo_double') ? 20 : 0,
    baseChipMult: env.jokers.includes('geokkuro') ? 20 : 0,
    oegilKind: env.oegilKind, binjariMult: env.binjariMult,
    money: env.money,
    playedHandIds: env.playedHandIds,
    gameunNuneMult: env.jokers.includes('gameun_nun') ? env.gameunNuneMult : 0,
    scoredMonths: env.jokers.includes('paldoyuram') ? env.scoredMonths : undefined,
  };
}

/** 한 수 휴리스틱. 검색 없이 빠르게. */
export function cheapAction(env: HwatuEnv): number {
  const m = env.legal();
  if (env.phase === 'play') {
    const best = E.evaluateHand(env.hand, playEnv(env));
    const need = (env.target - env.score) / Math.max(1, env.playsLeft);
    const discard = !!(best && best.score < need && env.deck.length && env.discardsLeft);
    if (discard && m[ACT.HINT_DISCARD]) return ACT.HINT_DISCARD;
    if (m[ACT.HINT_PLAY]) return ACT.HINT_PLAY;
    return m.findIndex(Boolean);
  }
  if (env.phase === 'gostop') {
    if (!m[ACT.GO]) return ACT.STOP;
    const next = E.goLevelReached(env.baseTarget, env.score, env.goLevel) + 1;
    const gap = E.goThreshold(env.baseTarget, next) - env.score;
    const est = E.evaluateHand(env.hand, playEnv(env))?.score || 0;
    const cards = env.hand.length + env.deck.length;
    if (est >= gap && cards >= 8) return ACT.GO;
    if (env.round >= 7 && cards >= 18 && est * 2 >= gap && next <= 3) return ACT.GO;
    return ACT.STOP;
  }
  if (env.phase === 'nightask') {
    if (env.round >= 7 && env.goLevel >= 3 && env.jokers.length >= 2) return ACT.NIGHT_YES;
    return ACT.NIGHT_NO;
  }
  if (env.phase === 'oegil') return cheapOegil(env);
  if (env.phase === 'shop') return cheapShop(env);
  return m.findIndex(Boolean);
}

function cheapOegil(env: HwatuEnv): number {
  const ids = env.jokers.join(' ');
  if (/ogwang|samgwang|gwang_sujip|bikwang/.test(ids)) return ACT.OEGIL_KWANG;
  if (/paewang|paldoyuram|yeol_janchi/.test(ids)) return ACT.OEGIL_YEOL;
  if (/godori|chodan|tti_jjang/.test(ids)) return ACT.OEGIL_TTI;
  return ACT.OEGIL_PI;
}

function cheapShop(env: HwatuEnv): number {
  const m = env.legal();
  if (m[ACT.BOSS0] && !env.nextBoss) return ACT.BOSS0;
  let bestA = -1, bestP = -1;
  for (let i = 0; i < 3; i++) {
    const a = ACT.BUY0 + i;
    if (!m[a]) continue;
    const o = env.shopOffers[i];
    if (!o) continue;
    const dark = E.JOKER_BY_ID[o.id]?.rarity === 'dark';
    const pri = (dark ? 40 : 0) + (SHOP_PRI[o.id] || 15);
    if (pri > bestP) { bestP = pri; bestA = a; }
  }
  if (bestA >= 0) return bestA;
  if (m[ACT.REROLL] && env.round >= 5 && env.money >= env.rerollCost + 10) return ACT.REROLL;
  return ACT.NEXT;
}

function envValue(env: HwatuEnv): number {
  let v = env.monthsCleared * 12 + env.money * 0.12 + env.jokers.length * 1.2;
  for (const id of env.jokers) {
    const dark = E.JOKER_BY_ID[id]?.rarity === 'dark';
    v += ((SHOP_PRI[id] || 10) + (dark ? 40 : 0)) * 0.05;
  }
  if (env.phase === 'win') v += 100;
  if (env.phase === 'dead') v -= 18 + (12 - env.monthsCleared) * 1.4;
  if (env.death === 'gobak') v -= 6;
  v += env.darkShops * 10;
  v += env.goLevel * 0.35;
  return v;
}

function playout(env: HwatuEnv, limit = 48) {
  for (let i = 0; i < limit; i++) {
    if (env.phase === 'dead' || env.phase === 'win') return;
    env.step(cheapAction(env));
  }
}

function pickByValue(cands: { act: number; env: HwatuEnv }[]): number {
  let bestA = cands[0].act, bestV = -Infinity;
  for (const c of cands) {
    const v = envValue(c.env);
    if (v > bestV) { bestV = v; bestA = c.act; }
  }
  return bestA;
}

function searchGo(env: HwatuEnv): number {
  const stopE = env.clone();
  stopE.step(ACT.STOP);
  let stopV: number;
  if (stopE.phase === 'nightask') {
    const y = stopE.clone();
    y.step(ACT.NIGHT_YES);
    playout(y);
    const n = stopE.clone();
    n.step(ACT.NIGHT_NO);
    playout(n);
    stopV = Math.max(envValue(y), envValue(n));
  } else {
    playout(stopE);
    stopV = envValue(stopE);
  }
  const goE = env.clone();
  goE.step(ACT.GO);
  playout(goE);
  return envValue(goE) > stopV ? ACT.GO : ACT.STOP;
}

function searchNight(env: HwatuEnv): number {
  const y = env.clone();
  y.step(ACT.NIGHT_YES);
  playout(y);
  const n = env.clone();
  n.step(ACT.NIGHT_NO);
  playout(n);
  return envValue(y) > envValue(n) ? ACT.NIGHT_YES : ACT.NIGHT_NO;
}

function finishShopOnly(env: HwatuEnv) {
  for (let i = 0; i < 10 && (env.phase === 'shop' || env.phase === 'oegil'); i++) {
    if (env.phase === 'oegil') env.step(cheapOegil(env));
    else {
      const a = cheapShop(env);
      if (a === ACT.NEXT) break;
      env.step(a);
    }
  }
}

function searchShop(env: HwatuEnv): number {
  const m = env.legal();
  const cands: { act: number; env: HwatuEnv }[] = [];
  for (let a = 0; a < N_ACTIONS; a++) {
    if (!m[a]) continue;
    if (a >= ACT.SELL0 && a <= ACT.SELL4) continue;
    if (a === ACT.CHUNHYANG && env.round < 6) continue;
    const c = env.clone();
    c.step(a);
    if (c.phase === 'oegil') {
      let best: HwatuEnv | null = null;
      let bestV = -Infinity;
      for (const { act } of OEGIL_ACT) {
        const d = c.clone();
        d.step(act);
        finishShopOnly(d);
        const v = envValue(d);
        if (v > bestV) { bestV = v; best = d; }
      }
      if (best) cands.push({ act: a, env: best });
    } else {
      finishShopOnly(c);
      cands.push({ act: a, env: c });
    }
  }
  return cands.length ? pickByValue(cands) : ACT.NEXT;
}

function searchOegil(env: HwatuEnv): number {
  const cands: { act: number; env: HwatuEnv }[] = [];
  for (const { act } of OEGIL_ACT) {
    const c = env.clone();
    c.step(act);
    finishShopOnly(c);
    cands.push({ act, env: c });
  }
  return pickByValue(cands);
}

let searchDepth = 0;

/** 그리디 — 검색 없는 한 수. */
export function greedyAction(env: HwatuEnv): number {
  return cheapAction(env);
}

/** 한 수 앞을 시뮬한 선생. 패는 힌트, 고/밤/상점/외길은 클론 플레이아웃. */
export function teacherAction(env: HwatuEnv): number {
  if (searchDepth > 0) return cheapAction(env);
  if (env.phase === 'play') return cheapAction(env);
  searchDepth++;
  try {
    if (env.phase === 'gostop') return env.legal()[ACT.GO] ? searchGo(env) : ACT.STOP;
    if (env.phase === 'nightask') return searchNight(env);
    if (env.phase === 'oegil') return searchOegil(env);
    if (env.phase === 'shop') return searchShop(env);
    return cheapAction(env);
  } finally {
    searchDepth--;
  }
}

import { g } from '../runtime/scope.ts';

/** 판 시작 때 리셋하지 않는 필드 — 여기 순서를 바꾸면 밸런스가 붕괴한다. */
export const PERSIST_ACROSS_ROUND = [
  'money', 'jokers', 'mitjangChips', 'usedBosses',
  'makgeolli', 'stats', 'binjariMult', 'slotsLocked',
] as const;

export class GameState {
  get raw() {
    return g.state;
  }
  get screen() { return g.state.screen; }
  get round() { return g.state.round; }
  get money() { return g.state.money; }
  get hand() { return g.state.hand; }
  get selected() { return g.state.selected; }
}

export const gameState = new GameState();

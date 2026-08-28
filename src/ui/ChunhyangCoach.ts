import { g } from '../runtime/scope.ts';

export class ChunhyangCoach {
  hint() { return g.chunhyangHint(); }
  hover(action: string) { return g.setChunhyangHover(action); }
  clearHover() { return g.clearChunhyangHover(); }
  buyNext() { return g.buyChunhyangNext(); }
}

export const chunhyangCoach = new ChunhyangCoach();

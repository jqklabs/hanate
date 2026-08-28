import { g } from '../runtime/scope.ts';

export class JuiceQueue {
  ms(n: number) { return g.juiceMs(n); }
  wait(n: number) { return g.juiceWait(n); }
}

export const juiceQueue = new JuiceQueue();

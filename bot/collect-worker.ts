/**
 * 롤아웃 워커. train.ts가 stdin/stdout JSON 한 줄로 시킨다.
 */
import { createInterface } from 'node:readline';
import { HwatuEnv, greedyAction, teacherAction } from './env.ts';
import { PolicyNet } from './model.ts';
import { packEpisode, rollout } from './rollout.ts';

let net = new PolicyNet();
let teachP = 0.75;

function reply(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function evalSeeds(kind: 'greedy' | 'teacher' | 'policy', seeds: number[]) {
  const rows = seeds.map((seed) => {
    const env = new HwatuEnv();
    env.reset(seed);
    for (let i = 0; i < 2500; i++) {
      const mask = env.legal();
      let a: number;
      if (kind === 'greedy') a = greedyAction(env);
      else if (kind === 'teacher') a = teacherAction(env);
      else {
        const out = net.forward(env.observe(), mask);
        let best = -1, bp = -1;
        for (let k = 0; k < out.probs.length; k++) if (out.probs[k] > bp) { bp = out.probs[k]; best = k; }
        a = best;
      }
      if (env.step(a).done) break;
    }
    const inf = env.info();
    return {
      month: inf.month,
      dark: inf.darkShop,
      win: env.phase === 'win' ? 1 : 0,
      gobak: inf.death === 'gobak' ? 1 : 0,
    };
  });
  return rows;
}

reply({ t: 'ready' });

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  if (!line.startsWith('{')) return;
  const msg = JSON.parse(line);
  if (msg.t === 'net') {
    net = PolicyNet.fromJSON(msg.net);
    teachP = msg.teachP ?? teachP;
    reply({ t: 'ok' });
    return;
  }
  if (msg.t === 'roll') {
    const eps = (msg.seeds as number[]).map((seed) => packEpisode(rollout(net, seed, teachP)));
    reply({ t: 'eps', eps });
    return;
  }
  if (msg.t === 'teacher') {
    const eps = (msg.seeds as number[]).map((seed) => packEpisode(rollout(null, seed, 1)));
    reply({ t: 'eps', eps });
    return;
  }
  if (msg.t === 'eval') {
    reply({ t: 'eval', rows: evalSeeds(msg.kind, msg.seeds) });
    return;
  }
  reply({ t: 'err', e: 'unknown' });
});

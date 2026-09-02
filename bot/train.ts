/**
 * 십이화 PPO 봇.
 *   npx vite-node bot/train.ts              이어서 학습
 *   npx vite-node bot/train.ts --fresh      처음부터
 *   npx vite-node bot/train.ts --eval       그리디/선생과 비교
 *   npx vite-node bot/train.ts --until-month 10
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { availableParallelism } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { resolve } from 'node:path';
import { HwatuEnv, greedyAction, teacherAction, N_ACTIONS, ACT, OBS_DIM } from './env.ts';
import { PolicyNet, H1, H2 } from './model.ts';
import { dLogSoftmax } from './model.ts';
import { type Step, type Episode, unpackEpisode, rollout } from './rollout.ts';

const WEIGHTS = 'bot/weights.json';
const BEST = 'bot/weights.best.json';
const LOG = 'bot/runs/train.log';
const STATUS = 'bot/runs/status.json';
const GAMMA = 0.99;
const LAMBDA = 0.95;
const CLIP = 0.2;
const ENTROPY = 0.035;
const VF = 0.5;
const LR = 0.00035;
const HORIZON = 1536;
const EPOCHS = 4;
const MINI = 64;
const BC = 0.22;
const DEMO_MAX = 8000;
const DEMO_MIN_MONTH = 6;
const DEMO_BC = 96;

type Demo = { obs: Float32Array; mask: boolean[]; action: number };

function teachPAt(iter: number) {
  return Math.max(0.4, 0.85 - iter * 0.00022);
}

function loadNet(fresh: boolean, fromBest = false) {
  const path = fromBest && existsSync(BEST) ? BEST : WEIGHTS;
  if (!fresh && existsSync(path)) {
    const j = JSON.parse(readFileSync(path, 'utf8'));
    const dim = j.net?.dim;
    const nAct = j.net?.actor?.b?.length;
    const h1 = j.net?.h1 ?? j.net?.l1?.b?.length;
    if (dim === OBS_DIM && nAct === N_ACTIONS && h1 === H1) return PolicyNet.fromJSON(j.net);
  }
  return new PolicyNet();
}
function saveNet(net: PolicyNet, extra: Record<string, unknown> = {}) {
  mkdirSync('bot/runs', { recursive: true });
  writeFileSync(WEIGHTS, JSON.stringify({ net: net.toJSON(), savedAt: new Date().toISOString(), ...extra }));
}

function gae(steps: Step[]) {
  const n = steps.length;
  const adv = new Float32Array(n);
  const ret = new Float32Array(n);
  let a = 0;
  for (let t = n - 1; t >= 0; t--) {
    const nextV = t === n - 1 ? 0 : steps[t + 1].value;
    const nextNon = steps[t].done ? 0 : 1;
    const delta = steps[t].reward + GAMMA * nextV * nextNon - steps[t].value;
    a = delta + GAMMA * LAMBDA * nextNon * a;
    adv[t] = a;
    ret[t] = a + steps[t].value;
  }
  let mean = 0, var_ = 0;
  for (let i = 0; i < n; i++) mean += adv[i];
  mean /= Math.max(1, n);
  for (let i = 0; i < n; i++) var_ += (adv[i] - mean) ** 2;
  const std = Math.sqrt(var_ / Math.max(1, n)) + 1e-6;
  for (let i = 0; i < n; i++) adv[i] = (adv[i] - mean) / std;
  return { adv, ret };
}

function ppoUpdate(net: PolicyNet, batch: Step[]) {
  const { adv, ret } = gae(batch);
  const idx = batch.map((_, i) => i);
  for (let ep = 0; ep < EPOCHS; ep++) {
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    for (let s = 0; s < idx.length; s += MINI) {
      const slice = idx.slice(s, s + MINI);
      for (const k of slice) {
        const st = batch[k];
        const out = net.forward(st.obs, st.mask);
        const ratio = Math.exp(Math.min(8, out.logp[st.action] - st.logp));
        const unclip = ratio * adv[k];
        const clipped = Math.min(Math.max(ratio, 1 - CLIP), 1 + CLIP) * adv[k];
        const useUnclip = unclip < clipped;
        const pgScale = useUnclip ? adv[k] : (ratio > 1 + CLIP || ratio < 1 - CLIP ? 0 : adv[k]);
        const dPol = dLogSoftmax(out.probs, st.action, -pgScale, st.mask);
        let H = 0;
        for (let a = 0; a < N_ACTIONS; a++) {
          if (st.mask[a] && out.probs[a] > 0) H -= out.probs[a] * Math.log(out.probs[a]);
        }
        for (let a = 0; a < N_ACTIONS; a++) {
          if (!st.mask[a]) continue;
          dPol[a] += ENTROPY * out.probs[a] * (Math.log(Math.max(1e-8, out.probs[a])) + H);
        }
        if (st.teacher !== ACT.STOP && st.teacher !== ACT.NIGHT_NO) {
          const dBc = dLogSoftmax(out.probs, st.teacher, -BC, st.mask);
          for (let a = 0; a < N_ACTIONS; a++) dPol[a] += dBc[a];
        }
        const dV = VF * (out.value - ret[k]);
        net.backward(st.obs, { h1: out.h1, h2: out.h2 }, dPol, dV, LR);
      }
    }
  }
}

function remember(demos: Demo[], ep: Episode, minMonth = DEMO_MIN_MONTH) {
  if (ep.info.month < minMonth) return 0;
  const stride = ep.info.month >= 8 ? 1 : 2;
  let n = 0;
  for (let i = 0; i < ep.steps.length; i += stride) {
    const s = ep.steps[i];
    demos.push({ obs: s.obs, mask: s.mask, action: s.action });
    n++;
  }
  if (demos.length > DEMO_MAX) demos.splice(0, demos.length - DEMO_MAX);
  return n;
}

function bcDemos(net: PolicyNet, demos: Demo[], n = DEMO_BC) {
  if (demos.length < 8) return;
  for (let i = 0; i < n; i++) {
    const st = demos[Math.floor(Math.random() * demos.length)];
    const out = net.forward(st.obs, st.mask);
    const d = dLogSoftmax(out.probs, st.action, -0.4, st.mask);
    net.backward(st.obs, { h1: out.h1, h2: out.h2 }, d, 0, LR);
  }
}

type Eval = {
  n: number;
  m2: number; m3: number; m4: number; m6: number; m8: number; m10: number;
  maxMonth: number;
  win: number;
  dark: number;
  gobak: number;
};

function evalFromRows(rows: { month: number; dark: number; win: number; gobak: number }[]): Eval {
  const n = rows.length || 1;
  const months = Array(13).fill(0);
  let dark = 0, win = 0, gobak = 0, maxMonth = 0;
  for (const r of rows) {
    months[r.month]++;
    if (r.month > maxMonth) maxMonth = r.month;
    dark += r.dark ? 1 : 0;
    win += r.win;
    gobak += r.gobak;
  }
  const reach = (m: number) => Math.round(months.slice(m).reduce((a, b) => a + b, 0) / n * 100);
  return {
    n: rows.length, m2: reach(2), m3: reach(3), m4: reach(4), m6: reach(6), m8: reach(8), m10: reach(10),
    maxMonth, win, dark, gobak,
  };
}

function evalLocal(net: PolicyNet | 'greedy' | 'teacher', n: number, seed0 = 100_000): Eval {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const env = new HwatuEnv();
    env.reset(seed0 + i * 7919);
    for (let s = 0; s < 2500; s++) {
      const mask = env.legal();
      let a: number;
      if (net === 'greedy') a = greedyAction(env);
      else if (net === 'teacher') a = teacherAction(env);
      else {
        const out = net.forward(env.observe(), mask);
        let best = -1, bp = -1;
        for (let k = 0; k < out.probs.length; k++) if (out.probs[k] > bp) { bp = out.probs[k]; best = k; }
        a = best;
      }
      if (env.step(a).done) break;
    }
    const inf = env.info();
    rows.push({
      month: inf.month,
      dark: inf.darkShop,
      win: env.phase === 'win' ? 1 : 0,
      gobak: inf.death === 'gobak' ? 1 : 0,
    });
  }
  return evalFromRows(rows);
}

function evalLine(tag: string, e: Eval) {
  return `eval ${tag} 2/3/4/6/8/10월+ ${e.m2}/${e.m3}/${e.m4}/${e.m6}/${e.m8}/${e.m10}% 최심 ${e.maxMonth}월 암흑 ${e.dark} 승 ${e.win}`;
}

function evalScore(e: Eval) {
  return e.m10 * 1e6 + e.maxMonth * 1e4 + e.m8 * 100 + e.m6 * 10 + e.m4;
}

function parseArgs() {
  const a = process.argv.slice(2);
  const num = (flag: string, fallback: number) => {
    const i = a.indexOf(flag);
    if (i < 0) return fallback;
    const v = Number(a[i + 1]);
    return Number.isFinite(v) ? v : fallback;
  };
  const untilMonth = a.includes('--until-month') ? num('--until-month', 10) : 0;
  const cpus = Math.max(1, availableParallelism());
  return {
    fresh: a.includes('--fresh'),
    fromBest: a.includes('--from-best'),
    evalOnly: a.includes('--eval'),
    untilMonth,
    evalEvery: num('--eval-every', 80),
    iters: num('--iters', a.includes('--eval') ? 0 : untilMonth ? 50_000 : 80),
    evalN: num('--eval-n', untilMonth ? 120 : 80),
    workers: num('--workers', Math.min(4, Math.max(0, cpus - 2))),
    pretrain: num('--pretrain', 80),
  };
}

function log(line: string) {
  console.log(line);
  mkdirSync('bot/runs', { recursive: true });
  appendFileSync(LOG, line + '\n');
}

function writeStatus(obj: Record<string, unknown>) {
  mkdirSync('bot/runs', { recursive: true });
  writeFileSync(STATUS, JSON.stringify({ at: new Date().toISOString(), ...obj }, null, 2));
}

type PoolMsg = { t: string; [k: string]: unknown };

class WorkerPool {
  private kids: {
    proc: ChildProcessWithoutNullStreams;
    wait: ((m: PoolMsg) => void) | null;
    queue: PoolMsg[];
  }[] = [];

  constructor(n: number) {
    const bin = resolve('node_modules/.bin/vite-node');
    const script = resolve('bot/collect-worker.ts');
    for (let i = 0; i < n; i++) {
      const proc = spawn(bin, [script], {
        stdio: ['pipe', 'pipe', 'inherit'],
        cwd: process.cwd(),
      }) as ChildProcessWithoutNullStreams;
      const slot: { proc: ChildProcessWithoutNullStreams; wait: ((m: PoolMsg) => void) | null; queue: PoolMsg[] } = {
        proc, wait: null, queue: [],
      };
      const push = (msg: PoolMsg) => {
        if (slot.wait) {
          const w = slot.wait;
          slot.wait = null;
          w(msg);
        } else slot.queue.push(msg);
      };
      const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity });
      rl.on('line', (line) => {
        if (!line.startsWith('{')) return;
        try { push(JSON.parse(line) as PoolMsg); }
        catch { push({ t: 'err', e: 'bad json' }); }
      });
      proc.stdin.on('error', (err) => push({ t: 'err', e: err.message }));
      proc.on('exit', (code) => push({ t: 'err', e: `exit ${code}` }));
      this.kids.push(slot);
    }
  }

  get size() { return this.kids.length; }

  private recv(i: number): Promise<PoolMsg> {
    const slot = this.kids[i];
    if (slot.queue.length) return Promise.resolve(slot.queue.shift()!);
    return new Promise((resolveP, reject) => {
      const t = setTimeout(() => reject(new Error('worker timeout')), 120_000);
      slot.wait = (m) => { clearTimeout(t); resolveP(m); };
    });
  }

  async ready() {
    const msgs = await Promise.all(this.kids.map((_, i) => this.recv(i)));
    for (const m of msgs) {
      if (m.t !== 'ready') throw new Error(`worker handshake ${m.t} ${m.e || ''}`);
    }
  }

  private async send(i: number, msg: unknown): Promise<PoolMsg> {
    const stdin = this.kids[i].proc.stdin;
    if (!stdin.writable) throw new Error('worker stdin closed');
    const line = JSON.stringify(msg) + '\n';
    await new Promise<void>((resolve, reject) => {
      stdin.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const m = await this.recv(i);
    if (m.t === 'err') throw new Error(String(m.e || 'worker err'));
    return m;
  }

  async broadcastNet(net: PolicyNet, teachP: number) {
    const payload = { t: 'net', net: net.toJSON(), teachP };
    await Promise.all(this.kids.map((_, i) => this.send(i, payload)));
  }

  async roll(seeds: number[], teacherOnly = false): Promise<Episode[]> {
    const chunks = split(seeds, this.kids.length);
    const parts = await Promise.all(chunks.map((c, i) => {
      if (!c.length) return Promise.resolve([] as Episode[]);
      return this.send(i, { t: teacherOnly ? 'teacher' : 'roll', seeds: c }).then((m) => {
        if (m.t !== 'eps') throw new Error(String(m.e || m.t));
        return (m.eps as Parameters<typeof unpackEpisode>[0][]).map(unpackEpisode);
      });
    }));
    return parts.flat();
  }

  async eval(kind: 'greedy' | 'teacher' | 'policy', n: number, seed0: number): Promise<Eval> {
    const seeds = Array.from({ length: n }, (_, i) => seed0 + i * 7919);
    const chunks = split(seeds, this.kids.length);
    const parts = await Promise.all(chunks.map((c, i) => {
      if (!c.length) return Promise.resolve([] as { month: number; dark: number; win: number; gobak: number }[]);
      return this.send(i, { t: 'eval', kind, seeds: c }).then((m) => {
        if (m.t !== 'eval') throw new Error(String(m.e || m.t));
        return m.rows as { month: number; dark: number; win: number; gobak: number }[];
      });
    }));
    return evalFromRows(parts.flat());
  }

  kill() {
    for (const k of this.kids) k.proc.kill('SIGTERM');
  }
}

function split<T>(arr: T[], n: number): T[][] {
  const out: T[][] = Array.from({ length: n }, () => []);
  arr.forEach((x, i) => out[i % n].push(x));
  return out;
}

const args = parseArgs();
const net = loadNet(args.fresh, args.fromBest);
const demos: Demo[] = [];
let seed = (Date.now() ^ 0x9e3779b9) >>> 0;
let bestScore = -1;
if (existsSync(BEST)) {
  try {
    const j = JSON.parse(readFileSync(BEST, 'utf8'));
    if (j.eval) bestScore = evalScore(j.eval);
  } catch { /* keep -1 */ }
}
let pool: WorkerPool | null = null;

function nextSeed() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function considerBest(iter: number, e: Eval) {
  const s = evalScore(e);
  if (s <= bestScore) return false;
  bestScore = s;
  writeFileSync(BEST, JSON.stringify({ net: net.toJSON(), savedAt: new Date().toISOString(), iter, eval: e }));
  log(`# best 최심 ${e.maxMonth}월  8/10월+ ${e.m8}/${e.m10}%  it ${iter}`);
  return true;
}

async function collect(nEp: number, teachP: number, teacherOnly = false, syncNet = true): Promise<Episode[]> {
  const seeds = Array.from({ length: nEp }, nextSeed);
  if (pool) {
    try {
      if (!teacherOnly && syncNet) await pool.broadcastNet(net, teachP);
      return await pool.roll(seeds, teacherOnly);
    } catch (e) {
      log(`# worker 실패, 로컬로 이음: ${e instanceof Error ? e.message : e}`);
    }
  }
  return seeds.map((s) => rollout(teacherOnly ? null : net, s, teachP));
}

async function evalN(kind: PolicyNet | 'greedy' | 'teacher', n: number, seed0 = 100_000): Promise<Eval> {
  if (pool && (kind === 'greedy' || kind === 'teacher' || kind === net)) {
    const tag = kind === 'greedy' ? 'greedy' : kind === 'teacher' ? 'teacher' : 'policy';
    try {
      if (tag === 'policy') await pool.broadcastNet(net, 0);
      return await pool.eval(tag, n, seed0);
    } catch (e) {
      log(`# worker 평가 실패, 로컬로 이음: ${e instanceof Error ? e.message : e}`);
    }
  }
  return evalLocal(kind === net ? net : kind, n, seed0);
}

async function trainIters(count: number, startIt: number) {
  let deepest = 0;
  for (let it = 1; it <= count; it++) {
    const batch: Step[] = [];
    const stats = { month: 0, dark: 0, win: 0, ep: 0, ret: 0, maxMonth: 0, demo: 0 };
    const tp = teachPAt(startIt + it);
    if (pool) {
      try { await pool.broadcastNet(net, tp); }
      catch (e) { log(`# worker 실패, 로컬로 이음: ${e instanceof Error ? e.message : e}`); }
    }
    while (batch.length < HORIZON) {
      const need = Math.max(4, Math.ceil((HORIZON - batch.length) / 40));
      const eps = await collect(Math.min(12, need), tp, false, false);
      for (const ep of eps) {
        batch.push(...ep.steps);
        stats.ep++;
        stats.month += ep.info.month;
        if (ep.info.month > stats.maxMonth) stats.maxMonth = ep.info.month;
        if (ep.info.month > deepest) deepest = ep.info.month;
        stats.dark += ep.info.darkShop ? 1 : 0;
        stats.win += ep.info.death ? 0 : (ep.info.month >= 12 ? 1 : 0);
        stats.ret += ep.steps.reduce((s, x) => s + x.reward, 0);
        stats.demo += remember(demos, ep);
      }
    }
    ppoUpdate(net, batch.slice(0, HORIZON + 96));
    bcDemos(net, demos);
    const globalIt = startIt + it;
    if (it % 5 === 0 || it === 1 || it === count) {
      saveNet(net, { iter: globalIt, deepest, demos: demos.length, h: `${H1}/${H2}` });
      log(`it ${globalIt}  ep ${stats.ep}  월평균 ${(stats.month / stats.ep).toFixed(2)}  최심 ${stats.maxMonth}월  암흑 ${stats.dark}/${stats.ep}  보상 ${(stats.ret / stats.ep).toFixed(2)}  스텝 ${batch.length}  시범 ${demos.length}  teach ${tp.toFixed(2)}`);
    }
  }
  return deepest;
}

async function pretrain() {
  if (args.pretrain <= 0) return;
  log(`# bc pretrain games=${args.pretrain}  net ${H1}/${H2}`);
  const eps = await collect(args.pretrain, 1, true);
  let kept = 0, deep = 0;
  for (const ep of eps) {
    kept += remember(demos, ep, 4);
    if (ep.info.month > deep) deep = ep.info.month;
  }
  log(`# bc demos ${demos.length} (kept ${kept}) 선생최심 ${deep}월`);
  const rounds = 50;
  for (let i = 1; i <= rounds; i++) bcDemos(net, demos, 160);
  saveNet(net, { pretrain: args.pretrain, demos: demos.length });
}

async function main() {
  if (args.workers > 0 && !args.evalOnly) {
    pool = new WorkerPool(args.workers);
    await pool.ready();
    log(`# workers ${args.workers}`);
  }

  if (args.evalOnly) {
    const g = await evalN('greedy', args.evalN);
    const t = await evalN('teacher', args.evalN);
    const p = await evalN(net, args.evalN);
    console.log('그리디', g);
    console.log('선생', t);
    console.log('정책망', p);
    pool?.kill();
    return;
  }

  log(`# train start ${new Date().toISOString()} fresh=${args.fresh} iters=${args.iters} until=${args.untilMonth || '-'} net=${H1}/${H2} workers=${args.workers}`);

  await pretrain();

  if (args.untilMonth) {
    const t0 = await evalN('teacher', Math.min(80, args.evalN));
    log(evalLine('선생', t0));
    let total = 0;
    let hit = false;
    while (total < args.iters && !hit) {
      const chunk = Math.min(args.evalEvery, args.iters - total);
      const deep = await trainIters(chunk, total);
      total += chunk;
      const p = await evalN(net, args.evalN);
      log(evalLine('정책망', p));
      considerBest(total, p);
      writeStatus({
        iter: total,
        until: args.untilMonth,
        hit: p.maxMonth >= args.untilMonth || p.m10 > 0,
        trainDeepest: deep,
        demos: demos.length,
        eval: p,
      });
      if (p.maxMonth >= args.untilMonth || p.m10 > 0) {
        hit = true;
        log(`# HIT ${args.untilMonth}월  it ${total}  10월+ ${p.m10}%`);
      }
    }
    const g = await evalN('greedy', args.evalN);
    const p = await evalN(net, args.evalN);
    log(evalLine('그리디', g));
    log(evalLine('정책망', p));
    saveNet(net, { eval: { greedy: g, policy: p }, until: args.untilMonth, hit });
  } else {
    await trainIters(args.iters, 0);
    const g = await evalN('greedy', args.evalN);
    const p = await evalN(net, args.evalN);
    log(evalLine('그리디', g));
    log(evalLine('정책망', p));
    saveNet(net, { eval: { greedy: g, policy: p } });
  }
  pool?.kill();
}

main().catch((err) => {
  console.error(err);
  pool?.kill();
  process.exit(1);
});

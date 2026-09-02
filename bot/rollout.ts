import { HwatuEnv, teacherAction, type EnvInfo } from './env.ts';
import { PolicyNet, sample } from './model.ts';

export const MAX_STEPS = 2500;

export type Step = {
  obs: Float32Array;
  mask: boolean[];
  action: number;
  logp: number;
  value: number;
  reward: number;
  done: boolean;
  teacher: number;
};

export type PackedStep = {
  obs: number[];
  mask: boolean[];
  action: number;
  logp: number;
  value: number;
  reward: number;
  done: boolean;
  teacher: number;
};

export type Episode = { steps: Step[]; info: EnvInfo };
export type PackedEpisode = { steps: PackedStep[]; info: EnvInfo };

export function packEpisode(ep: Episode): PackedEpisode {
  return {
    info: ep.info,
    steps: ep.steps.map((s) => ({
      obs: Array.from(s.obs),
      mask: s.mask,
      action: s.action,
      logp: s.logp,
      value: s.value,
      reward: s.reward,
      done: s.done,
      teacher: s.teacher,
    })),
  };
}

export function unpackEpisode(ep: PackedEpisode): Episode {
  return {
    info: ep.info,
    steps: ep.steps.map((s) => ({
      obs: Float32Array.from(s.obs),
      mask: s.mask,
      action: s.action,
      logp: s.logp,
      value: s.value,
      reward: s.reward,
      done: s.done,
      teacher: s.teacher,
    })),
  };
}

export function rollout(net: PolicyNet | null, seed: number, teachP: number): Episode {
  const env = new HwatuEnv();
  env.reset(seed);
  const steps: Step[] = [];
  while (steps.length < MAX_STEPS) {
    const obs = env.observe();
    const mask = env.legal();
    const teacher = teacherAction(env);
    let action = teacher;
    let logp = 0;
    let value = 0;
    if (net) {
      const out = net.forward(obs, mask);
      const forceTeach = env.phase !== 'gostop' && env.phase !== 'nightask' && Math.random() < teachP;
      action = forceTeach ? teacher : sample(out.probs);
      logp = out.logp[action];
      value = out.value;
    }
    const { reward, done } = env.step(action);
    steps.push({ obs, mask, action, logp, value, reward, done, teacher });
    if (done) break;
  }
  return { steps, info: env.info() };
}

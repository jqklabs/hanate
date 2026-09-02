/** 작은 MLP 정책/가치망 + Adam. 엔진 밖에서만 쓴다. */
import { N_ACTIONS, OBS_DIM } from './env.ts';

export const H1 = 256;
export const H2 = 128;

function randn() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function xavier(nIn: number, nOut: number) {
  const s = Math.sqrt(2 / (nIn + nOut));
  const w = new Float32Array(nIn * nOut);
  for (let i = 0; i < w.length; i++) w[i] = randn() * s;
  return w;
}

class Dense {
  w: Float32Array;
  b: Float32Array;
  mw: Float32Array;
  vw: Float32Array;
  mb: Float32Array;
  vb: Float32Array;
  constructor(public nIn: number, public nOut: number) {
    this.w = xavier(nIn, nOut);
    this.b = new Float32Array(nOut);
    this.mw = new Float32Array(this.w.length);
    this.vw = new Float32Array(this.w.length);
    this.mb = new Float32Array(nOut);
    this.vb = new Float32Array(nOut);
  }
  forward(x: Float32Array, y: Float32Array) {
    const { nIn, nOut, w, b } = this;
    for (let o = 0; o < nOut; o++) {
      let s = b[o];
      const off = o * nIn;
      for (let i = 0; i < nIn; i++) s += w[off + i] * x[i];
      y[o] = s;
    }
    return y;
  }
  backward(x: Float32Array, dY: Float32Array, dX: Float32Array | null, lr: number, t: number, b1 = 0.9, b2 = 0.999) {
    const { nIn, nOut, w, b } = this;
    if (dX) dX.fill(0);
    const c1 = 1 - b1 ** t, c2 = 1 - b2 ** t;
    for (let o = 0; o < nOut; o++) {
      const g = dY[o];
      const off = o * nIn;
      this.mb[o] = b1 * this.mb[o] + (1 - b1) * g;
      this.vb[o] = b2 * this.vb[o] + (1 - b2) * g * g;
      b[o] -= lr * (this.mb[o] / c1) / (Math.sqrt(this.vb[o] / c2) + 1e-8);
      for (let i = 0; i < nIn; i++) {
        const k = off + i;
        if (dX) dX[i] += w[k] * g;
        const gw = g * x[i];
        this.mw[k] = b1 * this.mw[k] + (1 - b1) * gw;
        this.vw[k] = b2 * this.vw[k] + (1 - b2) * gw * gw;
        w[k] -= lr * (this.mw[k] / c1) / (Math.sqrt(this.vw[k] / c2) + 1e-8);
      }
    }
  }
  dump() { return { w: Array.from(this.w), b: Array.from(this.b) }; }
  load(d: { w: number[]; b: number[] }) {
    this.w.set(d.w); this.b.set(d.b);
  }
}

export class PolicyNet {
  l1 = new Dense(OBS_DIM, H1);
  l2 = new Dense(H1, H2);
  actor = new Dense(H2, N_ACTIONS);
  critic = new Dense(H2, 1);
  t = 0;
  hidden = { h1: new Float32Array(H1), h2: new Float32Array(H2) };

  forward(obs: Float32Array, mask: boolean[]) {
    const h1 = this.l1.forward(obs, new Float32Array(H1));
    for (let i = 0; i < H1; i++) if (h1[i] < 0) h1[i] = 0;
    const h2 = this.l2.forward(h1, new Float32Array(H2));
    for (let i = 0; i < H2; i++) if (h2[i] < 0) h2[i] = 0;
    const logits = this.actor.forward(h2, new Float32Array(N_ACTIONS));
    const value = this.critic.forward(h2, new Float32Array(1))[0];
    const { probs, logp } = softmaxMask(logits, mask);
    return { logits, probs, logp, value, h1, h2 };
  }

  backward(obs: Float32Array, cache: { h1: Float32Array; h2: Float32Array }, dLogits: Float32Array, dValue: number, lr: number) {
    this.t++;
    const dH2a = new Float32Array(H2);
    const dH2c = new Float32Array(H2);
    this.actor.backward(cache.h2, dLogits, dH2a, lr, this.t);
    this.critic.backward(cache.h2, Float32Array.of(dValue), dH2c, lr, this.t);
    const dH2 = new Float32Array(H2);
    for (let i = 0; i < H2; i++) {
      dH2[i] = dH2a[i] + dH2c[i];
      if (cache.h2[i] <= 0) dH2[i] = 0;
    }
    const dH1 = new Float32Array(H1);
    this.l2.backward(cache.h1, dH2, dH1, lr, this.t);
    for (let i = 0; i < H1; i++) if (cache.h1[i] <= 0) dH1[i] = 0;
    this.l1.backward(obs, dH1, null, lr, this.t);
  }

  toJSON() {
    return {
      dim: OBS_DIM, h1: H1, h2: H2,
      l1: this.l1.dump(), l2: this.l2.dump(),
      actor: this.actor.dump(), critic: this.critic.dump(), t: this.t,
    };
  }
  static fromJSON(j: ReturnType<PolicyNet['toJSON']>) {
    const n = new PolicyNet();
    n.l1.load(j.l1); n.l2.load(j.l2);
    n.actor.load(j.actor); n.critic.load(j.critic);
    n.t = j.t || 0;
    return n;
  }
}

export function softmaxMask(logits: Float32Array, mask: boolean[]) {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (mask[i] && logits[i] > max) max = logits[i];
  if (max === -Infinity) max = 0;
  const ex = new Float32Array(logits.length);
  let z = 0;
  for (let i = 0; i < logits.length; i++) {
    if (!mask[i]) continue;
    const e = Math.exp(Math.min(20, logits[i] - max));
    ex[i] = e; z += e;
  }
  if (z === 0) {
    const n = mask.filter(Boolean).length || 1;
    for (let i = 0; i < logits.length; i++) if (mask[i]) ex[i] = 1 / n;
    z = 1;
  }
  const probs = new Float32Array(logits.length);
  const logp = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    probs[i] = ex[i] / z;
    logp[i] = mask[i] ? Math.log(Math.max(1e-8, probs[i])) : -1e9;
  }
  return { probs, logp };
}

export function sample(probs: Float32Array, rng = Math.random) {
  let r = rng();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  for (let i = probs.length - 1; i >= 0; i--) if (probs[i] > 0) return i;
  return 0;
}

export function dLogSoftmax(probs: Float32Array, action: number, scale: number, mask: boolean[]) {
  const d = new Float32Array(probs.length);
  for (let i = 0; i < probs.length; i++) {
    if (!mask[i]) continue;
    d[i] = scale * ((i === action ? 1 : 0) - probs[i]);
  }
  return d;
}

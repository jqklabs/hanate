import { g } from '../runtime/scope.ts';

export class SfxPlayer {
  play(src: string, opts?: Record<string, unknown>) {
    return g.playSfx(src, opts);
  }
  setBgmVolume(v: number) { return g.setBgmVolume(v); }
  setSfxVolume(v: number) { return g.setSfxVolume(v); }
  unlock() { return g.unlockSfx(); }
}

export const sfxPlayer = new SfxPlayer();

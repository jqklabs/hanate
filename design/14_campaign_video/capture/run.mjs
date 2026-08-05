#!/usr/bin/env node
// 단일 진입점 — 빌드 → 전 컷 녹화 → 합성까지 한 번에.
//
//   node run.mjs                 전체 자동 (최종 mp4까지)
//   node run.mjs --scene C5      한 컷만 재녹화 후 합성
//   node run.mjs --no-assemble   녹화까지만
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const only = argv.includes('--scene') ? argv[argv.indexOf('--scene') + 1] : null;
const skipAssemble = argv.includes('--no-assemble');

function step(n, label, fn) {
  const t = Date.now();
  console.log(`\n[${n}] ${label}`);
  try {
    fn();
  } catch (e) {
    console.error(`\n✗ [${n}] ${label} 단계에서 실패했습니다.`);
    console.error(e.message || e);
    process.exit(1);
  }
  console.log(`    ${((Date.now() - t) / 1000).toFixed(1)}초`);
}

step(1, '리그 주입 사본 빌드 (원본 index.html은 건드리지 않음)', () => {
  execFileSync('node', [resolve(HERE, 'build-rig.mjs')], { stdio: 'inherit' });
});

step(2, '자막 폰트 준비 (woff2 → ttf)', () => {
  execFileSync('node', [resolve(HERE, 'make-fonts.mjs')], { stdio: 'inherit' });
});

step(3, '생성 컷 플레이트 준비 (assets/OG 기반, plates/에 파일 있으면 그쪽 우선)', () => {
  execFileSync('node', [resolve(HERE, 'make-plates.mjs')], { stdio: 'inherit' });
});

step(4, only ? `컷 녹화 — ${only}` : '전 컷 녹화', () => {
  execFileSync('node',
    [resolve(HERE, 'record.mjs'), ...(only ? ['--scene', only] : [])],
    { stdio: 'inherit' });
});

if (!skipAssemble) {
  step(5, '합성 (녹화분 + 생성 플레이트 → 30초 9:16)', () => {
    execFileSync('node', [resolve(HERE, 'assemble.mjs')], { stdio: 'inherit' });
  });
}

console.log('\n완료.');

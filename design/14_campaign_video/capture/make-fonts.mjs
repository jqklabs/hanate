// ffmpeg(libfreetype)는 woff2를 못 읽는다 — 자막이 두부(□)로 나온다.
// 게임이 쓰는 woff2를 ttf로 변환해 fonts/에 둔다. 이미 있으면 건너뛴다.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const FONTS = resolve(HERE, 'fonts');
const VENV = resolve(HERE, '.venv');
const PY = resolve(VENV, 'bin/python');

const PAIRS = [
  ['assets/Fonts/SSRockRegular.woff2', 'SSRock.ttf'],
  ['assets/Fonts/zihun-baige-tianxing.woff2', 'BaigeTianxing.ttf'],
];

export function makeFonts() {
  if (PAIRS.every(([, d]) => existsSync(resolve(FONTS, d)))) return;
  mkdirSync(FONTS, { recursive: true });

  if (!existsSync(PY)) {
    execFileSync('python3', ['-m', 'venv', VENV], { stdio: 'inherit' });
    execFileSync(resolve(VENV, 'bin/pip'), ['install', '-q', 'fonttools', 'brotli'],
      { stdio: 'inherit' });
  }

  const script = `
from fontTools.ttLib import TTFont
import sys
for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
    f = TTFont(src); f.flavor = None; f.save(dst)
    print('폰트 변환 →', dst)
`;
  const args = PAIRS.flatMap(([s, d]) => [resolve(ROOT, s), resolve(FONTS, d)]);
  execFileSync(PY, ['-c', script, ...args], { stdio: 'inherit' });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) makeFonts();

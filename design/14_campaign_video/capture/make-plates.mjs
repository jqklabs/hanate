// 생성 컷(C4 춘향 컷인 / C6 CTA)을 실제 배포 아트(assets/OG)에서 만든다.
// 로고와 "몇 월까지 깰수있으세요?" 카피가 이미 렌더링돼 있어 폰트 결손 문제가 없고
// 브랜드도 정확하다. plates/에 직접 파일을 넣으면 그쪽이 우선한다.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PLATES = resolve(HERE, 'plates');
const PY = resolve(HERE, '.venv/bin/python');

const SCRIPT = `
import sys
from PIL import Image, ImageFilter
src, outdir = sys.argv[1], sys.argv[2]
ratio = sys.argv[3] if len(sys.argv) > 3 else '4x5'
og = Image.open(src).convert('RGB')
# 가로는 OG 아트(1731×909)가 원래 가로라 크롭 없이 그대로 살릴 수 있다 — 오히려 선명해진다
W, H = (1920, 1080) if ratio == '16x9' else (1080, 1920)
BG = (13, 31, 24)

def vignette(im, strength=0.55):
    w, h = im.size
    m = Image.new('L', (w, h), 0)
    import PIL.ImageDraw as D
    d = D.Draw(m)
    d.ellipse([-w*0.25, -h*0.15, w*1.25, h*1.15], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(w*0.12))
    dark = Image.new('RGB', (w, h), (0, 0, 0))
    return Image.composite(im, Image.blend(im, dark, strength), m)

# ── C4: 춘향 컷인 — 인물 영역을 9:16으로 크롭 ──
ow, oh = og.size
cw = int(oh * W / H)                     # 9:16 비율의 크롭 폭
cx = int(ow * 0.62)                      # 인물 중심
left = max(0, min(ow - cw, cx - cw // 2))
c4 = og.crop((left, 0, left + cw, oh)).resize((W, H), Image.LANCZOS)
vignette(c4, 0.45).save(outdir + ('/C4-16x9.png' if ratio == '16x9' else '/C4.png'))
print('플레이트 → C4' + ('-16x9' if ratio == '16x9' else '') + '.png')

# C6(엔딩 CTA)는 여기서 만들지 않는다 — make-ending.mjs / ending.html 담당.
# 배포 OG 아트는 게임명이 래스터에 구워져 있어 「십이화」로 못 바꾼다.
# (지우려 해봤지만 굵은 금박 붓글씨는 흐리든 인페인트하든 자국이 남았다)
`;

export function makePlates() {
  mkdirSync(PLATES, { recursive: true });
  const have = new Set(readdirSync(PLATES).map((f) => f.replace(/\.[^.]+$/, '')));
  // (비율별 산출물이라 가드는 두지 않는다 — 필요하면 그때그때 다시 굽는다)
  if (!existsSync(PY)) throw new Error('.venv가 없습니다 — make-fonts.mjs를 먼저 실행하세요');
  const RATIO = process.argv.includes('--ratio')
    ? process.argv[process.argv.indexOf('--ratio') + 1] : '4x5';
  execFileSync(PY, ['-c', SCRIPT, resolve(ROOT, 'assets/OG/OG1.png'), PLATES, RATIO],
    { stdio: 'inherit' });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) makePlates();

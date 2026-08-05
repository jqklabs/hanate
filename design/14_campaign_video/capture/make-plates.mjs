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
og = Image.open(src).convert('RGB')
W, H = 1080, 1920
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
vignette(c4, 0.45).save(outdir + '/C4.png')
print('플레이트 → C4.png')

# ── C6: CTA — 로고와 카피가 있는 영역을 어두운 판 위에 앉힌다 ──
plate = Image.new('RGB', (W, H), BG)
bw = int(oh * W / H)
bl = max(0, min(ow - bw, int(ow * 0.30) - bw // 2))
bgimg = og.crop((bl, 0, bl + bw, oh)).resize((W, H), Image.LANCZOS)
bgimg = bgimg.filter(ImageFilter.GaussianBlur(9))
plate = Image.blend(plate, bgimg, 0.30)

# 로고 + 카피 블록 (원본 비율 기준 좌표)
lx0, ly0, lx1, ly1 = int(ow*0.075), int(oh*0.22), int(ow*0.46), int(oh*0.70)
logo = og.crop((lx0, ly0, lx1, ly1))
lw = int(W * 0.86)
logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
# 가장자리를 페더링해 붙인 티(직사각형 경계)를 없앤다
import PIL.ImageDraw as D2
mask = Image.new('L', logo.size, 0)
pad = int(min(logo.size) * 0.10)
D2.Draw(mask).rectangle([pad, pad, logo.width - pad, logo.height - pad], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(pad * 0.7))
plate.paste(logo, ((W - lw) // 2, (H - logo.height) // 2), mask)
vignette(plate, 0.5).save(outdir + '/C6.png')
print('플레이트 → C6.png')
`;

export function makePlates() {
  mkdirSync(PLATES, { recursive: true });
  const have = new Set(readdirSync(PLATES).map((f) => f.replace(/\.[^.]+$/, '')));
  if (have.has('C4') && have.has('C6')) return;
  if (!existsSync(PY)) throw new Error('.venv가 없습니다 — make-fonts.mjs를 먼저 실행하세요');
  execFileSync(PY, ['-c', SCRIPT, resolve(ROOT, 'assets/OG/OG1.png'), PLATES],
    { stdio: 'inherit' });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) makePlates();

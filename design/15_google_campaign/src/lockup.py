#!/usr/bin/env python3
"""아트 플레이트 위에 「화투로」 로고 · 부제 · CTA · 사행성 고지를 조판한다.

4단 구조로 쌓는다.
  1) 로고    gen/logo/logo_og.png       금박 붓글씨 · 12장 공용
  2) 태그라인 gen/type/tagline/type.png  「꽃으로 수놓은 밤」 붓글씨 · 12장 공용
  3) 월별 부제 게임 폰트 SSRockRegular    광고에서 본 글씨 = 게임에서 볼 글씨
  4) CTA     gen/type/tcta/type.png     금박 붓글씨 · 12장 공용

태그라인을 폰트가 아니라 이미지로 쓰는 이유: 인게임 폰트에 '놓' 이 없다.

※ SSRock 은 게임에 나오는 글자만 담은 서브셋이다(한글 557자 / 완성형 11,172자 중).
  문구를 고치면 반드시 커버리지를 다시 확인할 것 — 없는 글자는 두부(⊠)로 찍힌다.

고지문만 폰트로 찍는다 — README §4-1(소셜 카지노 분류 방어)의 문구이고,
붓글씨로는 이 크기에서 판독이 안 되므로 정자체로 넣는다.

  python3 lockup.py <art> <out> <규격w> <규격h> <crop_h> <로고폭> <x> <y> <부제> <부제크기>
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ART, OUT = sys.argv[1], sys.argv[2]
SPEC_W, SPEC_H, CROP_H = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
LOGO_W, LX, LY = int(sys.argv[6]), int(sys.argv[7]), int(sys.argv[8])
SUB, SUB_SIZE = sys.argv[9], int(sys.argv[10])
INK = len(sys.argv) > 11 and sys.argv[11] == "ink"   # 크림 한지 배경용 먹색 조판
LOGO_OVERRIDE = sys.argv[12] if len(sys.argv) > 12 else None   # 로고 파일 교체 (네이밍 비교용)

NOTICE = "본 게임은 실제 재화나 현금을 이용한 사행성 게임이 아닙니다."
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # src/ 의 상위 = 캠페인 루트
G = os.path.join(HERE, "gen")
H = os.path.expanduser("~/Library/Fonts")
NOTICE_FONTS = [f"{H}/Pretendard-Regular.otf", f"{H}/Pretendard-Light.otf", f"{H}/malgun.ttf"]
NFONT = next((p for p in NOTICE_FONTS if os.path.exists(p)), None)
GAME_FONT = os.path.join(G, ".work", "SSRock.ttf")   # 인게임 폰트

TAG_W_RATIO = 0.72     # 태그라인 폭 = 로고 폭 × 이 값
CTA_W_RATIO = 0.46     # CTA 폭 = 로고 폭 × 이 값

def _has(ch):
    """인게임 폰트가 해당 글자를 가지고 있는지 — 서브셋이라 확인이 필수다."""
    from fontTools.ttLib import TTFont
    global _CMAP
    try:
        _CMAP
    except NameError:
        f = TTFont(GAME_FONT); _CMAP = set()
        for t in f["cmap"].tables:
            _CMAP |= set(t.cmap.keys())
    return ord(ch) in _CMAP


def piece(path):
    """붓글씨 PNG를 투명 배경으로 만들어 여백까지 잘라낸다.

    이미 투명 처리된 자산(logo_ink · cta_verm 등)에 루마키를 다시 걸면 망가진다 —
    단색으로 틴트된 파일은 전 픽셀 휘도가 같아서 통째로 사라지거나 사각형이 된다.
    알파가 이미 있으면 자르기만 한다.
    """
    im = Image.open(path).convert("RGBA")
    if im.getchannel("A").getextrema()[0] < 250:      # 이미 투명 배경
        bb = im.getchannel("A").point(lambda v: 255 if v > 55 else 0).getbbox()
        return im.crop(bb) if bb else im
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = (r*299 + g*587 + b*114) / 1000
            px[x, y] = (r, g, b, 0 if lum < 26 else min(255, int((lum-26)*255/70)))
    bb = im.getchannel("A").point(lambda v: 255 if v > 55 else 0).getbbox()
    return im.crop(bb) if bb else im

def fit(im, width):
    return im.resize((width, max(1, round(width * im.height / im.width))), Image.LANCZOS)

art = Image.open(ART).convert("RGBA")
if CROP_H and CROP_H != art.height:          # 1.91:1 등 세로를 잘라내야 하는 규격
    art = art.crop((0, 0, art.width, CROP_H))  # 상단 기준 — 인물 정수리를 살린다
W, HT = art.size

_logo_path = LOGO_OVERRIDE or os.path.join(G, "logo", "logo_ink.png" if INK else "logo_og.png")
logo = fit(piece(_logo_path), LOGO_W)
cta  = fit(piece(os.path.join(G, "logo", "cta_verm.png") if INK else os.path.join(G, "type", "tcta", "type.png")),
           round(LOGO_W * CTA_W_RATIO))
tag  = fit(piece(os.path.join(G, "type", "tagline", "type.png")), round(LOGO_W * TAG_W_RATIO))
SUB_COL   = (32, 30, 28, 255) if INK else (245, 238, 224, 255)
SHADOW    = None if INK else (0, 0, 0, 175)
NOTICE_COL = (44, 40, 36, 175) if INK else (255, 255, 255, 115)
gfont = ImageFont.truetype(GAME_FONT, SUB_SIZE)
_m = ImageDraw.Draw(Image.new("RGB", (1, 1)))
sbb = _m.textbbox((0, 0), SUB, font=gfont)
sub_w, sub_h = sbb[2] - sbb[0], sbb[3] - sbb[1]

gap1 = round(LOGO_W * 0.045)   # 로고 → 태그라인
gap2 = round(LOGO_W * 0.045)   # 태그라인 → 월별 부제
gap3 = round(LOGO_W * 0.050)   # 월별 부제 → CTA
block_h = logo.height + gap1 + tag.height + gap2 + sub_h + gap3 + cta.height
cx = LX + LOGO_W // 2                        # 정렬 기준 = 로고 가로 중앙

# 타이포가 앉을 자리를 살짝 눌러 가독성 확보 (아트를 덮지 않는 수준)
if not INK:
    pad = round(LOGO_W * 0.20)
    shade = Image.new("RGBA", art.size, (0, 0, 0, 0))
    ImageDraw.Draw(shade).ellipse([LX - pad, LY - pad, LX + LOGO_W + pad, LY + block_h + pad],
                                  fill=(6, 12, 18, 100))
    art = Image.alpha_composite(art, shade.filter(ImageFilter.GaussianBlur(pad * 0.9)))

y = LY
art.alpha_composite(logo, (LX, y));                       y += logo.height + gap1
art.alpha_composite(tag, (cx - tag.width // 2, y));       y += tag.height + gap2
dsub = ImageDraw.Draw(art)
sx = cx - sub_w // 2 - sbb[0]
layers = ([(0, 0, SUB_COL)] if SHADOW is None else [(3, 3, SHADOW), (0, 0, SUB_COL)])
for dx, dy, col in layers:
    dsub.text((sx + dx, y - sbb[1] + dy), SUB, font=gfont, fill=col)
y += sub_h + gap3
art.alpha_composite(cta,  (cx - cta.width // 2, y))

# ── 사행성 고지 — 하단 중앙, 눈에 띄지 않되 판독 가능하게 ──────
if NFONT:
    d = ImageDraw.Draw(art)
    fn = ImageFont.truetype(NFONT, max(17, round(W * 0.0165)))
    bb = d.textbbox((0, 0), NOTICE, font=fn)
    nx, ny = (W - (bb[2]-bb[0])) // 2 - bb[0], HT - (bb[3]-bb[1]) - round(HT * 0.030)
    if SHADOW is not None:
        d.text((nx+1, ny+1), NOTICE, font=fn, fill=(0, 0, 0, 120))
    d.text((nx, ny), NOTICE, font=fn, fill=NOTICE_COL)

art.convert("RGB").resize((SPEC_W, SPEC_H), Image.LANCZOS).save(OUT, quality=92)
miss = [c for c in SUB if c != " " and not _has(c)]
if miss:
    print(f"!! 인게임 폰트에 없는 글자: {''.join(miss)}  ({SUB})", file=sys.stderr)
print(f"{OUT}  {SPEC_W}x{SPEC_H}  로고 {logo.size} 태그 {tag.size} 부제 {sub_w}x{sub_h} CTA {cta.size}  블록 {block_h}")

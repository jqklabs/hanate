#!/usr/bin/env python3
"""아트 플레이트 위에 「화투로」 로고 · 부제 · CTA · 사행성 고지를 조판한다.

제목은 매번 생성하면 글자 크기·자간이 흔들리므로, 별도로 뽑아둔 금박 워드마크
`gen3/logo_og.png` 를 12장 전부에 고정으로 돌려쓴다.
부제와 CTA는 로고 가로 중앙에 맞춰 중앙정렬한다.

고지문은 README §4-1(소셜 카지노 분류 방어)의 문구다. 심사 반려 시 근거가 되므로
눈에 띄지 않되 반드시 판독 가능해야 한다 — 붓글씨가 아니라 정자체로 넣는다.

  python3 lockup.py <art> <out> <규격w> <규격h> <crop_h> <로고폭> <x> <y> <부제> <부제크기> [폰트키]
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ART, OUT = sys.argv[1], sys.argv[2]
SPEC_W, SPEC_H, CROP_H = int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
LOGO_W, LX, LY = int(sys.argv[6]), int(sys.argv[7]), int(sys.argv[8])
SUB, SUB_SIZE = sys.argv[9], int(sys.argv[10])
FONT_KEY = sys.argv[11] if len(sys.argv) > 11 else "ssrock"

CTA = "지금 당장 플레이"      # 좌우 괄호는 별도 폰트로 그린다 (SSRock에 > < 글리프가 없다)
NOTICE = "본 게임은 실제 재화나 현금을 이용한 사행성 게임이 아닙니다."

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "gen3", "logo_og.png")
H = os.path.expanduser("~/Library/Fonts")
FONTS = {                                   # 부제·CTA 후보 (붓글씨 계열)
    "ssrock":  os.path.join(HERE, "gen3", ".work", "SSRock.ttf"),  # 게임 폰트
    "galmat":  f"{H}/나눔손글씨 갈맷글.ttf",
    "kangbu":  f"{H}/나눔손글씨 강부장님체.ttf",
    "roehoe":  f"{H}/ROEHOE-CHAN.otf",
    "pretend": f"{H}/Pretendard-Bold.otf",
}
# 고지문은 정자체로. 붓글씨로 쓰면 작은 크기에서 판독이 안 된다.
NOTICE_FONTS = [f"{H}/Pretendard-Regular.otf", f"{H}/Pretendard-Light.otf", f"{H}/malgun.ttf"]

FONT = FONTS.get(FONT_KEY)
if not FONT or not os.path.exists(FONT):
    FONT = next((p for p in FONTS.values() if os.path.exists(p)), None)
NFONT = next((p for p in NOTICE_FONTS if os.path.exists(p)), FONT)
BRACKET_FONT = next((p for p in [f"{H}/Pretendard-Bold.otf", f"{H}/Pretendard-SemiBold.otf",
                                 f"{H}/malgun.ttf"] if os.path.exists(p)), NFONT)

im = Image.open(ART).convert("RGBA")
if CROP_H and CROP_H != im.height:           # 1.91:1 등 세로를 잘라내야 하는 규격
    im = im.crop((0, 0, im.width, CROP_H))   # 상단 기준 — 인물 정수리를 살린다
W, HT = im.size

logo = Image.open(LOGO).convert("RGBA")
logo = logo.resize((LOGO_W, round(LOGO_W * logo.height / logo.width)), Image.LANCZOS)

# 타이포가 앉을 자리를 살짝 눌러 가독성 확보 (아트를 덮지 않는 수준)
pad = round(LOGO_W * 0.20)
shade = Image.new("RGBA", im.size, (0, 0, 0, 0))
ImageDraw.Draw(shade).ellipse(
    [LX - pad, LY - pad, LX + logo.width + pad, LY + logo.height + pad + SUB_SIZE * 4],
    fill=(6, 12, 18, 100))
im = Image.alpha_composite(im, shade.filter(ImageFilter.GaussianBlur(pad * 0.9)))
im.alpha_composite(logo, (LX, LY))

d = ImageDraw.Draw(im)
cx = LX + logo.width // 2                    # 로고 가로 중앙 — 부제·CTA의 정렬 기준

def centered(text, font, y, fill, shadow=(0, 0, 0, 175), off=3):
    bb = d.textbbox((0, 0), text, font=font)
    x = cx - (bb[2] - bb[0]) // 2 - bb[0]
    if shadow:
        d.text((x + off, y + off), text, font=font, fill=shadow)
    d.text((x, y), text, font=font, fill=fill)
    return y + (bb[3] - bb[1])

if FONT:
    fsub = ImageFont.truetype(FONT, SUB_SIZE)
    fcta = ImageFont.truetype(FONT, round(SUB_SIZE * 0.82))
    y = LY + logo.height + round(SUB_SIZE * 0.30)
    y = centered(SUB, fsub, y, (245, 238, 224, 255))

    # CTA — 게임 폰트에 > < 글리프가 없어서 괄호만 정자체로 그리고 한 덩어리로 중앙정렬한다
    fbr = ImageFont.truetype(BRACKET_FONT, round(SUB_SIZE * 0.78))
    GOLD, GAP = (236, 198, 112, 255), round(SUB_SIZE * 0.34)
    cy = y + round(SUB_SIZE * 0.85)
    kb = d.textbbox((0, 0), CTA, font=fcta)
    lb = d.textbbox((0, 0), ">", font=fbr)
    rb = d.textbbox((0, 0), "<", font=fbr)
    kw, lw, rw = kb[2] - kb[0], lb[2] - lb[0], rb[2] - rb[0]
    total = lw + GAP + kw + GAP + rw
    x = cx - total // 2
    by = cy + (kb[3] - kb[1]) // 2 - (lb[3] - lb[1]) // 2 - lb[1] + kb[1]
    for dx, dy, col in ((3, 3, (0, 0, 0, 175)), (0, 0, GOLD)):
        d.text((x - lb[0] + dx, by + dy), ">", font=fbr, fill=col)
        d.text((x + lw + GAP - kb[0] + dx, cy + dy), CTA, font=fcta, fill=col)
        d.text((x + lw + GAP + kw + GAP - rb[0] + dx, by + dy), "<", font=fbr, fill=col)
else:
    print("!! 부제 폰트를 찾지 못했다 — 부제·CTA를 건너뛴다", file=sys.stderr)

# ── 사행성 고지 — 하단 중앙, 눈에 띄지 않되 판독 가능하게 ──────
fn = ImageFont.truetype(NFONT, max(17, round(W * 0.0165)))
bb = d.textbbox((0, 0), NOTICE, font=fn)
nx, ny = (W - (bb[2] - bb[0])) // 2 - bb[0], HT - (bb[3] - bb[1]) - round(HT * 0.030)
d.text((nx + 1, ny + 1), NOTICE, font=fn, fill=(0, 0, 0, 120))
d.text((nx, ny), NOTICE, font=fn, fill=(255, 255, 255, 115))

im.convert("RGB").resize((SPEC_W, SPEC_H), Image.LANCZOS).save(OUT, quality=92)
print(f"{OUT}  {SPEC_W}x{SPEC_H}  logo {logo.size}  font {os.path.basename(FONT)}  고지 {os.path.basename(NFONT)}")

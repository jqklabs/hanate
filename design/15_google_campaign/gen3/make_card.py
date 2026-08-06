#!/usr/bin/env python3
"""실제 게임 카드 에셋(Assets/{월}/*.webp)을 인게임 카드 룩으로 렌더해 PNG로 뽑는다.

생성 모델은 카드 그림을 지어내거나 엉뚱한 달을 그린다(1월 장에 3월 벚꽃이 나왔다).
글자를 생성하지 않고 조판하는 것과 같은 이유로, 카드도 생성하지 않고 실제 에셋을 합성한다.

  python3 make_card.py <art.webp> <월숫자> <폭> <회전각> <out.png>
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ART, MONTH, W, ROT, OUT = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4]), sys.argv[5]

H = round(W * 1.42)          # 인게임 카드 비율
R = max(4, round(W * 0.07))  # 라운드 코너
BORDER = max(3, round(W * 0.035))
PAD = max(3, round(W * 0.055))
SS = 4                        # 슈퍼샘플링 — 축소 시 테두리가 계단지지 않게

CREAM, RED = (245, 239, 226, 255), (176, 48, 42, 255)

w, h, r, bd, pd = W * SS, H * SS, R * SS, BORDER * SS, PAD * SS
card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
d = ImageDraw.Draw(card)
d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=RED)
d.rounded_rectangle([bd, bd, w - 1 - bd, h - 1 - bd], radius=max(1, r - bd), fill=CREAM)

# 카드 그림 — 안쪽 여백에 맞춰 커버 크롭
inner = (w - 2 * (bd + pd), h - 2 * (bd + pd))
art = Image.open(ART).convert("RGBA")
sc = max(inner[0] / art.width, inner[1] / art.height)
art = art.resize((round(art.width * sc), round(art.height * sc)), Image.LANCZOS)
art = art.crop(((art.width - inner[0]) // 2, (art.height - inner[1]) // 2,
                (art.width - inner[0]) // 2 + inner[0], (art.height - inner[1]) // 2 + inner[1]))
mask = Image.new("L", inner, 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, inner[0] - 1, inner[1] - 1], radius=max(1, r - bd - pd), fill=255)
card.paste(art, (bd + pd, bd + pd), mask)

# 좌상단 月 라벨 — 게임 화면과 같은 붉은 배지
try:
    f = ImageFont.truetype("/tmp/Zihun.ttf", round(w * 0.17))
except OSError:
    f = ImageFont.load_default()
label = f"{MONTH}月"
d = ImageDraw.Draw(card)
tb = d.textbbox((0, 0), label, font=f)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
bx, by = bd + pd + round(w * 0.03), bd + pd + round(w * 0.03)
d.rounded_rectangle([bx, by, bx + tw + round(w * 0.07), by + th + round(w * 0.07)],
                    radius=round(w * 0.03), fill=(250, 246, 236, 245), outline=RED, width=max(2, bd // 2))
d.text((bx + round(w * 0.035) - tb[0], by + round(w * 0.035) - tb[1]), label, font=f, fill=RED)

card = card.resize((W, H), Image.LANCZOS)
if ROT:
    card = card.rotate(ROT, resample=Image.BICUBIC, expand=True)

# 금빛 외곽 글로우 — 생성물에 있던 발광을 대체하고 아래 깔린 옛 카드를 덮는다
G = round(W * 0.30)
out = Image.new("RGBA", (card.width + 2 * G, card.height + 2 * G), (0, 0, 0, 0))
glow = Image.new("RGBA", out.size, (0, 0, 0, 0))
glow.paste((232, 190, 106, 235), (G, G), card.split()[3])
glow = glow.filter(ImageFilter.GaussianBlur(G * 0.42))
out = Image.alpha_composite(out, glow)
out = Image.alpha_composite(out, glow)
out.paste(card, (G, G), card)
out.save(OUT)
print(f"{OUT}  {out.size}  (card {W}x{H}, glow {G})")

"""OG 아트를 「십이화」로 다시 조판한다.

배포 OG(OG1.png)는 제목이 래스터에 **구워져** 있어 글씨만 바꿀 수 없다.
지워보려 했지만 크고 밝은 금박 붓글씨는 블러로도 인페인트로도 자국이 남았다
(블러는 금색 덩어리로 뭉개지고, 인페인트는 그 자리가 빈 판으로 떴다).

→ 지우지 않는다. **제목 글씨만 없는 같은 화풍의 키아트**(gen/og_clean.png)를 새로
  받아, 원래 로고·카피가 있던 자리에 그대로 다시 앉힌다.

  · 로고 = gen/logo/logo_og.png (검은 바탕 금박) → screen 합성으로 검정을 떨어뜨린다
  · 카피 = 원본 OG에서 밝기를 알파로 뽑아낸 조각 → 조판·서체가 배포본과 정확히 같다

좌표는 전부 원본 OG 실측값이라 리브랜딩 전후로 레이아웃이 흔들리지 않는다.

사용: python rebrand-og.py <깨끗한키아트> <로고> <카피조각> <출력>
"""
import sys
from PIL import Image, ImageChops

clean, logo_path, copy_path, out = sys.argv[1:5]
og = Image.open(clean).convert('RGB')
W, H = og.size

# ── 원본 OG 실측 좌표 (비율) ──────────────────────────────────
LOGO = (0.083, 0.235, 0.415, 0.570)   # 「화투로」가 차지하던 자리
COPY = (0.075, 0.617, 0.440, 0.688)   # 「몇월까지 깰수있으세요?」 락업

# ── 로고 — screen 합성 ────────────────────────────────────────
lx0, ly0, lx1, ly1 = (int(W*LOGO[0]), int(H*LOGO[1]), int(W*LOGO[2]), int(H*LOGO[3]))
logo = Image.open(logo_path).convert('RGB')
# PNG에 여백이 있어 상자에 딱 맞추면 글씨가 원본 「화투로」보다 작게 앉는다 → 여백만큼 키운다
lw = int((lx1 - lx0) * 1.24)
logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)

layer = Image.new('RGB', og.size, (0, 0, 0))
layer.paste(logo, ((lx0 + lx1) // 2 - lw // 2, (ly0 + ly1) // 2 - logo.height // 2))
og = ImageChops.screen(og, layer)

# ── 카피 — 알파 합성 ──────────────────────────────────────────
cx0, cy0, cx1, cy1 = (int(W*COPY[0]), int(H*COPY[1]), int(W*COPY[2]), int(H*COPY[3]))
copy = Image.open(copy_path).convert('RGBA')
cw = cx1 - cx0
copy = copy.resize((cw, int(copy.height * cw / copy.width)), Image.LANCZOS)
og.paste(copy, (cx0, (cy0 + cy1) // 2 - copy.height // 2), copy)

og.save(out)
print(f'{out}  ({W}×{H})  로고 {logo.width}×{logo.height} · 카피 {copy.width}×{copy.height}')

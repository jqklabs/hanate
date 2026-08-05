#!/bin/sh
# 족보 엠블럼 생성 — 실제 게임 카드 이미지를 레퍼런스로 붙여 GPT Image로 뽑는다.
#
# 왜 이렇게 하나
#   레퍼런스 없이 생성하면 GPT가 화투를 '지어낸다'. 실제 오광/고도리와 모티프가 달라
#   게임과 따로 논다. 그래서 진짜 카드를 첨부한다.
#   단, **카드를 그대로 재현하면 안 된다** — 화면에 이미 진짜 카드가 깔려 있어 중복이다.
#   카드는 모티프·화풍 레퍼런스로만 쓰고, 결과는 금박 원형 문장(crest)이어야 한다.
#   프롬프트에 "NO rectangular playing cards"를 반드시 넣을 것.
#
# 왜 자동 파이프라인(run.mjs)에 안 넣나
#   생성은 비결정적이라 매번 결과가 다르다. 한 번 뽑아 커밋해두고 필요할 때만 돌린다.
#
# 주의
#   - `-i`는 가변 인자다. 프롬프트를 그냥 뒤에 붙이면 이미지 목록에 먹힌다 → `--`로 끊을 것.
#   - "Do NOT draw it with code" 문구를 빼면 codex가 PIL로 조잡하게 그려버린다.
#   - 결과가 원본 카드와 다르면 "do not reinterpret" 문장을 강화해 재시도.
set -e
cd "$(dirname "$0")"

# webp는 첨부가 안 되므로 PNG로 변환
.venv/bin/python - <<'PY'
from PIL import Image
import os
os.makedirs('.ref', exist_ok=True)
for out, src in {
    '.ref/gwang-01.png': 'cards_hi/01_january/1-gwang.webp',
    '.ref/gwang-03.png': 'cards_hi/03_march/3-gwang.webp',
    '.ref/gwang-08.png': 'cards_hi/08_august/8-gwang.webp',
    '.ref/gwang-11.png': 'cards_hi/11_november/11-gwang.webp',
    '.ref/gwang-12.png': 'cards_hi/12_december/12-gwang-umbrella.webp',
    '.ref/godori-02.png': 'cards_hi/02_february/2-yeolkkeut-warbler.webp',
    '.ref/godori-04.png': 'cards_hi/04_april/4-yeolkkeut.webp',
    '.ref/godori-08.png': 'cards_hi/08_august/8-yeolkkeut.webp',
}.items():
    Image.open(src).convert('RGBA').save(out)
PY

# 오광 — 1·3·8·11·12월 광 5장
codex exec --sandbox workspace-write --skip-git-repo-check \
  -i .ref/gwang-01.png .ref/gwang-03.png .ref/gwang-08.png .ref/gwang-11.png .ref/gwang-12.png \
  -- "Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). The five attached images are the five Korean hwatu 'gwang' cards. Use them ONLY as motif and style reference - do NOT reproduce them as cards. There must be NO rectangular playing cards anywhere in the output. Prompt: a single ornate heraldic emblem on a fully TRANSPARENT background, square composition. One grand golden crest that fuses the five gwang motifs into one design: a crane with a red rising sun, a cherry-blossom curtain banner, a full moon over a dark mountain, a phoenix among paulownia leaves, and a willow branch with falling rain. They are arranged radially around a central medallion, rendered as flowing gold-leaf line art and lacquer-black ink, like an embossed metal badge. Golden sunburst rays and a soft halo radiate behind it, floating gold embers around. Korean traditional ornament, luxurious, high contrast, no text, no cards, no background color, transparent PNG. Then save the generated file to ./fx_ogwang.png"

# 고도리 — 2월 매조 · 4월 두견 · 8월 기러기
codex exec --sandbox workspace-write --skip-git-repo-check \
  -i .ref/godori-02.png .ref/godori-04.png .ref/godori-08.png \
  -- "Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). The three attached images are Korean hwatu bird cards (February warbler on red plum, April cuckoo in black bush clover, August geese over a mountain). Use them ONLY as motif and style reference - do NOT reproduce them as cards. There must be NO rectangular playing cards anywhere in the output. Prompt: a single ornate heraldic emblem on a fully TRANSPARENT background, square composition. Three birds - a warbler, a cuckoo and a wild goose - in flight, arranged radially around a central golden medallion, rendered as flowing gold-leaf line art and lacquer-black ink like an embossed metal badge, with red plum blossoms and dark clover leaves woven into the ornament. Golden sunburst rays and a soft halo radiate behind, gold feathers and embers drifting. Korean traditional ornament, luxurious, high contrast, no text, no cards, no background color, transparent PNG. Then save the generated file to ./fx_godori.png"

# 병풍 — 해당 카드가 없으므로 레퍼런스 없이, 위 둘과 같은 화풍으로 맞춘다
codex exec --sandbox workspace-write --skip-git-repo-check \
  -- "Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Prompt: a single ornate heraldic emblem on a fully TRANSPARENT background, square composition, matching this exact style: a circular gold-leaf medallion crest with heavy embossed golden filigree, lacquer-black ink panels and deep red accents, Korean traditional ornament, jewel-like and luxurious, high contrast. The subject is a Korean folding screen (byeongpung) with five panels, seen head-on and unfolded in a gentle arc at the center of the medallion. Each panel carries a different season's flower in ink-and-gold: pine and crane, plum blossom, cherry blossom, black bush clover, and orchid. Golden sunburst rays and a soft halo radiate behind the medallion, gold embers drifting. No text, no playing cards, no background color, transparent PNG. Then save the generated file to ./fx_byeongpung.png"
echo "완료 — fx_ogwang / fx_godori / fx_byeongpung 육안 확인할 것 (카드가 그대로 보이면 실패)"

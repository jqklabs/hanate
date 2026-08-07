#!/bin/bash
# 「십이화」 최종 시안 3안 — 자유 서예 + 금박.
#
#  · 금박 유지: 아트 위에 합성되므로 먹색은 못 쓴다
#  · 순검정 배경: 루마키가 가장 깨끗하다 (배경 투명화는 후처리에서)
#  · 낙관 없음
#  · 유파 지정 없음 — 유파를 박으면 그 틀에 갇혀 고정된 느낌이 난다.
#    대신 구성 자체를 자유롭게 풀어 즉흥성을 만든다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

CORE='A piece of contemporary East Asian calligraphy: the Korean word 십이화 written by a master with a large brush, freely and spontaneously as an ARTWORK, on a PURE SOLID BLACK background.'

FREE='This is art, not lettering. There is NO grid, NO baseline, NO even spacing, NO consistent character size. The characters are placed intuitively - one is much larger than the others, another smaller and tucked in, sitting at different heights and slightly different angles, some strokes nearly touching or crossing. The composition is asymmetric and reads as a single breath. Strokes are thick, bold and confident; the brush runs dry mid-stroke leaving ragged 비백 streaks with black showing through; heavy pressed starts whip out into thin flicking tails; a few stray droplets and spatter marks near the strokes. Nothing is neat or uniform. It must be obvious a human hand did this in one spontaneous gesture, never typeset.'

GOLD='Written in rich gold leaf with hammered metallic texture and darker gold shadow inside the strokes. The background is PURE FLAT BLACK with nothing on it - no paper texture, no glow, no vignette - so the gold separates cleanly from the background.'

ACC='The word must read exactly 십이화 - three Korean syllable blocks 십, 이, 화 in that order - correctly formed and still legible despite the expressive freedom. No extra words, no invented glyphs, no Latin letters, NO SEAL, no stamp, no frame, no ornaments, no background art. Generous empty black margin on all four sides so no stroke touches the edge.'

gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $CORE $FREE $2 $GOLD $ACC Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

gen w1 'Composition: the three characters sweep across horizontally, the last one dramatically larger with a long tail whipping far out to the side, the first two smaller and riding higher.' &
gen w2 'Composition: two rough rows - 십이 above, 화 below and much larger, the rows offset from each other rather than aligned, the whole cluster leaning slightly.' &
gen w3 'Composition: the three Korean characters written large and free, and below them the three Chinese characters 十二花 written small in the SAME wild hand - not neat, same dry brush, same thick-to-thin modulation, slightly tilted and uneven.' &
wait
echo "=== done ==="; ls w?/logo.png 2>/dev/null | wc -l

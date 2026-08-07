#!/bin/bash
# 「십이화」 — 유파를 지정하지 않는다. 진짜 서예 작품처럼.
#
# 앞선 시안(t·u)이 고정된 느낌이었던 원인: 추사체·행서·초서·예서로 유파를 박았다.
#   유파를 지정하면 그 틀 안에서만 쓰게 되어 즉흥성이 죽는다.
# 레퍼런스(水滴穿石 작품)의 특징을 그대로 따른다:
#   흰 한지에 검은 먹 · 글자 크기 제각각 · 정렬되지 않은 자유 배치 · 한 글자만 다른 색
#   · 굵고 대담한 획 · 번짐과 갈필 · 낙관
# 흰 바탕 먹글씨는 키잉이 깨끗해서, 뽑은 뒤 금박·먹색 어느 쪽으로든 틴트할 수 있다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

CORE='A photograph of a real piece of contemporary East Asian calligraphy art on white mulberry paper. A master calligrapher has written the Korean word 십이화 with a large ink brush, freely and spontaneously, as an artwork rather than a logo.'

FREE='This is ART, not lettering. There is NO grid, NO baseline, NO even spacing and NO consistent size. The characters are placed intuitively - one is much larger than the others, another is small and tucked in, they sit at different heights and slightly different angles, some nearly touch or overlap. The composition is asymmetric and feels like a single breath. Strokes are thick, bold and confident with heavy black ink; the brush runs dry mid-stroke leaving ragged 비백 streaks with paper showing through; ink bleeds and feathers into the paper fibres at the heavy points; a few stray droplets and spatter marks. Nothing is neat. It must be obvious a human hand did this in one spontaneous gesture.'

INK='Deep black ink on warm white paper, with visible paper texture and fibre. ONE single character is written in a different colour - a soft ink-blue or vermilion wash - as the accent of the piece.'

SEAL='A small square vermilion seal (낙관) stamped asymmetrically near the writing, much smaller than the characters.'
ACC='The word must read exactly 십이화 - three Korean syllable blocks 십, 이, 화 - correctly formed and still legible despite the expressive freedom. No extra words, no invented glyphs, no Latin letters. Nothing else in the image: no hands, no people, no background objects, just the paper and the writing filling the frame.'

gen () {  # $1=dir $2=구성
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $CORE $FREE $2 $INK $SEAL $ACC Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

gen v1 'Composition: the three characters run across in one horizontal sweep, but the last one is dramatically larger with a tail that whips far out to the side.' &
gen v2 'Composition: stacked in two rough rows - 십이 above, 화 below and much larger, offset to one side, the rows not aligned with each other.' &
gen v3 'Composition: written VERTICALLY top to bottom in one column, the characters drifting slightly left and right off the axis as the brush travels down.' &
gen v4 'Composition: a diagonal flow from upper left to lower right, characters shrinking and then suddenly swelling, generous empty paper around them.' &
wait
gen v5 'Composition: the three Korean characters written large and free, and BELOW them the three Chinese characters 十二花 written small in the same wild hand - not neat, same dry brush, same energy, slightly tilted.' &
gen v6 'Composition: the three Korean characters written large and free, with the three Chinese characters 十二花 written small VERTICALLY down the right side like an inscription, in the same wild hand.' &
wait
echo "=== done ==="; ls v?/logo.png 2>/dev/null | wc -l

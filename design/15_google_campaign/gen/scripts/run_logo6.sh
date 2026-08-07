#!/bin/bash
# 「십이화」 로고 시안 8종 — 2차. 진짜 서예 느낌으로.
#
# 1차(s1~s8)가 폰트처럼 보인 원인: 프롬프트에 "같은 높이·같은 베이스라인·균등 자간"을 넣었다.
#   그건 폰트의 특성이지 서예의 특성이 아니다. 서예는 글자마다 크기가 다르고 축이 기울고
#   획의 굵기가 급변하며 갈필(비백)과 농담이 살아 있다. 그 제약을 걷어내고 반대로 지시한다.
# 디자인 요소도 추가한다 — 붉은 낙관(印), 먹 번짐, 한 획을 길게 빼는 처리.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

CORE='A game title logo on a PURE SOLID BLACK background: the Korean word 십이화 written as GENUINE KOREAN CALLIGRAPHY (서예) by a master with a real ink brush on paper. This must look HAND-WRITTEN, never typeset.'

BRUSH='Essential calligraphic qualities - make these unmistakable: stroke width changes dramatically within a single stroke, from a heavy pressed start to a thin whipping tail; visible 비백 dry-brush streaks where the bristles split and black shows through the gold; a clear entry mark where the brush lands and a sharp flick where it leaves; ink density varies from saturated to faded across the word. The three characters are NOT the same size and do NOT sit on a rigid baseline - they breathe, one larger, another smaller, axes slightly tilted, spacing irregular and organic as a human hand makes it. One stroke sweeps out far longer than the others as the signature gesture of the piece.'

GOLD='Rendered in rich gold leaf with hammered metallic texture and darker gold shadow inside the strokes, on black.'

ACC='The word must read exactly 십이화 - three Korean syllable blocks 십, 이, 화 in that order, correctly formed and legible despite the expressive hand. No extra characters, no invented glyphs, no Latin letters. Generous empty black margin on all four sides. No background art, no cards, no frame, no people.'

SEAL='DESIGN ELEMENT: add a small square vermilion seal (낙관) beside the word - a red stamped square with carved characters inside, placed asymmetrically at the lower right or upper left, much smaller than the word. Also allow a few faint ink spatter marks near the strokes.'

SUB='Directly BELOW the Korean word, centred and MUCH SMALLER (about one quarter of its height), add the three Chinese characters 十二花 on one line in a neat small brush hand - a quiet subordinate line, clearly legible.'

gen () {  # $1=dir $2=서체 $3=추가요소
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $CORE $2 $BRUSH $GOLD $3 $ACC Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

A='School: 추사체 - eccentric and angular, blunt chisel-like strokes at extreme thick-thin contrast, deliberately off-balance composition, scholarly and severe.'
B='School: 행서 semi-cursive - strokes connect and flow into one another with visible brush travel between characters, fast confident movement, fluid but readable.'
C='School: 초서 wild cursive - dissolved and sweeping, characters nearly merge into one continuous gesture, dramatic long trailing tail, wild and emotional.'
D='School: 예서 clerical - broad flat horizontal strokes with heavy silkworm-head starts and flared wild-goose-tail endings, archaic, carved and monumental.'

gen t1 "$A" "$SEAL" &
gen t2 "$B" "$SEAL" &
gen t3 "$C" "$SEAL" &
gen t4 "$D" "$SEAL" &
wait
gen t5 "$A" "$SEAL $SUB" &
gen t6 "$B" "$SEAL $SUB" &
gen t7 "$C" "$SEAL $SUB" &
gen t8 "$D" "$SEAL $SUB" &
wait
echo "=== done ==="; ls t?/logo.png 2>/dev/null | wc -l

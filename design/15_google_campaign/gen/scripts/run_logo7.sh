#!/bin/bash
# 「십이화 + 十二花」 — 한자도 같은 서예 붓으로.
# 2차(t5~t8)에서 한자가 정자체로 나온 원인: "neat small brush hand"라고 써서 얌전해졌다.
# 이번엔 한자에도 한글과 동일한 붓 물리(굵기 급변·비백·입필수필·불규칙)를 명시한다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

CORE='A game title logo on a PURE SOLID BLACK background: the Korean word 십이화 written as GENUINE KOREAN CALLIGRAPHY (서예) by a master with a real ink brush. This must look HAND-WRITTEN, never typeset.'

BRUSH='Essential calligraphic qualities - make these unmistakable: stroke width changes dramatically within a single stroke, from a heavy pressed start to a thin whipping tail; visible 비백 dry-brush streaks where the bristles split; a clear entry mark where the brush lands and a sharp flick where it leaves; ink density varies from saturated to faded. The characters are NOT the same size and do NOT sit on a rigid baseline - they breathe, axes slightly tilted, spacing irregular and organic. One stroke sweeps out far longer than the others as the signature gesture.'

SUB='BELOW the Korean word, centred and about one quarter of its height, add the three Chinese characters 十二花 on one line. CRITICAL: these hanja are written by THE SAME HAND WITH THE SAME BRUSH as the Korean above - they must NOT be typeset, NOT a printed font, NOT neat or uniform. Give them the same dramatic thick-to-thin stroke modulation, the same dry-brush 비백 streaks, the same living entry and exit marks, slightly uneven sizes and a slightly tilted axis. Smaller in scale but identical in energy and texture - clearly the same calligrapher wrote both lines in one sitting.'

GOLD='Everything rendered in rich gold leaf with hammered metallic texture and darker gold shadow inside the strokes, on black.'
SEAL='DESIGN ELEMENT: a small square vermilion seal (낙관) placed asymmetrically beside the word, much smaller than it, not overlapping the hanja line. A few faint ink spatter marks near the strokes.'
ACC='The Korean must read exactly 십이화 and the hanja exactly 十二花. Correctly formed and legible despite the expressive hand. No extra characters, no invented glyphs, no Latin letters. Generous empty black margin on all four sides. No background art, no cards, no frame, no people.'

gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $CORE $2 $BRUSH $SUB $GOLD $SEAL $ACC Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

A='School: 추사체 - eccentric and angular, blunt chisel-like strokes at extreme thick-thin contrast, deliberately off-balance, scholarly and severe.'
B='School: 행서 semi-cursive - strokes connect and flow into one another with visible brush travel, fast confident movement, fluid but readable.'
C='School: 초서 wild cursive - dissolved and sweeping, characters nearly merge into one continuous gesture, dramatic long trailing tail.'
D='School: 예서 clerical - broad flat horizontal strokes with heavy silkworm-head starts and flared wild-goose-tail endings, archaic and monumental.'

gen u1 "$A" & gen u2 "$B" & gen u3 "$C" & gen u4 "$D" &
wait
echo "=== done ==="; ls u?/logo.png 2>/dev/null | wc -l

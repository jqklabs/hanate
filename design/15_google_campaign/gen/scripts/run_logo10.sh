#!/bin/bash
# 「십이화」 시안 8종 — w3(최종_39) 느낌을 기준으로.
#   x1~x4 : 한자 없음
#   x5~x8 : 아래 十二花 병기 (같은 붓)
# w3를 스타일 레퍼런스로 물려 붓맛·금박·먹튀김을 계승하고 구성만 변주한다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

REF='The attached image is the reference for the LOOK: match its brush character exactly - the same hand, the same thick confident gold strokes with dry-brush 비백 streaks, the same heavy pressed starts whipping into thin flicking tails, the same scattered gold spatter, the same pure flat black background. Keep that energy; only the composition changes.'

CORE='A piece of contemporary Korean calligraphy: the word 십이화 written by a master with a large brush, freely and spontaneously as an ARTWORK, in rich gold leaf on a PURE SOLID BLACK background.'

FREE='This is art, not lettering. NO grid, NO baseline, NO even spacing, NO consistent character size - the characters are placed intuitively, one much larger, another smaller and tucked in, sitting at different heights and slightly different angles. Asymmetric, reads as a single breath. Nothing neat or uniform, never typeset.'

SUB='BELOW the Korean, add the three Chinese characters 十二花 small, written by THE SAME HAND WITH THE SAME BRUSH - not typeset, not neat, same thick-to-thin modulation, same dry-brush streaks, slightly tilted and uneven sizes.'

ACC='The word must read exactly 십이화 - three Korean syllable blocks 십, 이, 화 - correctly formed and legible despite the freedom. No extra words, no invented glyphs, no Latin letters, NO SEAL, no stamp, no frame, no ornaments, no background art, no paper texture, no glow. Generous empty black margin on all four sides.'

gen () {  # $1=dir $2=구성 $3=한자
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../w3/logo.png -- \
      "$HEAD $REF Prompt: $CORE $FREE $2 $3 $ACC Then save the generated file to ./logo.png" \
      < /dev/null > log.txt 2>&1 ) ; true
}

C1='Composition: horizontal sweep, the middle character riding high and small, the last one large with a long tail flicking down and out to the right.'
C2='Composition: horizontal, the FIRST character largest and heaviest, the following two shrinking and trailing away lighter, like a shout fading.'
C3='Composition: the three characters tightly packed and overlapping slightly, dense and compact, one long stroke slashing diagonally through the cluster.'
C4='Composition: wide and airy, the characters spread apart with generous black between them, each leaning at a different angle, one stroke sweeping far left.'

gen x1 "$C1" '' & gen x2 "$C2" '' & gen x3 "$C3" '' & gen x4 "$C4" '' &
wait
gen x5 "$C1" "$SUB" & gen x6 "$C2" "$SUB" & gen x7 "$C3" "$SUB" & gen x8 "$C4" "$SUB" &
wait
echo "=== done ==="; ls x?/logo.png 2>/dev/null | wc -l

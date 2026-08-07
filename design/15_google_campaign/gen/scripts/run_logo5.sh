#!/bin/bash
# 「십이화」 로고 시안 8종 — 폰트가 아니라 캘리그라피로.
#   s1~s4 : 한글 「십이화」만
#   s5~s8 : 한글 「십이화」 아래 작게 한자 「十二花」
# 기존 로고를 물리지 않는다 — 새 붓맛을 보려는 것이므로 스타일을 상속시키면 의미가 없다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
CORE='A logo wordmark on a PURE SOLID BLACK background, hand-lettered KOREAN CALLIGRAPHY - written with a real brush, NOT set in a font. Rich gold leaf with hammered metallic texture and darker gold shadow inside the strokes.'
ACC='TEXT ACCURACY IS CRITICAL: exactly three Korean syllable blocks 십, 이, 화 in that order, correctly formed and clearly legible, no extra characters, no invented glyphs, no Latin letters. Centred with generous empty black margin on all four sides - no stroke touches the edge. Nothing else in the image: no background art, no cards, no ornaments, no frame, no people, no seal.'
SUB='Directly BELOW the Korean word, centred and MUCH SMALLER (about one third of its height), add the three Chinese characters 十二花 on one horizontal line, in the same gold brush hand, clearly legible with even spacing. The Korean is unmistakably the main wordmark and the hanja is a small subordinate line beneath it.'

gen () {  # $1=dir  $2=스타일  $3=한자 병기 여부
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $CORE The wordmark reads 십이화. $2 $3 $ACC Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

A='Style: powerful and rugged - thick dry-brush strokes with torn ragged edges and visible bristle streaks, slight forward lean, like a Korean historical action film title.'
B='Style: elegant and flowing - a scholar hand, slender tapering strokes with graceful curves and long sweeping terminals, like a traditional calligraphy scroll.'
C='Style: dense and heavy - very thick blunt strokes packed tightly together, squarish and weighty, almost carved, immense presence.'
D='Style: loose and playful - fast cursive brushwork with lively uneven baselines and spontaneous ink splatter, energetic and modern.'

gen s1 "$A" '' &
gen s2 "$B" '' &
gen s3 "$C" '' &
gen s4 "$D" '' &
wait
gen s5 "$A" "$SUB" &
gen s6 "$B" "$SUB" &
gen s7 "$C" "$SUB" &
gen s8 "$D" "$SUB" &
wait
echo "=== done ==="; ls s?/logo.png 2>/dev/null | wc -l

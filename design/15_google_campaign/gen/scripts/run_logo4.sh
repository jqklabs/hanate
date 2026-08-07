#!/bin/bash
# 로고 네이밍 테스트 10장 — 한자 5안 × (한자만 / 한자+한글) 2종.
#   落花:낙화  打花:타화  花打:화타  打上花:타상화  光花:광화
# 기존 로고를 스타일 레퍼런스로 물려 금박 붓글씨 질감을 유지한다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REFNOTE='The attached image is our current logo. Match its brush calligraphy character exactly - the same hand, the same stroke weight, the same torn gold-leaf texture, the same dry-brush edges, the same confident energy.'
TAIL='Render it in bold gold-leaf brush calligraphy - thick confident East Asian ink-brush strokes with torn hammered gold-foil texture, dry-brush edges, warm rich gold with darker gold shadow inside the strokes. TEXT ACCURACY IS CRITICAL: reproduce the characters exactly as specified, correctly formed and clearly legible, no extra characters, no missing characters, no invented glyphs. All characters the SAME HEIGHT on one horizontal baseline, evenly spaced. Centred with generous empty black margin on all four sides - nothing touches the edges. Background is PURE SOLID BLACK. Nothing else in the image: no background art, no cards, no ornaments, no frame, no people, no seal, no extra text.'

gen () {  # $1=dir  $2=문자 지시
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../logo_og.png -- \
      "$HEAD $REFNOTE Prompt: A logo wordmark on a pure solid black background. $2 $TAIL Then save the generated file to ./logo.png" \
      > log.txt 2>&1 ) ; true
}

H='The wordmark is written in Chinese characters (hanja) only, no Korean and no Latin letters.'
M='The wordmark is one horizontal line combining Chinese characters, then a space, then a colon character :, then a space, then Korean hangul. Render the colon clearly. Keep the hanja slightly larger and the hangul slightly smaller, all on the same baseline.'

gen n01 "The wordmark reads exactly the two Chinese characters 落花. $H" &
gen n02 "The wordmark reads exactly: 落花 : 낙화 . $M" &
gen n03 "The wordmark reads exactly the two Chinese characters 打花. $H" &
gen n04 "The wordmark reads exactly: 打花 : 타화 . $M" &
wait
gen n05 "The wordmark reads exactly the two Chinese characters 花打. $H" &
gen n06 "The wordmark reads exactly: 花打 : 화타 . $M" &
gen n07 "The wordmark reads exactly the three Chinese characters 打上花. $H" &
gen n08 "The wordmark reads exactly: 打上花 : 타상화 . $M" &
wait
gen n09 "The wordmark reads exactly the two Chinese characters 光花. $H" &
gen n10 "The wordmark reads exactly: 光花 : 광화 . $M" &
wait
echo "=== done ==="; ls n*/logo.png 2>/dev/null | wc -l

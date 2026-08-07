#!/bin/bash
# 「HWATRO」 로마자 로고 생성 — 한글 「화투로」가 정책상 문제가 되어 로마자로 간다.
# 기존 로고를 스타일 레퍼런스로 물려 같은 붓·같은 금박 질감을 유지한다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REFNOTE='The attached image is our current Korean logo. Match its brush calligraphy character exactly - the same hand, the same stroke weight, the same torn gold-leaf texture, the same dry-brush edges and the same confident energy. Only the script changes, from Korean to Latin letters.'
BASE='A logo wordmark on a PURE SOLID BLACK background. The wordmark is the single English word HWATRO in capital letters, spelled exactly H-W-A-T-R-O, six letters, one word, no spaces. Render it in bold gold-leaf brush calligraphy - thick confident ink-brush strokes with torn hammered gold-foil texture, dry-brush edges, warm rich gold with darker gold shadow inside the strokes, painted with an East Asian brush rather than a Western pen. TEXT ACCURACY IS CRITICAL: exactly the six letters H W A T R O in that order, correctly formed and clearly legible, no extra letters, no missing letters, no invented characters, no Korean characters. All six letters are the SAME HEIGHT sitting on one horizontal baseline, evenly spaced. Centred with generous empty black margin on all four sides - nothing touches the edges. Nothing else in the image: no background art, no cards, no ornaments, no frame, no people, no subtitle, no Korean text.'
gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../logo_og.png -- \
      "$HEAD $REFNOTE Prompt: $BASE $2 Then save the generated file to ./logo.png" > log.txt 2>&1 ) ; true
}
gen logoG 'Style note: bold and powerful, like a Korean historical action film title.' &
gen logoH 'Style note: heavy and rugged, thick dry-brush strokes with strong texture, wide letterforms.' &
gen logoI 'Style note: elegant and flowing, slightly more slender strokes, like a calligraphy scroll.' &
wait
echo "=== done ==="; ls -la logo[GHI]/logo.png 2>/dev/null

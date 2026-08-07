#!/bin/bash
# 「화트로」 로고 생성 — 「화투로」가 정책상 문제가 되어 교체한다.
# 기존 로고(logo_og.png)를 스타일 레퍼런스로 물려 같은 붓·같은 금박 질감을 유지한다.
cd "$(dirname "$0")" || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REFNOTE='The attached image is our current logo. Match its calligraphy style, stroke weight, gold-leaf texture and overall proportions exactly - the same hand, the same energy. Only the middle character changes.'
BASE='A logo wordmark on a PURE SOLID BLACK background. The wordmark is the Korean word 화트로 written in exactly three syllable blocks: 화, then 트, then 로. The middle character is 트 (tieut + eu), NOT 투. Render it in bold gold-leaf brush calligraphy - thick confident ink-brush strokes with torn hammered gold-foil texture, dry-brush edges, warm rich gold with darker gold shadow inside the strokes. TEXT ACCURACY IS CRITICAL: exactly three Korean syllable blocks 화 트 로, spelled correctly, correctly formed, no extra strokes, no invented glyphs, no additional characters. All three characters are the SAME SIZE on one horizontal baseline, evenly spaced, the last character 로 fully formed and exactly as large as the other two. Centred with generous empty black margin on all four sides - nothing touches the edges. Nothing else in the image: no background art, no cards, no ornaments, no frame, no people, no subtitle, no English text.'
gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../logo_og.png -- \
      "$HEAD $REFNOTE Prompt: $BASE $2 Then save the generated file to ./logo.png" > log.txt 2>&1 ) ; true
}
gen logoD 'Style note: bold and powerful, like a Korean historical action film title.' &
gen logoE 'Style note: heavy and rugged, thick dry-brush strokes with strong texture, wide letterforms.' &
gen logoF 'Style note: elegant and flowing, slightly more slender strokes, like a calligraphy scroll.' &
wait
echo "=== done ==="; ls -la logo[DEF]/logo.png 2>/dev/null

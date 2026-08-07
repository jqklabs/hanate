#!/bin/bash
# 「화투로」 로고 전용 생성. 순검정 배경 위에 금박 서예만 → 루마키로 투명 PNG를 만든다.
# OG 아트에서 잘라 쓰던 방식은 배경 잔상과 획 잘림이 계속 나와서 로고를 직접 뽑는다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
BASE='A logo wordmark on a PURE SOLID BLACK background. The wordmark is the Korean word 화투로 written in three characters: 화, 투, 로. Render it in bold gold-leaf brush calligraphy - thick confident ink-brush strokes with torn hammered gold-foil texture, dry-brush edges, warm rich gold with darker gold shadow inside the strokes. TEXT ACCURACY IS CRITICAL: exactly three Korean syllable blocks, 화 then 투 then 로, spelled correctly, correctly formed, no extra strokes, no invented glyphs, no additional characters or letters of any kind. All three characters are the SAME SIZE and sit on one horizontal baseline, evenly spaced, the last character 로 fully formed and exactly as large as the other two. The wordmark is centred with generous empty black margin on all four sides - nothing touches the edges of the image. Nothing else in the image: no background art, no cards, no ornaments, no frame, no people, no subtitle, no English text. Just the gold wordmark on flat black.'

gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -- \
      "$HEAD Prompt: $BASE $2 Then save the generated file to ./logo.png" > log.txt 2>&1 )
}

gen logoA 'Style note: bold and powerful, like a Korean historical action film title.' &
gen logoB 'Style note: elegant and flowing, like a traditional calligraphy scroll, slightly more slender strokes.' &
gen logoC 'Style note: heavy and rugged, thick dry-brush strokes with strong texture, wide letterforms.' &
wait
echo "=== done ==="
ls -la logo?/logo.png

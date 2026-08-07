#!/bin/bash
# 11월 재생성 — 「십이화 = 열두 꽃」 컨셉.
# 화투 11월은 오동(桐). 보라빛 오동꽃이 화면을 채우고 봉황은 배경으로 물린다.
# 기존 11월은 봉황이 화면을 지배해 꽃 컨셉에서 벗어나 있었다.
cd "$(dirname "$0")/.." || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
STYLE='Korean mobile game key visual illustration, painterly semi-realistic, traditional Korean ink-wash texture, high detail, elegant, atmospheric.'
FLOWER='THE FLOWERS ARE THE SUBJECT OF THIS IMAGE. They must dominate - massed, layered and abundant, crowding the frame from edge to edge, in front of her as well as behind her so she stands INSIDE the bloom rather than in front of a backdrop. Petals drift through the air. She is present and her face is clearly readable, but the flowers carry the picture.'

NEG='CRITICAL - the image must contain NO TEXT WHATSOEVER: no Korean, no hanzi, no English, no letters, numbers, logos, watermarks or calligraphy anywhere.
ALSO STRICTLY EXCLUDE, this is a policy requirement: any playing card, hwatu card or card-shaped object; any gaming table, felt cloth or game board; any cup, bowl, wine vessel, bottle or drinking vessel; any alcohol; any coin, token, chip, medal, gold disc or round metallic object; any money or treasure; any dice; any curtain, drape or hanging banner; any circular disc dominating the composition; any group of people seated together; any game UI or scoreboard.'

SQ='SQUARE 1:1 composition. She stands on the RIGHT. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT must be calm, dark and almost empty - flowers thin out into shadow there - because large lettering goes there later.'

gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ../../ref/ref_char_modest.png -- \
      "$HEAD $REF Prompt: $STYLE $FLOWER $SQ $2 $NEG Then save the generated file to ./art.png" \
      < /dev/null > log.txt 2>&1 ) ; true
}

gen plates/f11 'The flower of the eleventh month: paulownia. Great trusses of pale violet paulownia blossom hang in heavy clusters, broad paulownia leaves layered behind them, filling the frame from every edge; violet petals drift down. Late autumn, warm low daylight. Far in the background a phoenix is only faintly suggested through the foliage - it must stay small, distant and secondary, never dominating. Her expression is a mocking smirk - chin lifted, looking down at the viewer with amused contempt. She wears an opaque white jeogori with a deep purple brocade overvest and a red skirt. Violet, gold and warm brown palette.'

echo "=== done ==="
[ -f plates/f11/art.png ] && sips -g pixelWidth -g pixelHeight plates/f11/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print "f11 "w"x"h}' || echo "f11 없음"

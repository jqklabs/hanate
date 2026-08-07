#!/bin/bash
# v3 시안 2차 — 1~3월. 광고용 정본(상의 불투명) ref_char_modest.png 사용.
# 1차에서 병렬 실행 시 파일 충돌이 났으므로 월별 서브디렉토리에서 격리 실행한다.
cd "$(dirname "$0")" || exit 1

NEG='ABSOLUTELY DO NOT INCLUDE: any text, letters, numbers, logos, watermarks, signatures; a green felt gaming table or blanket; cards fanned in her hand; cards laid out on a surface; several people sitting around a table; coins, money, gambling imagery; any game UI, score panel or scoreboard.'
REF='Reference 1 is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and costume EXACTLY, same painterly art style. Her white jeogori is SOLID OPAQUE white silk, never sheer or transparent - reproduce it exactly as opaque as in the reference. Reference 2 is an authentic Korean hwatu card - match its ink-painting style for the floating card.'
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
MODESTY='Her chest is completely and modestly covered by opaque fabric - no transparency, no skin showing through, no visible bust contour, no cleavage.'
FLOAT='ONE single hwatu card floats in the air beside her, large and clearly readable, glowing with golden light like a sacred talisman or floating rune - it is NOT held in her hand and NOT touching her.'

gen () {  # $1=dir  $2=out  $3=card  $4=scene
  mkdir -p "$1" && cp ref_char_modest.png "$1/" && cp "$3" "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -i "./$(basename "$3")" -- \
      "$HEAD $REF Prompt: $4 $MODESTY $FLOAT $NEG Then save the generated file to ./$2" \
      > "log.txt" 2>&1 )
}

gen m01 01_january.png ./card_1-gwang.png \
'Painterly semi-realistic Korean illustration, SQUARE 1:1 composition. A young Korean woman in an opaque white jeogori and deep red floral chima stands in a snow-covered pine grove at dawn. A large red winter sun rises behind the black pines. A white crane descends through falling snow beside her. She looks straight at the viewer with a calm, warm, knowing smile. CLOSE framing - her head and shoulders dominate the frame, her face occupies at least one third of the image height. Cinematic natural daylight, crisp shadows, cold blue-white snow tones with deep crimson and gold accents. Traditional Korean ink-wash texture in the background mist. High detail, elegant, mystical fantasy mood.' &

gen m02 02_february.png ./card_2-yeolkkeut-warbler.png \
'Painterly semi-realistic Korean illustration in a WIDE LANDSCAPE 3:2 horizontal format, much wider than tall. A young Korean woman in an opaque white jeogori and deep red floral chima stands at night beneath blossoming plum branches, positioned on the RIGHT third of the frame. Moonlit night, pale plum blossoms glowing against deep indigo darkness. A small bush warbler perches on a branch near her, singing. Her expression is thoughtful and pensive, eyes lowered slightly in contemplation, one hand raised near her chin. The LEFT half of the frame is quiet empty negative space of night sky, distant plum branches and drifting petals. Cool moonlight, low saturation, indigo and ivory palette with faint gold. Traditional Korean ink-wash texture. High detail, elegant, quiet mystical mood. The output MUST be landscape orientation.' &

gen m03 03_march.png ./card_3-gwang.png \
'Painterly semi-realistic Korean illustration, TALL VERTICAL PORTRAIT composition. A young Korean woman in an opaque white jeogori and deep red floral chima stands inside a blizzard of cherry blossom petals in bright daylight. Behind her a tall crimson ceremonial curtain hangs torn and whipping in the wind, its silk ripped open. Cherry blossoms storm across the frame in dense drifts. HER EXPRESSION IS A CLEAR COLD SNEER - she looks directly at the viewer, one eyebrow slightly raised, eyes narrowed and sharp with open contempt, the corner of her mouth curled in a mocking half-smile. This scornful expression must be unmistakable. CLOSE framing - her face occupies at least one third of the image height. Harsh bright spring daylight, strong directional shadows, pink and crimson palette against a pale sky. Traditional Korean ink-wash texture. High detail, elegant, tense and ominous mood beneath the beauty.' &

wait
echo "=== done ==="
ls -la m0*/0*.png

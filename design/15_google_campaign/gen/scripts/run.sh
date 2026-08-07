#!/bin/bash
# v3 시안 생성 — 1~3월. 캐릭터 시트 정본 + 그 달의 실제 카드 아트를 레퍼런스로 물린다.
cd "$(dirname "$0")" || exit 1

COMMON_NEG='ABSOLUTELY DO NOT INCLUDE: any text, letters, numbers, logos, watermarks, signatures; a green felt gaming table or blanket; cards fanned in her hand; cards laid out on a surface; several people sitting around a table; coins, money, gambling imagery; any game UI, score panel or scoreboard.'
COMMON_REF='Reference 1 is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and hanbok EXACTLY, same painterly art style. Reference 2 is an authentic Korean hwatu card - match its ink-painting style for the floating card.'
COMMON_HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
MODESTY='CRITICAL: her inner garment is fully OPAQUE, chest completely and modestly covered, no cleavage, no sheer or transparent fabric.'
FLOAT='ONE single hwatu card floats in the air beside her, glowing with soft golden light like a sacred talisman or floating rune - it is NOT held in her hand and NOT touching her.'

gen () {  # $1=out  $2=card ref  $3=scene prompt
  codex exec --sandbox workspace-write --skip-git-repo-check \
    -i ./ref_char.jpg -i "$2" -- \
    "$COMMON_HEAD $COMMON_REF Prompt: $3 $MODESTY $FLOAT $COMMON_NEG Then save the generated file to ./$1" \
    > "log_${1%.png}.txt" 2>&1
}

gen 01_january.png ./card_1-gwang.png \
'Painterly semi-realistic Korean illustration, SQUARE 1:1 composition. A young Korean woman in a white jeogori and deep red floral chima stands in a snow-covered pine grove at dawn. A large red winter sun rises behind the black pines. A white crane descends through falling snow beside her. She looks at the viewer with a calm, warm, knowing smile. Her face occupies at least one third of the frame. Cinematic natural daylight, crisp shadows, cold blue-white snow tones with deep crimson and gold accents. Traditional Korean ink-wash texture in the background mist. High detail, elegant, mystical fantasy mood.' &

gen 02_february.png ./card_2-yeolkkeut-warbler.png \
'Painterly semi-realistic Korean illustration, WIDE HORIZONTAL cinematic composition with generous empty negative space on the LEFT side. A young Korean woman in a white jeogori and deep red floral chima stands at night beneath blossoming plum branches, positioned on the RIGHT side of the frame. Moonlit night, pale plum blossoms glowing against deep indigo darkness. A small bush warbler perches on a branch near her, singing. Her expression is thoughtful and pensive, eyes lowered slightly in contemplation, one hand raised near her chin. The LEFT side is quiet night sky and drifting petals. Cool moonlight, low saturation, indigo and ivory palette with faint gold. Traditional Korean ink-wash texture. High detail, elegant, quiet mystical mood.' &

gen 03_march.png ./card_3-gwang.png \
'Painterly semi-realistic Korean illustration, TALL VERTICAL PORTRAIT composition. A young Korean woman in a white jeogori and deep red floral chima stands inside a blizzard of cherry blossom petals in bright daylight. Behind her a tall crimson ceremonial curtain hangs torn and whipping in the wind, its silk ripped open. Cherry blossoms storm across the frame in dense drifts. Her expression is a cold sneer - chin slightly lowered, eyes sharp and unimpressed, a faint contemptuous curl at the corner of her mouth. Her face occupies at least one third of the frame. Harsh bright spring daylight, strong directional shadows, pink and crimson palette against a pale sky. Traditional Korean ink-wash texture. High detail, elegant, tense and ominous mood beneath the beauty.' &

wait
echo "=== done ==="
ls -la *.png

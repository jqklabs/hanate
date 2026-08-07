#!/bin/bash
# 1·3·9·12월 재생성 — 도박 관련 반려분.
#
# 정확한 반려 사유는 미확인이나, 의심 요소를 전부 제거한다:
#  · 술잔·잔·그릇 등 음주 소품 (9월 국진의 술잔)
#  · 화투 광 카드 도상을 그대로 재현하는 구도 (붉은 장막·우산+제비 조합 등)
#  · 동전·칩으로 오독될 수 있는 원형 금빛 입자
#  · 붉은 원반(해/달)이 화면을 지배하는 구성
# 대신 계절 자체와 인물에 집중한다. 글자는 넣지 않는다(후처리 조판).
cd "$(dirname "$0")/.." || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
STYLE='Korean mobile game key visual illustration, painterly semi-realistic, traditional Korean ink-wash texture, high detail, elegant, atmospheric. The young Korean woman is the main subject, large in frame, her face big and clearly readable.'

NEG='CRITICAL - the image must contain NO TEXT WHATSOEVER: no Korean, no hanzi, no English, no letters, numbers, logos, watermarks or calligraphy anywhere.
ALSO STRICTLY EXCLUDE, this is a policy requirement: any playing card, hwatu card, card back or card-shaped object; any gaming table, felt cloth or game board; any cup, bowl, wine vessel, bottle or drinking vessel of any kind; any alcohol; any coin, token, chip, medal, gold disc or round metallic object; any money, purse or treasure; any dice; any curtain, drape or hanging banner; any circular disc dominating the composition; any group of people seated together; any game UI, score panel or scoreboard.'

gen () {  # $1=dir $2=비율 $3=장면
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ../../ref/ref_char_modest.png -- \
      "$HEAD $REF Prompt: $STYLE $2 $3 $NEG Then save the generated file to ./art.png" \
      < /dev/null > log.txt 2>&1 ) ; true
}

SQ='SQUARE 1:1 composition. She stands on the RIGHT side of the frame. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later.'
TALL='PORTRAIT composition in a 2:3 ratio, taller than wide. She occupies the UPPER TWO THIRDS. COMPOSITION REQUIREMENT: the LOWER THIRD must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later.'

# 01 · 1월 — 붉은 해 원반을 빼고 눈 내리는 소나무 숲과 학의 비상으로
gen plates/r01 "$SQ" 'DAYLIGHT winter scene: a snow-covered pine forest under a pale overcast sky, no sun and no moon visible anywhere. A single white crane takes flight through the falling snow behind her, wings spread. Snow-laden branches arch overhead. She looks at the viewer with a calm, warm, knowing smile. WINTER COSTUME: an opaque quilted white jeogori under a deep crimson sleeveless vest trimmed with white fur, and a heavy deep red skirt; her breath faintly visible. Cold blue-white palette with crimson accents, soft diffused daylight.'

# 03 · 3월 — 붉은 장막을 빼고 벚꽃 폭설만으로
gen plates/r03 "$TALL" 'DAYLIGHT spring scene: a dense blizzard of cherry blossom petals filling the air, ancient blossoming cherry branches crowding the upper frame, distant misty hills. No fabric, no banner, no drape anywhere. Her expression is a cold sneer - chin lowered, eyes narrowed and sharp with open contempt, the corner of her mouth curled. SPRING COSTUME: an opaque white jeogori with a light rose-pink silk overvest and a deep red skirt. Bright spring daylight, pink and white palette against a pale sky.'

# 09 · 9월 — 술잔을 빼고 국화밭과 서리로
gen plates/r09 "$TALL" 'DAYLIGHT early-autumn scene: a vast field of yellow and white chrysanthemums in clear crisp light, morning frost on the petals, a few dragonflies. Nothing is held and nothing rests on the ground. Her expression is shock and exhilaration - eyes wide, leaning back slightly, as if something just burst in front of her. EARLY-AUTUMN COSTUME: an opaque white jeogori with a golden-ochre silk overvest and a deep red skirt. Crisp autumn sunlight, gold and amber palette.'

# 12 · 12월 — 우산·제비를 빼고 겨울비 내리는 버드나무만으로
gen plates/r12 "$TALL" 'NIGHT winter scene: heavy cold rain falling through bare willow branches, puddles catching faint light, deep slate darkness. She stands bare-headed in the rain, nothing held in her hands, no umbrella and no birds anywhere. Her expression is quiet sorrow - eyes lowered, rain on her face, resigned but standing straight. WINTER COSTUME: an opaque white jeogori under a dark padded winter overcoat with a deep red skirt showing beneath. Near-monochrome slate and black with a single red accent, rain streaks catching light.'

wait
echo "=== done ==="
for d in r01 r03 r09 r12; do printf '%s ' $d; [ -f plates/$d/art.png ] && sips -g pixelWidth -g pixelHeight plates/$d/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}' || echo 없음; done

#!/bin/bash
# 1·3·9·12월 재생성 — 「십이화(十二花) = 열두 꽃」 컨셉.
#
# 브랜드명이 십이화이므로 그 달의 꽃을 화면의 주인공으로 세운다.
# 인물은 꽃밭 안에 있는 존재이지 꽃보다 앞서지 않는다.
# 부수 효과로 도박 연상 요소가 원천적으로 사라진다 — 화면에 꽃과 인물뿐이다.
cd "$(dirname "$0")/.." || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
STYLE='Korean mobile game key visual illustration, painterly semi-realistic, traditional Korean ink-wash texture, high detail, elegant, atmospheric.'
FLOWER='THE FLOWERS ARE THE SUBJECT OF THIS IMAGE. They must dominate - massed, layered and abundant, crowding the frame from edge to edge, in front of her as well as behind her so she stands INSIDE the bloom rather than in front of a backdrop. Petals drift through the air. She is present and her face is clearly readable, but the flowers carry the picture.'

NEG='CRITICAL - the image must contain NO TEXT WHATSOEVER: no Korean, no hanzi, no English, no letters, numbers, logos, watermarks or calligraphy anywhere.
ALSO STRICTLY EXCLUDE, this is a policy requirement: any playing card, hwatu card or card-shaped object; any gaming table, felt cloth or game board; any cup, bowl, wine vessel, bottle or drinking vessel; any alcohol; any coin, token, chip, medal, gold disc or round metallic object; any money or treasure; any dice; any curtain, drape or hanging banner; any circular disc dominating the composition; any group of people seated together; any game UI or scoreboard.'

gen () {  # $1=dir $2=비율 $3=장면
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ../../ref/ref_char_modest.png -- \
      "$HEAD $REF Prompt: $STYLE $FLOWER $2 $3 $NEG Then save the generated file to ./art.png" \
      < /dev/null > log.txt 2>&1 ) ; true
}

SQ='SQUARE 1:1 composition. She stands on the RIGHT. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT must be calm, dark and almost empty - flowers thin out into shadow there - because large lettering goes there later.'
TALL='PORTRAIT 2:3 composition, taller than wide. She occupies the UPPER TWO THIRDS. COMPOSITION REQUIREMENT: the LOWER THIRD must be calm, dark and almost empty - flowers thin out into shadow there - because large lettering goes there later.'

# 01 · 1월 송학 — 눈 속 소나무의 설화(雪花). 붉은 원반 없음
gen plates/f01 "$SQ" 'The flower of the first month: snow blossoms on ancient pine. Heavy snow has settled on dense pine boughs so the needles carry white blooms, branches crowding the whole frame, fine snow drifting. A white crane passes behind. Winter daylight, pale overcast sky, no sun and no moon. She smiles calmly at the viewer, wearing an opaque quilted white jeogori under a deep crimson fur-trimmed vest and a heavy red skirt. Cold blue-white palette with crimson accents.'

# 03 · 3월 벚꽃 — 장막 없이 벚꽃만
gen plates/f03 "$TALL" 'The flower of the third month: cherry blossom. An overwhelming mass of pale pink cherry blossom, heavy laden branches filling the frame from every edge, a blizzard of falling petals. No fabric, no banner, no drape anywhere. Her expression is a cold sneer - chin lowered, eyes narrowed and sharp with contempt. She wears an opaque white jeogori with a rose-pink silk overvest and a deep red skirt. Bright spring daylight, pink and white palette.'

# 09 · 9월 국진 — 술잔 없이 국화만
gen plates/f09 "$TALL" 'The flower of the ninth month: chrysanthemum. A dense wall of golden and white chrysanthemums in full bloom, enormous layered heads crowding the frame in front of and behind her, morning frost on the petals, petals lifting in the air. Nothing is held and nothing rests on the ground. Her expression is shock and exhilaration - eyes wide, leaning back slightly. She wears an opaque white jeogori with a golden-ochre silk overvest and a deep red skirt. Crisp autumn sunlight, gold and amber palette.'

# 12 · 12월 비 — 우산·제비 없이 비 맞는 겨울 동백으로
gen plates/f12 "$TALL" 'The flower of the twelfth month: winter camellia in cold rain. Deep red camellia blooms heavy with rain crowd the frame among bare willow branches, petals falling into dark water below, heavy rain streaking through. She stands bare-headed in the rain, nothing held in her hands, no umbrella and no birds. Her expression is quiet sorrow - eyes lowered, rain on her face, standing straight. She wears an opaque white jeogori under a dark padded winter overcoat with a deep red skirt. Near-monochrome slate and black with deep crimson blooms as the only colour.'

wait
echo "=== done ==="
for d in f01 f03 f09 f12; do printf '%s ' $d; [ -f plates/$d/art.png ] && sips -g pixelWidth -g pixelHeight plates/$d/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}' || echo 없음; done

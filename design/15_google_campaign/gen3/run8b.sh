#!/bin/bash
# run8.sh 1차 배치 실패분(m03~m07) + 비율이 어긋난 m12 재생성.
# 5-way 병렬에서 에이전트가 생성 대신 파일 탐색으로 빠지는 일이 있어 3개씩 나눠 돌린다.
cd "$(dirname "$0")" || exit 1
source /dev/stdin <<'VARS'
VARS
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem, do NOT read or edit any other files - just generate the image and save it.'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
STYLE='Korean mobile game key visual illustration, painterly semi-realistic, traditional Korean ink-wash texture, high detail, elegant, mystical. The young Korean woman is the main subject, large in frame, her face big and clearly readable.'
NEG='CRITICAL: the image must contain NO TEXT WHATSOEVER - no Korean, no hanzi, no English, no letters, numbers, logos, watermarks, signatures or calligraphy anywhere. Also do NOT include: any hwatu playing card or card object; a green felt gaming table or blanket; cards held in her hand; cards laid out on a surface; several people around a table; coins, money or gambling imagery; any game UI or score panel.'
SQ='SQUARE 1:1 composition (equal width and height), she stands on the RIGHT side of the frame. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later.'
WIDE='WIDE LANDSCAPE 3:2 horizontal format, much wider than tall, she dominates the RIGHT HALF with clear margin on the right, never cropped by the frame edge. COMPOSITION REQUIREMENT: the LEFT HALF must be calm, dark and almost empty. The output MUST be landscape orientation.'
TALL='PORTRAIT composition in a 2:3 ratio (taller than wide, but NOT extremely tall - roughly two units wide by three units high), she occupies the UPPER TWO THIRDS of the frame. COMPOSITION REQUIREMENT: the LOWER THIRD must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later.'

gen () {
  mkdir -p "$1" && cp ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -- "$HEAD $REF Prompt: $STYLE $2 $3 $NEG Then save the generated file to ./art.png" \
      > log.txt 2>&1 )
}

gen m03 "$TALL" 'DAYLIGHT scene: a blizzard of cherry blossom petals in bright spring daylight; behind her a tall crimson ceremonial curtain hangs torn and whipping in the wind. Her expression is a cold sneer - eyes narrowed and sharp with open contempt, one eyebrow slightly raised, the corner of her mouth curled. SPRING COSTUME: an opaque white jeogori with a light rose-pink silk overvest and a deep red skirt. Harsh bright daylight, pink and crimson palette against a pale sky.' &
gen m04 "$WIDE" 'NIGHT scene: dense black bush-clover thickets in deep darkness, a small bush warbler singing on a stem, thin moonlight edging the leaves. Her expression is calm and unreadable, looking straight at the viewer. LATE-SPRING NIGHT COSTUME: an opaque white jeogori with a dark charcoal-green silk overrobe and a deep red skirt. Very low saturation, near-monochrome greens and ink black with a faint silver rim light.' &
gen m05 "$SQ" 'DAYLIGHT scene: a wooden bridge over still water, tall iris and orchid leaves crowding the bank, early summer haze. Her expression is inviting and mischievous - a knowing half-smile, head tilted slightly, eyes meeting the viewer. EARLY-SUMMER COSTUME: a light opaque white ramie jeogori with pale violet trim and a deep red skirt. Soft warm daylight, violet and jade palette.' &
wait

gen m06 "$TALL" 'NIGHT scene: enormous crimson peonies in full bloom crowding around her, butterflies circling, deep summer night. Her expression is anger - brows drawn down, jaw set, glaring directly at the viewer. SUMMER NIGHT COSTUME: an opaque white jeogori with a deep wine-red gauze overrobe and a dark skirt. Rich saturated crimson against black, dramatic rim lighting.' &
gen m07 "$WIDE" 'DAYLIGHT scene: a bright summer bush-clover field, a wild boar standing in the grass behind her, heat haze and strong sun. Her expression is a warm confident smile at the viewer. MIDSUMMER COSTUME: a thin opaque white ramie jeogori with a crimson sash and a red skirt, light and airy. Strong summer daylight, deep green and crimson palette.' &
gen m12 "$TALL" 'NIGHT scene: heavy rain pouring through bare willow branches, a paper umbrella, a swallow cutting across the downpour, cold winter night. Her expression is quiet sorrow - eyes lowered, rain on her face, resigned but standing. WINTER RAIN COSTUME: an opaque white jeogori under a black oiled-paper rain cloak with a deep red skirt showing beneath. Near-monochrome slate and black with a single red accent, rain streaks catching light.' &
wait

echo "=== done ==="
for d in m03 m04 m05 m06 m07 m12; do printf '%s  ' $d; [ -f $d/art.png ] && sips -g pixelWidth -g pixelHeight $d/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}' || echo 없음; done

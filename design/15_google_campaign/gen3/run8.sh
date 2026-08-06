#!/bin/bash
# v3.5 — 3~12월 아트 플레이트 생성 (글자 없음).
#  · 그 달 화투패의 컨셉을 "실제 풍경"으로 그린다 (카드 오브젝트는 넣지 않는다)
#  · 계절에 맞는 의상 · 낮밤은 게임의 밤일낮장 규칙을 따른다 (홀수 낮 / 짝수 밤)
#  · 타이포가 앉을 영역을 어둡고 비어 있게 확보 → lockup.py 가 로고·부제·CTA·고지를 얹는다
#  · 비율: 1:1 = 01,05,08,11 / 1.91:1 = 02,04,07,10 / 4:5 = 03,06,09,12
# 월별 서브디렉토리에서 격리 실행한다 (같은 디렉토리에 병렬로 쓰면 파일이 충돌한다).
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
STYLE='Korean mobile game key visual illustration, painterly semi-realistic, traditional Korean ink-wash texture, high detail, elegant, mystical. The young Korean woman is the main subject, large in frame, her face big and clearly readable.'
NEG='CRITICAL: the image must contain NO TEXT WHATSOEVER - no Korean, no hanzi, no English, no letters, numbers, logos, watermarks, signatures or calligraphy anywhere. Also do NOT include: any hwatu playing card or card object; a green felt gaming table or blanket; cards held in her hand; cards laid out on a surface; several people around a table; coins, money or gambling imagery; any game UI or score panel.'

SQ='SQUARE 1:1 composition, she stands on the RIGHT side of the frame. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later; keep it quiet and slightly darker so bright gold type reads on top.'
WIDE='WIDE LANDSCAPE 3:2 horizontal format, much wider than tall, she dominates the RIGHT HALF with clear margin on the right, never cropped by the frame edge. COMPOSITION REQUIREMENT: the LEFT HALF must be calm, dark and almost empty - no branches or busy detail crossing it - because large lettering goes there later. The output MUST be landscape orientation.'
TALL='TALL VERTICAL PORTRAIT composition, she occupies the UPPER TWO THIRDS of the frame. COMPOSITION REQUIREMENT: the LOWER THIRD must be calm, dark and almost empty - no subject, no busy detail - because large lettering goes there later. The output MUST be portrait orientation, taller than wide.'

gen () {  # $1=dir  $2=비율지시  $3=장면
  mkdir -p "$1" && cp ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -- "$HEAD $REF Prompt: $STYLE $2 $3 $NEG Then save the generated file to ./art.png" \
      > log.txt 2>&1 )
}

# ── 1차 배치 ─────────────────────────────────────────────────
gen m03 "$TALL" 'DAYLIGHT scene: a blizzard of cherry blossom petals in bright spring daylight; behind her a tall crimson ceremonial curtain hangs torn and whipping in the wind. Her expression is a cold sneer - eyes narrowed and sharp with open contempt, one eyebrow slightly raised, the corner of her mouth curled. SPRING COSTUME: an opaque white jeogori with a light rose-pink silk overvest and a deep red skirt. Harsh bright daylight, pink and crimson palette against a pale sky.' &
gen m04 "$WIDE" 'NIGHT scene: dense black bush-clover thickets in deep darkness, a small bush warbler singing on a stem, thin moonlight edging the leaves. Her expression is calm and unreadable, looking straight at the viewer. LATE-SPRING NIGHT COSTUME: an opaque white jeogori with a dark charcoal-green silk overrobe and a deep red skirt. Very low saturation, near-monochrome greens and ink black with a faint silver rim light.' &
gen m05 "$SQ" 'DAYLIGHT scene: a wooden bridge over still water, tall iris and orchid leaves crowding the bank, early summer haze. Her expression is inviting and mischievous - a knowing half-smile, head tilted slightly, eyes meeting the viewer. EARLY-SUMMER COSTUME: a light opaque white ramie jeogori with pale violet trim and a deep red skirt, sleeves rolled slightly. Soft warm daylight, violet and jade palette.' &
gen m06 "$TALL" 'NIGHT scene: enormous crimson peonies in full bloom crowding around her, butterflies circling, deep summer night. Her expression is anger - brows drawn down, jaw set, glaring directly at the viewer. SUMMER NIGHT COSTUME: an opaque white jeogori with a deep wine-red gauze overrobe and a dark skirt. Rich saturated crimson against black, dramatic rim lighting.' &
gen m07 "$WIDE" 'DAYLIGHT scene: a bright summer bush-clover field, a wild boar standing in the grass behind her, heat haze and strong sun. Her expression is a warm confident smile at the viewer. MIDSUMMER COSTUME: a thin opaque white ramie jeogori with a crimson sash and a red skirt, light and airy. Strong summer daylight, deep green and crimson palette.' &
wait

# ── 2차 배치 ─────────────────────────────────────────────────
gen m08 "$SQ" 'NIGHT scene: a bare rounded mountain under an enormous full moon, three wild geese crossing the moon, late summer night. Her expression is astonishment - eyes wide, lips parted, caught mid-gasp as she looks up. LATE-SUMMER NIGHT COSTUME: an opaque white jeogori with a pale indigo gauze overrobe and a deep red skirt. Silver moonlight, indigo and ivory palette, the moon enormous and luminous.' &
gen m09 "$SQ" 'DAYLIGHT scene: a field of yellow chrysanthemums in clear autumn light, a small ceramic cup catching the sun beside her. Her expression is shock and exhilaration - eyes wide, leaning back slightly, as if something just exploded in front of her. EARLY-AUTUMN COSTUME: an opaque white jeogori with a golden-ochre silk overvest and a deep red skirt. Crisp autumn sunlight, gold and amber palette.' &
gen m10 "$WIDE" 'NIGHT scene: crimson maple leaves falling through frosted air, a stag standing among the trees behind her, cold autumn night. Her expression is weariness - eyes half-lowered, exhausted but unbroken. AUTUMN NIGHT COSTUME: an opaque white jeogori with a rust-brown padded overrobe and a deep red skirt. Cold blue night with warm scarlet maple accents.' &
gen m11 "$SQ" 'DAYLIGHT scene: broad paulownia leaves and a magnificent phoenix rising into the sky behind her, feathers trailing golden light, late autumn. Her expression is a mocking smirk - chin lifted, looking down at the viewer with amused contempt. LATE-AUTUMN COSTUME: an opaque white jeogori with a deep purple brocade overvest and a red skirt. Warm gold and violet palette, dramatic backlight from the phoenix.' &
gen m12 "$TALL" 'NIGHT scene: heavy rain pouring through bare willow branches, a paper umbrella, a swallow cutting across the downpour, cold winter night. Her expression is quiet sorrow - eyes lowered, rain on her face, resigned but standing. WINTER RAIN COSTUME: an opaque white jeogori under a black oiled-paper rain cloak with a deep red skirt showing beneath. Near-monochrome slate and black with a single red accent, rain streaks catching light.' &
wait

echo "=== done ==="
ls -la m*/art.png

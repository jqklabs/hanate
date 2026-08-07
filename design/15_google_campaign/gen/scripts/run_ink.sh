#!/bin/bash
# v4 테스트 — 화투 카드 원화 그림체(한국 수묵채색화)로 전환.
#
# 왜: 기존 아트는 밀도·광택·사진적 음영 때문에 AI 티가 난다. 화투 원화는 그 반대다 —
#     크림 한지, 굵은 먹 붓질, 제한 팔레트, 그림자 없음, 여백. 밀도가 낮아 AI 티가 안 나고
#     카드와 그림체가 통일돼 "카드 속 춘향"이 된다.
# 레퍼런스 2장: ref_cardstyle.png(그림체) + ref_char_modest.png(인물 동일성)
#     — 인물 시트는 애니 화풍이라 "정체성만 가져오고 화풍은 전부 카드에서 가져오라"고 못박는다.
# 1·2·12월만 먼저 뽑아 방향을 확인한다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

REF='Reference 1 (the grid of six paintings) defines THE ENTIRE PAINTING STYLE - copy it exactly. Reference 2 (the character sheet) is used ONLY to identify WHO she is: her face shape, her black hair worn up, the white blossom hairpin with red tassels, white jeogori and deep red skirt. Do NOT copy reference 2 style - that anime rendering must not appear anywhere.'

STYLE='STYLE (mandatory, this is the whole point): a traditional Korean ink-and-colour brush painting, the exact manner of the hwatu card artwork in reference 1. Painted on warm cream mulberry paper with visible paper grain. Bold confident black ink brushstrokes with dry-brush texture and varying stroke width. Strictly limited palette: ink black, vermilion red, ochre yellow, indigo blue, warm brown - flat opaque washes, no gradients. Completely FLAT: no perspective, no cast shadows, no rim light, no glow, no bokeh, no depth of field, no cinematic lighting, no glossy or airbrushed rendering, no photorealism, no 3D shading. Sparse and economical - few elements, confident empty paper between them. This must read as a hand-painted card illustration, not a digital render.'

MOD='Her chest is fully and modestly covered by opaque fabric - no transparency, no cleavage.'
NEG='Do NOT include: any text, letters, numbers, hanzi, hangul, signature, seal or watermark; any playing card object or card border; a green felt table; cards in her hand; coins or money; any game UI. Do NOT render her in anime or semi-realistic digital painting style.'

gen () {  # $1=dir $2=비율 $3=장면
  mkdir -p "$1" && cp ref_cardstyle.png ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_cardstyle.png -i ./ref_char_modest.png -- \
      "$HEAD $REF Prompt: $STYLE $2 $3 $MOD $NEG Then save the generated file to ./art.png" \
      > log.txt 2>&1 ) ; true
}

SQ='SQUARE 1:1 composition. She stands on the RIGHT, painted large - her figure fills most of the height. The LOWER-LEFT area is left as bare cream paper for calligraphy.'
WIDE='WIDE LANDSCAPE 3:2 horizontal format. She is painted LARGE on the RIGHT - her figure fills nearly the full height of the frame, not small. The seasonal motif sweeps across the middle so the composition feels full, and only the LEFT THIRD is left as bare cream paper for calligraphy.'
TALL='PORTRAIT 2:3 composition. She is painted large in the UPPER TWO THIRDS, and the LOWER THIRD is left as bare cream paper for calligraphy.'

gen k01 "$SQ" 'Subject: a single crane standing beside her, a black pine bough entering from the top, a plain vermilion sun disc, a few ink-stroke mountains. Winter. She wears a padded white jeogori and a deep red skirt, calm and smiling faintly.' &
gen k02 "$WIDE" 'Subject: a red plum branch sweeping across the frame with a small warbler on it, a plain grey moon disc. Night rendered not by darkening but by a pale indigo wash on the paper. She looks down thoughtfully, one hand near her chin.' &
gen k12 "$TALL" 'Subject: bare willow branches, slanting ink strokes for rain, a plain paper umbrella held over her, a swallow cutting across. She looks down, quiet and resigned. A cool grey and indigo wash over the cream paper.' &
wait
echo "=== done ==="
for d in k01 k02 k12; do printf '%s ' $d; [ -f $d/art.png ] && sips -g pixelWidth -g pixelHeight $d/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}' || echo 없음; done

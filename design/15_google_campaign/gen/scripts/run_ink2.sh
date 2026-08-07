#!/bin/bash
# v4b 테스트 — 수묵 유지 + 힘. 「민화·진채(眞彩)」 방향.
#
# 앞선 v4(k01/k02/k12)는 AI 티는 확실히 잡혔으나 담백해서 광고로서 임팩트가 약하다.
# 조선 민화·궁중 진채화는 화려하고 밀도가 높으면서도 평면이라, 밀도를 올려도 AI 티가 나지 않는다.
#   유지: 한지 바탕 · 먹 윤곽선 · 평면 · 그림자 없음 · 원근 없음
#   증폭: 광물 안료의 진한 채색 · 문양 · 금박 액센트 · 모티프가 화면을 채우는 구성
# 같은 3개월(1·2·12)로 뽑아 v4와 직접 비교한다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'

REF='Reference 1 (the grid of six paintings) defines the BRUSHWORK and the medium - ink outlines on paper, flat colour, no photographic rendering. Reference 2 (the character sheet) is used ONLY to identify WHO she is: her face, her black hair worn up, the white blossom hairpin with red tassels, white jeogori and deep red skirt. Do NOT copy reference 2 rendering style - no anime shading, no digital airbrush.'

STYLE='STYLE: a Korean minhwa folk painting in heavy mineral pigment (진채), painted on warm cream mulberry paper with visible fibre. Confident black ink contour lines around every form, then filled with RICH SATURATED FLAT COLOUR - deep vermilion, malachite green, lapis blue, ochre gold, ink black. Ornate and abundant: dense decorative patterning on fabric, layered blossoms and foliage, gold-leaf accents catching the eye. Bold and decorative rather than delicate. STILL COMPLETELY FLAT: no perspective, no cast shadows, no rim light, no glow, no bokeh, no depth of field, no cinematic lighting, no airbrushed gradients, no photorealism, no 3D shading. Every form is outlined and filled like a painted screen panel. This must read as a hand-painted folk screen, opulent but unmistakably a painting.'

MOD='Her chest is fully and modestly covered by opaque fabric - no transparency, no cleavage.'
NEG='Do NOT include: any text, letters, numbers, hanzi, hangul, signature, seal or watermark; any playing card object or card border; a green felt table; cards in her hand; coins or money; any game UI. Do NOT render her in anime or semi-realistic digital painting style.'

gen () {  # $1=dir $2=비율 $3=장면
  mkdir -p "$1" && cp ref_cardstyle.png ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_cardstyle.png -i ./ref_char_modest.png -- \
      "$HEAD $REF Prompt: $STYLE $2 $3 $MOD $NEG Then save the generated file to ./art.png" \
      > log.txt 2>&1 ) ; true
}

SQ='SQUARE 1:1 composition. She stands on the RIGHT, painted large and ornate, filling most of the height. Motifs crowd the upper and right areas. The LOWER-LEFT area stays as bare cream paper for calligraphy.'
WIDE='WIDE LANDSCAPE 3:2 horizontal format. She is painted LARGE on the RIGHT, filling nearly the full height. The seasonal motif sweeps richly across the middle of the frame so nothing looks empty. Only the LEFT THIRD stays as bare cream paper for calligraphy.'
TALL='PORTRAIT 2:3 composition. She is painted large and ornate in the UPPER TWO THIRDS, motifs crowding around her. The LOWER THIRD stays as bare cream paper for calligraphy.'

gen j01 "$SQ" 'Subject: a red-crowned crane beside her, gnarled black pine boughs heavy with needles across the top, a large vermilion sun disc, layered ink mountains, drifting snow rendered as small white dots. Winter. Her white jeogori carries fine woven pattern and her deep red skirt is covered in gold floral motifs. Calm, faintly smiling.' &

gen j02 "$WIDE" 'Subject: a red plum tree in heavy bloom sweeping across the whole frame, blossoms dense and layered, a warbler singing on a branch, a large pale moon disc, a deep indigo night wash across the upper paper with gold flecks. She looks down thoughtfully, one hand near her chin, wearing an indigo overcoat patterned with plum blossoms over her white jeogori.' &

gen j12 "$TALL" 'Subject: bare willow branches, driving rain drawn as bold slanting ink strokes, an ornate paper umbrella patterned in vermilion and gold held over her, a swallow cutting across, a dark slate storm wash over the upper paper. She looks down, quiet and resigned, in a black oiled rain cloak over white jeogori with a vermilion skirt.' &
wait
echo "=== done ==="
for d in j01 j02 j12; do printf '%s ' $d; [ -f $d/art.png ] && sips -g pixelWidth -g pixelHeight $d/art.png | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{print w"x"h}' || echo 없음; done

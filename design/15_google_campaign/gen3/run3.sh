#!/bin/bash
# v3.1 — 1~2월 재생성.
#  · R1/R2: 화투패를 화면의 주인공으로 (면적 30~40%)
#  · 계절 의상: 1월 한겨울, 2월 늦겨울
#  · 문구·로고 조판 자리를 빈 공간으로 확보 (글자는 생성하지 않고 ffmpeg 합성)
# 병렬 실행 시 파일 충돌이 나므로 월별 서브디렉토리에서 격리 실행한다.
cd "$(dirname "$0")" || exit 1

NEG='ABSOLUTELY DO NOT INCLUDE: any text, letters, numbers, hangul, hanzi, logos, watermarks, signatures, calligraphy or written characters of any kind; a green felt gaming table or blanket; cards fanned in her hand; cards laid out on a surface; several people sitting around a table; coins, money, gambling imagery; any game UI, score panel or scoreboard.'
REF='Reference 1 is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent. Reference 2 is an authentic Korean hwatu card - reproduce its ink-painting artwork faithfully on the floating card.'
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
MODESTY='Her chest is completely and modestly covered by opaque fabric - no transparency, no skin showing through, no visible bust contour, no cleavage.'

gen () {  # $1=dir  $2=out  $3=card  $4=scene
  mkdir -p "$1" && cp ref_char_modest.png "$1/" && cp "$3" "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -i "./$(basename "$3")" -- \
      "$HEAD $REF Prompt: $4 $MODESTY $NEG Then save the generated file to ./$2" \
      > "log.txt" 2>&1 )
}

# ── 01 · 1월 송학 · 1:1 · 한겨울 ──────────────────────────────
gen v01 01_january.png ./card_1-gwang.png \
'Painterly semi-realistic Korean illustration, SQUARE 1:1 composition. THE DOMINANT SUBJECT IS A SINGLE ENORMOUS FLOATING HWATU CARD: it stands upright in the LEFT HALF of the frame, occupying roughly 55 percent of the image height, sharply rendered, its ink painting of a crane, black pines and a red sun clearly legible, edges rimmed with brilliant golden light, small gold embers drifting off it. It hovers in mid-air like a sacred talisman - nobody is holding it and nothing touches it. A young Korean woman stands in the RIGHT THIRD of the frame, smaller than the card, turned toward it and looking out at the viewer with a calm knowing smile. WINTER COSTUME: over an opaque quilted white jeogori she wears a deep crimson sleeveless winter vest trimmed with soft white fur at the collar and hem, and a heavy deep red skirt; her breath faintly visible in the cold. Setting: a snow-covered pine grove at dawn, distant black pines, a pale red winter sun low in the sky, fine snow falling. The background is quiet and low-contrast so the card reads first. THE BOTTOM FIFTH OF THE IMAGE MUST BE CALM EMPTY DARK SPACE - snow and shadow only, no subject, no detail, reserved for later typography. Cold blue-white palette with crimson and gold accents, traditional Korean ink-wash texture. High detail, elegant, mystical.' &

# ── 02 · 2월 매조 · 1.91:1 · 늦겨울 밤 ────────────────────────
gen v02 02_february.png ./card_2-yeolkkeut-warbler.png \
'Painterly semi-realistic Korean illustration in a WIDE LANDSCAPE 3:2 horizontal format, much wider than tall. THE DOMINANT SUBJECT IS A SINGLE ENORMOUS FLOATING HWATU CARD: it stands upright slightly RIGHT of the frame centre, occupying roughly 70 percent of the image height, sharply rendered, its ink painting of a bush warbler on a red plum branch clearly legible, edges rimmed with warm golden light, gold embers drifting off it. It hovers in mid-air like a sacred talisman - nobody is holding it and nothing touches it. A young Korean woman stands at the FAR RIGHT edge of the frame, smaller than the card, half turned toward it, her expression thoughtful and pensive with one hand raised near her chin. LATE-WINTER COSTUME: over an opaque white jeogori she wears a deep indigo-blue padded winter overcoat with plum-pink silk lining and a quilted collar, and a dark red skirt. Setting: a moonlit night, bare plum branches heavy with pale blossoms, a full moon high in the upper left, deep indigo darkness, petals drifting. THE ENTIRE LEFT THIRD OF THE IMAGE MUST BE CALM EMPTY NIGHT SKY - no branches crossing it, no subject, no detail, reserved for later typography. Low saturation indigo and ivory palette with faint gold, traditional Korean ink-wash texture. High detail, elegant, quiet and mystical. The output MUST be landscape orientation, wider than tall.' &

wait
echo "=== done ==="
ls -la v0*/0*.png

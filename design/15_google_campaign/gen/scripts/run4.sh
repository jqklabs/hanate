#!/bin/bash
# v3.2 — 1~2월 재생성. 방향 전환:
#  · 춘향이 화면의 주인공 (인물 비중 크게, 프레임 안에 온전히)
#  · 그 달 화투패의 "컨셉"을 장면 자체로 그린다 (카드 그림 = 실제 풍경)
#  · 화투패는 실제 손바닥 크기로 작게. 강조하지 않는다. 인게임 카드 룩(붉은 테두리 + 흰 여백)
#  · 로고를 얹을 자리를 아트 안에 물리적 오브젝트(나무 현판)로 그려 넣는다 → 후처리 합성이 겉돌지 않게
# 병렬 실행 시 파일 충돌이 나므로 월별 서브디렉토리에서 격리 실행한다.
cd "$(dirname "$0")" || exit 1

NEG='ABSOLUTELY DO NOT INCLUDE: any text, letters, numbers, hangul, hanzi, logos, watermarks, signatures, or written characters of any kind - the wooden plaque must be completely BLANK; a green felt gaming table or blanket; a fanned poker hand; cards laid out in rows on a surface; several people sitting around a table; coins, money, gambling imagery; any game UI, score panel or scoreboard.'
REF='Reference 1 is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent. Reference 2 shows the real in-game hwatu card look: a SMALL rectangular card with a thin RED border, a white paper margin, and an ink painting inside. Any card in the image must look exactly like that - small, bordered, ordinary playing-card size.'
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
# 1월 광의 컨셉(학 · 소나무 · 붉은 해)을 카드 그림이 아니라 "실제 풍경"으로 그린다.
gen w01 01_january.png ./ref_ingame_card.png \
'Painterly semi-realistic Korean illustration, SQUARE 1:1 composition. A young Korean woman is THE MAIN SUBJECT and dominates the frame - she is shown from the thighs up, large and centred slightly right, her face big and clearly readable, occupying roughly half the image. She gazes at the viewer with a calm, warm, knowing smile. WINTER COSTUME: over an opaque quilted white jeogori she wears a deep crimson sleeveless winter vest trimmed with soft white fur at collar and hem, and a heavy deep red skirt; her breath faintly visible in the cold. THE WORLD AROUND HER IS THE SCENE ITSELF, not a picture of one: a real red-crowned crane stands and spreads its wings in the snow just behind her, ancient snow-laden black pine branches arch overhead, and a huge pale red winter sun hangs low over distant snowy peaks. Fine snow falls. ONE SMALL HWATU CARD, ordinary playing-card size, no bigger than her hand, hovers quietly near her shoulder with a faint golden edge glow - it is small and incidental, NOT the focus, nobody is holding it. IN THE LOWER PORTION OF THE IMAGE, resting in the snow in front of her, stands a BLANK dark-wood signboard plaque with a simple carved frame, empty and unmarked, roughly one third of the image width, angled straight toward the viewer and clearly lit. Cold blue-white palette with crimson and gold accents, traditional Korean ink-wash texture, cinematic dawn light. High detail, elegant, mystical.' &

# ── 02 · 2월 매조 · 1.91:1 · 늦겨울 밤 ────────────────────────
# 2월 열끗의 컨셉(홍매 · 휘파람새 · 밤)을 실제 풍경으로.
gen w02 02_february.png ./ref_ingame_card.png \
'Painterly semi-realistic Korean illustration in a WIDE LANDSCAPE 3:2 horizontal format, much wider than tall. A young Korean woman is THE MAIN SUBJECT and dominates the RIGHT HALF of the frame - shown from the waist up, large, her whole figure comfortably INSIDE the frame with clear margin on the right, never cropped by the edge. Her face is big and clearly readable, expression thoughtful and pensive, eyes lowered slightly, one hand raised near her chin. LATE-WINTER COSTUME: over an opaque white jeogori she wears a deep indigo-blue padded winter overcoat with plum-pink silk lining and a quilted collar, and a dark red skirt. THE WORLD AROUND HER IS THE SCENE ITSELF: real red plum blossoms crowd the branches around her, a small live bush warbler sings on a branch beside her head, a full moon hangs in the upper left, deep indigo night, petals drifting. ONE SMALL HWATU CARD, ordinary playing-card size, no bigger than her hand, hovers quietly near her with a faint golden edge glow - small and incidental, NOT the focus, nobody is holding it. IN THE LEFT THIRD OF THE FRAME hangs a BLANK dark-wood signboard plaque suspended by two cords from a plum branch, with a simple carved frame, empty and unmarked, roughly one third of the image width, facing the viewer straight on and catching the moonlight. The night sky behind it is calm and uncluttered. Low saturation indigo and ivory palette with faint gold, traditional Korean ink-wash texture. High detail, elegant, quiet and mystical. The output MUST be landscape orientation, wider than tall.' &

wait
echo "=== done ==="
ls -la w0*/0*.png

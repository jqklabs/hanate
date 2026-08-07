#!/bin/bash
# v3.5 — 글자 없는 아트 플레이트만 생성한다.
#  제목 「화투로」는 OG 아트에서 추출한 고정 로고(gen3/logo_og.png)를 12장에 돌려쓰고,
#  부제는 OG와 같은 붓글씨 계열(나눔손글씨 갈맷글)로 조판한다 → build-images-v3.sh
#  생성 때마다 제목 글자 크기·자간이 흔들리는 문제를 없애기 위함이다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
NEG='CRITICAL: the image must contain NO TEXT WHATSOEVER - no Korean, no hanzi, no English, no letters, numbers, logos, watermarks, signatures or calligraphy anywhere. Also do NOT include: any hwatu playing card or card object; a green felt gaming table or blanket; cards held in her hand; cards laid out on a surface; several people around a table; coins, money or gambling imagery; any game UI or score panel.'

gen () {  # $1=dir  $2=out  $3=scene
  mkdir -p "$1" && cp ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -- "$HEAD $REF Prompt: $3 $NEG Then save the generated file to ./$2" \
      > "log.txt" 2>&1 )
}

# ── 01 · 1월 송학 · 1:1 ──────────────────────────────────────
gen z01 01_january.png \
'A Korean mobile game key visual illustration, SQUARE 1:1 composition. A young Korean woman is the main subject, shown from the thighs up, large and on the RIGHT side of the frame, her face big and clearly readable, gazing at the viewer with a calm warm knowing smile. WINTER COSTUME: over an opaque quilted white jeogori she wears a deep crimson sleeveless winter vest trimmed with soft white fur at collar and hem, and a heavy deep red skirt; her breath faintly visible in the cold. Scene: a snow-covered pine grove at dawn - a real red-crowned crane spreads its wings in the snow behind her, ancient snow-laden black pine branches arch overhead, a huge pale red winter sun hangs low over distant snowy peaks, fine snow falling. Cold blue-white palette with crimson and gold accents, traditional Korean ink-wash texture, cinematic dawn light, high detail, elegant, mystical. COMPOSITION REQUIREMENT: the LOWER-LEFT QUADRANT of the image must be calm, dark and almost empty - open snow and soft shadow, no crane, no branches, no busy detail - because a large title will be placed there later. Keep that quadrant visually quiet and slightly darker than the rest so bright gold lettering will read clearly on top of it.' &

# ── 02 · 2월 매조 · 1.91:1 ───────────────────────────────────
gen z02 02_february.png \
'A Korean mobile game key visual illustration in a WIDE LANDSCAPE 3:2 horizontal format, much wider than tall. A young Korean woman is the main subject and dominates the RIGHT HALF of the frame - shown from the waist up, large, her whole figure comfortably inside the frame with clear margin on the right, never cropped by the edge. Her face is big and clearly readable, expression thoughtful and pensive, eyes lowered slightly, one hand raised near her chin. LATE-WINTER COSTUME: over an opaque white jeogori she wears a deep indigo-blue padded winter overcoat with plum-pink silk lining and a quilted collar, and a dark red skirt. Scene: a moonlit night - real red plum blossoms crowd the branches around her, a small live bush warbler sings on a branch beside her head, a full moon hangs in the upper right, deep indigo night, petals drifting. Low saturation indigo and ivory palette with faint gold, traditional Korean ink-wash texture, high detail, elegant, quiet and mystical. COMPOSITION REQUIREMENT: the LEFT HALF of the image must be calm, dark and almost empty - open night sky with only a few distant petals, no branches crossing it, no busy detail - because a large title will be placed there later. Keep that half visually quiet and deep so bright gold lettering will read clearly on top of it. The output MUST be landscape orientation, wider than tall.' &

wait
echo "=== done ==="
ls -la z0*/0*.png

#!/bin/bash
# v3.3 — 전부 생성에 맡긴다. 후처리 합성 없음(카드·로고·문구 전부 모델이 그린다).
# 병렬 실행 시 파일 충돌이 나므로 월별 서브디렉토리에서 격리 실행한다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib).'
REF='The attached reference is the canonical character sheet - match her face, hairstyle, white blossom hair pins with red tassels, and overall painterly art style EXACTLY. Her jeogori is SOLID OPAQUE fabric, never sheer or transparent, chest fully and modestly covered, no cleavage.'
TEXTRULE='TEXT RENDERING IS CRITICAL. The Korean characters must be rendered perfectly, cleanly and legibly, correctly formed, with no distortion, no invented glyphs, no extra strokes and no misspellings. Copy the Korean strings character by character exactly as given.'
NEG='Do NOT include: any hwatu playing card or card object anywhere in the image; a green felt gaming table or blanket; cards held in her hand; cards laid out on a surface; several people around a table; coins, money or gambling imagery; any game UI or score panel; any English text; any additional text beyond the two Korean lines specified.'

gen () {  # $1=dir  $2=out  $3=scene
  mkdir -p "$1" && cp ref_char_modest.png "$1/"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check \
      -i ./ref_char_modest.png -- "$HEAD $REF Prompt: $3 $TEXTRULE $NEG Then save the generated file to ./$2" \
      > "log.txt" 2>&1 )
}

# ── 01 · 1월 송학 · 1:1 ──────────────────────────────────────
gen x01 01_january.png \
'A finished Korean mobile game key visual poster, SQUARE 1:1 composition. A young Korean woman is the main subject, shown from the thighs up, large and slightly right of centre, her face big and clearly readable, gazing at the viewer with a calm warm knowing smile. WINTER COSTUME: over an opaque quilted white jeogori she wears a deep crimson sleeveless winter vest trimmed with soft white fur at collar and hem, and a heavy deep red skirt; her breath faintly visible in the cold. Scene: a snow-covered pine grove at dawn - a real red-crowned crane spreads its wings in the snow behind her, ancient snow-laden black pine branches arch overhead, a huge pale red winter sun hangs low over distant snowy peaks, fine snow falling. Cold blue-white palette with crimson and gold accents, traditional Korean ink-wash texture, cinematic dawn light, high detail, elegant, mystical. TYPOGRAPHY BAKED INTO THE POSTER: in the lower-left area of the image, over the calm empty snow, render the Korean game title 화투로 in large bold gold-leaf brush calligraphy, and directly beneath it in a smaller clean white Korean typeface render the single line 패 8장으로 점수를 터뜨려라. Both lines are left-aligned, elegantly composed with generous margin from the frame edge, and must not overlap the woman or the crane.' &

# ── 02 · 2월 매조 · 1.91:1 ───────────────────────────────────
gen x02 02_february.png \
'A finished Korean mobile game key visual poster in a WIDE LANDSCAPE 3:2 horizontal format, much wider than tall. A young Korean woman is the main subject and dominates the RIGHT HALF of the frame - shown from the waist up, large, her whole figure comfortably inside the frame with clear margin on the right, never cropped by the edge. Her face is big and clearly readable, expression thoughtful and pensive, eyes lowered slightly, one hand raised near her chin. LATE-WINTER COSTUME: over an opaque white jeogori she wears a deep indigo-blue padded winter overcoat with plum-pink silk lining and a quilted collar, and a dark red skirt. Scene: a moonlit night - real red plum blossoms crowd the branches around her, a small live bush warbler sings on a branch beside her head, a full moon hangs in the upper right, deep indigo night, petals drifting. Low saturation indigo and ivory palette with faint gold, traditional Korean ink-wash texture, high detail, elegant, quiet and mystical. TYPOGRAPHY BAKED INTO THE POSTER: the LEFT THIRD of the image is calm empty night sky reserved for type - there, render the Korean game title 화투로 in large bold gold-leaf brush calligraphy, and directly beneath it in a smaller clean white Korean typeface render the single line 당신의 패, 당신의 빌드. Both lines are left-aligned with generous margin from the frame edge, cleanly legible against the dark sky, and must not overlap the woman or the branches.' &

wait
echo "=== done ==="
ls -la x0*/0*.png

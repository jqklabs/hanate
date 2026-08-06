#!/bin/bash
# 부제 12종 + CTA 1종을 「화투로」와 같은 붓글씨로 생성한다.
#
# 시스템에 진짜 붓글씨 한글 폰트가 없다(갈맷글·ROEHOE-CHAN은 펜글씨 계열).
# 로고를 스타일 레퍼런스로 물려서 같은 붓·같은 질감으로 뽑고, 루마키로 투명 PNG를 만든다.
#  · 부제 = 흰 붓글씨 (제목과 위계를 나눈다)
#  · CTA  = 금박 붓글씨 (행동 유도)
# 4개씩 나눠 돌린다 — 병렬을 크게 잡으면 에이전트가 생성 대신 파일 탐색으로 빠진다.
cd "$(dirname "$0")" || exit 1

HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REFNOTE='The attached image is our game logo. Match its calligraphy style exactly: thick confident Korean ink-brush strokes with dry-brush edges and torn texture, the same hand, the same energy.'
RULES='TEXT ACCURACY IS CRITICAL: reproduce the Korean sentence character by character exactly as given, correctly spelled, correctly formed, no missing or invented or duplicated characters, no extra words. All characters on ONE horizontal line, same size, evenly spaced, sitting on one baseline. Centred with generous empty black margin on all four sides - no stroke touches the edge of the image. Background is PURE SOLID BLACK. Nothing else in the image: no ornaments, no frame, no background art, no seal, no signature, no English.'

gen () {  # $1=dir  $2=색 지시  $3=문장
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../logo_og.png -- \
      "$HEAD $REFNOTE Prompt: A single horizontal line of Korean brush calligraphy on a pure solid black background. The text reads exactly: $3 . $2 $RULES Then save the generated file to ./type.png" \
      > log.txt 2>&1 ) ; true
}

W='Render the strokes in bright warm off-white ivory with subtle grey ink shading, NOT gold.'
GOLD='Render the strokes in rich gold leaf with hammered metallic texture and darker gold shadow inside the strokes.'

gen t01 "$W" '1월부터 12월까지, 열두 판' &
gen t02 "$W" '당신이 고른 패가 곧 전략이 된다' &
gen t03 "$W" '3월에서 대부분 멈춘다' &
gen tcta "$GOLD" '지금 당장 플레이' &
wait

gen t04 "$W" '패를 모을수록 점점 세진다' &
gen t05 "$W" '여기서 멈출까, 더 갈까' &
gen t06 "$W" '6월, 아직 절반이다' &
gen t07 "$W" '익숙한 화투, 처음 보는 규칙' &
wait

gen t08 "$W" '실패하면 다시 1월부터' &
gen t09 "$W" '9월부터는 판이 당신을 노린다' &
gen t10 "$W" '운이 아니라 선택이 이긴다' &
gen t11 "$W" '한 판에 기회는 네 번뿐' &
wait

gen t12 "$W" 'AI 봇도 12월을 못 넘었다' &
wait

echo "=== done ==="
ls -la t*/*.png 2>/dev/null | wc -l

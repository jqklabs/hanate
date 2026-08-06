#!/usr/bin/env bash
# 광고 이미지 v2 5종 — "인게임 × 춘향" 하이브리드 세트.
#
# 기존 10종(build-images.sh)과 뭐가 다른가
#   10종은 순수 생성 아트라 "무슨 게임인지"를 한 장도 대답하지 않는다.
#   v2 5종은 춘향 아트 위에 **실제 게임 화면에서 잘라온 UI 패널**을 얹어
#   광고에서 본 화면 = 클릭 후 본 화면이 되게 한다.
#
# 왜 UI를 생성하지 않고 잘라 붙이나
#   GPT Image는 한글을 뭉갠다. 점수·족보·특수패 이름은 실제 스크린샷에서
#   잘라 와야 숫자가 진짜고 글자가 안 깨진다. 생성물엔 판·카드·춘향만 있다.
#
# 정책 (→ README §4)
#   · 프롬프트 고정: OPAQUE solid white jeogori, no sheer, no cleavage
#   · 光 인장은 광 카드에만 (족보 오류 = 트랙 B 신뢰 상실)
#   · 크롭 규칙: 「내기」 빨간 버튼 · 「N냥」 · 동전이 들어간 y좌표는 절대 안 자른다
#     - ui_gauge  y691~ : 냥(y≈160)·내기(y≈1150) 둘 다 바깥
#     - ui_score  y691~ : 동일
#     - ui_jokers y60~134: 냥(y≈160) 바로 위에서 끊는다
set -euo pipefail
cd "$(dirname "$0")"
G=gen2
S=assets/stills
OUT=assets/ads-v2
mkdir -p "$OUT"
Q="-q:v 2"

# ── UI 패널 추출 ────────────────────────────────────────────────
# 목표 게이지 (1月·송학 180/160) — 02가 파는 "목표를 넘긴다"의 증거
ffmpeg -y -v error -i "$S/gauge-180.png"   -vf "crop=734:342:171:691" -frames:v 1 "$G/ui_gauge.png"
# 점수 폭발 (9月·국진 14,500/2,200) — 03의 "터진다" 증거. 좌우로 흘려보내 모서리를 숨긴다
ffmpeg -y -v error -i "$S/score-14500.png" -vf "crop=1075:344:0:691"  -frames:v 1 "$G/ui_score.png"
# 특수패 바 (광팔이·광모이·삼광판·비랑우산·오광소원) — 04의 "22종이 실재한다" 증거
ffmpeg -y -v error -i "$S/score-14500.png" -vf "crop=960:64:50:64"    -frames:v 1 "$G/ui_jokers.png"

# 점수/게이지 패널은 모서리를 둥글게 딴다(R=30). 사각 크롭 그대로 얹으면
# 아트의 초록 위에 다른 초록 사각형이 떠 보인다.
round30() { ffmpeg -y -v error -i "$1" -vf \
  "format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt(pow(max(0,abs(X-W/2)-(W/2-30)),2)+pow(max(0,abs(Y-H/2)-(H/2-30)),2),900),0,255)'" \
  -frames:v 1 "$2"; }
round30 "$G/ui_gauge.png" "$G/ui_gauge_r.png"
round30 "$G/ui_score.png" "$G/ui_score_r.png"

echo "── 01 히어로 1.91:1 (1200×628) — 좌측 여백에 금박 로고 ──"
ffmpeg -y -v error -i "$G/01_hero_v2.png" -i gen/logo_alpha.png -filter_complex \
  "[0]crop=1536:804:0:110,scale=1200:628[b];[1]scale=470:288[l];[b][l]overlay=95:150" \
  -frames:v 1 $Q "$OUT/v2_01_hero.jpg"

# 게이지는 좌상단 구석에. 가운데 얹으면 춘향 얼굴을 덮는다 —
# 얼굴이 이 세트의 시선 훅이므로 UI가 얼굴을 가리면 소재 가치가 0이 된다.
echo "── 02 루프 4:5 (960×1200) — 좌상단에 목표 게이지 ──"
ffmpeg -y -v error -i "$G/02_loop_v3.png" -i "$G/ui_gauge_r.png" -filter_complex \
  "[0]scale=960:1200[b];[1]scale=424:-1[u];[b][u]overlay=26:26" \
  -frames:v 1 $Q "$OUT/v2_02_loop.jpg"

# 점수 패널은 카드(하단)와 얼굴(상단) 사이 빈 띠에만 들어간다. 크게 키우면
# 저해상 원본이 뭉개지고 폭발 연출까지 덮어버린다.
echo "── 03 오광 1:1 (1200×1200) — 중단에 점수 패널 ──"
ffmpeg -y -v error -i "$G/03_ogwang_v2.png" -i "$G/ui_score_r.png" -filter_complex \
  "[0]scale=1200:1200[b];[1]scale=760:-1[u];[b][u]overlay=(W-w)/2:600" \
  -frames:v 1 $Q "$OUT/v2_03_ogwang.jpg"

echo "── 04 특수패 1:1 (1200×1200) — 하단에 특수패 바 ──"
ffmpeg -y -v error -i "$G/04_jokers_v3.png" -i "$G/ui_jokers.png" -filter_complex \
  "[0]scale=1200:1200[b];[1]scale=1160:-1[u];[b][u]overlay=20:1123" \
  -frames:v 1 $Q "$OUT/v2_04_jokers.jpg"

echo "── 05 도발 4:5 (960×1200) — 오버레이 없음 ──"
ffmpeg -y -v error -i "$G/05_taunt_v2.png" -vf "scale=960:1200" -frames:v 1 $Q "$OUT/v2_05_taunt.jpg"

echo
for f in "$OUT"/*.jpg; do
  printf '%-40s %-10s %sKB\n' "$f" \
    "$(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$f")" \
    "$(( $(stat -f%z "$f") / 1024 ))"
done

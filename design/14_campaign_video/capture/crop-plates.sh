#!/bin/zsh
# 가로 플레이트 **폴백** — Higgsfield reframe이 실패했을 때만 쓴다.
#
# reframe(아웃페인트)이 되면 그게 항상 낫다. 다만 서비스가 죽어 있을 때
# 4:5 플레이트를 그냥 넣으면 assemble이 가운데를 크롭해 **얼굴이 잘린다.**
# → 컷마다 세로 크롭 창을 손으로 잡는다. 편집자가 재구도하는 것과 같은 일이다.
#
# ANCHOR = 크롭 창의 위쪽 시작점(원본 높이 대비). 16:9 창은 높이의 56.25%다.
#   춘향 컷은 얼굴이 위쪽에 있어 창을 위로 붙이고 상 아래를 버린다.
#   손 클로즈업은 피사체가 가로로 누워 있어 거의 손실이 없다.
set -e
cd "$(dirname "$0")"
mkdir -p plates/16x9

JOBS=(
  "H2a|0.10"   # 춘향 딜 — 머리 위 여백을 남기고 상·카드는 버린다
  "H2b|0.10"   # 손 클로즈업 — 두 손이 다 들어오는 위치
  "H3a|0.16"   # 춘향 질문 — 얼굴이 창 가운데 오게
  "H3c|0.30"   # 화투판 — 카드 아랫단 + 손이 같이 들어오는 타협점
  "C4|0.08"    # 춘향 정면 — 머리가 잘리지 않게 가장 위로
)
for job in "${JOBS[@]}"; do
  IFS='|' read -r name anchor <<< "$job"
  if [[ -f plates/16x9/$name.mp4 ]]; then echo "── $name (reframe본 있음 — 건너뜀)"; continue; fi
  echo "── $name  크롭 앵커 $anchor"
  ffmpeg -v error -i "plates/$name.mp4" -an \
    -vf "crop=iw:ih*0.5625:0:ih*${anchor},scale=1920:1080:flags=lanczos" \
    -c:v libx264 -crf 16 -preset medium -y "plates/16x9/$name.mp4"
  echo "   → plates/16x9/$name.mp4"
done

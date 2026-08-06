#!/bin/bash
# v3.4 「열두 달 화첩」 — 생성물을 광고 규격으로 크롭·리사이즈만 한다.
#
#  생성: gen3/run6.sh — 제목·문구·구도까지 전부 모델이 그린다. 후처리 합성 없음.
#  규격: 1:1 1200x1200 · 1.91:1 1200x628 · 4:5 960x1200 · JPG ≤5MB
#
#  ※ 이전 버전의 후처리(카드 렌더 make_card.py, 로고 오버레이, ffmpeg 문구 조판)는 전부 걷어냈다.
#    GPT Image가 한글을 정확히 렌더하므로 조판을 분리할 이유가 없어졌다.
set -e
cd "$(dirname "$0")"
OUT=assets/ads-v3
mkdir -p "$OUT"

# 01 · 1월 송학 · 1:1 — 원본 1254² 정사각이라 리사이즈만
ffmpeg -y -loglevel error -i gen3/y01/01_january.png \
  -vf "scale=1200:1200:flags=lanczos" -frames:v 1 -update 1 -q:v 3 "$OUT/v3_01_january.jpg"

# 02 · 2월 매조 · 1.91:1 — 원본 1536x1024(3:2)에서 세로 804px만 취한다.
# y=0 기준: 달·인물 머리·좌측 문구 블록이 모두 남고 하단 치마만 버려진다.
ffmpeg -y -loglevel error -i gen3/y02/02_february.png \
  -vf "crop=1536:804:0:0,scale=1200:628:flags=lanczos" -frames:v 1 -update 1 -q:v 3 "$OUT/v3_02_february.jpg"

echo "=== assets/ads-v3 ==="
for f in "$OUT"/*.jpg; do
  printf '%s  ' "$f"
  sips -g pixelWidth -g pixelHeight "$f" | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{printf "%sx%s  ", w, h}'
  du -h "$f" | awk '{print $1}'
done

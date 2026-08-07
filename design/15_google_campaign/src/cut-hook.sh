#!/usr/bin/env bash
# 영상 A — 6초 훅 컷다운.
# 44.7초 마스터(design/14_campaign_video/out/hwatro_campaign_<ratio>.mp4)에서
# 클라이맥스 4비트 + CTA만 뽑아 이어붙인다. 재녹화·재합성 없음.
#
#   ./cut-hook.sh            # 4x5 (기본)
#   ./cut-hook.sh 9x16 1x1   # 다른 비율 (해당 마스터를 먼저 렌더해야 함:
#                            #   cd ../14_campaign_video/capture && node assemble.mjs --ratio 9x16)
set -euo pipefail
cd "$(dirname "$0")/.."   # 스크립트는 src/ 에, 경로는 캠페인 루트 기준
SRC_DIR=../14_campaign_video/out
OUT_DIR=out
mkdir -p "$OUT_DIR" .work

# 마스터 타임코드 → 컷. 합 6.00초.
#   1 슬램 착지 · 2 오광 엠블럼 · 3 조커 연쇄 · 4 숫자 폭주 · 5 CTA
CUTS=(
  "29.15 0.90"   # 광 5장이 판에 내리꽂힌다        — 0.0s 첫 프레임부터 사건
  "30.80 0.85"   # 「오광」 엠블럼                  — 족보 이름이 박힌다
  "34.15 0.85"   # 조커 5개 연쇄 +60 +25           — 빌드가 작동한다
  "35.20 1.70"   # 5,000 → 14,500 / 2,200          — 목표의 6.6배
  "41.70 1.70"   # 금박 로고 + 몇 월까지 깰수있으세요? — 유일한 텍스트
)
# 시작점을 옮길 땐 죽은 구간을 조심할 것. 33.9~34.1은 카드가 멈춰 있고
# 조커 빔이 아직 안 나온다 — 6초짜리에서 0.25초 정지는 치명적이다.

for RATIO in "${@:-4x5}"; do
  SRC="$SRC_DIR/hwatro_campaign_${RATIO}.mp4"
  [ -f "$SRC" ] || { echo "없음: $SRC  (assemble.mjs --ratio $RATIO 먼저)"; exit 1; }

  rm -f .work/list.txt
  i=0
  for c in "${CUTS[@]}"; do
    read -r ss t <<< "$c"
    # -ss를 -i 앞에 두면 키프레임으로 튄다 → 뒤에 두고 정확 탐색
    ffmpeg -y -v error -i "$SRC" -ss "$ss" -t "$t" \
      -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -an \
      ".work/h$i.mp4"
    echo "file 'h$i.mp4'" >> .work/list.txt
    i=$((i+1))
  done

  DST="$OUT_DIR/hwatro_hook6_${RATIO}.mp4"
  ffmpeg -y -v error -f concat -safe 0 -i .work/list.txt \
    -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -an "$DST"

  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DST")
  printf '%s  %.2f초\n' "$DST" "$D"
done
rm -rf .work

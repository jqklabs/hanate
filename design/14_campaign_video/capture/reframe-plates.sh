#!/bin/zsh
# 4:5 플레이트를 16:9로 **아웃페인트**한다 (자르거나 덧대지 않는다).
#
# 두 가지 함정:
#  1) 1080p는 계속 실패한다 → 720p로 받고 합성에서 lanczos로 1920까지 올린다
#  2) **짧은 클립(2~3초)은 실패한다.** 5.0s·4.0s는 되고 2.2s·2.0s는 안 됐다
#     → 절취본이 아니라 **생성 원본(≈5s)** 을 넣고, 받은 뒤 같은 구간을 자른다.
#       reframe이 앞뒤 맥락을 더 많이 보므로 결과도 안정적이다.
set -e
cd "$(dirname "$0")"
mkdir -p plates/16x9 plates/drafts/rf16

# 이름  원본                     시작   길이   배속(옵션)
JOBS=(
  "H2a|plates/drafts/raw4/H2a.mp4|1.20|2.20|"
  "H2b|plates/drafts/raw3/H2b.mp4|1.60|2.00|"
  "H3a|plates/drafts/raw4/H3a.mp4|1.40|2.20|"
  "H3c|plates/drafts/raw4/H3c.mp4|0.80|2.60|"
  "C4|plates/drafts/raw3/C4.mp4|2.00|3.00|"
)
for job in "${JOBS[@]}"; do
  IFS='|' read -r name src ss dur rate <<< "$job"
  [[ -f plates/16x9/$name.mp4 ]] && { echo "── $name (건너뜀)"; continue; }
  echo "── $name  ← $(basename $src)"
  raw="plates/drafts/rf16/$name-raw.mp4"
  if [[ ! -f $raw ]]; then
    url=''
    for i in 1 2 3; do
      url=$(higgsfield generate create reframe --aspect_ratio 16:9 --resolution 720p \
        --video "$src" --wait --wait-timeout 20m 2>&1 | grep -o 'https://[^ ]*mp4' | tail -1)
      [[ -n $url ]] && break
      echo "   재시도 $i"; sleep 20
    done
    [[ -z $url ]] && { echo "   ✗ $name 실패"; continue; }
    curl -sL -o "$raw" "$url"
  fi
  # 4:5판과 **같은 구간**을 자른다 — 두 비율의 편집 타이밍이 어긋나면 안 된다
  ffmpeg -v error -ss "$ss" -t "$dur" -i "$raw" -an \
    -c:v libx264 -crf 16 -preset medium -y "plates/16x9/$name.mp4"
  echo "   → plates/16x9/$name.mp4 ($dur s)"
done

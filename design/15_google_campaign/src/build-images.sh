#!/usr/bin/env bash
# 광고 이미지 10종 빌드 — 소스는 gen/final/ 의 춘향 생성 아트.
#
# 왜 인게임 스크린샷을 안 쓰나
#   초판은 마스터 영상에서 스틸을 뽑아 잘라 썼는데, 게임 UI가 그대로 찍혀
#   ① 하단 「내기」 빨간 버튼이 남아 소셜 카지노 판정 위험이 있었고
#   ② 광고로서 시선을 못 끌었다.
#   지금은 춘향 캐릭터 시트(ref/01) + 세계관·소품(ref/03) + 실제 카드 아트(ref/04)를
#   레퍼런스로 물려 생성한 아트를 쓴다. 카드 도안·소품·팔레트는 게임 실물에서 왔다.
#   스크린샷 세트는 build-images-ingame.sh 로 남아 있다 (assets/ads/spare-ingame/).
#
# 정책 (→ README §4)
#   · 프롬프트에 'chest fully and modestly covered, no cleavage' 고정 — 성적 암시 정책
#   · 이미지에 텍스트를 넣지 않는다(01의 로고만 예외) — 문구는 광고 텍스트 필드로 간다
#   · 「내기」 버튼·현금·동전 이미지 없음 — 소셜 카지노 분류 회피
set -euo pipefail
cd "$(dirname "$0")/.."   # 스크립트는 src/ 에, 경로는 캠페인 루트 기준
G=gen/final
OUT=assets/ads
mkdir -p "$OUT"
Q="-q:v 2"

# 금박 로고 — OG2의 캘리그래피를 루마 키로 따서 투명 PNG로. 배경이 어둡고 글자가 밝아
# 루마 키가 깨끗하게 먹는다. 크롭을 y=262부터 잡는 이유: 그 위에 화투패 모서리가 걸려
# 있어서 키잉하면 흰 조각으로 남는다.
[ -f gen/logo_alpha.png ] || ffmpeg -y -v error -i ../../Assets/OG/OG2.png \
  -vf "crop=580:355:170:262,lumakey=threshold=0.10:tolerance=0.18:softness=0.10,format=rgba" \
  -frames:v 1 gen/logo_alpha.png

# 16:9(2752×1536) → 1.91:1(1200×628). 세로 1440만 남기고 위쪽 60px을 버린다.
w169() { ffmpeg -y -v error -i "$1" -vf "crop=2752:1440:0:60,scale=1200:628" -frames:v 1 $Q "$2"; }

echo "── 1.91:1 (1200×628) ──"
# 01 히어로 — 좌측 절반이 비어 있어 로고를 얹는다. 10종 중 로고가 들어가는 유일한 소재.
ffmpeg -y -v error -i "$G/01_hero.png" -i gen/logo_alpha.png -filter_complex \
  "[0]crop=2752:1440:0:60,scale=1200:628[b];[1]scale=490:300[l];[b][l]overlay=85:165" \
  -frames:v 1 $Q "$OUT/01_hero.jpg"
w169 "$G/02_ogwang.png"       "$OUT/02_ogwang.jpg"        # 오광 폭발 — 금빛 기둥
w169 "$G/03_twelve.png"       "$OUT/03_twelve.jpg"        # 열두 달 아치 — 볼륨
w169 "$G/04_frictionless.png" "$OUT/04_frictionless.jpg"  # 노트북·폰 — 설치 없음

echo "── 1:1 (1200×1200) ──"
for n in 05_jokers 06_jumak 07_go; do
  ffmpeg -y -v error -i "$G/$n.png" -vf "scale=1200:1200" -frames:v 1 $Q "$OUT/$n.jpg"
done

echo "── 4:5 (960×1200) ──"
for n in 08_taunt 09_ogwang_v 10_bak; do
  ffmpeg -y -v error -i "$G/$n.png" -vf "scale=960:1200" -frames:v 1 $Q "$OUT/$n.jpg"
done

echo "── 로고 (계정 자산, 10종 미포함) ──"
ffmpeg -y -v error -f lavfi -i "color=c=0x1d3b33:s=1200x1200" -i gen/logo_alpha.png \
  -filter_complex "[1]scale=1000:613[l];[0][l]overlay=100:294" -frames:v 1 $Q "$OUT/logo_1x1.jpg"
ffmpeg -y -v error -f lavfi -i "color=c=0x1d3b33:s=1200x300" -i gen/logo_alpha.png \
  -filter_complex "[1]scale=440:270[l];[0][l]overlay=380:15" -frames:v 1 $Q "$OUT/logo_4x1.jpg"

echo
for f in "$OUT"/*.jpg; do
  printf '%-34s %-10s %sKB\n' "$f" \
    "$(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$f")" \
    "$(( $(stat -f%z "$f") / 1024 ))"
done

#!/usr/bin/env bash
# [예비] 인게임 스틸 기반 광고 이미지 빌드. 본소재는 build-images.sh(춘향 생성 아트)로 대체됐다.
# 생성 아트가 광고-제품 불일치를 만든다는 판단이 서면 이 세트로 되돌린다.
#
# 크롭 규칙 (→ images.md §0)
#  · 하단 「내기」 빨간 버튼(y≳1120)은 전부 잘라낸다 — 소셜 카지노 판정 위험
#  · 춘향 아트는 **OG2만** 쓴다. OG1/OGB1/OGB2는 노출이 커서 성적 암시 정책·가족 지면
#    배제 위험이 있다. OG2는 패로 가슴을 가린 구도이고 부제가 '로그라이크 덱빌딩'이라
#    카테고리 포지셔닝까지 이미 박혀 있다.
#  · 비율에 맞는 소스를 고른다. 가로 컷(광 5장 배열)은 1.91:1로, 원형 컷(족보 엠블럼)은
#    4:5·1:1로. 세로 컷을 억지로 1.91:1에 넣으면 좌우가 비어 레터박스가 된다.
set -euo pipefail
cd "$(dirname "$0")/.."   # 스크립트는 src/ 에, 경로는 캠페인 루트 기준
S=assets/stills
OG=../../Assets/OG
OUT=assets/ads/spare-ingame
mkdir -p "$OUT"
Q="-q:v 2"

echo "── 1.91:1 (1200×628) ──"
# 01 브랜드 히어로 — OG2는 1731×909 = 1.905:1 이라 크롭 없이 그대로 들어간다.
#    로고 · 부제 · 춘향 · 화투패가 원본 구도 그대로 유지된다.
ffmpeg -y -v error -i "$OG/OG2.png" -vf "scale=1200:628" -frames:v 1 $Q "$OUT/01_hero-chunhyang.jpg"
# 02 오광 5장 — 광이 판에 가로로 늘어선 순간(30.40s). 가로 구도라 1.91:1에 그대로 맞는다.
#    원형 엠블럼을 여기 넣으면 좌우가 텅 비어 blur-pad 신세가 된다 → 엠블럼은 08(4:5)로 보냈다.
ffmpeg -y -v error -i "$S/ogwang-laid.png" -vf "crop=1080:565:0:440,scale=1200:628" -frames:v 1 $Q "$OUT/02_moment-ogwang.jpg"
# 03 점수 증명 — 낸 광 5장 + 14,500/2,200. 버튼은 크롭 범위 밖
ffmpeg -y -v error -i "$S/score-14500.png" -vf "crop=1080:565:0:490,scale=1200:628" -frames:v 1 $Q "$OUT/03_proof-14500.jpg"
# 04 zero-friction — 신규 합성 필요 (images.md §2-3 프롬프트 A). 미생성

echo "── 1:1 (1200×1200) ──"
# 05 조커 연쇄 — 상단 조커바 + +60/+25 빔 + 낸 광 5장
ffmpeg -y -v error -i "$S/joker-chain.png" -vf "crop=1040:1040:20:0,scale=1200:1200" -frames:v 1 $Q "$OUT/05_joker-chain.jpg"
# 06 특수패 22종 그리드 — 인게임 캡처 조합 필요. 미생성
# 07 주막 상점 — 모달 전체
ffmpeg -y -v error -i "$S/shop.png" -vf "crop=1080:1080:0:120,scale=1200:1200" -frames:v 1 $Q "$OUT/07_shop-jumak.jpg"

echo "── 4:5 (960×1200) ──"
# 08 오광 엠블럼 — 원형이라 세로 프레임에 꽉 찬다. 캠페인에서 가장 강한 인게임 컷.
ffmpeg -y -v error -i "$S/ogwang-emblem.png" -vf "crop=800:1000:140:100,scale=960:1200" -frames:v 1 $Q "$OUT/08_emblem-ogwang.jpg"
# 09 춘향 4:5 — OG2 우측. 얼굴 + 패 부채. OG 원본은 손대지 않고 파생본만 만든다
ffmpeg -y -v error -i "$OG/OG2.png" -vf "crop=727:909:870:0,scale=960:1200" -frames:v 1 $Q "$OUT/09_chunhyang-4x5.jpg"
# 10 12개월 사다리 — 신규 합성 필요 (images.md §2-3 프롬프트 C). 미생성

echo "── 예비 (하위 소재 교체용) ──"
ffmpeg -y -v error -i "$S/godori-emblem.png"     -vf "crop=1080:1080:0:20,scale=1200:1200"  -frames:v 1 $Q "$OUT/x1_godori-1x1.jpg"
ffmpeg -y -v error -i "$S/gauge-180.png"         -vf "crop=1080:565:0:490,scale=1200:628"   -frames:v 1 $Q "$OUT/x2_gauge180-191.jpg"
ffmpeg -y -v error -i "$S/byeongpung-emblem.png" -vf "crop=800:1000:140:100,scale=960:1200" -frames:v 1 $Q "$OUT/x3_byeongpung-4x5.jpg"
ffmpeg -y -v error -i "$OG/OG2.png"              -vf "crop=760:909:20:0,scale=960:1200"     -frames:v 1 $Q "$OUT/x4_logo-4x5.jpg"

echo
for f in "$OUT"/*.jpg; do
  printf '%-40s %-10s %sKB\n' "$f" \
    "$(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$f")" \
    "$(( $(stat -f%z "$f") / 1024 ))"
done

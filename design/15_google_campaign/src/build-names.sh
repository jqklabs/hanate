#!/bin/bash
# 네이밍 비교용 — 12장 소재에 후보 로고를 하나씩 다르게 붙인다.
#   n01 落花   n02 落花:낙화   n03 打花   n04 打花:타화   n05 花打
#   n06 花打:화타  n07 打上花  n08 打上花:타상화  n09 光花  n10 光花:광화
#   11·12월은 두 글자 최강(光花)과 세 글자 최강(打上花:타상화)을 재사용해 대조한다.
# 로고 가로세로비가 1.91~4.51로 크게 달라, 규격·로고별로 폭을 따로 준다.
set -e
cd "$(dirname "$0")/.."   # 스크립트는 src/ 에, 경로는 캠페인 루트 기준
OUT=assets/ads-names
G=gen/plates
PY=/tmp/fontenv/bin/python
mkdir -p "$OUT"

# lay <아트> <출력> <규격w> <규격h> <crop> <로고폭> <lx> <ly> <부제> <크기> <로고파일>
lay () { $PY src/lockup.py "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8" "$9" "${10}" "" "${11}"; }

lay $G/z01/01_january.png   $OUT/n01_january.jpg   1200 1200 1254 380  75  620 '1월부터 12월까지, 열두 판'      48 gen/logo/name_01.png
lay $G/z02/02_february.png  $OUT/n02_february.jpg  1200  628  804 600  90  120 '당신이 고른 패가 승부를 만든다'  44 gen/logo/name_02.png
lay $G/m03/art.png          $OUT/n03_march.jpg      960 1200 1280 380  60  640 '3월에서 대부분 멈춘다'          48 gen/logo/name_03.png
lay $G/m04/art.png          $OUT/n04_april.jpg     1200  628  804 640  90  140 '패를 모을수록 점점 세진다'       44 gen/logo/name_04.png
lay $G/m05/art.png          $OUT/n05_may.jpg       1200 1200 1254 400  75  620 '여기서 멈출까, 더 갈까'         48 gen/logo/name_05.png
lay $G/m06/art.png          $OUT/n06_june.jpg       960 1200 1280 480  60  660 '6월, 아직 절반이다'            48 gen/logo/name_06.png
lay $G/m07/art.png          $OUT/n07_july.jpg      1200  628  804 500  90  130 '아는 카드, 처음 보는 규칙'       44 gen/logo/name_07.png
lay $G/m08/art.png          $OUT/n08_august.jpg    1200 1200 1254 620  75  680 '실패하면 다시 1월부터'          48 gen/logo/name_08.png
lay $G/m09/art45.png        $OUT/n09_september.jpg  960 1200 1254 380  55  630 '9월부터는 판이 당신을 노린다'    44 gen/logo/name_09.png
lay $G/m10/art.png          $OUT/n10_october.jpg   1200  628  804 600  90  120 '운이 아니라 선택이 이긴다'       44 gen/logo/name_10.png
lay $G/m11/art.png          $OUT/n11_november.jpg  1200 1200 1254 400  75  620 '한 판에 기회는 네 번'           48 gen/logo/name_09.png
lay $G/m12/art.png          $OUT/n12_december.jpg   960 1200 1280 560  60  670 '인공지능도 12월을 못 넘었다'     44 gen/logo/name_08.png

echo
for f in "$OUT"/*.jpg; do
  printf '%-38s ' "$f"
  sips -g pixelWidth -g pixelHeight "$f" | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{printf "%10s  ", w"x"h}'
  du -h "$f" | awk '{print $1}'
done

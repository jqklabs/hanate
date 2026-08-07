#!/bin/bash
# v4 「열두 달 화첩」 — 아트 플레이트 12장에 타이포와 고지를 조판해 광고 규격으로 굽는다.
#  브랜드: 십이화 (十二花) · 태그라인: 꽃으로 수놓은 밤
#
#  아트 생성 : gen/scripts/run7.sh (1~2월) · run8.sh · run8b.sh (3~12월) — 글자 없는 플레이트
#  제목·CTA  : gen/scripts/run_type.sh 로 생성한 금박 붓글씨 이미지 (12장 공용)
#  부제      : 인게임 폰트 SSRockRegular — 광고에서 본 글씨 = 게임에서 볼 글씨
#  조판      : src/lockup.py + 사행성 고지(Pretendard 정자체)
#  규격      : 1:1 1200x1200 · 1.91:1 1200x628 · 4:5 960x1200 · JPG ≤5MB
#
#  ※ SSRock 은 게임에 나오는 글자만 담은 서브셋이다(한글 557자 / 완성형 11,172자 중).
#    아래 부제 4줄은 원안이 서브셋에 없는 글자를 물어서 교체한 것이다:
#      2월  곧·략  →  '당신이 고른 패가 승부를 만든다'
#      7월  익·숙  →  '아는 카드, 처음 보는 규칙'  
#     11월  뿐     →  '한 판에 기회는 네 번'
#     12월  A·I    →  '인공지능도 12월을 못 넘었다'
#    문구를 고치면 lockup.py 가 누락 글자를 stderr 로 경고한다. 무시하지 말 것.
set -e
cd "$(dirname "$0")/.."   # 스크립트는 src/ 에, 경로는 캠페인 루트 기준
OUT=assets/ads-v3
G=gen/plates
PY=/tmp/fontenv/bin/python
mkdir -p "$OUT"

lay () { $PY src/lockup.py "$@"; }

#      아트                   출력                        규격w 규격h crop  로고 lx  ly  부제                             크기
lay $G/r01/art.png          $OUT/v3_01_january.jpg   1200 1200 1254 600  70  660 '1월부터 12월까지, 열두 달'        44
lay $G/z02/02_february.png  $OUT/v3_02_february.jpg  1200  628  804 620  80  150 '당신이 고른 패가 승부를 만든다'    41
lay $G/r03/art.png          $OUT/v3_03_march.jpg      960 1200 1280 560  60  700 '3월에서 대부분 멈춘다'            44
lay $G/m04/art.png          $OUT/v3_04_april.jpg     1200  628  804 620  80  150 '패를 모을수록 점점 세진다'         41
lay $G/m05/art.png          $OUT/v3_05_may.jpg       1200 1200 1254 600  70  660 '여기서 멈출까, 더 갈까'           44
lay $G/m06/art.png          $OUT/v3_06_june.jpg       960 1200 1280 560  60  700 '6월, 아직 절반이다'              44
lay $G/m07/art.png          $OUT/v3_07_july.jpg      1200  628  804 620  80  150 '아는 카드, 처음 보는 규칙'           41
lay $G/m08/art.png          $OUT/v3_08_august.jpg    1200 1200 1254 600  70  660 '실패하면 다시 1월부터'            44
lay $G/r09/art.png          $OUT/v3_09_september.jpg  960 1200 1280 545  55  695 '9월부터는 계절이 당신을 막는다'    41
lay $G/m10/art.png          $OUT/v3_10_october.jpg   1200  628  804 620  80  150 '운이 아니라 선택이 이긴다'         41
lay $G/m11/art.png          $OUT/v3_11_november.jpg  1200 1200 1254 600  70  660 '한 판에 기회는 네 번'             44
lay $G/r12/art.png          $OUT/v3_12_december.jpg   960 1200 1280 560  60  700 '인공지능도 12월을 못 넘었다'       41

echo
echo "=== assets/ads-v3 ==="
for f in "$OUT"/*.jpg; do
  printf '%-36s ' "$f"
  sips -g pixelWidth -g pixelHeight "$f" | awk '/pixelWidth/{w=$2}/pixelHeight/{h=$2}END{printf "%10s  ", w"x"h}'
  du -h "$f" | awk '{print $1}'
done

#!/bin/bash
# hwatro 캠페인 4:5 최종 인코딩
# 오디오 마스터링은 이미 완료돼 시퀀스 A16(hwatro_master_mix.wav)에 들어 있다.
#   체인: AAF 유니티 합산 → -1.10 dB → alimiter(limit=0.79, atk 1ms, rel 60ms)
#   승인본(ElevenLabs_hwatro-7.mp4) 대비 구간별 -0.11~+0.47 dB, 지연 0 ms, 피크 0.874
# 따라서 여기서는 오디오를 건드리지 않고 그대로 통과시킨다.
set -e
IN="${1:?ProRes 파일 경로}"
OUT="${2:-out/hwatro_campaign_4x5_smooth.mp4}"
ffmpeg -y -i "$IN" \
  -c:v libx264 -preset slow -crf 16 -maxrate 24M -bufsize 48M \
  -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 320k -ar 48000 \
  "$OUT"
echo "완료 → $OUT"

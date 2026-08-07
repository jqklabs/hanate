#!/bin/bash
# 태그라인 「꽃으로 수놓은 밤」 — 로고와 같은 붓으로.
# 인게임 폰트 SSRockRegular 에 '놓' 이 없어 폰트로는 조판할 수 없다.
# 고정 태그라인이므로 로고처럼 붓글씨 이미지로 한 번 만들어 12장에 공용으로 쓴다.
cd "$(dirname "$0")/.." || exit 1
HEAD='Use your image generation tool to create this image. Do NOT draw it with code (no PIL, canvas, SVG, or matplotlib). Do NOT search the filesystem or read other files - just generate the image and save it.'
REF='The attached image is our logo. Match its brush character exactly - the same hand, the same gold leaf with hammered texture, the same dry-brush 비백 streaks, the same pure flat black background. This new line is a TAGLINE that sits under that logo, so it is quieter and more even than the logo, but written by the same calligrapher with the same brush.'
BODY='A single horizontal line of Korean brush calligraphy on a PURE SOLID BLACK background. The text reads exactly: 꽃으로 수놓은 밤. Rich gold leaf strokes with metallic texture. Written by hand, never typeset - stroke width still modulates from pressed starts to thin tails and the characters are slightly uneven in size and axis, but the line reads calmly from left to right as a subtitle, not as a wild artwork.'
ACC='TEXT ACCURACY IS CRITICAL: reproduce the Korean exactly character by character - 꽃 으 로 (space) 수 놓 은 (space) 밤 - correctly spelled and formed, no missing or invented or duplicated characters, no extra words. Generous empty black margin on all four sides so no stroke touches the edge. Nothing else in the image: no seal, no stamp, no ornaments, no frame, no background art, no Latin letters.'

gen () {
  mkdir -p "$1"
  ( cd "$1" && codex exec --sandbox workspace-write --skip-git-repo-check -i ../../logo/logo_sipihwa.png -- \
      "$HEAD $REF Prompt: $BODY $2 $ACC Then save the generated file to ./type.png" \
      < /dev/null > log.txt 2>&1 ) ; true
}

gen type/tagA 'Weight: medium, balanced and legible.' &
gen type/tagB 'Weight: slightly bolder and more compact, characters closer together.' &
gen type/tagC 'Weight: lighter and more flowing, with a longer sweeping tail on the last character.' &
wait
echo "=== done ==="; ls type/tag?/type.png 2>/dev/null | wc -l

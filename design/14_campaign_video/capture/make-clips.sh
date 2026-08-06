#!/bin/zsh
# 키프레임 → 힉스필드 영상. 시안이므로 **std(저화질)·무음** 고정.
# 사용자가 시안을 고른 뒤에만 --mode pro로 같은 키프레임을 그대로 물려 재생성한다.
#
# 사용: ./make-clips.sh [슬롯...]   (인자 없으면 전부)
set -e
cd "$(dirname "$0")"
KF=plates/drafts/kf
RAW=plates/drafts/raw4
mkdir -p "$RAW"

ARGS="$*"
want() { [[ -z "$ARGS" || " $ARGS " == *" $1 "* ]] }

# gen <출력이름> <start> <end|-> <프롬프트>
gen() {
  local name=$1 start=$2 end=$3 prompt=$4
  local -a ends; [[ $end == '-' ]] || ends=(--end-image "$KF/$end.png")
  echo "── $name"
  local url=''
  for i in 1 2 3 4 5; do
    url=$(higgsfield generate create kling3_0 --duration 5 --mode std --sound off \
      --aspect_ratio 9:16 --start-image "$KF/$start.png" "${ends[@]}" \
      --prompt "$prompt" --wait --wait-timeout 20m 2>&1 | grep -o 'https://[^ ]*mp4' | tail -1)
    [[ -n $url ]] && break
    echo "   재시도 $i (503 등)"; sleep 30
  done
  [[ -z $url ]] && { echo "   ✗ $name 실패"; return 1; }
  curl -sL -o "$RAW/$name.mp4" "$url"
  echo "   → $RAW/$name.mp4"
}

# 그림체가 흔들리지 않게 모든 모션 프롬프트 끝에 붙인다
STYLE='2D anime illustration style, hand-painted, not photorealistic, not 3D. No text.'

# ══ H2 ① 원작 [00:00-00:04] — 미디엄샷 고정, 손은 프레임 밖, **대사를 친다** ══
# 17차에서 이걸 스틸로 뒀더니 "왜 정지 화면이 있냐"가 됐다. 원작은 정지가 아니라
# 카메라만 고정된 채 인물이 말하는 컷이다.
want H2a && gen H2a H2-a - "She deals a round of Korean hwatu cards, calm and
composed, her expression unreadable and matter-of-fact - a professional at work.
She is NOT shy and does NOT look away in embarrassment; her gaze stays level, down
at the table where she is dealing. Her lips move slightly as if thinking to herself.
Only her forearms and shoulders move with the dealing motion - her hands stay just
below the bottom edge of the frame the whole time. The camera is locked off,
completely static. Hard cool top light, the room behind her almost black.
Single continuous shot, no cuts. $STYLE"

# ══ H2 ② 원작 [00:04-00:07] — 손 익스트림 클로즈업, 덱 밑에서 빼 프레임 밖으로 ══
want H2b && gen H2b H2-b H2-c "Extreme close-up top-down of a pair of slender hands
on a dark table, hands filling most of the frame. In one fast crisp motion the right
thumb slips UNDER the deck, draws a card out from the BOTTOM, and flicks it away
across the table out of the frame; then immediately a second card is drawn from the
bottom the same way. The hands stay planted, only the fingers snap. Very subtle
handheld drift. Hard top light, background stays pure black. $STYLE"

# ══ H3 ① 원작 [01:20-01:25] — 타이트 바스트, 아주 느린 달리인, 상체를 앞으로 ══
want H3a && gen H3a H3-a - "She leans slowly forward over the table toward the
camera, weight shifting in, shoulders pressing forward, asking a question - lips
moving naturally - and a sly provocative smile spreads at one corner of her mouth.
Her eyes stay fixed on the person across the table, slightly off-axis from the lens.
The camera pushes in very slowly and steadily throughout. Single continuous shot.
$STYLE"

# ══ H3 ② 원작 [01:25-01:26] — 클로즈업, 앉은 채 미동 없이 일갈 (1.5초) ══
# 원작의 키 컷. 몸은 움직이지 않고 입만 열려 한 마디가 터진다.
want H3shout && gen H3shout H3-shout - "He holds the iconic pose: head bowed down
toward the table, right hand raised high beside his head with index and middle
finger extended upward. He shouts one hard word downward - his mouth opens sharply,
the raised hand PUNCHES upward a few centimeters on the shout for emphasis, then
holds. His head stays bowed; the body does not otherwise move. The camera is locked
off, completely static.
He stays a pure unreadable dark silhouette the entire time - backlit, no facial
features, no eyes, no skin detail, only the outline of his bowed head, hair, open
mouth and the raised two-finger hand, with a thin cool rim light along the edges.
The cool backlight flickers very slightly. Single continuous shot. $STYLE"

# ══ H3 ③ 원작 [01:31-01:33] — 인서트, 우측에서 중앙으로 밀려드는 판돈 ══
want H3c && gen H3c H3-b H3-c "Perfectly top-down view of a dark green felt hwatu
gambling mat, camera locked, no perspective change. A man's hand in a dark navy
hanbok sleeve rests flat and completely still on the mat for a beat. Then four
Korean hwatu cards slide in and come to rest in a neat row in front of him, and the
hand moves up toward them and stops just short.
The four cards stay FACE-DOWN and FULLY VISIBLE for the rest of the shot - crimson
backs with a small gold plum blossom. The hand must NOT cover, grab or hide them;
they simply sit there in front of him. No card faces ever.
No face, no head, no shoulders - only the hand, the sleeve, the cards and the green
mat. $STYLE"

echo "완료 → $RAW"

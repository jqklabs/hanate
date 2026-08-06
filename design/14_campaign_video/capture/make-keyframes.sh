#!/bin/zsh
# 힉스필드에 물릴 키프레임을 gpt-image(codex)로 뽑는다. 크레딧을 안 쓰므로
# 그림체가 맞을 때까지 여기서 거르고, 통과한 것만 영상 생성에 넘긴다.
#
# 슬롯당 3장(첫 프레임 / 키 프레임 / 마지막 프레임). 힉스필드는 양끝만 받으므로
# 가운데 장은 모션 프롬프트를 쓸 때 구도 근거로 쓰고, 육안 검수에도 쓴다.
#
# 사용: ./make-keyframes.sh [슬롯...]   (인자 없으면 전부)
set -e
cd "$(dirname "$0")/.."          # design/14_campaign_video

KF=capture/plates/drafts/kf
mkdir -p "$KF"

# ── 레퍼런스 ──────────────────────────────────────────
# 얼굴·의상은 캐릭터 시트가, 채색·조명 무드는 완성 일러스트가 잡는다.
# 카드가 화면에 나오는 컷에만 실물 화투 레퍼런스를 붙인다 —
# 레퍼런스가 많아질수록 얼굴 가중치가 떨어진다.
CHAR=(-i "char/춘향이 캐릭터 시트.jpeg" -i char/chunhyang_ref_v2.png)
# 얼굴이 나오는 데다 카드도 손에 들리는 컷 — 시트를 먼저 붙여 얼굴 가중치를 지킨다
CHAR_CARDS=(-i "char/춘향이 캐릭터 시트.jpeg" -i char/chunhyang_ref_v2.png
            -i char/real_cards_ref.png)
# 얼굴이 아예 없는 손 클로즈업 — 시트 대신 채색 톤 레퍼런스 + 실물 화투
HANDS=(-i char/chunhyang_ref_v2.png -i char/real_cards_ref.png -i char/cards_ref_v2.png)

# ── 공통 스타일 블록 ──────────────────────────────────
# `cinematic noir` · `35mm film grain` 같은 말은 절대 쓰지 않는다 —
# 1차 시안이 통째로 실사로 나온 원인이었다. 조명은 스타일 중립어로만.
STYLE='STYLE (critical): 2D anime illustration, hand-painted. EXACTLY the same
anime art style as the attached character sheet - cel shading, clean confident
lineart, painterly rendering, anime facial proportions and anime eyes. This is
NOT photorealistic, NOT a 3D render, NOT CGI, NOT live action, NOT a photograph.
Korean hanbok, Joseon-era tavern interior. No smoking, no cigarette.
No text, no letters, no watermark, no subtitles anywhere in the image.
Vertical 4:5 composition, 1080x1350.'

# 원작(타짜) 조명 문법 — 두 진영을 색으로 가른다
WARM='Lighting: warm candlelight from one side of her face, the other half
falling into deep shadow, background heavily blurred and simplified into darkness.'
TOPLIGHT='Lighting: a single hard top light falls straight down onto the hands
and the cards. The background is pure black, completely unlit - only the backs of
the hands, the sleeve edge and the card faces catch the light.'

gen() {  # gen <파일명> <레퍼런스배열이름> <프롬프트>
  local name=$1; shift
  local -a refs; refs=("${(@P)1}"); shift
  echo "── $name"
  codex exec --sandbox workspace-write --skip-git-repo-check \
    "${refs[@]}" -- "$1

$STYLE

Save the image to ./$KF/$name.png"
}

ARGS="$*"
want() { [[ -z "$ARGS" || " $ARGS " == *" $1 "* ]] }

# ══ H2 — 「손은 눈보다 빠르다」 ═══════════════════════
# 원작 문법: ① 손을 감춘 미디엄샷에서 대사 → ② 하드컷 → 손 익스트림 클로즈업.
# 춘향은 조연이자 조력자다. 방자에게 좋은 특수패 두 장을 밑에서 빼준다.
if want H2; then
gen H2-a CHAR "Eye-level MEDIUM SHOT of the young woman from the character sheet,
seated behind a low wooden table in a dim Joseon tavern. She is speaking calmly to
someone across the table - lips slightly parted mid-sentence, chin level, composed.
Her eyes look DOWN AND ASIDE at the table, NOT at the camera.
CRITICAL FRAMING: both of her hands are completely OUT OF FRAME below the bottom
edge - not a single finger is visible. The frame cuts at her chest.
In the extreme foreground at the right edge, the dark out-of-focus silhouette of
another person's shoulder and sleeve is visible, framing her. $WARM"

gen H2-b HANDS "EXTREME CLOSE-UP, steep HIGH ANGLE looking straight down at a
pair of slender female hands on a dark wooden table. The hands FILL 75% of the
frame. The left hand holds a squared stack of Korean hwatu cards; the right
thumb and forefinger have slipped UNDER the stack and are drawing a single card
out from the BOTTOM of the deck - the card is halfway out, tilted, caught in
motion. No face, no head, no body visible - hands and table only. $TOPLIGHT"

gen H2-c HANDS "EXTREME CLOSE-UP, steep HIGH ANGLE looking straight down at the
same pair of slender female hands on the dark wooden table, hands filling 75% of
the frame. A second Korean hwatu card has just been flicked out of the deck and is
skidding away across the table toward the BOTTOM EDGE of the frame, half of it
already cut off by the frame edge, motion blur trailing behind it. One card
already lies further ahead. The right hand is still extended from the flick.
No face, no head, no body visible - hands and table only. $TOPLIGHT"
fi

# ══ H3 — 「그만 빼시겠어요?」 → 「묻고 더블로 가!」 ════
# 원작에서 질문하는 쪽은 몸을 앞으로 기울여 압박하고, 답하는 쪽은 완전히 고정돼 있다.
# 답하는 쪽 = 방자 = 플레이어. **얼굴이 한 프레임도 나오면 안 된다.**
if want H3; then
gen H3-a CHAR "TIGHT BUST SHOT, level angle, of the young woman from the character
sheet. She is LEANING FORWARD over the low wooden table, weight shifted toward the
person across from her, shoulders pressed in - an unmistakable posture of pressing
someone. Her head is tilted slightly, one eyebrow raised, mouth open mid-question,
a cool challenging look. Her eyes look at the PERSON ACROSS THE TABLE, slightly
off-axis from the lens, NOT into the camera.
Lighting: warm frontal candlelight on her face and chest, background falling into
soft darkness behind her. In the extreme foreground bottom corner, the dark
out-of-focus edge of another person's sleeve."

gen H3-b HANDS "LOW ANGLE, camera resting almost ON the surface of a dark wooden
table, looking up and across it. A MAN'S HAND in a dark navy hanbok sleeve rests
FLAT and completely STILL on the table in the centre of frame, palm down, fingers
spread, tendons taut - absolute stillness, a held breath. The sleeve runs out of
the frame at the right edge.
ABSOLUTELY CRITICAL: the man's face is NOT visible. No head, no chin, no neck, no
shoulders - the frame contains only the hand, the sleeve, and the table. There is
no man's face anywhere in this image.
Lighting: cool hard top light picks out the back of the hand and the sleeve fold;
everything beyond is black."

gen H3-c HANDS "DIAGONAL HIGH ANGLE looking down onto a dark wooden table. FOUR
Korean hwatu cards have just been dealt in from the RIGHT EDGE of the frame and
are sliding to a stop in a loose row across the centre of the table, faint motion
trails behind them. A MAN'S HAND in a dark navy hanbok sleeve is sweeping in from
the bottom of the frame, fingers closing over the four cards to scoop them up.
ABSOLUTELY CRITICAL: the man's face is NOT visible. No head, no chin, no neck, no
shoulders - only the hand, the sleeve, the cards and the table.
Lighting: hard top light on the cards and the hand; the surrounding room is black."
fi

# ══ C4 — 인터뷰 회귀 ══════════════════════════════════
# H1과 같은 방·같은 조명·같은 구도로 돌아온다. 회상이 끝나고 현재로 온 것.
# 여기서만 카메라를 정면으로 본다 — 시청자에게 되묻는 컷이기 때문이다.
if want C4; then
gen C4-a CHAR "Eye-level MEDIUM CLOSE-UP of the young woman from the character sheet,
seated behind the same low wooden table in the same dim Joseon tavern, one forearm
resting casually on the table. She has just set a Korean hwatu card face-down on
the table and lifted her eyes. She looks STRAIGHT INTO THE CAMERA LENS, calm,
appraising, the faintest curl at one corner of her mouth. $WARM"

gen C4-b CHAR "Eye-level MEDIUM CLOSE-UP, slightly closer than before, of the young
woman from the character sheet at the low wooden table. She looks STRAIGHT INTO THE
CAMERA LENS and her head has tilted a few degrees to one side, eyebrows lifting -
she is asking the viewer a question back. Lips parted mid-word. $WARM"

gen C4-c CHAR "Eye-level MEDIUM CLOSE-UP of the young woman from the character sheet
at the low wooden table, head tilted, looking STRAIGHT INTO THE CAMERA LENS with a
knowing, faintly cynical smirk fully formed, chin lowered a little, eyes steady and
amused - the look of someone who already knows the answer. $WARM"
fi

echo "완료 → $KF"

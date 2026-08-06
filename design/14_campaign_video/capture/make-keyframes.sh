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
# C4는 H1(채택본)과 같은 인물·같은 방이어야 한다. 채택된 H1 키프레임을 첫 레퍼런스로
# 붙이면 시트만 줄 때보다 얼굴 드리프트가 확연히 준다 — 17차에서 얼굴이 무너진 원인.
C4REF=(-i capture/plates/drafts/kf/H1-end.png -i "char/춘향이 캐릭터 시트.jpeg"
       -i char/chunhyang_ref_v2.png)
# 얼굴이 나오는 데다 카드도 손에 들리는 컷 — 시트를 먼저 붙여 얼굴 가중치를 지킨다
CHAR_CARDS=(-i "char/춘향이 캐릭터 시트.jpeg" -i char/chunhyang_ref_v2.png
            -i char/real_cards_ref.png)
# 얼굴이 아예 없는 손 클로즈업 — 시트 대신 채색 톤 레퍼런스 + 실물 화투
HANDS=(-i char/chunhyang_ref_v2.png -i char/real_cards_ref.png -i char/cards_ref_v2.png)
# 카드가 **뒷면**으로 나와야 하는 컷 — 뒷면 에셋을 첫 레퍼런스로 못 박는다.
# 이 뒷면이 상점의 dealIn 뒷면과 같아야 두 씬의 통일감이 산다.
BACKS=(-i capture/cardback.png -i char/chunhyang_ref_v2.png -i char/real_cards_ref.png)
# 방자가 나오는 컷 — **방자 시트를 첫 레퍼런스로.** 이게 없어서 17차 H3의 그림체가
# 무너졌다. 손·소매·실루엣 스터디가 시트 안에 다 들어 있다.
BANJA=(-i char/banja_sheet.png -i char/chunhyang_ref_v2.png)
BANJA_CARDS=(-i char/banja_sheet.png -i capture/cardback.png -i char/chunhyang_ref_v2.png)

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
seated behind a low wooden table in a dim Joseon tavern, DEALING a round of Korean
hwatu cards. Her expression is COMPOSED AND UNREADABLE - a professional at work, a
faint cool poise, mouth closed and calm. She is NOT shy, NOT blushing, NOT looking
away in embarrassment. Her gaze is level and matter-of-fact, directed down at the
table where she is dealing, exactly as if this were the most ordinary hand in the
world - that studied casualness is the point.
CRITICAL FRAMING: both of her hands are just below the bottom edge, cut off by the
frame - you can see her forearms entering the frame at the bottom and the motion of
dealing, but not the hands themselves.
In the extreme foreground at the right edge, the dark out-of-focus silhouette of
another person's shoulder and dark navy sleeve.
Lighting: a hard cool top light falls straight down on her, deep shadows under the
brow and chin, the room behind her almost black - a tense card-table look."

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
# ─ 비트 ① : 원작 [01:20-01:25] 타이트 바스트 · 아주 느린 달리인 · 상체를 앞으로
gen H3-a CHAR "TIGHT BUST SHOT, level angle, of the young woman from the character
sheet. She is LEANING FORWARD over the low wooden table, weight shifted toward the
person across from her, shoulders pressed in - an unmistakable posture of pressing
someone. Her head is tilted slightly, one eyebrow raised, mouth open mid-question,
a cool challenging look. Her eyes look at the PERSON ACROSS THE TABLE, slightly
off-axis from the lens, NOT into the camera.
Lighting: warm frontal candlelight on her face and chest, background falling into
soft darkness behind her. In the extreme foreground bottom corner, the dark
out-of-focus edge of another person's dark navy sleeve."

# ─ 비트 ② : 원작 [01:25-01:26] 곽철용 클로즈업 · **로우 앵글** · 앉은 채 일갈
#   방자의 이목구비는 절대 읽히면 안 된다 → 역광 실루엣으로만 묘사한다.
#   (시트 우하단의 실루엣 두상 스터디가 바로 이 컷의 근거다)
gen H3-shout BANJA "CLOSE-UP of the young man from the attached character sheet -
the one in the dark navy hanbok. THE POSE IS THE WHOLE POINT, copy it exactly:
his HEAD IS BOWED, tilted down toward the table as if glaring at the cards below,
and at the same time his RIGHT HAND IS RAISED UP high beside his head, elbow bent,
INDEX AND MIDDLE FINGER extended upward in an emphatic counting gesture - the
classic 'call and double it' pose. He is seated and shouting the call downward,
mouth open, veins of conviction in the gesture. The raised hand and fingers must be
clearly readable against the background glow.
ABSOLUTELY CRITICAL - his face must be UNREADABLE: he is BACKLIT, a pure dark
silhouette against a dim cool glow behind him. Only the OUTLINE of his bowed head,
his hair, his open mouth and the raised hand with two fingers are visible. NO facial
features at all - no eyes, no nose, no visible skin detail. A thin cool rim light
traces the edge of his head, shoulder and the raised hand; everything inside the
outline is black.
Lighting: cool blue-white backlight from behind, the room in front almost unlit.
Cold indigo palette, opposite to the warm candlelit shots."

# ─ 비트 ③ : 원작 [01:31-01:33] 인서트 · 판돈이 우측에서 중앙으로 밀려든다
#   우리는 돈 대신 **패 4장(뒷면)**이 방자 앞에 놓인다 — 손이 쓸어 쥐어 카드가
#   사라지면 안 된다. 네 장이 그대로 보이는 채로 손이 다가가는 그림이다.
#   바닥도 나무책상이 아니라 **게임 배경과 같은 초록 화투판**이어야 한다.
gen H3-b BANJA_CARDS "PERFECTLY TOP-DOWN view, camera pointing straight down at a
GREEN GAMBLING MAT - a dark forest-green felt playing surface with a subtle woven
texture and a faint darker green border pattern, exactly like a Korean hwatu game
board. NOT a bare wooden table. The mat fills the whole frame, parallel to it, no
perspective, no horizon, no wall.
The young man's HAND from the attached character sheet - bare hand and forearm
emerging from a dark navy hanbok sleeve - rests FLAT and completely STILL on the mat,
palm down, fingers spread, seen from directly above, exactly like the hand study
panel in the sheet. The sleeve runs out of the frame at the bottom right.
Light comes straight down, so the hand casts only a TIGHT, SHORT shadow directly
beneath it - no long diagonal shadow.
ABSOLUTELY CRITICAL: no face, no head, no neck, no shoulders anywhere - only the
hand, the sleeve and the green mat.
Lighting: a single hard light straight overhead; the mat falls off to black toward
the frame edges."

gen H3-c BANJA_CARDS "PERFECTLY TOP-DOWN view, camera pointing straight down at the
same dark forest-green felt GAMBLING MAT (Korean hwatu game board, woven texture,
faint darker green border pattern) - NOT a wooden table. Surface parallel to frame,
no perspective.
FOUR Korean hwatu cards lie in a neat row in the centre of the mat, FACE-DOWN and
completely at rest - they have already been dealt and are simply sitting there in
front of the viewer. Their backs look EXACTLY like the attached card-back reference:
deep crimson field, subtle tone-on-tone pattern, thin gold border, small gold plum
blossom in the centre. No card faces, no flowers, no birds - crimson backs only.
The young man's HAND from the character sheet, in its dark navy hanbok sleeve,
enters from the bottom of the frame and rests just in front of the four cards,
about to take them - the hand does NOT cover or hide the cards, all four stay
fully visible.
Light comes straight down; shadows are tight and directly under the objects.
ABSOLUTELY CRITICAL: no face, no head, no neck, no shoulders - only the hand, the
sleeve, the four cards and the green mat."

fi

# ══ C4 — 인터뷰 회귀 ══════════════════════════════════
# H1과 같은 방·같은 조명·같은 구도로 돌아온다. 회상이 끝나고 현재로 온 것.
# 여기서만 카메라를 정면으로 본다 — 시청자에게 되묻는 컷이기 때문이다.
if want C4; then
gen C4-a C4REF "IDENTITY (critical): the FIRST attached image is a frame from the same film, the same woman in the same room. Reproduce HER face exactly - identical eye shape and colour, identical hairline and loose strands, identical hair ornaments, identical hanbok. Same room, same candle placement, same warm key from the same side. This is a later shot from the same scene.
Eye-level MEDIUM CLOSE-UP of the young woman from the character sheet,
seated behind the same low wooden table in the same dim Joseon tavern, one forearm
resting casually on the table. She has just set a Korean hwatu card face-down on
the table and lifted her eyes. She looks STRAIGHT INTO THE CAMERA LENS, calm,
appraising, the faintest curl at one corner of her mouth. $WARM"

gen C4-b C4REF "IDENTITY (critical): the FIRST attached image is a frame from the same film, the same woman in the same room. Reproduce HER face exactly - identical eye shape and colour, identical hairline and loose strands, identical hair ornaments, identical hanbok. Same room, same candle placement, same warm key from the same side. This is a later shot from the same scene.
Eye-level MEDIUM CLOSE-UP, slightly closer than before, of the young
woman from the character sheet at the low wooden table. She looks STRAIGHT INTO THE
CAMERA LENS and her head has tilted a few degrees to one side, eyebrows lifting -
she is asking the viewer a question back. Lips parted mid-word. $WARM"

gen C4-c C4REF "IDENTITY (critical): the FIRST attached image is a frame from the same film, the same woman in the same room. Reproduce HER face exactly - identical eye shape and colour, identical hairline and loose strands, identical hair ornaments, identical hanbok. Same room, same candle placement, same warm key from the same side. This is a later shot from the same scene.
Eye-level MEDIUM CLOSE-UP of the young woman from the character sheet
at the low wooden table, head tilted, looking STRAIGHT INTO THE CAMERA LENS with a
knowing, faintly cynical smirk fully formed, chin lowered a little, eyes steady and
amused - the look of someone who already knows the answer. $WARM"
fi

echo "완료 → $KF"

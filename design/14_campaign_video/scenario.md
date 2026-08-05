# 화투로 캠페인 영상 — 「열두 달」 (확정본 v2)

**확정**: A안 구조 / 훅 C(춘향 직접 호명) / 인게임 화면 / 30초 / 9:16
**핵심 메시지 (1개)**: 한 해가 곧 한 판이다. 당신은 몇 월까지 갈 수 있나.
**스토리보드**: `storyboard_v4.png`

---

## ① 씬 브리프

| 항목 | 내용 |
|---|---|
| 목적 | 신규 플레이 유입 (웹 게임, 설치 없음) |
| 타겟 | 로그라이크 덱빌더 경험자 + 고스톱을 아는 한국인 |
| 플랫폼 | 인스타 릴스 · 틱톡 · 쇼츠 |
| 길이/비율 | 30초 / 9:16 |
| 무대 | **인게임 화면 그대로** — 초록 판 + 금테 UI + 붓글씨 |
| CTA | "몇 월까지 깰 수 있으세요?" |

**구조 — 춘향이 앞뒤를 감싼다**
춘향은 조력자가 아니라 **판을 여는 사람**이다. 그가 관객에게 버튼을 밀어주며 시작하고,
30초 뒤 같은 자리에서 같은 눈으로 되묻는 것으로 끝난다. 그 사이에 한 해가 통째로 지나간다.

1. **Hook (0–3s)** — 춘향이 카메라를 보고 빨간 고 버튼을 관객 쪽으로 민다.
2. **Consequence (3–7.5s)** — 눌렀다. 고박. 암전. 그리고 다시 앉는다.
3. **Escalation (7.5–14.5s)** — 열두 달이 흐르고 조커가 쌓이고 목표가 커진다.
4. **Payoff (14.5–22s)** — 고. 삼광. 게이지를 뚫는다.
5. **Cliffhanger + CTA (22–30s)** — 12월 비바람. 춘향이 되묻는다. 암전.

**왜 훅에 UI가 반드시 보여야 하나** — 릴스에서 첫 프레임에 게임 UI가 없으면
게임 광고로 인식되지 않는다. v1·v3가 실패한 지점이 이것이다.

---

## ② 아트 디렉션 — v3에서 뒤집힌 것

실제 게임을 캡처해 확인한 결과 초기 방향이 오답이었다. **먹빛 사랑방이 아니다.**

| | 폐기된 v3 | **확정 v4** |
|---|---|---|
| 배경 | 먹빛 방, 등잔 | **짙은 녹색 판 + 비네트** |
| UI | 없음 | **금테 패널, 붓글씨 한글, 점수 게이지** |
| 춘향 | 얹은머리·비치는 저고리 | **땋은 머리·분홍 저고리·막걸리 사발** |
| 고 | 손동작 암시 | **거대한 빨간 「N고」 버튼** |

> **춘향 소스 충돌 — 결정 필요**
> `char/춘향이 캐릭터 시트.jpeg`(얹은머리 + 비치는 저고리)와
> 인게임 `assets/BackgroundFigure.webp`(땋은머리 + 분홍 저고리)는 **다른 인물**이다.
> 영상은 플레이어가 실제로 보는 **인게임 쪽을 정본으로 삼았다.**
> 캐릭터 시트를 정본으로 바꾸려면 인게임 에셋도 함께 교체해야 한다.

---

## ③ 프로젝트 코드 · 네이밍

프로젝트 코드: **HT**

| 에셋 주소 | 내용 | 조달 |
|---|---|---|
| `@loc_HT_board` | 초록 판 + 금테 UI (인게임 캡처) | **실물 업로드 — 생성 금지** |
| `@char_HT_chunhyang` | 춘향 | **`BackgroundFigure.webp` 업로드** |
| `@prop_HT_cards` | 화투패 48장 | **실물 업로드 — 생성 금지** |
| `@ui_HT_gostop` | 고/스톱 모달 (초록 스톱 / 빨강 N고) | **실물 업로드** |
| `@prop_HT_coins` | 엽전 더미 | 생성 |

레퍼런스 시트: `char/ingame_ui_ref.png` (플레이 화면 + 고/스톱 모달 + 춘향),
`char/real_cards_ref.png` (실제 카드 8종)

---

## ④ 프롭 방침

**화투패와 UI는 절대 생성하지 않는다.** v1 실패 원인이 이것 — 지어낸 금테 카드가 렌더됐다.
실제 카드: 밝은 미색 한지, 성긴 붓질, 여백 많음. **어둡거나 금테 두른 카드는 오답.**

| 컷 | 패 | 파일 |
|---|---|---|
| S05 | 1월 송학 광 | `assets/01_january/1-gwang.webp` |
| S06 | 3·5월 | `3-gwang` / `5-yeolkkeut` |
| S07 | 9월 열끗 | `assets/09_september/9-yeolkkeut.webp` |
| S03·S09 | 삼광 = 1·3·8월 광 | `1-gwang` + `3-gwang` + `8-gwang` |
| S10 | 12월 비광(우산) | `assets/12_december/12-gwang-umbrella.webp` |

---

## ⑤ 샷리스트 (30초 / 9:16)

세로 프레이밍 원칙: **상단 = UI 패널·점수, 중앙 = 판과 패, 하단 = 춘향.**
카메라는 전 컷 **고정(locked-off)**. 세상만 바뀌고 자리는 그대로 — 루프의 은유.

```
{ shot: "01", duration: "1.5s", board: 01,
  description: "춘향이 사발을 내려놓고 카메라를 정면으로 본다.",
  elements: ["@loc_HT_board", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16 game screen on a deep muted green board with a dark
  vignette. A young Korean woman with a long black braid, pink floral jeogori with a red
  tie and a deep crimson gold-patterned skirt sits barefoot on dark wood, filling the
  lower two thirds of frame. She sets a small white ceramic bowl down on the wood and
  lifts her eyes straight into camera, calm and challenging. Small gold-bordered UI panels
  with Korean brush-script sit along the top edge. Matte grain, muted palette. Static
  frame, no camera movement, no particles, no lens flare." }

{ shot: "02", duration: "1.5s", board: 02,
  description: "빨간 고 버튼을 관객 쪽으로 밀어준다. 나머지 화면은 채도가 빠진다.",
  elements: ["@loc_HT_board", "@char_HT_chunhyang", "@ui_HT_gostop"],
  prompt: "Locked-off vertical 9:16, same framing. The woman slides a large saturated red
  button with bright yellow Korean text forward across the board toward camera, her
  fingertips still resting on its near edge, and waits without blinking. The red button is
  the only strong color left; the rest of the board drains toward desaturated grey-green.
  Matte grain. Static frame, no camera movement." }

{ shot: "03", duration: "1.5s", board: 03,
  description: "눌린다. 패 세 장이 내리꽂히고 점수가 치솟는다.",
  elements: ["@loc_HT_board", "@prop_HT_cards"],
  prompt: "Locked-off vertical 9:16, same framing. The red button depresses. Three bright
  rice-paper hwatu cards slam down onto the green board in quick succession. In the upper
  frame the score number climbs fast in bright gold and the thin progress bar fills toward
  its target. Real physical impact only. Matte grain. Static frame, no shockwave, no glow." }

{ shot: "04", duration: "1.0s", board: 04,
  description: "목표 직전에 멈춘다. 고박. 판이 붉게 죽고 하드컷 암전.",
  elements: ["@loc_HT_board", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16, same framing. The climbing number halts just short of
  its target. Deep saturated red floods the entire green board inward from the edges, the
  gold UI panels going dark. The woman is a dim silhouette at the frame edge, motionless.
  Hold one beat then cut hard to pure black. Matte grain. Static frame, no fade." }

{ shot: "05", duration: "2.0s", board: 05,
  description: "리셋. 1월 · 목표 160. 송학 광이 놓인다.",
  elements: ["@loc_HT_board", "@prop_HT_cards", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16. The board is calm green again, fully reset. The month
  panel at upper left shows the first month with a small sun icon; the score gauge sits at
  zero over a small target with the bar empty. The woman lays down a single bright
  rice-paper card of an ink crane beneath a red sun disc. Matte grain, muted palette.
  Static frame, no camera movement." }

{ shot: "06", duration: "3.5s", board: 06,
  description: "열두 달 몽타주. 밤낮이 교차하고 목표가 오른다.",
  elements: ["@loc_HT_board", "@prop_HT_cards", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16, same framing. The month panel and the target number
  cycle rapidly, ghosting between values as a small sun icon and a small moon icon cross-
  fade back and forth. A row of bright rice-paper cards grows across the green board with
  each change. The woman straightens up in the background, watching more closely. Matte
  grain. Static frame, no camera movement." }

{ shot: "07", duration: "3.5s", board: 07,
  description: "9월. 특수패 슬롯이 채워지고 엽전이 쌓인다.",
  elements: ["@loc_HT_board", "@prop_HT_cards", "@prop_HT_coins", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16, same framing, now dense. Three of the five special-card
  slots along the top edge fill one by one with small ornate tokens. The score panel shows a
  large four-digit target. Stacks of old Korean coins have grown at lower right and cards
  cover the board. The woman leans forward, eyebrows raised. Matte grain. Static frame." }

{ shot: "08", duration: "4.0s", board: 08,
  description: "고/스톱. 이번엔 관객이 결정한다. 춘향은 더 이상 웃지 않는다.",
  elements: ["@loc_HT_board", "@ui_HT_gostop", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16 held in total stillness. The decision modal fills the
  middle of the frame: a green button above and beneath it a huge saturated red button with
  large yellow Korean text. The woman is visible behind the modal, tense, no longer smiling,
  watching camera. Everything holds without motion. Matte grain, muted palette. Static
  frame, no camera movement." }

{ shot: "09", duration: "3.5s", board: 09,
  description: "삼광. 게이지를 뚫고 숫자가 폭주한다.",
  elements: ["@loc_HT_board", "@prop_HT_cards"],
  prompt: "Locked-off vertical 9:16, same framing. Three bright rice-paper cards land
  together on the green board — crane with red sun, cherry blossoms, full moon over a black
  hill. In the upper frame the score number blows past its target and the progress bar
  overfills, gold spilling along its length. The whole board jolts once from the impact.
  Matte grain. Static frame, no camera movement, no particles, no shockwave." }

{ shot: "10", duration: "4.5s", board: 10,
  description: "12월 비바람. 가장 춥고 어두운 컷.",
  elements: ["@loc_HT_board", "@prop_HT_cards", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16. The green board is drowned in cold blue-grey and heavy
  rain streaks fall across the entire screen; the gold UI panels are dimmed under a storm
  debuff. A single rice-paper card of a figure under an umbrella lies at center. The woman
  is barely lit, hunched against the cold. The upper third is nearly empty dark space. Matte
  grain. Static frame, no camera movement." }

{ shot: "11", duration: "3.5s", board: "CTA",
  description: "춘향이 01과 같은 눈으로 되묻는다 → 하드컷 암전 → 로고.",
  elements: ["@loc_HT_board", "@char_HT_chunhyang"],
  prompt: "Locked-off vertical 9:16, framing identical to the opening shot. The woman lifts
  her eyes to camera again with the same calm challenging look, and tilts her head very
  slightly. Hold, then cut hard to pure black. Matte grain. Static frame, no camera
  movement, no fade, hard cut." }
```

**타임라인**

| 컷 | 구간 | 길이 | 자막 | SFX |
|---|---|---|---|---|
| 01 | 0:00–0:01.5 | 1.5s | — | 사발 놓는 소리 |
| 02 | 0:01.5–0:03 | 1.5s | `고?` | `geomungo_pluck` |
| 03 | 0:03–0:04.5 | 1.5s | — | `hwatu_slap` ×3 |
| 04 | 0:04.5–0:05.5 | 1.0s | `고박` | `buk_hit` → **무음** |
| 05 | 0:05.5–0:07.5 | 2.0s | `1월 · 목표 160` | `hwatu_play` |
| 06 | 0:07.5–0:11 | 3.5s | `3월` `5월` `7월` | `janggu_hit` 루프 |
| 07 | 0:11–0:14.5 | 3.5s | `9월 · 2,100` | `coin_nyang` |
| 08 | 0:14.5–0:18.5 | 4.0s | `고? 스톱?` | **무음** |
| 09 | 0:18.5–0:22 | 3.5s | `삼광` | `go_step`→`go_final`→`overflow` |
| 10 | 0:22–0:26.5 | 4.5s | `12월 · 비바람` | 빗소리 + `janggu_hit` |
| 11 | 0:26.5–0:30 | 3.5s | 로고 + `몇 월까지 깰 수 있으세요?` | 잔향 → 무음 |

**자막·로고 원칙** — 스토리보드의 한글은 생성물이라 깨져 있다(`승냥`, `돌파!`, `실패...`).
**최종본의 모든 텍스트는 생성하지 않고 후반작업에서 합성한다.**
폰트는 `assets/Fonts/` SSRock / 지훈배게천행, 로고는 `assets/OG/` 금박 "화투로" 원본 사용.
정확한 문구: 02는 `고?`, 04는 `고박`, 08은 `스톱` / `3고`.

---

## ⑥ Cinema Studio 조작 순서

각 샷마다:
1. `prompt` 전문 붙여넣기
2. `@` 피커로 `elements` 배열 에셋 **전부** 선택
3. `duration` 입력
4. 보이는 `@` 태그가 레코드와 **정확히 일치할 때만** 생성

---

## ⑦ Slop 검수 체크리스트

**스틸에서** 확인한다. 스틸에 결함이 있으면 Seedance로 넘기지 않는다.

- [ ] **판이 초록인가** — 먹빛/검정이면 리젝 (v3 실패 원인)
- [ ] **UI 패널에 금테와 붓글씨가 있는가**
- [ ] **화투패가 실제 에셋과 같은가** — 밝은 한지·성긴 붓질·여백. 금테 카드는 리젝
- [ ] **춘향이 인게임과 같은가** — 땋은머리·분홍 저고리·붉은 치마·맨발
- [ ] **고 버튼이 채도 높은 빨강 + 노란 글씨인가**
- [ ] **한글이 깨졌는가** — 깨졌으면 지우고 후반 합성 (생성 텍스트 사용 금지)
- [ ] **블랙이 뭉갰는가** (슬롭 ①)
- [ ] **오브젝트가 깨졌는가** (슬롭 ②) — 손가락 수, 카드 장수, 슬롯 개수(최대 5)
- [ ] **국소 논리 붕괴** (슬롭 ③) — 점수가 목표보다 작은데 달성 표시 등
- [ ] **피부가 기름진가** (슬롭 ④) — 특히 01·02·08 클로즈업
- [ ] **카메라가 움직였는가** — 전 컷 고정. 미세 드리프트도 리젝
- [ ] **파티클·렌즈플레어·마법진** — 즉시 리젝

**수리 규칙** (최상류부터)
판/UI 무너짐 → 로케이션 수정 / 얼굴 드리프트 → 캐릭터 소스 수정 /
에셋 정상인데 액션 오류 → Seedance 디렉션 수정 / 샷 아이디어 오류 → 브리프 회귀

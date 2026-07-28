# 아트 컨셉 & 디자인 리소스 대장

**대상**: 현행 구현(v5) · Tier S → 전수 대장 + 컨셉 프롬프트 + 예산
**아트 디렉션 원본**: `00_concept.md §4` (여기서는 차이점과 실물 대장만)

---

## 1. 이번 문서의 아트 방향

`00_concept §4`를 그대로 따른다. as-built 특이점만 적는다.

| 항목 | as-built 특이점 |
|---|---|
| 카드 아트 | **실물 화투 도상 기반 48장 webp.** 재해석 없음 — 이용자가 아는 그림 그대로가 자산 |
| 톤 보정 | 48장의 원본 톤이 제각각이라 **런타임 CSS 필터로 일괄 보정**한다 (`applyCardTune`: brightness/saturate/sepia). 튜너 `?cardTune=1`, 값은 `localStorage:hwatro_card_tune` |
| 오버레이 | 카드 위에 종류 표식 4종(광/열끗/띠/피)을 얹어 **48장을 다시 그리지 않고** 타입을 읽히게 한다 |
| 아이콘 | **전부 이모지 문자열** — 특수패 22종·월 12종·족보 13종. 실제 이미지 에셋 0장 |
| 프레임 | 이미지가 아닌 **CSS**(`body::before/::after` 청동 테두리 + 모서리 ㄱ자) |
| 사운드 | 국악 타악 중심 10종 (북·장구·거문고) + 화투 슬랩 |
| 폰트 | 오버레이 전용 2종. 본문은 시스템 폰트 |

---

## 2. 리소스 대장 — `02_flow.md` 핫스팟 역추출

### 실재 에셋 (Assets/ 65개 파일 · 4.1MB)

| ART-ID | 분류 | 이름 | 사용 화면 | 규격 | 수량 | 우선 | 재사용 | 데이터 키 | 컨셉 | 제작 |
|---|---|---|---|---|---|---|---|---|---|---|
| ART-CRD-001~048 | CRD | 화투 48장 | PLAY ⑧⑩ · HELP | webp 카드 비율 | **48** | P0 | 신규 | `art_{mm}_{type}` | 실물 화투 도상 | 생성AI + 보정 |
| ART-OVL-001 | OVL | 광 표식 | PLAY 카드 위 | `overlay_gwang.webp` | 1 | P0 | 신규 | `art_overlay_gwang` | 금박 광(光) 인장 | 디자인 |
| ART-OVL-002 | OVL | 열끗 표식 | 〃 | `overlay_yeolkkeut.webp` | 1 | P0 | 신규 | `art_overlay_yeol` | 〃 | 디자인 |
| ART-OVL-003 | OVL | 띠 표식 | 〃 | `overlay_tti.webp` | 1 | P0 | 신규 | `art_overlay_tti` | 〃 | 디자인 |
| ART-OVL-004 | OVL | 피 표식 | 〃 | `overlay_pi.webp` | 1 | P0 | 신규 | `art_overlay_pi` | 〃 | 디자인 |
| ART-BG-001 | BG | 판 배경 | 전역 `body` | `Background.webp` | 1 | P0 | 신규 | `art_bg_table` | 청록 모포 + 비네트 | 생성AI |
| ART-FNT-001 | FNT | BaigeTianxing | 오버레이 제목·족보 배너 | woff2 가변 400~900 | 1 | P0 | 외부 | `font_overlay` | 붓 획 한자체 | 다운로드 |
| ART-FNT-002 | FNT | SSRock | 오버레이 숫자 | woff2 | 1 | P0 | 외부 | `font_overlay_num` | 각진 숫자 | 다운로드 |
| ART-SFX-001 | SFX | 화투 슬랩 | 카드 낼 때 | `hwatu_slap.mp3` | 1 | P0 | 신규 | `sfx_hwatu_slap` | 패 내리치는 소리 | 생성AI |
| ART-SFX-002 | SFX | 카드 플레이 | 들어올릴 때 | `hwatu_play.mp3` | 1 | P0 | 신규 | `sfx_hwatu_play` | 패 스치는 소리 | 생성AI |
| ART-SFX-003 | SFX | 버리기 | 버릴 때 | `hwatu_discard.mp3` | 1 | P0 | 신규 | `sfx_hwatu_discard` | 패 쓸어내는 소리 | 생성AI |
| ART-SFX-004 | SFX | 북 | 칩 집계 | `buk_hit.mp3` | 1 | P0 | 신규 | `sfx_buk` | 북 한 방 | 생성AI |
| ART-SFX-005 | SFX | 장구 | 배수 집계 | `janggu_hit.mp3` | 1 | P0 | 신규 | `sfx_janggu` | 장구 궁편 | 생성AI |
| ART-SFX-006 | SFX | 거문고 | 점수 롤업 | `geomungo_pluck.mp3` | 1 | P0 | 신규 | `sfx_geomungo` | 현 뜯는 소리 | 생성AI |
| ART-SFX-007 | SFX | 냥 획득 | 코인 파티클 | `coin_nyang.mp3` | 1 | P1 | 신규 | `sfx_coin` | 엽전 부딪는 소리 | 생성AI |
| ART-SFX-008 | SFX | 고 단계 | 캐스케이드 각 단계 | `go_step.mp3` | 1 | P0 | 신규 | `sfx_go_step` | 타격 + 상승 | 생성AI |
| ART-SFX-009 | SFX | 고 확정 | 캐스케이드 종료 | `go_final.mp3` | 1 | P0 | 신규 | `sfx_go_final` | 두두둥 피날레 | 생성AI |
| ART-SFX-010 | SFX | 목표 초과 | 게이지 오버플로 | `overflow.mp3` | 1 | P1 | 신규 | `sfx_overflow` | 넘침 신호음 | 생성AI |

**실재 에셋 소계: 57장 + 폰트 2 + SFX 10 = 65 파일 / 4.1MB**

### 코드로 구현된 리소스 (이미지 아님)

| ART-ID | 분류 | 이름 | 구현 | 데이터 키 | 비고 |
|---|---|---|---|---|---|
| ART-FRM-001 | FRM | 화면 외곽 청동 프레임 | `body::before/::after` CSS | — | 이미지 0장. 9-slice 불필요 |
| ART-FRM-002 | FRM | 패널 프레임 | `.panel` CSS `--panel-line` | — | 〃 |
| ART-BTN-001 | BTN | 1차 버튼(내기) | `.bigbtn` CSS | — | 상태 n/d 2종 (h·p 미정의) |
| ART-BTN-002 | BTN | 2차 버튼 | `.smallbtn` / `.choicebtn` | — | 〃 |
| ART-FX-001 | FX | 점수 카운트업 | `animateNumber` | — | |
| ART-FX-002 | FX | 코인 파티클 | `spawnCoinParticles` | — | |
| ART-FX-003 | FX | 화면 흔들림 | `screenShake` | — | 강/약 2단 |
| ART-FX-004 | FX | 고 파편 | `spawnGoShards` / `spawnGoMiniShards` | — | 텍스트 파편화 |
| ART-FX-005 | FX | 고 연출 9종 | `animGoRoulette/Punch/Slide/Hyper/Slam/Shatter/Heat/Glitch/Stack` | — | 단계별 자동 선택 |
| ART-FX-006 | FX | 카드 비행 | `flyCardsFromHand` | — | FLIP 기법 |
| ART-FX-007 | FX | 조합 오라 | `.aura` / `.aura-junk` CSS | — | 연두 / 빨강 2종 |
| ART-FX-008 | FX | 코치 스포트라이트 | `.coach-block/ring/panel` | — | 4블록 마스킹 |

### 🔴 플레이스홀더 상태 — 이모지 사용 항목

| ART-ID | 분류 | 대상 | 현재 | 수량 | 우선 | 데이터 키 | 필요 사유 |
|---|---|---|---|---|---|---|---|
| ART-ICO-101~122 | ICO | **특수패 22종 아이콘** | 이모지 (💰🧺🐂🎯🧧🎀🧹🐦🏮🌀🌟🖐️🌿☔💥🎴🛡️🍶✨🗓️👑🥋) | **22** | **P0** | `ic_{joker_id}` | 상단바·상점·툴팁에 상시 노출. **등급 구분이 색 라벨뿐**이라 아이콘이 유일한 식별 수단 |
| ART-ICO-201~212 | ICO | 월 꽃 표식 12종 | 이모지 (🌲🌸🌿🪻🌺🍀🌕🌼🍁🍂🌧️) | 12 | P1 | `ic_month_{n}` | 라운드 패널·상점 예고 |
| ART-ICO-301~313 | ICO | 족보 13종 표식 | 이모지 (🕊️🏯🎴🐦🌕☔🎀3️⃣🂠🎗️🍂2️⃣·) | 13 | P2 | `ic_hand_{id}` | 도움말 족보표에만 |
| ART-FRM-011 | FRM | 등급 프레임 4종 | CSS 색상만 (`.r-common/rare/epic/legendary`) | 4 | P1 | `frm_rarity_{r}` | `00_concept §4` 등급 규칙에 프레임·파티클이 정의됐으나 미구현 |
| ART-ILL-001 | ILL | 춘향 캐릭터 | 이모지 표정 (😴😊😍🙂😐) | 1 | — | `ill_chunhyang` | **비활성** — 되살릴 때만 필요 |

**신규 제작 필요 소계: 아이콘 47종 + 등급 프레임 4종 = 51장**

> **재사용 우선 원칙 적용**: ART-ICO-301~313(족보 표식)은 P2 — 도움말에서만 쓰이고 텍스트로 충분하다. **신규 제작 대상에서 제외**하면 실제 필요량은 **38장**(특수패 22 + 월 12 + 등급 프레임 4)으로 줄어든다.

---

## 3. 예산 대비 총량

| 항목 | 상한 (Tier S 기준) | 현황 | 판정 |
|---|---|---|---|
| 신규 리소스 총 장수 | ≤ 80 | 실재 57 + 필요 38 = **95** | ⚠️ 초과 → 족보 아이콘 13 제외 시 82, 월 아이콘 P1 연기 시 **70** ✅ |
| 개별 이미지 최대 | 1024² | 카드 webp `[확인필요]` 미측정 | — |
| 총 용량 | ≤ 8MB | **4.1MB** | ✅ |
| 폰트 | 2웨이트 이내 | 2종 (520KB) | ✅ — 단 **서브셋 미적용** `[확인필요]` |
| 사운드 | SFX 12종 / BGM 3종 | SFX **10** / BGM **0** | ✅ SFX / ⚠️ BGM 부재 |
| 초기 로딩 | ≤ 3초 (4G) | 4.1MB 중 카드 3.3MB 프리로드 + 최소 550ms | ⚠️ `[확인필요]` 4G 실측 없음 |
| 아틀라스 | 2048² × 3장 이내 | **미사용** — 48장 개별 요청 | ⚠️ HTTP 요청 48회 |

`[제안]` 카드 48장을 스프라이트 아틀라스 1장으로 묶으면 요청 48→1. 단 POL-ARC-01(외부 리소스 금지)에는 저촉되지 않으나 CSS `background-position` 관리 비용이 생긴다. **로딩 실측 후 판단**.

---

## 4. 네이밍 · 폴더

### 현행

```
Assets/
  01_january/ ~ 12_december/   1-gwang.webp, 1-tti-hongdan.webp, 1-pi-1.webp …
  Overlay/                     overlay_gwang.webp, overlay_pi.webp …
  Fonts/                       SSRockRegular.woff2, zihun-baige-tianxing.woff2
  SFX/                         hwatu_slap.mp3, buk_hit.mp3 …
  Background.webp
```

| 규칙 | 준수 |
|---|---|
| 소문자 + 언더스코어 | ⚠️ 카드는 하이픈(`1-tti-hongdan`), 폴더는 언더스코어(`01_january`), 폰트는 CamelCase(`SSRockRegular`) — **3가지 혼용** |
| 한글·공백 없음 | ✅ |
| 파일명 키 = 데이터 `icon_key` | ❌ 매핑이 `buildDeck()` 안 문자열 |

`[제안]` 신규 아이콘부터 규칙 통일 — `ic_joker_{id}.webp` / `ic_month_{n}.webp` / `frm_rarity_{r}.webp`. 기존 카드 파일명은 **건드리지 않는다** (48줄 경로 수정 리스크 > 이득).

---

## 5. 스타일 앵커 + 컨셉 프롬프트

### 스타일 앵커 (모든 프롬프트 앞에 그대로 붙인다)

```
"game UI asset for a Korean hwatu (flower card) roguelike,
deep green felt table (#1a4a2e) with aged bronze frame (#c4a25a) and gold-leaf (#d4af37) accents,
traditional Korean woodblock-print feel, flat matte shading with subtle paper grain,
warm single light from upper-left, muted saturation, no photorealism, no neon, no gradients-heavy"
```

### ART-ICO-101~122 · 특수패 아이콘 22종 (P0 · 최우선)

```
앵커 + "a single centered emblem icon on transparent background,
{{모티프}}, bold silhouette readable at 32px, 2px consistent outline,
bronze-and-gold color scheme with one accent color by rarity"
네거티브: "text, letters, numbers, watermark, multiple objects, drop shadow, photoreal, neon"
규격: 128×128 webp 투명, 여백 8px, @1x/@2x
```

| ART-ID | 특수패 | 모티프 서술 | 등급 accent |
|---|---|---|---|
| ART-ICO-101 | 광팔이 | 엽전 꾸러미를 든 손 | 회색 |
| ART-ICO-102 | 피장사 | 피 패를 가득 담은 소쿠리 | 회색 |
| ART-ICO-103 | 멍따 | 황소 머리 정면 | 회색 |
| ART-ICO-104 | 쪽집게 | 패 두 장을 집는 족집게 | 회색 |
| ART-ICO-105 | 쌍피보따리 | 붉은 보따리에서 쏟아지는 쌍피 | 회색 |
| ART-ICO-106 | 띠장수 | 붉고 푸른 띠 세 가닥 | 회색 |
| ART-ICO-107 | 싹쓸이 | 판을 쓰는 빗자루 | 청색 |
| ART-ICO-108 | 고도리꾼 | 새 세 마리 실루엣 | 청색 |
| ART-ICO-109 | 단골 | 붉은 청사초롱 | 청색 |
| ART-ICO-110 | 흔들기 | 소용돌이치는 패 | 청색 |
| ART-ICO-111 | 광모이 | 다섯 광이 모인 별무리 | 청색 |
| ART-ICO-112 | 피오장 | 다섯 손가락 편 손바닥 | 청색 |
| ART-ICO-113 | 초단꾼 | 청색 초단 띠 다발 | 청색 |
| ART-ICO-114 | 비광우산 | 삿갓 쓴 이의 우산 | 보라 |
| ART-ICO-115 | 폭탄 | 심지 붙은 화약 뭉치 | 보라 |
| ART-ICO-116 | 밑장빼기 | 패 더미 밑에서 빠지는 한 장 | 보라 |
| ART-ICO-117 | 피박보험 | 방패 위 피 문양 | 보라 |
| ART-ICO-118 | 멍잔치 | 술병과 잔, 열끗 세 장 | 보라 |
| ART-ICO-119 | 삼광판 | 세 광이 겹친 삼각 배치 | 보라 |
| ART-ICO-120 | 열두사철 | 열두 달이 도는 원형 달력 | 금색 |
| ART-ICO-121 | 오광소원 | 왕관을 쓴 다섯 광 | 금색 |
| ART-ICO-122 | 명인 | 도복 띠를 맨 노름꾼의 손 | 금색 |

### ART-FRM-011 · 등급 프레임 4종 (P1)

```
앵커 + "a 9-slice card frame border only, hollow center,
{{common: thin bronze rule / rare: bronze with corner studs /
epic: full engraved border with subtle inner glow /
legendary: radiant gold border with continuous spark}}"
네거티브: "content inside frame, text, character, photoreal"
규격: 128×160 webp 9-slice, 상태 n/sel 2종 → 총 8장
```

### ART-ICO-201~212 · 월 꽃 표식 12종 (P1)

```
앵커 + "a single flower/plant emblem of {{송학=소나무와 학, 매조=매화, 벚꽃, 흑싸리,
난초, 모란, 홍싸리, 공산=보름달, 국진=국화, 단풍, 오동, 비=비와 버들}},
traditional Korean brush-ink style, single color silhouette"
규격: 64×64 webp 투명
```

**생성은 대장 승인 후에.** `gpt-image` 또는 `higgsfield-generate` 스킬 사용.

---

## 6. 플레이스홀더 폴백 규칙

| 상황 | as-built 동작 | 판정 |
|---|---|---|
| 카드 이미지 없음 | `img` onerror 미처리 — 카드 프레임 + 월/타입 라벨만 표시 | ✅ 크래시 없음 |
| 카드 라벨 숨김 모드 | `hwatro_card_labels='0'` → 라벨 제거, **이미지가 없으면 빈 카드** | ⚠️ 두 조건이 겹치면 식별 불가 |
| 오버레이 없음 | 표식 없이 카드만 | ✅ |
| 폰트 없음 | `font-display:swap` → 시스템 폰트 | ✅ |
| SFX 없음 | 무음. WebAudio 미지원 시 `beep()` 합성음 폴백 | ✅ 이중 폴백 |
| 배경 없음 | `background-color:#142e1f` 단색 | ✅ |
| 프리로드 실패 | `catch` → 진행률 강제 완료 후 게임 시작 | ✅ |
| **크래시** | 없음 | ✅ |

---

## 7. 체크리스트

- [x] 아트 디렉션 시트 존재 + 무드 키워드 5개 (`00_concept §4`)
- [ ] ⚠️ 팔레트 텍스트 대비비 4.5:1 검증 — **미실시** (`07_acceptance` 이관)
- [ ] ⚠️ 등급 표현 규칙이 데이터 `rarity_style`과 1:1 — **`rarity_style` 미도입**
- [x] 대장이 `02_flow` 핫스팟 전부 커버 (역추출 완료)
- [x] 모든 행에 데이터 키 (CSS 구현 항목은 `—` 명시)
- [x] 수량 = 상태 수 × 변형 수 (등급 프레임 4×2=8)
- [x] 신규 제작 항목에 재사용 불가 사유
- [ ] ⚠️ 예산 상한 — 족보 아이콘 P2 연기 조건부 통과
- [x] 스타일 앵커 문장 하나로 고정
- [x] 플레이스홀더 폴백 정의 + 크래시 경로 0

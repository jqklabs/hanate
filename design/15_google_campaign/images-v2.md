# 이미지 v2 5종 — 인게임 × 춘향 하이브리드

> **5종 제작 완료** → [assets/ads-v2/](assets/ads-v2/)
> 빌드: [`build-images-v2.sh`](build-images-v2.sh) · 생성 원본: [gen2/](gen2/) · 기존 10종: [images.md](images.md)

---

## 0. 왜 또 만드나

10종([images.md](images.md))은 **순수 생성 아트**다. 무드와 브랜드는 팔리는데 "이게 무슨 게임인지"는 한 장도 대답하지 않는다. 되돌릴 곳으로 남겨둔 스크린샷 세트(`spare-ingame/`)는 반대로 처음 보는 사람에게 아무 감정도 안 만든다 — 딥그린 모포에 카드 다섯 장이 전부니까.

**v2 5종은 그 사이를 메운다.** 춘향(시선을 끄는 것)과 실제 게임 판·카드·UI(무슨 게임인지 알려주는 것)를 한 프레임에 넣는다. 광고에서 본 화면 = 클릭 후 본 화면이어야 이탈이 안 난다.

---

## 1. 5장은 각각 다른 질문 하나에만 답한다

10장일 땐 겹쳐도 됐지만 5장은 안 된다. 한 장 = 한 직무.

| # | 파일 | 규격 | 답하는 질문 | 화면 | 얹은 UI | 트랙 |
|---|---|---|---|---|---|---|
| **01** | `v2_01_hero.jpg` | 1200×628 | 이게 뭐냐 | 춘향이 판 뒤에서 패 부채를 들고 정면. 좌측 절반이 비어 있다 | 금박 로고 | 공통 |
| **02** | `v2_02_loop.jpg` | 960×1200 | **뭘 하는 거냐** | 위에서 내려다본 판, 손패 3장이 떠오르고 춘향의 손이 집는 중 | 목표 게이지 `1月·송학 180/160` | 공통·B |
| **03** | `v2_03_ogwang.jpg` | 1200×1200 | 왜 짜릿하냐 | 광 5장에서 금빛 기둥이 솟고 춘향이 뒤로 젖혀지며 경악 | 점수 패널 `14,500/2,200` | A·B |
| **04** | `v2_04_jokers.jpg` | 1200×1200 | 얼마나 깊냐 | 부적 5개가 떠서 판의 카드로 빛을 내리꽂음 | 특수패 바 5종 | A |
| **05** | `v2_05_taunt.jpg` | 960×1200 | 왜 지금 누르냐 | 패로 입을 가리고 비웃으며 정면 응시 | 없음 | B |

비율 배분: 4:5 2장(모바일 CTR 최고) · 1:1 2장(노출 1위) · 1.91:1 1장 — Demand Gen 3개 지면을 5장으로 덮는 최소 구성.

**세트를 묶는 공통 문법**: 화면 아래 1/3은 항상 실제 게임의 딥그린 판 + 카드, 위 2/3이 춘향. 나란히 떠도 같은 게임으로 읽힌다.

---

## 2. 왜 UI를 생성하지 않고 잘라 붙이나

GPT Image는 **한글을 뭉갠다.** 점수·족보·특수패 이름을 생성에 맡기면 게임에 없는 UI가 생기고 글자가 깨져 허위 표시가 된다.

그래서 **생성물엔 판·카드·춘향만** 있고, 숫자와 글자가 들어간 패널은 전부 실제 게임 스크린샷에서 잘라 ffmpeg으로 얹는다. 숫자가 진짜고(`14,500`은 실제 9월 국진 판 기록) 폰트가 게임과 같다.

| 패널 | 소스 | 크롭 | 쓰는 곳 |
|---|---|---|---|
| 목표 게이지 | `assets/stills/gauge-180.png` | `734:342:171:691` | 02 좌상단 |
| 점수 폭발 | `assets/stills/score-14500.png` | `1075:344:0:691` | 03 중단 |
| 특수패 바 | `assets/stills/score-14500.png` | `960:64:50:64` | 04 하단 |

게이지·점수 패널은 모서리를 R=30으로 둥글게 딴다(`round30()`). 사각 크롭 그대로 얹으면 아트의 초록 위에 다른 초록 사각형이 떠 보인다.

### 배치에서 배운 것

- **UI가 얼굴을 덮으면 소재 가치가 0이다.** 02의 게이지를 상단 중앙에 얹었더니 춘향 얼굴을 정확히 가렸다 → 좌상단 구석(424px)으로 뺐다.
- **패널을 키우면 저해상 원본이 뭉개진다.** 03의 점수 패널을 1320px로 키웠더니 화면 절반을 먹고 흐려졌다 → 760px로 줄여 얼굴과 카드 사이 빈 띠에만 넣었다.

---

## 3. 생성 설정 (재현용)

- 도구: **GPT Image** via Codex CLI (`gpt-image` 스킬) · 결과 1122×1402 / 1254×1254 / 1536×1024
- 춘향 정본: **캐릭터 시트** ([ref/01_character-sheet.jpg](ref/01_character-sheet.jpg)) — 기존 10종과 같은 인물이라 계정 안 15장이 한 세계로 읽힌다
- 레퍼런스 3장 고정: 캐릭터 시트 + `cards_ref_v2.png` + `ingame_ui_ref.png`
- **02를 먼저 뽑아 스타일 락으로 삼고**, 나머지 4장은 02를 1번 레퍼런스로 물려 병렬 생성 — 인물·팔레트·밝기가 자동으로 맞는다

### 네일아트 (사용자 확정)

춘향의 손이 5장 중 4장에서 화면 요소로 크게 잡힌다. 맨손톱은 그 면적을 낭비하는 것이라 **화투 모티프 젤네일**을 넣었다. 봉숭아물(시대 고증)도 검토했으나 **시대보다 브랜드**를 택했다 — 딥그린 판 위에서 주홍·금박이 튄다.

```
Medium-length almond-shaped gel nails with a high-gloss mirror finish,
alternating deep lacquer-green and deep crimson, each with a thin brushed
gold-leaf line along the tip and tiny gold-leaf flecks under the gloss.
The ring finger is an accent nail: deep crimson with a tiny painted
gold plum blossom and a small gold stud near the cuticle.
```

가장 잘 보이는 컷은 **05**(전경에 펼친 손)와 **02**(카드를 집는 손).

### 프롬프트 고정 블록

```
OPAQUE solid white silk jeogori with woven floral pattern,
absolutely no sheer or see-through fabric, no lace,
no skin visible through cloth, chest fully and modestly covered
```

```
ONLY the bright light cards (crane+red sun, plum blossoms+tiled roof,
black mountain+white moon) have a deep crimson bottom band with a round 光 seal.
All other cards are plain cream with no band and no seal.
KOREAN hwatu, absolutely NOT Japanese hanafuda.
```

```
No text anywhere except the tiny characters printed on the cards.
No user interface, no buttons, no numbers, no logos, no coins, no money.
```

### 최종 소스 파일

| 컷 | 파일 | 세대 |
|---|---|---|
| 01 | `gen2/01_hero_v2.png` | 초안 → 네일 추가 |
| 02 | `gen2/02_loop_v3.png` | 초안 → 불투명·인장 수정 → 네일 + `8月` 라벨 복구 |
| 03 | `gen2/03_ogwang_v2.png` | 초안 → 얼굴 온모델 + 네일 |
| 04 | `gen2/04_jokers_v3.png` | 초안 → 얼굴 온모델 + 네일 → 표정 복구 |
| 05 | `gen2/05_taunt_v2.png` | 초안 → 네일 |

### 편집 패스에서 걸린 것들

> ⚠️ **1차 생성은 저고리가 비쳐서 폐기했다** (`gen2/02_loop.png`). 캐릭터 시트 자체가 시스루라 `OPAQUE` 한 단어로는 안 먹힌다. 위 3줄을 통째로 넣어야 한다.
> ⚠️ 1차는 **光 인장을 전 카드에 찍었다.** 2月 꾀꼬리·9月 국화잔은 광이 아니다. 화투 아는 사람(트랙 B)이 즉시 잡아낸다 — 족보 오류는 신뢰 손실이다.
> ⚠️ **03·04는 그림체가 이탈했다.** 병렬 생성분 중 둘만 눈이 크고 둥글며 얼굴이 어렸고, 03은 홍채까지 초록이었다. `05_taunt.png`를 **얼굴 레퍼런스로만** 물려(`구도는 복사하지 말 것` 명시) 재편집해 맞췄다. 편집 프롬프트에 `do NOT redraw her face shape or eyes larger`를 안 넣으면 다시 커진다.
> ⚠️ **얼굴을 고치면 표정이 죽는다.** 04는 얼굴을 맞추는 과정에서 흐뭇한 미소가 무표정이 됐다 → 시선·입만 다시 지정하는 3차 패스가 필요했다.
> ⚠️ **01의 편집 1차는 장면을 통째로 다시 그렸다.** 인물이 땋은 머리로 바뀌고 저고리가 비치고 카드 도안·月 라벨이 사라졌다. 편집 패스에는 "지우면 안 되는 것"을 항목으로 나열해야 한다 — 프레이밍·헤어스타일·불투명도·카드 라벨·빈 좌측 절반·화풍을 각각 한 줄씩 못 박고 나서야 통과했다.
> 03의 왼쪽 소매는 금빛 폭발에 역광으로 비쳐 팔 실루엣이 보인다. 가슴은 완전히 가려져 있어 성적 암시 정책 대상이 아니다 — 의도된 연출로 둔다.

---

## 4. 정책 대응 (→ [README §4](README.md))

| 규칙 | 처리 |
|---|---|
| 성적 암시 | 위 IDENT 블록 3줄 고정. 5종 전부 불투명 확인 |
| **소셜 카지노** | 크롭 좌표로 방어한다 — 「내기」 빨간 버튼(y≈1150)·「N냥」(y≈160)·동전이 들어간 y좌표는 **절대 안 자른다.** 5종 어디에도 안 나옴 |
| 텍스트 20% 룰 | 01의 로고 + 얹은 UI 패널이 전부. 광고 문구는 텍스트 필드로 (→ [copy.md](copy.md)) |
| 파일 | JPG · sRGB · 211~502KB (한도 5MB) |

---

## 5. 소재 운용

- **10종과 함께 게재한다.** v2 5종은 교체가 아니라 **대조군**이다 — 순수 아트(10종) vs 인게임 하이브리드(5종) 중 뭐가 이기는지 이번에 처음 읽힌다.
- **UTM**: `utm_content=v2_02_loop` 처럼 파일명과 일치시킨다. 접두사 `v2_`가 세트 구분자다.
- **판정**: 2주 또는 노출 5만 회. 기준은 CTR이 아니라 **`hand_play` 전환당 비용** (→ [README §5](README.md)). 여기에 더해 **`session_play_sec ≥ 180` 비율**을 세트별로 본다 — 제품 일치 가설이 맞다면 v2 쪽 유입 품질이 높아야 한다.
- **교체 생성**: `gen2/02_loop_v2.png`를 스타일 락으로 물리고 장면 문단만 갈아끼운다. 아직 안 쓴 장면 — 고박(좌절), 상점(주모), 밤일낮장(낮/밤 대비).

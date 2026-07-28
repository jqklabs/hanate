# 동적 데이터 설계

**대상**: 현행 구현(v5) · Tier S
**판정 질문**: *"이 개념을 하나 더 만들려면 코드 파일을 여는가?"*

> **결론부터**: as-built는 **전부 코드 파일을 연다.** 단일 `index.html` 정책(POL-ARC-01) 때문에
> 데이터 파일이라는 개념 자체가 없고, 콘텐츠는 JS 리터럴 배열 + **클로저**로 정의된다.
> 다만 §3에서 확인하듯 **22종 특수패 전부가 7개 술어 + 7개 효과의 조합으로 표현 가능**하다.
> 즉 스키마화는 가능하고, 막고 있는 것은 구조가 아니라 파일 정책이다.

---

## 1. 코드 / 데이터 경계 (as-built)

### 코드가 가진 "동사" — 이건 올바르게 코드에 있다

| 동사 | 위치 | 비고 |
|---|---|---|
| 족보를 판정하고 코어를 고른다 | `detectHandInfo()` | POL-ARC-05 |
| 카드 한 장의 칩을 계산한다 | `cardChip()` | 보정 순서 고정 (POL-SCR-02) |
| 점수를 합산한다 | `computeScore()` | POL-SCR-01/03/05 |
| 최적 조합을 탐색한다 | `evaluateHand()` | 부분집합 전수 |
| 고 문턱을 계산한다 | `goThreshold` / `goLevelReached` | POL-GO-01/02 |
| 상점 오퍼를 뽑는다 | `genOffers()` / `rollJokerRarity()` | |
| 정산액을 계산한다 | `settle()` | |
| 화면을 그린다 | `render()` 계열 | |

### 데이터여야 하는데 코드에 있는 "명사"

| 개념 | 현재 위치 | 형태 | 데이터화 가능? |
|---|---|---|---|
| 48장 덱 | `buildDeck()` — `add()` 48회 호출 | 코드(함수 본문) | ✅ 순수 row |
| 월 12종 | `MONTHS[]` | 리터럴 배열 | ✅ 이미 사실상 데이터 |
| 카드 칩 | `CHIP{}` | 리터럴 객체 | ✅ |
| 족보 13종 | `HANDS[]` (배열 **순서 = 우선순위**) | 리터럴 + `detectHandInfo` 분기 | ⚠️ 이름·배수는 데이터, **판정 규칙은 코드** |
| 목표 커브 | `TARGETS[]` | 리터럴 배열 | ✅ |
| 특수패 22종 | `JOKERS[]` — 각 항목에 **함수 필드** | 리터럴 + **클로저** | ⚠️ 선언형이나 효과가 코드 |
| 박 6종 | `BOSSES[]` + `cardChip`/`computeScore`/`startRound` 분기 | 리터럴 + **산재한 분기** | ❌ 효과가 3곳에 흩어짐 |
| 티어 확률 | `RARITY_WEIGHT` / `rollJokerRarity` 하드코딩 임계값 | **이중 정의** ⚠️ | ✅ |
| 전 UI 문자열 | 템플릿 리터럴 | 하드코딩 | ❌ 키 없음 |
| 밸런스 계수 (0.6, 5, 4, 6, 2, 3) | 각 함수 내부 상수 | 하드코딩 | ✅ |

⚠️ **이중 정의 발견**: `RARITY_WEIGHT = {common:.55, rare:.28, epic:.13, legendary:.04}`는 **선언만 되어 있고 아무도 읽지 않는다.** 실제 추첨은 `rollJokerRarity()`의 `0.55 / 0.83 / 0.96` 하드코딩 임계값이 한다. 한쪽만 고치면 조용히 어긋난다 → `07_acceptance` 항목.

---

## 2. 테이블 스키마

as-built를 4계층으로 정규화한 **목표 스키마**. 현재 구조에서 어디에 대응하는지 함께 적는다.

### Definition

```
cards.csv
id, month, type, tags, art_key, sort_order, enabled

c_01_gwang,  1, kwang, "",         art_01_gwang,      110, true
c_01_tti,    1, tti,   "hongdan",  art_01_tti_hongdan,120, true
c_11_ssangpi,11,ssangpi,"",        art_11_pi_3,       1130,true
c_12_gwang,  12,kwang, "bikwang",  art_12_gwang_umbrella,1210,true
c_12_tti,    12,tti,   "bi_tti",   art_12_tti_bitti,  1230,true
```
→ as-built: `buildDeck()`의 `add(month, type, tags, art)` 48줄. `uid`는 로드 시 인덱스 부여.

```
months.csv
id, n, name_key, flower_emoji, is_night, yeol_art, gwang_art

m_01, 1, month.songhak.name, 🌲, false, -,   🕊️
m_02, 2, month.maejo.name,   🌸, true,  🐦,  -
```
→ as-built: `MONTHS[]`. `is_night`는 현재 `round % 2 === 0`으로 **계산**되며 데이터가 아니다.

```
hands.csv
id, name_key, mult, priority, core_size, match_rule_id, enabled

h_ogwang,     hand.ogwang.name,     12, 10, 5,    r_kwang_eq5,   true
h_sagwang,    hand.sagwang.name,    8,  20, 4,    r_kwang_eq4,   true
h_chongtong,  hand.chongtong.name,  7,  30, all,  r_month_gte4,  true
h_godori,     hand.godori.name,     6,  40, 3,    r_tag_eq3,     true
h_samgwang,   hand.samgwang.name,   5,  50, 3,    r_kwang_eq3_nobi, true
h_bisamgwang, hand.bisamgwang.name, 4,  55, 3,    r_kwang_eq3_bi,   true
h_dan,        hand.dan.name,        4,  60, 3,    r_dan_set,     true
h_month3,     hand.month3.name,     3,  70, 3,    r_month_gte3,  true
h_yeol3,      hand.yeol3.name,      3,  80, 3,    r_type_gte3,   true
h_tti3,       hand.tti3.name,       3,  90, 3,    r_tti_gte3,    true
h_pi5,        hand.pi5.name,        2,  100,all,  r_pi_value_gte5, true
h_month2,     hand.month2.name,     2,  110,2,    r_month_gte2,  true
h_none,       hand.none.name,       1,  999,all,  r_always,      true
```
→ as-built: `HANDS[]`의 **배열 순서**가 `priority`를 대신하고, `core_size`·`match_rule_id`는 `detectHandInfo()` 코드에 녹아 있다.

```
bosses.csv
id, name_key, desc_key, tier, enabled
b_pibak,    boss.pibak.name,    boss.pibak.desc,    mild, true
b_gwangbak, boss.gwangbak.name, boss.gwangbak.desc, mild, true
b_meongbak, boss.meongbak.name, boss.meongbak.desc, mild, true
b_no_shake, boss.no_shake.name, boss.no_shake.desc, hard, true
b_bibaram,  boss.bibaram.name,  boss.bibaram.desc,  hard, true
b_angae,    boss.angae.name,    boss.angae.desc,    hard, true
```
→ `tier=mild`가 as-built의 `MILD_BOSSES`(3월 전용 풀)에 대응.

```
jokers.csv
id, name_key, desc_key, icon_key, rarity, price, kind_key, enabled

j_gwangpari,  joker.gwangpari.name,  ..., ic_gwangpari,  common,    3,  kind.economy, true
j_pi_merchant,joker.pi_merchant.name,..., ic_pi_merchant,common,    4,  kind.chips,   true
j_paewang,    joker.paewang.name,    ..., ic_paewang,    legendary, 15, kind.xmult,   true
```

### Rule / Effect ★핵심

```
joker_effects.csv
joker_id, slot, effect_type, selector, predicate_id, value_expr, limit_scope, limit_count

j_pi_merchant,  1, add_chips, cards, p_type_pi,      "4 * count",  -,     -
j_pi_merchant,  2, add_chips, cards, p_type_ssangpi, "8 * count",  -,     -
j_meongtta,     1, add_chips, cards, p_type_yeol,    "6 * count",  -,     -
j_jjokjipge,    1, add_mult,  hand,  p_hand_month2,  "2",          -,     -
j_ssakssuri,    1, add_chips, cards, p_count_eq5,    "35",         -,     -
j_heundeulgi,   1, mul_mult,  cards, p_month_pair,   "1.5",        -,     -
j_bigwang_usan, 1, mul_mult,  core,  p_core_bi,      "2",          -,     -
j_sipidal,      1, add_mult,  cards, p_distinct_mon, "2 * count",  -,     -
j_ogwang_kkum,  1, mul_mult,  cards, p_kwang_gte3,   "2.5",        -,     -
j_paewang,      1, mul_mult,  hand,  p_hand_not_none,"2",          -,     -
j_gwangpari,    1, grant_money,cards,p_type_kwang,   "count",      round, 3
j_mitjang,      1, add_chips, state, p_always,       "mitjang_chips", -,  -
j_mitjang,      2, grow_on_discard, state, p_always, "10",         -,     -
j_pibak_boheom, 1, nullify_boss, -,  p_always,       "b_pibak|b_gwangbak|b_meongbak", -, -
j_pibak_boheom, 2, settle_bonus, -,  p_always,       "1",          -,     -
```

```
effect_types.csv   ← 코드가 구현한 동사 목록. 여기 없는 값은 검증에서 거부
id,              적용 시점,   params,                구현 위치
add_chips,       점수 계산,   "value → flat",        computeScore (배수 밖)
add_mult,        점수 계산,   "value → mult 가산",   computeScore
mul_mult,        점수 계산,   "value → mult 승산",   computeScore
grant_money,     내기 실행,   "value, limit_scope",  playSelected
grow_on_discard, 버리기 실행, "value → 영구 누적",   discardSelected
nullify_boss,    칩 계산,     "boss_id 목록",        cardChip
settle_bonus,    정산,        "value",               settle
```

```
predicates.csv   ← 조건 술어 화이트리스트
id,               kind,            param_a,        param_b
p_type_pi,        card_type_in,    pi,             -
p_type_ssangpi,   card_type_in,    ssangpi,        -
p_type_yeol,      card_type_in,    yeol,           -
p_type_tti,       card_type_in,    tti,            -
p_type_kwang,     card_type_in,    kwang,          -
p_tag_godori,     card_tag_in,     godori,         -
p_tag_chodan,     card_tag_in,     chodan,         -
p_hand_month2,    hand_id_in,      h_month2,       -
p_hand_dan_tti3,  hand_id_in,      "h_dan|h_tti3", -
p_hand_pi5,       hand_id_in,      h_pi5,          -
p_hand_m3_ct,     hand_id_in,      "h_month3|h_chongtong", -
p_hand_yeol3,     hand_id_in,      h_yeol3,        -
p_hand_samgwang,  hand_id_in,      "h_samgwang|h_bisamgwang", -
p_hand_not_none,  hand_id_not_in,  h_none,         -
p_count_eq5,      card_count_eq,   5,              -
p_kwang_gte3,     card_type_count_gte, kwang,      3
p_month_pair,     month_group_max_gte, 2,          -
p_core_bi,        core_month_eq,   12,             -
p_distinct_mon,   distinct_months, -,              -
p_always,         always,          -,              -
```

**커버리지 검증**: 22종 특수패 × 전 효과를 위 **7개 `effect_type` + 20개 술어**로 전개했을 때 **표현 불가 항목 0건**. (전개 결과는 §3 표)

```
boss_effects.csv
boss_id, effect_type, param_a, param_b
b_pibak,    zero_chip,     "pi|ssangpi",             -
b_gwangbak, zero_chip,     kwang,                    -
b_meongbak, zero_chip,     yeol,                     -
b_no_shake, demote_hand,   "h_month2|h_month3|h_chongtong", h_none
b_no_shake, disable_joker, j_heundeulgi,             -
b_bibaram,  set_resource,  discards,                 0
b_angae,    face_down_n,   2,                        -
```
→ as-built는 이 7행이 `cardChip()`·`computeScore()`·`startRound()`·`applyAngaeFaceDown()`·`j_heundeulgi`의 클로저 **5곳**에 흩어져 있다.

### Presentation

```
rarity_style.csv
rarity,    name_key,        color_key,   weight, price_min, price_max
common,    rarity.common,   c_common,    55,     3,  4
rare,      rarity.rare,     c_rare,      28,     6,  7
epic,      rarity.epic,     c_epic,      13,     9,  10
legendary, rarity.legendary,c_legendary, 4,      13, 15
```
`weight`는 **정수**로 둔다 — as-built의 `0.55/0.83/0.96` 누적 소수 임계값이 `RARITY_WEIGHT`와 어긋난 원인이 소수 이중 정의였다.

```
art_atlas.csv
key,                  path,                                    kind
art_01_gwang,         Assets/01_january/1-gwang.webp,          card
art_overlay_gwang,    Assets/Overlay/overlay_gwang.webp,       overlay
sfx_hwatu_slap,       Assets/SFX/hwatu_slap.mp3,               sfx
font_overlay,         Assets/Fonts/zihun-baige-tianxing.woff2, font
```
→ as-built: 카드 경로가 `buildDeck()` 안에, SFX 경로가 `sfx*()` 함수 안에 하드코딩.

### Localization

```
strings.csv
key,                 ko
hand.ogwang.name,    오광
joker.paewang.name,  명인
joker.paewang.desc,  족보만 나오면 배수 ×2 (무조합 제외)
ui.play,             내기
ui.discard,          버리기
ui.go,               고
ui.stop,             스톱
```

❌ **as-built에 로컬라이즈 계층이 존재하지 않는다.** 전 문자열이 템플릿 리터럴에 박혀 있어 한국어 전용이며, 문구 수정이 곧 코드 수정이다.

---

## 3. effect_type 전개 검증 — 22종 전수

| # | 특수패 | 티어 | 가격 | effect_type | selector | predicate | value_expr |
|---|---|---|---|---|---|---|---|
| 1 | 광팔이 | C | 3 | `grant_money` | cards | `p_type_kwang` | `count` (판당 상한 3) |
| 2 | 피장사 | C | 4 | `add_chips` ×2 | cards | `p_type_pi` / `p_type_ssangpi` | `4*count` / `8*count` |
| 3 | 멍따 | C | 4 | `add_chips` | cards | `p_type_yeol` | `6*count` |
| 4 | 쪽집게 | C | 4 | `add_mult` | hand | `p_hand_month2` | `2` |
| 5 | 쌍피보따리 | C | 4 | `add_chips` | cards | `p_type_ssangpi` | `12*count` |
| 6 | 띠장수 | C | 4 | `add_chips` | cards | `p_type_tti` | `5*count` |
| 7 | 싹쓸이 | R | 6 | `add_chips` | cards | `p_count_eq5` | `35` |
| 8 | 고도리꾼 | R | 6 | `add_mult` | cards | `p_tag_godori` | `3*count` |
| 9 | 단골 | R | 7 | `add_mult` | hand | `p_hand_dan_tti3` | `7` |
| 10 | 흔들기 | R | 7 | `mul_mult` | cards | `p_month_pair` | `1.5` (no_shake 시 무효) |
| 11 | 광모이 | R | 6 | `add_chips` | cards | `p_type_kwang` | `10*count` |
| 12 | 피오장 | R | 6 | `add_mult` | hand | `p_hand_pi5` | `3` |
| 13 | 초단꾼 | R | 6 | `add_mult` | cards | `p_tag_chodan` | `2*count` |
| 14 | 비광우산 | E | 9 | `mul_mult` | core | `p_core_bi` + `p_hand_not_none` | `2` |
| 15 | 폭탄 | E | 10 | `mul_mult` | hand | `p_hand_m3_ct` | `3` |
| 16 | 밑장빼기 | E | 9 | `add_chips` + `grow_on_discard` | state | `p_always` | `mitjang_chips` / `+10` |
| 17 | 피박보험 | E | 9 | `nullify_boss` + `settle_bonus` | — | `p_always` | 3종 / `1` |
| 18 | 멍잔치 | E | 10 | `mul_mult` | hand | `p_hand_yeol3` | `2` |
| 19 | 삼광판 | E | 10 | `add_mult` | hand | `p_hand_samgwang` | `8` |
| 20 | 열두사철 | L | 13 | `add_mult` | cards | `p_distinct_mon` | `2*count` |
| 21 | 오광소원 | L | 14 | `mul_mult` | cards | `p_kwang_gte3` | `2.5` |
| 22 | 명인 | L | 15 | `mul_mult` | hand | `p_hand_not_none` | `2` |

**표현 불가: 0건.** `switch(joker.id)`가 필요한 항목이 없다 → **스키마가 유효함이 증명된다.**

주의점 2가지:
- 흔들기의 `boss === 'no_shake'` 무효화는 특수패 쪽이 아니라 **박 쪽 `disable_joker`**로 옮겨야 한다. 그래야 새 박이 새 특수패를 끄는 규칙도 데이터가 된다.
- 비광우산은 술어가 **2개 AND**다. `predicate_id`를 복수 허용하거나 `p_core_bi`에 `hand != none`을 내장해야 한다.

---

## 4. UI 슬롯 정의

```
ui_slots.csv
screen_id, slot_id, source_table, filter_expr, sort_expr, item_view, max_count, empty_key

SCR-SHOP-01, offers, jokers, "!owned && enabled", "roll:rarity_weight", card_offer, 3, ui.shop.empty
SCR-SHOP-01, owned,  state.jokers, "-",            "acquire_order",     slot_owned, 5, ui.shop.slot_empty
SCR-PLAY-01, hand,   state.hand,   "-",            "month, type",       card_hand,  8, -
SCR-PLAY-01, jokerbar, state.jokers,"-",           "acquire_order",     slot_mini,  5, ui.joker.empty
SCR-HELP-01, handbook, hands,      "enabled",      "priority asc",      row_hand,   13,-
```

→ as-built: 각 화면 HTML 생성 함수가 배열을 직접 `.map()`한다. `max_count` 5는 `Array.from({length:5})`로 하드코딩(`shopHTML`·`renderTopbar` 두 곳에 **중복**).

---

## 5. 검증 규칙 (도입 시 툴이 지켜야 할 것)

- [ ] `id` 중복 없음 (전 테이블)
- [ ] FK 무결성 — `joker_effects.joker_id → jokers.id`, `predicate_id → predicates.id`, `art_key → art_atlas.key`
- [ ] `effect_type`이 `effect_types` 화이트리스트 안
- [ ] `value_expr` 파싱 성공 + 변수 화이트리스트(`count`, `mitjang_chips`, `round`, `base_target`) 통과
- [ ] 모든 `*_key`가 `strings` / `art_atlas`에 존재
- [ ] `rarity_style.weight` 합 = 100 (정수)
- [ ] `rarity_style.price_min ≤ jokers.price ≤ price_max`
- [ ] `hands.priority` 중복 없음 · `h_none`이 최하위
- [ ] `cards.csv` 행 수 = 48, 월별 4장, 광 5장, 쌍피 2장
- [ ] `bosses` 중 `tier=mild`가 3종 이상 (3월 풀 고갈 방지)
- [ ] `enabled=false`를 참조하는 활성 row 없음
- [ ] **엔진 순수성**: 데이터 로더가 `ENGINE START/END` 구간 밖에 있을 것 (POL-ARC-02)

---

## 6. ★ 신규 추가 리허설 (Tier S — 3종)

### 리허설 A — 특수패 '홍단꾼' 추가 (홍단이면 +5배수, 레어 6냥)

| 순서 | as-built | 제안 스키마 |
|---|---|---|
| 1 | `JOKERS[]`에 객체 리터럴 추가 + **`addMult` 클로저 작성** | `jokers.csv` +1 row |
| 2 | 아이콘: 이모지 문자열 직접 기입 | `joker_effects.csv` +1 row (`add_mult`/hand/`p_hand_hongdan`/`5`) |
| 3 | 설명문: `desc` 문자열 직접 기입 | `predicates.csv` +1 row (`p_hand_hongdan`) — 홍단 단독 술어가 없으면 |
| 4 | — | `strings.csv` +2 row |
| 5 | — | `art_atlas.csv` +1 row + 아이콘 1장 |
| **코드 변경** | **필수** (`index.html` 편집) | **0** |
| 노출 | 상점 추첨·보유 슬롯·상단바·툴팁 자동 | 동일 (자동) |
| 검증 | `node test/test-game.mjs` 재실행 필요 | 데이터 검증기 |

⚠️ 현행 판정: **부분 실패.** 노출은 자동이지만(선언형 배열 덕분) 효과가 클로저라 코드 편집이 강제된다.
단 §3에서 22/22가 전개되므로 **스키마 결함이 아니라 파일 정책 문제**다.

### 리허설 B — 족보 '국진쌍피'(9월 열끗을 쌍피로 전환) 추가

| 순서 | as-built | 제안 스키마 |
|---|---|---|
| 1 | `HANDS[]` 배열의 **정확한 위치**에 삽입 (순서 = 우선순위) | `hands.csv` +1 row (`priority` 값만 지정) |
| 2 | `detectHandInfo()`에 **판정 분기 추가** | `match_rule_id` 지정 — 기존 술어로 표현 가능하면 +0 row |
| 3 | `helpHTML()`의 `conds` / `HAND_VIS` 객체에 **2곳 추가** | `strings.csv` +1 row |
| 4 | 특수패 중 `handId` 참조자(쪽집게·단골·피오장·폭탄·멍잔치·삼광판·명인) 영향 검토 | 동일 (검증기가 FK로 확인) |
| **코드 변경** | **필수 · 3곳** | 표현 가능한 규칙이면 **0**, 새 매칭 규칙이면 **1 동사 추가 + 승인** |

⚠️ 현행 판정: **실패.** 족보 추가가 `detectHandInfo` + `helpHTML` 2계층을 동시에 건드려 **표시 누락 버그가 나기 쉬운 구조**다. 실제로 `conds`·`HAND_VIS`는 `HANDS[]`와 별도로 관리되는 병렬 목록이다.

### 리허설 C — 박 '쭉정이'(피가 족보 판정에서 제외) 추가

| 순서 | as-built | 제안 스키마 |
|---|---|---|
| 1 | `BOSSES[]` +1 항목 | `bosses.csv` +1 row |
| 2 | `detectHandInfo()` 또는 `computeScore()`에 강등/제외 분기 | `boss_effects.csv` +1 row |
| 3 | 3월 풀에 넣을지 `MILD_BOSSES` 수정 | `bosses.tier` 컬럼 값만 |
| 4 | 피박보험 무효화 대상인지 `cardChip()` 조건 수정 | `j_pibak_boheom`의 `nullify_boss` param에 id 추가 |
| 5 | `startRound()`에 라운드 시작 효과가 있으면 추가 | `effect_type`이 화이트리스트에 있으면 0 |
| **코드 변경** | **필수 · 최대 4곳** | 기존 `effect_type`이면 **0** |

❌ 현행 판정: **실패.** 박 효과가 5개 함수에 흩어져 있어 "박 하나 추가"가 **가장 비싼 작업**이다. 무게감(Tier B)에 비해 변경 비용이 과도하다.

### 리허설 종합

| 리허설 | 코드 변경 | 판정 |
|---|---|---|
| A 특수패 | 1곳 (클로저) | ⚠️ 부분 — 구조는 유효, 정책이 막음 |
| B 족보 | 3곳 (판정 + 표시 2곳) | ❌ 병렬 목록 동기화 문제 |
| C 박 | 최대 4~5곳 | ❌ 효과 산재 |

**우선순위 권고**: C(박 효과 집약) → B(족보 표시 목록 통합) → A(특수패 데이터화). C가 가장 싸고 효과가 크다 — `boss_effects` 7행을 한 곳에 모으면 그 자체로 산재 버그가 사라진다.

---

## 7. 배포 · 버전 · 마이그레이션

| 항목 | as-built | 비고 |
|---|---|---|
| 데이터 위치 | 없음 — 코드 내장 | POL-ARC-01 |
| 갱신 시점 | 페이지 로드 | |
| 밸런스 패치 | **클라 재배포 필수** | `main` 푸시 → Actions → Pages |
| `data_ver` | 없음 | |
| 유저 데이터 마이그레이션 | 해당 없음 — 런 저장이 없어 호환성 부채가 0 | POL-DAT-01의 숨은 이점 |
| localStorage 버저닝 | ✅ 키에 버전 접미 (`hwatro_jan_coach_v1`) | 튜토리얼 개편 시 `_v2`로 강제 재생 가능 |
| 롤백 | git revert + 재배포 | |

`[제안]` 단일 파일 정책을 지키면서 데이터화하는 절충안 — **`index.html` 내부에 `<script type="application/json" id="gamedata">` 블록**을 두고 엔진이 그것을 읽게 한다. 외부 파일 0개, 빌드 0개를 유지하면서 "명사"를 한 곳에 모을 수 있다. POL-ARC-01 위반이 아니며 POL-ARC-02(엔진 순수성)도 유지된다 → `06_policy.md` 신설 제안 #1.

---

## 8. 안티패턴 대조

| 안티패턴 | as-built 해당? | 근거 |
|---|---|---|
| `switch(item.id)` | ⚠️ 부분 | 클로저로 대체되어 분기문은 없으나, 효과가 항목마다 코드인 건 동일 |
| UI 하드코딩 문자열 | ❌ **전면 해당** | 로컬라이즈 키 0개 |
| 이미지 경로를 코드 상수로 | ❌ **해당** | `buildDeck()`·`sfx*()`에 경로 직접 기입 |
| 화면마다 전용 컴포넌트 | ❌ **해당** | `welcomeHTML`/`prepHTML`/`shopHTML`… 화면당 전용 함수 |
| 밸런스 수치를 코드에 | ❌ **해당** | `0.6`, `min(...,5)`, `4/6`, `2`, `3` 전부 인라인 |
| 정수 자동증가 ID | ⚠️ | `uid`는 인덱스지만 **런 내에서만 유효**하고 저장되지 않아 실害 없음 |
| row 삭제로 콘텐츠 제거 | — | 해당 없음 |
| 확률을 소수로 | ❌ **해당** | `0.55/0.28/0.13/0.04` + 누적 임계값 이중 정의 |
| 테이블 하나에 전부 | ⚠️ | `JOKERS[]`가 Definition + Effect + Presentation을 한 객체에 혼합 |
| 누락 키에 크래시 | ✅ 아님 | 리소스 실패는 전부 폴백 (EXC-10) |

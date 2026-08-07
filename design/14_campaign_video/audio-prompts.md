# 오디오 프롬프트 — 대사 · 효과음 · BGM (ElevenLabs)

영상: `out/hwatro_campaign_4x5.mp4` · **65.7초** · 1080×1350 (무손실 캡처본)
타임코드는 이 파일 기준. 컷 경계는 `capture/out/.work/NN-XX.mp4`와 1:1 대응한다.

---

## 0. 컷 타임라인 (효과음·대사 배치 기준)

| 컷 | 시작 | 끝 | 내용 |
|---|---|---|---|
| 00 H1 | 0.00 | 5.00 | 춘향 인터뷰 |
| 01~06 A1 | 4.86 | 11.56 | 무조합 → `20/160` → 「목표 미달」 |
| 07 A2 | 11.38 | 13.31 | 「주막 등장!」 |
| 08 H2a | 13.15 | 15.35 | 춘향이 태연히 딜 |
| 09 H2b | 15.32 | 17.32 | 덱 밑에서 특수패 두 장 |
| 10~11 A2 | 17.14 | 20.59 | 뒷거래 — 뒷면 카드가 진열대로 |
| 12~15 A2 | 20.56 | 24.06 | 특수패 두 장 구매 |
| 16~17 A3 | 23.90 | 26.03 | 고도리 → 엠블럼 |
| **18 A3** | **26.00** | **28.17** | **고 0→5 체이스 · 「5고」 착지 27.4s** |
| 19~20 A3 | 28.13 | 30.25 | 총통 → 엠블럼 |
| **21 A3** | **30.22** | **32.65** | **고 5→10 체이스 · 「10고」 착지 31.6s** |
| **22 H3a** | **32.47** | **34.67** | **춘향 「이제 그만 빼시겠어요?」** |
| **23 H3b** | **34.64** | **38.64** | **방자 「묻고 더블로 가!」** |
| 24 H3c | 38.61 | 41.21 | 패 4장이 앞에 놓인다 |
| 25 A3 | 41.05 | 43.01 | 오광 5장을 낸다 |
| **26 A3** | **42.98** | **45.56** | **오광 리프트 — 히트스톱·부상·파티클** |
| 27~28 A3 | 45.53 | 49.70 | 오광 엠블럼 → ×배수 흡수 |
| 29~30 A3 | 49.66 | 52.98 | 수식 카운트업 → 특수패 발동 |
| 31~32 A3 | 52.95 | 54.71 | 합산 `72,770` → 폭발 |
| **33 A3** | **54.68** | **59.06** | **20고 체이스 · 「20고」 착지 57.5s** |
| 34 A3 | 59.03 | 61.43 | 클리어 카드 「12월 완주」 |
| 35 C4 | 61.09 | 64.09 | 춘향이 되묻는다 (**자막 없음 — 보이스가 유일한 전달**) |
| 36~37 C6 | 64.03 | 65.73 | 로고 낙하 → **64.43s 착지 「챡」** |

---

## 1. 대사 — ElevenLabs **v3**

### 먼저: 보이스 두 개를 Voice Design으로 만든다

v3는 **음성의 성격이 태그 반응을 좌우한다.** 표현력 없는 보이스에 `[shouting]`을
붙여도 안 터진다. 아래 설명으로 Voice Design → 각 대사를 프리뷰 텍스트로 쓴다.

**춘향 (여성 · 조력자 · 웜톤)**
```
A Korean woman in her late twenties. Warm mid-low alto with a faint smoky rasp.
Composed, unhurried, quietly amused - the voice of someone who has watched a
thousand hands at a gambling table and is no longer impressed by any of them.
Speaks close to the microphone: intimate, conversational, dry. Restraint rather
than drama; she never pushes or projects. Slight breath on line endings, a small
downward lilt that reads as private amusement. Studio-clean, no room tone.
```

**방자 (남성 · 플레이어 · 쿨톤)**
```
A Korean man in his early thirties. Deep resonant baritone with gravel in the
lower register. The sound comes from the diaphragm - weight, not volume. Total
control, no wavering, no brightness. When he raises his voice it COMPRESSES and
darkens instead of thinning out, staying dense and chest-heavy. Slight vocal fry
on sustained tones. Close-miked, dry, a little menace held in reserve.
```

### 대사별 프롬프트

v3는 대괄호 **오디오 태그**로 연기를 지시한다. 태그는 영어, 대사는 한국어여도 된다.
말줄임표(`...`)는 무게 있는 정지, 쉼표는 짧은 호흡으로 읽힌다.

---

**① H1 (0.00~5.00s) · 춘향 · 인터뷰**
> 슬롯 5.0초. 원작 정마담 톤 — 자랑이 아니라 담담한 회상. 끝에서 살짝 웃음기.

```
[casual] 방자요? [pause] [thoughtful] 음... [warmly] 제가 본 타짜 중, 최고였어요.
```
- Stability **Natural** · Similarity 0.75 · Speed **0.95** (한 호흡을 길게)

---

**② H2 · 춘향 · 속으로 하는 말 — 두 컷에 걸친 독백**
> **혼잣말이다.** 상대에게 하는 말이 아니라 딜하면서 속으로 읊는 대사 —
> 마이크에 바짝 붙은 낮은 소리.
>
> 원작은 이 자리에 **두 개의 서로 다른 대사**를 둔다. 하나로 뭉치면 안 된다:
> - 미디엄샷 [00:00-00:04] 「가슴에 비수가 날아와 꽂힌다 / 하지만 걱정하지 마라 /
>   **손은 눈보다 빠르니까**」 — 세 마디 한 호흡
> - 손 클로즈업 [00:04-00:07] 「아귀한테는 밑에서 한 장 / 정 마담도 밑에서 한 장 /
>   나 한 장」 — **딜하면서 세는 소리**
>
> 즉 「손은 눈보다 빠르니까」는 **첫 대사의 끝맺음**이고, 손이 나오는 컷에는
> 따로 세는 대사가 붙는다. 사용자가 처음 말한 「방자에게 특수패 두 장」이 바로 그 자리다.

**②-a  H2a (현재 슬롯 2.2초 → 3마디를 다 담으려면 4.0초 필요)**

**원작 문장을 그대로 쓴다.** 「비수」는 방자의 사정을 설명하지 않는다 —
격언처럼 툭 던지는 하드보일드 내레이션이라 오히려 상황을 안 갉아먹는다.
바로 앞에서 방자가 목표 미달로 졌으므로 「그래도 괜찮다」가 걸릴 자리는 이미 있다.

```
[whispering] 가슴에 비수가 날아와 꽂힌다. [pause] [matter-of-fact] 그래도 괜찮다. [slowly] 손은... 눈보다 빠르니까.
```
- Stability **Creative** · Similarity 0.80 · Speed **1.0**
- **속도를 늦추지 말 것.** 원작은 27음절을 4.0초에 흘린다(≈6.8음절/초) —
  느리게 읊으면 6초를 넘겨 컷에 안 들어가고, 격언이 아니라 신파가 된다.
  속삭이되 **흐름은 빠르게**, 정지는 마디 사이 0.3초씩만
- **「손은 눈보다 빠르니까」가 하드컷 직전에 끝나야 한다.** 원작도 이 말이 끝나는
  순간 손 클로즈업으로 넘어간다 — 말이 먼저, 증명이 나중
- 슬롯 안 배치(4.0초 기준):
  `가슴에~꽂힌다` 0.0~2.0 · `그래도 괜찮다` 2.2~3.0 · `손은…빠르니까` 3.1~4.0
- 두 마디로 줄이려면 첫 마디를 버린다:
  `그래도 괜찮다. 손은... 눈보다 빠르니까.` (약 2.1초 — 지금 슬롯에 그대로 들어간다)

**②-b  H2b (15.32~17.32s · 손이 덱 밑에서 두 장을 뺀다)**

원작의 「밑에서 한 장」 세는 대사. 우리는 **두 장**이므로 두 번 센다.
숫자를 세는 소리라 감정을 넣지 않는다 — 장부 적듯 건조하게.

```
[whispering] [matter-of-fact] 방자한테... 밑에서 한 장. [pause] 또 한 장.
```
- Stability **Robust** · Similarity 0.85 · Speed **0.95**
- 「한 장」 두 번이 **화면에서 카드가 빠져나가는 두 동작과 각각 맞아야** 한다.
  소리가 먼저 나고 카드가 나중에 빠지면 「손이 눈보다 빠르다」가 거짓말이 된다

> **슬롯 길이 조정 필요**
> 지금 H2a는 2.2초라 3마디가 안 들어간다. **원작이 이 컷에 정확히 4.0초를 준다** —
> 대사 길이가 컷 길이를 정한 것이지 그 반대가 아니다.
> 생성 원본 `raw4/H2a.mp4`가 5.04초라 여유가 있다 → `assemble.mjs`의 H2a `use`를
> **2.2 → 4.0**으로, 절취를 `1.20~5.20`으로 바꾸면 원작 호흡 그대로 들어간다.
> 영상 총 길이 +1.8초 (60.5 → 62.3초).

---

**③ H3b (34.64~38.64s) · 방자 · 선언**
> 슬롯 4.0초. 고함이 아니라 **질량**이다. 분석대로 3단계:
> 「묻고」 저음 베이스라인 → 「더」에서 음압 팽창 → 「가!」 스타카토 차단.

```
[deep] [controlled] 묻고. [pause] [forceful] [intense] 더블로 가!
```
- Stability **Robust** (톤이 가벼워지거나 이탈하지 않게) · Similarity 0.85 · Speed **0.88**
- 대사 시작은 **35.1s쯤** — 앞의 0.5초 정적(몸이 안 움직이는 구간)을 살린다
- 「가!」는 **36.8s 전후**에 끝나야 팔이 올라가는 동작(37.0s~)과 안 겹친다

---

**④ C4 (61.09~64.09s) · 춘향 · 시청자에게**
> 슬롯 3.0초. **자막을 뺐으므로 이 보이스가 유일한 전달**이다.
> 도발이 아니라 은근한 되물음 — 눈을 마주친 채 던지는 질문.

```
[playfully] [curious] 당신은... [slowly] [challenging] 몇 월까지 깰 수 있으세요?
```
- Stability **Natural** · Similarity 0.75 · Speed **0.92**
- 「당신은」 뒤 정지를 **61.8s**쯤에 두면 카메라가 붙는 순간과 맞는다

---

**⑤ H3a (32.47~34.67s) · 춘향 · 방자에게 던지는 질문**
> 슬롯 2.2초. 원작 고니의 「이거 돈 다시 빼시겠어요?」 자리다.
> **도발인데 형식은 제안이다** — 물러설 길을 열어주는 척하면서 사실은 퇴로를 막는
> 확인 사살. 몸을 앞으로 기울이고 입가에 조소를 띤 상태의 소리라, 크게 말하지 않고
> **낮고 느리게, 끝만 살짝 올린다.**

```
[slowly] [teasing] 이제... [challenging] 그만 빼시겠어요?
```
- Stability **Natural** · Similarity 0.80 · Speed **0.90**
- 시작 **32.7s**, 끝 **34.5s** — 방자 컷(34.64s) 직전에 끝나야 한다
- 이 대사가 끝나고 방자가 입을 열기까지 **0.6초를 비운다.** 원작 체크리스트의
  「대사 직후 정적」이 여기다. 채우면 압박이 사라진다

---

**⑦ 몽타주(고도리·총통) — 지금은 무대사다 · 선택지**
> 23.9~32.7초 구간에는 대사가 없다. 의도한 것이다 — 이 구간의 목소리는
> **고 콜아웃(5고·10고)**이고, 조합이 꽂히는 리듬을 말로 덮으면 속도가 죽는다.
>
> 다만 **H1 인터뷰 액자를 살리고 싶다면** 춘향의 회상 보이스오버를 얹을 수 있다.
> 「방자요? 제가 본 타짜 중 최고였어요」가 여기서 이어지면 액자가 닫힌다.
> 넣는다면 **아주 짧게, 조합과 조합 사이 빈 자리에만.**

```
[casual] [reminiscing] 그때부터였어요.
```
- 고도리 엠블럼 직후 **26.4s** · 약 1.0초

```
[casual] [reminiscing] 판이... 방자한테 붙기 시작한 게.
```
- 총통 엠블럼 직후 **30.5s** · 약 1.6초

- Stability **Natural** · Similarity 0.75 · Speed **0.95** (①과 같은 인터뷰 톤)
- **고 콜아웃과 겹치면 안 된다.** 5고는 27.4s, 10고는 31.6s에 박히므로
  위 두 줄은 그 앞의 빈 자리에서 끝나야 한다
- 넣을지 말지는 취향이다. 안 넣으면 몽타주가 더 빠르고, 넣으면 서사가 더 붙는다

---

**⑥ 고 콜아웃 · 방자 · 5고 / 10고 / 20고**
> 화면에 숫자가 쭉쭉 오르는 동안 **착지하는 숫자만** 소리를 낸다.
> 중간 숫자까지 다 읽으면 소음이 되고, 세 번의 도달감이 죽는다.
> 판을 미는 건 플레이어이므로 **방자 보이스**다(「묻고 더블로 가」와 동일 인물).

| | 착지 시점 | 성격 |
|---|---|---|
| **5고** | **27.4s** | 아직 여유. 짧고 단단하게 툭 |
| **10고** | **31.6s** | 이 악문 소리. 더 낮고 더 눌러서 |
| **20고** | **57.5s** | 완전히 터뜨린다. 영상 전체의 최대 출력 |

**한 번에 생성해서 잘라 쓴다.** v3는 한두 음절짜리 텍스트에서 톤이 크게 흔들린다 —
세 개를 따로 뽑으면 목소리가 서로 안 맞는다. 아래를 **한 테이크로** 뽑고 셋으로 자르면
음색이 같고 고조도 자연스럽게 이어진다.

```
[confident] [firm] 오 고! [pause] [gritted] [harder] 십 고! [pause] [shouting] [explosive] 이십 고!
```
- Stability **Robust** · Similarity 0.85 · Speed **1.0**
- 숫자는 **한글로 적는다.** 「5고」로 쓰면 「오점오고」처럼 읽거나 영어로 뱉는다.
  5고=`오 고` · 10고=`십 고` · 20고=`이십 고` (고스톱은 한자어 수사)
- 각 콜아웃은 **0.4~0.6초**로 잘라 착지 프레임에 어택을 맞춘다.
  숫자가 화면에 박히는 순간과 소리가 어긋나면 스탬프가 두 번 찍힌 것처럼 보인다
- 20고만 뒤에 **여운을 0.3초 더** 남긴다 — 바로 뒤 폭발(S22 테일)과 물려야 한다

> **공통 팁**
> - v3는 짧은 문장에서 톤이 흔들린다. 위 대사를 각각 **단독 생성**하되, 앞뒤에
>   버리는 문장을 붙여 200자 이상으로 만든 뒤 필요한 부분만 잘라 쓰면 안정적이다.
> - 태그를 3개 이상 겹치면 서로 상쇄된다. 한 문장에 **최대 2개**.

---

## 2. 효과음 — ElevenLabs **Sound Effects**

**작성 원칙**: 장면이 아니라 **소리**를 묘사한다. 재질 · 동작 · 공간을 넣고,
원하지 않는 소리는 `no music, no voices`로 배제한다. 길이는 생성 시 지정.

| # | 시점 | 길이 | 프롬프트 |
|---|---|---|---|
| S1 | **6.1s** | 1.2s | `Three stiff lacquered playing cards dropped one after another onto a felt-covered table, close-miked. Dry papery slaps with a soft thud underneath, slight card-on-card friction. Small dead room, no reverb tail. No music, no voices.` |
| S2 | **10.2s** | 1.6s | `A low deflating failure tone: a dull muted gong struck softly and damped immediately, followed by a descending two-note sub-bass drop. Airless, disappointed, no sparkle, no shimmer. No music, no voices.` |
| S3 | **11.5s** | 1.8s | `A wooden signboard swinging into place with a rope creak, then a single bright temple bell struck once and allowed to ring out warmly. Traditional Korean tavern, wood and brass. No music, no voices.` |
| S4 | **15.4s** | 2.0s | `Extreme close-up card sleight of hand: a fingernail sliding under a stacked deck, one crisp card whisked out from the bottom, then a second - two sharp paper zips with a faint fingertip squeak between them. Very close, very dry, no room. No music, no voices.` |
| S5 | **17.7s** | 1.6s | `Two playing cards skimming fast across a felt table from off to the side and coming to a dead stop, a soft rushing paper slide ending in a small flat tap each. Intimate, hushed. No music, no voices.` |
| S6 | **21.2s** | 1.4s | `A single ornate card lifting into the air with a soft rising magical shimmer, holding, then snapping into a slot with a solid wooden click and a brief metallic gleam. Warm, valuable, satisfying. No music, no voices.` |
| S7 | **22.7s** | 1.4s | `Same as before but shorter and lower: a card rising with a quick shimmer and locking into place with a firm wooden clack and a faint gold ring-out. No music, no voices.` |
| S8 | **24.3s** | 1.0s | `Three lacquered cards slapped down onto felt in fast succession, confident and rhythmic, dry paper cracks. No music, no voices.` |
| S9 | **25.3s** | 1.2s | `A heavy ornamental brass medallion stamping down hard onto a surface: a deep metallic impact with a bright ring on top, then a fast decay. Ceremonial, weighty. No music, no voices.` |
| S10 | **26.0s** | 2.1s | `A rapid rising sequence of stamp impacts, each one a short percussive thud with a metallic click, accelerating and rising in pitch across the sequence, building tension. Five hits. No music, no voices.` |
| S11 | **28.5s** | 1.0s | `Four lacquered cards slapped down onto felt very fast, almost overlapping, sharp and aggressive. No music, no voices.` |
| S12 | **29.5s** | 1.2s | S9와 동일 프롬프트 (총통 엠블럼) |
| S13 | **30.2s** | 2.4s | S10과 동일 프롬프트, `Six hits, faster and heavier than before.` |
| S14 | **37.0s** | 0.9s | `A heavy fabric sleeve snapping upward through the air in one fast motion, a short whoosh ending in a firm cloth stop. Close, dry. No music, no voices.` |
| S15 | **39.3s** | 1.6s | `Four playing cards dealt fast across a felt table one after another, each landing with a crisp flat tap, then silence. Even rhythm, close-miked. No music, no voices.` |
| S16 | **41.4s** | 1.2s | `Five lacquered cards laid down onto felt in a decisive sweep, heavier and more resonant than a normal deal, with a low thud underneath. No music, no voices.` |
| S17 | **43.0s** | 3.0s | `Time freezing: a sudden airless silence with a faint high ringing, held for a beat. Then five cards lifting off the table with a deep rising whoosh, converging into a single heavy impact - a bass boom - and bursting outward into a shower of small metallic coins and light paper petals raining down and scattering across a hard surface. Cinematic, physical, no synth. No music, no voices.` |
| S18 | **45.6s** | 1.6s | `A huge ornamental brass seal slamming down: enormous metallic impact, deep bell resonance, long shimmering gold decay. The biggest stamp of the sequence. No music, no voices.` |
| S19 | **49.7s** | 2.6s | `Five quick magical charges firing in sequence, each a short bright ascending zap with a small impact tail, evenly spaced, gathering energy. No music, no voices.` |
| S20 | **51.1s** | 2.0s | `A fast mechanical number counter spinning up: rapid ticking digits accelerating, then locking with a single solid clunk. Dry, mechanical, no melody. No music, no voices.` |
| S21 | **53.7s** | 2.2s | `A massive golden explosion: deep bass detonation, bright metallic shimmer bursting outward, coins and sparks scattering, long warm decay. Triumphant, huge. No music, no voices.` |
| S22 | **54.7s** | 3.2s | `A long accelerating sequence of heavy stamp impacts rising in pitch and intensity, ten hits, each a percussive thud with a metallic ring, building to a final enormous strike with a long shimmering tail. No music, no voices.` |
| S23 | **59.0s** | 2.2s | `A single grand ceremonial gong struck once and allowed to bloom and ring out fully, warm and golden, with a soft rising shimmer underneath. Resolution, arrival. No music, no voices.` |
| S24 | **64.43s** | 1.3s | `A single playing card SLAMMED down hard onto a felt gambling mat by a human hand - one sharp explosive slap, a crack of paper and palm, with a deep thud underneath and a very short tight room snap. Aggressive, final, dry. No reverb tail. No music, no voices.` |

> **S24가 이 영상의 마지막 소리다.** 「챡」 — 로고가 화투처럼 판에 꽂히는 순간이라
> 착지 프레임(64.43s)에 **샘플의 어택 피크를 정확히** 맞춘다. 앞으로 밀리면 김이 샌다.
>
> S17(오광)과 S21(20고 폭발)은 1.5초 간격이라 그대로 겹치면 지저분하다 —
> S17의 테일을 45.4s에서 페이드아웃해 엠블럼(S18)에 자리를 내준다.

---

## 3. BGM — ElevenLabs **Music** (별도 생성)

효과음과 같은 대역에서 싸우면 안 된다. **중저역은 비우고** 위아래로 벌린다.

```
A 65-second Korean neo-noir gambling theme, cinematic and restrained.

Instrumentation: gayageum and geomungo plucked sparsely with heavy space between
notes, a low bowed ajaeng drone, breathy daegeum flute, janggu and buk drums, plus
a dark cinematic sub-bass and metallic percussion. Traditional Korean instruments
carry the melody; the low end is modern and filmic.

Structure:
0:00-0:11  Sparse and cold. A single gayageum figure, wide silence between plucks,
           a barely-there drone underneath. Tense, patient, almost empty.
0:11-0:24  A soft warm shift - the daegeum enters with a curious rising motif, light
           hand percussion begins a slow pulse. Something is being set up.
0:24-0:32  The janggu locks into a driving rhythm and accelerates. Stakes rising.
0:32-0:41  Everything drops out except a low sustained drone and a slow heartbeat
           pulse. Maximum tension, held. Almost silent.
0:41-0:57  Full explosive climax: drums at full force, gayageum tremolo, brass-like
           low swells, triumphant and overwhelming.
0:57-1:05  Sudden resolution into a single sustained warm chord that decays, then
           one final low hit and silence.

Mood: cool, controlled, dangerous, building to catharsis. Mid-low frequencies kept
clear for sound effects. No vocals, no lyrics, no vocal chops.
```

**믹스 가이드**
- BGM은 −18 LUFS 근처, 효과음이 −12 ~ −8 LUFS로 위에 뜨게
- **32.5~34.6s 구간(춘향 질문 → 방자 대사 직전)은 BGM을 −6dB 더 눌러** 정적을 만든다.
  원작 체크리스트의 「대사 직후 무음 정적」이 여기서 나온다
- 64.43s 로고 착지 순간 BGM을 **완전히 끊고** S24만 남기면 「챡」이 가장 크게 박힌다

---

## 4. 넣는 법

생성한 파일을 아래 이름으로 두면 합성 단계에서 붙일 수 있다(현재는 무음 출력이라
별도 믹스 트랙이 필요하다):

```
design/14_campaign_video/audio/
  vo_h1.wav  vo_h2.wav  vo_h3.wav  vo_c4.wav     ← 대사
  sfx_01.wav … sfx_24.wav                        ← 효과음 (위 표의 S번호)
  bgm.wav                                        ← BGM
```

# 오디오 프롬프트 — 대사 · 효과음 · BGM (ElevenLabs)

영상: `out/hwatro_campaign_4x5.mp4` · **64.33초** · 1080×1350
타임코드는 이 파일 기준. 컷 경계는 `capture/out/.work/NN-XX.mp4`와 1:1 대응한다.

---

## 0. 컷 타임라인 (효과음·대사 배치 기준)

| 컷 | 시작 | 끝 | 내용 |
|---|---|---|---|
| 00 H1 | 0.00 | 5.00 | 춘향 인터뷰 |
| 01~06 A1 | 4.86 | 11.53 | 무조합 → `20/160` → 「목표 미달」 |
| 07 A2 | 11.35 | 12.90 | 「주막 등장!」 |
| 08 H2a | 12.74 | 14.94 | 춘향이 태연히 딜 |
| 09 H2b | 14.91 | 16.91 | 덱 밑에서 특수패 두 장 |
| 10~11 A2 | 16.73 | 20.18 | 뒷거래 — 뒷면 카드가 진열대로 |
| 12~15 A2 | 20.14 | 23.93 | 특수패 두 장 구매 |
| 16~18 A3 | 23.77 | 27.99 | 고도리 → 엠블럼 → 고 0→5 |
| 19~21 A3 | 27.95 | 32.45 | 총통 → 엠블럼 → 고 5→10 |
| 22 H3a | 32.27 | 34.47 | 춘향 「그만 빼시겠어요?」 |
| **23 H3b** | **34.44** | **38.44** | **방자 「묻고 더블로 가!」** |
| 24 H3c | 38.41 | 41.01 | 패 4장이 앞에 놓인다 |
| 25 A3 | 40.85 | 42.81 | 오광 5장을 낸다 |
| **26 A3** | **42.78** | **45.36** | **오광 리프트 — 히트스톱·부상·파티클** |
| 27~28 A3 | 45.33 | 49.33 | 오광 엠블럼 → ×배수 흡수 |
| 29~30 A3 | 49.30 | 52.63 | 수식 카운트업 → 특수패 발동 |
| 31~32 A3 | 52.60 | 54.38 | 합산 `72,770` → 폭발 |
| 33 A3 | 54.35 | 57.67 | 20고 체이스 |
| 34 A3 | 57.63 | 60.03 | 클리어 카드 「12월 완주」 |
| 35 C4 | 59.69 | 62.69 | 춘향이 되묻는다 (**자막 없음 — 보이스가 유일한 전달**) |
| 36~37 C6 | 62.63 | 64.33 | 로고 낙하 → **63.03s 착지 「챡」** |

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

**② H2 (12.74~16.91s) · 춘향 · 속으로 하는 말**
> 슬롯 4.2초(H2a+H2b). **혼잣말이다.** 상대에게 하는 말이 아니라 딜하면서
> 속으로 읊는 대사 — 마이크에 바짝 붙은 낮은 소리.

```
[whispering] [matter-of-fact] 손은... [slowly] 눈보다 빠르니까.
```
- Stability **Creative** · Similarity 0.80 · Speed **0.90**
- 「손은」 뒤 정지가 H2a→H2b 하드컷(14.91s)에 걸리게 배치하면 컷과 호흡이 맞는다

---

**③ H3b (34.44~38.44s) · 방자 · 선언**
> 슬롯 4.0초. 고함이 아니라 **질량**이다. 분석대로 3단계:
> 「묻고」 저음 베이스라인 → 「더」에서 음압 팽창 → 「가!」 스타카토 차단.

```
[deep] [controlled] 묻고. [pause] [forceful] [intense] 더블로 가!
```
- Stability **Robust** (톤이 가벼워지거나 이탈하지 않게) · Similarity 0.85 · Speed **0.88**
- 대사 시작은 **34.9s쯤** — 앞의 0.5초 정적(몸이 안 움직이는 구간)을 살린다
- 「가!」는 **36.6s 전후**에 끝나야 팔이 올라가는 동작(36.8s~)과 안 겹친다

---

**④ C4 (59.69~62.69s) · 춘향 · 시청자에게**
> 슬롯 3.0초. **자막을 뺐으므로 이 보이스가 유일한 전달**이다.
> 도발이 아니라 은근한 되물음 — 눈을 마주친 채 던지는 질문.

```
[playfully] [curious] 당신은... [slowly] [challenging] 몇 월까지 깰 수 있으세요?
```
- Stability **Natural** · Similarity 0.75 · Speed **0.92**
- 「당신은」 뒤 정지를 **60.4s**쯤에 두면 카메라가 붙는 순간과 맞는다

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
| S1 | **5.4s** | 1.2s | `Three stiff lacquered playing cards dropped one after another onto a felt-covered table, close-miked. Dry papery slaps with a soft thud underneath, slight card-on-card friction. Small dead room, no reverb tail. No music, no voices.` |
| S2 | **9.9s** | 1.6s | `A low deflating failure tone: a dull muted gong struck softly and damped immediately, followed by a descending two-note sub-bass drop. Airless, disappointed, no sparkle, no shimmer. No music, no voices.` |
| S3 | **11.4s** | 1.8s | `A wooden signboard swinging into place with a rope creak, then a single bright temple bell struck once and allowed to ring out warmly. Traditional Korean tavern, wood and brass. No music, no voices.` |
| S4 | **15.0s** | 2.0s | `Extreme close-up card sleight of hand: a fingernail sliding under a stacked deck, one crisp card whisked out from the bottom, then a second - two sharp paper zips with a faint fingertip squeak between them. Very close, very dry, no room. No music, no voices.` |
| S5 | **17.2s** | 1.6s | `Two playing cards skimming fast across a felt table from off to the side and coming to a dead stop, a soft rushing paper slide ending in a small flat tap each. Intimate, hushed. No music, no voices.` |
| S6 | **20.8s** | 1.4s | `A single ornate card lifting into the air with a soft rising magical shimmer, holding, then snapping into a slot with a solid wooden click and a brief metallic gleam. Warm, valuable, satisfying. No music, no voices.` |
| S7 | **22.2s** | 1.4s | `Same as before but shorter and lower: a card rising with a quick shimmer and locking into place with a firm wooden clack and a faint gold ring-out. No music, no voices.` |
| S8 | **23.9s** | 1.0s | `Three lacquered cards slapped down onto felt in fast succession, confident and rhythmic, dry paper cracks. No music, no voices.` |
| S9 | **25.2s** | 1.2s | `A heavy ornamental brass medallion stamping down hard onto a surface: a deep metallic impact with a bright ring on top, then a fast decay. Ceremonial, weighty. No music, no voices.` |
| S10 | **25.9s** | 2.1s | `A rapid rising sequence of stamp impacts, each one a short percussive thud with a metallic click, accelerating and rising in pitch across the sequence, building tension. Five hits. No music, no voices.` |
| S11 | **28.0s** | 1.0s | `Four lacquered cards slapped down onto felt very fast, almost overlapping, sharp and aggressive. No music, no voices.` |
| S12 | **29.4s** | 1.2s | S9와 동일 프롬프트 (총통 엠블럼) |
| S13 | **30.1s** | 2.4s | S10과 동일 프롬프트, `Six hits, faster and heavier than before.` |
| S14 | **36.8s** | 0.9s | `A heavy fabric sleeve snapping upward through the air in one fast motion, a short whoosh ending in a firm cloth stop. Close, dry. No music, no voices.` |
| S15 | **38.6s** | 1.6s | `Four playing cards dealt fast across a felt table one after another, each landing with a crisp flat tap, then silence. Even rhythm, close-miked. No music, no voices.` |
| S16 | **41.0s** | 1.2s | `Five lacquered cards laid down onto felt in a decisive sweep, heavier and more resonant than a normal deal, with a low thud underneath. No music, no voices.` |
| S17 | **42.9s** | 3.0s | `Time freezing: a sudden airless silence with a faint high ringing, held for a beat. Then five cards lifting off the table with a deep rising whoosh, converging into a single heavy impact - a bass boom - and bursting outward into a shower of small metallic coins and light paper petals raining down and scattering across a hard surface. Cinematic, physical, no synth. No music, no voices.` |
| S18 | **45.4s** | 1.6s | `A huge ornamental brass seal slamming down: enormous metallic impact, deep bell resonance, long shimmering gold decay. The biggest stamp of the sequence. No music, no voices.` |
| S19 | **49.4s** | 2.6s | `Five quick magical charges firing in sequence, each a short bright ascending zap with a small impact tail, evenly spaced, gathering energy. No music, no voices.` |
| S20 | **50.8s** | 2.0s | `A fast mechanical number counter spinning up: rapid ticking digits accelerating, then locking with a single solid clunk. Dry, mechanical, no melody. No music, no voices.` |
| S21 | **53.4s** | 2.2s | `A massive golden explosion: deep bass detonation, bright metallic shimmer bursting outward, coins and sparks scattering, long warm decay. Triumphant, huge. No music, no voices.` |
| S22 | **54.4s** | 3.2s | `A long accelerating sequence of heavy stamp impacts rising in pitch and intensity, ten hits, each a percussive thud with a metallic ring, building to a final enormous strike with a long shimmering tail. No music, no voices.` |
| S23 | **57.7s** | 2.2s | `A single grand ceremonial gong struck once and allowed to bloom and ring out fully, warm and golden, with a soft rising shimmer underneath. Resolution, arrival. No music, no voices.` |
| S24 | **63.03s** | 1.3s | `A single playing card SLAMMED down hard onto a felt gambling mat by a human hand - one sharp explosive slap, a crack of paper and palm, with a deep thud underneath and a very short tight room snap. Aggressive, final, dry. No reverb tail. No music, no voices.` |

> **S24가 이 영상의 마지막 소리다.** 「챡」 — 로고가 화투처럼 판에 꽂히는 순간이라
> 착지 프레임(63.03s)에 **샘플의 어택 피크를 정확히** 맞춘다. 앞으로 밀리면 김이 샌다.
>
> S17(오광)과 S21(20고 폭발)은 1.5초 간격이라 그대로 겹치면 지저분하다 —
> S17의 테일을 45.0s에서 페이드아웃해 엠블럼(S18)에 자리를 내준다.

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
- **32.3~34.4s 구간(춘향 질문 → 방자 대사 직전)은 BGM을 −6dB 더 눌러** 정적을 만든다.
  원작 체크리스트의 「대사 직후 무음 정적」이 여기서 나온다
- 63.03s 로고 착지 순간 BGM을 **완전히 끊고** S24만 남기면 「챡」이 가장 크게 박힌다

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

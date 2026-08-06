# 힉스필드 슬롯 — 타짜 패러디 시나리오

> 영상의 생 플레이 구간은 전부 실제 게임 녹화다. 이 문서는 그 사이에 끼우는
> **시네마틱 컷**의 시나리오와 생성 프롬프트를 정한다.
> 컷 위치·길이의 정본은 `capture/assemble.mjs`의 `EDIT` 배열.

## 넣는 법

```
design/14_campaign_video/capture/plates/H1.mp4   ← 여기에 두면 끝
```

- 확장자: `.mp4` `.mov` `.webm` (정지컷이면 `.png` `.jpg`도 가능)
- 파일이 없으면 슬롯 이름·길이가 적힌 **자리표시자**가 렌더된다
- 규격 **1080×1350 (4:5)** 권장. 다른 비율도 중앙 크롭으로 맞춘다
- 재녹화 없이 `node capture/assemble.mjs --ratio 4x5` 만 다시 돌리면 반영된다

---

## 컨셉

영화 **타짜(2006)** 패러디. 게임 화면이 "무슨 게임인지"를 말한다면
이 컷들은 "**어떤 기분의 게임인지**"를 말한다.

원작 정마담 인터뷰 씬의 문법을 그대로 가져온다 —
아이레벨 미디엄 클로즈업, 아주 느린 푸시인, 앰버 측광 키아로스쿠로, 얕은 심도.
담배만 **화투패**로 바꾼다. **흡연 묘사는 넣지 않는다.**

## 슬롯

| 슬롯 | 위치 | 장면 | 자막 | 길이 | 소스 |
|---|---|---|---|---|---|
| **H1** | 오프닝 (훅) | 어두운 한옥 방, 촛불 측광. 춘향이 화투패 한 장을 굴리다 카메라를 정면으로 본다 | 없음 | 5.0s | 영상 |
| **H2a** | 「주막 등장!」 뒤 | 미디엄샷. 춘향이 말한다 — **양손은 프레임 밖 아래로 완전히 잘려 안 보인다.** 시선은 상 위. 전경 우측에 방자의 어깨 실루엣 | 없음 | 1.6s | **스틸 + 느린 푸시인** |
| **H2b** | H2a 하드컷 | 익스트림 클로즈업·하이앵글. 손이 프레임의 75%. **덱 밑에서** 특수패를 빼 화면 밖으로 튕겨 보낸다 — 한 장, 그리고 또 한 장 | 없음 | 2.0s | 영상 |
| **H3a** | 총통 뒤 | 타이트 바스트. 춘향이 **몸을 앞으로 기울여** 압박하며 묻는다. 웜톤 전면광. 전경에 방자의 소매 | 없음 | 1.9s | **스틸 + 느린 달리 인** |
| **H3b** | H3a 하드컷 | 방자의 손이 상 위에 붙은 채 **미동도 없다** → 패 4장이 **우측에서** 돌려져 들어오고 손이 쓸어 쥔다. 쿨톤 탑라이트 | 없음 | 2.9s | 영상 |
| **C4** | 엔딩 직전 | 인터뷰 회귀. H1과 같은 방·조명·구도. 카메라를 정면으로 보며 되묻는다 | 「몇월까지 깰수있으세요?」 | 3.0s | 영상 |

**컷 순서**: H1 → A1(패배) → 주막 등장 → **H2a▸H2b** → 뒷거래·구매 →
고도리 → 총통 → **H3a▸H3b** → 오광·20고 → C4 → 로고

`▸` = 하드컷(`transDur: 0.033`). 한 클립에 `hard cut to`를 적으면 모델이 무시하고
이어버린다 → **슬롯을 쪼개서 우리가 붙인다.** 겸사겸사 움직임이 없는 비트는
스틸로 처리해 영상 생성이 6클립 → **3클립**으로 줄었다.

### 배역 (바꾸지 말 것)
- **유저 = 방자.** 얼굴이 **한 프레임도** 나오면 안 된다 — 플레이어의 환상이 깨진다.
  등장은 손과 소매(짙은 남색 한복)만
- **춘향 = 조연이자 인게임 조력자.** 방자에게 좋은 특수패 두 장을 밑에서 빼준다
- 「패를 돌린다」는 **딜(deal)**이다 — 손가락으로 굴리는 게 아니라 나눠 주는 동작
- 카메라 응시는 **인터뷰 액자(H1·C4)에만**. H2·H3는 제4의 벽을 안 깬다

자막은 힉스필드가 아니라 **합성 단계에서 얹는다**(`assemble.mjs`의 `plateLine`).
게임 폰트 SSRock에는 `몇`·`깰`이 없어 AppleSDGothicNeo를 쓴다.
→ 생성 프롬프트에는 반드시 `no text, no subtitles`를 넣는다.

---

## 생성 전략

### 길이 문제 — 점프샷으로 여러 비트를 한 클립에

영상 모델 최소 생성 길이(5s)가 슬롯 길이(1.5~3.2s)보다 길다. 5초를 한 장면으로
채우면 대부분 버려진다 → **한 생성에 비트를 여러 개 넣고 편집에서 잘라 쓴다.**

- **H1**: 5s 한 호흡으로 생성 → 푸시인 중 가장 좋은 3.2s를 절취
- **H2 + H3**: 한 클립에 `hard cut to`로 비트 2~3개 → H2용·H3용 구간을 각각 절취
- 모델이 컷을 무시하고 이어버리면 비트 사이 **동작 대비**(정지 → 급동작)를 크게 잡아
  어디를 잘라도 컷처럼 보이게 한다. 재생성보다 프롬프트 수정이 먼저다
- 절취: `ffmpeg -ss <in> -t <len> -i draft.mp4 -c copy plates/H2.mp4`

### 2단계 파이프라인 — GPT 키프레임 → 양끝 고정 영상

영상 모델에 텍스트만 주면 얼굴도 그림체도 매번 달라진다.
**키프레임에서 캐릭터·구도·그림체를 박제한 뒤** 영상의 **양끝을 그 키프레임으로 못 박는다.**

```
① 키프레임 — gpt-image (codex, 크레딧 안 씀)
   codex exec --sandbox workspace-write --skip-git-repo-check \
     -i "char/춘향이 캐릭터 시트.jpeg" -i char/chunhyang_ref_v2.png \
     [-i char/real_cards_ref.png] -- "<프롬프트> ... Save to ./capture/plates/drafts/kf/<n>.png"
   슬롯당 start / mid / end. 생성이 공짜라 그림체가 맞을 때까지 여기서 거른다

② 영상 — kling3_0 (**turbo 아님** — turbo는 end_image가 없다)
   higgsfield generate create kling3_0 --duration 5 --mode std --sound off \
     --aspect_ratio 9:16 --start-image kf/H1-start.png --end-image kf/H1-end.png \
     --prompt "<모션>" --wait
   양끝이 고정돼 중간 드리프트(실사화·얼굴 변형)가 크게 준다.
   중간 키프레임은 kling이 못 받으므로 모션 프롬프트에 구도로 서술한다
```

**`--sound off` 필수** (무음). aspect_ratio는 9:16만 되므로 합성에서 4:5로 크롭한다.

### 레퍼런스 매핑

| 파일 (`char/`) | 용도 | 첨부 슬롯 |
|---|---|---|
| `춘향이 캐릭터 시트.jpeg` | 얼굴·헤어·의상 기준 — **모든 스틸 필수** | H1·H2·H3 |
| `chunhyang_ref_v2.png` | 완성 일러스트 톤(채색·조명 무드) | H1·H2·H3 |
| `real_cards_ref.png` / `card_origin/` | 손에 들리는 화투패가 실물과 같아야 함 | H1·H2 |
| `ingame_ui_ref.png` | 사용 안 함 (인게임은 녹화가 담당) | — |

레퍼런스가 많을수록 얼굴 가중치가 약해진다 → **필요한 것만** 붙인다.
H3는 카드가 화면에 없으므로 카드 레퍼런스를 넣지 않는다.

---

## 프롬프트

### 공통 스타일 블록 (모든 스틸 프롬프트 끝에 붙인다)

```
STYLE (critical): 2D anime illustration. EXACTLY the same painted anime art style
as the attached character sheet - cel shading, clean confident lineart, painterly
rendering, anime facial proportions. This is NOT photorealistic, NOT a 3D render,
NOT live action, NOT a photograph. Warm candlelight from one side, deep shadows on
the other, the background heavily blurred and simplified. Faint incense smoke
drifting through the light. No smoking, no cigarette. No text, no watermark,
no subtitles. Vertical 4:5 composition.
```

**`cinematic noir` · `35mm film grain` 같은 말은 쓰지 않는다** — 1차 시안이
통째로 실사로 나온 원인이었다. 조명은 스타일 중립어로만 기술한다.

### 원작(정마담 인터뷰) 재현 체크리스트 — H1에 반드시 들어가야 할 것

그림체와 템포만 맞춰선 원작 느낌이 안 난다. 1차 시안에 빠져 있던 것들:

| 원작 요소 | 프롬프트에 넣는 말 |
|---|---|
| 인터뷰 중 **말하고 있다** | `speaks calmly to an unseen interviewer beside the camera, lips moving naturally` |
| 몸을 젖히고 **팔을 상에 얹은** 여유 | `leaning back slightly with one forearm resting casually on the table` |
| 끝에 **시선이 카메라로, 냉소적 미소** | `her eyes shift to look straight into the lens and a knowing, faintly cynical smirk appears` |
| 얼굴 반쪽이 어둠에 잠김 | `half of her face falls into deep shadow, the lit half glows warm amber` |
| 배경 완전 아웃포커스 | `background heavily blurred and simplified` |
| 대사 한 호흡의 시간 | 컷 길이 **5.0초** (3.2초로 자르면 패러디가 아니라 그냥 예쁜 컷) |

### 원작 컷 실측 (Gemini 컷 분해 — 이 수치를 지킨다)

| 원작 | 컷 구조 |
|---|---|
| 손은 눈보다 빠르다 | 미디엄샷 **4.0s(손이 프레임 밖)** → **하드컷** → 손 익스트림 클로즈업 하이앵글 3.0s(프레임의 70~80%, 덱 **밑에서** 빼 화면 밖으로 던짐). 탑라이트 + 배경 완전 암전. 카메라 응시 없음 |
| 묻고 더블로 가 | 질문 **5.0s**(느린 달리 인, 몸을 앞으로 기울여 압박) → 답 **1.5s**(고정, 손은 미동 없음) → 정적 5.0s → 베팅 인서트 2.0s(판돈이 **우측 → 중앙**). 대사 순간 컷이 끊기고, 베팅은 대사와 **다른 컷** |

질문하는 쪽 = 웜톤 전면광, 답하는 쪽 = 쿨톤 탑라이트. 단독 샷에도 상대의 어깨를
전경 구석에 걸친다(오버 더 숄더) — 방자의 얼굴 없이 존재감을 만드는 유일한 장치다.

### 키프레임 생성

`capture/make-keyframes.sh [H2|H3|C4]` — 슬롯당 3장(첫/키/마지막)을 gpt-image로.
크레딧을 안 쓰므로 **여기서 그림체를 거르고** 통과한 것만 영상으로 넘긴다.
프롬프트 정본은 그 스크립트 안에 있다.

레퍼런스 배열은 컷 성격에 따라 셋 중 하나를 쓴다:
- `CHAR` — 얼굴이 나오는 컷 (시트 + 완성 일러스트)
- `CHAR_CARDS` — 얼굴 + 손에 카드
- `HANDS` — 얼굴이 아예 없는 손 클로즈업. **시트를 빼야** 손 묘사가 산다

### 영상 생성 (3클립뿐)

```
higgsfield generate create kling3_0 --duration 5 --mode std --sound off \
  --aspect_ratio 9:16 --start-image kf/<start>.png --end-image kf/<end>.png \
  --prompt "<모션>" --wait
```

| 클립 | 양끝 | 잘라 쓰는 구간 → 슬롯 |
|---|---|---|
| `raw3/H2b.mp4` | `H2-b` → `H2-c` | 1.60 ~ 3.60 → `plates/H2b.mp4` |
| `raw3/H3c.mp4` | `H3-b` → `H3-c` | 2.00 ~ 4.90 → `plates/H3b.mp4` (정지 → 딜이 한 클립에 이어져 있다) |
| `raw3/C4.mp4` | `C4-a` → `C4-c` | 2.00 ~ 5.00 → `plates/C4.mp4` |

스틸 슬롯은 키프레임을 그대로 쓴다: `H2-a.png → plates/H2a.png`,
`H3-a.png → plates/H3a.png`. 카메라 무빙은 `assemble.mjs`의 `cam.z`가 만든다.

**`--mode std`가 저화질 시안이다.** 사용자가 고른 뒤에만 `--mode pro`로 같은
키프레임을 그대로 물려 재생성한다. `--sound off` 필수.


## 시안 이력

### 1차 — **폐기** (실사로 나옴)
`nano_banana_2` 스틸 → `kling3_0_turbo`. `still-*.png` · `raw-h*.mp4` · `H*-a/b.mp4`.
스틸 프롬프트의 `cinematic noir` · `35mm film grain`이 통째로 포토리얼로 끌고 갔다.

### 2차 — **폐기** (서사 재편으로 무효)
`kf/H1-*.png` · `kf/H23-*.png` · `raw2-*.mp4` · `H*-v2.mp4`.
그림체는 잡혔으나 H2가 「부채로 펴는 손」, H3가 「손바닥 내리침」이라
지금 서사(딜 / 질문→답)와 맞지 않는다. H1만 살아남아 `plates/H1.mp4`로 쓰인다.

### 3차 (2026-08-06 · GPT 키프레임 → kling3_0 양끝 고정 · std · 무음) — **채택**

| 키프레임 | 내용 | 검수 |
|---|---|---|
| `kf/H2-a` | 미디엄샷, **양손 프레임 밖**, 전경에 방자 어깨 | ✅ |
| `kf/H2-b` | 하이앵글 손 클로즈업, **덱 밑에서** 카드가 반쯤 빠져나옴 | ✅ |
| `kf/H2-c` | 두 번째 장이 프레임 아래로 튕겨 나감 | ✅ |
| `kf/H3-a` | 춘향이 몸을 앞으로 기울여 묻는다, 전경에 소매 | ✅ |
| `kf/H3-b` | 남색 소매 · 상 위에 평평히 붙은 남자 손, **얼굴 없음** | ✅ |
| `kf/H3-c` | 하이앵글, 화투 4장 + 쓸어 쥐는 손, **얼굴 없음** | ✅ |
| `kf/C4-a/b/c` | 인터뷰 회귀 — 정면 응시 → 되묻는 표정 → 냉소적 미소 | ✅ |

원본 클립은 `drafts/raw3/`에, 절취본은 `plates/`에 둔다.
바꾸려면 `plates/<슬롯>.*`를 갈아끼우고 `node capture/assemble.mjs --ratio 4x5`.
고화질은 사용자가 고른 뒤 `--mode pro`로 **같은 키프레임을 그대로 물려** 재생성한다.

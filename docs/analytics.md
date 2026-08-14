# Analytics 수집

게임 텔레메트리는 **Firebase Analytics(GA4)** 와 **Firestore** 에 동시 기록한다.

| 경로 | 용도 |
|------|------|
| Analytics | 퍼널·DAU·리텐션 대시보드 (집계) |
| Firestore `events` | 이벤트·파라미터 **원본 보관** (GA4처럼 휘발·집계만 보이지 않음) |

코드: `firebase-telemetry.mjs` — `track()` 이 양쪽 모두 호출.

---

## Firestore 스키마

### `events` — 게임 이벤트 로그

컬렉션: **`events`** (루트, 자동 ID)

| 필드 | 타입 | 설명 |
|------|------|------|
| `uid` | string | `hwatro_uid` (GA User-ID 와 동일) |
| `event` | string | 이벤트 이름 |
| `params` | map | 해당 이벤트 파라미터 (`is_invite` **없음**) |
| `ts` | timestamp | 서버 기록 시각 |

### `users` — 유저 1회 등록 (초대 여부)

컬렉션: **`users/{uid}`** — `hwatro_uid` 최초 부여 시 **1문서만** 생성

| 필드 | 타입 | 설명 |
|------|------|------|
| `is_invite` | number | `/invite` 유입 여부 (0/1), **최초 1회만** 기록 |
| `og_image` | string | (선택) 유입 OG 변형 (`OG1`/`OG2`/`OGB1`/`OGB2`) |
| `locale` | string | (선택) 유입·진입 언어 (`kr`/`en`/`jp`) — `localStorage.hwatro_locale` |
| `created_at` | timestamp | 최초 등록 시각 |

**분석:** `users` 에서 `is_invite == 1` 인 `uid` 목록 → `events` 를 `uid` 로 조인. OG별 유입은 `users.og_image` 또는 `session_start.params.og_image` 로 집계. 언어별은 `users.locale` / `session_start.params.locale`.

### OG A/B 유입 링크

| URL | 동작 |
|-----|------|
| `/invite` | 미들웨어가 `OG1`/`OG2`/`OGB1`/`OGB2` 중 **랜덤**으로 `/invite/{name}` 302 (KR) |
| `/invite/en` · `/invite/jp` | 동일 랜덤 → `/invite/{locale}/{name}` |
| `/invite/{name}` · `/invite/{locale}/{name}` | 해당 OG 미리보기 → 랜딩으로 이동 |
| `/{name}` · `/{locale}/{name}` | OG 미리보기 + `hwatro_og_image`·`hwatro_locale` 저장 후 게임으로 이동 |
| `/` · `/en/` · `/jp/` | 게임 본편 (`/?lang=` 또는 locale 셸) |

**공유할 링크 (슬래시 하나):**
- KR 랜덤: `https://hanate.jqklabs.com/invite`
- EN 랜덤: `https://hanate.jqklabs.com/invite/en`
- JP 랜덤: `https://hanate.jqklabs.com/invite/jp`
- 고정 예: `https://hanate.jqklabs.com/invite/OG1` · `https://hanate.jqklabs.com/invite/jp/OG1`
- ❌ `https://hanate.jqklabs.com//OG1` (슬래시 두 개)

참고: 카카오 캐시가 남으면 디버거로 재스크랩. OG 이미지는 `Assets/OG/{kr\|en\|jp}/{name}.jpg` (1200×630). EN/JP 아트는 추후 배치.

콘솔에서 조회 예:

- 전체: Firestore → `events` → 문서 목록
- 이벤트별: 쿼리 `event == hand_play`
- 유저별: 쿼리 `uid == <uuid>`
- 월별 내기: `params.month` 는 map 안 필드 → 필요 시 콘솔 필터 또는 BigQuery(Blaze) / 내보내기

보안 규칙: [`firestore.rules`](../config/firestore.rules) — 익명 Auth 로 **create 만** 허용, read/update/delete 차단.

---

## Spark(무료) 플랜 한도 · 운영

| 항목 | 무료 한도 | 대략적 여유 (본 게임) |
|------|-----------|------------------------|
| Firestore 저장 | 1 GiB | 이벤트 1건 ~500B → 수백만 건 전 |
| 쓰기 | **20,000 / 일** | 세션당 ~30~80건 → **~250~650 세션/일** |
| 읽기 | 50,000 / 일 | 콘솔 조회 위주면 충분 |
| Analytics | GA4 무료 | 이벤트 수 제한 넉넉 |

한도 초과 시: 당일 Firestore 쓰기만 실패(게임은 정상). Analytics 는 계속 동작.

**용량 관리 (무료 유지):**

- 3~6개월마다 Firestore → Export → 오래된 `events` 수동 삭제 (또는 Blaze + scheduled delete)
- 이벤트 추가·고빈도 로깅 전에 **일 쓰기량** 대략 계산

Anonymous Auth: 무료, Spark 에서 사용 가능.

---

## 이벤트 · 파라미터 (Firestore `params` 와 동일)

### session_start — 탭 진입

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `returning_user` | number | 재방문 (0=첫 방문, 1=재방문) |
| `days_since_last` | number | 마지막 방문 며칠 전 |
| `locale` | string | UI 언어 (`kr`/`en`/`jp`) |
| `og_image` | string | (있을 때만) 유입 OG 변형 이름 |

### session_end — 탭 닫기

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `session_play_sec` | number | 이번 방문 누적 플레이 시간(초) |

### run_end — 런 종료

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `duration_sec` | number | 이번 런 플레이 시간(초) |
| `session_play_sec` | number | 이번 방문 누적 플레이 시간(초) |

### hand_play — 내기

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `month` | number | 몇 월 판 |
| `play_turn` | number | 그 월에서 몇 번째 내기 |
| `hand_id` | string | 족보 ID (예 `samgwang`) |
| `hand_label` | string | 족보 이름 (예 `삼광`) |
| `cards_played` | string | 낸 패 (예 `3광,5피,12피`) |
| `score` | number | 이번 내기 점수 |
| `round_score` | number | 그 월 누적 점수 |
| `money` | number | 그 시점 보유 냥 |

### cards_discard — 버리기

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `month` | number | 몇 월 판 |
| `discard_turn` | number | 그 월에서 몇 번째 버리기 |
| `cards` | string | 버린 패 (예 `3광,5피`) |
| `card_count` | number | 버린 장수 |
| `money` | number | 그 시점 보유 냥 |

### shop_buy — 구매

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `month` | number | 구매 시점(월) |
| `joker_id` | string | 특수패 ID (`chunhyang_coach` = 춘향 예약) |
| `price` | number | 지불 냥 |
| `money_after` | number | 구매 후 보유 냥 |

### shop_reroll — 상점 리롤

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `month` | number | 리롤 시점(월) |
| `cost` | number | 리롤 비용 |
| `money_after` | number | 리롤 후 보유 냥 |

### settle — 월 정산

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `money_after` | number | 정산 후 보유 냥 |

### survey_enter — 설문하기 클릭 (구글폼 새 탭)

게임오버/승리 설문 팝업에서 **설문하기** 버튼 클릭 시 1회.

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `screen` | string | `gameover` / `victory` |
| `month` | number | 종료 시점 월 |
| `locale` | string | UI 언어 (`kr`/`en`/`jp`) |

### survey_close — 설문 팝업 닫기

팝업을 닫을 때 (설문하기로 폼 진입한 경우는 `survey_enter`만, close 없음).

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `screen` | string | `gameover` / `victory` |
| `month` | number | 종료 시점 월 |
| `locale` | string | UI 언어 (`kr`/`en`/`jp`) |
| `reason` | string | `later`(나중에) / `already_done`(이미 참여했어요) |

### shortcut_prompt_show — 홈화면/즐겨찾기 제안 노출

설문 팝업이 없을 때 · `gameover`/`victory` 또는 `prep`(2월부터). 이미 설치(standalone)·영구 숨김·7일 스누즈·최대 3회 노출이면 생략.

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `platform` | string | `ios` / `android` / `desktop` |
| `mode` | string | `install`(beforeinstallprompt) / `guide_ios` / `guide_android` / `guide_desktop` |
| `locale` | string | UI 언어 |
| `screen` | string | 현재 화면 |
| `show_n` | number | 누적 노출 횟수 (이번 포함) |

### shortcut_prompt_click — 제안 CTA

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `platform` | string | 위와 동일 |
| `mode` | string | 위와 동일 |
| `locale` | string | UI 언어 |
| `screen` | string | 현재 화면 |
| `action` | string | `install` / `install_auto`(네이티브 설치 시도) |

### shortcut_prompt_close — 제안 닫기

| 파라미터 | 타입 | 데이터 |
|----------|------|--------|
| `platform` | string | 위와 동일 |
| `mode` | string | 위와 동일 |
| `locale` | string | UI 언어 |
| `screen` | string | 현재 화면 |
| `reason` | string | `dismiss`(X) / `esc` / `already`(이미 추가) / `installed`(설치 수락) — dismiss·esc 는 7일 스누즈 |

### 리텐션 (별도 이벤트 없음)

| 수단 | 데이터 |
|------|--------|
| `uid` / GA User-ID | 기기별 익명 UUID (`hwatro_uid`) |
| `session_start.returning_user` | 재방문 여부 |
| `session_start.days_since_last` | 이탈 간격 |

---

## Firebase Console 설정 체크리스트 (해야 할 일)

### 1. Firestore 켜기

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택  
2. **Build → Firestore Database → Create database**  
3. **Production mode** 로 생성 (규칙은 아래에서 교체)  
4. 리전: **`asia-northeast3`(서울)** 권장 — latency·무료 한도 동일

### 2. 보안 규칙 배포

1. Firestore → **Rules** 탭  
2. 저장소 [`firestore.rules`](../config/firestore.rules) 내용 붙여넣기 → **Publish**

### 3. Anonymous Authentication

1. **Build → Authentication → Sign-in method**  
2. **Anonymous** → **Enable** → 저장

### 4. Authorized domains (기존 Analytics 와 동일)

Authentication → Settings → Authorized domains:

- `localhost`
- `hanate.jqklabs.com`
- (필요 시) `*.vercel.app` 프리뷰 도메인

### 5. Vercel 환경 변수 (배포)

- `FIREBASE_CONFIG_JSON` — `projectId`, `apiKey`, `measurementId` 등 **기존과 동일 JSON**  
- Firestore 는 같은 Firebase 프로젝트면 **추가 env 불필요**  
- Redeploy 후 `https://hanate.jqklabs.com/firebase-config.js` 가 `null` 이 아닌지 확인

### 6. 동작 확인 (기존 이벤트)

1. 로컬 또는 라이브에서 게임 플레이 (내기·버리기·상점 등)  
2. Firestore → `events` — 문서가 쌓이는지 확인  
3. (선택) `?ga_debug=1` → GA4 DebugView  
4. Anonymous Auth 실패 시: Firestore 문서 없음, Analytics 만 동작

### 7. 설문 이벤트 확인 (`survey_enter` / `survey_close`)

**배포 전 필수:** `config/firestore.rules` 를 Console Rules에 다시 **Publish** 해야 새 이벤트 create가 통과한다. (화이트리스트에 없으면 Permission denied → Firestore에 안 쌓임. Analytics는 규칙과 무관하게 갈 수 있음.)

1. 배포(또는 로컬) 후 런을 **게임오버** 또는 **승리**까지 진행 → 설문 팝업 표시  
2. **나중에** 클릭 → Firestore `events` 쿼리 `event == survey_close`, `params.reason == later`  
3. (같은 기기면) `localStorage`에서 `hwatro_survey_done` 삭제 후 다시 게임오버 → **이미 참여했어요** → `survey_close` + `reason == already_done`  
4. 다시 설문 팝업이 뜨게 한 뒤 **설문하기** → `event == survey_enter` (close는 없어야 함)  
5. (선택) `?ga_debug=1` 로 동일 액션 → GA4 **DebugView** 에 `survey_enter` / `survey_close` 실시간 확인  
6. Analytics → Events 목록에 커스텀 이벤트가 보이려면 **최대 24시간** 걸릴 수 있음. 즉시 확인은 DebugView 또는 Firestore.

### 8. 바로가기 제안 확인 (`shortcut_prompt_*`)

동일하게 Rules Publish 필요. 설문과 **동시에 안 뜨고**, 설문 종료/미대상일 때만 노출.

1. `hwatro_survey_done` 설정 또는 설문 **나중에** 후 → `shortcut_prompt_show`  
2. **추가 방법 보기** → `shortcut_prompt_click` (`action=guide`) 후 스텝 표시  
3. **나중에** → `shortcut_prompt_close` (`reason=later`) · 7일간 재노출 없음  
4. 로컬 재테스트: `hwatro_shortcut_done` / `hwatro_shortcut_later` / `hwatro_shortcut_shows` 삭제  
5. `mode=install` 은 Chrome이 `beforeinstallprompt`를 줄 때만 (manifest+설치 조건 충족 시). 대부분 환경은 `guide_*`.

### 9. GA4 맞춤 정의 (선택, Analytics 쪽)

Firestore 에는 파라미터가 그대로 남으므로 **필수 아님**. GA4 리포트용으로만:

| 이벤트 | 맞춤 정의 (범위: 이벤트) |
|--------|-------------------------|
| hand_play | `month`, `hand_id`, `score`, `money` … |
| cards_discard | `month`, `card_count`, `money` |
| shop_buy | `joker_id`, `price` |
| survey_enter | `screen`, `month`, `locale` |
| survey_close | `screen`, `month`, `locale`, `reason` |
| shortcut_prompt_show | `platform`, `mode`, `screen`, `show_n` |
| shortcut_prompt_click | `platform`, `mode`, `action` |
| shortcut_prompt_close | `platform`, `mode`, `reason` |

---

## 홈화면 / 즐겨찾기 제안 UX (제품 기준)

| 항목 | 기준 |
|------|------|
| 모바일 | 팝업에 **안내 스텝 즉시 표시** · Android/Chrome은 SW+manifest로 설치 유도 |
| PC | 즐겨찾기(별표 / Ctrl·⌘+D) 안내 즉시 표시 |
| 자동 설치 | `beforeinstallprompt` 있으면 팝업 노출 시 `prompt()` 시도 · 실패 시 **홈 화면에 추가** 버튼 폴백. iOS·즐겨찾기는 OS 제한으로 안내만 가능 |
| 이미 설치 | `display-mode: standalone` 또는 iOS `navigator.standalone` → 미노출 |
| 노출 시점 | 설문 팝업 **미표시**일 때 · `gameover`/`victory` 또는 `prep`(round≥2) |
| 나중에 | 7일 스누즈 (`hwatro_shortcut_later`) |
| 영구 숨김 | 이미 추가 / 안내 확인 / 설치 수락 (`hwatro_shortcut_done`) |
| 상한 | 기기당 최대 **3회** 노출 (`hwatro_shortcut_shows`) |

지원 한계: iOS Safari는 홈 화면 추가를 JS로 트리거할 수 없음. Android·Desktop도 브라우저·정책에 따라 설치 프롬프트가 안 올 수 있어 **따라 하기 안내가 기본 경로**.

아이콘: `Assets/Icons/icon-192.png` · `icon-512.png` · `apple-touch-icon.png` (춘향 윙크 아트).

로컬 프리뷰: `index.html?shortcutPreview=1` — 스누즈/노출횟수 무시하고 즉시 표시 (텔레메트리 미기록).

---

## 코드 변경 요약 (완료)

| 파일 | 내용 |
|------|------|
| `lib/firebase-telemetry.mjs` | Analytics + Firestore 동시 기록, Anonymous Auth |
| `config/firestore.rules` | create-only, 이벤트 화이트리스트 (설문·바로가기 포함) |
| `index.html` | `trackEvent` — 설문·바로가기 제안 |
| `site.webmanifest` | 홈화면 추가용 최소 manifest |

---

## 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| `events` 에 문서 없음 | Anonymous Auth 미활성 | Auth → Anonymous Enable |
| Permission denied | Rules 미배포 / 잘못된 rules | `config/firestore.rules` Publish |
| `firebase-config.js` = null | Vercel env / 미배포 | `FIREBASE_CONFIG_JSON` + Redeploy |
| 하루 중 쓰기 멈춤 | 20K writes/일 초과 | Export 후 old data 삭제 또는 Blaze |

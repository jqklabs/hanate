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

### 6. 동작 확인

1. 로컬 또는 라이브에서 게임 플레이 (내기·버리기·상점 등)  
2. Firestore → `events` — 문서가 쌓이는지 확인  
3. (선택) `?ga_debug=1` → GA4 DebugView  
4. Anonymous Auth 실패 시: Firestore 문서 없음, Analytics 만 동작

### 7. GA4 맞춤 정의 (선택, Analytics 쪽)

Firestore 에는 파라미터가 그대로 남으므로 **필수 아님**. GA4 리포트용으로만:

| 이벤트 | 맞춤 정의 (범위: 이벤트) |
|--------|-------------------------|
| hand_play | `month`, `hand_id`, `score`, `money` … |
| cards_discard | `month`, `card_count`, `money` |
| shop_buy | `joker_id`, `price` |

---

## 코드 변경 요약 (완료)

| 파일 | 내용 |
|------|------|
| `firebase-telemetry.mjs` | Analytics + Firestore 동시 기록, Anonymous Auth |
| `firestore.rules` | create-only, 이벤트 화이트리스트 |
| `index.html` | 변경 없음 (`trackEvent` 그대로) |

---

## 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| `events` 에 문서 없음 | Anonymous Auth 미활성 | Auth → Anonymous Enable |
| Permission denied | Rules 미배포 / 잘못된 rules | `firestore.rules` Publish |
| `firebase-config.js` = null | Vercel env / 미배포 | `FIREBASE_CONFIG_JSON` + Redeploy |
| 하루 중 쓰기 멈춤 | 20K writes/일 초과 | Export 후 old data 삭제 또는 Blaze |

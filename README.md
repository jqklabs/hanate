# 십이화 — 고스톱: 무한의 판 🎴

한국 화투 48장으로 하는 1인용 **Balatro라이크** 로그라이크 덱빌더 웹 게임 프로토타입.

고스톱의 족보·고/스톱·박·정산을 Balatro의 칩×배수 스코어링, 블라인드 커브, 조커(특수패), 상점 경제에 녹였습니다.

기획·시스템 전체는 **[docs/기획서.md](docs/기획서.md)** 참고.

## 실행

`index.html`을 브라우저에서 열면 끝. 빌드·서버 불필요 (로컬 Firebase 테스트는 HTTP 서버 권장).

- 배포: **Vercel** (Git push 시 자동)
- 시드 고정: `?seed=42`

```bash
python3 -m http.server 8080   # 로컬 (Firebase 테스트)
npm test                      # 또는 node test/test-game.mjs
npm run og:gen                # OG/invite 랜딩 HTML → pages/
```

## 게임 규칙

- **한 해 완주**: 판 = 1월(송학) → 12월(비), 총 12판. 판마다 목표 점수(160 → 5,500)를 내기 4회 안에 돌파.
- **스코어링**: 손패 8장에서 1~5장을 내면 족보 판정 → `(족보를 구성한 카드의 칩) × 배수 + 나머지 낸 카드 칩`. 족보 기본칩 없음 — 배수가 족보 가치. 족보에 안 들어간 카드는 배수를 못 탄다.
  - 족보 13종 고정 우선순위: 오광(×12) > 사광(×8) > 총통(×7) > 고도리(×6) > 삼광(×5) > 비삼광(×4) > 홍단/청단/초단(×4) > 같은 달 3장(×3) > 열끗 셋(×3) > 띠 셋(×3) > 피 5장(×2, 쌍피=피2장 환산) > 같은 달 2장(×2) > 무조합(×1)
  - 카드 칩: 광 12 · 열끗 8 · 띠 6 · 쌍피 5 · 피 2.
- **시간 시스템**: 이달의 패(현재 월 카드 칩 ×2), 밤일낮장(홀수 달 낮☀️ = 광·열끗 +2칩, 짝수 달 밤🌙 = 띠·피 +2칩).
- **고/스톱 (무제한 · 밀치기)**: 목표 도달 시 스톱(정산) 또는 고. n고 문턱 = 기본 목표 ×(1+0.6n), 성공 시 보너스 n×m냥(m=월). 고 선언 시 현재 점수가 이미 넘은 문턱은 **전부 소급 인정(밀치기)** — 큰 한 방이면 1고→3고처럼 여러 단계를 한 번에 점프하고, 선언 목표는 "아직 못 넘은 첫 문턱"이라 항상 현재 점수보다 높다(공짜 연쇄 고 없음). 실패하면 **고박 = 런 종료**.
- **정산**: 이자(보유 5냥당 1냥, 최대 5) + 기본 상금 + 남은 내기 보너스 + 고 보너스.
- **상점**: 특수패(조커) 22종 · 티어 커먼/레어/에픽/레전더리 (출현 55/28/13/4%). 커먼(광팔이·피장사·멍따·쪽집게·쌍피보따리·띠장수), 레어(싹쓸이·고도리꾼·단골·흔들기·광모이·피오장·초단꾼), 에픽(비광우산·폭탄·밑장빼기·피박보험·멍잔치·삼광판), 레전더리(열두사철·오광소원·명인). 소지 5개, 리롤 가능. 삼광판은 낸 광마다 +3배수.
- **박 라운드(보스)**: 3·6·9·12월. 피박/광박/멍박/흔들기 금지/비바람/안개 중 하나가 걸림 (직전 상점에서 예고, 12월은 2종 중 선택).
- **조력자 춘향** 🍶: 준비/상점에서 다음 달 훈수를 예약(3냥). 해당 월 내내 손패를 평가하고, 패를 고른 뒤 내기·버리기에 마우스를 올리면 덱 위 패를 엿봐 표정으로 알려줌.

## 구조

```
index.html              게임 (ENGINE + UI)
pages/                  OG·invite 랜딩 (생성물, npm run og:gen)
Assets/                 카드·BGM·SFX·OG 이미지
config/                 firebase-config.example.js, firestore.rules
lib/                    firebase-telemetry.mjs
scripts/                빌드·OG 생성
test/test-game.mjs      엔진 테스트 + 시뮬
docs/                   기획·분석 (docs/STRUCTURE.md 참고)
design/                 밸런스·와이어프레임
```

```bash
npm test   # 단위 테스트 + 300런 시뮬레이션
```

## Firebase Analytics (선택)

수집 이벤트·파라미터만 전송 (그 외 없음).

| 이벤트 | 파라미터 |
|--------|----------|
| `session_start` | `returning_user`, `days_since_last` |
| `session_end` | `session_play_sec` |
| `run_end` | `duration_sec`, `session_play_sec` |
| `hand_play` | `month`, `play_turn`, `hand_id`, `hand_label`, `cards_played`, `score`, `money`, `round_score` |
| `cards_discard` | `month`, `discard_turn`, `cards`, `card_count`, `money` |
| `shop_buy` | `month`, `joker_id`, `price`, `money_after` |
| `shop_reroll` | `month`, `cost`, `money_after` |
| `settle` | `money_after` |

리텐션: IP 불가 → `hwatro_uid` + GA4 Retention. DebugView: `?ga_debug=1`.

### 로컬

1. Firebase Console → 웹 앱 + **Google Analytics(GA4)** 연결 (`measurementId` 필요)
2. `config/firebase-config.example.js` → 루트 `firebase-config.js` 복사 후 값 입력
3. Authorized domains: `localhost` 추가
4. `python3 -m http.server 8080` → 한 팔 플레이 → Console **Analytics → DebugView** 또는 **Realtime**

### Vercel 배포

1. Vercel → hwatro → **Settings → Environment Variables**
2. `FIREBASE_CONFIG_JSON` = firebaseConfig JSON 한 줄 (`measurementId` 포함)
3. **Redeploy**
4. Firebase → Authorized domains에 `hanate.jqklabs.com` 추가

### `run_end` 파라미터

`month`, `duration_sec`, `gwang_played`, `go_count`, `shop_spent`, `best_single`, `total_earned`, `won`, `reason` 등

Firebase Console → **Analytics → Events → run_end** / BigQuery 연동으로 집계.

## 밸런스 (시뮬레이션 기준)

그리디 봇(부분집합 전수 평가) 300런: 무조커는 3월 벽(~14%)에서 대부분 사망, 상점 봇(티어 가중 구매)도 6~7월 벽·승률 ~0% — 종반은 에픽/레전 배수 빌드와 고 스노우볼이 필수. 점수 = 카드칩×족보배수 (족보 기본칩 없음).

---

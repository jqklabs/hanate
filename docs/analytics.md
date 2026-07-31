# Analytics 수집

## session_start — 탭 진입

| 파라미터 | 데이터 |
|----------|--------|
| `returning_user` | 재방문 여부 (0=첫 방문, 1=재방문) |
| `days_since_last` | 마지막 방문 며칠 전 |

## session_end — 탭 닫기

| 파라미터 | 데이터 |
|----------|--------|
| `session_play_sec` | 이번 방문 누적 플레이 시간(초) |

## run_end — 런 종료

| 파라미터 | 데이터 |
|----------|--------|
| `duration_sec` | 이번 런 플레이 시간(초) |
| `session_play_sec` | 이번 방문 누적 플레이 시간(초) |

## hand_play — 내기

| 파라미터 | 데이터 |
|----------|--------|
| `month` | 몇 월 판 |
| `play_turn` | 그 월에서 몇 번째 내기 |
| `hand_id` | 족보 ID (예 `samgwang`) |
| `hand_label` | 족보 이름 (예 `삼광`) |
| `cards_played` | 낸 패 (예 `3광,5피,12피`) |
| `score` | 이번 내기 점수 |
| `round_score` | 그 월 누적 점수 |
| `money` | 그 시점 보유 냥 |

## cards_discard — 버리기

| 파라미터 | 데이터 |
|----------|--------|
| `month` | 몇 월 판 |
| `discard_turn` | 그 월에서 몇 번째 버리기 |
| `cards` | 버린 패 (예 `3광,5피`) |
| `card_count` | 버린 장수 |
| `money` | 그 시점 보유 냥 |

## shop_buy — 구매

| 파라미터 | 데이터 |
|----------|--------|
| `month` | 구매 시점(월) |
| `joker_id` | 특수패 ID (`chunhyang_coach` = 춘향 예약) |
| `price` | 지불 냥 |
| `money_after` | 구매 후 보유 냥 |

## shop_reroll — 상점 리롤

| 파라미터 | 데이터 |
|----------|--------|
| `month` | 리롤 시점(월) |
| `cost` | 리롤 비용 |
| `money_after` | 리롤 후 보유 냥 |

## settle — 월 정산

| 파라미터 | 데이터 |
|----------|--------|
| `money_after` | 정산 후 보유 냥 |

## 리텐션 (별도 이벤트 없음)

| 수단 | 데이터 |
|------|--------|
| User ID (`hwatro_uid`) | 기기별 익명 UUID (IP 대체) |

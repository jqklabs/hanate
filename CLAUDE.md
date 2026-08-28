# 십이화 — 고스톱: 무한의 판

한국 화투 48장 기반 1인용 Balatro라이크 웹 게임. 게임 규칙·시스템 개요는 README.md 참고.

## 실행 / 테스트

- 개발: `npm run dev` — Vite 개발 서버. 시드 고정 `?seed=42`.
- 빌드: `npm run build` — `dist/` (게임 번들 + Assets/pages/vendor 복사).
- 엔진 테스트: `npm test` — 단위 테스트 + 그리디 봇 시뮬레이션. **엔진 수정 시 반드시 실행.**
- 골든: `npm run golden` / `npm run golden:update` — 시드 고정 플레이스루. UI·스타일 이동 후 필수.

## 아키텍처 (중요)

TypeScript + Vite 모듈. 의존은 한 방향만 허용한다.

```
src/
  engine/      순수 로직 (족보·점수·탐색·밸런스). 다른 패키지를 import 하지 않는 말단.
  state/       GameState + 판 진행 액션
  ui/          렌더·연출·춘향
  platform/    telemetry, sfx, storage, assets
  i18n/        kr / en / jp
  styles/      도메인별 CSS (import 순서 보존)
  bridge.ts    인라인 onclick 55개 전역 노출
  main.ts      엔트리
index.html     마크업 + `<script type="module" src="/src/main.ts">`
```

- `src/engine/` 은 **DOM 접근 금지**. 테스트가 `import`로 바로 실행한다.
- UI 모듈은 `src/runtime/scope.ts`의 `g`에 함수를 올리고, `bridge.ts`가 인라인 핸들러를 `window`에 노출한다.
- 순환 import를 만들지 말 것. UI 간 순환은 `g`의 늦은 바인딩으로 끊는다.
- CSS는 `src/styles/index.css`의 import 순서를 바꾸지 말 것 (동일 특이도 승패가 뒤집힘).

## 구현 원칙 (기존 버그 예방 체크리스트)

- 카드 선택 상태는 배열 인덱스가 아닌 **uid**로 저장 (보충 시 인덱스 밀림).
- 고는 밀치기: 선언 시 `goLevel = goLevelReached(base, score, goLevel) + 1`, 목표 = `goThreshold(base, goLevel)` — 이미 넘은 문턱은 전부 소급, 선언 목표는 정의상 항상 현재 점수보다 큼 (공짜 연쇄 고 불가). 내기 +1은 밀친 단계 수와 무관하게 선언 1회당 1개.
- `Math.floor`는 최종 점수에서 1회만 (흔들기 ×1.5로 배수가 소수가 됨).
- 프리뷰는 `computeScore` 드라이런 — 경제 트리거(광팔이 지급, 통계)는 `playSelected()`에서만.
- 연쇄 고는 `checkAfterPlay()` 재진입으로 처리 (재귀·모달 중첩 금지).
- 안개(angae) 뒷면 카드: 새로 뽑힌 카드만 뒷면 지정 가능, 공개된 카드는 다시 안 뒤집힘.
- 판 시작 리셋 제외 항목: money, jokers, mitjangChips, usedBosses, makgeolli, stats, binjariMult, slotsLocked.
- 카드 칩 적용 순서: 기본칩(묻고 더블로 가면 20) → 거꾸로 ×20 → 이달의 패 ×2 → 외길(다른 종류 0) → 박 디버프 0 (순서 바꾸면 밸런스 붕괴). 낮/밤 +2 칩은 없음.
- 점수 = (족보칩 + **족보 구성(core) 카드** 칩) × 배수 + 나머지 카드 칩(flat, 배수 없음). core는 `detectHandInfo`가 결정 — 족보 판정과 core 선정을 분리하지 말 것.
- **족보 기본칩 없음** — 점수는 카드칩×배수만. `HANDS[].mult`만 족보 가치. core는 족보 구성에 **필요한 장수**만 (열끗셋·띠셋은 3장, 초과분은 flat).

## 디자인 방향 (사용자 확정 사항)

- **고는 무제한** — n고 문턱은 1~2고 1.6/2.2, 3고부터 `(n-2)²` 가속. 보너스 `ceil(n×m/2)`냥. 캡 되돌리지 말 것.
- **밸런스는 빡빡하게** — 난이도 조정 시 하향보다 상향 우선. 목표 커브(160→14,000, 후반 가속)는 시뮬레이션 기준: 무조커 3월 벽 ~15%, 봇 승률 ~0%.
- 새 시스템·특수패 네이밍은 고스톱/한국 전통 용어에서 (예: 밤일낮장, 피박보험, 밑장빼기).
- 캐릭터·연출 요소 환영 (춘향 조력자처럼 표정/대사 있는 인터랙션).

## 차후 확장 후보 (스펙에서 분리해둔 것)

보너스피(덱 성장 소모품), 족보책(족보 영구 강화), 뒤집기 찬스(도박), 나가리(실패 시 목표 이월), 저장/불러오기.

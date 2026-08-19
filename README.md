<p align="center">
  <a href="https://hanate.jqklabs.com/invite">
    <img src="Assets/OG/kr/OG1.jpg" alt="십이화 — 고스톱: 무한의 판" width="760"/>
  </a>
</p>

<p align="center">
  <img src="Assets/Icons/icon-192.png" width="88" alt="십이화 아이콘"/>
</p>

<h1 align="center">십이화 — 고스톱: 무한의 판</h1>

<p align="center">
  한국 화투 48장 · 1인용 Balatro라이크 로그라이크 덱빌더
</p>

<p align="center">
  <a href="https://hanate.jqklabs.com/invite"><strong>🎴 지금 플레이</strong></a>
  &nbsp;·&nbsp;
  <a href="https://hanate.jqklabs.com/invite/en">EN</a>
  &nbsp;·&nbsp;
  <a href="https://hanate.jqklabs.com/invite/jp">JP</a>
</p>

<p align="center">
  <a href="https://hanate.jqklabs.com/invite">
    <img src="Assets/OG/kr/OGB1.jpg" alt="십이화 초대" width="480"/>
  </a>
</p>

---

고스톱의 족보·고/스톱·박·정산을, 칩×배수 스코어링·블라인드 커브·특수패·상점 경제에 녹인 웹 프로토타입입니다.

| 문서 | 내용 |
|------|------|
| [docs/기획서.md](docs/기획서.md) | 규칙·밸런스·특수패 |
| [HANDOFF.md](HANDOFF.md) | 최근 변경·다음 작업 |
| [docs/analytics.md](docs/analytics.md) | Firebase 이벤트 |
| [docs/ai-slop-audit.md](docs/ai-slop-audit.md) | UI 슬롭 진단·개선 목록 |

---

## 바로 열기

| 링크 | URL |
|------|-----|
| **초대 (공유용)** | https://hanate.jqklabs.com/invite |
| EN / JP 초대 | `/invite/en` · `/invite/jp` |

로컬은 `index.html`만 열면 됩니다. 빌드 불필요. 시드: `?seed=42`

```bash
python3 -m http.server 8080   # Firebase 로컬 테스트용
npm test                      # 엔진 테스트 + 시뮬
npm run og:gen                # OG / invite 랜딩 → pages/
```

배포: **Vercel** (push 시 자동)

---

## 한 판 요약

<p align="center">
  <img src="Assets/01_january/1-gwang.webp" height="120" alt="1월 광"/>
  &nbsp;
  <img src="Assets/03_march/3-gwang.webp" height="120" alt="3월 광"/>
  &nbsp;
  <img src="Assets/08_august/8-gwang.webp" height="120" alt="8월 광"/>
  &nbsp;
  <img src="Assets/11_november/11-gwang.webp" height="120" alt="11월 광"/>
  &nbsp;
  <img src="Assets/12_december/12-gwang-umbrella.webp" height="120" alt="12월 비광"/>
</p>

- **12개월 완주** — 1월(송학)→12월(비) · 목표 160→5,500 · 내기 4회
- **점수** — `(족보 코어 칩) × 배수 + 나머지 칩` · 족보 기본칩 없음
- **고/스톱** — 무제한 · 밀치기 · 실패 시 고박=런 종료
- **상점** — 특수패 28종 · 소지 5 · 리롤
- **박(보스)** — 3·6·9·12월 · 상점에서 예고
- **춘향** — 다음 달 훈수 예약 · 내기/버리기 호버 시 표정 힌트

---

## 저장소

```
index.html          게임 (ENGINE + UI)
pages/guide/        게임 규칙·공략 가이드
pages/              OG·invite 랜딩 생성물
Assets/             카드 · BGM · SFX · OG · Icons
config/             firestore.rules 등
lib/                firebase-telemetry.mjs
test/               엔진 테스트 + 시뮬
docs/               기획 · analytics
```

`==== ENGINE START/END ====` 사이는 **순수 로직** (DOM 금지). 엔진 수정 후 `npm test` 필수.

---

## Analytics

GA4 + Firestore 동시 기록 → 상세는 [docs/analytics.md](docs/analytics.md)

`session_*` · `run_end` · `hand_play` · `shop_*` · `survey_*` · `shortcut_prompt_*`

DebugView: `?ga_debug=1` · Vercel env: `FIREBASE_CONFIG_JSON`

---

## 밸런스

그리디 봇 300런: 무조커는 3월 벽(~14%)에서 대부분 사망, 상점 봇 승률 ~0%. 종반은 에픽/레전 배수와 고 스노우볼이 필요합니다.

---

<p align="center">
  <a href="https://hanate.jqklabs.com/invite">
    <img src="Assets/Icons/icon-512.png" width="120" alt="플레이하러 가기"/>
  </a>
  <br/>
  <sub><a href="https://hanate.jqklabs.com/invite">hanate.jqklabs.com/invite</a></sub>
</p>

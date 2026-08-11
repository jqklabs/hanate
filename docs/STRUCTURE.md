# 저장소 구조

## 루트 (배포·게임)

| 경로 | 설명 |
|------|------|
| `index.html` | 게임 본체 (ENGINE + UI) |
| `middleware.js` | Vercel Edge — `/invite` 랜덤 OG 분기 |
| `vercel.json` | 빌드·캐시·**랜딩 URL rewrite** |
| `firebase-config.js` | 로컬/빌드 생성 (gitignore) |
| `ads.txt` | AdSense |

## `Assets/` — 게임 에셋

- `01_january` … `12_december` — 카드 webp
- `BGM/`, `SFX/`, `Fonts/`, `Overlay/`, `Spine/`
- `OG/kr|en|jp/` — SNS OG 이미지 (1200×630 JPG)

## `pages/` — 생성된 정적 랜딩 (수동 편집 금지)

`node scripts/og-landing-html.mjs` 로 생성. 공개 URL은 `vercel.json` rewrite로 유지.

```
pages/
  invite/          → /invite, /invite/OG1, /invite/en/…
  land/kr/OG1/     → /OG1
  land/en/OG1/     → /en/OG1
  locale/en/       → /en
  locale/ja/       → /ja (→ /jp 별칭)
```

로컬 미리보기: `python3 -m http.server 8080` → `http://localhost:8080/pages/land/kr/OG1/`

## `config/` — Firebase 설정 템플릿

- `firebase-config.example.js` → 복사해 루트 `firebase-config.js`
- `firestore.rules` — Console에 Publish

## `lib/` · `scripts/` · `test/`

- `lib/firebase-telemetry.mjs` — Analytics (index.html dynamic import)
- `scripts/generate-firebase-config.mjs` — Vercel 빌드
- `scripts/og-landing-html.mjs` — OG/invite HTML 생성
- `test/test-game.mjs` — 엔진 테스트 + 시뮬

## `docs/` · `design/`

- 기획·분석·HANDOFF는 루트 `HANDOFF.md`, `docs/기획서.md` 등

## 에이전트용 (루트 고정)

`CLAUDE.md`, `AGENTS.md`, `README.md`

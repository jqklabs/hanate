# 캠페인 영상 — 폴더 안내

「화투로」 캠페인 영상 작업물. 최종 산출물은 [out/](out/) 에 있다.

## 어디에 뭐가 있나

| 경로 | 내용 |
|---|---|
| **`out/`** | **최종 영상.** 16:9 · 4:5 · 9:16 · 1:1 마스터와 30초 숏폼 |
| `capture/` | 게임 화면 녹화본과 조립 스크립트 (`assemble.mjs` · `make-clips.sh` · `make-plates.mjs`) |
| `capture/out/` | 씬별 녹화 원본 (`scene-A1` ~ `scene-C7`). **재녹화가 어려우므로 보존** |
| `capture/cards_hi/` | 고해상도 카드 이미지 (플레이트 렌더용) |
| `capture/fonts/` | 자막·플레이트 조판용 폰트 |
| `char/` | 캐릭터·카드 레퍼런스. `card_origin/` 은 화투 48장 **PNG 원본** (게임의 webp 원본) |
| `storyboard/` | 스토리보드 이미지 v2~v5 |
| `prompts/` | 생성 프롬프트 원문 |
| `fx/` | 이펙트 소재 (오광·고도리·병풍 엠블럼, 주막 원본) |

## 문서

| 파일 | 내용 |
|---|---|
| [scenario.md](scenario.md) | 시나리오 |
| [STORYBOARD.md](STORYBOARD.md) | 컷 리스트·타임코드 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 제작 요건 |
| [audio-prompts.md](audio-prompts.md) | 오디오 생성 프롬프트 |
| [higgsfield-slots.md](higgsfield-slots.md) | Higgsfield 슬롯 구성 |

## 삭제된 중간 산출물

용량 문제로 아래는 지웠다. 전부 스크립트로 재생성된다.

| 삭제 | 재생성 방법 |
|---|---|
| `out/prev/` (이전 버전 영상) | 재렌더 |
| `capture/out/.work/` (컷별 중간 클립) | `capture/make-clips.sh` |
| `capture/plates/` (자막·타이틀 플레이트) | `capture/make-plates.mjs` |
| `capture/tmp/` | 임시 파일 |

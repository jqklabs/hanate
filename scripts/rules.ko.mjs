// deslop-ignore-file — 이 파일은 규칙 정의라 자기 자신을 매치한다
//
// kill-ai-slop 한국어 규칙 — 기본 스킬에는 러시아어 예제(rules.ru.mjs)만 있다.
//
//   node .agents/skills/kill-ai-slop/scripts/scan.mjs . \
//     --exclude=design --exclude=docs --rules=scripts/rules.ko.mjs
//
// 항목 모양은 scan.mjs의 기본 tell과 같다. patterns는 RegExp 또는 문자열
// (문자열은 대소문자 무시로 컴파일). copy: true 면 .md 산문도 함께 본다.
//
// 주의 두 가지:
//  1. JavaScript의 \b는 ASCII 전용이라 한글 옆에서는 절대 매치되지 않는다.
//     단어 경계 대신 부분 문자열이나 명시적 경계를 쓸 것.
//  2. 스캐너는 파일 전체를 한 덩어리로 매치하므로 `.`이나 `[\s\S]`는 줄을
//     넘어간다. 한 줄 안에서만 세려면 `[^\n]`을 쓸 것.
export default [
  {
    id: 'ko-01', group: 'copy', name: '한국어 AI 문투', fix: '구체적인 것을 말한다',
    copy: true,
    patterns: [
      // "단순한 X가 아니라 Y" — AI 카피의 대표 구문
      /단순한 [^\n]{1,30}?(?:가|이) 아니(?:라|다|에요)/u,
      // 형용사 인플레이션
      /혁신적인|획기적인|압도적인|완벽한 조화|끊김 없[는이]|매끄러운 경험/u,
      /차원이 다른|한 차원 높은|새로운 차원의/u,
      // 행동 유도 상투구
      /지금 바로 (?:경험|시작|만나)/u,
      /잠재력을 (?:펼치|끌어내|깨우)/u,
      /여정을 시작하[세십]/u,
      // 번역투
      /[^\n]{1,24}?(?:을|를) 통해 [^\n]{1,30}?할 수 있습니다/u,
    ],
  },
  {
    id: 'ko-02', group: 'copy', name: '느낌표·물결표 남발', fix: '문장당 하나, 문단당 하나면 충분하다',
    copy: true,
    patterns: [
      // 한글 바로 뒤의 연속 느낌표 — JS의 !! 와 겹치지 않게 한글을 요구한다
      /[가-힣][!！]{2,}/u,
      /[가-힣][~][요죠][~!]/u,
      /[가-힣][?？][!！]|[가-힣][!！][?？]/u,
    ],
  },
  {
    id: 'ko-03', group: 'type', name: '강조 남발', fix: '한 문장에 <b>는 하나 — 버튼 이름이나 치명적 조건만',
    copy: true,
    patterns: [
      // 한 줄에 <b>/<strong>이 4개 이상
      /(?:<b[>\s][^\n]*?){4}/u,
      /(?:<strong[>\s][^\n]*?){4}/u,
      // 마크다운 볼드 4개 이상
      /(?:\*\*[^*\n]+\*\*[^*\n]*){4}/u,
    ],
  },
  {
    id: 'ko-04', group: 'layout', name: '번호 키커', fix: '키커를 지운다 — 순서는 목차가 말한다',
    copy: true,
    patterns: [
      // "01 · 기본 규칙", "02 — 점수" 형태의 섹션 머리표
      />\s*0[1-9]\s*[·・—–]\s*[^\n<]/u,
      /class="[^"\n]*(?:eyebrow|kicker)[^"\n]*"/u,
    ],
  },
  {
    id: 'ko-05', group: 'copy', name: '한국어 UI에 영문 라벨', fix: '한국어 화면이면 한국어로',
    copy: true,
    patterns: [
      /Official (?:game )?guide/i,
      /Get [Ss]tarted\s*</,
      /Learn more\s*</i,
    ],
  },
];

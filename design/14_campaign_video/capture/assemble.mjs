// 녹화분 + 생성 플레이트를 한 편으로 합친다.
// 컷마다 카메라 무브(줌·팬)를 주고 컷 사이는 크로스페이드로 잇는다.
// 녹화 원본은 1920×1080 데스크톱 화면이다.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, cpSync, writeFileSync, readdirSync,
         readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const OUT = resolve(HERE, 'out');
const PLATES = resolve(HERE, 'plates');
const WORK = resolve(OUT, '.work');
const FINAL_DIR = resolve(HERE, '../out');

const FPS = 60;
/* 구글 광고 규격. 비율마다 원본에서 새로 렌더한다 — 완성본을 크롭하면 세로에서 뭉갠다. */
const RATIOS = {
  '4x5':  [1080, 1350],       // 주력 — 네이티브 녹화 비율
  '16x9': [1920, 1080],
  '1x1':  [1080, 1080],
  '9x16': [1080, 1920],
};
const XFADE = 0.15;             // 컷 사이 크로스페이드 — 짧게 줘야 '컷'으로 읽힌다
// ffmpeg(libfreetype)는 woff2를 못 읽는다. make-fonts.mjs가 만든 ttf를 쓴다.
const FONT = resolve(HERE, 'fonts/SSRock.ttf');

/* 카메라 무브 — 1920×1080 화면 안에서 어디를 어떻게 볼지.
 * z: 줌 배율(1 = 전체), fx/fy: 주시점(0~1). from → to로 선형 이동한다.
 * 화면 좌표 기준: 점수판은 좌측 상단(0.09, 0.24), 조커바는 상단(0.26, 0.05),
 * 모달은 중앙(0.5, 0.5), 춘향은 우측(0.85, 0.7). */
/* 컷 = 녹화 단위가 아니라 "사건" 단위.
 * src: 어느 녹화에서 / at: 어느 마크의 몇 초 뒤부터 / use: 몇 초 / speed: 배속
 * 1~1.6초짜리로 잘게 끊어야 릴스에서 이탈이 안 난다. */
/* 컷 = 사건 단위. look은 "무엇을 화면 중앙에 둘지" — rig가 실측한 좌표를 쓴다.
 *
 * 「숫자가 커진다」 — 세 사이클을 같은 리듬으로 반복하되 **체급을 키운다.**
 * 똑같이 반복하면 첫 폭발 이후 몰입도가 급락한다(Gemini 진단 1순위).
 *   사이클1 : 넓게 보고 천천히      (컷 1.1~1.7s)
 *   사이클2 : 조금 더 조이고 빠르게 (컷 0.8~1.4s)
 *   사이클3 : 바짝 붙어 최속        (컷 0.6~1.2s, 마지막만 길게 터뜨림)
 *
 * **오프셋은 음수다.** 마크는 사건 시각에 찍히므로 양수를 주면 카메라가 항상
 * 사건 뒤에 도착한다. 미리 출발해야 카메라가 사건을 "받아내는" 박자가 된다.
 */
/* 컷 = 사건 단위. 스토리보드(STORYBOARD.md) 확정본.
 *
 * 카메라 원칙
 *   - 중심은 항상 'focus'(낸 패 + 수식). 사건이 일어나는 곳이 정중앙에 온다
 *   - 배율은 전 컷 고정. 슬램·최종폭발에서만 들어가고 **빠지지 않는다**
 *   - 강조는 카메라가 아니라 이펙트로 한다
 *
 * 구성 — 사이클마다 역할이 다르다 (같은 4비트 반복 금지)
 *   ① 가르친다(8s, 전 과정) → ② 이유(4.2s) → ③ 엔진(6s, 조커 중심) → ④ 터뜨린다(5.8s)
 */
/* 뷰포트 = 최종 프레임. 레이아웃을 키워 채우므로 카메라 줌은 쓰지 않는다.
   슬램·최종폭발만 아주 살짝 밀고 들어간다. */
/* 배율을 1에 가깝게 둬야 카메라가 움직일 여유가 생긴다.
   1.16으로 조이면 프레임이 꽉 차서 손패→낸패 이동이 불가능하다. */
/* 녹화 뷰포트(1080×1350) 안에서 게임이 실제로 그려지는 '무대'.
 * rig.js의 --cap-stage / record.mjs의 VIEW와 같은 값이어야 한다.
 * 무대 둘레의 여백은 카메라가 확대·팬할 때 잘리지 않게 하는 예비 공간이다. */
const VIEW_W = 1080, STAGE_W = 860;
const Z = VIEW_W / STAGE_W;     // ≈ 1.256 — 무대를 프레임에 꽉 채우는 기본 배율
/* 오버레이(엠블럼·족보 글자·점수 팝업)는 뷰포트 중앙 = 무대 중앙에 뜬다.
 * 무대를 그대로 잡으면(배율 Z, look 'center') 프레임 중앙과 정확히 일치한다.
 * 다른 배율로 크롭하면 그만큼 어긋나므로 오버레이 컷은 이 값을 쓴다. */
const CENTER_CAM = { zoom: Z, ease: 'linear' };
const ZA = Z;                   // 넓게 — 손패를 읽는 배율
const ZB = Z * 1.07;            // 바짝 — 카드가 놓인 뒤 끝까지 이 배율로 간다
const ZC = 2.00;                // 상품 하나 — 이름·설명이 읽힐 만큼

/* 컷 사이 배율은 **이어져야 한다.** 앞 컷이 끝난 배율에서 다음 컷이 시작하지 않으면
 * 매 컷마다 화면이 툭 튄다. 아래는 ZA → (land에서 밀고) → ZB로 한 번만 올라가고
 * 사이클이 끝날 때까지 ZB를 유지한다. 되돌아가는 줌은 없다(R4). */
const TR = 0.16;                // 컷 전환 — 0.08은 하드컷처럼 끊겼다
const EDIT = [
  { id: 'H1', kind: 'plate', use: 1.8, trans: 'fade', transDur: 0.25,
    cam: { z: [1.08, 1.00], ease: 'inout' } },

  // ── ① 가르친다 : 1월 · 고도리 ──
  { src: 'A1', at: ['hand', +0.15], use: 0.60, still: true, look: 'cards',
    trans: 'fade', transDur: 0.14, cam: { zoom: ZA, ease: 'linear' } },
  /* 고른다 → 낸다 → 한 장씩 착지 → 슬램. **한 컷으로 이어 간다.**
     여기서 컷을 나누면 "패를 내는 장면"이 아니라 "화면이 교차로 바뀐 것"으로 읽힌다.
     카메라는 그동안 손패에서 낸 패로 한 번만 옮겨가며 밀고 들어간다. */
  { src: 'A1', at: ['select', -0.30], to: ['emblem', -0.12],
    look: ['cards', 'played'], noSmooth: true,
    trans: 'fade', transDur: TR, cam: { zoom: [ZA, ZB], ease: 'inout' } },
  // 엠블럼 — 문양 가운데 족보 이름이 박힌 한 덩어리
  { src: 'A1', at: ['emblem', -0.12], use: 1.45, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 엠블럼이 사라진 '뒤' 수식 카운팅
  // 엠블럼이 ×배수로 빨려 들어간다 — 족보가 배수를 만든다
  { src: 'A1', at: ['absorb', -0.20], use: 1.44, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A1', at: ['tally', -0.20], use: 1.10, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A1', at: ['sum', -0.20], use: 0.72, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A1', at: ['burst', -0.20], use: 2.25, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 「스톱!」 — 선택 UI 대신 한 마디로 크게
  { src: 'A1', at: ['call', -0.15], use: 1.35, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },

  // ── ② 이유를 준다 : 상점 ──
  /* 주막 — 판을 보던 상태에서 **줌을 싹 땡기고 위로 올려** 배너를 받는다.
     한 방향·강한 감속. 미세하게 흘러내리는 무빙은 금지. */
  /* 주막 — **카메라를 아예 움직이지 않는다.** 앞 컷이 끝난 배율(ZB) 그대로 받아
     배너만 화면에 들이친다. 앞뒤 배율이 같아야 씬이 바뀐 게 아니라 이어진 것으로 읽힌다. */
  { src: 'A2', at: ['discover', -0.05], use: 1.55, still: true, look: 'center',
    trans: 'fade', transDur: 0.34, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A2', at: ['shop', 0.20], use: 0.95, still: true, look: 'center',
    trans: 'fade', transDur: 0.18, cam: { zoom: ZA, ease: 'linear' } },
  /* 상점 컷은 **전부 고정 프레임**이다.
   * 확대한 채로 패닝하면 어두운 모달이 화면 안에서 미끄러져 "카메라가 흔들린다"로 읽힌다.
   * 게다가 구매 직후 render()가 상품에 붙인 표식을 지워 주시점이 사라지면
   * 카메라가 모달 뒤 카드로 튀어버린다. → 읽는 컷과 보는 컷을 나누고 둘 다 고정.
   *   aim : 상품 하나만 크게 (이름·설명이 읽힌다)
   *   fly : 모달 전체 고정 (진열 → 바로 위 보유 칸으로 날아가는 게 다 보인다) */
  { src: 'A2', at: ['aim', -0.15], use: 0.95, still: true, look: 'buyitem',
    trans: 'fade', transDur: 0.22, cam: { zoom: [ZA * 1.35, ZC], ease: 'inout' } },
  { src: 'A2', at: ['fly', -0.10], use: 0.95, still: true, look: 'center',
    trans: 'fade', transDur: 0.26, cam: { zoom: [ZC, ZA], ease: 'inout' } },
  { src: 'A2', at: ['aim2', -0.10], use: 0.80, still: true, look: 'buyitem',
    trans: 'fade', transDur: 0.22, cam: { zoom: [ZA * 1.35, ZC], ease: 'inout' } },
  { src: 'A2', at: ['fly2', -0.10], use: 1.05, still: true, look: 'center',
    trans: 'fade', transDur: 0.26, cam: { zoom: [ZC, ZA], ease: 'inout' } },
  { id: 'H2', kind: 'plate', use: 1.0, trans: 'fade', transDur: 0.14,
    cam: { z: [1.06, 1.00], ease: 'inout' } },

  // ── ③ 엔진 : 5월 · 병풍 · 조커 3개 ──
  /* 고른다 → 낸다 → 한 장씩 착지 → 슬램. **한 컷으로 이어 간다.**
     여기서 컷을 나누면 "패를 내는 장면"이 아니라 "화면이 교차로 바뀐 것"으로 읽힌다.
     카메라는 그동안 손패에서 낸 패로 한 번만 옮겨가며 밀고 들어간다. */
  { src: 'A3', at: ['select', -0.30], to: ['emblem', -0.12],
    look: ['cards', 'played'], noSmooth: true,
    trans: 'fade', transDur: TR, cam: { zoom: [ZA, ZB], ease: 'inout' } },
  { src: 'A3', at: ['emblem', -0.12], use: 1.40, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 엠블럼이 ×배수로 빨려 들어간다 — 족보가 배수를 만든다
  { src: 'A3', at: ['absorb', -0.20], use: 1.44, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A3', at: ['tally', -0.20], use: 0.95, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A3', at: ['joker', -0.45], use: 1.05, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A3', at: ['sum', -0.20], use: 0.72, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A3', at: ['burst', -0.20], use: 2.30, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A3', at: ['call', -0.15], use: 1.30, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },

  // ── ④ 터뜨린다 : 9월 · 오광 · 조커 5개 ──
  /* 고른다 → 낸다 → 한 장씩 착지 → 슬램. **한 컷으로 이어 간다.**
     여기서 컷을 나누면 "패를 내는 장면"이 아니라 "화면이 교차로 바뀐 것"으로 읽힌다.
     카메라는 그동안 손패에서 낸 패로 한 번만 옮겨가며 밀고 들어간다. */
  { src: 'A4', at: ['select', -0.30], to: ['emblem', -0.12],
    look: ['cards', 'played'], noSmooth: true,
    trans: 'fade', transDur: TR, cam: { zoom: [ZA, ZB], ease: 'inout' } },
  // 오광 — 사다리의 꼭대기. 가장 길게 본다
  { src: 'A4', at: ['emblem', -0.12], use: 1.55, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 엠블럼이 ×배수로 빨려 들어간다 — 족보가 배수를 만든다
  { src: 'A4', at: ['absorb', -0.20], use: 1.44, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A4', at: ['tally', -0.20], use: 0.95, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A4', at: ['joker', -0.50], use: 1.15, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A4', at: ['sum', -0.20], use: 0.72, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  { src: 'A4', at: ['burst', -0.20], use: 2.20, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 여기서만 '고'를 외친다 — 앞의 두 판이 스톱이었기에 대비로 산다
  { src: 'A4', at: ['call', -0.15], use: 1.30, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: ZB, ease: 'linear' } },
  // 1고 → 10고. 게임 자체 캐스케이드가 화면 전체를 쓰므로 넓게 받는다
  { src: 'A4', at: ['go', 0.00], use: 2.60, still: true, look: 'anchor',
    trans: 'fade', transDur: TR, cam: { zoom: [ZB, ZA], ease: 'glide' } },

  // ── ⑤ 마무리 ──
  /* 엔딩 — 부메랑(갔다가 원복) 금지.
     화투를 바닥에 내리치듯 크게 들어왔다가 딱 박힌다. 한 방향, 강한 감속. */
  { id: 'H3', kind: 'plate', use: 1.3, trans: 'fade', transDur: 0.18,
    cam: { z: [1.45, 1.00], ease: 'brake' } },
  { id: 'C4', kind: 'plate', use: 1.6, trans: 'fadeblack', transDur: 0.22,
    cam: { z: [1.70, 1.00], ease: 'brake' } },
  /* 로고 — 화투를 바닥에 내리치듯. 크게 들어와 있다가 한 방향으로 떨어지며
     딱 멈추고, 멈추는 그 순간에만 짧게 쾅. 되돌아가는 무빙 없음. */
  { id: 'C6', kind: 'plate', use: 2.9, trans: 'fadewhite', transDur: 0.12,
    fx: { shake: 13, at: 0.62 },
    cam: { z: [2.35, 1.00], pan: [[0, -0.10], [0, 0]], ease: 'brake' } },
];

/* Higgsfield로 뽑아 끼울 시네마틱 슬롯.
 * plates/<id>.mp4 (또는 png/jpg)를 넣으면 자동으로 그 자리에 들어간다.
 * 파일이 없으면 "무엇이 들어갈 자리인지" 적힌 자리표시자가 렌더돼
 * 편집본에서 위치·길이를 눈으로 확인할 수 있다. */
const HIGGS = {
  H1: { label: '오프닝 — 춘향이 패를 부채처럼 펴들고 정면 응시', tone: '#1a2f24' },
  H2: { label: '브릿지 — 특수패(부적)에 불이 붙는 클로즈업',      tone: '#2a1f14' },
  H3: { label: '절정 직후 — 오광에 놀란 춘향 리액션',             tone: '#2a1418' },
  C4: { label: 'CTA 전 — 춘향 정면 (기존 OG 아트)',              tone: '#1a2f24' },
  C6: { label: 'CTA — 금박 로고 + 카피 (기존 OG 아트)',          tone: '#12100c' },
};

const ff = (args) => {
  if (process.env.DEBUG_VF) {
    const i = args.indexOf('-vf');
    console.log('  ss=' + args[args.indexOf('-ss') + 1] + '  vf=' + (i >= 0 ? args[i + 1].slice(0, 320) : ''));
  }
  return execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });
};

const readManifest = () => {
  const p = resolve(OUT, 'manifest.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
};

function findPlate(id) {
  if (!existsSync(PLATES)) return null;
  const f = readdirSync(PLATES).find((n) => n.replace(/\.[^.]+$/, '') === id);
  return f ? resolve(PLATES, f) : null;
}

const esc = (t) => t.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\\\'");

// 자막은 이번 편집에서 쓰지 않는다 (영상이 자막 없이 읽히는지 먼저 확인).
// 함수는 나중에 되살릴 수 있게 남겨둔다.
const CAPTIONS = false;
function drawtext(caption, H = 1080) {
  if (!caption || !CAPTIONS) return '';
  const font = existsSync(FONT) ? `fontfile='${FONT}':` : '';
  // expansion=none — '85%'의 %를 ffmpeg가 포맷 지시자로 해석하지 않게 한다
  // 자막은 아래에서 살짝 떠오르며 페이드 인
  return `,drawtext=${font}text='${esc(caption)}':expansion=none:fontcolor=#fdf6e3:` +
         `fontsize=${Math.round(H * 0.052)}:` +
         `borderw=5:bordercolor=black@0.9:x=(w-text_w)/2:` +
         `y=h*0.855+12*max(0\\,1-t/0.6):alpha='min(1\\,t/0.5)'`;
}

/* 이징 — 선형 줌은 기계적으로 보인다. 감속(out)이 카메라처럼 읽힌다.
 * ffmpeg 표현식 안에서 pow()는 콤마 때문에 이스케이프가 필요하므로 곱셈으로 푼다. */
/* 이징.
 *
 * 주의: 강한 감속(expo 같은 4제곱)을 **모든 컷에** 걸면 컷 끝마다 카메라가
 * 완전히 선다. 게임 화면은 정지 상태라 카메라가 서는 순간 프레임이 완전히
 * 동일해지고(실효 fps 47까지 하락), 보는 사람은 "한 번씩 걸렸다 움직인다"고 느낀다.
 * → 기본은 거의 등속(glide). 브레이크는 시퀀스가 끝나는 컷에서만 쓴다.
 */
const EASE = {
  linear: (P) => P,
  // 아주 살짝만 완급 — 끝에서 멈추지 않고 다음 컷으로 흘러간다
  glide:  (P) => `(${P}*(1.12-0.12*${P}))`,
  out:    (P) => `(1-(1-${P})*(1-${P}))`,
  inout:  (P) => `(${P}*${P}*(3-2*${P}))`,
  snap:   (P) => `(1-(1-${P})*(1-${P})*(1-${P}))`,
  // 확 튀어나갔다가 브레이크 — 정말 멈춰야 하는 곳에만
  brake:  (P) => `(1-(1-${P})*(1-${P})*(1-${P})*(1-${P}))`,
};

/* 카메라.
 * 주시점은 화면 기하학적 중앙이 아니라 rig가 실측한 카드 위치를 쓴다.
 * (예전엔 화면 중앙을 봐서 판의 빈 여백이 가운데 오고 카드가 옆으로 밀렸다)
 *
 * 목표 비율로 먼저 잘라낸 뒤 zoompan을 건다. 완성본을 다시 크롭하면
 * 세로 비율에서 해상도가 뭉갠다.
 */
function camera(cut, W, H) {
  const use = cut.use;
  const n = Math.max(2, Math.round(use * FPS));
  const P = `(on/${n - 1})`;
  const e = (EASE[cut.cam.ease || 'glide'])(P);
  const lerp = ([p, q]) => `(${p}+(${q}-${p})*${e})`;   // 괄호 필수 (연산자 우선순위)

  const f = cut.focal || { cx: 0.5, cy: 0.5 };
  const arr = (v) => (Array.isArray(v) ? v : [v, v]);

  /* 줌은 손으로 정하지 않는다.
   * 대상이 화면의 fill 비율을 차지하도록 실측 크기에서 역산한다.
   * (줌을 낮게 잡으면 크롭 창이 커져 클램프가 걸리고, 카드가 위로 붙으면서
   *  화면 아래 절반이 빈 판으로 남았다) */
  const fitZoom = (fill, w, h) => {
    const zw = fill / Math.max(0.02, w);
    const zh = fill / Math.max(0.02, h);
    return Math.max(1.05, Math.min(3.4, Math.min(zw, zh)));
  };
  let z0, z1;
  /* R4 — 배율을 대상 크기에서 계산하면 컷마다 달라진다.
   * 수식(tally)은 가로로 길고 세로가 얇아서(h=0.02) 카드(h=0.20)와 같은 fill을 줘도
   * 배율이 절반으로 나온다 → 줌인했다 빠졌다 다시 들어가는 것처럼 보인다.
   * 게임 컷은 배율을 '고정'하고 주시점만 옮긴다. */
  if (cut.cam.zoom) {
    const zz = Array.isArray(cut.cam.zoom) ? cut.cam.zoom : [cut.cam.zoom, cut.cam.zoom];
    [z0, z1] = zz;
  } else if (cut.cam.fill) {
    const [fl0, fl1] = arr(cut.cam.fill);
    const [w0, w1] = arr(f.w), [h0, h1] = arr(f.h);
    z0 = fitZoom(fl0, w0, h0);
    z1 = fitZoom(fl1, w1, h1);
  } else {
    [z0, z1] = cut.cam.z;
  }
  /* 주시점은 **중심 좌표 그대로** 보간한다.
   * 예전엔 양 끝점을 '크롭 창 좌상단 비율'로 미리 환산해 그 값을 이었는데,
   * 이 환산은 배율에 따라 분모(1 - 1/z)가 달라지는 비선형 변환이다.
   * 배율이 변하는 컷에서는 같은 중심(0.5)이 배율마다 다른 비율이 되어
   * 화면이 옆으로 휘며 흘러갔다 — 로고가 수직으로 안 떨어지고 곡선을 그린 이유다.
   * 중심에서 크롭 좌상단을 매 프레임 계산하면 배율과 무관하게 정확히 그 점을 본다. */
  const [cx0, cx1] = arr(f.cx), [cy0, cy1] = arr(f.cy);
  const cxE = lerp([cx0, cx1]), cyE = lerp([cy0, cy1]);

  const up = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase`;
  const box = `crop='min(iw\\,ih*${W}/${H})':'min(ih\\,iw*${H}/${W})'`;
  return `fps=${FPS},${up},${box},` +
         `zoompan=z='${lerp([z0, z1])}':` +
         `x='max(0\\,min(iw-iw/zoom\\,iw*${cxE}-iw/zoom/2))':` +
         `y='max(0\\,min(ih-ih/zoom\\,ih*${cyE}-ih/zoom/2))':` +
         `d=1:s=${W}x${H}:fps=${FPS}`;
}

/* 임팩트 — 화면 안 VFX가 주력이라 후보정은 아주 약하게만 보탠다. */
function impact({ shake = 0, flash = 0, at: t0 = 0 } = {}, W = 0, H = 0) {
  let f = '';
  if (shake) {
    /* t0: 충격이 오는 시각. 착지하는 순간에 흔들려야 '쾅'으로 읽힌다 —
       컷 시작에 흔들면 이미 멈춘 화면이 뒤늦게 떠는 꼴이 된다. */
    const A = shake, D = 11, F = 38;
    const pad = Math.ceil(A) + 2;
    const u = `max(0\,t-${t0})`;
    const on = `gte(t\,${t0})`;
    f += `,crop=w=iw-${pad * 2}:h=ih-${pad * 2}` +
         `:x='${pad}+${A}*${on}*sin(${u}*${F})*exp(-${u}*${D})'` +
         `:y='${pad}+${A}*${on}*cos(${u}*${F * 1.3})*exp(-${u}*${D})'`;
    // 크롭한 만큼 다시 키운다 — 안 그러면 이 컷만 작아져 xfade가 크기 불일치로 죽는다
    if (W && H) f += `,scale=${W}:${H}`;
  }
  if (flash) f += `,eq=brightness='${flash}*exp(-t*11)':eval=frame`;
  return f;
}

/* 마감 — 대비·채도를 살짝 올리고 옅은 비네트.
 * 세게 걸면 게임 배경(Assets/Background.webp)이 죽는다. */
const GRADE = `,eq=contrast=1.06:saturation=1.08:gamma=1.04,vignette=PI/7`;

function markAt(srcId, [name, off]) {
  const m = readManifest()[srcId];
  if (!m) throw new Error(`${srcId}: manifest가 없습니다 — record를 먼저 실행하세요`);
  const hit = (m.marks || []).find((x) => x.name === name);
  if (!hit) throw new Error(`${srcId}: '${name}' 마크가 없습니다 (씬에 api.mark 추가 필요)`);
  // 녹화는 페이지 로드부터라 씬 시작 오프셋을 더해야 실제 위치가 나온다
  return { t: m.startMs / 1000 + hit.ms / 1000 + off, rects: hit.rects || {} };
}

/* 컷 시각에 가장 가까운 좌표 샘플. 카드는 씬 내내 움직이므로
 * 마크 시점 좌표를 그대로 쓰면 몇 초 뒤 컷에서 화면 밖으로 밀린다. */
function rectsAt(srcId, tRelMs) {
  const m = readManifest()[srcId] || {};
  const log = m.rectLog || [];
  if (!log.length) return {};
  let best = log[0], gap = Infinity;
  for (const e of log) {
    const d = Math.abs(e.ms - tRelMs);
    if (d < gap) { gap = d; best = e; }
  }
  return best.rects || {};
}

const CENTER = { cx: 0.5, cy: 0.5 };
/* 카메라 중심 결정.
 * focus = 낸 패 + 수식(한 덩어리). 이게 없으면(아직 안 낸 단계) 손패를 본다.
 * 어느 쪽이든 '지금 사건이 일어나는 곳'이 프레임 정중앙에 온다. */
/* 'center'는 "화면 정중앙을 봐라"라는 뜻이다.
 * 예전엔 null로 떨궈서 결국 focus로 흘러갔고, 오버레이(엠블럼·팝업) 컷에서
 * 프레임 중앙과 뷰포트 중앙이 어긋났다. 명시적으로 CENTER를 돌려준다. */
const one = (rects, want) =>
  (want === 'center' ? CENTER
    : (rects[want] || rects.focus || rects.cards || rects.played || rects.hand || CENTER));

/* 컷이 무엇을 보게 할지.
 * look: 'hand'            → 손패 8장을 화면 중앙에
 * look: ['hand','played'] → 손패에서 낸 패로 카메라가 이동 (내는 순간용)
 */
function focalOf(cut, startRects, endRects) {
  const want = cut.look || 'hand';
  const [k0, k1] = Array.isArray(want) ? want : [want, want];
  const a = one(startRects, k0);
  /* still: 컷 내내 시작 좌표로 고정.
   * 기본 동작은 시작·끝 실측 좌표를 잇는 것인데, 낸 패나 수식이 컷 도중에
   * 사라지면 그 좌표가 통째로 바뀌어 카메라가 저 혼자 스르륵 흘러간다.
   * "정적이어야 할 컷"에서 이 미세 이동이 계속 거슬렸다 → 아예 못 움직이게 한다. */
  const b = cut.still ? a : one(endRects, k1);
  /* pan: 실측 좌표에 얹는 의도적인 이동량(프레임 비율).
     "줌을 땡기면서 위로 올린다" 같은 연출은 잡을 요소가 따로 없어서
     좌표만으로는 표현이 안 된다. [시작, 끝] 오프셋으로 직접 준다. */
  const [px0, px1] = cut.cam.pan ? cut.cam.pan.map((v) => v[0] ?? 0) : [0, 0];
  const [py0, py1] = cut.cam.pan ? cut.cam.pan.map((v) => v[1] ?? 0) : [0, 0];
  // 크기도 넘긴다 — 줌을 손으로 정하지 않고 이 크기에서 역산한다
  return { cx: [a.cx + px0, b.cx + px1], cy: [a.cy + py0, b.cy + py1],
           w: [a.w || 0.4, b.w || 0.4], h: [a.h || 0.2, b.h || 0.2] };
}

function buildClip(cut, idx, W, H) {
  const id = cut.src || cut.id;
  const dst = resolve(WORK, `${String(idx).padStart(2, '0')}-${id}.mp4`);
  // 녹화 컷이면 시작·끝 시점의 실측 좌표를 각각 가져와 그 사이를 따라간다
  const at = cut.kind === 'plate' ? null : markAt(id, cut.at);
  /* to: ['마크', 오프셋] — 컷을 그 마크까지 채운다.
     use를 손으로 적으면 씬 타이밍이 조금만 바뀌어도 겹치거나 구멍이 난다. */
  if (at && cut.to) cut.use = Math.max(0.2, markAt(id, cut.to).t - at.t);
  if (at) {
    const relStart = at.t * 1000 - (readManifest()[id].startMs || 0);
    const relEnd = relStart + cut.use * (cut.speed || 1) * 1000;
    cut.focal = focalOf(cut, rectsAt(id, relStart), rectsAt(id, relEnd));
  } else {
    // 플레이트도 pan을 쓸 수 있어야 한다 (로고가 위에서 떨어지는 연출)
    cut.focal = focalOf({ ...cut, look: 'center' }, {}, {});
  }
  /* 소스는 SLOW배 느리게 찍혀 있다. 마크·좌표는 이미 빨리감기 기준으로 환산돼 있으므로
   * 소스를 탐색·절취할 때만 SLOW를 다시 곱해준다. */
  const slow = cut.kind === 'plate' ? 1 : (readManifest()[id]?.slow || 1);
  const speed = cut.speed || 1;
  const grab = cut.use * speed * slow;          // 소스에서 떠올 길이(슬로 시간)
  /* 프레임을 지어내지 않는다(minterpolate 폐기).
   * 느리게 찍은 걸 그만큼 빨리 감으면 25 × SLOW fps 분량의
   * '실제로 렌더된' 프레임이 그대로 살아난다. 지어낸 프레임 0장. */
  const rate = slow * speed;
  const ramp = rate === 1 ? '' : `setpts=PTS/${rate},`;
  const vf = `${ramp}${camera(cut, W, H)}${impact(cut.fx, W, H)}${GRADE}` +
             `,format=yuv420p${drawtext(cut.caption, H)}`;
  const enc = ['-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS)];

  if (cut.kind !== 'plate') {
    const src = resolve(OUT, `scene-${id}.webm`);
    if (!existsSync(src)) throw new Error(`녹화분 없음: ${src} — record를 먼저 실행하세요`);
    /* -ss/-t 는 반드시 입력 옵션으로 둔다.
     * 출력 옵션으로 두면 setpts로 압축된 '출력' 길이 기준으로 잘려서
     * 클립이 slow배 길어진다. 여기서는 소스(슬로 시간)를 잘라야 한다. */
    ff(['-ss', (at.t * slow).toFixed(2), '-t', grab.toFixed(2), '-i', src,
        '-vf', vf, ...enc, dst]);
    return dst;
  }

  const plate = findPlate(id);
  if (plate) {
    const still = /\.(png|jpe?g|webp)$/i.test(plate);
    ff([...(still ? ['-loop', '1'] : []), '-i', plate, '-t', String(cut.use),
        '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},${vf}`,
        ...enc, dst]);
    return dst;
  }

  // 아직 안 만든 슬롯 — 무엇이 들어갈 자리인지 화면에 적어 렌더한다
  const meta = HIGGS[id];
  console.warn(`  \u26a0 ${id}: plates/${id}.* 없음 → 자리표시자` +
               `${meta ? ` (${meta.label})` : ''}`);
  /* 자리표시자는 개발용 마커라 라틴 문자가 필요하다.
     SSRock은 583자 한글 서브셋이라 'H'·'s'가 두부(□)로 나온다 → 시스템 폰트를 쓴다. */
  const SYS = '/System/Library/Fonts/AppleSDGothicNeo.ttc';
  const font = existsSync(SYS) ? `fontfile='${SYS}':` : '';
  const line = (t, y, size, col) =>
    `,drawtext=${font}text='${esc(t)}':expansion=none:fontcolor=${col}:fontsize=${size}` +
    `:x=(w-text_w)/2:y=${y}`;
  ff(['-f', 'lavfi', '-i',
      `color=c=${meta ? meta.tone : '#0d1f18'}:s=${W}x${H}:d=${cut.use}:r=${FPS}`,
      '-vf', `format=yuv420p` +
        line(`[ ${id} ]`, 'h*0.42', Math.round(H * 0.06), '#ffd98a') +
        line(`${cut.use.toFixed(1)}s`, 'h*0.52', Math.round(H * 0.032), '#e8d9b0') +
        `,drawbox=x=0:y=h*0.40:w=iw:h=4:color=#ffd98a@0.5:t=fill`,
      ...enc, dst]);
  return dst;
}

const probeDur = (f) => Number(execFileSync('ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

/* 하드컷 대신 크로스페이드로 잇는다 — 컷이 따로 노는 느낌을 없앤다.
 * 오프셋은 의도한 use가 아니라 실제 렌더된 길이로 계산해야 한다.
 * (배속·프레임레이트 때문에 둘이 어긋나면 뒤 컷들이 통째로 잘려나간다) */
function crossfade(clips, cuts, dst) {
  if (clips.length === 1) { cpSync(clips[0], dst); return; }
  const inputs = clips.flatMap((c) => ['-i', c]);
  // xfade를 체인으로 걸면 offset은 "지금까지 누적된 출력" 기준이다.
  // 누적 길이 acc를 따로 들고 가야 컷들이 서로를 잡아먹지 않는다.
  const dur = clips.map(probeDur);
  let expr = '', prev = '0:v', acc = dur[0];
  for (let i = 1; i < clips.length; i++) {
    const out = i === clips.length - 1 ? 'out' : `x${i}`;
    expr += `[${prev}][${i}:v]xfade=transition=${cuts[i].trans || 'fade'}:duration=${cuts[i].transDur || XFADE}:` +
            `offset=${(acc - (cuts[i].transDur || XFADE)).toFixed(3)}[${out}];`;
    acc += dur[i] - (cuts[i].transDur || XFADE);
    prev = out;
  }
  ff([...inputs, '-filter_complex', expr.replace(/;$/, ''), '-map', '[out]',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', dst]);
}

/* 같은 녹화에서 온 이웃 컷이 소스 시간축에서 겹치면 같은 장면이 두 번 재생된다.
 * 예전에 이걸 눈으로 찾느라 여러 번 다시 뽑았다 → 합성 전에 숫자로 잡는다. */
function checkOverlaps(cuts) {
  const last = {};
  for (const c of cuts) {
    if (c.kind === 'plate') continue;
    const t = markAt(c.src, c.at).t;
    const end = t + c.use * (c.speed || 1);
    const prev = last[c.src];
    if (prev && t < prev.end - 0.02)
      console.warn(`  \u26a0 ${c.src}: '${prev.name}' 컷(${prev.end.toFixed(2)}s)과 ` +
                   `'${c.at[0]}' 컷(${t.toFixed(2)}s)이 겹칩니다 — 같은 장면이 두 번 나옵니다`);
    if (prev && t > prev.end + 1.2)
      console.warn(`  \u26a0 ${c.src}: '${prev.name}' → '${c.at[0]}' 사이 ` +
                   `${(t - prev.end).toFixed(2)}s가 통째로 빠집니다`);
    last[c.src] = { name: c.at[0], end };
  }
}

// recOnly — 생성 플레이트를 빼고 코드로 녹화한 컷만 이어붙인다 (검수용)
export function assemble({ recOnly = false, ratio = '16x9' } = {}) {
  const [W, H] = RATIOS[ratio];
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });
  mkdirSync(FINAL_DIR, { recursive: true });

  const cuts = recOnly ? EDIT.filter((c) => c.kind !== 'plate') : EDIT;
  checkOverlaps(cuts);
  const clips = cuts.map((c, i) => buildClip(c, i, W, H));
  const target = resolve(FINAL_DIR,
    recOnly ? 'hwatro_recorded_only.mp4' : `hwatro_campaign_${ratio}.mp4`);

  if (existsSync(target)) {
    mkdirSync(resolve(FINAL_DIR, 'prev'), { recursive: true });
    cpSync(target, resolve(FINAL_DIR, 'prev', target.split('/').pop()));
  }
  crossfade(clips, cuts, target);

  const dur = execFileSync('ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', target])
    .toString().trim();
  console.log(`합성 완료 → ${target}  (${Number(dur).toFixed(1)}초 / ${W}×${H})`);
  return target;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const recOnly = process.argv.includes('--rec-only');
  if (process.argv.includes('--ratios')) {
    // 완성본을 다시 자르지 않고 비율마다 원본에서 새로 렌더한다 (화질 유지)
    for (const r of Object.keys(RATIOS)) assemble({ ratio: r });
  } else {
    const i = process.argv.indexOf('--ratio');
    assemble({ recOnly, ratio: i >= 0 ? process.argv[i + 1] : '4x5' });
  }
}

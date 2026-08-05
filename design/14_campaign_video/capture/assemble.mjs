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
const EDIT = [
  // ── 오프닝 (Higgsfield) ──
  { id: 'H1', kind: 'plate', use: 1.8, trans: 'fade', transDur: 0.25,
    cam: { z: [1.10, 1.00], ease: 'inout' } },

  /* 사이클 1 : 1월 · 목표 160 · 체급 1.0
     stage = 화투패 + 춘향. 주인공은 춘향이지만 화투패가 화면 중심이다. */
  { src: 'A1', at: ['hand', 0.2], use: 1.4, look: 'action',
    cam: { fill: [0.90, 1.02], ease: 'linear' } },                       // 고정
  { src: 'A1', at: ['select', -0.25], use: 1.1, look: 'hand',
    trans: 'fade', transDur: 0.1, cam: { fill: [0.96, 1.08], ease: 'linear' } },   // 고정(타이트)
  { src: 'A1', at: ['slam', -0.40], use: 1.2, look: ['hand', 'played'], noSmooth: true,
    trans: 'fade', transDur: 0.04, cam: { fill: [1.06, 0.92], ease: 'snap' } },  // ★ 과감
  { src: 'A1', at: ['tally', -0.30], use: 1.4, look: 'tally',
    trans: 'fade', transDur: 0.06, cam: { fill: [0.94, 1.06], ease: 'linear' } },  // 고정
  { src: 'A1', at: ['burst', -0.30], use: 1.7, look: 'action',
    trans: 'fadewhite', transDur: 0.1, cam: { fill: [1.10, 0.90], ease: 'snap' } }, // ★ 과감

  // ── 상점 ──
  { src: 'A2', at: ['shop', 0.25], use: 1.3, look: 'shop',
    trans: 'fade', transDur: 0.18, cam: { fill: [0.88, 1.00], ease: 'linear' } },
  { src: 'A2', at: ['buy', -0.25], use: 1.1, look: 'jokers',
    trans: 'fade', transDur: 0.08, cam: { fill: [0.92, 1.04], ease: 'linear' } },

  // ── 브릿지 (Higgsfield) ──
  { id: 'H2', kind: 'plate', use: 1.2, trans: 'fade', transDur: 0.2,
    cam: { z: [1.08, 1.00], ease: 'inout' } },

  // ── 사이클 2 : 5월 · 목표 600 · 체급 1.5 ──
  { src: 'A3', at: ['hand', 0.25], use: 1.1, look: 'action',
    trans: 'fade', transDur: 0.12, cam: { fill: [0.92, 1.04], ease: 'linear' } },
  { src: 'A3', at: ['select', -0.30], use: 0.85, look: 'hand',
    trans: 'fade', transDur: 0.06, cam: { fill: [1.00, 1.12], ease: 'linear' } },
  { src: 'A3', at: ['slam', -0.45], use: 1.0, look: ['hand', 'played'], noSmooth: true,
    trans: 'fade', transDur: 0.04, cam: { fill: [1.12, 0.94], ease: 'snap' } },  // ★
  { src: 'A3', at: ['tally', -0.30], use: 1.2, look: 'tally',
    trans: 'fade', transDur: 0.06, cam: { fill: [0.98, 1.10], ease: 'linear' } },
  { src: 'A3', at: ['joker', -0.30], use: 1.3, look: 'jokers',
    trans: 'fade', transDur: 0.05, cam: { fill: [0.94, 1.06], ease: 'linear' } },
  { src: 'A3', at: ['burst', -0.30], use: 1.8, look: 'action',
    trans: 'fadewhite', transDur: 0.09, cam: { fill: [1.14, 0.92], ease: 'snap' } }, // ★

  // ── 사이클 3 : 9월 · 오광 · 체급 2.3 ──
  { src: 'A4', at: ['hand', 0.25], use: 0.9, look: 'action',
    trans: 'fade', transDur: 0.1, cam: { fill: [0.94, 1.06], ease: 'linear' } },
  { src: 'A4', at: ['select', -0.30], use: 0.7, look: 'hand',
    trans: 'fade', transDur: 0.06, cam: { fill: [1.04, 1.16], ease: 'linear' } },
  { src: 'A4', at: ['slam', -0.50], use: 1.0, look: ['hand', 'played'], noSmooth: true,
    trans: 'fade', transDur: 0.03, cam: { fill: [1.20, 0.96], ease: 'snap' } },  // ★ 가장 과감
  { src: 'A4', at: ['tally', -0.30], use: 1.1, look: 'tally',
    trans: 'fade', transDur: 0.05, cam: { fill: [1.00, 1.12], ease: 'linear' } },
  { src: 'A4', at: ['joker', -0.35], use: 1.6, look: 'jokers',
    trans: 'fade', transDur: 0.05, cam: { fill: [0.96, 1.08], ease: 'linear' } },
  { src: 'A4', at: ['burst', -0.35], use: 2.6, look: 'action',
    trans: 'fadewhite', transDur: 0.09, cam: { fill: [1.22, 0.90], ease: 'brake' } }, // ★ 절정

  // ── 리액션 (Higgsfield) ──
  { id: 'H3', kind: 'plate', use: 1.4, trans: 'fade', transDur: 0.22,
    cam: { z: [1.06, 1.00], ease: 'inout' } },

  // ── CTA ──
  { id: 'C4', kind: 'plate', use: 2.0, trans: 'fadeblack', transDur: 0.3,
    cam: { z: [1.12, 1.00], ease: 'inout' } },
  { id: 'C6', kind: 'plate', use: 2.8, trans: 'fadeblack', transDur: 0.35,
    cam: { z: [1.00, 1.08], ease: 'inout' } },
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

  /* 주시점을 크롭 창 좌상단 비율로 미리 바꾼다.
   * 예전엔 ffmpeg 표현식 안에서 매 프레임 max/min 클램프를 걸었는데,
   * 클램프가 걸리는 순간 이동 방향이 꺾여 화면이 자글거렸다.
   * 여기서 양 끝점을 유효 범위로 보정해두면 표현식에 분기가 없어져 매끄러워진다. */
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
  if (cut.cam.fill) {
    const [fl0, fl1] = arr(cut.cam.fill);
    const [w0, w1] = arr(f.w), [h0, h1] = arr(f.h);
    z0 = fitZoom(fl0, w0, h0);
    z1 = fitZoom(fl1, w1, h1);
  } else {
    [z0, z1] = cut.cam.z;
  }
  const toTopLeft = (c, z) => {
    const win = 1 / z;                       // 크롭 창 크기(비율)
    return Math.max(0, Math.min(1 - win, c - win / 2)) / Math.max(1e-6, 1 - win);
  };
  const [cx0, cx1] = arr(f.cx), [cy0, cy1] = arr(f.cy);
  const nx = [toTopLeft(cx0, z0), toTopLeft(cx1, z1)];
  const ny = [toTopLeft(cy0, z0), toTopLeft(cy1, z1)];

  const up = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase`;
  const box = `crop='min(iw\\,ih*${W}/${H})':'min(ih\\,iw*${H}/${W})'`;
  return `fps=${FPS},${up},${box},` +
         `zoompan=z='${lerp([z0, z1])}':` +
         `x='(iw-iw/zoom)*${lerp(nx)}':y='(ih-ih/zoom)*${lerp(ny)}':` +
         `d=1:s=${W}x${H}:fps=${FPS}`;
}

/* 임팩트 — 화면 안 VFX가 주력이라 후보정은 아주 약하게만 보탠다. */
function impact({ shake = 0, flash = 0 } = {}) {
  let f = '';
  if (shake) {
    const A = shake, D = 9, F = 34;
    const pad = Math.ceil(A) + 2;
    f += `,crop=w=iw-${pad * 2}:h=ih-${pad * 2}` +
         `:x='${pad}+${A}*sin(t*${F})*exp(-t*${D})'` +
         `:y='${pad}+${A}*cos(t*${F * 1.3})*exp(-t*${D})'`;
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
const one = (rects, want) =>
  (want === 'center' ? null : rects[want]) || rects.cards || rects.played || rects.hand || CENTER;

/* 컷이 무엇을 보게 할지.
 * look: 'hand'            → 손패 8장을 화면 중앙에
 * look: ['hand','played'] → 손패에서 낸 패로 카메라가 이동 (내는 순간용)
 */
function focalOf(cut, startRects, endRects) {
  const want = cut.look || 'hand';
  const [k0, k1] = Array.isArray(want) ? want : [want, want];
  const a = one(startRects, k0);
  const b = one(endRects, k1);
  // 크기도 넘긴다 — 줌을 손으로 정하지 않고 이 크기에서 역산한다
  return { cx: [a.cx, b.cx], cy: [a.cy, b.cy],
           w: [a.w || 0.4, b.w || 0.4], h: [a.h || 0.2, b.h || 0.2] };
}

function buildClip(cut, idx, W, H) {
  const id = cut.src || cut.id;
  const dst = resolve(WORK, `${String(idx).padStart(2, '0')}-${id}.mp4`);
  // 녹화 컷이면 시작·끝 시점의 실측 좌표를 각각 가져와 그 사이를 따라간다
  const at = cut.kind === 'plate' ? null : markAt(id, cut.at);
  if (at) {
    const relStart = at.t * 1000 - (readManifest()[id].startMs || 0);
    const relEnd = relStart + cut.use * (cut.speed || 1) * 1000;
    cut.focal = focalOf(cut, rectsAt(id, relStart), rectsAt(id, relEnd));
  } else {
    cut.focal = CENTER;
  }
  const speed = cut.speed || 1;
  // speed>1이면 원본을 더 많이 떠와서 압축하고, <1이면 적게 떠와서 늘린다
  const grab = cut.use * speed;
  /* 녹화 원본은 25fps다. 그대로 60fps로 올리면 같은 프레임이 반복돼 이펙트가 딸려 보이고,
   * 슬로우모션을 걸면 더 심해진다(0.75배 = 실질 18fps).
   * smooth 컷은 모션 보간으로 중간 프레임을 합성한 뒤에 속도를 바꾼다. */
  /* 녹화 원본은 25fps다. 보간 없이 60fps 컨테이너에 담으면 프레임만 복제돼
   * "60프레임이 맞나" 싶은 뚝뚝 끊기는 움직임이 된다. 녹화 컷은 전부 보간한다. */
  /* 녹화 원본은 25fps다. 보간 없이 60fps에 담으면 프레임 복제라 뚝뚝 끊긴다.
   * 다만 카드가 빠르게 내리꽂히는 슬램 컷은 보간이 픽셀을 뭉개 워핑 잔상을 만든다
   * → noSmooth로 명시적으로 뺀다. */
  /* 녹화 원본은 25fps다. 보간 없이 60fps에 담으면 프레임 복제라 뚝뚝 끊긴다.
   * 다만 카드가 빠르게 내리꽂히는 슬램 컷에서 mci(움직임 보상)는 픽셀을 지어내
   * 워핑 잔상을 만든다 → 그런 컷은 blend로 바꾼다.
   * blend는 픽셀을 지어내지 않고 섞기만 해서 잔상 대신 모션블러처럼 읽힌다.
   * 어느 쪽이든 프레임은 전부 새로 생기므로 60fps가 유지된다. */
  const smooth = cut.kind === 'plate'
    ? ''
    : (cut.noSmooth
        ? `minterpolate=fps=${FPS}:mi_mode=blend,`
        : `minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,`);
  const ramp = speed === 1 ? '' : `setpts=PTS/${speed},`;
  const vf = `${smooth}${ramp}${camera(cut, W, H)}${impact(cut.fx)}${GRADE}` +
             `,format=yuv420p${drawtext(cut.caption, H)}`;
  const enc = ['-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS)];

  if (cut.kind !== 'plate') {
    const src = resolve(OUT, `scene-${id}.webm`);
    if (!existsSync(src)) throw new Error(`녹화분 없음: ${src} — record를 먼저 실행하세요`);
    ff(['-ss', at.t.toFixed(2), '-i', src, '-t', grab.toFixed(2), '-vf', vf, ...enc, dst]);
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

// recOnly — 생성 플레이트를 빼고 코드로 녹화한 컷만 이어붙인다 (검수용)
export function assemble({ recOnly = false, ratio = '16x9' } = {}) {
  const [W, H] = RATIOS[ratio];
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });
  mkdirSync(FINAL_DIR, { recursive: true });

  const cuts = recOnly ? EDIT.filter((c) => c.kind !== 'plate') : EDIT;
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

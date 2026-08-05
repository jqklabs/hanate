// 마지막 춘향 컷(plates/C4.png)만 따로 뽑는다.
// 광고 규격별로 '원본에서' 잘라내고(완성본 크롭 금지 — 세로에서 뭉갠다)
// 아주 약한 push-in을 건다. 부메랑 없이 한 방향, 감속.
//
//   node make-chunhyang.mjs            → 전 비율 mp4 + 첫 프레임 png
//   node make-chunhyang.mjs 4x5 1x1    → 지정한 비율만
//
// 산출: out/chunhyang/chunhyang_<ratio>.mp4 / .png
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, 'plates/C4.png');
const DST = resolve(HERE, 'out/chunhyang');

const SW = 1080, SH = 1920;      // 원본 크기
const FPS = 60;
const DUR = 3.2;                 // 초 — 릴스 엔딩 카드로 붙이기 좋은 길이
const ZOOM = [1.0, 1.075];       // 살짝만. 1.1을 넘기면 눈코가 프레임을 밀고 나간다

/* 시선이 머무는 곳 = 눈(원본 비율 좌표). 카드는 그 아래(0.53)에 있으므로
   크롭은 눈을 위쪽 1/3에, 카드를 아래 1/3에 두는 선에서 잡는다. */
const EYE = { x: 0.52, y: 0.34 };

/* mode:
 *   'crop' — 원본에서 그 비율만큼 잘라낸다. anchor = 잘라낸 창 안에서 눈이 올 세로 위치.
 *   'fit'  — 가로가 너무 넓어 자르면 카드가 날아가는 비율(16x9). 흐린 배경 위에 통째로 얹는다.
 */
const RATIOS = {
  '4x5':  { w: 1080, h: 1350, mode: 'crop', anchor: 0.42 },
  '9x16': { w: 1080, h: 1920, mode: 'crop', anchor: 0.34 },
  '1x1':  { w: 1080, h: 1080, mode: 'crop', anchor: 0.42 },
  '16x9': { w: 1920, h: 1080, mode: 'fit' },
};

const GRADE = 'eq=contrast=1.06:saturation=1.08:gamma=1.04,vignette=PI/7';
const ff = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

const n = Math.max(2, Math.round(DUR * FPS));
const P = `(on/${n - 1})`;
const EASE = `(1-(1-${P})*(1-${P})*(1-${P}))`;             // 감속 — 카메라처럼 선다
const lerp = ([a, b]) => `(${a}+(${b}-${a})*${EASE})`;

/* 주시점을 크롭 창 좌상단 비율로 미리 환산한다.
   ffmpeg 표현식 안에서 매 프레임 클램프를 걸면 방향이 꺾여 화면이 자글거린다. */
const toTopLeft = (c, z) => {
  const win = 1 / z;
  return Math.max(0, Math.min(1 - win, c - win / 2)) / Math.max(1e-6, 1 - win);
};

function zoompan(fx, fy, W, H) {
  const nx = ZOOM.map((z) => toTopLeft(fx, z));
  const ny = ZOOM.map((z) => toTopLeft(fy, z));
  return `zoompan=z='${lerp(ZOOM)}':x='(iw-iw/zoom)*${lerp(nx)}':` +
         `y='(ih-ih/zoom)*${lerp(ny)}':d=1:s=${W}x${H}:fps=${FPS}`;
}

function build(name) {
  const r = RATIOS[name];
  const out = resolve(DST, `chunhyang_${name}.mp4`);
  const enc = ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
               '-pix_fmt', 'yuv420p', '-r', String(FPS), '-t', String(DUR)];
  let vf;

  if (r.mode === 'crop') {
    // 원본에서 비율만큼 잘라낸다 (가로는 항상 원본 전폭 — 세로 소스라 가로가 병목)
    const cw = Math.min(SW, Math.round(SH * r.w / r.h));
    const ch = Math.min(SH, Math.round(cw * r.h / r.w));
    const x = Math.round(Math.max(0, Math.min(SW - cw, EYE.x * SW - cw / 2)));
    const y = Math.round(Math.max(0, Math.min(SH - ch, EYE.y * SH - ch * r.anchor)));
    // 잘라낸 창 안에서의 눈 위치 → 그쪽으로 밀고 들어간다
    const fx = (EYE.x * SW - x) / cw;
    const fy = (EYE.y * SH - y) / ch;
    vf = `crop=${cw}:${ch}:${x}:${y},scale=${r.w * 2}:${r.h * 2}:flags=lanczos,` +
         `${zoompan(fx, fy, r.w, r.h)},${GRADE}`;
    console.log(`  ${name}  crop ${cw}x${ch} @${x},${y}`);
  } else {
    // 흐린 확대본을 배경으로 깔고 원본을 통째로 얹는다 — 카드가 잘리지 않는다
    const fgW = Math.round(r.h * SW / SH);
    vf = `[0:v]scale=${r.w * 2}:${r.h * 2}:force_original_aspect_ratio=increase,` +
         `crop=${r.w * 2}:${r.h * 2},gblur=sigma=42,eq=brightness=-0.12:saturation=0.7,` +
         `scale=${r.w}:${r.h}[bg];` +
         `[0:v]scale=${fgW * 2}:${r.h * 2}:flags=lanczos,${zoompan(EYE.x, EYE.y, fgW, r.h)}[fg];` +
         `[bg][fg]overlay=(W-w)/2:0,${GRADE}`;
    console.log(`  ${name}  fit ${fgW}x${r.h} + blur bg`);
  }

  const filter = r.mode === 'crop' ? ['-vf', vf] : ['-filter_complex', vf];
  ff(['-loop', '1', '-i', SRC, ...filter, ...enc, out]);
  // 정지 컷도 같이 — 배너/썸네일에 그대로 쓴다 (움직임 시작 프레임)
  ff(['-i', out, '-frames:v', '1', resolve(DST, `chunhyang_${name}.png`)]);
  return out;
}

mkdirSync(DST, { recursive: true });
const want = process.argv.slice(2).filter((a) => RATIOS[a]);
const list = want.length ? want : Object.keys(RATIOS);
console.log(`춘향 엔딩 컷 — ${DUR}s, push-in ${ZOOM[0]}→${ZOOM[1]}`);
for (const name of list) build(name);
console.log(`\n완료 → ${DST}`);

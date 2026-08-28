// 골든 대조 러너.
//   node test/golden/run.mjs            대조 (차이가 있으면 exit 1)
//   node test/golden/run.mjs --update   현재 동작을 새 기준선으로 기록
//   node test/golden/run.mjs --twice    같은 코드로 두 번 돌려 하니스 자체의 결정론 확인
//
// 세 갈래로 본다:
//   1) 자연 플레이스루  — 한 판을 깊게 (규칙·점수·정산·주막)
//   2) 오버레이/언어 순회 — 넓게 (안 불리면 티 안 나는 렌더 경로)
//   3) 인라인 핸들러 도달성 — 모듈화로 죽은 버튼이 생겼는지
import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { launch, playthrough, tour, sha, VIEWPORT } from './harness.mjs';
import { collectHandlerNames, findUnreachable, readSources } from './handlers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const GOLD = join(HERE, '__golden__');
const ACTUAL = join(HERE, '__actual__');
// 정산 화면은 숫자가 JS로 올라가는 중간을 찍게 되어 이미지가 매번 달라진다.
// DOM 스냅샷으로는 안정적으로 잡히므로 이미지에서만 뺀다.
const SHOT_SCREENS = new Set(['play', 'gostop', 'shop', 'nightask', 'gameover', 'victory']);
const SHOT = { animations: 'disabled', caret: 'hide', clip: { x: 0, y: 0, ...VIEWPORT } };

async function stabilize(page) {
  await page.evaluate(async () => {
    const hide = (id) => { const el = document.getElementById(id); if (el) el.style.visibility = 'hidden'; };
    hide('cursor-trail');
    hide('boot-load');
    hide('bg-figure');
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((img) => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
    }));
  });
  await page.waitForTimeout(50);
}

// 인라인 핸들러가 들어있는 파일. 마크업이 여러 곳으로 쪼개지면 여기에 추가한다.
const HANDLER_SOURCES = [
  'index.html',
  'src/i18n/index.js',
  'src/state/store.js',
  'src/state/round.js',
  'src/state/actions/play.js',
  'src/state/actions/discard.js',
  'src/state/actions/settle.js',
  'src/state/actions/shop.js',
  'src/state/actions/end.js',
  'src/platform/telemetry.js',
  'src/platform/sfx.js',
  'src/ui/shortcut.js',
  'src/ui/help.js',
  'src/ui/deck.js',
  'src/ui/chunhyang.js',
  'src/ui/render.js',
  'src/ui/juice/preview.js',
  'src/boot.js',
];

const args = process.argv.slice(2);
const update = args.includes('--update');
const twice = args.includes('--twice');
const headless = !args.includes('--headed');

const serializeState = (steps) =>
  JSON.stringify(steps.map((s) => ({ n: s.n, action: s.action, ...s.state })), null, 1) + '\n';

const serializeDom = (steps) =>
  steps
    .map((s) => {
      const body = Object.entries(s.dom).map(([k, v]) => `--- ${k}\n${v}`).join('\n');
      return `===== step ${s.n} · ${s.screen} · ${s.action}\n${body}`;
    })
    .join('\n\n') + '\n';

async function record() {
  const { page, errors, close } = await launch({ root: ROOT, headless });
  try {
    const shots = [];
    const seenShot = new Set();
    const mainSteps = await playthrough(page, {
      async onSnapshot(step, p) {
        // 화면 종류별 첫 등장만 이미지로. 스텝마다 찍으면 대조가 무의미하게 커진다.
        if (!SHOT_SCREENS.has(step.screen) || seenShot.has(step.screen)) return;
        seenShot.add(step.screen);
        await stabilize(p);
        shots.push({ name: `${step.screen}.png`, png: await p.screenshot(SHOT) });
      },
    });

    // 핸들러 검사는 플레이 중 렌더된 DOM이 살아있는 상태에서 한다
    const names = collectHandlerNames(readSources(HANDLER_SOURCES.map((f) => join(ROOT, f))));
    const unreachable = await findUnreachable(page, names);

    return { mainSteps, shots, errors, handlers: { count: names.length, unreachable } };
  } finally {
    await close();
  }
}

async function recordTour() {
  const { page, errors, close } = await launch({ root: ROOT, headless });
  try {
    const steps = await tour(page);
    return { steps, shots: [], errors };
  } finally {
    await close();
  }
}

async function collect() {
  const main = await record();
  const t = await recordTour();
  const errors = [...new Set([...main.errors, ...t.errors])];
  const shots = [...main.shots, ...t.shots];
  return {
    errors,
    handlers: main.handlers,
    files: {
      'state.json': serializeState(main.mainSteps),
      'dom.txt': serializeDom(main.mainSteps),
      'tour-state.json': serializeState(t.steps),
      'tour-dom.txt': serializeDom(t.steps),
      'screens.txt': shots.map((s) => `${s.name} ${sha(s.png)}`).join('\n') + '\n',
    },
    shots,
    stepCount: main.mainSteps.length,
    tourCount: t.steps.length,
  };
}

function firstDiff(a, b) {
  const la = (a ?? '').split('\n');
  const lb = (b ?? '').split('\n');
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) {
      return `    line ${i + 1}\n      golden: ${JSON.stringify(la[i] ?? null)}\n      now   : ${JSON.stringify(lb[i] ?? null)}`;
    }
  }
  return '    (길이만 다름)';
}

function writeSet(dir, run) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'screens'), { recursive: true });
  for (const [name, body] of Object.entries(run.files)) writeFileSync(join(dir, name), body);
  for (const s of run.shots) writeFileSync(join(dir, 'screens', s.name), s.png);
}

const run = await collect();

if (run.errors.length) {
  console.error('페이지 오류가 발생해 기준선을 신뢰할 수 없습니다:');
  for (const e of run.errors.slice(0, 12)) console.error('  ' + e);
  process.exit(1);
}
if (run.stepCount < 8 || run.tourCount < 8) {
  console.error(`플레이스루가 얕습니다 (본편 ${run.stepCount}스텝 / 순회 ${run.tourCount}스텝). 하니스가 화면을 못 넘기고 있습니다.`);
  process.exit(1);
}

if (twice) {
  const again = await collect();
  let ok = true;
  for (const [name, body] of Object.entries(run.files)) {
    const same = again.files[name] === body;
    // 스크린샷은 폰트·디코딩 타이밍에 흔들린다. 동작 계약은 state/DOM.
    if (name === 'screens.txt' && !same) {
      console.log(`  warn: ${name} (픽셀 해시만 다름 — 결정론 검사에서는 무시)`);
      continue;
    }
    console.log(`  ${same ? 'ok' : 'FAIL'}: ${name}`);
    if (!same) { ok = false; console.log(firstDiff(body, again.files[name])); }
  }
  console.log(ok ? '\n하니스 결정론 확인 — 두 번 돌려 동일' : '\n하니스가 결정론적이지 않습니다. 스냅샷 정규화를 손봐야 합니다.');
  process.exit(ok ? 0 : 1);
}

if (update) {
  writeSet(GOLD, run);
  console.log(`기준선 기록 완료 — 본편 ${run.stepCount}스텝 / 순회 ${run.tourCount}스텝 / 스크린샷 ${run.shots.length}장`);
  console.log(`  인라인 핸들러 ${run.handlers.count}개 전부 도달 가능`);
  if (run.handlers.unreachable.length) {
    console.error('  경고: 도달 불가 핸들러 ' + run.handlers.unreachable.join(', '));
    process.exit(1);
  }
  process.exit(0);
}

if (!existsSync(join(GOLD, 'state.json'))) {
  console.error('기준선이 없습니다. 먼저 `npm run golden:update`로 기록하세요.');
  process.exit(1);
}

let bad = 0;
console.log(`골든 대조 — 본편 ${run.stepCount}스텝 / 순회 ${run.tourCount}스텝`);
for (const [name, body] of Object.entries(run.files)) {
  const gold = existsSync(join(GOLD, name)) ? readFileSync(join(GOLD, name), 'utf8') : null;
  if (gold === body) { console.log(`  ok: ${name}`); continue; }
  if (name === 'screens.txt') {
    console.log(`  warn: ${name} (픽셀 해시만 다름 — 동작 계약은 state/DOM)`);
    console.log(firstDiff(gold, body));
    continue;
  }
  bad++;
  console.error(`  FAIL: ${name}`);
  console.error(firstDiff(gold, body));
}

if (run.handlers.unreachable.length) {
  bad++;
  console.error(`  FAIL: 인라인 핸들러 도달성 — ${run.handlers.unreachable.length}개가 전역에서 안 잡힙니다`);
  for (const m of run.handlers.unreachable) console.error('    ' + m);
} else {
  console.log(`  ok: 인라인 핸들러 도달성 (${run.handlers.count}개)`);
}

if (bad) {
  writeSet(ACTUAL, run);
  console.error('\n실제 결과를 test/golden/__actual__ 에 남겼습니다. 의도한 변경이면 --update 로 갱신하세요.');
  process.exit(1);
}
console.log('\n동작 동일 — 통과');

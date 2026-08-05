// 컷별 녹화 — Playwright로 실제 게임을 돌려 영상으로 뽑는다.
// 뷰포트 540×960 @2x = 1080×1920. 게임 자체 모바일 레이아웃(max-width:720px)이
// 9:16을 그대로 채우므로 CSS 변형이 필요 없다.
import { chromium } from 'playwright';
import { mkdirSync, rmSync, readdirSync, renameSync, existsSync,
         readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(HERE, '.build/index.html');
const OUT = resolve(HERE, 'out');

// Playwright의 recordVideo.size는 deviceScaleFactor를 적용하지 않는다.
// 뷰포트보다 큰 size를 주면 페이지가 캔버스 좌상단에 그대로 박히고 나머지가 회색으로 남는다.
// → 뷰포트와 녹화 크기를 반드시 일치시킨다.
// 1920×1080 = 데스크톱 레이아웃(@media min-width:721px). 시네마틱 처리는 assemble에서.
/* 4:5가 주력 규격이다. 16:9로 찍어 크롭하면 좌우가 잘려 정작 안 보인다.
 * → 처음부터 4:5(1440×1800)로 녹화한다. 폭 1440 > 720이라 데스크톱 레이아웃이 뜨고,
 *   출력 1080×1350으로 내려가므로 다운스케일 = 선명하다. */
const VIEW = { width: 1440, height: 1800 };
const DSF = 1;

export async function record(only) {
  if (!existsSync(BUILD)) throw new Error('.build이 없습니다. build-rig.mjs를 먼저 실행하세요.');
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();

  // 씬 목록은 페이지에서 읽는다 (scenes.js가 단일 소스)
  const probe = await browser.newContext({ viewport: VIEW, deviceScaleFactor: DSF });
  const p0 = await probe.newPage();
  await p0.goto(pathToFileURL(BUILD).href + '?capture=0');
  await p0.waitForFunction('typeof window.captureSceneList === "function"', { timeout: 30000 });
  const all = await p0.evaluate('window.captureSceneList()');
  await probe.close();

  const scenes = only ? all.filter((s) => s.id === only) : all;
  if (!scenes.length) throw new Error(`씬을 찾지 못했습니다: ${only}`);

  const results = [];
  for (const sc of scenes) {
    const tmp = resolve(OUT, `.tmp-${sc.id}`);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });

    const ctx = await browser.newContext({
      viewport: VIEW,
      deviceScaleFactor: DSF,
      recordVideo: { dir: tmp, size: { width: VIEW.width, height: VIEW.height } },
      reducedMotion: 'no-preference',
    });
    // 외부 네트워크 차단 — 녹화 중 텔레메트리 노이즈 제거
    await ctx.route('**://**', (r) => {
      const u = r.request().url();
      r[u.startsWith('file:') ? 'continue' : 'abort']();
    });

    const page = await ctx.newPage();
    const logs = [];
    page.on('console', (m) => logs.push(m.text()));

    const url = `${pathToFileURL(BUILD).href}?capture=1&scene=${sc.id}&seed=42`;
    await page.goto(url);
    await page.waitForFunction('window.__captureDone === true', { timeout: sc.record + 60000 });

    const err = await page.evaluate('window.__captureError || null');
    // 씬이 실제로 시작한 지점(ms) — assemble이 여기서부터 자른다
    const startMs = await page.evaluate('window.__captureT0 || 0');
    const marks = await page.evaluate('window.__captureMarks || []');
    const rectLog = await page.evaluate('window.__captureRectLog || []');
    await ctx.close();       // 영상은 context 종료 시점에 확정된다

    const file = readdirSync(tmp).find((f) => f.endsWith('.webm'));
    const dest = resolve(OUT, `scene-${sc.id}.webm`);
    if (!file) throw new Error(`${sc.id}: 영상 파일이 생성되지 않았습니다`);
    rmSync(dest, { force: true });
    renameSync(resolve(tmp, file), dest);
    rmSync(tmp, { recursive: true, force: true });

    console.log(`녹화 ${sc.id} → ${dest}  (씬 시작 ${(startMs / 1000).toFixed(1)}s)` +
                `${err ? `  [씬 오류: ${err}]` : ''}`);
    if (logs.some((l) => l.includes('[rig] 카드를 찾지 못함')))
      console.warn(`  ⚠ ${sc.id}: 지정한 카드 일부를 찾지 못했습니다`);
    results.push({ id: sc.id, use: sc.use, file: dest, startMs, marks, rectLog, error: err });
  }

  await browser.close();

  // assemble이 읽을 매니페스트 — 컷별 시작 오프셋을 넘긴다
  const man = resolve(OUT, 'manifest.json');
  const prev = existsSync(man) ? JSON.parse(readFileSync(man, 'utf8')) : {};
  for (const r of results)
    prev[r.id] = { startMs: r.startMs, use: r.use, marks: r.marks, rectLog: r.rectLog };
  writeFileSync(man, JSON.stringify(prev, null, 2));

  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv.includes('--scene')
    ? process.argv[process.argv.indexOf('--scene') + 1] : null;
  record(only).catch((e) => { console.error(e); process.exit(1); });
}

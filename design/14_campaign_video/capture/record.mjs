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
/* 게임 UI는 높이 618px 고정이다. 1800으로 찍으면 하단 66%가 빈 판이 되고,
 * 그걸 감추려고 카메라를 확대하다 좌측 UI·조커바·팝업이 잘렸다.
 * → 4:5(860×1075)로 찍고 UI를 세로 중앙에 둔다. 확대는 거의 필요 없다. */
/* 뷰포트 == 프레임으로 두면 여백이 0이라 카메라가 조금만 확대·이동해도
 * 가장자리 요소가 바로 잘린다(실제로 상점 모달·조커바가 그랬다).
 * → 뷰포트를 최종 프레임 크기(1080×1350)로 키우고, 게임은 그 안의
 *   860×1075 '무대'에만 그린다(rig.js의 --cap-stage). 둘레는 게임 배경.
 *   assemble의 기본 배율 Z = 1080/860 ≈ 1.256이 그 무대를 꽉 잡는다. */
const VIEW = { width: 1080, height: 1350 };
/* 브라우저 녹화는 25fps 고정이다. 60fps를 보간으로 지어내면 카드가 빠르게 움직일 때
 * 픽셀이 뭉개진다 → 페이지를 SLOW배 느리게 돌려 실제 프레임을 더 얻고,
 * 편집에서 SLOW배 빨리 감는다. 25 × 2.5 = 62.5fps 분량의 진짜 프레임. */
const SLOW = 2.5;
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
    /* 슬로모션 녹화라 씬 하나가 실수(real) 30~60초씩 걸린다.
       Playwright 기본 30초로는 항상 타임아웃 난다. */
    page.setDefaultTimeout(600000);
    const logs = [];
    page.on('console', (m) => logs.push(m.text()));

    // CSS 애니메이션도 같이 느리게 (setTimeout만 늦추면 VFX가 어긋난다)
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });

    const url = `${pathToFileURL(BUILD).href}?capture=1&scene=${sc.id}&seed=42&slow=${SLOW}`;
    await page.goto(url);
    try {
      await page.waitForFunction('window.__captureDone === true',
        { timeout: 600000 });
    } catch (e) {
      // 어디서 멈췄는지 알려준다 — 마지막 마크와 콘솔 로그
      const mk = await page.evaluate('(window.__captureMarks||[]).map(x=>x.name).join(">")');
      console.error(`  ✗ ${sc.id} 타임아웃. 마지막까지 진행된 마크: ${mk || '(없음)'}`);
      logs.slice(-6).forEach((l) => console.error('    ' + l));
      throw e;
    }

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
  for (const r of results) {
    /* 마크·좌표 시각은 나누지 않는다.
     * 리그가 performance.now()를 이미 SLOW배 느리게 패치했으므로
     * 여기 담긴 값은 '빨리감기 기준(=최종 영상 기준)' 시각이다.
     * 여기서 또 나누면 2.5로 두 번 나뉘어 마크가 실제의 40%로 찍히고,
     * 컷들이 서로 겹쳐 같은 장면이 두 번 재생된다. 실제로 그랬다. */
    prev[r.id] = { startMs: r.startMs, use: r.use, slow: SLOW,
                   marks: r.marks, rectLog: r.rectLog };
  }
  writeFileSync(man, JSON.stringify(prev, null, 2));

  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv.includes('--scene')
    ? process.argv[process.argv.indexOf('--scene') + 1] : null;
  record(only).catch((e) => { console.error(e); process.exit(1); });
}

/* 결정론적 60fps 녹화.
 *
 * Playwright의 recordVideo는 25fps 고정, CDP 스크린캐스트는 40fps 남짓에 간격도
 * 불균일하다. 어느 쪽이든 60fps 타임라인에 얹으면 프레임이 복제되거나 보간
 * 아티팩트가 생겨 버벅거린다.
 *
 * 여기서는 브라우저의 가상 시계를 1/60초씩 직접 전진시키고 매 스텝마다 화면을
 * 캡처한다. 실시간이 아니므로 렌더가 느려도 프레임이 절대 누락되지 않는다.
 * → 정확히 60fps, 완전 재현 가능.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(HERE, '.build/index.html');
const OUT = resolve(HERE, 'out');

const VIEW = { width: 1440, height: 1800 };   // 4:5 네이티브
const FPS = 60;
const STEP = 1000 / FPS;                       // 16.667ms
const MAX_FRAMES = 60 * 25;                    // 안전장치: 씬당 25초

export async function recordExact(only) {
  if (!existsSync(BUILD)) throw new Error('.build이 없습니다. build-rig.mjs를 먼저 실행하세요.');
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();

  // 씬 목록 조회
  const probe = await browser.newContext({ viewport: VIEW });
  const pp = await probe.newPage();
  await pp.goto(pathToFileURL(BUILD).href + '?capture=0');
  await pp.waitForFunction('typeof window.captureSceneList === "function"', { timeout: 30000 });
  const all = await pp.evaluate('window.captureSceneList()');
  await probe.close();

  const scenes = only ? all.filter((s) => s.id === only) : all;
  if (!scenes.length) throw new Error(`씬을 찾지 못했습니다: ${only}`);

  const manPath = resolve(OUT, 'manifest.json');
  const man = existsSync(manPath) ? JSON.parse(readFileSync(manPath, 'utf8')) : {};

  for (const sc of scenes) {
    const dir = resolve(OUT, `.frames-${sc.id}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });

    const ctx = await browser.newContext({ viewport: VIEW });
    await ctx.route('**://**', (r) =>
      r[r.request().url().startsWith('file:') ? 'continue' : 'abort']());
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);

    // 가상 시계 준비 — 예산이 소진될 때마다 알림이 온다
    let expire = null;
    cdp.on('Emulation.virtualTimeBudgetExpired', () => { if (expire) expire(); });
    const advance = async (ms) => {
      await new Promise(async (done) => {
        expire = done;
        await cdp.send('Emulation.setVirtualTimePolicy', {
          policy: 'pauseIfNetworkFetchesPending', budget: ms,
        });
      });
      expire = null;
    };

    await cdp.send('Emulation.setVirtualTimePolicy', {
      policy: 'pauseIfNetworkFetchesPending', budget: 0,
    });
    await page.goto(`${pathToFileURL(BUILD).href}?capture=1&scene=${sc.id}&seed=42`);

    // 부팅(폰트·카드 이미지 로딩)까지는 큼직하게 흘려보낸다
    for (let i = 0; i < 60 && !(await page.evaluate('!!window.__captureT0')); i++) {
      await advance(200);
    }

    // 여기서부터 1프레임씩 — 씬이 끝날 때까지
    let n = 0;
    while (n < MAX_FRAMES) {
      const shot = await page.screenshot({ type: 'png' });
      writeFileSync(resolve(dir, `f${String(n).padStart(5, '0')}.png`), shot);
      n++;
      if (await page.evaluate('window.__captureDone === true')) break;
      await advance(STEP);
    }

    const marks = await page.evaluate('window.__captureMarks || []');
    const rectLog = await page.evaluate('window.__captureRectLog || []');
    const t0 = await page.evaluate('window.__captureT0 || 0');
    await ctx.close();

    // PNG 시퀀스 → 정확히 60fps mp4 (무손실에 가깝게)
    const dest = resolve(OUT, `scene-${sc.id}.mp4`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS),
      '-i', resolve(dir, 'f%05d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', dest],
      { stdio: 'inherit' });
    rmSync(dir, { recursive: true, force: true });

    /* 프레임 단위 캡처라 페이지 로드 이전 구간이 없다 → 씬 시작이 곧 0초.
     * 마크 시각도 가상 시계 기준이라 실시간 오차가 없다. */
    man[sc.id] = { startMs: 0, use: sc.use, marks, rectLog, exact: true };
    console.log(`정밀녹화 ${sc.id} → ${dest}  (${n}프레임 = ${(n / FPS).toFixed(1)}초 @60fps)`);
  }

  await browser.close();
  writeFileSync(manPath, JSON.stringify(man, null, 2));
  return scenes.map((s) => s.id);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--scene');
  recordExact(i >= 0 ? process.argv[i + 1] : null)
    .catch((e) => { console.error(e); process.exit(1); });
}

// 엔딩 씬(C6)을 ending.html에서 **영상으로** 굽는다
//   → plates/C6.mp4 · plates/16x9/C6.mp4
//
// 정지 이미지에 카메라만 얹던 방식을 대체한다. 로고 낙하·착지 진동·열두 달의 꽃이
// 전부 페이지 안에서 일어나므로, 여기서는 그걸 한 프레임씩 찍어 이어 붙이기만 한다.
//
// **프레임을 시간으로 재생하지 않는다.** page.renderFrame(t)를 직접 불러
// t = i/60 마다 스크린샷을 찍는다 — 실시간 녹화가 아니라 렌더링이라
// 프레임 드롭이 구조적으로 불가능하다. (본편 녹화가 겪었던 문제를 안 만든다)
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = pathToFileURL(resolve(HERE, 'ending.html')).href;
const TMP = resolve(HERE, '.ending-seq');

const JOBS = [
  { ratio: '4x5', w: 1080, h: 1350, out: 'plates/C6.mp4' },
  { ratio: '16x9', w: 1920, h: 1080, out: 'plates/16x9/C6.mp4' },
];

const browser = await chromium.launch();
for (const j of JOBS) {
  const page = await browser.newPage({ viewport: { width: j.w, height: j.h } });
  await page.goto(`${PAGE}?ratio=${j.ratio}`);
  await page.evaluate(() => document.fonts.ready);
  // 카드·로고 이미지가 아직 안 붙었으면 첫 프레임들이 빈 판으로 찍힌다
  await page.waitForFunction(() =>
    [...document.images].every((i) => i.complete) && !!window.renderFrame);

  const { DUR, FPS } = await page.evaluate(() => window.ENDING);
  const frames = Math.round(DUR * FPS);
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });

  const stage = page.locator('#plate');
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / FPS);
    await stage.screenshot({ path: resolve(TMP, `f${String(i).padStart(5, '0')}.png`) });
  }
  await page.close();

  const dst = resolve(HERE, j.out);
  mkdirSync(dirname(dst), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS),
    '-i', resolve(TMP, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', dst]);
  rmSync(TMP, { recursive: true, force: true });
  console.log(`엔딩 → ${j.out}  (${j.w}×${j.h} · ${frames}프레임 / ${DUR}초)`);
}
await browser.close();

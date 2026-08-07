// 컷별 녹화 — Playwright로 실제 게임을 돌려 영상으로 뽑는다.
// 뷰포트 540×960 @2x = 1080×1920. 게임 자체 모바일 레이아웃(max-width:720px)이
// 9:16을 그대로 채우므로 CSS 변형이 필요 없다.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, renameSync, existsSync,
         readFileSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { linkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUILD = resolve(HERE, '.build/index.html');
const OUT = resolve(HERE, 'out');

/* ── 캡처 방식: recordVideo(VP8) → **CDP 스크린캐스트(무손실 PNG)** ──────────
 * Playwright의 recordVideo는 비트레이트를 못 건드린다. 실측 결과 1080×1350을
 * **0.77~0.90 Mbps**짜리 VP8로 찍고 있었다 — 그걸 60% 잘라 1.3배 확대하니
 * 화질이 뭉갤 수밖에 없었다. 화질 저하의 압도적 1순위가 여기였다.
 * → Page.startScreencast로 PNG 프레임을 그대로 받아 무손실로 모은 뒤
 *   ffmpeg로 고품질 h264(CRF 12)로 굽는다. 캡처 단계 손실 0.
 *
 * 해상도는 못 올린다: 스크린캐스트도 recordVideo도 **CSS 뷰포트 크기에 고정**이고
 * deviceScaleFactor를 무시한다(DSF 2·3으로 실측 확인 — 둘 다 1080×1350).
 * 더 키우려면 페이지 레이아웃 자체를 확대해야 하는데 오버레이 좌표계가 전부
 * 흔들린다(19차에서 통일한 것) → 지금은 손실 제거만 취한다. */
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
/* 캡처 프로필. rig.js의 PROFILES와 **같은 값**이어야 한다 — 한쪽만 고치면
   무대가 뷰포트 밖으로 나가거나 여백이 어긋난다. */
const PROFILES = {
  '4x5':  { width: 1080, height: 1350 },
  '16x9': { width: 1920, height: 1080 },
};
const RATIO = process.argv.includes('--ratio')
  ? process.argv[process.argv.indexOf('--ratio') + 1] : '4x5';
const VIEW = PROFILES[RATIO] || PROFILES['4x5'];
/* 산출물을 비율마다 분리한다. 4:5 결과물이 가로 작업에 덮이면 안 된다. */
const SFX = RATIO === '4x5' ? '' : `-${RATIO}`;
/* 브라우저 녹화는 25fps 고정이다. 60fps를 보간으로 지어내면 카드가 빠르게 움직일 때
 * 픽셀이 뭉개진다 → 페이지를 SLOW배 느리게 돌려 실제 프레임을 더 얻고,
 * 편집에서 SLOW배 빨리 감는다. 25 × 2.5 = 62.5fps 분량의 진짜 프레임. */
/* 2.5로는 부족했다. 출력 60fps를 채우려면 실시간 캡처가 60/SLOW fps는 나와야 하는데,
   SLOW=2.5면 24fps가 필요하고 스크린캐스트가 국소적으로 그 아래로 떨어졌다
   (패 내는 구간에서 출력 프레임의 29%가 중복이었다).
   4.0으로 올리면 15fps만 나오면 되므로 여유가 4배 가까이 생긴다.
   대가는 녹화 시간뿐이다 — 지어낸 프레임은 여전히 0장(R5). */
const SLOW = 4.0;
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

    /* 무손실 프레임 수집. 스크린캐스트는 '바뀐 프레임'만 밀어주므로 도착 시각을
       같이 적어 두고, 나중에 그 간격 그대로 concat한다 — 정지 구간이 길어도
       타임라인이 안 밀린다. ack를 빼먹으면 그 뒤로 프레임이 안 온다. */
    const frames = [];
    let dropped = 0, pending = 0;
    cdp.on('Page.screencastFrame', (f) => {
      /* **ack를 먼저 보낸다.** 예전엔 PNG를 동기(writeFileSync)로 쓴 뒤에 ack해서,
         쓰는 동안 크롬이 다음 프레임을 못 보냈다 — 실측 34fps가 나왔지만 중간중간
         1~2초씩 통째로 비었다. ack를 먼저 하면 쓰기와 캡처가 겹쳐 돌아간다. */
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
      const n = String(frames.length).padStart(6, '0');
      frames.push(f.metadata.timestamp);
      pending++;
      writeFile(resolve(tmp, `f${n}.png`), Buffer.from(f.data, 'base64'))
        .catch(() => { dropped++; })
        .finally(() => { pending--; });
    });
    await cdp.send('Page.startScreencast',
      { format: 'png', everyNthFrame: 1, maxWidth: VIEW.width, maxHeight: VIEW.height });

    const url = `${pathToFileURL(BUILD).href}?capture=1&scene=${sc.id}` +
                `&seed=42&slow=${SLOW}&ratio=${RATIO}`;
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

    await cdp.send('Page.stopScreencast').catch(() => {});
    await new Promise((r) => setTimeout(r, 400));   // 마지막 프레임이 도착할 여유
    while (pending > 0) await new Promise((r) => setTimeout(r, 50));   // 쓰기 완료 대기

    const err = await page.evaluate('window.__captureError || null');
    // 씬이 실제로 시작한 지점(ms) — assemble이 여기서부터 자른다
    const startMs = await page.evaluate('window.__captureT0 || 0');
    const marks = await page.evaluate('window.__captureMarks || []');
    const rectLog = await page.evaluate('window.__captureRectLog || []');
    await ctx.close();       // 영상은 context 종료 시점에 확정된다

    if (frames.length < 10)
      throw new Error(`${sc.id}: 프레임을 ${frames.length}장밖에 못 받았습니다`);

    /* 프레임을 **타임스탬프 기준으로 CFR 슬롯에 직접 배치**한다.
     *
     * concat 디먹서 + duration 방식은 안 된다: 내부 image2 디먹서가 25fps로
     * 타임스탬프를 양자화해서, 29ms 간격(≈35fps)으로 들어온 프레임을 40ms 버킷에
     * 뭉갠다 — 실측 624장이 292장으로 반토막 났고 그게 곧 버벅임이었다.
     * (`-r`을 입력에 주면 이번엔 duration을 통째로 무시해 길이가 망가진다)
     *
     * SRC_FPS는 캡처 속도(≈35fps)보다 높게 잡는다. 그래야 캡처된 프레임이
     * 하나도 안 버려지고, 빈 슬롯만 직전 프레임으로 채워진다.
     * 소스는 2.5배속으로 재생되므로 출력 60fps를 채우려면 소스가 24fps면 충분하다. */
    const SRC_FPS = 60;
    const t0 = frames[0];
    const span = frames[frames.length - 1] - t0;
    const slots = Math.max(1, Math.round(span * SRC_FPS));
    const seq = resolve(tmp, 'seq');
    mkdirSync(seq, { recursive: true });
    let fi = 0;
    for (let i = 0; i < slots; i++) {
      const t = i / SRC_FPS;
      while (fi + 1 < frames.length && frames[fi + 1] - t0 <= t) fi++;
      linkSync(resolve(tmp, `f${String(fi).padStart(6, '0')}.png`),
               resolve(seq, `s${String(i).padStart(6, '0')}.png`));
    }

    const dest = resolve(OUT, `scene-${sc.id}${SFX}.mp4`);
    rmSync(dest, { force: true });
    rmSync(resolve(OUT, `scene-${sc.id}${SFX}.webm`), { force: true });  // 옛 저화질본 제거
    /* CRF 12 = 사실상 무손실. 여기서 아끼면 뒤의 크롭·확대에서 그대로 드러난다. */
    execFileSync('ffmpeg', ['-y', '-v', 'error',
      '-framerate', String(SRC_FPS), '-i', resolve(seq, 's%06d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '12',
      '-pix_fmt', 'yuv420p', dest]);
    const enc = +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v',
      '-count_frames', '-show_entries', 'stream=nb_read_frames',
      '-of', 'csv=p=0', dest]).toString().trim();
    if (enc < slots * 0.99)
      console.warn(`  ⚠ ${sc.id}: 슬롯 ${slots}개 중 ${enc}개만 인코딩됐습니다`);
    rmSync(tmp, { recursive: true, force: true });

    const secs = frames[frames.length - 1] - frames[0];
    console.log(`녹화 ${sc.id} → ${dest}  (씬 시작 ${(startMs / 1000).toFixed(1)}s · ` +
                `무손실 ${frames.length}프레임 / ${secs.toFixed(1)}s = ${(frames.length / secs).toFixed(1)}fps)` +
                `${dropped ? `  [프레임 유실 ${dropped}]` : ''}` +
                `${err ? `  [씬 오류: ${err}]` : ''}`);
    if (logs.some((l) => l.includes('[rig] 카드를 찾지 못함')))
      console.warn(`  ⚠ ${sc.id}: 지정한 카드 일부를 찾지 못했습니다`);
    results.push({ id: sc.id, use: sc.use, file: dest, startMs, marks, rectLog, error: err });
  }

  await browser.close();

  // assemble이 읽을 매니페스트 — 컷별 시작 오프셋을 넘긴다
  const man = resolve(OUT, `manifest${SFX}.json`);
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
  console.log(`프로필 ${RATIO} — 뷰포트 ${VIEW.width}×${VIEW.height}`);
  record(only).catch((e) => { console.error(e); process.exit(1); });
}

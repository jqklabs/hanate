/* 카메라 검산기 — 합성 전에 프레임이 튀는지 **숫자로** 잡는다.
 *
 * 19차 이전엔 컷마다 보는 곳(look)이 'center'(뷰포트 상수 0.5) / 'anchor'(씬마다
 * 다른 값) / 'cards'(판 중에 14% 움직임)로 갈려 있었고, 아무도 그걸 몰랐다.
 * 눈으로 찾으려면 매번 60초짜리를 다시 뽑아야 했다.
 *
 * 검사 항목
 *   ① 세로 점프  이웃 컷의 크롭 중심이 JUMP_MAX 넘게 차이나면 화면이 툭 튄다
 *   ② 줌 역행    같은 판 안에서 배율이 내려가면 되돌아가는 줌이다(R4 위반)
 *   ③ 클램프     크롭 창이 화면 밖으로 나가면 ffmpeg가 조용히 잘라내
 *                요청한 중심이 **아예 안 지켜진다**
 *   ④ rect 부재  그 시각 rectLog에 look 키가 없으면 엉뚱한 곳을 본다
 *
 * 사용: node check-camera.mjs          (assemble.mjs가 시작할 때 자동으로도 부른다)
 */
const JUMP_MAX = 0.02;      // 프레임 높이의 2% — 이보다 크면 눈에 보인다

/** 크롭 창의 위/아래 경계(0~1). ffmpeg zoompan의 y 식과 같은 계산이다. */
function window1D(c, zoom) {
  const half = 0.5 / zoom;
  let top = c - half;
  if (top < 0) top = 0;                     // ffmpeg의 max(0, …)
  if (top > 1 - 2 * half) top = 1 - 2 * half;  // min(ih - ih/zoom, …)
  return { top, bot: top + 2 * half, clamped: Math.abs(top - (c - half)) > 1e-6 };
}

export function checkCamera(cuts, { markAt, rectsAt, one, log = console } = {}) {
  const rows = [];
  let warn = 0;
  const say = (m) => { warn++; log.warn('  ⚠ ' + m); };

  let prev = null;
  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i];
    if (cut.kind === 'plate') { prev = null; continue; }   // 플레이트는 다른 소스다

    const at = markAt(cut.src, cut.at);
    const use = cut.to
      ? Math.max(0.2, (markAt(cut.src, cut.to).t - at.t) / (cut.speed || 1))
      : cut.use;
    const rects = rectsAt(cut.src, (at.t - markAt(cut.src, [cut.at[0], 0]).t + at.t) * 0);
    // rectsAt은 씬 상대 ms를 받는다 — 마크 자체의 rects로 충분하다
    const R = at.rects || {};
    const want = Array.isArray(cut.look) ? cut.look[0] : (cut.look || 'frame');

    if (!R[want]) say(`#${i} ${cut.src}: '${want}' 좌표가 그 시점에 없습니다`);

    const f = R[want] || { cx: 0.5, cy: 0.5 };
    const zz = cut.cam.zoom ?? cut.cam.z;
    const [z0, z1] = Array.isArray(zz) ? zz : [zz, zz];

    const w0 = window1D(f.cy, z0), w1 = window1D(f.cy, z1);
    if (w0.clamped || w1.clamped)
      say(`#${i} ${cut.src}: 크롭이 화면 밖으로 나가 클램프됩니다 ` +
          `(cy ${f.cy.toFixed(3)} · zoom ${z0.toFixed(3)}) — 요청한 중심이 안 지켜집니다`);

    const cStart = (w0.top + w0.bot) / 2, cEnd = (w1.top + w1.bot) / 2;
    if (prev) {
      const dy = Math.abs(cStart - prev.cEnd);
      if (dy > JUMP_MAX)
        say(`#${prev.i} → #${i} (${cut.src}): 세로로 ${(dy * 100).toFixed(1)}% 튑니다 ` +
            `(${prev.cEnd.toFixed(3)} → ${cStart.toFixed(3)})`);
      if (z0 < prev.z1 - 1e-6)
        say(`#${prev.i} → #${i} (${cut.src}): 배율이 ${prev.z1.toFixed(3)} → ` +
            `${z0.toFixed(3)}으로 **내려갑니다** — 되돌아가는 줌은 금지(R4)`);
    }
    rows.push([i, cut.src, want, f.cy.toFixed(3),
               z0 === z1 ? z0.toFixed(3) : `${z0.toFixed(3)}→${z1.toFixed(3)}`,
               `${w0.top.toFixed(3)}~${w0.bot.toFixed(3)}`, use.toFixed(2)]);
    prev = { i, cEnd, z1 };
  }

  log.log('  카메라 검산 — 컷 ' + rows.length + '개');
  for (const r of rows)
    log.log(`   #${String(r[0]).padStart(2)} ${r[1]} look=${r[2]} cy=${r[3]} ` +
            `zoom=${r[4]} crop=${r[5]} ${r[6]}s`);
  log.log(warn ? `  ⚠ 경고 ${warn}건` : '  ✓ 세로 점프·줌 역행·클램프·좌표 부재 없음');
  return warn;
}

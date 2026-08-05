/* 영상 전용 이펙트 레이어.
 *
 * 게임 본편의 연출은 절제돼 있지만 광고 영상에서는 크게 터져야 한다.
 * 후보정(ffmpeg)이 아니라 화면 안에서 터뜨려야 카드·숫자와 물리적으로 붙어 보인다.
 *
 * 모든 요소는 <html> 바로 아래에 fixed로 얹는다 — render()가 #app을 다시 그려도
 * 지워지지 않는다. ?capture=1일 때만 로드된다.
 */
(function () {
  const CSS = `
  #vfx-layer {
    position: fixed; inset: 0; z-index: 99998;
    pointer-events: none; overflow: hidden;
  }
  /* 전체화면 백색 점멸은 광과민성 위험이 크고, 같은 모양이 반복되면
     "밑도 끝도 없는 깜빡임"으로 읽힌다. 정말 큰 순간에만 쓴다. */
  .vfx-flash {
    position: absolute; inset: 0;
    animation: vfxFlash var(--d, 620ms) cubic-bezier(.1,.7,.3,1) forwards;
  }
  @keyframes vfxFlash {
    0%   { opacity: 0; }
    9%   { opacity: 1; }
    100% { opacity: 0; }
  }
  /* 가장자리에서 번지는 글로우 — 점멸 대신 쓰는 부드러운 강조 */
  .vfx-glow {
    position: absolute; inset: 0;
    animation: vfxGlow var(--d, 620ms) cubic-bezier(.15,.8,.3,1) forwards;
  }
  @keyframes vfxGlow {
    0%   { opacity: 0; }
    22%  { opacity: 1; }
    100% { opacity: 0; }
  }
  .vfx-ring {
    position: absolute; border-radius: 50%;
    border: 7px solid rgba(255, 214, 130, .95);
    box-shadow: 0 0 34px rgba(255,196,90,.85);
    will-change: transform, opacity;
    transform: translate(-50%, -50%) scale(.06); opacity: 1;
    animation: vfxRing var(--d, 900ms) cubic-bezier(.16,.9,.3,1) forwards;
  }
  @keyframes vfxRing {
    0%   { transform: translate(-50%,-50%) scale(.06); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
  }
  .vfx-rays {
    position: absolute; width: 1500px; height: 1500px;
    will-change: transform, opacity;
    transform: translate(-50%, -50%) rotate(0deg) scale(.2);
    background: conic-gradient(from 0deg,
      rgba(255,205,110,.85) 0deg 3deg, transparent 3deg 22deg,
      rgba(255,205,110,.6) 22deg 25deg, transparent 25deg 45deg);
    mask-image: radial-gradient(circle, #000 12%, transparent 62%);
    -webkit-mask-image: radial-gradient(circle, #000 12%, transparent 62%);
    animation: vfxRays var(--d, 1100ms) cubic-bezier(.1,.8,.3,1) forwards;
  }
  @keyframes vfxRays {
    0%   { transform: translate(-50%,-50%) rotate(0deg)  scale(.15); opacity: 0; }
    12%  { opacity: .95; }
    100% { transform: translate(-50%,-50%) rotate(26deg) scale(1.15); opacity: 0; }
  }
  .vfx-spark {
    position: absolute; width: 10px; height: 10px; border-radius: 50%;
    will-change: transform, opacity;
    background: radial-gradient(circle, #fff6dc 0%, #ffc75a 45%, rgba(255,160,40,0) 72%);
    animation: vfxSpark var(--d, 950ms) cubic-bezier(.12,.7,.35,1) forwards;
  }
  @keyframes vfxSpark {
    0%   { transform: translate(-50%,-50%) translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(-50%,-50%) translate(var(--dx), var(--dy)) scale(.25); opacity: 0; }
  }
  .vfx-text {
    position: absolute;
    transform: translate(-50%,-50%) scale(.35);
    font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
    font-size: 190px; line-height: 1; white-space: nowrap;
    color: #ffe9b0;
    text-shadow: 0 0 22px rgba(255,180,60,.95), 0 0 70px rgba(255,150,30,.75),
                 0 8px 0 rgba(120,40,0,.55);
    animation: vfxText var(--d, 1500ms) cubic-bezier(.14,1.5,.3,1) forwards;
  }
  @keyframes vfxText {
    0%   { transform: translate(-50%,-50%) scale(.45); opacity: 0; }
    14%  { transform: translate(-50%,-50%) scale(1.14); opacity: 1; }
    24%  { transform: translate(-50%,-50%) scale(1.00); }
    90%  { transform: translate(-50%,-50%) scale(1.00); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.00); opacity: 0; }
  }
  /* 족보 엠블럼 — 글자 뒤에서 화려하게 터진다. 화투패 그림체로 만든 이미지 */
  /* 폭을 88vw로 두면 족보 글자와 서로 가린다 → 72vw로 줄이고 세로로 떼어 놓는다 */
  .vfx-emblem {
    position: absolute; transform: translate(-50%,-50%) scale(.5) rotate(-8deg);
    width: calc(var(--cap-stage, 100vw) * .80); height: auto; opacity: 0;
    animation: vfxEmblem var(--d, 1700ms) cubic-bezier(.13,1.3,.3,1) forwards;
  }
  /* 들이치고 **멈춘다.** 예전엔 마지막에 1.02 → 1.12로 계속 커져서
     정지 컷인데도 화면이 밀리는(=카메라가 움직이는) 것처럼 보였다. */
  @keyframes vfxEmblem {
    0%   { transform: translate(-50%,-50%) scale(.62) rotate(-6deg); opacity: 0; }
    14%  { transform: translate(-50%,-50%) scale(1.04) rotate(0deg); opacity: 1; }
    22%  { transform: translate(-50%,-50%) scale(1.00) rotate(0deg); }
    88%  { transform: translate(-50%,-50%) scale(1.00) rotate(0deg); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.00) rotate(0deg); opacity: 0; }
  }

  /* 고 스탬프 — 도장처럼 찍히고 위로 밀리며 사라진다 */
  .vfx-gostamp {
    position: absolute; transform: translate(-50%,-50%) scale(1.7);
    font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
    line-height: 1; white-space: nowrap; will-change: transform, opacity;
    animation: vfxGoStamp var(--d, 560ms) cubic-bezier(.1,1.1,.3,1) forwards;
  }
  @keyframes vfxGoStamp {
    0%   { transform: translate(-50%,-50%) scale(1.8) rotate(var(--r, -6deg)); opacity: 0; }
    16%  { transform: translate(-50%,-50%) scale(1.00) rotate(0deg); opacity: 1; }
    58%  { transform: translate(-50%,-50%) scale(1.02) rotate(0deg); opacity: 1; }
    100% { transform: translate(-50%,-50%) translateY(-34%) scale(1.16) rotate(0deg); opacity: 0; }
  }

  /* 엠블럼 뒤 딤 — 뚫린 가운데로 비치는 카드를 가라앉혀 글자를 띄운다 */
  .vfx-emblem-dim {
    position: absolute; transform: translate(-50%,-50%);
    width: calc(var(--cap-stage, 100vw) * 1.5);
    height: calc(var(--cap-stage, 100vw) * 1.5);
    border-radius: 50%; opacity: 0;
    background: radial-gradient(circle,
      rgba(4,10,8,.62) 0%, rgba(4,10,8,.5) 38%, rgba(4,10,8,0) 66%);
    animation: vfxEmblemDim var(--d, 1700ms) ease-out forwards;
  }
  @keyframes vfxEmblemDim {
    0%   { opacity: 0 } 14% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0 }
  }

  /* 숫자가 오를 때 튀어오르는 잔상 */
  .vfx-ghost {
    position: absolute; transform: translate(-50%,-50%) scale(1);
    font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
    line-height: 1; white-space: nowrap; color: #ffe6a8;
    text-shadow: 0 0 18px rgba(255,190,80,.95), 0 0 48px rgba(255,150,30,.7);
    animation: vfxGhost var(--d, 520ms) cubic-bezier(.1,.8,.3,1) forwards;
  }
  @keyframes vfxGhost {
    0%   { transform: translate(-50%,-50%) scale(1);   opacity: .95; }
    100% { transform: translate(-50%,-50%) scale(2.1); opacity: 0; }
  }
  /* A에서 B로 실제로 '날아가는' 요소.
     .vfx-ghost는 제자리에서 커지며 사라질 뿐이라 이동 연출이 안 된다.
     dx/dy만큼 포물선(arc)으로 이동하고 도착 지점에서 멈춘다. */
  .vfx-fly {
    position: absolute; transform-origin: 50% 50%;
    will-change: transform, opacity;
    animation: vfxFly var(--d, 560ms) cubic-bezier(.32,.06,.24,1) forwards;
  }
  @keyframes vfxFly {
    0%   { transform: translate(-50%,-50%) translate(0,0) scale(var(--s0,1)) rotate(0deg); opacity: 0; }
    12%  { opacity: 1; }
    55%  { transform: translate(-50%,-50%)
             translate(calc(var(--dx) * .55), calc(var(--dy) * .55 - var(--arc, 90px)))
             scale(calc((var(--s0,1) + var(--s1,1)) / 2)) rotate(var(--rot, 10deg)); opacity: 1; }
    100% { transform: translate(-50%,-50%) translate(var(--dx), var(--dy))
             scale(var(--s1,1)) rotate(0deg); opacity: 1; }
  }

  /* 게이지가 목표를 넘는 순간 뻗는 광선 */
  .vfx-beam {
    position: absolute; height: 6px; transform: translate(-50%,-50%) scaleX(.1);
    background: linear-gradient(90deg, transparent, #ffd98a 18%, #fff7e0 50%, #ffd98a 82%, transparent);
    box-shadow: 0 0 30px rgba(255,200,110,.95);
    animation: vfxBeam var(--d, 700ms) cubic-bezier(.1,.85,.25,1) forwards;
  }
  @keyframes vfxBeam {
    0%   { transform: translate(-50%,-50%) scaleX(.08) scaleY(2.6); opacity: 0; }
    18%  { opacity: 1; }
    100% { transform: translate(-50%,-50%) scaleX(1) scaleY(.5); opacity: 0; }
  }

  /* 특수패에서 점수판으로 날아가는 에너지 빔.
     이게 없으면 관객은 상단 바가 왜 깜빡이는지 알 수 없다. */
  .vfx-shot {
    position: absolute; height: 16px; transform-origin: 0 50%;
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(255,240,200,0), #ffe6a8 22%, #fff8e6 60%, #ffd070);
    box-shadow: 0 0 34px rgba(255,225,150,1), 0 0 80px rgba(255,180,70,.9);
    animation: vfxShot var(--d, 380ms) cubic-bezier(.2,.9,.3,1) forwards;
  }
  @keyframes vfxShot {
    0%   { transform: rotate(var(--a)) scaleX(0);    opacity: 0; }
    12%  { opacity: 1; }
    70%  { transform: rotate(var(--a)) scaleX(1);    opacity: 1; }
    100% { transform: rotate(var(--a)) scaleX(1);    opacity: 0; }
  }
  /* 빔이 꽂히는 순간 점수판이 얻어맞는다 */
  .vfx-hit {
    position: absolute; width: 420px; height: 420px; border-radius: 50%;
    transform: translate(-50%,-50%) scale(.2);
    background: radial-gradient(circle, rgba(255,248,224,.95) 0%, rgba(255,196,90,.55) 42%, transparent 70%);
    animation: vfxHit 420ms cubic-bezier(.15,.9,.3,1) forwards;
  }
  @keyframes vfxHit {
    0%   { transform: translate(-50%,-50%) scale(.2); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
  }

  /* 「주막 발견!」 — 상점 진입 전 큰 배너. 이미지 + 글자가 함께 들이친다 */
  /* 이미지가 화면을 꽉 채우고 글씨는 그 위에 오버레이 */
  .vfx-discover {
    position: absolute;
    /* 뷰포트 전체(inset:0)로 두면 무대 밖 여백까지 그려서 프레임에선 확대돼 보인다 */
    inset: calc((100vh - var(--cap-stage-h, 100vh)) / 2)
           calc((100vw - var(--cap-stage, 100vw)) / 2);
    animation: vfxDiscover var(--d, 2200ms) cubic-bezier(.12,1.4,.3,1) forwards;
  }
  .vfx-discover img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: contain;
  }
  .vfx-discover span {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%,-50%);
    font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
    font-size: calc(var(--cap-stage, 100vw) * .142); line-height: 1;
    color: #ffe9b0; white-space: nowrap;
    text-shadow: 0 0 26px rgba(255,180,60,.95), 0 0 80px rgba(255,150,30,.8),
                 0 10px 0 rgba(120,40,0,.5);
  }
  /* 배너는 '싹' 들이치고 **멈춘다.**
     예전엔 1.12 → 1.00 → 1.03 → 1.08로 내내 스멀스멀 커져서
     카메라가 흘러내리는 것처럼 보였다. 정지 구간을 길게 잡는다. */
  @keyframes vfxDiscover {
    0%   { opacity: 0; transform: scale(1.22) translateY(4%); }
    9%   { opacity: 1; transform: scale(0.99) translateY(0); }
    14%  { transform: scale(1.00) translateY(0); }
    88%  { opacity: 1; transform: scale(1.00) translateY(0); }
    100% { opacity: 0; transform: scale(1.02) translateY(-2%); }
  }

  /* 점수 팝업 — 좌측 점수창 대신 화면 가운데에 크게 띄운다.
     top 15%는 카메라 중앙이 아니었다. 합산 순간에만 뜨므로 정중앙이 맞다. */
  .vfx-scorepop {
    position: absolute; left: 50%; top: var(--cap-pop-y, 50%);
    transform: translate(-50%,-50%) scale(.8);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 26px 54px; border-radius: 20px;
    background: linear-gradient(180deg, rgba(12,26,20,.92), rgba(6,16,12,.96));
    border: 3px solid rgba(255,214,130,.85);
    box-shadow: 0 0 60px rgba(255,190,80,.45), inset 0 0 30px rgba(255,190,80,.12);
    font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
    animation: vfxScorePop var(--d, 1800ms) cubic-bezier(.14,1.4,.3,1) forwards;
  }
  .vfx-scorepop .sp-month {
    font-size: 42px; color: #dff0df; letter-spacing: -.02em;
  }
  .vfx-scorepop .sp-num {
    font-size: 112px; line-height: 1; color: #ffe9b0; white-space: nowrap;
    text-shadow: 0 0 24px rgba(255,180,60,.95), 0 0 70px rgba(255,150,30,.7);
  }
  .vfx-scorepop .sp-bar {
    width: 430px; height: 14px; border-radius: 8px;
    background: rgba(255,255,255,.14); overflow: hidden;
  }
  /* 게이지는 팝업 수명 내내 차오르는 게 아니라 '합산되는 그 순간'에 찬다.
     그래서 keyframe이 아니라 transition으로 둔다 (씬이 시점을 쥔다). */
  .vfx-scorepop .sp-fill {
    height: 100%; border-radius: 8px; width: var(--w, 0%);
    background: linear-gradient(90deg, #ffd98a, #fff3d0);
    box-shadow: 0 0 22px rgba(255,205,110,.9);
    transition: width var(--fd, 900ms) cubic-bezier(.2,.9,.3,1);
  }
  @keyframes vfxScorePop {
    0%   { transform: translate(-50%,-50%) scale(.78); opacity: 0; }
    11%  { transform: translate(-50%,-50%) scale(1.05); opacity: 1; }
    20%  { transform: translate(-50%,-50%) scale(1.00); }
    92%  { transform: translate(-50%,-50%) scale(1.00); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.00); opacity: 0; }
  }

  /* 화면 흔들림 — 게임 루트에 건다 (오버레이는 같이 흔들리지 않게) */
  #main.vfx-shake, #topbar.vfx-shake {
    animation: vfxShake var(--d, 620ms) cubic-bezier(.2,.8,.3,1) both;
  }
  @keyframes vfxShake {
    0%   { transform: translate(0,0) }
    12%  { transform: translate(var(--a), calc(var(--a) * -.7)) }
    26%  { transform: translate(calc(var(--a) * -.85), calc(var(--a) * .6)) }
    42%  { transform: translate(calc(var(--a) * .6), calc(var(--a) * .5)) }
    60%  { transform: translate(calc(var(--a) * -.4), calc(var(--a) * -.3)) }
    80%  { transform: translate(calc(var(--a) * .2), calc(var(--a) * .15)) }
    100% { transform: translate(0,0) }
  }`;

  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  const layer = document.createElement('div');
  layer.id = 'vfx-layer';
  document.documentElement.appendChild(layer);

  const add = (el, life) => {
    layer.appendChild(el);
    setTimeout(() => el.remove(), life);
    return el;
  };

  /* 오버레이가 뜰 y. 리그가 카드를 낸 자리를 앵커로 얼려두면 그 값을 쓴다.
     카메라도 같은 앵커를 보므로 엠블럼·팝업이 프레임 정중앙에 정확히 온다.
     앵커가 없으면(손패 단계·상점) 화면 중앙. */
  const focusY = () => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--cap-focus-y').trim();
    return parseFloat(v) || innerHeight / 2;
  };

  /** 화면상 좌표를 잡는다. 대상이 없으면 화면 중앙. */
  function at(sel) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, ok = false;
    for (const s2 of [].concat(sel || [])) {
      for (const e of document.querySelectorAll(s2)) {
        const q = e.getBoundingClientRect();
        if (q.width < 4 || q.height < 4) continue;
        l = Math.min(l, q.left); t = Math.min(t, q.top);
        r = Math.max(r, q.right); b = Math.max(b, q.bottom); ok = true;
      }
    }
    // 패널 중심이 아니라 '카드가 실제로 있는 곳'. 없으면 화면 중앙.
    if (!ok) return { x: innerWidth / 2, y: innerHeight / 2 };
    return { x: (l + r) / 2, y: (t + b) / 2 };
  }

  /* 이펙트 기본 앵커 — 낸 카드 위. 카메라도 여기를 보므로 항상 화면 중앙에서 터진다. */
  const CARDS = ['#playedarea .card'];

  const VFX = {
    /** 전체 화면 섬광 */
    flash(color = 'rgba(255,238,200,.92)', d = 620) {
      const el = document.createElement('div');
      el.className = 'vfx-flash';
      el.style.background = color;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 80);
    },

    /* 화면 가장자리에서 안쪽으로 번지는 금빛 — 전체 점멸의 대체재.
       화면 중앙 밝기를 건드리지 않아 눈이 덜 피로하다. */
    glow(strength = 0.6, d = 640) {
      const el = document.createElement('div');
      el.className = 'vfx-glow';
      el.style.background =
        `radial-gradient(ellipse 78% 66% at 50% 46%, transparent 42%, ` +
        `rgba(255,205,120,${strength * 0.85}) 100%)`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 80);
    },

    /** 충격파 링 */
    ring(sel, { size = 1500, d = 900 } = {}) {
      const { x, y } = at(sel);
      const el = document.createElement('div');
      el.className = 'vfx-ring';
      el.style.cssText += `left:${x}px;top:${y}px;width:${size}px;height:${size}px;`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 80);
    },

    /** 방사형 광선 */
    rays(sel, d = 1100) {
      const { x, y } = at(sel);
      const el = document.createElement('div');
      el.className = 'vfx-rays';
      el.style.cssText += `left:${x}px;top:${y}px;`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 80);
    },

    /** 금빛 파편 — 프레임 드랍을 피해 개수는 절제 */
    sparks(sel, { n = 34, dist = 620, d = 950 } = {}) {
      n = Math.min(n, 30);   // 보간을 안 쓰므로 실제 렌더 비용이 곧 프레임이다
      const { x, y } = at(sel);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + (i % 3) * 0.12;
        const r = dist * (0.45 + ((i * 37) % 100) / 160);
        const el = document.createElement('div');
        el.className = 'vfx-spark';
        const s = 0.7 + ((i * 53) % 100) / 90;
        el.style.cssText += `left:${x}px;top:${y}px;width:${10 * s}px;height:${10 * s}px;`;
        el.style.setProperty('--dx', `${Math.cos(a) * r}px`);
        el.style.setProperty('--dy', `${Math.sin(a) * r + 120}px`);
        el.style.setProperty('--d', d + (i % 5) * 60 + 'ms');
        add(el, d + 400);
      }
    },

    /** 거대 텍스트 (삼광! 같은) */
    /* 족보별 엠블럼 — 글자 뒤에 깔린다. 카메라 중심에서 나오게 화면 중앙 고정. */
    /* 족보 엠블럼 — 문양 링 가운데의 빈 명판에 족보 이름이 들어간다.
     * 엠블럼과 글자를 따로 띄우면 "그림 하나, 글씨 하나"로 따로 논다.
     * 같은 좌표·같은 박자로 겹쳐야 하나의 도장처럼 읽힌다. */
    emblem(hand, d = 1700) {
      const map = { 고도리: 'fx_godori', 병풍: 'fx_byeongpung', 오광: 'fx_ogwang' };
      const f = map[hand];
      if (!f) return;
      /* 엠블럼은 가운데까지 꽉 찬 원형 메달이다(뚫려 있지 않다).
         가운데가 짙은 먹 면이라 그 위에 얹는 족보 글자가 그대로 읽힌다.
         뒤에 얇은 딤만 깔아 판 전체를 한 톤 가라앉힌다. */
      const dim = document.createElement('div');
      dim.className = 'vfx-emblem-dim';
      dim.style.cssText += `left:50%;top:${focusY()}px;`;
      dim.style.setProperty('--d', d + 'ms');
      add(dim, d + 120);

      const el = document.createElement('img');
      el.className = 'vfx-emblem';
      el.src = `./${f}.png`;
      el.style.cssText += `left:50%;top:${focusY()}px;`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 120);
    },

    text(str, sel = CARDS, d = 1500, power = 1) {
      /* 엠블럼 한가운데 빈 명판 안에 앉힌다 — 엠블럼과 같은 좌표.
         크기는 뷰포트가 아니라 '무대' 기준이어야 여백까지 계산하지 않는다.
         글자 수가 늘면(고도리 3자) 명판을 넘치므로 자수로 나눠 잡는다. */
      const stage = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--cap-stage')) || innerWidth;
      const { x, y } = { x: innerWidth / 2, y: focusY() };
      const el = document.createElement('div');
      el.className = 'vfx-text';
      el.textContent = str;
      // 링 가운데 뚫린 폭 ≒ 엠블럼의 36%. 글자는 딱 그 안에 채운다
      // 글씨는 큼직해야 읽힌다. 메달 가운데 짙은 면이 넉넉하므로 꽉 채운다
      const hole = stage * 0.80 * 0.50;
      const size = Math.min(stage * 0.21, hole / Math.max(2, str.length));
      /* 엠블럼 가운데가 뚫려 있으므로(검은 명판 없음) 글자 자체가 배경에서 떠야 한다.
         외곽 검은 스트로크 + 다단 발광으로 어떤 그림 위에서도 읽히게 한다. */
      el.style.cssText += `left:${x}px;top:${y}px;font-size:${Math.round(size)}px;` +
        `color:#fff6d8;` +
        `-webkit-text-stroke:${Math.max(3, size * 0.035)}px rgba(28,10,0,.85);` +
        `paint-order:stroke fill;` +
        `text-shadow:0 0 ${Math.round(size * 0.14)}px rgba(255,214,130,1),` +
        `0 0 ${Math.round(size * 0.42)}px rgba(255,170,50,.95),` +
        `0 0 ${Math.round(size * 0.9)}px rgba(255,140,20,.7),` +
        `0 ${Math.round(size * 0.05)}px 0 rgba(70,20,0,.75);`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 100);
    },

    /* 엠블럼이 ×배수 자리로 빨려 들어간다.
     * 족보가 곧 배수라는 인과를 눈으로 보여주는 연결 고리 —
     * 이게 없으면 엠블럼은 그냥 예쁜 그림 한 장으로 끝난다. */
    absorb(sel = '#jt-mult', d = 620) {
      const emb = layer.querySelector('.vfx-emblem');
      const dim = layer.querySelector('.vfx-emblem-dim');
      const txt = layer.querySelector('.vfx-text');
      const t = at(sel);
      for (const e of [emb, txt]) {
        if (!e) continue;
        const q = e.getBoundingClientRect();
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        /* `animation: none`만 걸면 요소가 **기본 스타일로 되돌아간다.**
           .vfx-emblem의 기본은 `opacity: 0`이라 그 순간 통째로 사라져 버렸다
           (그래서 빨려 들어가는 게 아니라 그냥 없어졌다).
           → 현재 상태를 인라인으로 못 박은 다음 다음 프레임에 목표를 준다. */
        e.style.animation = 'none';
        e.style.opacity = '1';
        e.style.transform = 'translate(-50%,-50%) scale(1)';
        void e.offsetWidth;
        requestAnimationFrame(() => {
          e.style.transition =
            `transform ${d}ms cubic-bezier(.5,0,.75,.15), opacity ${d}ms ease-in`;
          e.style.transform =
            `translate(-50%,-50%) translate(${t.x - cx}px, ${t.y - cy}px) scale(.06)`;
          e.style.opacity = '0';
        });
      }
      if (dim) { dim.style.transition = `opacity ${d * 0.7}ms ease`; dim.style.opacity = '0'; }
      // 빨려 들어간 자리에서 배수가 얻어맞는다
      setTimeout(() => {
        const h = document.createElement('div');
        h.className = 'vfx-hit';
        h.style.cssText += `left:${t.x}px;top:${t.y}px;`;
        add(h, 480);
        VFX.ring(null, { size: 520, d: 620 });
        const r = layer.lastChild;
        if (r) { r.style.left = t.x + 'px'; r.style.top = t.y + 'px'; }
        VFX.sparks(null, { n: 18, dist: 320, d: 720 });
        for (const sp of [...layer.querySelectorAll('.vfx-spark')].slice(-18)) {
          sp.style.left = t.x + 'px'; sp.style.top = t.y + 'px';
        }
        VFX.pulse(sel, 620);
      }, d * 0.9);
    },

    /* 「고는 무제한」 — 점수 게이지가 차오르는 그 위에 1고 2고 3고 …를
     * 점점 빨라지며 도장처럼 박는다. 게이지와 같은 자리에서 벌어져야
     * "점수를 밀어 올리는 게 고다"가 한 화면에서 읽힌다. */
    async goRun(to = 10) {
      const pop = document.querySelector('.vfx-scorepop');
      const q = pop && pop.getBoundingClientRect();
      const cx = q ? q.left + q.width / 2 : innerWidth / 2;
      const cy = q ? q.bottom + 40 : innerHeight * 0.6;
      for (let lv = 1; lv <= to; lv++) {
        const p = 1 + lv * 0.1;
        const el = document.createElement('div');
        el.className = 'vfx-gostamp';
        el.textContent = `${lv}고`;
        const size = Math.round(96 * p);
        el.style.cssText += `left:${cx}px;top:${cy}px;font-size:${size}px;` +
          `color:#fff6d8;-webkit-text-stroke:${Math.max(3, size * 0.04)}px rgba(28,10,0,.85);` +
          `paint-order:stroke fill;` +
          `text-shadow:0 0 ${Math.round(size * 0.18)}px rgba(255,214,130,1),` +
          `0 0 ${Math.round(size * 0.5)}px rgba(255,170,50,.95);`;
        el.style.setProperty('--r', (lv % 2 ? -7 : 7) + 'deg');
        el.style.setProperty('--d', '560ms');
        add(el, 620);
        VFX.ring(null, { size: 260 + 70 * lv, d: 420 });
        const r = layer.lastChild;
        if (r) { r.style.left = cx + 'px'; r.style.top = cy + 'px'; }
        if (lv % 4 === 0) VFX.sparks(null, { n: 12, dist: 340, d: 560 });
        await new Promise((res) => setTimeout(res, 170 - lv * 8));   // 170 → 90ms
      }
    },

    /* 크게 한 마디 — 고/스톱 모달 대신 쓰는 외침. 「스톱!」 「고!」 */
    callout(str, d = 1200) {
      const el = document.createElement('div');
      el.className = 'vfx-text';
      el.textContent = str;
      const stage = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--cap-stage')) || innerWidth;
      const size = Math.min(stage * 0.34, stage * 0.86 / Math.max(1, str.length));
      el.style.cssText += `left:${innerWidth / 2}px;top:${focusY()}px;` +
        `font-size:${Math.round(size)}px;color:#fff6d8;` +
        `-webkit-text-stroke:${Math.max(4, size * 0.04)}px rgba(28,10,0,.85);` +
        `paint-order:stroke fill;` +
        `text-shadow:0 0 ${Math.round(size * 0.16)}px rgba(255,214,130,1),` +
        `0 0 ${Math.round(size * 0.46)}px rgba(255,170,50,.95),` +
        `0 0 ${Math.round(size * 0.95)}px rgba(255,140,20,.7);`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 100);
      VFX.ring(null, { size: 900, d: 700 });
      const r = layer.lastChild;
      if (r) { r.style.left = innerWidth / 2 + 'px'; r.style.top = focusY() + 'px'; }
      VFX.sparks(null, { n: 20, dist: 460, d: 760 });
      VFX.glow(0.45, 520);
    },

    /* 카드가 한 장씩 놓일 때마다 팡. 다 놓이고 한 번만 터뜨리면
       "언제 놓였는지"가 안 읽힌다 → 착지마다 작은 링, 마지막에 큰 한 방(slam). */
    async cardPops(gap = 105) {
      const cards = [...document.querySelectorAll('#playedarea .card')];
      for (const c of cards) {
        const q = c.getBoundingClientRect();
        if (q.width < 4) continue;
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        c.style.transition = 'transform .1s cubic-bezier(.2,1.9,.4,1), filter .1s ease';
        c.style.transform = 'scale(1.13)';
        c.style.filter = 'brightness(1.5) drop-shadow(0 0 18px rgba(255,205,110,.95))';
        setTimeout(() => { c.style.transform = ''; c.style.filter = ''; }, 220);
        VFX.ring(null, { size: 360, d: 460 });
        const ring = layer.lastChild;
        if (ring) { ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; }
        for (let k = 0; k < 8; k++) {
          const sp = document.createElement('div');
          sp.className = 'vfx-spark';
          const a = (Math.PI * 2 * k) / 8;
          sp.style.cssText += `left:${cx}px;top:${cy}px;`;
          sp.style.setProperty('--dx', `${Math.cos(a) * 150}px`);
          sp.style.setProperty('--dy', `${Math.sin(a) * 150 + 60}px`);
          sp.style.setProperty('--d', '560ms');
          add(sp, 640);
        }
        await new Promise((r) => setTimeout(r, gap));
      }
    },

    /** 화면 흔들림 */
    shake(amount = 16, d = 620) {
      for (const id of ['main', 'topbar']) {
        const e = document.getElementById(id);
        if (!e) continue;
        e.style.setProperty('--a', amount + 'px');
        e.style.setProperty('--d', d + 'ms');
        e.classList.remove('vfx-shake');
        void e.offsetWidth;                 // 리플로우로 애니메이션 재시작
        e.classList.add('vfx-shake');
        setTimeout(() => e.classList.remove('vfx-shake'), d + 60);
      }
    },

    /* 숫자가 오를 때마다 — 해당 요소를 복제해 튀어오르는 잔상을 남긴다.
     * 게임의 카운트업 자체는 건드리지 않고 위에 얹기만 한다. */
    pulse(sel, d = 520) {
      const e = document.querySelector(sel);
      if (!e) return;
      const q = e.getBoundingClientRect();
      if (q.width < 2) return;
      const el = document.createElement('div');
      el.className = 'vfx-ghost';
      el.textContent = e.textContent;
      el.style.cssText += `left:${q.left + q.width / 2}px;top:${q.top + q.height / 2}px;` +
                          `font-size:${Math.max(28, q.height * 0.95)}px;`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 80);
    },

    /* 점수 확정 순간 — 이 게임의 핵심 쾌감이므로 가장 크게 */
    numberBurst(sel, power = 1) {
      // 점수는 중앙 팝업에 뜬다 → 폭발도 거기서 나야 인과가 붙는다
      sel = sel || (document.querySelector('.vfx-scorepop') ? '.vfx-scorepop' : '#juice-tally');
      const p = Math.max(0.6, Math.min(2.4, power));
      VFX.pulse('#jt-score', 620);
      /* 섬광은 체급에 비례시키면 안 된다. 오광(power 2.3)에서 알파 0.98 · 900ms가 되어
         컷 하나가 통째로 하얗게 날아갔다. 광과민성(R8) 문제이기도 하다.
         → 세기와 무관하게 상한 고정. 규모는 링·광선·파편으로 키운다. */
      VFX.flash('rgba(255,246,220,.55)', 700);
      VFX.rays(sel, 1000 + 260 * p);
      VFX.ring(sel, { size: 1200 * p, d: 820 + 160 * p });
      if (p > 1.2) VFX.ring(sel, { size: 1900 * p, d: 1000 + 200 * p });
      VFX.sparks(sel, { n: Math.round(26 * p), dist: 620 * p, d: 950 + 180 * p });
      // 흔들림은 slam() 한 곳에만 — 여러 군데서 겹치면 상시 진동으로 읽힌다
    },

      /* 한 요소에서 다른 요소로 에너지 빔을 쏜다. */
    shoot(fromEl, toSel, d = 380) {
      const a = fromEl.getBoundingClientRect();
      const t = at(toSel);
      const x = a.left + a.width / 2, y = a.top + a.height / 2;
      const dx = t.x - x, dy = t.y - y;
      const len = Math.hypot(dx, dy);
      const el = document.createElement('div');
      el.className = 'vfx-shot';
      el.style.cssText += `left:${x}px;top:${y}px;width:${len}px;`;
      el.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 60);
      // 꽂히는 순간 타격
      setTimeout(() => {
        const h = document.createElement('div');
        h.className = 'vfx-hit';
        h.style.cssText += `left:${t.x}px;top:${t.y}px;`;
        add(h, 480);
      }, d * 0.62);
    },

    /* 점수 팝업 — '기존 점수에 이번 점수가 더해지는 순간'에만 뜬다.
     *
     * 예전엔 tally(수식 시작)와 동시에 띄우고 게임 DOM을 60ms마다 폴링해
     * 따라가게 했다. 그러면 계산이 끝나기도 전부터 팝업이 4초 내내 걸려 있어
     * "합산되는 순간"이라는 인과가 사라진다.
     * → 이제 씬이 from/gain을 넘겨주고 팝업이 스스로 카운트업한다. */
    scorePop({ from = 0, gain = 0, target = 0, month = '', d = 2600,
               countDelay = 260, countDur = 900 } = {}) {
      const fmt = (n) => Math.round(n).toLocaleString('en-US');
      const el = document.createElement('div');
      el.className = 'vfx-scorepop';
      el.style.setProperty('--d', d + 'ms');
      el.innerHTML =
        (month ? `<div class="sp-month">${month}</div>` : '') +
        `<div class="sp-num"><span class="sp-cur">${fmt(from)}</span>` +
        ` / ${fmt(target)}</div>` +
        `<div class="sp-bar"><div class="sp-fill"></div></div>`;
      add(el, d + 120);

      const num = el.querySelector('.sp-cur');
      const fill = el.querySelector('.sp-fill');
      const pct = (v) => Math.min(100, (v / Math.max(1, target)) * 100);
      fill.style.setProperty('--fd', countDur + 'ms');
      fill.style.setProperty('--w', pct(from) + '%');

      setTimeout(() => {
        if (!num.isConnected) return;
        fill.style.setProperty('--w', pct(from + gain) + '%');
        const t0 = performance.now();
        const step = () => {
          if (!num.isConnected) return;
          const p = Math.min(1, (performance.now() - t0) / countDur);
          const e = 1 - (1 - p) * (1 - p) * (1 - p);      // 감속 — 끝에서 착 붙는다
          num.textContent = fmt(from + gain * e);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, countDelay);
      return el;
    },

    /* 수식의 결과값이 팝업으로 날아가 꽂힌다 — "이 숫자가 저기에 더해진다"를 눈으로.
       from이 화면에 없으면(수식이 이미 사라졌으면) 팝업 위쪽에서 떨어뜨린다. */
    flyGain(text, fromSel = '#jt-score', toSel = '.vfx-scorepop .sp-num', d = 520) {
      const a = at(fromSel), b = at(toSel);
      const el = document.createElement('div');
      el.className = 'vfx-fly';
      el.textContent = text;
      el.style.cssText +=
        `left:${a.x}px;top:${a.y}px;font-size:76px;line-height:1;white-space:nowrap;` +
        `font-family:'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;color:#fff3cf;` +
        `text-shadow:0 0 20px rgba(255,190,80,.95),0 0 60px rgba(255,150,30,.75);`;
      el.style.setProperty('--dx', (b.x - a.x) + 'px');
      el.style.setProperty('--dy', (b.y - a.y) + 'px');
      el.style.setProperty('--arc', '110px');
      el.style.setProperty('--s0', '1');
      el.style.setProperty('--s1', '.6');
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 60);
      setTimeout(() => {
        const h = document.createElement('div');
        h.className = 'vfx-hit';
        h.style.cssText += `left:${b.x}px;top:${b.y}px;`;
        add(h, 480);
      }, d * 0.9);
    },

    /* 상점 구매 — 산 패가 퓽 날아가 '보유 특수패' 칸에 박히며 생긴다.
     * 예전엔 화면 최상단 조커바로 날려보냈는데, 상점을 보고 있던 시선이
     * 프레임 밖까지 끌려가서 무슨 일이 일어났는지 안 읽혔다.
     * → 상점 모달 안, 진열 바로 위의 보유 칸으로 날린다.
     * 보유 칸은 구매 후에야 채워지므로 구매 자체를 여기서 실행한다. */
    async flyToJoker(i, doBuy, d = 560) {
      const src = document.querySelectorAll('#shop-offers .offer')[i];
      const a = src && src.getBoundingClientRect();
      const clone = src ? src.cloneNode(true) : null;

      if (doBuy) doBuy();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const slots = [...document.querySelectorAll('#shop-offers .owned-slot.filled')];
      const tgt = slots[slots.length - 1]
        || document.querySelector('#jokerbar .jokerslot.filled:last-child');
      if (!clone || !tgt || !a || a.width < 4) return;
      const b = tgt.getBoundingClientRect();

      const wrap = document.createElement('div');
      wrap.className = 'vfx-fly';
      wrap.style.cssText +=
        `left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px;` +
        `width:${a.width}px;height:${a.height}px;` +
        `filter:drop-shadow(0 0 26px rgba(255,205,110,.95));`;
      clone.style.cssText += 'width:100%;height:100%;margin:0;';
      /* 게임의 상품 스타일은 `.shop-offers .offer {...}`로 **부모에 스코프**돼 있다.
         복제본을 이펙트 레이어로 옮기면 그 부모가 사라져 스타일이 통째로 날아가고,
         화면에는 배경 없는 맨 글자만 둥둥 떠서 무엇이 날아가는지 안 보였다.
         → 같은 클래스의 껍데기를 씌워 스코프를 되살린다. */
      const scope = document.createElement('div');
      scope.className = 'shop-offers';
      scope.style.cssText = 'display:block;width:100%;height:100%;';
      scope.appendChild(clone);
      wrap.appendChild(scope);
      wrap.style.setProperty('--dx', (b.left + b.width / 2 - a.left - a.width / 2) + 'px');
      wrap.style.setProperty('--dy', (b.top + b.height / 2 - a.top - a.height / 2) + 'px');
      /* 곡선으로 둥실 날면 '샀다'가 아니라 '떠다닌다'로 읽힌다.
         → 포물선을 빼고 **직선으로 쏜다.** 뒤에 잔상을 깔아 속도를 보여준다. */
      wrap.style.setProperty('--arc', '0px');
      wrap.style.setProperty('--s0', '1');
      wrap.style.setProperty('--s1', String(Math.max(0.16, b.height / a.height)));
      wrap.style.setProperty('--rot', '0deg');
      wrap.style.setProperty('--d', d + 'ms');
      add(wrap, d + 40);
      // 잔상 3장 — 살짝 늦게 출발해 뒤를 따라간다
      for (let k = 1; k <= 3; k++) {
        const gh = wrap.cloneNode(true);
        gh.style.opacity = String(0.34 - k * 0.08);
        gh.style.filter = 'brightness(1.5) blur(1px)';
        gh.style.animationDelay = `${k * 42}ms`;
        layer.insertBefore(gh, wrap);
        setTimeout(() => gh.remove(), d + 120);
      }

      /* 도착 — '퓽!'하고 박히는 맛은 전부 여기서 낸다.
         링 두 겹 + 방사 광선 + 파편 + 슬롯 발광 + 화면 가장자리 글로우.
         (흔들림은 쓰지 않는다 — 카메라가 흔들리는 것처럼 읽힌다) */
      await new Promise((r) => setTimeout(r, d));
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const place = (el) => { el.style.left = cx + 'px'; el.style.top = cy + 'px'; };

      const h = document.createElement('div');
      h.className = 'vfx-hit';
      h.style.cssText += `left:${cx}px;top:${cy}px;`;
      add(h, 480);
      VFX.ring(null, { size: 420, d: 540 });  place(layer.lastChild);
      VFX.ring(null, { size: 780, d: 760 });  place(layer.lastChild);
      VFX.rays(null, 820);                    place(layer.lastChild);
      VFX.sparks(null, { n: 24, dist: 380, d: 780 });
      for (const s of [...layer.querySelectorAll('.vfx-spark')].slice(-24)) place(s);
      VFX.glow(0.55, 620);

      tgt.style.transition = 'transform .12s cubic-bezier(.2,1.9,.4,1), filter .12s ease';
      tgt.style.transform = 'scale(1.4)';
      tgt.style.filter = 'brightness(2.1) drop-shadow(0 0 26px rgba(255,205,110,1))';
      setTimeout(() => { tgt.style.transform = ''; tgt.style.filter = ''; }, 320);

      // 획득 표시 — 무엇이 늘었는지 한 글자로 읽힌다
      const g = document.createElement('div');
      g.className = 'vfx-ghost';
      g.textContent = '＋1';
      g.style.cssText += `left:${cx}px;top:${cy - 26}px;font-size:54px;`;
      g.style.setProperty('--d', '820ms');
      add(g, 900);
    },


    /* 「주막 발견!」 배너 — 상점 나오기 전에 크게 한 방 */
    // SSRock은 583자 서브셋이라 '견'이 없다 → 「주막 등장!」으로
    discover(text = '주막 등장!', img = './jumak.png', d = 2200) {
      const el = document.createElement('div');
      el.className = 'vfx-discover';
      el.style.setProperty('--d', d + 'ms');
      el.innerHTML = `<img src="${img}" alt=""><span>${text}</span>`;
      add(el, d + 120);
      VFX.glow(0.7, 900);
      VFX.rays(null, 1400);
      VFX.sparks(null, { n: 26, dist: 700, d: 1100 });
      // 흔들림 없음 — 배너가 들이치는 것만으로 충분하다. 화면이 떨면 글씨가 안 읽힌다
    },

    /* 특수패 발동.
     * 게임은 조커 칩을 합계에만 더할 뿐 어느 특수패가 터졌는지 보여주지 않는다.
     * 광고에서는 "특수패를 맞추면 점수가 더 오른다"가 핵심 메시지이므로
     * 슬롯을 하나씩 번쩍이며 +점수가 솟구치게 만든다. */
    async jokerFire(gains = [], sel = '#jokerbar .jokerslot.filled') {
      const slots = [...document.querySelectorAll(sel)];
      const list = slots.length ? slots : [...document.querySelectorAll('#jokerbar > *')];
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const q = e.getBoundingClientRect();
        if (q.width < 8) continue;
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;

        e.style.transition = 'transform .12s cubic-bezier(.2,1.8,.4,1), filter .12s ease';
        e.style.transform = 'scale(1.28)';
        e.style.filter = 'brightness(1.9) drop-shadow(0 0 22px rgba(255,205,110,.95))';
        setTimeout(() => { e.style.transform = ''; e.style.filter = ''; }, 260);

        // 점수판은 작고 멀어서 빔이 안 보인다 → 수식의 점수 숫자에 꽂는다
        VFX.shoot(e, ['.vfx-scorepop', '#jt-score'], 300);
        VFX.ring([sel], { size: 420, d: 620 });
        const ring = layer.lastChild;
        if (ring) { ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; }

        const g = gains[i];
        if (g) {
          const t = document.createElement('div');
          t.className = 'vfx-ghost';
          t.textContent = '+' + g;
          t.style.cssText += `left:${cx}px;top:${cy}px;font-size:62px;`;
          t.style.setProperty('--d', '900ms');
          add(t, 980);
        }
        for (let k = 0; k < 10; k++) {
          const sp = document.createElement('div');
          sp.className = 'vfx-spark';
          const a = (Math.PI * 2 * k) / 10;
          sp.style.cssText += `left:${cx}px;top:${cy}px;`;
          sp.style.setProperty('--dx', `${Math.cos(a) * 190}px`);
          sp.style.setProperty('--dy', `${Math.sin(a) * 190 + 90}px`);
          sp.style.setProperty('--d', '760ms');
          add(sp, 860);
        }
        await new Promise((r) => setTimeout(r, 80));
      }
    },

  /* 게이지가 목표를 넘는 순간 — 가로로 뻗는 광선 */
    gaugeBlast(sel = '.vfx-scorepop .sp-bar') {
      const e = document.querySelector(sel) || document.getElementById('gauge');
      if (!e) return;
      const q = e.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'vfx-beam';
      el.style.cssText += `left:${q.left + q.width / 2}px;top:${q.top + q.height / 2}px;` +
                          `width:${Math.max(q.width * 2.4, 900)}px;`;
      el.style.setProperty('--d', '700ms');
      add(el, 800);
      VFX.sparks(sel, { n: 22, dist: 420, d: 780 });
    },

    /** 패가 내리꽂히는 순간 한 방 */
    slam(sel = CARDS, { amount = 18 } = {}) {
      VFX.shake(amount, 380);
      VFX.ring(sel, { size: 1250, d: 820 });
      VFX.glow(0.5, 460);
      VFX.sparks(sel, { n: 26, dist: 520, d: 850 });
    },

    /* 족보 확정.
     * 게임 자체 배너(#hand-banner)는 리그에서 숨기고 여기서 큼직한 금박 글씨를 쓴다.
     * 작은 인게임 배너보다 광고에서 훨씬 잘 읽힌다. */
    boom(str, sel = CARDS, power = 1) {
      const p = Math.max(0.6, Math.min(2.4, power));
      VFX.glow(Math.min(0.9, 0.5 * p), 620 + 180 * p);
      VFX.rays(sel, 1100 + 260 * p);
      VFX.ring(sel, { size: 1400 * p, d: 900 + 180 * p });
      VFX.sparks(sel, { n: Math.round(28 * p), dist: 640 * p, d: 1000 + 200 * p });
      // 흔들림 없음 (slam에서 이미 한 번 쳤다)
      // 족보 이름 — 게임 자체 배너는 리그에서 숨겼고 이쪽 금박 글씨를 쓴다
      if (str) VFX.text(str, sel, 1400 + 300 * p, p);
    },
  };

  window.VFX = VFX;
})();

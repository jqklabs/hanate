/* 녹화 리그 — ?capture=1&scene=<id>
 *
 * 게임 로직을 새로 만들지 않는다. 기존 전역(state / render / buildDeck /
 * playSelected / TARGETS)을 그대로 호출해 원하는 상황만 강제로 만든다.
 * 원본 index.html에는 존재하지 않고, build-rig.mjs가 만든 사본에만 주입된다.
 */
(function () {
  if (!window.__CAPTURE__) return;

  const Q = new URLSearchParams(location.search);
  const WANT = Q.get('scene') || 'C1';
  const TRANSFORM_MODE = Q.get('frame') === 'transform';

  /* 슬로모션 캡처.
   * 브라우저 녹화는 25fps가 한계다. 여기서 60fps를 만들려면 보간으로 없는 프레임을
   * 지어내야 하는데, 그러면 카드가 빠르게 움직일 때 뭉개진다.
   * → 페이지 자체를 SLOW배 느리게 돌려서 25fps로 찍고, 편집에서 SLOW배 빨리 감는다.
   *   25 × 2.5 = 62.5fps 분량의 '실제로 렌더된' 프레임이 나온다. 지어낸 프레임 0장. */
  const SLOW = Number(Q.get('slow') || 1);
  if (SLOW > 1) {
    /* 시계를 '전부' 같은 비율로 늦춰야 한다.
       setTimeout만 늦추고 performance.now()를 그대로 두면 게임의 카운트업이
       (경과시간 기반이라) 계산을 못 하고 숫자가 폭주한다. 실제로 그랬다. */
    const _setTimeout = window.setTimeout.bind(window);
    const _setInterval = window.setInterval.bind(window);
    window.setTimeout = (fn, ms, ...a) => _setTimeout(fn, (ms || 0) * SLOW, ...a);
    window.setInterval = (fn, ms, ...a) => _setInterval(fn, (ms || 0) * SLOW, ...a);

    const _pnow = performance.now.bind(performance);
    const p0 = _pnow();
    performance.now = () => p0 + (_pnow() - p0) / SLOW;

    const _dnow = Date.now;
    const d0 = _dnow();
    Date.now = () => d0 + (_dnow() - d0) / SLOW;

    const _raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (fn) => _raf(() => fn(performance.now()));
  }

  // ── 캡처 전용 CSS ──────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    /* 배경은 게임 것(Assets/Background.webp + 딤 그라디언트)을 그대로 쓴다.
       예전에 여기서 단색으로 덮어써서 화면이 밋밋했다. */
    html, body { overflow: hidden !important; }
    body { transform-origin: 0 0; }

    /* ── 무대(stage)와 여백 ────────────────────────────────────
       예전엔 뷰포트 == 게임 == 최종 프레임이었다. 여백이 0이라 카메라가
       조금만 확대하거나 옆으로 움직여도 가장자리 요소가 바로 잘렸다.
       → 뷰포트를 프레임보다 크게(1080×1350) 잡고, 게임은 그 안의
         860×1075 '무대'에만 그린다. 남는 둘레는 게임 배경이 채운다.
         카메라는 기본으로 이 무대를 꽉 잡고(배율 1080/860 ≈ 1.256),
         더 확대하거나 팬해도 바깥에 진짜 화면이 있어 잘리지 않는다.
       record.mjs의 VIEW, assemble.mjs의 STAGE와 반드시 같은 값을 쓸 것. */
    :root { --cap-stage: 860px; --cap-stage-h: 1075px; }
    body.cap-clean {
      box-sizing: border-box !important; min-height: 100vh !important;
      padding-top: calc((100vh - var(--cap-stage-h)) / 2) !important;
    }
    body.cap-clean #topbar,
    body.cap-clean #main {
      max-width: var(--cap-stage) !important;
      margin-left: auto !important; margin-right: auto !important;
    }
    /* 게임은 우측 춘향(#chunhyang) 자리로 min-width:861px에서 padding-right:200px을 준다.
       영상에서는 춘향을 뺐는데 이 여백만 남아 #table이 638px로 쪼그라들었고,
       그래서 판 전체가 왼쪽으로 치우치고 손패 8장이 두 줄로 접혔다. */
    body.cap-clean #main { padding-right: 22px !important; }
    body.cap-clean #boot-load,
    body.cap-clean #seedinfo,
    body.cap-clean .side-nav,
    body.cap-clean #btn-hint,
    body.cap-clean #top-help,
    body.cap-clean #top-tutor,
    body.cap-clean #top-labels,
    body.cap-clean #playlog-panel,
    body.cap-clean #deckbox { display: none !important; }
    body.cap-clean.cap-nojoker #jokerbar { display: none !important; }
    /* 우측 하단 춘향 — 영상용 누끼로 교체.
       치마가 화면 밖으로 흘러나가도 되므로 크게 잡고 오른쪽으로 밀어붙인다. */
    /* 춘향은 뺀다. 화면/카메라 구도가 계속 그에게 끌려다녔다.
       지금은 화투 게임 자체를 보여주는 데만 집중한다. */
    body.cap-clean #bg-figure { display: none !important; }

    /* 카메라가 잡을 춘향 앵커 — #bg-figure는 inset:0이라 좌표를 잴 수 없어서
       실제로 얼굴·상체가 있는 자리에 보이지 않는 박스를 둔다. */
    #cap-char {
      position: fixed; right: 0; bottom: 26%;
      width: 18%; height: 26%;
      pointer-events: none; z-index: -1;
    }
    /* 게임 자체 족보 배너는 숨긴다 — 영상에서는 VFX의 큼직한 금박 글씨를 쓴다 */
    body.cap-clean #hand-banner { opacity: 0 !important; }
    /* 좌측 패널은 통째로 숨긴다. 점수는 '합산되는 순간'에 중앙 팝업(VFX)으로만 뜬다 —
       시선이 한 곳에 모이고 빔도 화면 안에서 꽂힌다.
       #scorepanel만 투명하게 두면 목표/미리보기 박스가 그대로 남아 시선을 뺏었다. */
    /* opacity:0으로 두면 286px 폭을 그대로 차지해 #table이 오른쪽으로 밀린다.
       실제로 카드·내기/버리기가 프레임 중앙에서 0.615 지점에 있었다. → 통째로 뺀다. */
    body.cap-clean #side { display: none !important; }
    /* 고/스톱 모달은 게임이 점수 정산 직후 스스로 띄운다. 그대로 두면 이펙트 한복판에
       끼어들므로 기본은 끄고, 씬이 원하는 박자에 cap-gostop을 켜서 보여준다. */
    body.cap-clean #modal-overlay.gostop-open { display: none !important; }
    body.cap-clean.cap-gostop #modal-overlay.gostop-open { display: flex !important; }
    /* 고/스톱에서 어느 쪽을 고르는지 눈에 보이게 — 선택한 버튼만 살린다 */
    .cap-choose { animation: capChoose 620ms cubic-bezier(.2,1.6,.3,1) both;
      box-shadow: 0 0 0 3px rgba(255,214,130,.9), 0 0 46px rgba(255,196,90,.85) !important; }
    @keyframes capChoose {
      0% { transform: scale(1) } 30% { transform: scale(1.09) }
      60% { transform: scale(.97) } 100% { transform: scale(1.04) }
    }
    /* 구매한 패가 조커바에 박히는 게 보여야 한다 → 상점 딤을 옅게 */
    body.cap-clean #modal-overlay { background: rgba(0,0,0,.42) !important; }
    /* 모든 팝업은 카메라(=무대) 안에 들어와야 한다.
       상점 모달은 max-width가 860이라 무대 폭과 같아서 좌우가 프레임에 딱 붙어
       잘린 것처럼 보였다 → 무대보다 확실히 좁게 준다. */
    body.cap-clean #modal { max-width: calc(var(--cap-stage) - 96px) !important; }
    /* 엠블럼이 빨려 들어가는 대상은 '배수'다.
       집계가 아직 안 시작해서 칩은 0인데, 0 위로 이펙트가 꽂히면 뜻이 안 통한다
       → 흡수 순간에는 수식에서 ×배수만 남기고 나머지를 감춘다. */
    body.cap-premult #juice-tally { opacity: 1 !important; }
    body.cap-premult #jt-chips,
    body.cap-premult #jt-eq,
    body.cap-premult #jt-score,
    body.cap-premult .jt-plus,
    body.cap-premult .jt-flat { visibility: hidden !important; }
    body.cap-premult #jt-times,
    body.cap-premult #jt-mult {
      display: inline-block;
      transform: scale(2.5);
      transform-origin: center;
      filter: drop-shadow(0 0 18px rgba(255,205,110,.95))
              drop-shadow(0 0 46px rgba(255,170,50,.75));
      transition: transform .25s cubic-bezier(.2,1.6,.3,1);
    }

    /* 칩 × 배수 = 점수. 인게임 기본 크기로는 카드 사이에 낀 잔글씨로 보인다.
       영상에서는 이게 핵심 정보라 큼직하게 키운다. */
    body.cap-clean #playedarea.juice-stage { gap: 26px !important; }
    /* 수식은 낸 패 '아래 가운데'에 붙은 하나의 결과 패널이어야 한다.
       맨 숫자만 흩어져 있으면 카드 옆에 잘못 끼어든 잔글씨로 읽힌다. */
    body.cap-clean #juice-tally .jt-row {
      align-items: center !important; gap: 16px !important;
      padding: 14px 36px !important; border-radius: 18px !important;
      background: linear-gradient(180deg, rgba(10,22,16,.9), rgba(5,14,10,.95)) !important;
      border: 3px solid rgba(255,214,130,.7) !important;
      box-shadow: 0 0 44px rgba(255,190,80,.28),
                  inset 0 0 22px rgba(255,190,80,.1) !important;
    }
    /* 인게임 칩 색(--chip-blue)은 판 위에서 가라앉는다 — 영상에선 또렷하게 */
    body.cap-clean #juice-tally .jt-chips {
      font-size: 60px !important; color: #bfe3ff !important;
      text-shadow: 0 0 16px rgba(120,190,255,.65) !important;
    }
    body.cap-clean #juice-tally .jt-mult  { font-size: 60px !important; }
    body.cap-clean #juice-tally .jt-times { font-size: 44px !important; }
    body.cap-clean #juice-tally .jt-score {
      font-size: 70px !important;
      text-shadow: 0 0 18px rgba(255,205,110,.8) !important;
    }
    body.cap-clean #juice-tally .jt-eq,
    body.cap-clean #juice-tally .jt-plus  { font-size: 40px !important; }
    body.cap-clean #juice-tally .jt-flat  { font-size: 42px !important; }

    /* 고 체이스는 뷰포트 정중앙에 뜬다. 카메라는 낸 패(앵커)를 보고 있으므로
       그대로 두면 프레임 아래쪽에 걸린다 → 오버레이를 앵커 높이로 옮긴다.
       (카메라를 움직여 맞추면 몽타주 내내 고정이라는 원칙이 깨진다) */
    body.cap-clean #go-cascade .go-stage {
      transform: translateY(calc(var(--cap-focus-y, 50vh) - 50vh));
    }

    /* 조커바가 2줄로 깨지면 상단이 잘린다 — 한 줄 고정, 빈 슬롯 제거 */
    body.cap-clean #jokerbar {
      display: flex !important; flex-wrap: nowrap !important;
      justify-content: center !important; gap: 6px !important;
    }
    body.cap-clean #jokerbar .jokerslot:not(.filled) { display: none !important; }

    /* ── 캡처 전용 조정 (최소한만) ────────────────────────────
       R2: 인게임 레이아웃을 통째로 엎지 않는다. 게임 원래 구조(좌측 레일 + 판)를
           그대로 두고, 판 안에서 카드를 가운데로 모으는 정도만 손댄다.
       R3: 모든 UI가 항상 카메라 안에 있을 필요 없다.
           필요한 순간에 카메라가 그쪽을 포커싱하면 된다. */
    /* PC UI는 그대로 지킨다(R2). zoom·transform으로 레이아웃을 건드리지 않는다.
       화면을 채우는 건 카메라 배율로 하고, 좌측 점수판만 숨겨
       점수는 중앙 팝업으로 크게 띄운다. */
    /* 게임 UI 높이는 뷰포트와 무관하게 618px 고정이다.
       4:5 뷰포트(860×1075)에서 위쪽에 붙으면 아래가 통째로 빈다
       → 세로 중앙에 두어 여백을 위아래로 나눈다. 레이아웃은 안 건드린다. */
    /* 세로 중앙 — 뷰포트가 아니라 '무대' 높이 기준이다.
       100vh로 잡으면 무대 밖 여백까지 끌어안아 중심이 아래로 내려간다. */
    body.cap-center #main {
      min-height: calc(var(--cap-stage-h) - 90px) !important;
      align-items: center !important;
    }
    /* 세로로 '펼친다'.
       가운데로 모으면 판(494px)이 무대(1075px) 한가운데 뭉치고 위아래가 통째로 죽는다
       → 낸 패는 위쪽, 손패·버튼은 아래쪽으로 벌려 빈 공간을 잘게 나눈다.
       그 사이에 생긴 자리에 점수 팝업이 들어간다(카드를 안 가린다). */
    body.cap-center #table {
      display: flex !important; flex-direction: column !important;
      align-items: center !important; justify-content: space-between !important;
      height: 100% !important; padding: 10px 0 22px !important;
    }
    /* 손패 8장·낸 패 5장은 **반드시 한 줄**이다(R7).
       wrap을 열어두면 폭이 몇 px만 모자라도 마지막 한 장이 아래로 접힌다. */
    body.cap-center #playedarea,
    body.cap-center #handarea {
      display: flex !important; flex-wrap: nowrap !important;
      justify-content: center !important; align-items: center !important;
      width: 100% !important;
    }
    body.cap-center #juice-cards {
      display: flex !important; flex-wrap: nowrap !important;
      justify-content: center !important; align-items: flex-start !important;
    }
    /* 영역 높이를 고정한다. 카드가 빠지거나 보충될 때마다 높이가 변하면
       판 전체가 위아래로 밀려 "카메라가 미세하게 움직인다"로 읽힌다. */
    body.cap-center #handarea { height: 150px !important; min-height: 150px !important; }
    body.cap-center #actions { height: 74px !important; min-height: 74px !important; }
    /* 카드를 크게. 프레임의 절반 가까이를 카드가 채워야 화투 게임으로 읽힌다.
       손패는 8장이 한 줄에 들어가야 하므로(R7) 무대 폭 816px ÷ 8 이 상한이다.
       낸 패는 3~5장뿐이라 훨씬 크게 잡을 수 있다. */
    /* 폭 계산 기준은 '무대'가 아니라 '카메라가 실제로 잡는 폭'이다.
       카메라 기본 배율 ZB(≈1.34)에서 프레임에 들어오는 건 무대의 약 804px뿐 —
       무대 폭(860)에 맞춰 잡았더니 낸 패 다섯 장이 좌우로 잘렸다.
       카드마다 테두리가 3px씩 더 붙으므로(5장이면 30px) 그것까지 계산에 넣는다.
       box-sizing을 안 주면 테두리·패딩이 더해져 실제 폭이 커진다(실측 148 → 161). */
    body.cap-center #handarea .card,
    body.cap-center #playedarea .card,
    body.cap-center .juice-card-wrap .card { box-sizing: border-box !important; }
    body.cap-center #handarea .card {
      width: 84px !important; height: 127px !important; flex: 0 0 auto !important;
    }
    body.cap-center #handarea { gap: 5px !important; }
    body.cap-center #playedarea .card,
    body.cap-center .juice-card-wrap .card {
      width: 132px !important; height: 199px !important; flex: 0 0 auto !important;
    }
    body.cap-center .juice-card-wrap { flex: 0 0 auto !important; }
    body.cap-center #juice-cards { gap: 9px !important; }
    /* 낸 패 영역도 높이 고정 — 카드가 착지할 때 판이 밀리지 않게 */
    body.cap-center #playedarea {
      min-height: 312px !important; height: 312px !important;
    }
    body.cap-center #actions { justify-content: center !important; }


    /* 세로 스택 — 떨어져 있는 두 영역을 9:16 한 화면에 */
    body.cap-stack #main { display: block !important; }
    body.cap-stack #side { width: auto !important; max-width: none !important; }
    body.cap-stack #chunhyang { display: none !important; }
    .cap-cap {
      position: fixed; left: 0; right: 0; bottom: 8%;
      text-align: center; z-index: 99999; pointer-events: none;
      font-family: 'SSRock','BaigeTianxing','Malgun Gothic',sans-serif;
      font-size: 46px; color: #fdf6e3; letter-spacing: -0.02em;
      text-shadow: 0 4px 18px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9);
    }
  `;
  document.head.appendChild(css);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ── 집계(칩×배수) 게이트 ───────────────────────────────────
   * 게임은 playSelected() 직후 playJuiceSequence()를 제 타임라인으로 돌린다.
   * 그래서 씬이 아무리 기다려도 **엠블럼이 떠 있는 동안 이미 숫자가 다 올라가 있었다.**
   * (씬의 mark('tally')는 카메라 신호일 뿐 실제 카운팅과 무관했다)
   *
   * 시퀀스 안에서 멈출 자리는 하나뿐이다: 카드가 다 날아와 착지하고
   * 족보 배너를 띄우는 지점 — 그 직후의 첫 juiceWait에서 붙잡는다.
   * sfxBanner()가 딱 그 지점에서 한 번 불리므로 그것을 신호로 쓴다. */
  let gate = null, gateArmed = false;
  const _sfxBanner = window.sfxBanner;
  window.sfxBanner = function (...a) {
    gateArmed = true;
    return _sfxBanner && _sfxBanner.apply(this, a);
  };
  const _juiceWait = window.juiceWait;
  window.juiceWait = async function (ms) {
    if (gateArmed) {
      gateArmed = false;
      if (gate) await gate.p;
    }
    return _juiceWait.call(this, ms);
  };

  // ── 프레이밍 ───────────────────────────────────────────────
  // body에 transform을 걸어 관심 영역만 9:16 뷰포트에 채운다.
  // 측정 전에 반드시 transform을 해제해야 좌표가 어긋나지 않는다.
  function rectOf(sels, pad) {
    document.body.style.transition = 'none';
    document.body.style.transform = 'none';
    const els = (Array.isArray(sels) ? sels : [sels])
      .map((s) => document.querySelector(s))
      .filter((e) => e && e.getBoundingClientRect().width > 0);
    if (!els.length) return null;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const e of els) {
      const q = e.getBoundingClientRect();
      l = Math.min(l, q.left + scrollX);
      t = Math.min(t, q.top + scrollY);
      r = Math.max(r, q.right + scrollX);
      b = Math.max(b, q.bottom + scrollY);
    }
    return { l: l - pad, t: t - pad, w: (r - l) + pad * 2, h: (b - t) + pad * 2 };
  }

  function applyFrame(box, scaleBoost, pushTo) {
    if (!box) return;
    const vw = innerWidth, vh = innerHeight;
    const fit = Math.min(vw / box.w, vh / box.h) * (scaleBoost || 1);
    const put = (s) => {
      const tx = (vw - box.w * s) / 2 - box.l * s;
      const ty = (vh - box.h * s) / 2 - box.t * s;
      document.body.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    };
    put(fit);
    if (pushTo && pushTo !== 1) {
      // 아주 완만한 푸시인 — 정지 화면 방지
      requestAnimationFrame(() => {
        document.body.style.transition = 'transform 9s linear';
        put(fit * pushTo);
      });
    }
  }

  // ── 카드 지정 ──────────────────────────────────────────────
  // buildDeck()은 uid를 인덱스로 고정 부여하므로 월/종류/태그로 정확히 집을 수 있다.
  function matchCards(specs, pool, used) {
    const out = [];
    for (const sp of specs) {
      const c = pool.find((x) =>
        !used.has(x.uid) &&
        x.month === sp.month &&
        x.type === sp.type &&
        (!sp.tag || (x.tags || []).includes(sp.tag)));
      if (!c) { console.warn('[rig] 카드를 찾지 못함', sp); continue; }
      used.add(c.uid);
      out.push(c);
    }
    return out;
  }

  /* 주요 영역의 화면 좌표를 잰다.
   * 카메라가 화면 기하학적 중앙이 아니라 '카드가 실제로 있는 곳'을 보게 하려면
   * 편집 단계에서 좌표를 알아야 한다. */
  /* 카드를 낸 뒤 카메라가 잡을 '앵커'.
   * 낸 패는 정산이 끝나면 화면에서 사라진다. 그때마다 좌표를 다시 재면
   * 카메라가 내기 전 자리로 슬금슬금 되돌아간다 — 그러면 안 된다.
   * → 카드가 놓인 순간 한 번만 재서 얼려두고, 그 판이 끝날 때까지 이 값을 쓴다.
   * 오버레이(엠블럼·점수 팝업)도 같은 y에 뜨게 해서 카메라와 어긋나지 않게 한다. */
  let ANCHOR = null, POP = null;

  function snapRects() {
    const R = {};
    const put = (key, sels) => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, ok = false;
      for (const sel of sels) {
        for (const e of document.querySelectorAll(sel)) {
          const q = e.getBoundingClientRect();
          if (q.width < 4 || q.height < 4) continue;
          l = Math.min(l, q.left); t = Math.min(t, q.top);
          r = Math.max(r, q.right); b = Math.max(b, q.bottom); ok = true;
        }
      }
      if (ok) R[key] = { cx: (l + r) / 2 / innerWidth, cy: (t + b) / 2 / innerHeight,
                         w: (r - l) / innerWidth, h: (b - t) / innerHeight };
    };
    put('cards', ['#playedarea .card', '#handarea .card']);
    put('sel', ['#handarea .card.sel']);      // 지금 고른 패 — 카메라 출발점
    put('played', ['#playedarea .card']);
    put('hand', ['#handarea .card']);
    put('score', ['#scorepanel']);
    put('jokers', ['#jokerbar']);
    put('modal', ['#modal']);
    put('shop', ['#shop-offers .offer']);     // 상점 진열 카드 — 모달 빈 영역이 아니라 여기를 본다
    // 지금 사려는 상품 하나 — 이름·설명이 읽힐 만큼 카메라가 붙어야 한다
    put('buyitem', ['#shop-offers .offer.cap-aim']);
    // 보유 특수패 칸 — 산 패가 여기로 날아가 '생긴다'
    put('owned', ['#shop-offers .owned-slot']);
    put('gostop', ['#gs-actions']);           // 고/스톱 선택 버튼 두 개
    put('tally', ['#juice-tally']);           // 기본칩 × 배수 = 점수 수식
    put('gauge', ['#scorepanel', '#gauge']);
    // 여백을 줄이려면 카드만이 아니라 점수 수식까지 한 화면에 담아야 한다
    put('action', ['#playedarea .card', '#handarea .card', '#juice-tally']);
    /* 카메라 중심 — 낸 패와 수식은 한 덩어리다. 이게 프레임 정중앙에 와야 한다.
       아직 안 냈으면(손패 단계) 손패를 중심으로 쓴다. */
    put('focus', ['#playedarea .card', '#juice-tally']);
    put('char', ['#cap-char']);
    // 주인공 뷰 — 화투패가 중심이되 춘향이 같이 잡히는 프레임
    put('stage', ['#playedarea .card', '#handarea .card', '#cap-char']);
    // 게임 UI가 실제로 차지하는 전체 범위 — 뷰포트 크기를 이걸로 정한다
    put('gameui', ['#topbar', '#side', '#table']);
    if (ANCHOR) R.anchor = ANCHOR;
    if (POP) R.pop = POP;                     // 점수 팝업 자리 — 팝업 컷은 여기가 중앙
    /* 고 스탬프 자리 — 특수패바 아래끝과 낸 패 위끝 사이의 빈 띠.
       조합이 꽂힐 때마다 여기서 고가 쭉쭉 오른다. */
    const top = R.jokers ? R.jokers.cy + R.jokers.h / 2 : 0.08;
    const box = R.played || R.cards;
    if (box) {
      const bot = box.cy - box.h / 2;
      R.gobar = { cx: 0.5, cy: (top + bot) / 2, w: 0.4,
                  h: Math.max(0.04, bot - top) };
    }
    return R;
  }

  /* 카드는 씬 내내 움직인다(손패 → 판, 보충). 마크 시점에만 재면
   * 몇 초 뒤 컷에서 좌표가 어긋나 카드가 화면 밖으로 밀린다.
   * 그래서 계속 샘플링해 두고, 편집이 컷 시각에 가장 가까운 값을 쓴다. */
  function startRectLog() {
    const log = (window.__captureRectLog = []);
    const tick = () => {
      log.push({ ms: performance.now() - (window.__captureT0 || 0), rects: snapRects() });
    };
    tick();
    return setInterval(tick, 120);
  }

  const api = {
    wait,
    render: () => render(),

    clean(opts = {}) {
      document.body.classList.add('cap-clean');
      api.clearAnchor();
      api.useHiResCards();
      if (!document.getElementById('cap-char')) {
        const a = document.createElement('div');
        a.id = 'cap-char';
        document.body.appendChild(a);
      }
      if (!opts.keepJokers) document.body.classList.add('cap-nojoker');
      state.screen = 'play';
      state.surveyDismissed = true;
      state.coachStep = null;
      state.coachPendingScored = false;
      state.boss = null;
      state.pendingGoStop = false;
      state.juicing = false;
      state.dealing = false;
    },

    setRound(n) {
      state.round = n;
      state.baseTarget = TARGETS[n - 1];
      state.target = state.baseTarget;
      state.goLevel = 0;
    },
    setScore(n) { state.roundScore = n; },
    setPlays(n) { state.playsLeft = n; state.discardsLeft = n; },
    setMoney(n) { state.money = n; },
    setJokers(ids) { state.jokers = ids.map((id) => ({ id, paid: true })); },

    /* 카드 이미지를 영상용 고해상도로 갈아끼운다.
       게임 에셋은 480px라 크게 잡으면 뭉갠다. 원본 1360px을 960px로 줄여 쓴다. */
    useHiResCards() {
      const swap = () => {
        for (const img of document.querySelectorAll('.card .face-img')) {
          const src = img.getAttribute('src') || '';
          if (src.includes('CardsHi/')) continue;
          const m = src.match(/Assets\/(\d\d_[a-z]+)\/([^?]+)\.webp/i);
          if (m) img.src = `./CardsHi/${m[1]}/${m[2]}.webp`;
        }
      };
      swap();
      new MutationObserver(swap).observe(document.body, { childList: true, subtree: true });
    },

    setHand(specs) {
      const deck = buildDeck();
      const used = new Set();
      state.hand = matchCards(specs, deck, used);
      state.deck = deck.filter((c) => !used.has(c.uid));
      state.selected = [];
      render();
    },

    // 선택은 인덱스가 아니라 uid로 (보충 시 인덱스가 밀린다)
    select(specs) {
      const used = new Set();
      state.selected = matchCards(specs, state.hand, used).map((c) => c.uid);
      render();
    },

    /* 흡수 직전 — 수식에서 ×배수만 드러낸다 */
    showMultOnly() { document.body.classList.add('cap-premult'); },
    hideMultOnly() { document.body.classList.remove('cap-premult'); },

    /* 「1고 → 5고 → 10고 → 20고」 — 게임 자체 체이스 연출을 그대로 돌린다.
     * 숫자가 파편으로 부서지며 다음 숫자가 밀고 들어오는 그 효과가
     * 영상용으로 새로 만든 어떤 스탬프보다 낫다.
     * (from, to) 사이 숫자를 전부 훑으므로 5→10이면 6·7·8·9·10이 쭉쭉 지나간다. */
    async goChase(from, to) {
      state.goLevel = to;
      state.target = goThreshold(state.baseTarget, to);
      await runGoShatterCascade(from, to, { fullscreen: true });
    },

    /* 집계를 통째로 건너뛴다.
     * 몽타주 구간(병풍→고도리→총통)은 점수를 세지 않고 조합만 빠르게 꽂는다.
     * 주의: playJuiceSequence는 시작할 때 JUICE.skip을 false로 되돌린다.
     *       그래서 **시퀀스가 시작된 뒤에** 켜야 한다 → running을 기다린다. */
    async skipJuice(timeout = 4000) {
      const t0 = performance.now();
      while (!JUICE.running && performance.now() - t0 < timeout) await wait(30);
      JUICE.skip = true;
      if (JUICE.onSkip) JUICE.onSkip();
    },

    /* 다음 조합을 낼 수 있는 상태로 되돌린다.
       목표를 넘기면 게임이 screen을 'gostop'으로 바꿔 다음 playSelected가 막힌다. */
    resetPlay(plays = 5) {
      state.screen = 'play';
      state.pendingGoStop = false;
      state.juicing = false;
      state.dealing = false;
      state.playsLeft = plays;
      state.discardsLeft = plays;
      JUICE.running = false;
      JUICE.skip = false;
      JUICE.onSkip = null;
      render();
    },

    /* 집계를 붙잡아 둔다 — 엠블럼이 다 끝난 뒤에 풀어야 숫자가 안 가려진다 */
    holdTally() { let r; gate = { p: new Promise((res) => (r = res)), r }; },
    releaseTally() { if (gate) { gate.r(); gate = null; } },

    async play() {
      /* playSelected는 state.roundScore를 '동기적으로' 더한다.
         점수 팝업이 "더해지기 전 점수"를 보여주려면 여기서 찍어둬야 한다
         (씬에서 play 후에 읽으면 이미 더해진 값이다). */
      api.scoreBefore = state.roundScore;
      playSelected();
      await wait(120);
    },

    // 프레이밍 — 뷰포트를 540×960(@2x = 1080×1920)로 잡으면 게임의 자체 모바일
    // 레이아웃(@media max-width:720px)이 9:16을 그대로 채운다. 그래서 기본은 아무것도
    // 하지 않는다. 데스크톱 레이아웃을 크롭해야 할 때만 ?frame=transform 으로 켠다.
    focus(sels, pad = 28, push = 1) {
      if (!TRANSFORM_MODE) return;
      applyFrame(rectOf(sels, pad), 1, push);
    },

    stack(sels, pad = 24) {
      if (!TRANSFORM_MODE) return Promise.resolve();
      document.body.classList.add('cap-stack');
      render();
      return new Promise((r) => requestAnimationFrame(() => {
        applyFrame(rectOf(sels, pad), 1, 1.03);
        r();
      }));
    },

    /* 화투패를 화면 중앙으로 모으고 필요한 UI만 카드 주위에 남긴다 */
    center() {
      document.body.classList.add('cap-center');
      render();
      return new Promise((r) => requestAnimationFrame(() => r()));
    },

    /* 상점 — 원하는 특수패만 진열한다 (genOffers는 rng라 재현이 안 된다) */
    setShop(ids) {
      state.shopOffers = ids
        .map((id) => JOKERS.find((j) => j.id === id))
        .filter(Boolean)
        .map((joker) => ({ joker, sold: false }));
      state.screen = 'shop';
      render();
    },
    buy(i) { buyJoker(i); },

    /* 카드가 다 놓인 지금 자리를 앵커로 얼린다.
       이후 모든 컷이 여기를 보고, 오버레이도 여기에 뜬다. */
    anchor() {
      const r = snapRects();
      ANCHOR = r.played || r.cards || null;
      if (ANCHOR) {
        const cy = ANCHOR.cy * innerHeight;
        document.documentElement.style.setProperty('--cap-focus-y', cy + 'px');
        /* 점수 팝업은 낸 패 '아래' 빈 자리에 띄운다.
           카드 위에 겹치면 정작 무슨 패로 냈는지가 안 보인다. */
        const hand = document.querySelector('#handarea');
        const hb = hand && hand.getBoundingClientRect();
        const below = ANCHOR.cy * innerHeight + (ANCHOR.h * innerHeight) / 2;
        const popY = hb && hb.top > below ? (below + hb.top) / 2 : below + 130;
        document.documentElement.style.setProperty('--cap-pop-y', popY + 'px');
        // 팝업이 뜨는 컷은 이 좌표가 프레임 정중앙이어야 한다
        POP = { cx: 0.5, cy: popY / innerHeight, w: 0.52, h: 0.17 };
        const g = snapRects().gobar;
        if (g) document.documentElement.style.setProperty(
          '--cap-go-y', (g.cy * innerHeight) + 'px');
      }
      return ANCHOR;
    },
    clearAnchor() {
      ANCHOR = null; POP = null;
      document.documentElement.style.removeProperty('--cap-focus-y');
      document.documentElement.style.removeProperty('--cap-pop-y');
      document.documentElement.style.removeProperty('--cap-go-y');
    },

    /* 지금 사려는 상품에 표식을 단다 — 카메라(assemble)가 'buyitem' 좌표로
       그 상품 하나만 크게 잡아 이름·설명이 읽히게 한다. null이면 해제. */
    aim(i) {
      for (const e of document.querySelectorAll('#shop-offers .offer'))
        e.classList.remove('cap-aim');
      if (i == null) return;
      const e = document.querySelectorAll('#shop-offers .offer')[i];
      if (e) e.classList.add('cap-aim');
    },

    // 씬이 점수 팝업에 넘길 값들 — 게임 상태를 그대로 읽는다
    get state() { return state; },
    get score() { return state.roundScore; },
    get target() { return state.target; },
    monthLabel() {
      const r = document.getElementById('roundlabel');
      const t = r && r.textContent.trim().split('(')[0].trim();
      return t || `${state.round}월`;
    },
    /* 게임 자체 고/스톱 화면을 '원하는 박자에' 띄운다.
       게임은 점수가 목표를 넘으면 checkAfterPlay에서 알아서 screen='gostop'으로 가는데,
       그대로 두면 이펙트 한복판에 모달이 끼어든다 → CSS로 막아두고 여기서 연다. */
    showGoStop() {
      state.screen = 'gostop';
      state.pendingGoStop = true;
      render();
      document.body.classList.add('cap-gostop');
    },
    hideGoStop() { document.body.classList.remove('cap-gostop'); },
    /* 스톱/고 버튼을 '고르는' 모습 — 실제 클릭은 정산·드로우까지 끌고 가므로
       영상에서는 선택을 시각적으로만 보여준다. */
    choose(which = 'stop') {
      const b = document.querySelector(
        which === 'go' ? '#gs-actions .btn-go' : '#gs-actions .btn-stop');
      if (b) b.classList.add('cap-choose');
      return b;
    },
    /* 1고 → N고 — 게임 자체 연출(runGoShatterCascade)을 그대로 돌린다.
       영상용으로 새로 만든 스탬프보다 인게임 UI 그대로가 설득력 있다. */
    /* 지금 점수로 실제 선언되는 고 단계 — 고/스톱 버튼에 찍히는 그 숫자다.
       연출을 이 값으로 돌려야 "버튼엔 7고인데 10고까지 올라간다" 같은 모순이 없다. */
    goLevelNow() { return goLevelReached(state.baseTarget, state.roundScore, state.goLevel) + 1; },
    async goCascade(to = api.goLevelNow()) {
      document.body.classList.remove('cap-gostop');
      state.goLevel = to;
      state.target = goThreshold(state.baseTarget, to);
      state.playsLeft++;
      state.screen = 'play';
      render();
      await playGoCascade(0, to);
    },

    // 영상 전용 이펙트 — 게임 본편 연출은 절제돼 있어 광고에서는 크게 터뜨린다
    get fx() { return window.VFX; },

    // 사건 시각을 남긴다 — assemble이 이 지점을 기준으로 짧게 잘라낸다.
    // 컷을 녹화 단위가 아니라 사건 단위로 쪼갤 수 있어야 속도가 붙는다.
    mark(name, info) {
      (window.__captureMarks || (window.__captureMarks = [])).push({
        name, ms: performance.now() - (window.__captureT0 || 0),
        rects: snapRects(), ...(info ? { info } : {}),
      });
    },

    // 게임 자체의 런 종료 화면 — 실패를 연출로 흉내내지 않고 진짜 화면을 띄운다
    showEnd(reason = 'gobak') {
      state.gameOverReason = reason;
      state.surveyDismissed = true;
      state.screen = 'gameover';
      render();
    },

    caption(text) {
      let el = document.querySelector('.cap-cap');
      if (!el) {
        el = document.createElement('div');
        el.className = 'cap-cap';
        document.documentElement.appendChild(el);
      }
      el.textContent = text || '';
    },
  };

  // ── 실행 ───────────────────────────────────────────────────
  async function boot() {
    // 게임 부팅 완료를 기다린다.
    // state.screen은 초기값부터 'play'이므로 'play'를 신호로 쓰면 안 된다
    // (부팅 전에 씬이 시작돼 나중에 끝난 부팅이 씬을 덮어쓴다).
    // 부팅 마지막 줄이 screen을 'prep'/'welcome'으로 바꾸므로 그것만 기다린다.
    let booted = false;
    for (let i = 0; i < 400; i++) {
      if (typeof state !== 'undefined' &&
          (state.screen === 'prep' || state.screen === 'welcome')) { booted = true; break; }
      await wait(100);
    }
    if (!booted) console.warn('[rig] 부팅 신호를 못 봤다 — 그대로 진행');
    await wait(300);   // 첫 렌더 안정화
    const bl = document.getElementById('boot-load');
    if (bl) bl.style.display = 'none';

    const scene = (window.CAPTURE_SCENES || []).find((s) => s.id === WANT);
    if (!scene) {
      console.error('[rig] 알 수 없는 씬:', WANT);
      window.__captureDone = true;
      return;
    }
    console.log('[rig] 씬 시작:', scene.id, scene.label);
    // 녹화는 페이지 로드부터 시작되므로 앞쪽에 부팅·준비 화면이 들어간다.
    // 씬이 실제로 시작한 시각을 남겨 assemble이 그 지점부터 자르게 한다.
    window.__captureT0 = performance.now();
    const rectTimer = startRectLog();
    try {
      await scene.run(api);
    } catch (e) {
      console.error('[rig] 씬 실패:', e);
      window.__captureError = String(e && e.message || e);
    }
    clearInterval(rectTimer);
    window.__captureDone = true;
    console.log('[rig] 씬 종료:', scene.id);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
})();

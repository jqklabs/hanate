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

  // ── 캡처 전용 CSS ──────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    /* 배경은 게임 것(Assets/Background.webp + 딤 그라디언트)을 그대로 쓴다.
       예전에 여기서 단색으로 덮어써서 화면이 밋밋했다. */
    html, body { overflow: hidden !important; }
    body { transform-origin: 0 0; will-change: transform; }
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
    body.cap-clean #bg-figure {
      background-image: url('./chunhyang.png') !important;
      /* 누끼는 알파 bbox로 크롭해 뒀다(여백 포함 크기로 계산하면 화면을 덮는다).
         background-position의 4-값 음수 오프셋은 브라우저마다 해석이 달라
         transform으로 확실하게 우측 밖으로 밀어낸다. 치마가 잘려도 무방하다. */
      /* 춘향은 '배경'이다. 우측 구석에 걸치기만 하고 과감히 화면 밖으로 잘라낸다.
         프레이밍 대상에 넣으면 카메라가 그를 담으려고 뒤로 물러나 판이 작아진다. */
      background-position: right bottom !important;
      /* 뷰포트 높이의 90%를 넘기면 카메라가 어디를 잡든 그가 화면 절반을 먹는다.
         우측 하단 구석에만 걸치도록 크게 줄이고 오른쪽으로 잘라낸다. */
      background-size: auto 52% !important;
      transform: translate(20%, 10%);
      opacity: 0.95;
    }

    /* 카메라가 잡을 춘향 앵커 — #bg-figure는 inset:0이라 좌표를 잴 수 없어서
       실제로 얼굴·상체가 있는 자리에 보이지 않는 박스를 둔다. */
    #cap-char {
      position: fixed; right: 0; bottom: 26%;
      width: 18%; height: 26%;
      pointer-events: none; z-index: -1;
    }
    /* 게임 자체 족보 배너는 숨긴다 — 영상에서는 VFX의 큼직한 금박 글씨를 쓴다 */
    body.cap-clean #hand-banner { opacity: 0 !important; }

    /* 영상용 중앙 정렬 — 게임 원래 레이아웃(좌측 레일 + 판)은 그대로 두고
       판 영역 안에서만 화투패를 가운데로 모은다. UI를 새로 짜지 않는다. */
    body.cap-center #table {
      display: flex !important; flex-direction: column !important;
      align-items: center !important; justify-content: center !important;
    }
    body.cap-center #playedarea,
    body.cap-center #handarea {
      display: flex !important; flex-wrap: wrap !important;
      justify-content: center !important; align-content: center !important;
      width: 100% !important;
    }
    body.cap-center #playedarea { min-height: 230px !important; }
    body.cap-center #actions { justify-content: center !important; }
    body.cap-center .card { transform: scale(1.06); transform-origin: center; }

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
    put('played', ['#playedarea .card']);
    put('hand', ['#handarea .card']);
    put('score', ['#scorepanel']);
    put('jokers', ['#jokerbar']);
    put('modal', ['#modal']);
    put('shop', ['#shop-offers .offer']);     // 상점 진열 카드 — 모달 빈 영역이 아니라 여기를 본다
    put('tally', ['#juice-tally']);           // 기본칩 × 배수 = 점수 수식
    put('gauge', ['#scorepanel', '#gauge']);
    // 여백을 줄이려면 카드만이 아니라 점수 수식까지 한 화면에 담아야 한다
    put('action', ['#playedarea .card', '#handarea .card', '#juice-tally']);
    put('char', ['#cap-char']);
    // 주인공 뷰 — 화투패가 중심이되 춘향이 같이 잡히는 프레임
    put('stage', ['#playedarea .card', '#handarea .card', '#cap-char']);
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

    async play() {
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

    // 영상 전용 이펙트 — 게임 본편 연출은 절제돼 있어 광고에서는 크게 터뜨린다
    get fx() { return window.VFX; },

    // 사건 시각을 남긴다 — assemble이 이 지점을 기준으로 짧게 잘라낸다.
    // 컷을 녹화 단위가 아니라 사건 단위로 쪼갤 수 있어야 속도가 붙는다.
    mark(name) {
      (window.__captureMarks || (window.__captureMarks = []))
        .push({ name, ms: performance.now() - (window.__captureT0 || 0), rects: snapRects() });
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

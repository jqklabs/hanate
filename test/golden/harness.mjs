// 결정론 플레이스루 하니스.
// 목적: 리팩터링 전후의 "동작"을 기계적으로 대조할 수 있는 기준선을 만든다.
// 게임 내부 함수를 직접 부르지 않고 실제 DOM을 클릭해 진행하므로,
// 내부 구조가 모듈로 쪼개져도 하니스는 그대로 쓸 수 있다.
import { chromium } from 'playwright';
import { createHash } from 'crypto';
import { startServer } from './server.mjs';

export const VIEWPORT = { width: 1280, height: 820 };
export const GAME_URL = '/index.html?seed=42';

// 판마다 같은 선택을 하도록 고정한 결정 스크립트
const GOSTOP_SCRIPT = ['stop', 'go', 'stop', 'stop', 'go', 'go', 'stop', 'stop', 'go', 'stop'];
const NIGHT_SCRIPT = ['accept', 'decline', 'accept', 'accept', 'decline'];
const DISCARD_EVERY = 4;
const MAX_STEPS = 260;

// 리팩터링과 무관하게 흔들리는 값들을 페이지 진입 전에 고정한다.
const DETERMINISM = () => {
  // 엔진은 시드 RNG(mulberry32)를 쓰고 Math.random은 연출 전용이라 덮어써도 규칙에 영향 없음
  let s = 0x9e3779b9;
  Math.random = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const T0 = 1735689600000; // 2025-01-01T00:00:00Z 고정
  const RealDate = Date;
  const FakeDate = function (...args) {
    return args.length ? new RealDate(...args) : new RealDate(T0);
  };
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => T0;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;

  // 튜토리얼 오버레이·설문·설치 유도는 클릭을 가로막으므로 전부 본 것으로 둔다
  const seen = {
    hwatro_locale: 'kr',
    hwatro_howto_seen: '1',
    hwatro_deck_coach_v1: '1',
    hwatro_gostop_coach_v1: '1',
    hwatro_jan_coach_v1: '1',
    hwatro_shop_coach_v1: '1',
    hwatro_survey_done: '1',
    hwatro_shortcut_done: '1',
    hwatro_card_labels: '1',
    hwatro_hand_sort: 'month',
    hwatro_playlog: '1',
    hwatro_fx_speed: '2', // 연출 2배속 — 골든 기록 시간 단축
    hwatro_bgm_vol: '0',
    hwatro_sfx_vol: '0',
    hwatro_volume: '0',
    hwatro_uid: 'golden-fixed-uid',
  };
  try {
    for (const [k, v] of Object.entries(seen)) localStorage.setItem(k, v);
  } catch (_) {}

  // 소리·Spine은 결정론과 무관하고 스켈레톤은 기록 시간만 늘린다
  Object.defineProperty(window, 'spine', { value: undefined, writable: false });
  const silence = { play: () => Promise.resolve(), pause() {}, load() {}, addEventListener() {}, removeEventListener() {}, currentTime: 0, volume: 0 };
  window.Audio = function () { return Object.create(silence); };
  window.AudioContext = undefined;
  window.webkitAudioContext = undefined;
};

// 연출 전용 클래스. 타이머가 끝나면 빠져서 CI와 로컬 스냅샷이 갈린다.
const JUICE_CLASS = new Set([
  'pop', 'play-fade-out', 'sorting', 'score-land', 'score-pulse',
  'deal-in', 'discarding', 'juicing', 'prep-open', 'card-sweeping',
  'settle-out', 'juice-stage', 'pip-out',
]);

// 실행마다 달라지는 값은 지운다.
// 카드 그림은 preloadCardImages가 blob URL로 바꿔치기하는데 UUID가 매번 새로 생긴다.
// 그림의 정체는 data-csig가 card.art 경로를 담고 있어 그대로 검증된다.
const norm = (html) => (html || '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/blob:https?:\/\/[^"'\s]+/g, 'blob:*')
  .replace(/https?:\/\/127\.0\.0\.1:\d+/g, 'http://HOST')
  .replace(/class="([^"]*)"/g, (_, cls) => {
    const parts = cls.split(/\s+/);
    const keep = parts.filter((c) => {
      if (!c || JUICE_CLASS.has(c)) return false;
      // 정산 줄 on은 playSettleJuice가 한 줄씩 붙인다. 손패 정렬 버튼 on은 유지.
      if (c === 'on' && parts.includes('settle-row')) return false;
      return true;
    });
    return `class="${keep.join(' ')}"`;
  })
  .replace(/class="\s*"/g, 'class=""')
  // 손패 정렬 썸은 버튼 offsetWidth를 박아 넣는다. 폰트 메트릭이 OS마다 1px 갈린다.
  .replace(/style="width:\s*\d+px;\s*transform:\s*translateX\([^)]+\);?"/g, 'style="width:*;transform:*"')
  .replace(/\s+/g, ' ')
  .replace(/>\s+</g, '><')
  .trim();

export async function launch({ root, url = GAME_URL, headless = true }) {
  const { server, origin } = await startServer(root);
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'UTC',
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(DETERMINISM);
  // 외부 호출은 응답 시점이 매번 달라 스냅샷을 흔든다.
  // abort가 아니라 빈 응답으로 채워야 콘솔에 로드 실패가 안 쌓인다.
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (/spine-player|skel-embed|\/Spine\/chunhyang\//i.test(u)) {
      return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    }
    if (u.startsWith(origin)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (/Failed to load resource|net::ERR_/.test(txt)) return; // 차단한 외부 리소스
    errors.push('console: ' + txt);
  });

  await page.goto(origin + url, { waitUntil: 'domcontentloaded' });
  return {
    page,
    errors,
    origin,
    async close() {
      await browser.close();
      await server.close();
    },
  };
}

/** 연출·드로우가 끝나 화면이 멎을 때까지 기다린다 */
async function quiesce(page, timeout = 12000) {
  const deadline = Date.now() + timeout;
  let calm = 0;
  while (Date.now() < deadline) {
    const busy = await page.evaluate(() => {
      try {
        if (typeof state === 'undefined' || !state) return true;
        if (state.juicing || state.dealing) return true;
        if (document.body.classList.contains('juicing')) return true;
        if (document.querySelector('#handarea .card.deal-in, #handarea .card.discarding')) return true;
        if (document.querySelector('#boot-load:not(.done)')) {
          const bl = document.getElementById('boot-load');
          if (bl && getComputedStyle(bl).opacity !== '0' && bl.offsetParent !== null) return true;
        }
        return false;
      } catch (_) {
        return true;
      }
    });
    if (!busy) {
      calm++;
      if (calm >= 3) return true;
    } else {
      calm = 0;
    }
    await page.waitForTimeout(70);
  }
  return false;
}

async function readState(page) {
  return page.evaluate(() => {
    const s = state;
    const ids = (arr) => (arr || []).map((x) => (x && x.id != null ? x.id : x)).join(',');
    return {
      screen: s.screen,
      round: s.round,
      night: !!s.isNightRound,
      roundScore: s.roundScore,
      target: s.target,
      baseTarget: s.baseTarget,
      goLevel: s.goLevel,
      playsLeft: s.playsLeft,
      discardsLeft: s.discardsLeft,
      money: s.money,
      mitjangChips: s.mitjangChips,
      deckLeft: (s.deck || []).length,
      hand: (s.hand || []).map((c) => c.uid).join(','),
      selected: (s.selected || []).join(','),
      jokers: ids(s.jokers),
      boss: s.boss || null,
      played: (s.playedCards || []).length,
      discarded: (s.discardedCards || []).length,
      darkShop: !!s.darkShop,
      shopOffers: (s.shopOffers || []).map((o) => `${o.joker && o.joker.id}${o.sold ? ':sold' : ''}`).join(','),
    };
  });
}

async function readDom(page) {
  const parts = await page.evaluate(() => {
    const grab = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.outerHTML : '';
    };
    return {
      bodyClass: document.body.className,
      screenAttr: document.body.dataset.screen || '',
      side: grab('#side'),
      jokerbar: grab('#jokerbar'),
      moneybox: grab('#moneybox'),
      playedarea: grab('#playedarea'),
      handarea: grab('#handarea'),
      actions: grab('#actions'),
      modal: grab('#modal'),
      nightask: grab('#night-ask'),
    };
  });
  const out = {};
  for (const [k, v] of Object.entries(parts)) out[k] = norm(v);
  return out;
}

async function screen(page) {
  return page.evaluate(() => {
    try { return (typeof state !== 'undefined' && state && state.screen) || document.body.dataset.screen || ''; }
    catch (_) { return document.body.dataset.screen || ''; }
  });
}

async function clickIfPresent(page, selector) {
  const el = await page.$(selector);
  if (!el) return false;
  const usable = await el.evaluate((n) => !n.disabled && n.offsetParent !== null);
  if (!usable) return false;
  await el.click({ timeout: 4000 }).catch(() => {});
  return true;
}

/**
 * 결정론 플레이스루를 돌리고 스텝별 기록을 남긴다.
 * onSnapshot(step) 으로 스크린샷 등 부가 기록을 붙일 수 있다.
 */
export async function playthrough(page, { onSnapshot } = {}) {
  // boot()은 폰트·카드 48장 프리로드 + 최소 550ms 대기 후에야 첫 화면을 정한다.
  // 그전에 찍으면 손패가 빈 play 화면을 보게 된다.
  await page.waitForFunction(
    () => typeof state !== 'undefined' && state && ['langpick', 'prep', 'welcome'].includes(state.screen),
    null,
    { timeout: 60000 },
  );

  const steps = [];
  let playIdx = 0;
  let goIdx = 0;
  let nightIdx = 0;
  let actionCount = 0;
  const shopVisited = new Set();

  for (let n = 0; n < MAX_STEPS; n++) {
    await quiesce(page);
    const sc = await screen(page);
    const snap = { n, screen: sc, state: await readState(page), dom: await readDom(page), action: null };

    if (sc === 'gameover' || sc === 'victory') {
      snap.action = 'end';
      steps.push(snap);
      if (onSnapshot) await onSnapshot(snap, page);
      break;
    }

    if (sc === 'langpick') {
      snap.action = 'locale:kr';
      await clickIfPresent(page, '#modal .langpick-btn');
    } else if (sc === 'welcome') {
      snap.action = 'welcome:dismiss';
      await clickIfPresent(page, '#modal .choicebtn');
    } else if (sc === 'prep') {
      snap.action = 'prep:begin';
      await clickIfPresent(page, '#modal .prep-start');
    } else if (sc === 'nightask') {
      const pick = NIGHT_SCRIPT[nightIdx++ % NIGHT_SCRIPT.length];
      snap.action = 'night:' + pick;
      await clickIfPresent(page, pick === 'accept' ? '#night-ask .na-yes' : '#night-ask .na-no');
    } else if (sc === 'gostop') {
      const pick = GOSTOP_SCRIPT[goIdx++ % GOSTOP_SCRIPT.length];
      snap.action = 'gostop:' + pick;
      await clickIfPresent(page, pick === 'go' ? '#modal .btn-go' : '#modal .btn-stop');
    } else if (sc === 'shop') {
      const key = snap.state.round;
      if (!shopVisited.has(key)) {
        shopVisited.add(key);
        const bought = await clickIfPresent(page, '#modal .offer:not(.sold) .o-buy:not([disabled])');
        if (bought) {
          snap.action = 'shop:buy';
          steps.push(snap);
          if (onSnapshot) await onSnapshot(snap, page);
          continue;
        }
      }
      snap.action = 'shop:next';
      await clickIfPresent(page, '#btn-nextround');
    } else if (sc === 'play') {
      const useDiscard = snap.state.discardsLeft > 0 && actionCount > 0 && actionCount % DISCARD_EVERY === 0;
      playIdx++;
      const picked = await page.evaluate((mode) => {
        // 엔진의 최적 조합을 그대로 낸다. 아무 카드나 내면 1판에서 져서
        // 고·정산·주막·밤 화면이 골든에 한 번도 안 담긴다.
        const G = window.__golden || null;
        const S = G ? G.state() : state;
        const evalHand = G ? G.evaluateHand : evaluateHand;
        const envOf = G ? G.scoreEnv : scoreEnv;
        const draw = G ? G.render : render;
        const best = evalHand(S.hand, envOf());
        const keep = new Set(((best && best.cards) || []).map((c) => c.uid));
        let uids = mode === 'play'
          ? [...keep]
          : S.hand.filter((c) => !keep.has(c.uid) && !c.faceDown).slice(0, 3).map((c) => c.uid);
        if (!uids.length) uids = S.hand.filter((c) => !c.faceDown).slice(0, 1).map((c) => c.uid);
        S.selected = uids;
        draw();
        return uids;
      }, useDiscard ? 'discard' : 'play');
      snap.action = `${useDiscard ? 'discard' : 'play'}:${picked.join('+')}`;
      actionCount++;
      const btn = useDiscard ? '#btn-discard' : '#btn-play';
      const ok = await clickIfPresent(page, btn);
      if (!ok) {
        const alt = await clickIfPresent(page, useDiscard ? '#btn-play' : '#btn-discard');
        snap.action += alt ? ':fallback' : ':blocked';
        if (!alt) { steps.push(snap); if (onSnapshot) await onSnapshot(snap, page); break; }
      }
    } else {
      // 정산처럼 타이머로 스스로 넘어가는 화면. 폴링으로 여러 스텝 남기면
      // 스냅샷 속도에 따라 스텝 수가 달라져 골든이 흔들린다. 한 번만 찍고 전환을 기다린다.
      snap.action = 'await:' + sc;
      steps.push(snap);
      if (onSnapshot) await onSnapshot(snap, page);
      await page.waitForFunction(
        (prev) => typeof state !== 'undefined' && state && state.screen !== prev,
        sc,
        { timeout: 40000 },
      ).catch(() => {});
      continue;
    }

    steps.push(snap);
    if (onSnapshot) await onSnapshot(snap, page);
  }

  return steps;
}

export const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

/**
 * 오버레이·언어 전환 순회.
 * 자연 플레이스루는 한 판을 깊게 파지만 여기서 넓게 훑는다.
 * 모듈 분할에서 실제로 터지는 건 "어떤 경로가 아예 안 불린다" 쪽이라 이게 더 잘 잡는다.
 */
export async function tour(page, { onSnapshot } = {}) {
  await page.waitForFunction(
    () => typeof state !== 'undefined' && state && ['langpick', 'prep', 'welcome'].includes(state.screen),
    null,
    { timeout: 60000 },
  );
  await clickIfPresent(page, '#modal .prep-start');
  await quiesce(page);

  const steps = [];
  let n = 0;
  const mark = async (label) => {
    await quiesce(page, 6000);
    const snap = { n: n++, screen: await screen(page), action: label, state: await readState(page), dom: await readDom(page) };
    steps.push(snap);
    if (onSnapshot) await onSnapshot(snap, page);
  };

  await mark('tour:play');

  const visits = [
    ['help:open', '#top-help', 'help'],
    ['help:close', '#modal .choicebtn', 'play'],
    ['deck:open', '#deckbox', 'deckpeek'],
    ['deck:close', '#modal .choicebtn', 'play'],
  ];
  for (const [label, sel] of visits) {
    await clickIfPresent(page, sel);
    await mark(label);
  }

  await clickIfPresent(page, '#top-settings');
  await mark('settings:open');
  for (const sel of ['#set-card-detail', '#set-fx', '#set-playlog']) {
    await clickIfPresent(page, sel);
    await mark('settings:toggle ' + sel);
    await clickIfPresent(page, sel); // 원상 복구
  }
  await clickIfPresent(page, '#settings-panel .set-close');
  await mark('settings:close');

  // i18n 경로는 렌더 전체를 다시 타므로 모듈 분할에서 가장 잘 깨진다
  for (const lang of ['en', 'jp', 'kr']) {
    await clickIfPresent(page, `#locale-toggle button[data-lang="${lang}"]`);
    await mark('locale:' + lang);
  }

  await clickIfPresent(page, '#hand-sort #act-sort-type');
  await mark('sort:type');
  await clickIfPresent(page, '#hand-sort #act-sort-month');
  await mark('sort:month');

  return steps;
}

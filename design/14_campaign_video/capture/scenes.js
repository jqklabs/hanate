/* 캠페인 영상 컷 정의 — 페이지 안에서 실행된다 (게임 전역에 직접 접근).
 *
 * 시나리오 「숫자가 커진다」
 *   자막 없이 읽혀야 하므로 설명을 버리고 핵심 쾌감 하나만 반복·증폭한다.
 *   고른다 → 내리꽂는다 → 숫자가 터진다. 같은 리듬 세 번, 규모만 커진다.
 *     ① 1월 목표 160  ② 상점에서 특수패  ③ 5월 목표 600  ④ 9월 목표 2,200 폭발
 *
 * 규칙
 *   - 손패는 항상 8장 (게임 규칙). 선택은 3장.
 *   - 족보 이름은 게임 자체 배너(#hand-banner)가 띄운다. VFX는 글자를 쓰지 않는다.
 *   - 광 = 1·3·8·11·12월뿐. 12월 비광이 섞이면 삼광이 아니라 비삼광(배수 5→4)이므로
 *     삼광은 1·3·8월 또는 1·3·11월로 구성한다.
 */

/* 레코더가 읽어가는 목록. capture 플래그와 무관하게 항상 노출된다. */
window.captureSceneList = () =>
  (window.CAPTURE_SCENES || []).map((s) => ({
    id: s.id, label: s.label, record: s.record, use: s.use, caption: s.caption,
  }));

/* 점수 연출 구간에 이펙트를 얹는다.
 * 게임의 카운트업(칩 → 배수 → = 점수)은 그대로 두고 위에 터뜨리기만 한다. */
async function scoreShow(api, { power = 1, jokerGains = null, hand = '' } = {}) {
  await api.wait(300);
  api.fx.slam(undefined, { amount: 12 * power });       // 패가 내리꽂힘 — 체급 비례
  api.mark('slam');
  await api.wait(1500);

  api.mark('tally');                                    // 수식이 뜨는 지점
  // 칩이 하나씩 더해지는 동안 숫자를 튀어오르게 한다
  for (let i = 0; i < 5; i++) {
    api.fx.pulse('#jt-chips', 460);
    await api.wait(340);
  }
  api.fx.pulse('#jt-mult', 520);
  await api.wait(380);

  // 특수패 발동 — "특수패를 맞추면 점수가 더 오른다"가 이 영상의 핵심 메시지
  if (jokerGains && jokerGains.length) {
    api.mark('joker');
    await api.fx.jokerFire(jokerGains);
    await api.wait(320);
  }

  api.mark('burst');                                    // 점수 확정 — 가장 크게
  api.fx.numberBurst(undefined, power);
  await api.wait(700);
  api.fx.gaugeBlast();
  api.fx.pulse('#score-val', 620);
  await api.wait(900);
  api.fx.boom(hand, undefined, power);                        // 족보 배너 주위로 한 번 더
  await api.wait(1600);
}

window.CAPTURE_SCENES = [
  {
    id: 'A1',
    label: '사이클 1 — 1월, 목표 160',
    record: 15000,
    async run(api) {
      api.clean();
      api.setRound(1);              // 목표 160
      api.setMoney(4);
      api.setScore(0);
      api.setPlays(4);
      await api.center();
      api.setHand([                 // 손패 8장 (게임 규칙)
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 4, type: 'yeol', tag: 'godori' },
        { month: 8, type: 'yeol', tag: 'godori' },
        { month: 1, type: 'tti', tag: 'hongdan' },
        { month: 3, type: 'tti', tag: 'hongdan' },
        { month: 5, type: 'pi' },
        { month: 6, type: 'pi' },
        { month: 9, type: 'pi' },
      ]);
      api.mark('hand');
      await api.wait(1100);
      // 고도리(2·4·8월 열끗) — 배수 6. 1월은 낮이라 열끗 +2칩이 붙어 160을 넘긴다
      api.select([
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 4, type: 'yeol', tag: 'godori' },
        { month: 8, type: 'yeol', tag: 'godori' },
      ]);
      api.mark('select');
      await api.wait(1000);
      api.mark('play');
      await api.play();
      await scoreShow(api, { power: 1.0, hand: '고도리' });
    },
  },

  {
    id: 'A2',
    label: '상점 — 특수패 구매',
    record: 11000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(4);
      api.setMoney(20);
      api.setJokers(['gwangpari']);
      await api.center();
      // genOffers는 rng라 재현이 안 된다 — 진열을 직접 지정한다
      api.setShop(['gwang_sujip', 'samgwang_nori', 'pi_merchant']);
      api.mark('shop');
      await api.wait(1500);
      api.buy(1);                                        // 삼광판
      api.fx.glow(0.45, 460);
      api.fx.sparks('#jokerbar', { n: 26, dist: 480 });
      api.mark('buy');
      await api.wait(1500);
      api.buy(0);                                        // 광모이
      api.fx.glow(0.45, 460);
      api.fx.sparks('#jokerbar', { n: 26, dist: 480 });
      api.mark('buy2');
      await api.wait(2400);
    },
  },

  {
    id: 'A3',
    label: '사이클 2 — 5월, 목표 600',
    record: 16000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(5);              // 목표 600
      api.setMoney(24);
      api.setScore(0);
      api.setPlays(4);
      api.setJokers(['gwangpari', 'gwang_sujip', 'samgwang_nori']);
      await api.center();
      api.setHand([                 // 8장
        { month: 1, type: 'kwang' },
        { month: 3, type: 'kwang' },
        { month: 8, type: 'kwang' },
        { month: 5, type: 'yeol' },
        { month: 6, type: 'yeol' },
        { month: 7, type: 'tti', tag: 'chodan' },
        { month: 9, type: 'pi' },
        { month: 10, type: 'pi' },
      ]);
      api.mark('hand');
      await api.wait(1100);
      api.select([                  // 삼광 = 1·3·8월 (비광 제외)
        { month: 1, type: 'kwang' },
        { month: 3, type: 'kwang' },
        { month: 8, type: 'kwang' },
      ]);
      api.mark('select');
      await api.wait(1000);
      api.mark('play');
      await api.play();
      await scoreShow(api, { power: 1.5, jokerGains: [3, 24, 40], hand: '삼광' });
    },
  },

  {
    id: 'A4',
    label: '사이클 3 — 9월, 오광 폭발',
    record: 18000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(9);              // 목표 2,200
      api.setMoney(46);
      api.setScore(1180);           // 이미 쌓아둔 상태에서 마지막 한 방
      api.setPlays(2);
      api.setJokers(['gwangpari', 'gwang_sujip', 'samgwang_nori',
                     'bigwang_usan', 'ogwang_kkum']);
      await api.center();
      api.setHand([                 // 8장 — 광 다섯 장이 다 들어있다
        { month: 1, type: 'kwang' },
        { month: 3, type: 'kwang' },
        { month: 8, type: 'kwang' },
        { month: 11, type: 'kwang' },
        { month: 12, type: 'kwang', tag: 'bikwang' },
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 7, type: 'pi' },
        { month: 9, type: 'pi' },
      ]);
      api.mark('hand');
      await api.wait(1200);
      // 오광 — 배수 12, 족보표 최상위. 사다리의 꼭대기다.
      api.select([
        { month: 1, type: 'kwang' },
        { month: 3, type: 'kwang' },
        { month: 8, type: 'kwang' },
        { month: 11, type: 'kwang' },
        { month: 12, type: 'kwang', tag: 'bikwang' },
      ]);
      api.mark('select');
      await api.wait(1200);
      api.mark('play');
      await api.play();
      await scoreShow(api, { power: 2.3, jokerGains: [3, 40, 60, 25, 90], hand: '오광' });
    },
  },
];

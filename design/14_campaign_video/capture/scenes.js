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
 * 게임의 카운트업(칩 → 배수 → = 점수)은 그대로 두고 위에 터뜨리기만 한다.
 *
 * 순서가 곧 인과다 (여기를 뒤집으면 영상이 안 읽힌다):
 *   슬램 → 엠블럼+족보글자 → 칩×배수 수식 → 조커 발동
 *   → [sum] 여기서 비로소 점수 팝업이 카메라 중앙에 뜨고
 *     수식의 결과가 '+N'으로 날아와 꽂히며 기존 점수에 합산된다
 *   → [burst] 합산이 끝나는 순간 폭발
 *
 * 예전엔 팝업을 tally와 동시에 4.2초 띄워놔서 "합산되는 순간"이 없었다. */
async function scoreShow(api, { power = 1, jokerGains = null, hand = '', goTo = 0 } = {}) {
  // 이번 판을 더하기 '전'의 점수 — api.play()가 playSelected 직전에 찍어둔 값
  const before = api.scoreBefore ?? 0;
  /* 카드가 한 장씩 착지할 때마다 팡. 다 놓인 뒤 한 번만 터뜨리면
     "몇 장이 언제 놓였는지"가 안 읽힌다. 마지막에 큰 한 방(slam)으로 닫는다. */
  api.mark('land');
  await api.wait(220);
  await api.fx.cardPops(105);
  api.fx.slam(undefined, { amount: 12 * power });       // 패가 내리꽂힘 — 체급 비례
  /* 카메라 앵커를 여기서 얼린다. 이후 컷은 전부 '낸 패 자리'를 보고,
     엠블럼·점수 팝업도 같은 자리에 뜬다 — 내기 전 위치로 돌아가지 않는다. */
  api.anchor();
  api.mark('slam');
  await api.wait(520);
  /* 엠블럼 — 문양 링 가운데 명판에 족보 이름이 박힌 한 덩어리.
     **엠블럼이 완전히 사라진 뒤에** 수식 카운팅을 시작한다.
     예전엔 엠블럼 뒤에서 숫자가 올라가 카운팅이 아예 안 느껴졌다. */
  const embD = 1500 + 200 * power;
  if (hand) {
    api.mark('emblem');
    api.fx.emblem(hand, embD + 900);      // 흡수될 때까지 살아 있게 넉넉히
    api.fx.text(hand, undefined, embD + 900, power);   // 같은 좌표·같은 박자
    await api.wait(embD);
    /* 족보 = 배수다. 엠블럼을 그냥 사라지게 두면 예쁜 그림 한 장으로 끝난다.
       ×배수 자리로 빨려 들어가며 거기를 때려야 인과가 붙는다.
       수식에는 ×배수만 드러낸다 — 아직 0인 칩 위로 꽂히면 뜻이 안 통한다.
       (엠블럼이 수식을 덮고 있으므로 배수는 엠블럼이 줄어들면서 드러난다) */
    api.showMultOnly();
    api.mark('absorb');
    api.fx.absorb('#jt-mult', 620);
    await api.wait(760);
    api.fx.pulse('#jt-mult', 620);      // 배수 하나만 남아 한 번 더 튄다
    await api.wait(520);
    api.hideMultOnly();
  } else {
    await api.wait(700);
  }

  /* 여기서 비로소 게임의 집계 애니메이션을 푼다.
     이 게이트가 없으면 게임이 제 타임라인으로 돌아 엠블럼 뒤에서 숫자가 다 올라간다. */
  api.releaseTally();
  await api.wait(180);
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
    await api.wait(1200);   // 조커 컷에 충분한 길이를 주기 위해
  }

  /* 합산 순간 — 계산이 전부 끝난 지금에야 팝업이 뜬다.
     게임이 이미 점수를 더해놨으므로 증분은 (지금 점수 - before)다. */
  const gain = Math.max(0, api.score - before);
  api.mark('sum');
  api.fx.scorePop({ from: before, gain, target: api.target,
                    month: api.monthLabel(), d: 3400,
                    countDelay: 520, countDur: 900 });
  await api.wait(240);
  api.fx.flyGain('+' + gain.toLocaleString('en-US'));    // 수식 → 팝업으로 날아와 꽂힘
  await api.wait(520);

  /* 폭발은 **한 번만.** 예전엔 numberBurst(섬광·광선·링)와 boom(글로우·광선·링)이
     1.4초 간격으로 연달아 터져서 "점수판이 두 번 빛난다"로 읽혔다.
     합산이 끝나는 마지막 순간에 한 방만 크게 간다. */
  api.mark('burst');
  api.fx.gaugeBlast();
  api.fx.pulse('.vfx-scorepop .sp-cur', 620);
  await api.wait(560);
  api.fx.numberBurst(undefined, power);                 // 유일한 큰 한 방
  /* 「고는 무제한」 — 게이지가 차오른 바로 그 자리 위에
     1고 → N고가 점점 빨라지며 박힌다. */
  if (goTo) {
    await api.wait(500);
    api.mark('go');
    await api.fx.goRun(goTo);
    await api.wait(900);
  } else {
    await api.wait(2100);    // 폭발 여운
  }
}

/* 목표를 넘기면 게임은 스스로 고/스톱 화면을 띄운다(checkAfterPlay).
 * 이펙트 한복판에 끼어들지 않게 CSS로 막아뒀다가 여기서 원하는 박자에 연다.
 * 실제 클릭(chooseStop/chooseGo)은 정산·드로우까지 끌고 가므로
 * 영상에서는 '고른다'는 것만 시각적으로 보여준다. */
/* 고/스톱.
 * 인게임 선택 UI(버튼 두 개 + 설명 문구)는 광고에서 거추장스럽다 —
 * 카메라가 버튼을 훑게 되고 읽을 것만 많아진다.
 * → 모달은 띄우지 않고 **「스톱!」 「고!」 한 마디**로 크게 외친다. */
async function goStop(api, pick = 'stop') {
  /* 스톱은 목표를 넘겼을 때만 고를 수 있다(게임 규칙). */
  if (api.score < api.target)
    console.warn(`[scene] 목표 미달인데 고/스톱을 띄웠다: ${api.score} / ${api.target}`);
  api.mark('call');
  api.fx.callout(pick === 'go' ? `${api.goLevelNow()}고!` : '스톱!', 1300);
  await api.wait(1250);
}

window.CAPTURE_SCENES = [
  {
    id: 'A1',
    label: '사이클 1 — 1월, 목표 160',
    record: 26000,
    async run(api) {
      api.clean();
      api.setRound(1);              // 목표 160
      api.setMoney(4);
      api.setScore(0);
      api.setPlays(4);
      await api.center();
      // 낼 패(고도리 2·4·8월)를 손패 여기저기 흩어놓는다 — 왼쪽에 몰리면 인위적이다
      api.setHand([
        { month: 1, type: 'tti', tag: 'hongdan' },
        { month: 2, type: 'yeol', tag: 'godori' },   // ★
        { month: 5, type: 'pi' },
        { month: 8, type: 'yeol', tag: 'godori' },   // ★
        { month: 3, type: 'tti', tag: 'hongdan' },
        { month: 6, type: 'pi' },
        { month: 4, type: 'yeol', tag: 'godori' },   // ★
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
      api.holdTally();          // 엠블럼이 끝날 때까지 숫자를 세지 않는다
      await api.play();
      await scoreShow(api, { power: 1.0, hand: '고도리' });
      await goStop(api, 'stop');       // 1사이클은 안전하게 스톱
    },
  },

  {
    id: 'A2',
    label: '상점 — 특수패 구매',
    record: 14000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(4);
      api.setMoney(20);
      api.setJokers(['gwangpari']);
      await api.center();
      // genOffers는 rng라 재현이 안 된다 — 진열을 직접 지정한다
      // 상점이 그냥 뜨면 임팩트가 없다 → 「주막 발견!」을 크게 먼저 띄운다
      api.mark('discover');
      api.fx.discover('주막 등장!');
      await api.wait(2300);
      api.setShop(['gwang_sujip', 'samgwang_nori', 'pi_merchant']);
      api.mark('shop');
      await api.wait(1300);
      /* 구매에 인과를 준다: 카메라가 상품을 조준(aim) → 사면 그 패가
         퓽 날아가 상단 조커바에 박힌다(fly). 예전엔 그냥 반짝이기만 했다. */
      /* 무엇을 사는지 읽혀야 한다 → 카메라가 그 상품 하나에 바짝 붙는다(aim).
         산 패는 프레임 밖 조커바가 아니라 상점 안 '보유 칸'으로 날아가 생긴다. */
      api.aim(1);
      api.mark('aim');
      api.fx.pulse('#shop-offers .offer.cap-aim .o-name', 560);
      await api.wait(900);
      api.mark('fly');
      await api.fx.flyToJoker(1, () => api.buy(1));       // 삼광판
      api.aim(null);
      await api.wait(1000);
      api.aim(0);
      api.mark('aim2');
      api.fx.pulse('#shop-offers .offer.cap-aim .o-name', 560);
      await api.wait(800);
      api.mark('fly2');
      await api.fx.flyToJoker(0, () => api.buy(0));       // 광모이
      api.aim(null);
      await api.wait(1400);
    },
  },

  {
    id: 'A3',
    label: '사이클 2 — 5월, 병풍(1~5월 연속)',
    record: 26000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(5);              // 목표 600
      api.setMoney(24);
      api.setScore(0);
      api.setPlays(4);
      api.setJokers(['gwangpari', 'gwang_sujip', 'samgwang_nori']);
      await api.center();
      /* 병풍 = 연속된 5개월(스트레이트), 배수 3.
         1~5월로 잡으면 core가 송학광·꾀꼬리·벚꽃광·두견·난초 —
         광 2장 + 봄꽃 3장이라 화면이 가장 예쁘고 기본칩도 48로 최고다.
         배수는 낮지만 조커 3개가 붙어 목표 600을 넘긴다. */
      // 병풍 5장을 흩어놓는다
      api.setHand([
        { month: 3, type: 'kwang' },          // ★ 벚꽃 광
        { month: 9, type: 'pi' },
        { month: 1, type: 'kwang' },          // ★ 송학 광
        { month: 5, type: 'yeol' },           // ★ 난초
        { month: 7, type: 'tti', tag: 'chodan' },
        { month: 2, type: 'yeol', tag: 'godori' },   // ★ 꾀꼬리
        { month: 10, type: 'pi' },
        { month: 4, type: 'yeol', tag: 'godori' },   // ★ 두견
      ]);
      api.mark('hand');
      await api.wait(900);
      api.select([                  // 병풍 — 1~5월 연속 5장
        { month: 1, type: 'kwang' },
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 3, type: 'kwang' },
        { month: 4, type: 'yeol', tag: 'godori' },
        { month: 5, type: 'yeol' },
      ]);
      api.mark('select');
      await api.wait(900);
      api.mark('play');
      api.holdTally();          // 엠블럼이 끝날 때까지 숫자를 세지 않는다
      await api.play();
      await scoreShow(api, { power: 1.5, jokerGains: [3, 24, 40], hand: '병풍' });
      await goStop(api, 'stop');       // 2사이클도 스톱 — 3사이클의 '고'를 돋보이게
    },
  },

  {
    id: 'A4',
    label: '사이클 3 — 9월, 오광 폭발 → 1고~10고',
    record: 34000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(9);              // 목표 2,200
      api.setMoney(46);
      /* 선언 단계 = '아직 못 넘은 첫 문턱'이다(밀치기 고).
         10고로 선언되려면 9고 문턱(2,200×6.4 = 14,080)은 넘고
         10고 문턱(2,200×7 = 15,400)은 못 넘어야 한다.
         이번 판 획득이 약 9,500점이므로 시작 5,000 → 최종 14,500. 딱 10고다.
         (6,200으로 뒀더니 14,500이 아니라 15,700이 되어 버튼이 11고로 떴다) */
      api.setScore(5000);           // 이미 쌓아둔 상태에서 마지막 한 방
      api.setPlays(2);
      api.setJokers(['gwangpari', 'gwang_sujip', 'samgwang_nori',
                     'bigwang_usan', 'ogwang_kkum']);
      await api.center();
      // 광 5장을 흩어놓는다
      api.setHand([
        { month: 8, type: 'kwang' },          // ★
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 1, type: 'kwang' },          // ★
        { month: 12, type: 'kwang', tag: 'bikwang' },  // ★
        { month: 7, type: 'pi' },
        { month: 3, type: 'kwang' },          // ★
        { month: 9, type: 'pi' },
        { month: 11, type: 'kwang' },         // ★
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
      api.holdTally();          // 엠블럼이 끝날 때까지 숫자를 세지 않는다
      await api.play();
      await scoreShow(api, { power: 2.3, jokerGains: [3, 40, 60, 25, 90], hand: '오광',
                             goTo: 10 });

      /* 「고는 무제한」 — 이 게임의 정체성이자 마지막 한 방.
         앞의 두 판은 스톱을 골랐으니 여기서 고를 고르는 게 대비로 산다.
         연출은 새로 만들지 않고 **게임 자체의 고 캐스케이드**를 그대로 돌린다 —
         인게임 UI 그대로가 광고에서 훨씬 설득력 있다. */
      /* 고는 따로 외치지 않는다.
         「10고!」를 한 번 외치고 그 뒤에 캐스케이드가 또 10고까지 올라가면
         같은 말을 두 번 하는 꼴이다 → 점수 게이지가 차오르는 위에
         1고 2고 3고 …가 점점 빨라지며 박히는 것 하나로 끝낸다. */
      await api.wait(1400);
    },
  },
];

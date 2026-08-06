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
async function scoreShow(api, { power = 1, jokerGains = null, hand = '', goBig = '' } = {}) {
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
  /* 게이트를 풀어도 수식이 바로 뜨지 않는다.
     게임은 release 뒤에 배너 대기(340~480ms) → 배너 정리(160ms)를 거친 다음에야
     수식을 0.28초에 걸쳐 페이드 인한다. 즉 **release + 약 0.8초**에야 보인다.
     여기서 곧바로 마크를 찍었더니 컷 전체가 opacity 0인 빈 화면이었다. */
  api.releaseTally();
  await api.wait(860);
  api.mark('tally');                                    // 수식이 실제로 보이는 지점
  // 칩이 하나씩 더해지는 동안 숫자를 튀어오르게 한다
  for (let i = 0; i < 6; i++) {
    api.fx.pulse('#jt-chips', 420);
    await api.wait(300);
  }
  api.fx.pulse('#jt-mult', 520);
  await api.wait(420);

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
  api.mark('burst', { score: api.score, target: api.target });
  api.fx.gaugeBlast();
  api.fx.pulse('.vfx-scorepop .sp-cur', 620);
  await api.wait(560);
  api.fx.numberBurst(undefined, power);                 // 유일한 큰 한 방
  /* 마지막 한 방 — 앞에서 1고 → 5고 → 10고로 쌓아 올린 것을 여기서 두 배로 뛴다. */
  if (goBig) {
    await api.wait(620);
    api.mark('go', { score: api.score, target: api.target });
    // 11고부터 20고까지 파편이 튀며 밀려 올라간다 — 앞의 세 단계를 받아 두 배로
    await api.goChase(goBig.from, goBig.to);
    await api.wait(900);
  } else {
    await api.wait(2100);    // 폭발 여운
  }
}

/* 실패 — 「방자를 아냐고요?」 다음에 오는 첫 판. 여기서 방자는 진다.
 *
 * scoreShow의 정확한 반대로 만든다. 성공 컷에서 관객을 흥분시키는 장치를
 * **하나씩 빼는 것**이 연출이다:
 *   cardPops(팡팡) 없음 · 엠블럼 없음(족보가 아예 안 뜬다) · 흡수 없음
 *   · 조커 없음 · gaugeBlast 없음 · numberBurst 없음 · 고 없음
 * 남는 건 힘없는 슬램 하나, ×1짜리 수식, 그리고 목표 근처도 못 간 게이지다.
 *
 * 게임의 gameOver()는 부르지 않는다 — screen이 'gameover'로 바뀌면 판이 통째로
 * 지워져 방금 낸 패가 화면에서 사라진다. 실패는 숫자와 색으로만 말한다. */
async function failShow(api) {
  const before = api.scoreBefore ?? 0;
  api.mark('land');
  await api.wait(300);
  api.fx.slam(undefined, { amount: 5 });     // 내리꽂는 게 아니라 툭 놓인다
  api.anchor();
  api.mark('slam');
  await api.wait(760);

  /* 수식은 그대로 보여준다 — ×1이 떠야 "족보가 없다"가 읽힌다.
     성공 컷에서는 여기서 엠블럼이 배수 자리로 빨려 들어갔다. */
  api.releaseTally();
  await api.wait(860);
  api.mark('tally');
  await api.wait(1500);                      // pulse 없이 그냥 흘러간다

  const gain = Math.max(0, api.score - before);
  api.mark('sum');
  /* 팝업이 살아 있는 동안 「목표 미달」을 띄우면 글자가 팝업 머리에 걸친다.
     팝업 수명(d)이 끝나는 지점에서 문구가 들어오도록 붙인다. */
  api.fx.scorePop({ from: before, gain, target: api.target,
                    month: api.monthLabel(), d: 2500, cold: true,
                    countDelay: 420, countDur: 700 });
  await api.wait(2450);
  api.mark('fail');
  api.fx.callout('목표 미달', 1600, { cold: true });
  await api.wait(2000);
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

/* 몽타주용 한 조합 — 점수는 세지 않고 조합만 빠르게 꽂는다.
 *   손패 세팅 → 고르기 → 내기 → (집계 통스킵) → 착지 팡팡팡 → 엠블럼 → 고 한 단계
 * 카메라 앵커는 **첫 조합에서 한 번만** 잡는다. 조합이 바뀔 때마다 다시 잡으면
 * 화면이 조합마다 재포커싱돼 몽타주가 아니라 컷 모음으로 읽힌다. */
async function fastCombo(api, { n, hand, goFrom, goTo, cards, pick, first = false }) {
  api.resetPlay(6);
  api.setHand(cards);
  api.mark('h' + n);
  await api.wait(160);
  api.select(pick);
  api.mark('s' + n);
  await api.wait(300);
  await api.play();
  await api.skipJuice();          // 수식·카운팅은 건너뛴다
  await api.wait(460);            // 카드가 자리에 앉을 때까지
  api.fx.cardPops(70);            // await 하지 않는다 — 겹쳐 터져야 빠르다
  api.fx.slam(undefined, { amount: 10 });
  if (first) api.anchor();        // 카메라 기준점은 여기서 한 번만
  await api.wait(340);
  api.mark('e' + n);
  /* 수명은 다음 마크(g)까지 남는 시간(760ms)보다 짧아야 한다.
     길면 엠블럼이 살아 있는 채로 컷이 끝나 다음 컷 첫 프레임에 또 보인다. */
  api.fx.emblem(hand, 700);
  api.fx.text(hand, undefined, 700, 1.2);
  await api.wait(760);
  api.mark('g' + n);
  await api.goChase(goFrom, goTo);   // 파편 튀는 인게임 체이스 — 숫자가 밀려 올라간다
  await api.wait(200);               // 다음 조합으로 바로 — 빈 판을 오래 보이면 늘어진다
}

window.CAPTURE_SCENES = [
  {
    id: 'A1',
    label: '사이클 1 — 1월, 무조합 실패',
    record: 24000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(1);              // 목표 160
      api.setMoney(4);
      api.setScore(0);
      api.setPlays(3);
      /* 특수패 0 — 아직 아무것도 없는 상태다. 이 실패가 곧 주막에 가는 이유고,
         춘향이 특수패 두 장을 빼주는 이유다. 여기서 이기면 뒤가 전부 무너진다. */
      api.setJokers([]);
      await api.center();
      /* 낼 패는 서로 아무 관계가 없는 3장 — detectHand가 'none'(배수 1)을 낸다.
           1월 피 · 5월 열끗 · 9월 청단
         광 0장, 같은 달 없음, 새(2·4·8월 열끗) 없음, 띠가 한 장뿐이라 단도 안 선다.
         손패 자체에도 애초에 답이 없다 — 홍단·고도리 재료를 섞어두면
         "왜 저걸 안 내지?"가 되어 실패가 방자의 무능으로 읽힌다. */
      api.setHand([
        { month: 1, type: 'pi' },                    // ★
        { month: 6, type: 'pi' },
        { month: 5, type: 'yeol' },                  // ★
        { month: 11, type: 'pi' },
        { month: 7, type: 'pi' },
        { month: 9, type: 'tti', tag: 'cheongdan' }, // ★
        { month: 4, type: 'pi' },
        { month: 2, type: 'pi' },      // 12월엔 피가 없다(쌍피뿐) — 2월 피로
      ]);
      api.mark('hand');
      await api.wait(900);
      api.select([
        { month: 1, type: 'pi' },
        { month: 5, type: 'yeol' },
        { month: 9, type: 'tti', tag: 'cheongdan' },
      ]);
      api.mark('select');
      await api.wait(520);
      api.mark('play');
      api.holdTally();
      await api.play();
      await failShow(api);
    },
  },

  {
    id: 'A2',
    label: '상점 — 춘향의 뒷거래 → 특수패 구매',
    record: 17500,
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
      await api.wait(700);
      /* 「춘향의 뒷거래」 — 살 두 장은 그냥 진열돼 있지 않다. 화면 밖에서 돌려져 들어온다.
         H2에서 춘향이 덱 밑에서 빼 튕겨 보낸 그 두 장이 여기 도착하는 것이다.
         세 번째(pi_merchant)에는 걸지 않는다 — 대비가 있어야 두 장이 특별해진다. */
      api.mark('deal1');
      await api.fx.dealIn(1);
      await api.wait(180);
      api.mark('deal2');
      await api.fx.dealIn(0);
      await api.wait(420);
      api.fx.dealDone();
      await api.wait(520);      // 조명이 돌아오는 시간(.42s)
      /* 구매에 인과를 준다: 카메라가 상품을 조준(aim) → 사면 그 패가
         퓽 날아가 상단 조커바에 박힌다(fly). 예전엔 그냥 반짝이기만 했다. */
      /* 무엇을 사는지 읽혀야 한다 → 카메라가 그 상품 하나에 바짝 붙는다(aim).
         산 패는 프레임 밖 조커바가 아니라 상점 안 '보유 칸'으로 날아가 생긴다. */
      api.aim(1);
      api.mark('aim');
      api.fx.pulse('#shop-offers .offer.cap-aim .o-name', 560);
      await api.wait(550);
      api.mark('fly');
      await api.fx.flyToJoker(1, () => api.buy(1), 560, 520, { seal: true });   // 삼광판
      api.aim(null);
      await api.wait(520);
      api.aim(0);
      api.mark('aim2');
      api.fx.pulse('#shop-offers .offer.cap-aim .o-name', 560);
      await api.wait(480);
      api.mark('fly2');
      // 두 번째 구매는 '산다'가 이미 전달됐다 — 중앙에 머무는 시간을 절반으로
      await api.fx.flyToJoker(0, () => api.buy(0), 560, 260, { seal: true });   // 광모이
      api.aim(null);
      await api.wait(900);
    },
  },

  {
    id: 'A3',
    label: '몽타주 — 고도리 → 총통 → 오광',
    record: 42000,
    async run(api) {
      api.clean({ keepJokers: true });
      api.setRound(9);              // 목표 2,200
      api.setMoney(46);
      /* 세 조합이 더하는 점수 = 고도리 180 + 총통 140 + 오광 9,500 = **9,820**
         (엔진으로 실측. 병풍을 뺀 손실은 138점뿐이라 시작값을 안 건드려도 된다)
         마지막에 「20고!」를 띄우려면 20고 문턱(2,200 × 13 = 28,600)은 넘고
         21고 문턱(29,920)은 안 넘어야 한다
         → 시작값 허용 범위 18,780 ~ 20,099 → 19,000 유지 → 최종 28,820. */
      api.setScore(19000);
      api.setPlays(6);
      api.setJokers(['gwangpari', 'gwang_sujip', 'samgwang_nori',
                     'bigwang_usan', 'ogwang_kkum']);
      await api.center();

      /* 앞의 두 조합은 **점수를 세지 않는다.** 조합을 알아보는 것만으로 충분하고,
         매번 수식을 돌리면 같은 리듬이 세 번 반복돼 늘어진다.
         대신 조합이 꽂힐 때마다 특수패바와 낸 패 사이에서 고가 쭉쭉 오른다.

         병풍은 뺐다 — 5장을 깔아야 해서 혼자만 리듬이 길고, 「고도리 → 총통 → 오광」이
         광·새·같은달로 한 줄에 꿰이는 데 비해 연속월은 눈에 안 들어온다. */
      await fastCombo(api, { n: 1, hand: '고도리', goFrom: 0, goTo: 5, first: true,
        cards: [
          { month: 2, type: 'yeol', tag: 'godori' },      // ★
          { month: 5, type: 'pi' },
          { month: 4, type: 'yeol', tag: 'godori' },      // ★
          { month: 10, type: 'pi' },
          { month: 8, type: 'yeol', tag: 'godori' },      // ★
          { month: 1, type: 'pi' },
          { month: 6, type: 'pi' },
          { month: 3, type: 'tti', tag: 'hongdan' },
        ],
        pick: [
          { month: 2, type: 'yeol', tag: 'godori' },
          { month: 4, type: 'yeol', tag: 'godori' },
          { month: 8, type: 'yeol', tag: 'godori' },
        ] });

      await fastCombo(api, { n: 2, hand: '총통', goFrom: 5, goTo: 10,
        cards: [
          { month: 10, type: 'yeol' },                    // ★
          { month: 2, type: 'pi' },
          { month: 10, type: 'tti', tag: 'cheongdan' },   // ★
          { month: 7, type: 'pi' },
          { month: 10, type: 'pi' },                      // ★
          { month: 5, type: 'tti', tag: 'chodan' },
          { month: 10, type: 'pi' },                      // ★
          { month: 9, type: 'pi' },
        ],
        pick: [
          { month: 10, type: 'yeol' },
          { month: 10, type: 'tti', tag: 'cheongdan' },
          { month: 10, type: 'pi' },
          { month: 10, type: 'pi' },
        ] });

      // ── 마지막 오광만 풀코스로 터뜨린다 ──
      api.resetPlay(2);
      api.setHand([
        { month: 8, type: 'kwang' },                      // ★
        { month: 2, type: 'yeol', tag: 'godori' },
        { month: 1, type: 'kwang' },                      // ★
        { month: 12, type: 'kwang', tag: 'bikwang' },     // ★
        { month: 7, type: 'pi' },
        { month: 3, type: 'kwang' },                      // ★
        { month: 9, type: 'pi' },
        { month: 11, type: 'kwang' },                     // ★
      ]);
      api.mark('hand');
      await api.wait(500);
      api.select([
        { month: 1, type: 'kwang' },
        { month: 3, type: 'kwang' },
        { month: 8, type: 'kwang' },
        { month: 11, type: 'kwang' },
        { month: 12, type: 'kwang', tag: 'bikwang' },
      ]);
      api.mark('select');
      await api.wait(420);
      api.mark('play');
      api.holdTally();
      await api.play();
      await scoreShow(api, { power: 2.3, jokerGains: [3, 40, 60, 25, 90],
                             hand: '오광', goBig: { from: 10, to: 20 } });
    },
  },
];

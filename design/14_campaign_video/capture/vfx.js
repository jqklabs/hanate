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
    border: 5px solid rgba(255, 214, 130, .95);
    box-shadow: 0 0 40px rgba(255,196,90,.9), inset 0 0 30px rgba(255,196,90,.5);
    transform: translate(-50%, -50%) scale(.06); opacity: 1;
    animation: vfxRing var(--d, 900ms) cubic-bezier(.16,.9,.3,1) forwards;
  }
  @keyframes vfxRing {
    0%   { transform: translate(-50%,-50%) scale(.06); opacity: 1; border-width: 14px; }
    100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; border-width: 1px; }
  }
  .vfx-rays {
    position: absolute; width: 2400px; height: 2400px;
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
    0%   { transform: translate(-50%,-50%) scale(.35); opacity: 0; }
    16%  { transform: translate(-50%,-50%) scale(1.18); opacity: 1; }
    28%  { transform: translate(-50%,-50%) scale(1.0); }
    72%  { transform: translate(-50%,-50%) scale(1.03); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.12); opacity: 0; }
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
    position: absolute; height: 10px; transform-origin: 0 50%;
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(255,240,200,0), #ffe6a8 22%, #fff8e6 60%, #ffd070);
    box-shadow: 0 0 26px rgba(255,205,110,.98), 0 0 60px rgba(255,170,60,.7);
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
    position: absolute; width: 260px; height: 260px; border-radius: 50%;
    transform: translate(-50%,-50%) scale(.2);
    background: radial-gradient(circle, rgba(255,248,224,.95) 0%, rgba(255,196,90,.55) 42%, transparent 70%);
    animation: vfxHit 420ms cubic-bezier(.15,.9,.3,1) forwards;
  }
  @keyframes vfxHit {
    0%   { transform: translate(-50%,-50%) scale(.2); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
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
    if (!ok) return { x: innerWidth / 2, y: innerHeight * 0.42 };
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
    text(str, sel = CARDS, d = 1500, power = 1) {
      const { x, y } = at(sel);
      const el = document.createElement('div');
      el.className = 'vfx-text';
      el.textContent = str;
      // 체급이 커질수록 글자도 커진다 (고도리 < 삼광 < 오광)
      el.style.cssText += `left:${x}px;top:${y}px;font-size:${Math.round(170 * power)}px;`;
      el.style.setProperty('--d', d + 'ms');
      add(el, d + 100);
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
    numberBurst(sel = '#juice-tally', power = 1) {
      const p = Math.max(0.6, Math.min(2.4, power));
      VFX.pulse('#jt-score', 620);
      VFX.flash(`rgba(255,246,220,${Math.min(0.98, 0.6 * p)})`, 560 + 160 * p);
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

        VFX.shoot(e, '#scorepanel', 340);      // 점수판으로 꽂는다
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
    gaugeBlast(sel = '#gauge') {
      const e = document.querySelector(sel);
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

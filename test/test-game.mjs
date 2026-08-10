// index.html의 ENGINE 구간을 추출해 단위 테스트 + 풀런 시뮬레이션 (v2: 12판·계절·밤낮·고 무제한)
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const startMark = html.indexOf('==== ENGINE START ====');
const codeStart = html.indexOf('*/', startMark) + 2;
const endMark = html.indexOf('==== ENGINE END ====');
const codeEnd = html.lastIndexOf('/*', endMark);
const src = html.slice(codeStart, codeEnd);

const E = new Function(src + `
return { mulberry32, shuffle, buildDeck, CHIP, effType, baseChip, HANDS, HAND_BY_ID, handDisplayName,
  ROUNDS, TARGETS, BOSS_ROUNDS, MILD_BOSSES, goMult, goBonus, goThreshold, goLevelReached, detectHand, detectHandInfo, cardChip,
  combosOf, evaluateHand, JOKERS, JOKER_BY_ID, BOSSES, BOSS_BY_ID, computeScore, jokerMarginalGain,
  rollJokerRarity, RARITY_ORDER };`)();

let fails = 0;
const assert = (cond, msg) => {
  if (!cond) { console.error('  FAIL:', msg); fails++; }
  else console.log('  ok:', msg);
};
const env = (o = {}) => ({ boss: null, jokerIds: [], mitjangChips: 0, ...o });

// ─── 1. 덱 구성 ───────────────────────────────────────────
console.log('[1] 덱 구성');
{
  const d = E.buildDeck();
  assert(d.length === 48, '48장');
  const n = (t) => d.filter((c) => c.type === t).length;
  assert(n('kwang') === 5 && n('yeol') === 9 && n('tti') === 10 && n('ssangpi') === 2 && n('pi') === 22,
    '광5 열9 띠10 쌍피2 피22');
  assert(d.filter((c) => c.tags.includes('godori')).every((c) => [2, 4, 8].includes(c.month)), '고도리 새 2·4·8월');
  assert(E.ROUNDS === 12 && E.TARGETS.length === 12, '12판 · 목표 12개');
  assert(JSON.stringify(E.BOSS_ROUNDS) === '[3,6,9,12]', '박 라운드 3·6·9·12월');
}

// ─── 2. 족보 판정 (회귀) ──────────────────────────────────
console.log('[2] 족보 판정');
{
  const d = E.buildDeck();
  const pick = (p) => d.filter(p);
  const det = E.detectHand;
  const kw = pick((c) => c.type === 'kwang');
  assert(det(kw) === 'ogwang' && det(kw.slice(0, 4)) === 'sagwang', '오광/사광');
  assert(det(pick((c) => c.month === 1)) === 'chongtong', '총통');
  assert(det(pick((c) => c.tags.includes('godori'))) === 'godori', '고도리');
  assert(det(pick((c) => c.tags.includes('hongdan'))) === 'dan', '홍단');
  // 비고도리: 12월 제비 + 고도리 새 2장
  const birds = pick((c) => c.tags.includes('godori'));
  const swallow = pick((c) => c.tags.includes('biyeol'))[0];
  assert(det([swallow, birds[0], birds[1]]) === 'bigodori', '비고도리');
  // 병풍: 연속 달 5개 (단·폭탄에 안 걸리게 피만)
  const mByeong = [1, 2, 3, 4, 5].map((m) => pick((c) => c.month === m && c.type === 'pi')[0]);
  assert(det(mByeong) === 'byeongpung', '병풍(1~5월)');
  assert(E.HAND_BY_ID.byeongpung.mult === 3, '병풍 ×3');
  assert(det([1, 2, 3].map((m) => pick((c) => c.month === m && c.type === 'pi')[0])) !== 'byeongpung',
    '연속 3달은 병풍 아님');
  // 폭탄(같은 달 3장)
  const m1three = pick((c) => c.month === 1).slice(0, 3);
  assert(det(m1three) === 'month3', '폭탄(같은 달 3장)');
  assert(E.HAND_BY_ID.month3.name === '폭탄', 'month3 표시명 = 폭탄');
  // 팝업 표시명
  const m1two = pick((c) => c.month === 1).slice(0, 2);
  assert(E.handDisplayName('month2', m1two) === '1월 2장', 'month2 팝업 = N월 2장');
  assert(E.handDisplayName('dan', pick((c) => c.tags.includes('hongdan'))) === '홍단', 'dan 팝업 = 홍단');
  assert(E.handDisplayName('dan', pick((c) => c.tags.includes('cheongdan'))) === '청단', 'dan 팝업 = 청단');
  assert(E.handDisplayName('dan', pick((c) => c.tags.includes('chodan'))) === '초단', 'dan 팝업 = 초단');
  // 비초단은 삭제됨 — 비띠+초단2는 병풍/띠셋/무조합 등으로만
  const cho = pick((c) => c.tags.includes('chodan'));
  const biti = pick((c) => c.tags.includes('bi_tti'))[0];
  assert(det([biti, cho[0], cho[1]]) !== 'bichodan', '비초단 삭제');
  // 피5: 연속 달이 아니게 흩어 병풍에 안 걸리게
  const pisScattered = [
    ...pick((c) => c.type === 'pi' && c.month === 1),
    ...pick((c) => c.type === 'pi' && c.month === 5),
    pick((c) => c.type === 'pi' && c.month === 8)[0],
  ];
  assert(det(pisScattered) === 'pi5', '피5 (비연속 달)');
  // 쌍피=2 환산: 피3 + 쌍피1 = 피 환산 5 → 피5 (카드 4장)
  const pi3 = pick((c) => c.type === 'pi' && c.month === 1).concat(pick((c) => c.type === 'pi' && c.month === 5).slice(0, 1));
  const sp = pick((c) => c.type === 'ssangpi')[0];
  assert(det([...pi3, sp]) === 'pi5', '쌍피=2 환산으로 피3+쌍피1 → 피5');
  // 열끗 섞어도 피 환산≥5면 피5, 열끗은 코어 밖(flat) — 열끗 달이 병풍을 만들지 않게
  const yeolExtra = pick((c) => c.type === 'yeol' && c.month === 9)[0];
  const pi5plusYeol = E.detectHandInfo([...pi3, sp, yeolExtra]);
  assert(pi5plusYeol.handId === 'pi5' && !pi5plusYeol.core.includes(yeolExtra),
    '피5+열끗 → 피5, 열끗은 flat');
  // 비단은 띠 셋에서 제외: 홍단+청단+비단 → 띠셋 아님
  const hong1 = pick((c) => c.tags.includes('hongdan'))[0];
  const cheong1 = pick((c) => c.tags.includes('cheongdan'))[0];
  assert(det([hong1, cheong1, biti]) !== 'tti3', '비단 포함 3띠 → 띠셋 아님');
  // 홍단+청단+초단 → 띠셋
  const cho1 = pick((c) => c.tags.includes('chodan'))[0];
  assert(det([hong1, cheong1, cho1]) === 'tti3', '홍·청·초단 → 띠셋');
  // 홍단2+청단+비단: 띠셋 코어에 비단 없음
  const hong2 = pick((c) => c.tags.includes('hongdan'));
  const infoTti = E.detectHandInfo([...hong2.slice(0, 2), cheong1, biti]);
  assert(infoTti.handId === 'tti3' && !infoTti.core.some((c) => c.tags.includes('bi_tti')),
    '띠셋 코어에 비단 미포함');
}

// ─── 3. 계절(이달의 패) + 밤일낮장 ────────────────────────
console.log('[3] 계절 · 밤낮 보정');
{
  const d = E.buildDeck();
  const pick = (p) => d.filter(p);
  const m1kwang = pick((c) => c.month === 1 && c.type === 'kwang')[0];
  const m1pi = pick((c) => c.month === 1 && c.type === 'pi')[0];
  const m2tti = pick((c) => c.month === 2 && c.type === 'tti')[0];

  assert(E.cardChip(m1kwang, env()) === 12, '보정 없음: 광 12');
  assert(E.cardChip(m1kwang, env({ seasonMonth: 1 })) === 24, '이달의 패: 광 12→24');
  assert(E.cardChip(m1kwang, env({ seasonMonth: 1, night: false })) === 26, '낮: 광 24+2=26');
  assert(E.cardChip(m1kwang, env({ seasonMonth: 2, night: true })) === 12, '밤은 광에 보너스 없음');
  assert(E.cardChip(m1pi, env({ seasonMonth: 1, night: true })) === 6, '이달+밤: 피 2×2+2=6');
  assert(E.cardChip(m2tti, env({ seasonMonth: 1, night: true })) === 8, '밤: 띠 6+2=8');
  assert(E.cardChip(m1pi, env({ seasonMonth: 1, night: true, boss: 'pibak' })) === 0, '피박은 계절 보정도 0으로');
  assert(E.cardChip(m1pi, env({ seasonMonth: 1, night: true, boss: 'pibak', jokerIds: ['pibak_boheom'] })) === 6, '피박보험 시 보정 복구');

  // computeScore 통합: 1월 피 2장(이달), 낮 → month2 = (4 + 4) × 2 = 16 (족보 기본칩 없음)
  const m1pis = pick((c) => c.month === 1 && c.type === 'pi');
  const r = E.computeScore(m1pis, env({ seasonMonth: 1, night: false }));
  assert(r.handId === 'month2' && r.score === 16, `계절 통합 16점 (실제 ${r.score})`);
}

// ─── 3.5 코어/플랫 분리 (족보 구성 카드만 배수) ────────────
console.log('[3.5] 코어/플랫 분리');
{
  const d = E.buildDeck();
  const pick = (p) => d.filter(p);
  // 삼광(비광 제외) + 피 2장: (광12×3)×5 + 피2×2 = 180 + 4 = 184
  const kw3 = pick((c) => c.type === 'kwang' && !c.tags.includes('bikwang')).slice(0, 3);
  const pi2 = pick((c) => c.type === 'pi' && c.month === 5);
  const r = E.computeScore([...kw3, ...pi2], env());
  assert(r.handId === 'samgwang' && r.flat === 4 && r.score === 184,
    `삼광+피2 = 184점, flat 4 (실제 ${r.score}, flat ${r.flat})`);
  // 코어만 낼 때는 flat 0
  const r2 = E.computeScore(kw3, env());
  assert(r2.flat === 0 && r2.score === 36 * 5, `삼광만 = 180 (실제 ${r2.score})`);
  // month2 짝 2개면 기본칩 합 높은 쪽이 코어
  const m1 = pick((c) => c.month === 1 && c.type !== 'kwang').slice(0, 2); // 띠6+피2 = 8
  const m11 = pick((c) => c.month === 11 && c.type !== 'kwang').slice(0, 2); // 쌍피5+피2 = 7
  const info = E.detectHandInfo([...m1, ...m11]);
  assert(info.handId === 'month2' && info.core.every((c) => c.month === 1), 'month2 짝 2개 → 칩 높은 1월 코어');
  // 무조합은 전부 코어 (flat 0, 배수 1)
  const noneCards = [pick((c) => c.month === 1 && c.type === 'kwang')[0], pick((c) => c.month === 2 && c.type === 'pi')[0]];
  const r3 = E.computeScore(noneCards, env());
  assert(r3.handId === 'none' && r3.flat === 0 && r3.score === 12 + 2, `무조합 카드합 (실제 ${r3.score}, flat ${r3.flat})`);
  // 열끗 5장: 코어 3장만 배수, 나머지 2장은 flat
  const yeol5 = pick((c) => c.type === 'yeol').slice(0, 5);
  const ry = E.computeScore(yeol5, env());
  assert(ry.handId === 'yeol3' && ry.flat === 16 && ry.score === 8 * 3 * 3 + 16,
    `열끗5 = (24)×3 + 16 = 88 (실제 score ${ry.score}, flat ${ry.flat})`);
}

// ─── 4. 고 무제한 공식 ────────────────────────────────────
console.log('[4] 고 무제한');
{
  assert(E.goMult(1) === 1.6 && E.goMult(2) === 2.2 && E.goMult(5) === 4 && E.goMult(10) === 7, 'goMult 1.6/2.2/4/7');
  assert(E.goBonus(3, 1) === 3 && E.goBonus(3, 2) === 6 && E.goBonus(2, 9) === 18 && E.goBonus(9, 2) === 18,
    'goBonus n×m');
  // 밀치기 고: 이미 넘은 문턱은 전부 소급 인정, 선언 단계 = 아직 못 넘은 첫 문턱
  // 1고=ceil(160×1.6)=256, 3고=ceil(160×2.8)=448
  assert(E.goThreshold(160, 1) === 256 && E.goThreshold(160, 3) === 448, 'goThreshold 256/448');
  assert(E.goLevelReached(160, 200, 0) === 0, '문턱 미달이면 소급 없음 (일반 1고)');
  assert(E.goLevelReached(160, 260, 0) === 1, '260점 = 1고 문턱(256) 소급');
  assert(E.goLevelReached(160, 450, 0) === 3, '450점 = 3고 문턱(448)까지 밀치기');
  assert(E.goLevelReached(160, 450, 5) === 5, '현재 goLevel 미만으로는 안 내려감');
  // 선언 목표는 항상 현재 점수보다 큼 → 고 선언 즉시 재충족(연쇄 고) 불가
  for (const [base, score, cur] of [[160, 200, 0], [160, 260, 0], [160, 450, 0], [160, 3449, 2], [5500, 30000, 1]]) {
    const declared = E.goLevelReached(base, score, cur) + 1;
    assert(E.goThreshold(base, declared) > score, `선언 목표(${base}, 점수 ${score}) > 현재 점수`);
  }
}

// ─── 5. 특수패·박 (회귀 축약) ─────────────────────────────
console.log('[5] 특수패·박 회귀');
{
  const d = E.buildDeck();
  const pick = (p) => d.filter(p);
  const hong = pick((c) => c.tags.includes('hongdan'));
  assert(E.computeScore(hong, env({ jokerIds: ['dangol'] })).mult === 11, '단골 dan +7배수');
  const m1pi2 = pick((c) => c.month === 1 && c.type === 'pi');
  assert(E.computeScore(m1pi2, env({ jokerIds: ['heundeulgi'] })).mult === 3, '흔들기 ×1.5');
  assert(E.computeScore(m1pi2, env({ jokerIds: ['heundeulgi'], boss: 'no_shake' })).handId === 'none', 'no_shake 강등');
  // 멍박: 열끗 칩 0
  const yeol1 = pick((c) => c.type === 'yeol')[0];
  assert(E.computeScore([yeol1], env({ boss: 'meongbak' })).chips === 0, '멍박 시 열끗 칩 0');
  // 비광우산: 12월을 삼광·고도리·초단에 편입 + 코어에 12월이면 ×2
  const bikwang = pick((c) => c.tags.includes('bikwang'))[0];
  const sam = pick((c) => c.type === 'kwang' && !c.tags.includes('bikwang')).slice(0, 2);
  const rUsan = E.computeScore([...sam, bikwang], env({ jokerIds: ['bigwang_usan'] }));
  assert(rUsan.handId === 'samgwang' && rUsan.mult === 10, `우산 비광삼광 → 삼광×2 (실제 hand=${rUsan.handId} mult=${rUsan.mult})`);
  // 우산 없으면 기존처럼 비삼광
  const rNoUsan = E.computeScore([...sam, bikwang], env());
  assert(rNoUsan.handId === 'bisamgwang' && rNoUsan.mult === 4, `무우산 비삼광 ×4 (실제 ${rNoUsan.handId}/${rNoUsan.mult})`);
  // 제비+고도리2 → 우산이면 고도리(×6×2=12), 없으면 비고도리
  const birds = pick((c) => c.tags.includes('godori'));
  const swallow = pick((c) => c.tags.includes('biyeol'))[0];
  const rGodoriUsan = E.computeScore([swallow, birds[0], birds[1]], env({ jokerIds: ['bigwang_usan'] }));
  assert(rGodoriUsan.handId === 'godori' && rGodoriUsan.mult === 12,
    `우산 제비고도리 → 고도리×2 (실제 ${rGodoriUsan.handId}/${rGodoriUsan.mult})`);
  // 비단+초단2 → 우산이면 초단(×4×2=8)
  const cho = pick((c) => c.tags.includes('chodan'));
  const biti = pick((c) => c.tags.includes('bi_tti'))[0];
  const rChoUsan = E.computeScore([biti, cho[0], cho[1]], env({ jokerIds: ['bigwang_usan'] }));
  assert(rChoUsan.handId === 'dan' && rChoUsan.mult === 8,
    `우산 비단초단 → 초단×2 (실제 ${rChoUsan.handId}/${rChoUsan.mult})`);
  assert(E.handDisplayName('dan', [biti, cho[0], cho[1]]) === '초단', '우산 비단초단 표시명=초단');
  const hong1 = pick((c) => c.tags.includes('hongdan'))[0];
  const cheong1 = pick((c) => c.tags.includes('cheongdan'))[0];
  const rTtiUsan = E.computeScore([hong1, cheong1, biti], env({ jokerIds: ['bigwang_usan'] }));
  assert(rTtiUsan.handId === 'tti3' && rTtiUsan.mult === 6 && rTtiUsan.core.some((c) => c.tags.includes('bi_tti')),
    `우산 홍·청·비단 → 띠셋×2 (실제 ${rTtiUsan.handId}/${rTtiUsan.mult})`);
  const tti3 = [
    pick((c) => c.tags.includes('hongdan'))[0],
    pick((c) => c.tags.includes('cheongdan'))[0],
    pick((c) => c.tags.includes('chodan'))[0],
  ];
  const rFlat = E.computeScore([...tti3, biti], env({ jokerIds: ['bigwang_usan'] }));
  assert(rFlat.handId === 'tti3' && rFlat.mult === 3, `비단 flat만으론 우산 미발동 (실제 ${rFlat.mult})`);
  const none12 = [bikwang, pick((c) => c.month === 1 && c.type === 'pi')[0]];
  const rNone = E.computeScore(none12, env({ jokerIds: ['bigwang_usan'] }));
  assert(rNone.handId === 'none' && rNone.mult === 1, `무조합+12월 우산 미발동 (실제 ${rNone.mult})`);
  // +칩 특수패는 flat(배수 밖)
  const yeol3 = pick((c) => c.type === 'yeol').slice(0, 3);
  const rMeong = E.computeScore(yeol3, env({ jokerIds: ['meongtta'] }));
  assert(rMeong.handId === 'yeol3' && rMeong.chips === 24 && rMeong.flat === 18 && rMeong.score === 24 * 3 + 18,
    `멍따는 flat +18 (실제 chips ${rMeong.chips} flat ${rMeong.flat} score ${rMeong.score})`);
  const pi2 = pick((c) => c.type === 'pi').slice(0, 2);
  const rPi = E.computeScore(pi2, env({ jokerIds: ['pi_merchant'] }));
  assert(rPi.flat === 8 && rPi.score === rPi.chips * rPi.mult + 8,
    `피장사도 flat (실제 flat ${rPi.flat} score ${rPi.score})`);
  // 4티어 로스터·신규 훅
  assert(E.JOKERS.length === 22, `특수패 22종 (실제 ${E.JOKERS.length})`);
  const byR = (r) => E.JOKERS.filter((j) => j.rarity === r).length;
  assert(byR('common') === 6 && byR('rare') === 7 && byR('epic') === 6 && byR('legendary') === 3,
    `티어 분포 6/7/6/3 (실제 ${byR('common')}/${byR('rare')}/${byR('epic')}/${byR('legendary')})`);
  const ssang = pick((c) => c.type === 'ssangpi').slice(0, 1);
  const rSs = E.computeScore(ssang, env({ jokerIds: ['ssangpi_sarang'] }));
  assert(rSs.flat === 12, `쌍피보따리 flat +12 (실제 ${rSs.flat})`);
  const rYj = E.computeScore(yeol3, env({ jokerIds: ['yeol_janchi'] }));
  assert(rYj.handId === 'yeol3' && rYj.mult === 6, `멍잔치 ×2 (실제 mult ${rYj.mult})`);
  const mixed = [yeol3[0], pick((c) => c.month === 1 && c.type === 'pi')[0], pick((c) => c.month === 3 && c.type === 'pi')[0]];
  const rSip = E.computeScore(mixed, env({ jokerIds: ['sipidal'] }));
  assert(rSip.mult === E.HAND_BY_ID[rSip.handId].mult + 6, `열두사철 달3 × +2 (실제 mult ${rSip.mult})`);
  const rPae = E.computeScore(yeol3, env({ jokerIds: ['paewang'] }));
  assert(rPae.mult === 6, `명인 무조합 아니면 ×2 (실제 ${rPae.mult})`);
  const rPaeNone = E.computeScore([yeol1], env({ jokerIds: ['paewang'] }));
  assert(rPaeNone.handId === 'none' && rPaeNone.mult === 1, '명인 무조합 ×1');
  const rOg = E.computeScore([...sam, bikwang], env({ jokerIds: ['ogwang_kkum'] }));
  assert(rOg.mult === 10, `오광소원 비삼광 ×2.5 (실제 ${rOg.mult})`); // 4 × 2.5
  // 삼광판: 낸 광마다 +3 — 사광 배수가 비삼광보다 작아지지 않음 (역행 방지)
  const gwang3 = pick((c) => c.type === 'kwang' && !c.tags.includes('bikwang')).slice(0, 3);
  const gwang4 = [...gwang3.slice(0, 2), bikwang, gwang3[2]]; // 비광 포함 4장 → 사광
  const rNori3 = E.computeScore(gwang3, env({ jokerIds: ['samgwang_nori'] }));
  const rNori4 = E.computeScore(gwang4, env({ jokerIds: ['samgwang_nori'] }));
  assert(rNori3.handId === 'samgwang' && rNori3.mult === 5 + 9,
    `삼광판 광3 = 5+9 (실제 hand=${rNori3.handId} mult=${rNori3.mult})`);
  assert(rNori4.handId === 'sagwang' && rNori4.mult === 8 + 12,
    `삼광판 광4 = 8+12 (실제 hand=${rNori4.handId} mult=${rNori4.mult})`);
  assert(rNori4.score > rNori3.score, `삼광판 광4 점수 > 광3 (실제 ${rNori4.score} vs ${rNori3.score})`);
  // leave-one-out 기여도
  const rPiBase = E.computeScore(pi2, env());
  const gainPi = E.jokerMarginalGain(pi2, env({ jokerIds: ['pi_merchant'] }), 'pi_merchant');
  assert(gainPi === rPi.score - rPiBase.score && gainPi === 8,
    `피장사 기여도 +8 (실제 ${gainPi})`);
  assert(E.jokerMarginalGain(pi2, env({ jokerIds: ['pi_merchant'] }), 'gwangpari') === 0,
    '미보유 특수패 기여도 0');
}

// ─── 6. evaluateHand (춘향 훈수 엔진) ─────────────────────
console.log('[6] evaluateHand');
{
  const d = E.buildDeck();
  const pick = (p) => d.filter(p);
  const hand = [...pick((c) => c.tags.includes('hongdan')), ...pick((c) => c.type === 'pi').slice(0, 5)];
  const best = E.evaluateHand(hand, env());
  assert(best && best.handId === 'dan', `최적 조합 = 홍단 (실제 ${best.handId})`);
  // 뒷면 제외
  hand[0].faceDown = true;
  const best2 = E.evaluateHand(hand, env());
  assert(best2.handId !== 'dan', '뒷면 카드는 후보에서 제외');
  hand[0].faceDown = false;
  // 열끗 3장 → 열끗셋
  const y3 = pick((c) => c.type === 'yeol').slice(0, 3);
  const best3 = E.evaluateHand(y3, env());
  assert(best3.handId === 'yeol3', '열끗 3장 → 열끗셋');
}

// ─── 7. 풀런 시뮬레이션 (12판 · 계절 · 밤낮) ──────────────
console.log('[7] 풀런 시뮬레이션');
{
  const tierRank = { common: 1, rare: 2, epic: 3, legendary: 4 };
  /** 가성비: 티어↑·가격↓ 우선, 최소 예비금 2냥 유지 */
  function shopBuy(money, jokers, rng) {
    const owned = new Set(jokers);
    const pool = E.JOKERS.filter((j) => !owned.has(j.id));
    const offers = [];
    for (let i = 0; i < 3; i++) {
      const avail = pool.filter((j) => !offers.includes(j));
      if (!avail.length) break;
      const want = E.rollJokerRarity(rng);
      let cands = avail.filter((j) => j.rarity === want);
      if (!cands.length) {
        for (const r of E.RARITY_ORDER) {
          cands = avail.filter((j) => j.rarity === r);
          if (cands.length) break;
        }
      }
      if (!cands.length) cands = avail;
      offers.push(cands[Math.floor(rng() * cands.length)]);
    }
    offers.sort((a, b) => {
      const va = (tierRank[a.rarity] || 0) * 10 - a.price;
      const vb = (tierRank[b.rarity] || 0) * 10 - b.price;
      return vb - va;
    });
    for (const o of offers) {
      if (jokers.length >= 5) break;
      if (money >= o.price + 2) { money -= o.price; jokers.push(o.id); }
    }
    return money;
  }

  function simulate(seed, buyAI) {
    const rng = E.mulberry32(seed);
    let money = 5, jokers = [], mitjangChips = 0;
    const usedBosses = [];
    for (let round = 1; round <= E.ROUNDS; round++) {
      let boss = null;
      if (E.BOSS_ROUNDS.includes(round)) {
        const pool = (round === 3 ? E.MILD_BOSSES : E.BOSSES.map((b) => b.id)).filter((id) => !usedBosses.includes(id));
        boss = pool[Math.floor(rng() * pool.length)];
        usedBosses.push(boss);
      }
      const deck = E.shuffle(E.buildDeck(), rng);
      let hand = [];
      const refill = () => { while (hand.length < 8 && deck.length) hand.push(deck.pop()); };
      refill();
      let score = 0, playsLeft = 4, discardsLeft = boss === 'bibaram' ? 0 : 4;
      const target = E.TARGETS[round - 1];
      const e = () => ({ boss, jokerIds: jokers, mitjangChips, seasonMonth: round, night: round % 2 === 0 });

      while (playsLeft > 0 && score < target) {
        let best = E.evaluateHand(hand, e());
        const need = (target - score) / playsLeft;
        if (discardsLeft > 0 && best.score < need && deck.length > 0) {
          const keep = new Set(best.cards.map((c) => c.uid));
          const junk = hand.filter((c) => !keep.has(c.uid)).sort((a, b) => E.baseChip(a) - E.baseChip(b)).slice(0, 3);
          if (junk.length) {
            discardsLeft--;
            if (jokers.includes('mitjang')) mitjangChips += 10;
            hand = hand.filter((c) => !junk.includes(c));
            refill();
            best = E.evaluateHand(hand, e());
          }
        }
        score += best.score;
        const ids = new Set(best.cards.map((c) => c.uid));
        hand = hand.filter((c) => !ids.has(c.uid));
        playsLeft--;
        refill();
        if (hand.length > 8) throw new Error('손패 8장 초과');
      }
      if (score < target) return { cleared: round - 1 };
      const interest = Math.min(Math.floor(money / 5), 5);
      money += interest + (E.BOSS_ROUNDS.includes(round) ? 6 : 3) + playsLeft + (jokers.includes('pibak_boheom') ? 1 : 0);
      if (round < E.ROUNDS && buyAI) money = shopBuy(money, jokers, rng);
    }
    return { cleared: E.ROUNDS };
  }

  const N = 300;
  const hist = { shop: Array(13).fill(0), noShop: Array(13).fill(0) };
  let errors = 0;
  for (let s = 1; s <= N; s++) {
    try {
      hist.shop[simulate(s * 7919, true).cleared]++;
      hist.noShop[simulate(s * 104729, false).cleared]++;
    } catch (err) { errors++; console.error('  SIM ERROR seed', s, err.message); }
  }
  assert(errors === 0, `시뮬레이션 ${N * 2}런 무오류`);
  const cum = (h) => h.map((_, i) => h.slice(i).reduce((a, b) => a + b, 0));
  const pct = (arr) => arr.map((v) => Math.round((v / N) * 100)).join(' ');
  console.log('  [상점O] n판 이상 클리어 % (0~12):', pct(cum(hist.shop)));
  console.log('  [상점X] n판 이상 클리어 % (0~12):', pct(cum(hist.noShop)));
  const c0 = cum(hist.noShop), c1 = cum(hist.shop);
  assert(c0[1] / N >= 0.8 && c0[1] / N <= 1.0, `무조커 1월 통과율 80~100% (실제 ${Math.round((c0[1] / N) * 100)}%)`);
  assert(c0[4] / N <= 0.25, `무조커 4월 이상 ≤25% — 상향된 난이도 (실제 ${Math.round((c0[4] / N) * 100)}%)`);
  assert(c1[12] / N <= 0.15, `단순 봇 승리율 ≤15% (실제 ${Math.round((c1[12] / N) * 100)}%)`);
}

console.log(fails === 0 ? '\n✅ 전체 테스트 통과' : `\n❌ ${fails}개 실패`);
process.exitCode = fails === 0 ? 0 : 1;

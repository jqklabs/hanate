// 원본 index.html은 건드리지 않는다. 리그를 주입한 사본을 .build/에 만든다.
import { readFileSync, writeFileSync, mkdirSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const BUILD = resolve(HERE, '.build');

// 게임 부팅보다 먼저 돌아야 하는 것들 — 튜토리얼/코치/설문 억제
const EARLY = `
<script>
(function(){
  try {
    ['hwatro_howto_seen','hwatro_jan_coach_v1','hwatro_shop_coach_v1',
     'hwatro_gostop_coach_v1','hwatro_deck_coach_v1'].forEach(function(k){
      localStorage.setItem(k,'1');
    });
  } catch(e){}
  window.__CAPTURE__ = new URLSearchParams(location.search).get('capture') === '1';
})();
</script>`;

const LATE = `
<script src="./vfx.js"></script>
<script src="./scenes.js"></script>
<script src="./rig.js"></script>`;

function build() {
  const src = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  if (!src.includes('<head>')) throw new Error('index.html에서 <head>를 찾지 못했습니다');
  if (!src.includes('</body>')) throw new Error('index.html에서 </body>를 찾지 못했습니다');

  const out = src
    .replace('<head>', '<head>' + EARLY)
    .replace('</body>', LATE + '\n</body>');

  rmSync(BUILD, { recursive: true, force: true });
  mkdirSync(BUILD, { recursive: true });
  writeFileSync(resolve(BUILD, 'index.html'), out);

  // 원본이 'Assets/...' 상대경로를 참조하므로 링크를 걸어준다
  const link = resolve(BUILD, 'Assets');
  if (!existsSync(link)) symlinkSync(resolve(ROOT, 'assets'), link, 'dir');
  // 영상용 고해상도 카드(원본 1360px → 960px). 게임 에셋은 480px라 확대하면 뭉갠다.
  const hi = resolve(BUILD, 'CardsHi');
  if (!existsSync(hi)) symlinkSync(resolve(HERE, 'cards_hi'), hi, 'dir');

  // 리그 스크립트도 .build에서 바로 읽히도록 링크
  /* 엠블럼을 새로 만들면 **여기에도 반드시 추가**한다.
     빠뜨리면 사본에서 404가 나고 화면에 엑박(<img> 깨짐 아이콘)이 뜬다 —
     홍단·총통이 실제로 그렇게 통째로 안 나왔다. */
  for (const f of ['rig.js', 'scenes.js', 'vfx.js', 'chunhyang.png', 'jumak.png',
                   'fx_godori.png', 'fx_byeongpung.png', 'fx_ogwang.png',
                   'fx_hongdan.png', 'fx_chongtong.png']) {
    const l = resolve(BUILD, f);
    if (!existsSync(l)) symlinkSync(resolve(HERE, f), l, 'file');
  }

  console.log('빌드 완료 →', resolve(BUILD, 'index.html'));
  return resolve(BUILD, 'index.html');
}

build();
export { build, BUILD };

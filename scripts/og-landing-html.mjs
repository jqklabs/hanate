/** invite · OG 랜딩 정적 HTML 생성 (kr/en/jp) */
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VARIANTS = ['OG1', 'OG2', 'OGB1', 'OGB2'];
const ORIGIN = 'https://hanate.jqklabs.com';
const OG_VER = 34;

const LOCALES = {
  kr: {
    code: 'kr',
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    title: '십이화 — 무한의 판',
    description: '12월까지 클리어 쫄? ㅋㅋ',
    siteName: '십이화',
    inviteBase: '/invite',
    landBase: '',
    gamePath: '/',
  },
  en: {
    code: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    title: 'Sibiwha — Infinite Table',
    description: 'Clear all 12 months. You in?',
    siteName: 'Sibiwha',
    inviteBase: '/invite/en',
    landBase: '/en',
    gamePath: '/en/',
  },
  jp: {
    code: 'jp',
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    title: '十二花 — 無限の卓',
    description: '12月までクリアできる？',
    siteName: '十二花',
    inviteBase: '/invite/jp',
    landBase: '/jp',
    gamePath: '/jp/',
  },
};

function ogImageUrl(locale, name) {
  return `${ORIGIN}/Assets/OG/${locale}/${name}.jpg?v=${OG_VER}`;
}

function metaHead(L, pageUrl, img) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L.title}</title>
<meta name="description" content="${L.description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${L.siteName}">
<meta property="og:title" content="${L.title}">
<meta property="og:description" content="${L.description}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:locale" content="${L.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${L.title}">
<meta name="twitter:description" content="${L.description}">
<meta name="twitter:image" content="${img}">`;
}

function inviteHtml(L, name) {
  const img = ogImageUrl(L.code, name);
  const pageUrl = `${ORIGIN}${L.inviteBase}/${name}`;
  const landPath = L.landBase ? `${L.landBase}/${name}` : `/${name}`;
  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
${metaHead(L, pageUrl, img)}
<script>
try {
  localStorage.setItem('hwatro_from_invite', '1');
  localStorage.setItem('hwatro_og_image', ${JSON.stringify(name)});
  localStorage.setItem('hwatro_locale', ${JSON.stringify(L.code)});
} catch (_) {}
location.replace(${JSON.stringify(landPath)});
</script>
</head>
<body></body>
</html>
`;
}

function landHtml(L, name) {
  const img = ogImageUrl(L.code, name);
  const pagePath = L.landBase ? `${L.landBase}/${name}` : `/${name}`;
  const pageUrl = `${ORIGIN}${pagePath}`;
  const gameRedirect = L.code === 'kr' ? '/' : `/?lang=${L.code}`;
  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
${metaHead(L, pageUrl, img)}
<script>
try {
  localStorage.setItem('hwatro_from_invite', '1');
  localStorage.setItem('hwatro_og_image', ${JSON.stringify(name)});
  localStorage.setItem('hwatro_locale', ${JSON.stringify(L.code)});
} catch (_) {}
location.replace(${JSON.stringify(gameRedirect)});
</script>
</head>
<body></body>
</html>
`;
}

function inviteIndexHtml(L) {
  const img = ogImageUrl(L.code, 'OG1');
  const pageUrl = `${ORIGIN}${L.inviteBase}`;
  const prefix = L.inviteBase;
  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
${metaHead(L, pageUrl, img)}
<script>
(function () {
  var variants = ['OG1', 'OG2', 'OGB1', 'OGB2'];
  var pick = variants[Math.floor(Math.random() * variants.length)];
  var q = location.search;
  location.replace(${JSON.stringify(prefix)} + '/' + pick + (q && q !== '?' ? q : ''));
})();
</script>
</head>
<body></body>
</html>
`;
}

function gameLocaleShell(L) {
  const img = ogImageUrl(L.code, 'OG1');
  const pageUrl = `${ORIGIN}${L.gamePath}`;
  return `<!DOCTYPE html>
<html lang="${L.htmlLang}">
<head>
${metaHead(L, pageUrl, img)}
<script>
try { localStorage.setItem('hwatro_locale', ${JSON.stringify(L.code)}); } catch (_) {}
location.replace('/?lang=${L.code}');
</script>
</head>
<body></body>
</html>
`;
}

for (const L of Object.values(LOCALES)) {
  const inviteRoot = L.code === 'kr'
    ? join(root, 'invite')
    : join(root, 'invite', L.code);
  mkdirSync(inviteRoot, { recursive: true });
  writeFileSync(join(inviteRoot, 'index.html'), inviteIndexHtml(L));

  for (const name of VARIANTS) {
    const inviteDir = L.code === 'kr'
      ? join(root, 'invite', name)
      : join(root, 'invite', L.code, name);
    const landDir = L.code === 'kr'
      ? join(root, name)
      : join(root, L.code, name);
    mkdirSync(inviteDir, { recursive: true });
    mkdirSync(landDir, { recursive: true });
    writeFileSync(join(inviteDir, 'index.html'), inviteHtml(L, name));
    writeFileSync(join(landDir, 'index.html'), landHtml(L, name));
  }

  if (L.code !== 'kr') {
    mkdirSync(join(root, L.code), { recursive: true });
    writeFileSync(join(root, L.code, 'index.html'), gameLocaleShell(L));
  }

  if (L.code === 'kr') {
    mkdirSync(join(root, 'invite', 'kr'), { recursive: true });
    writeFileSync(join(root, 'invite', 'kr', 'index.html'), inviteIndexHtml(L));
  }
  console.log(`[og] locale=${L.code}`);
}

mkdirSync(join(root, 'kr'), { recursive: true });
writeFileSync(join(root, 'kr', 'index.html'), `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><script>location.replace('/');</script></head><body></body></html>
`);

// 구 경로 별칭
mkdirSync(join(root, 'ja'), { recursive: true });
writeFileSync(join(root, 'ja', 'index.html'), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>try{localStorage.setItem('hwatro_locale','jp')}catch(_){}location.replace('/jp/'+location.search+location.hash)</script></head><body></body></html>
`);
mkdirSync(join(root, 'invite', 'ja'), { recursive: true });
writeFileSync(join(root, 'invite', 'ja', 'index.html'), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>location.replace('/invite/jp'+location.search+location.hash)</script></head><body></body></html>
`);
mkdirSync(join(root, 'zh'), { recursive: true });
writeFileSync(join(root, 'zh', 'index.html'), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>try{localStorage.setItem('hwatro_locale','en')}catch(_){}location.replace('/en/'+location.search+location.hash)</script></head><body></body></html>
`);
mkdirSync(join(root, 'invite', 'zh'), { recursive: true });
writeFileSync(join(root, 'invite', 'zh', 'index.html'), `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>location.replace('/invite/en'+location.search+location.hash)</script></head><body></body></html>
`);

console.log('[og] done');

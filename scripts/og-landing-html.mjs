/** invite/{name} · /{name} 정적 HTML 생성 */
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VARIANTS = ['OG1', 'OG2', 'OGB1', 'OGB2'];
const ORIGIN = 'https://hwatro.jqklabs.com';

function inviteHtml(name) {
  const img = `${ORIGIN}/Assets/OG/${name}.jpg`;
  const pageUrl = `${ORIGIN}/invite/${name}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>십이화 — 무한의 판</title>
<meta name="description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta property="og:type" content="website">
<meta property="og:site_name" content="십이화">
<meta property="og:title" content="십이화 — 무한의 판">
<meta property="og:description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="십이화 — 무한의 판">
<meta name="twitter:description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta name="twitter:image" content="${img}">
<script>
try {
  localStorage.setItem('hwatro_from_invite', '1');
  localStorage.setItem('hwatro_og_image', ${JSON.stringify(name)});
} catch (_) {}
location.replace('/${name}');
</script>
</head>
<body></body>
</html>
`;
}

function landHtml(name) {
  const img = `${ORIGIN}/Assets/OG/${name}.jpg`;
  const pageUrl = `${ORIGIN}/${name}`;
  // /{name} 도 공유 가능하도록 OG 메타 포함 (유입 추적 후 본편으로)
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>십이화 — 무한의 판</title>
<meta name="description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta property="og:type" content="website">
<meta property="og:site_name" content="십이화">
<meta property="og:title" content="십이화 — 무한의 판">
<meta property="og:description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="십이화 — 무한의 판">
<meta name="twitter:description" content="12월까지 클리어 쫄? ㅋㅋ">
<meta name="twitter:image" content="${img}">
<script>
try {
  localStorage.setItem('hwatro_from_invite', '1');
  localStorage.setItem('hwatro_og_image', ${JSON.stringify(name)});
} catch (_) {}
location.replace('/');
</script>
</head>
<body></body>
</html>
`;
}

for (const name of VARIANTS) {
  const inviteDir = join(root, 'invite', name);
  const landDir = join(root, name);
  mkdirSync(inviteDir, { recursive: true });
  mkdirSync(landDir, { recursive: true });
  writeFileSync(join(inviteDir, 'index.html'), inviteHtml(name));
  writeFileSync(join(landDir, 'index.html'), landHtml(name));
  console.log(`[og] ${name}`);
}

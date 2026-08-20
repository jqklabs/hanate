/** /invite · /invite/en · /invite/jp → OG 4종 중 랜덤 named URL로 302 */
const VARIANTS = ['OG1', 'OG2', 'OGB1', 'OGB2'];

export const config = {
  matcher: [
    '/invite',
    '/invite/',
    '/invite/kr',
    '/invite/kr/',
    '/invite/en',
    '/invite/en/',
    '/invite/jp',
    '/invite/jp/',
    '/invite/ja',
    '/invite/ja/',
    '/invite/zh',
    '/invite/zh/',
  ],
};

export default function middleware(request) {
  const pick = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  let dest;
  if (path === '/invite' || path === '/invite/kr') {
    dest = `/invite/${pick}`;
  } else if (path === '/invite/en' || path === '/invite/zh') {
    dest = `/invite/en/${pick}`;
  } else if (path === '/invite/jp' || path === '/invite/ja') {
    dest = `/invite/jp/${pick}`;
  } else {
    dest = `/invite/${pick}`;
  }

  url.pathname = dest;
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

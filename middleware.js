/** /invite → 4종 OG 중 랜덤 named URL로 302 (크롤러·미리보기용) */
const VARIANTS = ['OG1', 'OG2', 'OGB1', 'OGB2'];

export const config = {
  matcher: ['/invite', '/invite/'],
};

export default function middleware(request) {
  const pick = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  const url = new URL(request.url);
  url.pathname = `/invite/${pick}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

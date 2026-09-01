/** 접속 IP 국가. Vercel `x-vercel-ip-country` / Cloudflare `cf-ipcountry`. */
export const config = { runtime: 'edge' };

export default function handler(request) {
  const country = (
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    ''
  ).toUpperCase();
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, max-age=300',
    },
  });
}

// 골든 하니스용 서버.
// 엔진이 TS 모듈이 된 뒤로는 Vite가 변환해야 브라우저가 실행할 수 있다.
import { createServer as createViteServer } from 'vite';

export async function startServer(root, port = 0) {
  const vite = await createViteServer({
    root,
    logLevel: 'error',
    server: { host: '127.0.0.1', port, strictPort: false },
  });
  await vite.listen();
  const addr = vite.httpServer?.address();
  const p = typeof addr === 'object' && addr ? addr.port : port;
  return {
    origin: `http://127.0.0.1:${p}`,
    server: { close: () => vite.close() },
  };
}

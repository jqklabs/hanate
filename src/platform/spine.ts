import { g } from '../runtime/scope.ts';

declare global {
  interface Window {
    spine?: { SpinePlayer: new (id: string, opts: Record<string, unknown>) => {
      setAnimation: (name: string, loop: boolean) => void;
      play: () => void;
      pause?: () => void;
      stopRendering?: () => void;
      startRendering?: () => void;
      drawFrame?: (requestNext?: boolean) => void;
      sceneRenderer?: { resize: (mode: unknown) => void; canvas: HTMLCanvasElement; context: { gl: { viewport: (x: number, y: number, w: number, h: number) => void } }; camera?: { setViewport?: (w: number, h: number) => void } };
      stopRequestAnimationFrame?: boolean;
    } };
    HWATRO_CHUNHYANG_SKEL?: { gz: string; atlas: string; png?: string };
    bgSpinePlayer?: unknown;
  }
}

function $(id: string): HTMLElement | null {
  return typeof g.$ === 'function' ? g.$(id) : document.getElementById(id);
}

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      if ((existing as HTMLScriptElement).dataset.loaded === '1') resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => reject(new Error('script ' + src));
    document.head.appendChild(s);
  });
}

function loadStylesheetOnce(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

async function gunzipBase64(b64: string) {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (typeof DecompressionStream !== 'function') {
    throw new Error('gzip 미지원');
  }
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

function textToDataUri(text: string, mime: string) {
  return 'data:' + mime + ',' + text;
}

/** idle은 24fps면 충분. 디스플레이 주사율대로 돌리지 않는다. */
function throttleSpine(player: any) {
  if (typeof player.drawFrame !== 'function') return;
  const raw = player.drawFrame.bind(player);
  let last = 0;
  let pending = false;
  player.drawFrame = (requestNext = true) => {
    const now = performance.now();
    if (now - last < 1000 / 24) {
      if (requestNext && !player.stopRequestAnimationFrame && !pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          player.drawFrame(true);
        });
      }
      return;
    }
    last = now;
    raw(requestNext);
  };
}

/** 배경 춘향 Spine. 플레이어·스켈레톤은 첫 페인트 이후에만 받는다. */
export async function initBgSpine() {
  if (window.matchMedia('(max-width: 720px)').matches) return;
  const host = $('bg-spine');
  if (!host || host.dataset.ready) return;
  host.dataset.ready = '1';

  try {
    loadStylesheetOnce('vendor/spine-player/spine-player.css');
    await loadScriptOnce('vendor/spine-player/spine-player.js');
  } catch (e) {
    console.warn('[spine] player', e);
    delete host.dataset.ready;
    return;
  }

  if (!window.spine || typeof window.spine.SpinePlayer !== 'function') {
    console.warn('[spine] SpinePlayer 로드 실패');
    delete host.dataset.ready;
    return;
  }

  let jsonText: string | null = null;
  let atlasText: string | null = null;
  let pngDataUri: string | null = null;
  try {
    if (!window.HWATRO_CHUNHYANG_SKEL) {
      await loadScriptOnce('Assets/Spine/chunhyang/skel-embed.js');
    }
    const pack = window.HWATRO_CHUNHYANG_SKEL;
    if (pack) {
      jsonText = await gunzipBase64(pack.gz);
      atlasText = pack.atlas;
      if (pack.png) pngDataUri = 'data:image/png;base64,' + pack.png;
    }
  } catch (e) {
    console.warn('[spine] embed', e);
  }

  const FIRST_ANIM = 'idle_breath';
  const jsonPath = 'Assets/Spine/chunhyang/skeleton.json';
  const atlasPath = 'Assets/Spine/chunhyang/skeleton.atlas';
  const pngPath = 'Assets/Spine/chunhyang/skeleton.png';
  const rawDataURIs: Record<string, string> = {};
  if (jsonText) rawDataURIs[jsonPath] = textToDataUri(jsonText, 'application/json');
  if (atlasText) rawDataURIs[atlasPath] = textToDataUri(atlasText, 'text/plain');
  if (pngDataUri) rawDataURIs[pngPath] = pngDataUri;

  const player = new window.spine.SpinePlayer('bg-spine', {
    skeleton: jsonPath,
    atlas: atlasPath,
    rawDataURIs,
    animation: FIRST_ANIM,
    animations: [FIRST_ANIM],
    showControls: false,
    showLoading: false,
    interactive: false,
    alpha: true,
    backgroundColor: '#00000000',
    premultipliedAlpha: true,
    viewport: {
      padLeft: '5%',
      padRight: '6%',
      padTop: '12%',
      padBottom: '0%',
      transitionTime: 0,
    },
    success(p: any) {
      try {
        throttleSpine(p);
        p.setAnimation(FIRST_ANIM, true);
        p.play();
      } catch (_) { /* ignore */ }
    },
    error(_p: any, reason: unknown) {
      console.warn('[spine]', reason);
      host.querySelectorAll('.spine-player-error').forEach((el) => el.remove());
    },
  });
  g.bgSpinePlayer = window.bgSpinePlayer = player;
}

export function scheduleBgSpine() {
  const run = () => { void initBgSpine(); };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 1800 });
  } else {
    setTimeout(run, 1);
  }
}

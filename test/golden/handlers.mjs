// 인라인 핸들러 도달성 검사.
//
// 파일을 모듈로 쪼개면 최상위 함수가 더 이상 전역이 아니게 되어
// `onclick="openHelp()"` 같은 마크업이 조용히 죽는다. 눌러보지 않으면 안 걸린다.
// 그래서 소스에서 핸들러 이름을 전부 긁어와 페이지에서 실제로 해석되는지 확인한다.
import { readFileSync } from 'fs';

const ATTR = /\son[a-z]+\s*=\s*\\?(["'])([\s\S]*?)\1/gi;
const CALL = /([A-Za-z_$][\w$]*)\s*\(/g;

// 인라인 핸들러 안에서 쓰이는 표준 전역·예약어 — 게임 코드가 아니라 검사 대상이 아니다
const BUILTIN = new Set([
  'if', 'for', 'while', 'switch', 'return', 'typeof', 'function', 'catch', 'try',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Math', 'JSON', 'Date', 'parseInt', 'parseFloat',
  'event', 'this', 'window', 'document', 'console', 'alert', 'setTimeout', 'requestAnimationFrame',
]);

/** 소스에서 인라인 핸들러가 호출하는 식별자를 모은다 */
export function collectHandlerNames(sources) {
  const names = new Set();
  for (const src of sources) {
    for (const m of src.matchAll(ATTR)) {
      const body = m[2];
      for (const c of body.matchAll(CALL)) {
        const name = c[1];
        if (BUILTIN.has(name)) continue;
        // 객체 메서드 호출(a.b())은 앞에 점이 붙으므로 제외
        const at = c.index ?? 0;
        if (at > 0 && body[at - 1] === '.') continue;
        names.add(name);
      }
    }
  }
  return [...names].sort();
}

/** 페이지의 전역 스코프에서 해석되지 않는 이름을 돌려준다 */
export async function findUnreachable(page, names) {
  return page.evaluate((list) => {
    const missing = [];
    for (const name of list) {
      let kind = 'undefined';
      try {
        // 최상위 let/const/function은 window에 없고 전역 렉시컬 스코프에 있다.
        // Function 생성자는 전역 스코프에서 평가되므로 둘 다 잡힌다.
        kind = new Function(`return typeof ${name}`)();
      } catch (_) {
        kind = 'error';
      }
      if (kind !== 'function') missing.push(`${name} (${kind})`);
    }
    return missing;
  }, names);
}

export function readSources(paths) {
  return paths.map((p) => readFileSync(p, 'utf8'));
}

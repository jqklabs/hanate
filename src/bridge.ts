/** 인라인 onclick이 모듈 스코프 함수를 부를 수 있게 전역에 올린다. */
export function exposeHandlers(map: Record<string, (...args: any[]) => unknown>) {
  Object.assign(window, map);
}

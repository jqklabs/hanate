import { g } from '../runtime/scope.ts';

const code = "// ── 남은 덱 보기 ───────────────────────────────────────────\ng.openDeckPeek = function openDeckPeek() {\n  if (state.screen === 'deckpeek') {\n    closeDeckPeek();\n    return;\n  }\n  if (state.juicing || state.dealing) return;\n  if (state.screen !== 'play' && state.screen !== 'gostop') return;\n  if (state.coachStep === 'deck') {\n    state.coachStep = null;\n    markDeckCoachSeen();\n  }\n  state.deckPeekReturn = state.screen;\n  state.screen = 'deckpeek';\n  render();\n}\ng.closeDeckPeek = function closeDeckPeek() {\n  if (state.screen !== 'deckpeek') return;\n  state.screen = state.deckPeekReturn || 'play';\n  state.deckPeekReturn = null;\n  render();\n}\n\n";
new Function('g', 'with (g) {\n' + code + '\n}')(g);

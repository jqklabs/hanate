import './styles/index.css';
import './runtime/install-engine.ts';
import { g } from './runtime/scope.ts';
import { exposeHandlers } from './bridge.ts';

import './i18n/index.js';
import './state/store.js';
import './state/round.js';
import './state/actions/play.js';
import './state/actions/discard.js';
import './state/actions/settle.js';
import './state/actions/shop.js';
import './platform/telemetry.js';
import './state/actions/end.js';
import './ui/shortcut.js';
import './ui/help.js';
import './ui/deck.js';
import './ui/chunhyang.js';
import './ui/render.js';
import './platform/sfx.js';
import './ui/juice/preview.js';
import './boot.js';
import { gameState } from './state/GameState.ts';
import { renderer } from './ui/Renderer.ts';
import { sfxPlayer } from './platform/SfxPlayer.ts';
import { telemetry } from './platform/GameTelemetry.ts';
import { chunhyangCoach } from './ui/ChunhyangCoach.ts';
import { juiceQueue } from './ui/JuiceQueue.ts';

g.gameState = gameState;
g.renderer = renderer;
g.sfxPlayer = sfxPlayer;
g.telemetry = telemetry;
g.chunhyangCoach = chunhyangCoach;
g.juiceQueue = juiceQueue;

const handlers = [
  'acceptNight','beginFromPrep','buyChunhyangNext','buyJoker','chooseGo','chooseStop',
  'closeDeckPeek','closeHelp','closeJokerPop','closeOegilPick','closeSettings',
  'coachNext','coachSkip','confirmLocale','confirmOegil','copyCardTune','declineNight',
  'discardSelected','dismissShortcutPrompt','dismissSurveyPrompt','dismissWelcome',
  'markShortcutAlreadyDone','markSurveyAlreadyDone','nextRound','openDeckPeek','openHelp',
  'openSettings','openSurvey','pickBossCandidate','playSelected','previewGoAnim',
  'previewGoAnimAll','previewGoLevel','previewGoLevelAll','previewJuiceMult',
  'previewJuiceMultAll','previewJuiceScore','previewJuiceScoreAll',
  'replayTutorialsFromSettings','reroll','resetCardTune','restart','sellJoker',
  'setBgmVolume','setHandSort','setLocale','setSfxVolume','setTouchHint',
  'shortcutPrimaryAction','showJokerPop','toggleCardDetailVisible','toggleJuiceSpeed',
  'toggleOwnedTip','togglePlayLogVisible','toggleSelect',
];
const map: Record<string, (...args: any[]) => unknown> = {};
for (const name of handlers) {
  if (typeof g[name] === 'function') map[name] = g[name].bind(g);
}
exposeHandlers(map);
Object.assign(window, {
  state: g.state,
  render: g.render,
  evaluateHand: g.evaluateHand,
  scoreEnv: g.scoreEnv,
});

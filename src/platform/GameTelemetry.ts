import { g } from '../runtime/scope.ts';

export class GameTelemetry {
  track(name: string, params?: Record<string, unknown>) {
    return g.trackEvent(name, params);
  }
}

export const telemetry = new GameTelemetry();

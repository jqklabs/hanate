import { g } from '../runtime/scope.ts';

export class Renderer {
  draw() { return g.render(); }
  topbar() { return g.renderTopbar(); }
  side() { return g.renderSide(); }
  table() { return g.renderTable(); }
  modal() { return g.renderModal(); }
  coach() { return g.renderCoach(); }
  chunhyang() { return g.renderChunhyang(); }
  preview() { return g.renderPreview(); }
  hand(opts?: unknown) { return g.renderHandArea(opts); }
}

export const renderer = new Renderer();

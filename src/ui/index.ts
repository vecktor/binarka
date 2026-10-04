// RED-STAGE STUB: replaced by the capability-implementer
import type { Puzzle } from '../engine/index';

export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number) => Puzzle;
}

/** Red-stage stub: clears the root and renders nothing. Never throws. */
export function mountPlayPage(root: HTMLElement, options?: PlayPageOptions): void {
  void options;
  root.replaceChildren();
}

// RED-STAGE STUB: replaced by the capability-implementer
import type { Grid, Hint } from './types';

export function hint(board: Grid): Hint {
  void board;
  return { kind: 'none', sentence: '.' };
}

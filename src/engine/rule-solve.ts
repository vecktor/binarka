import { findViolations } from './rules';
import { localViolation, selectFill, setCell, toFlat } from './techniques';
import type { Grid } from './types';

/**
 * Finishes a copy of the board using only the hint engine's fills for techniques 1 to `ceiling`, in the hint order
 * (the same selection routine as `hint`). `solved` is true when no empty cell is left; `steps` counts the fills made.
 * Stops at the first 'none' or 'broken'. The input board is never changed. One full violation check at the start and a
 * local check after each fill. Pure and deterministic: no DOM, no random numbers, no clock.
 */
export function solveByRules(board: Grid, ceiling = 1): { solved: boolean; steps: number } {
  const f = toFlat(board);
  let steps = 0;
  let broken = findViolations(board).length > 0;
  for (;;) {
    if (f.empties === 0) return { solved: !broken, steps };
    if (broken) return { solved: false, steps };
    const fill = selectFill(f, ceiling);
    if (fill === null) return { solved: false, steps };
    setCell(f, fill.row, fill.col, fill.value);
    steps++;
    broken = localViolation(f, fill.row, fill.col);
  }
}

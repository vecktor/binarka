import { hint } from './hint';
import type { Grid } from './types';

/**
 * Finishes a copy of the board using only the hint engine's fills (pair, sandwich, count), in the hint order.
 * `solved` is true when no empty cell is left; `steps` counts the fills made. Stops at the first 'none' or 'broken'.
 * The input board is never changed. Pure and deterministic: no DOM, no random numbers, no clock.
 */
export function solveByRules(board: Grid): { solved: boolean; steps: number } {
  const copy: Grid = board.map((row) => [...row]);
  let steps = 0;
  for (;;) {
    if (!copy.some((row) => row.some((cell) => cell === null))) return { solved: true, steps };
    const h = hint(copy);
    if (h.kind !== 'fill') return { solved: false, steps };
    const row = copy[h.row];
    if (row === undefined) return { solved: false, steps };
    row[h.col] = h.value;
    steps++;
  }
}

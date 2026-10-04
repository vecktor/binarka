// RED-STAGE STUB: replaced by the capability-implementer
// Deliberately NAIVE: never throws, no validation, blanks about half of the cells with no uniqueness check.
import { mulberry32 } from './rng';
import type { Grid, Puzzle } from './types';

export function generate(size: number, seed: number): Puzzle {
  const n = Number.isInteger(size) && size >= 2 && size <= 16 ? size : 4;
  const s = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
  const rng = mulberry32(s);
  const solution: (0 | 1)[][] = [];
  const givens: Grid = [];
  for (let r = 0; r < n; r++) {
    const solRow: (0 | 1)[] = [];
    const givenRow: Grid[number] = [];
    for (let c = 0; c < n; c++) {
      const v: 0 | 1 = Math.floor((c + (r % 2) * 2) / 2) % 2 === 0 ? 0 : 1;
      solRow.push(v);
      givenRow.push(rng() < 0.5 ? v : null);
    }
    solution.push(solRow);
    givens.push(givenRow);
  }
  return { size: n, givens, solution };
}

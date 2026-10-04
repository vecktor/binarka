import { mulberry32, shuffle } from './rng';
import { countSolutionsBudgeted } from './solver';
import { InvalidArgumentTypeError, InvalidSeedError, InvalidSizeError } from './types';
import type { Cell, Grid, Puzzle } from './types';

const MAX_SEED = 2147483647;
/** Work limits (search nodes), never wall-clock time, so the output depends only on the seed (FR-14). */
const FILL_NODE_BUDGET = 20000;
const CARVE_NODE_BUDGET = 2000;

function validate(size: number, seed: number): void {
  if (typeof size !== 'number' || typeof seed !== 'number') throw new InvalidArgumentTypeError();
  if (!Number.isInteger(size) || size < 4 || size > 16 || size % 2 !== 0) throw new InvalidSizeError();
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) throw new InvalidSeedError();
}

/**
 * Randomised backtracking fill of a complete valid grid in row-major order.
 * Returns null when the node budget is exhausted (the caller restarts from the continued RNG stream).
 */
function fillGrid(n: number, rng: () => number): (0 | 1)[][] | null {
  const half = n / 2;
  const grid: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => -1));
  const rowCount = Array.from({ length: n }, () => [0, 0]);
  const colCount = Array.from({ length: n }, () => [0, 0]);
  let nodes = 0;
  const at = (r: number, c: number): number => grid[r]?.[c] ?? -1;
  const sameLine = (axis: 'row' | 'col', a: number, b: number): boolean => {
    for (let i = 0; i < n; i++) {
      if (axis === 'row' ? at(a, i) !== at(b, i) : at(i, a) !== at(i, b)) return false;
    }
    return true;
  };

  const bump = (r: number, c: number, d: number, by: number): void => {
    const rc = rowCount[r] as number[];
    const cc = colCount[c] as number[];
    rc[d] = (rc[d] as number) + by;
    cc[d] = (cc[d] as number) + by;
  };

  const place = (pos: number): boolean => {
    if (pos === n * n) return true;
    if (++nodes > FILL_NODE_BUDGET) return false;
    const r = Math.floor(pos / n);
    const c = pos % n;
    const first = rng() < 0.5 ? 0 : 1;
    for (const d of [first, 1 - first]) {
      if ((rowCount[r]?.[d] ?? 0) >= half || (colCount[c]?.[d] ?? 0) >= half) continue;
      if (c >= 2 && at(r, c - 1) === d && at(r, c - 2) === d) continue;
      if (r >= 2 && at(r - 1, c) === d && at(r - 2, c) === d) continue;
      (grid[r] as number[])[c] = d;
      let ok = true;
      if (c === n - 1) {
        for (let o = 0; o < r && ok; o++) if (sameLine('row', r, o)) ok = false;
      }
      if (r === n - 1) {
        for (let o = 0; o < c && ok; o++) if (sameLine('col', c, o)) ok = false;
      }
      if (ok) {
        bump(r, c, d, 1);
        if (place(pos + 1)) return true;
        bump(r, c, d, -1);
      }
      (grid[r] as number[])[c] = -1;
      if (nodes > FILL_NODE_BUDGET) return false;
    }
    return false;
  };

  return place(0) ? (grid as (0 | 1)[][]) : null;
}

export function generate(size: number, seed: number): Puzzle {
  validate(size, seed);
  const rng = mulberry32(seed);
  let solution = fillGrid(size, rng);
  while (solution === null) solution = fillGrid(size, rng);

  const givens: Grid = solution.map((row) => row.map((v): Cell => v));
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) positions.push([r, c]);
  shuffle(positions, rng);
  for (const [r, c] of positions) {
    const row = givens[r] as Cell[];
    const keep = row[c] as Cell;
    row[c] = null;
    const result = countSolutionsBudgeted(givens, CARVE_NODE_BUDGET);
    if (result.exhausted || result.count !== 1) row[c] = keep;
  }
  return { size, givens, solution: solution.map((row) => [...row]) };
}

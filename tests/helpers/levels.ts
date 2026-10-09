// Shared pieces of the level tests of add-difficulty-engine: the fixed seed set, the valid (N, level) combinations,
// memoised puzzles (module-level cache: one per test file, Vitest isolates modules), the hint walk, and the search for a
// combination that needs more than one attempt.
import type { Grid, Puzzle } from '../../src/engine/index';
import { GenerationRunOutError, generate } from '../../src/engine/index';
import { hint } from './hint-type';
import { buildPuzzle } from '../../src/engine/generator';

export const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
export const LONG = 240_000;

export interface Combo {
  n: number;
  level: number;
}

/** The nine valid combinations: (4, 1), (6, 1..4), (8, 1..4). */
export const COMBOS: Combo[] = [
  { n: 4, level: 1 },
  ...[6, 8].flatMap((n) => [1, 2, 3, 4].map((level) => ({ n, level }))),
];

/** The eight combinations of N in 6 and 8, levels 1 to 4. */
export const COMBOS_68: Combo[] = COMBOS.filter((c) => c.n !== 4);

const cache = new Map<string, Puzzle>();

/** `generate(n, seed, level)`, memoised per test file. */
export function puzzleOf(n: number, seed: number, level: number): Puzzle {
  const key = `${n}/${seed}/${level}`;
  let p = cache.get(key);
  if (p === undefined) {
    p = generate(n, seed, level);
    cache.set(key, p);
  }
  return p;
}

export const copyOf = (board: Grid): Grid => board.map((row) => [...row]);

export function emptyCount(board: Grid): number {
  return board.reduce((sum, row) => sum + row.filter((cell) => cell === null).length, 0);
}

export interface Walk {
  board: Grid;
  /** hint calls made */
  calls: number;
  /** fills written */
  fills: number;
  /** the kind of the call that ended the walk when it was not a fill; null when every call was a fill */
  stopKind: 'none' | 'broken' | null;
  /** the first problem found, naming its step; null when the walk was clean */
  problem: string | null;
}

/**
 * Repeats: ask the public hint for the ceiling on the board and write the value of the hint into its cell, until the
 * board is full or a call is not a fill. When `solution` is given, each fill is compared with it. The loop is capped at
 * the number of empty cells of the givens (an endless-loop guard).
 */
export function walk(givens: Grid, ceiling: number, solution: readonly (readonly number[])[] | null): Walk {
  const board = copyOf(givens);
  const empties = emptyCount(givens);
  const out: Walk = { board, calls: 0, fills: 0, stopKind: null, problem: null };
  while (emptyCount(board) > 0) {
    if (out.calls >= empties) {
      out.problem = `step ${out.calls + 1}: more hint calls than the ${empties} empty cells (endless-loop guard)`;
      break;
    }
    const step = out.calls + 1;
    const h = hint(board, ceiling);
    out.calls++;
    if (h.kind !== 'fill') {
      out.stopKind = h.kind;
      out.problem = `step ${step}: kind "${h.kind}", not a fill (${emptyCount(board)} cells still empty)`;
      break;
    }
    const row = board[h.row ?? -1];
    if (row?.[h.col ?? -1] !== null) {
      out.problem = `step ${step}: the hint cell ${String(h.row)},${String(h.col)} was not empty`;
      break;
    }
    if (solution !== null && solution[h.row ?? -1]?.[h.col ?? -1] !== h.value) {
      out.problem = `step ${step}: the hint writes ${String(h.value)} at ${String(h.row)},${String(h.col)}, the solution holds ${String(solution[h.row ?? -1]?.[h.col ?? -1])}`;
      break;
    }
    row[h.col ?? -1] = h.value as 0 | 1;
    out.fills++;
  }
  return out;
}

export interface RetryCase {
  n: number;
  level: number;
  seed: number;
}

let retryCase: RetryCase | null | undefined;

/**
 * Searches N in 6 and 8, level 2 to 4, seeds 1 to 200 for a combination that needs more than one attempt: the internal
 * builder with a limit of 1 attempt raises the run-out error for it. Throws, naming the premise, when none is found.
 * Anything the builder throws that is not the run-out error propagates (including «not implemented: ...» at red).
 */
export function findRetryCase(): RetryCase {
  if (retryCase !== undefined && retryCase !== null) return retryCase;
  const RunOut = GenerationRunOutError;
  for (const n of [6, 8]) {
    for (const level of [2, 3, 4]) {
      for (let seed = 1; seed <= 200; seed++) {
        try {
          buildPuzzle(n, seed, level, 1);
        } catch (e) {
          if (e instanceof RunOut) {
            retryCase = { n, level, seed };
            return retryCase;
          }
          throw e;
        }
      }
    }
  }
  retryCase = null;
  throw new Error(
    'PREMISE BROKEN: no combination of N in 6 and 8, a level 2 to 4 and a seed 1 to 200 needs more than one attempt (the spike found 438 of 1200); the retry and run-out tests must be redesigned',
  );
}

// @trace NFR-16, NFR-1, NFR-2, NFR-3
// Generation time per (N, level) and exactness of the timed puzzles (add-difficulty-engine; NFR-16 with NFR-1 to NFR-3).
// For every valid combination (4, 1), (6, 1..4), (8, 1..4): the worst case over seeds 1 to 20 after one warm-up call,
// under 200 ms at N = 4, 500 ms at N = 6, 3000 ms at N = 8; a failure names N, level and the slowest seed.
// So that a generator which ignores the level cannot pass, each timed puzzle is also checked for exactness (solvable
// with ceiling L, not with ceiling L - 1).
//   * The TIMING assertions alone are green on the unchanged engine (the engine ignores the level and is fast): a guard
//     of the bounds, green by design, not red evidence.
//   * The EXACTNESS assertions are the red part: for L of 2 or more the unchanged engine returns level-1 puzzles, which
//     the walk with ceiling L - 1 already solves.
// The 50% margin of the spec is a manual review gate on the recorded table (docs/qa/add-difficulty-engine/timing.txt),
// not a test.
import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../src/engine/index';
import { generate, solveByRules } from './helpers/engine-shim';
import { COMBOS, SEEDS } from './helpers/levels';

const BOUND_MS: Record<number, number> = { 4: 200, 6: 500, 8: 3000 };

interface Timed {
  worst: { ms: number; seed: number };
  puzzles: [number, Puzzle][];
}

const memo = new Map<string, Timed>();

function timeCombo(n: number, level: number): Timed {
  const key = `${n}/${level}`;
  const hit = memo.get(key);
  if (hit) return hit;
  generate(n, 0, level); // warm-up (module and JIT), not measured; seed 0 is outside the measured set
  const worst = { ms: 0, seed: 0 };
  const puzzles: [number, Puzzle][] = [];
  for (const seed of SEEDS) {
    const t0 = performance.now();
    const p = generate(n, seed, level);
    const ms = performance.now() - t0;
    puzzles.push([seed, p]);
    if (ms > worst.ms) {
      worst.ms = ms;
      worst.seed = seed;
    }
  }
  const timed = { worst, puzzles };
  memo.set(key, timed);
  return timed;
}

describe.each(COMBOS)('@trace NFR-16 generation time at N = $n level $level over seeds 1 to 20', ({ n, level }) => {
  it(`@trace NFR-16 the slowest puzzle takes under ${BOUND_MS[n] ?? 0} ms (timing alone: green by design at red)`, () => {
    const { worst } = timeCombo(n, level);
    expect(worst.ms, `N ${n} level ${level}: slowest seed ${worst.seed} took ${worst.ms.toFixed(1)} ms`).toBeLessThan(BOUND_MS[n] ?? 0);
  }, 120_000);

  it('@trace NFR-16 every timed puzzle is exactly its level: solvable with ceiling L and, for L of 2 or more, not with ceiling L - 1 (the red part)', () => {
    const { puzzles } = timeCombo(n, level);
    const bad: string[] = [];
    for (const [seed, p] of puzzles) {
      const label = `N ${n} level ${level} seed ${seed}`;
      if (!solveByRules(p.givens, level).solved) bad.push(`${label}: not solvable with ceiling ${level}`);
      if (level >= 2 && solveByRules(p.givens, level - 1).solved) bad.push(`${label}: already solvable with ceiling ${level - 1}`);
    }
    expect(bad).toEqual([]);
  }, 120_000);
});

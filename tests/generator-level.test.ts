// The leveled generator of add-difficulty-engine: level validation (FR-81), shapes and default (FR-13), determinism and
// one solution for all levels (FR-14, FR-83), uniqueness by the solver and the independent oracle (FR-15), solvable by
// the techniques of the level and exactly that level (FR-27, FR-82), plus two differential tests (the local violation
// check against findViolations; solveByRules against a loop of public hint calls).
// Written from the delta spec before the implementation exists. The new API is reached through the red-phase shim.
// Every failure message names N, level, seed and step.
//
// Green by design at red (the engine ignores the level today, so these describe unchanged behaviour and are guards,
// not red evidence): all four levels accepted at 6 and 8 (shape only), level 1 at size 4, size/seed errors first
// (the InvalidSizeError / InvalidSeedError half), shapes, the default level, determinism per level, the same solution
// at all levels, uniqueness by solver and oracle, and the walk at the level's own ceiling for level 1.
// Red: every InvalidLevelError scenario, the exactness half (the walk with ceiling L - 1 must stop on `none`), the
// walk at ceilings 2 to 4 (techniques missing), the retry-premise search, the local violation check, and the
// differential test's non-vacuity part.
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations, InvalidSeedError, InvalidSizeError } from '../src/engine/index';
import type { Grid, Puzzle } from '../src/engine/index';
import { mulberry32 } from '../src/engine/rng';
import { cloneBoard, emptyBoard } from './helpers/board';
import { errors, generate, hasLocalViolation, hint, solveByRules } from './helpers/engine-shim';
import { COMBOS, COMBOS_68, LONG, SEEDS, copyOf, emptyCount, findRetryCase, puzzleOf, walk } from './helpers/levels';
import { oracleSolve } from './helpers/oracle';
import {
  COUNT_BOARD,
  LA_EQUAL,
  LA_FOUR,
  LA_TWO,
  LB_COL,
  LB_ROW,
  LOWER_WINS,
  PAIR_BOARD,
  UL_COL,
  UL_ROW,
} from './helpers/technique-boards';

function thrown(f: () => unknown): unknown {
  try {
    f();
  } catch (e) {
    return e;
  }
  return undefined;
}

function expectShape(p: Puzzle, n: number, label: string): void {
  expect(p.size, label).toBe(n);
  expect(p.givens, label).toHaveLength(n);
  expect(p.solution, label).toHaveLength(n);
  for (const row of p.givens) {
    expect(row, label).toHaveLength(n);
    for (const cell of row) expect([0, 1, null], label).toContain(cell);
  }
  for (const row of p.solution) {
    expect(row, label).toHaveLength(n);
    for (const cell of row) expect([0, 1], label).toContain(cell);
  }
}

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-81 the level is an integer from 1 to 4', () => {
  it.each([6, 8])('all four levels at size %i return an N x N puzzle (seed 1)', (n) => {
    for (const level of [1, 2, 3, 4]) expectShape(generate(n, 1, level), n, `N ${n} level ${level}`);
  }, LONG);

  it.each([2, 3, 4])('level %i at size 4 raises an InvalidLevelError and returns no puzzle', (level) => {
    let result: Puzzle | undefined;
    const e = thrown(() => {
      result = generate(4, 1, level);
    });
    expect(e !== undefined, `generate(4, 1, ${level}) must throw`).toBe(true);
    expect(result).toBeUndefined();
    expect(e).toBeInstanceOf(errors.InvalidLevelError);
  });

  it('level 1 at size 4 returns a 4x4 puzzle', () => {
    expectShape(generate(4, 1, 1), 4, 'N 4 level 1');
  });

  it.each([
    ['0', 0],
    ['5', 5],
    ['-1', -1],
    ['2.5', 2.5],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ["'2' (a string)", '2'],
    ['null', null],
  ] as [string, unknown][])('size 6, seed 1, level %s raises an InvalidLevelError and returns no puzzle', (_name, level) => {
    let result: Puzzle | undefined;
    const e = thrown(() => {
      result = generate(6, 1, level);
    });
    expect(e !== undefined, `generate(6, 1, ${_name}) must throw`).toBe(true);
    expect(result).toBeUndefined();
    expect(e).toBeInstanceOf(errors.InvalidLevelError);
  });

  it('the InvalidLevelError message is one English sentence without Cyrillic', () => {
    const e = thrown(() => generate(6, 1, 5));
    expect(e instanceof Error, 'generate(6, 1, 5) must throw an Error').toBe(true);
    const message = (e as Error).message;
    expect(message).not.toMatch(/\p{Script=Cyrillic}/u);
    expect(message).toMatch(/[A-Za-z]/);
    expect(message.match(/[.!?]/g) ?? []).toHaveLength(1);
    expect(message.endsWith('.')).toBe(true);
    expect(e).toBeInstanceOf(errors.InvalidLevelError);
    expect(e).toBeInstanceOf(RangeError);
  });

  it('size and seed errors come first: size 5 with level 9 is the InvalidSizeError of size 5 alone', () => {
    const e = thrown(() => generate(5, 1, 9));
    expect(e).toBeInstanceOf(InvalidSizeError);
    expect(e).toEqual(thrown(() => generate(5, 1)));
  });

  it('size and seed errors come first: seed -1 with level 9 is the InvalidSeedError of seed -1 alone', () => {
    const e = thrown(() => generate(6, -1, 9));
    expect(e).toBeInstanceOf(InvalidSeedError);
    expect(e).toEqual(thrown(() => generate(6, -1)));
  });

  it('size and seed errors come first: neither of those two errors is an InvalidLevelError', () => {
    expect(thrown(() => generate(5, 1, 9))).not.toBeInstanceOf(errors.InvalidLevelError);
    expect(thrown(() => generate(6, -1, 9))).not.toBeInstanceOf(errors.InvalidLevelError);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-13 the puzzle shape and the default level', () => {
  it('size 6 seed 42: the result is { size, givens, solution } with no level field, whatever the level', () => {
    for (const p of [generate(6, 42), generate(6, 42, undefined), generate(6, 42, 1), generate(6, 42, 3)]) {
      expect(Object.keys(p).sort()).toEqual(['givens', 'size', 'solution']);
      expectShape(p, 6, 'size 6 seed 42');
    }
  });

  it('size 8 seed 7 level 4 is an 8x8 puzzle of the requested size', () => {
    expectShape(generate(8, 7, 4), 8, 'N 8 level 4 seed 7');
  });

  it('the level defaults to 1: no level, undefined and 1 give cell-for-cell identical givens and solutions', () => {
    const a = generate(6, 42);
    const b = generate(6, 42, undefined);
    const c = generate(6, 42, 1);
    expect(b.givens).toEqual(a.givens);
    expect(b.solution).toEqual(a.solution);
    expect(c.givens).toEqual(a.givens);
    expect(c.solution).toEqual(a.solution);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-14 @trace FR-83 determinism and one solution for all levels', () => {
  it('two calls give identical givens and solutions, per N in 6 and 8, level 1 to 4, seeds 1 to 5', () => {
    for (const { n, level } of COMBOS_68) {
      for (let seed = 1; seed <= 5; seed++) {
        const a = generate(n, seed, level);
        const b = generate(n, seed, level);
        expect(b.givens, `N ${n} level ${level} seed ${seed}`).toEqual(a.givens);
        expect(b.solution, `N ${n} level ${level} seed ${seed}`).toEqual(a.solution);
      }
    }
  }, LONG);

  it.each([6, 8])('the solution is the same at levels 1 to 4 for seeds 1 to 20 at N = %i', (n) => {
    const bad: string[] = [];
    for (const seed of SEEDS) {
      const base = puzzleOf(n, seed, 1).solution;
      for (const level of [2, 3, 4]) {
        if (JSON.stringify(puzzleOf(n, seed, level).solution) !== JSON.stringify(base)) bad.push(`N ${n} seed ${seed} level ${level}`);
      }
    }
    expect(bad, 'combinations whose solution differs from the level-1 solution').toEqual([]);
  }, LONG);

  it('a seed that needs a retry has the level-1 solution (the premise is searched, not assumed)', () => {
    const { n, level, seed } = findRetryCase();
    const leveled = generate(n, seed, level);
    expect(leveled.solution, `N ${n} level ${level} seed ${seed}`).toEqual(generate(n, seed, 1).solution);
  }, LONG);
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-15 every puzzle has exactly one solution (solver and independent oracle, 180 puzzles)', () => {
  it.each(COMBOS)('N = $n level $level: solver result 1 and oracle count 1, and the oracle solution is the puzzle solution', ({ n, level }) => {
    const bad: string[] = [];
    for (const seed of SEEDS) {
      const p = puzzleOf(n, seed, level);
      const label = `N ${n} level ${level} seed ${seed}`;
      if (countSolutions(p.givens) !== 1) bad.push(`${label}: solver ${countSolutions(p.givens)}`);
      const found = oracleSolve(p.givens);
      if (found.count !== 1) bad.push(`${label}: oracle ${found.count}`);
      else if (JSON.stringify(found.solutions[0]) !== JSON.stringify(p.solution)) bad.push(`${label}: oracle solution differs`);
    }
    expect(bad).toEqual([]);
  }, LONG);
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-27 every puzzle is solvable by the techniques of its level (the walk at ceiling L)', () => {
  it.each(COMBOS)('N = $n level $level: seeds 1 to 20, every call a fill with the solution digit, calls = empty cells, final board = solution', ({ n, level }) => {
    const bad: string[] = [];
    for (const seed of SEEDS) {
      const p = puzzleOf(n, seed, level);
      const w = walk(p.givens, level, p.solution);
      const label = `N ${n} level ${level} seed ${seed}`;
      if (w.problem !== null) bad.push(`${label}: ${w.problem}`);
      else if (w.calls !== emptyCount(p.givens)) bad.push(`${label}: ${w.calls} calls for ${emptyCount(p.givens)} empty cells`);
      else if (JSON.stringify(w.board) !== JSON.stringify(p.solution)) bad.push(`${label}: the final board is not the solution`);
    }
    expect(bad).toEqual([]);
  }, LONG);

  function partial(p: Puzzle, parity: 0 | 1): Grid {
    const board = copyOf(p.givens);
    let position = 0;
    board.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null) return;
        if (position % 2 === parity) row[c] = p.solution[r]?.[c] ?? null;
        position++;
      });
    });
    return board;
  }

  it.each(COMBOS)(
    'N = $n level $level: a hint is available on boards E and O (sampled), at ceiling L and at ceiling 4',
    ({ n, level }) => {
      const bad: string[] = [];
      for (const seed of SEEDS) {
        const p = puzzleOf(n, seed, level);
        for (const [name, parity] of [['E', 0], ['O', 1]] as const) {
          const board = partial(p, parity);
          if (emptyCount(board) === 0) continue;
          for (const ceiling of level === 4 ? [4] : [level, 4]) {
            const label = `N ${n} level ${level} seed ${seed} board ${name} ceiling ${ceiling}`;
            const h = hint(board, ceiling);
            if (h.kind !== 'fill') bad.push(`${label}: kind "${h.kind}" with ${emptyCount(board)} cells empty`);
            else if (board[h.row ?? -1]?.[h.col ?? -1] !== null) bad.push(`${label}: cell ${String(h.row)},${String(h.col)} was not empty`);
            else if (h.value !== p.solution[h.row ?? -1]?.[h.col ?? -1]) bad.push(`${label}: value ${String(h.value)} differs from the solution`);
          }
        }
      }
      expect(bad).toEqual([]);
    },
    LONG,
  );

  it('the E and O check is not vacuous: of the 360 boards (180 puzzles x 2) at least one still has an empty cell', () => {
    let boards = 0;
    let withEmpty = 0;
    for (const { n, level } of COMBOS) {
      for (const seed of SEEDS) {
        const p = puzzleOf(n, seed, level);
        for (const parity of [0, 1] as const) {
          boards++;
          if (emptyCount(partial(p, parity)) > 0) withEmpty++;
        }
      }
    }
    expect(boards).toBe(360);
    expect(withEmpty, 'boards with an empty cell').toBeGreaterThan(0);
  }, LONG);
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-82 a level-L puzzle is exactly level L (solvable with L, not with L - 1)', () => {
  it.each(COMBOS_68.filter((c) => c.level >= 2))(
    'N = $n level $level: the walk with ceiling L - 1 ends on `none` with an empty cell and never on `broken`',
    ({ n, level }) => {
      const bad: string[] = [];
      for (const seed of SEEDS) {
        const p = puzzleOf(n, seed, level);
        const w = walk(p.givens, level - 1, null);
        const label = `N ${n} level ${level} seed ${seed}`;
        if (w.stopKind === 'broken') bad.push(`${label}: the walk with ceiling ${level - 1} returned broken at ${w.problem ?? ''}`);
        else if (w.stopKind !== 'none' || emptyCount(w.board) === 0) {
          bad.push(`${label}: the walk with ceiling ${level - 1} reached the solution (${w.problem ?? 'no stop'}), so the puzzle is easier than level ${level}`);
        }
      }
      expect(bad).toEqual([]);
    },
    LONG,
  );

  it.each(COMBOS_68)('N = $n level $level: the walk with ceiling L reaches the solution in every one of the 20 puzzles', ({ n, level }) => {
    const bad = SEEDS.filter((seed) => {
      const p = puzzleOf(n, seed, level);
      const w = walk(p.givens, level, p.solution);
      return w.problem !== null || JSON.stringify(w.board) !== JSON.stringify(p.solution);
    }).map((seed) => `N ${n} level ${level} seed ${seed}`);
    expect(bad).toEqual([]);
  }, LONG);
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-76 the local violation check agrees with findViolations (differential, seeded)', () => {
  const SAMPLES = 3000;

  it.each([4, 6, 8])('N = %i: single-cell changes on violation-free random boards, 0 mismatches, both outcomes occur', (n) => {
    const rng = mulberry32(1000 + n);
    let board: Grid = emptyBoard(n);
    const mismatches: string[] = [];
    let violating = 0;
    let clean = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const r = Math.floor(rng() * n);
      const c = Math.floor(rng() * n);
      const line = board[r];
      if (line === undefined) throw new Error('no row');
      if (line[c] !== null) {
        if (rng() < 0.5) line[c] = null; // removing a cell keeps the board violation-free (violations are monotone)
        continue;
      }
      const value: 0 | 1 = rng() < 0.5 ? 0 : 1;
      const after = cloneBoard(board);
      const afterRow = after[r];
      if (afterRow === undefined) throw new Error('no row');
      afterRow[c] = value;
      const expected = findViolations(after).length > 0;
      if (expected) violating++;
      else clean++;
      const actual = hasLocalViolation(after, r, c);
      if (actual !== expected) mismatches.push(`N ${n} sample ${i}: cell ${r},${c} value ${value}: local ${actual}, findViolations ${expected}`);
      if (!expected) board = after;
    }
    expect(mismatches.slice(0, 5), `${mismatches.length} mismatches`).toEqual([]);
    expect(violating, 'samples that violate').toBeGreaterThan(20);
    expect(clean, 'samples that do not').toBeGreaterThan(20);
  });

  it.each([4, 6, 8])('N = %i: a change that completes a line into a copy of another line (rows and columns), 0 mismatches', (n) => {
    const mismatches: string[] = [];
    let duplicates = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const solution = puzzleOf(n, seed, 1).solution;
      for (const axis of ['row', 'col'] as const) {
        const lineOf = (i: number): (0 | 1)[] => (axis === 'row' ? [...(solution[i] ?? [])] : solution.map((row) => row[i] ?? 0));
        for (let b = 1; b < n; b++) {
          const a = lineOf(0);
          for (let k = 0; k < n; k++) {
            const same = a[k] ?? 0;
            for (const value of [same, (1 - same) as 0 | 1]) {
              const board: Grid = emptyBoard(n);
              const put = (i: number, j: number, v: 0 | 1 | null): void => {
                const row = board[axis === 'row' ? i : j];
                if (row === undefined) throw new Error('no row');
                row[axis === 'row' ? j : i] = v;
              };
              a.forEach((v, j) => { put(0, j, v); });
              a.forEach((v, j) => { if (j !== k) put(b, j, v); });
              expect(findViolations(board), 'precondition: no violation before the change').toEqual([]);
              put(b, k, value);
              const expected = findViolations(board).length > 0;
              if (value === same) {
                duplicates++;
                expect(expected, `N ${n} ${axis} ${b} equals ${axis} 0: findViolations must report the duplicate`).toBe(true);
              }
              const r = axis === 'row' ? b : k;
              const c = axis === 'row' ? k : b;
              const actual = hasLocalViolation(board, r, c);
              if (actual !== expected) mismatches.push(`N ${n} seed ${seed} ${axis} ${b} cell ${k} value ${value}: local ${actual}, findViolations ${expected}`);
            }
          }
        }
      }
    }
    expect(mismatches.slice(0, 5), `${mismatches.length} mismatches`).toEqual([]);
    expect(duplicates, 'duplicate-completing changes tried').toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------
describe('@trace FR-82 solveByRules equals a loop of public hint calls (differential)', () => {
  /** The loop of public hint calls: solved when no empty cell remains, steps = fills written, stops on a non-fill. */
  function hintLoop(givens: Grid, ceiling: number): { solved: boolean; steps: number } {
    const board = copyOf(givens);
    let steps = 0;
    for (;;) {
      if (emptyCount(board) === 0) return { solved: true, steps };
      const h = hint(board, ceiling);
      if (h.kind !== 'fill') return { solved: false, steps };
      const row = board[h.row ?? -1];
      if (row === undefined) return { solved: false, steps };
      row[h.col ?? -1] = h.value as 0 | 1;
      steps++;
    }
  }

  const SPEC_BOARDS: [string, Grid][] = [
    ['line balance row', LB_ROW],
    ['line balance column', LB_COL],
    ['unique lines row', UL_ROW],
    ['unique lines column', UL_COL],
    ['look-ahead two steps', LA_TWO],
    ['look-ahead four steps', LA_FOUR],
    ['look-ahead equal steps', LA_EQUAL],
    ['lower technique wins', LOWER_WINS],
    ['pair board', PAIR_BOARD],
    ['count board', COUNT_BOARD],
  ];

  it('the spec boards at ceilings 1 to 4: same solved and same steps', () => {
    const bad: string[] = [];
    for (const [name, board] of SPEC_BOARDS) {
      for (const ceiling of [1, 2, 3, 4]) {
        const a = solveByRules(board, ceiling);
        const b = hintLoop(board, ceiling);
        if (a.solved !== b.solved || a.steps !== b.steps) {
          bad.push(`${name} ceiling ${ceiling}: solveByRules ${JSON.stringify(a)}, hint loop ${JSON.stringify(b)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  }, LONG);

  it('the givens of the puzzles (N in 6 and 8, levels 1 to 4, seeds 1 to 5) at ceilings 1 to 4: same solved and same steps', () => {
    const bad: string[] = [];
    for (const { n, level } of COMBOS_68) {
      for (let seed = 1; seed <= 5; seed++) {
        const p = puzzleOf(n, seed, level);
        for (const ceiling of [1, 2, 3, 4]) {
          const a = solveByRules(p.givens, ceiling);
          const b = hintLoop(p.givens, ceiling);
          if (a.solved !== b.solved || a.steps !== b.steps) {
            bad.push(`N ${n} level ${level} seed ${seed} ceiling ${ceiling}: solveByRules ${JSON.stringify(a)}, hint loop ${JSON.stringify(b)}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  }, LONG);

  it('the comparison is not vacuous: the ceiling matters (line-balance board: 0 steps at ceiling 1, more at ceiling 2, and the same through the hint loop)', () => {
    expect(solveByRules(LB_ROW, 1).steps).toBe(0);
    expect(solveByRules(LB_ROW, 2).steps).toBeGreaterThan(0);
    expect(hintLoop(LB_ROW, 2).steps).toBe(solveByRules(LB_ROW, 2).steps);
    expect(solveByRules(LA_TWO, 4).steps).toBeGreaterThan(solveByRules(LA_TWO, 3).steps);
  });

  it('solveByRules does not modify its input and a full valid board returns solved with 0 steps at every ceiling', () => {
    const board = copyOf(LB_ROW);
    solveByRules(board, 4);
    expect(board).toEqual(LB_ROW);
    const full: Grid = [
      [1, 0, 1, 0],
      [1, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 1, 1, 0],
    ];
    for (const ceiling of [1, 2, 3, 4]) expect(solveByRules(full, ceiling)).toEqual({ solved: true, steps: 0 });
  });
});

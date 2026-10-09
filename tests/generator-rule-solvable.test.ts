// @trace FR-27
// FR-27: every generated puzzle is solvable by the three rules alone (pair, sandwich, count), N = 4, 6, 8,
// seeds 1 to 20 (60 puzzles). Written from the delta scenarios of add-rule-solvable-generator, before the implementation.
// The generator checks (1.1) use only the public engine API (generate, hint, countSolutions); they do not call solveByRules.
// Scenario «Determinism, uniqueness and timing still hold» is covered by the existing, unchanged tests:
// tests/generator.test.ts (FR-14), tests/generator-unique.test.ts (FR-15), tests/generator-timing.test.ts (NFR-1 to NFR-3)
// and tests/engine-purity.test.ts (TC-8). They are not duplicated here.
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations, generate, hint, isSolved } from '../src/engine/index';
import type { Grid, Hint, Puzzle } from '../src/engine/index';
import { solveByRules } from '../src/engine/rule-solve';
import { parseBoard } from './helpers/board';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const LONG = 120_000;
/** The no-rule sentence of FR-25 (the literal, as tests/hint.test.ts does; the play-page helper pulls in the DOM page). */
const NO_RULE_SENTENCE = 'Жодне з правил зараз не підказує наступного ходу.';

function copyOf(board: Grid): Grid {
  return board.map((row) => [...row]);
}

function emptyCount(board: Grid): number {
  return board.reduce((sum, row) => sum + row.filter((cell) => cell === null).length, 0);
}

interface Walk {
  board: Grid;
  /** hint calls made */
  calls: number;
  /** fills written into the board */
  fills: number;
  /** the hint that ended the walk when it was not a fill */
  stop: Hint | null;
  /** the first problem found, naming its step; null when the walk was clean */
  problem: string | null;
}

/**
 * Repeat: ask the public hint engine for a hint on the board and write its value into its cell,
 * until the board is full or a call does not return a fill. The loop is capped at the number of empty cells
 * of the givens (an endless-loop guard) and breaks on the first non-fill result.
 * `solution`, when given, is checked cell by cell.
 */
function walk(givens: Grid, solution: (0 | 1)[][] | null): Walk {
  const board = copyOf(givens);
  const empties = emptyCount(givens);
  const out: Walk = { board, calls: 0, fills: 0, stop: null, problem: null };
  while (emptyCount(board) > 0) {
    if (out.calls >= empties) {
      out.problem = `step ${out.calls + 1}: more hint calls than the ${empties} empty cells (endless-loop guard)`;
      break;
    }
    const step = out.calls + 1;
    const h = hint(board);
    out.calls++;
    if (h.kind !== 'fill') {
      out.stop = h;
      out.problem = `step ${step}: kind "${h.kind}", not a fill (${emptyCount(board)} cells still empty)`;
      break;
    }
    if (board[h.row]?.[h.col] !== null) {
      out.problem = `step ${step}: the hint cell ${h.row},${h.col} was not empty`;
      break;
    }
    if (solution !== null && solution[h.row]?.[h.col] !== h.value) {
      out.problem = `step ${step}: the hint writes ${h.value} at ${h.row},${h.col}, the solution holds ${String(solution[h.row]?.[h.col])}`;
      break;
    }
    const row = board[h.row];
    if (row === undefined) throw new Error(`no row ${h.row}`);
    row[h.col] = h.value;
    out.fills++;
  }
  return out;
}

// 1.1(a) scenario «Repeated fill reaches the solution over the fixed seed set»
describe.each([4, 6, 8])('@trace FR-27 repeated fill reaches the solution at N = %i over seeds 1 to 20', (n) => {
  it('every seed: each hint is a fill on an empty cell with the solution digit, calls equal empty cells, final board is the solution', () => {
    const bad: { seed: number; step: string; kind: string; emptiesLeft: number }[] = [];
    for (const seed of SEEDS) {
      const p = generate(n, seed);
      const w = walk(p.givens, p.solution);
      const callsOk = w.calls === emptyCount(p.givens);
      const finalOk = JSON.stringify(w.board) === JSON.stringify(p.solution);
      if (w.problem !== null || !callsOk || !finalOk) {
        bad.push({
          seed,
          step: w.problem ?? `calls ${w.calls} vs ${emptyCount(p.givens)} empty cells, final board equals solution: ${finalOk}`,
          kind: w.stop?.kind ?? 'fill',
          emptiesLeft: emptyCount(w.board),
        });
      }
    }
    expect(bad, `N = ${n}: seeds whose givens the three rules cannot finish`).toEqual([]);
  }, LONG);
});

// 1.1(b) scenario «A board with a unique solution that the rules cannot finish is not a generator output»
describe('@trace FR-27 a board with a unique solution that the rules cannot finish is not a generator output', () => {
  const FIXTURE = '. 0 . 0\n1 0 . .\n. . 0 .\n. . . .';
  const UNIQUE_SOLUTION = '1 0 1 0\n1 0 0 1\n0 1 0 1\n0 1 1 0';

  it('the fixture board has exactly one solution for the solver, and it is the pinned grid', () => {
    expect(countSolutions(parseBoard(FIXTURE))).toBe(1);
    // Every given of the fixture agrees with the pinned unique solution, and so does every fill the rules make
    // before they run out: the walk stops on a "none", never on a wrong value.
    const solution = parseBoard(UNIQUE_SOLUTION) as (0 | 1)[][];
    // The pinned grid is a complete valid grid; with the solver result 1 and every given agreeing, it is THE unique solution.
    expect(findViolations(solution)).toEqual([]);
    expect(isSolved(solution)).toBe(true);
    parseBoard(FIXTURE).forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== null) expect(solution[r]?.[c], `given ${r},${c}`).toBe(cell);
      });
    });
    const w = walk(parseBoard(FIXTURE), solution);
    expect(w.stop?.kind, `walk problem: ${String(w.problem)}`).toBe('none');
  });

  it('the first hint is a fill (a pair)', () => {
    const first = hint(parseBoard(FIXTURE));
    expect(first.kind).toBe('fill');
    if (first.kind === 'fill') expect(first.rule).toBe('pair');
  });

  it('repeated hint-fill ends on none with the FR-25 sentence while cells are empty (7 fills, 4 empty on the current engine)', () => {
    const w = walk(parseBoard(FIXTURE), null);
    expect(w.stop, 'the call that ended the repetition').toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
    expect(emptyCount(w.board), 'cells still empty when the repetition ended').toBeGreaterThanOrEqual(1);
    expect(w.board).not.toEqual(parseBoard(UNIQUE_SOLUTION));
    expect(w.fills, 'fills before none (current engine)').toBe(7);
    expect(emptyCount(w.board), 'empty cells left (current engine)').toBe(4);
  });

  it.each(SEEDS)('seed %i: generate(4, seed).givens differs from the fixture', (seed) => {
    expect(generate(4, seed).givens, `seed ${seed}`).not.toEqual(parseBoard(FIXTURE));
  });
});

// 1.1(c) scenario «A hint is always available on a correct partial board».
// This is a SAMPLED check: two boards per puzzle (E and O), 120 boards in all, not every correct board.
describe.each([4, 6, 8])('@trace FR-27 a hint is available on a correct partial board at N = %i (sampled)', (n) => {
  /** The givens plus the solution digit in the empty cells whose row-major position among the empty cells has the given parity. */
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

  it('boards E and O with an empty cell yield a fill on an empty cell with the solution digit', () => {
    const bad: { seed: number; board: string; reason: string }[] = [];
    for (const seed of SEEDS) {
      const p = generate(n, seed);
      for (const [name, parity] of [['E', 0], ['O', 1]] as const) {
        const board = partial(p, parity);
        if (emptyCount(board) === 0) continue;
        const h = hint(board);
        if (h.kind !== 'fill') {
          bad.push({ seed, board: name, reason: `kind "${h.kind}" with ${emptyCount(board)} cells empty` });
        } else if (board[h.row]?.[h.col] !== null) {
          bad.push({ seed, board: name, reason: `cell ${h.row},${h.col} was not empty` });
        } else if (h.value !== p.solution[h.row]?.[h.col]) {
          bad.push({ seed, board: name, reason: `value ${h.value} at ${h.row},${h.col} differs from the solution` });
        }
      }
    }
    expect(bad, `N = ${n}: partial boards without a correct fill`).toEqual([]);
  }, LONG);

  it('the check is not vacuous: at least one of the 40 boards at this N still has an empty cell', () => {
    let withEmpty = 0;
    for (const seed of SEEDS) {
      const p = generate(n, seed);
      for (const parity of [0, 1] as const) if (emptyCount(partial(p, parity)) > 0) withEmpty++;
    }
    expect(withEmpty, `N = ${n}: boards with an empty cell`).toBeGreaterThan(0);
  }, LONG);
});

// 1.2 unit tests of solveByRules (internal module, imported directly; not part of src/engine/index.ts).
describe('@trace FR-27 solveByRules', () => {
  const SOLVED_4 = '1 0 1 0\n1 0 0 1\n0 1 0 1\n0 1 1 0';

  it('a full valid grid returns solved with 0 steps', () => {
    expect(solveByRules(parseBoard(SOLVED_4))).toEqual({ solved: true, steps: 0 });
  });

  it('the fixture board the rules cannot finish returns solved false after 7 steps (current engine)', () => {
    expect(solveByRules(parseBoard('. 0 . 0\n1 0 . .\n. . 0 .\n. . . .'))).toEqual({ solved: false, steps: 7 });
  });

  it('a 4x4 board with only its last cell empty is finished by the pair rule in 1 step', () => {
    const board = parseBoard(SOLVED_4);
    const last = board[3];
    if (last === undefined) throw new Error('no row 3');
    last[3] = null;
    expect(solveByRules(board)).toEqual({ solved: true, steps: 1 });
  });

  it('an empty 6x6 board returns solved false with 0 steps', () => {
    const board: Grid = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => null));
    expect(solveByRules(board)).toEqual({ solved: false, steps: 0 });
  });

  // FR-27: «when no empty cell remains the board equals the puzzle's solution». A full board that breaks a rule is
  // not a solution, so solved must be false. Regression: review-gate wf_151b7f7c-5bc (commit 261782b) — the earlier
  // solveByRules returned solved true for any full board.
  it.each([
    ['three equal digits in a row (0 0 0 1)', '0 0 0 1\n1 1 0 0\n0 1 1 0\n1 0 1 1'],
    ['an unbalanced row (three 0s, no triple)', '0 1 0 0\n1 0 1 1\n0 1 1 0\n1 0 0 1'],
    ['two equal rows', '0 0 1 1\n1 1 0 0\n0 0 1 1\n1 1 0 0'],
  ])('a full board that breaks a rule returns solved false with 0 steps: %s', (_name, text) => {
    const board = parseBoard(text);
    expect(emptyCount(board)).toBe(0);
    expect(findViolations(board).length).toBeGreaterThan(0);
    expect(solveByRules(board)).toEqual({ solved: false, steps: 0 });
  });

  // The last fill itself creates the violation: row 0 holds three 1s and two 0s, so the count rule forces a 1 at 0,0,
  // and that 1 makes column 0 (1 0 1 0 1 0) equal to column 2. The start board has no violation (found by search, 6x6).
  it('a board whose only empty cell is forced into a violation returns solved false after 1 step', () => {
    const board = parseBoard('. 0 1 0 1 0\n0 1 0 1 0 1\n1 0 1 0 0 1\n0 1 0 1 1 0\n1 0 1 1 0 0\n0 1 0 0 1 1');
    expect(emptyCount(board)).toBe(1);
    expect(findViolations(board)).toEqual([]);
    expect(solveByRules(board)).toEqual({ solved: false, steps: 1 });
  });

  it('does not modify the input board', () => {
    const board = parseBoard('. 0 . 0\n1 0 . .\n. . 0 .\n. . . .');
    const snapshot = copyOf(board);
    solveByRules(board);
    expect(board).toEqual(snapshot);
  });
});

// @trace NFR-17, FR-76, FR-77
// One hint is fast (NFR-17) for add-difficulty-engine: look-ahead runs on the player's click.
// The board set of the spec: the empty boards of size 4, 6, 8; the givens of the 180 puzzles of the fixed seed set; the
// boards E and O of each (360); the boards of the look-ahead scenarios; and the two 8x8 boards A and B that are stalled
// at ceiling 4 (the declared worst case: every empty cell is tried with both values and nothing is found). Each board is
// timed at ceilings 1 to 4 after a warm-up; the worst case must be under 100 ms and the failure names the board and the
// ceiling that were slowest.
//   * The TIMING assertion alone is green on the unchanged engine (it has no look-ahead and is fast): a guard of the
//     bound, green by design, not red evidence.
//   * The NON-VACUITY assertions are the red part: look-ahead fills on the scenario boards, `none` on the 5-step board,
//     and `none` on boards A and B at ceilings 3 and 4 (the last of these is green today by accident of the missing
//     techniques and stays a guard of the full scan once the techniques exist).
import { describe, expect, it } from 'vitest';
import type { Grid } from '../src/engine/index';
import { hint } from './helpers/engine-shim';
import { COMBOS, SEEDS, copyOf, emptyCount, puzzleOf } from './helpers/levels';
import { emptyBoard } from './helpers/board';
import { BOARD_A, BOARD_B, LA_EQUAL, LA_FIVE, LA_FOUR, LA_TWO } from './helpers/technique-boards';

function partial(givens: Grid, solution: readonly (readonly number[])[], parity: 0 | 1): Grid {
  const board = copyOf(givens);
  let position = 0;
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell !== null) return;
      if (position % 2 === parity) row[c] = (solution[r]?.[c] ?? null) as 0 | 1 | null;
      position++;
    });
  });
  return board;
}

function boardSet(): [string, Grid][] {
  const set: [string, Grid][] = [];
  for (const n of [4, 6, 8]) set.push([`empty ${n}x${n}`, emptyBoard(n)]);
  for (const { n, level } of COMBOS) {
    for (const seed of SEEDS) {
      const p = puzzleOf(n, seed, level);
      set.push([`givens N ${n} level ${level} seed ${seed}`, p.givens]);
      for (const [name, parity] of [['E', 0], ['O', 1]] as const) {
        set.push([`board ${name} N ${n} level ${level} seed ${seed}`, partial(p.givens, p.solution, parity)]);
      }
    }
  }
  set.push(['look-ahead two steps', LA_TWO], ['look-ahead four steps', LA_FOUR], ['look-ahead five steps', LA_FIVE], ['look-ahead equal steps', LA_EQUAL]);
  set.push(['worst-case board A (8x8)', BOARD_A], ['worst-case board B (8x8)', BOARD_B]);
  return set;
}

describe('@trace NFR-17 one hint is fast', () => {
  it('the board set has 549 boards: 3 empty + 180 givens + 360 E/O + 4 look-ahead + 2 worst-case', () => {
    expect(boardSet()).toHaveLength(549);
  }, 120_000);

  it('the slowest hint over the set at ceilings 1 to 4 takes under 100 ms (timing alone: green by design at red)', () => {
    const set = boardSet();
    for (const [, board] of set.slice(0, 3)) for (const ceiling of [1, 2, 3, 4]) hint(board, ceiling); // warm-up
    hint(BOARD_A, 4);
    const worst = { ms: 0, name: '', ceiling: 0 };
    for (const [name, board] of set) {
      for (const ceiling of [1, 2, 3, 4]) {
        const t0 = performance.now();
        hint(board, ceiling);
        const ms = performance.now() - t0;
        if (ms > worst.ms) Object.assign(worst, { ms, name, ceiling });
      }
    }
    expect(worst.ms, `slowest: ${worst.name} at ceiling ${worst.ceiling} took ${worst.ms.toFixed(2)} ms`).toBeLessThan(100);
  }, 240_000);

  it('the set is not vacuous: the look-ahead scenario boards return a lookahead fill at ceiling 4', () => {
    for (const [name, board] of [['two steps', LA_TWO], ['four steps', LA_FOUR], ['equal steps', LA_EQUAL]] as const) {
      expect(hint(board, 4), name).toMatchObject({ kind: 'fill', rule: 'lookahead' });
    }
  });

  it('the set is not vacuous: the 5-step board and the two 8x8 boards A and B return the no-rule result at ceiling 4', () => {
    for (const [name, board] of [['five steps', LA_FIVE], ['A', BOARD_A], ['B', BOARD_B]] as const) {
      expect(hint(board, 4).kind, name).toBe('none');
    }
  });

  it('boards A and B return no target at ceiling 3 too, so a call at ceiling 4 has tried every empty cell with both values', () => {
    for (const board of [BOARD_A, BOARD_B]) {
      expect(emptyCount(board)).toBeGreaterThan(40);
      expect(hint(board, 3).kind).toBe('none');
      expect(hint(board, 4).kind).toBe('none');
    }
  });
});

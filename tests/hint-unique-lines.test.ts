// Unique lines hint (technique 3). Written from the delta spec of add-difficulty-engine before the implementation exists.
// Scenarios of «Requirement: Unique lines hint». Coordinates are 1-based in the spec and 0-based in the engine.
// The ceiling argument is reached through the red-phase shim (tests/helpers/engine-shim.ts).
// At red every test fails: the positive ones because technique 3 does not exist; the ceiling-2 and near-miss ones
// (unchanged behaviour of the engine) only because the no-rule sentence is the new one (FR-25 as amended, row 87).
import { describe, expect, it } from 'vitest';
import { cloneBoard } from './helpers/board';
import { hint } from './helpers/engine-shim';
import {
  NO_RULE_SENTENCE,
  UL_COL,
  UL_COL_SENTENCE,
  UL_NEAR_MISS_DIFFERS,
  UL_NEAR_MISS_INCOMPLETE,
  UL_ROW,
  UL_ROW_SENTENCE,
} from './helpers/technique-boards';

describe('@trace FR-75 @trace FR-79 unique lines hint', () => {
  it('Unique lines in a row: row 2 column 3, value 1, rule unique, exact sentence (ceiling 3)', () => {
    expect(hint(UL_ROW, 3)).toEqual({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'unique', sentence: UL_ROW_SENTENCE });
  });

  it('Unique lines in a row: the same board with ceiling 2 yields no target and the no-rule sentence', () => {
    expect(hint(UL_ROW, 2)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('Unique lines in a row: ceiling 4 gives the same fill as ceiling 3 (technique 3 beats look-ahead)', () => {
    expect(hint(UL_ROW, 4)).toEqual({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'unique', sentence: UL_ROW_SENTENCE });
  });

  it('the fill that follows: after writing 1 at row 2 column 3, ceiling 3 targets row 2 column 4 with value 0 by the pair rule', () => {
    const board = cloneBoard(UL_ROW);
    const first = hint(board, 3);
    expect(first).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'unique' });
    const row = board[1];
    if (row === undefined) throw new Error('no row 2');
    row[2] = 1;
    // row 2 now reads `0 1 1 . 1 0`
    expect(board[1]).toEqual([0, 1, 1, null, 1, 0]);
    expect(hint(board, 3)).toMatchObject({ kind: 'fill', row: 1, col: 3, value: 0, rule: 'pair' });
  });

  it('Unique lines in a column: row 3 column 2, value 1, rule unique, exact sentence (ceiling 3)', () => {
    expect(hint(UL_COL, 3)).toEqual({ kind: 'fill', row: 2, col: 1, value: 1, rule: 'unique', sentence: UL_COL_SENTENCE });
  });

  it('Unique lines in a column: ceiling 2 yields no target and the no-rule sentence', () => {
    expect(hint(UL_COL, 2)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('Near miss, the complete line differs on a filled cell: no target and the no-rule sentence at ceiling 3', () => {
    expect(hint(UL_NEAR_MISS_DIFFERS, 3)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('Near miss, the other line is not complete: no target and the no-rule sentence at ceiling 3', () => {
    expect(hint(UL_NEAR_MISS_INCOMPLETE, 3)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });
});

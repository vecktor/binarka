// Line balance hint (technique 2). Written from the delta spec of add-difficulty-engine before the implementation exists.
// Scenarios of «Requirement: Line balance hint». Coordinates in the expectations are 1-based, as the spec writes them;
// the engine's row and col are 0-based. The ceiling argument is reached through the engine.
// add-english-version DELIBERATE CHANGE (FR-110, FR-112; design.md «Tests that change deliberately», file `tests/hint-line-balance.test.ts` l. 27, 35, 39, 43):
// the four whole-object checks of a fill carry the data of its sentence (axis, line, digit) and are `toStrictEqual`; every other check is unchanged.
// At red every test fails: the positive ones because technique 2 does not exist, the ceiling-1 and near-miss ones
// (today's engine offers no such fill either, so their behaviour is unchanged) only because the no-rule sentence is
// the new one (FR-25 as amended, autonomy-log row 87).
import { describe, expect, it } from 'vitest';
import { hint } from '../src/engine/index';
import {
  LB_COL,
  LB_COL_SENTENCE,
  LB_LOWER_LINE,
  LB_N8,
  LB_NEAR_MISS_ARRANGEMENT,
  LB_NEAR_MISS_COUNT,
  LB_ROW,
  LB_ROW_SENTENCE,
  LB_ROWS_BEFORE_COLS,
  LB_TWO_ONES,
  LB_TWO_ONES_SENTENCE,
  LB_TWO_ZEROS,
  NO_RULE_SENTENCE,
} from './helpers/technique-boards';

describe('@trace FR-74 @trace FR-78 line balance hint', () => {
  it('Line balance in a row: row 3 column 6, value 1, rule balance, exact sentence (ceiling 2)', () => {
    expect(hint(LB_ROW, 2)).toStrictEqual({ kind: 'fill', row: 2, col: 5, value: 1, rule: 'balance', axis: 'row', line: 2, digit: 0, sentence: LB_ROW_SENTENCE });
  });

  it('Line balance in a row: the same board with ceiling 1 yields no target and the no-rule sentence', () => {
    expect(hint(LB_ROW, 1)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('Line balance in a column: row 6 column 2, value 0, rule balance, exact sentence (ceiling 2)', () => {
    expect(hint(LB_COL, 2)).toStrictEqual({ kind: 'fill', row: 5, col: 1, value: 0, rule: 'balance', axis: 'col', line: 1, digit: 1, sentence: LB_COL_SENTENCE });
  });

  it('Two cells qualify, zeros: the lower position first (row 3 column 2, value 1, exact sentence)', () => {
    expect(hint(LB_TWO_ZEROS, 2)).toStrictEqual({ kind: 'fill', row: 2, col: 1, value: 1, rule: 'balance', axis: 'row', line: 2, digit: 0, sentence: LB_ROW_SENTENCE });
  });

  it('Two cells qualify, ones: the lower position first (row 3 column 2, value 0, sentence names «однієї одиниці»)', () => {
    expect(hint(LB_TWO_ONES, 2)).toStrictEqual({ kind: 'fill', row: 2, col: 1, value: 0, rule: 'balance', axis: 'row', line: 2, digit: 1, sentence: LB_TWO_ONES_SENTENCE });
  });

  it('The threshold follows N: an 8x8 row with 3 = N/2 - 1 zeros targets row 1 column 5 with value 1', () => {
    const h = hint(LB_N8, 2);
    expect(h).toMatchObject({ kind: 'fill', row: 0, col: 4, value: 1, rule: 'balance' });
  });

  it('Rows before columns: row 5 column 6 with value 1, not row 6 column 6', () => {
    const h = hint(LB_ROWS_BEFORE_COLS, 2);
    expect(h).toMatchObject({ kind: 'fill', row: 4, col: 5, value: 1, rule: 'balance' });
  });

  it('Lower line first: row 2 column 6 with value 1', () => {
    const h = hint(LB_LOWER_LINE, 2);
    expect(h).toMatchObject({ kind: 'fill', row: 1, col: 5, value: 1, rule: 'balance' });
  });

  it('Near miss, no assignment gives three in a row: no target and the no-rule sentence at ceiling 4', () => {
    expect(hint(LB_NEAR_MISS_ARRANGEMENT, 4)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('Near miss, the line holds N/2 - 2 of the digit: no target and the no-rule sentence at ceiling 4', () => {
    expect(hint(LB_NEAR_MISS_COUNT, 4)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('every positive board names the balance rule at ceilings 2, 3 and 4 (a lower technique does not pre-empt it)', () => {
    for (const board of [LB_ROW, LB_COL, LB_TWO_ZEROS, LB_TWO_ONES, LB_N8, LB_ROWS_BEFORE_COLS, LB_LOWER_LINE]) {
      for (const ceiling of [2, 3, 4]) {
        expect(hint(board, ceiling), `ceiling ${ceiling}`).toMatchObject({ kind: 'fill', rule: 'balance' });
      }
    }
  });
});

describe('@trace FR-77 line balance ceiling 1 offers nothing on any positive board', () => {
  it('ceiling 1 and the default give the no-rule result on all seven positive boards', () => {
    for (const board of [LB_ROW, LB_COL, LB_TWO_ZEROS, LB_TWO_ONES, LB_N8, LB_ROWS_BEFORE_COLS, LB_LOWER_LINE]) {
      expect(hint(board, 1)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
      expect(hint(board)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
    }
  });
});

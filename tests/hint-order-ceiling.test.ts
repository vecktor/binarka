// Hint order and ceiling (FR-77) with the modified FR-23, FR-24, FR-25 and FR-26 scenarios of add-difficulty-engine.
// Written from the delta spec before the implementation exists. Coordinates are 1-based in the spec, 0-based in the engine.
// The ceiling argument is reached through the engine.
// add-english-version DELIBERATE CHANGE (FR-110, FR-112; design.md «Tests that change deliberately», file `tests/hint-order-ceiling.test.ts` l. 203): the
// whole-object check of the 4x4 legal-entry fill carries axis, line and digit (a pair of ones in row 1) and is `toStrictEqual`; nothing else here changes.
// Green by design at red (unchanged behaviour, named here so they are not mistaken for red evidence): the default
// ceiling equal to ceiling 1 on every board (today the ceiling is ignored), repeated calls give the same result, the
// pair and count boards give the same fill at every ceiling, the broken-board scenarios at every ceiling, the
// 4x4 legal-entry scenario, and «the board is left unchanged» for the pair board. Red: every scenario that needs a ceiling above 1,
// and every scenario whose expected result is the no-rule sentence (it is the new sentence of FR-25, row 87).
import { describe, expect, it } from 'vitest';
import { countSolutions } from '../src/engine/index';
import type { Grid } from '../src/engine/index';
import { VALID_4X4, boardOf, cloneBoard, emptyBoard, parseBoard } from './helpers/board';
import { hint } from './helpers/hint-type';
import {
  BROKEN_SENTENCE,
  COUNT_BOARD,
  FILLED_BESIDE_PAIR,
  LA_FIVE,
  LA_TWO,
  LB_ROW,
  LOWER_WINS,
  LOWER_WINS_WITHOUT_ROW6,
  NO_RULE_SENTENCE,
  PAIR_BOARD,
  PAIR_ROW3,
  UL_ROW,
  BOARD_A,
  BOARD_B,
  withPlacement,
} from './helpers/technique-boards';

const NONE = { kind: 'none', sentence: NO_RULE_SENTENCE };
const BROKEN = { kind: 'broken', sentence: BROKEN_SENTENCE };

/** The three technique boards of the scenarios «The default ceiling is 1» and «Each ceiling allows exactly its techniques». */
const TECHNIQUE_BOARDS: { name: string; board: Grid; rule: string; firstCeiling: number }[] = [
  { name: 'line balance in a row', board: LB_ROW, rule: 'balance', firstCeiling: 2 },
  { name: 'unique lines in a row', board: UL_ROW, rule: 'unique', firstCeiling: 3 },
  { name: 'look-ahead of two steps', board: LA_TWO, rule: 'lookahead', firstCeiling: 4 },
];

describe('@trace FR-77 the default ceiling is 1', () => {
  it.each(TECHNIQUE_BOARDS)('$name: no ceiling equals ceiling 1, and both are the no-rule result', ({ board }) => {
    expect(hint(board)).toEqual(hint(board, 1));
    expect(hint(board)).toEqual(NONE);
    expect(hint(board, 1)).toEqual(NONE);
  });

  it.each(TECHNIQUE_BOARDS)('$name: ceiling 4 gives the fill with the rule of its technique', ({ board, rule }) => {
    expect(hint(board, 4)).toMatchObject({ kind: 'fill', rule });
  });

  it.each([
    ['Pair hint board', PAIR_BOARD, 'pair'],
    ['Count hint board', COUNT_BOARD, 'count'],
  ] as const)('%s: no ceiling, ceiling 1 and ceiling 4 give the identical fill', (_name, board, rule) => {
    const none = hint(board);
    expect(none).toMatchObject({ kind: 'fill', rule });
    expect(hint(board, 1)).toEqual(none);
    expect(hint(board, 4)).toEqual(none);
  });
});

describe('@trace FR-77 each ceiling allows exactly its techniques', () => {
  it.each(TECHNIQUE_BOARDS)('$name: no target below its technique, its fill from the ceiling of the technique on', ({ board, rule, firstCeiling }) => {
    for (const ceiling of [1, 2, 3, 4]) {
      if (ceiling < firstCeiling) expect(hint(board, ceiling), `ceiling ${ceiling}`).toEqual(NONE);
      else expect(hint(board, ceiling), `ceiling ${ceiling}`).toMatchObject({ kind: 'fill', rule });
    }
  });
});

describe('@trace FR-77 a lower technique wins over a higher one on a lower line', () => {
  it.each([3, 4])('balance at row 6 beats unique lines at row 2 (ceiling %i)', (ceiling) => {
    expect(hint(LOWER_WINS, ceiling)).toMatchObject({ kind: 'fill', row: 5, col: 1, value: 0, rule: 'balance' });
  });

  it('the same board without row 6 yields the unique-lines fill at row 2 column 3 with value 1 (ceiling 3)', () => {
    expect(hint(LOWER_WINS_WITHOUT_ROW6, 3)).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'unique' });
  });
});

describe('@trace FR-77 @trace FR-23 the first three techniques keep their order', () => {
  it('a pair at row 3 comes first, then the line-balance fill at row 3 column 6 (ceiling 4)', () => {
    const board = cloneBoard(PAIR_ROW3);
    const first = hint(board, 4);
    expect(first).toMatchObject({ kind: 'fill', row: 2, col: 2, value: 1, rule: 'pair' });
    const row = board[2];
    if (row === undefined) throw new Error('no row 3');
    row[2] = 1;
    expect(hint(board, 4)).toMatchObject({ kind: 'fill', row: 2, col: 5, value: 1, rule: 'balance' });
  });
});

describe('@trace FR-23 repeated calls at every ceiling are identical', () => {
  it.each(TECHNIQUE_BOARDS)('$name: two calls at each ceiling return the same kind, cell, value, rule and sentence', ({ board }) => {
    for (const ceiling of [1, 2, 3, 4]) {
      expect(hint(board, ceiling), `ceiling ${ceiling}`).toEqual(hint(board, ceiling));
    }
  });
});

describe('@trace FR-24 a hint targets only empty cells, at every ceiling', () => {
  it('a filled cell beside a pair is not targeted by default: no target and the no-rule sentence', () => {
    expect(hint(FILLED_BESIDE_PAIR)).toEqual(NONE);
  });

  it('a filled cell beside a pair at ceiling 4: row 3 column 6 with value 1 (empty), never row 3 column 3', () => {
    const h = hint(FILLED_BESIDE_PAIR, 4);
    expect(h).toMatchObject({ kind: 'fill', row: 2, col: 5, value: 1 });
    expect(h).not.toMatchObject({ row: 2, col: 2 });
  });

  it.each([
    ['a pair board', PAIR_BOARD],
    ['the line-balance row board', LB_ROW],
    ['the unique-lines row board', UL_ROW],
    ['the look-ahead board', LA_TWO],
  ] as const)('%s at ceiling 4: the board is left unchanged and the target cell was empty before', (_name, board) => {
    const before = cloneBoard(board);
    const h = hint(board, 4);
    expect(board).toEqual(before);
    expect(h.kind).toBe('fill');
    if (h.kind === 'fill') expect(before[h.row ?? -1]?.[h.col ?? -1]).toBeNull();
  });
});

describe('@trace FR-25 no-rule hint', () => {
  const sparse = boardOf(6, { cells: [[1, 1, 0]] });

  it('sparse board with no deduction: the new sentence, no target, at the default, ceiling 1 and ceiling 4', () => {
    for (const result of [hint(sparse), hint(sparse, 1), hint(sparse, 4)]) {
      expect(result).toEqual(NONE);
      expect(result.sentence).not.toContain('трьох');
    }
  });

  it.each([4, 6, 8])('empty board of size %i: no target and the same sentence (default, ceiling 1 and ceiling 4)', (n) => {
    const board = emptyBoard(n);
    expect(hint(board)).toEqual(NONE);
    expect(hint(board, 1)).toEqual(NONE);
    expect(hint(board, 4)).toEqual(NONE);
  });

  it('complete valid board: no target and the same sentence (default and ceiling 4)', () => {
    expect(hint(VALID_4X4)).toEqual(NONE);
    expect(hint(VALID_4X4, 4)).toEqual(NONE);
  });

  it('a deduction above the ceiling is not offered: row 3 `0 0 1 . . .` at ceiling 1 is the no-rule result, ceiling 2 finds row 3 column 6', () => {
    expect(hint(LB_ROW, 1)).toEqual(NONE);
    expect(hint(LB_ROW, 2)).toMatchObject({ kind: 'fill', row: 2, col: 5 });
  });

  it('a contradiction that needs five forced steps is not offered: ceiling 4 gives no target, and the solver agrees it is a true refutation', () => {
    expect(hint(LA_FIVE, 4)).toEqual(NONE);
    expect(countSolutions(withPlacement(LA_FIVE, { row: 1, col: 4, value: 1 }))).toBe(0);
    expect(countSolutions(LA_FIVE)).toBe(2);
  });

  it('propagation that stalls without a violation is not a contradiction (6x6 one given, 8x8 empty, boards A and B at ceiling 4)', () => {
    expect(hint(boardOf(6, { cells: [[1, 1, 0]] }), 4)).toEqual(NONE);
    expect(hint(emptyBoard(8), 4)).toEqual(NONE);
    expect(hint(BOARD_A, 4)).toEqual(NONE);
    expect(hint(BOARD_B, 4)).toEqual(NONE);
  });
});

describe('@trace FR-26 broken-board hint wins at every ceiling', () => {
  const threeInRow = boardOf(6, { rows: { 1: '0 0 0 . . .' } });
  const brokenAndPair = boardOf(6, { rows: { 1: '0 0 0 . . .', 3: '1 1 . . . .' } });
  const brokenAndBalance = boardOf(6, { rows: { 1: '0 0 0 . . .', 4: '0 0 1 . . .' } });
  const digitCount = boardOf(6, { rows: { 2: '1 1 0 1 1 .' } });
  const duplicateRows = parseBoard('0 1 1 0\n0 1 1 0\n1 0 0 1\n1 0 0 1');

  it.each([1, 2, 3, 4])('three in a row on the board, ceiling %i: broken sentence, no target', (ceiling) => {
    expect(hint(threeInRow, ceiling)).toEqual(BROKEN);
  });

  it('three in a row, no ceiling given: broken sentence', () => {
    expect(hint(threeInRow)).toEqual(BROKEN);
  });

  it.each([1, 4])('broken rule wins over an available pair hint (ceiling %i)', (ceiling) => {
    expect(hint(brokenAndPair, ceiling)).toEqual(BROKEN);
  });

  it('broken rule wins over a line-balance fill: ceiling 4 and ceiling 2 both give the broken sentence', () => {
    expect(hint(brokenAndBalance, 4)).toEqual(BROKEN);
    expect(hint(brokenAndBalance, 2)).toEqual(BROKEN);
  });

  it.each([1, 4])('digit-count violation, ceiling %i: broken sentence', (ceiling) => {
    expect(hint(digitCount, ceiling)).toEqual(BROKEN);
  });

  it.each([1, 4])('duplicate complete rows, ceiling %i: broken sentence', (ceiling) => {
    expect(hint(duplicateRows, ceiling)).toEqual(BROKEN);
  });

  it.each([1, 4])('a legal entry that differs from the solution is followed, not corrected (ceiling %i)', (ceiling) => {
    const board = boardOf(4, { cells: [[1, 1, 1], [1, 2, 1]] });
    expect(hint(board, ceiling)).toStrictEqual({
      kind: 'fill',
      row: 0,
      col: 2,
      value: 0,
      rule: 'pair',
      axis: 'row',
      line: 0,
      digit: 1,
      sentence: 'Дві одиниці поспіль у рядку 1, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.',
    });
  });
});

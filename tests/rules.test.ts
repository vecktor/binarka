// Rule checker: findViolations / isSolved. Scenarios transcribed from openspec/specs/puzzle-engine/spec.md.
// Violation cells are compared as sets (the pinned API does not fix their order).
// Scenario rows/columns are 1-based; the interface is 0-based.
import { describe, expect, it } from 'vitest';
import { findViolations, isSolved } from '../src/engine/index';
import { VALID_4X4, boardOf, cloneBoard, emptyBoard, matching, parseBoard, sortedCells } from './helpers/board';

type Cells = Array<[number, number]>;

describe('@trace FR-1 three equal digits in a row', () => {
  it('run of three ones in row 1 is flagged with columns 2, 3 and 4', () => {
    const board = boardOf(6, { rows: { 1: '0 1 1 1 0 .' } });
    const three = matching(findViolations(board), 'three', 'row');
    expect(three).toHaveLength(1);
    expect(three[0]?.index).toBe(0);
    expect(sortedCells(three[0]?.cells ?? [])).toEqual([[0, 1], [0, 2], [0, 3]]);
  });

  it('longer run in row 2 is flagged with all four of its cells and not column 5', () => {
    const board = boardOf(6, { rows: { 2: '0 0 0 0 1 .' } });
    const three = matching(findViolations(board), 'three', 'row');
    expect(three).toHaveLength(1);
    expect(three[0]?.index).toBe(1);
    expect(sortedCells(three[0]?.cells ?? [])).toEqual([[1, 0], [1, 1], [1, 2], [1, 3]]);
  });

  it('two equal digits (0 0 1) in row 3 are not a three-in-a-row violation', () => {
    const board = boardOf(6, { rows: { 3: '0 0 1 . . .' } });
    expect(matching(findViolations(board), 'three', 'row', 2)).toEqual([]);
  });

  it('equal digits separated by another digit (1 1 0 1 1) in row 4 are not a run', () => {
    const board = boardOf(6, { rows: { 4: '1 1 0 1 1 .' } });
    expect(matching(findViolations(board), 'three', 'row', 3)).toEqual([]);
  });
});

describe('@trace FR-2 three equal digits in a column', () => {
  it('run of three zeros at rows 2, 3, 4 of column 3 is flagged for column 3', () => {
    const board = boardOf(6, { cols: { 3: '. 0 0 0 . .' } });
    const three = matching(findViolations(board), 'three', 'col');
    expect(three).toHaveLength(1);
    expect(three[0]?.index).toBe(2);
    expect(sortedCells(three[0]?.cells ?? [])).toEqual([[1, 2], [2, 2], [3, 2]]);
  });

  it('two equal digits in column 5 are not a violation at all', () => {
    const board = boardOf(6, { cols: { 5: '1 1 . . . .' } });
    expect(findViolations(board)).toEqual([]);
  });
});

describe('@trace FR-3 a row with too many of one digit', () => {
  it('four ones in a 6-wide row is a count violation for row 1 listing the four ones', () => {
    const board = boardOf(6, { rows: { 1: '1 1 0 1 1 .' } });
    const count = matching(findViolations(board), 'count', 'row');
    expect(count).toHaveLength(1);
    expect(count[0]?.index).toBe(0);
    expect(sortedCells(count[0]?.cells ?? [])).toEqual([[0, 0], [0, 1], [0, 3], [0, 4]]);
  });

  it('exactly N/2 of a digit in an incomplete row (1 0 1 0 1 .) is allowed', () => {
    const board = boardOf(6, { rows: { 2: '1 0 1 0 1 .' } });
    expect(findViolations(board)).toEqual([]);
  });

  it('threshold follows N: five zeros in an 8-wide row is flagged', () => {
    const board = boardOf(8, { rows: { 1: '0 0 1 0 0 1 0 .' } });
    const count = matching(findViolations(board), 'count', 'row');
    expect(count).toHaveLength(1);
    expect(count[0]?.index).toBe(0);
    expect(sortedCells(count[0]?.cells ?? [])).toEqual([[0, 0], [0, 1], [0, 3], [0, 4], [0, 6]]);
  });

  it('threshold follows N: four zeros and three ones in an 8-wide row is not flagged', () => {
    const board = boardOf(8, { rows: { 1: '0 0 1 0 0 1 1 .' } });
    expect(findViolations(board)).toEqual([]);
  });
});

describe('@trace FR-4 a column with too many of one digit', () => {
  it('four zeros in a 6-high column is a count violation for column 2 listing the four zeros', () => {
    const board = boardOf(6, { cols: { 2: '0 0 1 0 0 .' } });
    const count = matching(findViolations(board), 'count', 'col');
    expect(count).toHaveLength(1);
    expect(count[0]?.index).toBe(1);
    expect(sortedCells(count[0]?.cells ?? [])).toEqual([[0, 1], [1, 1], [3, 1], [4, 1]]);
  });

  it('exactly N/2 of a digit in an incomplete column (0 1 0 1 0 .) is allowed', () => {
    const board = boardOf(6, { cols: { 4: '0 1 0 1 0 .' } });
    expect(findViolations(board)).toEqual([]);
  });
});

describe('@trace FR-5 identical complete rows', () => {
  it('rows 1 and 3 both 0 1 1 0 give a duplicate-row violation naming rows 1 and 3 (0-based 0 and 2)', () => {
    const board = boardOf(4, { rows: { 1: '0 1 1 0', 3: '0 1 1 0' } });
    const dup = matching(findViolations(board), 'duplicate', 'row');
    expect(dup).toHaveLength(1);
    expect(dup[0]?.index).toBe(0);
    expect(dup[0]?.other).toBe(2);
    const expected: Cells = [];
    for (const r of [0, 2]) for (let c = 0; c < 4; c++) expected.push([r, c]);
    expect(sortedCells(dup[0]?.cells ?? [])).toEqual(expected);
  });

  it('an incomplete row (0 1 1 .) is never compared', () => {
    const board = boardOf(4, { rows: { 1: '0 1 1 0', 3: '0 1 1 .' } });
    expect(matching(findViolations(board), 'duplicate', 'row')).toEqual([]);
  });
});

describe('@trace FR-6 identical complete columns', () => {
  it('columns 2 and 4 both 1 0 0 1 give a duplicate-column violation naming columns 2 and 4 (0-based 1 and 3)', () => {
    const board = boardOf(4, { cols: { 2: '1 0 0 1', 4: '1 0 0 1' } });
    const dup = matching(findViolations(board), 'duplicate', 'col');
    expect(dup).toHaveLength(1);
    expect(dup[0]?.index).toBe(1);
    expect(dup[0]?.other).toBe(3);
    const expected: Cells = [];
    for (const c of [1, 3]) for (let r = 0; r < 4; r++) expected.push([r, c]);
    expect(sortedCells(dup[0]?.cells ?? [])).toEqual(sortedCells(expected));
  });

  it('an incomplete column (1 0 0 .) is never compared', () => {
    const board = boardOf(4, { cols: { 2: '1 0 0 1', 4: '1 0 0 .' } });
    expect(matching(findViolations(board), 'duplicate', 'col')).toEqual([]);
  });
});

describe('@trace FR-7 empty cells never cause violations', () => {
  it('sparse 4x4 board (0 at 1,1; 1 at 2,2; 1 at 4,4) has no violations', () => {
    const board = boardOf(4, { cells: [[1, 1, 0], [2, 2, 1], [4, 4, 1]] });
    expect(findViolations(board)).toEqual([]);
  });

  it.each([4, 6, 8])('empty board of size %i has no violations', (n) => {
    expect(findViolations(emptyBoard(n))).toEqual([]);
  });
});

describe('@trace FR-8 a correct full grid is recognised as solved', () => {
  it('valid full 4x4 grid is solved', () => {
    expect(isSolved(VALID_4X4)).toBe(true);
  });
});

describe('@trace FR-9 incomplete or rule-breaking grids are not solved', () => {
  it('valid grid with row 4 column 4 emptied is not solved', () => {
    const board = cloneBoard(VALID_4X4);
    const row = board[3];
    if (row) row[3] = null;
    expect(isSolved(board)).toBe(false);
  });

  it('full grid with duplicate rows (0 1 1 0 / 0 1 1 0 / 1 0 0 1 / 1 0 0 1) is not solved', () => {
    const board = parseBoard(`
      0 1 1 0
      0 1 1 0
      1 0 0 1
      1 0 0 1
    `);
    expect(isSolved(board)).toBe(false);
  });

  it('every single-cell emptying of the valid grid is not solved', () => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const board = cloneBoard(VALID_4X4);
        const row = board[r];
        if (row) row[c] = null;
        expect(isSolved(board), `emptied ${r},${c}`).toBe(false);
      }
    }
  });
});

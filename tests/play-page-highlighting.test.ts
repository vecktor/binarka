// Play page: rule highlighting (FR-35 to FR-38). Premises are asserted with the real rule checker before the
// class assertions, so that a negative check ("no cell has cell-violation") can never pass on an empty page.
import { describe, expect, it } from 'vitest';
import { findViolations } from '../src/engine/index';
import {
  BLANK,
  DIRTY_GIVENS,
  HINT_BREAKS,
  ISOLATED,
  PAIR_COL,
  PAIR_LEFT,
  PAIR_ROW,
  PAIR_ROW_PLUS,
  cellEl,
  cellText,
  checkerCells,
  clickCell,
  clickUntil,
  expectPageStructure,
  expectedHint,
  installPageLifecycle,
  mountFixture,
  pressHint,
  readBoard,
  setCellTo,
  setCol,
  setRow,
  targetCell,
  violationCells,
} from './helpers/play-page';
import { sortedCells } from './helpers/board';

installPageLifecycle();

/** Row r: 1-based cells (r, 1..6). */
const rowCells = (r: number): Array<[number, number]> => [1, 2, 3, 4, 5, 6].map((c): [number, number] => [r, c]);
const colCells = (c: number): Array<[number, number]> => [1, 2, 3, 4, 5, 6].map((r): [number, number] => [r, c]);

describe('@trace FR-35 three or more equal digits side by side are highlighted', () => {
  it('Three equal digits in a row are highlighted', () => {
    const root = mountFixture(PAIR_ROW);
    expectPageStructure(root);
    expect(violationCells(root)).toEqual([]);
    expect(cellText(root, 3, 1) + cellText(root, 3, 2) + cellText(root, 3, 3)).toBe('00');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');

    clickCell(root, 3, 3);

    expect(cellText(root, 3, 3)).toBe('0');
    // premise from the real rule checker: exactly one violation, the three in row 3 (0-based index 2)
    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'three', axis: 'row', index: 2 });
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);
  });

  it('Three equal digits in a column are highlighted', () => {
    const root = mountFixture(PAIR_COL);
    expectPageStructure(root);
    expect(violationCells(root)).toEqual([]);
    expect(cellText(root, 1, 4)).toBe('1');
    expect(cellText(root, 2, 4)).toBe('1');
    expect(cellText(root, 3, 4)).toBe('');

    clickCell(root, 3, 4, 2);

    expect(cellText(root, 3, 4)).toBe('1');
    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'three', axis: 'col', index: 3 });
    expect(violationCells(root)).toEqual([[1, 4], [2, 4], [3, 4]]);
  });

  it('Two equal digits are not highlighted', () => {
    const root = mountFixture(ISOLATED);
    expectPageStructure(root);
    expect(violationCells(root)).toEqual([]);
    // (1,1) is a given 0; (1,2) is an empty player cell next to it
    expect(cellText(root, 1, 1)).toBe('0');
    expect(cellText(root, 1, 2)).toBe('');

    clickCell(root, 1, 2);

    expect(cellText(root, 1, 1)).toBe('0');
    expect(cellText(root, 1, 2)).toBe('0');
    expect(findViolations(readBoard(root))).toEqual([]);
    expect(violationCells(root)).toEqual([]);
  });
});

describe('@trace FR-36 a line with more than N/2 of one digit is highlighted', () => {
  it('Too many zeros in a row: the fourth 0 highlights all six cells of the row and nothing else', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    // 0 0 1 0 1 . holds three 0 (exactly N/2): not highlighted yet
    setRow(root, 1, '0 0 1 0 1 .');
    expect(violationCells(root)).toEqual([]);
    expect(cellText(root, 1, 6)).toBe('');

    setCellTo(root, 1, 6, 0);

    // 0 0 1 0 1 0: four 0, no three side by side; the only broken rule is the count of row 1
    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'count', axis: 'row', index: 0 });
    expect(violationCells(root)).toEqual(sortedCells(rowCells(1)));
  });

  it('Too many ones in a column: the fourth 1 highlights all six cells of the column and nothing else', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    // top to bottom 1 1 0 1 0 . holds three 1: not highlighted yet
    setCol(root, 1, '1 1 0 1 0 .');
    expect(violationCells(root)).toEqual([]);
    expect(cellText(root, 6, 1)).toBe('');

    setCellTo(root, 6, 1, 1);

    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'count', axis: 'col', index: 0 });
    expect(violationCells(root)).toEqual(sortedCells(colCells(1)));
  });

  it('Exactly N/2 is not highlighted: a full row of three 0 and three 1', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    setRow(root, 2, '0 0 1 0 1 1');
    expect(['1', '2', '3', '4', '5', '6'].map((c) => cellText(root, 2, Number(c))).join('')).toBe('001011');
    expect(findViolations(readBoard(root))).toEqual([]);
    expect(violationCells(root)).toEqual([]);
  });
});

describe('@trace FR-37 identical complete rows or columns are highlighted', () => {
  it('Two identical complete rows: both rows highlighted, nothing else', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    setRow(root, 2, '0 1 0 0 1 1');
    setRow(root, 5, '0 1 0 0 1 .');
    // row 5 still has an empty cell: not compared
    expect(violationCells(root)).toEqual([]);

    setCellTo(root, 5, 6, 1);

    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'duplicate', axis: 'row', index: 1, other: 4 });
    expect(violationCells(root)).toEqual(sortedCells([...rowCells(2), ...rowCells(5)]));
  });

  it('Two identical complete columns: both columns highlighted, nothing else', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    setCol(root, 2, '0 1 0 0 1 1');
    setCol(root, 5, '0 1 0 0 1 .');
    expect(violationCells(root)).toEqual([]);

    setCellTo(root, 6, 5, 1);

    const violations = findViolations(readBoard(root));
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'duplicate', axis: 'col', index: 1, other: 4 });
    expect(violationCells(root)).toEqual(sortedCells([...colCells(2), ...colCells(5)]));
  });

  it('A row with an empty cell is not compared', () => {
    const root = mountFixture(BLANK);
    expectPageStructure(root);
    setRow(root, 2, '0 1 0 0 1 1');
    setRow(root, 5, '0 1 0 0 1 .');
    expect(cellText(root, 2, 6)).toBe('1');
    expect(cellText(root, 5, 6)).toBe('');
    expect(cellText(root, 5, 5)).toBe('1');
    expect(findViolations(readBoard(root))).toEqual([]);
    expect(violationCells(root)).toEqual([]);
  });
});

describe('@trace FR-38 highlighting follows every board change', () => {
  it('Highlight appears immediately, in the same click handling', () => {
    const root = mountFixture(PAIR_LEFT);
    expectPageStructure(root);
    expect(violationCells(root)).toEqual([]);
    expect(cellText(root, 4, 1)).toBe('');

    // no await anywhere: the class must be there when click() returns
    clickCell(root, 4, 1);

    expect(cellText(root, 4, 1)).toBe('0');
    expect(violationCells(root)).toEqual([[4, 1], [4, 2], [4, 3]]);
  });

  it('Highlight disappears once the rule is fixed (click the third cell until it is empty)', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3);
    // premise: exactly three cells highlighted, all in row 3, and no other rule broken
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(findViolations(readBoard(root))).toHaveLength(1);

    clickCell(root, 3, 3); // now 1: the run is broken, the highlight is gone at once
    expect(cellText(root, 3, 3)).toBe('1');
    expect(violationCells(root)).toEqual([]);

    clickUntil(root, 3, 3, '');
    expect(cellText(root, 3, 3)).toBe('');
    expect(violationCells(root)).toEqual([]);
    // the board is still rendered (the negative above is not vacuous)
    expect(cellText(root, 3, 1)).toBe('0');
  });

  it('Hint fill triggers recomputation: the highlighted set equals what the checker reports for the new board', () => {
    for (const puzzle of [PAIR_ROW, PAIR_COL]) {
      const root = mountFixture(puzzle);
      const h = expectedHint(root);
      expect(h.kind).toBe('fill');
      const [row, col] = targetCell(h);
      expect(cellText(root, row, col)).toBe('');

      pressHint(root);

      expect(cellText(root, row, col)).not.toBe('');
      expect(violationCells(root)).toEqual(checkerCells(readBoard(root)));
    }
  });

  it('Hint fill that itself breaks a rule is highlighted at once (requirement text: a hint fill is a board change)', () => {
    const root = mountFixture(HINT_BREAKS);
    // premise: rule-clean, the engine fills 1-based (1,3) with 0, completing 0 0 0 in column 3
    expect(violationCells(root)).toEqual([]);
    const h = expectedHint(root);
    expect(h).toMatchObject({ kind: 'fill', row: 0, col: 2, value: 0 });

    pressHint(root);

    expect(cellText(root, 1, 3)).toBe('0');
    expect(checkerCells(readBoard(root))).toEqual([[1, 3], [2, 3], [3, 3]]);
    expect(violationCells(root)).toEqual([[1, 3], [2, 3], [3, 3]]);
  });

  it('Clicking a given does not recompute to a different result', () => {
    const root = mountFixture(PAIR_ROW_PLUS);
    clickCell(root, 3, 3);
    const highlighted = violationCells(root);
    expect(highlighted).toEqual([[3, 1], [3, 2], [3, 3]]);

    // (3,1) is a given inside the highlighted run, (6,6) a given outside it
    expect(cellEl(root, 3, 1).getAttribute('data-given')).toBe('true');
    expect(cellEl(root, 6, 6).getAttribute('data-given')).toBe('true');
    clickCell(root, 3, 1);
    expect(violationCells(root)).toEqual(highlighted);
    clickCell(root, 6, 6, 3);
    expect(violationCells(root)).toEqual(highlighted);
  });

  it('A new puzzle recomputes highlights from its own givens (a board whose givens break a rule is highlighted at once)', () => {
    // the requirement lists a new puzzle as a board change; the mount of such a puzzle is covered the same way
    const root = mountFixture(DIRTY_GIVENS);
    expectPageStructure(root);
    expect(checkerCells(DIRTY_GIVENS.givens)).toEqual([[1, 1], [1, 2], [1, 3]]);
    expect(violationCells(root)).toEqual([[1, 1], [1, 2], [1, 3]]);
  });
});

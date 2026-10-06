// Play page: the hint button (FR-39 fills one cell, FR-40 shows the engine's sentence and keeps it).
// Expected hints are the real engine hint() applied to the board read from the DOM, plus literal values where the
// spec pins them. Page coordinates are 1-based, the engine's row/col are 0-based.
import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../src/engine/index';
import {
  BROKEN_SENTENCE,
  COUNT_ROW,
  ISOLATED,
  NO_RULE_SENTENCE,
  PAIR_COL,
  PAIR_ROW,
  TWO_PAIRS,
  allCells,
  cellEl,
  cellText,
  clickCell,
  expectPageStructure,
  expectedHint,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  makePuzzle,
  mountFixture,
  mountPage,
  pressHint,
  pressNew,
  q,
  readBoard,
  snapshot,
  targetCell,
} from './helpers/play-page';
import { boardOf } from './helpers/board';

installPageLifecycle();

/** The texts of all 36 cells, row-major, as a flat array (cell text only, not classes). */
const texts = (root: HTMLElement): string[] =>
  Array.from({ length: 36 }, (_, i) => cellText(root, Math.floor(i / 6) + 1, (i % 6) + 1));

/** Hint situations of the engine spec, with the expected 1-based target and value written out literally. */
const FILL_CASES: Array<{ name: string; puzzle: Puzzle; row: number; col: number; value: 0 | 1 }> = [
  { name: 'pair of zeros in a row', puzzle: PAIR_ROW, row: 3, col: 3, value: 1 },
  { name: 'pair of ones in a column', puzzle: PAIR_COL, row: 3, col: 4, value: 0 },
  {
    name: 'pair of ones in a row',
    puzzle: makePuzzle(boardOf(6, { cells: [[2, 4, 1], [2, 5, 1]] })),
    row: 2,
    col: 3,
    value: 0,
  },
  {
    name: 'pair of zeros in a column',
    puzzle: makePuzzle(boardOf(6, { cells: [[4, 6, 0], [5, 6, 0]] })),
    row: 3,
    col: 6,
    value: 1,
  },
  {
    name: 'sandwich of zeros in a column',
    puzzle: makePuzzle(boardOf(6, { cells: [[1, 2, 0], [3, 2, 0]] })),
    row: 2,
    col: 2,
    value: 1,
  },
  {
    name: 'sandwich of ones in a row',
    puzzle: makePuzzle(boardOf(6, { cells: [[1, 1, 1], [1, 3, 1]] })),
    row: 1,
    col: 2,
    value: 0,
  },
  { name: 'count of zeros in a row', puzzle: COUNT_ROW, row: 5, col: 4, value: 1 },
];

describe('@trace FR-39 the hint button fills one cell', () => {
  for (const { name, puzzle, row, col, value } of FILL_CASES) {
    it(`Hint fills the targeted cell and no other (${name})`, () => {
      const root = mountFixture(puzzle);
      expectPageStructure(root);
      const before = texts(root);
      const h = expectedHint(root);
      expect(h.kind).toBe('fill');
      // literal expectation from the engine spec, 1-based page numbers
      expect(targetCell(h)).toEqual([row, col]);
      expect(h).toMatchObject({ value });
      expect(cellText(root, row, col)).toBe('');

      pressHint(root);

      expect(cellText(root, row, col)).toBe(String(value));
      const after = texts(root);
      const changed = after.flatMap((t, i) => (t !== before[i] ? [i] : []));
      expect(changed).toEqual([(row - 1) * 6 + (col - 1)]);
      // FR-39 / FR-59 (add-hinted-cell): the filled cell is an ordinary player cell that carries the marker, no other does
      expect(cellEl(root, row, col).classList.contains('cell-hinted')).toBe(true);
      expect(cellEl(root, row, col).getAttribute('data-given')).toBe('false');
      expect(cellEl(root, row, col).classList.contains('cell-given')).toBe(false);
      expect(hintedCells(root)).toEqual([[row, col]]);
    });
  }

  it('The filled cell carries the marker (FR-59): the target has cell-hinted, data-given false, no cell-given; no other cell has it', () => {
    const root = mountFixture(PAIR_COL);
    expect(hintedCells(root)).toEqual([]);
    expect(targetCell(expectedHint(root))).toEqual([3, 4]);

    pressHint(root);

    const target = cellEl(root, 3, 4);
    expect(target.classList.contains('cell-hinted')).toBe(true);
    expect(target.getAttribute('data-given')).toBe('false');
    expect(target.classList.contains('cell-given')).toBe(false);
    expect(allCells(root).filter((c) => c !== target && c.classList.contains('cell-hinted'))).toEqual([]);
    expect(hintedCells(root)).toEqual([[3, 4]]);
  });

  it('Hint fills the targeted cell on a real generated board (seed 2)', () => {
    const root = mountPage({ seedSource: () => 2 });
    const before = texts(root);
    const h = expectedHint(root);
    expect(h.kind).toBe('fill');
    const [row, col] = targetCell(h);
    if (h.kind !== 'fill') return;
    expect(cellText(root, row, col)).toBe('');

    pressHint(root);

    const after = texts(root);
    expect(cellText(root, row, col)).toBe(String(h.value));
    expect(after.flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([(row - 1) * 6 + (col - 1)]);
    expect(hintedCells(root)).toEqual([[row, col]]); // FR-59
  });

  it('Zero-based target maps to the one-based cell: engine row 2, col 2 is data-row 3, data-col 3', () => {
    const root = mountFixture(PAIR_ROW);
    // the only givens are 0 at data-row 3, data-col 1 and 2
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(2);
    expect(cellText(root, 3, 1)).toBe('0');
    expect(cellText(root, 3, 2)).toBe('0');
    expect(expectedHint(root)).toMatchObject({ kind: 'fill', row: 2, col: 2, value: 1, rule: 'pair' });

    pressHint(root);

    expect(cellText(root, 3, 3)).toBe('1');
    expect(cellText(root, 2, 2)).toBe('');
    // nothing sits at the unconverted position either (a 0-based page would have written data-row 2, data-col 2)
    expect(texts(root).filter((t) => t !== '')).toHaveLength(3);
    // FR-59: the marker is on the one-based cell, not on the unconverted position
    expect(cellEl(root, 3, 3).classList.contains('cell-hinted')).toBe(true);
    expect(cellEl(root, 2, 2).classList.contains('cell-hinted')).toBe(false);
    expect(hintedCells(root)).toEqual([[3, 3]]);
  });

  it('Count rule fills only one cell, the first empty one of the line', () => {
    const root = mountFixture(COUNT_ROW);
    // premise: row 5 reads 0 1 0 . . 0, nothing breaks a rule, the engine targets (5,4) through the count rule
    expect([1, 2, 3, 4, 5, 6].map((c) => cellText(root, 5, c))).toEqual(['0', '1', '0', '', '', '0']);
    const h = expectedHint(root);
    expect(h).toMatchObject({ kind: 'fill', rule: 'count', row: 4, col: 3, value: 1 });
    const before = texts(root);

    pressHint(root);

    expect(cellText(root, 5, 4)).toBe('1');
    expect(cellText(root, 5, 5)).toBe('');
    expect(texts(root).flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([4 * 6 + 3]);
    // FR-59: only that cell carries the marker, not the other empty cells of the line
    expect(hintedCells(root)).toEqual([[5, 4]]);
    expect(cellEl(root, 5, 5).classList.contains('cell-hinted')).toBe(false);
  });

  it('Hint-filled cell stays editable: a hint-filled 1 follows the player cycle (1, empty, 0)', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root);
    expect(cellText(root, 3, 3)).toBe('1');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 3, 3).classList.contains('cell-given')).toBe(false);

    clickCell(root, 3, 3);
    expect(cellText(root, 3, 3)).toBe('');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');
    clickCell(root, 3, 3);
    expect(cellText(root, 3, 3)).toBe('0');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');
  });

  it('Hint-filled cell stays editable (FR-59): the click removes cell-hinted, the cell is the hinted one before it', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root);
    expect(cellEl(root, 3, 3).classList.contains('cell-hinted')).toBe(true);

    clickCell(root, 3, 3);

    expect(cellText(root, 3, 3)).toBe('');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 3, 3).classList.contains('cell-hinted')).toBe(false);
    expect(hintedCells(root)).toEqual([]);
  });

  it('No fill when the engine has no target: kind none', () => {
    const root = mountFixture(ISOLATED);
    expectPageStructure(root);
    expect(expectedHint(root).kind).toBe('none');
    const before = snapshot(root);
    expect(texts(root).filter((t) => t !== '')).toHaveLength(2);

    pressHint(root);

    expect(snapshot(root)).toEqual(before);
    expect(hintedCells(root)).toEqual([]); // FR-59: no target, no marker
  });

  it('No fill when the engine has no target: kind broken', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3); // 0 0 0 in row 3
    expect(expectedHint(root).kind).toBe('broken');
    const before = texts(root);
    expect(before.filter((t) => t !== '')).toHaveLength(3);

    pressHint(root);

    expect(texts(root)).toEqual(before);
    expect(hintedCells(root)).toEqual([]); // FR-59: no target, no marker
  });
});

describe('@trace FR-40 the hint button shows the engine sentence', () => {
  it('Sentence shown with a fill: equals the engine sentence, unaltered', () => {
    const root = mountFixture(PAIR_ROW);
    const h = expectedHint(root);
    expect(h.sentence).toBe('Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.');

    pressHint(root);

    expect(hintMessage(root)).toBe(h.sentence);
    expect(hintMessage(root)).toBe('Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.');
  });

  it('Board breaks a rule: shows the broken-board sentence and fills nothing', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3);
    expect(q(root, '.cell-violation')).not.toBeNull();
    const before = texts(root);
    const h = expectedHint(root);
    expect(h).toEqual({ kind: 'broken', sentence: BROKEN_SENTENCE });

    pressHint(root);

    expect(hintMessage(root)).toBe(h.sentence);
    expect(hintMessage(root)).toBe('Спершу виправте порушення правил, підсвічене на полі.');
    expect(texts(root)).toEqual(before);
  });

  it('No rule applies: shows the no-rule sentence and fills nothing', () => {
    const root = mountFixture(ISOLATED);
    expectPageStructure(root);
    expect(root.querySelector('.cell-violation')).toBeNull();
    const before = texts(root);
    const h = expectedHint(root);
    expect(h).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });

    pressHint(root);

    expect(hintMessage(root)).toBe(h.sentence);
    expect(hintMessage(root)).toBe('Жодне з трьох правил зараз не підказує наступного ходу.');
    expect(texts(root)).toEqual(before);
  });

  it('Second press replaces the sentence, it does not append', () => {
    const root = mountFixture(TWO_PAIRS);
    const first = expectedHint(root);
    pressHint(root);
    expect(hintMessage(root)).toBe(first.sentence);

    const second = expectedHint(root);
    expect(second.kind).toBe('fill');
    expect(second.sentence).not.toBe(first.sentence);
    expect(second.sentence).toBe('Дві одиниці поспіль у рядку 5, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.');

    pressHint(root);

    expect(hintMessage(root)).toBe(second.sentence);
    expect(hintMessage(root)).not.toContain(first.sentence);
  });

  it('Initial state has no hint message (and the region exists)', () => {
    const root = mountFixture(PAIR_ROW);
    expectPageStructure(root);
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
    // nothing but the board has been filled
    expect(readBoard(root).flat().filter((c) => c !== null)).toHaveLength(2);
  });
});

describe('@trace FR-40 the hint message stays until the next hint or a new puzzle', () => {
  it('Clicking a player cell keeps the hint message (once, then twice more)', () => {
    const root = mountFixture(TWO_PAIRS);
    pressHint(root);
    const sentence = hintMessage(root);
    expect(sentence).not.toBe('');

    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('0');
    expect(hintMessage(root)).toBe(sentence);
    clickCell(root, 1, 1);
    expect(hintMessage(root)).toBe(sentence);
    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('');
    expect(hintMessage(root)).toBe(sentence);
  });

  it('The next hint replaces it and a new puzzle clears it', () => {
    const root = mountFixture(TWO_PAIRS);
    pressHint(root);
    const first = hintMessage(root);
    expect(first).not.toBe('');
    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('0');
    expect(hintMessage(root)).toBe(first);

    const expected = expectedHint(root);
    pressHint(root);
    expect(hintMessage(root)).toBe(expected.sentence);
    expect(hintMessage(root)).not.toBe('');

    pressNew(root);
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
  });
});

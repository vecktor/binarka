// Play page: cells are buttons (FR-69) with Ukrainian labels (FR-70). Scenarios of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Cells are buttons", "Cell labels"). Written FIRST (red):
// the cells are still div elements without aria-label.
// jsdom does not turn Enter or Space into a click and has no focus ring: FR-69 is covered by the element type and attributes;
// real keyboard behaviour and focus are the held NFR-13 (docs/requirements-held.md), not claimed here.
// Coordinates are 1-based (data-row / data-col). Label texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  HINT_BREAKS,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  TWO_PAIRS,
  allCells,
  cellEl,
  cellLabel,
  cellText,
  checkerCells,
  clickCell,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  expectedHint,
  generateSpy,
  generatorBySize,
  givensOf,
  hasPlayerEntries,
  hintedCells,
  installPageLifecycle,
  isGivenCell,
  makePuzzle,
  mountFixture,
  mountPage,
  mountPlayedBoard,
  pressHint,
  pressNew,
  q,
  readBoard,
  resetBoard,
  seedQueue,
  selectSize,
  sizeButtons,
  startNewPuzzle,
  violationCells,
} from './helpers/play-page';
import type { Puzzle } from '../src/engine/index';

installPageLifecycle();

/**
 * The label the cell at (row, col) must have, computed from what the page shows (text, data-given, the class cell-hinted):
 * «Рядок R, стовпець C, V» + «, задано» for a given + «, підказка» for the cell the last hint filled. A violation adds nothing.
 */
function expectedLabel(root: ParentNode, row: number, col: number): string {
  const el = cellEl(root, row, col);
  const text = el.textContent;
  const value = text === '' ? 'порожньо' : text;
  const given = el.getAttribute('data-given') === 'true';
  const hinted = el.classList.contains('cell-hinted');
  return `Рядок ${row}, стовпець ${col}, ${value}${given ? ', задано' : ''}${hinted ? ', підказка' : ''}`;
}

/** Every cell's aria-label equals the label its visible state calls for. */
function expectAllLabels(root: ParentNode, where: string): void {
  const n = Math.sqrt(allCells(root).length);
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) expect(cellLabel(root, r, c), `${where}: label of cell ${r},${c}`).toBe(expectedLabel(root, r, c));
  }
}

const FIXTURES: { n: number; puzzle: Puzzle }[] = [
  { n: 4, puzzle: PAIR_4 },
  { n: 6, puzzle: PAIR_ROW },
  { n: 8, puzzle: PAIR_8 },
];

/** Mount at 6 and, for N != 6, press the size button (the injected generator returns the fixture for N). */
function mountAtSize(puzzle: Puzzle): HTMLElement {
  const root = mountPage({
    seedSource: seedQueue([1, 2]).source,
    generate: generatorBySize({ 6: PAIR_ROW, [puzzle.size]: puzzle }),
  });
  if (puzzle.size !== 6) selectSize(root, puzzle.size);
  return root;
}

describe.each(FIXTURES)('@trace FR-69 every cell is a native button at size $n', ({ n, puzzle }) => {
  it(`Every cell is a native button: ${n}x${n} cells, type=button, no negative tabindex, in reading order from (1,1) to (${n},${n})`, () => {
    const root = mountAtSize(puzzle);
    const cells = allCells(root);
    expect(cells).toHaveLength(n * n);
    expect(cells.some((c) => c.getAttribute('data-given') === 'true'), 'premise: the fixture has a given').toBe(true);
    for (const cell of cells) {
      const where = `${cell.getAttribute('data-row')},${cell.getAttribute('data-col')}`;
      expect(cell.tagName, `cell ${where} is a button element`).toBe('BUTTON');
      expect(cell.getAttribute('type'), `cell ${where} has type=button`).toBe('button');
      const tabindex = cell.getAttribute('tabindex');
      expect(tabindex === null || Number(tabindex) >= 0, `cell ${where}: tabindex ${tabindex} is not negative`).toBe(true);
    }
    const pairs = cells.map((c) => [Number(c.getAttribute('data-row')), Number(c.getAttribute('data-col'))]);
    const expected: number[][] = [];
    for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) expected.push([r, c]);
    expect(pairs, 'document order is row by row, left to right').toEqual(expected);
  });

  it(`Labels use the size of the board: the last cell (${n},${n}) reads «Рядок ${n}, стовпець ${n}, порожньо»`, () => {
    // a blank fixture of the size: the last cell is an empty non-given cell (PAIR_8 has a given at (8,8))
    const root = mountAtSize(n === 4 ? BLANK_4 : n === 6 ? BLANK : BLANK_8);
    expect(puzzle.size, 'premise: the row of the table and the fixture agree').toBe(n);
    expect(isGivenCell(root, n, n), 'premise: the last cell is a non-given cell').toBe(false);
    expect(cellText(root, n, n), 'premise: it is empty').toBe('');
    expect(cellLabel(root, n, n)).toBe(`Рядок ${n}, стовпець ${n}, порожньо`);
    expectAllLabels(root, `size ${n}`);
  });
});

describe('@trace FR-69 givens are aria-disabled, not disabled', () => {
  it('Givens are aria-disabled, not disabled: every given has aria-disabled="true" and no disabled; every non-given has neither', () => {
    const root = mountFixture(TWO_PAIRS);
    const givens = allCells(root).filter((c) => c.getAttribute('data-given') === 'true');
    const open = allCells(root).filter((c) => c.getAttribute('data-given') === 'false');
    expect(givens).toHaveLength(4);
    expect(open).toHaveLength(32);
    for (const cell of givens) {
      expect(cell.getAttribute('aria-disabled'), 'a given has aria-disabled="true"').toBe('true');
      expect(cell.hasAttribute('disabled'), 'a given is not disabled (it stays focusable and readable)').toBe(false);
    }
    for (const cell of open) {
      expect(cell.getAttribute('aria-disabled'), 'a non-given has no aria-disabled="true"').not.toBe('true');
      expect(cell.hasAttribute('disabled'), 'a non-given is not disabled').toBe(false);
    }
  });

  it('a click on a given still changes nothing (FR-33) and the given keeps aria-disabled', () => {
    const root = mountFixture(PAIR_ROW);
    const el = cellEl(root, 3, 1);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    clickCell(root, 3, 1, 3);
    expect(cellText(root, 3, 1)).toBe('0');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('a hint-filled or player-filled cell never gets aria-disabled', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellEl(root, 3, 1).getAttribute('aria-disabled'), 'premise: a given of this fixture is aria-disabled').toBe('true');
    pressHint(root);
    clickCell(root, 1, 1);
    for (const [r, c] of [[3, 3], [1, 1]] as const) {
      expect(cellText(root, r, c), `premise: ${r},${c} holds a digit`).not.toBe('');
      expect(cellEl(root, r, c).getAttribute('aria-disabled')).not.toBe('true');
      expect(cellEl(root, r, c).hasAttribute('disabled')).toBe(false);
    }
  });
});

describe('@trace FR-69 the controls are in the tab order', () => {
  it('The controls are in the tab order: the three size buttons, hint, reset, new and rules are buttons, not disabled, with no negative tabindex', () => {
    const root = mountFixture(PAIR_ROW);
    const controls = [
      ...sizeButtons(root),
      q(root, '[data-action="hint"]'),
      q(root, '[data-action="reset"]'),
      q(root, '[data-action="new"]'),
      q(root, '[data-action="rules"]'),
    ];
    expect(controls).toHaveLength(7);
    for (const control of controls) {
      const name = control.textContent;
      expect(control.tagName, `${name} is a button element`).toBe('BUTTON');
      expect(control.hasAttribute('disabled'), `${name} is not disabled`).toBe(false);
      const tabindex = control.getAttribute('tabindex');
      expect(tabindex === null || Number(tabindex) >= 0, `${name}: tabindex ${tabindex} is not negative`).toBe(true);
    }
  });

  it('no cell, size button, action button or rules button has a negative tabindex after play either (a hint, a click, a new board)', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root);
    clickCell(root, 1, 1);
    for (const el of [...allCells(root), ...sizeButtons(root), q(root, '[data-action="rules"]')]) {
      const tabindex = el.getAttribute('tabindex');
      expect(tabindex === null || Number(tabindex) >= 0).toBe(true);
    }
  });
});

describe('@trace FR-70 the four label forms', () => {
  // Givens 1 at (1,4), 0 at (5,3), 1 at (5,4), 1 at (5,5): the first hint is the pair rule, row 5, column 6, value 0.
  const FOUR_FORMS = makePuzzle(givensOf(6, [[1, 4, 1], [5, 3, 0], [5, 4, 1], [5, 5, 1]]), { inconsistent: true });

  it('The four label forms: empty, digit, given, hint-filled', () => {
    const root = mountFixture(FOUR_FORMS);
    expect(expectedHint(root), 'premise: the hint engine returns row 5, column 6, value 0 (0-based row 4, col 5)').toMatchObject({
      kind: 'fill',
      row: 4,
      col: 5,
      value: 0,
      rule: 'pair',
    });
    expect(cellLabel(root, 3, 2), 'empty').toBe('Рядок 3, стовпець 2, порожньо');

    clickCell(root, 3, 2);
    expect(cellLabel(root, 3, 2), 'after one click: a zero').toBe('Рядок 3, стовпець 2, 0');
    expect(expectedHint(root), 'premise: the click did not move the hint target').toMatchObject({ kind: 'fill', row: 4, col: 5, value: 0 });

    pressHint(root);

    expect(cellText(root, 5, 6), 'premise: the hint filled (5,6) with 0').toBe('0');
    expect(hintedCells(root)).toEqual([[5, 6]]);
    expect(cellLabel(root, 1, 4), 'a given 1').toBe('Рядок 1, стовпець 4, 1, задано');
    expect(cellLabel(root, 5, 3), 'a given 0').toBe('Рядок 5, стовпець 3, 0, задано');
    expect(cellLabel(root, 5, 6), 'the hint-filled cell').toBe('Рядок 5, стовпець 6, 0, підказка');
    expect(cellLabel(root, 3, 2), 'the clicked cell: the click came before the hint, the digit stays, no suffix').toBe('Рядок 3, стовпець 2, 0');
  });

  it('a label has no Latin letters at any state (NFR-5)', () => {
    const root = mountFixture(FOUR_FORMS);
    clickCell(root, 3, 2, 2);
    pressHint(root);
    for (const cell of allCells(root)) {
      const label = cell.getAttribute('aria-label') ?? '';
      expect(label, 'every cell has a label').not.toBe('');
      expect(/[A-Za-z]/.test(label), `"${label}" has no Latin letters`).toBe(false);
      expect(/\p{Script=Cyrillic}/u.test(label), `"${label}" has Cyrillic letters`).toBe(true);
    }
  });
});

describe('@trace FR-70 labels follow every change of the cell', () => {
  it('Labels follow every change of the cell: three clicks give 0, 1, порожньо with the same R and C', () => {
    const root = mountFixture(PAIR_ROW);
    expect(isGivenCell(root, 2, 5)).toBe(false);
    expect(cellLabel(root, 2, 5)).toBe('Рядок 2, стовпець 5, порожньо');
    clickCell(root, 2, 5);
    expect(cellLabel(root, 2, 5)).toBe('Рядок 2, стовпець 5, 0');
    clickCell(root, 2, 5);
    expect(cellLabel(root, 2, 5)).toBe('Рядок 2, стовпець 5, 1');
    clickCell(root, 2, 5);
    expect(cellLabel(root, 2, 5)).toBe('Рядок 2, стовпець 5, порожньо');
  });

  it('a hint adds «, підказка», and a click on that cell removes the suffix and moves the digit on in the cycle', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root); // fills (3,3) with 1
    expect(hintedCells(root)).toEqual([[3, 3]]);
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, 1, підказка');

    clickCell(root, 3, 3);

    expect(cellText(root, 3, 3)).toBe('');
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, порожньо');
    expectAllLabels(root, 'after the click');
  });

  it('a second hint moves the suffix: the old cell loses «, підказка» and keeps its digit, the new cell gains it', () => {
    const root = mountFixture(TWO_PAIRS);
    pressHint(root);
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, 1, підказка');

    pressHint(root);

    const [next] = hintedCells(root);
    expect.assert(next !== undefined, 'premise: the second hint marked another cell');
    expect(next).not.toEqual([3, 3]);
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, 1');
    expect(cellLabel(root, next[0], next[1])).toMatch(/, підказка$/);
    expectAllLabels(root, 'after the second hint');
  });

  it('after «Скинути» (confirmed when entries exist) every non-given cell reads «…, порожньо» and every given keeps «, задано»', () => {
    const root = mountFixture(TWO_PAIRS);
    pressHint(root);
    clickCell(root, 1, 1, 2);
    expect(hasPlayerEntries(root), 'premise: the board has entries').toBe(true);

    resetBoard(root);

    expect(hasPlayerEntries(root)).toBe(false);
    for (const cell of allCells(root)) {
      const row = Number(cell.getAttribute('data-row'));
      const col = Number(cell.getAttribute('data-col'));
      if (cell.getAttribute('data-given') === 'true') expect(cellLabel(root, row, col)).toMatch(/^Рядок \d+, стовпець \d+, [01], задано$/);
      else expect(cellLabel(root, row, col)).toBe(`Рядок ${row}, стовпець ${col}, порожньо`);
    }
    expectAllLabels(root, 'after reset');
  });

  it('after a new puzzle (confirmed when entries exist) the labels describe the new board', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy((i) => (i === 0 ? PAIR_ROW : TWO_PAIRS)).generate });
    pressHint(root);
    expect(cellLabel(root, 3, 3)).toMatch(/, підказка$/);

    startNewPuzzle(root);

    expect(readBoard(root)).toEqual(TWO_PAIRS.givens);
    expect(cellLabel(root, 5, 4)).toBe('Рядок 5, стовпець 4, 1, задано');
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, порожньо');
    expectAllLabels(root, 'after a new puzzle');
  });

  it('after a size change (confirmed when entries exist) the labels describe the new board, with the new N in the last cell', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2, 3]).source,
      generate: generatorBySize({ 6: PAIR_ROW, 4: PAIR_4, 8: BLANK_8 }),
    });
    pressHint(root);
    selectSize(root, 4);
    expect(cellLabel(root, 4, 4)).toBe('Рядок 4, стовпець 4, порожньо');
    expect(cellLabel(root, 2, 1)).toBe('Рядок 2, стовпець 1, 0, задано');
    expectAllLabels(root, 'after the change to 4');
    selectSize(root, 8);
    expect(cellLabel(root, 8, 8)).toBe('Рядок 8, стовпець 8, порожньо');
    expectAllLabels(root, 'after the change to 8');
    expect(dialogIsOpen(root)).toBe(false);
  });

  it('a cancelled confirmation changes no label', () => {
    const { root } = mountPlayedBoard();
    const labels = allCells(root).map((c) => c.getAttribute('aria-label'));
    pressNew(root);
    expect(dialogIsOpen(root)).toBe(true);
    confirmNo(root);
    expect(allCells(root).map((c) => c.getAttribute('aria-label'))).toEqual(labels);
    // and a confirmed one does
    pressNew(root);
    confirmYes(root);
    expect(allCells(root).map((c) => c.getAttribute('aria-label'))).not.toEqual(labels);
    expectAllLabels(root, 'after the confirmed new puzzle');
  });
});

describe('@trace FR-70 a violation adds no suffix', () => {
  it('A violation adds no suffix: three equal digits side by side in non-given cells carry cell-violation and the plain label', () => {
    const root = mountFixture(BLANK);
    clickCell(root, 2, 1);
    clickCell(root, 2, 2);
    clickCell(root, 2, 3);
    expect(violationCells(root), 'premise: the three cells are highlighted').toEqual([[2, 1], [2, 2], [2, 3]]);
    expect(violationCells(root)).toEqual(checkerCells(readBoard(root)));

    expect(cellLabel(root, 2, 1)).toBe('Рядок 2, стовпець 1, 0');
    expect(cellLabel(root, 2, 2)).toBe('Рядок 2, стовпець 2, 0');
    expect(cellLabel(root, 2, 3)).toBe('Рядок 2, стовпець 3, 0');
    expectAllLabels(root, 'with a violation');
  });

  it('a given cell that is part of a violation keeps exactly «, задано»', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3); // 0 0 0 in row 3: the givens (3,1) and (3,2) are in the violation
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(cellEl(root, 3, 1).classList.contains('cell-violation')).toBe(true);

    expect(cellLabel(root, 3, 1)).toBe('Рядок 3, стовпець 1, 0, задано');
    expect(cellLabel(root, 3, 2)).toBe('Рядок 3, стовпець 2, 0, задано');
    expect(cellLabel(root, 3, 3)).toBe('Рядок 3, стовпець 3, 0');
  });

  it('a hint-filled cell that also violates keeps «, підказка» (the FR forbids a suffix for the violation, not for the hint)', () => {
    // HINT_BREAKS: the hint fill (1,3) = 0 completes 0 0 0 in column 3. Literal reading of FR-70: the cell the hint filled appends
    // «, підказка»; being in violation adds nothing.
    const root = mountFixture(HINT_BREAKS);
    pressHint(root);
    expect(hintedCells(root)).toEqual([[1, 3]]);
    expect(cellEl(root, 1, 3).classList.contains('cell-violation'), 'premise: the hinted cell is also in violation').toBe(true);

    expect(cellLabel(root, 1, 3)).toBe('Рядок 1, стовпець 3, 0, підказка');
    expect(cellLabel(root, 2, 3), 'a given in the same violation').toBe('Рядок 2, стовпець 3, 0, задано');
    expectAllLabels(root, 'with a hinted violating cell');
  });
});

describe('@trace FR-70 the label at the board edge for every size', () => {
  it.each([[4, BLANK_4], [8, BLANK_8]] as const)('on an untouched blank %ix%i board every cell is «Рядок R, стовпець C, порожньо»', (n, puzzle) => {
    const root = mountAtSize(puzzle);
    for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) expect(cellLabel(root, r, c)).toBe(`Рядок ${r}, стовпець ${c}, порожньо`);
  });
});

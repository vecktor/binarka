// Play page: the reset button of slice 4 (FR-58) under the accessibility rules of slice 6 (FR-59, FR-61). The two slices
// were built on separate lines and merged into main on 2026-10-08, so neither line tested them together. Every assertion
// comes from a sentence of openspec/specs/play-page/spec.md that holds for any board change, a reset included:
// - "Cells expose a Ukrainian name and their state": the name "always matches the cell's text content"; `aria-invalid` is
//   on "exactly the cells that carry the class `cell-violation`"; `aria-readonly` is on every given and on no other cell.
// - "Reset button": a reset empties the player's cells and removes every highlight that does not come from the givens.
// - "The board is a single Tab stop": the Tab stop follows focus (the cell that receives DOM focus becomes the Tab stop),
//   and it goes to row 1, column 1 when a board is first shown (at mount, after the new puzzle button, after an accepted
//   size change). A reset focuses no cell and shows no new board, so neither rule moves the Tab stop.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  DIRTY_GIVENS,
  allCells,
  cellEl,
  cellName,
  expectActive,
  expectTabStop,
  focusCell,
  installPageLifecycle,
  mountFixture,
  pressKey,
  q,
  setRow,
  violationCells,
} from './helpers/play-page';

installPageLifecycle();

const pressReset = (root: ParentNode): void => { q(root, '[data-action="reset"]').click(); };

/** Every cell's name matches its text, and `aria-invalid="true"` is on exactly the cells with `cell-violation`. */
function expectNamesAndStates(root: ParentNode): void {
  for (const cell of allCells(root)) {
    const row = Number(cell.getAttribute('data-row'));
    const col = Number(cell.getAttribute('data-col'));
    expect(cell.getAttribute('aria-label'), `name of cell ${row},${col}`).toBe(cellName(row, col, cell.textContent));
    const highlighted = cell.classList.contains('cell-violation');
    expect(cell.getAttribute('aria-invalid'), `aria-invalid of cell ${row},${col}`).toBe(highlighted ? 'true' : null);
  }
}

describe('@trace FR-58 @trace FR-61 a reset keeps the accessible names and states in step with the board', () => {
  it('after a reset every cell name matches its text and no cell keeps aria-invalid once the highlights are gone', () => {
    const root = mountFixture(BLANK);
    setRow(root, 2, '0 0 0 . . .');
    expect(violationCells(root).length, 'premise: three zeros in a row are highlighted').toBeGreaterThan(0);
    expectNamesAndStates(root);

    pressReset(root);
    expect(violationCells(root), 'the reset removed the highlights').toEqual([]);
    expect(allCells(root).filter((cell) => cell.hasAttribute('aria-invalid')), 'no cell keeps aria-invalid').toEqual([]);
    expectNamesAndStates(root);
    expect(cellEl(root, 2, 1).getAttribute('aria-label')).toBe('Рядок 2, стовпець 1: порожня');
  });

  it('a reset keeps aria-invalid on cells whose highlight comes from the givens, and aria-readonly on every given', () => {
    const root = mountFixture(DIRTY_GIVENS);
    const fromGivens = violationCells(root);
    expect(fromGivens.length, 'premise: the givens themselves break a rule').toBeGreaterThan(0);
    setRow(root, 4, '1 1 1 . . .');
    const fromPlayer: [number, number][] = [[4, 1], [4, 2], [4, 3]];
    for (const [r, c] of fromPlayer) {
      expect(cellEl(root, r, c).getAttribute('aria-invalid'), `premise: the player's cell ${r},${c} is highlighted`).toBe('true');
    }

    pressReset(root);
    expect(violationCells(root), 'only the highlights from the givens stay').toEqual(fromGivens);
    for (const [r, c] of fromPlayer) {
      expect(cellEl(root, r, c).textContent, `the reset emptied cell ${r},${c}`).toBe('');
      expect(cellEl(root, r, c).hasAttribute('aria-invalid'), `cell ${r},${c} lost aria-invalid`).toBe(false);
    }
    expectNamesAndStates(root);
    for (const cell of allCells(root)) {
      const given = cell.getAttribute('data-given') === 'true';
      expect(cell.getAttribute('aria-readonly'), 'aria-readonly is on exactly the givens').toBe(given ? 'true' : null);
    }
  });
});

describe('@trace FR-58 @trace FR-59 a reset shows no new board, so the Tab stop stays where it was', () => {
  it('the Tab stop stays on the cell the player moved it to', () => {
    const root = mountFixture(BLANK);
    focusCell(root, 1, 1);
    pressKey(cellEl(root, 1, 1), 'ArrowRight');
    pressKey(cellEl(root, 1, 2), 'ArrowDown');
    expectTabStop(root, 2, 2);
    pressKey(cellEl(root, 2, 2), 'Enter');
    expect(cellEl(root, 2, 2).textContent, 'premise: Enter filled the cell').toBe('0');

    const reset = q(root, '[data-action="reset"]');
    reset.focus();
    expectActive(reset, 'premise: «Скинути» has focus before the press');
    pressReset(root);
    expectTabStop(root, 2, 2);
    expect(cellEl(root, 2, 2).textContent, 'the reset emptied the cell').toBe('');
  });
});

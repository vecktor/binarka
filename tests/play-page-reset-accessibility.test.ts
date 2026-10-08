// Play page: the reset button of slice 4 (FR-58) under the accessibility rules of FR-61. The two slices were built on
// separate lines and merged into main on 2026-10-08, so neither line tested them together. Every assertion comes from a
// sentence of openspec/specs/play-page/spec.md that holds for any board change, a reset included:
// - "Cells expose a Ukrainian name and their state": the name is the cell's FR-70 label and always matches its text content;
//   `aria-invalid` is on "exactly the cells that carry the class `cell-violation`"; `aria-disabled` is on every given and on
//   no other cell.
// - "Reset button": a reset empties the player's cells and removes every highlight that does not come from the givens. When
//   the board has player entries it first asks for confirmation (FR-67), so the tests press «Скинути» with `resetBoard`.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  DIRTY_GIVENS,
  allCells,
  cellEl,
  expectedCellLabel,
  installPageLifecycle,
  mountFixture,
  resetBoard,
  setRow,
  violationCells,
} from './helpers/play-page';

installPageLifecycle();

/** Every cell's name matches its text, and `aria-invalid="true"` is on exactly the cells with `cell-violation`. */
function expectNamesAndStates(root: ParentNode): void {
  for (const cell of allCells(root)) {
    const row = Number(cell.getAttribute('data-row'));
    const col = Number(cell.getAttribute('data-col'));
    expect(cell.getAttribute('aria-label'), `name of cell ${row},${col}`).toBe(expectedCellLabel(cell));
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

    resetBoard(root);
    expect(violationCells(root), 'the reset removed the highlights').toEqual([]);
    expect(allCells(root).filter((cell) => cell.hasAttribute('aria-invalid')), 'no cell keeps aria-invalid').toEqual([]);
    expectNamesAndStates(root);
    expect(cellEl(root, 2, 1).getAttribute('aria-label')).toBe('Рядок 2, стовпець 1, порожньо');
  });

  it('a reset keeps aria-invalid on cells whose highlight comes from the givens, and aria-disabled on every given', () => {
    const root = mountFixture(DIRTY_GIVENS);
    const fromGivens = violationCells(root);
    expect(fromGivens.length, 'premise: the givens themselves break a rule').toBeGreaterThan(0);
    setRow(root, 4, '1 1 1 . . .');
    const fromPlayer: [number, number][] = [[4, 1], [4, 2], [4, 3]];
    for (const [r, c] of fromPlayer) {
      expect(cellEl(root, r, c).getAttribute('aria-invalid'), `premise: the player's cell ${r},${c} is highlighted`).toBe('true');
    }

    resetBoard(root);
    expect(violationCells(root), 'only the highlights from the givens stay').toEqual(fromGivens);
    for (const [r, c] of fromPlayer) {
      expect(cellEl(root, r, c).textContent, `the reset emptied cell ${r},${c}`).toBe('');
      expect(cellEl(root, r, c).hasAttribute('aria-invalid'), `cell ${r},${c} lost aria-invalid`).toBe(false);
    }
    expectNamesAndStates(root);
    for (const cell of allCells(root)) {
      const given = cell.getAttribute('data-given') === 'true';
      expect(cell.getAttribute('aria-disabled'), 'aria-disabled is on exactly the givens').toBe(given ? 'true' : null);
    }
  });
});

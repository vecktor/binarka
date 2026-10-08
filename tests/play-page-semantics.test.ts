// Play page: grid roles, Ukrainian names and states, the labelled size selector, the status regions and the DOM side of
// the violation cue (FR-59, FR-60, FR-61, FR-62). Scenarios of
// openspec/changes/add-page-accessibility/specs/play-page/spec.md. Computed style comes from jsdom with
// src/ui/style.css injected (tests/helpers/css.ts); screen-reader output is not tested (A-26).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  DIRTY_GIVENS,
  PAIR_4,
  PAIR_LEFT,
  PAIR_ROW,
  WIN_4,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  cellEl,
  cellName,
  cellText,
  clickCell,
  clickUntil,
  expectActive,
  expectedHint,
  fillFrom,
  generateSpy,
  generatorBySize,
  hintMessage,
  installPageLifecycle,
  mountFixture,
  mountPage,
  ownLabelText,
  pressHint,
  pressKey,
  pressNew,
  q,
  rowEls,
  seedQueue,
  selectSize,
  setRow,
  sizeSelect,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';
import { hidingDeclarations, injectPageStyles, readStyles } from './helpers/css';

installPageLifecycle();

const CELL_NAME = /^Рядок \d+, стовпець \d+: (порожня|0|1)$/;

/** The name the page must give a cell from its position and its text: the rule of FR-59 written independently of the page. */
function expectedNames(root: HTMLElement): string[] {
  return allCells(root).map((c) =>
    cellName(Number(c.getAttribute('data-row')), Number(c.getAttribute('data-col')), c.textContent),
  );
}

function actualNames(root: HTMLElement): (string | null)[] {
  return allCells(root).map((c) => c.getAttribute('aria-label'));
}

const attributeCells = (root: HTMLElement, attribute: string): string[] =>
  allCells(root)
    .filter((c) => c.hasAttribute(attribute))
    .map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);

// ---------------------------------------------------------------------------------------------------------
// FR-59: grid, rows, cells
// ---------------------------------------------------------------------------------------------------------

describe('the board, rows and cells have grid roles', () => {
  it('@trace FR-59 Roles and name of the default board: grid «Поле 6×6», 6 rows of 6 gridcells in column order', () => {
    const root = mountFixture(BLANK);
    const board = q(root, '[data-board]');
    expect(board.getAttribute('role')).toBe('grid');
    expect(board.getAttribute('aria-label')).toBe('Поле 6×6');
    const rows = rowEls(root);
    expect(rows).toHaveLength(6);
    rows.forEach((row, i) => {
      expect(row.getAttribute('role'), `child ${i + 1} is a row`).toBe('row');
      expect(row.parentElement).toBe(board);
      const cells = Array.from(row.querySelectorAll<HTMLElement>('[data-cell]'));
      expect(cells, `row ${i + 1}`).toHaveLength(6);
      expect(cells.map((c) => c.getAttribute('data-row'))).toEqual(Array<string>(6).fill(String(i + 1)));
      expect(cells.map((c) => c.getAttribute('data-col'))).toEqual(['1', '2', '3', '4', '5', '6']);
      for (const cell of cells) {
        expect(cell.getAttribute('role')).toBe('gridcell');
        expect(cell.parentElement, 'the cell is a child of its row, not of the board').toBe(row);
      }
    });
    expect(Array.from(board.children).filter((child) => child.hasAttribute('data-cell'))).toHaveLength(0);
  });

  it('@trace FR-59 The grid name follows the size: «Поле 4×4» with 4 rows of 4, then «Поле 8×8» with 8 rows of 8 (real generator)', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source });
    for (const n of [4, 8]) {
      selectSize(root, n);
      const board = q(root, '[data-board]');
      expect(board.getAttribute('aria-label')).toBe(`Поле ${n}×${n}`);
      expect(board.getAttribute('role')).toBe('grid');
      const rows = rowEls(root);
      expect(rows).toHaveLength(n);
      for (const row of rows) {
        expect(row.getAttribute('role')).toBe('row');
        expect(row.querySelectorAll('[role="gridcell"]')).toHaveLength(n);
      }
      expect(allCells(root)).toHaveLength(n * n);
    }
  });

  it('@trace FR-59 A failed size change keeps the grid and its name «Поле 6×6»', () => {
    const root = mountFixture(BLANK); // throws for size 8
    selectSize(root, 8);
    const board = q(root, '[data-board]');
    expect(board.getAttribute('aria-label')).toBe('Поле 6×6');
    expect(board.getAttribute('role')).toBe('grid');
    expect(rowEls(root)).toHaveLength(6);
    expect(rowEls(root).every((r) => r.querySelectorAll('[data-cell]').length === 6)).toBe(true);
  });

  it('@trace FR-59 The cell contract is unchanged and no descendant of a root has an id', () => {
    // a per-size generator, so the size change below really rebuilds the board (a fixed 6x6 fixture would make it fail)
    const root = mountPage({ seedSource: () => 1, generate: generatorBySize({ 6: WIN_PUZZLE, 4: BLANK_4 }) });
    const cells = allCells(root);
    expect(cells).toHaveLength(36);
    for (const cell of cells) {
      expect(cell.hasAttribute('data-row') && cell.hasAttribute('data-col')).toBe(true);
      const given = cell.getAttribute('data-given');
      expect(['true', 'false']).toContain(given);
      expect(cell.classList.contains('cell-given')).toBe(given === 'true');
      expect(['', '0', '1']).toContain(cell.textContent);
      expect(cell.getAttribute('role')).toBe('gridcell');
    }
    expect(cells.filter((c) => c.classList.contains('cell-given'))).toHaveLength(10);
    expect(root.querySelectorAll('[id]')).toHaveLength(0);
    // after a click, a hint, a size change and a new puzzle too: no id appears later
    clickCell(root, 1, 1);
    pressHint(root);
    selectSize(root, 4);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'the size change really rebuilt the board').toBe('4');
    pressNew(root);
    expect(root.querySelectorAll('[id]')).toHaveLength(0);
  });

  it('@trace FR-59 Two mounts in one document have no duplicate id (and no id at all below the roots)', () => {
    const a = mountFixture(BLANK);
    const b = mountFixture(BLANK);
    const ids = [...a.querySelectorAll('[id]'), ...b.querySelectorAll('[id]')].map((e) => e.id);
    expect(ids).toEqual([]);
    expect(document.querySelectorAll('[id]')).toHaveLength(0);
  });

  it('@trace FR-59 @trace FR-34 The digit stays the cell text (FR-34) and the name is a separate attribute', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellText(root, 3, 1)).toBe('0'); // the digit stays the text content (FR-34), the name replaces it only for AT
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1: 0');
    expect(cellEl(root, 3, 3).textContent).toBe('');
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-59: names and states
// ---------------------------------------------------------------------------------------------------------

describe('cells expose a Ukrainian name and their state', () => {
  it('@trace FR-59 Names of a fresh board: «Рядок 2, стовпець 3: порожня», «Рядок 3, стовпець 1: 0», and every name matches the cell', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellEl(root, 2, 3).getAttribute('aria-label')).toBe('Рядок 2, стовпець 3: порожня');
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1: 0');
    expect(cellEl(root, 6, 6).getAttribute('aria-label')).toBe('Рядок 6, стовпець 6: порожня');
    expect(actualNames(root)).toEqual(expectedNames(root));
    for (const name of actualNames(root)) expect(name).toMatch(CELL_NAME);
  });

  it('@trace FR-59 The name follows a click, Enter and Space: 0, 1, порожня', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    clickCell(root, 2, 3);
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3: 0');
    pressKey(cell, 'Enter');
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3: 1');
    pressKey(cell, ' ');
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3: порожня');
    expect(cell.textContent).toBe('');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-59 The name follows a hint fill: the filled cell ends with its digit', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellEl(root, 3, 3).getAttribute('aria-label')).toBe('Рядок 3, стовпець 3: порожня');
    pressHint(root);
    expect(cellText(root, 3, 3)).toBe('1');
    expect(cellEl(root, 3, 3).getAttribute('aria-label')).toBe('Рядок 3, стовпець 3: 1');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-59 A new puzzle and a size change give fresh names (no name of the old board survives)', () => {
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : BLANK));
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1: 0');
    clickCell(root, 1, 1);
    expect(cellEl(root, 1, 1).getAttribute('aria-label')).toBe('Рядок 1, стовпець 1: 0');
    pressNew(root); // BLANK: the given at 3,1 is gone, the entry at 1,1 is gone
    expect(cellText(root, 3, 1)).toBe('');
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1: порожня');
    expect(cellEl(root, 1, 1).getAttribute('aria-label')).toBe('Рядок 1, стовпець 1: порожня');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-59 A size change gives names for the new board: 16 names «Рядок R, стовпець C: …», the given at 2,1 reads 0', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: generatorBySize({ 6: BLANK, 4: PAIR_4 }),
    });
    selectSize(root, 4);
    expect(allCells(root)).toHaveLength(16);
    expect(actualNames(root)).toEqual(expectedNames(root));
    expect(cellEl(root, 2, 1).getAttribute('aria-label')).toBe('Рядок 2, стовпець 1: 0');
    expect(cellEl(root, 4, 4).getAttribute('aria-label')).toBe('Рядок 4, стовпець 4: порожня');
  });

  it('@trace FR-59 Givens are read-only and other cells are not: aria-readonly="true" on givens only, also after a click and a hint fill', () => {
    const root = mountFixture(PAIR_ROW);
    const givens = ['3,1', '3,2'];
    expect(attributeCells(root, 'aria-readonly')).toEqual(givens);
    for (const cell of allCells(root)) {
      if (cell.getAttribute('data-given') === 'true') expect(cell.getAttribute('aria-readonly')).toBe('true');
    }
    clickCell(root, 5, 5);
    expect(attributeCells(root, 'aria-readonly')).toEqual(givens);
    pressHint(root); // fills 3,3
    expect(cellText(root, 3, 3)).toBe('1');
    expect(attributeCells(root, 'aria-readonly')).toEqual(givens);
    expect(cellEl(root, 3, 3).hasAttribute('aria-readonly')).toBe(false);
    clickCell(root, 3, 1); // a click on a given does not change it either
    expect(attributeCells(root, 'aria-readonly')).toEqual(givens);
  });

  it('@trace FR-59 @trace FR-35 A violation is exposed: three equal digits side by side give cell-violation and aria-invalid="true"', () => {
    const root = mountFixture(PAIR_LEFT);
    expect(attributeCells(root, 'aria-invalid')).toEqual([]);
    clickCell(root, 4, 1);
    expect(cellText(root, 4, 1)).toBe('0');
    expect(violationCells(root)).toEqual([[4, 1], [4, 2], [4, 3]]);
    expect(attributeCells(root, 'aria-invalid')).toEqual(['4,1', '4,2', '4,3']);
    for (const cell of allCells(root).filter((c) => c.classList.contains('cell-violation'))) {
      expect(cell.getAttribute('aria-invalid')).toBe('true');
    }
  });

  it('@trace FR-59 @trace FR-38 The invalid state is removed with the highlight, and the attribute is absent, never "false"', () => {
    const root = mountFixture(PAIR_LEFT);
    clickCell(root, 4, 1);
    expect(attributeCells(root, 'aria-invalid')).toHaveLength(3);
    clickUntil(root, 4, 1, '');
    expect(violationCells(root)).toEqual([]);
    expect(attributeCells(root, 'aria-invalid')).toEqual([]);
    expect(root.querySelectorAll('[aria-invalid="false"]')).toHaveLength(0);
  });

  it('@trace FR-59 @trace FR-36 A line with too many of one digit is invalid as a whole: all six cells of the row, nothing outside', () => {
    const root = mountFixture(BLANK);
    setRow(root, 1, '0 0 1 0 1 .'); // three 0 and two 1: no rule is broken
    expect(violationCells(root)).toEqual([]);
    expect(attributeCells(root, 'aria-invalid')).toEqual([]);
    clickCell(root, 1, 6); // the fourth 0 in the row: no three side by side, no other rule broken
    expect(cellText(root, 1, 6)).toBe('0');
    const row1 = ['1,1', '1,2', '1,3', '1,4', '1,5', '1,6'];
    expect(violationCells(root).map(([r, c]) => `${r},${c}`)).toEqual(row1);
    expect(attributeCells(root, 'aria-invalid')).toEqual(row1);
  });

  it('@trace FR-59 @trace FR-37 Violating givens are invalid at once, each also read-only (DIRTY_GIVENS)', () => {
    const root = mountFixture(DIRTY_GIVENS);
    expect(attributeCells(root, 'aria-invalid')).toEqual(['1,1', '1,2', '1,3']);
    for (const col of [1, 2, 3]) {
      const cell = cellEl(root, 1, col);
      expect(cell.getAttribute('aria-invalid')).toBe('true');
      expect(cell.getAttribute('aria-readonly')).toBe('true');
    }
    expect(attributeCells(root, 'aria-readonly')).toEqual(['1,1', '1,2', '1,3']);
  });

  it('@trace FR-62 The violation cue is also in the DOM: each of the three cells has cell-violation and aria-invalid, and no other cell has the attribute', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 3, 3);
    const three = ['3,1', '3,2', '3,3'];
    expect(violationCells(root).map(([r, c]) => `${r},${c}`)).toEqual(three);
    for (const [r, c] of [[3, 1], [3, 2], [3, 3]] as const) {
      const cell = cellEl(root, r, c);
      expect(cell.classList.contains('cell-violation')).toBe(true);
      expect(cell.getAttribute('aria-invalid')).toBe('true');
    }
    for (const cell of allCells(root)) {
      if (!cell.classList.contains('cell-violation')) expect(cell.hasAttribute('aria-invalid')).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-60: the labelled size selector
// ---------------------------------------------------------------------------------------------------------

describe('the size selector has a visible Ukrainian label', () => {
  it('@trace FR-60 The select is labelled: one wrapping label.size-label with the own text «Розмір поля»', () => {
    const root = mountFixture(BLANK);
    const select = sizeSelect(root);
    expect(select.labels).toHaveLength(1);
    const label = select.labels[0];
    expect.assert(label !== undefined, 'the select has a label');
    expect(label.tagName).toBe('LABEL');
    expect(label.classList.contains('size-label')).toBe(true);
    expect(label.contains(select)).toBe(true);
    expect(ownLabelText(label)).toBe('Розмір поля');
    expect(/\p{Script=Cyrillic}/u.test(ownLabelText(label))).toBe(true);
    expect(/[A-Za-z]/.test(ownLabelText(label))).toBe(false);
    const span = label.querySelector('.size-label-text');
    expect(span?.textContent.trim()).toBe('Розмір поля');
    // neither the label nor an ancestor inside the root is hidden
    for (let node: Element | null = label; node !== null && node !== root.parentElement; node = node.parentElement) {
      expect(node.hasAttribute('hidden'), `${node.tagName} is not hidden`).toBe(false);
      expect(node.hasAttribute('aria-hidden'), `${node.tagName} is not aria-hidden`).toBe(false);
    }
    expect(select.hasAttribute('aria-label')).toBe(false);
    expect(select.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('@trace FR-60 The label is visible: computed display and visibility of the label and its span, and no hiding declaration', () => {
    injectPageStyles();
    const root = mountFixture(BLANK);
    const label = q(root, 'label.size-label');
    const span = q(label, '.size-label-text');
    for (const el of [label, span]) {
      const style = getComputedStyle(el);
      expect(style.display, `${el.className} display`).not.toBe('none');
      expect(['hidden', 'collapse']).not.toContain(style.visibility);
    }
    const parsed = readStyles();
    expect(parsed.rules.filter((r) => r.selectors.some((s) => s.includes('size-label'))).length, 'the size-label rules exist').toBeGreaterThan(0);
    expect(hidingDeclarations(parsed)).toEqual([]);
  });

  it('@trace FR-60 Two mounts label their own selects, with no id or for anywhere below either root', () => {
    const a = mountFixture(BLANK);
    const b = mountFixture(BLANK);
    for (const root of [a, b]) {
      const label = sizeSelect(root).labels[0];
      expect.assert(label !== undefined, 'the select has a label');
      expect(root.contains(label)).toBe(true);
      expect(root.querySelectorAll('[id], [for]')).toHaveLength(0);
    }
    expect(sizeSelect(a).labels[0]).not.toBe(sizeSelect(b).labels[0]);
  });

  it('@trace FR-60 @trace FR-43 The label does not break the selector: options 4, 6, 8 with their labels, value 6 then 4, no aria-label', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    const select = sizeSelect(root);
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['4', '6', '8']);
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect(select.value).toBe('6');
    expect(select.labels).toHaveLength(1);
    selectSize(root, 4);
    expect(select.value).toBe('4');
    expect(select.labels).toHaveLength(1);
    expect(select.hasAttribute('aria-label')).toBe(false);
    expect(select.hasAttribute('aria-labelledby')).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-61: status regions
// ---------------------------------------------------------------------------------------------------------

describe('the hint and win messages are status regions', () => {
  it('@trace FR-61 Present, empty and typed at mount: role="status", no tabindex, exactly two status elements in the root', () => {
    const root = mountFixture(BLANK);
    for (const name of ['hint', 'win']) {
      const region = q(root, `[data-message="${name}"]`);
      expect(region.getAttribute('role')).toBe('status');
      expect(region.textContent).toBe('');
      expect(region.hasAttribute('tabindex')).toBe(false);
    }
    expect(root.querySelectorAll('[role="status"]')).toHaveLength(2);
  });

  it('@trace FR-61 The same two elements carry every message: hint, click, new puzzle, size change and a win', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2, 3, 4]).source,
      generate: generatorBySize({ 6: PAIR_ROW, 4: WIN_4 }),
    });
    const hintRegion = q(root, '[data-message="hint"]');
    const winRegion = q(root, '[data-message="win"]');
    const same = (what: string): void => {
      expect(q(root, '[data-message="hint"]'), `${what}: the hint region is the same element`).toBe(hintRegion);
      expect(q(root, '[data-message="win"]'), `${what}: the win region is the same element`).toBe(winRegion);
      expect(hintRegion.isConnected && winRegion.isConnected).toBe(true);
      expect(hintRegion.getAttribute('role')).toBe('status');
      expect(winRegion.getAttribute('role')).toBe('status');
      expect(root.querySelectorAll('[role="status"]')).toHaveLength(2);
      expect(hintRegion.hasAttribute('tabindex') || winRegion.hasAttribute('tabindex')).toBe(false);
    };
    same('mount');
    const sentence = expectedHint(root).sentence;
    pressHint(root);
    same('hint');
    expect(hintMessage(root)).toBe(sentence);
    clickCell(root, 5, 5);
    same('click');
    pressNew(root);
    same('new puzzle');
    expect(hintMessage(root)).toBe('');
    selectSize(root, 4);
    same('size change');
    expect(hintMessage(root)).toBe('');
    clickUntil(root, 4, 4, '1');
    same('win');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(winRegion.textContent).toBe(WIN_MESSAGE);
  });

  it('@trace FR-61 Focus never moves to a message: after a hint press and after a hint fill that wins, it stays on the hint button', () => {
    const root = mountFixture(PAIR_ROW);
    const hintButton = q(root, '[data-action="hint"]');
    hintButton.focus();
    expectActive(hintButton, 'the hint button has focus before the press');
    pressHint(root);
    expect(hintMessage(root)).not.toBe('');
    expectActive(hintButton, 'after the hint press');
    expect(document.activeElement?.getAttribute('role')).not.toBe('status');

    const win = mountFixture(WIN_PUZZLE);
    fillFrom(win, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    const button = q(win, '[data-action="hint"]');
    button.focus();
    pressHint(win); // the hint fills 4,1 with the solution digit and the board is solved
    expect(winMessage(win)).toBe(WIN_MESSAGE);
    expectActive(button, 'after the hint fill that wins');
  });

  it('@trace FR-61 A click that wins leaves the focus on the clicked cell, not on a status region', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(winMessage(root)).toBe('');
    clickUntil(root, 4, 1, '1');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expectActive(cellEl(root, 4, 1), 'after the winning click');
    expect(document.activeElement?.getAttribute('role')).not.toBe('status');
  });
});

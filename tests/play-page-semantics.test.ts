// Play page: the labelled group of cell buttons, the Ukrainian names and states, the accessible name of the size
// radiogroup, the status regions and the DOM side of the violation cue (FR-61, FR-62, FR-63, FR-64). Scenarios of
// openspec/specs/play-page/spec.md (reconcile-ux-accessibility). Computed style comes from jsdom with src/ui/style.css
// injected where a test needs it (tests/helpers/css.ts); screen-reader output is not tested (A-28).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  DIRTY_GIVENS,
  IDLE_TEXT,
  PAIR_4,
  PAIR_LEFT,
  PAIR_ROW,
  WIN_4,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  cellEl,
  cellText,
  clickCell,
  chooseLevel,
  clickUntil,
  expectActive,
  expectedCellLabel,
  expectedHint,
  fillFrom,
  focusCell,
  generateSpy,
  generatorBySize,
  hintMessage,
  installPageLifecycle,
  mountFixture,
  mountPage,
  pressHint,
  pressNew,
  pressTheme,
  settingsPanel,
  q,
  rulesPanel,
  seedQueue,
  selectSize,
  sheetOf,
  setRow,
  sizeButtons,
  sizeControl,
  solutionGrid,
  startNewPuzzle,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** The FR-70 label, with its optional suffix, written independently of the page. */
const CELL_NAME = /^Рядок \d+, стовпець \d+, (порожньо|0|1)(, задано|, підказка)?$/;

/** The name the page must give a cell: the FR-70 label built from its position, text and state (tests/helpers/play-page.ts). */
function expectedNames(root: HTMLElement): string[] {
  return allCells(root).map((c) => expectedCellLabel(c));
}

function actualNames(root: HTMLElement): (string | null)[] {
  return allCells(root).map((c) => c.getAttribute('aria-label'));
}

const attributeCells = (root: HTMLElement, attribute: string): string[] =>
  allCells(root)
    .filter((c) => c.hasAttribute(attribute))
    .map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);

/** The ids under a root: the elements that carry an `id` attribute. */
const idElements = (root: HTMLElement): Element[] => Array.from(root.querySelectorAll('[id]'));

/** Every non-whitespace text node under a root, trimmed (attribute values are not text nodes). */
function textNodesOf(root: HTMLElement): string[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = (node as Text).data.trim();
    if (text !== '') out.push(text);
  }
  return out;
}

/**
 * The five elements that may carry an id (FR-61, FR-96, FR-117): the rules panel, its heading, the setup sheet, the settings panel and
 * the element holding the confirmation text. Slice DL2 DELIBERATE CHANGE (A-41, FR-96): the sheet is the fourth id, was three.
 * add-theme-switch DELIBERATE CHANGE (A-41 amended, FR-117; autonomy-log row 120; delta «The cell contract is unchanged and only five
 * elements have ids»): the settings panel is the fifth. The order of the list is NOT pinned (autonomy-log row 124, A2: the delta does not
 * say where the settings panel sits among the other panels), so callers compare `inDocumentOrder` of both sides.
 */
function expectedIdElements(root: HTMLElement): Element[] {
  const panel = rulesPanel(root);
  const heading = panel.querySelector('h1, h2, h3, h4, h5, h6'); // the h2 «Правила»: the h3 of the techniques section follows it
  expect.assert(heading !== null, 'the rules panel has a heading');
  const dialog = q(root, '[data-dialog="confirm"]');
  const text = dialog.querySelector('[id]');
  expect.assert(text !== null, 'the confirmation dialog has an element with an id (its text)');
  return [panel, heading, sheetOf(root), settingsPanel(root), text];
}

/** The elements sorted by document order, so two lists are compared as sets. */
const inDocumentOrder = (elements: Element[]): Element[] =>
  [...elements].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1);

describe('the board is a labelled group of cell buttons', () => {
  it('@trace FR-61 Role and name of the default board: group «Поле 6×6» whose children are exactly the 36 cells in reading order, no grid, row or gridcell role', () => {
    const root = mountFixture(BLANK);
    const board = q(root, '[data-board]');
    expect(board.getAttribute('role')).toBe('group');
    expect(board.getAttribute('aria-label')).toBe('Поле 6×6');
    const children = Array.from(board.children);
    expect(children).toHaveLength(36);
    expect(children).toEqual(allCells(root));
    children.forEach((child, i) => {
      expect(child.hasAttribute('data-cell'), `child ${i + 1} is a cell`).toBe(true);
      expect(child.getAttribute('data-row'), `child ${i + 1} row`).toBe(String(Math.floor(i / 6) + 1));
      expect(child.getAttribute('data-col'), `child ${i + 1} col`).toBe(String((i % 6) + 1));
    });
    expect(root.querySelectorAll('[role="grid"], [role="row"], [role="gridcell"]')).toHaveLength(0);
    for (const cell of allCells(root)) expect(cell.hasAttribute('role'), 'a cell carries no role attribute').toBe(false);
  });

  it('@trace FR-61 The group name follows the size: «Поле 4×4» with 16 cell children, then «Поле 8×8» with 64 (real generator)', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source });
    for (const n of [4, 8]) {
      selectSize(root, n);
      const board = q(root, '[data-board]');
      expect(board.getAttribute('aria-label')).toBe(`Поле ${n}×${n}`);
      expect(board.getAttribute('role')).toBe('group');
      expect(allCells(root)).toHaveLength(n * n);
      expect(Array.from(board.children)).toEqual(allCells(root));
      expect(root.querySelectorAll('[role="grid"], [role="row"], [role="gridcell"]')).toHaveLength(0);
    }
  });

  it('@trace FR-61 A failed size change keeps the board, its name «Поле 6×6», its role and its 36 cells', () => {
    const root = mountFixture(BLANK); // throws for size 8
    selectSize(root, 8);
    const board = q(root, '[data-board]');
    expect(board.getAttribute('aria-label')).toBe('Поле 6×6');
    expect(board.getAttribute('role')).toBe('group');
    expect(allCells(root)).toHaveLength(36);
    expect(Array.from(board.children)).toEqual(allCells(root));
  });

  it('@trace FR-61 @trace FR-96 @trace FR-117 The cell contract is unchanged and exactly five elements have an id: the rules panel, its heading, the setup sheet, the settings panel and the confirmation text', () => {
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
      expect(cell.hasAttribute('role'), 'a cell carries no role attribute').toBe(false);
    }
    expect(cells.filter((c) => c.classList.contains('cell-given'))).toHaveLength(10);
    const five = inDocumentOrder(expectedIdElements(root));
    expect(inDocumentOrder(idElements(root)), 'exactly the rules panel, its heading, the setup sheet, the settings panel and the confirmation text have an id').toEqual(five);
    expect(five).toHaveLength(5);
    for (const el of five) expect(el.id, 'each id ends in the number of the mount').toMatch(/\d+$/);
    expect(root.querySelectorAll('[for]'), 'no for attribute').toHaveLength(0);
    // after a click, a hint, a level change, a size change, a theme press and a new puzzle the same five elements are the only ones with an id
    clickCell(root, 1, 1);
    pressHint(root);
    pressTheme(root, 'dark');
    chooseLevel(root, 2);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'premise: the level change kept the 6x6 board').toBe('6');
    selectSize(root, 4);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'the size change really rebuilt the board').toBe('4');
    pressNew(root);
    expect(inDocumentOrder(idElements(root))).toEqual(five);
    expect(root.querySelectorAll('[for]')).toHaveLength(0);
  });

  it('@trace FR-61 @trace FR-96 @trace FR-117 Two mounts in one document share no id: five ids each, ten different ones, and no other id in the document', () => {
    // add-theme-switch DELIBERATE CHANGE (A-41 amended, FR-117; delta «Two mounts share no id»): five ids each, ten in all (was four and eight)
    const a = mountFixture(BLANK);
    const b = mountFixture(BLANK);
    const idsA = idElements(a).map((e) => e.id);
    const idsB = idElements(b).map((e) => e.id);
    expect(idsA).toHaveLength(5);
    expect(idsB).toHaveLength(5);
    expect(new Set([...idsA, ...idsB]).size, 'the ten ids are pairwise different').toBe(10);
    expect(document.querySelectorAll('[id]'), 'the document holds exactly those ten').toHaveLength(10);
  });

  it('@trace FR-61 @trace FR-34 The digit stays the cell text (FR-34) and the name is a separate attribute', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellText(root, 3, 1)).toBe('0'); // the digit stays the text content (FR-34), the name replaces it only for AT
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1, 0, задано');
    expect(cellEl(root, 3, 3).textContent).toBe('');
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-61: names and states
// ---------------------------------------------------------------------------------------------------------

describe('cells expose a Ukrainian name and their state', () => {
  it('@trace FR-61 Names of a fresh board: «Рядок 2, стовпець 3, порожньо», «Рядок 3, стовпець 1, 0, задано», and every name is the FR-70 label of its cell', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellEl(root, 2, 3).getAttribute('aria-label')).toBe('Рядок 2, стовпець 3, порожньо');
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1, 0, задано');
    expect(cellEl(root, 6, 6).getAttribute('aria-label')).toBe('Рядок 6, стовпець 6, порожньо');
    expect(actualNames(root)).toEqual(expectedNames(root));
    for (const name of actualNames(root)) expect(name).toMatch(CELL_NAME);
  });

  it('@trace FR-61 The name follows three clicks: 0, 1, порожньо', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    clickCell(root, 2, 3);
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3, 0');
    clickCell(root, 2, 3);
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3, 1');
    clickCell(root, 2, 3);
    expect(cell.getAttribute('aria-label')).toBe('Рядок 2, стовпець 3, порожньо');
    expect(cell.textContent).toBe('');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-61 The name follows a hint fill: the filled cell ends with its digit and «, підказка»', () => {
    const root = mountFixture(PAIR_ROW);
    expect(cellEl(root, 3, 3).getAttribute('aria-label')).toBe('Рядок 3, стовпець 3, порожньо');
    pressHint(root);
    expect(cellText(root, 3, 3)).toBe('1');
    expect(cellEl(root, 3, 3).getAttribute('aria-label')).toBe('Рядок 3, стовпець 3, 1, підказка');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-61 A new puzzle and a size change give fresh names (no name of the old board survives)', () => {
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : BLANK));
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1, 0, задано');
    clickCell(root, 1, 1);
    expect(cellEl(root, 1, 1).getAttribute('aria-label')).toBe('Рядок 1, стовпець 1, 0');
    startNewPuzzle(root); // the board has an entry, so this confirms «Так, почати» (FR-67); BLANK: the given at 3,1 and the entry at 1,1 are gone
    expect(cellText(root, 3, 1)).toBe('');
    expect(cellEl(root, 3, 1).getAttribute('aria-label')).toBe('Рядок 3, стовпець 1, порожньо');
    expect(cellEl(root, 1, 1).getAttribute('aria-label')).toBe('Рядок 1, стовпець 1, порожньо');
    expect(actualNames(root)).toEqual(expectedNames(root));
  });

  it('@trace FR-61 A size change gives names for the new board: 16 FR-70 labels, the given at 2,1 reads «0, задано»', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: generatorBySize({ 6: BLANK, 4: PAIR_4 }),
    });
    clickCell(root, 1, 1); // a player entry, so the size change asks and selectSize confirms «Так, почати» (FR-67)
    selectSize(root, 4);
    expect(allCells(root)).toHaveLength(16);
    expect(actualNames(root)).toEqual(expectedNames(root));
    expect(cellEl(root, 2, 1).getAttribute('aria-label')).toBe('Рядок 2, стовпець 1, 0, задано');
    expect(cellEl(root, 4, 4).getAttribute('aria-label')).toBe('Рядок 4, стовпець 4, порожньо');
  });

  it('@trace FR-61 Givens are aria-disabled and nothing is aria-readonly: aria-disabled="true" on givens only, also after a click and a hint fill', () => {
    const root = mountFixture(PAIR_ROW);
    const givens = ['3,1', '3,2'];
    const noReadonly = (): void => {
      expect(root.querySelectorAll('[aria-readonly]'), 'no element has aria-readonly').toHaveLength(0);
    };
    expect(attributeCells(root, 'aria-disabled')).toEqual(givens);
    for (const cell of allCells(root)) {
      if (cell.getAttribute('data-given') === 'true') expect(cell.getAttribute('aria-disabled')).toBe('true');
    }
    noReadonly();
    clickCell(root, 5, 5);
    expect(attributeCells(root, 'aria-disabled')).toEqual(givens);
    pressHint(root); // fills 3,3
    expect(cellText(root, 3, 3)).toBe('1');
    expect(attributeCells(root, 'aria-disabled')).toEqual(givens);
    expect(cellEl(root, 3, 3).hasAttribute('aria-disabled')).toBe(false);
    clickCell(root, 3, 1); // a click on a given does not change it either
    expect(attributeCells(root, 'aria-disabled')).toEqual(givens);
    noReadonly();
  });

  it('@trace FR-61 @trace FR-35 A violation is exposed: three equal digits side by side give cell-violation and aria-invalid="true"', () => {
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

  it('@trace FR-61 @trace FR-38 The invalid state is removed with the highlight, and the attribute is absent, never "false"', () => {
    const root = mountFixture(PAIR_LEFT);
    clickCell(root, 4, 1);
    expect(attributeCells(root, 'aria-invalid')).toHaveLength(3);
    clickUntil(root, 4, 1, '');
    expect(violationCells(root)).toEqual([]);
    expect(attributeCells(root, 'aria-invalid')).toEqual([]);
    expect(root.querySelectorAll('[aria-invalid="false"]')).toHaveLength(0);
  });

  it('@trace FR-61 @trace FR-36 A line with too many of one digit is invalid as a whole: all six cells of the row, nothing outside', () => {
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

  it('@trace FR-61 @trace FR-37 Violating givens are invalid at once, each also aria-disabled (DIRTY_GIVENS)', () => {
    const root = mountFixture(DIRTY_GIVENS);
    expect(attributeCells(root, 'aria-invalid')).toEqual(['1,1', '1,2', '1,3']);
    for (const col of [1, 2, 3]) {
      const cell = cellEl(root, 1, col);
      expect(cell.getAttribute('aria-invalid')).toBe('true');
      expect(cell.getAttribute('aria-disabled')).toBe('true');
    }
    expect(attributeCells(root, 'aria-disabled')).toEqual(['1,1', '1,2', '1,3']);
    expect(root.querySelectorAll('[aria-readonly]')).toHaveLength(0);
  });

  it('@trace FR-64 The violation cue is also in the DOM: each of the three cells has cell-violation and aria-invalid, and no other cell has the attribute', () => {
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
// FR-62: the size radiogroup has an accessible name
// ---------------------------------------------------------------------------------------------------------

describe('the size radiogroup has an accessible name', () => {
  it('@trace FR-62 The radiogroup is named «Розмір поля» by its aria-label; no label, no select, no for, and no text node shows the name', () => {
    const root = mountFixture(BLANK);
    const group = sizeControl(root);
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Розмір поля');
    expect(group.hasAttribute('aria-labelledby')).toBe(false);
    expect(root.querySelectorAll('label'), 'no label element').toHaveLength(0);
    expect(root.querySelectorAll('select'), 'no select element').toHaveLength(0);
    expect(root.querySelectorAll('[for]'), 'no for attribute').toHaveLength(0);
    const texts = textNodesOf(root);
    expect(texts.length, 'premise: the page has text nodes').toBeGreaterThan(5);
    expect(texts, 'no text of the page shows «Розмір поля»').not.toContain('Розмір поля');
  });

  it('@trace FR-62 Each size button is named by its own text «Поле N×N», with no aria-label and no aria-labelledby', () => {
    const root = mountFixture(BLANK);
    const buttons = sizeButtons(root);
    expect(buttons.map((b) => b.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    for (const button of buttons) {
      expect(button.hasAttribute('aria-label'), `${button.textContent} has no aria-label`).toBe(false);
      expect(button.hasAttribute('aria-labelledby'), `${button.textContent} has no aria-labelledby`).toBe(false);
      expect(/\p{Script=Cyrillic}/u.test(button.textContent), `${button.textContent} has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(button.textContent), `${button.textContent} has no Latin letters`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-63: status regions
// ---------------------------------------------------------------------------------------------------------

describe('the hint and win messages are status regions', () => {
  it('@trace FR-63 Present, empty and typed at mount: role="status", no tabindex, exactly two status elements in the root', () => {
    const root = mountFixture(BLANK);
    for (const name of ['hint', 'win']) {
      const region = q(root, `[data-message="${name}"]`);
      expect(region.getAttribute('role')).toBe('status');
      expect(region.textContent).toBe('');
      expect(region.hasAttribute('tabindex')).toBe(false);
    }
    expect(root.querySelectorAll('[role="status"]')).toHaveLength(2);
  });

  it('@trace FR-63 The same two elements carry every message: hint, click, new puzzle, size change and a win', () => {
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
    startNewPuzzle(root); // the board has entries, so «Нова головоломка» asks first (FR-67)
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

  it('@trace FR-63 Focus never moves to a message: after a hint press and after a hint fill that wins, it stays on the hint button', () => {
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

  it('@trace FR-63 The idle line has no role: no role attribute, and it still holds the idle text', () => {
    const root = mountFixture(BLANK);
    const idle = q(root, '[data-message="idle"]');
    expect(idle.hasAttribute('role')).toBe(false);
    expect(idle.textContent).toBe(IDLE_TEXT);
  });

  it('@trace FR-63 @trace FR-60 A click that wins leaves the focus on the cell that had it, not on a status region', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(winMessage(root)).toBe('');
    const cell = focusCell(root, 4, 1);
    clickUntil(root, 4, 1, '1');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expectActive(cell, 'after the winning click');
    expect(document.activeElement?.getAttribute('role')).not.toBe('status');
  });
});

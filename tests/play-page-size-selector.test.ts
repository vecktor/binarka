// Play page: the size control (FR-43), a radiogroup of three buttons. Scenarios of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Grid size selector"). This file was a select-based
// test of the change add-size-selector; it is REWRITTEN (not weakened) for the segmented control and the confirmation (FR-60).
// DELETED on purpose with the behaviour the spec removes (a value outside 4, 6 and 8 has no input path any more): the group
// "a value outside the offered sizes is ignored" (three tests), and the ignored-value half of "the selector always shows the size
// of the board that is shown" (its failed-change half is kept below).
// A size button is found by its position and its text (the hook data-size-option is not in the spec); a change on a board with
// entries is asked first, so the tests press the button and then `confirmYes` (or let `selectSize` do both).
// The win message is compared with WIN_MESSAGE only (the apostrophe belongs to another change).
// NEVER enumerate the 8x8 grids (4,111,116): 8x8 fixtures carry a hand-written solution (tests/helpers/play-page.ts).
import { describe, expect, it } from 'vitest';
import { generate, hint } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  DIRTY_8_COL,
  DIRTY_8_ROW,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  bySize,
  cellEl,
  cellText,
  checkedSize,
  checkerCells,
  clickCell,
  clickUntil,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  expectPageStructure,
  fillFrom,
  generateSpy,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  mountPage,
  mountPlayedBoard,
  pageState,
  pressHint,
  pressNew,
  pressSizeButton,
  q,
  rawGenerateSpy,
  readBoard,
  seedQueue,
  selectSize,
  showModalCalls,
  sizeButton,
  sizeButtons,
  sizeControl,
  snapshot,
  solutionGrid,
  trackErrors,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** The texts of every cell of the board shown, row-major. */
function cellTexts(root: HTMLElement): string[] {
  const n = boardSize(root);
  const out: string[] = [];
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) out.push(cellText(root, r, c));
  return out;
}

/** Every (row, col) pair 1..n appears exactly once among the cells (and there are n*n cells). */
function expectCellGrid(root: HTMLElement, n: number): void {
  const cells = allCells(root);
  expect(cells).toHaveLength(n * n);
  const pairs = cells.map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);
  expect(new Set(pairs).size).toBe(n * n);
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) expect(pairs).toContain(`${r},${c}`);
}

describe('@trace FR-43 the size control is offered and 6 is selected at mount', () => {
  it('Size control structure and default: a radiogroup «Розмір поля» of three radio buttons «Поле 4×4», «Поле 6×6», «Поле 8×8»; the second is checked', () => {
    const root = mountPage({ seedSource: () => 1, generate: generatorBySize({ 6: BLANK }) });
    const control = sizeControl(root);
    expect(control.getAttribute('role')).toBe('radiogroup');
    expect(control.getAttribute('aria-label')).toBe('Розмір поля');
    const buttons = Array.from(control.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('role')).toBe('radio');
    }
    expect(buttons.map((b) => b.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(checkedSize(root)).toBe(6);
    expectPageStructure(root); // and the 6x6 board is shown
  });

  it('Size control structure and default with the real engine generator', () => {
    const root = mountPage({ seedSource: () => 1 });
    expect(sizeButtons(root).map((b) => b.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect(checkedSize(root)).toBe(6);
    expectPageStructure(root);
  });

  it('Size buttons are native buttons in the tab order, and a click on each (what Enter and Space do) selects its size', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }) });
    for (const button of sizeButtons(root)) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.hasAttribute('disabled'), 'not disabled').toBe(false);
      const tabindex = button.getAttribute('tabindex');
      expect(tabindex === null || Number(tabindex) >= 0, `no negative tabindex (${tabindex})`).toBe(true);
    }
    for (const n of [4, 8, 6]) {
      sizeButton(root, n).click();
      expect(checkedSize(root), `after a click on «Поле ${n}×${n}»`).toBe(n);
      expect(boardSize(root)).toBe(n);
    }
  });
});

describe('@trace FR-43 choosing a size starts a new puzzle of that size', () => {
  it('Choose 4x4 on a board without entries: real generator, second seed, 16 cells with data-row/data-col 1..4, givens equal generate(4, 2)', () => {
    const seeds = seedQueue([1, 2]);
    const root = mountPage({ seedSource: seeds.source });
    expectPageStructure(root);
    const expected = generate(4, 2);
    // premise: the seed matters (seed 1 would give another board), so a page that reused seed 1 fails below
    expect(generate(4, 1).givens).not.toEqual(expected.givens);
    expect(seeds.calls()).toBe(1);

    pressSizeButton(root, 4);

    expect(showModalCalls(), 'no entries: no dialog').toBe(0);
    expect(seeds.calls()).toBe(2);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('4');
    expectCellGrid(root, 4);
    let givenCount = 0;
    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 4; c++) {
        const g = expected.givens[r - 1]?.[c - 1] ?? null;
        expect(cellEl(root, r, c).getAttribute('data-given'), `given flag ${r},${c}`).toBe(g === null ? 'false' : 'true');
        expect(cellText(root, r, c), `text ${r},${c}`).toBe(g === null ? '' : String(g));
        if (g !== null) givenCount += 1;
      }
    }
    expect(givenCount).toBeGreaterThan(0);
    expect(checkedSize(root)).toBe(4);
    expect(sizeButton(root, 6).getAttribute('aria-checked')).toBe('false');
  });

  it('Choose 8x8 after play: asked first (board and aria-checked unchanged), then after «Так, почати» 64 cells, no entries, hint and marker gone, highlights only for the new givens', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, () => DIRTY_8_ROW);
    const oldCells = allCells(root);
    const before = pageState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    pressSizeButton(root, 8);

    expect(dialogIsOpen(root), 'the dialog is open').toBe(true);
    expect(pageState(root), 'nothing changed before the confirmation').toEqual(before);
    expect(checkedSize(root)).toBe(6);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    confirmYes(root);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expectCellGrid(root, 8);
    expect(oldCells.every((c) => !root.contains(c)), 'no cell of the old board remains in the page').toBe(true);
    // no player entries: a non-given cell shows empty text, the three givens show 0
    for (const el of allCells(root)) {
      if (el.getAttribute('data-given') === 'true') expect(el.textContent).toBe('0');
      else expect(el.textContent).toBe('');
    }
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(3);
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
    expect(hintedCells(root)).toEqual([]);
    // the new puzzle's givens break `three` in row 8 (premise: the expectation is not the empty set)
    expect(checkerCells(DIRTY_8_ROW.givens)).toEqual([[8, 1], [8, 2], [8, 3]]);
    expect(violationCells(root)).toEqual(checkerCells(DIRTY_8_ROW.givens));
    expect(checkedSize(root)).toBe(8);
    expect(sizeButton(root, 6).getAttribute('aria-checked')).toBe('false');
    expect(seeds.calls() - seedCalls, 'one seed for the change').toBe(1);
  });

  it('Choose 8x8 after a win: asked (a solved board has entries), then the win message is cleared and the board is 8x8 with 64 cells', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: generateSpy(bySize({ 6: WIN_PUZZLE, 8: BLANK_8 })).generate,
    });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(violationCells(root)).toEqual([]);

    pressSizeButton(root, 8);
    expect(dialogIsOpen(root), 'a solved board has entries (A-28)').toBe(true);
    expect(winMessage(root), 'unchanged until the confirmation').toBe(WIN_MESSAGE);
    expect(boardSize(root)).toBe(6);
    confirmYes(root);

    expect(q(root, '[data-message="win"]').textContent).toBe('');
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expectCellGrid(root, 8);
    expect(violationCells(root)).toEqual([]);
  });

  it('Going back to 6x6: after 8x8 (reached on an untouched board) the board is 6x6 with 36 cells and aria-checked is on 6 only', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2, 3]).source,
      generate: generateSpy(bySize({ 6: PAIR_ROW, 8: BLANK_8 })).generate,
    });

    pressSizeButton(root, 8);
    expect(boardSize(root)).toBe(8);
    expect(allCells(root)).toHaveLength(64);
    expect(checkedSize(root)).toBe(8);

    pressSizeButton(root, 6);

    expect(showModalCalls(), 'no entries on either board: no dialog').toBe(0);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expectCellGrid(root, 6);
    expect(checkedSize(root)).toBe(6);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(cellText(root, 3, 1)).toBe('0'); // the 6x6 fixture of the third generation attempt
  });

  it('aria-checked stays on the shown size until the confirmation, and after «Скасувати»', () => {
    const { root } = mountPlayedBoard();

    pressSizeButton(root, 4);
    expect(dialogIsOpen(root)).toBe(true);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'while the dialog is open').toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);

    confirmNo(root);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'after «Скасувати»').toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);
  });

  it('A change takes exactly one seed and passes the chosen size: (6, 1), (4, 2), (8, 3) and three seed-source calls', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(spy.calls).toEqual([{ size: 6, seed: 1 }]);

    pressSizeButton(root, 4);
    expect(boardSize(root)).toBe(4);
    pressSizeButton(root, 8);
    expect(boardSize(root)).toBe(8);

    expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 4, seed: 2 }, { size: 8, seed: 3 }]);
    expect(seeds.calls()).toBe(3);
  });

  it('The choice is not remembered: a new mount starts at 6 and nothing is written to localStorage or sessionStorage', () => {
    localStorage.clear();
    sessionStorage.clear();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    const first = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: BLANK_8 })).generate });
    pressSizeButton(first, 8);
    expect(boardSize(first)).toBe(8);
    expect(checkedSize(first)).toBe(8);

    const second = mountPage({ seedSource: () => 3, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });

    expect(checkedSize(second)).toBe(6);
    expect(sizeButtons(second).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(q(second, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(second)).toHaveLength(36);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('@trace FR-43 the size control always shows the size of the board that is shown (also away from 6)', () => {
  // The ignored-value half of the old test is deleted with the removed behaviour; the failed-change half is kept.
  it('at 8x8 a failed change to 4 keeps aria-checked on 8, not on the default 6', () => {
    const seeds = seedQueue([1, 2, 3, 4]);
    const spy = rawGenerateSpy((_i, size) => {
      if (size === 4) throw new Error('generator failed for size 4');
      return size === 8 ? BLANK_8 : PAIR_ROW;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    selectSize(root, 8);
    expect(boardSize(root)).toBe(8);
    expect(checkedSize(root)).toBe(8);
    const before = snapshot(root);
    expect(seeds.calls()).toBe(2); // the mount and the change to 8

    selectSize(root, 4); // the generator throws for 4: the board and the control stay at 8

    expect(boardSize(root)).toBe(8);
    expect(snapshot(root)).toEqual(before);
    expect(checkedSize(root)).toBe(8);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(seeds.calls()).toBe(3);
    pressNew(root); // the board has no entries: at once
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 8, seed: 4 });
  });
});

describe('@trace FR-43 a generator failure keeps the previous board', () => {
  it('A generator error keeps the previous board: same cells, messages, highlights, marker; aria-checked on 6; dialog closed; one seed taken', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, (size) => {
      if (size === 8) throw new Error('generator failed for size 8');
      return PAIR_ROW;
    });
    const before = pageState(root);
    const hinted = hintedCells(root);
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    const seedCalls = seeds.calls();
    const tracker = trackErrors();

    try {
      pressSizeButton(root, 8);
      confirmYes(root);
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'no uncaught error').toEqual([]);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
    expect(pageState(root)).toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(checkedSize(root)).toBe(6);
    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(seeds.calls() - seedCalls, 'one seed for the failed attempt').toBe(1);
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 8, seed: seedCalls + 1 });

    // the previous size is kept: the new puzzle button (the board still has entries: confirm) asks for size 6 again
    pressNew(root);
    confirmYes(root);
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 6, seed: seedCalls + 2 });
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
  });

  const WRONG_SIZE: Array<{ name: string; puzzle: Puzzle }> = [
    { name: 'a 6x6 fixture', puzzle: PAIR_ROW },
    { name: '8 rows with the last row 7 cells long', puzzle: { ...BLANK_8, givens: BLANK_8.givens.map((r, i) => (i === 7 ? r.slice(0, 7) : r)) } },
    { name: '8 rows with the first row 9 cells long', puzzle: { ...BLANK_8, givens: BLANK_8.givens.map((r, i) => (i === 0 ? [...r, null] : r)) } },
    { name: '7 rows of 8 cells', puzzle: { ...BLANK_8, givens: BLANK_8.givens.slice(0, 7) } },
  ];

  for (const { name, puzzle } of WRONG_SIZE) {
    it(`A generator result of the wrong size keeps the previous board (${name} for size 8)`, () => {
      const { root, seeds, spy } = mountPlayedBoard(6, (size) => (size === 8 ? puzzle : PAIR_ROW));
      const before = pageState(root);
      const seedCalls = seeds.calls();

      pressSizeButton(root, 8);
      confirmYes(root);

      expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 8, seed: seedCalls + 1 });
      expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
      expect(allCells(root)).toHaveLength(36);
      expect(pageState(root)).toEqual(before);
      expect(checkedSize(root)).toBe(6);
      expect(hintedCells(root)).toEqual([[1, 3]]);

      pressNew(root); // the previous size 6 is still the current one
      confirmYes(root);
      expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 6, seed: seedCalls + 2 });
    });
  }

  it('a failed change keeps the win message too (a solved board has entries, so the change was asked first)', () => {
    const spy = rawGenerateSpy((_i, size) => {
      if (size === 4) throw new Error('generator failed for size 4');
      return WIN_PUZZLE;
    });
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root)).toBe(WIN_MESSAGE);

    selectSize(root, 4); // presses the button, asserts the dialog opened, confirms

    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
  });
});

describe('@trace FR-43 hint and win work at the chosen size', () => {
  it('Hint at 4x4: the pair fill lands on (2,3), nothing else changes, the engine sentence is shown, the cell is marked', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 4: PAIR_4 })).generate });
    selectSize(root, 4);
    expectCellGrid(root, 4);
    const h = hint(readBoard(root));
    expect(h).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' });
    expect(cellText(root, 2, 3)).toBe('');
    const before = cellTexts(root);

    pressHint(root);

    expect(cellText(root, 2, 3)).toBe('1');
    const after = cellTexts(root);
    expect(after.flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([1 * 4 + 2]);
    expect(hintMessage(root)).toBe(h.sentence);
    expect(h.sentence).not.toBe('');
    expect(hintedCells(root)).toEqual([[2, 3]]);
  });

  it('Hint at 8x8: the pair fill lands on (8,6), nothing else changes, the engine sentence is shown, the cell is marked', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: PAIR_8 })).generate });
    selectSize(root, 8);
    expectCellGrid(root, 8);
    const h = hint(readBoard(root));
    expect(h).toMatchObject({ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' });
    expect(cellText(root, 8, 6)).toBe('');
    const before = cellTexts(root);

    pressHint(root);

    expect(cellText(root, 8, 6)).toBe('1');
    const after = cellTexts(root);
    expect(after.flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([7 * 8 + 5]);
    expect(hintMessage(root)).toBe(h.sentence);
    expect(h.sentence).not.toBe('');
    expect(hintedCells(root)).toEqual([[8, 6]]);
  });

  it('Win at 4x4: clicking the one open cell until it shows the solution digit shows the win message', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 4: WIN_4 })).generate });
    selectSize(root, 4);
    expect(boardSize(root)).toBe(4);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false')).toHaveLength(1);
    expect(cellEl(root, 4, 4).getAttribute('data-given')).toBe('false');
    expect(winMessage(root)).toBe('');

    clickCell(root, 4, 4); // 0: row 4 reads 1 0 0 0, not solved
    expect(winMessage(root)).toBe('');
    clickUntil(root, 4, 4, '1');

    expect(winMessage(root)).toBe(WIN_MESSAGE);
  });

  it('Win at 8x8: clicking the open cell (8,8) until it shows the solution digit shows the win message', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: WIN_8 })).generate });
    selectSize(root, 8);
    expect(boardSize(root)).toBe(8);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false')).toHaveLength(1);
    expect(cellEl(root, 8, 8).getAttribute('data-given')).toBe('false');
    expect(winMessage(root)).toBe('');

    clickCell(root, 8, 8, 2); // 1 is not the solution digit (0): row 8 and column 8 break, not solved
    expect(cellText(root, 8, 8)).toBe('1');
    expect(winMessage(root)).toBe('');
    clickUntil(root, 8, 8, '0');

    expect(winMessage(root)).toBe(WIN_MESSAGE);
  });
});

describe('@trace FR-43 violations in the givens of a new board show at once', () => {
  it('Violations in the givens of a new 8x8 board show at once: exactly (8,1), (8,2), (8,3)', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: DIRTY_8_ROW })).generate });
    expect(violationCells(root)).toEqual([]); // the 6x6 board is clean (premise)

    pressSizeButton(root, 8);

    expect(boardSize(root)).toBe(8);
    expect(cellText(root, 8, 1) + cellText(root, 8, 2) + cellText(root, 8, 3)).toBe('000');
    expect(violationCells(root)).toEqual([[8, 1], [8, 2], [8, 3]]);
  });

  it('A count violation in the last column of a new 8x8 board shows at once: all eight cells of column 8, none outside', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: DIRTY_8_COL })).generate });
    expect(violationCells(root)).toEqual([]);

    pressSizeButton(root, 8);

    expect(boardSize(root)).toBe(8);
    expect([1, 2, 4, 6, 7].map((r) => cellText(root, r, 8)).join('')).toBe('11111');
    expect(violationCells(root)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((r): [number, number] => [r, 8]));
    for (const el of allCells(root)) {
      expect(el.classList.contains('cell-violation'), `${el.getAttribute('data-row')},${el.getAttribute('data-col')}`).toBe(
        el.getAttribute('data-col') === '8',
      );
    }
  });
});

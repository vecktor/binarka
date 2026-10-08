// Play page: every cell is its own Tab stop, the page handles no key event on the board or its cells, and a cell keeps the
// focus after its value changes (FR-59, FR-60; FR-33 for the givens). Scenarios of
// openspec/specs/play-page/spec.md (requirements «Every cell is its own Tab stop», «Enter and Space activate a cell like a
// click», «Given cells are locked»; reconcile-ux-accessibility).
// Every key event is a bubbling, CANCELABLE event (pressKey / pressKeyEvent): a non-cancelable event can never show
// preventDefault(). jsdom does not turn Enter or Space into a click, so the activation of a cell is a click here.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  BROKEN_SENTENCE,
  ISOLATED,
  PAIR_ROW,
  WIN_PUZZLE,
  allCells,
  bySize,
  cellEl,
  cellText,
  clickCell,
  expectActive,
  expectInDocumentOrder,
  focusCell,
  generateSpy,
  hintMessage,
  installPageLifecycle,
  mountFixture,
  mountPage,
  mountThenSelect,
  pressHint,
  pressKey,
  pressKeyEvent,
  pressNew,
  q,
  resetBoard,
  seedQueue,
  sizeButton,
  sizeButtons,
  snapshot,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** Press `key` as a keydown on `target` and assert that the page did not prevent the default action. */
function pressNotPrevented(target: Element, key: string, init: KeyboardEventInit = {}): void {
  const event = pressKey(target, key, init);
  expect(event.defaultPrevented, `${JSON.stringify(key)} ${JSON.stringify(init)} is not prevented`).toBe(false);
}

/** WIN_PUZZLE with a violation (4,4)-(4,6) and the broken-board hint sentence shown: the state the scenarios describe. */
function playedBoard(): HTMLElement {
  const root = mountFixture(WIN_PUZZLE);
  clickCell(root, 4, 4); // a 0 next to the given 0 0 at (4,5), (4,6): three equal digits
  pressHint(root); // the board is broken, so the hint is the "fix the violation" sentence and fills nothing
  expect(hintMessage(root)).toBe(BROKEN_SENTENCE);
  expect(violationCells(root)).toEqual([[4, 4], [4, 5], [4, 6]]);
  return root;
}

describe('every cell is its own Tab stop and the page handles no key on the board', () => {
  it('@trace FR-59 T1 Every cell is a Tab stop in reading order: no tabindex anywhere, the cells sit between the size control and the hint button', () => {
    const root = mountFixture(BLANK);
    expect(root.hasAttribute('tabindex'), 'the root has no tabindex').toBe(false);
    expect(root.querySelectorAll('[tabindex]'), 'no element of the root has a tabindex attribute').toHaveLength(0);
    const cells = allCells(root);
    expect(cells).toHaveLength(36);
    const lastSize = sizeButtons(root).at(-1);
    expect.assert(lastSize !== undefined, 'premise: the size control has buttons');
    // the sequence of the scenario: the last size button, cell (1,1) ... cell (6,6) in reading order, the hint button
    expectInDocumentOrder([lastSize, ...cells, q(root, '[data-action="hint"]')]);
    cells.forEach((cell, i) => {
      expect(cell.getAttribute('data-row'), `cell ${i + 1} row`).toBe(String(Math.floor(i / 6) + 1));
      expect(cell.getAttribute('data-col'), `cell ${i + 1} col`).toBe(String((i % 6) + 1));
    });
  });

  it('@trace FR-59 T2 Showing a board does not move the focus: a new puzzle, a size change and a reset leave it on the pressed button', () => {
    const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4 }));
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: spy.generate });
    expect(spy.calls, 'premise: the mount asked for one board').toHaveLength(1);

    const newButton = q(root, '[data-action="new"]');
    newButton.focus();
    expectActive(newButton, 'premise: «Нова головоломка» has the focus');
    pressNew(root);
    expect(spy.calls, 'the new puzzle was performed at once (the board has no entries)').toHaveLength(2);
    expectActive(newButton, 'after a new puzzle the focus is on the button that was pressed');

    const four = sizeButton(root, 4);
    four.focus();
    expectActive(four, 'premise: «Поле 4×4» has the focus');
    four.click();
    expect(spy.calls, 'the size change was performed at once').toHaveLength(3);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'the board is now 4x4').toBe('4');
    expectActive(four, 'after a size change the focus is on the button that was pressed');

    const reset = q(root, '[data-action="reset"]');
    reset.focus();
    expectActive(reset, 'premise: «Скинути» has the focus');
    resetBoard(root); // untouched board: performed at once, asserts that no dialog opened
    expect(spy.calls, 'a reset calls no generator').toHaveLength(3);
    expectActive(reset, 'after a reset the focus is on the button that was pressed');
  });

  it('@trace FR-59 T3 A hint leaves the focus on the hint button, with a fill (PAIR_ROW) and without (ISOLATED)', () => {
    const filling = mountFixture(PAIR_ROW);
    const hintButton = q(filling, '[data-action="hint"]');
    hintButton.focus();
    expectActive(hintButton, 'premise: the hint button has the focus');
    pressHint(filling);
    expect(cellText(filling, 3, 3), 'premise: the hint filled cell 3,3 with 1').toBe('1');
    expectActive(hintButton, 'after a hint that fills a cell');

    const empty = mountFixture(ISOLATED);
    const emptyHintButton = q(empty, '[data-action="hint"]');
    emptyHintButton.focus();
    expectActive(emptyHintButton, 'premise: the hint button has the focus');
    const before = snapshot(empty);
    pressHint(empty);
    expect(hintMessage(empty), 'premise: a sentence is shown').not.toBe('');
    expect(snapshot(empty), 'premise: the hint filled nothing').toEqual(before);
    expectActive(emptyHintButton, 'after a hint that fills nothing');
  });

  it('@trace FR-59 T4 Mounting the page does not move DOM focus', () => {
    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.append(outside);
    try {
      outside.focus();
      expect(document.activeElement).toBe(outside);
      mountFixture(BLANK);
      expect(document.activeElement, 'the mount left the focus where it was').toBe(outside);
    } finally {
      outside.remove();
    }
  });

  it('@trace FR-59 T5 Arrow, Home and End keys are not handled: not prevented, the focus stays on the cell, no cell changes (N = 4, 6, 8)', () => {
    for (const [puzzle, n] of [[BLANK_4, 4], [BLANK, 6], [BLANK_8, 8]] as const) {
      const root = mountThenSelect(puzzle);
      expect(allCells(root), `premise: a ${n}x${n} board`).toHaveLength(n * n);
      const cell = focusCell(root, 2, 2);
      expect(cell.getAttribute('data-given'), 'premise: cell 2,2 is not a given').toBe('false');
      const before = snapshot(root);
      const onCell: [string, KeyboardEventInit][] = [
        ['ArrowUp', {}],
        ['ArrowDown', {}],
        ['ArrowLeft', {}],
        ['ArrowRight', {}],
        ['Home', {}],
        ['End', {}],
        ['Home', { ctrlKey: true }],
        ['End', { ctrlKey: true }],
        ['ArrowRight', { shiftKey: true }],
        ['ArrowRight', { altKey: true }],
      ];
      for (const [key, init] of onCell) {
        pressNotPrevented(cell, key, init);
        expectActive(cell, `${n}x${n}: ${key} ${JSON.stringify(init)} leaves the focus on cell 2,2`);
      }
      const board = q(root, '[data-board]');
      for (const key of ['ArrowRight', 'Enter', ' ']) {
        pressNotPrevented(board, key);
        expectActive(cell, `${n}x${n}: ${JSON.stringify(key)} on the board itself leaves the focus on cell 2,2`);
      }
      expect(snapshot(root), `${n}x${n}: no cell changed its text, data-given or classes`).toEqual(before);
    }
  });

  it('@trace FR-59 @trace FR-33 T6 Keys on a given cell change nothing and move nothing (WIN_PUZZLE given 0 at 1,3)', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(cellText(root, 1, 3)).toBe('0');
    expect(cellEl(root, 1, 3).getAttribute('data-given')).toBe('true');
    const before = snapshot(root);
    const given = focusCell(root, 1, 3);
    for (const key of ['ArrowDown', 'ArrowUp', 'End', 'Home']) {
      pressNotPrevented(given, key);
      expectActive(given, `${key} on the given cell leaves the focus on it`);
      expect(snapshot(root), `${key} changed no cell`).toEqual(before);
    }
  });

  it('@trace FR-59 T7 Other keys are not prevented: Tab, Shift+Tab, PageDown, PageUp, Escape and a letter', () => {
    const root = mountFixture(BLANK);
    const cell = focusCell(root, 3, 3);
    const before = snapshot(root);
    const keys: [string, KeyboardEventInit][] = [
      ['Tab', {}],
      ['Tab', { shiftKey: true }],
      ['PageDown', {}],
      ['PageUp', {}],
      ['Escape', {}],
      ['a', {}],
    ];
    for (const [key, init] of keys) {
      pressNotPrevented(cell, key, init);
      expectActive(cell, `${key} ${JSON.stringify(init)} leaves the focus on cell 3,3`);
    }
    expect(snapshot(root), 'no key changed a cell').toEqual(before);
  });

  it('@trace FR-60 T8 A cell keeps the focus after its value changes: 0, 1, empty, the same element has the focus after each click (4x4, 6x6, 8x8)', () => {
    for (const [puzzle, n] of [[BLANK_4, 4], [BLANK, 6], [BLANK_8, 8]] as const) {
      const root = mountThenSelect(puzzle);
      expect(allCells(root), `premise: a ${n}x${n} board`).toHaveLength(n * n);
      const cell = focusCell(root, 4, 2);
      expect(cell.getAttribute('data-given'), 'premise: cell 4,2 is not a given').toBe('false');
      expect(cell.textContent, 'premise: cell 4,2 is empty').toBe('');
      for (const expected of ['0', '1', '']) {
        cell.click();
        expect(cell.textContent, `${n}x${n}: cell 4,2 after the click`).toBe(expected);
        expect(cell.isConnected, 'the cell element is still in the page').toBe(true);
        expectActive(cell, `${n}x${n}: the same cell element has the focus when it shows «${expected}»`);
      }
    }
  });

  it('@trace FR-33 @trace FR-60 T9 A click on a given changes nothing and leaves the focus on it (once, then twice more)', () => {
    const root = playedBoard();
    for (const [row, col, digit] of [[1, 3, '0'], [2, 5, '1']] as const) {
      expect(cellText(root, row, col), `premise: given ${row},${col} shows ${digit}`).toBe(digit);
      expect(cellEl(root, row, col).getAttribute('data-given')).toBe('true');
      const given = focusCell(root, row, col);
      const before = snapshot(root);
      const messages = [hintMessage(root), winMessage(root)];
      for (const clicks of [1, 2]) {
        for (let i = 0; i < clicks; i++) given.click();
        expectActive(given, `after the clicks on the given ${row},${col}`);
        expect(snapshot(root), `the given ${row},${col} and every other cell are unchanged`).toEqual(before);
        expect([hintMessage(root), winMessage(root)]).toEqual(messages);
      }
    }
  });

  it('@trace FR-60 T10 The page does not handle Enter or Space: keydown and keyup, plain, with Ctrl, Alt, Shift and repeated, are not prevented and change nothing', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(cellText(root, 4, 1), 'premise: cell 4,1 is empty').toBe('');
    expect(cellEl(root, 4, 1).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 2, 5).getAttribute('data-given'), 'premise: cell 2,5 is a given').toBe('true');
    const before = snapshot(root);
    const inits: KeyboardEventInit[] = [{}, { ctrlKey: true }, { altKey: true }, { shiftKey: true }, { repeat: true }];
    for (const [row, col] of [[4, 1], [2, 5]] as const) {
      const cell = focusCell(root, row, col);
      for (const type of ['keydown', 'keyup'] as const) {
        for (const key of ['Enter', ' ']) {
          for (const init of inits) {
            const event = pressKeyEvent(cell, type, key, init);
            const what = `${type} ${JSON.stringify(key)} ${JSON.stringify(init)} on cell ${row},${col}`;
            expect(event.defaultPrevented, `${what} is not prevented`).toBe(false);
            expect(snapshot(root), `${what} changed nothing`).toEqual(before);
            expectActive(cell, `${what} left the focus`);
          }
        }
      }
    }
  });

  it('@trace FR-33 @trace FR-60 T11 Enter and Space key events on a given cell change nothing, are not prevented, and the focus stays where it was', () => {
    const root = playedBoard();
    const other = focusCell(root, 3, 3);
    const before = snapshot(root);
    const messages = [hintMessage(root), winMessage(root)];
    const given = cellEl(root, 2, 5);
    expect(given.textContent).toBe('1');
    expect(given.getAttribute('data-given')).toBe('true');
    for (const key of ['Enter', ' ']) {
      for (const type of ['keydown', 'keyup'] as const) {
        const event = pressKeyEvent(given, type, key);
        expect(event.defaultPrevented, `${type} ${JSON.stringify(key)} on the given cell is not prevented`).toBe(false);
      }
    }
    expect(given.textContent).toBe('1');
    expect(given.getAttribute('data-given')).toBe('true');
    expect(given.classList.contains('cell-given')).toBe(true);
    expect(snapshot(root)).toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messages);
    expectActive(other, 'the focus is still on the other cell');
  });
});

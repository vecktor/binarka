// Play page: keyboard operation, the single Tab stop and the click focus (FR-59, FR-60; FR-33, FR-34 and FR-38 as MODIFIED
// by add-page-accessibility). Scenarios of openspec/changes/add-page-accessibility/specs/play-page/spec.md.
// Every key event is a bubbling, CANCELABLE keydown (pressKey): a non-cancelable event can never show preventDefault().
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  BROKEN_SENTENCE,
  ISOLATED,
  PAIR_LEFT,
  PAIR_ROW,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  cellEl,
  cellText,
  clickCell,
  clickUntil,
  expectActive,
  expectFocusOn,
  expectPageStructure,
  expectTabStop,
  fillFrom,
  focusCell,
  generatorBySize,
  hintMessage,
  installPageLifecycle,
  mountFixture,
  mountPage,
  mountThenSelect,
  pressHint,
  pressKey,
  pressNew,
  q,
  rawGenerateSpy,
  rowEls,
  seedQueue,
  selectSize,
  snapshot,
  solutionGrid,
  tabStopCells,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** The element that currently has DOM focus (asserted to be an element other than the body). */
function focused(): HTMLElement {
  const active = document.activeElement;
  expect.assert(active instanceof HTMLElement && active !== document.body, 'an element has DOM focus');
  return active;
}

/** Press `key` on `target` and assert the page prevented (or did not prevent) the default action. */
function press(target: Element, key: string, init: KeyboardEventInit = {}, prevented = true): void {
  const event = pressKey(target, key, init);
  expect(event.defaultPrevented, `${JSON.stringify(key)} ${JSON.stringify(init)} is ${prevented ? '' : 'not '}prevented`).toBe(prevented);
}

const rc = (el: Element): string => `${el.getAttribute('data-row')},${el.getAttribute('data-col')}`;

// ---------------------------------------------------------------------------------------------------------
// The board is a single Tab stop
// ---------------------------------------------------------------------------------------------------------

describe('the board is a single Tab stop', () => {
  it('@trace FR-59 Exactly one Tab stop at mount: cell 1,1 has tabindex 0, the other 35 have -1, nothing else has a tabindex', () => {
    const root = mountFixture(BLANK);
    const cells = allCells(root);
    expect(cells).toHaveLength(36);
    expect(tabStopCells(root).map(rc)).toEqual(['1,1']);
    expect(cells.filter((c) => c.getAttribute('tabindex') === '-1')).toHaveLength(35);
    expect(q(root, '[data-board]').hasAttribute('tabindex')).toBe(false);
    expect(rowEls(root).length).toBeGreaterThan(0);
    for (const row of rowEls(root)) expect(row.hasAttribute('tabindex'), 'a row has no tabindex').toBe(false);
    expect(q(root, '[data-message="hint"]').hasAttribute('tabindex')).toBe(false);
    expect(q(root, '[data-message="win"]').hasAttribute('tabindex')).toBe(false);
    for (const el of Array.from(root.querySelectorAll('[tabindex]'))) {
      expect(Number(el.getAttribute('tabindex')), 'no positive tabindex').toBeLessThanOrEqual(0);
    }
  });

  it('@trace FR-59 A new puzzle resets the Tab stop to cell 1,1 and does not move focus', () => {
    const root = mountFixture(BLANK);
    clickCell(root, 3, 4);
    expectTabStop(root, 3, 4);
    const button = q(root, '[data-action="new"]');
    button.focus();
    expectActive(button, 'DOM focus');
    pressNew(root);
    expectTabStop(root, 1, 1);
    expectActive(button, 'focus stays on the new puzzle button');
    expectPageStructure(root);
  });

  it('@trace FR-59 A size change resets the Tab stop to cell 1,1 and does not move focus', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });
    const select = q(root, '[data-control="size"]');
    select.focus();
    expectActive(select, 'DOM focus');
    selectSize(root, 8);
    expect(allCells(root)).toHaveLength(64);
    expectTabStop(root, 1, 1);
    expectActive(select, 'focus stays on the select');
    expectPageStructure(root, 8);
  });

  it('@trace FR-59 A failed size change keeps the same cell as the Tab stop', () => {
    const root = mountFixture(BLANK); // the fixture generator throws for size 8
    clickCell(root, 2, 2);
    const stop = cellEl(root, 2, 2);
    expectTabStop(root, 2, 2);
    selectSize(root, 8);
    expect(allCells(root)).toHaveLength(36);
    expect(stop.isConnected).toBe(true);
    expect(tabStopCells(root)).toEqual([stop]);
    for (const cell of allCells(root)) if (cell !== stop) expect(cell.getAttribute('tabindex')).toBe('-1');
  });

  it('@trace FR-59 A new puzzle whose generation fails keeps the previous board and its Tab stop', () => {
    const spy = rawGenerateSpy((i) => {
      if (i === 0) return BLANK;
      throw new Error('generator failed');
    });
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    clickCell(root, 5, 3);
    const stop = cellEl(root, 5, 3);
    pressNew(root);
    expect(spy.calls).toHaveLength(2);
    expect(tabStopCells(root)).toEqual([stop]);
    expect(stop.isConnected).toBe(true);
  });

  it('@trace FR-59 A hint fill leaves the Tab stop and the focus (PAIR_ROW fills 3,3 with 1)', () => {
    const root = mountFixture(PAIR_ROW);
    expectTabStop(root, 1, 1);
    const hintButton = q(root, '[data-action="hint"]');
    hintButton.focus();
    pressHint(root);
    expect(cellText(root, 3, 3)).toBe('1');
    expectTabStop(root, 1, 1);
    expectActive(hintButton, 'DOM focus');
  });

  it('@trace FR-59 A hint fill does not reset a Tab stop that is elsewhere either', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 5, 5);
    expectTabStop(root, 5, 5);
    const hintButton = q(root, '[data-action="hint"]');
    hintButton.focus();
    pressHint(root);
    expect(cellText(root, 3, 3)).toBe('1');
    expectTabStop(root, 5, 5);
    expectActive(hintButton, 'DOM focus');
  });

  it('@trace FR-59 Focus makes a cell the Tab stop (focus() with no click and no key)', () => {
    const root = mountFixture(BLANK);
    expectTabStop(root, 1, 1);
    expect(focusCell(root, 4, 2)).toBe(cellEl(root, 4, 2));
    expectTabStop(root, 4, 2);
    focusCell(root, 6, 6);
    expectTabStop(root, 6, 6);
  });

  it('@trace FR-59 A hint that fills nothing leaves the Tab stop and every cell (ISOLATED)', () => {
    const root = mountFixture(ISOLATED);
    const before = snapshot(root);
    expectTabStop(root, 1, 1);
    pressHint(root);
    expect(hintMessage(root)).not.toBe('');
    expect(snapshot(root)).toEqual(before);
    expectTabStop(root, 1, 1);
  });

  it('@trace FR-59 A hint that fills nothing leaves a Tab stop that is elsewhere, and the focus', () => {
    const root = mountFixture(ISOLATED);
    clickCell(root, 4, 4);
    const hintButton = q(root, '[data-action="hint"]');
    hintButton.focus();
    pressHint(root);
    expectTabStop(root, 4, 4);
    expectActive(hintButton, 'DOM focus');
  });

  it('@trace FR-59 Cycling a cell leaves the Tab stop (Enter on cell 1,1)', () => {
    const root = mountFixture(BLANK);
    press(cellEl(root, 1, 1), 'Enter');
    expect(cellText(root, 1, 1)).toBe('0');
    expectTabStop(root, 1, 1);
  });

  it('@trace FR-59 Enter and Space on a cell that is not the Tab stop leave the Tab stop where it is', () => {
    const root = mountFixture(BLANK);
    press(cellEl(root, 4, 4), 'Enter');
    press(cellEl(root, 4, 4), ' ');
    expect(cellText(root, 4, 4)).toBe('1');
    expectTabStop(root, 1, 1);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Arrow, Home and End keys move the focus
// ---------------------------------------------------------------------------------------------------------

describe('Arrow, Home and End keys move the focus', () => {
  it('@trace FR-59 Arrow keys move one cell: right, down, left, up from 3,3', () => {
    const root = mountFixture(BLANK);
    focusCell(root, 3, 3);
    const steps: [string, number, number][] = [
      ['ArrowRight', 3, 4],
      ['ArrowDown', 4, 4],
      ['ArrowLeft', 4, 3],
      ['ArrowUp', 3, 3],
    ];
    for (const [key, row, col] of steps) {
      press(focused(), key);
      expectFocusOn(root, row, col);
      expectTabStop(root, row, col);
    }
  });

  it('@trace FR-59 Arrow keys stop at the edges and corners, no wrapping, and are prevented', () => {
    const root = mountFixture(BLANK);
    const edges: [string, number, number][] = [
      ['ArrowUp', 1, 1],
      ['ArrowLeft', 1, 1],
      ['ArrowUp', 1, 6],
      ['ArrowRight', 1, 6],
      ['ArrowRight', 3, 6],
      ['ArrowDown', 6, 6],
      ['ArrowRight', 6, 6],
      ['ArrowDown', 6, 1],
      ['ArrowLeft', 6, 1],
      ['ArrowLeft', 3, 1],
      ['ArrowUp', 1, 3],
      ['ArrowDown', 6, 3],
    ];
    for (const [key, row, col] of edges) {
      const cell = focusCell(root, row, col);
      press(cell, key);
      expectActive(cell, `${key} at ${row},${col} does not move focus`);
      expectTabStop(root, row, col);
    }
  });

  it('@trace FR-59 The edges follow N: at 4x4 and 8x8 an arrow stops at the last row and column of that board', () => {
    for (const [puzzle, n] of [[BLANK_4, 4], [BLANK_8, 8]] as const) {
      const root = mountThenSelect(puzzle);
      const right = focusCell(root, 3, n);
      press(right, 'ArrowRight');
      expectActive(right, 'DOM focus');
      const down = focusCell(root, n, 3);
      press(down, 'ArrowDown');
      expectActive(down, 'DOM focus');
      press(down, 'ArrowRight');
      expectFocusOn(root, n, 4); // not an edge: it does move
      press(focused(), 'ArrowUp');
      expectFocusOn(root, n - 1, 4);
      expectTabStop(root, n - 1, 4);
    }
  });

  it('@trace FR-59 Home and End move within the row, and are prevented on the first and last cell too', () => {
    const root = mountFixture(BLANK);
    focusCell(root, 3, 4);
    press(focused(), 'Home');
    expectFocusOn(root, 3, 1);
    expectTabStop(root, 3, 1);
    press(focused(), 'End');
    expectFocusOn(root, 3, 6);
    expectTabStop(root, 3, 6);
    const last = cellEl(root, 3, 6);
    press(last, 'End');
    expectActive(last, 'DOM focus');
    expectTabStop(root, 3, 6);
    const first = focusCell(root, 3, 1);
    press(first, 'Home');
    expectActive(first, 'DOM focus');
    expectTabStop(root, 3, 1);
  });

  it('@trace FR-59 Home and End give the first and last column of N at 4x4 and 8x8', () => {
    for (const [puzzle, n] of [[BLANK_4, 4], [BLANK_8, 8]] as const) {
      const root = mountThenSelect(puzzle);
      focusCell(root, 2, 2);
      press(focused(), 'End');
      expectFocusOn(root, 2, n);
      press(focused(), 'Home');
      expectFocusOn(root, 2, 1);
    }
  });

  it('@trace FR-59 Ctrl+End and Ctrl+Home move to the last and first cell of the board at N = 4, 6 and 8', () => {
    for (const [puzzle, n] of [[BLANK_4, 4], [BLANK, 6], [BLANK_8, 8]] as const) {
      const root = mountThenSelect(puzzle);
      focusCell(root, 2, 3);
      press(focused(), 'End', { ctrlKey: true });
      expectFocusOn(root, n, n);
      expectTabStop(root, n, n);
      press(focused(), 'Home', { ctrlKey: true });
      expectFocusOn(root, 1, 1);
      expectTabStop(root, 1, 1);
    }
  });

  it('@trace FR-59 @trace FR-33 Keys on a given cell navigate and change nothing (WIN_PUZZLE given 0 at 1,3)', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(cellText(root, 1, 3)).toBe('0');
    expect(cellEl(root, 1, 3).getAttribute('data-given')).toBe('true');
    const before = snapshot(root);
    focusCell(root, 1, 3);
    const steps: [string, number, number][] = [
      ['ArrowDown', 2, 3],
      ['ArrowUp', 1, 3],
      ['End', 1, 6],
      ['Home', 1, 1],
    ];
    // each key is pressed on the cell that has focus; the focus is on the given cell only for the first
    for (const [key, row, col] of steps) {
      press(focused(), key);
      expectFocusOn(root, row, col);
      expect(snapshot(root)).toEqual(before);
    }
    // and the keys pressed ON the given cell (not only moved away from it)
    const given = focusCell(root, 1, 3);
    press(given, 'ArrowDown');
    expectFocusOn(root, 2, 3);
    expect(snapshot(root)).toEqual(before);
  });

  it('@trace FR-59 The position comes from the event target, not from the Tab stop', () => {
    const root = mountFixture(BLANK);
    expectTabStop(root, 1, 1);
    press(cellEl(root, 5, 2), 'ArrowRight');
    expectFocusOn(root, 5, 3);
    expectTabStop(root, 5, 3);
  });

  it('@trace FR-59 Modified keys are not handled and not prevented: Ctrl, Shift and Alt with an arrow, Alt and Shift with Home', () => {
    const root = mountFixture(BLANK);
    const cell = focusCell(root, 3, 3);
    const modified: [string, KeyboardEventInit][] = [
      ['ArrowRight', { ctrlKey: true }],
      ['ArrowRight', { shiftKey: true }],
      ['ArrowRight', { altKey: true }],
      ['Home', { altKey: true }],
      ['Home', { shiftKey: true }],
    ];
    for (const [key, init] of modified) {
      press(cell, key, init, false);
      expectActive(cell, `${key} ${JSON.stringify(init)} leaves focus`);
      expect(cell.getAttribute('tabindex')).toBe('0');
      expectTabStop(root, 3, 3);
    }
    // premise: the same keys without the modifier DO move (so "nothing moved" above is not a dead handler)
    press(cell, 'ArrowRight');
    expectFocusOn(root, 3, 4);
  });

  it('@trace FR-59 Keys the board does not handle are not prevented: Tab, Shift+Tab, PageDown, PageUp, Escape and letters', () => {
    const root = mountFixture(BLANK);
    const cell = focusCell(root, 3, 3);
    const unhandled: [string, KeyboardEventInit][] = [
      ['Tab', {}],
      ['Tab', { shiftKey: true }],
      ['PageDown', {}],
      ['PageUp', {}],
      ['Escape', {}],
      ['a', {}],
    ];
    for (const [key, init] of unhandled) {
      press(cell, key, init, false);
      expectActive(cell, 'DOM focus');
      expectTabStop(root, 3, 3);
    }
    expect(cellText(root, 3, 3)).toBe('');
    // premise: the handler is alive, an arrow on the same cell is prevented
    press(cell, 'ArrowDown');
  });

  it('@trace FR-59 A keydown whose target is not inside a cell is ignored and not prevented (the board, a row)', () => {
    const root = mountFixture(BLANK);
    const before = snapshot(root);
    press(q(root, '[data-board]'), 'ArrowRight', {}, false);
    press(q(root, '[data-board]'), 'Enter', {}, false);
    for (const row of rowEls(root)) press(row, ' ', {}, false);
    expect(snapshot(root)).toEqual(before);
    expectTabStop(root, 1, 1);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Enter and Space cycle the focused cell and a click moves the Tab stop
// ---------------------------------------------------------------------------------------------------------

describe('Enter and Space cycle a cell, a click moves the Tab stop and the focus', () => {
  it('@trace FR-60 @trace FR-34 Enter cycles a player cell: 0, 1, empty, each press prevented', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    for (const expected of ['0', '1', '']) {
      press(cell, 'Enter');
      expect(cell.textContent).toBe(expected);
    }
  });

  it('@trace FR-60 @trace FR-34 Space cycles a player cell: 0, 1, empty, each press prevented', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    for (const expected of ['0', '1', '']) {
      press(cell, ' ');
      expect(cell.textContent).toBe(expected);
    }
  });

  it('@trace FR-60 A held key cycles once: the first Enter gives 0 and three repeats change nothing, all prevented', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    press(cell, 'Enter', { repeat: false });
    for (let i = 0; i < 3; i++) press(cell, 'Enter', { repeat: true });
    expect(cell.textContent).toBe('0');
    // a held Space as well
    const other = cellEl(root, 4, 4);
    press(other, ' ');
    press(other, ' ', { repeat: true });
    expect(other.textContent).toBe('0');
  });

  it('@trace FR-60 Modified Enter and Space are not handled and not prevented: Ctrl, Alt and Shift', () => {
    const root = mountFixture(BLANK);
    const cell = cellEl(root, 2, 3);
    press(cell, 'Enter', { ctrlKey: true }, false);
    press(cell, 'Enter', { altKey: true }, false);
    press(cell, 'Enter', { shiftKey: true }, false);
    press(cell, ' ', { ctrlKey: true }, false);
    press(cell, ' ', { altKey: true }, false);
    press(cell, ' ', { shiftKey: true }, false);
    expect(cell.textContent).toBe('');
    // premise: a plain Enter does cycle
    press(cell, 'Enter');
    expect(cell.textContent).toBe('0');
  });

  it('@trace FR-60 A click moves the Tab stop and the focus to a player cell, and cycles it', () => {
    const root = mountFixture(BLANK);
    expectTabStop(root, 1, 1);
    clickCell(root, 4, 2);
    expect(cellText(root, 4, 2)).toBe('0');
    expectTabStop(root, 4, 2);
    expectFocusOn(root, 4, 2);
  });

  it('@trace FR-60 Enter and Space do not move the focus', () => {
    const root = mountFixture(BLANK);
    focusCell(root, 2, 2);
    press(cellEl(root, 5, 5), 'Enter');
    expect(cellText(root, 5, 5)).toBe('0');
    press(cellEl(root, 5, 5), ' ');
    expect(cellText(root, 5, 5)).toBe('1');
    expectFocusOn(root, 2, 2);
    expectTabStop(root, 2, 2);
  });

  it('@trace FR-60 Keyboard play reaches the win message, and the focus is never moved by the presses', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(winMessage(root)).toBe('');
    expect(cellText(root, 4, 1)).toBe('');
    const cell = cellEl(root, 4, 1);
    press(cell, 'Enter');
    expect(winMessage(root), 'a 0 is not the solution digit').toBe('');
    press(cell, 'Enter');
    expect(cellText(root, 4, 1)).toBe('1');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    // one more press takes the solution away again, and the message goes with it
    press(cell, ' ');
    expect(winMessage(root)).toBe('');
  });

  it('@trace FR-60 Three equal digits made with Enter carry cell-violation exactly as with clicks', () => {
    const viaKeys = mountFixture(PAIR_ROW);
    const viaClicks = mountFixture(PAIR_ROW);
    press(cellEl(viaKeys, 3, 3), 'Enter');
    clickCell(viaClicks, 3, 3);
    expect(violationCells(viaKeys)).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(violationCells(viaKeys)).toEqual(violationCells(viaClicks));
  });

  it('@trace FR-60 Keys and clicks give the same board step by step: texts, givens, classes, names, aria-invalid and messages', () => {
    const keys = mountFixture(WIN_PUZZLE);
    const clicks = mountFixture(WIN_PUZZLE);
    const observe = (root: HTMLElement): unknown => ({
      cells: snapshot(root),
      names: allCells(root).map((c) => c.getAttribute('aria-label')),
      invalid: allCells(root).map((c) => c.hasAttribute('aria-invalid')),
      hint: hintMessage(root),
      win: winMessage(root),
    });
    let n = 0;
    const step = (row: number, col: number, presses: number): void => {
      for (let i = 0; i < presses; i++) {
        press(cellEl(keys, row, col), n % 2 === 0 ? 'Enter' : ' ');
        n += 1;
        clickCell(clicks, row, col);
        expect(observe(keys), `after press ${n} on ${row},${col}`).toEqual(observe(clicks));
      }
    };
    // three equal digits side by side with the two given 0 at (4,5) and (4,6); a press on a given; the run broken again
    step(4, 4, 1);
    expect(violationCells(keys)).toEqual([[4, 4], [4, 5], [4, 6]]);
    step(4, 5, 1); // a given: nothing changes
    step(4, 4, 2);
    // every other player cell to its solution digit: the board ends solved
    const solution = solutionGrid(WIN_PUZZLE);
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        if (WIN_PUZZLE.givens[r - 1]?.[c - 1] !== null) continue;
        step(r, c, (solution[r - 1]?.[c - 1] ?? 0) + 1);
      }
    }
    expect(winMessage(keys)).toBe(WIN_MESSAGE);
    expect(winMessage(clicks)).toBe(WIN_MESSAGE);
    expect(allCells(keys).every((c) => c.getAttribute('aria-label') !== null)).toBe(true);
  });

  it('@trace FR-38 @trace FR-60 Highlight appears at once after Enter or Space: 0, then 1, empty, then 0 again (PAIR_LEFT)', () => {
    const root = mountFixture(PAIR_LEFT);
    expect(violationCells(root)).toEqual([]);
    const cell = cellEl(root, 4, 1);
    const run: [number, number][] = [[4, 1], [4, 2], [4, 3]];
    press(cell, 'Enter');
    expect(cell.textContent).toBe('0');
    expect(violationCells(root), 'in the same key handling').toEqual(run);
    press(cell, 'Enter');
    expect(cell.textContent).toBe('1');
    expect(violationCells(root)).toEqual([]);
    press(cell, 'Enter');
    expect(cell.textContent).toBe('');
    expect(violationCells(root)).toEqual([]);
    press(cell, ' ');
    expect(cell.textContent).toBe('0');
    expect(violationCells(root)).toEqual(run);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Given cells are locked (MODIFIED): click and keys on a given
// ---------------------------------------------------------------------------------------------------------

describe('given cells are locked: only the Tab stop and the focus may move', () => {
  /** WIN_PUZZLE with a violation (4,4)-(4,6) and the broken-board hint sentence shown: the state the scenarios describe. */
  function playedBoard(): HTMLElement {
    const root = mountFixture(WIN_PUZZLE);
    clickCell(root, 4, 4); // a 0 next to the given 0 0 at (4,5), (4,6): three equal digits
    pressHint(root); // the board is broken, so the hint is the "fix the violation" sentence and fills nothing
    expect(hintMessage(root)).toBe(BROKEN_SENTENCE);
    expect(violationCells(root)).toEqual([[4, 4], [4, 5], [4, 6]]);
    return root;
  }

  it('@trace FR-33 @trace FR-60 A click on a given moves only the Tab stop and the focus', () => {
    const root = playedBoard();
    expect(cellText(root, 1, 3)).toBe('0');
    expect(cellEl(root, 1, 3).getAttribute('data-given')).toBe('true');
    const before = snapshot(root);
    const messages = [hintMessage(root), winMessage(root)];
    expect(rc(tabStopCells(root)[0] ?? root)).not.toBe('1,3'); // the Tab stop is at another cell

    clickCell(root, 1, 3);
    expectTabStop(root, 1, 3);
    expectFocusOn(root, 1, 3);
    expect(snapshot(root)).toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messages);
  });

  it('@trace FR-33 @trace FR-60 Clicking a given three times changes nothing and keeps the focus on it', () => {
    const root = mountFixture(WIN_PUZZLE);
    const before = snapshot(root);
    clickCell(root, 2, 5, 3);
    expect(snapshot(root)).toEqual(before);
    expectTabStop(root, 2, 5);
    expectFocusOn(root, 2, 5);
  });

  it('@trace FR-33 @trace FR-60 Enter and Space on a given change nothing, are prevented, and move neither focus nor Tab stop', () => {
    const root = playedBoard();
    focusCell(root, 3, 3);
    const before = snapshot(root);
    const messages = [hintMessage(root), winMessage(root)];
    expect(cellText(root, 2, 5)).toBe('1');
    press(cellEl(root, 2, 5), 'Enter');
    press(cellEl(root, 2, 5), ' ');
    press(cellEl(root, 2, 5), 'Enter', { repeat: true });
    expect(cellText(root, 2, 5)).toBe('1');
    expect(cellEl(root, 2, 5).getAttribute('data-given')).toBe('true');
    expect(cellEl(root, 2, 5).classList.contains('cell-given')).toBe(true);
    expect(snapshot(root)).toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messages);
    expectFocusOn(root, 3, 3);
    expectTabStop(root, 3, 3);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Click focus on the player cell keeps the generic behaviour of slice 2 (the 4x4 and 8x8 boards behave the same)
// ---------------------------------------------------------------------------------------------------------

describe('the Tab stop and focus work at every size', () => {
  it('@trace FR-59 @trace FR-60 At 4x4 and 8x8 a click moves the Tab stop and focus, and a new puzzle resets it to 1,1', () => {
    for (const puzzle of [BLANK_4, BLANK_8]) {
      const root = mountThenSelect(puzzle);
      expectTabStop(root, 1, 1);
      clickUntil(root, 2, 3, '1');
      expectTabStop(root, 2, 3);
      expectFocusOn(root, 2, 3);
    }
    const root = mountThenSelect(BLANK_8);
    clickCell(root, 8, 8);
    expectTabStop(root, 8, 8);
    pressNew(root);
    expectTabStop(root, 1, 1);
  });
});

describe('review round 1: one cycle after a rebuild, and mounting keeps the focus', () => {
  it('@trace FR-60 After a rebuild (a new puzzle, then a size change) one Enter still cycles a player cell exactly once', () => {
    const root = mountPage({ seedSource: () => 1, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    pressNew(root);
    press(cellEl(root, 2, 3), 'Enter');
    expect(cellText(root, 2, 3), 'one Enter after a new puzzle is one cycle').toBe('0');
    selectSize(root, 4);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'the size change rebuilt the board').toBe('4');
    press(cellEl(root, 2, 2), 'Enter');
    expect(cellText(root, 2, 2), 'one Enter after a size change is one cycle').toBe('0');
  });

  it('@trace FR-59 Mounting the page does not move DOM focus', () => {
    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.append(outside);
    try {
      outside.focus();
      expect(document.activeElement).toBe(outside);
      const root = mountFixture(BLANK);
      expect(document.activeElement, 'the mount left the focus where it was').toBe(outside);
      expectTabStop(root, 1, 1);
    } finally {
      outside.remove();
    }
  });
});

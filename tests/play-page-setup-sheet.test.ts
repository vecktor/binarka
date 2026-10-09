// Play page: the summary button (FR-95), the setup sheet (FR-96), choosing and closing the sheet (FR-97), the sheet and the
// confirmation dialog (FR-98), and the focus of the keyboard (FR-59, NFR-9). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md ("Summary button", "Setup sheet", "Choosing and closing the
// sheet", "Sheet and confirmation"). Written FIRST (red): the page has no summary button and no sheet.
//
// @trace FR-95
// @trace FR-96
// @trace FR-97
// @trace FR-98
// @trace FR-59
// @trace NFR-9
//
// jsdom has no popover: tests/helpers/play-page.ts installs showPopover/hidePopover/togglePopover stubs (A-44) that record
// calls and keep an open state per element; hidePopover dispatches no event, a test dispatches `toggle` itself
// (`dispatchToggle`). The sheet is opened by the stubbed `showPopover()` (`openSheet`); the native opening by the summary button
// is not tested in jsdom. Exact texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  CLOSE_LABEL,
  PAIR_ROW,
  SHEET_LABEL,
  SUMMARY_PREFIX,
  WIN_PUZZLE,
  accessibleName,
  allCells,
  boardSize,
  bySize,
  callOrder,
  cellEl,
  chooseLevel,
  clickCell,
  confirmNo,
  confirmYes,
  dialogEscape,
  dialogIsOpen,
  dispatchToggle,
  expectActive,
  expectInDocumentOrder,
  fillFrom,
  fullState,
  generateSpy,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  levelButton,
  levelButtons,
  mountFixture,
  mountPage,
  mountPlayedBoard,
  openSheet,
  popoverCalls,
  popoverIsOpen,
  popoverLog,
  pressHint,
  pressLevelButton,
  pressNew,
  pressReset,
  pressSizeButton,
  pressKey,
  q,
  rulesPanel,
  seedQueue,
  selectSize,
  sheetCloseButton,
  sheetOf,
  showModalCalls,
  sizeButton,
  sizeButtons,
  snapshot,
  solutionGrid,
  summaryButton,
  summaryLabel,
  summaryText,
  trackErrors,
  violationCells,
  winMessage,
  WIN_MESSAGE,
  messageArea,
} from './helpers/play-page';

installPageLifecycle();

const HEADINGS = 'h1, h2, h3, h4, h5, h6';
const FORBIDDEN_ON_SUMMARY = ['aria-label', 'aria-labelledby', 'aria-haspopup', 'aria-expanded', 'tabindex'];

// ---------------------------------------------------------------------------------------------------------
// Requirement: Summary button (FR-95)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-95 the summary button', () => {
  it('Summary button structure at mount', () => {
    const root = mountFixture(BLANK);
    const found = root.querySelectorAll('[data-action="setup"]');
    expect(found, 'exactly one summary button').toHaveLength(1);
    const button = summaryButton(root);
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    const sheetId = sheetOf(root).getAttribute('id') ?? '';
    expect(sheetId, 'the sheet has an id').not.toBe('');
    expect(button.getAttribute('popovertarget'), 'popovertarget equals the id of the sheet').toBe(sheetId);

    const children = Array.from(button.children);
    expect(children, 'exactly three child elements').toHaveLength(3);
    expect(children.map((c) => c.tagName)).toEqual(['SPAN', 'SPAN', 'SPAN']);
    expect(children[0]?.textContent, 'the hidden prefix ends in one ordinary space').toBe(SUMMARY_PREFIX);
    expect(children[1]?.textContent).toBe('6×6 · Розминка');
    expect(children[2]?.getAttribute('aria-hidden')).toBe('true');
    expect(children[2]?.textContent).toBe('▾');
    for (const name of FORBIDDEN_ON_SUMMARY) expect(button.hasAttribute(name), `the summary button has no ${name}`).toBe(false);
  });

  it('The accessible name says what the button opens', () => {
    const root = mountFixture(BLANK);
    const name = accessibleName(summaryButton(root));
    expect(name).toBe('Поле і складність: 6×6 · Розминка');
    expect(/\p{Script=Cyrillic}/u.test(name)).toBe(true);
    expect(/[A-Za-z]/.test(name)).toBe(false);
  });

  it('The summary follows every shown board', { timeout: 120_000 }, () => {
    // the real engine generator, a deterministic seed source: the choices run the generator at levels 2 and 4 and sizes 4 and 8
    const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4, 5, 6]).source });
    expect(summaryText(root), 'premise: the mount shows 6×6 · Розминка').toBe('6×6 · Розминка');
    const seen: string[] = [];

    chooseLevel(root, 2);
    seen.push(summaryText(root));
    selectSize(root, 8);
    seen.push(summaryText(root));
    chooseLevel(root, 4);
    seen.push(summaryText(root));
    selectSize(root, 4);
    seen.push(summaryText(root));
    selectSize(root, 6);
    seen.push(summaryText(root));

    expect(seen).toEqual(['6×6 · Задачка', '8×8 · Задачка', '8×8 · Мозколамка', '4×4 · Розминка', '6×6 · Розминка']);
  });

  it('The summary follows «Нова головоломка» and keeps its text after a reset', () => {
    const { root } = mountPlayedBoard(6, undefined, 3); // a 6x6 board at «Головоломка» with player entries
    expect(summaryText(root), 'premise: the level is «Головоломка»').toBe('6×6 · Головоломка');

    pressReset(root);
    confirmYes(root);
    expect(summaryText(root), 'after «Скинути»').toBe('6×6 · Головоломка');

    clickCell(root, 6, 6, 2); // an entry again, so the next press asks
    pressNew(root);
    confirmYes(root);
    expect(summaryText(root), 'after «Нова головоломка»').toBe('6×6 · Головоломка');
  });

  it('The summary stays when nothing was shown', () => {
    // (1) a cancelled confirmation
    const first = mountPlayedBoard(6);
    expect(summaryText(first.root)).toBe('6×6 · Розминка');
    pressLevelButton(first.root, 2);
    expect(dialogIsOpen(first.root), 'premise: the level change asks first').toBe(true);
    confirmNo(first.root);
    expect(summaryText(first.root), 'after a cancelled confirmation').toBe('6×6 · Розминка');

    // (2) a failed generation: an injected generate that throws an ordinary error for size 8
    const second = mountPlayedBoard(6, (size) => {
      if (size === 8) throw new Error('generator failed for size 8');
      return PAIR_ROW;
    });
    expect(summaryText(second.root)).toBe('6×6 · Розминка');
    pressSizeButton(second.root, 8);
    confirmYes(second.root);
    expect(boardSize(second.root), 'premise: the board is still 6x6').toBe(6);
    expect(summaryText(second.root), 'after a failed generation').toBe('6×6 · Розминка');

    // (3) another page at 4x4: an unavailable level pressed in the open sheet
    const third = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    selectSize(third, 4);
    expect(summaryText(third)).toBe('4×4 · Розминка');
    pressLevelButton(third, 2);
    expect(summaryText(third), 'after the press of an unavailable level').toBe('4×4 · Розминка');
  });

  it('The summary button is in the page order and the tab order', () => {
    const root = mountFixture(BLANK);
    const summary = summaryButton(root);
    expectInDocumentOrder([q(root, 'header'), summary, q(root, '[data-board]')]);
    expectInDocumentOrder([summary, cellEl(root, 1, 1)]);
    expect(root.querySelectorAll('[tabindex]'), 'no tabindex anywhere').toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Setup sheet (FR-96)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-96 the setup sheet', () => {
  it('Sheet structure at mount', () => {
    const root = mountFixture(BLANK);
    expect(root.querySelectorAll('[data-section="setup"]'), 'exactly one sheet').toHaveLength(1);
    const sheet = sheetOf(root);
    expect(sheet.hasAttribute('popover'), 'the sheet has the popover attribute').toBe(true);
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-label')).toBe(SHEET_LABEL);
    expect(sheet.hasAttribute('aria-labelledby')).toBe(false);
    expect(sheet.getAttribute('id') ?? '', 'a non-empty id').not.toBe('');
    expect(sheet.querySelectorAll(HEADINGS), 'no heading element inside the sheet').toHaveLength(0);
    const board = q(root, '[data-board]');
    expect(root.contains(sheet), 'inside the page root').toBe(true);
    expect(board.contains(sheet)).toBe(false);
    expect(board.parentElement?.contains(sheet), 'not inside the board host').toBe(false);
    expect(q(root, 'header').contains(sheet)).toBe(false);
    expect(messageArea(root).contains(sheet)).toBe(false);
    expect(Array.from(sheet.children).map((c) => c.getAttribute('data-control') ?? c.getAttribute('data-action'))).toEqual([
      'size',
      'level',
      'setup-close',
    ]);
  });

  it('Sheet position in the document', () => {
    const root = mountFixture(BLANK);
    const sheet = sheetOf(root);
    expectInDocumentOrder([messageArea(root), sheet, q(root, '[data-dialog="confirm"]')]);
    expectInDocumentOrder([rulesPanel(root), sheet]);
  });

  it('The close button', () => {
    const root = mountFixture(BLANK);
    const close = sheetCloseButton(root);
    expect(close.tagName).toBe('BUTTON');
    expect(close.getAttribute('type')).toBe('button');
    expect(close.textContent).toBe(CLOSE_LABEL);
    expect(close.getAttribute('popovertarget')).toBe(sheetOf(root).getAttribute('id'));
    expect(close.getAttribute('popovertargetaction')).toBe('hide');
    expect(close.hasAttribute('tabindex')).toBe(false);
    // The spec says "exactly eight buttons in all" (corrected from "nine" after the red run, 2026-10-09): three size buttons, four
    // level buttons and the close button.
    const buttons = Array.from(sheetOf(root).querySelectorAll('button'));
    expect(buttons.map((b) => b.getAttribute('role') ?? b.getAttribute('data-action')), 'three sizes, four levels and the close button').toEqual([
      'radio',
      'radio',
      'radio',
      'radio',
      'radio',
      'radio',
      'radio',
      'setup-close',
    ]);
  });

  it('The sheet opens and closes with no script', () => {
    const root = mountFixture(PAIR_ROW);
    const before = fullState(root);
    const cells = snapshot(root);
    const checkedSizes = sizeButtons(root).map((b) => b.getAttribute('aria-checked'));
    const checkedLevels = levelButtons(root).map((b) => b.getAttribute('aria-checked'));

    summaryButton(root).click();
    sheetCloseButton(root).click();

    expect(popoverLog, 'no popover method was called').toEqual([]);
    expect(fullState(root)).toEqual(before);
    expect(snapshot(root)).toEqual(cells);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(checkedSizes);
    expect(levelButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(checkedLevels);
  });

  it('Two mounts stay independent', () => {
    const a = mountFixture(BLANK);
    const b = mountFixture(BLANK);
    const idA = sheetOf(a).getAttribute('id');
    const idB = sheetOf(b).getAttribute('id');
    expect(idA, 'sheet A has an id').toBeTruthy();
    expect(idB, 'sheet B has an id').toBeTruthy();
    expect(idA).not.toBe(idB);
    expect(summaryButton(a).getAttribute('popovertarget')).toBe(idA);
    expect(summaryButton(b).getAttribute('popovertarget')).toBe(idB);
    expect(sheetCloseButton(a).getAttribute('popovertarget')).toBe(idA);
    expect(sheetCloseButton(b).getAttribute('popovertarget')).toBe(idB);
  });

  describe('Other actions leave the sheet alone', () => {
    const ACTIONS = ['hint', 'win', 'reset', 'new puzzle', 'size', 'level'] as const;

    it.each(ACTIONS)('after %s there is exactly one sheet, the same element with the same three children', (action) => {
      const fixtures = { 6: action === 'win' ? WIN_PUZZLE : PAIR_ROW, 4: BLANK_4, 8: BLANK_8 };
      const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize(fixtures) });
      const sheet = sheetOf(root);
      const children = Array.from(sheet.children);
      expect(children, 'premise: the sheet has three children').toHaveLength(3);

      if (action === 'hint') {
        pressHint(root);
      } else if (action === 'win') {
        fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
        pressHint(root);
        expect(winMessage(root), 'premise: the win was reached').toBe(WIN_MESSAGE);
      } else if (action === 'reset') {
        pressReset(root); // the board is untouched: at once
      } else if (action === 'new puzzle') {
        pressNew(root);
      } else if (action === 'size') {
        selectSize(root, 8);
      } else {
        chooseLevel(root, 2);
      }

      expect(root.querySelectorAll('[data-section="setup"]'), 'exactly one sheet').toHaveLength(1);
      expect(sheetOf(root), 'the same element as at mount').toBe(sheet);
      expect(Array.from(sheet.children), 'the same three children').toEqual(children);
      const expectedHides = action === 'size' || action === 'level' ? 1 : 0;
      expect(popoverCalls('hidePopover', sheet), 'hidePopover was called only by the size and the level choice').toBe(expectedHides);
    });
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Choosing and closing the sheet (FR-97)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-97 choosing and closing the sheet', () => {
  it('Choosing a size closes the sheet and returns the focus', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });
    const sheet = openSheet(root);
    const eight = sizeButton(root, 8);
    eight.focus();
    expectActive(eight, 'premise: «Поле 8×8» has the focus');

    eight.click();

    expect(popoverCalls('hidePopover', sheet), 'hidePopover was called once on the sheet').toBe(1);
    expect(popoverIsOpen(sheet), 'the stub state of the sheet is closed').toBe(false);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(summaryText(root)).toBe('8×8 · Розминка');
  });

  it('Choosing a level closes the sheet and returns the focus', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK }) });
    const sheet = openSheet(root);
    const level = levelButton(root, 2);
    level.focus();
    expectActive(level, 'premise: «Задачка» has the focus');

    level.click();

    expect(popoverCalls('hidePopover', sheet)).toBe(1);
    expect(popoverIsOpen(sheet)).toBe(false);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(summaryText(root)).toBe('6×6 · Задачка');
  });

  it('The shown size and the shown level close the sheet and change nothing else', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const sheet = sheetOf(root);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const hides = popoverCalls('hidePopover', sheet);
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(before.hint, 'premise: a hint sentence is shown').not.toBe('');

    pressSizeButton(root, 6); // opens the sheet, presses the size shown
    expect(popoverCalls('hidePopover', sheet) - hides, 'after the size press hidePopover was called once more').toBe(1);
    expectActive(summaryButton(root), 'focus is on the summary button after the size press');
    pressLevelButton(root, 1); // opens the sheet again, presses the level shown
    expect(popoverCalls('hidePopover', sheet) - hides, 'after the level press hidePopover was called twice more').toBe(2);
    expectActive(summaryButton(root), 'focus is on the summary button after the level press');

    expect(fullState(root), 'cells, messages, aria-checked of both groups and the summary are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(showModalCalls(), 'showModal was never called').toBe(0);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made').toHaveLength(generatorCalls);
  });

  it('A press whose generation fails closes the sheet', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: (size) => {
        if (size === 8) throw new Error('generator failed for size 8');
        return BLANK;
      },
    });
    const sheet = openSheet(root);
    const tracker = trackErrors();
    try {
      sizeButton(root, 8).click();
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'no uncaught error').toEqual([]);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was called once').toBe(1);
    expectActive(summaryButton(root), 'focus is on the summary button');
    expect(boardSize(root), 'the board is still 6x6').toBe(6);
    expect(summaryText(root)).toBe('6×6 · Розминка');
  });

  it('An unavailable level leaves the sheet open', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    selectSize(root, 4);
    const sheet = openSheet(root);
    const hides = popoverCalls('hidePopover', sheet);
    const unavailable = levelButton(root, 2);
    unavailable.focus();
    expectActive(unavailable, 'premise: «Задачка» has the focus');

    unavailable.click();

    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called by the press').toBe(hides);
    expect(popoverIsOpen(sheet), 'the stub state of the sheet is open').toBe(true);
    expectActive(unavailable, 'DOM focus is still on that button');
  });

  it('Escape, the close button and a closing toggle event change nothing', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const sheet = openSheet(root);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const close = sheetCloseButton(root);
    close.focus(); // where the player's focus is when the close button is pressed

    const escape = pressKey(sheet, 'Escape');
    close.click();
    expect(escape.defaultPrevented, 'the page does not handle Escape').toBe(false);
    dispatchToggle(sheet, 'closed');

    expect(fullState(root), 'cells, messages, aria-checked of both groups and the summary are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made').toHaveLength(generatorCalls);
    expectActive(summaryButton(root), 'after the toggle event the focus is on the summary button');
    // the light dismiss (a click outside the sheet) is native to popover="auto": jsdom cannot perform it, so it is not claimed
    // here and is checked in the real browser (task 4.9)
  });

  it('A late toggle event does not steal the focus from the rules panel', () => {
    const root = mountFixture(BLANK);
    const panel = rulesPanel(root);
    panel.showPopover();
    const close = q(panel, 'button');
    close.focus();
    expectActive(close, 'premise: «Зрозуміло» has the focus');

    dispatchToggle(sheetOf(root), 'closed');

    expectActive(close, 'the focus is still on «Зрозуміло»');
  });

  it('A late toggle event does not steal the focus from the dialog', () => {
    const { root } = mountPlayedBoard(6);
    pressLevelButton(root, 2);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);
    const no = q(root, '[data-confirm="no"]');
    expectActive(no, 'premise: «Скасувати» has the focus');

    dispatchToggle(sheetOf(root), 'closed');

    expectActive(no, 'the focus is still on «Скасувати»');
  });

  // Review-gate fix round (2026-10-09): a light dismiss by a click on another control left the focus on the summary button
  // in Chromium. Source: the delta spec, «Choosing and closing the sheet», the sentence and the two scenarios added then.
  it('A light dismiss by a click on a cell leaves the focus on that cell', () => {
    const root = mountFixture(BLANK);
    openSheet(root);
    const cell = cellEl(root, 1, 2);
    cell.focus();
    expectActive(cell, 'premise: the cell has the focus, as a click on it does');

    dispatchToggle(sheetOf(root), 'closed');

    expectActive(cell, 'the focus is still on the cell');
  });

  it('A closing toggle with the focus on no element moves it to the summary button', () => {
    const root = mountFixture(BLANK);
    openSheet(root);
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.activeElement, 'premise: no element has the focus').toBe(document.body);

    dispatchToggle(sheetOf(root), 'closed');

    expectActive(summaryButton(root), 'the focus moved to the summary button');
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Sheet and confirmation (FR-98)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-98 the sheet and the confirmation', () => {
  const RUNS = [
    { name: '«Поле 8×8»', press: (root: HTMLElement): void => { pressSizeButton(root, 8); } },
    { name: '«Задачка»', press: (root: HTMLElement): void => { pressLevelButton(root, 2); } },
  ];

  it.each(RUNS)('The sheet closes before the dialog opens ($name)', ({ press }) => {
    const { root } = mountPlayedBoard(6);
    const sheet = sheetOf(root);

    press(root);

    expect(popoverCalls('hidePopover', sheet), 'hidePopover was called once').toBe(1);
    expect(showModalCalls(), 'showModal was called once').toBe(1);
    expect(callOrder.indexOf('hidePopover'), 'hidePopover was called before showModal').toBeLessThan(callOrder.indexOf('showModal'));
    expect(callOrder.indexOf('hidePopover')).toBeGreaterThanOrEqual(0);
    expect(popoverIsOpen(sheet), 'the stub state of the sheet is closed').toBe(false);
    expect(dialogIsOpen(root), 'the dialog has the open attribute').toBe(true);
    expectActive(q(root, '[data-confirm="no"]'), 'the focused element is «Скасувати»');
  });

  it.each(RUNS)('«Скасувати» returns the focus to the summary button ($name)', ({ press }) => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const sheet = sheetOf(root);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    press(root);
    const shows = popoverCalls('showPopover', sheet);

    confirmNo(root);

    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expectActive(summaryButton(root), 'focus is on the summary button');
    expect(popoverIsOpen(sheet), 'the sheet is closed').toBe(false);
    expect(popoverCalls('showPopover', sheet), 'showPopover was not called again').toBe(shows);
    expect(fullState(root), 'the board, size, level, messages and summary are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made').toHaveLength(generatorCalls);
  });

  it.each(RUNS)('Escape returns the focus to the summary button ($name)', ({ press }) => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const sheet = sheetOf(root);
    const before = fullState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    press(root);
    const shows = popoverCalls('showPopover', sheet);

    dialogEscape(root); // a cancel event, then a close event, no button pressed

    expectActive(summaryButton(root), 'focus is on the summary button');
    expect(popoverIsOpen(sheet)).toBe(false);
    expect(popoverCalls('showPopover', sheet), 'the sheet did not reopen').toBe(shows);
    expect(fullState(root)).toEqual(before);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
  });

  it('A failed generation after «Так, почати» focuses the summary button', () => {
    const { root } = mountPlayedBoard(6, (size) => {
      if (size === 8) throw new Error('generator failed for size 8');
      return PAIR_ROW;
    });
    const before = fullState(root);
    pressSizeButton(root, 8);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);

    confirmYes(root);

    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(boardSize(root), 'the board is still 6x6').toBe(6);
    expect(fullState(root), 'the summary and everything else are unchanged').toEqual(before);
    expectActive(summaryButton(root), 'focus is on the summary button');
  });

  it('«Так, почати» performs the change and focuses the summary', () => {
    const { root } = mountPlayedBoard(6);
    pressSizeButton(root, 8);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);

    confirmYes(root);

    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(boardSize(root)).toBe(8);
    expect(allCells(root)).toHaveLength(64);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent !== ''), 'no player entries').toEqual([]);
    expect(summaryText(root)).toBe(summaryLabel(8, 1));
    expectActive(summaryButton(root), 'focus is on the summary button');
    expect(hintMessage(root)).toBe('');
  });
});

// ---------------------------------------------------------------------------------------------------------
// FR-59 / NFR-9: the keyboard (scenario «Choosing in the sheet returns the focus to the summary button»)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-59 @trace NFR-9 the focus after a choice in the sheet', () => {
  it('Choosing in the sheet returns the focus to the summary button', () => {
    const outside = document.createElement('button');
    outside.type = 'button';
    document.body.append(outside);
    try {
      outside.focus();
      const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4 }));
      const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
      expectActive(outside, 'premise: the mount left the focus where it was');
      openSheet(root);
      const four = sizeButton(root, 4);
      four.focus();
      expectActive(four, 'premise: «Поле 4×4» has the focus');

      four.click(); // the board has no entries, so at once

      expect(boardSize(root), 'a 4x4 board is shown').toBe(4);
      expectActive(summaryButton(root), 'the focus is on the summary button, not on the pressed option');
      expect(document.activeElement).not.toBe(four);
    } finally {
      outside.remove();
    }
  });
});

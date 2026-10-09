// Play page: only the first level exists at 4x4 (FR-91) and pressing the shown level changes nothing (FR-73, FR-97). Scenarios of
// the delta spec openspec/changes/add-level-selector/specs/play-page/spec.md ("Only the first level exists at 4x4" and the level
// scenarios added to "Pressing the shown size changes nothing"). Written FIRST (red): the page has no level control.
//
// @trace FR-91
// @trace FR-73
// @trace FR-97
// @trace FR-100
// @trace FR-101
//
// update-setup-sheet-start: the 4×4 state follows the MARKED size while the sheet is open (FR-91, FR-100); the scenarios «The shown
// level is a no-op at every level» and «With no board shown, a level button generates» are renamed in the delta and their tests moved,
// rewritten, to tests/play-page-marked-choice.test.ts (docs/qa/update-setup-sheet-start/changed-tests.md sections 5.5, 6, 8).
//
// The sheet is opened through the stubbed showPopover() (A-44). Unavailable levels carry aria-disabled="true" (not disabled, no
// tabindex) and stay focusable. Exact texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  REASON_4X4,
  boardSize,
  checkedLevel,
  confirmYes,
  expectActive,
  fullState,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  levelButton,
  levelButtons,
  levelControl,
  levelDisabled,
  levelReason,
  levelStates,
  mountPage,
  mountPlayedBoard,
  openSheet,
  popoverCalls,
  popoverIsOpen,
  seedQueue,
  selectSize,
  sheetOf,
  showModalCalls,
  sizeButton,
  sizeButtons,
  snapshot,
  summaryText,
  violationCells,
  winMessage,
  markSize,
  pressStart,
} from './helpers/play-page';

installPageLifecycle();

/** A 6x6 page with the real-sized fixtures, a counting seed source, and no player entries; `4` is reached by the size control. */
function pageAt4x4(): HTMLElement {
  const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }) });
  selectSize(root, 4);
  expect(boardSize(root), 'premise: a 4x4 board is shown').toBe(4);
  return root;
}

// ---------------------------------------------------------------------------------------------------------
// Requirement: Only the first level exists at 4x4 (FR-91)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-91 only the first level exists at 4x4', () => {
  // update-setup-sheet-start, scenario «The 4x4 state of the level control follows the marked size» (FR-91, FR-100): a marking press
  // on «Поле 4×4» changes the level control at once, the summary and the board stay, no seed is taken.
  it('The 4x4 state of the level control follows the marked size', () => {
    const seeds = seedQueue([1, 2]);
    const root = mountPage({ seedSource: seeds.source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    openSheet(root);

    sizeButton(root, 4).click(); // a marking press, no «Почати»

    const control = levelControl(root);
    expect(control.hasAttribute('hidden'), 'the level control is visible').toBe(false);
    expect(sheetOf(root).contains(control), 'and still in the sheet').toBe(true);
    const buttons = levelButtons(root);
    for (const button of buttons) {
      expect(button.hasAttribute('hidden'), 'no level button is hidden').toBe(false);
      expect(button.hasAttribute('disabled'), 'no level button has disabled').toBe(false);
      expect(button.hasAttribute('tabindex'), 'no level button has tabindex').toBe(false);
    }
    expect(buttons[0]?.getAttribute('aria-checked')).toBe('true');
    expect(buttons[0]?.hasAttribute('aria-disabled'), '«Розминка» has no aria-disabled').toBe(false);
    for (const button of buttons.slice(1)) {
      expect(button.getAttribute('aria-checked')).toBe('false');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    }
    const reason = levelReason(root);
    expect(reason.hasAttribute('hidden'), 'the reason line is not hidden').toBe(false);
    expect(reason.textContent).toBe(REASON_4X4);
    expect(summaryText(root), 'the summary still reads the board shown').toBe('6×6 · Розминка');
    expect(boardSize(root), 'the board is still 6×6').toBe(6);
    expect(seeds.calls(), 'no seed was taken (the mount only)').toBe(1);
  });

  // update-setup-sheet-start, scenario «The 4x4 state after «Почати»» (was «The 4x4 state of the level control»): the player chooses
  // «Поле 4×4» (marks it and presses «Почати») and opens the sheet again.
  it('The 4x4 state after «Почати»', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });

    selectSize(root, 4);
    openSheet(root);

    const control = levelControl(root);
    expect(control.hasAttribute('hidden'), 'the level control is visible').toBe(false);
    expect(sheetOf(root).contains(control), 'and still in the sheet').toBe(true);
    const buttons = levelButtons(root);
    for (const button of buttons) {
      expect(button.hasAttribute('hidden'), 'no level button is hidden').toBe(false);
      expect(button.hasAttribute('disabled'), 'no level button has disabled').toBe(false);
      expect(button.hasAttribute('tabindex'), 'no level button has tabindex').toBe(false);
    }
    expect(buttons[0]?.getAttribute('aria-checked')).toBe('true');
    expect(buttons[0]?.hasAttribute('aria-disabled'), '«Розминка» has no aria-disabled').toBe(false);
    for (const button of buttons.slice(1)) {
      expect(button.getAttribute('aria-checked')).toBe('false');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    }
    const reason = levelReason(root);
    expect(reason.hasAttribute('hidden'), 'the reason line is not hidden').toBe(false);
    expect(reason.textContent).toBe(REASON_4X4);
    expect(summaryText(root)).toBe('4×4 · Розминка');
  });

  it('The reason is hidden at 6x6 and 8x8', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });
    const check = (what: string): void => {
      const reason = levelReason(root);
      expect(reason.hasAttribute('hidden'), `${what}: hidden attribute`).toBe(true);
      expect(reason.textContent, `${what}: empty text`).toBe('');
      const sheet = sheetOf(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        const text = n as Text;
        if (sheet.contains(text)) continue;
        expect(text.data.includes(REASON_4X4), `${what}: no text outside the sheet shows the reason`).toBe(false);
      }
    };
    check('at 6x6');

    selectSize(root, 8);

    check('at 8x8');
  });

  it('An unavailable level is focusable', () => {
    const root = pageAt4x4();
    const button = levelButton(root, 4);

    button.focus();

    expectActive(button, 'DOM focus is on «Мозколамка»');
  });

  it('Pressing an unavailable level changes nothing', () => {
    const { root, seeds, spy } = mountPlayedBoard(4);
    const sheet = openSheet(root);
    const before = fullState(root);
    const cells = snapshot(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shown = showModalCalls();
    const hides = popoverCalls('hidePopover', sheet);
    expect(before.size, 'premise: a 4x4 board').toBe(4);
    expect(before.hint, 'premise: a hint sentence is shown').not.toBe('');
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);

    for (const level of [2, 3, 4]) levelButton(root, level).click();

    expect(showModalCalls(), 'showModal was never called').toBe(shown);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(seeds.calls(), 'the seed-source count equals the count read before').toBe(seedCalls);
    expect(spy.calls, 'the generator call count equals the count read before').toHaveLength(generatorCalls);
    expect(snapshot(root), 'every cell keeps its text and class list').toEqual(cells);
    expect(hintMessage(root), 'the hint message keeps its text').toBe(before.hint);
    expect(winMessage(root)).toBe(before.win);
    expect(fullState(root)).toEqual(before);
    expect(levelStates(root), 'aria-checked is on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'and on «Поле 4×4» only').toEqual(['true', 'false', 'false']);
    expect(popoverIsOpen(sheet), 'the sheet stays open').toBe(true);
    expect(summaryText(root)).toBe('4×4 · Розминка');
  });

  // update-setup-sheet-start: the sheet is opened with a marked size of 4×4 (a press on «Поле 4×4» on a 6×6 board without entries),
  // then marking presses on «Поле 6×6» and later «Поле 8×8» (FR-91, FR-100).
  it('The buttons are available again at 6x6 and 8x8', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }) });
    markSize(root, 4);
    expect(levelDisabled(root), 'premise: the marked size 4×4 disables levels 2 to 4').toEqual([null, 'true', 'true', 'true']);
    expect(boardSize(root), 'premise: a marking press shows no board, the page still shows 6×6').toBe(6);

    markSize(root, 6);
    expect(boardSize(root), 'a marking press on «Поле 6×6» shows no board either').toBe(6);
    expect(levelDisabled(root), 'at 6x6 no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(checkedLevel(root)).toBe(1);
    expect(levelReason(root).hasAttribute('hidden')).toBe(true);

    markSize(root, 8);
    expect(boardSize(root), 'and neither does «Поле 8×8»').toBe(6);
    expect(levelDisabled(root), 'at 8x8 no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(checkedLevel(root)).toBe(1);
    expect(levelReason(root).hasAttribute('hidden')).toBe(true);
  });

  it('A failed change to 4x4 keeps the available levels', () => {
    const { root } = mountPlayedBoard(6, (size) => {
      if (size === 4) throw new Error('generator failed for size 4');
      return PAIR_ROW;
    }, 3);
    expect(levelStates(root), 'premise: the level is «Головоломка»').toEqual(['false', 'false', 'true', 'false']);

    markSize(root, 4);
    pressStart(root);
    confirmYes(root);

    expect(boardSize(root), 'the board is still 6x6').toBe(6);
    expect(levelStates(root)).toEqual(['false', 'false', 'true', 'false']);
    expect(levelDisabled(root), 'no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(levelReason(root).hasAttribute('hidden'), 'the reason is hidden').toBe(true);
    expect(summaryText(root)).toBe('6×6 · Головоломка');
  });
});

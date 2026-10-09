// Play page: only the first level exists at 4x4 (FR-91) and pressing the shown level changes nothing (FR-73, FR-97). Scenarios of
// the delta spec openspec/changes/add-level-selector/specs/play-page/spec.md ("Only the first level exists at 4x4" and the level
// scenarios added to "Pressing the shown size changes nothing"). Written FIRST (red): the page has no level control.
//
// @trace FR-91
// @trace FR-73
// @trace FR-97
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
  allCells,
  boardSize,
  bySize,
  checkedLevel,
  chooseLevel,
  confirmYes,
  expectActive,
  fullState,
  generateSpy,
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
  pressLevelButton,
  pressSizeButton,
  rawGenerateSpy,
  seedQueue,
  selectSize,
  sheetOf,
  showModalCalls,
  sizeButton,
  sizeButtons,
  snapshot,
  summaryButton,
  summaryText,
  violationCells,
  winMessage,
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
  it('The 4x4 state of the level control', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });

    selectSize(root, 4);

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

  it('The buttons are available again at 6x6 and 8x8', () => {
    const root = pageAt4x4();

    selectSize(root, 6);
    expect(levelDisabled(root), 'at 6x6 no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(checkedLevel(root)).toBe(1);
    expect(levelReason(root).hasAttribute('hidden')).toBe(true);

    selectSize(root, 8);
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

    pressSizeButton(root, 4);
    confirmYes(root);

    expect(boardSize(root), 'the board is still 6x6').toBe(6);
    expect(levelStates(root)).toEqual(['false', 'false', 'true', 'false']);
    expect(levelDisabled(root), 'no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(levelReason(root).hasAttribute('hidden'), 'the reason is hidden').toBe(true);
    expect(summaryText(root)).toBe('6×6 · Головоломка');
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Pressing the shown size changes nothing (FR-73, FR-97): the level scenarios
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-73 @trace FR-97 pressing the shown level changes nothing', () => {
  // the table of the scenario «The shown level is a no-op at every level»
  const ROWS = [
    { n: 6, level: 1 },
    { n: 6, level: 2 },
    { n: 6, level: 3 },
    { n: 8, level: 4 },
    { n: 4, level: 1 },
  ];

  it.each(ROWS)('The shown level is a no-op at every level (size $n, level $level), with entries and on an untouched board', ({ n, level }) => {
    // (1) with entries, a hint sentence, cell-hinted and cell-violation
    const { root, seeds, spy } = mountPlayedBoard(n, undefined, level);
    const sheet = sheetOf(root);
    const before = fullState(root);
    const cells = snapshot(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shown = showModalCalls();
    const hides = popoverCalls('hidePopover', sheet);
    expect(before.level, 'premise: the level shown is the level of the row').toBe(level);
    expect(before.size).toBe(n);
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(violationCells(root).length, 'premise: cells carry cell-violation').toBeGreaterThan(0);

    pressLevelButton(root, level);

    expect(showModalCalls(), 'no dialog').toBe(shown);
    expect(seeds.calls(), 'no seed').toBe(seedCalls);
    expect(spy.calls, 'no generator call').toHaveLength(generatorCalls);
    expect(snapshot(root), 'every cell keeps its text and class list').toEqual(cells);
    expect(fullState(root), 'both messages, both groups and the summary are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(popoverCalls('hidePopover', sheet) - hides, 'hidePopover was called once').toBe(1);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');

    // (2) a freshly prepared page of the same size and level with no player entries
    const seedsB = seedQueue([1, 2, 3, 4, 5]);
    const spyB = generateSpy(bySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 }));
    const page = mountPage({ seedSource: seedsB.source, generate: spyB.generate });
    if (n !== 6) selectSize(page, n);
    if (level !== 1) chooseLevel(page, level);
    const stateB = fullState(page);
    const cellsB = snapshot(page);
    const seedCallsB = seedsB.calls();
    const generatorCallsB = spyB.calls.length;
    const hidesB = popoverCalls('hidePopover', sheetOf(page));

    pressLevelButton(page, level);

    expect(showModalCalls()).toBe(shown);
    expect(seedsB.calls(), 'no seed on the untouched board').toBe(seedCallsB);
    expect(spyB.calls, 'no generator call on the untouched board').toHaveLength(generatorCallsB);
    expect(snapshot(page)).toEqual(cellsB);
    expect(fullState(page)).toEqual(stateB);
    expect(popoverCalls('hidePopover', sheetOf(page)) - hidesB, 'hidePopover was called once').toBe(1);
    expectActive(summaryButton(page), 'DOM focus is on the summary button');
    expect(sizeButton(page, n).getAttribute('aria-checked')).toBe('true');
  });

  it('With no board shown, a level button generates', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = rawGenerateSpy((i) => {
      if (i === 0) throw new Error('generator failed at mount');
      return BLANK;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(allCells(root), 'premise: no board is shown').toHaveLength(0);

    pressLevelButton(root, 2);

    expect(showModalCalls(), 'no dialog opens').toBe(0);
    expect(seeds.calls(), 'one seed is taken for the press (two in all)').toBe(2);
    expect(spy.calls.at(-1), 'the generator is called with size 6').toEqual({ size: 6, seed: 2 });
    expect(spy.levels.at(-1), 'and level 2').toBe(2);
    expect(boardSize(root), 'a 6x6 board is shown').toBe(6);
    expect(allCells(root)).toHaveLength(36);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
  });
});

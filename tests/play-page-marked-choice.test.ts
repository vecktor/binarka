// Play page: the marked choice of the setup sheet (FR-100) and pressing the shown size or level (FR-73). Scenarios of the delta spec
// openspec/changes/update-setup-sheet-start/specs/play-page/spec.md: the ADDED requirement «Marked choice» (six scenarios) and the
// MODIFIED requirement «Pressing the shown size changes nothing» (its name is kept, its behaviour is "a press only marks").
// Written FIRST (red): today a press on a size or level button starts a puzzle at once and closes the sheet.
//
// @trace FR-100
// @trace FR-73
// @trace FR-91
// @trace FR-43
// @trace FR-88
// @trace FR-101
// @trace FR-66
// @trace FR-97
//
// Where the tests of the earlier model lived (docs/qa/update-setup-sheet-start/changed-tests.md sections 5.3, 5.5, 6 and 8): the scenarios
// «The shown size is a no-op at every size» (size-control), «The shown level is a no-op at every level» (level-4x4) and «With no board
// shown, a size button generates» / «..., a level button generates» (size-control, level-4x4) are renamed in the delta; their tests are
// rewritten here for a marking press, with every earlier assertion kept (no dialog, no seed, no generator call, the board and the
// messages unchanged) and the old "the press closes the sheet and focuses the summary" lines turned into the new rule (the sheet stays
// open, the focus is not on the summary button).
//
// jsdom has no popover: the sheet is opened through the stubbed showPopover() (A-44), a marking press is a click on the option, the
// closing `toggle` is dispatched by the test (A-46). Reading note (A-47): with the sheet open and a choice marked, `aria-checked` is the
// MARKED choice, so a marking test compares snapshot, summary and board size for "the board is unchanged" and reads `checkedX` only for
// the marked state. Exact texts are literals; this file never imports src/ui/strings.ts.
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
  cellEl,
  checkedLevel,
  checkedSize,
  dispatchToggle,
  expectActive,
  fullState,
  generateSpy,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  levelButton,
  levelDisabled,
  levelReason,
  levelStates,
  markLevel,
  markSize,
  mountPage,
  mountPlayedBoard,
  openSheet,
  popoverCalls,
  popoverIsOpen,
  popoverLog,
  pressKey,
  pressStart,
  q,
  rawGenerateSpy,
  seedQueue,
  selectSize,
  chooseLevel,
  sheetCloseButton,
  showModalCalls,
  sizeButton,
  sizeButtons,
  snapshot,
  summaryButton,
  summaryText,
  violationCells,
  winMessage,
} from './helpers/play-page';
import type { PlayedPage } from './helpers/play-page';

installPageLifecycle();

const SIZE_STATES = (n: number): string[] => [4, 6, 8].map((size) => String(size === n));

/** What a marking test must see unchanged on the board shown: cells (text, given flag, classes), messages, highlights, summary, size. */
function boardFacts(root: HTMLElement): {
  cells: string[];
  size: number;
  hint: string;
  win: string;
  violations: [number, number][];
  hinted: [number, number][];
  summary: string;
} {
  return {
    cells: snapshot(root),
    size: boardSize(root),
    hint: hintMessage(root),
    win: winMessage(root),
    violations: violationCells(root),
    hinted: hintedCells(root),
    summary: summaryText(root),
  };
}

/** The counts that a marking press must not move: seeds, generator calls, dialogs and the popover method calls. */
function counts(page: PlayedPage): { seeds: number; generated: number; modals: number; popovers: number } {
  return { seeds: page.seeds.calls(), generated: page.spy.calls.length, modals: showModalCalls(), popovers: popoverLog.length };
}

// ---------------------------------------------------------------------------------------------------------
// Requirement: Marked choice (FR-100)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-100 the marked choice', () => {
  it('Marking changes only the marked choice', () => {
    const page = mountPlayedBoard(6);
    const { root } = page;
    const sheet = openSheet(root);
    const facts = boardFacts(root);
    expect(facts.hint, 'premise: a hint sentence is shown').not.toBe('');
    expect(facts.hinted, 'premise: a hint-filled cell with cell-hinted').toHaveLength(1);
    expect(facts.violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);
    expect(facts.summary, 'premise: the summary reads 6×6 · Розминка').toBe('6×6 · Розминка');
    const before = counts(page);
    const hides = popoverCalls('hidePopover', sheet);

    markSize(root, 8);
    markLevel(root, 4); // two marking presses, no «Почати»

    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'aria-checked is on «Поле 8×8» only').toEqual(SIZE_STATES(8));
    expect(levelStates(root), 'and on «Мозколамка» only').toEqual(['false', 'false', 'false', 'true']);
    expect(boardFacts(root), 'the board, the messages, the highlights, cell-hinted and the summary are unchanged').toEqual(facts);
    expect(boardSize(root)).toBe(6);
    expect(showModalCalls(), 'showModal was never called').toBe(before.modals);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(popoverIsOpen(sheet), "the sheet's stub state is open").toBe(true);
    expect(counts(page), 'the seed-source and generator call counts equal the counts read before').toMatchObject({
      seeds: before.seeds,
      generated: before.generated,
    });
  });

  it('The next opening shows the board shown', () => {
    const { root } = mountPlayedBoard(6);
    const sheet = openSheet(root);
    markSize(root, 8);
    markLevel(root, 4);
    expect(checkedSize(root), 'premise: «Поле 8×8» is marked').toBe(8);
    expect(checkedLevel(root), 'premise: «Мозколамка» is marked').toBe(4);
    expect(boardSize(root), 'premise: the marked choice is not a board').toBe(6);

    dispatchToggle(sheet, 'closed');
    openSheet(root);

    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'aria-checked is on «Поле 6×6» only').toEqual(SIZE_STATES(6));
    expect(levelStates(root), 'and on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(summaryText(root), 'the summary still reads 6×6 · Розминка').toBe('6×6 · Розминка');
  });

  it('Closing without «Почати» discards the marked choice by every route', () => {
    const ROUTES: { route: string; close: (root: HTMLElement) => void }[] = [
      { route: 'the close button «Закрити»', close: (root) => { sheetCloseButton(root).click(); } },
      {
        route: 'an Escape keydown on the sheet',
        close: (root) => {
          const escape = pressKey(q(root, '[data-section="setup"]'), 'Escape');
          expect(escape.defaultPrevented, 'the page adds no key handler (FR-59)').toBe(false);
        },
      },
      { route: 'a click outside the sheet (DOM focus on a non-given cell)', close: (root) => { cellEl(root, 6, 6).focus(); } },
    ];
    for (const { route, close } of ROUTES) {
      const page = mountPlayedBoard(6);
      const { root } = page;
      const sheet = openSheet(root);
      const facts = boardFacts(root);
      const before = counts(page);
      markSize(root, 8);
      markLevel(root, 4);

      close(root);
      dispatchToggle(sheet, 'closed');
      openSheet(root);

      expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), `${route}: aria-checked is on «Поле 6×6» only`).toEqual(SIZE_STATES(6));
      expect(levelStates(root), `${route}: and on «Розминка» only`).toEqual(['true', 'false', 'false', 'false']);
      expect(boardFacts(root), `${route}: the board, the messages, the highlights, cell-hinted and the summary are unchanged`).toEqual(facts);
      expect(page.seeds.calls(), `${route}: no seed was taken`).toBe(before.seeds);
      expect(page.spy.calls, `${route}: no generator call was made`).toHaveLength(before.generated);
      expect(showModalCalls(), `${route}: no dialog`).toBe(before.modals);
    }
  });

  it('Marking 4×4 sets the marked level to «Розминка»', () => {
    const seeds = seedQueue([1, 2, 3]);
    const root = mountPage({ seedSource: seeds.source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }) });
    openSheet(root);
    markLevel(root, 4);
    expect(levelStates(root), 'premise: «Мозколамка» is marked').toEqual(['false', 'false', 'false', 'true']);
    const seedCalls = seeds.calls();

    markSize(root, 4);

    expect(levelStates(root), 'after «Поле 4×4» «Розминка» only is checked').toEqual(['true', 'false', 'false', 'false']);
    expect(levelDisabled(root), '«Задачка», «Головоломка» and «Мозколамка» have aria-disabled="true"').toEqual([null, 'true', 'true', 'true']);
    expect(levelReason(root).hasAttribute('hidden'), '[data-level-reason] is shown').toBe(false);
    expect(levelReason(root).textContent).toBe(REASON_4X4);
    expect(summaryText(root), 'the summary still reads 6×6 · Розминка').toBe('6×6 · Розминка');

    markSize(root, 8);

    expect(levelStates(root), 'after «Поле 8×8» «Розминка» is still the only checked level (the earlier level is not restored)').toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    expect(levelDisabled(root), 'no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(levelReason(root).hasAttribute('hidden'), '[data-level-reason] is hidden').toBe(true);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
  });

  it('With no board shown the sheet opens on the mount values', () => {
    const spy = rawGenerateSpy(() => {
      throw new Error('generator failed at mount');
    });
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    expect(allCells(root), 'premise: no board is shown').toHaveLength(0);

    openSheet(root);

    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'aria-checked is on «Поле 6×6» only').toEqual(SIZE_STATES(6));
    expect(levelStates(root), 'and on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
  });

  it('The marked choice is not remembered', () => {
    localStorage.clear();
    sessionStorage.clear();
    expect(localStorage.length, 'premise: localStorage is empty').toBe(0);
    expect(sessionStorage.length, 'premise: sessionStorage is empty').toBe(0);
    const first = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });
    openSheet(first);
    markSize(first, 8);
    markLevel(first, 4); // without «Почати»
    expect(sizeButtons(first).map((b) => b.getAttribute('aria-checked')), 'premise: «Поле 8×8» is marked').toEqual(SIZE_STATES(8));
    expect(boardSize(first), 'premise: the marked choice is not a board').toBe(6);
    expect(summaryText(first), 'premise: the summary still reads the board shown').toBe('6×6 · Розминка');

    const spy = generateSpy(bySize({ 6: BLANK, 8: BLANK_8 }));
    const second = mountPage({ seedSource: seedQueue([3, 4]).source, generate: spy.generate });

    expect(boardSize(second), 'the new page shows a 6×6 board').toBe(6);
    expect(sizeButtons(second).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES(6));
    expect(levelStates(second), 'and «Розминка» is checked').toEqual(['true', 'false', 'false', 'false']);
    expect(spy.levels[0], 'its first generator call carried level 1').toBe(1);
    expect(localStorage.length, 'localStorage still holds no entry').toBe(0);
    expect(sessionStorage.length, 'sessionStorage still holds no entry').toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Pressing the shown size changes nothing (FR-73, FR-100; name kept, behaviour: a press only marks)
// ---------------------------------------------------------------------------------------------------------

const SIZES = [{ n: 4 }, { n: 6 }, { n: 8 }];

describe.each(SIZES)('@trace FR-73 @trace FR-66 @trace FR-100 the shown size only marks at size $n', ({ n }) => {
  // was `with entries, a hint sentence, cell-hinted and cell-violation: «Поле N×N» changes nothing` (size-control l.98)
  it(`The shown size only marks at every size: with entries, a hint sentence, cell-hinted and cell-violation, «Поле ${n}×${n}» changes nothing and the sheet stays open`, () => {
    const page = mountPlayedBoard(n);
    const { root } = page;
    const sheet = openSheet(root);
    const before = fullState(root); // the marked choice equals the board shown, so aria-checked of both groups is part of "unchanged"
    const facts = boardFacts(root);
    const counted = counts(page);
    const hides = popoverCalls('hidePopover', sheet);
    expect(checkedSize(root), 'premise: the size shown is the size pressed').toBe(n);
    expect(facts.hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(facts.violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);
    expect(facts.hint, 'premise: a hint sentence is shown').not.toBe('');

    const button = sizeButton(root, n);
    button.focus();
    button.click(); // a marking press on the size already shown

    expect(showModalCalls(), 'showModal was never called').toBe(counted.modals);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(page.seeds.calls(), 'no seed').toBe(counted.seeds);
    expect(page.spy.calls, 'no generator call').toHaveLength(counted.generated);
    expect(boardFacts(root), 'every cell (text and classes, cell-violation and cell-hinted included), both messages and the summary are unchanged').toEqual(facts);
    expect(fullState(root), 'and so is aria-checked of both groups').toEqual(before);
    expect(sizeButtons(root).filter((b) => b.getAttribute('aria-checked') === 'true'), 'aria-checked stays on that button only').toEqual([button]);
    expect(popoverIsOpen(sheet), "the sheet's stub state is still open").toBe(true);
    expect(document.activeElement, 'DOM focus is not on the summary button').not.toBe(summaryButton(root));
  });

  // was `on an untouched board: «Поле N×N» takes no seed, calls no generator and shows no dialog` (size-control l.127)
  it(`The shown size only marks at every size: on a freshly mounted page of the same size with no player entries, «Поле ${n}×${n}» takes no seed, calls no generator and shows no dialog`, () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW, 4: BLANK_4, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    if (n !== 6) selectSize(root, n); // reach size n the way a player does
    expect(boardSize(root)).toBe(n);
    const sheet = openSheet(root);
    const before = fullState(root);
    const facts = boardFacts(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const hides = popoverCalls('hidePopover', sheet);

    const button = sizeButton(root, n);
    button.focus();
    button.click();

    expect(showModalCalls()).toBe(0);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(boardFacts(root)).toEqual(facts);
    expect(fullState(root)).toEqual(before);
    expect(checkedSize(root)).toBe(n);
    expect(popoverIsOpen(sheet), "the sheet's stub state is still open").toBe(true);
    expect(document.activeElement, 'DOM focus is not on the summary button').not.toBe(summaryButton(root));
  });
});

describe('@trace FR-73 @trace FR-100 a size marked and then another size marked', () => {
  it('A size marked and then another size marked', () => {
    const page = mountPlayedBoard(6);
    const { root } = page;
    openSheet(root);
    const facts = boardFacts(root);
    const before = counts(page);

    markSize(root, 4);
    expect(checkedSize(root), 'after «Поле 4×4»').toBe(4);
    markSize(root, 8);
    expect(checkedSize(root), 'after «Поле 8×8»').toBe(8);
    const afterFirstEight = counts(page);
    const checkedBefore = sizeButtons(root).map((b) => b.getAttribute('aria-checked'));

    markSize(root, 8); // the second press of «Поле 8×8»

    expect(checkedSize(root), 'after the second «Поле 8×8»').toBe(8);
    expect(boardFacts(root), 'the board, the messages and the summary are unchanged').toEqual(facts);
    expect(page.seeds.calls(), 'no seed was taken').toBe(before.seeds);
    expect(page.spy.calls).toHaveLength(before.generated);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'the second press changed nothing at all: the same aria-checked').toEqual(checkedBefore);
    expect(counts(page), 'and called no spy').toEqual(afterFirstEight);
  });
});

describe('@trace FR-73 @trace FR-91 @trace FR-100 the shown level only marks', () => {
  // the table of the scenario «The shown level only marks at every level»
  const ROWS = [
    { n: 6, level: 1 },
    { n: 6, level: 2 },
    { n: 6, level: 3 },
    { n: 8, level: 4 },
    { n: 4, level: 1 },
  ];

  // was `The shown level is a no-op at every level (size $n, level $level), with entries and on an untouched board` (level-4x4 l.207)
  it.each(ROWS)('The shown level only marks at every level (size $n, level $level), with entries and on a freshly prepared page', ({ n, level }) => {
    // (1) with entries, a hint sentence, cell-hinted and cell-violation
    const page = mountPlayedBoard(n, undefined, level);
    const { root } = page;
    const sheet = openSheet(root);
    const before = fullState(root);
    const facts = boardFacts(root);
    const counted = counts(page);
    const hides = popoverCalls('hidePopover', sheet);
    expect(before.level, 'premise: the level shown is the level of the row').toBe(level);
    expect(before.size).toBe(n);
    expect(facts.hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(facts.violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);

    const button = levelButton(root, level);
    button.focus();
    button.click(); // a marking press on the level already shown

    expect(showModalCalls(), 'no dialog').toBe(counted.modals);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(page.seeds.calls(), 'no seed').toBe(counted.seeds);
    expect(page.spy.calls, 'no generator call').toHaveLength(counted.generated);
    expect(boardFacts(root), 'every cell (text and classes), both messages and the summary are unchanged').toEqual(facts);
    expect(fullState(root), 'and so is aria-checked of both groups').toEqual(before);
    expect(levelStates(root).filter((state) => state === 'true'), 'aria-checked stays on that level button only').toHaveLength(1);
    expect(checkedLevel(root)).toBe(level);
    expect(checkedSize(root), 'and on the size button of the row only').toBe(n);
    expect(popoverIsOpen(sheet), "the sheet's stub state is still open").toBe(true);

    // (2) a freshly prepared page of the same size and level with no player entries
    const seedsB = seedQueue([1, 2, 3, 4, 5]);
    const spyB = generateSpy(bySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 }));
    const fresh = mountPage({ seedSource: seedsB.source, generate: spyB.generate });
    if (n !== 6) selectSize(fresh, n);
    if (level !== 1) chooseLevel(fresh, level);
    const sheetB = openSheet(fresh);
    const stateB = fullState(fresh);
    const factsB = boardFacts(fresh);
    const seedCallsB = seedsB.calls();
    const generatorCallsB = spyB.calls.length;
    const hidesB = popoverCalls('hidePopover', sheetB);
    const modalsB = showModalCalls();

    levelButton(fresh, level).click();

    expect(showModalCalls(), 'no dialog on the untouched board').toBe(modalsB);
    expect(seedsB.calls(), 'no seed on the untouched board').toBe(seedCallsB);
    expect(spyB.calls, 'no generator call on the untouched board').toHaveLength(generatorCallsB);
    expect(popoverCalls('hidePopover', sheetB), 'hidePopover was never called').toBe(hidesB);
    expect(boardFacts(fresh)).toEqual(factsB);
    expect(fullState(fresh)).toEqual(stateB);
    expect(popoverIsOpen(sheetB), "the sheet's stub state is still open").toBe(true);
    expect(sizeButton(fresh, n).getAttribute('aria-checked')).toBe('true');
  });
});

describe('@trace FR-73 @trace FR-91 @trace FR-100 an unavailable level press does nothing at all', () => {
  it('An unavailable level press does nothing at all', () => {
    // (a) the marked size is 4×4: the sheet opened and «Поле 4×4» marked on a 6×6 board
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const sheet = openSheet(root);
    markSize(root, 4);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const modals = showModalCalls();
    const hides = popoverCalls('hidePopover', sheet);
    const logged = popoverLog.length;
    const unavailable = levelButton(root, 2);
    unavailable.focus();

    unavailable.click(); // «Задачка»

    expect(levelStates(root), 'aria-checked is still on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(checkedSize(root), 'and on «Поле 4×4» only').toBe(4);
    expect(popoverIsOpen(sheet), "the sheet's stub state is open").toBe(true);
    expectActive(unavailable, 'DOM focus is on the pressed button');
    expect(seeds.calls(), 'no seed').toBe(seedCalls);
    expect(spy.calls, 'no generator call').toHaveLength(generatorCalls);
    expect(showModalCalls(), 'no dialog').toBe(modals);
    expect(popoverCalls('hidePopover', sheet), 'no hidePopover').toBe(hides);
    expect(popoverLog, 'and no other popover call').toHaveLength(logged);

    // (b) a 4×4 board is shown
    const page = mountPlayedBoard(4);
    openSheet(page.root);
    const before = fullState(page.root);
    const counted = counts(page);
    const button = levelButton(page.root, 3);
    button.focus();

    button.click(); // «Головоломка»

    expect(fullState(page.root), 'nothing changed').toEqual(before);
    expect(counts(page), 'no spy was called').toEqual(counted);
    expectActive(button, 'DOM focus is on the pressed button');
  });
});

describe('@trace FR-73 @trace FR-101 @trace FR-100 with no board shown a press only marks and «Почати» generates', () => {
  // was `after a failed generation at mount, «Поле 6×6» generates a 6x6 board at once` (size-control l.171) and `With no board shown, a
  // level button generates` (level-4x4 l.258): two baseline names, one delta name
  it('With no board shown a press only marks and «Почати» generates', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = rawGenerateSpy((i) => {
      if (i === 0) throw new Error('generator failed at mount');
      return BLANK;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(allCells(root), 'premise: no board is shown').toHaveLength(0);
    expect(seeds.calls(), 'premise: the mount took one seed').toBe(1);
    openSheet(root);

    markSize(root, 6);
    markLevel(root, 2); // two marking presses

    expect(seeds.calls(), 'after the two presses no seed was taken').toBe(1);
    expect(spy.calls, 'and the generator was not called').toHaveLength(1);
    expect(checkedSize(root), 'aria-checked is on «Поле 6×6»').toBe(6);
    expect(checkedLevel(root), 'and on «Задачка»').toBe(2);
    expect(allCells(root), 'still no board').toHaveLength(0);

    pressStart(root);

    expect(showModalCalls(), 'after «Почати» no dialog opened').toBe(0);
    expect(seeds.calls(), 'one seed was taken').toBe(2);
    expect(spy.calls, 'the generator was called once more').toHaveLength(2);
    expect(spy.calls.at(-1), 'with size 6').toEqual({ size: 6, seed: 2 });
    expect(spy.levels.at(-1), 'and level 2').toBe(2);
    expect(boardSize(root), 'a 6×6 board is shown').toBe(6);
    expect(allCells(root)).toHaveLength(36);
    expect(summaryText(root), 'with the summary 6×6 · Задачка').toBe('6×6 · Задачка');
  });
});

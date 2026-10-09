// Play page: size and level interplay (FR-92), the confirmation rule for a level change (FR-90, FR-67), and the level scenarios
// added to "New puzzle button", "Reset button" and "Confirmation before discarding player entries". Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md. Written FIRST (red): the page has no level control.
//
// @trace FR-92
// @trace FR-42
// @trace FR-58
// @trace FR-90
// @trace FR-43
// @trace FR-67
// @trace FR-73
// @trace FR-100
// @trace FR-101
//
// update-setup-sheet-start: the pair (size, level) is marked first and started once by «Почати» (FR-100, FR-101); the choose helpers and
// markSize/markLevel + pressStart say so.
//
// The sheet is opened through the stubbed showPopover() by the helpers (A-44). The generator spies record the level in the
// parallel array `levels`. Exact texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  bySize,
  checkedLevel,
  checkedSize,
  checkerCells,
  chooseLevel,
  closeCalls,
  confirmNo,
  confirmYes,
  dialogEscape,
  dialogIsOpen,
  fillFrom,
  fullState,
  generateSpy,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  openSheet,
  levelDisabled,
  levelStates,
  mountPage,
  mountPlayedBoard,
  pageState,
  pressNew,
  pressReset,
  q,
  readBoard,
  seedQueue,
  selectSize,
  showModalCalls,
  sizeButtons,
  snapshot,
  solutionGrid,
  summaryText,
  violationCells,
  winMessage,
  markLevel,
  markSize,
  pressStart,
} from './helpers/play-page';
import type { PlayedPage } from './helpers/play-page';

installPageLifecycle();

/** A 6x6 page on the fixture generator (any level), with a counting seed source and a spy that records (size, seed, level). */
function plainPage(): { root: HTMLElement; seeds: ReturnType<typeof seedQueue>; spy: ReturnType<typeof generateSpy> } {
  const seeds = seedQueue([1, 2, 3, 4, 5, 6, 7, 8]);
  const spy = generateSpy(bySize({ 6: PAIR_ROW, 4: BLANK_4, 8: BLANK_8 }));
  const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
  return { root, seeds, spy };
}

const SIZE_STATES_6 = ['false', 'true', 'false'];

// ---------------------------------------------------------------------------------------------------------
// Requirement: Size and level interplay (FR-92)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-92 size and level interplay', () => {
  it('«Нова головоломка» keeps the level', () => {
    const { root, seeds, spy } = plainPage();
    chooseLevel(root, 3);
    const seedsBefore = seeds.calls();

    pressNew(root);

    expect(seeds.calls() - seedsBefore, 'one seed was taken').toBe(1);
    expect(spy.calls.at(-1), 'the last call is (6, seed)').toEqual({ size: 6, seed: seedsBefore + 1 });
    expect(spy.levels.at(-1), 'with level 3').toBe(3);
    expect(levelStates(root)).toEqual(['false', 'false', 'true', 'false']);
  });

  it('A size change to 6 or 8 keeps the level', () => {
    const { root, spy } = plainPage();
    chooseLevel(root, 4);
    const calls = spy.calls.length;

    selectSize(root, 8);
    expect(levelStates(root), 'after 8x8').toEqual(['false', 'false', 'false', 'true']);
    expect(summaryText(root)).toBe('8×8 · Мозколамка');
    selectSize(root, 6);
    expect(levelStates(root), 'after 6x6').toEqual(['false', 'false', 'false', 'true']);
    expect(summaryText(root)).toBe('6×6 · Мозколамка');

    expect(spy.calls.slice(calls).map((c) => c.size), 'the sizes of the calls after the mount').toEqual([8, 6]);
    expect(spy.levels.slice(calls), 'both calls carried level 4').toEqual([4, 4]);
  });

  it('A size change to 4 sets the level to 1 in one puzzle', () => {
    const { root, seeds, spy } = plainPage();
    chooseLevel(root, 3);
    const seedsBefore = seeds.calls();
    const callsBefore = spy.calls.length;

    selectSize(root, 4);

    expect(seeds.calls() - seedsBefore, 'the seed source was called once more').toBe(1);
    expect(spy.calls.length - callsBefore, 'the spy recorded exactly one more call').toBe(1);
    expect(spy.calls.at(-1)).toEqual({ size: 4, seed: seedsBefore + 1 });
    expect(spy.levels.at(-1), 'with level 1').toBe(1);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(levelStates(root)).toEqual(['true', 'false', 'false', 'false']);
    expect(levelDisabled(root)).toEqual([null, 'true', 'true', 'true']);
    expect(summaryText(root)).toBe('4×4 · Розминка');
  });

  it('One confirmation covers a size change to 4 and the level reset', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, undefined, 2);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shown = showModalCalls();
    expect(checkedLevel(root), 'premise: the level is «Задачка»').toBe(2);

    markSize(root, 4);
    pressStart(root);

    expect(showModalCalls() - shown, 'showModal was called once').toBe(1);
    expect(checkedSize(root), 'before the confirmation aria-checked is on «Поле 6×6»').toBe(6);
    expect(levelStates(root), 'and on «Задачка»').toEqual(['false', 'true', 'false', 'false']);
    expect(levelDisabled(root), 'no level button has aria-disabled yet').toEqual([null, null, null, null]);

    confirmYes(root);

    expect(showModalCalls() - shown, 'showModal was called exactly once in all').toBe(1);
    expect(boardSize(root)).toBe(4);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(levelStates(root)).toEqual(['true', 'false', 'false', 'false']);
    expect(seeds.calls() - seedCalls, 'exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'exactly one generator call was made').toBe(1);
  });

  it('Cancelling the size change keeps the level', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, undefined, 2);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    markSize(root, 4);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);

    confirmNo(root);

    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES_6);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
    expect(levelDisabled(root), 'no level button has aria-disabled').toEqual([null, null, null, null]);
    expect(summaryText(root)).toBe('6×6 · Задачка');
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made').toHaveLength(generatorCalls);
  });

  it('Going back from 4x4 keeps level 1', () => {
    const { root, spy } = plainPage();
    chooseLevel(root, 4);
    selectSize(root, 4);
    expect(boardSize(root), 'premise: a 4x4 board is shown').toBe(4);

    selectSize(root, 6);

    expect(boardSize(root)).toBe(6);
    expect(levelStates(root), 'aria-checked is on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(spy.levels.at(-1), 'the last generator call carried level 1').toBe(1);
  });

  it('A level change from 2 to 4 does not change the size', () => {
    const { root } = plainPage();
    chooseLevel(root, 2);

    chooseLevel(root, 4);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES_6);
    expect(levelStates(root)).toEqual(['false', 'false', 'false', 'true']);
  });

  // update-setup-sheet-start (FR-92, FR-100, FR-101): the new scenarios of «Size and level interplay»
  it('A size and a level marked together make one puzzle', () => {
    const { root, seeds, spy } = plainPage();
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    openSheet(root);

    markLevel(root, 4);
    markSize(root, 8);
    markSize(root, 6);
    markSize(root, 8); // four marking presses
    expect(seeds.calls(), 'the marking presses took no seed').toBe(seedCalls);
    expect(spy.calls, 'and made no generator call').toHaveLength(generatorCalls);
    pressStart(root);

    expect(seeds.calls() - seedCalls, 'the seed source was called once more').toBe(1);
    expect(spy.calls.length - generatorCalls, 'the spy recorded exactly one more call').toBe(1);
    expect(spy.calls.at(-1)).toEqual({ size: 8, seed: seedCalls + 1 });
    expect(spy.levels.at(-1), 'with level 4').toBe(4);
    expect(summaryText(root)).toBe('8×8 · Мозколамка');
  });

  it('One confirmation covers a size and a level marked together', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shown = showModalCalls();
    openSheet(root);
    markSize(root, 8);
    markLevel(root, 3);

    pressStart(root);

    expect(showModalCalls() - shown, 'showModal was called exactly once').toBe(1);
    expect(checkedSize(root), 'before the confirmation aria-checked is on «Поле 6×6»').toBe(6);
    expect(checkedLevel(root), 'and on «Розминка»').toBe(1);

    confirmYes(root);

    expect(showModalCalls() - shown, 'showModal was called exactly once in all').toBe(1);
    expect(boardSize(root)).toBe(8);
    openSheet(root);
    expect(checkedSize(root), 'after the sheet is opened again «Поле 8×8» is checked').toBe(8);
    expect(checkedLevel(root), 'and «Головоломка»').toBe(3);
    expect(seeds.calls() - seedCalls, 'exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'and one generator call').toBe(1);
    expect(spy.calls.at(-1)).toEqual({ size: 8, seed: seedCalls + 1 });
    expect(spy.levels.at(-1), 'with level 3').toBe(3);
  });

  it('Marking 4×4 and then 6×6 keeps «Розминка» and marks no board', () => {
    const { root, seeds } = plainPage();
    chooseLevel(root, 4); // a 6×6 board at «Мозколамка» without entries
    const seedCalls = seeds.calls();
    openSheet(root);

    markSize(root, 4);
    markSize(root, 6);

    expect(checkedSize(root), 'aria-checked is on «Поле 6×6» only').toBe(6);
    expect(checkedLevel(root), 'and on «Розминка» only').toBe(1);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: A level change follows the confirmation rule (FR-90, FR-67)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-90 @trace FR-67 a level change follows the confirmation rule', () => {
  it('A level change on an untouched board opens no dialog', () => {
    const { root, seeds, spy } = plainPage();
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markLevel(root, 4);
    pressStart(root);

    expect(showModalCalls(), 'showModal was never called').toBe(0);
    expect(seeds.calls() - seedCalls, 'one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'one generator call was made').toBe(1);
    expect(spy.levels.at(-1), 'with level 4').toBe(4);
  });

  // update-setup-sheet-start (FR-90, FR-100): a marking press asks nothing
  it('A level press alone asks nothing', () => {
    const { root } = mountPlayedBoard(6);
    const shown = showModalCalls();
    openSheet(root);

    markLevel(root, 2); // a marking press

    expect(showModalCalls(), 'showModal was never called').toBe(shown);
    expect(checkedLevel(root), 'aria-checked is on «Задачка» until the sheet closes').toBe(2);
  });

  it('A level change on a board with entries asks and changes nothing yet', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markLevel(root, 2);
    pressStart(root);

    expect(showModalCalls(), 'showModal was called once').toBe(1);
    expect(dialogIsOpen(root), 'the dialog has the open attribute').toBe(true);
    expect(fullState(root), 'every cell, the size, both messages and the summary are unchanged').toEqual(before);
    expect(levelStates(root)).toEqual(['true', 'false', 'false', 'false']);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES_6);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(seeds.calls(), 'the seed-source count equals the count read before').toBe(seedCalls);
    expect(spy.calls, 'the generator call count equals the count read before').toHaveLength(generatorCalls);
  });

  it.each([
    { name: '«Скасувати»', end: (root: HTMLElement): void => { confirmNo(root); } },
    { name: 'Escape', end: (root: HTMLElement): void => { dialogEscape(root); } },
  ])('$name drops the pending level', ({ end }) => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    markLevel(root, 2);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);

    end(root);

    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(levelStates(root), 'the level control still shows «Розминка»').toEqual(['true', 'false', 'false', 'false']);
    expect(fullState(root)).toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made').toHaveLength(generatorCalls);

    // choosing «Задачка» again opens the dialog a second time and «Так, почати» performs exactly one level change
    markLevel(root, 2);
    pressStart(root);
    expect(showModalCalls(), 'the dialog opened a second time').toBe(2);
    confirmYes(root);
    expect(seeds.calls() - seedCalls, 'exactly one level change (one seed)').toBe(1);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
  });

  it('«Так, почати» performs the level change after the dialog closed', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const closes = closeCalls();
    markLevel(root, 2);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);

    confirmYes(root);

    expect(closeCalls() - closes, 'the close spy was called once').toBe(1);
    expect(dialogIsOpen(root), 'the dialog has no open attribute').toBe(false);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent !== ''), 'no player entries').toEqual([]);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
    expect(seeds.calls() - seedCalls, 'exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'exactly one generator call was made').toBe(1);
    expect(spy.levels.at(-1), 'with level 2').toBe(2);
    expect(summaryText(root)).toBe('6×6 · Задачка');
  });
});

// ---------------------------------------------------------------------------------------------------------
// The level scenarios added to «New puzzle button» (FR-42, FR-92) and «Reset button» (FR-58, FR-92)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-42 @trace FR-92 «Нова головоломка» keeps the chosen level', () => {
  it('New puzzle keeps the chosen level', () => {
    const { root, seeds, spy } = plainPage();
    chooseLevel(root, 3);
    expect(checkedLevel(root), 'premise: the player chose «Головоломка»').toBe(3);
    const seedCalls = seeds.calls();

    pressNew(root);

    expect(showModalCalls(), 'the board has no entries: at once').toBe(0);
    expect(spy.calls.at(-1)?.size, 'the spy\'s last call has size 6').toBe(6);
    expect(spy.levels.at(-1), 'and level 3').toBe(3);
    expect(seeds.calls() - seedCalls).toBe(1);
    expect(levelStates(root)).toEqual(['false', 'false', 'true', 'false']);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES_6);
  });
});

describe('@trace FR-58 @trace FR-92 «Скинути» keeps the level', () => {
  // the table of the scenario «Reset keeps the level»
  const ROWS = [
    { n: 4, level: 1, name: '«Розминка» (the only level)' },
    { n: 6, level: 3, name: '«Головоломка»' },
    { n: 8, level: 4, name: '«Мозколамка»' },
  ];

  it.each(ROWS)('Reset keeps the level (size $n, $name)', ({ n, level }) => {
    const { root, seeds, spy } = mountPlayedBoard(n, undefined, level);
    const sizeStatesBefore = sizeButtons(root).map((b) => b.getAttribute('aria-checked'));
    const levelStatesBefore = levelStates(root);
    const summaryBefore = summaryText(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    expect(checkedLevel(root), 'premise: the level of the row is shown').toBe(level);

    pressReset(root);
    confirmYes(root);

    expect(levelStates(root)).toEqual(levelStatesBefore);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(sizeStatesBefore);
    expect(summaryText(root), 'the summary has the same text as before the reset').toBe(summaryBefore);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent !== ''), 'every non-given cell is empty').toEqual([]);
    expect(seeds.calls(), 'no seed was taken for the reset').toBe(seedCalls);
    expect(spy.calls, 'no generator call was made for the reset').toHaveLength(generatorCalls);
  });
});

// ---------------------------------------------------------------------------------------------------------
// The level rows of the tables of «Confirmation before discarding player entries» (FR-67, FR-90, FR-43)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-67 @trace FR-90 the level row of the confirmation tables', () => {
  it('No player entries means no dialog: the button «Задачка» acts at once (a 6x6 board of level 2 from the next seed)', () => {
    const { root, seeds, spy } = plainPage();
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markLevel(root, 2);
    pressStart(root);

    expect(showModalCalls(), 'the showModal spy was never called').toBe(0);
    expect(dialogIsOpen(root), 'the dialog has no open attribute').toBe(false);
    expect(boardSize(root)).toBe(6);
    expect(seeds.calls() - seedCalls, 'from the next seed').toBe(1);
    expect(spy.calls.length - generatorCalls).toBe(1);
    expect(spy.levels.at(-1), 'of level 2').toBe(2);
    expect(levelStates(root), 'aria-checked is on «Задачка»').toEqual(['false', 'true', 'false', 'false']);
  });

  it('A board with entries asks first and changes nothing yet: the button «Задачка» (the injected generator returns a 6x6 fixture)', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const before = pageState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markLevel(root, 2);
    pressStart(root);

    expect(showModalCalls(), 'showModal was called exactly once').toBe(1);
    expect(dialogIsOpen(root), 'the dialog has the open attribute').toBe(true);
    expect(pageState(root), 'every cell, the size and the messages are unchanged').toEqual(before);
    expect(levelStates(root), 'aria-checked stays on «Розминка»').toEqual(['true', 'false', 'false', 'false']);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(SIZE_STATES_6);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(seeds.calls(), 'the seed-source count equals the count read before the press').toBe(seedCalls);
    expect(spy.calls, 'the generator call count equals the count read before the press').toHaveLength(generatorCalls);
  });

  it('«Так, почати» closes the dialog and then performs the action: «Задачка» (one seed, one generator call with level 2, the summary reads 6×6 · Задачка)', () => {
    const { root, seeds, spy }: PlayedPage = mountPlayedBoard(6);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    markLevel(root, 2);
    pressStart(root);

    confirmYes(root);

    expect(closeCalls(), 'the close spy was called once').toBe(1);
    expect(dialogIsOpen(root)).toBe(false);
    expect(boardSize(root)).toBe(6);
    expect(seeds.calls() - seedCalls, 'one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'one generator call').toBe(1);
    expect(spy.levels.at(-1), 'with level 2').toBe(2);
    expect(levelStates(root), 'aria-checked is on «Задачка» only').toEqual(['false', 'true', 'false', 'false']);
    expect(summaryText(root)).toBe('6×6 · Задачка');
    expect(hintMessage(root)).toBe('');
    expect(winMessage(root)).toBe('');
    expect(hintedCells(root), 'no cell has cell-hinted').toEqual([]);
    expect(violationCells(root), 'the cell-violation cells are exactly those the rule checker reports').toEqual(checkerCells(readBoard(root)));
  });

  it('«Скасувати» leaves everything unchanged: «Задачка»', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const before = fullState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const cells = snapshot(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    markLevel(root, 2);
    pressStart(root);

    confirmNo(root);

    expect(closeCalls(), 'the close spy was called once').toBe(1);
    expect(dialogIsOpen(root)).toBe(false);
    expect(snapshot(root)).toEqual(cells);
    expect(fullState(root)).toEqual(before);
    expect(levelStates(root), 'aria-checked stays on «Розминка»').toEqual(['true', 'false', 'false', 'false']);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(showModalCalls(), 'showModal was called exactly once in all').toBe(1);
  });

  it('A solved board still asks (A-29): the button of another level opens the dialog; board and win message are unchanged until «Так, почати»', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy(bySize({ 6: WIN_PUZZLE }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root), 'premise: solved').toBe(WIN_MESSAGE);
    const before = fullState(root);

    markLevel(root, 2);
    pressStart(root);

    expect(showModalCalls()).toBe(1);
    expect(dialogIsOpen(root)).toBe(true);
    expect(fullState(root)).toEqual(before);
    expect(winMessage(root)).toBe(WIN_MESSAGE);

    confirmYes(root);

    expect(winMessage(root), 'after the confirmation the win message is gone').toBe('');
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
  });
});

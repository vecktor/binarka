// Play page: the start button «Почати» of the setup sheet (FR-101). Scenarios of the delta spec
// openspec/changes/update-setup-sheet-start/specs/play-page/spec.md, ADDED requirement «Start button» (ten scenarios; tasks.md 2.2
// says nine, the audit finding S1 added the tenth: a failed «Почати» with no board shown). Written FIRST (red): the sheet has no
// «Почати» yet, and a press on a size or level button still starts a puzzle at once.
//
// @trace FR-101
// @trace FR-100
// @trace FR-67
// @trace FR-88
// @trace FR-94
// @trace FR-98
// @trace FR-97
//
// jsdom has no popover and no dialog methods: tests/helpers/play-page.ts installs the stubs (A-44). The sheet is opened through the
// stubbed showPopover(); the marks are clicks on the options (markSize, markLevel); «Почати» is `pressStart`. A generator that
// "throws" throws an ordinary Error (the reading rule of «Setup sheet»). Exact texts are literals; this file never imports strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  START_LABEL,
  allCells,
  boardSize,
  bySize,
  callOrder,
  checkedLevel,
  checkedSize,
  collectPageText,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  expectActive,
  expectInDocumentOrder,
  generateSpy,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  levelControl,
  markLevel,
  markSize,
  mountFixture,
  mountPage,
  mountPlayedBoard,
  openSheet,
  popoverCalls,
  popoverIsOpen,
  pressHint,
  pressNew,
  pressStart,
  q,
  rawGenerateSpy,
  seedQueue,
  selectSize,
  sheetCloseButton,
  sheetOf,
  sheetStartButton,
  showModalCalls,
  sizeButton,
  snapshot,
  summaryButton,
  summaryText,
  trackErrors,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const START = '[data-action="setup-start"]';

/** The assertions of the scenario «Start button structure at mount»; `what` names the state of the page for the failure message. */
function expectStartStructure(root: HTMLElement, what: string): void {
  const sheet = sheetOf(root);
  const matches = sheet.querySelectorAll(START);
  expect(matches, `${what}: exactly one [data-action="setup-start"] in the sheet`).toHaveLength(1);
  const start = sheetStartButton(root);
  expect(start.parentElement, `${what}: a direct child of the sheet`).toBe(sheet);
  expect(start.tagName, `${what}: a button`).toBe('BUTTON');
  expect(start.getAttribute('type'), `${what}: type="button"`).toBe('button');
  expect(start.textContent, `${what}: the text «Почати»`).toBe(START_LABEL);
  for (const name of ['aria-label', 'aria-labelledby', 'tabindex', 'disabled']) {
    expect(start.hasAttribute(name), `${what}: no ${name} attribute`).toBe(false);
  }
  expectInDocumentOrder([levelControl(root), start, sheetCloseButton(root)]); // it follows the level control and precedes «Закрити»
  expect(start.previousElementSibling, `${what}: right after the level control`).toBe(levelControl(root));
  expect(start.nextElementSibling, `${what}: right before the close button`).toBe(sheetCloseButton(root));
}

describe('@trace FR-101 @trace FR-94 the start button at mount', () => {
  it('Start button structure at mount', () => {
    expectStartStructure(mountFixture(BLANK), 'at mount');

    // it keeps these attributes at 4×4 ...
    const at4 = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    selectSize(at4, 4);
    expect(boardSize(at4), 'premise: a 4×4 board is shown').toBe(4);
    expectStartStructure(at4, 'at 4×4');

    // ... and after the generation at the mount failed
    const failed = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: () => {
        throw new Error('generator failed at mount');
      },
    });
    expect(allCells(failed), 'premise: no board is shown').toHaveLength(0);
    expectStartStructure(failed, 'after a failed mount');
  });
});

describe('@trace FR-101 @trace FR-100 «Почати» makes the puzzle of the marked choice', () => {
  it('«Почати» makes one puzzle with both marked values', () => {
    const seeds = seedQueue([1, 2, 3, 4]);
    const spy = generateSpy(bySize({ 6: BLANK, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    pressHint(root); // a hint sentence is shown; the empty board gives a hint that fills nothing, so the board still has no entries
    expect(hintMessage(root), 'premise: a hint sentence is shown').not.toBe('');
    expect(hintedCells(root), 'premise: the hint filled no cell').toEqual([]);
    const sheet = openSheet(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markLevel(root, 4);
    markSize(root, 8); // two marking presses
    pressStart(root);

    expect(seeds.calls() - seedCalls, 'exactly one more seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'the spy recorded exactly one more call').toBe(1);
    expect(spy.calls.at(-1), 'the seed is the second one').toEqual({ size: 8, seed: 2 });
    expect(spy.levels.at(-1), 'and the level is 4: (8, 2, 4)').toBe(4);
    expect(showModalCalls(), 'showModal was never called').toBe(0);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was called once on the sheet').toBe(1);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(summaryText(root)).toBe('8×8 · Мозколамка');
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expect(hintMessage(root), 'the hint message is empty').toBe('');
    expect(winMessage(root), 'the win message is empty').toBe('');
  });

  it('The order of the two marks does not matter', () => {
    const results = [0, 1].map((run) => {
      const seeds = seedQueue([1, 2, 3, 4]);
      const spy = generateSpy(bySize({ 6: BLANK, 8: BLANK_8 }));
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      openSheet(root);
      if (run === 0) {
        markSize(root, 8);
        markLevel(root, 4);
      } else {
        markLevel(root, 4);
        markSize(root, 8);
      }
      pressStart(root);
      return { calls: spy.calls.slice(1), levels: spy.levels.slice(1), summary: summaryText(root) };
    });
    for (const [run, result] of results.entries()) {
      expect(result.calls, `page ${run + 1}: the generator was called once for the change, with (8, seed)`).toEqual([{ size: 8, seed: 2 }]);
      expect(result.levels, `page ${run + 1}: with level 4`).toEqual([4]);
      expect(result.summary, `page ${run + 1}`).toBe('8×8 · Мозколамка');
    }
  });

  it('«Почати» with the marked choice equal to the board shown still makes a puzzle', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: BLANK }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const sheet = openSheet(root); // nothing marked
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    pressStart(root);

    expect(seeds.calls() - seedCalls, 'one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'the spy recorded one more call').toBe(1);
    expect(spy.calls.at(-1)).toEqual({ size: 6, seed: seedCalls + 1 });
    expect(spy.levels.at(-1), '(6, seed, 1)').toBe(1);
    expect(popoverIsOpen(sheet), 'the sheet is closed').toBe(false);
    expect(summaryText(root)).toBe('6×6 · Розминка');
    expect(showModalCalls(), 'showModal was never called').toBe(0);
  });
});

describe('@trace FR-101 @trace FR-67 @trace FR-98 «Почати» on a board with entries', () => {
  it('«Почати» on a board with entries asks first', () => {
    const page = mountPlayedBoard(6);
    const { root, seeds, spy } = page;
    const sheet = openSheet(root);
    const cells = snapshot(root);
    const hint = hintMessage(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const modals = showModalCalls();
    const hides = popoverCalls('hidePopover', sheet);
    expect(hint, 'premise: a hint sentence is shown').not.toBe('');
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    markSize(root, 8);
    markLevel(root, 3);

    pressStart(root);

    expect(popoverCalls('hidePopover', sheet) - hides, 'hidePopover was called once').toBe(1);
    expect(showModalCalls() - modals, 'and then showModal was called once').toBe(1);
    expect(callOrder.lastIndexOf('hidePopover'), 'hidePopover came before showModal').toBeLessThan(callOrder.lastIndexOf('showModal'));
    expect(popoverIsOpen(sheet), "the sheet's stub state is closed").toBe(false);
    expect(dialogIsOpen(root), 'the dialog has the open attribute').toBe(true);
    expectActive(q(root, '[data-confirm="no"]'), 'the focused element is «Скасувати»');
    expect(boardSize(root), 'the board is still 6×6').toBe(6);
    expect(snapshot(root), 'with the same cell texts').toEqual(cells);
    expect(summaryText(root)).toBe('6×6 · Розминка');
    expect(checkedSize(root), 'aria-checked is on «Поле 6×6»').toBe(6);
    expect(checkedLevel(root), 'and on «Розминка»').toBe(1);
    expect(hintMessage(root), 'the hint message is unchanged').toBe(hint);
    expect(hintedCells(root), 'and so is cell-hinted').toEqual(hinted);
    expect(seeds.calls(), 'the seed-source count equals the count read before').toBe(seedCalls);
    expect(spy.calls, 'and the generator count too').toHaveLength(generatorCalls);

    confirmYes(root);

    expect(seeds.calls() - seedCalls, 'after «Так, почати» exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'and one generator call was made').toBe(1);
    expect(spy.calls.at(-1)).toEqual({ size: 8, seed: seedCalls + 1 });
    expect(spy.levels.at(-1), '(8, seed, 3)').toBe(3);
    expect(summaryText(root)).toBe('8×8 · Головоломка');
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
  });

  it('A cancelled confirmation drops the marked pair', () => {
    const page = mountPlayedBoard(6);
    const { root, seeds, spy } = page;
    const sheet = openSheet(root);
    markSize(root, 8);
    markLevel(root, 3);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the dialog is open').toBe(true);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shows = popoverCalls('showPopover', sheet);

    confirmNo(root);

    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(popoverIsOpen(sheet), "the sheet's stub state is closed").toBe(false);
    expect(popoverCalls('showPopover', sheet), 'showPopover was not called again').toBe(shows);
    expect(seeds.calls(), 'no seed was taken').toBe(seedCalls);
    expect(spy.calls, 'and no generator call was made').toHaveLength(generatorCalls);

    pressNew(root);
    confirmYes(root);

    expect(spy.calls.at(-1), "the spy's last call is (6, seed, 1)").toEqual({ size: 6, seed: seedCalls + 1 });
    expect(spy.levels.at(-1), 'level 1').toBe(1);
    expect(spy.calls.some((c, i) => c.size === 8 && i >= generatorCalls), 'so the dropped pair (8, 3) was never performed later').toBe(false);
  });
});

describe('@trace FR-101 @trace FR-88 @trace FR-97 a failed «Почати»', () => {
  it('A failed generation after «Почати» keeps everything', () => {
    const spy = rawGenerateSpy((_i, size) => {
      if (size === 8) throw new Error('generator failed for size 8');
      return BLANK;
    });
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    pressHint(root); // a hint sentence; the empty board fills nothing, so the board has no entries and «Почати» acts at once
    const hint = hintMessage(root);
    expect(hint, 'premise: a hint sentence is shown').not.toBe('');
    const cells = snapshot(root);
    const textBefore = collectPageText(root);
    const sheet = openSheet(root);
    markSize(root, 8);
    const tracker = trackErrors();
    try {
      pressStart(root);
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'the error listener recorded nothing').toEqual([]);
    expect(popoverIsOpen(sheet), "the sheet's stub state is closed").toBe(false);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(q(root, '[data-board]').getAttribute('data-size'), '[data-board] keeps data-size 6').toBe('6');
    expect(snapshot(root), 'with the same cell texts').toEqual(cells);
    expect(hintMessage(root), 'the hint message keeps its text').toBe(hint);
    expect(summaryText(root)).toBe('6×6 · Розминка');
    expect(collectPageText(root), 'no text was added to the page').toEqual(textBefore);
    openSheet(root);
    expect(checkedSize(root), 'when the sheet is opened again aria-checked is on «Поле 6×6» only').toBe(6);
    expect(sizeButton(root, 8).getAttribute('aria-checked')).toBe('false');
  });
});

describe('@trace FR-101 @trace FR-100 @trace FR-88 «Почати» with no board shown', () => {
  it('With no board shown «Почати» generates at once', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = rawGenerateSpy((i) => {
      if (i === 0) throw new Error('generator failed at mount');
      return BLANK;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(allCells(root), 'premise: no board is shown').toHaveLength(0);
    openSheet(root);
    markLevel(root, 2);

    pressStart(root);

    expect(showModalCalls(), 'no dialog opens').toBe(0);
    expect(seeds.calls(), 'one seed is taken (two in all)').toBe(2);
    expect(spy.calls, 'the generator is called once more').toHaveLength(2);
    expect(spy.calls.at(-1), 'with size 6').toEqual({ size: 6, seed: 2 });
    expect(spy.levels.at(-1), 'and level 2').toBe(2);
    expect(boardSize(root), 'a 6×6 board is shown').toBe(6);
    expect(summaryText(root)).toBe('6×6 · Задачка');
  });

  it('With no board shown a failed «Почати» leaves the mount values', () => {
    const spy = rawGenerateSpy(() => {
      throw new Error('generator failed on every call');
    });
    const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4]).source, generate: spy.generate });
    expect(allCells(root), 'premise: no board is shown').toHaveLength(0);
    const textBefore = collectPageText(root);
    const sheet = openSheet(root);
    markSize(root, 8);
    markLevel(root, 4);
    const tracker = trackErrors();
    try {
      pressStart(root);
    } finally {
      tracker.stop();
    }

    expect(popoverIsOpen(sheet), "the sheet's stub state is closed").toBe(false);
    expectActive(summaryButton(root), 'DOM focus is on the summary button');
    expect(allCells(root), 'no [data-cell] exists').toHaveLength(0);
    expect(collectPageText(root), 'no text was added to the page').toEqual(textBefore);
    expect(tracker.errors, 'the error listener recorded nothing').toEqual([]);
    openSheet(root);
    expect(checkedSize(root), 'when the sheet is opened again aria-checked is on «Поле 6×6» only').toBe(6);
    expect(checkedLevel(root), 'and on «Розминка» only').toBe(1);
  });
});

describe('@trace FR-101 @trace FR-96 «Почати» in the tab order of the sheet', () => {
  it('«Почати» is a Tab stop inside the sheet in document order', () => {
    const root = mountFixture(BLANK);
    const buttons = Array.from(sheetOf(root).querySelectorAll('button'));

    expect(
      buttons.map((b) => b.getAttribute('role') ?? b.getAttribute('data-action')),
      'the three size buttons, the four level buttons, «Почати» and «Закрити», in this order',
    ).toEqual(['radio', 'radio', 'radio', 'radio', 'radio', 'radio', 'radio', 'setup-start', 'setup-close']);
    expect(buttons.slice(0, 3).map((b) => b.textContent), 'the first three are the size buttons').toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect(buttons.at(-2)?.textContent).toBe(START_LABEL);
    expect(buttons.at(-1)?.textContent).toBe('Закрити');
    for (const button of buttons) expect(button.hasAttribute('tabindex'), `${button.textContent} has no tabindex`).toBe(false);
  });
});

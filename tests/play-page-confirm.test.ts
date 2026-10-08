// Play page: the confirmation before discarding player entries (FR-67). Scenarios of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Confirmation before discarding player entries").
// Written FIRST (red): the page has no dialog yet.
// jsdom has no showModal/close: tests/helpers/play-page.ts installs counted stubs (showModal sets `open`, close removes it) and
// removes them after each test. Escape is simulated by `dialogEscape` (cancel, the `open` attribute goes, close).
// The size button is found by position and text. Exact texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK_4,
  BLANK_8,
  HINT_BREAKS,
  PAIR_ROW,
  TWO_PAIRS,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  bySize,
  cellText,
  checkedSize,
  checkerCells,
  clickCell,
  closeCalls,
  confirmNo,
  confirmYes,
  dialogEscape,
  dialogIsOpen,
  dialogLateClose,
  dialogLog,
  dialogOf,
  expectInDocumentOrder,
  fillFrom,
  generateSpy,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  messageArea,
  mountPage,
  mountPlayedBoard,
  onDialogClose,
  pageState,
  pressHint,
  pressNew,
  pressReset,
  pressSizeButton,
  q,
  readBoard,
  rulesPanel,
  seedQueue,
  showModalCalls,
  snapshot,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';
import type { PlayedPage } from './helpers/play-page';

installPageLifecycle();

const CONFIRM_TEXT = 'Почати заново? Ваші ходи на цьому полі буде втрачено.';

/** The three actions of the spec's tables, as the player presses them (no confirmation given). */
const ACTIONS: Array<{ name: string; press: (root: HTMLElement) => void }> = [
  { name: '«Нова головоломка»', press: pressNew },
  { name: '«Поле 8×8»', press: (root) => pressSizeButton(root, 8) },
  { name: '«Скинути»', press: pressReset },
];

describe('@trace FR-67 the dialog at mount', () => {
  it('The dialog at mount: one closed dialog after the rules panel, outside the board, the header and the messages, with its text and two buttons', () => {
    const root = mountPage({ seedSource: () => 1, generate: () => PAIR_ROW });
    expect(root.querySelectorAll('[data-dialog="confirm"]'), 'exactly one dialog').toHaveLength(1);
    const dialog = dialogOf(root);
    expect(root.contains(dialog), 'inside the page root').toBe(true);
    expect(dialog.hasAttribute('open'), 'closed at mount').toBe(false);
    expect(q(root, '[data-board]').contains(dialog)).toBe(false);
    expect(q(root, 'header').contains(dialog)).toBe(false);
    expect(messageArea(root).contains(dialog)).toBe(false);
    expect(rulesPanel(root).contains(dialog)).toBe(false);
    expectInDocumentOrder([rulesPanel(root), dialog]); // it follows the rules panel
    expect(dialog.textContent).toContain(CONFIRM_TEXT);
    const buttons = Array.from(dialog.querySelectorAll('button'));
    expect(buttons, 'exactly two buttons').toHaveLength(2);
    for (const button of buttons) expect(button.getAttribute('type')).toBe('button');
    const yes = q(dialog, '[data-confirm="yes"]');
    const no = q(dialog, '[data-confirm="no"]');
    expect(yes.tagName).toBe('BUTTON');
    expect(no.tagName).toBe('BUTTON');
    expect(yes.textContent).toBe('Так, почати');
    expect(no.textContent).toBe('Скасувати');
    expect(buttons).toEqual([yes, no]);
    expect(showModalCalls()).toBe(0);
  });
});

// Added in review fix round 1 of update-controls-accessibility (wf_c621c8e9-bc8; the user chose the safe focus,
// 2026-10-06). Scenario "The dialog is named by its question and opens on «Скасувати»".
describe('@trace FR-67 the dialog is named by its question and opens on «Скасувати»', () => {
  it('aria-labelledby names the question inside the dialog, unique per mount; opening moves focus to «Скасувати»', () => {
    const root = mountPage({ seedSource: () => 1, generate: () => PAIR_ROW });
    const other = mountPage({ seedSource: () => 2, generate: () => PAIR_ROW });
    const dialog = dialogOf(root);
    const labelId = dialog.getAttribute('aria-labelledby') ?? '';
    expect(labelId, 'aria-labelledby is set').not.toBe('');
    const label = document.getElementById(labelId);
    expect(label !== null && dialog.contains(label), 'the label is inside the dialog').toBe(true);
    expect(label?.textContent).toBe(CONFIRM_TEXT);
    expect(dialogOf(other).getAttribute('aria-labelledby'), 'two mounts, two ids').not.toBe(labelId);

    clickCell(root, 1, 1);
    q(root, '[data-action="new"]').click();
    expect(dialogIsOpen(root)).toBe(true);
    expect(document.activeElement, 'focus is on «Скасувати»').toBe(q(dialog, '[data-confirm="no"]'));
  });
});

describe('@trace FR-67 @trace FR-42 @trace FR-43 @trace FR-58 no player entries means no dialog', () => {
  it('table: «Нова головоломка», «Поле 4×4» and «Скинути» act at once on a board with only givens', () => {
    // «Нова головоломка»
    {
      const seeds = seedQueue([1, 2]);
      const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : TWO_PAIRS));
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      expect(readBoard(root)).toEqual(PAIR_ROW.givens);

      pressNew(root);

      expect(showModalCalls(), 'new: showModal never called').toBe(0);
      expect(dialogIsOpen(root)).toBe(false);
      expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 6, seed: 2 }]);
      expect(seeds.calls()).toBe(2);
      expect(readBoard(root), 'a new puzzle of size 6 from the next seed').toEqual(TWO_PAIRS.givens);
    }
    // «Поле 4×4»
    {
      const seeds = seedQueue([1, 2]);
      const spy = generateSpy(bySize({ 6: PAIR_ROW, 4: BLANK_4 }));
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });

      pressSizeButton(root, 4);

      expect(showModalCalls(), 'size: showModal never called').toBe(0);
      expect(dialogIsOpen(root)).toBe(false);
      expect(boardSize(root)).toBe(4);
      expect(allCells(root)).toHaveLength(16);
      expect(checkedSize(root)).toBe(4);
      expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 4, seed: 2 }]);
      expect(seeds.calls()).toBe(2);
    }
    // «Скинути»
    {
      const seeds = seedQueue([1, 2]);
      const spy = generateSpy(() => PAIR_ROW);
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      const before = pageState(root);

      pressReset(root);

      expect(showModalCalls(), 'reset: showModal never called').toBe(0);
      expect(dialogIsOpen(root)).toBe(false);
      expect(pageState(root), 'no cell, class or message changes').toEqual(before);
      expect(seeds.calls()).toBe(1);
      expect(spy.calls).toHaveLength(1);
    }
  });
});

describe('@trace FR-67 @trace FR-66 @trace FR-42 @trace FR-43 @trace FR-58 a board with entries asks first and changes nothing yet', () => {
  it.each(ACTIONS)('$name: showModal once, the dialog is open, board, size, messages, highlights and cell-hinted unchanged, no seed, no generator call', ({ press }) => {
    const { root, seeds, spy } = mountPlayedBoard();
    const before = pageState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    expect(hinted, 'premise: one hint-filled cell').toHaveLength(1);
    expect(violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);
    expect(before.hint, 'premise: a hint sentence is shown').not.toBe('');

    press(root);

    expect(showModalCalls()).toBe(1);
    expect(dialogIsOpen(root)).toBe(true);
    expect(pageState(root)).toEqual(before);
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(hintMessage(root)).toBe(before.hint);
    expect(winMessage(root)).toBe(before.win);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
  });
});

describe('@trace FR-67 @trace FR-66 @trace FR-42 @trace FR-43 @trace FR-58 «Так, почати» closes the dialog and then performs the action', () => {
  it.each(ACTIONS)('$name: close() runs once and BEFORE the action; then the effect of the row, both messages empty, no cell-hinted', ({ name, press }) => {
    const { root, seeds, spy }: PlayedPage = mountPlayedBoard();
    const stateBefore = pageState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    // the page as it is the moment close() is called: the action must not have run yet
    let atClose: ReturnType<typeof pageState> | null = null;
    const callsAtClose: number[] = [];
    onDialogClose(() => {
      atClose = pageState(root);
      callsAtClose.push(seeds.calls(), spy.calls.length);
    });

    press(root);
    expect(dialogLog).toEqual(['showModal']);
    confirmYes(root);

    expect(closeCalls()).toBe(1);
    expect(dialogLog).toEqual(['showModal', 'close']);
    expect(dialogIsOpen(root)).toBe(false);
    expect(atClose, `close() was called before ${name} was performed: the board was still the old one`).toEqual(stateBefore);
    expect(callsAtClose, 'no seed and no generator call had happened when close() ran').toEqual([seedCalls, generatorCalls]);
    // the effect of the row
    if (name === '«Нова головоломка»') {
      expect(boardSize(root)).toBe(6);
      expect(seeds.calls() - seedCalls).toBe(1);
      expect(spy.calls.slice(generatorCalls)).toEqual([{ size: 6, seed: seedCalls + 1 }]);
      expect(readBoard(root), 'the generated board, no player entries').toEqual(PAIR_ROW.givens);
      expect(checkedSize(root)).toBe(6);
    } else if (name === '«Поле 8×8»') {
      expect(boardSize(root)).toBe(8);
      expect(allCells(root)).toHaveLength(64);
      expect(checkedSize(root)).toBe(8);
      expect(root.querySelectorAll('[data-control="size"] [aria-checked="true"]')).toHaveLength(1);
      expect(seeds.calls() - seedCalls).toBe(1);
      expect(spy.calls.slice(generatorCalls)).toEqual([{ size: 8, seed: seedCalls + 1 }]);
      expect(readBoard(root)).toEqual(BLANK_8.givens);
    } else {
      expect(boardSize(root)).toBe(6);
      expect(readBoard(root), 'every non-given cell empty, every given kept').toEqual(HINT_BREAKS.givens);
      expect(seeds.calls()).toBe(seedCalls);
      expect(spy.calls).toHaveLength(generatorCalls);
      expect(checkedSize(root)).toBe(6);
    }
    expect(hintMessage(root)).toBe('');
    expect(winMessage(root)).toBe('');
    expect(hintedCells(root)).toEqual([]);
    expect(violationCells(root), 'the highlights are exactly those the rule checker reports for the board shown').toEqual(checkerCells(readBoard(root)));
  });

  it('«Скинути»: the givens of the board are kept and every other cell is empty (the pure givens grid)', () => {
    const { root } = mountPlayedBoard();

    pressReset(root);
    confirmYes(root);

    expect(readBoard(root), 'the pure givens grid').toEqual(HINT_BREAKS.givens);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(4);
    expect(cellText(root, 1, 1)).toBe('1');
    expect(cellText(root, 1, 2)).toBe('1');
    expect(cellText(root, 2, 3)).toBe('0');
    expect(cellText(root, 3, 3)).toBe('0');
    expect(cellText(root, 1, 3), 'the hint-filled cell is empty again').toBe('');
    expect(cellText(root, 6, 6), 'the player entry is gone').toBe('');
  });

  it('the late `close` event that a browser fires after close() neither undoes nor repeats the confirmed action', () => {
    const { root, seeds, spy } = mountPlayedBoard();
    pressNew(root);
    confirmYes(root);
    const afterConfirm = pageState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    expect(readBoard(root)).toEqual(PAIR_ROW.givens);

    dialogLateClose(root);

    expect(pageState(root)).toEqual(afterConfirm);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    // and the page still works: a new request on a board with entries asks again and performs once
    clickCell(root, 1, 1);
    pressNew(root);
    expect(dialogIsOpen(root)).toBe(true);
    confirmYes(root);
    expect(seeds.calls()).toBe(seedCalls + 1);
  });
});

describe('@trace FR-67 @trace FR-66 @trace FR-42 @trace FR-43 @trace FR-58 «Скасувати» leaves everything unchanged', () => {
  it.each(ACTIONS)('$name then «Скасувати»: close() once, dialog closed, state as before, no seed, no generator call, showModal once in all', ({ press }) => {
    const { root, seeds, spy } = mountPlayedBoard();
    const before = pageState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    press(root);
    expect(dialogIsOpen(root)).toBe(true);
    confirmNo(root);

    expect(closeCalls()).toBe(1);
    expect(dialogIsOpen(root)).toBe(false);
    expect(pageState(root)).toEqual(before);
    expect(checkedSize(root)).toBe(6);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(showModalCalls()).toBe(1);
  });

  it('a cancelled action is dropped: it is not performed later, and a later request performs only itself', () => {
    const { root, seeds, spy } = mountPlayedBoard();
    const seedCalls = seeds.calls();
    pressSizeButton(root, 8);
    confirmNo(root);

    pressNew(root); // another action on the same board
    confirmYes(root);

    expect(boardSize(root), 'the cancelled size change was not performed').toBe(6);
    expect(checkedSize(root)).toBe(6);
    expect(seeds.calls() - seedCalls, 'exactly one seed, for the new puzzle').toBe(1);
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 6, seed: seedCalls + 1 });
  });
});

describe('@trace FR-67 @trace FR-43 @trace FR-51 @trace FR-73 a cancelled or no-op action takes no seed', () => {
  it('A cancelled or no-op action takes no seed: new + «Скасувати», «Поле 8×8» + «Скасувати», «Скинути» + «Так, почати» and the shown size leave both counts as they were', () => {
    const { root, seeds, spy } = mountPlayedBoard();
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    pressNew(root);
    confirmNo(root);
    pressSizeButton(root, 8);
    confirmNo(root);
    pressReset(root);
    confirmYes(root);
    pressSizeButton(root, 6); // the size shown

    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(showModalCalls(), 'asked three times: the shown-size press asked nothing').toBe(3);
    expect(closeCalls()).toBe(3);
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
  });
});

describe('@trace FR-67 Escape leaves everything unchanged and drops the action', () => {
  it('Escape (cancel, then close, no button pressed): nothing changes, no seed, no generator call; a second request opens the dialog again and performs once', () => {
    const { root, seeds, spy } = mountPlayedBoard();
    const before = pageState(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    pressNew(root);
    expect(dialogIsOpen(root)).toBe(true);
    dialogEscape(root);

    expect(pageState(root)).toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(showModalCalls()).toBe(1);

    // the dropped action cannot be released by a stray press of «Так, почати» on the closed dialog
    q(dialogOf(root), '[data-confirm="yes"]').click();
    expect(seeds.calls(), 'the dropped action was not performed').toBe(seedCalls);
    expect(pageState(root)).toEqual(before);

    pressNew(root);
    expect(showModalCalls(), 'the second request opens the dialog a second time').toBe(2);
    expect(dialogIsOpen(root)).toBe(true);
    confirmYes(root);

    expect(seeds.calls() - seedCalls, 'exactly one new puzzle').toBe(1);
    expect(spy.calls.slice(generatorCalls)).toEqual([{ size: 6, seed: seedCalls + 1 }]);
    expect(readBoard(root)).toEqual(PAIR_ROW.givens);
  });
});

describe('@trace FR-67 @trace FR-66 a hint-filled cell counts as a player entry', () => {
  it('A hint-filled cell counts: after only «Підказка» the new puzzle button asks, and the board is unchanged until «Так, почати»', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : TWO_PAIRS));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    pressHint(root);
    expect(hintedCells(root), 'premise: the hint filled one cell and nothing else was pressed').toEqual([[3, 3]]);
    const before = snapshot(root);

    pressNew(root);

    expect(showModalCalls(), 'a hint-filled cell is an entry: the dialog opened once').toBe(1);
    expect(snapshot(root)).toEqual(before);
    expect(seeds.calls()).toBe(1);
    confirmYes(root);
    expect(readBoard(root)).toEqual(TWO_PAIRS.givens);
    expect(seeds.calls()).toBe(2);
  });
});

describe('@trace FR-67 @trace FR-66 @trace FR-42 @trace FR-43 @trace FR-58 A-29 a solved board still asks', () => {
  it.each(ACTIONS)('A solved board still asks (A-29): $name opens the dialog; board and win message are unchanged until «Так, почати»', ({ name, press }) => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy(bySize({ 6: WIN_PUZZLE, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root), 'premise: solved').toBe(WIN_MESSAGE);
    const before = pageState(root);

    press(root);

    expect(showModalCalls()).toBe(1);
    expect(dialogIsOpen(root)).toBe(true);
    expect(pageState(root)).toEqual(before);
    expect(winMessage(root)).toBe(WIN_MESSAGE);

    confirmYes(root);

    expect(winMessage(root), `after ${name} was confirmed the win message is gone`).toBe('');
    if (name === '«Поле 8×8»') expect(boardSize(root)).toBe(8);
    else expect(boardSize(root)).toBe(6);
  });
});

describe('@trace FR-67 entries that were cleared again do not count', () => {
  it('Entries that were cleared again do not count: three clicks on a non-given cell and a click on a given leave no entry, so the new puzzle acts at once', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : TWO_PAIRS));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    clickCell(root, 1, 1, 3);
    expect(cellText(root, 1, 1), 'premise: the cell shows empty again').toBe('');
    clickCell(root, 3, 1); // a given: nothing happens
    expect(cellText(root, 3, 1)).toBe('0');

    pressNew(root);

    expect(showModalCalls()).toBe(0);
    expect(dialogIsOpen(root)).toBe(false);
    expect(seeds.calls()).toBe(2);
    expect(readBoard(root)).toEqual(TWO_PAIRS.givens);
  });
});

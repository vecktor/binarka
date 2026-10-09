// Play page: the segmented size control (FR-43) and pressing the size already shown (FR-73). Scenarios of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Grid size selector", "Pressing the shown size changes
// nothing"). Written FIRST (red): the page still has a select.
// A size button is found by its position and its text; the data-size-option hook is not in the spec. Exact texts are literals.
// Tab order is covered by attributes only (native button, no disabled, no negative tabindex); real focus is the held NFR-13.
import { describe, expect, it } from 'vitest';
import {
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  allCells,
  boardSize,
  bySize,
  checkedSize,
  confirmNo,
  dialogIsOpen,
  generateSpy,
  hintedCells,
  installPageLifecycle,
  mountPage,
  mountPlayedBoard,
  pageState,
  popoverCalls,
  pressSizeButton,
  q,
  seedQueue,
  sheetOf,
  showModalCalls,
  sizeButton,
  sizeButtons,
  sizeControl,
  summaryButton,
  violationCells,
} from './helpers/play-page';

installPageLifecycle();

const LABELS = ['Поле 4×4', 'Поле 6×6', 'Поле 8×8'];

describe('@trace FR-43 the size control is a radiogroup of three buttons', () => {
  it('structure and default: role radiogroup, aria-label «Розмір поля», three button[type=button][role=radio] in the order 4, 6, 8; 6 is checked', () => {
    const root = mountPage({ seedSource: () => 1, generate: () => PAIR_ROW });
    const control = sizeControl(root);
    expect(control.getAttribute('aria-label')).toBe('Розмір поля');
    const buttons = Array.from(control.querySelectorAll('button'));
    expect(buttons.map((b) => b.textContent)).toEqual(LABELS);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('role')).toBe('radio');
    }
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    // found by order and label, as the spec identifies them
    expect(sizeButton(root, 4)).toBe(buttons[0]);
    expect(sizeButton(root, 6)).toBe(buttons[1]);
    expect(sizeButton(root, 8)).toBe(buttons[2]);
  });

  it('the buttons are native buttons in the tab order: no disabled attribute and no negative tabindex', () => {
    const root = mountPage({ seedSource: () => 1, generate: () => PAIR_ROW });
    expect(sizeButtons(root)).toHaveLength(3);
    for (const button of sizeButtons(root)) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.hasAttribute('disabled'), `${button.textContent} is not disabled`).toBe(false);
      const tabindex = button.getAttribute('tabindex');
      expect(tabindex === null || Number(tabindex) >= 0, `${button.textContent}: tabindex ${tabindex} is not negative`).toBe(true);
    }
  });

  it('no free value exists: the control has exactly three buttons and no select, input or option element, and the page has no select', () => {
    const root = mountPage({ seedSource: () => 1, generate: () => PAIR_ROW });
    const control = sizeControl(root);
    expect(control.querySelectorAll('button')).toHaveLength(3);
    expect(control.querySelectorAll('select, input, option, textarea, datalist')).toHaveLength(0);
    expect(control.tagName).not.toBe('SELECT');
    expect(root.querySelectorAll('select, option')).toHaveLength(0);
  });
});

describe('@trace FR-43 @trace FR-67 aria-checked stays on the shown size until the confirmation', () => {
  it('a press on a board with entries leaves aria-checked on 6 while the dialog is open and after «Скасувати»', () => {
    const { root } = mountPlayedBoard();

    pressSizeButton(root, 4);
    expect(dialogIsOpen(root)).toBe(true);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);

    confirmNo(root);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
  });
});

const CASES = [{ n: 4 }, { n: 6 }, { n: 8 }];

describe.each(CASES)('@trace FR-73 @trace FR-66 @trace FR-43 pressing the shown size is a no-op at size $n', ({ n }) => {
  it(`with entries, a hint sentence, cell-hinted and cell-violation: «Поле ${n}×${n}» changes nothing`, () => {
    const { root, seeds, spy } = mountPlayedBoard(n);
    const before = pageState(root);
    const hinted = hintedCells(root);
    const violations = violationCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const shownCalls = showModalCalls();
    const hidden = popoverCalls('hidePopover', sheetOf(root)); // FR-97: the press closes the sheet (counted from here)
    expect(checkedSize(root), 'premise: the size shown is the size pressed').toBe(n);
    expect(hinted, 'premise: a hint-filled cell').toHaveLength(1);
    expect(violations.length, 'premise: cells carry cell-violation').toBeGreaterThan(0);
    expect(before.hint, 'premise: a hint sentence is shown').not.toBe('');

    pressSizeButton(root, n);

    expect(showModalCalls(), 'no dialog').toBe(shownCalls);
    expect(dialogIsOpen(root)).toBe(false);
    expect(seeds.calls(), 'no seed').toBe(seedCalls);
    expect(spy.calls, 'no generator call').toHaveLength(generatorCalls);
    expect(pageState(root), 'cells (text and classes), size, aria-checked and both messages').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(violationCells(root)).toEqual(violations);
    expect(sizeButtons(root).filter((b) => b.getAttribute('aria-checked') === 'true')).toEqual([sizeButton(root, n)]);
    // Slice DL2 DELIBERATE CHANGE (FR-73 modified, FR-97): the no-op press still closes the sheet and focuses the summary button
    expect(popoverCalls('hidePopover', sheetOf(root)) - hidden, 'hidePopover was called once on the sheet').toBe(1);
    expect(document.activeElement, 'DOM focus is on the summary button').toBe(summaryButton(root));
  });

  it(`on an untouched board: «Поле ${n}×${n}» takes no seed, calls no generator and shows no dialog`, () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW, 4: BLANK_4, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    if (n !== 6) pressSizeButton(root, n); // reach size n the way a player does
    expect(boardSize(root)).toBe(n);
    expect(allCells(root)).toHaveLength(n * n);
    const before = pageState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const hidden = popoverCalls('hidePopover', sheetOf(root));

    pressSizeButton(root, n);

    expect(showModalCalls()).toBe(0);
    expect(dialogIsOpen(root)).toBe(false);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
    expect(pageState(root)).toEqual(before);
    expect(checkedSize(root)).toBe(n);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(n));
    // Slice DL2 DELIBERATE CHANGE (FR-73 modified, FR-97): the no-op press closes the sheet and focuses the summary button
    expect(popoverCalls('hidePopover', sheetOf(root)) - hidden, 'hidePopover was called once on the sheet').toBe(1);
    expect(document.activeElement, 'DOM focus is on the summary button').toBe(summaryButton(root));
  });
});

describe('@trace FR-73 @trace FR-43 a press of the shown size does not disturb a later change', () => {
  it('after pressing the shown size, a press of another size on a board with entries still asks, then performs once', () => {
    const { root, seeds } = mountPlayedBoard();
    const seedCalls = seeds.calls();
    pressSizeButton(root, 6);
    expect(showModalCalls()).toBe(0);

    pressSizeButton(root, 4);

    expect(showModalCalls(), 'the other size asks').toBe(1);
    expect(seeds.calls()).toBe(seedCalls);
    expect(dialogIsOpen(root)).toBe(true);
  });
});

// Added in review fix round 1 (wf_c621c8e9-bc8, contested finding): the shown size is the size of the board shown.
describe('@trace FR-73 @trace FR-43 with no board shown, a size button generates', () => {
  it('after a failed generation at mount, «Поле 6×6» generates a 6x6 board at once', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy((i) => {
      if (i === 0) throw new Error('generator failed at mount');
      return PAIR_ROW;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(root.querySelectorAll('[data-cell]'), 'premise: no board is shown').toHaveLength(0);
    expect(checkedSize(root), 'with no board, «Поле 6×6» keeps aria-checked from mount').toBe(6);

    pressSizeButton(root, 6);

    expect(showModalCalls()).toBe(0);
    expect(seeds.calls()).toBe(2);
    expect(spy.calls.map((c) => c.size)).toEqual([6, 6]);
    expect(boardSize(root)).toBe(6);
    expect(allCells(root)).toHaveLength(36);
    expect(checkedSize(root)).toBe(6);
  });
});

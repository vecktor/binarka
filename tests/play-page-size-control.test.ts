// Play page: the segmented size control (FR-43) and pressing the size already shown (FR-73). Scenarios of the delta spec
// openspec/changes/update-controls-accessibility/specs/play-page/spec.md ("Grid size selector", "Pressing the shown size changes
// nothing"). Written FIRST (red): the page still has a select.
// A size button is found by its position and its text; the data-size-option hook is not in the spec. Exact texts are literals.
// Tab order is covered by attributes only (native button, no disabled, no negative tabindex); real focus is the held NFR-13.
import { describe, expect, it } from 'vitest';
import {
  PAIR_ROW,
  boardSize,
  checkedSize,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  installPageLifecycle,
  markSize,
  mountPage,
  mountPlayedBoard,
  pressStart,
  showModalCalls,
  sizeButton,
  sizeButtons,
  sizeControl,
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

    markSize(root, 4);
    pressStart(root);
    expect(dialogIsOpen(root)).toBe(true);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);

    confirmNo(root);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(boardSize(root)).toBe(6);
    expect(checkedSize(root)).toBe(6);
  });
});

// update-setup-sheet-start (docs/qa/update-setup-sheet-start/changed-tests.md sections 5.3, 6, 8): the scenarios «The shown size is a
// no-op at every size» and «With no board shown, a size button generates» are renamed in the delta («The shown size only marks at every
// size», «With no board shown a press only marks and «Почати» generates»). Their tests moved, rewritten, to
// tests/play-page-marked-choice.test.ts; nothing was dropped.
describe('@trace FR-73 @trace FR-43 @trace FR-67 @trace FR-92 @trace FR-98 @trace FR-101 a marked size and another marked size ask once', () => {
  // Replaces `after pressing the shown size, a press of another size on a board with entries still asks, then performs once`
  // (decision 2 of the orchestrator): no delta scenario lets a bare second press raise a dialog; a press only marks, «Почати» asks.
  it('two marks then «Почати» raise one confirmation: the shown size marked, then another size marked, then «Почати» on a board with entries asks once and performs once', () => {
    const { root, seeds, spy } = mountPlayedBoard();
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    markSize(root, 6); // the shown size
    markSize(root, 4); // another size
    expect(showModalCalls(), 'two marking presses ask nothing').toBe(0);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    pressStart(root);

    expect(showModalCalls(), 'one confirmation for the pair').toBe(1);
    expect(dialogIsOpen(root)).toBe(true);
    expect(seeds.calls(), 'nothing is performed before «Так, почати»').toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    confirmYes(root);

    expect(showModalCalls(), 'still one confirmation').toBe(1);
    expect(seeds.calls() - seedCalls, 'exactly one seed').toBe(1);
    expect(spy.calls.slice(generatorCalls), 'exactly one generator call, for size 4').toEqual([{ size: 4, seed: seedCalls + 1 }]);
    expect(boardSize(root)).toBe(4);
    expect(checkedSize(root)).toBe(4);
  });
});

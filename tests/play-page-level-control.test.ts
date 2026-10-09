// Play page: the level selector (FR-44, FR-87, FR-88) and the content of a level option (FR-99, FR-89). Scenarios of the delta
// spec openspec/changes/add-level-selector/specs/play-page/spec.md ("Level selector", "Level option content"). Written FIRST
// (red): the page has no level control.
//
// @trace FR-44
// @trace FR-87
// @trace FR-88
// @trace FR-99
// @trace FR-89
// @trace FR-100
// @trace FR-101
//
// update-setup-sheet-start: a level press only MARKS; the choice tests go through «Почати» (markLevel + pressStart or chooseLevel).
//
// A level button is found by its position and the text of its first span, never by a data hook. The sheet is opened through the
// stubbed showPopover() by the helpers (`markLevel`, `chooseLevel`). Exact texts are literals; this file never imports
// src/ui/strings.ts. A generator that "throws" throws an ordinary Error (the reading rule of «Setup sheet»).
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  LEVEL_DESCRIPTIONS,
  LEVEL_NAMES,
  PAIR_ROW,
  WIN_PUZZLE,
  allCells,
  boardSize,
  bySize,
  cellText,
  checkedSize,
  checkedLevel,
  checkerCells,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  fillFrom,
  generateSpy,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  levelButtons,
  levelControl,
  levelStates,
  mountFixture,
  mountOn,
  mountPage,
  mountPlayedBoard,
  pageState,
  q,
  readBoard,
  seedQueue,
  selectSize,
  chooseLevel,
  sheetOf,
  showModalCalls,
  sizeButtons,
  snapshot,
  solutionGrid,
  summaryText,
  trackErrors,
  violationCells,
  winMessage,
  WIN_MESSAGE,
  markLevel,
  pressStart,
  openSheet,
  popoverCalls,
  popoverIsOpen,
} from './helpers/play-page';

installPageLifecycle();

const FORBIDDEN_ON_LEVEL_BUTTON = ['aria-label', 'aria-labelledby', 'aria-describedby', 'disabled', 'tabindex'];

// ---------------------------------------------------------------------------------------------------------
// Requirement: Level selector (FR-44, FR-87, FR-88)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-87 @trace FR-44 the level control is a radiogroup of four buttons', () => {
  it('Level control structure and default', () => {
    const root = mountFixture(BLANK);
    const control = q(root, '[data-control="level"]');
    const sheet = sheetOf(root);
    expect(sheet.contains(control), 'inside the sheet').toBe(true);
    const sizeControl = q(root, '[data-control="size"]');
    expect(sizeControl.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING, 'follows the size control').not.toBe(0);
    expect(control.getAttribute('role')).toBe('radiogroup');
    expect(control.getAttribute('aria-label')).toBe('Складність');
    expect(control.hasAttribute('aria-labelledby')).toBe(false);

    const children = Array.from(control.children);
    expect(children, 'the reason line followed by exactly four buttons').toHaveLength(5);
    const reason = children[0];
    expect(reason?.tagName).toBe('P');
    expect(reason?.hasAttribute('data-level-reason'), 'the first child is the reason line').toBe(true);
    expect(reason?.hasAttribute('role'), 'the reason line has no role').toBe(false);
    const buttons = children.slice(1);
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('role')).toBe('radio');
    }
    expect(buttons.map((b) => b.children[0]?.textContent), 'the names are the text of the first span').toEqual(LEVEL_NAMES);
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false']);
    for (const button of buttons) {
      for (const name of FORBIDDEN_ON_LEVEL_BUTTON) expect(button.hasAttribute(name), `a level button has no ${name}`).toBe(false);
    }
    expect(levelButtons(root)).toEqual(buttons);
    expect(checkedLevel(root)).toBe(1);
  });

  it('The level group has a name and no visible label', () => {
    const root = mountFixture(BLANK);
    expect(levelControl(root).getAttribute('aria-label')).toBe('Складність');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) texts.push((n as Text).data.trim());
    expect(texts.filter((t) => t === 'Складність'), 'no text node shows «Складність»').toEqual([]);
    expect(root.querySelectorAll('label'), 'no label element').toHaveLength(0);
    expect(root.querySelectorAll('[for]'), 'no for attribute').toHaveLength(0);
  });

  // update-setup-sheet-start, scenario «A level press only marks» of «Level selector» (FR-87, FR-100).
  it('A level press only marks', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const sheet = openSheet(root);
    const cells = snapshot(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const modals = showModalCalls();
    const hides = popoverCalls('hidePopover', sheet);

    levelButtons(root)[2]?.click(); // «Головоломка», a marking press

    expect(levelStates(root), 'aria-checked is on «Головоломка» only in the level control').toEqual(['false', 'false', 'true', 'false']);
    expect(q(root, '[data-board]').getAttribute('data-size'), 'the board keeps data-size 6').toBe('6');
    expect(snapshot(root), 'and its cell texts').toEqual(cells);
    expect(summaryText(root), 'the summary still reads 6×6 · Розминка').toBe('6×6 · Розминка');
    expect(popoverIsOpen(sheet), 'the sheet stays open').toBe(true);
    expect(showModalCalls(), 'showModal was never called').toBe(modals);
    expect(popoverCalls('hidePopover', sheet), 'hidePopover was never called').toBe(hides);
    expect(seeds.calls(), 'the seed-source count equals the count read before').toBe(seedCalls);
    expect(spy.calls, 'the generator count equals the count read before').toHaveLength(generatorCalls);
  });

  it('Choose a level on a board without entries', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(seeds.calls(), 'premise: the mount took one seed').toBe(1);

    markLevel(root, 2);
    pressStart(root);

    expect(showModalCalls(), 'showModal was never called').toBe(0);
    expect(seeds.calls(), 'one more seed was taken').toBe(2);
    expect(spy.calls.at(-1)).toEqual({ size: 6, seed: 2 });
    expect(spy.levels.at(-1), 'the page calls generate(size, seed, level)').toBe(2);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
  });

  it('The level reaches the generator at 8x8', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: BLANK, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    selectSize(root, 8);
    expect(boardSize(root), 'premise: an 8x8 board is shown').toBe(8);
    const seedsBefore = seeds.calls();

    chooseLevel(root, 4);

    expect(seeds.calls() - seedsBefore, 'one seed was taken').toBe(1);
    expect(spy.calls.at(-1), 'the last call is (8, seed)').toEqual({ size: 8, seed: seedsBefore + 1 });
    expect(spy.levels.at(-1), 'with level 4').toBe(4);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expect(allCells(root)).toHaveLength(64);
    expect(levelStates(root)).toEqual(['false', 'false', 'false', 'true']);
  });

  it('Board content comes from the generator at the chosen level', () => {
    const root = mountPage({ seedSource: seedQueue([1, 5]).source });
    const expected = generate(6, 5, 2);

    chooseLevel(root, 2);

    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const given = expected.givens[r - 1]?.[c - 1] ?? null;
        const cell = q(root, `[data-cell][data-row="${r}"][data-col="${c}"]`);
        expect(cell.getAttribute('data-given'), `given flag ${r},${c}`).toBe(given === null ? 'false' : 'true');
        expect(cell.textContent, `text ${r},${c}`).toBe(given === null ? '' : String(given));
      }
    }
  });

  it('A level change after play asks first, then replaces the board', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const before = pageState(root);
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    expect(before.hint, 'premise: a hint sentence is shown').not.toBe('');
    expect(violationCells(root).length, 'premise: cells carry cell-violation').toBeGreaterThan(0);

    markLevel(root, 3);
    pressStart(root);

    expect(dialogIsOpen(root), 'the dialog is open').toBe(true);
    expect(pageState(root), 'the board and the messages are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(levelStates(root), 'aria-checked is still on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);

    confirmYes(root);

    expect(levelStates(root)).toEqual(['false', 'false', 'true', 'false']);
    expect(summaryText(root)).toBe('6×6 · Головоломка');
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent !== ''), 'no player entries').toEqual([]);
    expect(hintMessage(root)).toBe('');
    expect(winMessage(root)).toBe('');
    expect(hintedCells(root)).toEqual([]);
    expect(violationCells(root), 'cell-violation only where the checker reports one for the new givens').toEqual(checkerCells(readBoard(root)));
    expect(seeds.calls() - seedCalls, 'one seed for the change').toBe(1);
    expect(spy.levels.at(-1), 'the generator was called with level 3').toBe(3);
  });

  it('A level change after a win asks first', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy(bySize({ 6: WIN_PUZZLE }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root), 'premise: the win message is shown').toBe(WIN_MESSAGE);

    chooseLevel(root, 2); // asserts the dialog opened (a solved board has entries, A-29) and presses «Так, почати»

    expect(winMessage(root)).toBe('');
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
  });

  it('The size is untouched by a level change', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4, 5]).source, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });
    selectSize(root, 8);
    expect(boardSize(root), 'premise: the page shows 8x8 at the level «Розминка»').toBe(8);
    expect(checkedLevel(root)).toBe(1);

    for (const level of [2, 4, 2]) {
      chooseLevel(root, level);
      expect(q(root, '[data-board]').getAttribute('data-size'), `after level ${level}`).toBe('8');
      expect(checkedSize(root), `after level ${level}`).toBe(8);
      expect(checkedLevel(root), `after level ${level}`).toBe(level);
    }
  });

  it('A generator error keeps the previous board', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, (_size, level) => {
      if (level === 3) throw new Error('generator failed for level 3');
      return PAIR_ROW;
    });
    const before = snapshot(root);
    const messages = [hintMessage(root), winMessage(root)];
    const hinted = hintedCells(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const tracker = trackErrors();
    try {
      markLevel(root, 3);
      pressStart(root);
      expect(dialogIsOpen(root), 'premise: the level change asks first').toBe(true);
      confirmYes(root);
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'the error listener recorded nothing').toEqual([]);
    expect(boardSize(root)).toBe(6);
    expect(snapshot(root), 'the same cell texts and highlights').toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messages);
    expect(hintedCells(root), 'the hint-filled cell keeps cell-hinted').toEqual(hinted);
    expect(levelStates(root), 'aria-checked is on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(summaryText(root)).toBe('6×6 · Розминка');
    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(seeds.calls() - seedCalls, 'one seed for the failed change (an ordinary error is not retried)').toBe(1);
    expect(spy.calls.length - generatorCalls, 'no second generator call').toBe(1);
  });

  it('A generator result of the wrong size keeps the previous board', () => {
    const { root } = mountPlayedBoard(6, (_size, level) => (level === 2 ? BLANK_4 : PAIR_ROW));
    const before = snapshot(root);
    const messages = [hintMessage(root), winMessage(root)];

    markLevel(root, 2);
    pressStart(root);
    confirmYes(root);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
    expect(snapshot(root)).toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messages);
    expect(levelStates(root)).toEqual(['true', 'false', 'false', 'false']);
  });

  it('The level is not remembered', () => {
    expect(localStorage.length, 'premise: localStorage is empty').toBe(0);
    expect(sessionStorage.length, 'premise: sessionStorage is empty').toBe(0);
    const first = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK }) });
    chooseLevel(first, 3);
    expect(checkedLevel(first), 'premise: the player chose «Головоломка»').toBe(3);

    const spy = generateSpy(bySize({ 6: BLANK }));
    const second = mountOn(document.createElement('div'), { seedSource: seedQueue([1]).source, generate: spy.generate });

    expect(levelStates(second), 'the new page starts at «Розминка»').toEqual(['true', 'false', 'false', 'false']);
    expect(spy.levels[0], 'its first generator call carried level 1').toBe(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Level option content (FR-99, FR-89)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-99 @trace FR-89 the content of a level option', () => {
  it('Name and description in each button', () => {
    const root = mountFixture(BLANK);
    const buttons = levelButtons(root);
    expect(buttons).toHaveLength(4);
    buttons.forEach((button, i) => {
      const children = Array.from(button.children);
      expect(children, `button ${i + 1} has exactly two child elements`).toHaveLength(2);
      expect(children.map((c) => c.tagName)).toEqual(['SPAN', 'SPAN']);
      const nodes = Array.from(button.childNodes);
      expect(nodes, 'span, one text node, span').toHaveLength(3);
      expect(nodes[1]?.nodeType, 'the middle node is a text node').toBe(Node.TEXT_NODE);
      expect(nodes[1]?.textContent, 'one ordinary space between the spans').toBe(' ');
      expect(children[0]?.textContent).toBe(LEVEL_NAMES[i]);
      expect(children[1]?.textContent).toBe(LEVEL_DESCRIPTIONS[i]);
      expect(button.textContent, 'name, one space, description').toBe(`${LEVEL_NAMES[i] ?? ''} ${LEVEL_DESCRIPTIONS[i] ?? ''}`);
      for (const span of children) expect(span.hasAttribute('id'), 'a span has no id').toBe(false);
    });
  });

  it('No description line on the page body', () => {
    const root = mountFixture(BLANK);
    const check = (what: string): void => {
      expect(root.querySelectorAll('[data-level-description]'), `${what}: no [data-level-description]`).toHaveLength(0);
      const sheet = sheetOf(root);
      const rules = q(root, '[data-section="rules"]');
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        const text = n as Text;
        if (sheet.contains(text) || rules.contains(text)) continue;
        for (const description of LEVEL_DESCRIPTIONS) {
          expect(text.data.includes(description), `${what}: "${description}" is only inside the sheet`).toBe(false);
        }
      }
    };
    check('at mount');
    expect(levelButtons(root), 'premise: the descriptions exist inside the sheet').toHaveLength(4);
    for (const level of [2, 3, 4, 1]) {
      chooseLevel(root, level);
      check(`after level ${level}`);
    }
  });

  it('Every description is one sentence of at most 80 characters', () => {
    const root = mountFixture(BLANK);
    const shown = levelButtons(root).map((b) => b.children[1]?.textContent ?? '');
    expect(shown, 'the descriptions are read from the page').toEqual(LEVEL_DESCRIPTIONS);
    for (const description of [...shown, ...LEVEL_DESCRIPTIONS]) {
      expect(description.length, `"${description}" is at most 80 characters`).toBeLessThanOrEqual(80);
      expect(description, 'one sentence').toMatch(/^[^.!?…]+\.$/);
      expect(/\p{Script=Cyrillic}/u.test(description)).toBe(true);
      expect(/[A-Za-z]/.test(description)).toBe(false);
    }
    expect(LEVEL_DESCRIPTIONS.map((d) => d.length), 'the lengths of FR-89').toEqual([76, 72, 69, 79]);
  });

  it('The description does not move with a pending press', () => {
    const { root } = mountPlayedBoard(6);
    const texts = levelButtons(root).map((b) => b.textContent);

    markLevel(root, 2);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the dialog opened').toBe(true);
    expect(levelStates(root), 'while the dialog is open').toEqual(['true', 'false', 'false', 'false']);

    confirmNo(root);
    expect(levelStates(root), 'after «Скасувати»').toEqual(['true', 'false', 'false', 'false']);
    expect(levelButtons(root).map((b) => b.textContent), 'the four buttons hold the same texts').toEqual(texts);
    expect(cellText(root, 6, 6), 'premise: the player entry is still there').toBe('1');
  });
});

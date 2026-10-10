// Play page: the language control, the in-place language switch, <html lang> and the title, and a hint on screen that re-renders as the same hint
// (add-english-version). One test per jsdom scenario of the delta spec openspec/changes/add-english-version/specs/play-page/spec.md, title =
// scenario name, from the ADDED requirements «Language control», «A language press re-renders in place and changes nothing else», «Document
// language and title» and «A hint message on screen re-renders as the same hint», and the extended scenarios of «Every cell is its own Tab stop»,
// «Hinted cell marker», «Common rules for the theme and language options», «The option controls are not part of the marked choice»,
// «Texts of the settings button, the settings panel and the theme control» and «Settings button and panel» (the language halves). Written
// FIRST (red): the page has no language control, no English table and no `lang` handling yet.
//
// jsdom has no popover behaviour: the settings panel and the sheet are opened through the stubbed showPopover() (A-44). Exact texts are literals
// (tests/helpers/english.ts for the English column of the table); this file never imports src/ui/strings.ts. The hooks
// [data-control="language"] and [data-language-option] are spec-made proxies confirmed against design/README.md (iteration 13, task 1.4).
//
// @trace FR-107
// @trace FR-108
// @trace FR-109
// @trace FR-110
// @trace FR-118
// @trace FR-55
// @trace FR-56
// @trace FR-59
// @trace FR-66
// @trace FR-100
// @trace FR-117
// @trace NFR-5
// @trace NFR-9
import { describe, expect, it, vi } from 'vitest';
import {
  BLANK,
  DIRTY_GIVENS,
  LANGUAGE_LABEL,
  LANGUAGE_OPTION_LABELS,
  PAIR_ROW,
  SETTINGS_LABEL,
  THEME_LABEL,
  TITLE_TEXT,
  WIN_PUZZLE,
  allCells,
  boardSize,
  checkedLanguage,
  checkedLevel,
  checkedSize,
  clickCell,
  collectEverything,
  documentLanguage,
  expectActive,
  expectedHint,
  fillFrom,
  fullState,
  generateSpy,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  languageControl,
  languageOption,
  languageOptions,
  languageStates,
  markLevel,
  markSize,
  messageArea,
  mountFixture,
  mountOn,
  mountPage,
  mountPlayedBoard,
  openSettings,
  openSheetIfClosed,
  popoverCalls,
  popoverIsOpen,
  popoverLog,
  pressHint,
  pressKey,
  pressLanguage,
  pressStart,
  q,
  readBoard,
  seedQueue,
  settingsPanel,
  showModalCalls,
  snapshot,
  solutionGrid,
  startNewPuzzle,
  summaryText,
  themeControl,
  trackErrors,
  violationCells,
  winMessage,
  accessibleName,
  levelStates,
  levelDisabled,
  levelReason,
  selectSize,
  sizeButton,
  chooseLevel,
} from './helpers/play-page';
import {
  EN_CLOSE_LABEL,
  EN_LANGUAGE_LABEL,
  EN_REASON_4X4,
  EN_SETTINGS_LABEL,
  EN_THEME_LABEL,
  EN_TITLE,
  EN_WIN_MESSAGE,
  enSizeLabel,
  expectEnglishPage,
} from './helpers/english';
import { BROKEN_EN, NO_RULE_EN } from './helpers/hint-cases';

installPageLifecycle();

const NO_RULE_UK = 'Жодне з правил зараз не підказує наступного ходу.';
const BROKEN_UK = 'Спершу виправте порушення правил, підсвічене на полі.';
const attributeNames = (el: Element): string[] => Array.from(el.attributes, (a) => a.name);

/** `navigator.language` and `navigator.languages` read `en-US` (the page must never look at them, A-49). Returns the spies. */
function stubNavigatorLanguage(): void {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['en-US', 'en']);
}

describe('Language control', () => {
  it('Language control structure and default', () => {
    stubNavigatorLanguage();
    const root = mountFixture(PAIR_ROW);
    const controls = root.querySelectorAll('[data-control="language"]');
    expect(controls, 'exactly one language control in the root').toHaveLength(1);
    const control = languageControl(root);
    const panel = settingsPanel(root);
    expect(panel.contains(control), 'it is inside the settings panel').toBe(true);
    expect(control.compareDocumentPosition(themeControl(root)) & Node.DOCUMENT_POSITION_PRECEDING, 'it follows the theme control').toBeTruthy();
    expect(control.getAttribute('role')).toBe('radiogroup');
    expect(control.getAttribute('aria-label')).toBe(LANGUAGE_LABEL);
    expect(control.hasAttribute('aria-labelledby')).toBe(false);
    expect(control.hasAttribute('id')).toBe(false);

    const buttons = Array.from(control.querySelectorAll('button'));
    expect(buttons, 'exactly two buttons').toHaveLength(2);
    buttons.forEach((button, i) => {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('role')).toBe('radio');
      expect(button.textContent).toBe(LANGUAGE_OPTION_LABELS[i]);
      expect(button.getAttribute('lang')).toBe(i === 0 ? 'uk' : 'en');
      expect(button.getAttribute('data-language-option')).toBe(i === 0 ? 'uk' : 'en');
    });
    expect(buttons.map((b) => b.getAttribute('aria-checked')), 'Ukrainian is checked although navigator.language is en-US').toEqual(['true', 'false']);

    const label = control.previousElementSibling;
    expect(label, 'an element immediately precedes the language control').not.toBeNull();
    expect(label?.textContent).toBe(LANGUAGE_LABEL);
    expect(label?.tagName.toLowerCase(), 'it is a plain-text element, not a label element').not.toBe('label');
    expect(label?.hasAttribute('for')).toBe(false);
    expect(label?.parentElement).toBe(panel);
    expect(documentLanguage(), 'navigator.language is not read: the page is Ukrainian').toBe('uk');
  });

  it('Each language is named in its own language in both modes', () => {
    const root = mountFixture(PAIR_ROW);
    expect(languageOptions(root).map((b) => b.textContent), 'Ukrainian mode').toEqual(['Українська', 'English']);
    expect(languageControl(root).getAttribute('aria-label'), 'the group name in Ukrainian mode').toBe(LANGUAGE_LABEL);

    pressLanguage(root, 'en');

    expect(languageOptions(root).map((b) => b.textContent), 'English mode: the same two names').toEqual(['Українська', 'English']);
    expect(languageControl(root).getAttribute('aria-label'), 'the group name in English mode').toBe(EN_LANGUAGE_LABEL);
    expect(languageOptions(root).map((b) => b.getAttribute('lang')), 'each option keeps its own lang').toEqual(['uk', 'en']);
  });

  it('The stored language is checked at mount', () => {
    localStorage.setItem('binarka.language', 'en');
    const root = mountFixture(PAIR_ROW);
    expect(languageStates(root), 'aria-checked is on "English" only').toEqual(['false', 'true']);
    expect(checkedLanguage(root)).toBe('en');
    expect(documentLanguage(), '<html lang> is en').toBe('en');
    expect(localStorage.getItem('binarka.language'), 'the stored value is untouched').toBe('en');
  });
});

describe('A language press re-renders in place and changes nothing else', () => {
  it('A language press re-renders every text', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 1, 1); // a player entry on the board
    expect(readBoard(root).flat(), 'premise: the board has a player entry').toContain(0);
    openSettings(root); // through the stubbed showPopover()
    const english = languageOption(root, 'en');
    english.focus();
    expectActive(english, 'premise: DOM focus is on the option "English"');
    expect(popoverIsOpen(settingsPanel(root)), 'premise: the settings panel is open').toBe(true);

    english.click();

    expectEnglishPage(root);
    expect(q(root, '[data-board]').getAttribute('aria-label'), 'the board name').toBe('Grid 6×6');
    expect(allCells(root)[0]?.getAttribute('aria-label'), 'the first cell name (the digit form: the entry)').toBe('Row 1, column 1, 0');
    expect(document.title).toBe('Binarka');
    expect(languageStates(root), 'aria-checked is on "English" only').toEqual(['false', 'true']);
    expectActive(english, 'DOM focus is still on the option "English"');
  });

  it('A language press changes nothing else', () => {
    // 6×6 at «Задачка» with entries, a hint sentence, a hint-filled cell and cells with cell-violation
    const played = mountPlayedBoard(6, undefined, 2);
    const { root, seeds, spy } = played;
    expect(summaryText(root), 'premise: the summary reads 6×6 · Задачка').toBe('6×6 · Задачка');
    expect(hintedCells(root), 'premise: a hint-filled cell with cell-hinted').toHaveLength(1);
    expect(violationCells(root).length, 'premise: cells with cell-violation').toBeGreaterThan(0);
    markSize(root, 8);
    markLevel(root, 4); // the sheet stays open and marked: «Поле 8×8» and «Мозколамка»
    expect(checkedSize(root)).toBe(8);
    expect(checkedLevel(root)).toBe(4);
    openSettings(root);
    const before = {
      cells: snapshot(root),
      hint: hintMessage(root),
      win: winMessage(root),
      hinted: hintedCells(root),
      violations: violationCells(root),
      seedCalls: seeds.calls(),
      generateCalls: spy.calls.length,
      modalCalls: showModalCalls(),
      size: boardSize(root),
    };

    pressLanguage(root, 'en');

    expect(snapshot(root), 'every cell keeps its text, data-given and class list (cell-violation and cell-hinted included)').toEqual(before.cells);
    expect(hintedCells(root)).toEqual(before.hinted);
    expect(violationCells(root)).toEqual(before.violations);
    expect(boardSize(root), 'the size is unchanged').toBe(before.size);
    expect(summaryText(root), 'the summary reads 6×6 · Teaser').toBe('6×6 · Teaser');
    expect(checkedSize(root), 'the marked size is still 8').toBe(8);
    expect(checkedLevel(root), 'the marked level is still 4').toBe(4);
    expect(sizeButton(root, 8).textContent, 'the marked size, named in English').toBe('Grid 8×8');
    expect(sizeButton(root, 8).getAttribute('aria-checked')).toBe('true');
    expect(q(root, '[data-control="level"] [role="radio"][aria-checked="true"]').children[0]?.textContent).toBe('Brain-twister');
    expect(showModalCalls(), 'showModal was never called').toBe(before.modalCalls);
    expect(seeds.calls(), 'no seed was taken').toBe(before.seedCalls);
    expect(spy.calls.length, 'the generator was not called').toBe(before.generateCalls);
  });

  it('A language press opens and closes nothing and asks for no confirmation', () => {
    const root = mountFixture(PAIR_ROW);
    clickCell(root, 1, 1);
    const panel = openSettings(root);
    const calls = popoverLog.length;
    const modal = showModalCalls();

    pressLanguage(root, 'en');

    expect(popoverLog.length, 'the press called neither showPopover nor hidePopover nor togglePopover').toBe(calls);
    for (const method of ['showPopover', 'hidePopover', 'togglePopover'] as const) {
      expect(popoverCalls(method), method).toBe(method === 'showPopover' ? 1 : 0);
    }
    expect(popoverIsOpen(panel), 'the settings panel is still open').toBe(true);
    expect(showModalCalls(), 'no confirmation (A-55)').toBe(modal);
    expect(checkedLanguage(root), 'premise: the press did act').toBe('en');
  });

  it('A switch never brings back a cleared message', () => {
    // a hint shown, then «Нова головоломка» confirmed (the hint region is empty)
    const first = mountFixture(PAIR_ROW);
    clickCell(first, 1, 1);
    pressHint(first);
    expect(hintMessage(first), 'premise: a hint is shown').not.toBe('');
    startNewPuzzle(first);
    expect(hintMessage(first), 'premise: the hint region is empty after the new puzzle').toBe('');
    pressLanguage(first, 'en');
    expect(hintMessage(first), 'the hint region is still empty after the switch').toBe('');
    expect(winMessage(first)).toBe('');

    // a win shown, then a click on a non-given cell (the win region is empty)
    const second = mountFixture(WIN_PUZZLE);
    fillFrom(second, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(second), 'premise: the win message is shown').not.toBe('');
    clickCell(second, 1, 1);
    expect(winMessage(second), 'premise: the win region is empty after the click').toBe('');
    pressLanguage(second, 'en');
    expect(winMessage(second), 'the win region is still empty after the switch').toBe('');
    expect(hintMessage(second)).toBe('');
  });

  it('The 4×4 state survives a switch', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: () => BLANK });
    openSheetIfClosed(root);
    markSize(root, 4); // the sheet opened with «Поле 4×4» marked
    expect(levelDisabled(root), 'premise: levels 2 to 4 are disabled').toEqual([null, 'true', 'true', 'true']);
    expect(levelReason(root).hasAttribute('hidden'), 'premise: the reason is shown').toBe(false);

    pressLanguage(root, 'en');

    expect(levelReason(root).textContent, 'the reason reads The 4×4 grid has only the \u201CWarm-up\u201D level.').toBe(EN_REASON_4X4);
    expect(levelDisabled(root), 'the three levels still have aria-disabled').toEqual([null, 'true', 'true', 'true']);
    expect(sizeButton(root, 4).getAttribute('aria-checked'), '"Grid 4×4" is still checked').toBe('true');
    expect(sizeButton(root, 4).textContent).toBe('Grid 4×4');
    expect(levelStates(root), '"Warm-up" is still checked').toEqual(['true', 'false', 'false', 'false']);
  });

  it('The 4×4 reason stays hidden at 6×6 and 8×8 across a switch', () => {
    for (const n of [6, 8] as const) {
      const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: () => BLANK });
      markSize(root, n);
      pressLanguage(root, 'en');
      expect(levelReason(root).hasAttribute('hidden'), `at a marked size of ${n} the reason is hidden`).toBe(true);
      expect(levelReason(root).textContent, `at a marked size of ${n} its text is empty`).toBe('');
    }
  });

  it('Pressing the language already shown changes nothing', () => {
    localStorage.setItem('binarka.language', 'en');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const root = mountFixture(PAIR_ROW);
    const before = collectEverything(root);

    pressLanguage(root, 'en');

    expect(setItem, 'setItem was not called').not.toHaveBeenCalled();
    expect(collectEverything(root), 'the texts are unchanged').toEqual(before);
    expect(documentLanguage()).toBe('en');
  });

  it('Switching back restores the Ukrainian texts byte for byte', () => {
    const root = mountPlayedBoard(6).root; // entries, a hint sentence, a hinted cell: more texts to restore
    const atMount = collectEverything(root);
    const title = document.title;
    expect(title, 'premise: the Ukrainian title').toBe(TITLE_TEXT);

    pressLanguage(root, 'en');
    expect(collectEverything(root), 'premise: the English page differs from the Ukrainian one').not.toEqual(atMount);
    pressLanguage(root, 'uk');

    expect(collectEverything(root), 'every text and accessible name equals the one read at mount (the hint sentence included)').toEqual(atMount);
    expect(document.title).toBe(title);
    expect(documentLanguage()).toBe('uk');
  });

  it('The idle line is the same element after a switch, in the DOM and untouched in kind', () => {
    const root = mountFixture(PAIR_ROW);
    const idle = q(root, '[data-message="idle"]');

    pressLanguage(root, 'en');

    expect(q(root, '[data-message="idle"]'), 'the same element').toBe(idle);
    expect(root.querySelectorAll('[data-message="idle"]')).toHaveLength(1);
    expect(idle.hasAttribute('hidden'), 'no hidden attribute').toBe(false);
    expect(idle.hasAttribute('style'), 'no style attribute').toBe(false);
    expect(idle.textContent, 'its text is the English idle line').toBe('Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.');
  });

  it('A switch re-renders the page in place: the elements are the same ones', () => {
    const root = mountFixture(PAIR_ROW);
    const board = q(root, '[data-board]');
    const cells = allCells(root);
    const sheet = q(root, '[data-section="setup"]');
    const rules = q(root, '[data-section="rules"]');
    const panel = settingsPanel(root);
    const children = Array.from(panel.children);

    pressLanguage(root, 'en');

    expect(q(root, '[data-board]'), 'the board element').toBe(board);
    expect(allCells(root), 'every cell element').toEqual(cells);
    allCells(root).forEach((cell, i) => { expect(cell, `cell ${i + 1}`).toBe(cells[i]); });
    expect(q(root, '[data-section="setup"]'), 'the sheet').toBe(sheet);
    expect(q(root, '[data-section="rules"]'), 'the rules panel').toBe(rules);
    expect(Array.from(settingsPanel(root).children), 'the children of the settings panel').toEqual(children);
  });
});

describe('Document language and title', () => {
  it('The attribute and the title follow the language', () => {
    const root = mountFixture(PAIR_ROW);
    const heading = (): string | undefined => Array.from(root.querySelectorAll('h1')).map((h) => h.textContent)[0];
    expect([documentLanguage(), document.title, heading()], 'Ukrainian mode').toEqual(['uk', 'Бінарка', 'Бінарка']);

    pressLanguage(root, 'en');

    expect([documentLanguage(), document.title, heading()], 'English mode').toEqual(['en', EN_TITLE, EN_TITLE]);
  });

  it('The value is one of the two codes', () => {
    const runs: [string, string | undefined, string][] = [
      ['localStorage empty', undefined, 'uk'],
      ['en stored', 'en', 'en'],
      ['uk stored', 'uk', 'uk'],
      ['a bad value stored', 'EN', 'uk'],
    ];
    for (const [name, stored, lang] of runs) {
      localStorage.clear();
      document.documentElement.removeAttribute('lang');
      if (stored !== undefined) localStorage.setItem('binarka.language', stored);
      const root = mountOn(document.createElement('div'));
      expect(documentLanguage(), `<html lang> with ${name}`).toBe(lang);
      expect(checkedLanguage(root), `the checked option matches <html lang> with ${name}`).toBe(lang);
    }
  });

  it('Only the two language options carry a different lang', () => {
    for (const language of ['uk', 'en'] as const) {
      localStorage.clear();
      localStorage.setItem('binarka.language', language);
      const root = mountOn(document.createElement('div'));
      const html = document.documentElement.getAttribute('lang');
      const foreign = Array.from(root.querySelectorAll('[lang]')).filter((el) => el.getAttribute('lang') !== html);
      const other = language === 'uk' ? 'en' : 'uk';
      expect(foreign, `in ${language} mode exactly the option of the other language`).toEqual([languageOption(root, other)]);
    }
  });
});

describe('A hint message on screen re-renders as the same hint', () => {
  it('A hint sentence switches language and stays the same hint', () => {
    const root = mountFixture(PAIR_ROW);
    const boardBefore = readBoard(root);
    const ukrainian = expectedHint(root, 'uk');
    const english = expectedHint(root, 'en');
    expect(ukrainian.kind, 'premise: the hint fills a cell').toBe('fill');
    expect(english.sentence, 'premise: the English sentence differs').not.toBe(ukrainian.sentence);
    pressHint(root);
    expect(hintMessage(root), 'premise: the Ukrainian sentence is shown').toBe(ukrainian.sentence);
    const afterHint = snapshot(root);
    const hinted = hintedCells(root);
    expect(hinted, 'premise: one cell is hinted').toHaveLength(1);
    expect(readBoard(root), 'premise: the hint filled a cell').not.toEqual(boardBefore);

    pressLanguage(root, 'en');

    expect(hintMessage(root), 'the English sentence the engine returns for that same hint on the board as it was before the fill').toBe(english.sentence);
    expect(hintedCells(root), 'the filled cell keeps cell-hinted').toEqual(hinted);
    expect(snapshot(root), 'no other cell changed').toEqual(afterHint);
  });

  it('It survives a cell click and a second switch', () => {
    const root = mountFixture(PAIR_ROW);
    const ukrainian = expectedHint(root, 'uk');
    const english = expectedHint(root, 'en');
    pressHint(root);
    pressLanguage(root, 'en');
    expect(hintMessage(root), 'premise: the English sentence is shown').toBe(english.sentence);

    clickCell(root, 1, 1); // a non-given cell
    expect(hintMessage(root), 'after the click the message kept its English sentence').toBe(english.sentence);

    pressLanguage(root, 'uk');
    expect(hintMessage(root), 'after the switch it shows the original Ukrainian sentence byte for byte').toBe(ukrainian.sentence);
  });

  it('The no-rule sentence switches too', () => {
    const noRule = mountFixture(BLANK);
    pressHint(noRule);
    expect(hintMessage(noRule), 'premise: the no-rule sentence').toBe(NO_RULE_UK);
    const before = snapshot(noRule);
    pressLanguage(noRule, 'en');
    expect(hintMessage(noRule)).toBe(NO_RULE_EN);
    expect(snapshot(noRule), 'no cell changed').toEqual(before);
  });

  it('The broken-rule sentence switches too', () => {
    const broken = mountFixture(DIRTY_GIVENS);
    pressHint(broken);
    expect(hintMessage(broken), 'premise: the broken-rule sentence').toBe(BROKEN_UK);
    const before = snapshot(broken);
    pressLanguage(broken, 'en');
    expect(hintMessage(broken)).toBe(BROKEN_EN);
    expect(snapshot(broken), 'no cell changed').toEqual(before);
  });

  it('The win message and empty regions', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root), 'premise: the win text is shown').not.toBe('');
    expect(hintMessage(root), 'premise: the hint region is empty').toBe('');

    pressLanguage(root, 'en');

    expect(winMessage(root)).toBe(EN_WIN_MESSAGE);
    expect(hintMessage(root), 'the hint region is still empty').toBe('');
  });
});

describe('Every cell is its own Tab stop (the language halves)', () => {
  it('A language press leaves the focus on the option', () => {
    const root = mountFixture(PAIR_ROW);
    openSettings(root);
    const english = languageOption(root, 'en');
    english.focus();
    expectActive(english, 'premise: focus is on "English"');

    english.click();

    expect(document.activeElement, 'the same element object keeps the focus').toBe(english);
    expect(root.querySelectorAll('[tabindex]'), 'the page has added no tabindex').toHaveLength(0);
  });
});

describe('Hinted cell marker (the language half)', () => {
  it('A language press keeps the marker', () => {
    const root = mountFixture(PAIR_ROW);
    pressHint(root);
    const hinted = hintedCells(root);
    expect(hinted, 'premise: one hinted cell').toHaveLength(1);
    const text = snapshot(root);
    openSettings(root);

    pressLanguage(root, 'en');

    expect(hintedCells(root), 'exactly one cell has cell-hinted and it is the same').toEqual(hinted);
    expect(snapshot(root)).toEqual(text);
  });
});

describe('Common rules for the theme and language options (the language options)', () => {
  it('The language options are native buttons in the tab order', () => {
    const root = mountFixture(PAIR_ROW);
    openSettings(root);
    const options = languageOptions(root);
    expect(options).toHaveLength(2);
    for (const option of options) {
      expect(option.tagName).toBe('BUTTON');
      expect(option.getAttribute('type')).toBe('button');
      expect(option.getAttribute('role')).toBe('radio');
      for (const name of ['tabindex', 'aria-label', 'disabled']) expect(option.hasAttribute(name), `no ${name}`).toBe(false);
      expect(option.hasAttribute('lang'), 'each has its own lang').toBe(true);
      for (const key of ['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Tab', 'Escape']) {
        for (const event of [pressKey(option, key), pressKey(option, key, { shiftKey: true })]) {
          expect(event.defaultPrevented, `a key event "${key}" on an option is not default-prevented`).toBe(false);
        }
      }
    }
    expect(languageStates(root), 'a key event changes nothing').toEqual(['true', 'false']);
  });

  it('No id is added by the language control', () => {
    const root = mountFixture(PAIR_ROW);
    expect(languageControl(root).hasAttribute('id')).toBe(false);
    for (const option of languageOptions(root)) expect(attributeNames(option)).not.toContain('id');
    const ids = Array.from(root.querySelectorAll('[id]'), (e) => e.id);
    expect(ids, 'five ids per mount in all').toHaveLength(5);
    expect(Array.from(settingsPanel(root).querySelectorAll('[id]')), 'nothing inside the settings panel has an id').toHaveLength(0);
  });
});

describe('The option controls are not part of the marked choice (the language press)', () => {
  it('A language press leaves the marked choice alone', () => {
    const spy = generateSpy(() => BLANK);
    const root = mountPage({ seedSource: seedQueue([1, 2, 3, 4]).source, generate: (size, seed, level) => spy.generate(size, seed, level) });
    markSize(root, 8);
    markLevel(root, 4); // the sheet is marked and not closed
    openSettings(root);
    const hide = popoverCalls('hidePopover');

    pressLanguage(root, 'en');

    expect(sizeButton(root, 8).getAttribute('aria-checked'), '"Grid 8×8" is still checked').toBe('true');
    expect(sizeButton(root, 8).textContent).toBe(enSizeLabel(8));
    expect(levelStates(root), '"Brain-twister" is still checked').toEqual(['false', 'false', 'false', 'true']);
    expect(q(root, '[data-control="level"] [role="radio"][aria-checked="true"]').children[0]?.textContent).toBe('Brain-twister');
    expect(popoverCalls('hidePopover'), 'hidePopover was not called by the press').toBe(hide);

    const calls = spy.calls.length;
    // a later "Start" uses (8, 4): the generator is asked for an 8×8 board; the fixture is 6×6, so it throws and the page keeps its board,
    // but the call itself is recorded (size and level)
    const tracker = trackErrors();
    pressStart(root);
    tracker.stop();
    expect(tracker.errors, 'no uncaught error: an ordinary generator failure keeps the board').toEqual([]);
    expect(spy.calls.length, 'one more generator call').toBe(calls + 1);
    expect(spy.calls.at(-1)?.size, 'with size 8').toBe(8);
    expect(spy.levels.at(-1), 'and level 4').toBe(4);
  });
});

describe('Settings button and panel (the language halves)', () => {
  it('Settings button and panel at mount: the panel holds the label «Мова», the language control and «Закрити» after the theme group', () => {
    const root = mountFixture(PAIR_ROW);
    const children = Array.from(settingsPanel(root).children);
    expect(children, 'the panel holds, in order: a label, the theme control, a label, the language control, the close button').toHaveLength(5);
    expect(children[0]?.textContent).toBe(THEME_LABEL);
    expect(children[1]).toBe(themeControl(root));
    expect(children[2]?.textContent).toBe(LANGUAGE_LABEL);
    expect(children[2]?.tagName.toLowerCase(), 'the label is a plain-text element, not a label element').not.toBe('label');
    expect(children[3]).toBe(languageControl(root));
    expect(children[4]).toBe(q(root, '[data-action="settings-close"]'));
  });

  it('The settings button and panel are named in English', () => {
    localStorage.setItem('binarka.language', 'en');
    const root = mountFixture(PAIR_ROW);
    expect(q(root, '[data-action="settings"]').getAttribute('aria-label')).toBe(EN_SETTINGS_LABEL);
    expect(settingsPanel(root).getAttribute('aria-label')).toBe(EN_SETTINGS_LABEL);
    const labels = [themeControl(root), languageControl(root)].map((control) => control.previousElementSibling?.textContent);
    expect(labels, 'the labels read "Theme" and "Language"').toEqual([EN_THEME_LABEL, EN_LANGUAGE_LABEL]);
    expect(q(root, '[data-action="settings-close"]').textContent).toBe(EN_CLOSE_LABEL);
  });

  it('The settings panel survives a language press: the same element with the same five children', () => {
    const root = mountFixture(PAIR_ROW);
    const panel = settingsPanel(root);
    const children = Array.from(panel.children);
    expect(children).toHaveLength(5);

    pressLanguage(root, 'en');

    expect(settingsPanel(root), 'the same element as at mount').toBe(panel);
    expect(Array.from(settingsPanel(root).children), 'the same five children').toEqual(children);
  });
});

describe('Texts of the settings button, the settings panel and the theme control (the language texts)', () => {
  /** Everything the gear and the panel show or expose, with the elements whose own lang differs from <html lang> skipped (A-52). */
  function collectSettingsTexts(root: HTMLElement): string[] {
    const html = document.documentElement.getAttribute('lang');
    const collected: string[] = [];
    const skipped = (el: Element | null): boolean => {
      const own = el?.closest('[lang]');
      return own !== null && own !== undefined && own.getAttribute('lang') !== html;
    };
    for (const host of [q(root, '[data-action="settings"]'), settingsPanel(root)]) {
      for (const el of [host, ...Array.from(host.querySelectorAll('*'))]) {
        if (skipped(el)) continue;
        for (const name of ['aria-label', 'title', 'alt', 'label']) {
          const value = el.getAttribute(name);
          if (value !== null) collected.push(value);
        }
      }
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        if ((n as Text).data.trim() !== '' && !skipped((n as Text).parentElement)) collected.push((n as Text).data);
      }
    }
    return collected;
  }

  it('The theme texts are Ukrainian (with the language control)', () => {
    const root = mountFixture(PAIR_ROW);
    const collected = collectSettingsTexts(root);
    for (const text of [SETTINGS_LABEL, THEME_LABEL, 'Світла', 'Темна', 'Як у системі', LANGUAGE_LABEL, 'Закрити']) {
      expect(collected, `the collection contains «${text}»`).toContain(text);
    }
    expect(collected, 'the option "English" is skipped (own lang)').not.toContain('English');
    for (const text of collected) {
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
    // and the option "English" itself is there, with its own lang
    expect(languageOption(root, 'en').textContent).toBe('English');
  });

  it('The settings and language texts in English mode', () => {
    localStorage.setItem('binarka.language', 'en');
    const root = mountFixture(PAIR_ROW);
    const collected = collectSettingsTexts(root);
    for (const text of ['Settings', 'Theme', 'Light', 'Dark', 'System', 'Language', 'English', 'Close']) {
      expect(collected, `the collection contains "${text}"`).toContain(text);
    }
    expect(collected, 'the option «Українська» is skipped (own lang)').not.toContain('Українська');
    for (const text of collected) {
      expect(/[A-Za-z]/.test(text), `"${text}" has Latin letters`).toBe(true);
      expect(/\p{Script=Cyrillic}/u.test(text), `"${text}" has no Cyrillic letters`).toBe(false);
    }
    expect(languageOption(root, 'uk').textContent, 'the option «Українська» is still there').toBe('Українська');
  });
});

describe('The accessibility umbrella (the language halves)', () => {
  it('The language radiogroup exposes its state', () => {
    const root = mountFixture(PAIR_ROW);
    expect(languageStates(root), 'at first «Українська» is checked').toEqual(['true', 'false']);
    expect(languageOptions(root).some((o) => o.hasAttribute('aria-disabled')), 'none has aria-disabled').toBe(false);
    expect([documentLanguage(), languageOptions(root).map((o) => o.getAttribute('lang'))]).toEqual(['uk', ['uk', 'en']]);

    pressLanguage(root, 'en');

    expect(languageStates(root), 'after the press "English" is checked').toEqual(['false', 'true']);
    expect([documentLanguage(), languageOptions(root).map((o) => o.getAttribute('lang'))]).toEqual(['en', ['uk', 'en']]);
  });

  it('The accessible names of the language group and its options follow the page language', () => {
    const root = mountFixture(PAIR_ROW);
    expect(languageControl(root).getAttribute('aria-label')).toBe('Мова');
    expect(languageOptions(root).map((o) => accessibleName(o))).toEqual(['Українська', 'English']);
    pressLanguage(root, 'en');
    expect(languageControl(root).getAttribute('aria-label')).toBe('Language');
    expect(languageOptions(root).map((o) => accessibleName(o))).toEqual(['Українська', 'English']);
    expect(messageArea(root).isConnected).toBe(true);
  });
});

// A switch while a size is chosen: the summary and the generator calls follow the page language afterwards (a smoke check across the
// real engine generator, one seed): the page asks the generator exactly as before.
describe('A switch does not change what the generator is asked for', () => {
  it('a choice after a switch passes the same size and level', () => {
    const spy = generateSpy(() => BLANK);
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: (size, seed, level) => spy.generate(size, seed, level) });
    pressLanguage(root, 'en');
    const tracker = trackErrors();
    chooseLevel(root, 1);
    selectSize(root, 6);
    tracker.stop();
    expect(spy.calls.map((c) => c.size), 'the mount and the two choices ask for a 6×6 board').toEqual([6, 6, 6]);
    expect(spy.levels, 'at level 1').toEqual([1, 1, 1]);
    expect(fullState(root).summary).toBe('6×6 · Warm-up');
  });
});

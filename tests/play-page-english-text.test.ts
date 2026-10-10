// Play page: the English page text and the per-mode text rules (add-english-version). One test per jsdom scenario of the delta spec
// openspec/changes/add-english-version/specs/play-page/spec.md, title = scenario name, from the ADDED requirements «Page text is per mode» and
// «English page text», and from the English scenarios added to the MODIFIED requirements «Win message when solved», «Hint button shows the
// engine's sentence», «Seed is chosen outside the engine, injectable and not shown», «Ukrainian texts of the header, rules panel and idle line»,
// «Ukrainian texts of the confirmation dialog, size control and cell labels», «Cells expose a Ukrainian name and their state», «Cell labels»,
// «The size radiogroup has an accessible name», «Idle line», «Rules panel», «Summary button», «Setup sheet», «Level option content»,
// «Ukrainian texts of the summary, the setup sheet, the level control and the techniques section» and «The board is a labelled group of cell
// buttons». Written FIRST (red): the page has no English table, no language control and no `lang` handling yet.
//
// GUARDS (green before the change, must stay green): the Ukrainian outputs of `sizeLabel`, `cellLabel` and `summaryText` in «Every Ukrainian
// string has an English counterpart with the same key», and the existing Ukrainian page text tests (tests/play-page-page-text.test.ts and the
// others, unchanged except for what tests/changed-tests lists). The Ukrainian assertions are byte-identical.
//
// The English texts are literals (tests/helpers/english.ts). The one test that reads src/ui/strings.ts (the key-parity scenario) discovers the
// English table by its shape, because the delta only says "a second table of the same shape (for example `EN`)": an exported plain object that
// holds every Ukrainian export name. It does not depend on the name of the table or of the accessor.
//
// @trace FR-111
// @trace NFR-5
// @trace FR-94
// @trace FR-41
// @trace FR-55
// @trace FR-61
// @trace FR-70
// @trace FR-71
// @trace FR-89
// @trace FR-95
// @trace FR-96
import { describe, expect, it } from 'vitest';
import * as strings from '../src/ui/strings';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  WIN_PUZZLE,
  accessibleName,
  allCells,
  cellLabel,
  clickCell,
  collectEverything,
  collectPageText,
  dialogIsOpen,
  dialogOf,
  fillFrom,
  generatorBySize,
  givensOf,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  languageOption,
  levelButtons,
  makePuzzle,
  mountFixture,
  mountPage,
  pressHint,
  pressLanguage,
  pressNew,
  q,
  readBoard,
  rulesPanel,
  seedQueue,
  selectSize,
  setCellTo,
  settingsPanel,
  sheetOf,
  sizeButtons,
  solutionGrid,
  summaryButton,
  textWithoutHidden,
  winMessage,
  expectedHint,
  chooseLevel,
  documentLanguage,
} from './helpers/play-page';
import {
  EN_CLOSE_LABEL,
  EN_CONFIRM_NO,
  EN_CONFIRM_TEXT,
  EN_CONFIRM_YES,
  EN_IDLE_TEXT,
  EN_LEVEL_DESCRIPTIONS,
  EN_LEVEL_GROUP_LABEL,
  EN_LEVEL_NAMES,
  EN_REASON_4X4,
  EN_RULES_CLOSE_LABEL,
  EN_RULES_ITEMS,
  EN_RULES_LABEL,
  EN_SHEET_LABEL,
  EN_SIZE_GROUP_LABEL,
  EN_START_LABEL,
  EN_SUMMARY_PREFIX,
  EN_TECHNIQUES_HEADING,
  EN_TECHNIQUES_ITEMS,
  EN_TITLE,
  EN_WIN_MESSAGE,
  enCellLabel,
  enSizeLabel,
  enSummaryLabel,
  expectEnglishPage,
} from './helpers/english';

installPageLifecycle();

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;
const NEITHER_SCRIPT = /^[\d×·▾\s]+$/u; // digits and the signs « × », « · » and « ▾ »

/** The elements of `root` whose own `lang` differs from `<html lang>` (A-52). */
const foreignLanguage = (root: HTMLElement): Element[] =>
  Array.from(root.querySelectorAll('[lang]')).filter((el) => el.getAttribute('lang') !== (document.documentElement.getAttribute('lang') ?? ''));

describe('Page text is per mode', () => {
  it('English mode has Latin texts and no Cyrillic', () => {
    const root = mountFixture(WIN_PUZZLE, { language: 'en' });
    const texts = collectPageText(root);
    expect(texts.length, 'premise: the collection holds the page texts').toBeGreaterThan(60);
    expect(texts.map((t) => t.trim()), 'premise: English texts were collected').toContain('Binarka');
    for (const text of texts) {
      expect(LATIN.test(text) || NEITHER_SCRIPT.test(text), `"${text}" has Latin letters or is digits and signs only`).toBe(true);
      expect(CYRILLIC.test(text), `"${text}" has no Cyrillic letters`).toBe(false);
    }
    expect(foreignLanguage(root), 'the only skipped element is the option «Українська»').toEqual([languageOption(root, 'uk')]);
  });

  it('Ukrainian mode keeps Cyrillic texts and no Latin', () => {
    const root = mountFixture(WIN_PUZZLE);
    const texts = collectPageText(root);
    expect(texts.map((t) => t.trim()), 'premise: Ukrainian texts were collected').toContain('Бінарка');
    for (const text of texts) {
      expect(CYRILLIC.test(text) || NEITHER_SCRIPT.test(text), `"${text}" has Cyrillic letters or is digits and signs only`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
    expect(foreignLanguage(root), 'the only skipped element is the option "English"').toEqual([languageOption(root, 'en')]);
  });

  it('Both modes at every size and after a switch', () => {
    const fixtures = { 4: BLANK_4, 6: BLANK, 8: BLANK_8 };
    const nameIn = (language: 'uk' | 'en', n: number): string => (language === 'en' ? enSizeLabel(n) : `Поле ${n}×${n}`);
    const EN_CELL = /^Row [1-8], column [1-8], (empty|0|1)(, given|, hinted)?$/;
    const UK_CELL = /^Рядок [1-8], стовпець [1-8], (порожньо|0|1)(, задано|, підказка)?$/;
    const check = (root: HTMLElement, language: 'uk' | 'en', n: number): void => {
      const board = q(root, '[data-board]').getAttribute('aria-label') ?? '';
      expect(board, `${language} board name at ${n}×${n}`).toBe(nameIn(language, n));
      expect(board).toMatch(language === 'en' ? /^Grid [468]×[468]$/ : /^Поле [468]×[468]$/);
      for (const cell of allCells(root)) {
        const name = cell.getAttribute('aria-label') ?? '';
        expect(name, `${language} cell name`).toMatch(language === 'en' ? EN_CELL : UK_CELL);
        expect((language === 'en' ? CYRILLIC : LATIN).test(name), `"${name}" has no letter of the other script`).toBe(false);
      }
    };
    for (const language of ['uk', 'en'] as const) {
      const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize(fixtures), language });
      for (const n of [4, 8, 6]) {
        selectSize(root, n);
        check(root, language, n);
      }
    }
    // a page switched from one mode to the other with the settings panel, then a size shown in the new mode
    for (const [from, to] of [['uk', 'en'], ['en', 'uk']] as const) {
      const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize(fixtures), language: from });
      pressLanguage(root, to);
      for (const n of [4, 8]) {
        selectSize(root, n);
        check(root, to, n);
      }
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// English page text
// ---------------------------------------------------------------------------------------------------------

type Table = Record<string, unknown>;
const exportsOf = strings as unknown as Table;
/** The Ukrainian exports of src/ui/strings.ts before the English table existed: their names and shapes stay (the requirement). */
const UK_EXPORTS = [
  'TITLE', 'BUTTONS', 'sizeLabel', 'SIZE_GROUP', 'CONFIRM', 'cellLabel', 'RULES', 'IDLE', 'WIN', 'SETUP', 'LEVEL_GROUP', 'LEVELS',
  'LEVEL_REASON_4X4', 'TECHNIQUES', 'summaryText', 'SETTINGS', 'THEME_OPTIONS',
];
const isPlainObject = (value: unknown): value is Table => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Every leaf of a table as `path -> string` (a function leaf is `<function>`, so two tables compare by shape and by text). */
function leaves(value: unknown, path = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof value === 'string') out.set(path, value);
  else if (typeof value === 'function') out.set(path, '<function>');
  else if (Array.isArray(value)) value.forEach((item, i) => leaves(item, `${path}[${i}]`, out));
  else if (isPlainObject(value)) for (const [key, item] of Object.entries(value)) leaves(item, path === '' ? key : `${path}.${key}`, out);
  else out.set(path, String(value));
  return out;
}

/** The English table, found by its shape: an exported plain object that holds every Ukrainian export name. */
function englishTable(): Table {
  const candidates = Object.entries(exportsOf).filter(([name, value]) => !UK_EXPORTS.includes(name) && isPlainObject(value) && UK_EXPORTS.every((key) => key in value));
  expect(candidates.map(([name]) => name), 'src/ui/strings.ts exports one English table of the same shape (an object that holds every Ukrainian export name)').toHaveLength(1);
  const found = candidates[0]?.[1];
  expect.assert(isPlainObject(found), 'the English table was found');
  return found;
}

describe('English page text', () => {
  it('Every Ukrainian string has an English counterpart with the same key', () => {
    // GUARD half: the Ukrainian exports keep their names and shapes, and their outputs are those of the existing exports.
    for (const name of UK_EXPORTS) expect(exportsOf, `the Ukrainian export ${name} still exists`).toHaveProperty(name);
    expect((exportsOf.sizeLabel as (n: number) => string)(4)).toBe('Поле 4×4');
    expect((exportsOf.cellLabel as (...args: unknown[]) => string)(2, 3, null, false, false)).toBe('Рядок 2, стовпець 3, порожньо');
    expect((exportsOf.cellLabel as (...args: unknown[]) => string)(3, 1, 0, true, false)).toBe('Рядок 3, стовпець 1, 0, задано');
    expect((exportsOf.cellLabel as (...args: unknown[]) => string)(5, 6, 0, false, true)).toBe('Рядок 5, стовпець 6, 0, підказка');
    expect((exportsOf.summaryText as (n: number, level: number) => string)(6, 2)).toBe('6×6 · Задачка');

    const english = englishTable();
    const ukrainian = Object.fromEntries(Object.keys(english).map((key) => [key, exportsOf[key]]));
    const ukLeaves = leaves(ukrainian);
    const enLeaves = leaves(english);
    expect([...enLeaves.keys()].sort(), 'the two tables have the same key set').toEqual([...ukLeaves.keys()].sort());
    for (const [path, value] of enLeaves) {
      if (value === '<function>') continue;
      const ukValue = ukLeaves.get(path) ?? '';
      if (value === 'Українська') continue; // the one option named in its own language
      if (!/\p{L}/u.test(ukValue)) {
        expect(value, `${path}: a value without letters (a separator or a cue) is the same in both tables`).toBe(ukValue);
        continue;
      }
      expect(value, `${path}: the English value is not empty`).not.toBe('');
      expect(LATIN.test(value), `${path}: "${value}" has Latin letters`).toBe(true);
      expect(CYRILLIC.test(value), `${path}: "${value}" has no Cyrillic letters`).toBe(false);
    }

    const en = english as Record<string, (...args: unknown[]) => string>;
    expect(en.sizeLabel?.(4)).toBe('Grid 4×4');
    expect(en.cellLabel?.(2, 3, null, false, false)).toBe('Row 2, column 3, empty');
    expect(en.cellLabel?.(3, 1, 0, true, false)).toBe('Row 3, column 1, 0, given');
    expect(en.cellLabel?.(5, 6, 0, false, true)).toBe('Row 5, column 6, 0, hinted');
    expect(en.summaryText?.(6, 2)).toBe('6×6 · Teaser');
  });

  it('The English page at mount', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    expectEnglishPage(root);
    const summary = summaryButton(root);
    expect(textWithoutHidden(summary), 'the hidden prefix, then the visible text').toBe('Grid and difficulty: 6×6 · Warm-up');
    expect(q(root, '[data-control="level"]').getAttribute('aria-label')).toBe('Difficulty');
    expect(settingsPanel(root).previousElementSibling, 'premise: the panel follows the message area').not.toBeNull();
    for (const [i, button] of levelButtons(root).entries()) {
      expect(button.textContent, `level ${i + 1}: name, one space, description`).toBe(`${EN_LEVEL_NAMES[i] ?? ''} ${EN_LEVEL_DESCRIPTIONS[i] ?? ''}`);
    }
    expect(q(rulesPanel(root), '[data-section="techniques"] h3').textContent).toBe(EN_TECHNIQUES_HEADING);
    expect(q(root, '[data-action="rules"]').textContent).toBe(EN_RULES_LABEL);
    expect(q(rulesPanel(root), 'button').textContent).toBe(EN_RULES_CLOSE_LABEL);
    expect(documentLanguage()).toBe('en');
  });

  it('The English idle line keeps its non-breaking spaces', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const text = q(root, '[data-message="idle"]').textContent;
    expect(text).toBe('Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.');
    expect(text.split('\u00A0').length - 1, 'exactly two U+00A0').toBe(2);
    expect(EN_IDLE_TEXT, 'premise: the helper holds the same literal').toBe(text);
  });

  it('The English win message and the confirmation', () => {
    const solved = mountFixture(WIN_PUZZLE, { language: 'en' });
    fillFrom(solved, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(solved), 'the win text').toBe('Congratulations, puzzle solved!');

    const played = mountFixture(PAIR_ROW, { language: 'en' });
    clickCell(played, 1, 1);
    pressNew(played);
    expect(dialogIsOpen(played), 'premise: a board with entries asks first').toBe(true);
    const dialog = dialogOf(played);
    expect(dialog.textContent).toContain('Start over? Your moves on this board will be lost.');
    expect(q(dialog, '[data-confirm="yes"]').textContent).toBe('Yes, start over');
    expect(q(dialog, '[data-confirm="no"]').textContent).toBe('Cancel');
  });

  it('No English text contains an apostrophe', () => {
    const values = [...leaves(englishTable()).values()].filter((value) => value !== '<function>');
    expect(values.length, 'premise: the English table holds texts').toBeGreaterThan(40);
    for (const value of values) {
      expect(value.includes('\u0027'), `"${value}" has no U+0027`).toBe(false);
      expect(value.includes('\u02BC'), `"${value}" has no U+02BC`).toBe(false);
    }
    // and the page itself, in English mode, shows none (the hint sentence and the win message included)
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    pressHint(root);
    for (const text of collectPageText(root).concat(hintMessage(root))) {
      expect(text.includes('\u0027') || text.includes('\u02BC'), `"${text}" has no apostrophe`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// The English scenarios of the MODIFIED requirements
// ---------------------------------------------------------------------------------------------------------

describe('Win message when solved (English)', () => {
  it('The English win message', () => {
    const root = mountFixture(WIN_PUZZLE, { language: 'en' });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    expect(winMessage(root), 'premise: one cell is still to be set').toBe('');
    setCellTo(root, 4, 1, solutionGrid(WIN_PUZZLE)[3]?.[0] === 1 ? 1 : 0); // the player clicks the last cell until it shows the solution digit
    const text = winMessage(root);
    expect(text).toBe(EN_WIN_MESSAGE);
    expect(LATIN.test(text)).toBe(true);
    expect(CYRILLIC.test(text)).toBe(false);
    for (const code of ['\u0027', '\u02BC', '\u2019']) expect(text.includes(code), `no U+${code.codePointAt(0)?.toString(16).toUpperCase() ?? ''}`).toBe(false);
  });
});

describe('Hint button shows the engine\'s sentence (English)', () => {
  it('Sentence in English mode', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const expected = expectedHint(root, 'en');
    expect(expected.kind, 'premise: the hint fills a cell').toBe('fill');

    pressHint(root);

    expect(hintMessage(root), 'the English sentence of hint(board, 4, "en"), unchanged').toBe(expected.sentence);
    expect(LATIN.test(hintMessage(root)), 'it has Latin letters').toBe(true);
    expect(CYRILLIC.test(hintMessage(root)), 'it contains no Cyrillic letter').toBe(false);
    expect(hintedCells(root)).toHaveLength(1);
  });
});

describe('Seed is chosen outside the engine, injectable and not shown (English)', () => {
  it('Seed is not shown in English mode', () => {
    const root = mountPage({ seedSource: () => 987654, language: 'en' });
    expect(document.title, 'premise: the page is English').toBe('Binarka');
    const check = (): void => {
      for (const s of collectEverything(root)) {
        expect(s.includes('987654'), `"${s}" contains 987654`).toBe(false);
        expect(s.includes('987,654'), `"${s}" contains 987,654`).toBe(false);
        expect(s.includes('987 654'), `"${s}" contains 987 654`).toBe(false);
        expect(/9\D?8\D?7\D?6\D?5\D?4/.test(s), `"${s}" matches the split-seed pattern`).toBe(false);
      }
    };
    check();
    pressHint(root);
    check();
  });
});

describe('Ukrainian texts of the header, rules panel and idle line (English)', () => {
  it('The English texts of the header, rules panel and idle line', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const collect = (node: HTMLElement): string[] => {
      const out: string[] = [];
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
        const text = n as Text;
        if (text.data.trim() !== '' && text.parentElement?.closest('[aria-hidden="true"]') == null) out.push(text.data);
      }
      for (const el of [node, ...Array.from(node.querySelectorAll('*'))]) {
        for (const name of ['aria-label', 'title', 'alt', 'label']) {
          const value = el.getAttribute(name);
          if (value !== null) out.push(value);
        }
      }
      return out;
    };
    const texts = [...collect(q(root, 'header')), ...collect(rulesPanel(root)), ...collect(q(root, '[data-message="idle"]'))];
    const trimmed = texts.map((t) => t.trim());
    for (const required of ['Binarka', 'Rules', 'Got it', ...EN_RULES_ITEMS, EN_IDLE_TEXT]) {
      expect(trimmed, `the collection contains "${required}"`).toContain(required);
    }
    for (const item of EN_TECHNIQUES_ITEMS) expect(trimmed, 'the three techniques are English').toContain(item);
    for (const text of texts) {
      expect(LATIN.test(text), `"${text}" has Latin letters`).toBe(true);
      expect(CYRILLIC.test(text), `"${text}" has no Cyrillic letters`).toBe(false);
    }
  });
});

describe('Ukrainian texts of the confirmation dialog, size control and cell labels (English)', () => {
  it('The English texts of the dialog, the size control and the cells', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const texts: string[] = [];
    for (const part of [q(root, '[data-control="size"]'), dialogOf(root)]) {
      const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) if ((n as Text).data.trim() !== '') texts.push((n as Text).data.trim());
    }
    texts.push(q(root, '[data-control="size"]').getAttribute('aria-label') ?? '');
    for (const cell of allCells(root)) texts.push(cell.getAttribute('aria-label') ?? '');
    for (const required of ['Grid size', 'Grid 4×4', 'Grid 6×6', 'Grid 8×8', EN_CONFIRM_TEXT, EN_CONFIRM_YES, EN_CONFIRM_NO]) {
      expect(texts, `the collection contains "${required}"`).toContain(required);
    }
    for (const text of texts) {
      expect(LATIN.test(text), `"${text}" has Latin letters`).toBe(true);
      expect(CYRILLIC.test(text), `"${text}" has no Cyrillic letters`).toBe(false);
    }
  });
});

describe('Cells expose a Ukrainian name and their state (English)', () => {
  it('Names in English mode', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    expect(cellLabel(root, 2, 3)).toBe('Row 2, column 3, empty');
    expect(cellLabel(root, 3, 1)).toBe('Row 3, column 1, 0, given');
    expect(cellLabel(root, 6, 6)).toBe('Row 6, column 6, empty');
  });
});

describe('Cell labels (English)', () => {
  // Givens 1 at (1,4), 0 at (5,3), 1 at (5,4), 1 at (5,5): the first hint is the pair rule, row 5, column 6, value 0.
  const FOUR_FORMS = makePuzzle(givensOf(6, [[1, 4, 1], [5, 3, 0], [5, 4, 1], [5, 5, 1]]), { inconsistent: true });

  it('The four label forms in English', () => {
    const root = mountFixture(FOUR_FORMS, { language: 'en' });
    expect(cellLabel(root, 3, 2), 'empty').toBe(enCellLabel(3, 2, ''));
    expect(cellLabel(root, 3, 2)).toBe('Row 3, column 2, empty');
    clickCell(root, 3, 2);
    expect(cellLabel(root, 3, 2), 'after one click').toBe('Row 3, column 2, 0');

    pressHint(root);

    expect(readBoard(root)[4]?.[5], 'premise: the hint filled (5,6) with 0').toBe(0);
    expect(cellLabel(root, 1, 4), 'a given 1').toBe('Row 1, column 4, 1, given');
    expect(cellLabel(root, 5, 6), 'the hint-filled cell').toBe('Row 5, column 6, 0, hinted');
  });
});

describe('The size radiogroup has an accessible name (English)', () => {
  it('The size group is named in English', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const group = q(root, '[data-control="size"]');
    expect(group.getAttribute('aria-label')).toBe(EN_SIZE_GROUP_LABEL);
    const buttons = sizeButtons(root);
    expect(buttons.map((b) => b.textContent)).toEqual(['Grid 4×4', 'Grid 6×6', 'Grid 8×8']);
    for (const button of buttons) {
      expect(button.hasAttribute('aria-label'), `${button.textContent} has no aria-label`).toBe(false);
      expect(button.hasAttribute('aria-labelledby'), `${button.textContent} has no aria-labelledby`).toBe(false);
      expect(CYRILLIC.test(button.textContent), `${button.textContent} has no Cyrillic`).toBe(false);
    }
  });
});

describe('The board is a labelled group of cell buttons (English)', () => {
  it('The group name in English mode', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: generatorBySize({ 4: BLANK_4, 6: BLANK, 8: BLANK_8 }), language: 'en' });
    const board = q(root, '[data-board]');
    expect(board.getAttribute('role')).toBe('group');
    expect(board.getAttribute('aria-label')).toBe('Grid 6×6');
    selectSize(root, 4);
    expect(q(root, '[data-board]').getAttribute('aria-label')).toBe('Grid 4×4');
    selectSize(root, 8);
    expect(q(root, '[data-board]').getAttribute('aria-label')).toBe('Grid 8×8');
  });
});

describe('Idle line (English)', () => {
  it('The English idle line, code point by code point', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const text = q(root, '[data-message="idle"]').textContent;
    expect(text).toBe('Press the cells to place 0\u00A0and\u00A01. For the rules, use the \u201CRules\u201D button at the top.');
    expect(text.split('\u00A0').length - 1, 'exactly two U+00A0').toBe(2);
    expect(text.includes('\u201C') && text.includes('\u201D'), 'the quotes around Rules are U+201C and U+201D').toBe(true);
  });
});

describe('Rules panel (English)', () => {
  it('The rules panel in English mode', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const panel = rulesPanel(root);
    expect(Array.from(panel.querySelectorAll('h2, h3'), (h) => [h.tagName, h.textContent])).toEqual([['H2', 'Rules'], ['H3', 'Harder techniques']]);
    expect(Array.from(panel.querySelectorAll(':scope > ul > li'), (li) => textWithoutHidden(li).trim())).toEqual(EN_RULES_ITEMS);
    expect(Array.from(q(panel, '[data-section="techniques"]').querySelectorAll('li'), (li) => li.textContent.trim())).toEqual(EN_TECHNIQUES_ITEMS);
    expect(q(panel, 'button').textContent, 'its close button').toBe('Got it');
    expect(panel.querySelectorAll('li'), 'the same structure and six li elements').toHaveLength(6);
  });
});

describe('Summary button (English)', () => {
  it('The summary in English mode and across a switch', () => {
    const played = mountFixture(PAIR_ROW);
    chooseLevel(played, 2);
    expect(q(played, '[data-action="setup"]').children[1]?.textContent, 'premise: the summary reads 6×6 · Задачка').toBe('6×6 · Задачка');

    pressLanguage(played, 'en');

    const button = summaryButton(played);
    expect(button.children[0]?.textContent, 'the hidden prefix').toBe(EN_SUMMARY_PREFIX);
    expect(button.children[1]?.textContent, 'the visible text').toBe('6×6 · Teaser');
    expect(accessibleName(button), 'the accessible name').toBe('Grid and difficulty: 6×6 · Teaser');
    expect(enSummaryLabel(6, 2)).toBe('6×6 · Teaser');
    expect(q(played, '[data-board]').getAttribute('data-size'), 'the board, the size and the level are unchanged').toBe('6');
  });
});

describe('Setup sheet (English)', () => {
  it('The sheet is named in the page language', () => {
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    const sheet = sheetOf(root);
    expect(sheet.getAttribute('aria-label')).toBe(EN_SHEET_LABEL);
    expect(q(sheet, '[data-action="setup-start"]').textContent).toBe(EN_START_LABEL);
    expect(q(sheet, '[data-action="setup-close"]').textContent).toBe(EN_CLOSE_LABEL);
    expect(sheet.hasAttribute('aria-labelledby')).toBe(false);
  });
});

describe('Level option content (English)', () => {
  it('Every English description is one sentence of at most 80 characters', () => {
    expect(EN_LEVEL_DESCRIPTIONS, 'premise: four descriptions').toHaveLength(4);
    for (const description of EN_LEVEL_DESCRIPTIONS) {
      expect(description.length, `"${description}" has at most 80 characters`).toBeLessThanOrEqual(80);
      expect(description).toMatch(/^[^.!?…]+\.$/);
      expect(LATIN.test(description)).toBe(true);
      expect(CYRILLIC.test(description)).toBe(false);
    }
    // the page shows exactly these: a name span and a description span with one ordinary space between them
    const root = mountFixture(PAIR_ROW, { language: 'en' });
    levelButtons(root).forEach((button, i) => {
      expect(button.children, `level ${i + 1} has two child elements`).toHaveLength(2);
      expect(button.children[0]?.textContent).toBe(EN_LEVEL_NAMES[i]);
      expect(button.children[1]?.textContent).toBe(EN_LEVEL_DESCRIPTIONS[i]);
      expect(button.childNodes[1]?.textContent, 'an ordinary space between the spans').toBe(' ');
      expect(button.textContent).toBe(`${EN_LEVEL_NAMES[i] ?? ''} ${EN_LEVEL_DESCRIPTIONS[i] ?? ''}`);
    });
  });
});

describe('Ukrainian texts of the summary, the setup sheet, the level control and the techniques section (English)', () => {
  it('The English texts of the summary, the sheet, the levels and the techniques', () => {
    const collect = (root: HTMLElement): string[] => {
      const out: string[] = [];
      const sheet = sheetOf(root);
      const section = q(rulesPanel(root), '[data-section="techniques"]');
      for (const host of [sheet, section]) {
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) if ((n as Text).data.trim() !== '') out.push((n as Text).data);
      }
      const summary = summaryButton(root);
      for (const child of Array.from(summary.children)) if (child.getAttribute('aria-hidden') !== 'true') out.push(child.textContent);
      out.push(sheet.getAttribute('aria-label') ?? '', q(root, '[data-control="level"]').getAttribute('aria-label') ?? '');
      return out;
    };
    const six = mountFixture(PAIR_ROW, { language: 'en' });
    const atSix = collect(six);
    for (const required of [EN_SUMMARY_PREFIX, '6×6 · Warm-up', 'Grid and difficulty', 'Start', 'Close', EN_LEVEL_GROUP_LABEL, ...EN_LEVEL_NAMES, ...EN_LEVEL_DESCRIPTIONS, 'Harder techniques', ...EN_TECHNIQUES_ITEMS]) {
      expect(atSix, `the collection contains "${required}"`).toContain(required);
    }
    const four = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 4: BLANK_4, 6: BLANK }), language: 'en' });
    selectSize(four, 4);
    const atFour = collect(four);
    expect(atFour, 'the 4×4 reason').toContain(EN_REASON_4X4);
    expect(atFour, 'the summary at 4×4').toContain('4×4 · Warm-up');
    for (const text of [...atSix, ...atFour]) {
      expect(LATIN.test(text) || NEITHER_SCRIPT.test(text), `"${text}" has Latin letters or is digits and signs`).toBe(true);
      expect(CYRILLIC.test(text), `"${text}" has no Cyrillic letters`).toBe(false);
    }
  });
});

// A guard of the Ukrainian side of the same scenarios: the reading rule says every quoted Ukrainian text describes Ukrainian mode, the default.
describe('The Ukrainian page is unchanged by the existence of English', () => {
  it('without a stored language the page reads as before: Ukrainian title, summary and confirmation', () => {
    const root = mountFixture(PAIR_ROW);
    expect(document.title).toBe('Бінарка');
    expect(q(root, 'h1').textContent).toBe('Бінарка');
    expect(q(root, '[data-action="setup"]').children[1]?.textContent).toBe('6×6 · Розминка');
    clickCell(root, 1, 1);
    pressNew(root);
    expect(dialogIsOpen(root), 'premise: a board with entries asks first').toBe(true);
    expect(dialogOf(root).textContent).toContain('Почати заново? Ваші ходи на цьому полі буде втрачено.');
    expect(q(dialogOf(root), '[data-confirm="yes"]').textContent).toBe('Так, почати');
    expect(EN_TITLE, 'the helper keeps the English title apart').toBe('Binarka');
  });
});

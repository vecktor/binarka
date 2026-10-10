// Ukrainian texts of the header, the rules panel and the idle line (NFR-5), and the single-module rule for page texts.
// Scenarios of the delta spec openspec/changes/update-page-layout/specs/play-page/spec.md ("Ukrainian texts of the header,
// rules panel and idle line", "Ukrainian page text"). Written FIRST (red).
//
// This file NEVER imports src/ui/strings.ts: an exact-text assertion against the module's own constants would be a tautology.
// The module is only read as a source file. Texts are literals (tests/helpers/play-page.ts).
//
// CHARACTERISATION GUARD: "Decorative examples hold no letters" passes against the page before this change (nothing in it has
// aria-hidden="true", so the check is vacuous). It is expected GREEN from the start and becomes meaningful once the examples exist.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EN_CLOSE_LABEL,
  EN_CONFIRM_NO,
  EN_CONFIRM_TEXT,
  EN_CONFIRM_YES,
  EN_HINT_LABEL,
  EN_IDLE_TEXT,
  EN_LANGUAGE_LABEL,
  EN_LEVEL_DESCRIPTIONS,
  EN_LEVEL_GROUP_LABEL,
  EN_LEVEL_NAMES,
  EN_NEW_LABEL,
  EN_REASON_4X4,
  EN_RESET_LABEL,
  EN_RULES_CLOSE_LABEL,
  EN_RULES_ITEMS,
  EN_RULES_LABEL,
  EN_SETTINGS_LABEL,
  EN_SHEET_LABEL,
  EN_SIZE_GROUP_LABEL,
  EN_START_LABEL,
  EN_SUMMARY_PREFIX,
  EN_TECHNIQUES_HEADING,
  EN_TECHNIQUES_ITEMS,
  EN_THEME_LABEL,
  EN_THEME_OPTION_LABELS,
  EN_TITLE,
  EN_WIN_MESSAGE,
} from './helpers/english';
import {
  CLOSE_LABEL,
  IDLE_TEXT,
  LEVEL_DESCRIPTIONS,
  LEVEL_GROUP_LABEL,
  LEVEL_NAMES,
  REASON_4X4,
  RULES_CLOSE_LABEL,
  RULES_ITEMS,
  RULES_LABEL,
  SETTINGS_LABEL,
  SHEET_LABEL,
  START_LABEL,
  THEME_LABEL,
  THEME_OPTION_LABELS,
  TECHNIQUES_HEADING,
  TECHNIQUES_ITEMS,
  TITLE_TEXT,
  WIN_PUZZLE,
  collectPageText,
  installPageLifecycle,
  mountFixture,
  q,
  rulesPanel,
} from './helpers/play-page';

installPageLifecycle();

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;
const USER_ATTRIBUTES = ['aria-label', 'title', 'alt', 'label'];

/**
 * The texts that `node` shows or exposes: every non-whitespace text node (not under aria-hidden="true") and the values of
 * aria-label, title, alt and label on the node and its descendants. Text nodes are returned untrimmed.
 */
function collectTexts(node: HTMLElement): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
    const text = n as Text;
    if (text.data.trim() === '') continue;
    if (text.parentElement?.closest('[aria-hidden="true"]') != null) continue;
    out.push(text.data);
  }
  for (const el of [node, ...Array.from(node.querySelectorAll('*'))]) {
    for (const name of USER_ATTRIBUTES) {
      const value = el.getAttribute(name);
      if (value !== null) out.push(value);
    }
  }
  return out;
}

describe('@trace NFR-5 the new texts are Ukrainian', () => {
  it('the header, the rules panel (without aria-hidden descendants) and the idle line show the required texts, in Ukrainian only', () => {
    const root = mountFixture(WIN_PUZZLE);
    const header = q(root, 'header');
    const panel = rulesPanel(root);
    const idle = q(root, '[data-message="idle"]');
    const texts = [...collectTexts(header), ...collectTexts(panel), ...collectTexts(idle)];
    const trimmed = texts.map((t) => t.trim());

    // not vacuous: each required text is in the collection at least once
    for (const required of [TITLE_TEXT, RULES_LABEL, RULES_CLOSE_LABEL, ...RULES_ITEMS, IDLE_TEXT]) {
      expect(trimmed, `the collection contains «${required}»`).toContain(required);
    }
    for (const text of texts) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });
});

describe('@trace NFR-5 decorative examples hold no letters', () => {
  it('no element with aria-hidden="true" has a letter of any alphabet in its text content (vacuous while there are none)', () => {
    const root = mountFixture(WIN_PUZZLE);
    for (const el of Array.from(root.querySelectorAll('[aria-hidden="true"]'))) {
      expect(/\p{L}/u.test(el.textContent), `aria-hidden text "${el.textContent}" holds no letter`).toBe(false);
    }
  });
});

describe('@trace NFR-5 the static page text covers the header, the rules panel and the idle line', () => {
  it('Static page text: the collection includes the new texts, none of it is decoration, and every text is Ukrainian', () => {
    const root = mountFixture(WIN_PUZZLE);
    const texts = collectPageText(root);
    const trimmed = texts.map((t) => t.trim());
    for (const required of [TITLE_TEXT, RULES_LABEL, RULES_CLOSE_LABEL, ...RULES_ITEMS, IDLE_TEXT, 'Поле 4×4', 'Поле 6×6', 'Поле 8×8']) {
      expect(trimmed, `collectPageText contains «${required}»`).toContain(required);
    }
    for (const text of texts) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
    // text of aria-hidden elements is decoration: it is not collected
    for (const el of Array.from(root.querySelectorAll('[aria-hidden="true"]'))) {
      const own = el.textContent.trim();
      if (own !== '') expect(trimmed, `decoration "${own}" is not collected`).not.toContain(own);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------
// Source scan: no Cyrillic outside src/ui/strings.ts (design decision 7)
// ---------------------------------------------------------------------------------------------------------

const UI_DIR = `${process.cwd()}/src/ui`;
const STRINGS_FILE = `${UI_DIR}/strings.ts`;
const MAIN_FILE = `${process.cwd()}/src/main.ts`;

function uiSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) out.push(...uiSources(path));
    else if (entry.endsWith('.ts') || entry.endsWith('.css')) out.push(path);
  }
  return out;
}

describe('@trace NFR-5 no Cyrillic text outside the strings module', () => {
  it('scans src/ui/*.ts, src/ui/*.css (not strings.ts) and src/main.ts, and none holds a Cyrillic character (comments included)', () => {
    const files = [...uiSources(UI_DIR).filter((f) => f !== STRINGS_FILE), MAIN_FILE];
    const names = files.map((f) => f.slice(process.cwd().length + 1)).sort();
    // not vacuous: the scan really covers the page modules, the stylesheet and the entry point
    for (const expected of ['src/main.ts', 'src/ui/index.ts', 'src/ui/play-page.ts', 'src/ui/seed.ts', 'src/ui/style.css']) {
      expect(names, `${expected} is scanned`).toContain(expected);
    }
    expect(names).not.toContain('src/ui/strings.ts');
    const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8'))).map((f) => f.slice(process.cwd().length + 1));
    expect(offenders, 'files with a Cyrillic character outside src/ui/strings.ts').toEqual([]);
  });

  it('src/ui/strings.ts exists and contains the title, the idle line and the three rules texts', () => {
    expect(existsSync(STRINGS_FILE), 'src/ui/strings.ts exists').toBe(true);
    const source = existsSync(STRINGS_FILE) ? readFileSync(STRINGS_FILE, 'utf8') : '';
    expect(source).toContain(TITLE_TEXT);
    for (const item of RULES_ITEMS) expect(source, `strings.ts contains «${item}»`).toContain(item);
    // the two non-breaking spaces of the idle line may be written as a literal U+00A0 or as an escape in the source
    const escapes = ['\\u00A0', '\\u00a0', '\\xA0', '\\xa0', '\\u{A0}', '\\u{a0}'];
    const idleForms = [IDLE_TEXT, ...escapes.map((escape) => IDLE_TEXT.replaceAll(' ', escape))];
    expect(
      idleForms.some((form) => source.includes(form)),
      'strings.ts contains the idle line (NBSP literal or escape)',
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Slice DL2 (add-level-selector), scenario «The strings live in the strings module» (FR-94, user decision of 2026-10-05)
// ---------------------------------------------------------------------------------------------------------

// update-setup-sheet-start (FR-94, NFR-5, FR-101): the start label «Почати» is a strings.ts entry (decision of the orchestrator: this test,
// not play-page-controls-text.test.ts).
describe('@trace FR-94 @trace NFR-5 @trace FR-101 the new texts live in the strings module', () => {
  it('The strings live in the strings module: strings.ts holds the hidden prefix, the sheet label, the start label, the close label, the group name, the four names and descriptions, the 4x4 reason, the techniques heading and its three items', () => {
    const source = existsSync(STRINGS_FILE) ? readFileSync(STRINGS_FILE, 'utf8') : '';
    const wanted = [
      'Поле і складність', // the visually hidden prefix and the label of the sheet (the prefix ends in ": ", the format may be split)
      SHEET_LABEL,
      CLOSE_LABEL,
      LEVEL_GROUP_LABEL,
      ...LEVEL_NAMES,
      ...LEVEL_DESCRIPTIONS,
      REASON_4X4,
      TECHNIQUES_HEADING,
      ...TECHNIQUES_ITEMS,
    ];
    for (const text of wanted) expect(source, `strings.ts contains «${text}»`).toContain(text);
    // the start label as a string of its own: «Почати» alone, between quotes. A plain `contains` would pass on the confirmation text
    // «Почати заново? ...» that strings.ts already holds, so it proves nothing about the new label (FR-101).
    expect(source, 'strings.ts holds «Почати» as a string literal of its own').toMatch(new RegExp(`(['"\`])${START_LABEL}\\1`));
    // the separator of the summary « · » (U+00B7) is written as the character or as an escape
    expect(/·|\\u00[Bb]7|\\u\{[Bb]7\}|\\xB7|\\xb7/.test(source), 'strings.ts contains the separator U+00B7 (character or escape)').toBe(true);
  });

  it('no file of src/ui/ other than strings.ts and no src/main.ts holds a Cyrillic character (a guard that holds before the change, and must keep holding)', () => {
    const files = [...uiSources(UI_DIR).filter((f) => f !== STRINGS_FILE), MAIN_FILE];
    expect(files.length, 'the scan covers files').toBeGreaterThan(3);
    const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8'))).map((f) => f.slice(process.cwd().length + 1));
    expect(offenders).toEqual([]);
  });
});

// add-theme-switch (NFR-5, FR-94, FR-102, FR-68), scenario «The settings and theme texts live in the strings module» of the requirement
// «Texts of the settings button, the settings panel and the theme control» (ADDED: no existing test here changes; the Cyrillic source scans
// above already cover every new file of src/ui/ and are guards). Each text must be a string literal of its own: a plain `contains` could
// pass on a longer text that holds the word.
describe('@trace NFR-5 @trace FR-94 @trace FR-102 @trace FR-68 the settings and theme texts live in the strings module', () => {
  it('The settings and theme texts live in the strings module: strings.ts holds the six texts, and no other file of src/ui/ nor src/main.ts has a Cyrillic character', () => {
    const source = existsSync(STRINGS_FILE) ? readFileSync(STRINGS_FILE, 'utf8') : '';
    for (const text of [SETTINGS_LABEL, THEME_LABEL, ...THEME_OPTION_LABELS, CLOSE_LABEL]) {
      expect(source, `strings.ts holds «${text}» as a string literal of its own`).toMatch(new RegExp(`(['"\`])${text}\\1`));
    }
    const files = [...uiSources(UI_DIR).filter((f) => f !== STRINGS_FILE), MAIN_FILE];
    expect(files.length, 'the scan covers files').toBeGreaterThan(3);
    const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8'))).map((f) => f.slice(process.cwd().length + 1));
    expect(offenders).toEqual([]);
  });
});

// add-english-version (NFR-5, FR-94, FR-111, FR-107; delta «Texts of the settings button, the settings panel and the theme control», scenario «The settings and
// theme texts live in the strings module», extended): strings.ts holds the Ukrainian texts of the table AND the English ones of «English page text», and
// the Cyrillic source scans above (unchanged) still find nothing in any other file. Like the scenario above, the file is read as text, never imported (the
// key-parity scenario that does import it is in tests/play-page-english-text.test.ts). A text whose source may hold an escape for U+00A0, U+201C or U+201D
// is matched in either form.
describe('@trace NFR-5 @trace FR-94 @trace FR-111 @trace FR-107 the English texts live in the strings module', () => {
  const source = (): string => (existsSync(STRINGS_FILE) ? readFileSync(STRINGS_FILE, 'utf8') : '');
  const escaped = (text: string): string => text.replaceAll('\u00A0', '\\u00A0').replaceAll('\u201C', '\\u201C').replaceAll('\u201D', '\\u201D');

  it('The English texts live in the strings module: strings.ts holds every constant text of the English table, and «Мова», «Українська» and "English"', () => {
    const text = source();
    const wanted: string[] = [
      EN_TITLE, EN_HINT_LABEL, EN_RESET_LABEL, EN_NEW_LABEL, EN_RULES_LABEL, EN_RULES_CLOSE_LABEL, EN_SIZE_GROUP_LABEL,
      EN_CONFIRM_TEXT, EN_CONFIRM_YES, EN_CONFIRM_NO, ...EN_RULES_ITEMS, EN_IDLE_TEXT, EN_WIN_MESSAGE, EN_SHEET_LABEL, EN_SUMMARY_PREFIX,
      EN_CLOSE_LABEL, EN_START_LABEL, EN_LEVEL_GROUP_LABEL, ...EN_LEVEL_NAMES, ...EN_LEVEL_DESCRIPTIONS, EN_REASON_4X4, EN_TECHNIQUES_HEADING,
      ...EN_TECHNIQUES_ITEMS, EN_SETTINGS_LABEL, EN_THEME_LABEL, ...EN_THEME_OPTION_LABELS, EN_LANGUAGE_LABEL,
    ];
    for (const english of wanted) {
      expect(text.includes(english) || text.includes(escaped(english)), `strings.ts holds the English text "${english}"`).toBe(true);
    }
    for (const ukrainian of ['Мова', 'Українська', 'English']) {
      expect(text, `strings.ts holds «${ukrainian}» as a string literal of its own`).toMatch(new RegExp(`(['"\`])${ukrainian}\\1`));
    }
  });
});

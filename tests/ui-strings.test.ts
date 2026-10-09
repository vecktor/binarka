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
  CLOSE_LABEL,
  IDLE_TEXT,
  LEVEL_DESCRIPTIONS,
  LEVEL_GROUP_LABEL,
  LEVEL_NAMES,
  REASON_4X4,
  RULES_CLOSE_LABEL,
  RULES_ITEMS,
  RULES_LABEL,
  SHEET_LABEL,
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

describe('@trace FR-94 the new texts live in the strings module', () => {
  it('The strings live in the strings module: strings.ts holds the hidden prefix, the sheet label, the close label, the group name, the four names and descriptions, the 4x4 reason, the techniques heading and its three items', () => {
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

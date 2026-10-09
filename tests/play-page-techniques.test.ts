// Play page: the rules panel with the techniques section (FR-93, FR-57) and the Ukrainian texts of the summary, the setup sheet,
// the level control and the techniques section (FR-94, NFR-5, NFR-4). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md ("Rules panel", "Ukrainian texts of the summary, the setup sheet, the
// level control and the techniques section"). Written FIRST (red): the panel holds one heading and three items.
//
// @trace FR-93
// @trace FR-57
// @trace FR-94
// @trace NFR-5
// @trace NFR-4
//
// The panel is read by position and by the hook `[data-section="techniques"]`, a spec-made proxy confirmed against the design
// reference (design.md ambiguity E). Exact texts are literals; this file never imports src/ui/strings.ts. The scan of the source files
// (strings.ts holds the texts, no other file holds Cyrillic) is in tests/ui-strings.test.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  CLOSE_LABEL,
  LEVEL_DESCRIPTIONS,
  LEVEL_GROUP_LABEL,
  LEVEL_NAMES,
  REASON_4X4,
  RULES_CLOSE_LABEL,
  RULES_ITEMS,
  RULES_LABEL,
  SHEET_LABEL,
  SUMMARY_PREFIX,
  TECHNIQUES_HEADING,
  TECHNIQUES_ITEMS,
  chooseLevel,
  generatorBySize,
  installPageLifecycle,
  levelReason,
  mountFixture,
  mountPage,
  q,
  rulesPanel,
  seedQueue,
  selectSize,
  sheetOf,
  summaryButton,
  textWithoutHidden,
  START_LABEL,
} from './helpers/play-page';

installPageLifecycle();

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /[A-Za-z]/;
const ONE_SENTENCE = /^[^.!?…]+\.$/;
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/** The rules list of the panel: its `ul` that is a direct child. */
function rulesList(panel: HTMLElement): HTMLElement | undefined {
  return Array.from(panel.children).find((child): child is HTMLElement => child.tagName === 'UL');
}

const itemTexts = (list: Element | null | undefined): string[] =>
  list === null || list === undefined ? [] : Array.from(list.querySelectorAll('li')).map((li) => textWithoutHidden(li).trim());

// ---------------------------------------------------------------------------------------------------------
// Requirement: Rules panel (FR-93, FR-57)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-93 @trace FR-57 the rules panel holds the techniques section', () => {
  it('Rules panel structure at mount', () => {
    const root = mountFixture(BLANK);
    expect(root.querySelectorAll('[data-section="rules"]'), 'exactly one panel').toHaveLength(1);
    const panel = rulesPanel(root);
    expect(panel.hasAttribute('popover')).toBe(true);
    const board = q(root, '[data-board]');
    expect(board.contains(panel), 'not inside [data-board]').toBe(false);
    expect(board.parentElement?.contains(panel), 'not inside the board host').toBe(false);

    const headings = Array.from(panel.querySelectorAll(HEADINGS));
    expect(headings.map((h) => `${h.tagName}:${h.textContent}`), 'an h2 «Правила», then an h3 «Складніші прийоми»').toEqual([
      `H2:${RULES_LABEL}`,
      `H3:${TECHNIQUES_HEADING}`,
    ]);

    const list = rulesList(panel);
    expect.assert(list !== undefined, 'the rules list is a ul that is a direct child of the panel');
    expect(list.querySelectorAll('li'), 'the rules list has three items').toHaveLength(3);
    expect(itemTexts(list), 'in order').toEqual(RULES_ITEMS);

    const section = q(panel, '[data-section="techniques"]');
    expect(panel.contains(section), 'the techniques section is inside the panel').toBe(true);
    expect(list.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING, 'it follows the rules list').not.toBe(0);
    expect(section.contains(list), 'and the rules list is not inside it').toBe(false);
    expect(section.querySelectorAll(HEADINGS), 'it holds the h3').toHaveLength(1);
    expect(section.querySelector('h3')?.textContent).toBe(TECHNIQUES_HEADING);
    expect(section.querySelectorAll('ul'), 'exactly one ul').toHaveLength(1);
    expect(section.querySelectorAll('li'), 'with exactly three li').toHaveLength(3);
    expect(itemTexts(section.querySelector('ul')), 'in order').toEqual(TECHNIQUES_ITEMS);
    expect(section.querySelectorAll('[aria-hidden]'), 'no aria-hidden element').toHaveLength(0);
    expect(section.hasAttribute('id') || section.querySelector('[id]') !== null, 'no id').toBe(false);

    const buttons = panel.querySelectorAll('button');
    expect(buttons, 'exactly one button').toHaveLength(1);
    const close = buttons[0];
    expect.assert(close !== undefined, 'premise: the panel has a button');
    expect(close.textContent.trim()).toBe(RULES_CLOSE_LABEL);
    expect(close.getAttribute('popovertarget')).toBe(panel.getAttribute('id'));
    expect(close.getAttribute('popovertargetaction')).toBe('hide');
    expect(section.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING, 'the button follows the techniques section').not.toBe(0);
  });

  it('No rules block under the board and no details element: six li, all in the panel', () => {
    const root = mountFixture(BLANK);
    expect(root.querySelectorAll('details')).toHaveLength(0);
    const items = Array.from(root.querySelectorAll('li'));
    expect(items, 'three in the rules list and three in the techniques section').toHaveLength(6);
    const panel = rulesPanel(root);
    for (const li of items) expect(panel.contains(li), 'every li is inside [data-section="rules"]').toBe(true);
  });

  it('The panel survives a level change: the same element, the same two headings and six li texts', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK }) });
    const panel = rulesPanel(root);
    const headings = Array.from(panel.querySelectorAll(HEADINGS)).map((h) => h.textContent);
    const texts = itemTexts(panel);
    expect(texts, 'premise: six items at mount').toHaveLength(6);

    chooseLevel(root, 2);

    expect(root.querySelectorAll('[data-section="rules"]')).toHaveLength(1);
    expect(rulesPanel(root), 'the same element as at mount').toBe(panel);
    expect(Array.from(panel.querySelectorAll(HEADINGS)).map((h) => h.textContent)).toEqual(headings);
    expect(headings).toEqual([RULES_LABEL, TECHNIQUES_HEADING]);
    expect(itemTexts(panel)).toEqual(texts);
    expect(q(root, '[data-action="rules"]').getAttribute('popovertarget'), 'the rules button still names its id').toBe(panel.getAttribute('id'));
  });
});

// ---------------------------------------------------------------------------------------------------------
// Requirement: Ukrainian texts of the summary, the setup sheet, the level control and the techniques section (FR-94, NFR-5, NFR-4)
// ---------------------------------------------------------------------------------------------------------

/**
 * The texts the summary button (without its aria-hidden descendants), the sheet and the techniques section show or expose:
 * every non-whitespace text node (not under aria-hidden="true") and the values of aria-label, title, alt and label inside them,
 * with the aria-label of the sheet itself. Not trimmed.
 */
function collectNewTexts(root: HTMLElement): string[] {
  const out: string[] = [];
  const holders = [summaryButton(root), sheetOf(root), q(rulesPanel(root), '[data-section="techniques"]')];
  for (const holder of holders) {
    const walker = document.createTreeWalker(holder, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
      const text = n as Text;
      if (text.data.trim() === '') continue;
      if (text.parentElement?.closest('[aria-hidden="true"]') != null) continue;
      out.push(text.data);
    }
    for (const el of [holder, ...Array.from(holder.querySelectorAll('*'))]) {
      for (const name of ['aria-label', 'title', 'alt', 'label']) {
        const value = el.getAttribute(name);
        if (value !== null) out.push(value);
      }
    }
  }
  return out;
}

// update-setup-sheet-start (NFR-5, FR-94, FR-101): «Почати» joins the required list of «The new texts are Ukrainian».
describe('@trace NFR-5 @trace FR-94 @trace FR-101 the new texts are Ukrainian', () => {
  it('The new texts are Ukrainian', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    const at6 = collectNewTexts(root);
    selectSize(root, 4);
    const at4 = collectNewTexts(root);

    for (const required of [
      SUMMARY_PREFIX,
      '6×6 · Розминка',
      SHEET_LABEL,
      START_LABEL,
      CLOSE_LABEL,
      LEVEL_GROUP_LABEL,
      ...LEVEL_NAMES,
      ...LEVEL_DESCRIPTIONS,
      TECHNIQUES_HEADING,
      ...TECHNIQUES_ITEMS,
    ]) {
      expect(at6, `at 6x6 the collection contains «${required}»`).toContain(required);
    }
    expect(at4, 'at 4x4 the collection contains the summary and the reason').toEqual(expect.arrayContaining([SUMMARY_PREFIX, '4×4 · Розминка', REASON_4X4]));
    for (const text of [...at6, ...at4]) {
      expect(CYRILLIC.test(text), `"${text}" has Cyrillic letters`).toBe(true);
      expect(LATIN.test(text), `"${text}" has no Latin letters`).toBe(false);
    }
  });

  it('The techniques items and the reason are one sentence each', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    const items = itemTexts(q(rulesPanel(root), '[data-section="techniques"] ul'));
    expect(items, 'the items are read from the page').toEqual(TECHNIQUES_ITEMS);
    selectSize(root, 4);
    const reason = levelReason(root).textContent;
    expect(reason, 'the reason is read from the page at 4x4').toBe(REASON_4X4);

    for (const text of [...items, reason, ...TECHNIQUES_ITEMS, REASON_4X4]) {
      expect(text, `"${text}" is one sentence`).toMatch(ONE_SENTENCE);
    }
  });
});

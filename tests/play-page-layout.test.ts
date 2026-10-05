// Play page: rules panel (FR-57), page document order (FR-61) and idle line (FR-64).
// Scenarios of the delta spec openspec/changes/update-page-layout/specs/play-page/spec.md ("Rules panel",
// "Page document order", "Idle line"). Written FIRST (red).
//
// jsdom has no popover behaviour (no showPopover/hidePopover/togglePopover) and no layout: these tests assert attributes,
// DOM position and that no popover method is called. Where the panel or the idle line is drawn and whether the idle line is
// visible is layout, covered by the held NFR-9 / NFR-13 / NFR-14 and NOT claimed here.
// Exact texts are literals (tests/helpers/play-page.ts); this file never imports src/ui/strings.ts.
//
// CHARACTERISATION GUARDS: the scenarios below marked "(characterisation guard)" already pass against the page of the slice
// before this change (no details element, three li, hint and win empty at mount). They are expected GREEN from the start and
// must stay green; they are not the red evidence of this slice.
import { afterEach, describe, expect, it } from 'vitest';
import {
  BLANK_4,
  BLANK_8,
  IDLE_TEXT,
  PAGE_ORDER,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  RULES_CLOSE_LABEL,
  RULES_ITEMS,
  RULES_LABEL,
  TITLE_TEXT,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  bySize,
  expectInDocumentOrder,
  fillFrom,
  generateSpy,
  hintMessage,
  installPageLifecycle,
  messageArea,
  mountFixture,
  mountPage,
  pressHint,
  pressNew,
  q,
  rulesPanel,
  seedQueue,
  selectSize,
  snapshot,
  solutionGrid,
  textWithoutHidden,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const RULES_BUTTON = '[data-action="rules"]';
const POPOVER_METHODS = ['showPopover', 'hidePopover', 'togglePopover'] as const;
const HEADINGS = 'h1, h2, h3, h4, h5, h6';

const pressReset = (root: ParentNode): void => q(root, '[data-action="reset"]').click();
const idleLine = (root: ParentNode): HTMLElement => q(root, '[data-message="idle"]');

/** The rules panel as read now: texts without aria-hidden descendants (A-26), and the ids that tie it to its buttons. */
function readPanel(root: HTMLElement): {
  el: HTMLElement;
  id: string;
  headings: string[];
  items: string[];
  buttonId: string | null;
} {
  const el = rulesPanel(root);
  return {
    el,
    id: el.getAttribute('id') ?? '',
    headings: Array.from(el.querySelectorAll(HEADINGS)).map((h) => textWithoutHidden(h).trim()),
    items: Array.from(el.querySelectorAll('li')).map((li) => textWithoutHidden(li).trim()),
    buttonId: q(root, RULES_BUTTON).getAttribute('popovertarget'),
  };
}

/** Assert the nine elements of FR-61 exist exactly once in the root and follow each other in the specified order. */
function expectNineInOrder(root: HTMLElement): void {
  const elements = PAGE_ORDER.map((selector) => {
    expect(root.querySelectorAll(selector), `exactly one ${selector}`).toHaveLength(1);
    return q(root, selector);
  });
  expectInDocumentOrder(elements);
}

/**
 * Install spies for the three popover methods on HTMLElement.prototype (jsdom has none: define them, and restore or delete
 * them afterwards). Returns the call log and the restore function.
 */
function installPopoverSpies(): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  const saved = POPOVER_METHODS.map((name) => ({ name, own: Object.getOwnPropertyDescriptor(HTMLElement.prototype, name) }));
  for (const name of POPOVER_METHODS) {
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      writable: true,
      value: function popoverSpy(): void {
        calls.push(name);
      },
    });
  }
  const restore = (): void => {
    for (const { name, own } of saved) {
      if (own === undefined) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[name];
      else Object.defineProperty(HTMLElement.prototype, name, own);
    }
  };
  return { calls, restore };
}

// Safety net: a failed assertion inside a spied test must never leave the prototype patched for the other test files.
let activeRestore: (() => void) | null = null;
afterEach(() => {
  activeRestore?.();
  activeRestore = null;
});

// ---------------------------------------------------------------------------------------------------------
// Rules panel (FR-57)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-57 the rules button is in the header', () => {
  it('Rules button in the header: exactly one [data-action="rules"], a button «Правила», popovertarget = the panel id', () => {
    const root = mountFixture(WIN_PUZZLE);
    const header = q(root, 'header');
    const buttons = header.querySelectorAll(RULES_BUTTON);
    expect(buttons).toHaveLength(1);
    const button = buttons[0] as HTMLElement;
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent?.trim()).toBe(RULES_LABEL);

    const target = button.getAttribute('popovertarget');
    expect(target, 'popovertarget is non-empty').not.toBeNull();
    expect(target).not.toBe('');
    expect(rulesPanel(root).getAttribute('id')).toBe(target);
    // the button names the panel by id: the id resolves to the panel in the document
    expect(document.getElementById(target as string)).toBe(rulesPanel(root));
  });
});

describe('@trace FR-57 the rules panel at mount', () => {
  it('Rules panel structure: popover attribute, heading «Правила», three li items in order, one close button «Зрозуміло»', () => {
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);

    expect(panel.hasAttribute('popover'), 'the panel has the popover attribute').toBe(true);
    const board = q(root, '[data-board]');
    const boardHost = board.parentElement as HTMLElement;
    expect(board.contains(panel), 'the panel is not inside [data-board]').toBe(false);
    expect(boardHost.contains(panel), 'the panel is not inside the board host').toBe(false);
    expect(panel.contains(board), 'the board is not inside the panel').toBe(false);
    expect(root.contains(panel), 'the panel is inside the page root').toBe(true);

    const read = readPanel(root);
    expect(read.headings).toEqual([RULES_LABEL]);
    expect(read.items).toEqual(RULES_ITEMS);
    expect(panel.querySelectorAll('li')).toHaveLength(3);

    const closeButtons = panel.querySelectorAll('button');
    expect(closeButtons, 'exactly one button in the panel').toHaveLength(1);
    const close = closeButtons[0] as HTMLElement;
    expect(close.textContent?.trim()).toBe(RULES_CLOSE_LABEL);
    expect(read.id, 'the panel has a non-empty id').not.toBe('');
    expect(close.getAttribute('popovertarget')).toBe(read.id);
    expect(close.getAttribute('popovertargetaction')).toBe('hide');
  });

  // Added after green in review fix round 1 (wf_e90d3ea5-de4): a role-less popover div cannot take a name, so the panel
  // has role="dialog" and is named by its heading. Coverage of the fix, not part of the red evidence.
  it('the panel has role="dialog" and aria-labelledby points at its heading «Правила»', () => {
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    expect(panel.getAttribute('role')).toBe('dialog');
    const labelId = panel.getAttribute('aria-labelledby') ?? '';
    expect(labelId, 'aria-labelledby is set').not.toBe('');
    const heading = panel.querySelector(`[id="${labelId}"]`);
    expect(heading?.tagName).toBe('H2');
    expect(heading?.textContent?.trim()).toBe(RULES_LABEL);
  });
});

describe('@trace FR-57 no rules block under the board and no details element', () => {
  // (characterisation guard) passes against the page before this change: it has no <details> and exactly three li, all in the
  // [data-section="rules"] block. Must stay green.
  it('No details element anywhere; exactly three li in the root, every one inside [data-section="rules"]', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(root.querySelectorAll('details')).toHaveLength(0);
    const items = Array.from(root.querySelectorAll('li'));
    expect(items).toHaveLength(3);
    const panel = rulesPanel(root);
    for (const li of items) expect(panel.contains(li), 'li is inside [data-section="rules"]').toBe(true);
  });
});

describe('@trace FR-57 the panel opens with no script', () => {
  it('Clicking the rules button and the close button calls none of showPopover, hidePopover, togglePopover', () => {
    const spies = installPopoverSpies();
    activeRestore = spies.restore;
    try {
      const root = mountFixture(WIN_PUZZLE);
      const read = readPanel(root);
      const panelAttributes = Array.from(read.el.attributes).map((a) => `${a.name}=${a.value}`);
      const cells = snapshot(root);
      const hintBefore = hintMessage(root);
      const winBefore = winMessage(root);
      const boardBefore = q(root, '[data-board]');

      q(root, RULES_BUTTON).click();
      (read.el.querySelector('button') as HTMLElement).click();

      expect(spies.calls, 'no popover method was called').toEqual([]);
      const after = readPanel(root);
      expect(after.el).toBe(read.el);
      expect(Array.from(after.el.attributes).map((a) => `${a.name}=${a.value}`)).toEqual(panelAttributes);
      expect(after.headings).toEqual(read.headings);
      expect(after.items).toEqual(read.items);
      expect(q(root, '[data-board]')).toBe(boardBefore);
      expect(snapshot(root)).toEqual(cells);
      expect(allCells(root)).toHaveLength(36);
      expect(hintMessage(root)).toBe(hintBefore);
      expect(winMessage(root)).toBe(winBefore);
      // not vacuous: the page is the new one (a panel with the popover attribute and a rules button exist)
      expect(read.el.hasAttribute('popover')).toBe(true);
    } finally {
      spies.restore();
      activeRestore = null;
    }
  });

  it('the spies are real: a call of each method on an element is recorded and the prototype is restored afterwards', () => {
    const before = POPOVER_METHODS.map((name) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
    const spies = installPopoverSpies();
    try {
      const probe = document.createElement('div') as unknown as Record<string, () => void>;
      for (const name of POPOVER_METHODS) (probe[name] as () => void)();
      expect(spies.calls).toEqual([...POPOVER_METHODS]);
    } finally {
      spies.restore();
    }
    expect(POPOVER_METHODS.map((name) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, name))).toEqual(before);
  });
});

describe('@trace FR-57 two mounts stay independent', () => {
  it('two roots in one document have panels with different ids, and each button names the panel of its own root', () => {
    const a = mountPage({ seedSource: () => 1 });
    const b = mountPage({ seedSource: () => 2 });
    const panelA = rulesPanel(a);
    const panelB = rulesPanel(b);
    const idA = panelA.getAttribute('id');
    const idB = panelB.getAttribute('id');
    expect(idA, 'panel A has an id').toBeTruthy();
    expect(idB, 'panel B has an id').toBeTruthy();
    expect(idA).not.toBe(idB);
    expect(q(a, RULES_BUTTON).getAttribute('popovertarget')).toBe(idA);
    expect(q(b, RULES_BUTTON).getAttribute('popovertarget')).toBe(idB);
    // the id resolves, in the whole document, to the panel of the same root
    expect(document.getElementById(idA as string)).toBe(panelA);
    expect(document.getElementById(idB as string)).toBe(panelB);
    // and the close button of each panel names its own panel
    expect(panelA.querySelector('button')?.getAttribute('popovertarget')).toBe(idA);
    expect(panelB.querySelector('button')?.getAttribute('popovertarget')).toBe(idB);
  });
});

describe('@trace FR-57 the panel survives every board change', () => {
  const ACTIONS = ['new puzzle', 'size 4', 'size 8', 'win'] as const;

  it.each(ACTIONS)('after %s there is still exactly one panel, the same element, with the same texts and the button naming its id', (action) => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: WIN_PUZZLE, 4: BLANK_4, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const atMount = readPanel(root);
    expect(atMount.headings).toEqual([RULES_LABEL]);
    expect(atMount.items).toEqual(RULES_ITEMS);
    expect(atMount.el.hasAttribute('popover')).toBe(true);
    expect(atMount.buttonId).toBe(atMount.id);
    const cellsAtMount = allCells(root).length;

    if (action === 'new puzzle') {
      pressNew(root);
      expect(spy.calls, 'premise: a new puzzle was really generated').toHaveLength(2);
    } else if (action === 'size 4') {
      selectSize(root, 4);
      expect(q(root, '[data-board]').getAttribute('data-size')).toBe('4');
    } else if (action === 'size 8') {
      selectSize(root, 8);
      expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    } else {
      fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
      expect(winMessage(root), 'premise: the win was reached').toBe(WIN_MESSAGE);
    }

    const after = readPanel(root);
    expect(after.el, 'the panel is created once at mount, not rebuilt with the board').toBe(atMount.el);
    expect(after.headings).toEqual(atMount.headings);
    expect(after.items).toEqual(atMount.items);
    expect(after.id).toBe(atMount.id);
    expect(after.buttonId, 'the rules button still names the panel id').toBe(atMount.id);
    if (action === 'size 4' || action === 'size 8') expect(allCells(root).length, 'premise: the board was replaced').not.toBe(cellsAtMount);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Page document order (FR-61)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-61 order at mount', () => {
  it('header, size control, board, hint, reset, new buttons, idle, hint and win messages follow each other in this order', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectNineInOrder(root);
  });

  it('the header holds the heading «Бінарка» followed by the rules button', () => {
    const root = mountFixture(WIN_PUZZLE);
    const header = q(root, 'header');
    const heading = Array.from(header.querySelectorAll(HEADINGS)).find((h) => (h.textContent ?? '').trim() === TITLE_TEXT);
    expect(heading, `a heading «${TITLE_TEXT}» in the header`).toBeDefined();
    const button = q(header, RULES_BUTTON);
    expectInDocumentOrder([heading as Element, button]);
  });
});

describe('@trace FR-61 the message area holds the three messages', () => {
  it('the parent of the idle line holds exactly idle, hint, win in this order and follows the three action buttons', () => {
    const root = mountFixture(WIN_PUZZLE);
    const area = messageArea(root);
    expect(area, 'the message area is not the page root itself').not.toBe(root);
    expect(Array.from(area.querySelectorAll('[data-message]')).map((m) => m.getAttribute('data-message'))).toEqual(['idle', 'hint', 'win']);
    expect(area.contains(q(root, '[data-message="hint"]'))).toBe(true);
    expect(area.contains(q(root, '[data-message="win"]'))).toBe(true);
    for (const action of ['hint', 'reset', 'new']) {
      const button = q(root, `[data-action="${action}"]`);
      expect(area.contains(button), `the ${action} button is not inside the message area`).toBe(false);
      expectInDocumentOrder([button, area]);
    }
    expect(area.querySelector('[data-board], [data-action], [data-section="rules"]'), 'only messages live in the message area').toBeNull();
  });
});

describe('@trace FR-61 the panel is outside the sequence', () => {
  it('the panel is not inside the header, the message area or [data-board], and it follows the message area', () => {
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    const area = messageArea(root);
    expect(q(root, 'header').contains(panel)).toBe(false);
    expect(area.contains(panel)).toBe(false);
    expect(q(root, '[data-board]').contains(panel)).toBe(false);
    expectInDocumentOrder([area, panel]);
  });
});

describe('@trace FR-61 the order and the message area survive every board change', () => {
  const ACTIONS = ['new puzzle', 'size 4', 'size 8', 'reset', 'win'] as const;

  it.each(ACTIONS)('after %s the nine elements still exist once, in the same order, and the messages are in the same message area', (action) => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: action === 'win' ? WIN_PUZZLE : PAIR_ROW, 4: PAIR_4, 8: PAIR_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expectNineInOrder(root);
    const areaAtMount = messageArea(root);
    const idleAtMount = idleLine(root);

    if (action === 'win') {
      // the hint is the last move: it fills the last open cell, so the hint message and the win message both have text
      fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
      pressHint(root);
      expect(hintMessage(root), 'premise: the hint message has text').not.toBe('');
      expect(winMessage(root), 'premise: the win was reached').toBe(WIN_MESSAGE);
    } else {
      pressHint(root);
      expect(hintMessage(root), 'premise: the hint message has text').not.toBe('');
      if (action === 'new puzzle') {
        pressNew(root);
        expect(spy.calls, 'premise: a new puzzle was really generated').toHaveLength(2);
      } else if (action === 'size 4') {
        selectSize(root, 4);
        expect(q(root, '[data-board]').getAttribute('data-size')).toBe('4');
      } else if (action === 'size 8') {
        selectSize(root, 8);
        expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
      } else {
        pressReset(root);
      }
    }

    expectNineInOrder(root);
    expect(messageArea(root), 'the message area is the same element').toBe(areaAtMount);
    expect(idleLine(root)).toBe(idleAtMount);
    expect(Array.from(areaAtMount.querySelectorAll('[data-message]')).map((m) => m.getAttribute('data-message'))).toEqual(['idle', 'hint', 'win']);
    expect(areaAtMount.contains(q(root, '[data-message="hint"]'))).toBe(true);
    expect(areaAtMount.contains(q(root, '[data-message="win"]'))).toBe(true);
    expectInDocumentOrder([areaAtMount, rulesPanel(root)]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Idle line (FR-64)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-64 idle line text, code point by code point', () => {
  it('the text equals the sentence with two U+00A0 and the Cyrillic і (U+0456) after the first one', () => {
    const root = mountFixture(WIN_PUZZLE);
    const text = idleLine(root).textContent ?? '';

    expect(text).toBe('Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.');
    expect(Array.from(text).filter((ch) => ch === ' ')).toHaveLength(2);
    const first = text.indexOf(' ');
    const second = text.indexOf(' ', first + 1);
    expect(text.codePointAt(first - 1), 'the digit 0 comes before the first U+00A0').toBe(0x30);
    expect(text.codePointAt(first + 1), 'the character after the first U+00A0 is U+0456').toBe(0x456);
    expect(text.codePointAt(second - 1), 'the Cyrillic і comes before the second U+00A0').toBe(0x456);
    expect(text.codePointAt(second + 1), 'the digit 1 comes after the second U+00A0').toBe(0x31);
    // every other space is an ordinary U+0020, the dash is U+2014 and the quotes are U+00AB / U+00BB
    for (const ch of text) if (/\s/.test(ch) && ch !== ' ') expect(ch.codePointAt(0)).toBe(0x20);
    expect(text.includes('—')).toBe(true);
    expect(text.includes('«') && text.includes('»')).toBe(true);
    // the shared helper literal is the same sentence (so the other files compare against it)
    expect(IDLE_TEXT).toBe(text);
  });
});

describe('@trace FR-64 the idle line stays in the DOM and untouched', () => {
  const ACTIONS = ['hint', 'win', 'new puzzle', 'reset'] as const;

  it.each(ACTIONS)('after %s the idle line is in the DOM once, with the same text, no hidden attribute and no style attribute', (action) => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy(bySize({ 6: action === 'win' ? WIN_PUZZLE : PAIR_ROW }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const textAtMount = idleLine(root).textContent;
    expect(textAtMount).toBe(IDLE_TEXT);
    expect(idleLine(root).hasAttribute('hidden'), 'no hidden at mount').toBe(false);
    expect(idleLine(root).hasAttribute('style'), 'no style at mount').toBe(false);

    if (action === 'hint') {
      pressHint(root);
      expect(hintMessage(root), 'premise: the hint message has text').not.toBe('');
    } else if (action === 'win') {
      fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
      pressHint(root);
      expect(winMessage(root), 'premise: the win message has text').toBe(WIN_MESSAGE);
    } else if (action === 'new puzzle') {
      pressNew(root);
      expect(spy.calls, 'premise: a new puzzle was really generated').toHaveLength(2);
    } else {
      pressHint(root);
      expect(hintMessage(root), 'premise: the hint message has text before the reset').not.toBe('');
      pressReset(root);
      expect(hintMessage(root), 'premise: the reset cleared the hint message').toBe('');
    }

    expect(root.querySelectorAll('[data-message="idle"]'), 'the idle line is in the DOM exactly once').toHaveLength(1);
    expect(idleLine(root).textContent).toBe(textAtMount);
    expect(idleLine(root).hasAttribute('hidden'), 'no hidden attribute (only CSS can hide it)').toBe(false);
    expect(idleLine(root).hasAttribute('style'), 'no style attribute (only CSS can hide it)').toBe(false);
  });
});

describe('@trace FR-64 the hint and win messages are empty at mount', () => {
  // (characterisation guard) passes against the page before this change: both elements exist and are empty with no child node.
  // Must stay green: the CSS rule that shows the idle line while both are empty relies on it (:empty).
  it('both have empty text content and no child node', () => {
    const root = mountFixture(WIN_PUZZLE);
    for (const kind of ['hint', 'win']) {
      const node = q(root, `[data-message="${kind}"]`);
      expect(node.textContent, `${kind} text`).toBe('');
      expect(node.childNodes.length, `${kind} child nodes`).toBe(0);
    }
  });
});

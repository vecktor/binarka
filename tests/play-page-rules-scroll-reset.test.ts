// Play page: the rules panel's scroll reset (update-rules-panel, FR-57, A-59, A-20; RQ-1 A). Scenarios of the delta spec
// openspec/changes/update-rules-panel/specs/play-page/spec.md: «The scroll position is reset when the panel closes and when it opens» and the new AND
// clause of «The panel opens with no script». Written FIRST (red) from the spec, before the port.
//
// jsdom has no popover and no ToggleEvent: a test dispatches a plain `Event` named `beforetoggle` (helper `dispatchBeforeToggle`, newState `closed`,
// while the panel is still shown) and a plain `Event` named `toggle` (helper `dispatchToggle`, newState `open`) on the panel, as A-44 and A-46 do. The
// reset is one assignment, `panel.scrollTop = 0`, per listener. The browser half (a real second opening, the sticky button, the race with the end-scroll
// driver) is e2e/nfr-14-rules-panel.spec.ts; jsdom has no layout, so nothing here claims where the panel is drawn.
//
// Tests that pass today by design are marked GUARD in their name (the «unchanged» clauses and the helper premise).
//
// @trace FR-57
import { afterEach, describe, expect, it } from 'vitest';
import { RULES_CLOSE_LABEL, WIN_PUZZLE, allCells, dispatchBeforeToggle, dispatchToggle, installPageLifecycle, mountFixture, mountPage, popoverIsOpen, q, rulesPanel, snapshot, textWithoutHidden } from './helpers/play-page';

installPageLifecycle();

const RULES_BUTTON = '[data-action="rules"]';
const POPOVER_METHODS = ['showPopover', 'hidePopover', 'togglePopover'] as const;

/**
 * Spies for the three popover methods on HTMLElement.prototype (the lifecycle's A-44 stubs are there already; the spies overwrite them and `restore`
 * puts the stubs back). They count calls and do nothing else, so a reset that called one of them would show in `calls`.
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
      if (own === undefined) Reflect.deleteProperty(HTMLElement.prototype, name);
      else Object.defineProperty(HTMLElement.prototype, name, own);
    }
  };
  return { calls, restore };
}

// Safety net: a failed assertion inside a spied test must never leave the prototype patched for the other tests.
let activeRestore: (() => void) | null = null;
afterEach(() => {
  activeRestore?.();
  activeRestore = null;
});

/**
 * The premise of the scenario: jsdom keeps an assigned `scrollTop`. If a jsdom version does not, the panel gets an own `scrollTop` accessor that
 * records the writes (the scenario's fallback), so the reset is still observable. Returns true when the fallback had to be installed.
 */
function ensureScrollTopIsKept(panel: HTMLElement): boolean {
  panel.scrollTop = 120;
  if (panel.scrollTop === 120) {
    panel.scrollTop = 0;
    return false;
  }
  let stored = 0;
  Object.defineProperty(panel, 'scrollTop', { configurable: true, get: () => stored, set: (value: number) => { stored = value; } });
  panel.scrollTop = 120;
  expect(panel.scrollTop, 'premise: the fallback accessor keeps an assigned scrollTop').toBe(120);
  panel.scrollTop = 0;
  return true;
}

/** Everything the scenario says must be unchanged: the panel's attributes, its headings and list texts, its autofocus button, and the board. */
function readPage(root: HTMLElement): {
  panel: HTMLElement;
  attributes: string[];
  texts: string[];
  autofocus: Element[];
  board: Element;
  cells: string[];
  cellCount: number;
} {
  const panel = rulesPanel(root);
  return {
    panel,
    attributes: Array.from(panel.attributes).map((a) => `${a.name}=${a.value}`),
    texts: Array.from(panel.querySelectorAll('h2, h3, li, button')).map((el) => `${el.tagName}: ${textWithoutHidden(el).trim()}`),
    autofocus: Array.from(root.querySelectorAll('[autofocus]')),
    board: q(root, '[data-board]'),
    cells: snapshot(root),
    cellCount: allCells(root).length,
  };
}

describe('The scroll position is reset when the panel closes and when it opens', () => {
  it('GUARD: the premise: jsdom keeps an assigned scrollTop of 120 on the panel (if a jsdom version does not, the recording accessor of the scenario keeps it)', () => {
    const panel = rulesPanel(mountFixture(WIN_PUZZLE));
    const fallback = ensureScrollTopIsKept(panel);
    panel.scrollTop = 120;
    expect(panel.scrollTop, `the assigned scrollTop is read back as 120 (recording accessor installed: ${String(fallback)})`).toBe(120);
  });

  it('beforetoggle (newState closed, oldState open) resets the scrollTop of the panel to 0, and calls no popover method', () => {
    const spies = installPopoverSpies();
    activeRestore = spies.restore;
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    ensureScrollTopIsKept(panel);
    panel.scrollTop = 120;
    expect(panel.scrollTop, 'premise: scrollTop 120 before the event').toBe(120);

    dispatchBeforeToggle(panel, 'closed');

    expect(panel.scrollTop, 'beforetoggle closed resets scrollTop to 0').toBe(0);
    expect(spies.calls, 'no popover method was called by the reset').toEqual([]);
    expect(popoverIsOpen(panel), 'the dispatch did not change the stub open state').toBe(false);
  });

  it('toggle (newState open, oldState closed) resets the scrollTop of the panel to 0 again, and calls no popover method', () => {
    const spies = installPopoverSpies();
    activeRestore = spies.restore;
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    ensureScrollTopIsKept(panel);
    panel.scrollTop = 80;
    expect(panel.scrollTop, 'premise: scrollTop 80 before the event').toBe(80);

    dispatchToggle(panel, 'open');

    expect(panel.scrollTop, 'toggle open resets scrollTop to 0').toBe(0);
    expect(spies.calls, 'no popover method was called by the reset').toEqual([]);
  });

  it('the two events in the order of a real closing and opening: 120 -> beforetoggle closed -> 0, then 80 -> toggle open -> 0', () => {
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    ensureScrollTopIsKept(panel);
    panel.scrollTop = 120;
    dispatchBeforeToggle(panel, 'closed');
    expect(panel.scrollTop, 'beforetoggle closed resets scrollTop to 0').toBe(0);
    panel.scrollTop = 80;
    dispatchToggle(panel, 'open');
    expect(panel.scrollTop, 'toggle open resets scrollTop to 0 again').toBe(0);
  });

  // The handlers do nothing else: only beforetoggle with newState closed and toggle with newState open reset (review finding 2 of the gate,
  // the MODIFIED «Rules panel»: "does nothing else in those two handlers").
  it('beforetoggle with newState open and toggle with newState closed leave the scrollTop as it is', () => {
    const root = mountFixture(WIN_PUZZLE);
    const panel = rulesPanel(root);
    ensureScrollTopIsKept(panel);
    panel.scrollTop = 120;
    dispatchBeforeToggle(panel, 'open');
    expect(panel.scrollTop, 'beforetoggle open does not reset').toBe(120);
    dispatchToggle(panel, 'closed');
    expect(panel.scrollTop, 'toggle closed does not reset').toBe(120);
  });

  it('with two pages mounted on two roots, both panels at scrollTop 50, an event on the first panel leaves the second at 50: the handlers are per panel', () => {
    const rootA = mountPage({ seedSource: () => 1 });
    const rootB = mountPage({ seedSource: () => 2 });
    const a = rulesPanel(rootA);
    const b = rulesPanel(rootB);
    expect(a, 'two different panels').not.toBe(b);
    ensureScrollTopIsKept(a);
    ensureScrollTopIsKept(b);
    a.scrollTop = 50;
    b.scrollTop = 50;
    expect([a.scrollTop, b.scrollTop], 'premise: both at 50').toEqual([50, 50]);

    dispatchBeforeToggle(a, 'closed');
    expect(a.scrollTop, 'beforetoggle closed on the first panel resets the first').toBe(0);
    expect(b.scrollTop, 'the second panel stays at 50').toBe(50);

    a.scrollTop = 50;
    dispatchToggle(b, 'open');
    expect(b.scrollTop, 'toggle open on the second panel resets the second').toBe(0);
    expect(a.scrollTop, 'the first panel stays at 50').toBe(50);
  });

  // GUARD: green today (nothing listens, so nothing changes) and must stay green: the reset sets scrollTop only. The reset itself is asserted above.
  it('GUARD: after the events the panel keeps its attributes and texts, its one autofocus button, and the board and every cell are unchanged', () => {
    const root = mountFixture(WIN_PUZZLE);
    const before = readPage(root);
    ensureScrollTopIsKept(before.panel);
    before.panel.scrollTop = 120;
    dispatchBeforeToggle(before.panel, 'closed');
    before.panel.scrollTop = 80;
    dispatchToggle(before.panel, 'open');

    const after = readPage(root);
    expect(after.panel).toBe(before.panel);
    expect(after.attributes, 'the same attributes').toEqual(before.attributes);
    expect(after.texts, 'the same headings, list items and button text').toEqual(before.texts);
    expect(after.autofocus, 'the same one autofocus element').toEqual(before.autofocus);
    expect(after.autofocus).toHaveLength(1);
    expect(after.autofocus[0]?.textContent.trim()).toBe(RULES_CLOSE_LABEL);
    expect(after.board).toBe(before.board);
    expect(after.cells).toEqual(before.cells);
    expect(after.cellCount).toBe(before.cellCount);
  });
});

describe('The panel opens with no script', () => {
  it('the reset events (beforetoggle closed, toggle open) after a click on «Правила» and on «Зрозуміло» call none of showPopover, hidePopover, togglePopover, and change no attribute or text', () => {
    const spies = installPopoverSpies();
    activeRestore = spies.restore;
    const root = mountFixture(WIN_PUZZLE);
    const before = readPage(root);
    ensureScrollTopIsKept(before.panel);

    q(root, RULES_BUTTON).click();
    (before.panel.querySelector('button') as HTMLElement).click();
    expect(spies.calls, 'the first clause: the clicks called no popover method').toEqual([]);

    // The new clause: the two events of the scroll reset. The scrollTop assertion comes first, so a page with no listener fails on the missing
    // reset and not on a vacuous "no spy was called".
    before.panel.scrollTop = 120;
    dispatchBeforeToggle(before.panel, 'closed');
    expect(before.panel.scrollTop, 'beforetoggle closed resets scrollTop to 0 (the reset ran)').toBe(0);
    before.panel.scrollTop = 80;
    dispatchToggle(before.panel, 'open');
    expect(before.panel.scrollTop, 'toggle open resets scrollTop to 0 (the reset ran)').toBe(0);

    expect(spies.calls, 'the reset is not an opening or a closing: no popover method was called').toEqual([]);
    const after = readPage(root);
    expect(after.panel).toBe(before.panel);
    expect(after.attributes).toEqual(before.attributes);
    expect(after.texts).toEqual(before.texts);
    expect(after.board).toBe(before.board);
    expect(after.cells).toEqual(before.cells);
  });
});

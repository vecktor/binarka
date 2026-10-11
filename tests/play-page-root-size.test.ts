// Play page: the page root carries the board size (update-panel-shell, XQ-1 A). One test per jsdom scenario of the ADDED requirement «The page root carries
// the board size» in openspec/changes/update-panel-shell/specs/play-page/spec.md, and the stylesheet scenario «The size-dependent variables are declared on
// the root». The real-browser scenario («A panel outside the board reads the board's variables») is e2e/nfr-14-panel-shell.spec.ts; the geometry scenario
// («The board keeps its geometry») is the existing e2e geometry and paint tests, run unchanged. Written FIRST (red) from the spec, before the port.
//
// The root is whatever element was passed to `mountPlayPage` (a `<div>` in these tests, `#app` in the page): the attribute is read from that element.
//
// Tests that pass today by design are marked GUARD in their comment and listed in docs/qa/update-panel-shell/red-run.txt (section D) with the reason.
//
// @trace FR-43
// @trace FR-57
// @trace FR-96
import { afterEach, describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import { readStyleText, readStyles } from './helpers/css';
import type { ParsedStyles, StyleRuleInfo } from './helpers/css';
import {
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  boardSize,
  bySize,
  clickCell,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  generateSpy,
  installPageLifecycle,
  markSize,
  mountOn,
  mountPage,
  openSheet,
  pressStart,
  q,
  rawGenerateSpy,
  selectSize,
} from './helpers/play-page';

installPageLifecycle();

const KEY = '__binarkaCaptureBoard';
afterEach(() => {
  Reflect.deleteProperty(window, KEY);
});

/** The root's `data-size` (null when the attribute is missing: the red state). */
const rootSize = (root: HTMLElement): string | null => root.getAttribute('data-size');
/** The `data-size` of `[data-board]`. */
const shownSize = (root: HTMLElement): string | null => q(root, '[data-board]').getAttribute('data-size');
const fixtures = { 4: BLANK_4, 6: PAIR_ROW, 8: BLANK_8 };
const mountWithAllSizes = (): HTMLElement => mountPage({ seedSource: () => 1, generate: generateSpy(bySize(fixtures)).generate });

const at = (grid: Grid, r: number, c: number): Cell => grid[r]?.[c] ?? null;

/** A valid capture value from an engine puzzle (FR-119): entries are the solution digits at the non-given cells where `pick(r, c)` holds. */
function captureOf(size: number, seed: number, level: number, shownLevel = level): { size: number; level: number; givens: Grid; entries: Grid } {
  const puzzle = generate(size, seed, level);
  const givens = puzzle.givens.map((row) => [...row]);
  const entries: Grid = givens.map((row, r) => row.map((cell, c): Cell => (cell === null && (r + c) % 3 === 0 ? at(puzzle.solution, r, c) : null)));
  return { size, level: shownLevel, givens, entries };
}

describe('The page root carries the board size (jsdom)', () => {
  // Scenario «The root carries the size of the board at mount». Red today: the root has no data-size.
  it('The root carries the size of the board at mount: 6, equal to the board, with the default generator and with an injected 6×6 fixture', () => {
    const withDefault = mountPage();
    expect(shownSize(withDefault), 'premise: the default page shows a 6×6 board').toBe('6');
    expect(rootSize(withDefault), 'the root of the default mount').toBe('6');
    const withFixture = mountPage({ seedSource: () => 1, generate: generateSpy(bySize(fixtures)).generate });
    expect(shownSize(withFixture), 'premise: the fixture board is 6×6').toBe('6');
    expect(rootSize(withFixture), 'the root of the fixture mount').toBe(shownSize(withFixture));
  });

  // Scenario «The root follows every size change». Red today.
  it('The root follows every size change: 4, then 8, then 6 after each «Почати»; marking a size alone changes nothing', () => {
    const root = mountWithAllSizes();
    expect(rootSize(root), 'at mount').toBe('6');
    markSize(root, 4);
    expect(rootSize(root), 'after marking «Поле 4×4», before «Почати»: the size of the board shown').toBe('6');
    pressStart(root);
    expect(shownSize(root), 'premise: the 4×4 board is shown').toBe('4');
    expect(rootSize(root), 'after «Почати» for 4×4').toBe(shownSize(root));
    markSize(root, 8);
    expect(rootSize(root), 'marking 8×8 alone: still the board shown').toBe('4');
    pressStart(root);
    expect(shownSize(root), 'premise: the 8×8 board is shown').toBe('8');
    expect(rootSize(root), 'after «Почати» for 8×8').toBe(shownSize(root));
    selectSize(root, 6);
    expect(shownSize(root), 'premise: the 6×6 board is shown').toBe('6');
    expect(rootSize(root), 'after «Почати» for 6×6').toBe(shownSize(root));
  });

  // Scenario «A size change that asks first changes the root only after the confirmation». Red today (the root is never set).
  it('A size change that asks first changes the root only after «Так, почати»; the dialog and «Скасувати» leave it at 6', () => {
    const root = mountWithAllSizes();
    clickCell(root, 1, 1);
    markSize(root, 8);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: the board has an entry, so the dialog asks').toBe(true);
    expect(rootSize(root), 'while the dialog is open').toBe('6');
    confirmNo(root);
    expect(rootSize(root), 'after «Скасувати»').toBe('6');
    expect(shownSize(root), 'premise: the board shown is still 6×6').toBe('6');
    markSize(root, 8);
    pressStart(root);
    expect(dialogIsOpen(root), 'premise: it asks again').toBe(true);
    confirmYes(root);
    expect(shownSize(root), 'premise: the 8×8 board is shown').toBe('8');
    expect(rootSize(root), 'after «Так, почати»').toBe(shownSize(root));
  });

  // Scenario «A failed generation keeps the root equal to the board shown». Red today (the root is never set).
  it('A failed generation keeps the root equal to the board shown: a generator that throws for size 8 leaves 6 on the board and on the root', () => {
    const spy = generateSpy(bySize({ 4: BLANK_4, 6: PAIR_ROW })); // throws for 8
    const root = mountPage({ seedSource: () => 1, generate: spy.generate });
    markSize(root, 8);
    pressStart(root);
    expect(spy.calls.map((c) => c.size), 'premise: the page asked for 8×8 and the generator threw').toContain(8);
    expect(shownSize(root), 'the board keeps data-size 6').toBe('6');
    expect(rootSize(root), 'the root keeps 6').toBe('6');
  });

  // Scenario «With no board shown at mount the root is 6». Red today.
  it('With no board shown at mount the root is 6: the generation fails at mount, there is no [data-board]', () => {
    const spy = rawGenerateSpy(() => {
      throw new Error('generation failed');
    });
    const root = mountPage({ seedSource: () => 1, generate: spy.generate });
    expect(spy.calls.length, 'premise: the page tried to generate').toBeGreaterThan(0);
    expect(root.querySelector('[data-board]'), 'no board').toBeNull();
    expect(rootSize(root), 'the root says the mount size').toBe('6');
  });

  // Scenario «A capture board sets the root». Red today.
  it('A capture board sets the root: a size-4 and a size-8 capture board (FR-119) give 4 and 8, equal to the board', () => {
    for (const [size, level] of [[4, 1], [8, 3]] as const) {
      Reflect.set(window, KEY, captureOf(size, size === 4 ? 3 : 7, 1, level));
      const root = mountPage({ seedSource: () => 1, generate: generateSpy(bySize({ 6: PAIR_ROW })).generate });
      expect(boardSize(root), `premise: the capture board of size ${size} is shown`).toBe(size);
      expect(rootSize(root), `the root of the size-${size} capture board`).toBe(String(size));
      expect(rootSize(root)).toBe(shownSize(root));
      Reflect.deleteProperty(window, KEY);
    }
  });

  // Scenario «Two mounts are independent». Red today.
  it('Two mounts are independent: each root carries its own value, a change on one never touches the other, a re-mount starts at 6', () => {
    const generator = generateSpy(bySize(fixtures)).generate;
    const first = mountOn(document.createElement('div'), { seedSource: () => 1, generate: generator });
    const second = mountOn(document.createElement('div'), { seedSource: () => 1, generate: generator });
    expect([rootSize(first), rootSize(second)], 'both mounts start at 6').toEqual(['6', '6']);
    openSheet(second);
    markSize(second, 4);
    pressStart(second);
    markSize(first, 8);
    pressStart(first);
    expect(dialogIsOpen(first) || dialogIsOpen(second), 'premise: untouched boards ask for no confirmation').toBe(false);
    expect([rootSize(first), rootSize(second)], 'the first changed to 8, the second stayed 4').toEqual(['8', '4']);
    expect(rootSize(first)).toBe(shownSize(first));
    expect(rootSize(second)).toBe(shownSize(second));
    // a third page mounted on the first root again
    mountOn(first, { seedSource: () => 1, generate: generator });
    expect(rootSize(first), 'the re-mount sets the first root to 6 afresh').toBe('6');
    expect(rootSize(second), 'the second root is untouched').toBe('4');
    // a size-4 capture board set before the mount of one root only
    Reflect.set(window, KEY, captureOf(4, 3, 1));
    const withCapture = mountOn(document.createElement('div'), { seedSource: () => 1, generate: generator });
    Reflect.deleteProperty(window, KEY);
    const without = mountOn(document.createElement('div'), { seedSource: () => 1, generate: generator });
    expect([rootSize(withCapture), rootSize(without)], 'the root with the capture board has 4, the other 6').toEqual(['4', '6']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Scenario «The size-dependent variables are declared on the root» (stylesheet)
// ---------------------------------------------------------------------------------------------------------

const VARIABLES = ['--n', '--cell-max', '--board-gap', '--board-pad', '--board-width'] as const;
const MEDIA_22 = /^@media\s*\(\s*max-width\s*:\s*22\.5rem\s*\)$/;
const MEDIA_30 = /^@media\s*\(\s*max-width\s*:\s*30rem\s*\)$/;
const MEDIA_48 = /^@media\s*\(\s*min-width\s*:\s*48rem\s*\)$/;

/** A custom property value with all whitespace removed (jsdom compacts a custom property with `calc()`/`clamp()` in its own way). */
const compact = (value: string | undefined): string | undefined => value?.replace(/\s+/g, '');

const declaresVariable = (rule: StyleRuleInfo): boolean => rule.declarations.some((d) => (VARIABLES as readonly string[]).includes(d.property));
const ruleOf = (parsed: ParsedStyles, selector: string, context: RegExp | null): StyleRuleInfo[] =>
  parsed.rules.filter(
    (r) =>
      r.selectors.length === 1 &&
      r.selectors[0] === selector &&
      (context === null ? r.context.length === 0 : r.context.length === 1 && context.test(r.context[0] ?? '')),
  );
const read = (rules: StyleRuleInfo[], property: string): string | undefined => rules.find((r) => r.declarations.some((d) => d.property === property))?.declarations.find((d) => d.property === property)?.value;

describe('The size-dependent variables are declared on the root (stylesheet)', () => {
  // Red today: the five variables are declared in `.board` rules.
  it('Every rule that declares --n, --cell-max, --board-gap, --board-pad or --board-width has a selector that begins with #app, none begins with .board', () => {
    const parsed = readStyles();
    const declaring = parsed.rules.filter(declaresVariable);
    expect(declaring.length, 'the walk found rules that declare the variables').toBeGreaterThan(3);
    const notRoot = declaring.filter((r) => !r.selectors.every((s) => s.startsWith('#app')));
    expect(
      notRoot.map((r) => `${r.context.join(' ')} ${r.selectors.join(', ')}`.trim()),
      'rules that declare a size-dependent variable outside #app',
    ).toEqual([]);
    expect(declaring.filter((r) => r.selectors.some((s) => s.startsWith('.board'))).map((r) => r.selectors.join(', ')), 'none begins with .board').toEqual([]);
  });

  // Red today: no `#app` rule declares them.
  it('The top-level #app declares all five (--n 6, --cell-max 4rem, the 6×6 gap and padding, the board width); #app[data-size] sets --n 4 and 8', () => {
    const parsed = readStyles();
    const base = ruleOf(parsed, '#app', null).filter(declaresVariable);
    expect(base.length, 'a top-level #app rule outside any at-rule declares the variables').toBeGreaterThan(0);
    expect(read(base, '--n'), '#app { --n }').toBe('6');
    expect(read(base, '--cell-max'), '#app { --cell-max }').toBe('4rem');
    // the values the `.board` rule had (the gap and padding of the 6×6 board, and the width formula)
    expect(read(base, '--board-gap'), '#app { --board-gap }').toBe('var(--board-gap-6)');
    expect(read(base, '--board-pad'), '#app { --board-pad }').toBe('var(--board-pad-6)');
    expect(compact(read(base, '--board-width')), '#app { --board-width }').toBe(
      'calc(var(--n)*var(--cell-max)+(var(--n)-1)*var(--board-gap)+2*var(--board-pad)+2px)',
    );
    expect(read(ruleOf(parsed, "#app[data-size='4']", null), '--n'), "#app[data-size='4'] { --n }").toBe('4');
    expect(read(ruleOf(parsed, "#app[data-size='8']", null), '--n'), "#app[data-size='8'] { --n }").toBe('8');
  });

  // Red today. The values are the ones the `.board` rules had.
  it('The 8×8 and the small-phone 6×6 rules keep the gap and padding values the .board rules had', () => {
    const parsed = readStyles();
    const eight = ruleOf(parsed, "#app[data-size='8']", null);
    expect(read(eight, '--board-gap'), "#app[data-size='8'] { --board-gap }").toBe('0.1875rem');
    expect(read(eight, '--board-pad'), "#app[data-size='8'] { --board-pad }").toBe('0.25rem');
    const small = ruleOf(parsed, "#app[data-size='6']", MEDIA_22);
    expect(small, "#app[data-size='6'] inside @media (max-width: 22.5rem)").toHaveLength(1);
    expect(read(small, '--board-gap'), "6×6 up to 22.5rem { --board-gap }").toBe('0.1875rem');
    expect(read(small, '--board-pad'), "6×6 up to 22.5rem { --board-pad }").toBe('0.25rem');
  });

  // Red today. The 30rem and 48rem blocks.
  it('The 30rem and 48rem blocks declare --cell-max (and the 8×8 gap and padding up to 30rem) on #app', () => {
    const parsed = readStyles();
    const phone = ruleOf(parsed, '#app', MEDIA_30).filter(declaresVariable);
    expect(compact(read(phone, '--cell-max')), '#app { --cell-max } up to 30rem').toBe('clamp(2.75rem,calc((100svh-28rem)/var(--n)),4rem)');
    const phone8 = ruleOf(parsed, "#app[data-size='8']", MEDIA_30);
    expect(read(phone8, '--cell-max'), "#app[data-size='8'] { --cell-max } up to 30rem").toBe('4rem');
    expect(read(phone8, '--board-gap'), "#app[data-size='8'] { --board-gap } up to 30rem").toBe('0.125rem');
    expect(read(phone8, '--board-pad'), "#app[data-size='8'] { --board-pad } up to 30rem").toBe('0.1875rem');
    const wide = ruleOf(parsed, '#app', MEDIA_48).filter(declaresVariable);
    expect(read(wide, '--cell-max'), '#app { --cell-max } from 48rem').toBeDefined();
    const wide8 = ruleOf(parsed, "#app[data-size='8']", MEDIA_48);
    expect(read(wide8, '--cell-max'), "#app[data-size='8'] { --cell-max } from 48rem").toBeDefined();
  });

  // GUARD: true today; the board keeps its own geometry after the variables move (presence only, no value is pinned).
  it('GUARD: the board keeps its own geometry (grid, width, padding; --bleed, width and margin-inline for 8×8 on phones)', () => {
    const parsed = readStyles();
    const board = ruleOf(parsed, '.board', null);
    expect(board, 'one top-level .board rule').toHaveLength(1);
    for (const property of ['display', 'width', 'padding']) {
      expect(read(board, property), `.board { ${property} } is kept`).toBeDefined();
    }
    const phone8 = ruleOf(parsed, ".board[data-size='8']", MEDIA_30);
    expect(phone8, ".board[data-size='8'] inside @media (max-width: 30rem)").toHaveLength(1);
    for (const property of ['--bleed', 'width', 'margin-inline']) {
      expect(read(phone8, property), `.board[data-size='8'] { ${property} } is kept up to 30rem`).toBeDefined();
    }
  });

  // GUARD: the hook adds no `:has(` (tests/play-page-palette-stylesheet.test.ts:228-233 pins the same count).
  it('GUARD: the raw text contains :has( exactly once (the idle-line rule) and no selector reads the board size through :has(', () => {
    const text = readStyleText();
    expect(text.match(/:has\(/gi) ?? [], 'exactly one :has(').toHaveLength(1);
    const parsed = readStyles();
    expect(
      parsed.rules.filter((r) => r.selectors.some((s) => s.includes(':has(') && s.includes('data-size'))).map((r) => r.selectors.join(', ')),
      'a selector with :has( and data-size',
    ).toEqual([]);
  });
});

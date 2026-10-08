// Test helpers for the play page (openspec/specs/play-page/spec.md).
// COORDINATES: every row/col taken or returned by the DOM helpers is 1-BASED, exactly as the page shows them
// (data-row / data-col). The engine is 0-based; conversions are written out where a test crosses the two.
import { afterEach, beforeEach, expect } from 'vitest';
import { findViolations, hint, isSolved } from '../../src/engine/index';
import type { Cell, Grid, Hint, Puzzle } from '../../src/engine/index';
import { mountPlayPage } from '../../src/ui/index';
import type { PlayPageOptions } from '../../src/ui/index';
import { VALID_4X4, boardOf, parseBoard, sortedCells } from './board';
import { removeInjectedStyles } from './css';

/** The default board size of the page (6); other sizes are chosen with `selectSize`. */
export const SIZE = 6;
/** The win message of FR-41, with the ASCII apostrophe U+0027. */
export const WIN_MESSAGE = "Вітаємо, головоломку розв'язано!";
/** The engine's two no-target hint sentences (puzzle-engine spec, FR-25 / FR-26). */
export const NO_RULE_SENTENCE = 'Жодне з трьох правил зараз не підказує наступного ходу.';
export const BROKEN_SENTENCE = 'Спершу виправте порушення правил, підсвічене на полі.';
export const HINT_LABEL = 'Підказка';
export const NEW_LABEL = 'Нова головоломка';

// ---------------------------------------------------------------------------------------------------------
// Lifecycle: fresh roots, cleaned up after each test; document.title reset (jsdom starts with '').
// ---------------------------------------------------------------------------------------------------------

const roots: HTMLElement[] = [];

/** Call once at the top of a test file. */
export function installPageLifecycle(): void {
  beforeEach(() => {
    document.title = '';
  });
  afterEach(() => {
    for (const root of roots.splice(0)) root.remove();
    document.body.replaceChildren();
    document.title = '';
    removeInjectedStyles(); // stylesheets a test injected to read the cascade (tests/helpers/css.ts)
  });
}

/** Mount onto an existing root (appended to document.body when it is not attached yet). */
export function mountOn(root: HTMLElement, options?: PlayPageOptions): HTMLElement {
  if (!root.isConnected) document.body.appendChild(root);
  if (!roots.includes(root)) roots.push(root);
  mountPlayPage(root, options);
  return root;
}

/** Mount into a fresh <div> appended to document.body. */
export function mountPage(options?: PlayPageOptions): HTMLElement {
  return mountOn(document.createElement('div'), options);
}

/** Mount a fixture puzzle (the injected generator returns it for its own size and throws for any other size). */
export function mountFixture(puzzle: Puzzle, options: Omit<PlayPageOptions, 'generate'> = {}): HTMLElement {
  return mountPage({ seedSource: () => 1, ...options, generate: fixedGenerate(puzzle) });
}

// ---------------------------------------------------------------------------------------------------------
// Injected generator / seed source
// ---------------------------------------------------------------------------------------------------------

/** A fixture of the requested size, or a THROW when the requested size differs from the fixture size (slice 3, FR-43). */
function fixtureOfSize(puzzle: Puzzle, size: number): Puzzle {
  if (puzzle.size !== size) throw new Error(`fixture is ${puzzle.size}x${puzzle.size} but size ${size} was requested`);
  return puzzle;
}

export function fixedGenerate(puzzle: Puzzle): (size: number, seed: number) => Puzzle {
  return (size) => fixtureOfSize(puzzle, size);
}

/** A generator that returns the fixture registered for the requested size (else throws). */
export function generatorBySize(fixtures: Partial<Record<number, Puzzle>>): (size: number, seed: number) => Puzzle {
  const pick = bySize(fixtures);
  return (size, seed) => pick(0, size, seed);
}

/** A pick function for `generateSpy` / a generator that returns the fixture registered for the requested size (else throws). */
export function bySize(fixtures: Partial<Record<number, Puzzle>>): (callIndex: number, size: number, seed: number) => Puzzle {
  return (_i, size) => {
    const puzzle = fixtures[size];
    if (puzzle === undefined) throw new Error(`no fixture registered for size ${size}`);
    return fixtureOfSize(puzzle, size);
  };
}

export interface GenerateSpy {
  generate: (size: number, seed: number) => Puzzle;
  calls: { size: number; seed: number }[];
}

/**
 * A generator that records every (size, seed) and returns `pick(callIndex, size, seed)`. The result must be of the
 * requested size, otherwise the spy THROWS (a fixture of another size is a test-writing error; slice 3). A scenario that
 * needs a generator error or a wrong-size result uses `rawGenerateSpy`.
 */
export function generateSpy(pick: (callIndex: number, size: number, seed: number) => Puzzle): GenerateSpy {
  return rawGenerateSpy((i, size, seed) => fixtureOfSize(pick(i, size, seed), size));
}

/** Like `generateSpy` but returns whatever `pick` returns (or throws whatever it throws): for the generator-error scenarios. */
export function rawGenerateSpy(pick: (callIndex: number, size: number, seed: number) => Puzzle): GenerateSpy {
  const calls: { size: number; seed: number }[] = [];
  return {
    calls,
    generate: (size, seed) => {
      calls.push({ size, seed });
      return pick(calls.length - 1, size, seed);
    },
  };
}

export interface SeedQueue {
  source: () => number;
  /** how many times the page has called the source */
  calls: () => number;
}

/** Returns the listed seeds in order; after the list it keeps counting up from the last one. */
export function seedQueue(values: number[]): SeedQueue {
  let n = 0;
  return {
    source: () => {
      const v = values[n] ?? (values[values.length - 1] ?? 0) + (n - values.length + 1);
      n += 1;
      return v;
    },
    calls: () => n,
  };
}

// ---------------------------------------------------------------------------------------------------------
// DOM access (every lookup asserts, so an empty page fails on an assertion with a readable message)
// ---------------------------------------------------------------------------------------------------------

export function q(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  expect.assert(el !== null, `expected an element matching ${selector}`); // narrows el; expect().not.toBeNull() does not
  return el;
}

export function cellEl(root: ParentNode, row: number, col: number): HTMLElement {
  return q(root, `[data-cell][data-row="${row}"][data-col="${col}"]`);
}

export function allCells(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-cell]'));
}

/** N of the board shown, from [data-board]'s data-size (asserts it is a whole number >= 1). */
export function boardSize(root: ParentNode): number {
  const raw = q(root, '[data-board]').getAttribute('data-size');
  const n = Number(raw);
  expect(Number.isInteger(n) && n >= 1, `data-size "${raw}" is a whole number`).toBe(true);
  return n;
}

/** The size of the board shown, asserting the cell count is N*N (so a half-built board fails on an assertion). */
function expectedBoardSize(root: ParentNode): number {
  const n = boardSize(root);
  expect(allCells(root), `expected ${n * n} [data-cell] elements for a ${n}x${n} board`).toHaveLength(n * n);
  return n;
}

export const cellText = (root: ParentNode, row: number, col: number): string => cellEl(root, row, col).textContent;

export const isGivenCell = (root: ParentNode, row: number, col: number): boolean =>
  cellEl(root, row, col).getAttribute('data-given') === 'true';

export const hasViolationClass = (root: ParentNode, row: number, col: number): boolean =>
  cellEl(root, row, col).classList.contains('cell-violation');

function parseCellText(text: string, where: string): Cell {
  if (text === '') return null;
  if (text === '0') return 0;
  if (text === '1') return 1;
  throw new Error(`cell ${where} shows "${text}", expected empty, 0 or 1`);
}

/** Read the board from the DOM into the engine's 0-based grid (cell text only). Asserts N*N cells first (N = data-size). */
export function readBoard(root: ParentNode): Grid {
  const n = expectedBoardSize(root);
  const board: Grid = Array.from({ length: n }, () => Array.from({ length: n }, (): Cell => null));
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const row = board[r - 1];
      if (row === undefined) throw new Error('unreachable');
      row[c - 1] = parseCellText(cellText(root, r, c), `${r},${c}`);
    }
  }
  return board;
}

/** The data-given flags, 0-based grid of booleans. */
export function readGivenFlags(root: ParentNode): boolean[][] {
  const n = expectedBoardSize(root);
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => isGivenCell(root, r + 1, c + 1)));
}

/** Every cell as one string: position, text, data-given, sorted class list. Row-major. */
export function snapshot(root: ParentNode): string[] {
  const n = expectedBoardSize(root);
  const out: string[] = [];
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const el = cellEl(root, r, c);
      out.push(`${r},${c}|${el.textContent}|${el.getAttribute('data-given')}|${[...el.classList].sort().join(' ')}`);
    }
  }
  return out;
}

/** Cells (1-based [row, col], sorted) that carry the class cell-violation. Asserts N*N cells first. */
export function violationCells(root: ParentNode): [number, number][] {
  expectedBoardSize(root);
  const out: [number, number][] = [];
  for (const el of allCells(root)) {
    if (el.classList.contains('cell-violation')) {
      out.push([Number(el.getAttribute('data-row')), Number(el.getAttribute('data-col'))]);
    }
  }
  return sortedCells(out);
}

/**
 * The cells the page must highlight for a board, from the real rule checker, 1-based, de-duplicated and sorted.
 * 'three' and 'duplicate' violations highlight the cells the checker lists. A 'count' violation highlights EVERY
 * cell of its row or column (FR-36: "all six cells of that row"), although the checker lists only the cells holding
 * the over-represented digit.
 */
export function checkerCells(board: Grid): [number, number][] {
  const seen = new Map<string, [number, number]>();
  const add = (r: number, c: number): void => void seen.set(`${r + 1},${c + 1}`, [r + 1, c + 1]);
  for (const v of findViolations(board)) {
    if (v.rule === 'count') {
      for (let i = 0; i < board.length; i++) {
        if (v.axis === 'row') add(v.index, i);
        else add(i, v.index);
      }
    } else {
      for (const [r, c] of v.cells) add(r, c);
    }
  }
  return sortedCells([...seen.values()]);
}

export const hintMessage = (root: ParentNode): string => q(root, '[data-message="hint"]').textContent;
export const winMessage = (root: ParentNode): string => q(root, '[data-message="win"]').textContent;

/**
 * Assert the structural elements every rendered page has (so a negative check can never pass on an empty page): the
 * board of `size` (6 by default) as an ARIA grid of `size` rows (FR-61), the size selector with its wrapping label
 * (FR-43, FR-62), both buttons, both status regions (FR-63) and exactly one Tab stop (FR-59).
 * Slice 6 (add-page-accessibility) DELIBERATE CHANGE: the grid, row, label, status and Tab stop checks follow the new
 * spec; no old check was removed or weakened. The grid role is asserted FIRST so that the first failure line of every
 * red test that reaches this helper names the missing grid.
 */
export function expectPageStructure(root: ParentNode, size = 6): void {
  const board = q(root, '[data-board]');
  expect(board.getAttribute('role'), 'the board has role="grid"').toBe('grid');
  expect(board.getAttribute('aria-label'), 'the board is named «Поле N×N»').toBe(`Поле ${size}×${size}`);
  expect(board.getAttribute('data-size')).toBe(String(size));
  const rows = Array.from(board.children);
  expect(rows, `the board has ${size} row children`).toHaveLength(size);
  rows.forEach((row, i) => {
    expect(row.getAttribute('role'), `board child ${i + 1} has role="row"`).toBe('row');
    const cells = Array.from(row.querySelectorAll('[data-cell]'));
    expect(cells, `row ${i + 1} holds ${size} cells`).toHaveLength(size);
    for (const cell of cells) expect(cell.getAttribute('role'), 'every cell has role="gridcell"').toBe('gridcell');
  });
  expect(allCells(root)).toHaveLength(size * size);
  expect(tabStopCells(root), 'exactly one cell has tabindex="0"').toHaveLength(1);
  const select = sizeSelect(root);
  expect(select.labels, 'the size select has exactly one label').toHaveLength(1);
  expect(select.labels[0]?.tagName, 'the label is a <label> that wraps the select').toBe('LABEL');
  q(root, '[data-action="hint"]');
  q(root, '[data-action="new"]');
  expect(q(root, '[data-message="hint"]').getAttribute('role'), 'the hint message is a status region').toBe('status');
  expect(q(root, '[data-message="win"]').getAttribute('role'), 'the win message is a status region').toBe('status');
}

// ---------------------------------------------------------------------------------------------------------
// Slice 6 (FR-59 to FR-63): keyboard, Tab stop, roles and names
// ---------------------------------------------------------------------------------------------------------

/**
 * Dispatch a bubbling, CANCELABLE `keydown` on `el` and return the event, so a test reads `defaultPrevented` after the
 * dispatch. A non-cancelable event can never show a `preventDefault()` call, which would make every "not prevented"
 * check vacuous; `init.cancelable` can switch it off for the helper self-check only. A single space is `key: ' '`.
 * No uncaught listener error is allowed (dispatchEvent swallows them, see `trackErrors`).
 */
export function pressKey(el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  const tracker = trackErrors();
  try {
    el.dispatchEvent(event);
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, `no uncaught error while handling keydown "${key}"`).toEqual([]);
  return event;
}

/** The cells with `tabindex="0"` (a page has exactly one). */
export const tabStopCells = (root: ParentNode): HTMLElement[] =>
  allCells(root).filter((cell) => cell.getAttribute('tabindex') === '0');

/** The children of `[data-board]`: the row elements (FR-61). */
export const rowEls = (root: ParentNode): HTMLElement[] => Array.from(q(root, '[data-board]').children) as HTMLElement[];

/** Give a cell DOM focus and assert it took it (a cell with no `tabindex` cannot, which is the red-stage failure). */
export function focusCell(root: ParentNode, row: number, col: number): HTMLElement {
  const el = cellEl(root, row, col);
  el.focus();
  expectActive(el, `cell ${row},${col} takes DOM focus`);
  return el;
}

/** Assert that `el` is `document.activeElement` (a boolean check, so a failure does not print the whole page). */
export function expectActive(el: Element, what: string): void {
  expect(document.activeElement === el, `${what} (DOM focus is on ${describeElement(document.activeElement)})`).toBe(true);
}

function describeElement(el: Element | null): string {
  if (el === null) return 'nothing';
  const attrs = ['data-action', 'data-control', 'data-row', 'data-col', 'role'].filter((a) => el.hasAttribute(a));
  return `<${el.tagName.toLowerCase()}${attrs.map((a) => ` ${a}="${el.getAttribute(a) ?? ''}"`).join('')}>`;
}

/** The accessible name of a cell, «Рядок R, стовпець C: V», V = «порожня» for empty text, else the digit (FR-61). */
export const cellName = (row: number, col: number, text: string): string =>
  `Рядок ${row}, стовпець ${col}: ${text === '' ? 'порожня' : text}`;

/** Assert that the cell at (row, col) is the ONLY cell with tabindex 0, and that every other cell has tabindex -1. */
export function expectTabStop(root: ParentNode, row: number, col: number): void {
  const stops = tabStopCells(root).map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);
  expect(stops, `the only Tab stop is the cell ${row},${col}`).toEqual([`${row},${col}`]);
  for (const cell of allCells(root)) {
    if (cell !== cellEl(root, row, col)) expect(cell.getAttribute('tabindex'), 'every other cell has tabindex -1').toBe('-1');
  }
}

/** Assert that DOM focus is on the cell at (row, col). */
export function expectFocusOn(root: ParentNode, row: number, col: number): void {
  expectActive(cellEl(root, row, col), `DOM focus is on cell ${row},${col}`);
}

/** The text of a label without the text of the form control inside it (the control's options are not the label). */
export function ownLabelText(label: HTMLElement): string {
  const clone = label.cloneNode(true) as HTMLElement;
  for (const control of Array.from(clone.querySelectorAll('select, input, textarea, button'))) control.remove();
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------------------------------------

export function clickCell(root: ParentNode, row: number, col: number, times = 1): void {
  const el = cellEl(root, row, col);
  for (let i = 0; i < times; i++) el.click();
}

/** Click until the cell shows `text` ('' | '0' | '1'); at most 3 clicks (a full cycle). */
export function clickUntil(root: ParentNode, row: number, col: number, text: string): void {
  for (let i = 0; i < 3 && cellText(root, row, col) !== text; i++) clickCell(root, row, col);
  expect(cellText(root, row, col)).toBe(text);
}

/** Set an EMPTY non-given cell to a digit by clicking (one click for 0, two for 1). */
export function setCellTo(root: ParentNode, row: number, col: number, value: 0 | 1): void {
  expect(cellText(root, row, col), `cell ${row},${col} must be empty before it is set`).toBe('');
  expect(isGivenCell(root, row, col), `cell ${row},${col} must not be a given`).toBe(false);
  clickCell(root, row, col, value + 1);
  expect(cellText(root, row, col)).toBe(String(value));
}

/** Set empty non-given cells of one row from text such as '0 0 1 . 1 .' ('.' = leave alone), left to right. */
export function setRow(root: ParentNode, row: number, text: string, only?: number[]): void {
  text
    .trim()
    .split(/\s+/)
    .forEach((token, i) => {
      if (token === '.' || (only !== undefined && !only.includes(i + 1))) return;
      setCellTo(root, row, i + 1, token === '0' ? 0 : 1);
    });
}

/** Set empty non-given cells of one column from text written top to bottom. */
export function setCol(root: ParentNode, col: number, text: string, only?: number[]): void {
  text
    .trim()
    .split(/\s+/)
    .forEach((token, i) => {
      if (token === '.' || (only !== undefined && !only.includes(i + 1))) return;
      setCellTo(root, i + 1, col, token === '0' ? 0 : 1);
    });
}

/** Fill every non-given cell with the digit of `grid` (0-based grid), except the 1-based cells in `skip`. */
export function fillFrom(root: ParentNode, puzzle: Puzzle, grid: Grid, skip: [number, number][] = []): void {
  const n = puzzle.givens.length;
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      if (puzzle.givens[r - 1]?.[c - 1] !== null) continue;
      if (skip.some(([sr, sc]) => sr === r && sc === c)) continue;
      const value = grid[r - 1]?.[c - 1];
      if (value === null || value === undefined) continue;
      setCellTo(root, r, c, value);
    }
  }
}

export const pressHint = (root: ParentNode): void => { q(root, '[data-action="hint"]').click(); };
export const pressNew = (root: ParentNode): void => { q(root, '[data-action="new"]').click(); };

// ---- the size selector (FR-43) ----

/** The size selector `[data-control="size"]`, asserted to be a <select>. */
export function sizeSelect(root: ParentNode): HTMLSelectElement {
  const el = q(root, '[data-control="size"]');
  expect(el.tagName, 'the size selector is a select element').toBe('SELECT');
  return el as HTMLSelectElement;
}

export interface ErrorTracker {
  /** everything the window 'error' event reported while the tracker was active */
  errors: unknown[];
  stop: () => void;
}

/**
 * A `window` 'error' listener. dispatchEvent() never throws when a listener throws (jsdom reports the exception on
 * window instead), so a "does not throw" check around dispatchEvent is vacuous: this listener is the only detector.
 * Always `stop()` it (try/finally) so a listener never leaks into the next test.
 */
export function trackErrors(): ErrorTracker {
  const errors: unknown[] = [];
  const listener = (event: ErrorEvent): void => {
    event.preventDefault();
    errors.push(event.error ?? event.message);
  };
  window.addEventListener('error', listener);
  return { errors, stop: () => { window.removeEventListener('error', listener); } };
}

/** Dispatch a bubbling `change` on the size selector, recording uncaught errors; asserts none were recorded. */
function dispatchChange(select: HTMLSelectElement): void {
  const tracker = trackErrors();
  try {
    select.dispatchEvent(new Event('change', { bubbles: true }));
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, 'no uncaught error during the change event').toEqual([]);
}

/** The player selects a size: set the select's value to it and dispatch a bubbling `change` (no uncaught error allowed). */
export function selectSize(root: ParentNode, size: number): void {
  const select = sizeSelect(root);
  select.value = String(size);
  expect(select.value, `the select offers the value ${size}`).toBe(String(size));
  dispatchChange(select);
}

/**
 * Mount the page on the 6x6 fixture `start`, then (when `puzzle` is not 6x6) let the player select `puzzle.size`, the
 * injected generator returning `puzzle` for that size: a board of another size, reached the way a player reaches it.
 */
export function mountThenSelect(puzzle: Puzzle, start: Puzzle = BLANK): HTMLElement {
  const root = mountPage({
    seedSource: seedQueue([1, 2]).source,
    generate: generatorBySize({ [start.size]: start, [puzzle.size]: puzzle }),
  });
  if (puzzle.size !== start.size) selectSize(root, puzzle.size);
  return root;
}

export interface ReportedValueResult {
  /** `selectedIndex` right after the `change` event (override still installed) */
  selectedIndex: number;
  /** `options[1].selected` right after the `change` event */
  option1Selected: boolean;
  /** `select.value` once the override is removed again (the natively reported value) */
  valueAfter: string;
}

/**
 * The scenarios "Value outside the offered sizes is ignored" (and "... with no option selected"): make the select report
 * `reported` by overriding `value` on the element (getter and setter; the setter ignores writes) after setting
 * `selectedIndex = 0`, so a page that does not restore the selector leaves index 0 (a page that restores with
 * `select.value = ...` hits the dead setter and also leaves 0). `reported === null` is the no-option-selected case:
 * `selectedIndex = -1`, no override, the select reports ''. Dispatches a bubbling `change` with the error tracker.
 */
export function changeWithReportedValue(root: ParentNode, reported: string | null): ReportedValueResult {
  const select = sizeSelect(root);
  if (reported === null) {
    select.selectedIndex = -1;
    expect(select.value, 'no option selected: the select reports the empty string').toBe('');
  } else {
    select.selectedIndex = 0;
    Object.defineProperty(select, 'value', { configurable: true, get: () => reported, set: () => undefined });
    expect(select.value).toBe(reported);
  }
  let during: Pick<ReportedValueResult, 'selectedIndex' | 'option1Selected'> | undefined;
  try {
    dispatchChange(select);
    during = { selectedIndex: select.selectedIndex, option1Selected: select.options[1]?.selected === true };
  } finally {
    if (reported !== null) Reflect.deleteProperty(select, 'value');
  }
  return { ...during, valueAfter: select.value };
}

/** The engine hint for the board as it is shown right now (the spec: "the engine hint applied to the DOM board"). */
export const expectedHint = (root: ParentNode): Hint => hint(readBoard(root));

/** Next text in the player cycle: empty -> 0 -> 1 -> empty. */
export function nextInCycle(text: string): string {
  if (text === '') return '0';
  if (text === '0') return '1';
  return '';
}

/** 1-based [row, col] of a fill hint's target. */
export function targetCell(h: Hint): [number, number] {
  if (h.kind !== 'fill') throw new Error(`hint kind is ${h.kind}, not fill`);
  return [h.row + 1, h.col + 1];
}

// ---------------------------------------------------------------------------------------------------------
// Fixture puzzles. A fixture is a Puzzle (size N, givens, solution). For N = 4 and 6 the solution is the first valid
// grid (in enumeration order) that keeps the givens; makePuzzle throws when there is none, unless `inconsistent`.
// N = 8 has 4,111,116 solved grids and is NEVER enumerated: an 8x8 fixture names its solution explicitly
// (`options.solution`, a hand-written valid grid).
// ---------------------------------------------------------------------------------------------------------

type Digit = 0 | 1;
const solutionCaches = new Map<number, Digit[][][]>();

/**
 * Every valid solved NxN grid (rows: N/2 zeros and ones, no run of 3; distinct rows; columns likewise), cached per N.
 * Only N = 4 (72 grids) and N = 6 (4,140 grids) are supported: N = 8 has 4,111,116 and throws instead of hanging.
 */
export function allSolutions(n = 6): Digit[][][] {
  if (n !== 4 && n !== 6) throw new Error(`allSolutions(${n}): only 4 and 6 are enumerated (8x8 has 4,111,116 grids)`);
  const cached = solutionCaches.get(n);
  if (cached !== undefined) return cached;
  const rows: Digit[][] = [];
  for (let m = 0; m < 1 << n; m++) {
    const bits: Digit[] = Array.from({ length: n }, (_, i) => (((m >> (n - 1 - i)) & 1) === 1 ? 1 : 0));
    const ones = bits.filter((b) => b === 1).length;
    const run = bits.some((b, i) => i + 2 < n && b === bits[i + 1] && b === bits[i + 2]);
    if (ones === n / 2 && !run) rows.push(bits);
  }
  const out: Digit[][][] = [];
  const colOk = (g: Digit[][], final: boolean): boolean => {
    for (let c = 0; c < n; c++) {
      const col = g.map((r) => r[c]);
      const L = col.length;
      if (L >= 3 && col[L - 1] === col[L - 2] && col[L - 2] === col[L - 3]) return false;
      const ones = col.filter((x) => x === 1).length;
      if (ones > n / 2 || L - ones > n / 2) return false;
      if (final && ones !== n / 2) return false;
    }
    if (final) {
      const keys = new Set(Array.from({ length: n }, (_, c) => g.map((r) => r[c]).join('')));
      if (keys.size !== n) return false;
    }
    return true;
  };
  const rec = (g: Digit[][]): void => {
    if (g.length === n) {
      if (colOk(g, true)) out.push(g.map((r) => [...r]));
      return;
    }
    for (const row of rows) {
      if (g.some((x) => x.join('') === row.join(''))) continue;
      const next = [...g, row];
      if (colOk(next, false)) rec(next);
    }
  };
  rec([]);
  solutionCaches.set(n, out);
  return out;
}

export interface MakePuzzleOptions {
  /** an explicit solution (spec notation); it must still be a valid solved grid and keep the givens. Required for N = 8. */
  solution?: string;
  /** allow givens that no valid grid satisfies (only for boards that deliberately break a rule) */
  inconsistent?: boolean;
}

export function keepsGivens(solution: Grid, givens: Grid): boolean {
  return givens.every((row, r) => row.every((g, c) => g === null || solution[r]?.[c] === g));
}

/** A fixture puzzle for `givens`; N is the number of rows of `givens` (so the 6x6 callers are unchanged). */
export function makePuzzle(givens: Grid, options: MakePuzzleOptions = {}): Puzzle {
  const n = givens.length;
  let solution: Digit[][] | undefined;
  if (options.solution !== undefined) {
    solution = parseBoard(options.solution).map((row) => row.map((c) => (c === 1 ? 1 : 0)));
    if (solution.length !== n) throw new Error(`makePuzzle: the explicit solution is ${solution.length}x${solution.length}, not ${n}x${n}`);
  } else {
    if (n !== 4 && n !== 6) throw new Error(`makePuzzle: a ${n}x${n} fixture needs an explicit options.solution (never enumerated)`);
    solution = allSolutions(n).find((s) => keepsGivens(s, givens));
    if (solution === undefined) {
      if (options.inconsistent !== true) throw new Error('makePuzzle: no valid grid keeps these givens');
      solution = allSolutions(n)[0];
    }
  }
  if (solution === undefined) throw new Error('makePuzzle: no solution');
  return { size: n, givens, solution };
}

/** Board of size n with the listed givens only; cells are [row, col, value], 1-based. */
export const givensOf = (n: number, cells: [number, number, 0 | 1][]): Grid => boardOf(n, { cells });

/** No givens at all. */
export const BLANK = makePuzzle(givensOf(6, []));
/** Only givens: 0 at (3,1) and (3,2). The hint engine returns the pair fill at 1-based (3,3) = 1. */
export const PAIR_ROW = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0]]));
/** Givens: 0 at (4,2) and (4,3); the neighbour on the left (4,1) is a player cell. */
export const PAIR_LEFT = makePuzzle(givensOf(6, [[4, 2, 0], [4, 3, 0]]));
/** Only givens: 1 at (1,4) and (2,4). The hint engine returns the pair fill at 1-based (3,4) = 0. */
export const PAIR_COL = makePuzzle(givensOf(6, [[1, 4, 1], [2, 4, 1]]));
/** Givens: 0 at (3,1) and (3,2) plus 1 at (6,6) (a given far away from the run). */
export const PAIR_ROW_PLUS = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0], [6, 6, 1]]));
/** Two independent pairs: 0 0 at (3,1),(3,2) and 1 1 at (5,4),(5,5): two consecutive pair hints. */
export const TWO_PAIRS = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0], [5, 4, 1], [5, 5, 1]]));
/** Row 5 holds `0 1 0 . . 0`: no pair, no sandwich anywhere; the count rule targets (5,4) and leaves (5,5) empty. */
export const COUNT_ROW = makePuzzle(givensOf(6, [[5, 1, 0], [5, 2, 1], [5, 3, 0], [5, 6, 0]]));
/** Two isolated givens: no rule applies, the hint engine returns kind 'none'. */
export const ISOLATED = makePuzzle(givensOf(6, [[1, 1, 0], [4, 5, 1]]));
/**
 * A board on which the hint fill itself breaks a rule: the first pair hint is the row pair (1,1),(1,2) = 1 1,
 * target (1,3) = 0, which completes 0 0 0 in column 3 (rows 1 to 3). The board before the fill is rule-clean.
 * No valid grid keeps these givens, so the solution is an arbitrary valid grid (fixture is deliberately inconsistent).
 */
export const HINT_BREAKS = makePuzzle(givensOf(6, [[1, 1, 1], [1, 2, 1], [2, 3, 0], [3, 3, 0]]), { inconsistent: true });
/** Givens already break a rule (three 0 in row 1): the board is highlighted the moment it is shown. */
export const DIRTY_GIVENS = makePuzzle(givensOf(6, [[1, 1, 0], [1, 2, 0], [1, 3, 0]]), { inconsistent: true });

/** A real generator output (seed 2): unique solution, 10 givens, a given 1 at (2,5). */
export const WIN_PUZZLE: Puzzle = {
  size: SIZE,
  givens: parseBoard(`
    . . 0 . . .
    . . . . 1 .
    . . 1 0 . .
    . . . . 0 0
    . . . . 1 0
    . 1 0 . . .
  `),
  solution: parseBoard(`
    1 0 0 1 1 0
    0 0 1 0 1 1
    0 1 1 0 0 1
    1 1 0 1 0 0
    1 0 1 0 1 0
    0 1 0 1 0 1
  `).map((row) => row.map((c) => (c === 1 ? 1 : 0))),
};

// ---- slice 3 (FR-43): 4x4 and 8x8 fixtures ----

/** A valid solved 8x8 grid, written out (it is generate(8, 1).solution; the helper self-check runs isSolved on it). */
export const SOLUTION_8_TEXT = `
  1 0 1 1 0 0 1 0
  0 1 0 0 1 0 1 1
  0 0 1 1 0 1 0 1
  1 1 0 0 1 1 0 0
  1 0 1 0 1 0 1 0
  0 0 1 1 0 0 1 1
  0 1 0 0 1 1 0 1
  1 1 0 1 0 1 0 0
`;

/** 4x4, no givens. */
export const BLANK_4 = makePuzzle(givensOf(4, []));
/** 4x4, only givens 0 at (2,1) and (2,2): the hint engine returns the pair fill at 1-based (2,3) = 1 (0-based row 1, col 2). */
export const PAIR_4 = makePuzzle(givensOf(4, [[2, 1, 0], [2, 2, 0]]));
/** 4x4 whose solution is VALID_4X4 and whose givens are every cell except the non-given (4,4), whose digit is 1. */
export const WIN_4 = winFixture(VALID_4X4, [4, 4]);

/** 8x8, no givens (explicit solution, never enumerated). */
export const BLANK_8 = makePuzzle(givensOf(8, []), { solution: SOLUTION_8_TEXT });
/** 8x8, only givens 0 at (8,7) and (8,8): the hint engine returns the pair fill at 1-based (8,6) = 1 (0-based row 7, col 5). */
export const PAIR_8 = makePuzzle(givensOf(8, [[8, 7, 0], [8, 8, 0]]), { solution: SOLUTION_8_TEXT });
/** 8x8 whose solution is SOLUTION_8_TEXT and whose givens are every cell except the non-given (8,8), whose digit is 0. */
export const WIN_8 = winFixture(parseBoard(SOLUTION_8_TEXT), [8, 8]);
/**
 * Slice 6 (FR-64): PAIR_ROW_PLUS at N = 4 and N = 8, so that one click on (3,3) gives all four cell kinds at every size:
 * ordinary (1,1), a plain given far from the run, a violating player cell (3,3) and the givens (3,1), (3,2) in the violation.
 */
export const PAIR_PLUS_4 = makePuzzle(givensOf(4, [[3, 1, 0], [3, 2, 0], [4, 4, 1]]));
export const PAIR_PLUS_8 = makePuzzle(givensOf(8, [[3, 1, 0], [3, 2, 0], [8, 8, 0]]), { solution: SOLUTION_8_TEXT });
/** 8x8 whose only givens are 0 at (8,1), (8,2), (8,3): the checker reports `three` in row 8 at once (inconsistent fixture). */
export const DIRTY_8_ROW = makePuzzle(givensOf(8, [[8, 1, 0], [8, 2, 0], [8, 3, 0]]), { solution: SOLUTION_8_TEXT, inconsistent: true });
/** 8x8 whose only givens are 1 at column 8, rows 1, 2, 4, 6, 7: five 1s, no three side by side, `count` on column 8. */
export const DIRTY_8_COL = makePuzzle(
  givensOf(8, [[1, 8, 1], [2, 8, 1], [4, 8, 1], [6, 8, 1], [7, 8, 1]]),
  { solution: SOLUTION_8_TEXT, inconsistent: true },
);

/** A fixture whose solution is `solved` and whose givens are all cells except the 1-based `empty` cell. */
function winFixture(solved: Grid, empty: [number, number]): Puzzle {
  const givens = solved.map((row, r) => row.map((c, k): Cell => (r === empty[0] - 1 && k === empty[1] - 1 ? null : c)));
  return { size: solved.length, givens, solution: solved.map((row) => row.map((c) => (c === 1 ? 1 : 0))) };
}

/** Every fixture, for the helper self-check. `consistent` = givens must be kept by the solution. */
export const FIXTURES: { name: string; puzzle: Puzzle; consistent: boolean }[] = [
  { name: 'BLANK', puzzle: BLANK, consistent: true },
  { name: 'PAIR_ROW', puzzle: PAIR_ROW, consistent: true },
  { name: 'PAIR_LEFT', puzzle: PAIR_LEFT, consistent: true },
  { name: 'PAIR_COL', puzzle: PAIR_COL, consistent: true },
  { name: 'PAIR_ROW_PLUS', puzzle: PAIR_ROW_PLUS, consistent: true },
  { name: 'TWO_PAIRS', puzzle: TWO_PAIRS, consistent: true },
  { name: 'COUNT_ROW', puzzle: COUNT_ROW, consistent: true },
  { name: 'ISOLATED', puzzle: ISOLATED, consistent: true },
  { name: 'HINT_BREAKS', puzzle: HINT_BREAKS, consistent: false },
  { name: 'DIRTY_GIVENS', puzzle: DIRTY_GIVENS, consistent: false },
  { name: 'WIN_PUZZLE', puzzle: WIN_PUZZLE, consistent: true },
  { name: 'BLANK_4', puzzle: BLANK_4, consistent: true },
  { name: 'PAIR_4', puzzle: PAIR_4, consistent: true },
  { name: 'WIN_4', puzzle: WIN_4, consistent: true },
  { name: 'BLANK_8', puzzle: BLANK_8, consistent: true },
  { name: 'PAIR_8', puzzle: PAIR_8, consistent: true },
  { name: 'WIN_8', puzzle: WIN_8, consistent: true },
  { name: 'DIRTY_8_ROW', puzzle: DIRTY_8_ROW, consistent: false },
  { name: 'DIRTY_8_COL', puzzle: DIRTY_8_COL, consistent: false },
  { name: 'PAIR_PLUS_4', puzzle: PAIR_PLUS_4, consistent: true },
  { name: 'PAIR_PLUS_8', puzzle: PAIR_PLUS_8, consistent: true },
];


/** The solution as an engine Grid. */
export const solutionGrid = (p: Puzzle): Grid => p.solution.map((row) => [...row]);

export const solved = (board: Grid): boolean => isSolved(board);

// ---------------------------------------------------------------------------------------------------------
// String collectors for the page-text and seed-not-shown scenarios
// ---------------------------------------------------------------------------------------------------------

function elementsOf(root: HTMLElement): Element[] {
  return [root, ...Array.from(root.querySelectorAll('*'))];
}

function textNodesOf(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Seed-not-shown scenario: every text node, document.title and every attribute value of every element, each separate. */
export function collectEverything(root: HTMLElement): string[] {
  const out: string[] = textNodesOf(root).map((t) => t.data);
  out.push(document.title);
  for (const el of elementsOf(root)) {
    for (const attr of Array.from(el.attributes)) out.push(attr.value);
  }
  return out;
}

/**
 * Static-page-text scenario: every non-whitespace text node (not the text of [data-cell] elements), document.title,
 * the values of aria-label, title, placeholder and alt on every element in the root, and the `label` attribute of every
 * option and optgroup element.
 */
export function collectPageText(root: HTMLElement): string[] {
  const out: string[] = [];
  for (const t of textNodesOf(root)) {
    if (t.data.trim() === '') continue;
    if (t.parentElement?.closest('[data-cell]') !== null && t.parentElement !== null) continue;
    out.push(t.data);
  }
  out.push(document.title);
  for (const el of elementsOf(root)) {
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(name);
      if (value !== null) out.push(value);
    }
    // the `label` attribute of option and optgroup is shown by a browser instead of the option text (NFR-5, FR-43)
    if (el.tagName === 'OPTION' || el.tagName === 'OPTGROUP') {
      const label = el.getAttribute('label');
      if (label !== null) out.push(label);
    }
  }
  return out;
}

// Test helpers for the play page (openspec/specs/play-page/spec.md).
// COORDINATES: every row/col taken or returned by the DOM helpers is 1-BASED, exactly as the page shows them
// (data-row / data-col). The engine is 0-based; conversions are written out where a test crosses the two.
import { afterEach, beforeEach, expect } from 'vitest';
import { findViolations, hint, isSolved } from '../../src/engine/index';
import type { Cell, Grid, Hint, Puzzle } from '../../src/engine/index';
import { mountPlayPage } from '../../src/ui/index';
import type { PlayPageOptions } from '../../src/ui/index';
import { boardOf, parseBoard, sortedCells } from './board';

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

/** Mount a fixture puzzle (the injected generator returns it whatever the size and seed). */
export function mountFixture(puzzle: Puzzle, options: Omit<PlayPageOptions, 'generate'> = {}): HTMLElement {
  return mountPage({ seedSource: () => 1, ...options, generate: fixedGenerate(puzzle) });
}

// ---------------------------------------------------------------------------------------------------------
// Injected generator / seed source
// ---------------------------------------------------------------------------------------------------------

export function fixedGenerate(puzzle: Puzzle): (size: number, seed: number) => Puzzle {
  return () => puzzle;
}

export interface GenerateSpy {
  generate: (size: number, seed: number) => Puzzle;
  calls: Array<{ size: number; seed: number }>;
}

/** A generator that records every (size, seed) and returns `pick(callIndex, size, seed)`. */
export function generateSpy(pick: (callIndex: number, size: number, seed: number) => Puzzle): GenerateSpy {
  const calls: Array<{ size: number; seed: number }> = [];
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
  expect(el, `expected an element matching ${selector}`).not.toBeNull();
  return el as HTMLElement;
}

export function cellEl(root: ParentNode, row: number, col: number): HTMLElement {
  return q(root, `[data-cell][data-row="${row}"][data-col="${col}"]`);
}

export function allCells(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-cell]'));
}

export const cellText = (root: ParentNode, row: number, col: number): string => cellEl(root, row, col).textContent ?? '';

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

/** Read the board from the DOM into the engine's 0-based grid (cell text only). Asserts 36 cells first. */
export function readBoard(root: ParentNode): Grid {
  expect(allCells(root), 'expected 36 [data-cell] elements').toHaveLength(SIZE * SIZE);
  const board: Grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, (): Cell => null));
  for (let r = 1; r <= SIZE; r++) {
    for (let c = 1; c <= SIZE; c++) {
      const row = board[r - 1];
      if (row === undefined) throw new Error('unreachable');
      row[c - 1] = parseCellText(cellText(root, r, c), `${r},${c}`);
    }
  }
  return board;
}

/** The data-given flags, 0-based grid of booleans. */
export function readGivenFlags(root: ParentNode): boolean[][] {
  expect(allCells(root), 'expected 36 [data-cell] elements').toHaveLength(SIZE * SIZE);
  return Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => isGivenCell(root, r + 1, c + 1)));
}

/** Every cell as one string: position, text, data-given, sorted class list. Row-major. */
export function snapshot(root: ParentNode): string[] {
  expect(allCells(root), 'expected 36 [data-cell] elements').toHaveLength(SIZE * SIZE);
  const out: string[] = [];
  for (let r = 1; r <= SIZE; r++) {
    for (let c = 1; c <= SIZE; c++) {
      const el = cellEl(root, r, c);
      out.push(`${r},${c}|${el.textContent ?? ''}|${el.getAttribute('data-given')}|${[...el.classList].sort().join(' ')}`);
    }
  }
  return out;
}

/** Cells (1-based [row, col], sorted) that carry the class cell-violation. Asserts 36 cells first. */
export function violationCells(root: ParentNode): Array<[number, number]> {
  expect(allCells(root), 'expected 36 [data-cell] elements').toHaveLength(SIZE * SIZE);
  const out: Array<[number, number]> = [];
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
export function checkerCells(board: Grid): Array<[number, number]> {
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

export const hintMessage = (root: ParentNode): string => q(root, '[data-message="hint"]').textContent ?? '';
export const winMessage = (root: ParentNode): string => q(root, '[data-message="win"]').textContent ?? '';

/** Assert the structural elements every rendered page has (so a negative check can never pass on an empty page). */
export function expectPageStructure(root: ParentNode): void {
  expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
  expect(allCells(root)).toHaveLength(SIZE * SIZE);
  q(root, '[data-action="hint"]');
  q(root, '[data-action="new"]');
  q(root, '[data-message="hint"]');
  q(root, '[data-message="win"]');
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
export function fillFrom(root: ParentNode, puzzle: Puzzle, grid: Grid, skip: Array<[number, number]> = []): void {
  for (let r = 1; r <= SIZE; r++) {
    for (let c = 1; c <= SIZE; c++) {
      if (puzzle.givens[r - 1]?.[c - 1] !== null) continue;
      if (skip.some(([sr, sc]) => sr === r && sc === c)) continue;
      const value = grid[r - 1]?.[c - 1];
      if (value === null || value === undefined) continue;
      setCellTo(root, r, c, value);
    }
  }
}

export const pressHint = (root: ParentNode): void => q(root, '[data-action="hint"]').click();
export const pressNew = (root: ParentNode): void => q(root, '[data-action="new"]').click();

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
// Fixture puzzles. A fixture is a Puzzle (size 6, givens, solution). The solution is the first valid 6x6 grid
// (in enumeration order) that keeps the givens; makePuzzle throws when there is none, unless `inconsistent`.
// ---------------------------------------------------------------------------------------------------------

type Digit = 0 | 1;
let solutionCache: Digit[][][] | null = null;

/** Every valid solved 6x6 grid (rows: three 0s, three 1s, no run of 3; distinct rows; columns likewise). */
export function allSolutions(): Digit[][][] {
  if (solutionCache !== null) return solutionCache;
  const rows: Digit[][] = [];
  for (let m = 0; m < 1 << SIZE; m++) {
    const bits: Digit[] = Array.from({ length: SIZE }, (_, i) => (((m >> (SIZE - 1 - i)) & 1) === 1 ? 1 : 0));
    const ones = bits.filter((b) => b === 1).length;
    const run = bits.some((b, i) => i + 2 < SIZE && b === bits[i + 1] && b === bits[i + 2]);
    if (ones === SIZE / 2 && !run) rows.push(bits);
  }
  const out: Digit[][][] = [];
  const colOk = (g: Digit[][], final: boolean): boolean => {
    for (let c = 0; c < SIZE; c++) {
      const col = g.map((r) => r[c]);
      const L = col.length;
      if (L >= 3 && col[L - 1] === col[L - 2] && col[L - 2] === col[L - 3]) return false;
      const ones = col.filter((x) => x === 1).length;
      if (ones > SIZE / 2 || L - ones > SIZE / 2) return false;
      if (final && ones !== SIZE / 2) return false;
    }
    if (final) {
      const keys = new Set(Array.from({ length: SIZE }, (_, c) => g.map((r) => r[c]).join('')));
      if (keys.size !== SIZE) return false;
    }
    return true;
  };
  const rec = (g: Digit[][]): void => {
    if (g.length === SIZE) {
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
  solutionCache = out;
  return out;
}

export interface MakePuzzleOptions {
  /** an explicit solution (spec notation); it must still be a valid solved grid and keep the givens */
  solution?: string;
  /** allow givens that no valid grid satisfies (only for boards that deliberately break a rule) */
  inconsistent?: boolean;
}

export function keepsGivens(solution: Grid, givens: Grid): boolean {
  return givens.every((row, r) => row.every((g, c) => g === null || solution[r]?.[c] === g));
}

export function makePuzzle(givens: Grid, options: MakePuzzleOptions = {}): Puzzle {
  let solution: Digit[][] | undefined;
  if (options.solution !== undefined) {
    solution = parseBoard(options.solution).map((row) => row.map((c) => (c === 1 ? 1 : 0)));
  } else {
    solution = allSolutions().find((s) => keepsGivens(s, givens));
    if (solution === undefined) {
      if (options.inconsistent !== true) throw new Error('makePuzzle: no valid grid keeps these givens');
      solution = allSolutions()[0];
    }
  }
  if (solution === undefined) throw new Error('makePuzzle: no solution');
  return { size: SIZE, givens, solution };
}

/** Board with the listed givens only; cells are [row, col, value], 1-based. */
const givensOf = (cells: Array<[number, number, 0 | 1]>): Grid => boardOf(SIZE, { cells });

/** No givens at all. */
export const BLANK = makePuzzle(givensOf([]));
/** Only givens: 0 at (3,1) and (3,2). The hint engine returns the pair fill at 1-based (3,3) = 1. */
export const PAIR_ROW = makePuzzle(givensOf([[3, 1, 0], [3, 2, 0]]));
/** Givens: 0 at (4,2) and (4,3); the neighbour on the left (4,1) is a player cell. */
export const PAIR_LEFT = makePuzzle(givensOf([[4, 2, 0], [4, 3, 0]]));
/** Only givens: 1 at (1,4) and (2,4). The hint engine returns the pair fill at 1-based (3,4) = 0. */
export const PAIR_COL = makePuzzle(givensOf([[1, 4, 1], [2, 4, 1]]));
/** Givens: 0 at (3,1) and (3,2) plus 1 at (6,6) (a given far away from the run). */
export const PAIR_ROW_PLUS = makePuzzle(givensOf([[3, 1, 0], [3, 2, 0], [6, 6, 1]]));
/** Two independent pairs: 0 0 at (3,1),(3,2) and 1 1 at (5,4),(5,5): two consecutive pair hints. */
export const TWO_PAIRS = makePuzzle(givensOf([[3, 1, 0], [3, 2, 0], [5, 4, 1], [5, 5, 1]]));
/** Row 5 holds `0 1 0 . . 0`: no pair, no sandwich anywhere; the count rule targets (5,4) and leaves (5,5) empty. */
export const COUNT_ROW = makePuzzle(givensOf([[5, 1, 0], [5, 2, 1], [5, 3, 0], [5, 6, 0]]));
/** Two isolated givens: no rule applies, the hint engine returns kind 'none'. */
export const ISOLATED = makePuzzle(givensOf([[1, 1, 0], [4, 5, 1]]));
/**
 * A board on which the hint fill itself breaks a rule: the first pair hint is the row pair (1,1),(1,2) = 1 1,
 * target (1,3) = 0, which completes 0 0 0 in column 3 (rows 1 to 3). The board before the fill is rule-clean.
 * No valid grid keeps these givens, so the solution is an arbitrary valid grid (fixture is deliberately inconsistent).
 */
export const HINT_BREAKS = makePuzzle(givensOf([[1, 1, 1], [1, 2, 1], [2, 3, 0], [3, 3, 0]]), { inconsistent: true });
/** Givens already break a rule (three 0 in row 1): the board is highlighted the moment it is shown. */
export const DIRTY_GIVENS = makePuzzle(givensOf([[1, 1, 0], [1, 2, 0], [1, 3, 0]]), { inconsistent: true });

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

/** Every fixture, for the helper self-check. `consistent` = givens must be kept by the solution. */
export const FIXTURES: Array<{ name: string; puzzle: Puzzle; consistent: boolean }> = [
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
 * and the values of aria-label, title, placeholder and alt on every element in the root.
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
  }
  return out;
}

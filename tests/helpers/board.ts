// Test helpers: the spec's text board notation, board builders, sentence-shape checks.
// All coordinates taken by the builders are 1-BASED, exactly as the spec scenarios are written.
import type { Cell, Grid, Violation } from '../../src/engine/index';

export function cellAt(board: Grid, row: number, col: number): Cell {
  const line = board[row];
  if (line === undefined) throw new Error(`no row ${row}`);
  const cell = line[col];
  if (cell === undefined) throw new Error(`no cell ${row},${col}`);
  return cell;
}

/** Parse one cell token: `0`, `1` or `.` (empty). */
function parseToken(token: string): Cell {
  if (token === '.') return null;
  if (token === '0') return 0;
  if (token === '1') return 1;
  throw new Error(`bad board token "${token}"`);
}

/** Parse the spec notation: rows separated by newline, cells by spaces, `.` for empty. Must be square. */
export function parseBoard(text: string): Grid {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const board = lines.map((l) => l.split(/\s+/).map(parseToken));
  for (const row of board) {
    if (row.length !== board.length) throw new Error('parseBoard: board is not square');
  }
  return board;
}

export function emptyBoard(n: number): Grid {
  return Array.from({ length: n }, () => Array.from({ length: n }, (): Cell => null));
}

export function cloneBoard(board: Grid): Grid {
  return board.map((row) => [...row]);
}

export function boardToText(board: Grid): string {
  return board.map((row) => row.map((c) => (c === null ? '.' : String(c))).join(' ')).join('\n');
}

function setCell(board: Grid, row1: number, col1: number, value: Cell): void {
  const line = board[row1 - 1];
  if (line === undefined || col1 < 1 || col1 > line.length) throw new Error(`cell ${row1},${col1} is off the board`);
  const existing = line[col1 - 1];
  if (existing !== null && existing !== value) throw new Error(`conflicting values at ${row1},${col1}`);
  line[col1 - 1] = value;
}

export interface BoardSpec {
  /** rows by 1-based row number, written in the spec notation, e.g. { 3: '0 0 1 . . .' } */
  rows?: Record<number, string>;
  /** columns by 1-based column number, written TOP TO BOTTOM, e.g. { 2: '0 0 1 0 0 .' } */
  cols?: Record<number, string>;
  /** single cells [row, col, value], 1-based row and col */
  cells?: Array<[number, number, 0 | 1]>;
}

/** N x N board, every cell not listed is empty. */
export function boardOf(n: number, spec: BoardSpec): Grid {
  const board = emptyBoard(n);
  for (const [rowKey, text] of Object.entries(spec.rows ?? {})) {
    const tokens = text.trim().split(/\s+/);
    if (tokens.length !== n) throw new Error(`row ${rowKey} must have ${n} tokens`);
    tokens.forEach((t, i) => setCell(board, Number(rowKey), i + 1, parseToken(t)));
  }
  for (const [colKey, text] of Object.entries(spec.cols ?? {})) {
    const tokens = text.trim().split(/\s+/);
    if (tokens.length !== n) throw new Error(`column ${colKey} must have ${n} tokens`);
    tokens.forEach((t, i) => setCell(board, i + 1, Number(colKey), parseToken(t)));
  }
  for (const [r, c, v] of spec.cells ?? []) setCell(board, r, c, v);
  return board;
}

/** The valid full 4x4 grid of the "solved" scenario (FR-8). */
export const VALID_4X4: Grid = parseBoard(`
0 0 1 1
1 1 0 0
0 1 1 0
1 0 0 1
`);

/** Sort violation cells so that comparisons do not depend on the (unpinned) cell order. */
export function sortedCells(cells: Array<[number, number]>): Array<[number, number]> {
  return [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Violations of one (rule, axis, 0-based line index). */
export function matching(violations: Violation[], rule: Violation['rule'], axis: Violation['axis'], index?: number): Violation[] {
  return violations.filter((v) => v.rule === rule && v.axis === axis && (index === undefined || v.index === index));
}

/** Terminal marks (. ! ? and the ellipsis character) anywhere in a text. */
export function terminalMarkCount(text: string): number {
  return (text.match(/[.!?…]/g) ?? []).length;
}

/** NFR-4 shape: one line, exactly one terminal mark and it is the last character. */
export function isOneSentence(text: string): boolean {
  const t = text.trimEnd();
  return t.length > 1 && !t.includes('\n') && /[.!?…]$/.test(t) && terminalMarkCount(t) === 1;
}

export const hasCyrillic = (text: string): boolean => /\p{Script=Cyrillic}/u.test(text);
export const hasLatin = (text: string): boolean => /\p{Script=Latin}/u.test(text);

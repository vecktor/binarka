import type { Grid } from './types';

/**
 * The hint techniques, sentence-free: which cell to fill, with what, by which rule (FR-74 to FR-77).
 * Techniques 1 to 3 are line-local; technique 4 (look-ahead) places a value, applies techniques 1 to 3 for at most
 * CAP steps and looks for a violation. The board is a flat Int8Array (-1 empty) and the look-ahead places and undoes
 * from a trail instead of copying (design decision 8). Pure TypeScript: no DOM, no random numbers, no clock.
 */

export type Digit = 0 | 1;
export type Rule = 'pair' | 'sandwich' | 'count' | 'balance' | 'unique' | 'lookahead';
export type Axis = 'row' | 'col';

/** A chosen fill and the data a sentence needs; no sentence text here. */
export interface Fill {
  row: number;
  col: number;
  value: Digit;
  rule: Rule;
  /** line the rule works on (pair, sandwich, count, balance: the line; unique: the target's line) */
  axis?: Axis;
  line?: number;
  /** pair, sandwich: the digit already there; count: the digit that has N/2; balance: the digit with N/2 - 1 */
  digit?: Digit;
  /** count: empty cells of the line when the fill was chosen */
  empties?: number;
  /** unique: 0-based number of the complete line the target line matches */
  other?: number;
  /** look-ahead: forced fills before the contradiction (0 to CAP) */
  steps?: number;
}

/** The look-ahead cap of FR-76. */
const CAP = 4;
const EMPTY = -1;
const OUT = -2;

export interface Flat {
  n: number;
  cells: Int8Array;
  empties: number;
}

export function toFlat(board: Grid): Flat {
  const n = board.length;
  const cells = new Int8Array(n * n);
  let empties = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = board[r]?.[c] ?? null;
      cells[r * n + c] = v ?? EMPTY;
      if (v === null) empties++;
    }
  }
  return { n, cells, empties };
}

/** Writes a value into an empty cell. */
export function setCell(f: Flat, row: number, col: number, value: Digit): void {
  f.cells[row * f.n + col] = value;
  f.empties--;
}

/**
 * Local violation check: after a change at (row, col) on a board with no violation, the board violates a rule exactly when
 * the row or the column through the cell has three equal digits side by side, more than N/2 of a digit, or is a complete
 * line equal to another complete line of the same direction.
 */
export function localViolation(f: Flat, row: number, col: number): boolean {
  const { n, cells } = f;
  const half = n / 2;
  for (let axis = 0; axis < 2; axis++) {
    const line = axis === 0 ? row : col;
    const base = axis === 0 ? line * n : line;
    const step = axis === 0 ? 1 : n;
    let zeros = 0;
    let ones = 0;
    let run = 0;
    let prev = EMPTY;
    for (let i = 0, k = base; i < n; i++, k += step) {
      const v = cells[k] ?? EMPTY;
      if (v === 0) zeros++;
      else if (v === 1) ones++;
      if (v !== EMPTY && v === prev) {
        run++;
        if (run >= 3) return true;
      } else run = 1;
      prev = v;
    }
    if (zeros > half || ones > half) return true;
    if (zeros + ones === n) {
      for (let o = 0; o < n; o++) {
        if (o === line) continue;
        const obase = axis === 0 ? o * n : o;
        let same = true;
        for (let i = 0; i < n && same; i++) {
          const x = cells[obase + i * step] ?? EMPTY;
          if (x === EMPTY || x !== (cells[base + i * step] ?? EMPTY)) same = false;
        }
        if (same) return true;
      }
    }
  }
  return false;
}

/** Seam for the differential test of the local check: Grid in, 0-based cell. */
export function hasLocalViolation(board: Grid, row: number, col: number): boolean {
  return localViolation(toFlat(board), row, col);
}

const at = (f: Flat, axis: number, line: number, i: number): number =>
  i < 0 || i >= f.n ? OUT : (f.cells[axis === 0 ? line * f.n + i : i * f.n + line] ?? EMPTY);

function mk(axis: number, line: number, i: number, value: Digit, rule: Rule): Fill {
  return axis === 0
    ? { row: line, col: i, value, rule, axis: 'row', line }
    : { row: i, col: line, value, rule, axis: 'col', line };
}

/** Technique 1: pair, sandwich, count (unchanged selection order of the three basic rules). */
function basic(f: Flat): Fill | null {
  const { n } = f;
  const half = n / 2;
  for (let rule = 0; rule < 3; rule++) {
    for (let axis = 0; axis < 2; axis++) {
      for (let line = 0; line < n; line++) {
        if (rule === 2) {
          for (let d = 0; d < 2; d++) {
            let have = 0;
            let first = -1;
            let empties = 0;
            for (let i = 0; i < n; i++) {
              const v = at(f, axis, line, i);
              if (v === d) have++;
              else if (v === EMPTY) {
                empties++;
                if (first === -1) first = i;
              }
            }
            if (have === half && first !== -1) {
              const fill = mk(axis, line, first, (1 - d) as Digit, 'count');
              fill.digit = d as Digit;
              fill.empties = empties;
              return fill;
            }
          }
          continue;
        }
        for (let i = 0; i < n; i++) {
          const a = at(f, axis, line, i);
          if (a < 0) continue;
          if (rule === 0) {
            if (at(f, axis, line, i + 1) !== a) continue;
            let target = -1;
            if (at(f, axis, line, i - 1) === EMPTY) target = i - 1;
            else if (at(f, axis, line, i + 2) === EMPTY) target = i + 2;
            if (target !== -1) {
              const fill = mk(axis, line, target, (1 - a) as Digit, 'pair');
              fill.digit = a as Digit;
              return fill;
            }
          } else if (at(f, axis, line, i + 1) === EMPTY && at(f, axis, line, i + 2) === a) {
            const fill = mk(axis, line, i + 1, (1 - a) as Digit, 'sandwich');
            fill.digit = a as Digit;
            return fill;
          }
        }
      }
    }
  }
  return null;
}

/** Technique 2: line balance (FR-74). Cell-outer, digit-inner. */
function balance(f: Flat): Fill | null {
  const { n } = f;
  const half = n / 2;
  for (let axis = 0; axis < 2; axis++) {
    for (let line = 0; line < n; line++) {
      const counts = [0, 0];
      let empties = 0;
      for (let i = 0; i < n; i++) {
        const v = at(f, axis, line, i);
        if (v === EMPTY) empties++;
        else counts[v] = (counts[v] ?? 0) + 1;
      }
      if (empties < 2) continue;
      if (counts[0] !== half - 1 && counts[1] !== half - 1) continue;
      for (let e = 0; e < n; e++) {
        if (at(f, axis, line, e) !== EMPTY) continue;
        for (let d = 0; d < 2; d++) {
          if (counts[d] !== half - 1) continue;
          // e takes d, every other empty cell takes 1 - d: three side by side anywhere?
          let run = 0;
          let prev = -3;
          let triple = false;
          for (let i = 0; i < n && !triple; i++) {
            let v = at(f, axis, line, i);
            if (i === e) v = d;
            else if (v === EMPTY) v = 1 - d;
            if (v === prev) {
              run++;
              if (run >= 3) triple = true;
            } else run = 1;
            prev = v;
          }
          if (triple) {
            const fill = mk(axis, line, e, (1 - d) as Digit, 'balance');
            fill.digit = d as Digit;
            return fill;
          }
        }
      }
    }
  }
  return null;
}

/** Technique 3: unique lines (FR-75). */
function unique(f: Flat): Fill | null {
  const { n } = f;
  for (let axis = 0; axis < 2; axis++) {
    for (let line = 0; line < n; line++) {
      let empties = 0;
      let p1 = -1;
      for (let i = 0; i < n; i++) {
        if (at(f, axis, line, i) === EMPTY) {
          empties++;
          if (p1 === -1) p1 = i;
        }
      }
      if (empties !== 2) continue;
      for (let o = 0; o < n; o++) {
        if (o === line) continue;
        let complete = true;
        let agrees = true;
        for (let i = 0; i < n && complete && agrees; i++) {
          const x = at(f, axis, o, i);
          if (x === EMPTY) complete = false;
          else {
            const y = at(f, axis, line, i);
            if (y !== EMPTY && y !== x) agrees = false;
          }
        }
        if (complete && agrees) {
          const fill = mk(axis, line, p1, (1 - at(f, axis, o, p1)) as Digit, 'unique');
          fill.other = o;
          return fill;
        }
      }
    }
  }
  return null;
}

/** Techniques 1 to 3 in order: the first fill that applies, or null. */
function simple(f: Flat, ceiling: number): Fill | null {
  if (f.empties === 0) return null;
  const a = basic(f);
  if (a !== null || ceiling < 2) return a;
  const b = balance(f);
  if (b !== null || ceiling < 3) return b;
  return unique(f);
}

/** Technique 4: look-ahead (FR-76). The board is restored before returning. */
function lookAhead(f: Flat): Fill | null {
  const { n, cells } = f;
  let best: Fill | null = null;
  const trail: number[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (cells[r * n + c] !== EMPTY) continue;
      for (let v = 0; v < 2; v++) {
        trail.length = 0;
        cells[r * n + c] = v;
        f.empties--;
        trail.push(r * n + c);
        let steps = -1;
        if (localViolation(f, r, c)) steps = 0;
        else {
          for (let s = 1; s <= CAP; s++) {
            const fill = simple(f, 3);
            if (fill === null) break;
            cells[fill.row * n + fill.col] = fill.value;
            f.empties--;
            trail.push(fill.row * n + fill.col);
            if (localViolation(f, fill.row, fill.col)) {
              steps = s;
              break;
            }
          }
        }
        for (const k of trail) cells[k] = EMPTY;
        f.empties += trail.length;
        if (steps >= 0 && (best === null || steps < (best.steps ?? 0))) {
          best = { row: r, col: c, value: (1 - v) as Digit, rule: 'lookahead', steps };
          if (steps === 0) return best;
        }
      }
    }
  }
  return best;
}

/** The next fill with techniques 1 to `ceiling` on a flat board with no violation, or null. */
export function selectFill(f: Flat, ceiling: number): Fill | null {
  const s = simple(f, Math.min(ceiling, 3));
  if (s !== null || ceiling < 4 || f.empties === 0) return s;
  return lookAhead(f);
}

/** The next fill with techniques 1 to `ceiling`; the board is not changed and is assumed to have no violation. */
export function nextFill(board: Grid, ceiling: number): Fill | null {
  return selectFill(toFlat(board), ceiling);
}

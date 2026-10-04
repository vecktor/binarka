import { findViolations } from './rules';
import type { Grid } from './types';

const EMPTY = -1;

interface Search {
  n: number;
  /** nodes visited so far */
  nodes: number;
  /** stop searching (and flag exhaustion) once nodes exceeds this */
  maxNodes: number;
  exhausted: boolean;
  found: number;
}

function lineIndex(n: number, axis: number, line: number, i: number): number {
  return axis === 0 ? line * n + i : i * n + line;
}

/** Deduce forced cells to a fixed point. Returns false on a contradiction. */
function propagate(cells: Int8Array, n: number): boolean {
  const half = n / 2;
  let changed = true;
  const set = (idx: number, v: number): boolean => {
    const cur = cells[idx] as number;
    if (cur === EMPTY) {
      cells[idx] = v;
      changed = true;
      return true;
    }
    return cur === v;
  };
  while (changed) {
    changed = false;
    for (let axis = 0; axis < 2; axis++) {
      for (let line = 0; line < n; line++) {
        let zeros = 0;
        let ones = 0;
        for (let i = 0; i < n; i++) {
          const v = cells[lineIndex(n, axis, line, i)] as number;
          if (v === 0) zeros++;
          else if (v === 1) ones++;
        }
        if (zeros > half || ones > half) return false;
        if (zeros + ones < n && (zeros === half || ones === half)) {
          const fill = zeros === half ? 1 : 0;
          for (let i = 0; i < n; i++) {
            const idx = lineIndex(n, axis, line, i);
            if (cells[idx] === EMPTY) cells[idx] = fill;
          }
          changed = true;
        }
        for (let i = 0; i + 1 < n; i++) {
          const a = cells[lineIndex(n, axis, line, i)] as number;
          const b = cells[lineIndex(n, axis, line, i + 1)] as number;
          if (a !== EMPTY && a === b) {
            if (i + 2 < n && !set(lineIndex(n, axis, line, i + 2), 1 - a)) return false;
            if (i - 1 >= 0 && !set(lineIndex(n, axis, line, i - 1), 1 - a)) return false;
          }
          if (i + 2 < n) {
            const c = cells[lineIndex(n, axis, line, i + 2)] as number;
            if (a !== EMPTY && a === c && !set(lineIndex(n, axis, line, i + 1), 1 - a)) return false;
          }
        }
        // a run of three that was filled in directly (set() only guards forced cells)
        for (let i = 0; i + 2 < n; i++) {
          const a = cells[lineIndex(n, axis, line, i)] as number;
          if (
            a !== EMPTY &&
            a === cells[lineIndex(n, axis, line, i + 1)] &&
            a === cells[lineIndex(n, axis, line, i + 2)]
          ) {
            return false;
          }
        }
      }
    }
  }
  return !hasDuplicateLines(cells, n);
}

/** True when two complete rows or two complete columns are identical. */
function hasDuplicateLines(cells: Int8Array, n: number): boolean {
  for (let axis = 0; axis < 2; axis++) {
    const seen = new Set<number>();
    for (let line = 0; line < n; line++) {
      let mask = 0;
      let complete = true;
      for (let i = 0; i < n; i++) {
        const v = cells[lineIndex(n, axis, line, i)] as number;
        if (v === EMPTY) {
          complete = false;
          break;
        }
        mask = mask * 2 + v;
      }
      if (!complete) continue;
      if (seen.has(mask)) return true;
      seen.add(mask);
    }
  }
  return false;
}

function search(cells: Int8Array, s: Search, limit: number): void {
  if (s.found >= limit || s.exhausted) return;
  s.nodes++;
  if (s.nodes > s.maxNodes) {
    s.exhausted = true;
    return;
  }
  if (!propagate(cells, s.n)) return;
  let pick = -1;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === EMPTY) {
      pick = i;
      break;
    }
  }
  if (pick === -1) {
    s.found++;
    return;
  }
  for (const v of [0, 1]) {
    const next = Int8Array.from(cells);
    next[pick] = v;
    search(next, s, limit);
    if (s.found >= limit || s.exhausted) return;
  }
}

export interface BudgetedCount {
  count: 0 | 1 | 2;
  /** true when the node budget ran out before the answer was settled (count is then a lower bound) */
  exhausted: boolean;
}

/** Internal: solution count capped at 2, giving up after `maxNodes` search nodes (work, never the clock). */
export function countSolutionsBudgeted(board: Grid, maxNodes: number): BudgetedCount {
  const n = board.length;
  if (findViolations(board).length > 0) return { count: 0, exhausted: false };
  const cells = new Int8Array(n * n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) cells[r * n + c] = board[r]?.[c] ?? EMPTY;
  }
  const s: Search = { n, nodes: 0, maxNodes, exhausted: false, found: 0 };
  search(cells, s, 2);
  return { count: Math.min(s.found, 2) as 0 | 1 | 2, exhausted: s.exhausted };
}

/** Number of completions of the board: 0, 1 or 2 (2 stands for "2 or more"). */
export function countSolutions(board: Grid): 0 | 1 | 2 {
  return countSolutionsBudgeted(board, Number.POSITIVE_INFINITY).count;
}

import type { Grid, Violation } from './types';

function cellOf(board: Grid, r: number, c: number): 0 | 1 | null {
  return board[r]?.[c] ?? null;
}

/** Cells of line `index` along `axis`, in order. */
function line(board: Grid, axis: 'row' | 'col', index: number, n: number): Array<0 | 1 | null> {
  const out: Array<0 | 1 | null> = [];
  for (let i = 0; i < n; i++) out.push(axis === 'row' ? cellOf(board, index, i) : cellOf(board, i, index));
  return out;
}

export function findViolations(board: Grid): Violation[] {
  const n = board.length;
  const half = n / 2;
  const out: Violation[] = [];
  for (const axis of ['row', 'col'] as const) {
    const keys = new Map<number, string>();
    for (let index = 0; index < n; index++) {
      const cells = line(board, axis, index, n);
      const at = (i: number): [number, number] => (axis === 'row' ? [index, i] : [i, index]);
      let i = 0;
      while (i < n) {
        const v = cells[i];
        let j = i;
        while (j + 1 < n && cells[j + 1] === v) j++;
        if (v !== null && v !== undefined && j - i + 1 >= 3) {
          const run: Array<[number, number]> = [];
          for (let k = i; k <= j; k++) run.push(at(k));
          out.push({ rule: 'three', axis, index, cells: run });
        }
        i = j + 1;
      }
      const zeros = cells.filter((x) => x === 0).length;
      const ones = cells.filter((x) => x === 1).length;
      if (zeros > half || ones > half) {
        const over = zeros > half ? 0 : 1;
        const offending: Array<[number, number]> = [];
        cells.forEach((x, k) => {
          if (x === over) offending.push(at(k));
        });
        out.push({ rule: 'count', axis, index, cells: offending });
      }
      if (zeros + ones === n) {
        const key = cells.join('');
        for (const [other, otherKey] of keys) {
          if (otherKey === key) {
            const both: Array<[number, number]> = [];
            for (const l of [other, index]) {
              for (let k = 0; k < n; k++) both.push(axis === 'row' ? [l, k] : [k, l]);
            }
            out.push({ rule: 'duplicate', axis, index: other, other: index, cells: both });
          }
        }
        keys.set(index, key);
      }
    }
  }
  return out;
}

export function isSolved(board: Grid): boolean {
  for (const row of board) {
    for (const cell of row) if (cell === null || cell === undefined) return false;
  }
  return findViolations(board).length === 0;
}

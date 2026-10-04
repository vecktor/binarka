// Solution counter: countSolutions. Scenarios transcribed from openspec/specs/puzzle-engine/spec.md.
import { describe, expect, it } from 'vitest';
import { countSolutions } from '../src/engine/index';
import { VALID_4X4, boardOf, cloneBoard, emptyBoard } from './helpers/board';
import { oracleCount, oracleSolve } from './helpers/oracle';
import type { Grid } from '../src/engine/index';

/** Tiny deterministic generator for the differential test (never Math.random). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('oracle self-check (helper, no FR: the oracle must agree with the spec before it judges anything)', () => {
  it('agrees with the spec on the FR-10, FR-11 and FR-12 boards', () => {
    expect(oracleCount(boardOf(4, { rows: { 1: '0 0 0 .' } }))).toBe(0);
    expect(oracleCount(boardOf(4, { rows: { 1: '0 0 . .', 2: '0 0 . .' } }))).toBe(0);
    const almost = cloneBoard(VALID_4X4);
    const last = almost[3];
    if (last) last[3] = null;
    expect(oracleCount(almost)).toBe(1);
    expect(oracleCount(VALID_4X4)).toBe(1);
    expect(oracleCount(emptyBoard(4))).toBe(2);
    expect(oracleCount(emptyBoard(8))).toBe(2);
  });

  it('every solution it returns for empty 6x6 and 8x8 boards is a valid grid (balanced, no triples, distinct lines)', () => {
    for (const n of [6, 8]) {
      for (const g of oracleSolve(emptyBoard(n)).solutions) {
        const lines: (0 | 1)[][] = [...g, ...Array.from({ length: n }, (_, c) => g.map((row) => row[c] ?? 0))];
        for (const l of lines) {
          expect(l.reduce<number>((a, b) => a + b, 0)).toBe(n / 2);
          for (let i = 2; i < n; i++) expect(l[i] === l[i - 1] && l[i - 1] === l[i - 2]).toBe(false);
        }
        expect(new Set(g.map((r) => r.join(''))).size).toBe(n);
        expect(new Set(lines.slice(n).map((r) => r.join(''))).size).toBe(n);
      }
    }
  });

  it('matches a brute-force enumeration of all 65536 4x4 grids (72 are valid) on 300 random boards', () => {
    const valid: (0 | 1)[][][] = [];
    for (let mask = 0; mask < 1 << 16; mask++) {
      const g: (0 | 1)[][] = Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c): 0 | 1 => (((mask >> (r * 4 + c)) & 1) === 1 ? 1 : 0)),
      );
      const lines: (0 | 1)[][] = [...g, ...Array.from({ length: 4 }, (_, c) => g.map((row) => row[c] ?? 0))];
      const okLines = lines.every((l) => {
        const ones = l.reduce<number>((a, b) => a + b, 0);
        return ones === 2 && !(l[0] === l[1] && l[1] === l[2]) && !(l[1] === l[2] && l[2] === l[3]);
      });
      const rowsDistinct = new Set(g.map((r) => r.join(''))).size === 4;
      const colsDistinct = new Set(lines.slice(4).map((r) => r.join(''))).size === 4;
      if (okLines && rowsDistinct && colsDistinct) valid.push(g);
    }
    expect(valid).toHaveLength(72);
    const rand = lcg(77);
    for (let i = 0; i < 300; i++) {
      const base = valid[Math.floor(rand() * valid.length)];
      if (!base) throw new Error('no base grid');
      const keep = rand();
      const board: Grid = base.map((row) => row.map((v) => (rand() < keep ? v : null)));
      if (i % 4 === 0) {
        const line = board[Math.floor(rand() * 4)];
        const c = Math.floor(rand() * 4);
        if (line && line[c] !== null) line[c] = line[c] === 0 ? 1 : 0;
      }
      const brute = valid.filter((g) => g.every((row, r) => row.every((v, c) => board[r]?.[c] == null || board[r]?.[c] === v))).length;
      expect(oracleCount(board)).toBe(Math.min(brute, 2));
    }
  });
});

describe('@trace FR-10 solver reports zero solutions', () => {
  it('row 1 = 0 0 0 . (already breaks a rule) gives 0', () => {
    expect(countSolutions(boardOf(4, { rows: { 1: '0 0 0 .' } }))).toBe(0);
  });

  it('rows 1 and 2 both 0 0 . . (no violation yet, no completion) give 0', () => {
    expect(countSolutions(boardOf(4, { rows: { 1: '0 0 . .', 2: '0 0 . .' } }))).toBe(0);
  });
});

describe('@trace FR-11 solver reports exactly one solution', () => {
  it('valid grid with row 4 column 4 emptied gives 1', () => {
    const board = cloneBoard(VALID_4X4);
    const row = board[3];
    if (row) row[3] = null;
    expect(countSolutions(board)).toBe(1);
  });

  it('already complete valid grid gives 1', () => {
    expect(countSolutions(VALID_4X4)).toBe(1);
  });
});

describe('@trace FR-12 solver stops at the second solution', () => {
  it('empty 4x4 board reports "2 or more" (2)', () => {
    expect(countSolutions(emptyBoard(4))).toBe(2);
  });

  it('empty 8x8 board returns exactly 2 and nothing above 2', () => {
    const result = countSolutions(emptyBoard(8));
    expect(result).toBe(2);
    expect(result).toBeLessThanOrEqual(2);
  });
});

describe('@trace FR-10, FR-11, FR-12 solver agrees with the independent oracle', () => {
  it.each([4, 6, 8])('on size-%i boards cut from a valid grid, with and without one flipped cell', (n) => {
    const rand = lcg(1000 + n);
    const base = oracleSolve(emptyBoard(n)).solutions[0];
    if (!base) throw new Error('oracle found no grid');
    const seen = new Set<number>();
    const boards = n === 8 ? 100 : 120;
    for (let i = 0; i < boards; i++) {
      const keep = 0.2 + rand() * 0.6;
      const board: Grid = base.map((row) => row.map((v) => (rand() < keep ? v : null)));
      if (i % 3 === 0) {
        // flip one filled cell: the board usually becomes unsolvable, sometimes still has completions
        const r = Math.floor(rand() * n);
        const c = Math.floor(rand() * n);
        const line = board[r];
        if (line && line[c] !== null) line[c] = line[c] === 0 ? 1 : 0;
      }
      const expected = oracleCount(board);
      seen.add(expected);
      expect(countSolutions(board), `board:\n${board.map((row) => row.map((x) => x ?? '.').join(' ')).join('\n')}`).toBe(expected);
    }
    // the sample must exercise all three answers, otherwise the comparison is weak
    expect(seen.has(0) && seen.has(1) && seen.has(2), `answers seen: ${[...seen].join(',')}`).toBe(true);
  }, 60_000);
});

// FR-15: every generated puzzle has exactly one solution, N = 4, 6, 8, seeds 1 to 20 (60 puzzles).
// Checked twice and independently: by the engine solver AND by the oracle in tests/helpers/oracle.ts.
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations, generate, isSolved } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';
import { oracleSolve } from './helpers/oracle';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const LONG = 120_000;

function puzzles(n: number): [number, Puzzle][] {
  return SEEDS.map((seed): [number, Puzzle] => [seed, generate(n, seed)]);
}

describe.each([4, 6, 8])('@trace FR-15 uniqueness at N = %i over seeds 1 to 20', (n) => {
  it('engine solver reports 1 on the givens of every puzzle', () => {
    const bad = puzzles(n)
      .map(([seed, p]) => [seed, countSolutions(p.givens)] as const)
      .filter(([, count]) => count !== 1);
    expect(bad, 'seed/solver-result pairs that are not 1').toEqual([]);
  }, LONG);

  it('independent oracle finds exactly one solution for the givens of every puzzle', () => {
    const bad = puzzles(n)
      .map(([seed, p]) => [seed, oracleSolve(p.givens).count] as const)
      .filter(([, count]) => count !== 1);
    expect(bad, 'seed/oracle-count pairs that are not 1').toEqual([]);
  }, LONG);

  it('the solution is complete, rule-valid and agrees with every given', () => {
    for (const [seed, p] of puzzles(n)) {
      const label = `seed ${seed}`;
      expect(p.solution, label).toHaveLength(n);
      for (const row of p.solution) {
        expect(row, label).toHaveLength(n);
        for (const cell of row) expect([0, 1], label).toContain(cell);
      }
      expect(findViolations(p.solution), label).toEqual([]);
      expect(isSolved(p.solution), label).toBe(true);
      p.givens.forEach((row, r) => {
        row.forEach((g, c) => {
          if (g !== null) expect(p.solution[r]?.[c], `${label} given ${r},${c}`).toBe(g);
        });
      });
    }
  }, LONG);

  it('the solution equals the one solution the oracle finds for the givens', () => {
    for (const [seed, p] of puzzles(n)) {
      const found = oracleSolve(p.givens);
      expect(found.count, `seed ${seed}`).toBe(1);
      expect(p.solution, `seed ${seed}`).toEqual(found.solutions[0]);
    }
  }, LONG);
});

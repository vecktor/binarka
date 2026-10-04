// Self-check of the play-page test helpers and fixtures. Carries no @trace on purpose: it checks the test data
// (and the real engine on it), never the page, so it passes against the red-stage stub.
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations, hint, isSolved } from '../src/engine/index';
import {
  BROKEN_SENTENCE,
  COUNT_ROW,
  DIRTY_GIVENS,
  FIXTURES,
  HINT_BREAKS,
  ISOLATED,
  NO_RULE_SENTENCE,
  PAIR_COL,
  PAIR_ROW,
  TWO_PAIRS,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allSolutions,
  checkerCells,
  keepsGivens,
  seedQueue,
  solutionGrid,
} from './helpers/play-page';
import { boardOf } from './helpers/board';

describe('play-page fixtures', () => {
  it('every enumerated 6x6 grid is solved by the real rule checker (and there are 4140 of them)', () => {
    const all = allSolutions();
    expect(all).toHaveLength(4140);
    expect(all.every((g) => isSolved(g))).toBe(true);
  });

  for (const { name, puzzle, consistent } of FIXTURES) {
    it(`${name}: size 6, valid solution, givens are a rule-clean subset of the solution`, () => {
      expect(puzzle.size).toBe(6);
      expect(puzzle.givens).toHaveLength(6);
      expect(puzzle.givens.every((r) => r.length === 6)).toBe(true);
      expect(isSolved(solutionGrid(puzzle))).toBe(true);
      if (consistent) {
        expect(keepsGivens(solutionGrid(puzzle), puzzle.givens)).toBe(true);
        expect(findViolations(puzzle.givens)).toEqual([]);
      }
    });
  }

  it('WIN_PUZZLE has exactly one solution, 10 givens and a given 1 at row 2 column 5', () => {
    expect(countSolutions(WIN_PUZZLE.givens)).toBe(1);
    expect(WIN_PUZZLE.givens.flat().filter((c) => c !== null)).toHaveLength(10);
    expect(WIN_PUZZLE.givens[1]?.[4]).toBe(1);
    expect(WIN_PUZZLE.solution[3]?.[0]).toBe(1);
    expect(WIN_PUZZLE.solution[5]?.[5]).toBe(1);
  });

  it('DIRTY_GIVENS breaks exactly the three-in-a-row rule in row 1', () => {
    expect(checkerCells(DIRTY_GIVENS.givens)).toEqual([[1, 1], [1, 2], [1, 3]]);
  });
});

describe('play-page hint premises, computed with the real engine on the fixtures', () => {
  it('PAIR_ROW: the zero-based target of the spec is {row 2, col 2, value 1, pair}', () => {
    const h = hint(PAIR_ROW.givens);
    expect(h).toMatchObject({ kind: 'fill', row: 2, col: 2, value: 1, rule: 'pair' });
  });

  it('PAIR_COL fills (3,4) with 0', () => {
    expect(hint(PAIR_COL.givens)).toMatchObject({ kind: 'fill', row: 2, col: 3, value: 0, rule: 'pair' });
  });

  it('COUNT_ROW: count rule, target (5,4), (5,5) stays empty, nothing else can fire first', () => {
    expect(hint(COUNT_ROW.givens)).toMatchObject({ kind: 'fill', row: 4, col: 3, value: 1, rule: 'count' });
    expect(findViolations(COUNT_ROW.givens)).toEqual([]);
  });

  it('ISOLATED: no rule applies', () => {
    expect(hint(ISOLATED.givens)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('TWO_PAIRS: the second hint (after the first fill) is the row 5 pair', () => {
    const first = hint(TWO_PAIRS.givens);
    expect(first).toMatchObject({ kind: 'fill', row: 2, col: 2, value: 1 });
    const after = TWO_PAIRS.givens.map((r) => [...r]);
    const line = after[2];
    if (line === undefined) throw new Error('row');
    line[2] = 1;
    expect(hint(after)).toMatchObject({ kind: 'fill', row: 4, col: 2, value: 0, rule: 'pair' });
  });

  it('HINT_BREAKS: rule-clean before, the fill (1,3) = 0 then breaks column 3', () => {
    expect(findViolations(HINT_BREAKS.givens)).toEqual([]);
    expect(hint(HINT_BREAKS.givens)).toMatchObject({ kind: 'fill', row: 0, col: 2, value: 0 });
    const after = HINT_BREAKS.givens.map((r) => [...r]);
    const line = after[0];
    if (line === undefined) throw new Error('row');
    line[2] = 0;
    expect(checkerCells(after)).toEqual([[1, 3], [2, 3], [3, 3]]);
  });

  it('the win fixture with (4,1) left empty: the hint targets it with the solution digit', () => {
    const board = solutionGrid(WIN_PUZZLE);
    const line = board[3];
    if (line === undefined) throw new Error('row');
    line[0] = null;
    expect(findViolations(board)).toEqual([]);
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 3, col: 0, value: 1 });
  });

  it('the engine sentences used as literals are the ones the engine returns', () => {
    expect(hint(boardOf(6, { cells: [[1, 1, 0], [1, 2, 0], [1, 3, 0]] })).sentence).toBe(BROKEN_SENTENCE);
    expect(hint(PAIR_ROW.givens).sentence).toBe('Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця.');
  });
});

describe('play-page seed helpers and constants', () => {
  it('seedQueue returns the listed seeds in order, then keeps counting up, and counts the calls', () => {
    const q = seedQueue([1, 2, 3]);
    expect([q.source(), q.source(), q.source(), q.source(), q.source()]).toEqual([1, 2, 3, 4, 5]);
    expect(q.calls()).toBe(5);
  });

  it('the win message uses the ASCII apostrophe U+0027 and no Latin letters', () => {
    expect(WIN_MESSAGE.codePointAt(WIN_MESSAGE.indexOf('розв') + 4)).toBe(0x27);
    expect(WIN_MESSAGE).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x27)}язано!`);
    expect(/[A-Za-z]/.test(WIN_MESSAGE)).toBe(false);
  });
});

// Self-check of the play-page test helpers and fixtures. Carries no @trace on purpose: it checks the test data
// (and the real engine on it), never the page, so it passes against the red-stage page.
import { describe, expect, it, vi } from 'vitest';
import { countSolutions, findViolations, generate, hint, isSolved } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  BROKEN_SENTENCE,
  COUNT_ROW,
  DIRTY_8_COL,
  DIRTY_8_ROW,
  DIRTY_GIVENS,
  FIXTURES,
  HINT_BREAKS,
  ISOLATED,
  NO_RULE_SENTENCE,
  PAIR_4,
  PAIR_8,
  PAIR_COL,
  PAIR_ROW,
  SOLUTION_8_TEXT,
  TWO_PAIRS,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allSolutions,
  bySize,
  checkerCells,
  collectPageText,
  fixedGenerate,
  generateSpy,
  givensOf,
  keepsGivens,
  makePuzzle,
  messageArea,
  rawGenerateSpy,
  rulesPanel,
  seedQueue,
  solutionGrid,
  textWithoutHidden,
  trackErrors,
} from './helpers/play-page';
import { VALID_4X4, boardOf, parseBoard } from './helpers/board';

describe('play-page fixtures', () => {
  // Slice 3 (FR-43), deliberate update: the slice-2 check asserted allSolutions().length === 4140 and a 6x6 size for
  // every fixture. It now asserts the count per N (72 and 4140; 8x8 is never enumerated) and checks each fixture
  // against its own puzzle.size.
  it('every enumerated 6x6 grid is solved by the real rule checker (and there are 4140 of them)', () => {
    const all = allSolutions(6);
    expect(all).toHaveLength(4140);
    expect(all.every((g) => isSolved(g))).toBe(true);
    expect(allSolutions()).toBe(all); // the default N is 6 and the result is cached
  });

  it('every enumerated 4x4 grid is solved by the real rule checker (and there are 72 of them)', () => {
    const all = allSolutions(4);
    expect(all).toHaveLength(72);
    expect(all.every((g) => isSolved(g))).toBe(true);
    expect(allSolutions(4)).toBe(all);
  });

  it('allSolutions refuses N = 8 (4,111,116 grids) instead of enumerating', () => {
    expect(() => allSolutions(8)).toThrow(/8/);
  });

  for (const { name, puzzle, consistent } of FIXTURES) {
    it(`${name}: valid solution, givens are a rule-clean subset of the solution, all of its own size`, () => {
      expect([4, 6, 8]).toContain(puzzle.size);
      expect(puzzle.givens).toHaveLength(puzzle.size);
      expect(puzzle.givens.every((r) => r.length === puzzle.size)).toBe(true);
      expect(puzzle.solution).toHaveLength(puzzle.size);
      expect(puzzle.solution.every((r) => r.length === puzzle.size)).toBe(true);
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

  it('the fixtures of the three sizes have the expected sizes', () => {
    expect([BLANK_4, PAIR_4, WIN_4].map((p) => p.size)).toEqual([4, 4, 4]);
    expect([BLANK, PAIR_ROW, WIN_PUZZLE].map((p) => p.size)).toEqual([6, 6, 6]);
    expect([BLANK_8, PAIR_8, WIN_8, DIRTY_8_ROW, DIRTY_8_COL].map((p) => p.size)).toEqual([8, 8, 8, 8, 8]);
  });

  it('SOLUTION_8_TEXT is a valid solved 8x8 grid and is the engine solution for size 8, seed 1', () => {
    const grid = parseBoard(SOLUTION_8_TEXT);
    expect(grid).toHaveLength(8);
    expect(isSolved(grid)).toBe(true);
    expect(grid).toEqual(generate(8, 1).solution);
  });

  it('makePuzzle derives N from the givens, enumerates only 4 and 6 and wants an explicit solution at 8', () => {
    expect(makePuzzle(boardOf(6, { cells: [[1, 1, 0]] })).size).toBe(6);
    const four = makePuzzle(givensOf(4, [[2, 1, 0], [2, 2, 0]]));
    expect(four.size).toBe(4);
    expect(keepsGivens(solutionGrid(four), four.givens)).toBe(true);
    expect(() => makePuzzle(givensOf(8, []))).toThrow(/explicit/);
    expect(() => makePuzzle(givensOf(8, []), { solution: VALID_4X4.map((r) => r.join(' ')).join('\n') })).toThrow(/4x4/);
  });

  it('fixture generators return a fixture of the requested size and THROW for any other size', () => {
    expect(fixedGenerate(BLANK)(6, 1)).toBe(BLANK);
    expect(() => fixedGenerate(BLANK)(8, 1)).toThrow(/6x6/);
    const spy = generateSpy(() => BLANK);
    expect(spy.generate(6, 3)).toBe(BLANK);
    expect(() => spy.generate(4, 4)).toThrow();
    expect(spy.calls).toEqual([{ size: 6, seed: 3 }, { size: 4, seed: 4 }]); // a failed attempt is still recorded
    const pick = bySize({ 6: BLANK, 8: BLANK_8 });
    expect(pick(0, 8, 1)).toBe(BLANK_8);
    expect(() => pick(0, 4, 1)).toThrow();
    // the raw spy is the one that may return a wrong-size result (for the generator-error scenarios)
    const raw = rawGenerateSpy(() => BLANK);
    expect(raw.generate(8, 1)).toBe(BLANK);
  });

  it('trackErrors records an uncaught listener error that dispatchEvent itself swallows (the check is not vacuous)', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const node = document.createElement('div');
    node.addEventListener('change', () => {
      throw new Error('boom');
    });
    const tracker = trackErrors();
    try {
      expect(() => node.dispatchEvent(new Event('change'))).not.toThrow(); // the vacuous check
    } finally {
      tracker.stop();
      quiet.mockRestore();
    }
    expect(tracker.errors).toHaveLength(1);
    expect(String(tracker.errors[0])).toContain('boom');
    // after stop() nothing more is recorded
    const after = trackErrors();
    after.stop();
    expect(after.errors).toEqual([]);
  });

  it('collectPageText collects the label attribute of option and optgroup, and not the option value', () => {
    const root = document.createElement('div');
    root.innerHTML = '<select><optgroup label="Group label"><option value="4" label="Option label">x</option></optgroup></select>';
    const texts = collectPageText(root);
    expect(texts).toContain('Group label');
    expect(texts).toContain('Option label');
    expect(texts).toContain('x');
    expect(texts).not.toContain('4');
  });

  it('collectPageText skips text under aria-hidden="true" (decoration, A-26) and keeps the visible text next to it', () => {
    const root = document.createElement('div');
    root.innerHTML = '<ul><li>Visible rule<span aria-hidden="true">0 0 1 <b>decor</b></span></li></ul>';
    const texts = collectPageText(root);
    expect(texts).toContain('Visible rule');
    expect(texts.some((t) => t.includes('decor') || t.includes('0 0 1'))).toBe(false);
  });

  it('textWithoutHidden drops the aria-hidden descendants and keeps the rest; rulesPanel / messageArea assert their element', () => {
    const li = document.createElement('li');
    li.innerHTML = 'Rule text<span aria-hidden="true">0 1 ≠ 1 0</span>';
    expect(textWithoutHidden(li)).toBe('Rule text');
    expect(li.textContent).toContain('≠'); // the original is untouched

    const root = document.createElement('div');
    root.innerHTML = '<div data-section="rules"></div><div class="area"><p data-message="idle"></p></div>';
    expect(rulesPanel(root)).toBe(root.querySelector('[data-section="rules"]'));
    expect(messageArea(root)).toBe(root.querySelector('.area'));
    root.insertAdjacentHTML('beforeend', '<div data-section="rules"></div>');
    expect(() => rulesPanel(root)).toThrow();
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

  it('PAIR_4: the zero-based target of the spec is {row 1, col 2, value 1, pair}', () => {
    expect(hint(PAIR_4.givens)).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' });
    expect(findViolations(PAIR_4.givens)).toEqual([]);
  });

  it('PAIR_8: the zero-based target of the spec is {row 7, col 5, value 1, pair}', () => {
    expect(hint(PAIR_8.givens)).toMatchObject({ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' });
    expect(findViolations(PAIR_8.givens)).toEqual([]);
  });

  it('the 4x4 and 8x8 win fixtures: the solution satisfies isSolved, exactly one non-given cell, digits as written', () => {
    expect(isSolved(solutionGrid(WIN_4))).toBe(true);
    expect(isSolved(solutionGrid(WIN_8))).toBe(true);
    for (const [puzzle, last] of [[WIN_4, 4], [WIN_8, 8]] as const) {
      const empties = puzzle.givens.flat().filter((c) => c === null);
      expect(empties).toHaveLength(1);
      expect(puzzle.givens[last - 1]?.[last - 1]).toBeNull();
      expect(keepsGivens(solutionGrid(puzzle), puzzle.givens)).toBe(true);
    }
    expect(WIN_4.solution[3]?.[3]).toBe(1); // the player clicks (4,4) twice
    expect(WIN_8.solution[7]?.[7]).toBe(0); // the player clicks (8,8) once
  });

  it('DIRTY_8_ROW: the checker reports `three` in row 8 and nothing else; the cells are (8,1), (8,2), (8,3)', () => {
    const violations = findViolations(DIRTY_8_ROW.givens);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'three', axis: 'row', index: 7 });
    expect(checkerCells(DIRTY_8_ROW.givens)).toEqual([[8, 1], [8, 2], [8, 3]]);
  });

  it('DIRTY_8_COL: the checker reports `count` on column 8 and nothing else; every cell of column 8 is expected', () => {
    const violations = findViolations(DIRTY_8_COL.givens);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: 'count', axis: 'col', index: 7 });
    // the checker lists only the five 1s, the page must highlight the whole column
    expect(violations[0]?.cells).toHaveLength(5);
    expect(checkerCells(DIRTY_8_COL.givens)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((r) => [r, 8]));
  });

  it('the engine sentences used as literals are the ones the engine returns', () => {
    expect(hint(boardOf(6, { cells: [[1, 1, 0], [1, 2, 0], [1, 3, 0]] })).sentence).toBe(BROKEN_SENTENCE);
    expect(hint(PAIR_ROW.givens).sentence).toBe('Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.');
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

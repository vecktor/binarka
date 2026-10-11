// Self-check of the play-page test helpers and fixtures. Carries no @trace on purpose: it checks the test data
// (and the real engine on it), never the page, so it passes against the red-stage page.
import { afterAll, describe, expect, it, vi } from 'vitest';
import { countSolutions, findViolations, generate, hint, isSolved } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  DARK_QUERY,
  THEME_KEY,
  addThemeColorMeta,
  installMatchMedia,
  installMatchMediaWithoutListeners,
  installThrowingMatchMedia,
  makeLocalStorageAccessThrow,
  BLANK_8,
  BROKEN_SENTENCE,
  COUNT_ROW,
  DIRTY_8_COL,
  DIRTY_8_ROW,
  DIRTY_GIVENS,
  FIXTURES,
  HINT_BREAKS,
  HINT_BREAKS_4,
  HINT_BREAKS_8,
  callOrder,
  closeCalls,
  dialogLog,
  dispatchToggle,
  installPageLifecycle,
  onDialogClose,
  popoverCalls,
  popoverIsOpen,
  popoverLog,
  showModalCalls,
  ISOLATED,
  NO_RULE_SENTENCE,
  PAIR_4,
  PAIR_8,
  PAIR_COL,
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW,
  PAIR_ROW_PLUS,
  SOLUTION_8_TEXT,
  START_LABEL,
  TWO_PAIRS,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allSolutions,
  bySize,
  checkerCells,
  chooseLevel,
  dialogIsOpen,
  markLevel,
  markSize,
  openSheetIfClosed,
  pressStart,
  selectSize,
  sheetOf,
  sheetStartButton,
  collectPageText,
  expectedCellLabel,
  fixedGenerate,
  focusCell,
  generateSpy,
  givensOf,
  keepsGivens,
  makePuzzle,
  messageArea,
  pressKey,
  pressKeyEvent,
  rawGenerateSpy,
  rulesPanel,
  seedQueue,
  solutionGrid,
  textWithoutHidden,
  trackErrors,
} from './helpers/play-page';
import { VALID_4X4, boardOf, parseBoard } from './helpers/board';
import { enCellLabel } from './helpers/english';
import {
  CONTRAST_PAIRS,
  DARK_LABEL,
  PALETTE_DARK,
  PALETTE_LIGHT,
  TOKEN_NAMES,
  TRANSLUCENT_TOKENS,
  compositeOver,
  contrastProblems,
  contrastRatio,
  darkRootRules,
  declarationsFor,
  lightRootRules,
  namedColoursIn,
  parseStyles,
  px,
  relativeLuminance,
  rgbOf,
  rgbTripleOf,
  rulesWithSelector,
  injectPageStyles,
  NAMED_COLOURS,
  SYSTEM_COLOURS,
  scanColours,
  scanSystemColours,
  themeTokenSets,
  tokenFormatProblems,
  withTokensInlined,
} from './helpers/css';

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
    // Slice DL2 DELIBERATE CHANGE (FR-77 page clause, autonomy-log row 88): the premise is re-asserted at the ceiling the page uses
    expect(hint(ISOLATED.givens, 4), 'ISOLATED fills nothing at ceiling 4 too').toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
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
    // Slice DL2 DELIBERATE CHANGE (FR-77 page clause): the first hint is the same fill at the ceiling the page uses
    expect(hint(HINT_BREAKS.givens, 4)).toMatchObject({ kind: 'fill', row: 0, col: 2, value: 0, rule: 'pair' });
    const after = HINT_BREAKS.givens.map((r) => [...r]);
    const line = after[0];
    if (line === undefined) throw new Error('row');
    line[2] = 0;
    expect(checkerCells(after)).toEqual([[1, 3], [2, 3], [3, 3]]);
  });

  it.each([[4, HINT_BREAKS_4], [6, HINT_BREAKS], [8, HINT_BREAKS_8]] as const)(
    'HINT_BREAKS at %i: with the player entry (n,n) = 1 the board is rule-clean and the first hint is the fill (1,3) = 0, which then breaks a rule',
    (n, puzzle) => {
      const board = puzzle.givens.map((r) => [...r]);
      const last = board[n - 1];
      if (last === undefined) throw new Error('row');
      last[n - 1] = 1;
      expect(findViolations(board)).toEqual([]);
      expect(hint(board)).toMatchObject({ kind: 'fill', row: 0, col: 2, value: 0, rule: 'pair' });
      expect(hint(board, 4), 'the same first hint at ceiling 4 (FR-77 page clause, DL2)').toMatchObject({ kind: 'fill', row: 0, col: 2, value: 0, rule: 'pair' });
      const after = board.map((r) => [...r]);
      const line = after[0];
      if (line === undefined) throw new Error('row');
      line[2] = 0;
      expect(findViolations(after).length).toBeGreaterThan(0);
      expect(checkerCells(after)).toContainEqual([1, 3]);
    },
  );

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

  it('the win message uses the modifier letter apostrophe U+02BC and no Latin letters', () => {
    expect(WIN_MESSAGE.codePointAt(WIN_MESSAGE.indexOf('розв') + 4)).toBe(0x2bc);
    expect(WIN_MESSAGE).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x2bc)}язано!`);
    expect(/[A-Za-z]/.test(WIN_MESSAGE)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Slice 6 (add-page-accessibility): self-checks of tests/helpers/css.ts and the keyboard/focus helpers. They run on
// literal samples, never on src/ui/style.css or the page, so they pass at the red stage (no @trace on purpose).
// ---------------------------------------------------------------------------------------------------------

/**
 * The light token values of the G2 palette (A-57 appendix, block 2; the table of the spec delta of update-page-palette); the self-check below
 * proves they meet the thresholds.
 * DELIBERATE CHANGE (update-page-palette, delta «Borders, cues and focus rings have enough contrast», proposal.md Impact row
 * `tests/play-page-helpers.test.ts:378-418`): the fixture follows `TOKEN_NAMES`, which grows from the 13 baseline names to the 25 of block 2.
 * DELIBERATE CHANGE (update-page-backdrop, delta 1 «Borders, cues and focus rings have enough contrast»; proposal.md Impact row
 * `tests/play-page-helpers.test.ts:378-418`): the fixture follows `TOKEN_NAMES` again, now 27 names: the two backdrop tokens of the spec's table
 * (light `#46280f38` and `#2d190a80`), both translucent.
 */
const DESIGN_TOKENS: Record<string, string> = {
  '--color-page': '#f7f3ea',
  '--color-text': '#1e2126',
  '--color-text-muted': '#5f5549',
  '--color-cell-bg': '#fffdf8',
  '--color-control-bg': '#fffdf8',
  '--color-line': '#e2dbcc',
  '--color-cell-border': '#847b6d',
  '--color-control-border': '#8c8374',
  '--color-given-bg': '#ddd3be',
  '--color-given-border': '#847b6d',
  '--color-given-text': '#1e2126',
  '--color-entry-text': '#a8400c',
  '--color-primary': '#b4460d',
  '--color-primary-text': '#fffdf8',
  '--color-primary-soft': '#f6e3d4',
  '--color-hover-ring': '#d28f6b',
  '--color-violation-bg': '#fbe4e1',
  '--color-violation-border': '#b3261e',
  '--color-violation-stripe': '#f1c9c6',
  '--color-violation-text': '#8f1d17',
  '--color-success': '#2f6b3a',
  '--color-success-bg': '#e2efdf',
  '--color-success-glow': '#2f6b3a73',
  '--color-win-text': '#1e2126',
  '--color-focus': '#1e2126',
  '--color-backdrop-soft': '#46280f38',
  '--color-backdrop-strong': '#2d190a80',
};

const tokenCss = (tokens: Record<string, string>): string =>
  `:root { ${Object.entries(tokens).map(([k, v]) => `${k}: ${v};`).join(' ')} }`;

describe('css helper: contrastRatio and rgbOf', () => {
  it('white on black is 21, equal colours are 1, the old given fill on the page is 1.41 and below 3', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    expect(contrastRatio('#d1d5db', '#f9fafb')).toBeCloseTo(1.41, 2);
    expect(contrastRatio('#d1d5db', '#f9fafb')).toBeLessThan(3);
  });

  it('is symmetric and rejects a colour that is not #rrggbb', () => {
    expect(contrastRatio('#1d4ed8', '#f9fafb')).toBeCloseTo(contrastRatio('#f9fafb', '#1d4ed8'), 10);
    expect(() => contrastRatio('#fff', '#000')).toThrow(/rrggbb/);
    expect(() => rgbOf('red')).toThrow(/rrggbb/);
  });

  it('rgbOf gives the rgb() string jsdom returns', () => {
    expect(rgbOf('#1d4ed8')).toBe('rgb(29, 78, 216)');
    expect(rgbOf('#FFFFFF')).toBe('rgb(255, 255, 255)');
  });

  // DELIBERATE CHANGE (update-page-palette, delta «Borders, cues and focus rings have enough contrast»; proposal.md Impact rows
  // `tests/play-page-helpers.test.ts:378-418`, `:422` and `:425-428`): the fixture is the 25 names; CONTRAST_PAIRS is the new list
  // (4 cell border + 4 violation cue + 3 hinted cue + 8 focus ring + 1 control border + 14 text = 34); the two spot ratios are the tightest
  // pair of the palette (the cell border on the board plate) and the ring on the cell border.
  // DELIBERATE CHANGE (update-page-backdrop, delta 1 «Borders, cues and focus rings have enough contrast»; proposal.md Impact row
  // `tests/play-page-helpers.test.ts:437-442`): the comment and `toHaveLength(25)` become 27 and the key list follows (the pair count stays 34:
  // a backdrop is in no pair). The two added lines pin the helper's light value table to the fixture, which is the spec's table written out.
  // DELIBERATE CHANGE (add-violation-cause, delta «Borders, cues and focus rings have enough contrast», scenario «The cause cue has 3:1 against the
  // violation fill and the stripe»; proposal.md Impact row `tests/play-page-helpers.test.ts` 460, 466-467): CONTRAST_PAIRS gains the cause cue
  // `--color-violation-border` on `--color-violation-stripe` (group `cause-cue`), so the list holds 35 pairs (4 cell border + 4 violation cue +
  // 1 cause cue + 3 hinted cue + 8 focus ring + 1 control border + 14 text). The notes above, which say 34, stay as history.
  it('the design token values meet every pair (3 for borders, cues and rings, 4.5 for text)', () => {
    expect(TOKEN_NAMES).toHaveLength(27);
    expect(Object.keys(DESIGN_TOKENS).sort()).toEqual([...TOKEN_NAMES].sort());
    expect(PALETTE_LIGHT, 'the helper holds the light values of the spec table, backdrops included').toEqual(DESIGN_TOKENS);
    expect(contrastProblems(DESIGN_TOKENS)).toEqual([]);
    expect(contrastRatio('#847b6d', '#e2dbcc')).toBeCloseTo(3.03, 2);
    expect(contrastRatio('#1e2126', '#847b6d')).toBeCloseTo(3.87, 2);
    expect(CONTRAST_PAIRS).toHaveLength(4 + 4 + 1 + 3 + 8 + 1 + 14);
    expect(CONTRAST_PAIRS, 'the list holds 35 pairs (add-violation-cause)').toHaveLength(35);
  });

  // update-page-palette (delta «Borders, cues and focus rings have enough contrast», scenario «Cell borders have 3:1»): the pair of the cell
  // border against the given fill is gone (a given cell is inactive, A-57), the given-cue group with it, and the hinted cue is a group.
  it('CONTRAST_PAIRS has the groups of the new list, no given-cue group and no (cell-border, given-bg) pair', () => {
    expect([...new Set(CONTRAST_PAIRS.map((pair) => pair.group))].sort()).toEqual(
      ['cause-cue', 'cell-border', 'control-border', 'focus-ring', 'hinted-cue', 'text', 'violation-cue'].sort(),
    );
    // add-violation-cause (FR-65, A-58; scenario «The cause cue has 3:1 against the violation fill and the stripe»): the cause cue is one pair, the
    // border colour on the stripe at 3:1 (the pair against the fill is the existing violation cue pair, not a second copy of it)
    expect(CONTRAST_PAIRS.filter((pair) => pair.group === 'cause-cue')).toEqual([
      { group: 'cause-cue', fg: '--color-violation-border', bg: '--color-violation-stripe', min: 3 },
    ]);
    expect(
      CONTRAST_PAIRS.filter((pair) => pair.fg === '--color-violation-border' && pair.bg === '--color-violation-bg').map((pair) => pair.group),
      'the pair against the fill stays the violation cue pair, once',
    ).toEqual(['violation-cue']);
    expect(CONTRAST_PAIRS.filter((pair) => pair.fg === '--color-cell-border' && pair.bg === '--color-given-bg')).toEqual([]);
    expect(CONTRAST_PAIRS.filter((pair) => pair.group === 'cell-border').map((pair) => pair.bg)).toEqual([
      '--color-page',
      '--color-cell-bg',
      '--color-line',
      '--color-success-bg',
    ]);
    expect(CONTRAST_PAIRS.filter((pair) => pair.group === 'hinted-cue').map((pair) => `${pair.fg} on ${pair.bg}`)).toEqual([
      '--color-primary on --color-primary-soft',
      '--color-primary on --color-line',
      '--color-primary on --color-page',
    ]);
    expect(CONTRAST_PAIRS.filter((pair) => pair.group === 'focus-ring').map((pair) => pair.bg)).toEqual([
      '--color-page',
      '--color-cell-bg',
      '--color-given-bg',
      '--color-violation-bg',
      '--color-line',
      '--color-primary-soft',
      '--color-success-bg',
      '--color-cell-border',
    ]);
  });

  // DELIBERATE CHANGE (update-page-backdrop, delta 1; proposal.md Impact row `tests/play-page-helpers.test.ts:480`): the set holds three names, the
  // glow and the two backdrops (the spec: "three tokens are translucent"); the loop below is the clause "a translucent token is never the foreground
  // or the background of a contrast pair".
  it('a translucent token is the foreground or the background of no pair, and contrastProblems reports one that a pair names as not #rrggbb', () => {
    expect([...TRANSLUCENT_TOKENS].sort()).toEqual(['--color-backdrop-soft', '--color-backdrop-strong', '--color-success-glow']);
    for (const pair of CONTRAST_PAIRS) {
      expect(TRANSLUCENT_TOKENS.has(pair.fg), `${pair.group}: ${pair.fg}`).toBe(false);
      expect(TRANSLUCENT_TOKENS.has(pair.bg), `${pair.group}: ${pair.bg}`).toBe(false);
    }
    // the contrast function rejects #rrggbbaa, so a translucent token that slipped into a pair would be reported, never computed
    expect(() => contrastRatio('#2f6b3a73', '#ffffff')).toThrow(/rrggbb/);
    expect(contrastProblems({ ...DESIGN_TOKENS, '--color-focus': '#1e212673' }).join('\n')).toMatch(/--color-focus is missing or not #rrggbb/);
  });

  it('contrastProblems names a weak pair, a missing token and a token that is not #rrggbb', () => {
    // DELIBERATE CHANGE (update-page-palette, proposal.md Impact row `:425-428`): the ratio of the slice-3 border `#9ca3af` depends on the
    // fixture's page, 2.29:1 on `#f7f3ea` (it was 2.43:1 on `#f9fafb`)
    const old = { ...DESIGN_TOKENS, '--color-cell-border': '#9ca3af' };
    expect(contrastProblems(old).join('\n')).toMatch(/cell-border.*2\.29/);
    expect(contrastProblems(old, ['text'])).toEqual([]); // restricted to the text pairs
    const withoutFocus = Object.fromEntries(Object.entries(DESIGN_TOKENS).filter(([name]) => name !== '--color-focus'));
    expect(contrastProblems(withoutFocus).join('\n')).toMatch(/--color-focus is missing/);
    expect(contrastProblems({ ...DESIGN_TOKENS, '--color-text': 'rgb(0, 0, 0)' }).join('\n')).toMatch(/--color-text is missing or not #rrggbb/);
    expect(contrastProblems({}).length).toBeGreaterThan(0);
  });
});

describe('css helper: parseStyles walks the CSSOM', () => {
  const SAMPLE = `
    :root { --color-page: #f9fafb; --color-text: #1f2937; }
    .board { --n: 6; --cell-max: 48px; display: flex; grid-template-columns: repeat(var(--n), minmax(0, var(--cell-max))); }
    .a { color: var(--color-text); .b { background-color: var(--color-page); } &:hover { color: var(--color-text); } }
    .n { .x { color: var(--color-text); } border-width: 3px; }
    @layer first, second;
    @layer base { .l { color: var(--color-text); } }
    @supports (display: grid) { .s { color: var(--color-text); } }
    @container (min-width: 10px) { .c { color: var(--color-text); } }
    @media (min-width: 600px) { .m { color: var(--color-text); } :root { --color-text: #000000; } }
    @keyframes k { from { color: red; } to { color: blue; } }
  `;

  it('finds the :root tokens, resolves only --color-* and does not choke on --n and --cell-max', () => {
    const parsed = parseStyles(SAMPLE);
    expect(parsed.tokens).toEqual({ '--color-page': '#f9fafb', '--color-text': '#1f2937' });
    expect(parsed.tokenDeclarations).toHaveLength(2);
    expect(declarationsFor(parsed, '.board').get('--n')).toBe('6'); // kept as written, never resolved
    expect(Object.keys(parsed.tokens).some((k) => !k.startsWith('--color-'))).toBe(false);
    expect(() => parseStyles('.board { --n: 6; width: calc(var(--n) * 2px); }')).not.toThrow();
  });

  it('walks nested rules with & resolved, nested declarations and every at-rule', () => {
    const parsed = parseStyles(SAMPLE);
    const selectors = parsed.rules.flatMap((r) => r.selectors);
    expect(selectors).toEqual(expect.arrayContaining(['.a', '.a .b', '.a:hover', '.n', '.n .x', '.l', '.s', '.c', '.m']));
    expect(rulesWithSelector(parsed, '.n').some((r) => r.declarations.some((d) => d.property === 'border-width'))).toBe(true);
    const contextOf = (selector: string): string => rulesWithSelector(parsed, selector)[0]?.context.join('|') ?? 'none';
    expect(contextOf('.m')).toContain('@media');
    expect(contextOf('.l')).toContain('@layer');
    expect(contextOf('.s')).toContain('@supports');
    expect(contextOf('.c')).toContain('@container');
    expect(contextOf('.a')).toBe('');
    expect(selectors.some((s) => s.startsWith('@keyframes k'))).toBe(true);
  });

  it('resolves a selector list against its parent: every parent times every child, & anywhere', () => {
    const parsed = parseStyles('.p, .q { .r, &:focus { color: var(--color-text); } & + & { color: var(--color-text); } }');
    const selectors = parsed.rules.flatMap((r) => r.selectors);
    expect(selectors).toEqual(expect.arrayContaining(['.p .r', '.q .r', '.p:focus', '.q:focus', '.p + .p', '.q + .q']));
  });

  it('builds one extra token set per conditional :root rule, applied over the top-level set', () => {
    const parsed = parseStyles(SAMPLE);
    expect(parsed.tokenSets).toHaveLength(2);
    expect(parsed.tokenSets[0]?.label).toBe('top-level');
    expect(parsed.tokenSets[0]?.tokens['--color-text']).toBe('#1f2937');
    expect(parsed.tokenSets[1]?.label).toContain('@media');
    expect(parsed.tokenSets[1]?.tokens).toEqual({ '--color-page': '#f9fafb', '--color-text': '#000000' });
    // the conditional :root does not change the top-level set
    expect(parsed.tokens['--color-text']).toBe('#1f2937');
    // no conditional block: only the top-level set exists
    expect(parseStyles(tokenCss(DESIGN_TOKENS)).tokenSets).toHaveLength(1);
  });

  it('a token redefined in @media that fails contrast is found in its own set only', () => {
    const css = `${tokenCss(DESIGN_TOKENS)} @media (prefers-contrast: more) { :root { --color-cell-border: #d1d5db; } }`;
    const sets = parseStyles(css).tokenSets;
    expect(sets).toHaveLength(2);
    expect(contrastProblems(sets[0]?.tokens ?? {})).toEqual([]);
    expect(contrastProblems(sets[1]?.tokens ?? {}).join('\n')).toMatch(/--color-cell-border #d1d5db/);
  });

  it('counts a token declared in two :root rules and ignores a token declared outside :root', () => {
    // inside ONE rule the CSSOM keeps only the last declaration of a property, so a duplicate is visible across rules only
    const parsed = parseStyles(':root { --color-page: #ffffff; } :root { --color-page: #000000; } .x { --color-text: #111111; }');
    expect(parsed.tokenDeclarations).toHaveLength(2);
    expect(parsed.tokens['--color-page']).toBe('#000000');
    expect(parsed.tokens['--color-text']).toBeUndefined();
    expect(scanColours(parsed).tokensOutsideRoot).toHaveLength(1);
  });

  it('throws on @import, @font-face and a rule type it cannot judge, naming the rule', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined); // jsdom reports the @import URL
    expect(() => parseStyles('@import url("other.css");')).toThrow(/CSSImportRule/);
    expect(() => parseStyles('@font-face { font-family: x; src: local(y); }')).toThrow(/CSSFontFaceRule/);
    expect(() => parseStyles('@namespace url(http://www.w3.org/1999/xhtml);')).toThrow(/CSSNamespaceRule/);
    expect(() => parseStyles('@page { margin: 0; }')).toThrow(/CSSPageRule/);
    quiet.mockRestore();
  });

  it('does not leave its <style> element in the document', () => {
    const before = document.head.querySelectorAll('style').length;
    parseStyles(SAMPLE);
    expect(document.head.querySelectorAll('style')).toHaveLength(before);
  });
});

// update-page-palette (delta «Borders, cues and focus rings have enough contrast», scenario «The token reader accepts a translucent value only
// for a translucent token»; proposal.md Impact row `tests/helpers/css.ts`): `#rrggbbaa` is read for the one token the list marks translucent and
// nowhere else. Literal samples only, so these are GUARDS of the helper (green once the helper is changed in task 1.3).
describe('css helper: the token reader and the translucent token (update-page-palette)', () => {
  it('reads --color-success-glow: #2f6b3a73 as a translucent token that no contrast pair uses', () => {
    const parsed = parseStyles(':root { --color-success-glow: #2f6b3a73; }');
    expect(parsed.tokens).toEqual({ '--color-success-glow': '#2f6b3a73' });
    expect(tokenFormatProblems(parsed.tokens)).toEqual([]);
    expect(TRANSLUCENT_TOKENS.has('--color-success-glow')).toBe(true);
    // in a full set it adds no problem and no pair mentions it
    expect(contrastProblems(parseStyles(tokenCss(DESIGN_TOKENS)).tokens)).toEqual([]);
    expect(CONTRAST_PAIRS.some((pair) => pair.fg === '--color-success-glow' || pair.bg === '--color-success-glow')).toBe(false);
  });

  // DELIBERATE CHANGE (update-page-backdrop, delta 1 «Borders, cues and focus rings have enough contrast», scenario «The token reader accepts a
  // translucent value only for a translucent token»; proposal.md Impact row `tests/play-page-helpers.test.ts:596-625`): the reader accepts the two
  // backdrop tokens as translucent too. The sample is the scenario's: the glow and the strong backdrop in one copy (two translucent tokens that no
  // pair uses), `--color-page: #f7f3ea80` in another (rejected), an rgb() value in either (rejected).
  it('reads --color-backdrop-soft and --color-backdrop-strong as translucent tokens that no contrast pair uses', () => {
    const parsed = parseStyles(':root { --color-success-glow: #2f6b3a73; --color-backdrop-strong: #2d190a80; --color-backdrop-soft: #46280f38; }');
    expect(parsed.tokens).toEqual({ '--color-success-glow': '#2f6b3a73', '--color-backdrop-strong': '#2d190a80', '--color-backdrop-soft': '#46280f38' });
    expect(tokenFormatProblems(parsed.tokens), 'the three translucent tokens are read without a problem').toEqual([]);
    for (const name of ['--color-backdrop-soft', '--color-backdrop-strong']) {
      expect(TRANSLUCENT_TOKENS.has(name), `${name} is translucent`).toBe(true);
      expect(CONTRAST_PAIRS.some((pair) => pair.fg === name || pair.bg === name), `${name} is in no contrast pair`).toBe(false);
    }
    expect(tokenFormatProblems({ '--color-page': '#f7f3ea80' }).join('\n')).toMatch(/--color-page.*#f7f3ea80/);
    expect(tokenFormatProblems({ '--color-backdrop-strong': 'rgba(45, 25, 10, 0.5)' }).join('\n')).toContain('--color-backdrop-strong');
    // a backdrop that slipped into a pair would be reported, never computed
    expect(() => contrastRatio('#2d190a80', '#f7f3ea')).toThrow(/rrggbb/);
  });

  it('rejects #rrggbbaa for a token the list does not mark translucent, and #rrggbb for the translucent one', () => {
    const alpha = parseStyles(':root { --color-page: #f7f3ea80; }');
    expect(tokenFormatProblems(alpha.tokens).join('\n')).toMatch(/--color-page.*#f7f3ea80/);
    const opaqueGlow = parseStyles(':root { --color-success-glow: #2f6b3a; }');
    expect(tokenFormatProblems(opaqueGlow.tokens).join('\n')).toMatch(/--color-success-glow.*#2f6b3a/);
    // update-page-backdrop (delta 1): the same for each backdrop, an opaque value is rejected
    for (const name of ['--color-backdrop-soft', '--color-backdrop-strong']) {
      expect(tokenFormatProblems(parseStyles(`:root { ${name}: #46280f; }`).tokens).join('\n'), `${name}: #46280f`).toMatch(
        new RegExp(`${name}.*#46280f`),
      );
    }
  });

  it('rejects an rgb(), rgba() or short hex value in either kind of token; accepts upper case', () => {
    for (const value of ['rgb(47, 107, 58)', 'rgba(47, 107, 58, 0.45)', '#2f6', 'red']) {
      for (const name of ['--color-page', '--color-success-glow', '--color-backdrop-soft', '--color-backdrop-strong']) {
        const parsed = parseStyles(`:root { ${name}: ${value}; }`);
        expect(tokenFormatProblems(parsed.tokens).join('\n'), `${name}: ${value}`).toContain(name);
      }
    }
    expect(
      tokenFormatProblems({ '--color-page': '#F7F3EA', '--color-success-glow': '#2F6B3A73', '--color-backdrop-soft': '#46280F38', '--color-backdrop-strong': '#2D190A80' }),
    ).toEqual([]);
  });

  it('judges only --color-* names, so the layout variables are never read as colours', () => {
    expect(tokenFormatProblems({ '--n': '6', '--cell-max': '4rem' })).toEqual([]);
  });

  it('rgbOf and contrastRatio still refuse #rrggbbaa, so a translucent value can never be computed by mistake', () => {
    expect(() => rgbOf('#2f6b3a73')).toThrow(/rrggbb/);
    expect(() => contrastRatio('#2f6b3a73', '#f7f3ea')).toThrow(/rrggbb/);
  });
});

// update-page-backdrop (delta 2 «Effective theme on the document», scenario «In dark every backdrop dims the page», and the ADDED requirement «The
// backdrops take the design's translucent tokens», scenario «The strong backdrop dims more than the soft one»; proposal.md Impact row
// `tests/play-page-helpers.test.ts` "new"): a backdrop is checked composited over the page, per channel in sRGB, `round(alpha × token + (1 − alpha) ×
// page)`, with `alpha` the token's last byte divided by 255; the new helpers are `compositeOver` (a `#rrggbbaa` over a `#rrggbb`, as an rgb triple),
// `relativeLuminance` (of an rgb triple) and `rgbTripleOf` (a `#rrggbb` as a triple). Literal samples only: the four composites are the spec's.
describe('css helper: the composite of a backdrop over the page and the luminance of an rgb triple (update-page-backdrop)', () => {
  const LIGHT_PAGE = '#f7f3ea';
  const DARK_PAGE = '#1a1714';
  const FOUR = [
    { name: 'light soft', token: '#46280f38', page: LIGHT_PAGE, rgb: [208, 198, 186], luminance: 0.5734 },
    { name: 'light strong', token: '#2d190a80', page: LIGHT_PAGE, rgb: [146, 134, 122], luminance: 0.2457 },
    { name: 'dark soft', token: '#08050273', page: DARK_PAGE, rgb: [18, 15, 12], luminance: 0.005 },
    { name: 'dark strong', token: '#08050299', page: DARK_PAGE, rgb: [15, 12, 9], luminance: 0.0038 },
  ] as const;

  it('composites the four backdrops of the spec over their page, per channel in sRGB', () => {
    for (const { name, token, page, rgb } of FOUR) {
      expect(compositeOver(token, page), `${name}: ${token} over ${page}`).toEqual(rgb);
    }
  });

  it('rounds to the nearest integer (light strong red is 145.6, so 146 and not 145), and alpha ff gives the token, alpha 00 the page', () => {
    // 128/255 × 45 + 127/255 × 247 = 37129/255 = 145.6: a floor would give 145
    expect(compositeOver('#2d190a80', LIGHT_PAGE)[0]).toBe(146);
    expect(compositeOver('#2d190aff', LIGHT_PAGE)).toEqual([45, 25, 10]);
    expect(compositeOver('#2d190a00', LIGHT_PAGE)).toEqual([247, 243, 234]);
    expect(compositeOver('#FFFFFF80', '#000000'), 'upper case is read; 128/255 × 255 = 128.0').toEqual([128, 128, 128]);
  });

  it('throws on anything that is not a #rrggbbaa over an opaque #rrggbb, so a mistaken call is loud', () => {
    expect(() => compositeOver('#46280f', LIGHT_PAGE), 'a token without alpha').toThrow(/rrggbbaa/);
    expect(() => compositeOver('#46280f38', '#f7f3ea80'), 'a translucent page').toThrow(/rrggbb/);
    expect(() => compositeOver('rgba(70, 40, 15, 0.22)', LIGHT_PAGE), 'an rgba() token').toThrow(/rrggbbaa/);
    expect(() => compositeOver('#4628', LIGHT_PAGE), 'a short hex').toThrow(/rrggbbaa/);
    expect(() => compositeOver('red', LIGHT_PAGE), 'a keyword').toThrow(/rrggbbaa/);
    expect(() => compositeOver('#46280f38', 'rgb(247, 243, 234)'), 'an rgb() page').toThrow(/rrggbb/);
  });

  it('rgbTripleOf reads a #rrggbb and refuses #rrggbbaa, like rgbOf', () => {
    expect(rgbTripleOf(LIGHT_PAGE)).toEqual([247, 243, 234]);
    expect(rgbTripleOf('#1A1714')).toEqual([26, 23, 20]);
    expect(() => rgbTripleOf('#f7f3ea80')).toThrow(/rrggbb/);
    expect(() => rgbTripleOf('red')).toThrow(/rrggbb/);
  });

  it('relativeLuminance of an rgb triple: white 1, black 0, the two pages and the four composites of the spec', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance(rgbTripleOf(LIGHT_PAGE))).toBeCloseTo(0.8982, 4);
    expect(relativeLuminance(rgbTripleOf(DARK_PAGE))).toBeCloseTo(0.0088, 4);
    for (const { name, token, page, luminance } of FOUR) {
      expect(relativeLuminance(compositeOver(token, page)), name).toBeCloseTo(luminance, 4);
    }
  });

  it('agrees with contrastRatio: (L1 + 0.05) / (L2 + 0.05) of the luminances is the ratio of the same two colours', () => {
    const ratio = (a: string, b: string): number => {
      const [la, lb] = [relativeLuminance(rgbTripleOf(a)), relativeLuminance(rgbTripleOf(b))];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    expect(ratio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(ratio('#847b6d', '#e2dbcc')).toBeCloseTo(contrastRatio('#847b6d', '#e2dbcc'), 10);
    expect(ratio(LIGHT_PAGE, DARK_PAGE)).toBeCloseTo(contrastRatio(LIGHT_PAGE, DARK_PAGE), 10);
  });

  it('in each set the strong composite is darker than the soft one and both are darker than the page (dark: 1.07 and 1.09 against the page)', () => {
    for (const [scheme, page, soft, strong] of [
      ['light', LIGHT_PAGE, '#46280f38', '#2d190a80'],
      ['dark', DARK_PAGE, '#08050273', '#08050299'],
    ] as const) {
      const [lPage, lSoft, lStrong] = [
        relativeLuminance(rgbTripleOf(page)),
        relativeLuminance(compositeOver(soft, page)),
        relativeLuminance(compositeOver(strong, page)),
      ];
      expect(lStrong, `${scheme}: strong is darker than soft`).toBeLessThan(lSoft);
      expect(lSoft, `${scheme}: soft is darker than the page`).toBeLessThan(lPage);
    }
    const dark = (token: string): number => (relativeLuminance(rgbTripleOf(DARK_PAGE)) + 0.05) / (relativeLuminance(compositeOver(token, DARK_PAGE)) + 0.05);
    expect(dark('#08050273')).toBeCloseTo(1.07, 2);
    expect(dark('#08050299')).toBeCloseTo(1.09, 2);
  });
});

describe('css helper: scanColours (the colour scan) and the lookups', () => {
  it('flags a hex literal (jsdom turns it into rgb(), the scan still fires), a named colour and shorthands without a token', () => {
    const parsed = parseStyles(
      '.x { color: #fff; background: red; border: 1px solid #6b7280; outline: 2px solid blue; box-shadow: 0 0 2px black; }',
    );
    const scan = scanColours(parsed);
    expect(scan.literals.some((m) => m.includes('{ color: '))).toBe(true);
    expect(scan.literals.some((m) => /\{ border(-color)?: /.test(m))).toBe(true);
    expect(scan.named.some((m) => /\{ background(-color)?: red/.test(m))).toBe(true);
    expect(scan.named.some((m) => m.includes('outline: 2px solid blue'))).toBe(true);
    expect(scan.named.some((m) => m.includes('box-shadow: 0 0 2px black'))).toBe(true);
    for (const property of ['border', 'outline', 'box-shadow']) {
      expect(scan.shorthands.some((m) => m.includes(`{ ${property}: `)), `${property} shorthand flagged`).toBe(true);
    }
    expect(scan.colourProperties.some((m) => m.includes('{ color: '))).toBe(true);
  });

  it('flags a bare hex literal on its own', () => {
    const scan = scanColours(parseStyles('.h { color: #abc; }'));
    expect(scan.literals).toHaveLength(1);
    expect(scan.literals[0]).toContain('.h');
  });

  it('accepts token colours, none, 0, the allowed keywords, and the real font and layout declarations', () => {
    const parsed = parseStyles(`
      ${tokenCss(DESIGN_TOKENS)}
      body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: var(--color-text); background: var(--color-page); }
      .ok { border: 1px solid var(--color-page); border-top: 0; outline: none; box-shadow: none; text-decoration: none;
            background-color: transparent; border-color: var(--color-cell-border); cursor: default; touch-action: manipulation;
            position: relative; display: flex; align-items: center; justify-content: center; user-select: none; text-align: center; }
      .kw { color: inherit; background-color: currentcolor; outline-color: var(--color-focus); }
    `);
    const scan = scanColours(parsed);
    expect(scan).toEqual({ literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] });
  });

  it('does not scan :root, but scans inside @media, @supports, @layer, nested rules and keyframes', () => {
    expect(scanColours(parseStyles(':root { --color-a: #fff; } @media (min-width: 1px) { :root { --color-a: red; } }')).literals).toEqual([]);
    const nested = parseStyles(`
      @media (min-width: 1px) { .m { color: #fff; } }
      @supports (display: grid) { .s { color: #fff; } }
      @layer base { .l { color: #fff; } }
      .p { .q { color: red; } }
      @keyframes k { from { color: red; } to { opacity: 1; } }
    `);
    const scan = scanColours(nested);
    expect(scan.literals.filter((m) => m.includes('@media'))).toHaveLength(1);
    expect(scan.literals.filter((m) => m.includes('@supports'))).toHaveLength(1);
    expect(scan.literals.filter((m) => m.includes('@layer'))).toHaveLength(1);
    expect(scan.named.some((m) => m.includes('.p .q'))).toBe(true);
    expect(scan.named.some((m) => m.includes('@keyframes k'))).toBe(true);
  });

  it('a colour property must be one declared token or an allowed keyword', () => {
    const scan = scanColours(
      parseStyles(`${tokenCss(DESIGN_TOKENS)} .a { color: var(--color-undeclared); } .b { border-color: var(--color-page) var(--color-text); } .c { color: var(--color-text); }`),
    );
    expect(scan.colourProperties).toHaveLength(2);
  });

  it('namedColoursIn sees whole identifiers only and ignores var() names, strings and font names', () => {
    expect(namedColoursIn('1px solid red')).toEqual(['red']);
    expect(namedColoursIn('Tan')).toEqual(['tan']);
    expect(namedColoursIn('var(--color-red)')).toEqual([]);
    expect(namedColoursIn("'red', serif")).toEqual([]);
    expect(namedColoursIn('system-ui, -apple-system, Roboto, sans-serif')).toEqual([]);
    expect(namedColoursIn('translate(0, 0) tangent redundant')).toEqual([]);
  });

  it('withTokensInlined replaces var(--color-x) by the :root value and leaves other var() alone', () => {
    const out = withTokensInlined(':root { --color-a: #112233; } .x { color: var(--color-a); border-color: var( --color-a ); width: var(--w); background-color: var(--color-missing); }');
    expect(out).toContain('color: #112233;');
    expect(out).toContain('border-color: #112233;');
    expect(out).toContain('var(--w)');
    expect(out).toContain('var(--color-missing)');
  });

  it('declarationsFor merges the rules of a selector, a later declaration winning; px reads lengths', () => {
    const parsed = parseStyles('.a { gap: 2px; z-index: 1; } .b { gap: 9px; } .a { gap: 4px; }');
    expect([...declarationsFor(parsed, '.a')]).toEqual([['gap', '4px'], ['z-index', '1']]);
    expect(declarationsFor(parsed, '.zzz').size).toBe(0);
    expect(px('3px')).toBe(3);
    expect(px('0')).toBe(0);
    expect(px('0px')).toBe(0);
    expect(px('2')).toBeNaN();
    expect(px('1em')).toBeNaN();
    expect(px(undefined)).toBeNaN();
  });
});

// add-violation-cause (FR-65; delta «Borders, cues and focus rings have enough contrast», scenario «A system colour keyword appears in exactly one
// declaration»; tasks.md 3.1): the new scan of the CSS Color 4 system colours, next to `scanColours`. It runs on literal samples, never on
// src/ui/style.css. The existing scans are not changed: the last test pins that they still pass the forced-colours rule as written.
describe('css helper: scanSystemColours (the system-colour scan of add-violation-cause)', () => {
  it('SYSTEM_COLOURS holds the 19 current and the 23 deprecated CSS Color 4 system colours, in lower case, and no named colour', () => {
    const current = [
      'AccentColor', 'AccentColorText', 'ActiveText', 'ButtonBorder', 'ButtonFace', 'ButtonText', 'Canvas', 'CanvasText', 'Field', 'FieldText',
      'GrayText', 'Highlight', 'HighlightText', 'LinkText', 'Mark', 'MarkText', 'SelectedItem', 'SelectedItemText', 'VisitedText',
    ];
    const deprecated = [
      'ActiveBorder', 'ActiveCaption', 'AppWorkspace', 'Background', 'ButtonHighlight', 'ButtonShadow', 'CaptionText', 'InactiveBorder',
      'InactiveCaption', 'InactiveCaptionText', 'InfoBackground', 'InfoText', 'Menu', 'MenuText', 'Scrollbar', 'ThreeDDarkShadow', 'ThreeDFace',
      'ThreeDHighlight', 'ThreeDLightShadow', 'ThreeDShadow', 'Window', 'WindowFrame', 'WindowText',
    ];
    expect(current).toHaveLength(19);
    expect(deprecated).toHaveLength(23);
    expect([...SYSTEM_COLOURS].sort()).toEqual([...current, ...deprecated].map((name) => name.toLowerCase()).sort());
    expect([...SYSTEM_COLOURS].filter((name) => NAMED_COLOURS.has(name)), 'no system colour is a named colour').toEqual([]);
  });

  it('finds a keyword in a rule, case-insensitively, and reports `selector { property: value }`', () => {
    const hits = scanSystemColours(parseStyles('.a { border-top-color: ButtonText; } .b { color: CANVASTEXT; } .c { outline-color: threedface; }'));
    expect(hits).toHaveLength(3);
    expect(hits[0]).toMatch(/^\.a \{ border-top-color: buttontext \}$/i);
    expect(hits.some((m) => /\.b \{ color: canvastext \}/i.test(m)), 'an upper-case current keyword').toBe(true);
    expect(hits.some((m) => /\.c \{ outline-color: threedface \}/i.test(m)), 'a deprecated keyword').toBe(true);
  });

  it('scans inside at-rules and names the context (the forced-colours rule of the cause mark)', () => {
    const hits = scanSystemColours(
      parseStyles('@media (forced-colors: active) { .cell-cause::after { forced-color-adjust: none; border-top-color: ButtonText; border-left-color: transparent; } }'),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatch(/^@media \(forced-colors: active\) \.cell-cause::after \{ border-top-color: buttontext \}$/i);
  });

  it('does not scan a keyword in :root or :root[data-theme="dark"]', () => {
    expect(scanSystemColours(parseStyles(':root { color: CanvasText; background-color: Canvas; } :root[data-theme="dark"] { color: ButtonText; }'))).toEqual([]);
  });

  it('transparent, currentcolor, the named colours, token names, strings and longer identifiers are not hits', () => {
    const parsed = parseStyles(`
      .a { border-left-color: transparent; color: currentcolor; background-color: red; }
      .b { color: var(--color-canvas); border-color: var(--color-menu); }
      .c { content: 'ButtonText'; font-family: 'Canvas', serif; }
      .d { transition-property: background-color; grid-template-areas: none; list-style: none; }
    `);
    expect(scanSystemColours(parsed)).toEqual([]);
  });

  it('the existing scans pass the forced-colours rule as written: the new scan is the one that pins it (the old scans are not loosened)', () => {
    const parsed = parseStyles(
      '@media (forced-colors: active) { .cell-cause::after { forced-color-adjust: none; border-top-color: ButtonText; border-left-color: transparent; } }',
    );
    expect(scanColours(parsed)).toEqual({ literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] });
    expect(scanSystemColours(parsed)).toHaveLength(1);
    // and the old scans still flag a system colour where they read it: a colour property that is not a token
    expect(scanColours(parseStyles('.x { color: ButtonText; }')).colourProperties).toHaveLength(1);
  });
});

describe('page helpers for keys, focus, rows and names', () => {
  /** Two button cells and a div cell that cannot take focus (no tabindex). */
  function sampleBoard(): HTMLElement {
    const root = document.createElement('div');
    root.innerHTML =
      '<button type="button" data-cell data-row="1" data-col="1"></button>' +
      '<button type="button" data-cell data-row="1" data-col="2"></button>' +
      '<div data-cell data-row="3" data-col="1"></div>';
    document.body.appendChild(root);
    return root;
  }

  it('pressKey returns a bubbling, cancelable keydown; defaultPrevented follows the listener (the check is not vacuous)', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('span');
    outer.appendChild(inner);
    const seen: KeyboardEvent[] = [];
    outer.addEventListener('keydown', (e) => {
      seen.push(e);
      if (e.key === 'ArrowDown') e.preventDefault();
    });
    const prevented = pressKey(inner, 'ArrowDown');
    expect(prevented.cancelable).toBe(true);
    expect(prevented.bubbles).toBe(true);
    expect(prevented.type).toBe('keydown');
    expect(prevented.defaultPrevented).toBe(true);
    expect(seen).toHaveLength(1); // it bubbled to the outer listener
    expect(pressKey(inner, 'Tab').defaultPrevented).toBe(false);
    // a non-cancelable event can never show preventDefault(): why the page tests insist on cancelable
    expect(pressKey(inner, 'ArrowDown', { cancelable: false }).defaultPrevented).toBe(false);
  });

  it('pressKey carries key, modifiers and repeat, and a single space is key " "', () => {
    const node = document.createElement('div');
    const got = pressKey(node, ' ', { ctrlKey: true, shiftKey: true, repeat: true });
    expect(got.key).toBe(' ');
    expect(got.ctrlKey).toBe(true);
    expect(got.shiftKey).toBe(true);
    expect(got.altKey).toBe(false);
    expect(got.repeat).toBe(true);
  });

  it('pressKey fails when a listener throws (dispatchEvent alone would swallow it)', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const node = document.createElement('div');
    node.addEventListener('keydown', () => {
      throw new Error('handler blew up');
    });
    try {
      expect(() => pressKey(node, 'a')).toThrow(/no uncaught error/);
    } finally {
      quiet.mockRestore();
    }
  });

  it('pressKeyEvent dispatches a bubbling, cancelable keyup (or keydown) that carries key, modifiers and repeat; defaultPrevented follows the listener; a throwing listener fails it', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('span');
    outer.appendChild(inner);
    const seen: KeyboardEvent[] = [];
    outer.addEventListener('keyup', (e) => {
      seen.push(e);
      if (e.key === 'Enter') e.preventDefault();
    });
    const prevented = pressKeyEvent(inner, 'keyup', 'Enter', { ctrlKey: true, altKey: true, shiftKey: true, repeat: true });
    expect(prevented.type).toBe('keyup');
    expect(prevented.bubbles).toBe(true);
    expect(prevented.cancelable).toBe(true);
    expect(prevented.key).toBe('Enter');
    expect([prevented.ctrlKey, prevented.altKey, prevented.shiftKey, prevented.repeat]).toEqual([true, true, true, true]);
    expect(prevented.defaultPrevented).toBe(true);
    expect(seen).toHaveLength(1); // it bubbled to the outer listener
    const plain = pressKeyEvent(inner, 'keyup', ' ');
    expect(plain.key).toBe(' ');
    expect([plain.ctrlKey, plain.altKey, plain.shiftKey, plain.repeat]).toEqual([false, false, false, false]);
    expect(plain.defaultPrevented).toBe(false);
    // a keydown through the same helper is the keydown of pressKey
    expect(pressKeyEvent(inner, 'keydown', 'a').type).toBe('keydown');
    // a non-cancelable event can never show preventDefault(): why the page tests insist on cancelable
    expect(pressKeyEvent(inner, 'keyup', 'Enter', { cancelable: false }).defaultPrevented).toBe(false);

    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const node = document.createElement('div');
    node.addEventListener('keyup', () => {
      throw new Error('handler blew up');
    });
    try {
      expect(() => pressKeyEvent(node, 'keyup', 'a')).toThrow(/no uncaught error/);
    } finally {
      quiet.mockRestore();
    }
  });

  it('focusCell takes focus on a button cell and fails on a cell that cannot take focus', () => {
    const root = sampleBoard();
    expect(focusCell(root, 1, 2)).toBe(document.activeElement);
    expect(focusCell(root, 1, 1)).toBe(document.activeElement);
    expect(() => focusCell(root, 3, 1)).toThrow(/takes DOM focus/); // a div with no tabindex: jsdom cannot focus it
    root.remove();
  });

  it('expectedCellLabel spells the FR-70 label: «порожньо» for an empty cell, «, задано» on a given, «, підказка» on a hinted cell, «, спричиняє порушення» after it on the cause cell, no suffix otherwise', () => {
    const cell = (row: number, col: number, text: string, given: boolean, className = ''): HTMLElement => {
      const el = document.createElement('button');
      el.setAttribute('data-row', String(row));
      el.setAttribute('data-col', String(col));
      el.setAttribute('data-given', given ? 'true' : 'false');
      if (className !== '') el.className = className;
      el.textContent = text;
      return el;
    };
    expect(expectedCellLabel(cell(2, 3, '', false))).toBe('Рядок 2, стовпець 3, порожньо');
    expect(expectedCellLabel(cell(3, 1, '0', true, 'cell-given'))).toBe('Рядок 3, стовпець 1, 0, задано');
    expect(expectedCellLabel(cell(6, 6, '1', false))).toBe('Рядок 6, стовпець 6, 1');
    expect(expectedCellLabel(cell(5, 6, '0', false, 'cell-hinted'))).toBe('Рядок 5, стовпець 6, 0, підказка');
    expect(expectedCellLabel(cell(4, 2, '1', false, 'cell-violation')), 'a violation adds no suffix').toBe('Рядок 4, стовпець 2, 1');
    expect(expectedCellLabel(cell(1, 4, '1', true, 'cell-given cell-violation')), 'a given in a violation').toBe('Рядок 1, стовпець 4, 1, задано');
    // DELIBERATE CHANGE (add-violation-cause, delta «Cell labels» (FR-70, FR-120); proposal.md Impact row `tests/play-page-helpers.test.ts`
    // 951-966): the oracle reads the class `cell-cause` and appends «, спричиняє порушення» after «, підказка»; a given never gets it. The two
    // lines above stay true: a violating cell WITHOUT the class has no suffix.
    expect(expectedCellLabel(cell(2, 3, '0', false, 'cell-violation cell-cause')), 'the cause cell').toBe('Рядок 2, стовпець 3, 0, спричиняє порушення');
    for (const classes of ['cell-hinted cell-violation cell-cause', 'cell-cause cell-violation cell-hinted']) {
      const label = expectedCellLabel(cell(1, 3, '0', false, classes));
      expect(label, `a hinted cause (${classes}): the hint suffix first`).toBe('Рядок 1, стовпець 3, 0, підказка, спричиняє порушення');
      expect(label, 'never the cause suffix first').not.toBe('Рядок 1, стовпець 3, 0, спричиняє порушення, підказка');
    }
    expect(
      expectedCellLabel(cell(3, 1, '0', true, 'cell-given cell-violation cell-hinted cell-cause')),
      'a given with both flags keeps exactly «, задано»',
    ).toBe('Рядок 3, стовпець 1, 0, задано');
  });

  // add-violation-cause (FR-70, FR-111; tasks.md 3.1): the English oracle `enCellLabel` takes a `cause` flag after the suffix, so it can say
  // "hinted, causes a violation"; a given wins over both flags.
  it('enCellLabel spells the English label with the cause suffix after ", hinted"; a given keeps ", given"', () => {
    expect(enCellLabel(2, 3, '')).toBe('Row 2, column 3, empty');
    expect(enCellLabel(3, 1, '0', 'given')).toBe('Row 3, column 1, 0, given');
    expect(enCellLabel(5, 6, '0', 'hinted')).toBe('Row 5, column 6, 0, hinted');
    expect(enCellLabel(2, 3, '0', '', true)).toBe('Row 2, column 3, 0, causes a violation');
    expect(enCellLabel(1, 3, '0', 'hinted', true)).toBe('Row 1, column 3, 0, hinted, causes a violation');
    expect(enCellLabel(3, 1, '0', 'given', true), 'a given wins over the cause flag').toBe('Row 3, column 1, 0, given');
    expect(enCellLabel(2, 3, '0', '', false)).toBe('Row 2, column 3, 0');
  });
});

describe('slice 6 fixtures: all four cell kinds at every size after one click on (3,3)', () => {
  const cases: [string, typeof PAIR_ROW_PLUS][] = [
    ['4x4', PAIR_PLUS_4],
    ['6x6', PAIR_ROW_PLUS],
    ['8x8', PAIR_PLUS_8],
  ];
  for (const [name, puzzle] of cases) {
    it(`${name}: (3,1) and (3,2) are givens in a violation with (3,3), a far given is plain, (1,1) is ordinary`, () => {
      const n = puzzle.size;
      const board = puzzle.givens.map((row) => [...row]);
      expect(board[2]?.[2]).toBeNull(); // (3,3) is a player cell
      const line = board[2];
      if (line === undefined) throw new Error('row 3');
      line[2] = 0;
      const marked = checkerCells(board).map(([r, c]) => `${r},${c}`);
      expect(marked).toEqual(expect.arrayContaining(['3,1', '3,2', '3,3']));
      expect(marked).not.toContain('1,1');
      expect(marked).not.toContain(`${n},${n}`);
      expect(puzzle.givens[n - 1]?.[n - 1]).not.toBeNull(); // the plain given
      expect(puzzle.givens[0]?.[0]).toBeNull(); // the ordinary cell
    });
  }
});

describe('the dialog stubs of installPageLifecycle (jsdom has no showModal or close)', () => {
  installPageLifecycle();
  afterAll(() => {
    // the afterEach of installPageLifecycle has removed them: no production code or later file sees a stub
    expect('showModal' in HTMLDialogElement.prototype).toBe(false);
    expect('close' in HTMLDialogElement.prototype).toBe(false);
  });

  it('showModal sets open and is counted, a second showModal throws, close removes open and is counted, in a log', () => {
    const dialog = document.createElement('dialog');
    expect(showModalCalls()).toBe(0);
    expect(closeCalls()).toBe(0);
    dialog.showModal();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(() => { dialog.showModal(); }).toThrow();
    expect(showModalCalls()).toBe(1);
    const seen: boolean[] = [];
    onDialogClose(() => seen.push(dialog.hasAttribute('open')));
    dialog.close();
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(seen, 'the hook runs inside close(), while the dialog is still open').toEqual([true]);
    expect(closeCalls()).toBe(1);
    expect(dialogLog).toEqual(['showModal', 'close']);
  });

  it('the counters, the log and the hook start fresh in every test', () => {
    expect(showModalCalls()).toBe(0);
    expect(closeCalls()).toBe(0);
    expect(dialogLog).toEqual([]);
    const dialog = document.createElement('dialog');
    dialog.showModal();
    dialog.close(); // the hook of the previous test is gone: nothing throws and nothing is recorded outside the log
    expect(dialogLog).toEqual(['showModal', 'close']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Slice DL2 (add-level-selector, A-44): self-checks of the popover stubs, the toggle event and the level argument of the
// generator spies. They run on literal samples, never on the page, so they pass at the red stage (no @trace on purpose).
// ---------------------------------------------------------------------------------------------------------

describe('the popover stubs of installPageLifecycle (jsdom has no showPopover, hidePopover or togglePopover)', () => {
  installPageLifecycle();
  afterAll(() => {
    // the afterEach of installPageLifecycle has removed them: no production code or later file sees a stub
    for (const name of ['showPopover', 'hidePopover', 'togglePopover']) expect(name in HTMLElement.prototype, name).toBe(false);
  });

  it('showPopover and hidePopover keep an open state per element and record each call, in call order with the dialog stubs', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const dialog = document.createElement('dialog');
    expect(popoverIsOpen(a)).toBe(false);
    a.showPopover();
    expect(popoverIsOpen(a)).toBe(true);
    expect(popoverIsOpen(b), 'the state is per element').toBe(false);
    dialog.showModal();
    a.hidePopover();
    expect(popoverIsOpen(a)).toBe(false);
    expect(popoverCalls('showPopover', a)).toBe(1);
    expect(popoverCalls('hidePopover', a)).toBe(1);
    expect(popoverCalls('hidePopover', b)).toBe(0);
    expect(popoverCalls('hidePopover')).toBe(1);
    expect(popoverLog.map((call) => call.method)).toEqual(['showPopover', 'hidePopover']);
    expect(callOrder).toEqual(['showPopover', 'showModal', 'hidePopover']);
  });

  it('togglePopover flips the state and returns it; hidePopover dispatches no event', () => {
    const el = document.createElement('div');
    const events: string[] = [];
    el.addEventListener('toggle', (event) => events.push(event.type));
    expect(el.togglePopover()).toBe(true);
    expect(popoverIsOpen(el)).toBe(true);
    expect(el.togglePopover()).toBe(false);
    el.showPopover();
    el.hidePopover();
    expect(events, 'the stubs dispatch nothing').toEqual([]);
  });

  it('dispatchToggle sends a non-bubbling toggle event with newState and oldState', () => {
    const el = document.createElement('div');
    document.body.append(el);
    try {
      const seen: { newState: unknown; oldState: unknown; bubbles: boolean }[] = [];
      el.addEventListener('toggle', (event) => {
        seen.push({ newState: Reflect.get(event, 'newState'), oldState: Reflect.get(event, 'oldState'), bubbles: event.bubbles });
      });
      let reachedBody = false;
      document.body.addEventListener('toggle', () => { reachedBody = true; }, { once: true });
      dispatchToggle(el, 'closed');
      dispatchToggle(el, 'open');
      expect(seen).toEqual([
        { newState: 'closed', oldState: 'open', bubbles: false },
        { newState: 'open', oldState: 'closed', bubbles: false },
      ]);
      expect(reachedBody).toBe(false);
    } finally {
      el.remove();
    }
  });

  it('the log and the open states start fresh in every test', () => {
    expect(popoverLog).toEqual([]);
    expect(callOrder).toEqual([]);
  });

  // update-setup-sheet-start (decision 3 of the orchestrator, A-44, A-46): a closing toggle clears the stub's open state, an
  // opening toggle sets it, so a mark helper that opens "only while closed" reads the state a browser would have.
  it('dispatchToggle(el, "closed") clears the stub open state and dispatchToggle(el, "open") sets it', () => {
    const el = document.createElement('div');
    el.showPopover();
    expect(popoverIsOpen(el)).toBe(true);
    dispatchToggle(el, 'closed');
    expect(popoverIsOpen(el), 'a closing toggle clears the state').toBe(false);
    dispatchToggle(el, 'open');
    expect(popoverIsOpen(el), 'an opening toggle sets the state').toBe(true);
    expect(popoverLog.map((call) => call.method), 'the toggle dispatch is not a popover method call').toEqual(['showPopover']);
  });
});

// ---------------------------------------------------------------------------------------------------------
// update-setup-sheet-start (tasks 2.1): self-checks of markSize, markLevel, pressStart, openSheetIfClosed and the new `asks` rule of
// the choose helpers. They run on a hand-made fake of the page (no page code), so they pass at the red stage like the rest of
// this file (no @trace on purpose). The fake models only what the helpers read: a sheet with the size control, the level
// control, «Почати» and «Закрити»; a dialog; cells; a marking press moves `aria-checked` and nothing else; «Почати» counts a
// start and asks (opens the dialog) when the fake board has an entry.
// ---------------------------------------------------------------------------------------------------------

interface FakePage {
  root: HTMLElement;
  starts: { size: string | null; level: string | null }[];
}

function fakePage(withEntry: boolean): FakePage {
  const root = document.createElement('div');
  const starts: FakePage['starts'] = [];
  const el = (tag: string, attributes: Record<string, string> = {}, text = ''): HTMLElement => {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    node.textContent = text;
    return node;
  };
  const radioGroup = (attributes: Record<string, string>, buttons: HTMLElement[]): HTMLElement => {
    const group = el('div', { role: 'radiogroup', ...attributes });
    group.append(...buttons);
    // a marking press only moves aria-checked inside its group
    for (const button of buttons) {
      button.addEventListener('click', () => {
        for (const other of buttons) other.setAttribute('aria-checked', String(other === button));
      });
    }
    return group;
  };
  const sizeButtons = [4, 6, 8].map((n) => el('button', { type: 'button', role: 'radio', 'aria-checked': String(n === 6) }, `Поле ${n}×${n}`));
  const levelNames = ['Розминка', 'Задачка', 'Головоломка', 'Мозколамка'];
  const levelButtons = levelNames.map((name, i) => {
    const button = el('button', { type: 'button', role: 'radio', 'aria-checked': String(i === 0) });
    button.append(el('span', {}, name));
    return button;
  });
  const sheet = el('div', { 'data-section': 'setup', popover: '' });
  const start = el('button', { type: 'button', 'data-action': 'setup-start' }, START_LABEL);
  const close = el('button', { type: 'button', 'data-action': 'setup-close' }, 'Закрити');
  sheet.append(radioGroup({ 'data-control': 'size' }, sizeButtons), radioGroup({ 'data-control': 'level' }, levelButtons), start, close);
  const dialog = el('dialog', { 'data-dialog': 'confirm' }) as HTMLDialogElement;
  const yes = el('button', { type: 'button', 'data-confirm': 'yes' }, 'Так, почати');
  const no = el('button', { type: 'button', 'data-confirm': 'no' }, 'Скасувати');
  dialog.append(yes, no);
  no.addEventListener('click', () => { dialog.close(); });
  yes.addEventListener('click', () => {
    dialog.close();
    starts.push({ size: sizeButtons.find((b) => b.getAttribute('aria-checked') === 'true')?.textContent ?? null, level: null });
  });
  start.addEventListener('click', () => {
    sheet.hidePopover();
    if (withEntry) dialog.showModal();
    else starts.push({ size: sizeButtons.find((b) => b.getAttribute('aria-checked') === 'true')?.textContent ?? null, level: null });
  });
  const cell = el('button', { 'data-cell': '', 'data-given': 'false' }, withEntry ? '1' : '');
  const summary = el('button', { 'data-action': 'setup', type: 'button' });
  root.append(summary, cell, sheet, dialog);
  document.body.append(root);
  return { root, starts };
}

describe('the mark and start helpers of the setup sheet (update-setup-sheet-start)', () => {
  installPageLifecycle();
  const created: HTMLElement[] = [];
  afterAll(() => { for (const node of created) node.remove(); });
  const page = (withEntry: boolean): FakePage => {
    const fake = fakePage(withEntry);
    created.push(fake.root);
    return fake;
  };

  it('markSize and markLevel open the sheet only while the stub is closed, move aria-checked and never press «Почати»', () => {
    const { root, starts } = page(false);
    const sheet = openSheetIfClosed(root);
    expect(popoverCalls('showPopover', sheet), 'a closed sheet is opened once').toBe(1);
    markSize(root, 8);
    markLevel(root, 4);
    expect(popoverCalls('showPopover', sheet), 'an open sheet is not opened again').toBe(1);
    expect(popoverCalls('hidePopover', sheet), 'a marking press closes nothing').toBe(0);
    expect(starts, 'a marking press starts no puzzle').toEqual([]);
    expect(Array.from(root.querySelectorAll('[data-control="size"] button')).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(Array.from(root.querySelectorAll('[data-control="level"] button')).map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false', 'true']);
  });

  it('a mark helper reopens a sheet that was closed by hidePopover or by a closing toggle', () => {
    const { root } = page(false);
    const sheet = openSheetIfClosed(root);
    sheet.hidePopover();
    markSize(root, 4);
    expect(popoverIsOpen(sheet), 'reopened after hidePopover').toBe(true);
    expect(popoverCalls('showPopover', sheet)).toBe(2);
    dispatchToggle(sheet, 'closed');
    markLevel(root, 2);
    expect(popoverIsOpen(sheet), 'reopened after a closing toggle').toBe(true);
    expect(popoverCalls('showPopover', sheet)).toBe(3);
  });

  it('pressStart clicks [data-action="setup-start"] and nothing else', () => {
    const { root, starts } = page(false);
    const clicks: string[] = [];
    root.addEventListener('click', (event) => clicks.push((event.target as HTMLElement).getAttribute('data-action') ?? '?'));
    openSheetIfClosed(root);
    pressStart(root);
    expect(clicks).toEqual(['setup-start']);
    expect(sheetStartButton(root).textContent).toBe(START_LABEL);
    expect(starts).toHaveLength(1);
  });

  it('pressStart fails with a readable message when the sheet has no start button', () => {
    const { root } = page(false);
    sheetStartButton(root).remove();
    expect(() => { pressStart(root); }).toThrow(/setup-start/);
  });

  it('selectSize and chooseLevel mark, press «Почати», and confirm exactly when the board has an entry (also for the size shown)', () => {
    const untouched = page(false);
    selectSize(untouched.root, 6); // the size already shown: «Почати» still starts (SD-Q2)
    expect(untouched.starts, 'one start, no dialog').toHaveLength(1);
    expect(dialogIsOpen(untouched.root)).toBe(false);
    chooseLevel(untouched.root, 1);
    expect(untouched.starts, 'a level already shown starts as well').toHaveLength(2);

    const played = page(true);
    selectSize(played.root, 6); // asks even for the size shown, then confirms
    expect(dialogIsOpen(played.root), 'the helper closed the dialog it opened').toBe(false);
    expect(played.starts).toHaveLength(1);
    expect(popoverCalls('hidePopover', sheetOf(played.root)), '«Почати» closed the sheet').toBe(1);
  });
});

describe('the generator spies record the level in a parallel array', () => {
  it('generateSpy keeps calls as { size, seed } and records the third argument in levels (undefined when absent)', () => {
    const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4 }));
    spy.generate(6, 1);
    spy.generate(4, 2, 1);
    spy.generate(6, 3, 4);
    expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 4, seed: 2 }, { size: 6, seed: 3 }]);
    expect(spy.levels).toEqual([undefined, 1, 4]);
  });

  it('rawGenerateSpy passes the level to pick and fixedGenerate ignores it', () => {
    const seen: (number | undefined)[] = [];
    const spy = rawGenerateSpy((_i, _size, _seed, level) => {
      seen.push(level);
      return BLANK;
    });
    spy.generate(6, 1, 3);
    expect(seen).toEqual([3]);
    expect(fixedGenerate(BLANK)(6, 1, 2)).toBe(BLANK);
  });
});

// ---------------------------------------------------------------------------------------------------------
// add-theme-switch (FR-65, A-51, TD finding 8, task 2.1): self-checks of the dark token set in tests/helpers/css.ts and of the
// preference cleanup and the matchMedia stub in tests/helpers/play-page.ts. They run on literal samples, never on the page or
// on src/ui/style.css, so they are GUARDS (green before the implementation; no @trace on purpose, like the rest of this file).
// ---------------------------------------------------------------------------------------------------------

/**
 * The dark values of the G2 palette (A-57 appendix, block 2), used as the dark sample (the shape of a dark block is what these tests check; the
 * product values are the stylesheet's).
 * DELIBERATE CHANGE (update-page-palette, delta «Borders, cues and focus rings have enough contrast»): a sample of 13 arbitrary colours cannot
 * meet the new pairs (they name 17 more tokens), so the sample is the dark half of the signed palette, which does.
 * DELIBERATE CHANGE (update-page-backdrop, delta 1 «Borders, cues and focus rings have enough contrast»; proposal.md Impact row
 * `tests/play-page-helpers.test.ts:1149-1181`, assertions 1232 and 1268-1270): the sample gains the two dark backdrop rows of the spec table
 * (`#08050273` and `#08050299`). Without them `expect(dark?.tokens).toEqual(DARK_SAMPLE)` fails (27 against 25 keys), and after the port
 * `injectPageStyles(DARK_SAMPLE)` leaves `var(--color-backdrop-*)` uninlined (`tests/helpers/css.ts` `withTokensInlined`), so
 * `not.toMatch(/var\(\s*--color-/)` fails.
 */
const DARK_SAMPLE: Record<string, string> = {
  '--color-page': '#1a1714',
  '--color-text': '#f1ede4',
  '--color-text-muted': '#b8b0a4',
  '--color-cell-bg': '#24201b',
  '--color-control-bg': '#24201b',
  '--color-line': '#3a332b',
  '--color-cell-border': '#8a7f71',
  '--color-control-border': '#8a7f71',
  '--color-given-bg': '#4d4438',
  '--color-given-border': '#8a7f71',
  '--color-given-text': '#f7f3ea',
  '--color-entry-text': '#f7a46a',
  '--color-primary': '#f39a5b',
  '--color-primary-text': '#1a1007',
  '--color-primary-soft': '#3d2b1e',
  '--color-hover-ring': '#a06941',
  '--color-violation-bg': '#3f2320',
  '--color-violation-border': '#ff8a7d',
  '--color-violation-stripe': '#5e332f',
  '--color-violation-text': '#ff8a7d',
  '--color-success': '#8fd19a',
  '--color-success-bg': '#1f3324',
  '--color-success-glow': '#8fd19a73',
  '--color-win-text': '#f1ede4',
  '--color-focus': '#f1ede4',
  '--color-backdrop-soft': '#08050273',
  '--color-backdrop-strong': '#08050299',
};
const darkBlock = (tokens: Record<string, string>, quote = '"'): string =>
  `:root[data-theme=${quote}dark${quote}] { color-scheme: dark; ${Object.entries(tokens).map(([k, v]) => `${k}: ${v};`).join(' ')} }`;

describe('css helper: the dark attribute block is a token set (add-theme-switch, TD finding 8)', () => {
  it('the dark block is the SECOND token set, an override set over the top-level one; tokens and tokenDeclarations stay the light set', () => {
    const parsed = parseStyles(`${tokenCss(DESIGN_TOKENS)} ${darkBlock({ '--color-page': '#000000', '--color-text': '#ffffff' })}`);
    expect(parsed.tokenSets.map((set) => set.label)).toEqual(['top-level', DARK_LABEL]);
    expect(parsed.tokenSets[1]?.tokens['--color-page']).toBe('#000000');
    expect(parsed.tokenSets[1]?.tokens['--color-text']).toBe('#ffffff');
    expect(parsed.tokenSets[1]?.tokens['--color-focus'], 'a token the block does not redefine keeps its top-level value').toBe('#1e2126');
    expect(parsed.tokens).toEqual(DESIGN_TOKENS);
    // was 13 (update-page-palette, proposal.md Impact row `:1068`); 27 with the two backdrops (update-page-backdrop, delta 1, proposal.md Impact row `:1193`)
    expect(parsed.tokenDeclarations, 'the 27 tokens of the G2 palette').toHaveLength(27);
    expect(parsed.darkTokenDeclarations.map((d) => d.property)).toEqual(['--color-page', '--color-text']);
    expect(darkRootRules(parsed)).toHaveLength(1);
    expect(darkRootRules(parsed)[0]?.declarations.find((d) => d.property === 'color-scheme')?.value).toBe('dark');
    expect(lightRootRules(parsed)).toHaveLength(1);
    expect(lightRootRules(parsed)[0]?.declarations.some((d) => d.property === '--color-page')).toBe(true);
  });

  it('accepts the double-quoted, single-quoted and unquoted attribute selector, and nothing else', () => {
    for (const quote of ['"', "'", '']) {
      const parsed = parseStyles(`${tokenCss(DESIGN_TOKENS)} ${darkBlock(DARK_SAMPLE, quote)}`);
      expect(parsed.tokenSets, `quote style [${quote}]`).toHaveLength(2);
    }
    for (const selector of [':root[data-theme="light"]', ':root[data-theme="dark"] .x', ':root[data-theme="dark"], .y', '.z[data-theme="dark"]']) {
      const parsed = parseStyles(`${tokenCss(DESIGN_TOKENS)} ${selector} { --color-page: #000000; }`);
      expect(parsed.tokenSets, `selector ${selector}`).toHaveLength(1);
      expect(parsed.darkTokenDeclarations, `selector ${selector}`).toEqual([]);
    }
    const inMedia = parseStyles(`${tokenCss(DESIGN_TOKENS)} @media (min-width: 1px) { ${darkBlock(DARK_SAMPLE)} }`);
    expect(inMedia.darkTokenDeclarations, 'a dark block inside an at-rule is not the dark set').toEqual([]);
  });

  it('a file with no dark block gives no dark set, and themeTokenSets fails on an assertion that names the block', () => {
    const parsed = parseStyles(tokenCss(DESIGN_TOKENS));
    expect(parsed.tokenSets).toHaveLength(1);
    expect(() => themeTokenSets(parsed)).toThrow(/dark token set exists/);
  });

  it('themeTokenSets returns [light, dark]; a conditional :root block is built from the top-level set and comes after the dark set', () => {
    const css = `${tokenCss(DESIGN_TOKENS)} ${darkBlock(DARK_SAMPLE)} @media (prefers-contrast: more) { :root { --color-text: #000000; } }`;
    const parsed = parseStyles(css);
    expect(parsed.tokenSets).toHaveLength(3);
    expect(parsed.tokenSets[0]?.label).toBe('top-level');
    expect(parsed.tokenSets[1]?.label).toBe(DARK_LABEL);
    expect(parsed.tokenSets[2]?.label).toContain('@media');
    expect(parsed.tokenSets[2]?.tokens['--color-page'], 'the conditional set is built from the LIGHT set').toBe('#f7f3ea');
    const [light, dark] = themeTokenSets(parsed);
    expect([light?.label, dark?.label]).toEqual(['light', 'dark']);
    expect(light?.tokens).toEqual(DESIGN_TOKENS);
    expect(dark?.tokens).toEqual(DARK_SAMPLE);
  });

  // update-page-palette: the signed light and dark values are one consistent palette: every pair holds for each, and the accepted adjacencies of
  // A-57 (PA-Q8) are the recorded ratios.
  it('the signed light and dark palettes meet every pair, and the focus ring keeps its recorded ratios against the accepted neighbours', () => {
    expect(contrastProblems(DESIGN_TOKENS)).toEqual([]);
    expect(contrastProblems(DARK_SAMPLE)).toEqual([]);
    expect(PALETTE_DARK, 'the helper holds the dark values of the spec table, backdrops included').toEqual(DARK_SAMPLE);
    const ring = (set: Record<string, string>, other: string): number =>
      Number(contrastRatio(set['--color-focus'] ?? '', set[other] ?? '').toFixed(2));
    expect(['--color-line', '--color-violation-border', '--color-primary', '--color-success'].map((n) => ring(DESIGN_TOKENS, n))).toEqual([11.72, 2.47, 2.94, 2.53]);
    expect(['--color-line', '--color-violation-border', '--color-primary', '--color-success'].map((n) => ring(DARK_SAMPLE, n))).toEqual([10.65, 1.96, 1.88, 1.53]);
  });

  it('a dark set with a failing pair is found in its own set only', () => {
    const weak = { ...DARK_SAMPLE, '--color-cell-border': '#1f2937' };
    const [light, dark] = themeTokenSets(parseStyles(`${tokenCss(DESIGN_TOKENS)} ${darkBlock(weak)}`));
    expect(contrastProblems(light?.tokens ?? {})).toEqual([]);
    expect(contrastProblems(dark?.tokens ?? {}).join('\n')).toMatch(/--color-cell-border #1f2937/);
    expect(contrastProblems(themeTokenSets(parseStyles(`${tokenCss(DESIGN_TOKENS)} ${darkBlock(DARK_SAMPLE)}`))[1]?.tokens ?? {})).toEqual([]);
  });

  it('scanColours allows --color-* and #rrggbb in the dark block and nowhere else', () => {
    const base = `${tokenCss(DESIGN_TOKENS)} ${darkBlock(DARK_SAMPLE)}`;
    expect(scanColours(parseStyles(base))).toEqual({ literals: [], named: [], shorthands: [], tokensOutsideRoot: [], colourProperties: [] });
    const elsewhere = scanColours(parseStyles(`${base} .x { color: #fff; --color-page: #000000; } @media (min-width: 1px) { .y { color: red; } }`));
    expect(elsewhere.literals.some((m) => m.includes('.x'))).toBe(true);
    expect(elsewhere.tokensOutsideRoot).toHaveLength(1);
    expect(elsewhere.named.some((m) => m.includes('@media'))).toBe(true);
  });

  it('withTokensInlined(text, tokens) and injectPageStyles(tokens) use the given set and default to the top-level one', () => {
    const css = `${tokenCss(DESIGN_TOKENS)} ${darkBlock(DARK_SAMPLE)} .x { color: var(--color-text); }`;
    expect(withTokensInlined(css)).toContain('.x { color: #1e2126; }');
    expect(withTokensInlined(css, DARK_SAMPLE)).toContain('.x { color: #f1ede4; }');
    // injectPageStyles reads src/ui/style.css: here only that the argument is accepted and the sheet is injected and removable
    const style = injectPageStyles(DARK_SAMPLE);
    expect(style.isConnected).toBe(true);
    expect(style.textContent).not.toMatch(/var\(\s*--color-/);
    style.remove();
  });
});

describe('the preference cleanup and the matchMedia stub of installPageLifecycle (add-theme-switch, A-50, FR-113, FR-115)', () => {
  installPageLifecycle();

  it('dirties storage, cookies, <html> and the head (the next test must find all of it clean)', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    sessionStorage.setItem('x', '1');
    document.cookie = 'probe=1; path=/';
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('color-scheme', 'dark');
    addThemeColorMeta('#000000');
    installMatchMedia(true);
    expect(localStorage.length).toBe(1);
  });

  it('starts clean after the test above: no storage entry, no cookie, no data-theme, no inline color-scheme, no theme-color meta', () => {
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('');
    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(0);
    expect(typeof window.matchMedia, 'the matchMedia stub of the previous test is gone').toBe('undefined');
  });

  it('installMatchMedia answers the query, records the change listeners, fires them with the current answer and forgets a removed one', () => {
    const stub = installMatchMedia(false);
    const list = window.matchMedia(DARK_QUERY);
    expect(list.matches).toBe(false);
    expect(list.media).toBe(DARK_QUERY);
    const seen: boolean[] = [];
    const listener = (event: { matches: boolean }): void => { seen.push(event.matches); };
    list.addEventListener('change', listener as unknown as EventListener);
    expect(stub.listeners).toHaveLength(1);
    stub.setMatches(true);
    expect(list.matches, 'the object the page holds follows setMatches').toBe(true);
    stub.fire();
    expect(seen).toEqual([true]);
    list.removeEventListener('change', listener as unknown as EventListener);
    expect(stub.listeners).toHaveLength(0);
    stub.fire();
    expect(seen).toEqual([true]);
    expect(stub.queries).toEqual([DARK_QUERY]);
  });

  it('the broken variants: one throws when called, one returns an object without addEventListener', () => {
    installThrowingMatchMedia();
    expect(() => window.matchMedia(DARK_QUERY)).toThrow();
    installMatchMediaWithoutListeners(true);
    const list = window.matchMedia(DARK_QUERY);
    expect(list.matches).toBe(true);
    expect('addEventListener' in list).toBe(false);
  });

  it('a localStorage whose access throws is put back by the lifecycle (the next test reads a working store)', () => {
    makeLocalStorageAccessThrow();
    expect(() => window.localStorage).toThrow();
  });

  it('works again after the test above', () => {
    expect(() => { window.localStorage.setItem('a', 'b'); }).not.toThrow();
    expect(window.localStorage.getItem('a')).toBe('b');
  });
});

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
  PAIR_PLUS_4,
  PAIR_PLUS_8,
  PAIR_ROW,
  PAIR_ROW_PLUS,
  SOLUTION_8_TEXT,
  TWO_PAIRS,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allSolutions,
  bySize,
  cellName,
  checkerCells,
  collectPageText,
  expectTabStop,
  fixedGenerate,
  focusCell,
  generateSpy,
  givensOf,
  keepsGivens,
  makePuzzle,
  ownLabelText,
  pressKey,
  rawGenerateSpy,
  rowEls,
  seedQueue,
  solutionGrid,
  tabStopCells,
  trackErrors,
} from './helpers/play-page';
import { VALID_4X4, boardOf, parseBoard } from './helpers/board';
import {
  CONTRAST_PAIRS,
  TOKEN_NAMES,
  contrastProblems,
  contrastRatio,
  declarationsFor,
  hidingDeclarations,
  namedColoursIn,
  parseStyles,
  px,
  rgbOf,
  rulesWithSelector,
  scanColours,
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

// ---------------------------------------------------------------------------------------------------------
// Slice 6 (add-page-accessibility): self-checks of tests/helpers/css.ts and the keyboard/focus helpers. They run on
// literal samples, never on src/ui/style.css or the page, so they pass at the red stage (no @trace on purpose).
// ---------------------------------------------------------------------------------------------------------

/** The design's token values (design.md decision 7); the self-check below proves they meet the thresholds. */
const DESIGN_TOKENS: Record<string, string> = {
  '--color-page': '#f9fafb',
  '--color-text': '#1f2937',
  '--color-cell-bg': '#ffffff',
  '--color-cell-border': '#6b7280',
  '--color-given-bg': '#e5e7eb',
  '--color-given-border': '#374151',
  '--color-violation-bg': '#fecaca',
  '--color-violation-border': '#b91c1c',
  '--color-violation-text': '#991b1b',
  '--color-focus': '#1d4ed8',
  '--color-control-bg': '#ffffff',
  '--color-control-border': '#6b7280',
  '--color-win-text': '#166534',
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

  it('the design token values meet every pair (3 for borders, cues and rings, 4.5 for text)', () => {
    expect(Object.keys(DESIGN_TOKENS).sort()).toEqual([...TOKEN_NAMES].sort());
    expect(contrastProblems(DESIGN_TOKENS)).toEqual([]);
    expect(contrastRatio('#6b7280', '#f9fafb')).toBeGreaterThan(4.5);
    expect(contrastRatio('#1d4ed8', '#fecaca')).toBeGreaterThan(4.5);
    expect(CONTRAST_PAIRS).toHaveLength(3 + 3 + 3 + 4 + 1 + 4 + 1 + 1);
  });

  it('contrastProblems names a weak pair, a missing token and a token that is not #rrggbb', () => {
    const old = { ...DESIGN_TOKENS, '--color-cell-border': '#9ca3af' }; // the slice-3 border, 2.43:1 on the page
    expect(contrastProblems(old).join('\n')).toMatch(/cell-border.*2\.43/);
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

  it('hidingDeclarations finds every way to hide the label, and nothing else', () => {
    const hiding = parseStyles(`
      .size-label { display: none; visibility: hidden; opacity: 0; clip: rect(0 0 0 0); clip-path: inset(50%); font-size: 0; }
      .box .size-label-text { visibility: collapse; }
      .other { display: none; }
    `);
    expect(hidingDeclarations(hiding)).toHaveLength(7);
    const fine = parseStyles('.size-label { display: inline-flex; align-items: center; gap: 8px; opacity: 1; font-size: 14px; }');
    expect(hidingDeclarations(fine)).toEqual([]);
    expect(hidingDeclarations(parseStyles('.cell { display: none; }'))).toEqual([]);
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

describe('page helpers for keys, focus, rows and names', () => {
  function sampleBoard(): HTMLElement {
    const root = document.createElement('div');
    const rows = [1, 2]
      .map(
        (r) =>
          `<div role="row">${[1, 2].map((c) => `<div data-cell data-row="${r}" data-col="${c}" tabindex="${r === 1 && c === 2 ? 0 : -1}"></div>`).join('')}</div>`,
      )
      .join('');
    root.innerHTML = `<div data-board data-size="2">${rows}</div><div data-cell data-row="3" data-col="1"></div>`;
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

  it('tabStopCells, rowEls, expectTabStop and focusCell read a sample board; focusCell fails on a cell that cannot take focus', () => {
    const root = sampleBoard();
    expect(tabStopCells(root)).toHaveLength(1);
    expect(tabStopCells(root)[0]?.getAttribute('data-col')).toBe('2');
    expect(rowEls(root)).toHaveLength(2);
    expect(rowEls(root).every((r) => r.getAttribute('role') === 'row')).toBe(true);
    expect(() => {
      expectTabStop(root, 1, 1);
    }).toThrow(/only Tab stop/);
    expect(focusCell(root, 1, 2)).toBe(document.activeElement);
    expect(() => focusCell(root, 3, 1)).toThrow(/takes DOM focus/); // no tabindex: jsdom cannot focus it
    root.remove();
  });

  it('cellName spells the Ukrainian name, «порожня» for an empty cell', () => {
    expect(cellName(2, 3, '')).toBe('Рядок 2, стовпець 3: порожня');
    expect(cellName(3, 1, '0')).toBe('Рядок 3, стовпець 1: 0');
    expect(cellName(6, 6, '1')).toBe('Рядок 6, стовпець 6: 1');
  });

  it('ownLabelText drops the select and its options and collapses whitespace', () => {
    const label = document.createElement('label');
    label.innerHTML = '<span class="size-label-text"> Розмір\n  поля </span><select><option>Поле 4×4</option></select>';
    expect(label.textContent).toContain('Поле 4×4');
    expect(ownLabelText(label)).toBe('Розмір поля');
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

import { afterEach, describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import { readStyles, themeTokenSets } from './helpers/css';
import { BLANK_4, PAIR_ROW, WIN_MESSAGE, bySize, clickCell, generateSpy, installPageLifecycle, mountPage, pressHint, q, resetBoard, seedQueue, selectSize, startNewPuzzle, winMessage } from './helpers/play-page';

// update-page-palette DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta «Main column layout geometry follows the design reference», scenario «Colours are
// the G2 palette», proposal.md Impact row `tests/play-page-layout-geometry.test.ts:10-46`): block 1's scenario «Colours are unchanged» (the 13 colour
// tokens of A-51 keep their names and values in both token sets) became «Colours are the G2 palette»: both sets equal the 25 block-2 tokens and values
// of the appendix to A-57, and no other `--color-*` token is declared (toEqual on the whole set). The values are written out here on purpose, a
// second copy of the table that `tests/helpers/css.ts` (PALETTE_LIGHT, PALETTE_DARK) and the spec hold. The geometry itself is checked in a real
// browser by e2e/nfr-14-layout-geometry.spec.ts (jsdom does not lay out).
//
// update-page-backdrop DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 3 «Main column layout geometry follows the design reference», scenario «Colours are the
// G2 palette», proposal.md Impact row `tests/play-page-layout-geometry.test.ts:9-67` (`LIGHT`, `DARK`) and `:69-74`): the two literal copies gain the
// backdrop rows of the spec's table (`--color-backdrop-soft`, `--color-backdrop-strong`: light `#46280f38` and `#2d190a80`, dark `#08050273` and
// `#08050299`), 27 tokens in each set, and the length check is 27. Nothing else in the scenario changes.
//
// update-panel-shell DELIBERATE CHANGE (NFR-14, FR-65, A-57; delta 4 «Main column layout geometry follows the design reference», scenario «Colours are the
// G2 palette», proposal.md Impact row `tests/play-page-layout-geometry.test.ts:18-45` (`LIGHT`), `:47-75` (`DARK`), `:78` and `:82` (comment 15-17)): the two
// literal copies gain the four shell rows of the spec's table (`--color-surface-raised`, `--color-overlay-border`, `--color-shadow-panel`,
// `--color-shadow-sheet`: light `#fffdf8`, `#e2dbcc`, `#00000040`, `#0000002e`; dark `#2c2620`, `#8a7f71`, `#00000040`, `#0000002e`), 31 tokens in each set,
// and the title and the length check are 31. Nothing else in the scenario changes. Red on today's stylesheet: both sets hold 27 tokens.
const LIGHT: Record<string, string> = {
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
  '--color-surface-raised': '#fffdf8',
  '--color-overlay-border': '#e2dbcc',
  '--color-shadow-panel': '#00000040',
  '--color-shadow-sheet': '#0000002e',
};
const DARK: Record<string, string> = {
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
  '--color-surface-raised': '#2c2620',
  '--color-overlay-border': '#8a7f71',
  '--color-shadow-panel': '#00000040',
  '--color-shadow-sheet': '#0000002e',
};

describe('@trace NFR-14 @trace FR-65 the main column takes the G2 palette', () => {
  it('Colours are the G2 palette: the light and dark token sets equal the 31 tokens and values of the table (25 of block 2, 2 backdrops, 4 shell tokens), and no other --color-* is declared', () => {
    const [light, dark] = themeTokenSets(readStyles());
    expect(light?.tokens).toEqual(LIGHT);
    expect(dark?.tokens).toEqual(DARK);
    expect(Object.keys(LIGHT)).toHaveLength(31);
  });
});

// update-page-layout-geometry, scenario «The solved board keeps its geometry»: after a win the new-puzzle button takes the bold weight from the hint
// button (the design's geometry of the button row). The design keys that on the solved board with a has-selector, which the build target allows
// only for the idle line (FR-65, A-14), and the buttons come before the messages; so the board host carries data-solved="true" exactly while the
// board is solved (the win line shows), and the stylesheet reads it with a sibling selector.
installPageLifecycle();

const KEY = '__binarkaCaptureBoard';
afterEach(() => {
  Reflect.deleteProperty(window, KEY);
});

const at = (grid: Grid, r: number, c: number): Cell => grid[r]?.[c] ?? null;

/** The solved 6x6 board as a capture value (FR-119); with `missing`, that many non-given cells (from the end) left empty. */
function solvedBoard(missing = 0): { size: number; level: number; givens: Grid; entries: Grid } {
  const puzzle = generate(6, 5, 1);
  const givens = puzzle.givens.map((row) => [...row]);
  const entries: Grid = givens.map((row, r) => row.map((cell, c): Cell => (cell === null ? at(puzzle.solution, r, c) : null)));
  let left = missing;
  for (let r = 5; r >= 0 && left > 0; r--) {
    for (let c = 5; c >= 0 && left > 0; c--) {
      const row = entries[r];
      if (row !== undefined && row[c] !== null) {
        row[c] = null;
        left--;
      }
    }
  }
  return { size: 6, level: 1, givens, entries };
}

const solvedFlag = (root: ParentNode): string | null => q(root, '.board-host').getAttribute('data-solved');

function mountWith(value?: unknown): HTMLElement {
  if (value !== undefined) Reflect.set(window, KEY, value);
  return mountPage({ seedSource: seedQueue([7, 8, 9]).source, generate: generateSpy(bySize({ 4: BLANK_4, 6: PAIR_ROW })).generate });
}

/** The first empty cell of solvedBoard(missing) and the digit the solution has there. */
function firstGap(missing: number): { r: number; c: number; digit: 0 | 1 } {
  const value = solvedBoard(missing);
  const solution = generate(6, 5, 1).solution;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (at(value.givens, r, c) === null && at(value.entries, r, c) === null) {
        const digit = at(solution, r, c);
        expect.assert(digit === 0 || digit === 1, 'premise: the solution has a digit there');
        return { r, c, digit };
      }
    }
  }
  throw new Error('premise: the board has a gap');
}

describe('@trace NFR-14 @trace FR-38 the board host carries data-solved exactly while the board is solved', () => {
  it('an unsolved board: no data-solved on the board host', () => {
    const root = mountWith();
    expect(winMessage(root)).toBe('');
    expect(solvedFlag(root)).toBeNull();
  });

  it('a solved board at mount (FR-119): data-solved="true", with the win line', () => {
    const root = mountWith(solvedBoard());
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(solvedFlag(root)).toBe('true');
  });

  it('the last move by a hint solves the board: data-solved="true" appears with the win line', () => {
    const root = mountWith(solvedBoard(1));
    expect(winMessage(root), 'premise: one cell short of solved').toBe('');
    expect(solvedFlag(root)).toBeNull();
    pressHint(root);
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(solvedFlag(root)).toBe('true');
  });

  // Review run 1 (wf_1c7326da-0c4), fix round 1: the click path, the new size and level, and the click that un-solves.
  it('the last move by a click solves the board: data-solved="true" appears with the win line', () => {
    const gap = firstGap(1);
    const root = mountWith(solvedBoard(1));
    expect(solvedFlag(root), 'premise: one cell short of solved').toBeNull();
    clickCell(root, gap.r + 1, gap.c + 1, gap.digit === 0 ? 1 : 2); // 1-based data-row/data-col; a click cycles empty -> 0 -> 1
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(solvedFlag(root)).toBe('true');
  });

  it('a click that un-solves a solved board removes data-solved with the win line', () => {
    const gap = firstGap(1); // a non-given cell of the solved board
    const root = mountWith(solvedBoard());
    expect(solvedFlag(root), 'premise: set after the win').toBe('true');
    clickCell(root, gap.r + 1, gap.c + 1); // 1-based; the entry cycles to its next value
    expect(winMessage(root)).toBe('');
    expect(solvedFlag(root)).toBeNull();
  });

  it('a new size and level after the win removes data-solved', () => {
    const root = mountWith(solvedBoard());
    expect(solvedFlag(root), 'premise: set after the win').toBe('true');
    selectSize(root, 4);
    expect(winMessage(root)).toBe('');
    expect(solvedFlag(root)).toBeNull();
  });

  it('a new puzzle after the win removes data-solved', () => {
    const root = mountWith(solvedBoard());
    expect(solvedFlag(root)).toBe('true');
    startNewPuzzle(root);
    expect(winMessage(root)).toBe('');
    expect(solvedFlag(root)).toBeNull();
  });

  it('a reset after the win removes data-solved', () => {
    const root = mountWith(solvedBoard());
    expect(solvedFlag(root), 'premise: set after the win').toBe('true');
    resetBoard(root);
    expect(winMessage(root)).toBe('');
    expect(solvedFlag(root)).toBeNull();
  });
});

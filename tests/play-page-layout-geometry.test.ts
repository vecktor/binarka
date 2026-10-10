import { afterEach, describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import { readStyles, themeTokenSets } from './helpers/css';
import { BLANK_4, PAIR_ROW, WIN_MESSAGE, bySize, clickCell, generateSpy, installPageLifecycle, mountPage, pressHint, q, resetBoard, seedQueue, selectSize, startNewPuzzle, winMessage } from './helpers/play-page';

// update-page-layout-geometry (NFR-14, G2 block 1), scenario «Colours are unchanged»: the layout port changes geometry only. The 13 colour
// tokens of A-51 keep their names and their values in both token sets; the palette is a later block. The geometry itself is checked in a real
// browser by e2e/nfr-14-layout-geometry.spec.ts (jsdom does not lay out).
const LIGHT: Record<string, string> = {
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
const DARK: Record<string, string> = {
  '--color-page': '#1a1714',
  '--color-text': '#f1ede4',
  '--color-cell-bg': '#24201b',
  '--color-cell-border': '#9a8f80',
  '--color-given-bg': '#4d4438',
  '--color-given-border': '#e0d6c4',
  '--color-violation-bg': '#3f2320',
  '--color-violation-border': '#ff8a7d',
  '--color-violation-text': '#ffb4ab',
  '--color-focus': '#f39a5b',
  '--color-control-bg': '#24201b',
  '--color-control-border': '#9a8f80',
  '--color-win-text': '#8fd19a',
};

describe('@trace NFR-14 the layout geometry port leaves the colours unchanged', () => {
  it('the light and dark token sets keep the 13 names and values of A-51', () => {
    const [light, dark] = themeTokenSets(readStyles());
    expect(light?.tokens).toEqual(LIGHT);
    expect(dark?.tokens).toEqual(DARK);
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

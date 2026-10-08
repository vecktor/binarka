// Play page: the reset button (FR-58). Scenarios of the delta spec
// openspec/changes/add-rules-and-reset/specs/play-page/spec.md ("Reset button"). Written FIRST (red).
// The rules-block scenarios (FR-57) that used to live here were removed by the change update-page-layout: the rules are now
// a popover panel, covered by tests/play-page-layout.test.ts ("Rules panel").
// Reset scenarios that touch the board run for N = 4, 6, 8, each with a fixture puzzle of size N (the page is mounted at 6
// and the player selects 4 or 8, the injected generator returning the fixture).
// NEVER enumerate the 8x8 grids: the 8x8 fixtures carry a hand-written solution (tests/helpers/play-page.ts).
// Change update-controls-accessibility (FR-67): a press of «Скинути» on a board with entries is asked first, so those tests press
// and then confirm with `confirmYes`; on an untouched board it acts at once with no dialog.
import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../src/engine/index';
import {
  BLANK,
  BROKEN_SENTENCE,
  DIRTY_8_ROW,
  DIRTY_GIVENS,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  bySize,
  cellEl,
  checkedSize,
  checkerCells,
  clickCell,
  confirmNo,
  confirmYes,
  dialogIsOpen,
  collectPageText,
  fillFrom,
  generateSpy,
  generatorBySize,
  givensOf,
  hintMessage,
  installPageLifecycle,
  makePuzzle,
  mountPage,
  pressHint,
  pressReset,
  q,
  readBoard,
  seedQueue,
  selectSize,
  showModalCalls,
  snapshot,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** 4x4 whose only givens are three 0 in row 1: the checker reports `three` at once (inconsistent fixture). */
const DIRTY_4 = makePuzzle(givensOf(4, [[1, 1, 0], [1, 2, 0], [1, 3, 0]]), { inconsistent: true });

interface SizeCase {
  n: number;
  /** two given 0 side by side, rule-clean givens, a pair hint is available */
  pair: Puzzle;
  /** all cells given except one: the player solves it by filling the open cell(s) */
  win: Puzzle;
  /** givens already break a rule (three 0 in a row) */
  dirty: Puzzle;
  /** 1-based cell that, set to 0 by one click, makes a third 0 next to the two given 0 of `pair` (a violation of the player's own) */
  thirdZero: [number, number];
  /** 1-based non-given cells the player clicks (cell, number of clicks) before the hint */
  clicks: Array<[number, number, number]>;
  /** 1-based non-given cells of `dirty` the player clicks (cell, clicks) so that more cells than the givens' own are highlighted */
  dirtyClicks: Array<[number, number, number]>;
}

const CASES: SizeCase[] = [
  { n: 4, pair: PAIR_4, win: WIN_4, dirty: DIRTY_4, thirdZero: [2, 3], clicks: [[1, 4, 2], [4, 1, 2]], dirtyClicks: [[2, 1, 1], [3, 1, 1]] },
  { n: 6, pair: PAIR_ROW, win: WIN_PUZZLE, dirty: DIRTY_GIVENS, thirdZero: [3, 3], clicks: [[1, 4, 1], [6, 6, 2]], dirtyClicks: [[1, 4, 1]] },
  { n: 8, pair: PAIR_8, win: WIN_8, dirty: DIRTY_8_ROW, thirdZero: [8, 6], clicks: [[1, 1, 1], [4, 4, 2]], dirtyClicks: [[8, 4, 1]] },
];

interface Mounted {
  root: HTMLElement;
  seeds: ReturnType<typeof seedQueue>;
  spy: ReturnType<typeof generateSpy>;
}

/** Mount at 6 and select N when N is not 6; the injected generator returns `puzzle` for size N (and BLANK for the start 6). */
function mountAtSize(puzzle: Puzzle): Mounted {
  const seeds = seedQueue([1, 2]);
  const spy = generateSpy(bySize({ 6: BLANK, [puzzle.size]: puzzle }));
  const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
  if (puzzle.size !== 6) selectSize(root, puzzle.size);
  expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(puzzle.size));
  expect(allCells(root)).toHaveLength(puzzle.size * puzzle.size);
  return { root, seeds, spy };
}

/** Cell texts and data-given flags only (no classes), row-major. */
function textsAndGivens(root: ParentNode): string[] {
  return allCells(root).map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}|${c.textContent ?? ''}|${c.getAttribute('data-given')}`);
}

// ---------------------------------------------------------------------------------------------------------
// Reset button (FR-58, NFR-5)
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-58 @trace NFR-5 the reset button is offered', () => {
  it('a button [data-action="reset"] labelled «Скинути», in the page text with no Latin letters', () => {
    const root = mountPage({ seedSource: () => 1, generate: generatorBySize({ 6: BLANK }) });
    const button = q(root, '[data-action="reset"]');
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('Скинути');
    expect(collectPageText(root)).toContain('Скинути');
    for (const attr of ['aria-label', 'title', 'alt']) expect(button.getAttribute(attr), attr).toBeNull();
  });
});

describe.each(CASES)('@trace FR-58 reset at size $n', ({ n, pair, win, dirty, thirdZero, clicks, dirtyClicks }) => {
  it('Reset empties player cells (also the hint-filled one) and keeps givens, data-size and the selector', () => {
    const { root } = mountAtSize(pair);
    const givensBefore = textsAndGivens(root).filter((s) => s.endsWith('|true'));
    expect(givensBefore.length, 'premise: the fixture has givens').toBeGreaterThan(0);
    for (const [r, c, times] of clicks) clickCell(root, r, c, times);
    const beforeHint = textsAndGivens(root);
    pressHint(root);
    const afterHint = textsAndGivens(root);
    const hintCells = afterHint.flatMap((s, i) => (s !== beforeHint[i] ? [i] : []));
    expect(hintCells, 'premise: the hint filled exactly one cell').toHaveLength(1);
    expect(afterHint[hintCells[0] as number]?.endsWith('|false'), 'premise: the hint cell is a player cell').toBe(true);
    expect(hintMessage(root)).not.toBe('');
    const playerFilled = allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent !== '');
    expect(playerFilled.length, 'premise: clicked cells plus the hint-filled cell show a digit').toBeGreaterThanOrEqual(3);

    pressReset(root);
    expect(dialogIsOpen(root), 'the board has entries: asked first (FR-67)').toBe(true);
    confirmYes(root);

    for (const el of allCells(root)) {
      if (el.getAttribute('data-given') === 'false') {
        expect(el.textContent, `player cell ${el.getAttribute('data-row')},${el.getAttribute('data-col')} is empty`).toBe('');
      }
    }
    expect(textsAndGivens(root).filter((s) => s.endsWith('|true'))).toEqual(givensBefore);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(givensBefore.length);
    expect(allCells(root)).toHaveLength(n * n);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(n));
    expect(checkedSize(root)).toBe(n);
    expect(root.querySelectorAll('[data-control="size"] [aria-checked="true"]'), 'aria-checked is on one button only').toHaveLength(1);
    // the board is the pure givens grid
    expect(readBoard(root)).toEqual(pair.givens);
  });

  it('Reset clears highlights that come from the player and the hint message', () => {
    const { root } = mountAtSize(pair);
    expect(checkerCells(pair.givens), 'premise: the givens alone report no violation').toEqual([]);
    expect(violationCells(root)).toEqual([]);
    clickCell(root, thirdZero[0], thirdZero[1], 1);
    expect(violationCells(root).length, 'premise: the player entry makes a violation').toBeGreaterThan(0);
    pressHint(root);
    expect(hintMessage(root)).toBe(BROKEN_SENTENCE);

    pressReset(root);
    confirmYes(root);

    expect(violationCells(root)).toEqual([]);
    expect(allCells(root).filter((c) => c.classList.contains('cell-violation'))).toHaveLength(0);
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
    expect(winMessage(root)).toBe('');
  });

  it('Reset recomputes highlights: violations caused by the givens themselves stay, the player\'s are gone', () => {
    const { root } = mountAtSize(dirty);
    const fromGivens = checkerCells(dirty.givens);
    expect(fromGivens.length, 'premise: the givens report a violation').toBeGreaterThan(0);
    expect(violationCells(root)).toEqual(fromGivens);
    for (const [r, c, times] of dirtyClicks) clickCell(root, r, c, times);
    const withPlayer = violationCells(root);
    expect(withPlayer, 'premise: the player entry adds highlighted cells').not.toEqual(fromGivens);
    expect(withPlayer.length).toBeGreaterThan(fromGivens.length);

    pressReset(root);
    confirmYes(root);

    expect(violationCells(root)).toEqual(fromGivens);
    for (const [r, c] of dirtyClicks) expect(cellEl(root, r, c).textContent).toBe('');
  });

  it('Reset after a win empties the win message, and the board is editable again', () => {
    const { root } = mountAtSize(win);
    fillFrom(root, win, solutionGrid(win));
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    const open = allCells(root).filter((c) => c.getAttribute('data-given') === 'false');
    expect(open.length, 'premise: the fixture has open cells').toBeGreaterThan(0);
    expect(open.every((c) => c.textContent !== ''), 'premise: all open cells are filled').toBe(true);
    const row = Number(open[0]?.getAttribute('data-row'));
    const col = Number(open[0]?.getAttribute('data-col'));

    pressReset(root);
    expect(dialogIsOpen(root), 'a solved board has entries: asked (A-29)').toBe(true);
    expect(winMessage(root), 'unchanged until the confirmation').toBe(WIN_MESSAGE);
    confirmYes(root);

    expect(q(root, '[data-message="win"]').textContent).toBe('');
    expect(open.length).toBe(allCells(root).filter((c) => c.getAttribute('data-given') === 'false' && c.textContent === '').length);
    expect(cellEl(root, row, col).textContent).toBe('');
    clickCell(root, row, col, 1);
    expect(cellEl(root, row, col).textContent).toBe('0');
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(n));
  });

  it('Reset takes no seed and calls no generator: untouched, confirmed (twice) and cancelled presses leave the counts as after mount', () => {
    const { root, seeds, spy } = mountAtSize(pair);
    const [r, c] = [clicks[0]?.[0] as number, clicks[0]?.[1] as number];
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    expect(seedCalls, 'premise: the mount (and the size change) took seeds').toBeGreaterThan(0);
    expect(generatorCalls).toBeGreaterThan(0);

    // the untouched board: at once, no dialog
    pressReset(root);
    expect(showModalCalls()).toBe(0);
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    // an entry, a press and the confirmation
    clickCell(root, r, c, 1);
    expect(cellEl(root, r, c).textContent).toBe('0');
    pressReset(root);
    expect(dialogIsOpen(root)).toBe(true);
    confirmYes(root);
    expect(cellEl(root, r, c).textContent, 'the confirmed press did reset').toBe('');
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    // the same once more
    clickCell(root, r, c, 1);
    pressReset(root);
    confirmYes(root);
    expect(cellEl(root, r, c).textContent).toBe('');
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);

    // a cancelled press: nothing is reset, still no seed and no generator call
    clickCell(root, r, c, 1);
    pressReset(root);
    confirmNo(root);
    expect(cellEl(root, r, c).textContent, 'the cancelled press did not reset').toBe('0');
    expect(seeds.calls()).toBe(seedCalls);
    expect(spy.calls).toHaveLength(generatorCalls);
  });

  it('Reset on an untouched board changes nothing: same cell text and classes, same messages', () => {
    const { root } = mountAtSize(dirty);
    const cellsBefore = snapshot(root);
    const hintBefore = hintMessage(root);
    const winBefore = winMessage(root);
    expect(violationCells(root).length, 'premise: classes are present (cell-violation from the givens)').toBeGreaterThan(0);
    expect(hintBefore).toBe('');
    expect(winBefore).toBe('');

    pressReset(root);

    expect(showModalCalls(), 'an untouched board asks nothing').toBe(0);
    expect(dialogIsOpen(root)).toBe(false);
    expect(snapshot(root)).toEqual(cellsBefore);
    expect(hintMessage(root)).toBe(hintBefore);
    expect(winMessage(root)).toBe(winBefore);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(n));
    expect(checkedSize(root)).toBe(n);
  });
});

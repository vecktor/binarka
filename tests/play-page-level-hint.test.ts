// Play page: the page hint uses all four techniques (FR-77, FR-39, FR-40). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md ("The page hint uses all four techniques"). Written FIRST (red):
// the page calls hint(board), the engine's default ceiling 1, not hint(board, 4).
//
// @trace FR-77
// @trace FR-39
// @trace FR-40
//
// The fixture LINE_BALANCE_ONLY is the board `0 0 1 . . .` in row 3 (the FR-24 pair-and-balance board of the engine tests). Its
// premise is asserted through the REAL engine, on the board read from the DOM: at ceiling 1 (pair, sandwich, count) no rule applies,
// at ceiling 4 the engine fills a cell by a technique of line balance, unique lines or look-ahead (the `rule` names of the engine).
import { describe, expect, it } from 'vitest';
import { hint as typedHint } from './helpers/hint-type';
import { boardOf } from './helpers/board';
import {
  cellEl,
  cellText,
  chooseLevel,
  fixedGenerate,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  makePuzzle,
  mountPage,
  pressHint,
  readBoard,
  seedQueue,
  targetCell,
} from './helpers/play-page';
import type { Hint } from '../src/engine/index';
import { hint } from '../src/engine/index';

installPageLifecycle();

/** Row 3 holds `0 0 1`: no pair, no sandwich and no count rule applies; the line-balance technique fills a cell. */
const LINE_BALANCE_ONLY = makePuzzle(boardOf(6, { rows: { 3: '0 0 1 . . .' } }));
const BEYOND_LEVEL_ONE = ['balance', 'unique', 'lookahead'];

/** Mount the fixture and assert its premise through the real engine; returns the page and the engine hint of the DOM board. */
function mountLineBalance(): { root: HTMLElement; expected: Extract<Hint, { kind: 'fill' }> } {
  const root = mountPage({ seedSource: seedQueue([1, 2, 3]).source, generate: fixedGenerate(LINE_BALANCE_ONLY) });
  const board = readBoard(root);
  expect(typedHint(board, 1).kind, 'premise: at ceiling 1 no pair, sandwich or count rule applies').toBe('none');
  const expected = hint(board, 4);
  expect.assert(expected.kind === 'fill', 'premise: at ceiling 4 the engine fills a cell');
  expect(BEYOND_LEVEL_ONE, `premise: the technique is beyond pair, sandwich and count (is ${expected.rule})`).toContain(expected.rule);
  return { root, expected };
}

describe('@trace FR-77 the page hint uses all four techniques', () => {
  it('A hint beyond the level\'s techniques is still given', () => {
    const { root, expected } = mountLineBalance();
    const [row, col] = targetCell(expected);
    expect(cellText(root, row, col), 'premise: the target is empty').toBe('');

    pressHint(root);

    expect(cellText(root, row, col), 'the cell the engine targets shows the engine value').toBe(String(expected.value));
    expect(cellEl(root, row, col).classList.contains('cell-hinted'), 'and has cell-hinted').toBe(true);
    expect(hintedCells(root)).toEqual([[row, col]]);
    expect(hintMessage(root), 'the message shows the engine sentence unchanged').toBe(expected.sentence);
  });

  it('The same board gives the same hint at every level', () => {
    const expected = hint(LINE_BALANCE_ONLY.givens, 4);
    expect.assert(expected.kind === 'fill', 'premise: the engine fills a cell on the fixture');
    const [row, col] = targetCell(expected);
    const seen: { cell: [number, number] | undefined; value: string; sentence: string }[] = [];
    for (const level of [1, 2, 3, 4]) {
      const { root } = mountLineBalance();
      if (level !== 1) chooseLevel(root, level); // each reached by a level choice on the untouched board
      expect(readBoard(root), `premise: the board is the fixture at level ${level}`).toEqual(LINE_BALANCE_ONLY.givens);

      pressHint(root);

      seen.push({ cell: hintedCells(root)[0], value: cellText(root, row, col), sentence: hintMessage(root) });
    }

    const same = { cell: [row, col], value: String(expected.value), sentence: expected.sentence };
    expect(seen, 'the four pages fill the same cell with the same value and show the same sentence, the engine hint on that board').toEqual([
      same,
      same,
      same,
      same,
    ]);
  });
});

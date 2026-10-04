// Play page: the win message (FR-41). The fixture is WIN_PUZZLE, a real generated puzzle (seed 2) with a unique
// solution; its solution is written in tests/helpers/play-page.ts and checked by the helper self-check.
import { describe, expect, it } from 'vitest';
import { findViolations, isSolved } from '../src/engine/index';
import {
  WIN_MESSAGE,
  WIN_PUZZLE,
  cellEl,
  cellText,
  clickCell,
  clickUntil,
  expectPageStructure,
  expectedHint,
  fillFrom,
  installPageLifecycle,
  mountFixture,
  nextInCycle,
  pressHint,
  q,
  readBoard,
  setCellTo,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace FR-41 the win message appears when the board is solved', () => {
  it('Final click solves the board: the exact Ukrainian message, apostrophe U+0027', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectPageStructure(root);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[6, 6]]);
    // every cell filled with the solution except (6,6), a non-given cell that shows another value
    expect(cellEl(root, 6, 6).getAttribute('data-given')).toBe('false');
    expect(q(root, '[data-message="win"]').textContent).toBe('');
    setCellTo(root, 6, 6, 0);
    expect(winMessage(root)).toBe('');
    expect(isSolved(readBoard(root))).toBe(false);

    clickUntil(root, 6, 6, '1');

    expect(isSolved(readBoard(root))).toBe(true);
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(winMessage(root)).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x27)}язано!`);
  });

  it('Final click solves the board when the last cell was empty', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[6, 6]]);
    expect(cellText(root, 6, 6)).toBe('');
    expect(winMessage(root)).toBe('');

    clickCell(root, 6, 6, 2);

    expect(cellText(root, 6, 6)).toBe('1');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
  });

  it('Final hint solves the board', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    // premise: exactly one empty cell, (4,1); the engine hint targets it with the solution digit 1
    expect(cellText(root, 4, 1)).toBe('');
    expect(readBoard(root).flat().filter((c) => c === null)).toHaveLength(1);
    expect(expectedHint(root)).toMatchObject({ kind: 'fill', row: 3, col: 0, value: 1 });
    expect(winMessage(root)).toBe('');

    pressHint(root);

    expect(cellText(root, 4, 1)).toBe('1');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
  });

  it('Full board with a violation is not a win', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectPageStructure(root);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[6, 6]]);
    setCellTo(root, 6, 6, 0); // the solution has 1 here; 0 breaks row 6 (four 0) and column 6 (three 0)
    const board = readBoard(root);
    expect(board.flat().every((c) => c !== null)).toBe(true);
    expect(findViolations(board).length).toBeGreaterThan(0);
    expect(violationCells(root).length).toBeGreaterThan(0);
    expect(q(root, '.cell-violation')).not.toBeNull();

    expect(winMessage(root)).toBe('');
  });

  it('Board stays editable after a win: the next click follows the cycle and the message disappears', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    // (1,1) is a non-given cell whose solution digit is 1
    expect(cellEl(root, 1, 1).getAttribute('data-given')).toBe('false');
    const shown = cellText(root, 1, 1);
    expect(shown).toBe('1');

    clickCell(root, 1, 1);

    expect(cellText(root, 1, 1)).toBe(nextInCycle(shown));
    expect(cellText(root, 1, 1)).toBe('');
    expect(winMessage(root)).toBe('');
    expect(isSolved(readBoard(root))).toBe(false);
  });
});

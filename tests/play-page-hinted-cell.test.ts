// Play page: the hinted cell marker (FR-66). Scenarios of the delta spec
// openspec/changes/add-hinted-cell/specs/play-page/spec.md ("Hinted cell marker"). Written FIRST (red): the class
// `cell-hinted` does not exist yet.
// The cancelled confirmation (FR-67) and the press of the size already shown (FR-73) are written by change
// update-controls-accessibility in tests/play-page-confirm.test.ts and tests/play-page-size-control.test.ts. Here, since that
// change, a press of «Нова головоломка», of another size and of «Скинути» on a board with a hint-filled cell is asked first (a
// hint-filled cell is a player entry, A-8) and the tests confirm it: the marker goes when the action is performed.
// jsdom has no layout and no popover behaviour: the tests read classes, text and attributes only.
// Coordinates are 1-based (data-row / data-col); the engine's 0-based row/col are converted with targetCell().
import { describe, expect, it } from 'vitest';
import type { Puzzle } from '../src/engine/index';
import {
  BROKEN_SENTENCE,
  HINT_BREAKS,
  NO_RULE_SENTENCE,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  TWO_PAIRS,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  cellEl,
  cellText,
  clickCell,
  confirmYes,
  dialogIsOpen,
  expectPageStructure,
  expectedHint,
  fillFrom,
  generatorBySize,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  isGivenCell,
  mountFixture,
  mountPage,
  pressHint,
  pressNew,
  pressReset,
  pressSizeButton,
  q,
  rulesPanel,
  seedQueue,
  selectSize,
  snapshot,
  solutionGrid,
  targetCell,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const HINTED = 'cell-hinted';

/** A page on `puzzle` where one press of the hint button has filled a cell: returns the page and that cell (1-based). */
function pageWithHint(puzzle: Puzzle = PAIR_ROW): { root: HTMLElement; x: [number, number] } {
  const root = mountFixture(puzzle);
  expectPageStructure(root);
  const x = targetCell(expectedHint(root));
  pressHint(root);
  // premise: the hint wrote the digit into X and X is the marked cell (this is the red assertion of the slice)
  expect(cellText(root, x[0], x[1])).not.toBe('');
  expect(hintedCells(root)).toEqual([x]);
  return { root, x };
}

/** A page on the 6x6 PAIR_ROW (and the 4 and 8 fixtures for size changes) where a hint has filled a cell. */
function pageWithHintAndSizes(): { root: HTMLElement; x: [number, number] } {
  const root = mountPage({
    seedSource: seedQueue([1, 2, 3, 4]).source,
    generate: generatorBySize({ 6: PAIR_ROW, 4: PAIR_4, 8: PAIR_8 }),
  });
  const x = targetCell(expectedHint(root));
  pressHint(root);
  expect(hintedCells(root)).toEqual([x]);
  return { root, x };
}

describe('@trace FR-66 no cell carries the marker at mount, and no given ever does', () => {
  it('No cell carries the marker at mount; after a hint no given cell carries it', () => {
    const root = mountFixture(PAIR_ROW);
    expectPageStructure(root);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(2);
    expect(allCells(root).filter((c) => c.classList.contains(HINTED))).toEqual([]);
    expect(hintedCells(root)).toEqual([]);

    pressHint(root);

    // not vacuous: the hint did fill a cell, and exactly that one carries the marker
    expect(hintedCells(root)).toEqual([[3, 3]]);
    const givens = allCells(root).filter((c) => c.getAttribute('data-given') === 'true');
    expect(givens).toHaveLength(2);
    for (const el of givens) expect(el.classList.contains(HINTED), `given ${el.getAttribute('data-row')},${el.getAttribute('data-col')}`).toBe(false);
  });

  it('A given never carries the marker even after every kind of click and a second hint', () => {
    const { root } = pageWithHint(TWO_PAIRS);
    clickCell(root, 3, 1, 3);
    pressHint(root);
    const givens = allCells(root).filter((c) => c.getAttribute('data-given') === 'true');
    expect(givens).toHaveLength(4);
    expect(hintedCells(root)).toHaveLength(1);
    for (const el of givens) expect(el.classList.contains(HINTED)).toBe(false);
  });
});

describe('@trace FR-66 a second hint moves the marker', () => {
  it('A second hint moves the marker: exactly one cell, X after the first press, then Y and not X', () => {
    const root = mountFixture(TWO_PAIRS);
    expect(hintedCells(root)).toEqual([]);
    const x = targetCell(expectedHint(root));
    expect(x).toEqual([3, 3]);

    pressHint(root);

    expect(cellText(root, x[0], x[1])).toBe('1');
    expect(hintedCells(root)).toEqual([x]);
    // premise: the first fill breaks no rule, so the second press fills another cell
    expect(violationCells(root)).toEqual([]);
    const second = expectedHint(root);
    expect(second.kind).toBe('fill');
    const y = targetCell(second);
    expect(y).not.toEqual(x);

    pressHint(root);

    expect(cellText(root, y[0], y[1])).not.toBe('');
    expect(hintedCells(root)).toEqual([y]);
    expect(cellEl(root, x[0], x[1]).classList.contains(HINTED)).toBe(false);
    // X keeps the digit the first hint wrote: only the marker moved
    expect(cellText(root, x[0], x[1])).toBe('1');
  });
});

describe('@trace FR-66 later board changes remove the marker', () => {
  it('Click on a non-given cell other than X removes the marker', () => {
    const { root, x } = pageWithHint();
    expect(isGivenCell(root, 1, 1)).toBe(false);
    expect([1, 1]).not.toEqual(x);

    clickCell(root, 1, 1);

    expect(cellText(root, 1, 1)).toBe('0'); // the click did change the board
    expect(hintedCells(root)).toEqual([]);
  });

  it('Click on X itself removes the marker (the cell follows the player cycle)', () => {
    const { root, x } = pageWithHint();

    clickCell(root, x[0], x[1]);

    expect(cellText(root, x[0], x[1])).toBe(''); // a hint-filled 1 becomes empty
    expect(hintedCells(root)).toEqual([]);
    expect(cellEl(root, x[0], x[1]).getAttribute('data-given')).toBe('false');
  });

  it('«Нова головоломка» removes the marker, and a later hint marks exactly one cell again', () => {
    const { root, x } = pageWithHint();

    pressNew(root);
    expect(dialogIsOpen(root), 'a hint-filled cell is an entry: asked first').toBe(true);
    expect(hintedCells(root), 'the marker stays until the action is performed').toEqual([x]);
    confirmYes(root);

    expect(boardSize(root)).toBe(6);
    expect(hintedCells(root)).toEqual([]);
    expect(allCells(root).filter((c) => c.classList.contains(HINTED))).toEqual([]);
    // the stale coordinates are gone: the next hint marks exactly its own cell
    const next = targetCell(expectedHint(root));
    pressHint(root);
    expect(hintedCells(root)).toEqual([next]);
  });

  for (const size of [4, 8]) {
    it(`A size change to ${size} removes the marker (the injected generator returns a ${size}x${size} fixture)`, () => {
      const { root, x } = pageWithHintAndSizes();

      pressSizeButton(root, size);
      expect(dialogIsOpen(root), 'a hint-filled cell is an entry: asked first').toBe(true);
      expect(hintedCells(root), 'the marker stays until the change is performed').toEqual([x]);
      confirmYes(root);

      expect(boardSize(root)).toBe(size);
      expect(allCells(root)).toHaveLength(size * size);
      expect(hintedCells(root)).toEqual([]);
      // the new board is usable: its own hint marks exactly its own cell
      const next = targetCell(expectedHint(root));
      pressHint(root);
      expect(hintedCells(root)).toEqual([next]);
    });
  }

  it('«Скинути» removes the marker and empties the hint-filled cell', () => {
    const { root, x } = pageWithHint();

    pressReset(root);
    expect(dialogIsOpen(root), 'a hint-filled cell is an entry: asked first').toBe(true);
    expect(hintedCells(root), 'the marker stays until the action is performed').toEqual([x]);
    confirmYes(root);

    expect(cellText(root, x[0], x[1])).toBe('');
    expect(hintedCells(root)).toEqual([]);
  });
});

describe('@trace FR-66 actions that change no cell keep the marker', () => {
  it('Click on a given cell keeps the marker: once, and again twice more', () => {
    const { root, x } = pageWithHint();
    const digit = cellText(root, x[0], x[1]);
    expect(isGivenCell(root, 3, 1)).toBe(true);
    const givenText = cellText(root, 3, 1);

    clickCell(root, 3, 1);
    expect(hintedCells(root)).toEqual([x]);
    expect(cellText(root, 3, 1)).toBe(givenText);

    clickCell(root, 3, 1, 2);
    expect(hintedCells(root)).toEqual([x]);
    expect(cellText(root, x[0], x[1])).toBe(digit);
    expect(cellEl(root, 3, 1).classList.contains(HINTED)).toBe(false);
  });

  it('A hint with no rule applying keeps the marker (kind none, after PAIR_ROW was hinted)', () => {
    // ISOLATED has no first hint, so it cannot reach "a hint filled X, then a hint with no target": PAIR_ROW does
    // (after (3,3) = 1 no pair, sandwich or count applies, asserted below).
    const { root, x } = pageWithHint(PAIR_ROW);
    const digit = cellText(root, x[0], x[1]);
    const before = snapshot(root);
    const h = expectedHint(root);
    expect(h).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });

    pressHint(root);

    expect(hintMessage(root)).toBe(NO_RULE_SENTENCE); // the press did something: the sentence changed
    expect(hintedCells(root)).toEqual([x]);
    expect(cellText(root, x[0], x[1])).toBe(digit);
    expect(snapshot(root)).toEqual(before); // nothing else changed, the marker included
  });

  it('A hint on a broken board keeps the marker (HINT_BREAKS: the hint fill itself breaks a rule)', () => {
    // A click that breaks a rule would remove the marker (a click on a non-given cell), so the broken board with a marker
    // on it is reached by the fixture whose hint fill completes 0 0 0 in column 3.
    const { root, x } = pageWithHint(HINT_BREAKS);
    expect(x).toEqual([1, 3]);
    const digit = cellText(root, x[0], x[1]);
    expect(violationCells(root).length).toBeGreaterThan(0);
    expect(expectedHint(root)).toEqual({ kind: 'broken', sentence: BROKEN_SENTENCE });
    const before = snapshot(root);

    pressHint(root);

    expect(hintMessage(root)).toBe(BROKEN_SENTENCE);
    expect(hintedCells(root)).toEqual([x]);
    expect(cellText(root, x[0], x[1])).toBe(digit);
    expect(snapshot(root)).toEqual(before);
    // the marker is independent of the violation highlight: the hinted cell is also a violating cell
    expect(cellEl(root, x[0], x[1]).classList.contains('cell-violation')).toBe(true);
  });

  it('Opening and closing the rules panel keeps the marker (the page code does not touch it)', () => {
    const { root, x } = pageWithHint();
    const digit = cellText(root, x[0], x[1]);
    const panel = rulesPanel(root);
    const close = panel.querySelector('button');
    expect(close, 'the panel has a close button').not.toBeNull();
    expect(close?.textContent?.trim()).toBe('Зрозуміло');

    q(root, '[data-action="rules"]').click();
    expect(hintedCells(root)).toEqual([x]);
    (close as HTMLElement).click();

    expect(hintedCells(root)).toEqual([x]);
    expect(cellText(root, x[0], x[1])).toBe(digit);
  });
});

describe('@trace FR-66 a failed generation keeps the marker', () => {
  it('The generator throws for size 8: the board stays 6x6 with the same snapshot and X keeps the marker', () => {
    const { root, x } = pageWithHint(PAIR_ROW); // mountFixture: the injected generator throws for every size but 6
    const before = snapshot(root);
    const sentence = hintMessage(root);

    selectSize(root, 8);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
    expect(hintedCells(root)).toEqual([x]);
    expect(snapshot(root)).toEqual(before);
    expect(hintMessage(root)).toBe(sentence);
  });
});

describe('@trace FR-66 a hint that wins keeps the marker on the filled cell', () => {
  it('The winning hint shows the win message and exactly the filled cell carries the marker', () => {
    const root = mountFixture(WIN_PUZZLE);
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    // premise: exactly one empty cell (4,1), the hint targets it, nothing carries the marker yet (player entries only)
    expect(cellText(root, 4, 1)).toBe('');
    expect(expectedHint(root)).toMatchObject({ kind: 'fill', row: 3, col: 0, value: 1 });
    expect(hintedCells(root)).toEqual([]);
    expect(winMessage(root)).toBe('');

    pressHint(root);

    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(hintedCells(root)).toEqual([[4, 1]]);
    expect(cellText(root, 4, 1)).toBe('1');
  });
});

describe('@trace FR-66 two mounts are independent', () => {
  it('A hint on the first page leaves the second page without a marker', () => {
    const first = mountFixture(PAIR_ROW);
    const second = mountFixture(PAIR_ROW);
    expectPageStructure(second);

    pressHint(first);

    expect(hintedCells(first)).toEqual([[3, 3]]);
    expect(hintedCells(second)).toEqual([]);
    expect(allCells(second).filter((c) => c.classList.contains(HINTED))).toEqual([]);
    // and the other way round: a click on the second page does not remove the first page's marker
    clickCell(second, 1, 1);
    expect(hintedCells(first)).toEqual([[3, 3]]);
  });
});

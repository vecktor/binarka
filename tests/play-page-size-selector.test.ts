// Play page: the grid size selector (FR-43). Scenarios of the delta spec openspec/changes/add-size-selector/specs/
// play-page/spec.md ("Grid size selector"). The selector is driven like the spec says: set select.value and dispatch a
// bubbling `change` for a valid size; for an ignored value override `value` on the element (changeWithReportedValue).
// Every size change runs inside a window 'error' listener (a no-throw check on dispatchEvent is vacuous).
// NEVER enumerate the 8x8 grids (4,111,116): 8x8 fixtures carry a hand-written solution (tests/helpers/play-page.ts).
import { describe, expect, it } from 'vitest';
import { generate, hint } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  DIRTY_8_COL,
  DIRTY_8_ROW,
  PAIR_4,
  PAIR_8,
  PAIR_ROW,
  WIN_4,
  WIN_8,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  boardSize,
  bySize,
  cellEl,
  cellText,
  checkerCells,
  changeWithReportedValue,
  clickCell,
  clickUntil,
  expectPageStructure,
  fillFrom,
  generateSpy,
  generatorBySize,
  hintMessage,
  installPageLifecycle,
  mountPage,
  pressHint,
  pressNew,
  q,
  rawGenerateSpy,
  readBoard,
  seedQueue,
  selectSize,
  sizeSelect,
  snapshot,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

/** The texts of every cell of the board shown, row-major. */
function cellTexts(root: HTMLElement): string[] {
  const n = boardSize(root);
  const out: string[] = [];
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) out.push(cellText(root, r, c));
  return out;
}

/** Every (row, col) pair 1..n appears exactly once among the cells (and there are n*n cells). */
function expectCellGrid(root: HTMLElement, n: number): void {
  const cells = allCells(root);
  expect(cells).toHaveLength(n * n);
  const pairs = cells.map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);
  expect(new Set(pairs).size).toBe(n * n);
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) expect(pairs).toContain(`${r},${c}`);
}

/**
 * The 6x6 board "with player entries, a hint sentence shown and some cells with cell-violation" of the scenarios: PAIR_ROW,
 * a player 0 at (1,1), the third 0 at (3,3) (0 0 0 in row 3), then the hint button (the engine answers `broken`).
 */
function playedBoard(root: HTMLElement): void {
  expectPageStructure(root);
  clickCell(root, 1, 1);
  clickCell(root, 3, 3);
  pressHint(root);
  // premises, so that "unchanged" below is not about an empty board
  expect(cellText(root, 1, 1)).toBe('0');
  expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);
  expect(hintMessage(root)).not.toBe('');
}

describe('@trace FR-43 the size selector is offered and 6 is selected at mount', () => {
  it('Selector options and default: a select with the options 4, 6, 8 labelled «Поле 4×4», «Поле 6×6», «Поле 8×8»', () => {
    const root = mountPage({ seedSource: () => 1, generate: generatorBySize({ 6: BLANK }) });
    const select = sizeSelect(root);
    const options = Array.from(select.options);
    expect(options.map((o) => o.value)).toEqual(['4', '6', '8']);
    expect(options.map((o) => o.textContent)).toEqual(['Поле 4×4', 'Поле 6×6', 'Поле 8×8']);
    expect(options.filter((o) => o.selected).map((o) => o.value)).toEqual(['6']);
    expect(select.value).toBe('6');
    expect(select.selectedIndex).toBe(1);
    expectPageStructure(root); // and the 6x6 board is shown
  });

  it('Selector options and default with the real engine generator', () => {
    const root = mountPage({ seedSource: () => 1 });
    expect(Array.from(sizeSelect(root).options).map((o) => o.value)).toEqual(['4', '6', '8']);
    expect(sizeSelect(root).value).toBe('6');
    expectPageStructure(root);
  });
});

describe('@trace FR-43 choosing a size starts a new puzzle of that size', () => {
  it('Choose 4x4: real generator, second seed, 16 cells with data-row/data-col 1..4, givens equal generate(4, 2)', () => {
    const seeds = seedQueue([1, 2]);
    const root = mountPage({ seedSource: seeds.source });
    expectPageStructure(root);
    const expected = generate(4, 2);
    // premise: the seed matters (seed 1 would give another board), so a page that reused seed 1 fails below
    expect(generate(4, 1).givens).not.toEqual(expected.givens);
    expect(seeds.calls()).toBe(1);

    selectSize(root, 4);

    expect(seeds.calls()).toBe(2);
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('4');
    expectCellGrid(root, 4);
    let givenCount = 0;
    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 4; c++) {
        const g = expected.givens[r - 1]?.[c - 1] ?? null;
        expect(cellEl(root, r, c).getAttribute('data-given'), `given flag ${r},${c}`).toBe(g === null ? 'false' : 'true');
        expect(cellText(root, r, c), `text ${r},${c}`).toBe(g === null ? '' : String(g));
        if (g !== null) givenCount += 1;
      }
    }
    expect(givenCount).toBeGreaterThan(0);
    expect(sizeSelect(root).value).toBe('4');
  });

  it('Choose 8x8 after play: 64 empty-or-given cells, hint message empty, highlights only for the new givens', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: generateSpy(bySize({ 6: PAIR_ROW, 8: DIRTY_8_ROW })).generate,
    });
    playedBoard(root);
    const oldCells = allCells(root);

    selectSize(root, 8);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expectCellGrid(root, 8);
    expect(oldCells.every((c) => !root.contains(c)), 'no cell of the old board remains in the page').toBe(true);
    // no player entries: a non-given cell shows empty text, the three givens show 0
    for (const el of allCells(root)) {
      if (el.getAttribute('data-given') === 'true') expect(el.textContent).toBe('0');
      else expect(el.textContent).toBe('');
    }
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'true')).toHaveLength(3);
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
    // the new puzzle's givens break `three` in row 8 (premise: the expectation is not the empty set)
    expect(checkerCells(DIRTY_8_ROW.givens)).toEqual([[8, 1], [8, 2], [8, 3]]);
    expect(violationCells(root)).toEqual(checkerCells(DIRTY_8_ROW.givens));
    expect(sizeSelect(root).value).toBe('8');
  });

  it('Choose 8x8 after a win: the win message is cleared and the board is 8x8 with 64 cells', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2]).source,
      generate: generateSpy(bySize({ 6: WIN_PUZZLE, 8: BLANK_8 })).generate,
    });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(violationCells(root)).toEqual([]);

    selectSize(root, 8);

    expect(q(root, '[data-message="win"]').textContent).toBe('');
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('8');
    expectCellGrid(root, 8);
    expect(violationCells(root)).toEqual([]);
  });

  it('Going back to 6x6: after 8x8 the board is 6x6 with 36 cells and the selector shows 6', () => {
    const root = mountPage({
      seedSource: seedQueue([1, 2, 3]).source,
      generate: generateSpy(bySize({ 6: PAIR_ROW, 8: BLANK_8 })).generate,
    });

    selectSize(root, 8);
    expect(boardSize(root)).toBe(8);
    expect(allCells(root)).toHaveLength(64);
    expect(sizeSelect(root).value).toBe('8');

    selectSize(root, 6);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expectCellGrid(root, 6);
    expect(sizeSelect(root).value).toBe('6');
    expect(sizeSelect(root).selectedIndex).toBe(1);
    expect(cellText(root, 3, 1)).toBe('0'); // the 6x6 fixture of the third generation attempt
  });

  it('A change takes exactly one seed and passes the chosen size: (6, 1), (4, 2), (8, 3) and three seed-source calls', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: BLANK, 4: BLANK_4, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(spy.calls).toEqual([{ size: 6, seed: 1 }]);

    selectSize(root, 4);
    expect(boardSize(root)).toBe(4);
    selectSize(root, 8);
    expect(boardSize(root)).toBe(8);

    expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 4, seed: 2 }, { size: 8, seed: 3 }]);
    expect(seeds.calls()).toBe(3);
  });

  it('The choice is not remembered: a new mount starts at 6 and nothing is written to localStorage or sessionStorage', () => {
    localStorage.clear();
    sessionStorage.clear();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    const first = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: BLANK_8 })).generate });
    selectSize(first, 8);
    expect(boardSize(first)).toBe(8);

    const second = mountPage({ seedSource: () => 3, generate: generatorBySize({ 6: BLANK, 8: BLANK_8 }) });

    expect(sizeSelect(second).value).toBe('6');
    expect(q(second, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(second)).toHaveLength(36);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('@trace FR-43 a value outside the offered sizes is ignored', () => {
  const IGNORED = ['5', '10', 'abc', '6.0', ' 6', '06', '0x6', ''];

  it('Value outside the offered sizes is ignored: 5, 10, abc, 6.0, " 6", 06, 0x6 and empty, each tried in turn', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    playedBoard(root);
    const before = snapshot(root);
    const hintBefore = hintMessage(root);
    const winBefore = winMessage(root);
    const seedCalls = seeds.calls();
    const generateCalls = spy.calls.length;
    expect(seedCalls).toBe(1);

    for (const value of IGNORED) {
      const result = changeWithReportedValue(root, value);

      // (changeWithReportedValue already asserted that the window 'error' listener recorded nothing)
      expect(result.selectedIndex, `selectedIndex right after the change for ${JSON.stringify(value)}`).toBe(1);
      expect(result.option1Selected, `options[1].selected for ${JSON.stringify(value)}`).toBe(true);
      expect(result.valueAfter, `value once the override is removed, for ${JSON.stringify(value)}`).toBe('6');
      expect(q(root, '[data-board]').getAttribute('data-size'), `data-size for ${JSON.stringify(value)}`).toBe('6');
      expect(snapshot(root), `cells (text and cell-violation) for ${JSON.stringify(value)}`).toEqual(before);
      expect(hintMessage(root), `hint message for ${JSON.stringify(value)}`).toBe(hintBefore);
      expect(winMessage(root), `win message for ${JSON.stringify(value)}`).toBe(winBefore);
      expect(seeds.calls(), `seed source calls for ${JSON.stringify(value)}`).toBe(seedCalls);
      expect(spy.calls, `generator calls for ${JSON.stringify(value)}`).toHaveLength(generateCalls);
    }
  });

  it('Value outside the offered sizes with no option selected: selectedIndex -1 is repaired to the option 6', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    playedBoard(root);
    const before = snapshot(root);
    const hintBefore = hintMessage(root);

    const result = changeWithReportedValue(root, null);

    expect(result.selectedIndex).toBe(1);
    expect(result.option1Selected).toBe(true);
    expect(result.valueAfter).toBe('6');
    expect(sizeSelect(root).value).toBe('6');
    expect(snapshot(root)).toEqual(before);
    expect(hintMessage(root)).toBe(hintBefore);
    expect(winMessage(root)).toBe('');
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(seeds.calls()).toBe(1);
    expect(spy.calls).toHaveLength(1);
  });

  it('an ignored value leaves the page working: a valid choice afterwards is accepted with the next seed', () => {
    const seeds = seedQueue([1, 2]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW, 8: BLANK_8 }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    changeWithReportedValue(root, '5');
    changeWithReportedValue(root, null);

    selectSize(root, 8);

    expect(boardSize(root)).toBe(8);
    expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 8, seed: 2 }]);
    expect(seeds.calls()).toBe(2);
  });
});

describe('@trace FR-43 a generator failure keeps the previous board', () => {
  it('A generator error keeps the previous board: same cells, messages, highlights; selector restored; one seed taken', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = rawGenerateSpy((_i, size) => {
      if (size === 8) throw new Error('generator failed for size 8');
      return PAIR_ROW;
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    playedBoard(root);
    const before = snapshot(root);
    const hintBefore = hintMessage(root);
    const seedCalls = seeds.calls();

    selectSize(root, 8); // (selectSize asserts that the window 'error' listener recorded nothing)

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
    expect(snapshot(root)).toEqual(before);
    expect(hintMessage(root)).toBe(hintBefore);
    expect(winMessage(root)).toBe('');
    expect(sizeSelect(root).value).toBe('6');
    expect(sizeSelect(root).selectedIndex).toBe(1);
    expect(seeds.calls() - seedCalls, 'one seed for the failed attempt').toBe(1);
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 8, seed: 2 });

    // the previous size is kept: the new puzzle button asks for size 6 again
    pressNew(root);
    expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 6, seed: 3 });
    expect(boardSize(root)).toBe(6);
    expect(sizeSelect(root).value).toBe('6');
  });

  const WRONG_SIZE: Array<{ name: string; puzzle: Puzzle }> = [
    { name: 'a 6x6 fixture', puzzle: PAIR_ROW },
    { name: '8 rows with the last row 7 cells long', puzzle: { ...BLANK_8, givens: BLANK_8.givens.map((r, i) => (i === 7 ? r.slice(0, 7) : r)) } },
    { name: '8 rows with the first row 9 cells long', puzzle: { ...BLANK_8, givens: BLANK_8.givens.map((r, i) => (i === 0 ? [...r, null] : r)) } },
    { name: '7 rows of 8 cells', puzzle: { ...BLANK_8, givens: BLANK_8.givens.slice(0, 7) } },
  ];

  for (const { name, puzzle } of WRONG_SIZE) {
    it(`A generator result of the wrong size keeps the previous board (${name} for size 8)`, () => {
      const seeds = seedQueue([1, 2, 3]);
      const spy = rawGenerateSpy((_i, size) => (size === 8 ? puzzle : PAIR_ROW));
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      playedBoard(root);
      const before = snapshot(root);
      const hintBefore = hintMessage(root);

      selectSize(root, 8);

      expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 8, seed: 2 });
      expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
      expect(allCells(root)).toHaveLength(36);
      expect(snapshot(root)).toEqual(before);
      expect(hintMessage(root)).toBe(hintBefore);
      expect(winMessage(root)).toBe('');
      expect(sizeSelect(root).value).toBe('6');
      expect(sizeSelect(root).selectedIndex).toBe(1);

      pressNew(root); // the previous size 6 is still the current one
      expect(spy.calls[spy.calls.length - 1]).toEqual({ size: 6, seed: 3 });
    });
  }

  it('a failed change keeps the win message too', () => {
    const spy = rawGenerateSpy((_i, size) => {
      if (size === 4) throw new Error('generator failed for size 4');
      return WIN_PUZZLE;
    });
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE));
    expect(winMessage(root)).toBe(WIN_MESSAGE);

    selectSize(root, 4);

    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(boardSize(root)).toBe(6);
    expect(sizeSelect(root).value).toBe('6');
  });
});

describe('@trace FR-43 hint and win work at the chosen size', () => {
  it('Hint at 4x4: the pair fill lands on (2,3), nothing else changes, the engine sentence is shown', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 4: PAIR_4 })).generate });
    selectSize(root, 4);
    expectCellGrid(root, 4);
    const h = hint(readBoard(root));
    expect(h).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 1, rule: 'pair' });
    expect(cellText(root, 2, 3)).toBe('');
    const before = cellTexts(root);

    pressHint(root);

    expect(cellText(root, 2, 3)).toBe('1');
    const after = cellTexts(root);
    expect(after.flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([1 * 4 + 2]);
    expect(hintMessage(root)).toBe(h.sentence);
    expect(h.sentence).not.toBe('');
  });

  it('Hint at 8x8: the pair fill lands on (8,6), nothing else changes, the engine sentence is shown', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: PAIR_8 })).generate });
    selectSize(root, 8);
    expectCellGrid(root, 8);
    const h = hint(readBoard(root));
    expect(h).toMatchObject({ kind: 'fill', row: 7, col: 5, value: 1, rule: 'pair' });
    expect(cellText(root, 8, 6)).toBe('');
    const before = cellTexts(root);

    pressHint(root);

    expect(cellText(root, 8, 6)).toBe('1');
    const after = cellTexts(root);
    expect(after.flatMap((t, i) => (t !== before[i] ? [i] : []))).toEqual([7 * 8 + 5]);
    expect(hintMessage(root)).toBe(h.sentence);
    expect(h.sentence).not.toBe('');
  });

  it('Win at 4x4: clicking the one open cell until it shows the solution digit shows the exact win message', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 4: WIN_4 })).generate });
    selectSize(root, 4);
    expect(boardSize(root)).toBe(4);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false')).toHaveLength(1);
    expect(cellEl(root, 4, 4).getAttribute('data-given')).toBe('false');
    expect(winMessage(root)).toBe('');

    clickCell(root, 4, 4); // 0: row 4 reads 1 0 0 0, not solved
    expect(winMessage(root)).toBe('');
    clickUntil(root, 4, 4, '1');

    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(winMessage(root)).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x27)}язано!`);
  });

  it('Win at 8x8: clicking the open cell (8,8) until it shows the solution digit shows the exact win message', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: WIN_8 })).generate });
    selectSize(root, 8);
    expect(boardSize(root)).toBe(8);
    expect(allCells(root).filter((c) => c.getAttribute('data-given') === 'false')).toHaveLength(1);
    expect(cellEl(root, 8, 8).getAttribute('data-given')).toBe('false');
    expect(winMessage(root)).toBe('');

    clickCell(root, 8, 8, 2); // 1 is not the solution digit (0): row 8 and column 8 break, not solved
    expect(cellText(root, 8, 8)).toBe('1');
    expect(winMessage(root)).toBe('');
    clickUntil(root, 8, 8, '0');

    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(winMessage(root)).toBe(`Вітаємо, головоломку розв${String.fromCodePoint(0x27)}язано!`);
  });
});

describe('@trace FR-43 violations in the givens of a new board show at once', () => {
  it('Violations in the givens of a new 8x8 board show at once: exactly (8,1), (8,2), (8,3)', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: DIRTY_8_ROW })).generate });
    expect(violationCells(root)).toEqual([]); // the 6x6 board is clean (premise)

    selectSize(root, 8);

    expect(boardSize(root)).toBe(8);
    expect(cellText(root, 8, 1) + cellText(root, 8, 2) + cellText(root, 8, 3)).toBe('000');
    expect(violationCells(root)).toEqual([[8, 1], [8, 2], [8, 3]]);
  });

  it('A count violation in the last column of a new 8x8 board shows at once: all eight cells of column 8, none outside', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generateSpy(bySize({ 6: BLANK, 8: DIRTY_8_COL })).generate });
    expect(violationCells(root)).toEqual([]);

    selectSize(root, 8);

    expect(boardSize(root)).toBe(8);
    expect([1, 2, 4, 6, 7].map((r) => cellText(root, r, 8)).join('')).toBe('11111');
    expect(violationCells(root)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((r): [number, number] => [r, 8]));
    for (const el of allCells(root)) {
      expect(el.classList.contains('cell-violation'), `${el.getAttribute('data-row')},${el.getAttribute('data-col')}`).toBe(
        el.getAttribute('data-col') === '8',
      );
    }
  });
});

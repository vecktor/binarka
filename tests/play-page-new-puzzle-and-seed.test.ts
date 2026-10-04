// Play page: the new puzzle button (FR-42) and the seed requirement (FR-51: chosen outside the engine, injectable,
// never shown, default source in 0..2^31-1 with no two consecutive equal). Scenarios of play-page/spec.md.
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import {
  BLANK,
  DIRTY_GIVENS,
  PAIR_ROW,
  WIN_MESSAGE,
  WIN_PUZZLE,
  allCells,
  cellEl,
  cellText,
  checkerCells,
  clickCell,
  collectEverything,
  expectPageStructure,
  fillFrom,
  generateSpy,
  hintMessage,
  installPageLifecycle,
  mountOn,
  mountPage,
  pressHint,
  pressNew,
  q,
  readBoard,
  readGivenFlags,
  seedQueue,
  snapshot,
  solutionGrid,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace FR-42 the new puzzle button replaces the board', () => {
  it('New puzzle after play: a fresh generator(6, 7) board, no entries, both messages cleared', () => {
    const spy = generateSpy((i, size, seed) => (i === 0 ? WIN_PUZZLE : generate(size, seed)));
    const seeds = seedQueue([1, 7]);
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expectPageStructure(root);
    // play: fill all but (4,1), then the hint fills it, which solves the board: hint sentence and win message both shown
    fillFrom(root, WIN_PUZZLE, solutionGrid(WIN_PUZZLE), [[4, 1]]);
    pressHint(root);
    expect(hintMessage(root)).not.toBe('');
    expect(winMessage(root)).toBe(WIN_MESSAGE);
    expect(readBoard(root).flat().filter((c) => c !== null).length).toBeGreaterThan(10);
    expect(seeds.calls()).toBe(1);

    pressNew(root);

    const expected = generate(6, 7);
    expect(spy.calls).toEqual([{ size: 6, seed: 1 }, { size: 6, seed: 7 }]);
    expect(seeds.calls()).toBe(2);
    expect(allCells(root)).toHaveLength(36);
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const g = expected.givens[r - 1]?.[c - 1] ?? null;
        expect(cellEl(root, r, c).getAttribute('data-given'), `given flag ${r},${c}`).toBe(g === null ? 'false' : 'true');
        // player entries are gone: a non-given cell is empty, a given shows the generator's digit
        expect(cellText(root, r, c), `text ${r},${c}`).toBe(g === null ? '' : String(g));
      }
    }
    expect(q(root, '[data-message="hint"]').textContent).toBe('');
    expect(q(root, '[data-message="win"]').textContent).toBe('');
  });

  it('New puzzle is always 6x6', () => {
    const spy = generateSpy(() => BLANK);
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');

    pressNew(root);

    expect(q(root, '[data-board]').getAttribute('data-size')).toBe('6');
    expect(allCells(root)).toHaveLength(36);
    expect(spy.calls.map((c) => c.size)).toEqual([6, 6]);
  });

  it('New puzzle mid-game removes highlights: a clean new puzzle shows none', () => {
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : WIN_PUZZLE));
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    clickCell(root, 3, 3);
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);

    pressNew(root);

    expect(allCells(root)).toHaveLength(36);
    expect(cellText(root, 1, 3)).toBe('0'); // the new puzzle (WIN_PUZZLE) is on the board
    expect(violationCells(root)).toEqual(checkerCells(WIN_PUZZLE.givens));
    expect(violationCells(root)).toEqual([]);
  });

  it('New puzzle mid-game: highlights follow the new puzzle givens only (old ones are gone)', () => {
    const spy = generateSpy((i) => (i === 0 ? PAIR_ROW : DIRTY_GIVENS));
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: spy.generate });
    clickCell(root, 3, 3);
    expect(violationCells(root)).toEqual([[3, 1], [3, 2], [3, 3]]);

    pressNew(root);

    // the new puzzle's givens put 0 0 0 in row 1; nothing of the old highlight in row 3 may remain
    expect(checkerCells(DIRTY_GIVENS.givens)).toEqual([[1, 1], [1, 2], [1, 3]]);
    expect(cellText(root, 1, 1)).toBe('0');
    expect(violationCells(root)).toEqual([[1, 1], [1, 2], [1, 3]]);
  });

  it('Each press uses a new seed: 1, 2, 3 in this order, one seed-source call per puzzle', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = generateSpy(() => BLANK);
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(seeds.calls()).toBe(1);

    // other actions never draw a seed
    clickCell(root, 1, 1);
    pressHint(root);
    expect(seeds.calls()).toBe(1);

    pressNew(root);
    pressNew(root);

    expect(spy.calls.map((c) => c.seed)).toEqual([1, 2, 3]);
    expect(seeds.calls()).toBe(3);
  });
});

describe('@trace FR-51 the seed is chosen outside the engine, injectable and not shown', () => {
  it('Injected seed gives a reproducible page: two pages with seed 42 and the real generator are identical', () => {
    const a = mountPage({ seedSource: () => 42 });
    const b = mountPage({ seedSource: () => 42 });
    expectPageStructure(a);
    expectPageStructure(b);
    expect(snapshot(a)).toEqual(snapshot(b));
    expect(readBoard(a)).toEqual(readBoard(b));
    expect(readGivenFlags(a)).toEqual(readGivenFlags(b));
    // and it is the engine's puzzle for that seed
    expect(readBoard(a)).toEqual(generate(6, 42).givens);
  });

  it('Default seed source gives new seeds in its domain: 10 seeds, integers 0..2147483647, no equal neighbours', () => {
    const spy = generateSpy(() => BLANK);
    expect(() => {
      const root = mountPage({ generate: spy.generate });
      for (let i = 0; i < 9; i++) pressNew(root);
    }).not.toThrow();

    const seeds = spy.calls.map((c) => c.seed);
    expect(seeds).toHaveLength(10);
    for (const seed of seeds) {
      expect(Number.isInteger(seed), `seed ${seed} is an integer`).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(2147483647);
    }
    for (let i = 1; i < seeds.length; i++) expect(seeds[i], `seed ${i} differs from seed ${i - 1}`).not.toBe(seeds[i - 1]);
    expect(spy.calls.every((c) => c.size === 6)).toBe(true);
  });

  it('Default seed source with the real generator: a 6x6 board is rendered and no error is thrown', () => {
    let root: HTMLElement | undefined;
    expect(() => {
      root = mountPage();
    }).not.toThrow();
    if (root === undefined) throw new Error('mount did not return');
    expectPageStructure(root);
    expect(allCells(root)).toHaveLength(36);
    expect(allCells(root).some((c) => c.getAttribute('data-given') === 'true')).toBe(true);
  });

  it('Seed is not shown: no text node, title or attribute value contains the seed in any form', () => {
    const seed = 987654;
    const formatted = Intl.NumberFormat('uk-UA').format(seed);
    const split = /9\D?8\D?7\D?6\D?5\D?4/;
    const root = mountPage({ seedSource: () => seed });
    expectPageStructure(root);

    const check = (): void => {
      const strings = collectEverything(root);
      // the collection is not empty and does include the structural attributes and the button labels
      expect(strings.length).toBeGreaterThan(36);
      expect(strings).toContain('6');
      for (const s of strings) {
        expect(s.includes('987654'), `"${s}" contains 987654`).toBe(false);
        expect(s.includes(formatted), `"${s}" contains ${formatted}`).toBe(false);
        expect(split.test(s), `"${s}" matches the split-seed pattern`).toBe(false);
      }
    };
    check();
    // the seed stays hidden after play and after a new puzzle (the injected source returns the same seed again)
    pressHint(root);
    clickCell(root, 1, 1);
    pressNew(root);
    check();
  });

  it('Seed is not shown: the same holds on a fixture board and on a root that held other content', () => {
    const root = document.createElement('div');
    root.textContent = 'previous';
    mountOn(root, { seedSource: () => 987654, generate: () => WIN_PUZZLE });
    expectPageStructure(root);
    for (const s of collectEverything(root)) {
      expect(s.includes('987654')).toBe(false);
      expect(/9\D?8\D?7\D?6\D?5\D?4/.test(s)).toBe(false);
    }
  });
});

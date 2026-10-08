// Play page: board rendering (FR-31) and given-cell marking (FR-32). Scenarios of openspec/specs/play-page/spec.md.
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import {
  WIN_PUZZLE,
  PAIR_ROW,
  BLANK,
  allCells,
  cellEl,
  cellText,
  clickCell,
  expectPageStructure,
  expectTabStop,
  generateSpy,
  installPageLifecycle,
  mountFixture,
  mountOn,
  mountPage,
  q,
  seedQueue,
  selectSize,
  snapshot,
  tabStopCells,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace FR-31 the page renders a 6x6 board from the generator', () => {
  it('Default board is 6x6: data-size 6, exactly 36 cells, every (row, col) pair 1..6 once', () => {
    const root = mountPage({ seedSource: () => 1 });
    expectPageStructure(root);
    const board = q(root, '[data-board]');
    expect(board.getAttribute('data-size')).toBe('6');
    const cells = Array.from(board.querySelectorAll('[data-cell]'));
    expect(cells).toHaveLength(36);
    const pairs = cells.map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);
    expect(new Set(pairs).size).toBe(36);
    for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) expect(pairs).toContain(`${r},${c}`);
  });

  it('Board content comes from the generator: given flags and digits equal generate(6, 42)', () => {
    const root = mountPage({ seedSource: () => 42 });
    const expected = generate(6, 42);
    expect(allCells(root)).toHaveLength(36);
    let givenCount = 0;
    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const g = expected.givens[r - 1]?.[c - 1];
        const el = cellEl(root, r, c);
        if (g === null || g === undefined) {
          expect(el.getAttribute('data-given'), `cell ${r},${c}`).toBe('false');
          expect(el.textContent, `cell ${r},${c}`).toBe('');
        } else {
          givenCount += 1;
          expect(el.getAttribute('data-given'), `cell ${r},${c}`).toBe('true');
          expect(el.textContent, `cell ${r},${c}`).toBe(String(g));
        }
      }
    }
    expect(givenCount).toBeGreaterThan(0);
  });

  it('Board follows the chosen size: with the real generator, selecting 8x8 gives data-size 8 and 64 cells (rows and columns 1..8)', () => {
    const seeds = seedQueue([1, 2]);
    const root = mountPage({ seedSource: seeds.source });
    expectPageStructure(root);

    selectSize(root, 8);

    const board = q(root, '[data-board]');
    expect(board.getAttribute('data-size')).toBe('8');
    const cells = Array.from(board.querySelectorAll('[data-cell]'));
    expect(cells).toHaveLength(64);
    const pairs = cells.map((c) => `${c.getAttribute('data-row')},${c.getAttribute('data-col')}`);
    expect(new Set(pairs).size).toBe(64);
    for (let r = 1; r <= 8; r++) for (let c = 1; c <= 8; c++) expect(pairs).toContain(`${r},${c}`);
    // and the content is the engine puzzle for size 8 and the second seed
    const expected = generate(8, 2);
    for (let r = 1; r <= 8; r++) {
      for (let c = 1; c <= 8; c++) {
        const g = expected.givens[r - 1]?.[c - 1] ?? null;
        expect(cellEl(root, r, c).getAttribute('data-given'), `given flag ${r},${c}`).toBe(g === null ? 'false' : 'true');
        expect(cellText(root, r, c), `text ${r},${c}`).toBe(g === null ? '' : String(g));
      }
    }
  });

  it('the generator is called with size 6 and the seed from the seed source, once per puzzle', () => {
    const spy = generateSpy(() => PAIR_ROW);
    const seeds = seedQueue([5]);
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(spy.calls).toEqual([{ size: 6, seed: 5 }]);
    expect(seeds.calls()).toBe(1);
    // the board is the generator's puzzle: the two zero givens of PAIR_ROW at row 3, columns 1 and 2
    expect(cellText(root, 3, 1)).toBe('0');
    expect(cellText(root, 3, 2)).toBe('0');
    expect(cellEl(root, 3, 1).getAttribute('data-given')).toBe('true');
    expect(cellEl(root, 3, 3).getAttribute('data-given')).toBe('false');
  });

  it('mounting is synchronous and replaces the previous content of the root', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p id="old">old content</p>';
    mountOn(root, { seedSource: () => 1, generate: () => BLANK });
    expect(root.querySelector('#old')).toBeNull();
    expectPageStructure(root);
    mountOn(root, { seedSource: () => 2, generate: () => BLANK });
    expect(root.querySelectorAll('[data-board]')).toHaveLength(1);
    expect(root.querySelectorAll('[data-cell]')).toHaveLength(36);
  });

  it('two mounts on two different roots are independent', () => {
    const a = mountPage({ seedSource: () => 1, generate: () => BLANK });
    const b = mountPage({ seedSource: () => 1, generate: () => BLANK });
    const bBefore = snapshot(b);
    clickCell(a, 1, 1);
    expect(cellText(a, 1, 1)).toBe('0');
    expect(snapshot(b)).toEqual(bBefore);
    expect(cellText(b, 1, 1)).toBe('');
  });
});

// Slice 6 (add-page-accessibility), DELIBERATE CHANGE: a new test next to the two-mounts test above (that one and
// "mounting replaces the previous content of the root" are unchanged and must stay green).
describe('@trace FR-59 @trace FR-61 two mounts keep separate Tab stops and have no duplicate ids', () => {
  it('@trace FR-59 @trace FR-61 two mounts on two roots keep separate Tab stops and have no duplicate ids', () => {
    const a = mountPage({ seedSource: () => 1, generate: () => BLANK });
    const b = mountPage({ seedSource: () => 1, generate: () => BLANK });
    expect(tabStopCells(a)).toHaveLength(1);
    expect(tabStopCells(b)).toHaveLength(1);
    clickCell(a, 3, 4);
    expectTabStop(a, 3, 4); // a click moves only A's Tab stop
    expectTabStop(b, 1, 1);
    clickCell(b, 5, 2);
    expectTabStop(a, 3, 4);
    expectTabStop(b, 5, 2);
    expect(a.querySelectorAll('[id]')).toHaveLength(0);
    expect(b.querySelectorAll('[id]')).toHaveLength(0);
    expect(document.querySelectorAll('[id]')).toHaveLength(0);
  });
});

describe('@trace FR-32 given cells are marked distinctly', () => {
  const sources: [string, () => HTMLElement][] = [
    ['fixture puzzle', () => mountFixture(WIN_PUZZLE)],
    ['generator output for seed 42', () => mountPage({ seedSource: () => 42 })],
  ];

  for (const [name, mount] of sources) {
    it(`Givens and player cells are distinguishable (${name})`, () => {
      const root = mount();
      const cells = allCells(root);
      expect(cells).toHaveLength(36);
      const given = cells.filter((c) => c.getAttribute('data-given') === 'true');
      const player = cells.filter((c) => c.getAttribute('data-given') === 'false');
      // both kinds exist and data-given is always one of the two literals
      expect(given.length).toBeGreaterThan(0);
      expect(player.length).toBeGreaterThan(0);
      expect(given.length + player.length).toBe(36);
      for (const c of given) expect(c.classList.contains('cell-given')).toBe(true);
      for (const c of player) expect(c.classList.contains('cell-given')).toBe(false);
      // a cell showing empty text always has data-given false; a given always shows a digit
      for (const c of cells) {
        if (c.textContent === '') expect(c.getAttribute('data-given')).toBe('false');
      }
      for (const c of given) expect(['0', '1']).toContain(c.textContent);
    });
  }

  it('the fixture marks exactly its ten givens, each with the cell-given class', () => {
    const root = mountFixture(WIN_PUZZLE);
    const marked = allCells(root).filter((c) => c.classList.contains('cell-given'));
    expect(marked).toHaveLength(10);
    // spot checks against the fixture: (1,3)=0 given, (2,5)=1 given, (1,1) player cell
    expect(cellEl(root, 1, 3).textContent).toBe('0');
    expect(cellEl(root, 2, 5).textContent).toBe('1');
    expect(cellEl(root, 1, 1).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 1, 1).classList.contains('cell-given')).toBe(false);
  });
});

// Play page: the capture-only board (FR-119, A-56). Scenarios of «Capture-only board» in
// openspec/changes/add-capture-board/specs/play-page/spec.md. Written FIRST (red): the page does not read
// window.__binarkaCaptureBoard yet, so a valid value is ignored and the mount takes a seed and generates.
//
// @trace FR-119
// @trace FR-88
//
// Boards are built here with the engine (generate(6, 5, 1), generate(4, 3, 1), generate(8, 7, 1)), never from design/v0/lib/boards.json:
// that file is covered by tests/capture-fixtures.test.ts. Entries are taken from the engine solution, except where a scenario needs a
// violation.
//
// Every invalid case first mounts its VALID base and asserts that it is accepted (no seed taken), then mounts the one-defect value and
// asserts the fallback. Without that control an invalid case passes on a page that ignores the global altogether (as the page does today),
// which would prove nothing. The absent-value test needs no control: it describes behaviour that must not change, and it is green now.
//
// Exact texts are literals from tests/helpers/play-page.ts; this file never imports src/ui/strings.ts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { countSolutions, findViolations, generate } from '../src/engine/index';
import type { Cell, Grid } from '../src/engine/index';
import {
  LANGUAGE_KEY,
  PAIR_ROW,
  THEME_KEY,
  WIN_MESSAGE,
  boardSize,
  bySize,
  checkedLevel,
  checkedSize,
  chooseLevel,
  expectedCellLabel,
  expectedHint,
  generateSpy,
  allCells,
  hintMessage,
  hintedCells,
  installPageLifecycle,
  mountPage,
  openSheet,
  pressHint,
  q,
  readBoard,
  readGivenFlags,
  resetBoard,
  seedQueue,
  startNewPuzzle,
  summaryLabel,
  summaryText,
  trackErrors,
  violationCells,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

const KEY = '__binarkaCaptureBoard';
const setCapture = (value: unknown): void => {
  Reflect.set(window, KEY, value);
};
afterEach(() => {
  Reflect.deleteProperty(window, KEY);
});

interface Value {
  size: number;
  level: number;
  givens: Grid;
  entries: Grid;
  hinted?: [number, number];
}

const at = (grid: Grid, r: number, c: number): Cell => {
  const row = grid[r];
  expect.assert(row !== undefined, `premise: row ${r} exists`);
  const cell = row[c];
  expect.assert(cell !== undefined, `premise: cell ${r},${c} exists`);
  return cell;
};

const clone = <T>(value: T): T => structuredClone(value);

/** givens over entries, 0-based, as the page shows the board */
const merged = (v: Value): Grid => v.givens.map((row, r) => row.map((cell, c) => cell ?? at(v.entries, r, c)));

/** A valid capture value from an engine puzzle: entries are the solution digits at the non-given cells where `pick(r, c)` holds. */
function valueOf(size: number, seed: number, level: number, pick: (r: number, c: number) => boolean, shownLevel = level): Value {
  const puzzle = generate(size, seed, level);
  const givens = puzzle.givens.map((row) => [...row]);
  const entries: Grid = givens.map((row, r) => row.map((cell, c): Cell => (cell === null && pick(r, c) ? at(puzzle.solution, r, c) : null)));
  return { size, level: shownLevel, givens, entries };
}

const sixBase = (level = 1): Value => valueOf(6, 5, 1, (r, c) => (r + c) % 3 === 0, level);
const fourBase = (): Value => valueOf(4, 3, 1, (r, c) => (r + c) % 2 === 0);
const eightBase = (level = 3): Value => valueOf(8, 7, 1, (r, c) => (r * 3 + c) % 4 === 0, level);

function withHinted(v: Value): Value {
  const out = clone(v);
  for (let r = 0; r < out.size; r++) {
    for (let c = 0; c < out.size; c++) {
      if (at(out.entries, r, c) !== null) return { ...out, hinted: [r, c] };
    }
  }
  throw new Error('premise: the base holds an entry');
}

/** the solved board as a capture value: every non-given cell is an entry */
function solvedValue(): Value {
  const puzzle = generate(6, 5, 1);
  const givens = puzzle.givens.map((row) => [...row]);
  const entries: Grid = givens.map((row, r) => row.map((cell, c): Cell => (cell === null ? at(puzzle.solution, r, c) : null)));
  return { size: 6, level: 1, givens, entries };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}

interface Mounted {
  root: HTMLElement;
  seeds: ReturnType<typeof seedQueue>;
  spy: ReturnType<typeof generateSpy>;
}

/** Set the global, mount with a counting seed source (first seed 7) and a counting generator that returns PAIR_ROW at size 6. */
function mountWith(value: unknown): Mounted {
  setCapture(value);
  const seeds = seedQueue([7]);
  const spy = generateSpy(bySize({ 6: PAIR_ROW }));
  const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
  return { root, seeds, spy };
}

/** The first lines of every "valid" test: no seed, no generator call. */
function expectNoSeed(m: Mounted): void {
  expect(m.seeds.calls(), 'no seed was taken').toBe(0);
  expect(m.spy.calls, 'the generator was not called').toEqual([]);
}

/** The board shown is exactly the value: givens, entries, empty cells, the labels of FR-70. */
function expectShown(root: HTMLElement, v: Value): void {
  expect(boardSize(root), 'the size of the board shown').toBe(v.size);
  expect(q(root, '[data-board]').getAttribute('aria-label'), 'the label of the board').toBe(`Поле ${v.size}×${v.size}`);
  expect(readBoard(root), 'givens and entries shown, every other cell empty').toEqual(merged(v));
  expect(
    readGivenFlags(root),
    'exactly the givens are given cells',
  ).toEqual(v.givens.map((row) => row.map((cell) => cell !== null)));
  const cells = allCells(root);
  expect(cells.map((cell) => cell.getAttribute('aria-label'))).toEqual(cells.map((cell) => expectedCellLabel(cell)));
}

describe('@trace FR-119 without the value the mount generates as before', () => {
  it('takes exactly one seed and calls the generator once with size 6 and level 1', () => {
    Reflect.deleteProperty(window, KEY);
    const m = (() => {
      const seeds = seedQueue([5]);
      const spy = generateSpy(bySize({ 6: PAIR_ROW }));
      return { seeds, spy, root: mountPage({ seedSource: seeds.source, generate: spy.generate }) };
    })();
    expect(m.seeds.calls()).toBe(1);
    expect(m.spy.calls).toEqual([{ size: 6, seed: 5 }]);
    expect(m.spy.levels).toEqual([1]);
    expect(readBoard(m.root)).toEqual(PAIR_ROW.givens);
    expect(summaryText(m.root)).toBe(summaryLabel(6, 1));
  });
});

describe('@trace FR-119 a valid value is shown without a seed', () => {
  it('a 6x6 value at level 1: no seed, no generator call, the givens, the entries and the empty cells exactly, the summary and the label', () => {
    const value = sixBase();
    const m = mountWith(value);
    expectNoSeed(m);
    expectShown(m.root, value);
    expect(summaryText(m.root)).toBe('6×6 · Розминка');
    expect(summaryText(m.root)).toBe(summaryLabel(6, 1));
    expect(hintMessage(m.root), 'the hint message is empty').toBe('');
    expect(winMessage(m.root), 'the board is not solved: no win message').toBe('');
    expect(violationCells(m.root), 'a board of solution digits has no violation').toEqual([]);
    expect(hintedCells(m.root)).toEqual([]);
  });

  it('a 4x4 value (level 1) and an 8x8 value (level 3) are shown with their own size, label and summary', () => {
    const four = fourBase();
    const m4 = mountWith(four);
    expectNoSeed(m4);
    expectShown(m4.root, four);
    expect(summaryText(m4.root)).toBe('4×4 · Розминка');
    openSheet(m4.root);
    expect(checkedSize(m4.root)).toBe(4);
    expect(checkedLevel(m4.root)).toBe(1);

    const eight = eightBase(3);
    const m8 = mountWith(eight);
    expectNoSeed(m8);
    expectShown(m8.root, eight);
    expect(summaryText(m8.root)).toBe('8×8 · Головоломка');
    openSheet(m8.root);
    expect(checkedSize(m8.root)).toBe(8);
    expect(checkedLevel(m8.root)).toBe(3);
  });

  it('level 4 at 6x6 is valid (the upper boundary of the level)', () => {
    const value = sixBase(4);
    const m = mountWith(value);
    expectNoSeed(m);
    expect(summaryText(m.root)).toBe('6×6 · Мозколамка');
  });

  it('a value with entries that disagree with the solution is still valid (wrong entries are the player’s)', () => {
    const value = sixBase();
    const entries = clone(value.entries);
    const wrong: Grid = entries.map((row, r) => row.map((cell, c): Cell => (cell === null && at(value.givens, r, c) === null ? ((r + c) % 2 === 0 ? 0 : 1) : cell)));
    const m = mountWith({ ...value, entries: wrong });
    expectNoSeed(m);
    expect(readBoard(m.root)).toEqual(merged({ ...value, entries: wrong }));
  });
});

describe('@trace FR-119 the level and size of a valid value reach the controls', () => {
  it('a 6x6 value at level 2: the summary «6×6 · Задачка», and aria-checked on «Поле 6×6» and on «Задачка» once the sheet is open', () => {
    const m = mountWith(sixBase(2));
    expectNoSeed(m);
    expect(summaryText(m.root)).toBe('6×6 · Задачка');
    openSheet(m.root);
    expect(checkedSize(m.root), 'the checked size button is «Поле 6×6»').toBe(6);
    expect(checkedLevel(m.root), 'the checked level button is «Задачка»').toBe(2);
  });
});

describe('@trace FR-119 violations and the hinted marker of a valid value', () => {
  it('three equal digits in a row: the three cells carry cell-violation (1-based 3,1 3,2 3,3)', () => {
    const value = sixBase();
    // only the three zeros are entries, so no other line is disturbed
    const entries: Grid = value.entries.map((line) => line.map((): Cell => null));
    const row = entries[2];
    expect.assert(row !== undefined, 'premise: row 3 exists');
    // the givens of row 3 are empty in columns 1 to 3 (generate(6, 5, 1)); three zeros there are three equal digits
    expect(value.givens[2]?.slice(0, 3), 'premise: no given in row 3, columns 1 to 3').toEqual([null, null, null]);
    row[0] = 0;
    row[1] = 0;
    row[2] = 0;
    expect(findViolations(merged({ ...value, entries })), 'premise: exactly one violation, rule three, row 3').toEqual([
      { rule: 'three', axis: 'row', index: 2, cells: [[2, 0], [2, 1], [2, 2]] },
    ]);
    const m = mountWith({ ...value, entries });
    expectNoSeed(m);
    expect(violationCells(m.root)).toEqual([[3, 1], [3, 2], [3, 3]]);
    expect(hintedCells(m.root)).toEqual([]);
  });

  it('hinted naming an entered cell: exactly that cell carries cell-hinted, the hint message is empty', () => {
    const value = withHinted(sixBase());
    expect.assert(value.hinted !== undefined, 'premise: the value is hinted');
    const [r, c] = value.hinted;
    const m = mountWith(value);
    expectNoSeed(m);
    expect(hintedCells(m.root)).toEqual([[r + 1, c + 1]]);
    expect(hintMessage(m.root)).toBe('');
    expect(violationCells(m.root)).toEqual([]);
    expectShown(m.root, value);
  });
});

describe('@trace FR-119 a solved value shows the win state at mount', () => {
  it('the win message shows the win text at once, with no click', () => {
    const value = solvedValue();
    const m = mountWith(value);
    expectNoSeed(m);
    expect(winMessage(m.root)).toBe(WIN_MESSAGE);
    expectShown(m.root, value);
    expect(violationCells(m.root)).toEqual([]);
  });
});

describe('@trace FR-119 each invalid value falls back to generation silently', () => {
  interface Case {
    name: string;
    /** the valid base of this case (the control is mounted from it) */
    valid: () => Value;
    /** the one-defect value */
    make: (v: Value) => unknown;
  }
  const firstGiven = (v: Value): [number, number] => {
    for (let r = 0; r < v.size; r++) for (let c = 0; c < v.size; c++) if (at(v.givens, r, c) !== null) return [r, c];
    throw new Error('premise: the base holds a given');
  };
  const firstEmpty = (v: Value): [number, number] => {
    for (let r = 0; r < v.size; r++) for (let c = 0; c < v.size; c++) if (at(v.givens, r, c) === null && at(v.entries, r, c) === null) return [r, c];
    throw new Error('premise: the base holds an empty cell');
  };
  const setCell = (grid: Grid, [r, c]: [number, number], value: unknown): void => {
    const row = grid[r];
    expect.assert(row !== undefined, 'premise: the row exists');
    Reflect.set(row, c, value);
  };

  const cases: Case[] = [
    { name: 'a non-object: null', valid: sixBase, make: () => null },
    { name: 'a non-object: a string', valid: sixBase, make: () => 'board' },
    { name: 'a non-object: a number', valid: sixBase, make: () => 42 },
    { name: 'a non-object: an array', valid: sixBase, make: (v) => [v] },
    {
      name: 'size 5 (5x5 arrays)',
      valid: sixBase,
      make: () => ({
        size: 5,
        level: 1,
        givens: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null)),
        entries: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null)),
      }),
    },
    { name: 'size as a string "6"', valid: sixBase, make: (v) => ({ ...v, size: '6' }) },
    { name: 'level 0', valid: sixBase, make: (v) => ({ ...v, level: 0 }) },
    { name: 'level 5', valid: sixBase, make: (v) => ({ ...v, level: 5 }) },
    { name: 'level 1.5 (not an integer)', valid: sixBase, make: (v) => ({ ...v, level: 1.5 }) },
    { name: 'level 2 at size 4', valid: fourBase, make: (v) => ({ ...v, level: 2 }) },
    {
      name: 'a givens row of the wrong length (too long)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        out.givens[3]?.push(null);
        return out;
      },
    },
    {
      name: 'an entries row of the wrong length (too short)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        out.entries[1]?.pop();
        return out;
      },
    },
    {
      name: 'the wrong number of givens rows (5 rows of 6)',
      valid: sixBase,
      make: (v) => ({ ...v, givens: v.givens.slice(0, 5), entries: v.entries }),
    },
    {
      name: 'a cell value of 2 in the entries',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        setCell(out.entries, firstEmpty(v), 2);
        return out;
      },
    },
    {
      name: 'a cell value of 2 in the givens',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        setCell(out.givens, firstGiven(v), 2);
        return out;
      },
    },
    {
      name: 'a cell value "1" (a string) in the entries',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        setCell(out.entries, firstEmpty(v), '1');
        return out;
      },
    },
    {
      name: 'givens with two or more solutions (empty givens)',
      valid: sixBase,
      make: (v) => {
        const givens: Grid = v.givens.map((row) => row.map((): Cell => null));
        expect(countSolutions(givens), 'premise: the empty 6x6 givens have two or more solutions').toBe(2);
        return { ...v, givens, entries: givens.map((row) => [...row]) };
      },
    },
    {
      name: 'givens with two or more solutions (one given removed from the unique puzzle)',
      valid: sixBase,
      make: (v) => {
        const givens = clone(v.givens);
        // remove givens one by one until the solution count reaches 2: a near-unique board, not an empty one
        for (let r = 0; r < v.size && countSolutions(givens) !== 2; r++) {
          for (let c = 0; c < v.size && countSolutions(givens) !== 2; c++) {
            if (at(givens, r, c) !== null) {
              setCell(givens, [r, c], null);
              // the entries stay as they are: they never sit on a given in this value
            }
          }
        }
        expect(countSolutions(givens), 'premise: the thinned givens have two or more solutions').toBe(2);
        return { ...v, givens, entries: v.entries };
      },
    },
    {
      name: 'givens with no solution (three zeros in a row)',
      valid: sixBase,
      make: (v) => {
        const givens: Grid = v.givens.map((row) => row.map((): Cell => null));
        setCell(givens, [0, 0], 0);
        setCell(givens, [0, 1], 0);
        setCell(givens, [0, 2], 0);
        expect(countSolutions(givens), 'premise: the givens have no solution').toBe(0);
        return { ...v, givens, entries: givens.map((row) => row.map((): Cell => null)) };
      },
    },
    {
      name: 'an entry on a given (the same digit)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        const [r, c] = firstGiven(v);
        setCell(out.entries, [r, c], at(v.givens, r, c));
        return out;
      },
    },
    {
      name: 'an entry on a given (the other digit)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        const [r, c] = firstGiven(v);
        setCell(out.entries, [r, c], at(v.givens, r, c) === 0 ? 1 : 0);
        return out;
      },
    },
    {
      name: 'hinted on an empty cell',
      valid: () => withHinted(sixBase()),
      make: (v) => ({ ...v, hinted: firstEmpty(v) }),
    },
    {
      name: 'hinted on a given cell (it has no entry)',
      valid: () => withHinted(sixBase()),
      make: (v) => ({ ...v, hinted: firstGiven(v) }),
    },
    { name: 'hinted outside the board: row 6', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [6, 0] }) },
    { name: 'hinted outside the board: column 6', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [0, 6] }) },
    { name: 'hinted outside the board: row -1', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [-1, 0] }) },
    { name: 'hinted outside the board: column -1', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [0, -1] }) },
    { name: 'hinted outside the board: [4, 4] on a 4x4 board', valid: () => withHinted(fourBase()), make: (v) => ({ ...v, hinted: [4, 4] }) },
    { name: 'hinted that is not a pair of integers: [1.5, 2]', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [1.5, 2] }) },
    { name: 'hinted that is not a pair: one number', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: [1] }) },
    { name: 'hinted that is not an array', valid: () => withHinted(sixBase()), make: (v) => ({ ...v, hinted: 'a1' }) },
    { name: 'the entries are missing', valid: sixBase, make: (v) => ({ size: v.size, level: v.level, givens: v.givens }) },
    { name: 'the givens are missing', valid: sixBase, make: (v) => ({ size: v.size, level: v.level, entries: v.entries }) },
    // Fix round 1 (review wf_551a83f7-f44, the code defect): hostile values. Only a script on the page can set the value, but the spec
    // says an invalid value is ignored silently, so none of these may throw out of the mount.
    {
      name: 'hostile: the givens array has an iterator that yields no rows (length still 6)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        Reflect.set(out.givens, Symbol.iterator, function* noRows() {
          yield* [];
        });
        Reflect.set(out.entries, Symbol.iterator, function* noRows() {
          yield* [];
        });
        return out;
      },
    },
    {
      name: 'hostile: an entries row has an iterator that yields one cell (length still 6)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        Reflect.set(out.entries[0] ?? [], Symbol.iterator, function* oneCell() {
          yield null;
        });
        return out;
      },
    },
    {
      name: 'hostile: a sparse givens row (new Array(6), holes only)',
      valid: sixBase,
      make: (v) => {
        const out = clone(v);
        Reflect.set(out.givens, 2, new Array(6));
        return out;
      },
    },
    {
      name: 'hostile: a getter on size that throws',
      valid: sixBase,
      make: (v) => {
        const out: Record<string, unknown> = { ...clone(v) };
        Object.defineProperty(out, 'size', {
          enumerable: true,
          get: () => {
            throw new Error('hostile size');
          },
        });
        return out;
      },
    },
    {
      name: 'hostile: a Proxy whose every read throws',
      valid: sixBase,
      make: (v) =>
        new Proxy(clone(v), {
          get: () => {
            throw new Error('hostile read');
          },
        }),
    },
    {
      name: 'hostile: a revoked Proxy',
      valid: sixBase,
      make: (v) => {
        const { proxy, revoke } = Proxy.revocable(clone(v), {});
        revoke();
        return proxy;
      },
    },
  ];

  it.each(cases)('$name', ({ valid, make }) => {
    // the control: the valid base is accepted (a page that ignores the global fails here, so this test is red now)
    const control = mountWith(valid());
    expect(control.seeds.calls(), 'control: the valid base takes no seed').toBe(0);
    expect(control.spy.calls, 'control: the valid base calls no generator').toEqual([]);
    control.root.remove();
    Reflect.deleteProperty(window, KEY);

    // the one-defect value
    const value = make(valid());
    const consoles = (['error', 'warn', 'log', 'info', 'debug'] as const).map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    const tracker = trackErrors();
    let m: Mounted | undefined;
    try {
      expect(() => {
        m = mountWith(value);
      }, 'the mount does not throw').not.toThrow();
    } finally {
      tracker.stop();
    }
    expect.assert(m !== undefined, 'premise: the page mounted');
    expect(tracker.errors, 'no uncaught error').toEqual([]);
    expect(m.seeds.calls(), 'exactly one seed is taken').toBe(1);
    expect(m.spy.calls, 'the generator is called once, with that seed, at size 6').toEqual([{ size: 6, seed: 7 }]);
    expect(m.spy.levels, 'at level 1').toEqual([1]);
    expect(readBoard(m.root), 'the generated board is shown').toEqual(PAIR_ROW.givens);
    expect(summaryText(m.root)).toBe(summaryLabel(6, 1));
    expect(Reflect.get(window, KEY), 'the invalid value is left where it was').toBe(value);
    consoles.forEach((spy, i) => {
      expect(spy, `console.${['error', 'warn', 'log', 'info', 'debug'][i] ?? '?'} was not called`).not.toHaveBeenCalled();
    });
  });

  it('guard: the base values of the cases are puzzles with one solution', () => {
    for (const base of [sixBase(), fourBase(), eightBase()]) {
      expect(countSolutions(base.givens)).toBe(1);
      expect(base.entries).toHaveLength(base.size);
    }
  });
});

describe('@trace FR-119 the value is read once and never written', () => {
  it('after a capture board, a change of the global is not read; «Нова головоломка» takes a seed and generates; nothing is written', () => {
    const value = deepFreeze(sixBase(2));
    const other = deepFreeze(fourBase());
    let current: unknown = value;
    let reads = 0;
    const writes: unknown[] = [];
    Object.defineProperty(window, KEY, {
      configurable: true,
      get: () => {
        reads += 1;
        return current;
      },
      set: (v: unknown) => {
        writes.push(v);
      },
    });
    const seeds = seedQueue([7]);
    const spy = generateSpy(bySize({ 6: PAIR_ROW }));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    expect(seeds.calls(), 'the capture board takes no seed').toBe(0);
    expect(spy.calls, 'the capture board calls no generator').toEqual([]);
    expectShown(root, value);
    expect(reads, 'the value was read once at mount').toBe(1);

    current = other; // the test changes the global after the mount
    startNewPuzzle(root); // the board has entries: the confirmation is answered inside the helper

    expect(seeds.calls(), 'a new seed is taken').toBe(1);
    expect(spy.calls, 'the board is generated with it, at the size and level shown').toEqual([{ size: 6, seed: 7 }]);
    expect(spy.levels).toEqual([2]);
    expect(readBoard(root), 'the generated board is shown, not the changed value').toEqual(PAIR_ROW.givens);
    expect(reads, 'the value was never read again').toBe(1);
    expect(writes, 'the page never wrote the global').toEqual([]);
    expect(Object.getOwnPropertyDescriptor(window, KEY), 'the page never deleted the global').toBeDefined();
    expect(current, 'the global still holds what the test set').toBe(other);

    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    for (const key of keys) expect([THEME_KEY, LANGUAGE_KEY], `localStorage key ${String(key)} is a preference`).toContain(key);
    expect(sessionStorage.length, 'nothing in sessionStorage').toBe(0);
    expect(document.cookie, 'no cookie').toBe('');
  });
});

describe('@trace FR-119 after a capture board the controls behave as on any board', () => {
  it('a hint works on the capture board: no seed, the engine hint sentence, the hinted cell marked', () => {
    const m = mountWith(sixBase());
    expectNoSeed(m);
    const expected = expectedHint(m.root);
    expect(expected.kind, 'premise: the engine has a fill for this board').toBe('fill');
    expect.assert(expected.kind === 'fill', 'premise: the hint is a fill');
    pressHint(m.root);
    expect(hintMessage(m.root)).toBe(expected.sentence);
    expect(hintedCells(m.root)).toEqual([[expected.row + 1, expected.col + 1]]);
    expect(m.seeds.calls(), 'a hint takes no seed').toBe(0);
  });

  it('«Скинути» returns to the givens of the capture board, with no seed and no generator call', () => {
    const value = sixBase();
    const m = mountWith(value);
    expectNoSeed(m);
    resetBoard(m.root);
    expect(readBoard(m.root)).toEqual(value.givens);
    expectNoSeed(m);
  });

  it('«Почати» after a capture board takes a seed and generates at the chosen level', () => {
    const m = mountWith(sixBase());
    expectNoSeed(m);
    chooseLevel(m.root, 3);
    expect(m.seeds.calls()).toBe(1);
    expect(m.spy.calls).toEqual([{ size: 6, seed: 7 }]);
    expect(m.spy.levels).toEqual([3]);
    expect(readBoard(m.root)).toEqual(PAIR_ROW.givens);
  });
});

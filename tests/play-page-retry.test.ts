// Play page: the page retry on a run-out of the generator (FR-88, FR-84). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md ("Page retry on a run-out"). Written FIRST (red): the page takes one
// seed per action and does not retry.
//
// @trace FR-88
// @trace FR-84
//
// The run-out fixtures throw the engine's own `GenerationRunOutError`, imported from the engine index (never from
// ../src/engine/types, never recognised by name or message). An ordinary error is a plain `Error`. The sheet is opened through the
// stubbed showPopover() by the helpers (A-44).
import { describe, expect, it } from 'vitest';
import { GenerationRunOutError } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';
import {
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  TWO_PAIRS,
  allCells,
  boardSize,
  chooseLevel,
  confirmYes,
  dialogIsOpen,
  fullState,
  hintedCells,
  installPageLifecycle,
  levelStates,
  mountPage,
  mountPlayedBoard,
  popoverIsOpen,
  pressLevelButton,
  pressNew,
  rawGenerateSpy,
  readBoard,
  seedQueue,
  selectSize,
  sheetOf,
  showModalCalls,
  summaryText,
  trackErrors,
} from './helpers/play-page';

installPageLifecycle();

const runOut = (): never => {
  throw new GenerationRunOutError();
};

/** A fixture per size for the boards that succeed. */
const fixtureOf = (size: number): Puzzle => (size === 4 ? BLANK_4 : size === 8 ? BLANK_8 : PAIR_ROW);

describe('@trace FR-88 the page retries on a run-out', () => {
  it('Success on the first seed takes one seed', () => {
    const seeds = seedQueue([1, 2, 3]);
    const spy = rawGenerateSpy((_i, size) => fixtureOf(size));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });

    chooseLevel(root, 2);

    expect(seeds.calls(), 'the seed source was called twice in all').toBe(2);
    expect(spy.calls.map((c) => c.seed), 'the generator was called twice, with the seeds 1 and 2').toEqual([1, 2]);
  });

  it('Success on the second seed', () => {
    const seeds = seedQueue([1, 2, 3, 4]);
    const spy = rawGenerateSpy((_i, size, seed) => {
      if (seed === 2) return runOut();
      return seed === 3 ? TWO_PAIRS : fixtureOf(size);
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });

    chooseLevel(root, 2);

    expect(spy.calls.slice(1).map((c) => `${c.size}/${c.seed}`), 'the calls for the change').toEqual(['6/2', '6/3']);
    expect(spy.levels.slice(1), 'both with level 2').toEqual([2, 2]);
    expect(seeds.calls(), 'the seed source was called three times in all').toBe(3);
    expect(readBoard(root), 'the board shown comes from the call with seed 3').toEqual(TWO_PAIRS.givens);
    expect(levelStates(root)).toEqual(['false', 'true', 'false', 'false']);
    expect(summaryText(root)).toBe('6×6 · Задачка');
  });

  it('Success on the third seed', () => {
    const seeds = seedQueue([1, 2, 3, 4, 5]);
    const spy = rawGenerateSpy((_i, size, seed) => {
      if (seed === 2 || seed === 3) return runOut();
      return seed === 4 ? TWO_PAIRS : fixtureOf(size);
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });

    chooseLevel(root, 4);

    expect(spy.calls.slice(1).map((c) => `${c.size}/${c.seed}`), 'three calls for the change, with the seeds 2, 3 and 4').toEqual(['6/2', '6/3', '6/4']);
    expect(spy.levels.slice(1), 'the same level 4').toEqual([4, 4, 4]);
    expect(readBoard(root), 'the board shown comes from seed 4').toEqual(TWO_PAIRS.givens);
  });

  it('Three run-outs keep everything', () => {
    const { root, seeds, spy } = mountPlayedBoard(6, () => runOut());
    const before = fullState(root);
    const hinted = hintedCells(root);
    const textBefore = root.textContent;
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;
    const tracker = trackErrors();
    try {
      pressLevelButton(root, 3);
      expect(dialogIsOpen(root), 'premise: the level change asks first').toBe(true);
      confirmYes(root);
    } finally {
      tracker.stop();
    }

    expect(seeds.calls() - seedCalls, 'exactly three seeds were taken for the change').toBe(3);
    expect(spy.calls.length - generatorCalls, 'exactly three generator calls were made, and no fourth').toBe(3);
    expect(fullState(root), 'the board, the messages, aria-checked of both groups and the summary are unchanged').toEqual(before);
    expect(hintedCells(root)).toEqual(hinted);
    expect(popoverIsOpen(sheetOf(root)), 'the sheet is closed').toBe(false);
    expect(dialogIsOpen(root), 'the dialog is closed').toBe(false);
    expect(root.textContent, 'no text was added to the page').toBe(textBefore);
    expect(tracker.errors, 'the error listener recorded nothing').toEqual([]);
  });

  it('A confirmation is asked once for a retried change', () => {
    let thrown = false;
    const { root, seeds } = mountPlayedBoard(6, () => {
      if (!thrown) {
        thrown = true;
        return runOut();
      }
      return TWO_PAIRS;
    });
    const seedCalls = seeds.calls();
    const shown = showModalCalls();

    pressLevelButton(root, 2);
    confirmYes(root);

    expect(showModalCalls() - shown, 'showModal was called once in all').toBe(1);
    expect(seeds.calls() - seedCalls, 'two seeds were taken for the change').toBe(2);
    expect(readBoard(root), 'the board shown is the new one').toEqual(TWO_PAIRS.givens);
  });

  it('An ordinary error is not retried', () => {
    const seeds = seedQueue([1, 2, 3, 4]);
    const spy = rawGenerateSpy((_i, size, _seed, level) => {
      if (level === 2) throw new Error('generator failed for level 2');
      return fixtureOf(size);
    });
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const before = fullState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    chooseLevel(root, 2);

    expect(seeds.calls() - seedCalls, 'exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'exactly one generator call was made').toBe(1);
    expect(fullState(root), 'the board is unchanged').toEqual(before);
  });

  it('A result of the wrong size is not retried', () => {
    const seeds = seedQueue([1, 2, 3, 4]);
    const spy = rawGenerateSpy((_i, size, _seed, level) => (level === 2 ? BLANK_4 : fixtureOf(size)));
    const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    const before = fullState(root);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    chooseLevel(root, 2);

    expect(seeds.calls() - seedCalls, 'exactly one seed was taken').toBe(1);
    expect(spy.calls.length - generatorCalls, 'exactly one generator call was made').toBe(1);
    expect(fullState(root), 'the board is unchanged').toEqual(before);
  });

  it('The retry covers the size change, «Нова головоломка» and the mount', () => {
    // a generator that throws the run-out error for the first call after it was armed, then succeeds
    const build = (armed: boolean): { root: HTMLElement; seeds: ReturnType<typeof seedQueue>; arm: () => void; calls: () => number } => {
      const seeds = seedQueue([1, 2, 3, 4, 5, 6]);
      let pendingRunOut = armed;
      let calls = 0;
      const spy = rawGenerateSpy((_i, size) => {
        calls += 1;
        if (pendingRunOut) {
          pendingRunOut = false;
          return runOut();
        }
        return fixtureOf(size);
      });
      const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
      return { root, seeds, arm: () => { pendingRunOut = true; }, calls: () => calls };
    };

    // (1) the mount
    const mount = build(true);
    expect(allCells(mount.root), 'a 6x6 board is shown at the mount').toHaveLength(36);
    expect(mount.seeds.calls(), 'two seeds were taken at the mount').toBe(2);

    // (2) a size change on an untouched board
    const size = build(false);
    const seedsBeforeSize = size.seeds.calls();
    size.arm();
    selectSize(size.root, 8);
    expect(boardSize(size.root), 'an 8x8 board is shown after the size change').toBe(8);
    expect(size.seeds.calls() - seedsBeforeSize, 'two seeds were taken for the size change').toBe(2);

    // (3) «Нова головоломка» on an untouched board
    const fresh = build(false);
    const seedsBeforeNew = fresh.seeds.calls();
    fresh.arm();
    pressNew(fresh.root);
    expect(allCells(fresh.root), 'a new 6x6 board is shown after the button').toHaveLength(36);
    expect(fresh.seeds.calls() - seedsBeforeNew, 'two seeds were taken for the button').toBe(2);
  });

  it('Three run-outs at the mount show no board', () => {
    const seeds = seedQueue([1, 2, 3, 4, 5]);
    const spy = rawGenerateSpy(() => runOut());
    const tracker = trackErrors();
    let root: HTMLElement;
    try {
      root = mountPage({ seedSource: seeds.source, generate: spy.generate });
    } finally {
      tracker.stop();
    }

    expect(seeds.calls(), 'exactly three seeds were taken').toBe(3);
    expect(spy.calls, 'and three generator calls').toHaveLength(3);
    expect(root.querySelectorAll('[data-cell]'), 'no [data-cell] exists').toHaveLength(0);
    expect(tracker.errors, 'no error is thrown').toEqual([]);
    expect(summaryText(root), 'the summary reads 6×6 · Розминка').toBe('6×6 · Розминка');
  });
});

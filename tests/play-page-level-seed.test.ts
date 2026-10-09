// Play page: the seed and the hint message after a level change (FR-88, FR-51, FR-40, FR-43). Scenarios of the delta spec
// openspec/changes/add-level-selector/specs/play-page/spec.md: the scenarios added to "Seed is chosen outside the engine, injectable
// and not shown" and to "Hint message stays until the next hint or a new puzzle". Written FIRST (red): the page has no level
// control and passes no level to the generator.
//
// @trace FR-88
// @trace FR-51
// @trace FR-40
// @trace FR-43
// @trace FR-73
// @trace FR-100
// @trace FR-101
//
// update-setup-sheet-start: choices go through «Почати», a marking press takes no seed (FR-73, FR-100, FR-101).
//
// The sheet is opened through the stubbed showPopover() by the helpers (A-44). The generator spy records the level in the parallel
// array `levels`. Exact texts are literals; this file never imports src/ui/strings.ts.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  BLANK_8,
  TWO_PAIRS,
  bySize,
  chooseLevel,
  clickCell,
  confirmNo,
  confirmYes,
  generateSpy,
  hintMessage,
  installPageLifecycle,
  mountPage,
  mountPlayedBoard,
  openSheet,
  pressClose,
  pressHint,
  pressNew,
  pressReset,
  selectSize,
  markLevel,
  markSize,
  pressStart,
  showModalCalls,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace FR-88 @trace FR-51 the seed of a level change', () => {
  it('A level change takes exactly one seed and passes the chosen level', () => {
    const seeds = { n: 0 };
    const source = (): number => {
      seeds.n += 1;
      return seeds.n;
    };
    const spy = generateSpy(bySize({ 6: BLANK, 8: BLANK_8 }));
    const root = mountPage({ seedSource: source, generate: spy.generate });

    chooseLevel(root, 2);
    chooseLevel(root, 4);
    selectSize(root, 8);

    expect(spy.calls.map((c) => `${c.size}/${c.seed}`), 'the (size, seed) pairs').toEqual(['6/1', '6/2', '6/3', '8/4']);
    expect(spy.levels, 'the levels: the mount, «Задачка», «Мозколамка», then the size change keeps level 4').toEqual([1, 2, 4, 4]);
    expect(seeds.n, 'the seed source was called exactly four times').toBe(4);
  });

  it('A cancelled or no-op action takes no seed (with the level)', () => {
    const { root, seeds, spy } = mountPlayedBoard(6);
    const seedCalls = seeds.calls();
    const generatorCalls = spy.calls.length;

    pressNew(root);
    confirmNo(root);
    markSize(root, 8); // chooses «Поле 8×8»: the confirmation is asked
    pressStart(root);
    confirmNo(root);
    markLevel(root, 2); // chooses «Задачка»: the confirmation is asked
    pressStart(root);
    confirmNo(root);
    pressReset(root);
    confirmYes(root);
    // with the sheet open: marking presses (no «Почати») on the size shown, the level shown, «Поле 8×8» and «Задачка», then «Закрити»
    markSize(root, 6);
    markLevel(root, 1);
    markSize(root, 8);
    markLevel(root, 2);
    pressClose(root);

    expect(seeds.calls(), 'the seed-source call count equals the count read before').toBe(seedCalls);
    expect(spy.calls, 'the generator call count equals the count read before').toHaveLength(generatorCalls);
  });
});

describe('@trace FR-40 @trace FR-43 @trace FR-88 the hint message and a level change', () => {
  it('A level change that shows a new puzzle clears it', () => {
    const spy = generateSpy(bySize({ 6: TWO_PAIRS, 4: BLANK_4 }));
    const root = mountPage({ seedSource: () => 1, generate: spy.generate });
    pressHint(root);
    expect(hintMessage(root), 'premise: a hint sentence is shown').not.toBe('');
    clickCell(root, 1, 1); // the player has clicked a cell since

    chooseLevel(root, 2); // asks first (the board has entries) and confirms

    expect(hintMessage(root)).toBe('');
  });
});

// update-setup-sheet-start, scenario «Marking a size or a level keeps it» of «Hint message stays until the next hint or a new puzzle»
// (FR-40, FR-100): the hint sentence survives two marking presses and «Закрити».
describe('@trace FR-40 @trace FR-100 the hint message and marking', () => {
  it('Marking a size or a level keeps it', () => {
    const spy = generateSpy(bySize({ 6: TWO_PAIRS, 4: BLANK_4 }));
    const root = mountPage({ seedSource: () => 1, generate: spy.generate });
    pressHint(root);
    const sentence = hintMessage(root);
    expect(sentence, 'premise: a hint sentence is shown').not.toBe('');
    openSheet(root);

    markSize(root, 4);
    markLevel(root, 2);
    expect(showModalCalls(), 'a marking press opens no dialog (FR-100)').toBe(0);
    pressClose(root);

    expect(hintMessage(root)).toBe(sentence);
    expect(showModalCalls(), 'and «Закрити» opens none').toBe(0);
  });
});

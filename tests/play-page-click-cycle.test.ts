// Play page: locked given cells (FR-33) and the player click cycle (FR-34).
import { describe, expect, it } from 'vitest';
import {
  PAIR_COL,
  WIN_PUZZLE,
  cellEl,
  cellText,
  clickCell,
  expectPageStructure,
  expectedHint,
  hintMessage,
  installPageLifecycle,
  mountFixture,
  pressHint,
  snapshot,
  targetCell,
  winMessage,
} from './helpers/play-page';

installPageLifecycle();

describe('@trace FR-33 given cells are locked', () => {
  it('Clicking a given cell changes nothing (once, then twice more)', () => {
    const root = mountFixture(WIN_PUZZLE);
    expectPageStructure(root);
    // premise: (2,5) is a given showing 1
    expect(cellText(root, 2, 5)).toBe('1');
    expect(cellEl(root, 2, 5).getAttribute('data-given')).toBe('true');
    const before = snapshot(root);
    const messagesBefore = [hintMessage(root), winMessage(root)];

    clickCell(root, 2, 5);
    expect(cellText(root, 2, 5)).toBe('1');
    expect(snapshot(root)).toEqual(before);
    clickCell(root, 2, 5, 2);

    const el = cellEl(root, 2, 5);
    expect(el.textContent).toBe('1');
    expect(el.getAttribute('data-given')).toBe('true');
    expect(el.classList.contains('cell-given')).toBe(true);
    // no other cell changed text or class
    expect(snapshot(root)).toEqual(before);
    expect([hintMessage(root), winMessage(root)]).toEqual(messagesBefore);
  });

  it('Clicking a given 0 changes nothing either', () => {
    const root = mountFixture(WIN_PUZZLE);
    expect(cellText(root, 1, 3)).toBe('0');
    expect(cellEl(root, 1, 3).getAttribute('data-given')).toBe('true');
    const before = snapshot(root);
    clickCell(root, 1, 3, 4);
    expect(snapshot(root)).toEqual(before);
  });

  it('Clicking a given does not clear a message', () => {
    const root = mountFixture(WIN_PUZZLE);
    pressHint(root);
    const sentence = hintMessage(root);
    expect(sentence).not.toBe('');
    clickCell(root, 2, 5);
    clickCell(root, 1, 3, 3);
    expect(hintMessage(root)).toBe(sentence);
  });
});

describe('@trace FR-34 player cells cycle through empty, 0 and 1', () => {
  it('Three clicks complete the cycle: 0, 1, empty (and the cycle repeats)', () => {
    const root = mountFixture(WIN_PUZZLE);
    // premise: (1,1) is an empty player cell
    expect(cellText(root, 1, 1)).toBe('');
    expect(cellEl(root, 1, 1).getAttribute('data-given')).toBe('false');

    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('0');
    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('1');
    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('');
    clickCell(root, 1, 1);
    expect(cellText(root, 1, 1)).toBe('0');
    // a player cell stays a player cell
    expect(cellEl(root, 1, 1).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 1, 1).classList.contains('cell-given')).toBe(false);
  });

  it('a click changes only the clicked cell', () => {
    const root = mountFixture(WIN_PUZZLE);
    const before = snapshot(root);
    // (1,1) -> 0 breaks no rule (row 1 holds the given 0 at (1,3) only), so no class changes elsewhere
    clickCell(root, 1, 1);
    const after = snapshot(root);
    expect(cellText(root, 1, 1)).toBe('0');
    const changed = after.filter((line, i) => line !== before[i]);
    expect(changed).toHaveLength(1);
    expect(changed[0]?.startsWith('1,1|0|false')).toBe(true);
  });

  it('Cycle works on a cell filled by a hint: a hint-filled 0 becomes 1 on click', () => {
    const root = mountFixture(PAIR_COL);
    // premise: the engine hint on the DOM board fills (3,4) with 0
    const h = expectedHint(root);
    expect(h).toMatchObject({ kind: 'fill', value: 0 });
    expect(targetCell(h)).toEqual([3, 4]);
    pressHint(root);
    expect(cellText(root, 3, 4)).toBe('0');

    clickCell(root, 3, 4);
    expect(cellText(root, 3, 4)).toBe('1');
    expect(cellEl(root, 3, 4).getAttribute('data-given')).toBe('false');
    expect(cellEl(root, 3, 4).classList.contains('cell-given')).toBe(false);
  });
});

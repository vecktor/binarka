// Play page: the accessibility umbrella (NFR-9) and the Ukrainian accessible names (NFR-5). Every interactive element has
// a non-empty Ukrainian accessible name, and nothing has a positive tabindex. This does NOT claim real screen-reader or
// browser coverage (A-26, TC-13); the details live in play-page-keyboard, -semantics and -stylesheet.
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  HINT_LABEL,
  NEW_LABEL,
  WIN_PUZZLE,
  allCells,
  clickCell,
  installPageLifecycle,
  mountFixture,
  ownLabelText,
  pressHint,
  sizeSelect,
} from './helpers/play-page';

installPageLifecycle();

/** The accessible name of each interactive element of the page, by the rule of the spec (text, label text, aria-label). */
function accessibleNames(root: HTMLElement): { what: string; name: string }[] {
  const names: { what: string; name: string }[] = [];
  for (const button of Array.from(root.querySelectorAll('button'))) {
    names.push({ what: `button ${button.getAttribute('data-action') ?? ''}`, name: button.textContent.trim() });
  }
  const label = sizeSelect(root).labels[0];
  expect.assert(label !== undefined, 'the size select has a label');
  names.push({ what: 'size select', name: ownLabelText(label) });
  const cells = Array.from(root.querySelectorAll('[role="gridcell"]'));
  expect(cells, 'the board has its gridcells').toHaveLength(allCells(root).length);
  expect(cells.length).toBeGreaterThan(0);
  for (const cell of cells) {
    names.push({
      what: `gridcell ${cell.getAttribute('data-row') ?? ''},${cell.getAttribute('data-col') ?? ''}`,
      name: (cell.getAttribute('aria-label') ?? '').trim(),
    });
  }
  return names;
}

describe('the page meets the accessibility requirements (NFR-9)', () => {
  it('@trace NFR-9 @trace NFR-5 Every button, the select and every gridcell has a non-empty Ukrainian accessible name', () => {
    const root = mountFixture(WIN_PUZZLE);
    const names = accessibleNames(root);
    expect(names).toHaveLength(2 + 1 + 36);
    for (const { what, name } of names) {
      expect(name, `${what} has a name`).not.toBe('');
      expect(/\p{Script=Cyrillic}/u.test(name), `${what} "${name}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(name), `${what} "${name}" has no Latin letters`).toBe(false);
    }
    const all = names.map((n) => n.name);
    expect(all).toContain(HINT_LABEL);
    expect(all).toContain(NEW_LABEL);
    expect(all).toContain('Розмір поля');
  });

  it('@trace NFR-9 No element of the page has a positive tabindex, before and after play', () => {
    const root = mountFixture(BLANK);
    const check = (): void => {
      const tabindexed = Array.from(root.querySelectorAll('[tabindex]'));
      expect(tabindexed.length, 'the cells carry tabindex').toBeGreaterThan(0);
      for (const el of tabindexed) expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0);
    };
    check();
    clickCell(root, 2, 2);
    pressHint(root);
    check();
  });
});

// Play page: the accessibility umbrella (NFR-9) and the Ukrainian accessible names (NFR-5). Every button, the radiogroup and
// the board group have a non-empty Ukrainian accessible name, and no element has a tabindex. This does NOT claim real
// screen-reader or browser coverage (A-28, TC-13); the details live in play-page-keyboard, -semantics and -stylesheet.
// Scenarios of openspec/specs/play-page/spec.md (reconcile-ux-accessibility).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  HINT_LABEL,
  NEW_LABEL,
  WIN_PUZZLE,
  allCells,
  clickCell,
  expectedCellLabel,
  installPageLifecycle,
  mountFixture,
  pressHint,
} from './helpers/play-page';

installPageLifecycle();

/** The accessible name of each button (its aria-label when it has one, else its text), of the radiogroup and of the board group. */
function accessibleNames(root: HTMLElement): { what: string; name: string }[] {
  const names: { what: string; name: string }[] = [];
  for (const button of Array.from(root.querySelectorAll('button'))) {
    const what = button.hasAttribute('data-cell')
      ? `cell ${button.getAttribute('data-row') ?? ''},${button.getAttribute('data-col') ?? ''}`
      : `button ${button.getAttribute('data-action') ?? button.textContent.trim()}`;
    names.push({ what, name: (button.getAttribute('aria-label') ?? button.textContent).trim() });
  }
  for (const group of [...Array.from(root.querySelectorAll('[role="radiogroup"]')), ...Array.from(root.querySelectorAll('[data-board]'))]) {
    names.push({ what: `group ${group.getAttribute('role') ?? 'board'}`, name: (group.getAttribute('aria-label') ?? '').trim() });
  }
  return names;
}

describe('the page meets the accessibility requirements (NFR-9)', () => {
  it('@trace NFR-9 @trace NFR-5 Every button, the radiogroup and the board have a non-empty Ukrainian accessible name', () => {
    const root = mountFixture(WIN_PUZZLE);
    const names = accessibleNames(root);
    // 46 buttons (36 cells, the three size radios, «Підказка», «Скинути», «Нова головоломка», «Правила», «Зрозуміло»,
    // «Так, почати» and «Скасувати») and two groups (the radiogroup and the board)
    expect(root.querySelectorAll('button')).toHaveLength(46);
    expect(allCells(root)).toHaveLength(36);
    expect(names).toHaveLength(46 + 2);
    for (const { what, name } of names) {
      expect(name, `${what} has a name`).not.toBe('');
      expect(/\p{Script=Cyrillic}/u.test(name), `${what} "${name}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(name), `${what} "${name}" has no Latin letters`).toBe(false);
    }
    const all = names.map((n) => n.name);
    expect(all).toContain(HINT_LABEL);
    expect(all).toContain('Скинути');
    expect(all).toContain(NEW_LABEL);
    expect(all).toContain('Розмір поля');
    expect(all).toContain('Поле 6×6');
    for (const cell of allCells(root)) expect(all).toContain(expectedCellLabel(cell));
  });

  it('@trace NFR-9 No element of the page has a tabindex, before and after play', () => {
    const root = mountFixture(BLANK);
    const check = (): void => {
      expect(root.hasAttribute('tabindex'), 'the root has no tabindex').toBe(false);
      expect(root.querySelectorAll('[tabindex]'), 'no element of the root has a tabindex attribute').toHaveLength(0);
    };
    check();
    clickCell(root, 2, 2);
    pressHint(root);
    check();
  });
});

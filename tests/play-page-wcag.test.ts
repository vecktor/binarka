// Play page: the accessibility umbrella (NFR-9) and the Ukrainian accessible names (NFR-5). Every button, the radiogroup and
// the board group have a non-empty Ukrainian accessible name, and no element has a tabindex. This does NOT claim real
// screen-reader or browser coverage (A-28, TC-13); the details live in play-page-keyboard, -semantics and -stylesheet.
// Scenarios of openspec/specs/play-page/spec.md (reconcile-ux-accessibility).
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  BLANK_4,
  CLOSE_LABEL,
  HINT_LABEL,
  LEVEL_DESCRIPTIONS,
  LEVEL_GROUP_LABEL,
  LEVEL_NAMES,
  NEW_LABEL,
  SHEET_LABEL,
  SIZE_GROUP_LABEL,
  START_LABEL,
  SUMMARY_PREFIX,
  WIN_PUZZLE,
  accessibleName,
  allCells,
  clickCell,
  dispatchToggle,
  expectedCellLabel,
  generatorBySize,
  installPageLifecycle,
  levelButtons,
  levelDisabled,
  levelStates,
  mountFixture,
  mountPage,
  openSheet,
  pressHint,
  seedQueue,
  selectSize,
  sizeButton,
  sizeButtons,
  summaryLabel,
} from './helpers/play-page';

installPageLifecycle();

/**
 * The accessible name of each button (its aria-label when it has one, else its text without aria-hidden descendants), of the
 * radiogroups, of the setup sheet and of the board group (their aria-label).
 * Slice DL2 DELIBERATE CHANGE (NFR-9, FR-95, FR-96): the name of a button drops its `aria-hidden` descendants (the cue «▾» of the
 * summary button), and the setup sheet joins the named groups.
 */
function accessibleNames(root: HTMLElement): { what: string; name: string }[] {
  const names: { what: string; name: string }[] = [];
  for (const button of Array.from(root.querySelectorAll('button'))) {
    const what = button.hasAttribute('data-cell')
      ? `cell ${button.getAttribute('data-row') ?? ''},${button.getAttribute('data-col') ?? ''}`
      : `button ${button.getAttribute('data-action') ?? button.textContent.trim()}`;
    names.push({ what, name: accessibleName(button) });
  }
  const groups = [
    ...Array.from(root.querySelectorAll('[role="radiogroup"]')),
    ...Array.from(root.querySelectorAll('[data-section="setup"]')),
    ...Array.from(root.querySelectorAll('[data-board]')),
  ];
  for (const group of groups) {
    names.push({ what: `group ${group.getAttribute('role') ?? 'board'}`, name: (group.getAttribute('aria-label') ?? '').trim() });
  }
  return names;
}

describe('the page meets the accessibility requirements (NFR-9)', () => {
  it('@trace NFR-9 @trace NFR-5 Every button, the radiogroups, the setup sheet and the board have a non-empty Ukrainian accessible name', () => {
    const root = mountFixture(WIN_PUZZLE);
    const names = accessibleNames(root);
    // 53 buttons (36 cells, the three size radios, the four level radios, «Правила», the summary button, «Почати», «Закрити»,
    // «Підказка», «Скинути», «Нова головоломка», «Зрозуміло», «Так, почати» and «Скасувати») and four groups (two radiogroups, the
    // sheet and the board). Slice DL2 DELIBERATE CHANGE (NFR-9): was 46 buttons and two groups; update-setup-sheet-start (NFR-9,
    // FR-101, NFR-5): 53 buttons, «Почати» joins the names (was 52).
    expect(root.querySelectorAll('button')).toHaveLength(53);
    expect(root.querySelectorAll('[role="radiogroup"]')).toHaveLength(2);
    expect(allCells(root)).toHaveLength(36);
    expect(names).toHaveLength(53 + 4);
    for (const { what, name } of names) {
      expect(name, `${what} has a name`).not.toBe('');
      expect(/\p{Script=Cyrillic}/u.test(name), `${what} "${name}" has Cyrillic letters`).toBe(true);
      expect(/[A-Za-z]/.test(name), `${what} "${name}" has no Latin letters`).toBe(false);
    }
    const all = names.map((n) => n.name);
    expect(all).toContain(HINT_LABEL);
    expect(all).toContain('Скинути');
    expect(all).toContain(NEW_LABEL);
    expect(all).toContain(SIZE_GROUP_LABEL);
    expect(all).toContain('Поле 6×6');
    expect(all).toContain(LEVEL_GROUP_LABEL);
    expect(all).toContain(SHEET_LABEL);
    expect(all).toContain(START_LABEL);
    expect(all).toContain(CLOSE_LABEL);
    // the summary button: the hidden prefix and the visible text, without the aria-hidden cue
    expect(all).toContain(`${SUMMARY_PREFIX}${summaryLabel(6, 1)}`);
    // each level button: name, one space, description
    LEVEL_NAMES.forEach((name, i) => {
      expect(all, `the level button «${name}» is named by its name and its description`).toContain(`${name} ${LEVEL_DESCRIPTIONS[i] ?? ''}`);
    });
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

// Scenario «The level radiogroup exposes its state» (NFR-9, FR-91): the state of the group is in attributes, not in colour alone.
describe('the level radiogroup exposes its state (NFR-9)', () => {
  it('@trace NFR-9 @trace FR-91 The level radiogroup exposes its state: at 6x6 one aria-checked and no aria-disabled, at 4x4 one aria-checked and three aria-disabled', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    expect(levelButtons(root)).toHaveLength(4);
    expect(levelStates(root).filter((state) => state === 'true'), 'at 6x6 exactly one button is checked').toHaveLength(1);
    expect(levelDisabled(root), 'at 6x6 no button has aria-disabled').toEqual([null, null, null, null]);

    selectSize(root, 4);

    expect(levelStates(root).filter((state) => state === 'true'), 'at 4x4 exactly one button is checked').toHaveLength(1);
    expect(levelDisabled(root), 'at 4x4 levels 2 to 4 have aria-disabled="true"').toEqual([null, 'true', 'true', 'true']);
  });
});

// update-setup-sheet-start, scenario «The radiogroups expose the marked state while the sheet is open» (NFR-9, FR-100, A-47).
describe('the radiogroups expose the marked state while the sheet is open (NFR-9)', () => {
  it('@trace NFR-9 @trace FR-100 The radiogroups expose the marked state while the sheet is open', () => {
    const root = mountPage({ seedSource: seedQueue([1, 2]).source, generate: generatorBySize({ 6: BLANK, 4: BLANK_4 }) });
    const sheet = openSheet(root);

    sizeButton(root, 4).click(); // a marking press

    const sizes = sizeButtons(root).map((b) => b.getAttribute('aria-checked'));
    expect(sizes, 'aria-checked is on «Поле 4×4» only').toEqual(['true', 'false', 'false']);
    expect(levelStates(root), 'and on «Розминка» only').toEqual(['true', 'false', 'false', 'false']);
    expect(levelDisabled(root), '«Задачка», «Головоломка» and «Мозколамка» have aria-disabled="true"').toEqual([null, 'true', 'true', 'true']);

    dispatchToggle(sheet, 'closed');

    expect(sizeButtons(root).map((b) => b.getAttribute('aria-checked')), 'after the closing toggle «Поле 6×6» only').toEqual(['false', 'true', 'false']);
    expect(levelDisabled(root), 'and no level button has aria-disabled').toEqual([null, null, null, null]);
  });
});

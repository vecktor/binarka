// Play page: the theme press, the effective theme on the document, auto following the system, the browser colour and the marked choice
// (add-theme-switch). One test per jsdom scenario of the delta spec openspec/changes/add-theme-switch/specs/play-page/spec.md, title =
// scenario name, from the requirements «A theme press acts at once and changes nothing else», «Effective theme on the document»,
// «Auto follows the system theme live», «Browser colour follows the theme» and «The option controls are not part of the marked choice».
// Written FIRST (red): the page has no theme control, sets no data-theme and registers no matchMedia listener yet.
//
// jsdom has no matchMedia: the stub of A-50 (tests/helpers/play-page.ts `installMatchMedia`) records the change listeners and lets the
// test fire them; the settings panel and the sheet are opened through the stubbed showPopover() (A-44). The colours the meta must carry
// are read from src/ui/style.css (the --color-page of the light and of the dark token set), never copied into the test. The real-browser
// scenarios («The rendered colours follow the effective theme», «Auto follows a live change in a real browser») live in
// e2e/nfr-13-a11y.spec.ts.
//
// @trace FR-103
// @trace FR-104
// @trace FR-105
// @trace FR-106
// @trace FR-118
// @trace FR-100
import { describe, expect, it, vi } from 'vitest';
import {
  PAIR_ROW,
  addThemeColorMeta,
  allCells,
  checkedLevel,
  checkedSize,
  checkedTheme,
  documentTheme,
  dispatchToggle,
  expectActive,
  hintMessage,
  hintedCells,
  installMatchMedia,
  installMatchMediaWithoutListeners,
  installPageLifecycle,
  installThrowingMatchMedia,
  markLevel,
  markSize,
  mountFixture,
  mountPage,
  mountPlayedBoard,
  openSettings,
  popoverCalls,
  popoverIsOpen,
  popoverLog,
  pressTheme,
  settingsButton,
  sheetOf,
  showModalCalls,
  snapshot,
  summaryButton,
  summaryText,
  themeOption,
  trackErrors,
  violationCells,
  winMessage,
} from './helpers/play-page';
import { readStyles, themeTokenSets } from './helpers/css';

installPageLifecycle();

/** `--color-page` of the light and of the dark token set of the stylesheet (the dark set must exist). */
function pageColours(): { light: string; dark: string } {
  const [light, dark] = themeTokenSets(readStyles());
  const colour = (set: typeof light): string => (set?.tokens['--color-page'] ?? '').toLowerCase();
  return { light: colour(light), dark: colour(dark) };
}

const metaContent = (): string => (document.head.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '').toLowerCase();

describe('A theme press acts at once and changes nothing else', () => {
  it('A theme press changes only the theme', () => {
    const played = mountPlayedBoard(6); // entries, a hint sentence, a hinted cell and cells with cell-violation
    const { root, seeds, spy } = played;
    expect(hintedCells(root), 'premise: a hint-filled cell with cell-hinted').toHaveLength(1);
    expect(violationCells(root).length, 'premise: cells with cell-violation').toBeGreaterThan(0);
    markSize(root, 8);
    markLevel(root, 4); // the sheet stays open and marked; the test does not close it
    expect(checkedSize(root)).toBe(8);
    expect(checkedLevel(root)).toBe(4);
    openSettings(root);
    const option = themeOption(root, 'dark');
    option.focus();
    expectActive(option, 'premise: DOM focus is on «Темна»');
    const before = {
      cells: snapshot(root),
      hint: hintMessage(root),
      win: winMessage(root),
      summary: summaryText(root),
      seedCalls: seeds.calls(),
      generateCalls: spy.calls.length,
      modalCalls: showModalCalls(),
    };
    expect(before.summary).toBe('6×6 · Розминка');

    option.click();

    expect(checkedTheme(root)).toBe('dark');
    expect(documentTheme()).toBe('dark');
    expectActive(option, 'DOM focus is still on «Темна»');
    expect(snapshot(root), 'every cell keeps its text and class list').toEqual(before.cells);
    expect(hintMessage(root)).toBe(before.hint);
    expect(winMessage(root)).toBe(before.win);
    expect(summaryText(root)).toBe('6×6 · Розминка');
    expect(checkedSize(root), 'the marked choice is unchanged: «Поле 8×8»').toBe(8);
    expect(checkedLevel(root), 'the marked choice is unchanged: «Мозколамка»').toBe(4);
    expect(showModalCalls(), 'no confirmation').toBe(before.modalCalls);
    expect(seeds.calls(), 'no seed was taken').toBe(before.seedCalls);
    expect(spy.calls.length, 'the generator was not called').toBe(before.generateCalls);
  });

  it('A theme press opens and closes nothing', () => {
    const root = mountFixture(PAIR_ROW);
    const panel = openSettings(root);
    expect(popoverIsOpen(panel), 'premise: the panel is open').toBe(true);
    const calls = popoverLog.length;

    pressTheme(root, 'light');

    expect(popoverLog.length, 'the press called neither showPopover nor hidePopover nor togglePopover').toBe(calls);
    for (const method of ['showPopover', 'hidePopover', 'togglePopover'] as const) {
      expect(popoverCalls(method), method).toBe(method === 'showPopover' ? 1 : 0);
    }
    expect(popoverIsOpen(panel), 'the settings panel is still open').toBe(true);
    expect(checkedTheme(root), 'premise: the press did act').toBe('light');
  });

  it('Pressing the chosen option changes nothing', () => {
    localStorage.setItem('binarka.theme', 'dark');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const root = mountFixture(PAIR_ROW);
    expect(documentTheme(), 'premise: the stored dark theme is applied').toBe('dark');
    expect(checkedTheme(root)).toBe('dark');
    pressTheme(root, 'dark');
    expect(setItem, 'setItem was not called').not.toHaveBeenCalled();
    expect(checkedTheme(root)).toBe('dark');
    expect(documentTheme()).toBe('dark');
  });

  // Review-gate fix round 2 (confirming run wf_6e154572-16a, autonomy-log row 130): the one choice of the document shows on every mount.
  // A press on one mount moves aria-checked on the other too, and a press on the other mount acts (it is not dropped as "already chosen").
  it('Two mounts show one choice', () => {
    installMatchMedia(false);
    const first = mountFixture(PAIR_ROW);
    const second = mountFixture(PAIR_ROW);
    expect(checkedTheme(second), 'premise: both mounts start on «Як у системі»').toBe('auto');

    pressTheme(first, 'dark');
    expect(checkedTheme(second), 'the press on the first mount shows on the second').toBe('dark');

    pressTheme(second, 'light');
    expect(documentTheme(), 'the press on the second mount acts').toBe('light');
    expect(checkedTheme(first), 'and shows on the first').toBe('light');
    expect(checkedTheme(second)).toBe('light');
  });
});

describe('Effective theme on the document', () => {
  it('The attribute follows the choice', () => {
    installMatchMedia(false);
    const root = mountFixture(PAIR_ROW);
    pressTheme(root, 'dark');
    expect(documentTheme()).toBe('dark');
    pressTheme(root, 'light');
    expect(documentTheme()).toBe('light');
    pressTheme(root, 'auto');
    expect(documentTheme(), 'auto on a light system is light').toBe('light');
  });
});

describe('Auto follows the system theme live', () => {
  it('Auto resolves to the system theme at mount', () => {
    installMatchMedia(true);
    mountFixture(PAIR_ROW);
    expect(documentTheme(), 'a dark system').toBe('dark');

    document.documentElement.removeAttribute('data-theme'); // the second mount must set the attribute itself
    installMatchMedia(false);
    mountFixture(PAIR_ROW);
    expect(documentTheme(), 'a light system').toBe('light');
  });

  it('Auto follows a live change', () => {
    const colours = pageColours();
    const meta = addThemeColorMeta('#abcdef'); // a colour that is neither theme's: the page must write the content itself
    const stub = installMatchMedia(false);
    mountFixture(PAIR_ROW);
    expect(documentTheme(), 'premise: a light system at mount').toBe('light');
    expect(stub.queries.map((query) => query.replaceAll(' ', '')), 'the page asked for the dark query').toContain('(prefers-color-scheme:dark)');
    expect(stub.listeners.length, 'the page recorded a change listener').toBeGreaterThanOrEqual(1);

    stub.setMatches(true);
    stub.fire();
    expect(documentTheme()).toBe('dark');
    expect(meta.getAttribute('content')?.toLowerCase(), 'the theme-color meta equals the dark --color-page').toBe(colours.dark);

    stub.setMatches(false);
    stub.fire();
    expect(documentTheme()).toBe('light');
    expect(meta.getAttribute('content')?.toLowerCase()).toBe(colours.light);
  });

  // design.md decision 6 and tasks.md 3.3: one change listener per mount, added once (a manual press adds none and removes none that matters)
  it('One change listener per mount (design.md decision 6)', () => {
    const stub = installMatchMedia(false);
    const root = mountFixture(PAIR_ROW);
    expect(stub.listeners, 'one listener after the mount').toHaveLength(1);
    pressTheme(root, 'dark');
    pressTheme(root, 'light');
    pressTheme(root, 'auto');
    expect(stub.listeners, 'still one listener after three presses').toHaveLength(1);
  });

  it('A manual choice ignores the system', () => {
    const stub = installMatchMedia(false);
    const root = mountFixture(PAIR_ROW);
    pressTheme(root, 'light');
    stub.setMatches(true);
    stub.fire();
    expect(documentTheme(), 'light pressed, then a dark system').toBe('light');

    pressTheme(root, 'dark');
    stub.setMatches(false);
    stub.fire();
    expect(documentTheme(), 'dark pressed, then a system that stops matching').toBe('dark');
  });

  it('A broken matchMedia does not stop the page', () => {
    installThrowingMatchMedia();
    const first = mountPage();
    expect(allCells(first), 'the board is shown').toHaveLength(36);
    expect(documentTheme(), 'a matchMedia that throws: light').toBe('light');

    document.documentElement.removeAttribute('data-theme');
    installMatchMediaWithoutListeners(true);
    const tracker = trackErrors();
    let second: HTMLElement;
    try {
      second = mountPage();
    } finally {
      tracker.stop();
    }
    expect(tracker.errors, 'no error reached the window').toEqual([]);
    expect(allCells(second), 'the board is shown').toHaveLength(36);
    expect(documentTheme(), 'an object without addEventListener: the page follows matches').toBe('dark');
  });

  // Review-gate fix round (autonomy-log row 129): «A manual choice ignores the system» holds for the document, not per mount.
  // Both mounts write the one <html data-theme>, so a second mount that still holds auto must not undo the first mount's press.
  it('A manual choice ignores the system (two mounts share one document)', () => {
    const stub = installMatchMedia(false);
    const first = mountFixture(PAIR_ROW);
    mountFixture(PAIR_ROW);
    expect(stub.listeners, 'premise: one listener per mount').toHaveLength(2);
    pressTheme(first, 'dark');
    stub.setMatches(true);
    stub.fire();
    stub.setMatches(false);
    stub.fire();
    expect(documentTheme(), 'dark pressed on one mount, then two system changes').toBe('dark');
  });

  // Review-gate fix round 3 (confirming run wf_aa7a4a9e-9da, autonomy-log row 130): a mount whose root left the document is dropped when
  // the next mount runs (lazily): its system listener is removed and a press elsewhere no longer updates its options.
  it('A removed mount is dropped at the next mount', () => {
    const stub = installMatchMedia(false);
    const removed = mountFixture(PAIR_ROW);
    expect(stub.listeners, 'premise: one listener for the first mount').toHaveLength(1);
    removed.remove();
    expect(stub.listeners, 'the drop is lazy: the listener stays until the next mount').toHaveLength(1);

    const live = mountFixture(PAIR_ROW);
    expect(stub.listeners, 'the removed mount\'s listener is gone, the live mount has one').toHaveLength(1);
    stub.setMatches(true);
    stub.fire();
    expect(documentTheme(), 'a system change still reaches the document').toBe('dark');

    pressTheme(live, 'light');
    expect(checkedTheme(live)).toBe('light');
    expect(checkedTheme(removed), 'the removed mount\'s options are no longer updated').toBe('auto');
  });

  it('Without matchMedia auto is light', () => {
    expect(typeof window.matchMedia, 'premise: no matchMedia').toBe('undefined');
    const tracker = trackErrors();
    let root: HTMLElement;
    try {
      root = mountPage();
    } finally {
      tracker.stop();
    }
    expect(tracker.errors).toEqual([]);
    expect(allCells(root).length).toBeGreaterThan(0);
    expect(documentTheme()).toBe('light');
  });
});

describe('Browser colour follows the theme', () => {
  it('A document without the meta does not stop the page', () => {
    expect(document.head.querySelector('meta[name="theme-color"]'), 'premise: the document has no theme-color meta').toBeNull();
    const root = mountFixture(PAIR_ROW);
    const tracker = trackErrors();
    try {
      pressTheme(root, 'dark');
    } finally {
      tracker.stop();
    }
    expect(tracker.errors, 'the page raises no error').toEqual([]);
    expect(documentTheme()).toBe('dark');
  });

  it('The meta follows every change of the effective theme', () => {
    const colours = pageColours();
    addThemeColorMeta('#abcdef');
    const stub = installMatchMedia(false);
    const root = mountFixture(PAIR_ROW);

    pressTheme(root, 'dark');
    expect(metaContent(), '«Темна»: the --color-page of the dark set').toBe(colours.dark);
    pressTheme(root, 'light');
    expect(metaContent(), '«Світла»: the --color-page of the light set').toBe(colours.light);
    pressTheme(root, 'auto');
    expect(metaContent(), '«Як у системі» on a light system: still the light colour').toBe(colours.light);
    stub.setMatches(true);
    stub.fire();
    expect(metaContent(), 'a system change to dark: the dark colour again').toBe(colours.dark);
    expect(document.head.querySelectorAll('meta[name="theme-color"]'), 'still one meta').toHaveLength(1);
  });
});

describe('The option controls are not part of the marked choice', () => {
  it('A press leaves the marked choice alone', () => {
    const root = mountFixture(PAIR_ROW);
    markSize(root, 8);
    markLevel(root, 4);
    openSettings(root); // the closing `toggle` of the sheet is not dispatched yet
    const hides = popoverCalls('hidePopover');

    pressTheme(root, 'dark');

    expect(checkedSize(root), '«Поле 8×8» is still marked').toBe(8);
    expect(checkedLevel(root), '«Мозколамка» is still marked').toBe(4);
    expect(popoverCalls('hidePopover'), 'hidePopover was not called by the press').toBe(hides);
    expect(checkedTheme(root), 'premise: the press did act').toBe('dark');
  });

  it('Opening the panel closes the sheet and discards the marked choice', () => {
    const root = mountFixture(PAIR_ROW);
    const before = { cells: snapshot(root), hint: hintMessage(root), win: winMessage(root), summary: summaryText(root) };
    markSize(root, 8);
    markLevel(root, 4);
    expect(checkedSize(root), 'premise: the choice is marked').toBe(8);
    settingsButton(root).focus(); // focus is outside the sheet
    openSettings(root);
    dispatchToggle(sheetOf(root), 'closed'); // what the browser does when another popover="auto" opens

    expect(checkedSize(root), 'aria-checked is on the size of the board shown').toBe(6);
    expect(checkedLevel(root), 'aria-checked is on the level of the board shown').toBe(1);
    expect(snapshot(root)).toEqual(before.cells);
    expect(hintMessage(root)).toBe(before.hint);
    expect(winMessage(root)).toBe(before.win);
    expect(summaryText(root)).toBe(before.summary);
    expect(document.activeElement, 'DOM focus is not moved to the summary button').not.toBe(summaryButton(root));
    expect(checkedTheme(root), 'the theme option is still checked').toBe('auto');
  });
});

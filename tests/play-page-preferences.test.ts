// Play page: the stored theme preference (add-theme-switch). One test per jsdom scenario of the delta spec
// openspec/changes/add-theme-switch/specs/play-page/spec.md, title = scenario name, from the requirements «Stored preferences»,
// «Invalid or missing stored values fall back», «Failing storage does not stop the page» and (the one scenario that belongs here)
// «A system change writes nothing» of «Auto follows the system theme live». Written FIRST (red): the page stores nothing yet and has no
// theme control to press.
//
// The writes are counted with spies on Storage.prototype (vitest restores them with `restoreMocks`); a storage whose ACCESS throws is
// installed by the lifecycle helper `makeLocalStorageAccessThrow` and put back by it (Object.defineProperty is not undone by
// `restoreMocks`). The scenario «The page source names no other store» is a source scan and a GUARD: it is green before the
// implementation and must stay green (TC-12 narrowed: localStorage only).
//
// @trace FR-113
// @trace FR-114
// @trace FR-115
// @trace FR-100
// @trace FR-105
// @trace TC-12
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  BLANK_4,
  BLANK_8,
  PAIR_ROW,
  THEME_KEY,
  allCells,
  checkedTheme,
  clickCell,
  collectPageText,
  documentTheme,
  generatorBySize,
  installMatchMedia,
  installPageLifecycle,
  makeLocalStorageAccessThrow,
  markLevel,
  markSize,
  mountFixture,
  mountOn,
  mountPage,
  pressHint,
  pressStart,
  pressTheme,
  resetBoard,
  seedQueue,
  startNewPuzzle,
  trackErrors,
} from './helpers/play-page';

installPageLifecycle();

describe('Stored preferences', () => {
  it('A press writes the pressed value once', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const root = mountFixture(PAIR_ROW);
    expect(setItem, 'premise: the mount wrote nothing').not.toHaveBeenCalled();

    pressTheme(root, 'dark');
    pressTheme(root, 'auto');

    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem.mock.calls[0]).toEqual([THEME_KEY, 'dark']);
    expect(setItem.mock.calls[1], 'the default value is written too (A-48)').toEqual([THEME_KEY, 'auto']);
    expect(localStorage.length, 'localStorage holds no other key').toBe(1);
    expect(localStorage.getItem(THEME_KEY)).toBe('auto');
  });

  it('Pressing the default option on a fresh page writes nothing', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const root = mountFixture(PAIR_ROW);
    expect(checkedTheme(root), 'premise: «Як у системі» is checked by default').toBe('auto');

    pressTheme(root, 'auto');

    expect(setItem, 'the option is already chosen: nothing is written (A-48)').not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it('Nothing else writes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const stub = installMatchMedia(false);
    const seeds = seedQueue([1, 2, 3, 4, 5, 6]);
    const root = mountPage({ seedSource: seeds.source, generate: generatorBySize({ 4: BLANK_4, 6: PAIR_ROW, 8: BLANK_8 }) });
    expect(stub.listeners.length, 'premise: a system change listener exists, so firing it below is not vacuous').toBeGreaterThanOrEqual(1);

    clickCell(root, 1, 1, 2); // an entry
    pressHint(root);
    startNewPuzzle(root); // confirmed: the board has an entry
    clickCell(root, 1, 1, 1);
    resetBoard(root); // confirmed
    markSize(root, 4);
    markLevel(root, 1);
    pressStart(root); // «Почати» starts the 4x4 board
    expect(allCells(root), 'premise: «Почати» started the 4x4 board').toHaveLength(16);
    stub.fire(); // a system `change`

    expect(setItem, 'setItem was never called').not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });

  it('The page source names no other store', () => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else files.push(path);
      }
    };
    walk(`${process.cwd()}/src`);
    files.push(`${process.cwd()}/index.html`);
    expect(files.length, 'premise: the scan reads files').toBeGreaterThan(5);
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const name of ['sessionStorage', 'document.cookie', 'indexedDB']) {
        if (text.includes(name)) offenders.push(`${file} names ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('The stored choice survives a remount', () => {
    const first = mountFixture(PAIR_ROW);
    pressTheme(first, 'dark');
    expect(localStorage.getItem(THEME_KEY), 'premise: the press stored the choice').toBe('dark');
    document.documentElement.removeAttribute('data-theme'); // the remount has to set the attribute from the stored value itself

    const second = mountOn(document.createElement('div'));

    expect(checkedTheme(second)).toBe('dark');
    expect(documentTheme()).toBe('dark');
  });
});

describe('Invalid or missing stored values fall back', () => {
  const BAD_VALUES: [string, string | null][] = [
    ['key missing', null],
    ['empty string', ''],
    ['Dark', 'Dark'],
    ['system', 'system'],
    ['ru', 'ru'],
    ['{}', '{}'],
  ];

  for (const [label, stored] of BAD_VALUES) {
    it(`Each bad theme value gives auto (${label})`, () => {
      if (stored !== null) localStorage.setItem(THEME_KEY, stored);
      installMatchMedia(true); // a dark system: the system theme is told from the default light
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem');

      const root = mountFixture(PAIR_ROW);

      expect(checkedTheme(root), '«Як у системі» only').toBe('auto');
      expect(documentTheme(), 'the effective theme is the system theme').toBe('dark');
      expect(setItem, 'no setItem').not.toHaveBeenCalled();
      expect(removeItem, 'no removeItem').not.toHaveBeenCalled();
      expect(localStorage.getItem(THEME_KEY), 'the stored value is exactly as before the mount').toBe(stored);
    });
  }
});

describe('Failing storage does not stop the page', () => {
  it('The access to localStorage throws', () => {
    const baseline = collectPageText(mountFixture(PAIR_ROW)); // the page text on a working storage
    makeLocalStorageAccessThrow();
    const tracker = trackErrors();
    let root: HTMLElement;
    try {
      root = mountFixture(PAIR_ROW);
      pressTheme(root, 'dark');
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'the window error listener recorded nothing').toEqual([]);
    expect(allCells(root), 'the page shows its board').toHaveLength(36);
    expect(checkedTheme(root)).toBe('dark');
    expect(documentTheme()).toBe('dark');
    expect(collectPageText(root), 'no text was added to the page').toEqual(baseline);
  });

  it('getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('getItem is broken');
    });
    const tracker = trackErrors();
    let root: HTMLElement;
    try {
      root = mountFixture(PAIR_ROW);
    } finally {
      tracker.stop();
    }

    expect(tracker.errors).toEqual([]);
    expect(checkedTheme(root), 'the theme is auto').toBe('auto');
    expect(allCells(root), 'the board is shown').toHaveLength(36);
  });

  it('setItem throws and is not retried', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const root = mountFixture(PAIR_ROW);
    const tracker = trackErrors();
    try {
      pressTheme(root, 'dark');
      expect(setItem, 'setItem was called once').toHaveBeenCalledTimes(1);
      pressTheme(root, 'dark'); // the option is already chosen for the session
    } finally {
      tracker.stop();
    }

    expect(tracker.errors, 'no error reached the page').toEqual([]);
    expect(documentTheme()).toBe('dark');
    expect(setItem, 'a second press on the same option does not call setItem again').toHaveBeenCalledTimes(1);
  });

  // Review-gate fix round 2 (confirming run wf_6e154572-16a, autonomy-log row 130): «a press still applies the chosen theme for the rest of
  // the session» (FR-115) holds for the document, so a mount made later in the same session does not fall back to the default.
  it('A later mount keeps a session-only choice', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    const first = mountFixture(PAIR_ROW);
    pressTheme(first, 'dark');
    expect(setItem, 'premise: the press tried to store the choice').toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(THEME_KEY), 'premise: the storage does not hold it').toBeNull();

    const tracker = trackErrors();
    let second: HTMLElement;
    try {
      second = mountFixture(PAIR_ROW);
    } finally {
      tracker.stop();
    }

    expect(tracker.errors).toEqual([]);
    expect(checkedTheme(second), 'the later mount shows the session choice').toBe('dark');
    expect(documentTheme(), 'and keeps it on the document').toBe('dark');
    expect(setItem, 'nothing is retried').toHaveBeenCalledTimes(1);
  });
});

describe('Auto follows the system theme live (storage part)', () => {
  it('A system change writes nothing', () => {
    const stub = installMatchMedia(false);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    mountFixture(PAIR_ROW);
    expect(stub.listeners.length, 'premise: the page recorded a change listener').toBeGreaterThanOrEqual(1);

    stub.setMatches(true);
    stub.fire();

    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });
});

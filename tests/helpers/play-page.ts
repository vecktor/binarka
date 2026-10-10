// Test helpers for the play page (openspec/specs/play-page/spec.md).
// COORDINATES: every row/col taken or returned by the DOM helpers is 1-BASED, exactly as the page shows them
// (data-row / data-col). The engine is 0-based; conversions are written out where a test crosses the two.
import { afterEach, beforeEach, expect } from 'vitest';
import { findViolations, hint as engineHint, isSolved } from '../../src/engine/index';
import type { Cell, Grid, Hint, Puzzle } from '../../src/engine/index';
import { mountPlayPage } from '../../src/ui/index';
import type { PlayPageOptions } from '../../src/ui/index';
import { forgetSessionPreferences } from '../../src/ui/preferences';
import { VALID_4X4, boardOf, parseBoard, sortedCells } from './board';
import { removeInjectedStyles } from './css';

/** The default board size of the page (6); other sizes are chosen with `selectSize`. */
export const SIZE = 6;
/** The win message of FR-41, with the modifier letter apostrophe U+02BC (not the ASCII apostrophe U+0027). */
export const WIN_MESSAGE = "Вітаємо, головоломку розвʼязано!";
/** The engine's two no-target hint sentences (puzzle-engine spec, FR-25 / FR-26). */
export const NO_RULE_SENTENCE = 'Жодне з правил зараз не підказує наступного ходу.';
export const BROKEN_SENTENCE = 'Спершу виправте порушення правил, підсвічене на полі.';
export const HINT_LABEL = 'Підказка';
export const NEW_LABEL = 'Нова головоломка';
/** The page title and the header text (FR-68). Exact literals: tests never import src/ui/strings.ts. */
export const TITLE_TEXT = 'Бінарка';
export const RULES_LABEL = 'Правила';
export const RULES_CLOSE_LABEL = 'Зрозуміло';
/** The three rules texts of FR-57, in order. */
export const RULES_ITEMS = [
  'Не більше двох однакових цифр поспіль у рядку чи стовпці.',
  'У кожному рядку та стовпці порівну нулів і одиниць.',
  'Усі рядки різні, і всі стовпці різні.',
];
/**
 * The idle line of FR-71. The two spaces inside «0 і 1» are U+00A0 (written as the escape, never as a literal NBSP);
 * the «і» between them is the Cyrillic letter U+0456; the dash is U+2014.
 */
export const IDLE_TEXT = 'Натискайте клітинки, щоб ставити 0\u00A0і\u00A01. Правила — кнопка «Правила» вгорі.';
/**
 * FR-68 document order of the page, as selectors; the rules panel, the setup sheet and the dialog are outside this sequence.
 * Slice DL2 (add-level-selector), DELIBERATE CHANGE (FR-68, FR-95): the size control left the page body for the setup sheet,
 * the summary button `[data-action="setup"]` took its place; still nine elements.
 */
export const PAGE_ORDER = [
  'header',
  '[data-action="setup"]',
  '[data-board]',
  '[data-action="hint"]',
  '[data-action="reset"]',
  '[data-action="new"]',
  '[data-message="idle"]',
  '[data-message="hint"]',
  '[data-message="win"]',
];

// ---------------------------------------------------------------------------------------------------------
// Lifecycle: fresh roots, cleaned up after each test; document.title reset (jsdom starts with '').
// ---------------------------------------------------------------------------------------------------------

const roots: HTMLElement[] = [];

// ---- the dialog stubs (FR-67). jsdom 29 has HTMLDialogElement but neither showModal nor close (design.md, "jsdom limits").
// The stubs are installed before each test and removed after it; the page has no production fallback. showModal sets the
// `open` attribute (and throws InvalidStateError on an open dialog, as a browser does), close removes it. Neither stub
// dispatches an event: a test that needs Escape or the late `close` event uses `dialogEscape` / `dialogLateClose`.

/** Every call of the stubs and every mark a test adds with `markDialogLog`, in order: 'showModal', 'close', ... */
export const dialogLog: string[] = [];
/**
 * Slice DL2 (A-44): every dialog and popover stub call in ONE list, in call order ('showModal', 'close', 'showPopover',
 * 'hidePopover', 'togglePopover'), so a test can compare `hidePopover` with `showModal`. `dialogLog` keeps only the dialog calls.
 */
export const callOrder: string[] = [];
let showModalCount = 0;
let closeCount = 0;
let closeHook: (() => void) | null = null;

/** How many times the page called `showModal()` since the test began. */
export const showModalCalls = (): number => showModalCount;
/** How many times the page called `close()` since the test began. */
export const closeCalls = (): number => closeCount;
/** Run `hook` inside the `close` stub, before it removes `open` (to see the page at the moment `close()` is called). */
export function onDialogClose(hook: (() => void) | null): void {
  closeHook = hook;
}

function installDialogStubs(): void {
  dialogLog.length = 0;
  callOrder.length = 0;
  showModalCount = 0;
  closeCount = 0;
  closeHook = null;
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    writable: true,
    value(this: HTMLDialogElement): void {
      if (this.hasAttribute('open')) throw new DOMException('showModal on an open dialog', 'InvalidStateError');
      showModalCount += 1;
      dialogLog.push('showModal');
      callOrder.push('showModal');
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    writable: true,
    value(this: HTMLDialogElement): void {
      closeCount += 1;
      dialogLog.push('close');
      callOrder.push('close');
      closeHook?.();
      this.removeAttribute('open');
    },
  });
}

function removeDialogStubs(): void {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  closeHook = null;
}

// ---- the popover stubs (slice DL2, A-44). jsdom has no popover support: no `showPopover`, `hidePopover`, `togglePopover`.
// The stubs record every call (which method, on which element) and keep an open or closed state per element. `hidePopover`
// closes the state and dispatches NO event; a test dispatches the `toggle` event itself with `dispatchToggle`. Installed before
// each test and removed after it, like the dialog stubs; the page has no production fallback. The sheet is opened in a test by
// calling the stubbed `showPopover()` on it (`openSheet`); the native opening by the summary button is not tested in jsdom.

export type PopoverMethod = 'showPopover' | 'hidePopover' | 'togglePopover';
export interface PopoverCall {
  method: PopoverMethod;
  el: Element;
}
/** Every popover stub call since the test began, in order. */
export const popoverLog: PopoverCall[] = [];
let openPopovers = new WeakSet<Element>();

/** How many times `method` was called (on `el` when given, on any element otherwise) since the test began. */
export const popoverCalls = (method: PopoverMethod, el?: Element): number =>
  popoverLog.filter((call) => call.method === method && (el === undefined || call.el === el)).length;
/** True while the stub state of `el` is open (`showPopover` or a toggle to open was called, no `hidePopover` since). */
export const popoverIsOpen = (el: Element): boolean => openPopovers.has(el);

function installPopoverStubs(): void {
  popoverLog.length = 0;
  openPopovers = new WeakSet<Element>();
  const define = (name: PopoverMethod, value: (this: HTMLElement) => unknown): void => {
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, writable: true, value });
  };
  define('showPopover', function (this: HTMLElement): void {
    popoverLog.push({ method: 'showPopover', el: this });
    callOrder.push('showPopover');
    openPopovers.add(this);
  });
  define('hidePopover', function (this: HTMLElement): void {
    popoverLog.push({ method: 'hidePopover', el: this });
    callOrder.push('hidePopover');
    openPopovers.delete(this); // no event: the test dispatches `toggle` itself
  });
  define('togglePopover', function (this: HTMLElement): boolean {
    popoverLog.push({ method: 'togglePopover', el: this });
    callOrder.push('togglePopover');
    if (openPopovers.has(this)) openPopovers.delete(this);
    else openPopovers.add(this);
    return openPopovers.has(this);
  });
}

function removePopoverStubs(): void {
  for (const name of ['showPopover', 'hidePopover', 'togglePopover']) Reflect.deleteProperty(HTMLElement.prototype, name);
}

/**
 * What a browser dispatches asynchronously when a popover opens or closes: a `toggle` event with `newState`. jsdom has no
 * ToggleEvent, so this is a plain `Event` with `newState` and `oldState` added (it does not bubble, as the native one).
 */
export function dispatchToggle(el: Element, newState: 'open' | 'closed'): void {
  // update-setup-sheet-start (A-44, A-46): a closing `toggle` is what a browser sends after the popover closed, so the stub's
  // open state follows the event; a later mark helper then reopens the sheet through `showPopover()` like a player would.
  if (newState === 'closed') openPopovers.delete(el);
  else openPopovers.add(el);
  const event = Object.assign(new Event('toggle'), { newState, oldState: newState === 'open' ? 'closed' : 'open' });
  el.dispatchEvent(event);
}

// ---- add-theme-switch (A-50, FR-113, FR-115; design.md "Risks": cross-test leakage). jsdom's `localStorage` survives between the tests of
// a file, `<html data-theme>` and an injected `meta[name=theme-color]` too, and `matchMedia` is absent. The lifecycle below cleans
// all of it before AND after each test, and `installMatchMedia` installs the stub of A-50 (a test that needs "no matchMedia" simply
// does not install it; vitest's jsdom window carries an own accessor `matchMedia` whose value is `undefined`, which is the "absent" state).

/** The localStorage key of the theme preference (FR-113). */
export const THEME_KEY = 'binarka.theme';
export const SETTINGS_LABEL = 'Налаштування';
export const THEME_LABEL = 'Тема';
/** The three theme option texts of FR-102, in order, and their `data-theme-option` values. */
export const THEME_OPTION_LABELS = ['Світла', 'Темна', 'Як у системі'];
export const THEME_CHOICES = ['light', 'dark', 'auto'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
// ---- add-english-version: the language control and the English page (FR-107 to FR-111, FR-113). Exact literals, as everywhere here.
/** The localStorage key of the language preference (FR-113). */
export const LANGUAGE_KEY = 'binarka.language';
export type PageLanguage = 'uk' | 'en';
export type MountOptions = PlayPageOptions & { language?: PageLanguage };
export const LANGUAGE_CHOICES: readonly PageLanguage[] = ['uk', 'en'];
/** The visible label and the group name of the language control in Ukrainian mode ("Language" in English mode). */
export const LANGUAGE_LABEL = 'Мова';
/** The two option names: each is written in its own language in both modes (Q5). */
export const LANGUAGE_OPTION_LABELS = ['Українська', 'English'];

/** The system-theme query of FR-105. */
export const DARK_QUERY = '(prefers-color-scheme: dark)';

type ChangeListener = (event: { type: string; matches: boolean; media: string }) => void;

export interface MatchMediaStub {
  /** the current answer of the dark query */
  readonly matches: boolean;
  /** change the answer without firing anything */
  setMatches: (matches: boolean) => void;
  /** call every recorded `change` listener with the current answer (what the browser does when the system theme changes) */
  fire: () => void;
  /** the `change` listeners that are registered right now (add records, remove forgets) */
  listeners: ChangeListener[];
  /** every query string the page passed to `window.matchMedia` */
  queries: string[];
}

let savedMatchMedia: PropertyDescriptor | undefined;
let matchMediaTouched = false;

function defineMatchMedia(value: unknown): void {
  if (!matchMediaTouched) {
    savedMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    matchMediaTouched = true;
  }
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value });
}

function removeMatchMedia(): void {
  if (!matchMediaTouched) return;
  matchMediaTouched = false;
  if (savedMatchMedia === undefined) Reflect.deleteProperty(window, 'matchMedia');
  else Object.defineProperty(window, 'matchMedia', savedMatchMedia);
  savedMatchMedia = undefined;
}

/**
 * A-50: `window.matchMedia` returning `{ matches, media, addEventListener, removeEventListener }` for the dark query; the stub
 * records the `change` listeners and `fire()` calls them. Removed after each test by `installPageLifecycle`.
 */
export function installMatchMedia(matches = false): MatchMediaStub {
  let current = matches;
  const listeners: ChangeListener[] = [];
  const queries: string[] = [];
  const list = {
    get matches(): boolean {
      return current;
    },
    media: DARK_QUERY,
    addEventListener(type: string, listener: ChangeListener): void {
      if (type === 'change' && !listeners.includes(listener)) listeners.push(listener);
    },
    removeEventListener(type: string, listener: ChangeListener): void {
      const at = listeners.indexOf(listener);
      if (type === 'change' && at >= 0) listeners.splice(at, 1);
    },
  };
  defineMatchMedia((query: string) => {
    queries.push(query);
    return list;
  });
  return {
    get matches(): boolean {
      return current;
    },
    setMatches: (value) => {
      current = value;
    },
    fire: () => {
      for (const listener of [...listeners]) listener({ type: 'change', matches: current, media: DARK_QUERY });
    },
    listeners,
    queries,
  };
}

/** FR-105 "A broken matchMedia": a `window.matchMedia` that throws when it is called. */
export function installThrowingMatchMedia(): void {
  defineMatchMedia(() => {
    throw new Error('matchMedia is broken');
  });
}

/** FR-105 "A broken matchMedia": a `window.matchMedia` that returns an object without `addEventListener` (only `matches`). */
export function installMatchMediaWithoutListeners(matches: boolean): void {
  defineMatchMedia((query: string) => ({ matches, media: query }));
}

let savedLocalStorage: PropertyDescriptor | undefined;
let localStorageReplaced = false;

/** FR-115: the ACCESS to `window.localStorage` throws (storage blocked). Restored first thing by the lifecycle. */
export function makeLocalStorageAccessThrow(): void {
  if (!localStorageReplaced) {
    savedLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    localStorageReplaced = true;
  }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get(): Storage {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });
}

function restoreLocalStorage(): void {
  if (!localStorageReplaced) return;
  localStorageReplaced = false;
  if (savedLocalStorage === undefined) Reflect.deleteProperty(window, 'localStorage');
  else Object.defineProperty(window, 'localStorage', savedLocalStorage);
  savedLocalStorage = undefined;
}

/** The preferences leave nothing behind: the order matters (the storage getter comes back before the stores are cleared). */
function resetPreferenceEnvironment(): void {
  forgetSessionPreferences(); // the page's session-only values outlive a test, as no page reload happens between tests
  restoreLocalStorage();
  removeMatchMedia();
  localStorage.clear();
  sessionStorage.clear();
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim() ?? '';
    if (name !== '') document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('lang'); // the page sets <html lang> (FR-109); jsdom starts without one
  document.documentElement.style.removeProperty('color-scheme');
  for (const meta of Array.from(document.head.querySelectorAll('meta[name="theme-color"]'))) meta.remove();
}

/** Add a `meta[name="theme-color"]` to the document head (jsdom's head has none); the lifecycle removes it after the test. */
export function addThemeColorMeta(content = '#f9fafb'): HTMLMetaElement {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
  return meta;
}

/** Call once at the top of a test file. */
export function installPageLifecycle(): void {
  beforeEach(() => {
    document.title = '';
    resetPreferenceEnvironment();
    installDialogStubs();
    installPopoverStubs();
  });
  afterEach(() => {
    for (const root of roots.splice(0)) root.remove();
    document.body.replaceChildren();
    document.title = '';
    removeInjectedStyles(); // stylesheets a test injected to read the cascade (tests/helpers/css.ts)
    removeDialogStubs();
    removePopoverStubs();
    resetPreferenceEnvironment();
  });
}

/** Mount onto an existing root (appended to document.body when it is not attached yet). */
export function mountOn(root: HTMLElement, options?: MountOptions): HTMLElement {
  if (!root.isConnected) document.body.appendChild(root);
  if (!roots.includes(root)) roots.push(root);
  // add-english-version (FR-113): `language` starts the page in that language by storing `binarka.language` BEFORE the mount, as a player's
  // earlier press would have; it is not an option of the page.
  const { language, ...pageOptions } = options ?? {};
  if (language !== undefined) storeLanguage(language);
  mountPlayPage(root, pageOptions);
  return root;
}

/** Mount into a fresh <div> appended to document.body. */
export function mountPage(options?: MountOptions): HTMLElement {
  return mountOn(document.createElement('div'), options);
}

/** Mount a fixture puzzle (the injected generator returns it for its own size and throws for any other size). */
export function mountFixture(puzzle: Puzzle, options: Omit<MountOptions, 'generate'> = {}): HTMLElement {
  return mountPage({ seedSource: () => 1, ...options, generate: fixedGenerate(puzzle) });
}

// ---------------------------------------------------------------------------------------------------------
// Injected generator / seed source
// ---------------------------------------------------------------------------------------------------------

/** A fixture of the requested size, or a THROW when the requested size differs from the fixture size (slice 3, FR-43). */
function fixtureOfSize(puzzle: Puzzle, size: number): Puzzle {
  if (puzzle.size !== size) throw new Error(`fixture is ${puzzle.size}x${puzzle.size} but size ${size} was requested`);
  return puzzle;
}

/**
 * Slice DL2 (FR-88, A-44): a generator takes a third argument, the level. It is typed OPTIONAL here, so these helpers compile
 * against the page of today (`generate(size, seed)`) and against the widened `generate(size, seed, level)`.
 */
export type TestGenerate = (size: number, seed: number, level?: number) => Puzzle;

export function fixedGenerate(puzzle: Puzzle): TestGenerate {
  return (size) => fixtureOfSize(puzzle, size);
}

/** A generator that returns the fixture registered for the requested size (else throws). */
export function generatorBySize(fixtures: Partial<Record<number, Puzzle>>): TestGenerate {
  const pick = bySize(fixtures);
  return (size, seed, level) => pick(0, size, seed, level);
}

/** A pick function for `generateSpy` / a generator that returns the fixture registered for the requested size (else throws). */
export function bySize(
  fixtures: Partial<Record<number, Puzzle>>,
): (callIndex: number, size: number, seed: number, level?: number) => Puzzle {
  return (_i, size) => {
    const puzzle = fixtures[size];
    if (puzzle === undefined) throw new Error(`no fixture registered for size ${size}`);
    return fixtureOfSize(puzzle, size);
  };
}

export interface GenerateSpy {
  generate: TestGenerate;
  /** every call as `{ size, seed }` (the level is in `levels`, so earlier assertions on `calls` keep their shape) */
  calls: { size: number; seed: number }[];
  /** the third argument of every call, parallel to `calls`; `undefined` when the page passed none */
  levels: (number | undefined)[];
}

/**
 * A generator that records every (size, seed) and returns `pick(callIndex, size, seed, level)`. The result must be of the
 * requested size, otherwise the spy THROWS (a fixture of another size is a test-writing error; slice 3). A scenario that
 * needs a generator error or a wrong-size result uses `rawGenerateSpy`.
 */
export function generateSpy(pick: (callIndex: number, size: number, seed: number, level?: number) => Puzzle): GenerateSpy {
  return rawGenerateSpy((i, size, seed, level) => fixtureOfSize(pick(i, size, seed, level), size));
}

/** Like `generateSpy` but returns whatever `pick` returns (or throws whatever it throws): for the generator-error scenarios. */
export function rawGenerateSpy(pick: (callIndex: number, size: number, seed: number, level?: number) => Puzzle): GenerateSpy {
  const calls: { size: number; seed: number }[] = [];
  const levels: (number | undefined)[] = [];
  return {
    calls,
    levels,
    generate: (size, seed, level) => {
      calls.push({ size, seed });
      levels.push(level);
      return pick(calls.length - 1, size, seed, level);
    },
  };
}

export interface SeedQueue {
  source: () => number;
  /** how many times the page has called the source */
  calls: () => number;
}

/** Returns the listed seeds in order; after the list it keeps counting up from the last one. */
export function seedQueue(values: number[]): SeedQueue {
  let n = 0;
  return {
    source: () => {
      const v = values[n] ?? (values[values.length - 1] ?? 0) + (n - values.length + 1);
      n += 1;
      return v;
    },
    calls: () => n,
  };
}

// ---------------------------------------------------------------------------------------------------------
// DOM access (every lookup asserts, so an empty page fails on an assertion with a readable message)
// ---------------------------------------------------------------------------------------------------------

export function q(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  expect.assert(el !== null, `expected an element matching ${selector}`); // narrows el; expect().not.toBeNull() does not
  return el;
}

export function cellEl(root: ParentNode, row: number, col: number): HTMLElement {
  return q(root, `[data-cell][data-row="${row}"][data-col="${col}"]`);
}

export function allCells(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-cell]'));
}

/** N of the board shown, from [data-board]'s data-size (asserts it is a whole number >= 1). */
export function boardSize(root: ParentNode): number {
  const raw = q(root, '[data-board]').getAttribute('data-size');
  const n = Number(raw);
  expect(Number.isInteger(n) && n >= 1, `data-size "${raw}" is a whole number`).toBe(true);
  return n;
}

/** The size of the board shown, asserting the cell count is N*N (so a half-built board fails on an assertion). */
function expectedBoardSize(root: ParentNode): number {
  const n = boardSize(root);
  expect(allCells(root), `expected ${n * n} [data-cell] elements for a ${n}x${n} board`).toHaveLength(n * n);
  return n;
}

export const cellText = (root: ParentNode, row: number, col: number): string => cellEl(root, row, col).textContent;

export const isGivenCell = (root: ParentNode, row: number, col: number): boolean =>
  cellEl(root, row, col).getAttribute('data-given') === 'true';

export const hasViolationClass = (root: ParentNode, row: number, col: number): boolean =>
  cellEl(root, row, col).classList.contains('cell-violation');

function parseCellText(text: string, where: string): Cell {
  if (text === '') return null;
  if (text === '0') return 0;
  if (text === '1') return 1;
  throw new Error(`cell ${where} shows "${text}", expected empty, 0 or 1`);
}

/** Read the board from the DOM into the engine's 0-based grid (cell text only). Asserts N*N cells first (N = data-size). */
export function readBoard(root: ParentNode): Grid {
  const n = expectedBoardSize(root);
  const board: Grid = Array.from({ length: n }, () => Array.from({ length: n }, (): Cell => null));
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const row = board[r - 1];
      if (row === undefined) throw new Error('unreachable');
      row[c - 1] = parseCellText(cellText(root, r, c), `${r},${c}`);
    }
  }
  return board;
}

/** The data-given flags, 0-based grid of booleans. */
export function readGivenFlags(root: ParentNode): boolean[][] {
  const n = expectedBoardSize(root);
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => isGivenCell(root, r + 1, c + 1)));
}

/** Every cell as one string: position, text, data-given, sorted class list. Row-major. */
export function snapshot(root: ParentNode): string[] {
  const n = expectedBoardSize(root);
  const out: string[] = [];
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      const el = cellEl(root, r, c);
      out.push(`${r},${c}|${el.textContent}|${el.getAttribute('data-given')}|${[...el.classList].sort().join(' ')}`);
    }
  }
  return out;
}

/** Cells (1-based [row, col], sorted) that carry the class cell-violation. Asserts N*N cells first. */
export function violationCells(root: ParentNode): [number, number][] {
  expectedBoardSize(root);
  const out: [number, number][] = [];
  for (const el of allCells(root)) {
    if (el.classList.contains('cell-violation')) {
      out.push([Number(el.getAttribute('data-row')), Number(el.getAttribute('data-col'))]);
    }
  }
  return sortedCells(out);
}

/** Cells (1-based [row, col], sorted) that carry the class cell-hinted (FR-66). Asserts N*N cells first. */
export function hintedCells(root: ParentNode): [number, number][] {
  expectedBoardSize(root);
  const out: [number, number][] = [];
  for (const el of allCells(root)) {
    if (el.classList.contains('cell-hinted')) {
      out.push([Number(el.getAttribute('data-row')), Number(el.getAttribute('data-col'))]);
    }
  }
  return sortedCells(out);
}

/**
 * The cells the page must highlight for a board, from the real rule checker, 1-based, de-duplicated and sorted.
 * 'three' and 'duplicate' violations highlight the cells the checker lists. A 'count' violation highlights EVERY
 * cell of its row or column (FR-36: "all six cells of that row"), although the checker lists only the cells holding
 * the over-represented digit.
 */
export function checkerCells(board: Grid): [number, number][] {
  const seen = new Map<string, [number, number]>();
  const add = (r: number, c: number): void => void seen.set(`${r + 1},${c + 1}`, [r + 1, c + 1]);
  for (const v of findViolations(board)) {
    if (v.rule === 'count') {
      for (let i = 0; i < board.length; i++) {
        if (v.axis === 'row') add(v.index, i);
        else add(i, v.index);
      }
    } else {
      for (const [r, c] of v.cells) add(r, c);
    }
  }
  return sortedCells([...seen.values()]);
}

export const hintMessage = (root: ParentNode): string => q(root, '[data-message="hint"]').textContent;
export const winMessage = (root: ParentNode): string => q(root, '[data-message="win"]').textContent;

/** The rules panel of FR-57: asserts that there is exactly one `[data-section="rules"]` in `root`, returns it. */
export function rulesPanel(root: ParentNode): HTMLElement {
  const found = root.querySelectorAll<HTMLElement>('[data-section="rules"]');
  expect(found, 'exactly one [data-section="rules"] in the root').toHaveLength(1);
  const panel = found[0];
  expect.assert(panel !== undefined, 'premise: exactly one rules panel was found');
  return panel;
}

/** The message area of FR-68: the parent element of the idle line (asserts the idle line exists). */
export function messageArea(root: ParentNode): HTMLElement {
  const parent = q(root, '[data-message="idle"]').parentElement;
  expect(parent, 'the idle line has a parent element').not.toBeNull();
  expect.assert(parent !== null, 'the idle line has a parent element');
  return parent;
}

/** The text of an element without the text of its descendants that have aria-hidden="true" (decorative examples, A-26). */
export function textWithoutHidden(el: Element): string {
  const copy = el.cloneNode(true) as Element;
  for (const hidden of Array.from(copy.querySelectorAll('[aria-hidden="true"]'))) hidden.remove();
  return copy.textContent;
}

/** Assert that each element follows the previous one in document order (and is not contained in it). */
export function expectInDocumentOrder(elements: Element[]): void {
  for (let i = 1; i < elements.length; i++) {
    const prev = elements[i - 1];
    const next = elements[i];
    expect.assert(prev !== undefined && next !== undefined, `premise: elements ${i - 1} and ${i} exist`);
    const position = prev.compareDocumentPosition(next);
    expect((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0, `element ${i} follows element ${i - 1} in document order`).toBe(true);
    expect((position & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0, `element ${i} is not inside element ${i - 1}`).toBe(false);
  }
}

/**
 * Assert the structural elements every rendered page has (so a negative check can never pass on an empty page): the
 * board of `size` (6 by default) as an ARIA grid of `size` rows (FR-61), the size selector with its wrapping label
 * (FR-43, FR-62), both buttons, both status regions (FR-63) and exactly one Tab stop (FR-59).
 * Slice 6 (add-page-accessibility) DELIBERATE CHANGE: the grid, row, label, status and Tab stop checks follow the new
 * spec; no old check was removed or weakened. The grid role is asserted FIRST so that the first failure line of every
 * red test that reaches this helper names the missing grid.
 */
export function expectPageStructure(root: ParentNode, size = 6): void {
  expect(q(root, '[data-board]').getAttribute('data-size')).toBe(String(size));
  expect(allCells(root)).toHaveLength(size * size);
  q(root, '[data-control="size"]');
  q(root, '[data-action="hint"]');
  q(root, '[data-action="reset"]');
  q(root, '[data-action="new"]');
  q(root, '[data-message="hint"]');
  q(root, '[data-message="win"]');
  // FR-68 (update-page-layout): the header with the title heading and the rules button, the idle line, the rules panel
  const header = q(root, 'header');
  const headings = Array.from(header.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  expect(headings.map((h) => h.textContent), 'the header holds the title heading').toContain(TITLE_TEXT);
  expect(header.querySelectorAll('[data-action="rules"]'), 'the header holds the rules button').toHaveLength(1);
  q(root, '[data-message="idle"]');
  rulesPanel(root);
  messageArea(root);
  // the document order of FR-68 (the panel is outside the sequence)
  expectInDocumentOrder(PAGE_ORDER.map((selector) => q(root, selector)));
}

// ---------------------------------------------------------------------------------------------------------
// Slice 6 (FR-59 to FR-63): keyboard, Tab stop, roles and names
// ---------------------------------------------------------------------------------------------------------

/**
 * Dispatch a bubbling, CANCELABLE `keydown` or `keyup` on `el` and return the event, so a test reads `defaultPrevented`
 * after the dispatch. A non-cancelable event can never show a `preventDefault()` call, which would make every "not
 * prevented" check vacuous; `init.cancelable` can switch it off for the helper self-check only. A single space is
 * `key: ' '`; `repeat` and the modifiers go through `init`. No uncaught listener error is allowed (dispatchEvent
 * swallows them, see `trackErrors`).
 */
export function pressKeyEvent(el: Element, type: 'keydown' | 'keyup', key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init });
  const tracker = trackErrors();
  try {
    el.dispatchEvent(event);
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, `no uncaught error while handling ${type} "${key}"`).toEqual([]);
  return event;
}

/** `pressKeyEvent` for a `keydown`. */
export function pressKey(el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return pressKeyEvent(el, 'keydown', key, init);
}

/** Give a cell DOM focus and assert it took it (an element that cannot take focus fails here). */
export function focusCell(root: ParentNode, row: number, col: number): HTMLElement {
  const el = cellEl(root, row, col);
  el.focus();
  expectActive(el, `cell ${row},${col} takes DOM focus`);
  return el;
}

/** Assert that `el` is `document.activeElement` (a boolean check, so a failure does not print the whole page). */
export function expectActive(el: Element, what: string): void {
  expect(document.activeElement === el, `${what} (DOM focus is on ${describeElement(document.activeElement)})`).toBe(true);
}

function describeElement(el: Element | null): string {
  if (el === null) return 'nothing';
  const attrs = ['data-action', 'data-control', 'data-row', 'data-col', 'role'].filter((a) => el.hasAttribute(a));
  return `<${el.tagName.toLowerCase()}${attrs.map((a) => ` ${a}="${el.getAttribute(a) ?? ''}"`).join('')}>`;
}

/**
 * The FR-70 label a cell must carry, built from its own `data-row`, `data-col`, text, `data-given` and the class
 * `cell-hinted`: «Рядок R, стовпець C, V» with V «порожньо», «0» or «1», then «, задано» for a given or «, підказка» for a
 * hinted cell (a violation adds no suffix). Written independently of the page: it does not import src/ui/strings.ts.
 */
export function expectedCellLabel(cell: Element): string {
  const value = cell.textContent === '' ? 'порожньо' : cell.textContent;
  const suffix = cell.getAttribute('data-given') === 'true' ? ', задано' : cell.classList.contains('cell-hinted') ? ', підказка' : '';
  return `Рядок ${cell.getAttribute('data-row') ?? ''}, стовпець ${cell.getAttribute('data-col') ?? ''}, ${value}${suffix}`;
}

/** Assert that DOM focus is on the cell at (row, col). */
export function expectFocusOn(root: ParentNode, row: number, col: number): void {
  expectActive(cellEl(root, row, col), `DOM focus is on cell ${row},${col}`);
}

// ---------------------------------------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------------------------------------

export function clickCell(root: ParentNode, row: number, col: number, times = 1): void {
  const el = cellEl(root, row, col);
  for (let i = 0; i < times; i++) el.click();
}

/** Click until the cell shows `text` ('' | '0' | '1'); at most 3 clicks (a full cycle). */
export function clickUntil(root: ParentNode, row: number, col: number, text: string): void {
  for (let i = 0; i < 3 && cellText(root, row, col) !== text; i++) clickCell(root, row, col);
  expect(cellText(root, row, col)).toBe(text);
}

/** Set an EMPTY non-given cell to a digit by clicking (one click for 0, two for 1). */
export function setCellTo(root: ParentNode, row: number, col: number, value: 0 | 1): void {
  expect(cellText(root, row, col), `cell ${row},${col} must be empty before it is set`).toBe('');
  expect(isGivenCell(root, row, col), `cell ${row},${col} must not be a given`).toBe(false);
  clickCell(root, row, col, value + 1);
  expect(cellText(root, row, col)).toBe(String(value));
}

/** Set empty non-given cells of one row from text such as '0 0 1 . 1 .' ('.' = leave alone), left to right. */
export function setRow(root: ParentNode, row: number, text: string, only?: number[]): void {
  text
    .trim()
    .split(/\s+/)
    .forEach((token, i) => {
      if (token === '.' || (only !== undefined && !only.includes(i + 1))) return;
      setCellTo(root, row, i + 1, token === '0' ? 0 : 1);
    });
}

/** Set empty non-given cells of one column from text written top to bottom. */
export function setCol(root: ParentNode, col: number, text: string, only?: number[]): void {
  text
    .trim()
    .split(/\s+/)
    .forEach((token, i) => {
      if (token === '.' || (only !== undefined && !only.includes(i + 1))) return;
      setCellTo(root, i + 1, col, token === '0' ? 0 : 1);
    });
}

/** Fill every non-given cell with the digit of `grid` (0-based grid), except the 1-based cells in `skip`. */
export function fillFrom(root: ParentNode, puzzle: Puzzle, grid: Grid, skip: [number, number][] = []): void {
  const n = puzzle.givens.length;
  for (let r = 1; r <= n; r++) {
    for (let c = 1; c <= n; c++) {
      if (puzzle.givens[r - 1]?.[c - 1] !== null) continue;
      if (skip.some(([sr, sc]) => sr === r && sc === c)) continue;
      const value = grid[r - 1]?.[c - 1];
      if (value === null || value === undefined) continue;
      setCellTo(root, r, c, value);
    }
  }
}

export const pressHint = (root: ParentNode): void => { q(root, '[data-action="hint"]').click(); };
export const pressNew = (root: ParentNode): void => { q(root, '[data-action="new"]').click(); };

export interface ErrorTracker {
  /** everything the window 'error' event reported while the tracker was active */
  errors: unknown[];
  stop: () => void;
}

/**
 * A `window` 'error' listener. dispatchEvent() never throws when a listener throws (jsdom reports the exception on
 * window instead), so a "does not throw" check around dispatchEvent is vacuous: this listener is the only detector.
 * Always `stop()` it (try/finally) so a listener never leaks into the next test.
 */
export function trackErrors(): ErrorTracker {
  const errors: unknown[] = [];
  const listener = (event: ErrorEvent): void => {
    event.preventDefault();
    errors.push(event.error ?? event.message);
  };
  window.addEventListener('error', listener);
  return { errors, stop: () => { window.removeEventListener('error', listener); } };
}

// ---- the size control (FR-43, FR-73): a radiogroup of three buttons, found by order and label, never by a data hook ----

/** The sizes, in the order of the three buttons. */
const SIZE_ORDER = [4, 6, 8];
/**
 * add-english-version DELIBERATE CHANGE (FR-111, FR-43; the helpers find a button by its position AND its text): the text is the one of the page
 * language, read from <html lang> ("Grid n×n" in English mode, «Поле n×n» otherwise); the lookup by position is unchanged.
 */
const pageIsEnglish = (): boolean => document.documentElement.getAttribute('lang') === 'en';
const sizeButtonText = (n: number): string => (pageIsEnglish() ? `Grid ${n}×${n}` : `Поле ${n}×${n}`);

/** The size control `[data-control="size"]`, asserted to be a radiogroup of exactly three `button[role="radio"]`. */
export function sizeControl(root: ParentNode): HTMLElement {
  const el = q(root, '[data-control="size"]');
  expect(el.getAttribute('role'), 'the size control is a radiogroup').toBe('radiogroup');
  const radios = el.querySelectorAll('button[role="radio"]');
  expect(radios, 'the size control holds three button[role=radio]').toHaveLength(3);
  return el;
}

/** The three size buttons in document order. */
export function sizeButtons(root: ParentNode): HTMLElement[] {
  return Array.from(sizeControl(root).querySelectorAll<HTMLElement>('button[role="radio"]'));
}

/** The button of size `n` (4, 6 or 8), found by its position AND its text «Поле n×n» (the data-size-option hook is not in the spec). */
export function sizeButton(root: ParentNode, n: number): HTMLElement {
  const index = SIZE_ORDER.indexOf(n);
  expect(index, `${n} is one of the sizes 4, 6, 8`).toBeGreaterThanOrEqual(0);
  const button = sizeButtons(root)[index];
  expect.assert(button !== undefined, `premise: the size control has a button ${index + 1}`);
  expect(button.textContent, `button ${index + 1} of the size control is «${sizeButtonText(n)}»`).toBe(sizeButtonText(n));
  return button;
}

/** The size whose button has aria-checked="true"; asserts that every button says "true" or "false" and exactly one says "true". */
export function checkedSize(root: ParentNode): number {
  const states = sizeButtons(root).map((b) => b.getAttribute('aria-checked'));
  for (const state of states) expect(['true', 'false'], 'aria-checked is "true" or "false" on every size button').toContain(state);
  const checked = SIZE_ORDER.filter((_, i) => states[i] === 'true');
  expect(checked, `exactly one size button is checked (states ${states.join(',')})`).toHaveLength(1);
  const only = checked[0];
  expect.assert(only !== undefined, 'premise: one size button is checked');
  return only;
}

/** True when the board shown has a player entry: a non-given cell that is not empty (FR-67, A-8, A-29). Read from the DOM only. */
export function hasPlayerEntries(root: ParentNode): boolean {
  return allCells(root).some((c) => c.getAttribute('data-given') === 'false' && c.textContent !== '');
}

/**
 * update-setup-sheet-start (FR-43, FR-73, FR-100): a MARKING press of the size button of `n`. It marks the size and does
 * nothing else on the page. The sheet is opened through the stubbed `showPopover()` only while the stub's state is closed, so
 * a sheet that the page closed (or the test closed) is reopened, and an open sheet is not opened twice. It never presses
 * «Почати». Replaces the raw `pressSizeButton`, which pressed once and expected a puzzle (the old model, autonomy-log row 114).
 */
export function markSize(root: ParentNode, n: number): void {
  openSheetIfClosed(root);
  sizeButton(root, n).click();
}
export const pressReset = (root: ParentNode): void => { q(root, '[data-action="reset"]').click(); };

// ---- the confirmation dialog (FR-67) ----

/** `[data-dialog="confirm"]`, asserted to be a <dialog> element. */
export function dialogOf(root: ParentNode): HTMLDialogElement {
  const el = q(root, '[data-dialog="confirm"]');
  expect(el.tagName, 'the confirmation is a dialog element').toBe('DIALOG');
  return el as HTMLDialogElement;
}

/** True while the dialog has the `open` attribute (the stubs set and remove it). */
export const dialogIsOpen = (root: ParentNode): boolean => dialogOf(root).hasAttribute('open');

function pressInDialog(root: ParentNode, which: 'yes' | 'no'): void {
  expect(dialogIsOpen(root), `the dialog is open before «${which}» is pressed`).toBe(true);
  const tracker = trackErrors();
  try {
    q(dialogOf(root), `[data-confirm="${which}"]`).click();
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, 'no uncaught error during the press').toEqual([]);
}

/** Press «Так, почати» (asserts the dialog is open and that no uncaught error happened). */
export const confirmYes = (root: ParentNode): void => { pressInDialog(root, 'yes'); };
/** Press «Скасувати» (asserts the dialog is open and that no uncaught error happened). */
export const confirmNo = (root: ParentNode): void => { pressInDialog(root, 'no'); };

/**
 * What a browser does when the player presses Escape in a modal dialog: `cancel`, then the dialog is closed (the `open`
 * attribute goes) and `close` fires. The `open` attribute is removed between the two events because a browser does it
 * and the page's guard `dialog.hasAttribute('open')` reads it; the spec names only the two events.
 */
export function dialogEscape(root: ParentNode): void {
  const dialog = dialogOf(root);
  expect(dialog.hasAttribute('open'), 'the dialog is open before Escape').toBe(true);
  dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
  dialog.removeAttribute('open');
  dialog.dispatchEvent(new Event('close'));
}

/** The `close` event that a browser fires asynchronously after `close()` was called (the stub fires none). */
export function dialogLateClose(root: ParentNode): void {
  dialogOf(root).dispatchEvent(new Event('close'));
}

/** Press «Нова головоломка» and, when the board has entries, press «Так, почати» (asserts the dialog opened exactly then). */
export function startNewPuzzle(root: ParentNode): void {
  const asks = hasPlayerEntries(root);
  pressNew(root);
  expect(dialogIsOpen(root), 'the dialog opens exactly when the board has entries').toBe(asks);
  if (asks) confirmYes(root);
}

/** Press «Скинути» and, when the board has entries, press «Так, почати» (asserts the dialog opened exactly then). */
export function resetBoard(root: ParentNode): void {
  const asks = hasPlayerEntries(root);
  pressReset(root);
  expect(dialogIsOpen(root), 'the dialog opens exactly when the board has entries').toBe(asks);
  if (asks) confirmYes(root);
}

/**
 * The player CHOOSES a size (the reading rule of «Setup sheet», FR-101): open the sheet when it is closed, mark the size, press
 * «Почати» and, when the dialog opened, press «Так, почати». The dialog must open exactly when the board has player entries
 * (FR-67): «Почати» is never a no-op, so also a choice of the size already shown asks (SD-Q2). No uncaught error is allowed.
 */
export function selectSize(root: ParentNode, size: number): void {
  const asks = hasPlayerEntries(root);
  const tracker = trackErrors();
  try {
    markSize(root, size);
    pressStart(root);
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, 'no uncaught error during the size choice').toEqual([]);
  expect(dialogIsOpen(root), 'the dialog opens exactly when the board has entries').toBe(asks);
  if (asks) confirmYes(root);
}

// ---- slice DL2 (add-level-selector): the summary button, the setup sheet, the level control ----

/** The level names of FR-87, in the order of the four buttons (levels 1 to 4). Exact literals: tests never import strings.ts. */
export const LEVEL_NAMES = ['Розминка', 'Задачка', 'Головоломка', 'Мозколамка'];
/** The four descriptions of FR-89 (final wording of the user, autonomy-log rows 89 and 90). */
export const LEVEL_DESCRIPTIONS = [
  'Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр.',
  'Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.',
  'Додатково треба порівнювати рядки і стовпці: двох однакових не буває.',
  'Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра.',
];
/** The 4x4 reason of FR-91 (confirmed by the user, task 1.5): guillemets and the final full stop are part of the text. */
export const REASON_4X4 = 'Для поля 4×4 є лише рівень «Розминка».';
export const SHEET_LABEL = 'Поле і складність';
export const CLOSE_LABEL = 'Закрити';
/** The label of the start button of the setup sheet (FR-101). */
export const START_LABEL = 'Почати';
export const LEVEL_GROUP_LABEL = 'Складність';
export const SIZE_GROUP_LABEL = 'Розмір поля';
/** The visually hidden prefix of the summary button: ends in ONE ordinary space. */
export const SUMMARY_PREFIX = 'Поле і складність: ';
export const TECHNIQUES_HEADING = 'Складніші прийоми';
/** The three techniques items of FR-93 (confirmed by the user, task 1.5), in order. */
export const TECHNIQUES_ITEMS = [
  'Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.',
  'Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.',
  'Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.',
];

/** `N×N · Name` with ordinary spaces around U+00B7 (FR-95, ambiguity H). */
export const summaryLabel = (n: number, level: number): string => `${n}×${n} · ${LEVEL_NAMES[level - 1] ?? '?'}`;

/** The setup sheet `[data-section="setup"]` (FR-96): asserts that there is exactly one in `root`. */
export function sheetOf(root: ParentNode): HTMLElement {
  const found = root.querySelectorAll<HTMLElement>('[data-section="setup"]');
  expect(found, 'exactly one [data-section="setup"] in the root').toHaveLength(1);
  const sheet = found[0];
  expect.assert(sheet !== undefined, 'premise: exactly one setup sheet was found');
  return sheet;
}

/** The summary button `[data-action="setup"]` (FR-95): asserts that there is exactly one in `root`. */
export function summaryButton(root: ParentNode): HTMLElement {
  const found = root.querySelectorAll<HTMLElement>('[data-action="setup"]');
  expect(found, 'exactly one [data-action="setup"] in the root').toHaveLength(1);
  const button = found[0];
  expect.assert(button !== undefined, 'premise: exactly one summary button was found');
  return button;
}

/** The close button `[data-action="setup-close"]` of the sheet. */
export const sheetCloseButton = (root: ParentNode): HTMLElement => q(sheetOf(root), '[data-action="setup-close"]');

/** The start button `[data-action="setup-start"]` «Почати» of the sheet (FR-101). */
export const sheetStartButton = (root: ParentNode): HTMLElement => q(sheetOf(root), '[data-action="setup-start"]');

/** The player opens the sheet: the test calls the stubbed `showPopover()` on it (the native opening is not tested in jsdom). */
export function openSheet(root: ParentNode): HTMLElement {
  const sheet = sheetOf(root);
  sheet.showPopover();
  return sheet;
}

/**
 * Open the sheet only while the stub's state is closed (update-setup-sheet-start). A marking press happens inside an open
 * sheet; a sheet that «Почати», «Скасувати» or a test closed has to be opened again first, and an open one must not get a
 * second `showPopover()` (the logs count the calls).
 */
export function openSheetIfClosed(root: ParentNode): HTMLElement {
  const sheet = sheetOf(root);
  if (!popoverIsOpen(sheet)) sheet.showPopover();
  return sheet;
}

/** The player presses «Почати» (FR-101). No confirmation is given and nothing is asserted about the outcome. */
export const pressStart = (root: ParentNode): void => { sheetStartButton(root).click(); };

/**
 * The player presses «Закрити»: the click, then the closing `toggle` that a browser dispatches after the native close (jsdom does
 * not act on `popovertarget`, so the test sends the event itself, as `play-page-setup-sheet.test.ts` always did; the toggle also
 * clears the stub's open state). The page then drops the marked choice (FR-100, A-46).
 */
export function pressClose(root: ParentNode): void {
  sheetCloseButton(root).click();
  dispatchToggle(sheetOf(root), 'closed');
}

// ---- add-theme-switch (FR-68, FR-102, FR-117): the settings button, the settings panel and the theme control ----

function exactlyOne(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelectorAll<HTMLElement>(selector);
  expect(found, `exactly one ${selector} in the root`).toHaveLength(1);
  const only = found[0];
  expect.assert(only !== undefined, `premise: exactly one ${selector} was found`);
  return only;
}

/** The settings button `[data-action="settings"]` (FR-117): asserts that there is exactly one in `root`. */
export const settingsButton = (root: ParentNode): HTMLElement => exactlyOne(root, '[data-action="settings"]');
/** The settings panel `[data-section="settings"]` (FR-117): asserts that there is exactly one in `root`. */
export const settingsPanel = (root: ParentNode): HTMLElement => exactlyOne(root, '[data-section="settings"]');
/** The close button `[data-action="settings-close"]` of the settings panel. */
export const settingsCloseButton = (root: ParentNode): HTMLElement => q(settingsPanel(root), '[data-action="settings-close"]');
/** The theme control `[data-control="theme"]` (FR-102): asserts that there is exactly one in `root`. */
export const themeControl = (root: ParentNode): HTMLElement => exactlyOne(root, '[data-control="theme"]');
/** The three theme options in document order (asserts that the control holds exactly three buttons). */
export function themeOptions(root: ParentNode): HTMLElement[] {
  const options = Array.from(themeControl(root).querySelectorAll<HTMLElement>('button'));
  expect(options, 'the theme control holds three buttons').toHaveLength(3);
  return options;
}
/** The theme option `choice`, found by its `data-theme-option` value. */
export function themeOption(root: ParentNode, choice: ThemeChoice): HTMLElement {
  return q(themeControl(root), `button[data-theme-option="${choice}"]`);
}
/** The player presses the theme option `choice`. */
export const pressTheme = (root: ParentNode, choice: ThemeChoice): void => { themeOption(root, choice).click(); };
/** `aria-checked` of the three theme options as a list, for "unchanged" comparisons. */
export const themeStates = (root: ParentNode): (string | null)[] => themeOptions(root).map((b) => b.getAttribute('aria-checked'));
/** The theme whose option has aria-checked="true"; asserts that every option says "true" or "false" and exactly one says "true". */
export function checkedTheme(root: ParentNode): ThemeChoice {
  const states = themeStates(root);
  for (const state of states) expect(['true', 'false'], 'aria-checked is "true" or "false" on every theme option').toContain(state);
  const checked = THEME_CHOICES.filter((_, i) => states[i] === 'true');
  expect(checked, `exactly one theme option is checked (states ${states.join(',')})`).toHaveLength(1);
  const only = checked[0];
  expect.assert(only !== undefined, 'premise: one theme option is checked');
  return only;
}
/** The effective theme on the document: `<html data-theme>` (FR-104). */
export const documentTheme = (): string | null => document.documentElement.getAttribute('data-theme');
/** The player opens the settings panel: the test calls the stubbed `showPopover()` on it (A-44). */
export function openSettings(root: ParentNode): HTMLElement {
  const panel = settingsPanel(root);
  panel.showPopover();
  return panel;
}

// ---- the language control `[data-control="language"]` (FR-107), found through the settings panel like the theme control ----

/** Store a language as an earlier press would have (a test calls this BEFORE the mount; the lifecycle clears it after each test). */
export function storeLanguage(language: string): void {
  localStorage.setItem(LANGUAGE_KEY, language);
}
/** The language control `[data-control="language"]`: asserts that there is exactly one in `root`. */
export const languageControl = (root: ParentNode): HTMLElement => exactlyOne(root, '[data-control="language"]');
/** The two language options in document order (asserts that the control holds exactly two buttons). */
export function languageOptions(root: ParentNode): HTMLElement[] {
  const options = Array.from(languageControl(root).querySelectorAll<HTMLElement>('button'));
  expect(options, 'the language control holds two buttons').toHaveLength(2);
  return options;
}
/** The language option `language`, found by its `data-language-option` value. */
export function languageOption(root: ParentNode, language: PageLanguage): HTMLElement {
  return q(languageControl(root), `button[data-language-option="${language}"]`);
}
/** The player presses the language option `language`. */
export const pressLanguage = (root: ParentNode, language: PageLanguage): void => { languageOption(root, language).click(); };
/** `aria-checked` of the two language options as a list. */
export const languageStates = (root: ParentNode): (string | null)[] => languageOptions(root).map((b) => b.getAttribute('aria-checked'));
/** The language whose option has aria-checked="true"; asserts that exactly one says "true" and the other "false". */
export function checkedLanguage(root: ParentNode): PageLanguage {
  const states = languageStates(root);
  expect(states.slice().sort(), `exactly one language option is checked (states ${states.join(',')})`).toEqual(['false', 'true']);
  return states[0] === 'true' ? 'uk' : 'en';
}
/** `<html lang>` (FR-109). */
export const documentLanguage = (): string | null => document.documentElement.getAttribute('lang');

/** The visible text of the summary button: its SECOND child, the text span (FR-95: prefix span, text span, cue span). */
export function summaryText(root: ParentNode): string {
  const span = summaryButton(root).children[1];
  expect.assert(span !== undefined, 'premise: the summary button has a text span (its second child)');
  return span.textContent;
}

/** The accessible name of a button: its `aria-label` when it has one, else its text content without `aria-hidden` descendants. */
export function accessibleName(el: Element): string {
  return (el.getAttribute('aria-label') ?? textWithoutHidden(el)).trim();
}

/** The level control `[data-control="level"]`, asserted to be a radiogroup that holds exactly four `button[role=radio]`. */
export function levelControl(root: ParentNode): HTMLElement {
  const el = q(root, '[data-control="level"]');
  expect(el.getAttribute('role'), 'the level control is a radiogroup').toBe('radiogroup');
  expect(el.querySelectorAll('button[role="radio"]'), 'the level control holds four button[role=radio]').toHaveLength(4);
  return el;
}

/** The four level buttons in document order. */
export function levelButtons(root: ParentNode): HTMLElement[] {
  return Array.from(levelControl(root).querySelectorAll<HTMLElement>('button[role="radio"]'));
}

/** The name of a level button: the text of its first span (FR-99). */
export const levelButtonName = (button: Element): string => button.children[0]?.textContent ?? '';

/** The button of level `level` (1 to 4), found by its position AND the text of its first span. */
export function levelButton(root: ParentNode, level: number): HTMLElement {
  const name = (pageIsEnglish() ? ['Warm-up', 'Teaser', 'Puzzler', 'Brain-twister'] : LEVEL_NAMES)[level - 1];
  expect(name, `${level} is one of the levels 1 to 4`).toBeDefined();
  const button = levelButtons(root)[level - 1];
  expect.assert(button !== undefined, `premise: the level control has a button ${level}`);
  expect(levelButtonName(button), `button ${level} of the level control is «${name ?? ''}»`).toBe(name);
  return button;
}

/** The level whose button has aria-checked="true"; asserts that every button says "true" or "false" and exactly one says "true". */
export function checkedLevel(root: ParentNode): number {
  const states = levelButtons(root).map((b) => b.getAttribute('aria-checked'));
  for (const state of states) expect(['true', 'false'], 'aria-checked is "true" or "false" on every level button').toContain(state);
  const checked = [1, 2, 3, 4].filter((_, i) => states[i] === 'true');
  expect(checked, `exactly one level button is checked (states ${states.join(',')})`).toHaveLength(1);
  const only = checked[0];
  expect.assert(only !== undefined, 'premise: one level button is checked');
  return only;
}

/** `aria-checked` of the four level buttons as a list, for "unchanged" comparisons. */
export const levelStates = (root: ParentNode): (string | null)[] => levelButtons(root).map((b) => b.getAttribute('aria-checked'));

/** `aria-disabled` of the four level buttons as a list (`null` when the attribute is absent). */
export const levelDisabled = (root: ParentNode): (string | null)[] => levelButtons(root).map((b) => b.getAttribute('aria-disabled'));

/** The reason line `[data-level-reason]` (FR-91): always in the DOM, the first child of the level group. */
export const levelReason = (root: ParentNode): HTMLElement => q(root, '[data-level-reason]');

/** A MARKING press of the level button of `level` (FR-87, FR-100): opens the sheet only while it is closed, never presses «Почати». */
export function markLevel(root: ParentNode, level: number): void {
  openSheetIfClosed(root);
  levelButton(root, level).click();
}

/**
 * The player CHOOSES a level: open the sheet when closed, mark the level, press «Почати» and, when the dialog opened, press
 * «Так, почати». The dialog must open exactly when the board has player entries (FR-67, FR-90, FR-101); a choice of the level
 * already shown is not a no-op. No uncaught error is allowed.
 */
export function chooseLevel(root: ParentNode, level: number): void {
  const asks = hasPlayerEntries(root);
  const tracker = trackErrors();
  try {
    markLevel(root, level);
    pressStart(root);
  } finally {
    tracker.stop();
  }
  expect(tracker.errors, 'no uncaught error during the level choice').toEqual([]);
  expect(dialogIsOpen(root), 'the dialog opens exactly when the board has entries').toBe(asks);
  if (asks) confirmYes(root);
}

/** Everything a cancelled or no-op action must leave alone, with the level control and the summary added (slice DL2). */
export interface FullState extends PageState {
  level: number;
  summary: string;
}
export function fullState(root: ParentNode): FullState {
  return { ...pageState(root), level: checkedLevel(root), summary: summaryText(root) };
}

/** `aria-label` of the cell at the 1-based (row, col), asserted present. */
export function cellLabel(root: ParentNode, row: number, col: number): string {
  const label = cellEl(root, row, col).getAttribute('aria-label');
  expect(label, `cell ${row},${col} has an aria-label`).not.toBeNull();
  expect.assert(label !== null, `cell ${row},${col} has an aria-label`);
  return label;
}

/** Everything a cancelled or no-op action must leave alone: cell text/data-given/classes, size, aria-checked, both messages. */
export interface PageState {
  cells: string[];
  size: number;
  checked: number;
  hint: string;
  win: string;
}
export function pageState(root: ParentNode): PageState {
  return { cells: snapshot(root), size: boardSize(root), checked: checkedSize(root), hint: hintMessage(root), win: winMessage(root) };
}

/**
 * Mount the page on the 6x6 fixture `start`, then (when `puzzle` is not 6x6) let the player select `puzzle.size`, the
 * injected generator returning `puzzle` for that size: a board of another size, reached the way a player reaches it.
 */
export function mountThenSelect(puzzle: Puzzle, start: Puzzle = BLANK): HTMLElement {
  const root = mountPage({
    seedSource: seedQueue([1, 2]).source,
    generate: generatorBySize({ [start.size]: start, [puzzle.size]: puzzle }),
  });
  if (puzzle.size !== start.size) selectSize(root, puzzle.size);
  return root;
}

/**
 * The engine hint for the board as it is shown right now (the spec: "the engine hint applied to the DOM board").
 * Slice DL2 (FR-77, autonomy-log row 88), DELIBERATE CHANGE: the page asks the engine with the technique ceiling 4, so the
 * "expected hint" is `hint(board, 4)`, not the engine's default ceiling 1.
 */
/**
 * add-english-version DELIBERATE CHANGE (FR-112, FR-40; design.md «Tests that change deliberately», row `tests/helpers/play-page.ts` l. 966):
 * `expectedHint` takes the page language (default 'uk'), the third argument of `hint(board, 4, language)`. The call goes through a cast, so
 * this file compiles against the engine as it was before the language input existed (the type-check of `npm run build` covers tests/).
 */
const hintInLanguage: (board: Grid, ceiling?: number, language?: PageLanguage) => Hint = engineHint;
export const expectedHint = (root: ParentNode, language: PageLanguage = 'uk'): Hint => hintInLanguage(readBoard(root), 4, language);

/** Next text in the player cycle: empty -> 0 -> 1 -> empty. */
export function nextInCycle(text: string): string {
  if (text === '') return '0';
  if (text === '0') return '1';
  return '';
}

/** 1-based [row, col] of a fill hint's target. */
export function targetCell(h: Hint): [number, number] {
  if (h.kind !== 'fill') throw new Error(`hint kind is ${h.kind}, not fill`);
  return [h.row + 1, h.col + 1];
}

// ---------------------------------------------------------------------------------------------------------
// Fixture puzzles. A fixture is a Puzzle (size N, givens, solution). For N = 4 and 6 the solution is the first valid
// grid (in enumeration order) that keeps the givens; makePuzzle throws when there is none, unless `inconsistent`.
// N = 8 has 4,111,116 solved grids and is NEVER enumerated: an 8x8 fixture names its solution explicitly
// (`options.solution`, a hand-written valid grid).
// ---------------------------------------------------------------------------------------------------------

type Digit = 0 | 1;
const solutionCaches = new Map<number, Digit[][][]>();

/**
 * Every valid solved NxN grid (rows: N/2 zeros and ones, no run of 3; distinct rows; columns likewise), cached per N.
 * Only N = 4 (72 grids) and N = 6 (4,140 grids) are supported: N = 8 has 4,111,116 and throws instead of hanging.
 */
export function allSolutions(n = 6): Digit[][][] {
  if (n !== 4 && n !== 6) throw new Error(`allSolutions(${n}): only 4 and 6 are enumerated (8x8 has 4,111,116 grids)`);
  const cached = solutionCaches.get(n);
  if (cached !== undefined) return cached;
  const rows: Digit[][] = [];
  for (let m = 0; m < 1 << n; m++) {
    const bits: Digit[] = Array.from({ length: n }, (_, i) => (((m >> (n - 1 - i)) & 1) === 1 ? 1 : 0));
    const ones = bits.filter((b) => b === 1).length;
    const run = bits.some((b, i) => i + 2 < n && b === bits[i + 1] && b === bits[i + 2]);
    if (ones === n / 2 && !run) rows.push(bits);
  }
  const out: Digit[][][] = [];
  const colOk = (g: Digit[][], final: boolean): boolean => {
    for (let c = 0; c < n; c++) {
      const col = g.map((r) => r[c]);
      const L = col.length;
      if (L >= 3 && col[L - 1] === col[L - 2] && col[L - 2] === col[L - 3]) return false;
      const ones = col.filter((x) => x === 1).length;
      if (ones > n / 2 || L - ones > n / 2) return false;
      if (final && ones !== n / 2) return false;
    }
    if (final) {
      const keys = new Set(Array.from({ length: n }, (_, c) => g.map((r) => r[c]).join('')));
      if (keys.size !== n) return false;
    }
    return true;
  };
  const rec = (g: Digit[][]): void => {
    if (g.length === n) {
      if (colOk(g, true)) out.push(g.map((r) => [...r]));
      return;
    }
    for (const row of rows) {
      if (g.some((x) => x.join('') === row.join(''))) continue;
      const next = [...g, row];
      if (colOk(next, false)) rec(next);
    }
  };
  rec([]);
  solutionCaches.set(n, out);
  return out;
}

export interface MakePuzzleOptions {
  /** an explicit solution (spec notation); it must still be a valid solved grid and keep the givens. Required for N = 8. */
  solution?: string;
  /** allow givens that no valid grid satisfies (only for boards that deliberately break a rule) */
  inconsistent?: boolean;
}

export function keepsGivens(solution: Grid, givens: Grid): boolean {
  return givens.every((row, r) => row.every((g, c) => g === null || solution[r]?.[c] === g));
}

/** A fixture puzzle for `givens`; N is the number of rows of `givens` (so the 6x6 callers are unchanged). */
export function makePuzzle(givens: Grid, options: MakePuzzleOptions = {}): Puzzle {
  const n = givens.length;
  let solution: Digit[][] | undefined;
  if (options.solution !== undefined) {
    solution = parseBoard(options.solution).map((row) => row.map((c) => (c === 1 ? 1 : 0)));
    if (solution.length !== n) throw new Error(`makePuzzle: the explicit solution is ${solution.length}x${solution.length}, not ${n}x${n}`);
  } else {
    if (n !== 4 && n !== 6) throw new Error(`makePuzzle: a ${n}x${n} fixture needs an explicit options.solution (never enumerated)`);
    solution = allSolutions(n).find((s) => keepsGivens(s, givens));
    if (solution === undefined) {
      if (options.inconsistent !== true) throw new Error('makePuzzle: no valid grid keeps these givens');
      solution = allSolutions(n)[0];
    }
  }
  if (solution === undefined) throw new Error('makePuzzle: no solution');
  return { size: n, givens, solution };
}

/** Board of size n with the listed givens only; cells are [row, col, value], 1-based. */
export const givensOf = (n: number, cells: [number, number, 0 | 1][]): Grid => boardOf(n, { cells });

/** No givens at all. */
export const BLANK = makePuzzle(givensOf(6, []));
/** Only givens: 0 at (3,1) and (3,2). The hint engine returns the pair fill at 1-based (3,3) = 1. */
export const PAIR_ROW = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0]]));
/** Givens: 0 at (4,2) and (4,3); the neighbour on the left (4,1) is a player cell. */
export const PAIR_LEFT = makePuzzle(givensOf(6, [[4, 2, 0], [4, 3, 0]]));
/** Only givens: 1 at (1,4) and (2,4). The hint engine returns the pair fill at 1-based (3,4) = 0. */
export const PAIR_COL = makePuzzle(givensOf(6, [[1, 4, 1], [2, 4, 1]]));
/** Givens: 0 at (3,1) and (3,2) plus 1 at (6,6) (a given far away from the run). */
export const PAIR_ROW_PLUS = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0], [6, 6, 1]]));
/** Two independent pairs: 0 0 at (3,1),(3,2) and 1 1 at (5,4),(5,5): two consecutive pair hints. */
export const TWO_PAIRS = makePuzzle(givensOf(6, [[3, 1, 0], [3, 2, 0], [5, 4, 1], [5, 5, 1]]));
/** Row 5 holds `0 1 0 . . 0`: no pair, no sandwich anywhere; the count rule targets (5,4) and leaves (5,5) empty. */
export const COUNT_ROW = makePuzzle(givensOf(6, [[5, 1, 0], [5, 2, 1], [5, 3, 0], [5, 6, 0]]));
/** Two isolated givens: no rule applies, the hint engine returns kind 'none'. */
export const ISOLATED = makePuzzle(givensOf(6, [[1, 1, 0], [4, 5, 1]]));
/**
 * A board on which the hint fill itself breaks a rule: the first pair hint is the row pair (1,1),(1,2) = 1 1,
 * target (1,3) = 0, which completes 0 0 0 in column 3 (rows 1 to 3). The board before the fill is rule-clean.
 * No valid grid keeps these givens, so the solution is an arbitrary valid grid (fixture is deliberately inconsistent).
 */
export const HINT_BREAKS = makePuzzle(givensOf(6, [[1, 1, 1], [1, 2, 1], [2, 3, 0], [3, 3, 0]]), { inconsistent: true });
/** Givens already break a rule (three 0 in row 1): the board is highlighted the moment it is shown. */
export const DIRTY_GIVENS = makePuzzle(givensOf(6, [[1, 1, 0], [1, 2, 0], [1, 3, 0]]), { inconsistent: true });

/** A real generator output (seed 2): unique solution, 10 givens, a given 1 at (2,5). */
export const WIN_PUZZLE: Puzzle = {
  size: SIZE,
  givens: parseBoard(`
    . . 0 . . .
    . . . . 1 .
    . . 1 0 . .
    . . . . 0 0
    . . . . 1 0
    . 1 0 . . .
  `),
  solution: parseBoard(`
    1 0 0 1 1 0
    0 0 1 0 1 1
    0 1 1 0 0 1
    1 1 0 1 0 0
    1 0 1 0 1 0
    0 1 0 1 0 1
  `).map((row) => row.map((c) => (c === 1 ? 1 : 0))),
};

// ---- slice 3 (FR-43): 4x4 and 8x8 fixtures ----

/** A valid solved 8x8 grid, written out (it is generate(8, 1).solution; the helper self-check runs isSolved on it). */
export const SOLUTION_8_TEXT = `
  1 0 1 1 0 0 1 0
  0 1 0 0 1 0 1 1
  0 0 1 1 0 1 0 1
  1 1 0 0 1 1 0 0
  1 0 1 0 1 0 1 0
  0 0 1 1 0 0 1 1
  0 1 0 0 1 1 0 1
  1 1 0 1 0 1 0 0
`;

/** 4x4, no givens. */
export const BLANK_4 = makePuzzle(givensOf(4, []));
/** 4x4, only givens 0 at (2,1) and (2,2): the hint engine returns the pair fill at 1-based (2,3) = 1 (0-based row 1, col 2). */
export const PAIR_4 = makePuzzle(givensOf(4, [[2, 1, 0], [2, 2, 0]]));
/** 4x4 whose solution is VALID_4X4 and whose givens are every cell except the non-given (4,4), whose digit is 1. */
export const WIN_4 = winFixture(VALID_4X4, [4, 4]);

/** 8x8, no givens (explicit solution, never enumerated). */
export const BLANK_8 = makePuzzle(givensOf(8, []), { solution: SOLUTION_8_TEXT });
/** 8x8, only givens 0 at (8,7) and (8,8): the hint engine returns the pair fill at 1-based (8,6) = 1 (0-based row 7, col 5). */
export const PAIR_8 = makePuzzle(givensOf(8, [[8, 7, 0], [8, 8, 0]]), { solution: SOLUTION_8_TEXT });
/** 8x8 whose solution is SOLUTION_8_TEXT and whose givens are every cell except the non-given (8,8), whose digit is 0. */
export const WIN_8 = winFixture(parseBoard(SOLUTION_8_TEXT), [8, 8]);
/**
 * Slice 6 (FR-64): PAIR_ROW_PLUS at N = 4 and N = 8, so that one click on (3,3) gives all four cell kinds at every size:
 * ordinary (1,1), a plain given far from the run, a violating player cell (3,3) and the givens (3,1), (3,2) in the violation.
 */
export const PAIR_PLUS_4 = makePuzzle(givensOf(4, [[3, 1, 0], [3, 2, 0], [4, 4, 1]]));
export const PAIR_PLUS_8 = makePuzzle(givensOf(8, [[3, 1, 0], [3, 2, 0], [8, 8, 0]]), { solution: SOLUTION_8_TEXT });
/** 8x8 whose only givens are 0 at (8,1), (8,2), (8,3): the checker reports `three` in row 8 at once (inconsistent fixture). */
export const DIRTY_8_ROW = makePuzzle(givensOf(8, [[8, 1, 0], [8, 2, 0], [8, 3, 0]]), { solution: SOLUTION_8_TEXT, inconsistent: true });
/** 8x8 whose only givens are 1 at column 8, rows 1, 2, 4, 6, 7: five 1s, no three side by side, `count` on column 8. */
export const DIRTY_8_COL = makePuzzle(
  givensOf(8, [[1, 8, 1], [2, 8, 1], [4, 8, 1], [6, 8, 1], [7, 8, 1]]),
  { solution: SOLUTION_8_TEXT, inconsistent: true },
);

// ---- change update-controls-accessibility: a played board with a hint-filled cell that breaks a rule ----

const breakerGivens = (n: number): Grid => givensOf(n, [[1, 1, 1], [1, 2, 1], [2, 3, 0], [3, 3, 0]]);
/** 4x4 twin of HINT_BREAKS: the first hint is the row pair 1 1 at (1,1),(1,2), target (1,3) = 0, which makes 0 0 0 in column 3. */
export const HINT_BREAKS_4 = makePuzzle(breakerGivens(4), { inconsistent: true });
/** 8x8 twin of HINT_BREAKS (explicit solution, never enumerated). */
export const HINT_BREAKS_8 = makePuzzle(breakerGivens(8), { solution: SOLUTION_8_TEXT, inconsistent: true });
const BREAKER: Record<number, Puzzle> = { 4: HINT_BREAKS_4, 6: HINT_BREAKS, 8: HINT_BREAKS_8 };
/** What the injected generator returns for a NEW puzzle (any call after the played board was reached). */
const NEW_BOARD: Record<number, Puzzle> = { 4: BLANK_4, 6: PAIR_ROW, 8: BLANK_8 };

function fixtureFor(table: Record<number, Puzzle>, size: number): Puzzle {
  const puzzle = table[size];
  if (puzzle === undefined) throw new Error(`no fixture for size ${size}`);
  return puzzle;
}

export interface PlayedPage {
  root: HTMLElement;
  seeds: SeedQueue;
  spy: GenerateSpy;
  /** size of the board played on */
  n: number;
  /** the cell the player clicked to 1 (1-based) */
  entry: [number, number];
  /** the cell the hint filled and that carries cell-hinted (1-based) */
  hinted: [number, number];
}

/**
 * A page of size `n` (4, 6 or 8) with the played state the confirmation scenarios need: the player clicked the last cell
 * (n, n) to 1, pressed «Підказка» so that a hint filled (1,3) with 0 (`cell-hinted`, a hint sentence shown), and that fill makes
 * 0 0 0 in column 3 (at 4x4 also the count rule of column 3), so cells carry `cell-violation`. The page is mounted at 6 on HINT_BREAKS; for n != 6 the player first
 * presses the size button (the generator returns the n-fixture). Every call of the generator after that board was reached
 * returns `later(size, level)` (default: PAIR_ROW / BLANK_4 / BLANK_8, never the played fixture) and may throw. The seeds are 1, 2, 3, ...
 * The premises are asserted here so that "unchanged" in a test is never about an empty board.
 * Slice DL2 (FR-87, FR-92): `level` (1 to 4, default 1) is reached by a level choice on the untouched board, after the size
 * choice, with the injected generator returning the n-fixture for it (level 1 is the only level at 4x4).
 */
export function mountPlayedBoard(
  n = 6,
  later: (size: number, level?: number) => Puzzle = (size) => fixtureFor(NEW_BOARD, size),
  level = 1,
): PlayedPage {
  const seeds = seedQueue([1, 2, 3, 4, 5, 6]);
  const reaching = 1 + (n === 6 ? 0 : 1) + (level === 1 ? 0 : 1); // the calls that belong to reaching the played board
  const spy = rawGenerateSpy((i, size, _seed, lvl) => (i < reaching ? (i === 0 ? HINT_BREAKS : fixtureFor(BREAKER, size)) : later(size, lvl)));
  const root = mountPage({ seedSource: seeds.source, generate: spy.generate });
  if (n !== 6) selectSize(root, n);
  if (level !== 1) chooseLevel(root, level);
  expect(boardSize(root)).toBe(n);
  expect(hasPlayerEntries(root), 'premise: the board is untouched before the play').toBe(false);
  const entry: [number, number] = [n, n];
  clickCell(root, entry[0], entry[1], 2);
  expect(cellText(root, entry[0], entry[1]), 'premise: the player entry is a 1').toBe('1');
  expect(targetCell(expectedHint(root)), 'premise: the first hint targets (1,3)').toEqual([1, 3]);
  pressHint(root);
  expect(hintedCells(root), 'premise: the hint-filled cell is marked').toEqual([[1, 3]]);
  expect(cellText(root, 1, 3), 'premise: the hint wrote 0').toBe('0');
  expect(violationCells(root).length, 'premise: the hint fill breaks a rule').toBeGreaterThan(0);
  expect(violationCells(root), 'premise: the highlights are the checker cells').toEqual(checkerCells(readBoard(root)));
  expect(violationCells(root), 'premise: the hinted cell is one of them').toContainEqual([1, 3]);
  expect(hintMessage(root), 'premise: a hint sentence is shown').not.toBe('');
  expect(winMessage(root)).toBe('');
  return { root, seeds, spy, n, entry, hinted: [1, 3] };
}

/** A fixture whose solution is `solved` and whose givens are all cells except the 1-based `empty` cell. */
function winFixture(solved: Grid, empty: [number, number]): Puzzle {
  const givens = solved.map((row, r) => row.map((c, k): Cell => (r === empty[0] - 1 && k === empty[1] - 1 ? null : c)));
  return { size: solved.length, givens, solution: solved.map((row) => row.map((c) => (c === 1 ? 1 : 0))) };
}

/** Every fixture, for the helper self-check. `consistent` = givens must be kept by the solution. */
export const FIXTURES: { name: string; puzzle: Puzzle; consistent: boolean }[] = [
  { name: 'BLANK', puzzle: BLANK, consistent: true },
  { name: 'PAIR_ROW', puzzle: PAIR_ROW, consistent: true },
  { name: 'PAIR_LEFT', puzzle: PAIR_LEFT, consistent: true },
  { name: 'PAIR_COL', puzzle: PAIR_COL, consistent: true },
  { name: 'PAIR_ROW_PLUS', puzzle: PAIR_ROW_PLUS, consistent: true },
  { name: 'TWO_PAIRS', puzzle: TWO_PAIRS, consistent: true },
  { name: 'COUNT_ROW', puzzle: COUNT_ROW, consistent: true },
  { name: 'ISOLATED', puzzle: ISOLATED, consistent: true },
  { name: 'HINT_BREAKS', puzzle: HINT_BREAKS, consistent: false },
  { name: 'DIRTY_GIVENS', puzzle: DIRTY_GIVENS, consistent: false },
  { name: 'WIN_PUZZLE', puzzle: WIN_PUZZLE, consistent: true },
  { name: 'BLANK_4', puzzle: BLANK_4, consistent: true },
  { name: 'PAIR_4', puzzle: PAIR_4, consistent: true },
  { name: 'WIN_4', puzzle: WIN_4, consistent: true },
  { name: 'BLANK_8', puzzle: BLANK_8, consistent: true },
  { name: 'PAIR_8', puzzle: PAIR_8, consistent: true },
  { name: 'WIN_8', puzzle: WIN_8, consistent: true },
  { name: 'DIRTY_8_ROW', puzzle: DIRTY_8_ROW, consistent: false },
  { name: 'DIRTY_8_COL', puzzle: DIRTY_8_COL, consistent: false },
  { name: 'PAIR_PLUS_4', puzzle: PAIR_PLUS_4, consistent: true },
  { name: 'PAIR_PLUS_8', puzzle: PAIR_PLUS_8, consistent: true },
  { name: 'HINT_BREAKS_4', puzzle: HINT_BREAKS_4, consistent: false },
  { name: 'HINT_BREAKS_8', puzzle: HINT_BREAKS_8, consistent: false },
];


/** The solution as an engine Grid. */
export const solutionGrid = (p: Puzzle): Grid => p.solution.map((row) => [...row]);

export const solved = (board: Grid): boolean => isSolved(board);

// ---------------------------------------------------------------------------------------------------------
// String collectors for the page-text and seed-not-shown scenarios
// ---------------------------------------------------------------------------------------------------------

/**
 * True when `el` or an ancestor has a `lang` attribute different from `<html lang>` (A-52: the option "English" in Ukrainian mode and the option
 * «Українська» in English mode). `<html lang>` absent counts as the empty string, so before the page sets it nothing is foreign.
 * add-english-version DELIBERATE CHANGE (NFR-5 per mode, FR-111; design.md decision 5): `collectPageText` skips such an element.
 */
export function hasForeignLanguage(el: Element | null): boolean {
  const own = el?.closest('[lang]');
  if (own === null || own === undefined || own === document.documentElement) return false;
  return own.getAttribute('lang') !== (document.documentElement.getAttribute('lang') ?? '');
}

function elementsOf(root: HTMLElement): Element[] {
  return [root, ...Array.from(root.querySelectorAll('*'))];
}

function textNodesOf(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Seed-not-shown scenario: every text node, document.title and every attribute value of every element, each separate. */
export function collectEverything(root: HTMLElement): string[] {
  const out: string[] = textNodesOf(root).map((t) => t.data);
  out.push(document.title);
  for (const el of elementsOf(root)) {
    for (const attr of Array.from(el.attributes)) out.push(attr.value);
  }
  return out;
}

/**
 * Static-page-text scenario: every non-whitespace text node (not the text of [data-cell] elements), document.title,
 * the values of aria-label, title, placeholder and alt on every element in the root, and the `label` attribute of every
 * option and optgroup element. Text under an element with aria-hidden="true" is decoration and is skipped (NFR-5).
 */
export function collectPageText(root: HTMLElement): string[] {
  const out: string[] = [];
  for (const t of textNodesOf(root)) {
    if (t.data.trim() === '') continue;
    if (t.parentElement?.closest('[data-cell]') !== null && t.parentElement !== null) continue;
    // decoration (aria-hidden="true", the examples of the rules panel, A-26) is not page text (NFR-5)
    if (t.parentElement?.closest('[aria-hidden="true"]') != null) continue;
    // add-english-version (A-52): the one exception of the per-mode scan, an element whose own `lang` differs from <html lang>
    if (hasForeignLanguage(t.parentElement)) continue;
    out.push(t.data);
  }
  out.push(document.title);
  for (const el of elementsOf(root)) {
    if (hasForeignLanguage(el)) continue;
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(name);
      if (value !== null) out.push(value);
    }
    // the `label` attribute of option and optgroup is shown by a browser instead of the option text (NFR-5, FR-43)
    if (el.tagName === 'OPTION' || el.tagName === 'OPTGROUP') {
      const label = el.getAttribute('label');
      if (label !== null) out.push(label);
    }
  }
  return out;
}

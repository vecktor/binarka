import { GenerationRunOutError, findViolations, generate, hint, hintSentence, isSolved } from '../engine/index';
import type { Cell, Grid, Hint, Puzzle } from '../engine/index';
import { createGear } from './gear';
import { createLogo } from './logo';
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT, readLanguage, readTheme, writeLanguage, writeTheme } from './preferences';
import type { LanguageChoice, ThemeChoice } from './preferences';
import { defaultSeedSource } from './seed';
import { LANGUAGE_OPTIONS, RULES, textsFor } from './strings';
import type { PageTexts } from './strings';

/** The theme choice of the document: shared by every mount, because they all write the one <html data-theme> and meta. */
let documentTheme: ThemeChoice = 'auto';
/** Every live mount: its theme control (to tell a mount whose root was replaced or removed), the function that shows documentTheme
 * on its options, and the function that removes its system listener. */
const themeMounts = new Set<{ control: HTMLElement; sync: () => void; stop: () => void }>();
/** The language of the document: shared by every mount, because <html lang> and document.title are document-wide (same pattern as the theme). */
let documentLanguage: LanguageChoice = 'uk';
/** Every live mount: its language control (to tell a mount whose root was replaced or removed) and the function that renders its texts. */
const languageMounts = new Set<{ control: HTMLElement; render: () => void }>();

export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number, level: number) => Puzzle;
}

const SIZES = [4, 6, 8];
const MAX_ATTEMPTS = 3; // seeds taken for one change when the engine runs out of attempts (FR-88)
// Decorative examples of the rules (digits and the not-equal sign only, aria-hidden). A trailing "?" marks the answer cell.
// Typed as one entry per rule text, so adding or removing a rule in strings.ts fails the type check.
type OnePerRule<T> = { readonly [K in keyof T]: readonly string[] };
const RULE_EXAMPLES: OnePerRule<typeof RULES.items> = [['0', '0', '1?'], ['0', '1', '0', '1?'], ['0', '1', '1', '0', '\u2260', '1', '0', '0', '1']];

let panelCounter = 0;

function copyGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  if (text !== '') node.textContent = text;
  return node;
}

/** Build the page into `root` (synchronously, replacing its content). */
export function mountPlayPage(root: HTMLElement, options: PlayPageOptions = {}): void {
  const seedSource = options.seedSource ?? defaultSeedSource;
  const makePuzzle = options.generate ?? generate;

  // The language of the document (FR-113): a mount whose control left the document is dropped here, lazily (like the theme mounts).
  for (const mount of languageMounts) if (!mount.control.isConnected) languageMounts.delete(mount);
  documentLanguage = readLanguage();
  let texts: PageTexts = textsFor(documentLanguage);

  panelCounter += 1;
  const panelId = `rules-panel-${panelCounter}`;
  const panelTitleId = `rules-title-${panelCounter}`;
  const sheetId = `setup-sheet-${panelCounter}`;
  const settingsId = `settings-panel-${panelCounter}`;

  const rulesButton = el('button', { type: 'button', class: 'rules-button', 'data-action': 'rules', popovertarget: panelId });
  const header = el('header', { class: 'page-header' });
  const title = el('h1');
  const titleText = document.createTextNode('');
  title.append(createLogo(), titleText);
  const settingsButton = el('button', { type: 'button', class: 'settings-button', 'data-action': 'settings', popovertarget: settingsId });
  settingsButton.append(createGear());
  header.append(title, settingsButton, rulesButton);

  const boardHost = el('div', { class: 'board-host' });
  const hintButton = el('button', { type: 'button', 'data-action': 'hint' });
  const newButton = el('button', { type: 'button', 'data-action': 'new' });
  const summaryButton = el('button', { type: 'button', class: 'setup-button', 'data-action': 'setup', popovertarget: sheetId });
  const summaryPrefix = el('span', { class: 'visually-hidden' });
  const summaryLabel = el('span', { class: 'setup-summary' });
  const summaryCue = el('span', { class: 'setup-cue', 'aria-hidden': 'true' });
  summaryButton.append(summaryPrefix, summaryLabel, summaryCue);
  const sizeControl = el('div', { 'data-control': 'size', role: 'radiogroup', class: 'size-control' });
  const sizeButtons = new Map<number, HTMLButtonElement>();
  for (const n of SIZES) {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': n === 6 ? 'true' : 'false', 'data-size-option': String(n) });
    sizeButtons.set(n, option);
    sizeControl.appendChild(option);
  }
  const levelControl = el('div', { 'data-control': 'level', role: 'radiogroup', class: 'level-control' });
  const levelReason = el('p', { 'data-level-reason': '', hidden: '' });
  levelControl.appendChild(levelReason);
  const levelButtons: HTMLButtonElement[] = [];
  const levelNames: HTMLElement[] = [];
  const levelTexts: HTMLElement[] = [];
  textsFor('uk').LEVELS.forEach((_entry, i) => {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': i === 0 ? 'true' : 'false' });
    const levelName = el('span', { class: 'level-name' });
    const levelText = el('span', { class: 'level-text' });
    option.append(levelName, document.createTextNode(' '), levelText);
    levelNames.push(levelName);
    levelTexts.push(levelText);
    levelButtons.push(option);
    levelControl.appendChild(option);
  });
  const setupStart = el('button', { type: 'button', class: 'setup-start', 'data-action': 'setup-start' });
  const setupClose = el('button', { type: 'button', class: 'setup-close', 'data-action': 'setup-close', popovertarget: sheetId, popovertargetaction: 'hide' });
  const sheet = el('div', { popover: 'auto', id: sheetId, class: 'setup-sheet', 'data-section': 'setup', role: 'dialog' });
  sheet.append(sizeControl, levelControl, setupStart, setupClose);
  const resetButton = el('button', { type: 'button', 'data-action': 'reset' });
  const buttons = el('div', { class: 'buttons' });
  buttons.append(hintButton, resetButton, newButton);

  const idleMessage = el('p', { 'data-message': 'idle', class: 'message message-idle' });
  const hintMessage = el('p', { 'data-message': 'hint', class: 'message', role: 'status' });
  const winMessage = el('p', { 'data-message': 'win', class: 'message message-win', role: 'status' });
  const messages = el('div', { class: 'messages' });
  messages.append(idleMessage, hintMessage, winMessage);

  const rulesPanel = el('div', { popover: 'auto', id: panelId, class: 'rules', 'data-section': 'rules', role: 'dialog', 'aria-labelledby': panelTitleId });
  const rulesList = el('ul');
  const ruleTexts: HTMLElement[] = [];
  RULES.items.forEach((_text, i) => {
    const item = el('li');
    const ruleText = el('span', { class: 'rule-text' });
    ruleTexts.push(ruleText);
    item.appendChild(ruleText);
    const example = el('span', { class: 'rule-example', 'aria-hidden': 'true' });
    for (const token of RULE_EXAMPLES[i] ?? []) {
      if (token === '\u2260') example.appendChild(el('span', { class: 'mini-sep' }, token));
      else if (token.endsWith('?')) example.appendChild(el('span', { class: 'mini mini-answer' }, token.slice(0, -1)));
      else example.appendChild(el('span', { class: 'mini' }, token));
    }
    item.appendChild(example);
    rulesList.appendChild(item);
  });
  const closeButton = el('button', { type: 'button', class: 'rules-close', popovertarget: panelId, popovertargetaction: 'hide', autofocus: '' });
  const techniques = el('div', { 'data-section': 'techniques' });
  const techniquesList = el('ul');
  const techniqueItems: HTMLElement[] = [];
  textsFor('uk').TECHNIQUES.items.forEach(() => {
    const item = el('li');
    techniqueItems.push(item);
    techniquesList.appendChild(item);
  });
  const techniquesHeading = el('h3');
  const rulesHeading = el('h2', { id: panelTitleId });
  techniques.append(techniquesHeading, techniquesList);
  rulesPanel.append(rulesHeading, rulesList, techniques, closeButton);

  const themeControl = el('div', { 'data-control': 'theme', role: 'radiogroup', class: 'theme-control' });
  const themeButtons = new Map<ThemeChoice, HTMLButtonElement>();
  for (const entry of textsFor('uk').THEME_OPTIONS) {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'data-theme-option': entry.value });
    themeButtons.set(entry.value, option);
    themeControl.appendChild(option);
  }
  const languageControl = el('div', { 'data-control': 'language', role: 'radiogroup', class: 'language-control' });
  const languageButtons = new Map<LanguageChoice, HTMLButtonElement>();
  for (const entry of LANGUAGE_OPTIONS) {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'data-language-option': entry.value, lang: entry.value }, entry.name);
    languageButtons.set(entry.value, option);
    languageControl.appendChild(option);
  }
  const settingsClose = el('button', { type: 'button', class: 'settings-close', 'data-action': 'settings-close', popovertarget: settingsId, popovertargetaction: 'hide' });
  const settingsPanel = el('div', { popover: 'auto', id: settingsId, class: 'settings', 'data-section': 'settings', role: 'dialog' });
  const themeLabel = el('p', { class: 'settings-label' });
  const languageLabel = el('p', { class: 'settings-label' });
  settingsPanel.append(themeLabel, themeControl, languageLabel, languageControl, settingsClose);

  const dialogTextId = `confirm-text-${panelCounter}`;
  const dialog = el('dialog', { 'data-dialog': 'confirm', class: 'confirm', 'aria-labelledby': dialogTextId });
  const yesButton = el('button', { type: 'button', 'data-confirm': 'yes' });
  const noButton = el('button', { type: 'button', 'data-confirm': 'no' });
  const dialogButtons = el('div', { class: 'confirm-buttons' });
  dialogButtons.append(yesButton, noButton);
  const dialogText = el('p', { id: dialogTextId });
  dialog.append(dialogText, dialogButtons);

  let size = 6;
  let level = 1;
  let markedSize = 6; // the choice marked in the sheet; the board shown is `size` and `level` (FR-100)
  let markedLevel = 1;
  let givens: Grid = [];
  let board: Grid = [];
  let cellEls: HTMLElement[][] = [];
  let hinted: [number, number] | null = null;
  let boardEl: HTMLElement | null = null; // the board group shown (its name follows the language)
  let shownHint: Hint | null = null; // the hint result on screen: a language switch rebuilds its sentence (FR-110)

  function setAt(list: HTMLElement[], i: number, value: string): void {
    const node = list[i];
    if (node !== undefined) setText(node, value);
  }

  /** Set a text only when it changes, so a live region is not announced again for nothing. */
  function setText(node: Node, value: string): void {
    if (node.textContent !== value) node.textContent = value;
  }

  let pending: (() => void) | null = null;
  let returnToSummary = false; // the pending confirmation came from the sheet: focus goes to the summary when it ends

  /** The summary from the board shown (`size`, `level`); aria-checked, aria-disabled and the reason from the marked choice (FR-100). */
  function syncControls(): void {
    summaryLabel.textContent = texts.summaryText(size, level);
    for (const [m, button] of sizeButtons) button.setAttribute('aria-checked', m === markedSize ? 'true' : 'false');
    levelButtons.forEach((button, i) => {
      button.setAttribute('aria-checked', i + 1 === markedLevel ? 'true' : 'false');
      if (markedSize === 4 && i > 0) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    });
    levelReason.textContent = markedSize === 4 ? texts.LEVEL_REASON_4X4 : '';
    levelReason.hidden = markedSize !== 4;
  }

  /** Drop the marked choice: the groups show the board shown again. */
  function resetMarked(): void {
    markedSize = size;
    markedLevel = level;
    syncControls();
  }

  function setHinted(next: [number, number] | null): void {
    const old = hinted;
    if (old !== null) cellEls[old[0]]?.[old[1]]?.classList.remove('cell-hinted');
    hinted = next;
    if (next !== null) cellEls[next[0]]?.[next[1]]?.classList.add('cell-hinted');
    // The hint suffix of the label follows the marker.
    if (old !== null) renderCell(old[0], old[1]);
    if (next !== null) renderCell(next[0], next[1]);
  }

  function renderCell(r: number, c: number): void {
    const node = cellEls[r]?.[c];
    if (node === undefined) return;
    const given = givens[r]?.[c] !== null && givens[r]?.[c] !== undefined;
    const value = board[r]?.[c] ?? null;
    node.textContent = value === null ? '' : String(value);
    node.setAttribute('data-given', given ? 'true' : 'false');
    node.classList.toggle('cell-given', given);
    if (given) node.setAttribute('aria-disabled', 'true');
    else node.removeAttribute('aria-disabled');
    const isHinted = hinted !== null && hinted[0] === r && hinted[1] === c;
    node.setAttribute('aria-label', texts.cellLabel(r + 1, c + 1, value, given, isHinted));
  }

  function refreshHighlights(): void {
    const n = board.length;
    const marked = new Set<string>();
    for (const v of findViolations(board)) {
      if (v.rule === 'count') {
        for (let i = 0; i < n; i++) marked.add(v.axis === 'row' ? `${v.index},${i}` : `${i},${v.index}`);
      } else {
        for (const [r, c] of v.cells) marked.add(`${r},${c}`);
      }
    }
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cellEl = cellEls[r]?.[c];
        if (!cellEl) continue;
        const isMarked = marked.has(`${r},${c}`);
        cellEl.classList.toggle('cell-violation', isMarked);
        if (isMarked) cellEl.setAttribute('aria-invalid', 'true');
        else cellEl.removeAttribute('aria-invalid');
      }
    }
  }

  function updateWin(): void {
    winMessage.textContent = isSolved(board) ? texts.WIN : '';
  }

  function onBoardClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const node = target.closest<HTMLElement>('[data-cell]');
    if (node === null) return;
    const r = Number(node.getAttribute('data-row')) - 1;
    const c = Number(node.getAttribute('data-col')) - 1;
    if (givens[r]?.[c] !== null) return; // given (or unknown) cell: ignore
    const current = board[r]?.[c] ?? null;
    const next: Cell = current === null ? 0 : current === 0 ? 1 : null;
    (board[r] as Cell[])[c] = next;
    renderCell(r, c);
    setHinted(null);
    refreshHighlights();
    updateWin();
  }

  function showPuzzle(puzzle: Puzzle, n: number): void {
    if (puzzle.givens.length !== n || puzzle.givens.some((row) => row.length !== n)) {
      throw new Error(`puzzle is not ${n}x${n}`);
    }
    hinted = null; // the old cell elements are replaced below
    givens = copyGrid(puzzle.givens);
    board = copyGrid(puzzle.givens);
    const nextBoard = el('div', { 'data-board': '', 'data-size': String(n), class: 'board', role: 'group', 'aria-label': texts.sizeLabel(n) });
    boardEl = nextBoard;
    cellEls = [];
    for (let r = 0; r < n; r++) {
      const rowEls: HTMLElement[] = [];
      for (let c = 0; c < n; c++) {
        const cell = el('button', { type: 'button', 'data-cell': '', 'data-row': String(r + 1), 'data-col': String(c + 1), class: 'cell' });
        rowEls.push(cell);
        nextBoard.appendChild(cell);
      }
      cellEls.push(rowEls);
    }
    nextBoard.addEventListener('click', onBoardClick);
    boardHost.replaceChildren(nextBoard);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) renderCell(r, c);
    refreshHighlights();
  }

  /** The one generation path: a seed per attempt, retried only on the engine's run-out error. Failure changes nothing. */
  function newPuzzle(requestedSize: number, requestedLevel: number): boolean {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        showPuzzle(makePuzzle(requestedSize, seedSource(), requestedLevel), requestedSize);
        size = requestedSize;
        level = requestedLevel;
        resetMarked();
        return true;
      } catch (error) {
        if (!(error instanceof GenerationRunOutError)) return false; // keep the previous board (or no board at mount)
      }
    }
    return false;
  }

  hintButton.addEventListener('click', () => {
    if (board.length === 0) return;
    const h = hint(board, 4, documentLanguage);
    shownHint = h;
    hintMessage.textContent = h.sentence;
    if (h.kind !== 'fill') return;
    (board[h.row] as Cell[])[h.col] = h.value;
    setHinted([h.row, h.col]); // renders the cell with its new value and label
    refreshHighlights();
    updateWin();
  });

  /** True when a non-given cell is not empty (a hint-filled cell counts; so does a solved board). */
  function hasEntries(): boolean {
    return board.some((row, r) => row.some((value, c) => givens[r]?.[c] === null && value !== null));
  }

  /** Run the action at once on a board without entries; otherwise keep it pending and ask. */
  function requestAction(action: () => void): void {
    if (!hasEntries()) {
      action();
      return;
    }
    pending = action;
    if (!dialog.hasAttribute('open')) {
      dialog.showModal();
      noButton.focus(); // the safe choice is the default (A-20)
    }
  }

  function resetBoard(): void {
    if (board.length === 0) return;
    board = copyGrid(givens);
    for (let r = 0; r < board.length; r++) for (let c = 0; c < board.length; c++) renderCell(r, c);
    setHinted(null);
    refreshHighlights();
    shownHint = null;
    hintMessage.textContent = '';
    winMessage.textContent = '';
  }

  function startNewPuzzle(): void {
    if (newPuzzle(size, level)) {
      shownHint = null;
      hintMessage.textContent = '';
      winMessage.textContent = '';
    }
  }

  function changeTo(nextSize: number, nextLevel: number): void {
    if (newPuzzle(nextSize, nextLevel)) {
      shownHint = null;
      hintMessage.textContent = '';
      winMessage.textContent = '';
    }
  }

  yesButton.addEventListener('click', () => {
    const action = pending; // captured first: the late `close` event must not drop it
    const toSummary = returnToSummary;
    pending = null;
    returnToSummary = false;
    dialog.close();
    action?.();
    if (toSummary) summaryButton.focus();
  });
  noButton.addEventListener('click', () => {
    const toSummary = returnToSummary;
    pending = null;
    returnToSummary = false;
    dialog.close();
    if (toSummary) summaryButton.focus();
  });
  dialog.addEventListener('close', () => {
    pending = null;
    if (returnToSummary) {
      returnToSummary = false;
      summaryButton.focus();
    }
  });

  /** The start button: one puzzle with the marked pair; the sheet closes first, then the confirmation when the board has entries (FR-101). */
  function startMarked(): void {
    const startSize = markedSize;
    const startLevel = markedLevel;
    sheet.hidePopover();
    resetMarked(); // the groups show the board shown again; the pair lives on in the pending action
    if (hasEntries()) {
      returnToSummary = true;
      requestAction(() => { changeTo(startSize, startLevel); });
    } else {
      changeTo(startSize, startLevel);
      summaryButton.focus();
    }
  }

  sheet.addEventListener('toggle', (event) => {
    const newState = (event as Event & { newState?: string }).newState;
    if (newState === 'open') {
      // Each opening shows the board shown (FR-100). Browsers coalesce a quick close and reopen into one 'open' event,
      // so the closing reset alone could leave an old mark (design.md decision 1).
      resetMarked();
      return;
    }
    if (newState !== 'closed') return;
    resetMarked();
    // Focus moves to the summary only from inside the sheet or from no element; a light dismiss by a click elsewhere keeps it.
    const active = document.activeElement;
    if (active !== null && active !== document.body && !sheet.contains(active)) return;
    if (dialog.hasAttribute('open')) return;
    summaryButton.focus();
  });

  setupStart.addEventListener('click', startMarked);
  resetButton.addEventListener('click', () => { requestAction(resetBoard); });
  newButton.addEventListener('click', () => { requestAction(startNewPuzzle); });
  for (const [n, button] of sizeButtons) {
    button.addEventListener('click', () => {
      markedSize = n;
      if (n === 4) markedLevel = 1;
      syncControls();
    });
  }
  levelButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return; // unavailable at 4x4: nothing at all
      markedLevel = i + 1;
      syncControls();
    });
  });

  // Theme (FR-102 to FR-106, FR-113 to FR-118): the choice, the effective theme on <html> and the one theme-color meta.
  // The choice belongs to the document (one <html data-theme>), so every mount reads and writes the shared documentTheme. readTheme()
  // gives the session-only choice when storing it failed (FR-115), else the stored one. A mount whose control left the document is
  // dropped here, at the next mount (lazily), with its system listener.
  for (const mount of themeMounts) {
    if (mount.control.isConnected) continue;
    themeMounts.delete(mount);
    mount.stop();
  }
  documentTheme = readTheme();
  let systemQuery: MediaQueryList | null = null;
  try {
    if (typeof window.matchMedia === 'function') systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  } catch {
    systemQuery = null; // a broken matchMedia: auto is light (A-50)
  }

  function systemIsDark(): boolean {
    try {
      return systemQuery?.matches === true;
    } catch {
      return false;
    }
  }

  function applyTheme(): void {
    const effective = documentTheme === 'auto' ? (systemIsDark() ? 'dark' : 'light') : documentTheme;
    document.documentElement.setAttribute('data-theme', effective);
    document.head.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
    for (const mount of themeMounts) mount.sync(); // every mount shows the one choice, so a press on any of them acts (FR-103)
  }

  function syncThemeOptions(): void {
    for (const [value, button] of themeButtons) button.setAttribute('aria-checked', value === documentTheme ? 'true' : 'false');
  }

  for (const [value, button] of themeButtons) {
    button.addEventListener('click', () => {
      if (value === documentTheme) return; // already chosen: nothing is written (A-48)
      documentTheme = value;
      writeTheme(value);
      applyTheme();
    });
  }
  const onSystemChange = (): void => {
    if (documentTheme === 'auto') applyTheme();
  };
  try {
    systemQuery?.addEventListener('change', onSystemChange);
  } catch {
    // no listener support: the page follows the system at mount only
  }
  const stop = (): void => {
    try {
      systemQuery?.removeEventListener('change', onSystemChange);
    } catch {
      // no listener support: nothing was added
    }
  };
  themeMounts.add({ control: themeControl, sync: syncThemeOptions, stop });
  applyTheme();

  // Language (FR-107 to FR-110): the choice, <html lang>, document.title and every text. The choice belongs to the document, so every mount
  // shares documentLanguage and renders on a press. One pass re-sets texts and labels on the existing elements: nothing is remounted, so
  // focus, the marked choice, the board and the hint-filled cell stay (design decision 4).
  function render(): void {
    texts = textsFor(documentLanguage);
    document.documentElement.setAttribute('lang', documentLanguage);
    document.title = texts.TITLE;
    titleText.data = texts.TITLE;
    settingsButton.setAttribute('aria-label', texts.SETTINGS.label);
    setText(rulesButton, texts.BUTTONS.rules);
    setText(hintButton, texts.BUTTONS.hint);
    setText(resetButton, texts.BUTTONS.reset);
    setText(newButton, texts.BUTTONS.newPuzzle);
    setText(idleMessage, texts.IDLE);
    setText(summaryPrefix, texts.SETUP.prefix);
    setText(summaryCue, texts.SETUP.cue);
    sheet.setAttribute('aria-label', texts.SETUP.sheetLabel);
    sizeControl.setAttribute('aria-label', texts.SIZE_GROUP);
    for (const [n, button] of sizeButtons) setText(button, texts.sizeLabel(n));
    levelControl.setAttribute('aria-label', texts.LEVEL_GROUP);
    texts.LEVELS.forEach((entry, i) => {
      setAt(levelNames, i, entry.name);
      setAt(levelTexts, i, entry.description);
    });
    setText(setupStart, texts.SETUP.start);
    setText(setupClose, texts.SETUP.close);
    setText(rulesHeading, texts.RULES.heading);
    texts.RULES.items.forEach((text, i) => { setAt(ruleTexts, i, text); });
    setText(techniquesHeading, texts.TECHNIQUES.heading);
    texts.TECHNIQUES.items.forEach((text, i) => { setAt(techniqueItems, i, text); });
    setText(closeButton, texts.BUTTONS.rulesClose);
    settingsPanel.setAttribute('aria-label', texts.SETTINGS.label);
    setText(themeLabel, texts.SETTINGS.themeLabel);
    themeControl.setAttribute('aria-label', texts.SETTINGS.themeLabel);
    for (const entry of texts.THEME_OPTIONS) {
      const button = themeButtons.get(entry.value);
      if (button !== undefined) setText(button, entry.name);
    }
    setText(languageLabel, texts.SETTINGS.languageLabel);
    languageControl.setAttribute('aria-label', texts.SETTINGS.languageLabel);
    for (const [value, button] of languageButtons) button.setAttribute('aria-checked', value === documentLanguage ? 'true' : 'false');
    setText(settingsClose, texts.SETTINGS.close);
    setText(dialogText, texts.CONFIRM.text);
    setText(yesButton, texts.CONFIRM.yes);
    setText(noButton, texts.CONFIRM.no);
    // the board, its cells and the controls that follow the board shown
    boardEl?.setAttribute('aria-label', texts.sizeLabel(size));
    for (let r = 0; r < board.length; r++) for (let c = 0; c < board.length; c++) renderCell(r, c);
    syncControls();
    // the regions: a hint on screen is the same hint in the new language; an empty region stays empty
    if (shownHint !== null) setText(hintMessage, hintSentence(shownHint, documentLanguage));
    if (winMessage.textContent !== '') setText(winMessage, texts.WIN);
  }

  for (const [value, button] of languageButtons) {
    button.addEventListener('click', () => {
      if (value === documentLanguage) return; // already chosen: nothing is written
      documentLanguage = value;
      writeLanguage(value);
      for (const mount of languageMounts) mount.render(); // every mount shows the one choice
    });
  }
  languageMounts.add({ control: languageControl, render });
  for (const mount of languageMounts) mount.render(); // this mount and the others show the document's language

  syncControls();
  newPuzzle(size, level);
  root.replaceChildren(header, summaryButton, boardHost, buttons, messages, rulesPanel, sheet, settingsPanel, dialog);
}

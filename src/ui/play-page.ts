import { GenerationRunOutError, findViolations, generate, hint, isSolved } from '../engine/index';
import type { Cell, Grid, Puzzle } from '../engine/index';
import { createLogo } from './logo';
import { defaultSeedSource } from './seed';
import { BUTTONS, CONFIRM, IDLE, LEVELS, LEVEL_GROUP, LEVEL_REASON_4X4, RULES, SETUP, SIZE_GROUP, TECHNIQUES, TITLE, WIN, cellLabel, sizeLabel, summaryText } from './strings';

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

  document.title = TITLE;

  panelCounter += 1;
  const panelId = `rules-panel-${panelCounter}`;
  const panelTitleId = `rules-title-${panelCounter}`;
  const sheetId = `setup-sheet-${panelCounter}`;

  const rulesButton = el('button', { type: 'button', class: 'rules-button', 'data-action': 'rules', popovertarget: panelId }, BUTTONS.rules);
  const header = el('header', { class: 'page-header' });
  const title = el('h1', {}, TITLE);
  title.prepend(createLogo());
  header.append(title, rulesButton);

  const boardHost = el('div', { class: 'board-host' });
  const hintButton = el('button', { type: 'button', 'data-action': 'hint' }, BUTTONS.hint);
  const newButton = el('button', { type: 'button', 'data-action': 'new' }, BUTTONS.newPuzzle);
  const summaryButton = el('button', { type: 'button', class: 'setup-button', 'data-action': 'setup', popovertarget: sheetId });
  const summaryPrefix = el('span', { class: 'visually-hidden' }, SETUP.prefix);
  const summaryLabel = el('span', { class: 'setup-summary' });
  summaryButton.append(summaryPrefix, summaryLabel, el('span', { class: 'setup-cue', 'aria-hidden': 'true' }, SETUP.cue));
  const sizeControl = el('div', { 'data-control': 'size', role: 'radiogroup', 'aria-label': SIZE_GROUP, class: 'size-control' });
  const sizeButtons = new Map<number, HTMLButtonElement>();
  for (const n of SIZES) {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': n === 6 ? 'true' : 'false', 'data-size-option': String(n) }, sizeLabel(n));
    sizeButtons.set(n, option);
    sizeControl.appendChild(option);
  }
  const levelControl = el('div', { 'data-control': 'level', role: 'radiogroup', 'aria-label': LEVEL_GROUP, class: 'level-control' });
  const levelReason = el('p', { 'data-level-reason': '', hidden: '' });
  levelControl.appendChild(levelReason);
  const levelButtons: HTMLButtonElement[] = [];
  LEVELS.forEach((entry, i) => {
    const option = el('button', { type: 'button', role: 'radio', 'aria-checked': i === 0 ? 'true' : 'false' });
    option.append(el('span', { class: 'level-name' }, entry.name), document.createTextNode(' '), el('span', { class: 'level-text' }, entry.description));
    levelButtons.push(option);
    levelControl.appendChild(option);
  });
  const setupStart = el('button', { type: 'button', class: 'setup-start', 'data-action': 'setup-start' }, SETUP.start);
  const setupClose = el('button', { type: 'button', class: 'setup-close', 'data-action': 'setup-close', popovertarget: sheetId, popovertargetaction: 'hide' }, SETUP.close);
  const sheet = el('div', { popover: 'auto', id: sheetId, class: 'setup-sheet', 'data-section': 'setup', role: 'dialog', 'aria-label': SETUP.sheetLabel });
  sheet.append(sizeControl, levelControl, setupStart, setupClose);
  const resetButton = el('button', { type: 'button', 'data-action': 'reset' }, BUTTONS.reset);
  const buttons = el('div', { class: 'buttons' });
  buttons.append(hintButton, resetButton, newButton);

  const idleMessage = el('p', { 'data-message': 'idle', class: 'message message-idle' }, IDLE);
  const hintMessage = el('p', { 'data-message': 'hint', class: 'message', role: 'status' });
  const winMessage = el('p', { 'data-message': 'win', class: 'message message-win', role: 'status' });
  const messages = el('div', { class: 'messages' });
  messages.append(idleMessage, hintMessage, winMessage);

  const rulesPanel = el('div', { popover: 'auto', id: panelId, class: 'rules', 'data-section': 'rules', role: 'dialog', 'aria-labelledby': panelTitleId });
  const rulesList = el('ul');
  RULES.items.forEach((text, i) => {
    const item = el('li');
    item.appendChild(el('span', { class: 'rule-text' }, text));
    const example = el('span', { class: 'rule-example', 'aria-hidden': 'true' });
    for (const token of RULE_EXAMPLES[i] ?? []) {
      if (token === '\u2260') example.appendChild(el('span', { class: 'mini-sep' }, token));
      else if (token.endsWith('?')) example.appendChild(el('span', { class: 'mini mini-answer' }, token.slice(0, -1)));
      else example.appendChild(el('span', { class: 'mini' }, token));
    }
    item.appendChild(example);
    rulesList.appendChild(item);
  });
  const closeButton = el('button', { type: 'button', class: 'rules-close', popovertarget: panelId, popovertargetaction: 'hide', autofocus: '' }, BUTTONS.rulesClose);
  const techniques = el('div', { 'data-section': 'techniques' });
  const techniquesList = el('ul');
  for (const text of TECHNIQUES.items) techniquesList.appendChild(el('li', {}, text));
  techniques.append(el('h3', {}, TECHNIQUES.heading), techniquesList);
  rulesPanel.append(el('h2', { id: panelTitleId }, RULES.heading), rulesList, techniques, closeButton);

  const dialogTextId = `confirm-text-${panelCounter}`;
  const dialog = el('dialog', { 'data-dialog': 'confirm', class: 'confirm', 'aria-labelledby': dialogTextId });
  const yesButton = el('button', { type: 'button', 'data-confirm': 'yes' }, CONFIRM.yes);
  const noButton = el('button', { type: 'button', 'data-confirm': 'no' }, CONFIRM.no);
  const dialogButtons = el('div', { class: 'confirm-buttons' });
  dialogButtons.append(yesButton, noButton);
  dialog.append(el('p', { id: dialogTextId }, CONFIRM.text), dialogButtons);

  root.replaceChildren(header, summaryButton, boardHost, buttons, messages, rulesPanel, sheet, dialog);

  let size = 6;
  let level = 1;
  let markedSize = 6; // the choice marked in the sheet; the board shown is `size` and `level` (FR-100)
  let markedLevel = 1;
  let givens: Grid = [];
  let board: Grid = [];
  let cellEls: HTMLElement[][] = [];
  let hinted: [number, number] | null = null;

  let pending: (() => void) | null = null;
  let returnToSummary = false; // the pending confirmation came from the sheet: focus goes to the summary when it ends

  /** Rewrite everything derived from `size` and `level` (summary, aria-checked, aria-disabled, reason). */
  function syncControls(): void {
    summaryLabel.textContent = summaryText(size, level);
    for (const [m, button] of sizeButtons) button.setAttribute('aria-checked', m === markedSize ? 'true' : 'false');
    levelButtons.forEach((button, i) => {
      button.setAttribute('aria-checked', i + 1 === markedLevel ? 'true' : 'false');
      if (markedSize === 4 && i > 0) button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
    });
    levelReason.textContent = markedSize === 4 ? LEVEL_REASON_4X4 : '';
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
    node.setAttribute('aria-label', cellLabel(r + 1, c + 1, value, given, isHinted));
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
    winMessage.textContent = isSolved(board) ? WIN : '';
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
    const boardEl = el('div', { 'data-board': '', 'data-size': String(n), class: 'board', role: 'group', 'aria-label': sizeLabel(n) });
    cellEls = [];
    for (let r = 0; r < n; r++) {
      const rowEls: HTMLElement[] = [];
      for (let c = 0; c < n; c++) {
        const cell = el('button', { type: 'button', 'data-cell': '', 'data-row': String(r + 1), 'data-col': String(c + 1), class: 'cell' });
        rowEls.push(cell);
        boardEl.appendChild(cell);
      }
      cellEls.push(rowEls);
    }
    boardEl.addEventListener('click', onBoardClick);
    boardHost.replaceChildren(boardEl);
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
    const h = hint(board, 4);
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
    hintMessage.textContent = '';
    winMessage.textContent = '';
  }

  function startNewPuzzle(): void {
    if (newPuzzle(size, level)) {
      hintMessage.textContent = '';
      winMessage.textContent = '';
    }
  }

  function changeTo(nextSize: number, nextLevel: number): void {
    if (newPuzzle(nextSize, nextLevel)) {
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

  syncControls();
  newPuzzle(size, level);
}

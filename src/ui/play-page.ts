import { findViolations, generate, hint, isSolved } from '../engine/index';
import type { Cell, Grid, Puzzle } from '../engine/index';
import { defaultSeedSource } from './seed';
import { BUTTONS, IDLE, RULES, TITLE, WIN, sizeLabel } from './strings';

export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number) => Puzzle;
}

const SIZES = [4, 6, 8];
// Decorative examples of the rules (digits and the not-equal sign only, aria-hidden). A trailing "?" marks the answer cell.
const RULE_EXAMPLES: string[][] = [['0', '0', '1?'], ['0', '1', '0', '1?'], ['0', '1', '1', '0', '\u2260', '1', '0', '0', '1']];

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

  const rulesButton = el('button', { type: 'button', class: 'rules-button', 'data-action': 'rules', popovertarget: panelId }, BUTTONS.rules);
  const header = el('header', { class: 'page-header' });
  header.append(el('h1', {}, TITLE), rulesButton);

  const boardHost = el('div', { class: 'board-host' });
  const hintButton = el('button', { type: 'button', 'data-action': 'hint' }, BUTTONS.hint);
  const newButton = el('button', { type: 'button', 'data-action': 'new' }, BUTTONS.newPuzzle);
  const sizeSelect = el('select', { 'data-control': 'size' });
  for (const n of SIZES) {
    const option = el('option', { value: String(n) }, sizeLabel(n));
    if (n === 6) option.selected = true;
    sizeSelect.appendChild(option);
  }
  const resetButton = el('button', { type: 'button', 'data-action': 'reset' }, BUTTONS.reset);
  const buttons = el('div', { class: 'buttons' });
  buttons.append(hintButton, resetButton, newButton);

  const idleMessage = el('p', { 'data-message': 'idle', class: 'message message-idle' }, IDLE);
  const hintMessage = el('p', { 'data-message': 'hint', class: 'message' });
  const winMessage = el('p', { 'data-message': 'win', class: 'message message-win' });
  const messages = el('div', { class: 'messages' });
  messages.append(idleMessage, hintMessage, winMessage);

  const rulesPanel = el('div', { popover: 'auto', id: panelId, class: 'rules', 'data-section': 'rules', 'aria-labelledby': panelTitleId });
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
  const closeButton = el('button', { type: 'button', class: 'rules-close', popovertarget: panelId, popovertargetaction: 'hide' }, BUTTONS.rulesClose);
  rulesPanel.append(el('h2', { id: panelTitleId }, RULES.heading), rulesList, closeButton);

  root.replaceChildren(header, sizeSelect, boardHost, buttons, messages, rulesPanel);

  let size = 6;
  let givens: Grid = [];
  let board: Grid = [];
  let cellEls: HTMLElement[][] = [];

  function renderCell(r: number, c: number): void {
    const node = cellEls[r]?.[c];
    if (node === undefined) return;
    const given = givens[r]?.[c] !== null && givens[r]?.[c] !== undefined;
    const value = board[r]?.[c] ?? null;
    node.textContent = value === null ? '' : String(value);
    node.setAttribute('data-given', given ? 'true' : 'false');
    node.classList.toggle('cell-given', given);
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
      for (let c = 0; c < n; c++) cellEls[r]?.[c]?.classList.toggle('cell-violation', marked.has(`${r},${c}`));
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
    if (givens[r]?.[c] === undefined || givens[r]?.[c] !== null) return; // given (or unknown) cell: ignore
    const current = board[r]?.[c] ?? null;
    const next: Cell = current === null ? 0 : current === 0 ? 1 : null;
    (board[r] as Cell[])[c] = next;
    renderCell(r, c);
    refreshHighlights();
    updateWin();
  }

  function showPuzzle(puzzle: Puzzle, n: number): void {
    if (puzzle.givens.length !== n || puzzle.givens.some((row) => row.length !== n)) {
      throw new Error(`puzzle is not ${n}x${n}`);
    }
    givens = copyGrid(puzzle.givens);
    board = copyGrid(puzzle.givens);
    const boardEl = el('div', { 'data-board': '', 'data-size': String(n), class: 'board' });
    cellEls = [];
    for (let r = 0; r < n; r++) {
      const rowEls: HTMLElement[] = [];
      for (let c = 0; c < n; c++) {
        const cell = el('div', { 'data-cell': '', 'data-row': String(r + 1), 'data-col': String(c + 1), class: 'cell' });
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

  function newPuzzle(requestedSize: number): boolean {
    try {
      showPuzzle(makePuzzle(requestedSize, seedSource()), requestedSize);
      size = requestedSize;
      return true;
    } catch {
      return false; // keep the previous board (or no board at mount)
    }
  }

  hintButton.addEventListener('click', () => {
    if (board.length === 0) return;
    const h = hint(board);
    hintMessage.textContent = h.sentence;
    if (h.kind !== 'fill') return;
    (board[h.row] as Cell[])[h.col] = h.value;
    renderCell(h.row, h.col);
    refreshHighlights();
    updateWin();
  });

  resetButton.addEventListener('click', () => {
    if (board.length === 0) return;
    board = copyGrid(givens);
    for (let r = 0; r < board.length; r++) for (let c = 0; c < board.length; c++) renderCell(r, c);
    refreshHighlights();
    hintMessage.textContent = '';
    winMessage.textContent = '';
  });

  function restoreSelect(): void {
    for (const option of Array.from(sizeSelect.options)) {
      if (option.value === String(size)) option.selected = true;
    }
  }

  sizeSelect.addEventListener('change', () => {
    const chosen = SIZES.find((n) => String(n) === sizeSelect.value);
    if (chosen === undefined) {
      restoreSelect();
      return;
    }
    if (newPuzzle(chosen)) {
      hintMessage.textContent = '';
      winMessage.textContent = '';
    } else {
      restoreSelect();
    }
  });

  newButton.addEventListener('click', () => {
    if (newPuzzle(size)) {
      hintMessage.textContent = '';
      winMessage.textContent = '';
    }
  });

  newPuzzle(size);
}

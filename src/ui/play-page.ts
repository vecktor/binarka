import { findViolations, generate, hint, isSolved } from '../engine/index';
import type { Cell, Grid, Puzzle } from '../engine/index';
import { defaultSeedSource } from './seed';

export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number) => Puzzle;
}

const SIZE = 6;
const WIN_TEXT = "Вітаємо, головоломку розв'язано!";

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

  document.title = 'Бінарка';

  const heading = el('h1', {}, 'Бінарка');
  const boardHost = el('div', { class: 'board-host' });
  const hintButton = el('button', { type: 'button', 'data-action': 'hint' }, 'Підказка');
  const newButton = el('button', { type: 'button', 'data-action': 'new' }, 'Нова головоломка');
  const buttons = el('div', { class: 'buttons' });
  buttons.append(hintButton, newButton);
  const hintMessage = el('p', { 'data-message': 'hint', class: 'message' });
  const winMessage = el('p', { 'data-message': 'win', class: 'message message-win' });
  root.replaceChildren(heading, boardHost, buttons, hintMessage, winMessage);

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
    const marked = new Set<string>();
    for (const v of findViolations(board)) {
      if (v.rule === 'count') {
        for (let i = 0; i < SIZE; i++) marked.add(v.axis === 'row' ? `${v.index},${i}` : `${i},${v.index}`);
      } else {
        for (const [r, c] of v.cells) marked.add(`${r},${c}`);
      }
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) cellEls[r]?.[c]?.classList.toggle('cell-violation', marked.has(`${r},${c}`));
    }
  }

  function updateWin(): void {
    winMessage.textContent = isSolved(board) ? WIN_TEXT : '';
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

  function showPuzzle(puzzle: Puzzle): void {
    givens = copyGrid(puzzle.givens);
    board = copyGrid(puzzle.givens);
    const boardEl = el('div', { 'data-board': '', 'data-size': String(SIZE), class: 'board' });
    cellEls = [];
    for (let r = 0; r < SIZE; r++) {
      const rowEls: HTMLElement[] = [];
      for (let c = 0; c < SIZE; c++) {
        const cell = el('div', { 'data-cell': '', 'data-row': String(r + 1), 'data-col': String(c + 1), class: 'cell' });
        rowEls.push(cell);
        boardEl.appendChild(cell);
      }
      cellEls.push(rowEls);
    }
    boardEl.addEventListener('click', onBoardClick);
    boardHost.replaceChildren(boardEl);
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) renderCell(r, c);
    refreshHighlights();
  }

  function newPuzzle(): boolean {
    try {
      showPuzzle(makePuzzle(SIZE, seedSource()));
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

  newButton.addEventListener('click', () => {
    if (newPuzzle()) {
      hintMessage.textContent = '';
      winMessage.textContent = '';
    }
  });

  newPuzzle();
}

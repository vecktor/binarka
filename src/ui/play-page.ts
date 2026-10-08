import { findViolations, generate, hint, isSolved } from '../engine/index';
import type { Cell, Grid, Puzzle } from '../engine/index';
import { cellName, classifyKey, moveTarget } from './grid';
import { defaultSeedSource } from './seed';

export interface PlayPageOptions {
  seedSource?: () => number;
  generate?: (size: number, seed: number) => Puzzle;
}

const SIZES = [4, 6, 8];
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
  const sizeSelect = el('select', { 'data-control': 'size' });
  const sizeLabel = el('label', { class: 'size-label' });
  sizeLabel.append(el('span', { class: 'size-label-text' }, 'Розмір поля'), sizeSelect);
  for (const n of SIZES) {
    const option = el('option', { value: String(n) }, `Поле ${n}×${n}`);
    if (n === 6) option.selected = true;
    sizeSelect.appendChild(option);
  }
  const buttons = el('div', { class: 'buttons' });
  buttons.append(hintButton, newButton);
  const hintMessage = el('p', { 'data-message': 'hint', class: 'message', role: 'status' });
  const winMessage = el('p', { 'data-message': 'win', class: 'message message-win', role: 'status' });
  root.replaceChildren(heading, sizeLabel, boardHost, buttons, hintMessage, winMessage);

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
    node.setAttribute('aria-label', cellName(r + 1, c + 1, value));
    node.setAttribute('data-given', given ? 'true' : 'false');
    if (given) node.setAttribute('aria-readonly', 'true');
    else node.removeAttribute('aria-readonly');
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
      for (let c = 0; c < n; c++) {
        const node = cellEls[r]?.[c];
        if (node === undefined) continue;
        const bad = marked.has(`${r},${c}`);
        node.classList.toggle('cell-violation', bad);
        if (bad) node.setAttribute('aria-invalid', 'true');
        else node.removeAttribute('aria-invalid');
      }
    }
  }

  function updateWin(): void {
    winMessage.textContent = isSolved(board) ? WIN_TEXT : '';
  }

  function setTabStop(r: number, c: number, focus: boolean): void {
    for (let i = 0; i < cellEls.length; i++) {
      const rowEls = cellEls[i] ?? [];
      for (let j = 0; j < rowEls.length; j++) rowEls[j]?.setAttribute('tabindex', i === r && j === c ? '0' : '-1');
    }
    if (focus) cellEls[r]?.[c]?.focus();
  }

  function cycleCell(r: number, c: number): void {
    const row = board[r];
    if (givens[r]?.[c] !== null || row === undefined) return; // given or unknown cell: ignore
    const current = row[c] ?? null;
    const next: Cell = current === null ? 0 : current === 0 ? 1 : null;
    row[c] = next;
    renderCell(r, c);
    refreshHighlights();
    updateWin();
  }

  function cellPosition(event: Event): [number, number] | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const node = target.closest<HTMLElement>('[data-cell]');
    if (node === null) return null;
    const r = Number(node.getAttribute('data-row')) - 1;
    const c = Number(node.getAttribute('data-col')) - 1;
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || c < 0 || r >= board.length || c >= board.length) return null;
    return [r, c];
  }

  function onBoardClick(event: Event): void {
    const pos = cellPosition(event);
    if (pos === null) return;
    setTabStop(pos[0], pos[1], true);
    cycleCell(pos[0], pos[1]);
  }

  function onBoardFocusIn(event: Event): void {
    const pos = cellPosition(event);
    if (pos !== null) setTabStop(pos[0], pos[1], false);
  }

  function onBoardKeydown(event: KeyboardEvent): void {
    const pos = cellPosition(event);
    if (pos === null) return;
    const action = classifyKey(event);
    if (action === 'ignore') return;
    event.preventDefault();
    if (action === 'move') {
      const dest = moveTarget(event.key, event.ctrlKey, pos[0] + 1, pos[1] + 1, board.length);
      if (dest !== null) setTabStop(dest[0] - 1, dest[1] - 1, true);
    } else if (!event.repeat) {
      cycleCell(pos[0], pos[1]);
    }
  }

  function showPuzzle(puzzle: Puzzle, n: number): void {
    if (puzzle.givens.length !== n || puzzle.givens.some((row) => row.length !== n)) {
      throw new Error(`puzzle is not ${n}x${n}`);
    }
    givens = copyGrid(puzzle.givens);
    board = copyGrid(puzzle.givens);
    const boardEl = el('div', {
      'data-board': '',
      'data-size': String(n),
      class: 'board',
      role: 'grid',
      'aria-label': `Поле ${n}×${n}`,
    });
    cellEls = [];
    for (let r = 0; r < n; r++) {
      const rowEls: HTMLElement[] = [];
      const rowNode = el('div', { class: 'board-row', role: 'row' });
      for (let c = 0; c < n; c++) {
        const cell = el('div', {
          'data-cell': '',
          'data-row': String(r + 1),
          'data-col': String(c + 1),
          class: 'cell',
          role: 'gridcell',
          tabindex: '-1',
        });
        rowEls.push(cell);
        rowNode.appendChild(cell);
      }
      boardEl.appendChild(rowNode);
      cellEls.push(rowEls);
    }
    boardEl.addEventListener('click', onBoardClick);
    boardEl.addEventListener('focusin', onBoardFocusIn);
    boardEl.addEventListener('keydown', onBoardKeydown);
    boardHost.replaceChildren(boardEl);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) renderCell(r, c);
    refreshHighlights();
    setTabStop(0, 0, false);
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
    const row = board[h.row];
    if (row === undefined) return; // hint() only names cells of the board it was given
    row[h.col] = h.value;
    renderCell(h.row, h.col);
    refreshHighlights();
    updateWin();
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

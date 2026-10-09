/*
 * Wiring for design/audio/prototype.html. Design tool, not product code.
 * The mini board uses the real engine (read-only import) and the proposed cue rule (chooseCue),
 * so the cues can be heard in context.
 */
import { findViolations, generate, hint, isSolved } from '../../src/engine/index';
import type { Cell, Grid, Puzzle } from '../../src/engine/index';
import {
  BUDGET_MS,
  CANDIDATE_RECIPES,
  CUE_NAMES,
  CUE_RECIPES,
  MASTER_GAIN,
  MAX_NOTE_PEAK,
  MIN_ATTACK_MS,
  chooseCue,
  createWebAudioPort,
  cueDurationMs,
  measureCue,
  notePeakBound,
} from './synth';
import type { BoardAction, BoardSnapshot, CueName, CueRecipe } from './synth';

const port = createWebAudioPort();
let soundOn = true; // proposed default at page load

function q<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (node === null) throw new Error(`missing ${selector}`);
  return node;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== '') node.textContent = text;
  return node;
}

const log = q<HTMLOListElement>('#log');
function request(name: CueName | null, why: string): void {
  const item = el('li', `${name ?? '(silent)'}  <- ${why}${soundOn ? '' : '  [muted: not requested]'}`);
  log.prepend(item);
  while (log.children.length > 12) log.lastElementChild?.remove();
  if (name !== null && soundOn) port.playCue(name);
}

// --- availability -----------------------------------------------------------
q('#available').textContent = port.available ? 'Web Audio available' : 'No Web Audio in this browser: the page would show no sound toggle';

// --- master volume ----------------------------------------------------------
const volume = q<HTMLInputElement>('#volume');
const volumeOut = q<HTMLOutputElement>('#volume-out');
volume.value = String(Math.round(MASTER_GAIN * 100));
volumeOut.value = volume.value;
volume.addEventListener('input', () => {
  volumeOut.value = volume.value;
  port.setMasterGain(Number(volume.value) / 100);
});

// --- the proposed mute toggle -----------------------------------------------
const toggle = q<HTMLButtonElement>('#sound');
toggle.addEventListener('click', () => {
  soundOn = !soundOn;
  toggle.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  port.setMuted(!soundOn);
  if (soundOn) request('soundOn', 'sound toggle switched on');
  else request(null, 'sound toggle switched off');
});

// --- one button per cue -------------------------------------------------------
const cueButtons = q('#cue-buttons');
for (const name of CUE_NAMES) {
  const b = el('button', name, { type: 'button' });
  b.addEventListener('click', () => { request(name, 'cue button'); });
  cueButtons.appendChild(b);
}
const candidate = el('button', 'resolve (candidate, silent in the design)', { type: 'button', class: 'candidate' });
candidate.addEventListener('click', () => {
  if (soundOn) port.playRecipe(CANDIDATE_RECIPES.resolve);
});
cueButtons.appendChild(candidate);

// --- stacking tests -----------------------------------------------------------
function burst(names: readonly CueName[], gapMs: number, label: string): void {
  names.forEach((name, i) => {
    window.setTimeout(() => { request(name, `${label} ${String(i + 1)}/${String(names.length)}`); }, i * gapMs);
  });
}
q('#rapid').addEventListener('click', () => { burst(Array<CueName>(10).fill('place0'), 60, 'rapid fire'); });
q('#rapid-alt').addEventListener('click', () => {
  burst(Array.from({ length: 10 }, (_, i): CueName => (i % 2 === 0 ? 'place0' : 'place1')), 60, 'rapid 0/1');
});
q('#rapid-cycle').addEventListener('click', () => {
  burst(Array.from({ length: 21 }, (_, i): CueName => (['place0', 'place1', 'clear'] as const)[i % 3] ?? 'clear'), 35, 'cycle 35 ms');
});

// --- a short scene with realistic gaps ----------------------------------------
const SCENE: readonly [number, CueName][] = [
  [0, 'place0'], [700, 'place1'], [1300, 'place0'], [1900, 'conflict'], [2900, 'place1'],
  [3200, 'clear'], [3500, 'place1'], [4600, 'hint'], [5800, 'place0'], [6600, 'win'],
];
q('#scene').addEventListener('click', () => {
  for (const [at, name] of SCENE) window.setTimeout(() => { request(name, 'scene'); }, at);
});

// --- play in context: a small board with the real engine ---------------------
let seed = 1; // deterministic: 1, 2, 3, ... (no Math.random)
let size = 6;
let puzzle: Puzzle;
let board: Grid = [];
const boardEl = q('#board');
const hintText = q('#hint-text');

function snapshot(): BoardSnapshot {
  const n = board.length;
  const invalid = new Set<string>();
  for (const v of findViolations(board)) {
    if (v.rule === 'count') for (let i = 0; i < n; i++) invalid.add(v.axis === 'row' ? `${String(v.index)},${String(i)}` : `${String(i)},${String(v.index)}`);
    else for (const [r, c] of v.cells) invalid.add(`${String(r)},${String(c)}`);
  }
  return { invalid, solved: isSolved(board) };
}

function render(): void {
  const s = snapshot();
  boardEl.style.setProperty('--n', String(board.length));
  boardEl.replaceChildren();
  board.forEach((row, r) => {
    row.forEach((value, c) => {
      const given = puzzle.givens[r]?.[c] !== null;
      const cell = el('button', value === null ? '' : String(value), { type: 'button', class: 'cell' });
      if (given) cell.classList.add('given');
      if (s.invalid.has(`${String(r)},${String(c)}`)) cell.classList.add('bad');
      cell.addEventListener('click', () => { onCell(r, c); });
      boardEl.appendChild(cell);
    });
  });
  q('#win-text').textContent = s.solved ? 'Solved (the page shows the win message)' : '';
}

function act(action: BoardAction, change: () => void, why: string): void {
  const before = snapshot();
  change();
  const after = snapshot();
  request(chooseCue(action, before, after), why);
  render();
}

function onCell(r: number, c: number): void {
  if (puzzle.givens[r]?.[c] !== null) {
    request(null, 'given cell clicked (nothing changes)');
    return;
  }
  const current = board[r]?.[c] ?? null;
  const next: Cell = current === null ? 0 : current === 0 ? 1 : null;
  act({ type: 'cell', value: next }, () => { (board[r] as Cell[])[c] = next; }, `cell ${String(r + 1)},${String(c + 1)} -> ${next === null ? 'empty' : String(next)}`);
}

function newBoard(n: number): void {
  size = n;
  puzzle = generate(n, seed);
  seed += 1;
  board = puzzle.givens.map((row) => [...row]);
  hintText.textContent = '';
  request(null, `new ${String(n)}x${String(n)} puzzle`);
  render();
}

q('#hint').addEventListener('click', () => {
  const h = hint(board);
  hintText.textContent = h.sentence;
  if (h.kind !== 'fill') {
    request(chooseCue({ type: 'hint', filled: false }, snapshot(), snapshot()), `hint: ${h.kind}`);
    return;
  }
  act({ type: 'hint', filled: true }, () => { (board[h.row] as Cell[])[h.col] = h.value; }, 'hint filled a cell');
});
q('#new').addEventListener('click', () => { newBoard(size); });
q('#size4').addEventListener('click', () => { newBoard(4); });
q('#size6').addEventListener('click', () => { newBoard(6); });
q('#size8').addEventListener('click', () => { newBoard(8); });
q('#almost').addEventListener('click', () => {
  // Fill every empty cell from the solution except the last one, silently (a test shortcut).
  const empties: [number, number][] = [];
  board.forEach((row, r) => { row.forEach((v, c) => { if (v === null) empties.push([r, c]); }); });
  for (const [r, c] of empties.slice(0, -1)) (board[r] as Cell[])[c] = puzzle.solution[r]?.[c] ?? null;
  request(null, 'shortcut: all but one cell filled (no cue)');
  render();
});
newBoard(6);

// --- offline measurement --------------------------------------------------------
q('#measure').addEventListener('click', () => {
  void (async () => {
    const tbody = q('#measure-body');
    tbody.replaceChildren();
    const all: [string, CueRecipe][] = [...CUE_NAMES.map((n): [string, CueRecipe] => [n, CUE_RECIPES[n]]), ['resolve (candidate)', CANDIDATE_RECIPES.resolve]];
    const rows: Record<string, unknown>[] = [];
    for (const [name, recipe] of all) {
      const m = await measureCue(recipe);
      const budget = BUDGET_MS[recipe.channel];
      const minAttack = Math.min(...recipe.notes.map((n) => n.attackMs));
      const maxNote = Math.max(...recipe.notes.map(notePeakBound));
      const ok = m.declaredMs <= budget && m.audibleMs <= budget && minAttack >= MIN_ATTACK_MS && maxNote <= MAX_NOTE_PEAK && m.tail === 0;
      const cells = [
        name, recipe.channel, String(budget), m.declaredMs.toFixed(0), m.audibleMs.toFixed(1), m.peak.toFixed(3),
        m.peakDbfs.toFixed(1), m.peakAtMs.toFixed(1), m.onsetJump.toExponential(1), String(m.tail), ok ? 'yes' : 'NO',
      ];
      const tr = el('tr');
      for (const text of cells) tr.appendChild(el('td', text));
      tbody.appendChild(tr);
      rows.push({ name, channel: recipe.channel, budgetMs: budget, declaredMs: m.declaredMs, audibleMs: m.audibleMs, peak: m.peak, peakDbfs: m.peakDbfs, peakAtMs: m.peakAtMs, onsetJump: m.onsetJump, tail: m.tail, withinBudget: ok, declaredCheck: cueDurationMs(recipe) });
    }
    q('#measure-json').textContent = JSON.stringify(rows);
  })();
});

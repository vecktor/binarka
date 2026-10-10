// NFR-6, FR-112 (add-english-version, TD-Q9): hint explanations are clear and correct for a player, in English. Three cases, one per rule
// (pair, sandwich, count), dimension `hint-clarity-en`, bar 80 per case. produce() calls the real engine on a fixed board with the language
// 'en' and returns what the player sees: the cell that gets filled and the one-sentence English explanation. Graded by a fresh eval-judge agent
// (maker≠checker) in the eval-suite workflow; the baseline for this dimension is minted only after a passing run (tasks.md 4.5), and
// tests/eval-hint-clarity-en.test.ts fails on any case below 80 or without a result (the ratchet compares averages and would pass a new dimension).
// The rubric is the Ukrainian one adapted to English: English wording, no Cyrillic letter, "row" and "column".
import { hint } from '../../src/engine/index';
import type { Grid, Hint } from '../../src/engine/index';

// The language is the third parameter of `hint` (FR-112). Typed here so that this file compiles against the engine as it was before the
// parameter existed; the engine of this slice accepts it.
const hintInLanguage: (board: Grid, ceiling?: number, language?: 'uk' | 'en') => Hint = hint;

function board(rows: Record<number, string>): Grid {
  const grid: Grid = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => null));
  for (const [r, text] of Object.entries(rows)) {
    text.split(' ').forEach((token, c) => {
      (grid[Number(r) - 1] as (0 | 1 | null)[])[c] = token === '.' ? null : (Number(token) as 0 | 1);
    });
  }
  return grid;
}

function show(grid: Grid): string {
  return grid.map((row) => row.map((v) => (v === null ? '.' : String(v))).join(' ')).join('\n');
}

function produceFor(grid: Grid): string {
  const h = hintInLanguage(grid, 1, 'en');
  const fill =
    h.kind === 'fill'
      ? `The cell in row ${h.row + 1}, column ${h.col + 1} was filled with the digit ${h.value}.`
      : 'No cell was filled.';
  return `Board (rows from top to bottom, "." means an empty cell):\n${show(grid)}\n\nAction: ${fill}\nExplanation the player sees: ${h.sentence}`;
}

const RUBRIC = [
  'CRITICAL: the sentence states the rule that applies (a pair side by side, a gap between two equal digits, or a line that already holds half of one digit), and that rule really holds on the shown board',
  'CRITICAL: the sentence names the correct line type ("row" or "column") and the correct 1-based line number, matching the cell that was filled',
  'CRITICAL: the digit named in the sentence agrees with the board, and the digit placed in the cell is the one the sentence implies',
  'the sentence is understandable to a player who does not know the rules of the game, in natural English with correct grammar and number agreement ("two zeros", "three ones")',
  'the sentence is exactly one sentence, written in English with Latin letters only, and contains no Cyrillic letter',
];

export const cases = [
  {
    id: 'eval-hint-clarity-en-pair',
    trace: ['NFR-6', 'FR-19', 'FR-112'],
    dimension: 'hint-clarity-en',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where two zeros stand side by side in row 3, with the page in English.',
    produce: async () => produceFor(board({ 3: '0 0 . . . .' })),
    rubric: RUBRIC,
  },
  {
    id: 'eval-hint-clarity-en-sandwich',
    trace: ['NFR-6', 'FR-20', 'FR-112'],
    dimension: 'hint-clarity-en',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where column 2 has a zero in row 1, an empty cell in row 2 and a zero in row 3, with the page in English.',
    produce: async () => produceFor(board({ 1: '. 0 . . . .', 3: '. 0 . . . .' })),
    rubric: RUBRIC,
  },
  {
    id: 'eval-hint-clarity-en-count',
    trace: ['NFR-6', 'FR-21', 'FR-112'],
    dimension: 'hint-clarity-en',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where row 5 already holds three zeros and one empty cell, with the page in English.',
    produce: async () => produceFor(board({ 5: '0 1 0 1 . 0' })),
    rubric: RUBRIC,
  },
];

// @trace NFR-6
// @trace FR-112

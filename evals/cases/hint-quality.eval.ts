// NFR-6: hint explanations are clear and correct for a player. Three cases, one per rule (pair, sandwich, count).
// produce() calls the real engine on a fixed board and returns what the player sees: the cell that gets filled
// and the one-sentence Ukrainian explanation. Graded by the eval-judge agent (maker≠checker), pass mark 80.
import { hint } from '../../src/engine/index';
import type { Grid } from '../../src/engine/index';

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
  const h = hint(grid);
  const fill =
    h.kind === 'fill'
      ? `Клітинку в рядку ${h.row + 1}, стовпці ${h.col + 1} заповнено цифрою ${h.value}.`
      : 'Жодну клітинку не заповнено.';
  return `Поле (рядки згори вниз, «.» означає порожню клітинку):\n${show(grid)}\n\nДія: ${fill}\nПояснення, яке бачить гравець: ${h.sentence}`;
}

const RUBRIC = [
  'CRITICAL: the sentence states the rule that applies (a pair side by side, a gap between two equal digits, or a line that already holds half of one digit), and that rule really holds on the shown board',
  'CRITICAL: the sentence names the correct line type (рядок or стовпець) and the correct 1-based line number, matching the cell that was filled',
  'CRITICAL: the digit named in the sentence agrees with the board, and the digit placed in the cell is the one the sentence implies',
  'the sentence is understandable to a player who does not know the rules of the game, in natural Ukrainian with correct grammar and number agreement',
  'the sentence is exactly one sentence and contains no Latin letters',
];

export const cases = [
  {
    id: 'eval-hint-clarity-pair',
    trace: ['NFR-6', 'FR-19'],
    dimension: 'hint-clarity',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where two zeros stand side by side in row 3.',
    produce: async () => produceFor(board({ 3: '0 0 . . . .' })),
    rubric: RUBRIC,
  },
  {
    id: 'eval-hint-clarity-sandwich',
    trace: ['NFR-6', 'FR-20'],
    dimension: 'hint-clarity',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where column 2 has a zero in row 1, an empty cell in row 2 and a zero in row 3.',
    produce: async () => produceFor(board({ 1: '. 0 . . . .', 3: '. 0 . . . .' })),
    rubric: RUBRIC,
  },
  {
    id: 'eval-hint-clarity-count',
    trace: ['NFR-6', 'FR-21'],
    dimension: 'hint-clarity',
    capability: 'puzzle-engine',
    scenario: 'The player presses the hint button on a 6×6 board where row 5 already holds three zeros and one empty cell.',
    produce: async () => produceFor(board({ 5: '0 1 0 1 . 0' })),
    rubric: RUBRIC,
  },
];

// @trace NFR-6

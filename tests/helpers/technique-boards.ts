// The boards and the exact sentences of the scenarios of add-difficulty-engine (openspec/changes/add-difficulty-engine/
// specs/puzzle-engine/spec.md), transcribed from the spec text. Cell coordinates in `Expected` are 1-BASED, as the spec
// writes them. No board here was produced by running the implementation.
import type { Grid } from '../../src/engine/index';
import { boardOf, parseBoard } from './board';

export const NO_RULE_SENTENCE = 'Жодне з правил зараз не підказує наступного ходу.';
export const BROKEN_SENTENCE = 'Спершу виправте порушення правил, підсвічене на полі.';

export interface Expected {
  row: number;
  col: number;
  value: 0 | 1;
  rule: string;
  sentence?: string;
  steps?: number;
}

export interface Scenario {
  name: string;
  board: Grid;
  ceiling: number;
  expected: Expected;
}

// ---- Line balance (FR-74, FR-78) ----

export const LB_ROW = boardOf(6, { rows: { 3: '0 0 1 . . .' } });
export const LB_ROW_SENTENCE =
  'У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.';
export const LB_COL = boardOf(6, { cols: { 2: '1 1 0 . . .' } });
export const LB_COL_SENTENCE =
  'У стовпці 2 є місце лише для однієї одиниці, і якщо поставити її сюди, решта клітинок дасть три однакові цифри поспіль, тож тут нуль.';
export const LB_TWO_ZEROS = boardOf(6, { rows: { 3: '0 . . . . 0' } });
export const LB_TWO_ONES = boardOf(6, { rows: { 3: '1 . . . . 1' } });
/** Derived from the FR-78 template for d = 1 (the second alternative of each pair, V = нуль). */
export const LB_TWO_ONES_SENTENCE =
  'У рядку 3 є місце лише для однієї одиниці, і якщо поставити її сюди, решта клітинок дасть три однакові цифри поспіль, тож тут нуль.';
export const LB_N8 = boardOf(8, { rows: { 1: '0 0 1 0 . . . .' } });
export const LB_ROWS_BEFORE_COLS = boardOf(6, { cells: [[1, 6, 1], [2, 6, 1], [3, 6, 0]], rows: { 5: '0 0 1 . . .' } });
export const LB_LOWER_LINE = boardOf(6, { rows: { 2: '0 0 1 . . .', 5: '1 1 0 . . .' } });
export const LB_NEAR_MISS_ARRANGEMENT = boardOf(6, { rows: { 3: '0 1 0 . . .' } });
export const LB_NEAR_MISS_COUNT = boardOf(6, { rows: { 3: '0 1 . . . .' } });

// ---- Unique lines (FR-75, FR-79) ----

export const UL_ROW = boardOf(6, { rows: { 2: '0 1 . . 1 0', 5: '0 1 0 1 1 0' } });
export const UL_ROW_SENTENCE =
  'Рядок 2 збігається з повним рядком 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці рядки були б однакові.';
export const UL_COL = boardOf(6, { cols: { 2: '0 1 . . 1 0', 5: '0 1 0 1 1 0' } });
export const UL_COL_SENTENCE =
  'Стовпець 2 збігається з повним стовпцем 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці стовпці були б однакові.';
export const UL_NEAR_MISS_DIFFERS = boardOf(6, { rows: { 2: '0 1 . . 1 0', 5: '1 1 0 0 1 0' } });
export const UL_NEAR_MISS_INCOMPLETE = boardOf(6, { rows: { 2: '0 1 . . 1 0', 5: '0 1 . . 1 0' } });

// ---- Look-ahead (FR-76, FR-80) ----

export const LA_TWO = parseBoard(`
. 1 . . . .
. . 0 . . 0
0 0 1 0 1 1
. . . . 0 .
1 . . . . 0
0 . 1 . . 1
`);
export const LA_FOUR = parseBoard(`
. . . . 1 .
. 0 1 1 0 .
. 1 . . . .
0 1 . . 1 .
. 0 . 1 0 .
. . . . . 1
`);
export const LA_FIVE = parseBoard(`
. 0 1 . . .
1 . . 1 . .
. . . . . 0
0 1 . . 1 .
. . . . . .
. . . . 0 .
`);
export const LA_EQUAL = parseBoard(`
. 0 1 . . 1
1 . . 1 . 0
. . . . . 1
. 1 0 . . 0
1 . . 1 . 0
. . . . . 1
`);

export const lookAheadSentence = (refuted: 0 | 1, row: number, col: number, value: 0 | 1): string =>
  `Якщо поставити ${refuted} у рядку ${row}, стовпці ${col}, за кілька кроків порушиться правило, тож тут ${value}.`;

export interface Chain {
  /** the refuted placement, 1-based */
  place: { row: number; col: number; value: 0 | 1 };
  /** the forced fills the spec lists, in order, 1-based; `rule` is the technique the spec names for the step */
  steps: { row: number; col: number; value: 0 | 1; rule: string }[];
}

export const LA_TWO_CHAIN: Chain = {
  place: { row: 6, col: 5, value: 1 },
  steps: [
    { row: 6, col: 4, value: 0, rule: 'pair' },
    { row: 6, col: 2, value: 0, rule: 'count' },
  ],
};
export const LA_FOUR_CHAIN: Chain = {
  place: { row: 6, col: 1, value: 1 },
  steps: [
    { row: 6, col: 2, value: 0, rule: 'balance' },
    { row: 1, col: 2, value: 1, rule: 'count' },
    { row: 6, col: 5, value: 0, rule: 'balance' },
    { row: 3, col: 5, value: 1, rule: 'count' },
  ],
};
export const LA_FIVE_CHAIN: Chain = {
  place: { row: 1, col: 4, value: 1 },
  steps: [
    { row: 1, col: 5, value: 0, rule: 'pair' },
    { row: 3, col: 4, value: 0, rule: 'pair' },
    { row: 3, col: 5, value: 1, rule: 'sandwich' },
    { row: 2, col: 5, value: 0, rule: 'pair' },
    { row: 5, col: 5, value: 0, rule: 'pair' },
  ],
};
export const LA_EQUAL_CHAIN: Chain = {
  place: { row: 5, col: 3, value: 0 },
  steps: [
    { row: 3, col: 3, value: 1, rule: 'pair' },
    { row: 6, col: 3, value: 1, rule: 'pair' },
    { row: 2, col: 3, value: 0, rule: 'sandwich' },
  ],
};

// ---- Order and ceiling (FR-77) ----

export const LOWER_WINS = parseBoard(`
. . . . . .
0 1 . . 1 0
. . . . . .
. . . . . .
0 1 0 1 1 0
1 . . . . 1
`);
export const LOWER_WINS_WITHOUT_ROW6 = parseBoard(`
. . . . . .
0 1 . . 1 0
. . . . . .
. . . . . .
0 1 0 1 1 0
. . . . . .
`);
export const PAIR_ROW3 = boardOf(6, { rows: { 3: '0 0 . . . .' } });
/** FR-24: the pair-and-balance board `0 0 1 . . .` (a filled cell beside the pair). */
export const FILLED_BESIDE_PAIR = LB_ROW;

/** The boards of «Pair hint» and «Count hint» used by the default-ceiling scenario (6x6, level-1 techniques only). */
export const PAIR_BOARD = boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] });
export const COUNT_BOARD = boardOf(6, { rows: { 5: '0 1 0 1 . 0' } });

// ---- Worst-case boards of NFR-17 ----

export const BOARD_A = parseBoard(`
. . . . . . . 1
. . . . 0 . 1 .
0 . 1 0 . . . .
. . . 1 . . . .
. . . . . . . .
. . . . . 0 1 .
1 0 . . . . . 1
. 1 . . . 1 . .
`);
export const BOARD_B = parseBoard(`
. . . . . . . .
0 . . 0 . . 1 .
. . . 1 0 1 0 1
. . . . 1 . . .
. . . . . 0 . .
. . . . 0 . 1 .
0 . . 0 1 . . .
. 1 . . . . 0 .
`);

/** The 4x4 puzzle board of FR-27 that the three rules cannot finish. */
export const UNFINISHABLE_4 = parseBoard(`
. 0 . 0
1 0 . .
. . 0 .
. . . .
`);

/** Applies the spec's «1-based» placement to a copy of the board. */
export function withPlacement(board: Grid, place: { row: number; col: number; value: 0 | 1 }): Grid {
  const copy = board.map((r) => [...r]);
  const line = copy[place.row - 1];
  if (line === undefined) throw new Error(`no row ${place.row}`);
  if (line[place.col - 1] !== null) throw new Error(`cell ${place.row},${place.col} is not empty`);
  line[place.col - 1] = place.value;
  return copy;
}

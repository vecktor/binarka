// The boards, the Ukrainian sentences and the English sentences of the hint scenarios of add-english-version
// (openspec/changes/add-english-version/specs/puzzle-engine/spec.md), transcribed from the spec text; no value here was produced by
// running the implementation. Coordinates in `target` are 1-BASED, as the scenarios write them; `data` holds the fields of «A hint exposes
// the data of its sentence» with `line` and `other` 0-BASED (like `row` and `col`). A sentence marked `derived` is not quoted in a
// scenario: it is the requirement's pattern ("<Two zeros|Two ones> side by side in <row|column> K, ...") filled in for that board.
import type { Grid } from '../../src/engine/index';
import { boardOf } from './board';
import type { HintAny } from './hint-type';
import { LA_TWO, LB_COL, LB_ROW, UL_COL, UL_ROW } from './technique-boards';

export type FillRule = 'pair' | 'sandwich' | 'count' | 'balance' | 'unique' | 'lookahead';

export interface Data {
  axis?: 'row' | 'col';
  line?: number;
  digit?: 0 | 1;
  empties?: number;
  other?: number;
  size?: number;
}

export interface FillCase {
  /** the scenario name that owns the board */
  name: string;
  board: Grid;
  /** the lowest ceiling that allows the technique (the page asks with 4) */
  ceiling: number;
  rule: FillRule;
  target: { row: number; col: number; value: 0 | 1 };
  steps?: number;
  uk: string;
  en: string;
  /** the English sentence is quoted in a scenario (false: derived from the requirement's pattern) */
  quoted: boolean;
  data: Data;
}

const ENDING = 'because three equal digits side by side are not allowed.';
const UK_PAIR_END = 'бо три однакові цифри поспіль заборонені.';

export const FILL_CASES: FillCase[] = [
  {
    name: 'Pair of zeros in a row',
    board: boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] }),
    ceiling: 1,
    rule: 'pair',
    target: { row: 3, col: 3, value: 1 },
    uk: `Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, ${UK_PAIR_END}`,
    en: `Two zeros side by side in row 3, so only a one can go next to them, ${ENDING}`,
    quoted: true,
    data: { axis: 'row', line: 2, digit: 0 },
  },
  {
    name: 'Pair of ones in a column',
    board: boardOf(6, { cells: [[1, 4, 1], [2, 4, 1]] }),
    ceiling: 1,
    rule: 'pair',
    target: { row: 3, col: 4, value: 0 },
    uk: `Дві одиниці поспіль у стовпці 4, тож поруч може стояти лише нуль, ${UK_PAIR_END}`,
    en: `Two ones side by side in column 4, so only a zero can go next to them, ${ENDING}`,
    quoted: true,
    data: { axis: 'col', line: 3, digit: 1 },
  },
  {
    name: 'Pair of ones in a row',
    board: boardOf(6, { cells: [[2, 4, 1], [2, 5, 1]] }),
    ceiling: 1,
    rule: 'pair',
    target: { row: 2, col: 3, value: 0 },
    uk: `Дві одиниці поспіль у рядку 2, тож поруч може стояти лише нуль, ${UK_PAIR_END}`,
    en: `Two ones side by side in row 2, so only a zero can go next to them, ${ENDING}`,
    quoted: false,
    data: { axis: 'row', line: 1, digit: 1 },
  },
  {
    name: 'Pair of zeros in a column',
    board: boardOf(6, { cells: [[4, 6, 0], [5, 6, 0]] }),
    ceiling: 1,
    rule: 'pair',
    target: { row: 3, col: 6, value: 1 },
    uk: `Два нулі поспіль у стовпці 6, тож поруч може стояти лише одиниця, ${UK_PAIR_END}`,
    en: `Two zeros side by side in column 6, so only a one can go next to them, ${ENDING}`,
    quoted: false,
    data: { axis: 'col', line: 5, digit: 0 },
  },
  {
    name: 'Zeros around a gap in a column',
    board: boardOf(6, { cells: [[1, 2, 0], [3, 2, 0]] }),
    ceiling: 1,
    rule: 'sandwich',
    target: { row: 2, col: 2, value: 1 },
    uk: `Між двома нулями у стовпці 2 може стояти лише одиниця, ${UK_PAIR_END}`,
    en: `Only a one can go between the two zeros in column 2, ${ENDING}`,
    quoted: true,
    data: { axis: 'col', line: 1, digit: 0 },
  },
  {
    name: 'Ones around a gap in a row',
    board: boardOf(6, { cells: [[1, 1, 1], [1, 3, 1]] }),
    ceiling: 1,
    rule: 'sandwich',
    target: { row: 1, col: 2, value: 0 },
    uk: `Між двома одиницями у рядку 1 може стояти лише нуль, ${UK_PAIR_END}`,
    en: `Only a zero can go between the two ones in row 1, ${ENDING}`,
    quoted: true,
    data: { axis: 'row', line: 0, digit: 1 },
  },
  {
    name: 'Three zeros in a 6-wide row, one empty cell',
    board: boardOf(6, { rows: { 5: '0 1 0 1 . 0' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 5, col: 5, value: 1 },
    uk: 'У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.',
    en: 'Row 5 already has three zeros, and a line needs as many zeros as ones, so the last empty cell is a one.',
    quoted: true,
    data: { axis: 'row', line: 4, digit: 0, empties: 1, size: 6 },
  },
  {
    name: 'Three ones in a column, one empty cell',
    board: boardOf(6, { cols: { 2: '1 0 1 0 . 1' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 5, col: 2, value: 0 },
    uk: 'У стовпці 2 вже три одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.',
    en: 'Column 2 already has three ones, and a line needs as many zeros as ones, so the last empty cell is a zero.',
    quoted: true,
    data: { axis: 'col', line: 1, digit: 1, empties: 1, size: 6 },
  },
  {
    name: 'Number word for N = 4, one empty cell (zeros)',
    board: boardOf(4, { rows: { 2: '0 1 0 .' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 2, col: 4, value: 1 },
    uk: 'У рядку 2 вже два нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.',
    en: 'Row 2 already has two zeros, and a line needs as many zeros as ones, so the last empty cell is a one.',
    quoted: true,
    data: { axis: 'row', line: 1, digit: 0, empties: 1, size: 4 },
  },
  {
    name: 'Number word for N = 4, one empty cell (ones)',
    board: boardOf(4, { rows: { 2: '1 0 1 .' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 2, col: 4, value: 0 },
    uk: 'У рядку 2 вже дві одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.',
    en: 'Row 2 already has two ones, and a line needs as many zeros as ones, so the last empty cell is a zero.',
    quoted: true,
    data: { axis: 'row', line: 1, digit: 1, empties: 1, size: 4 },
  },
  {
    name: 'Number word for N = 8, one empty cell (zeros)',
    board: boardOf(8, { rows: { 1: '0 1 0 1 0 1 0 .' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 1, col: 8, value: 1 },
    uk: 'У рядку 1 вже чотири нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.',
    en: 'Row 1 already has four zeros, and a line needs as many zeros as ones, so the last empty cell is a one.',
    quoted: true,
    data: { axis: 'row', line: 0, digit: 0, empties: 1, size: 8 },
  },
  {
    name: 'Number word for N = 8, one empty cell (ones)',
    board: boardOf(8, { rows: { 1: '1 0 1 0 1 0 1 .' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 1, col: 8, value: 0 },
    uk: 'У рядку 1 вже чотири одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.',
    en: 'Row 1 already has four ones, and a line needs as many zeros as ones, so the last empty cell is a zero.',
    quoted: true,
    data: { axis: 'row', line: 0, digit: 1, empties: 1, size: 8 },
  },
  {
    name: 'Two empty cells in the line use the plural ending',
    board: boardOf(6, { rows: { 2: '0 1 0 . . 0' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 2, col: 4, value: 1 },
    uk: 'У рядку 2 вже три нулі, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — одиниці.',
    en: 'Row 2 already has three zeros, and a line needs as many zeros as ones, so the remaining empty cells are ones.',
    quoted: true,
    data: { axis: 'row', line: 1, digit: 0, empties: 2, size: 6 },
  },
  {
    name: 'Two empty cells in a column of ones use the plural ending',
    board: boardOf(6, { cols: { 3: '1 0 1 . . 1' } }),
    ceiling: 1,
    rule: 'count',
    target: { row: 4, col: 3, value: 0 },
    uk: 'У стовпці 3 вже три одиниці, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — нулі.',
    en: 'Column 3 already has three ones, and a line needs as many zeros as ones, so the remaining empty cells are zeros.',
    quoted: false,
    data: { axis: 'col', line: 2, digit: 1, empties: 2, size: 6 },
  },
  {
    name: 'Line balance in a row',
    board: LB_ROW,
    ceiling: 2,
    rule: 'balance',
    target: { row: 3, col: 6, value: 1 },
    uk: 'У рядку 3 є місце лише для одного нуля, і якщо поставити його сюди, решта клітинок дасть три однакові цифри поспіль, тож тут одиниця.',
    en: 'Row 3 has room for only one more 0, and putting it here would leave three equal digits side by side in the other cells, so this must be a 1.',
    quoted: true,
    data: { axis: 'row', line: 2, digit: 0 },
  },
  {
    name: 'Line balance in a column',
    board: LB_COL,
    ceiling: 2,
    rule: 'balance',
    target: { row: 6, col: 2, value: 0 },
    uk: 'У стовпці 2 є місце лише для однієї одиниці, і якщо поставити її сюди, решта клітинок дасть три однакові цифри поспіль, тож тут нуль.',
    en: 'Column 2 has room for only one more 1, and putting it here would leave three equal digits side by side in the other cells, so this must be a 0.',
    quoted: true,
    data: { axis: 'col', line: 1, digit: 1 },
  },
  {
    name: 'Unique lines in a row',
    board: UL_ROW,
    ceiling: 3,
    rule: 'unique',
    target: { row: 2, col: 3, value: 1 },
    uk: 'Рядок 2 збігається з повним рядком 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці рядки були б однакові.',
    en: 'Row 2 matches the complete row 5 everywhere except two empty cells, so this must be 1, or the two rows would be the same.',
    quoted: true,
    data: { axis: 'row', line: 1, other: 4 },
  },
  {
    name: 'Unique lines in a column',
    board: UL_COL,
    ceiling: 3,
    rule: 'unique',
    target: { row: 3, col: 2, value: 1 },
    uk: 'Стовпець 2 збігається з повним стовпцем 5 усюди, крім двох порожніх клітинок, тож тут має бути 1, інакше ці стовпці були б однакові.',
    en: 'Column 2 matches the complete column 5 everywhere except two empty cells, so this must be 1, or the two columns would be the same.',
    quoted: true,
    data: { axis: 'col', line: 1, other: 4 },
  },
  {
    name: 'Look-ahead of two steps beats an earlier cell of four',
    board: LA_TWO,
    ceiling: 4,
    rule: 'lookahead',
    target: { row: 6, col: 5, value: 0 },
    steps: 2,
    uk: 'Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.',
    en: 'If you put 1 in row 6, column 5, a rule would break within a few steps, so this cell must be 0.',
    quoted: true,
    data: {},
  },
];

export const NO_RULE_UK = 'Жодне з правил зараз не підказує наступного ходу.';
export const NO_RULE_EN = 'None of the rules points to a next move right now.';
export const BROKEN_UK = 'Спершу виправте порушення правил, підсвічене на полі.';
export const BROKEN_EN = 'First fix the rule break highlighted on the board.';

export interface NoTargetCase {
  name: string;
  board: Grid;
  kind: 'none' | 'broken';
  uk: string;
  en: string;
}

export const NO_TARGET_CASES: NoTargetCase[] = [
  { name: 'Sparse board with no deduction', board: boardOf(6, { cells: [[1, 1, 0]] }), kind: 'none', uk: NO_RULE_UK, en: NO_RULE_EN },
  { name: 'Three in a row on the board', board: boardOf(6, { rows: { 1: '0 0 0 . . .' } }), kind: 'broken', uk: BROKEN_UK, en: BROKEN_EN },
];

/** The fill the case pins, as the object the hint returns for `language` (the data fields included; absent fields are absent). */
export function expectedFill(c: FillCase, language: 'uk' | 'en'): HintAny {
  return {
    kind: 'fill',
    row: c.target.row - 1,
    col: c.target.col - 1,
    value: c.target.value,
    rule: c.rule,
    ...(c.steps === undefined ? {} : { steps: c.steps }),
    ...c.data,
    sentence: language === 'uk' ? c.uk : c.en,
  };
}

/** The ceiling at which the page asks (FR-77). */
export const PAGE_CEILING = 4;

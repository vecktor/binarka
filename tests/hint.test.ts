// Hint engine. Every scenario of openspec/specs/puzzle-engine/spec.md with the exact Ukrainian sentences.
// Scenario numbers are 1-based; `row` and `col` of the interface are 0-based, so scenario row 3 column 3
// is { row: 2, col: 2 }. The helper `fill` takes the 1-BASED scenario numbers and converts them.
import { describe, expect, it } from 'vitest';
import { hint } from '../src/engine/index';
import type { Grid, Hint } from '../src/engine/index';
import { VALID_4X4, boardOf, cloneBoard, emptyBoard, parseBoard } from './helpers/board';

type Rule = 'pair' | 'sandwich' | 'count';

function fill(row1: number, col1: number, value: 0 | 1, rule: Rule, sentence: string): Hint {
  return { kind: 'fill', row: row1 - 1, col: col1 - 1, value, rule, sentence };
}

const NO_RULE = 'Жодне з правил зараз не підказує наступного ходу.';
const BROKEN = 'Спершу виправте порушення правил, підсвічене на полі.';
const NONE: Hint = { kind: 'none', sentence: NO_RULE };
const BROKEN_HINT: Hint = { kind: 'broken', sentence: BROKEN };

/** Boards on which a hint applies, shared by the determinism and no-mutation checks. */
const FILL_BOARDS: [string, Grid, Hint][] = [
  ['pair of zeros in a row', boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] }), fill(3, 3, 1, 'pair', 'Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.')],
  ['pair of ones in a column', boardOf(6, { cells: [[1, 4, 1], [2, 4, 1]] }), fill(3, 4, 0, 'pair', 'Дві одиниці поспіль у стовпці 4, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.')],
  ['pair of ones in a row', boardOf(6, { cells: [[2, 4, 1], [2, 5, 1]] }), fill(2, 3, 0, 'pair', 'Дві одиниці поспіль у рядку 2, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.')],
  ['pair of zeros in a column', boardOf(6, { cells: [[4, 6, 0], [5, 6, 0]] }), fill(3, 6, 1, 'pair', 'Два нулі поспіль у стовпці 6, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.')],
  ['sandwich of zeros in a column', boardOf(6, { cells: [[1, 2, 0], [3, 2, 0]] }), fill(2, 2, 1, 'sandwich', 'Між двома нулями у стовпці 2 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.')],
  ['sandwich of ones in a row', boardOf(6, { cells: [[1, 1, 1], [1, 3, 1]] }), fill(1, 2, 0, 'sandwich', 'Між двома одиницями у рядку 1 може стояти лише нуль, бо три однакові цифри поспіль заборонені.')],
  ['count of zeros in a 6-wide row', boardOf(6, { rows: { 5: '0 1 0 1 . 0' } }), fill(5, 5, 1, 'count', 'У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.')],
  ['count of ones in a column', boardOf(6, { cols: { 2: '1 0 1 0 . 1' } }), fill(5, 2, 0, 'count', 'У стовпці 2 вже три одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.')],
];

describe('@trace FR-19 pair hint', () => {
  it.each(FILL_BOARDS.slice(0, 4))('%s', (_name, board, expected) => {
    expect(hint(board)).toEqual(expected);
  });
});

describe('@trace FR-20 sandwich hint', () => {
  it.each(FILL_BOARDS.slice(4, 6))('%s', (_name, board, expected) => {
    expect(hint(board)).toEqual(expected);
  });
});

describe('@trace FR-21 count hint', () => {
  it.each(FILL_BOARDS.slice(6, 8))('%s', (_name, board, expected) => {
    expect(hint(board)).toEqual(expected);
  });

  it('number word for N = 4: два нулі and дві одиниці', () => {
    expect(hint(boardOf(4, { rows: { 2: '0 1 0 .' } }))).toEqual(
      fill(2, 4, 1, 'count', 'У рядку 2 вже два нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.'),
    );
    expect(hint(boardOf(4, { rows: { 2: '1 0 1 .' } }))).toEqual(
      fill(2, 4, 0, 'count', 'У рядку 2 вже дві одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.'),
    );
  });

  it('number word for N = 8: чотири нулі and чотири одиниці', () => {
    expect(hint(boardOf(8, { rows: { 1: '0 1 0 1 0 1 0 .' } }))).toEqual(
      fill(1, 8, 1, 'count', 'У рядку 1 вже чотири нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.'),
    );
    expect(hint(boardOf(8, { rows: { 1: '1 0 1 0 1 0 1 .' } }))).toEqual(
      fill(1, 8, 0, 'count', 'У рядку 1 вже чотири одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.'),
    );
  });

  it('two empty cells in the line use the plural ending (решта порожніх клітинок)', () => {
    expect(hint(boardOf(6, { rows: { 2: '0 1 0 . . 0' } }))).toEqual(
      fill(2, 4, 1, 'count', 'У рядку 2 вже три нулі, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — одиниці.'),
    );
  });

  it('two empty cells in a column of ones use the plural ending with нулі (review-gate finding)', () => {
    expect(hint(boardOf(6, { cols: { 3: '1 0 1 . . 1' } }))).toEqual(
      fill(4, 3, 0, 'count', 'У стовпці 3 вже три одиниці, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — нулі.'),
    );
  });

  it('one hint fills one cell, the first empty one (row 2 column 4, not column 5)', () => {
    const result = hint(boardOf(6, { rows: { 2: '0 1 0 . . 0' } }));
    expect(result.kind).toBe('fill');
    expect(result).toMatchObject({ kind: 'fill', row: 1, col: 3, value: 1, rule: 'count' });
  });
});

describe('@trace FR-22 the explanation names the line type and number', () => {
  it('row hint from row 3 contains «рядку 3» and not «стовп»', () => {
    const s = hint(boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] })).sentence;
    expect(s).toContain('рядку 3');
    expect(s).not.toContain('стовп');
  });

  it('column hint from column 4 contains «стовпці 4» and not «рядк»', () => {
    const s = hint(boardOf(6, { cells: [[1, 4, 1], [2, 4, 1]] })).sentence;
    expect(s).toContain('стовпці 4');
    expect(s).not.toContain('рядк');
  });

  it('row numbering starts at 1: pair at row 1 columns 1 and 2', () => {
    const result = hint(boardOf(6, { cells: [[1, 1, 0], [1, 2, 0]] }));
    expect(result).toEqual(fill(1, 3, 1, 'pair', 'Два нулі поспіль у рядку 1, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.'));
    expect(result.sentence).not.toContain('рядку 0');
  });

  it('column numbering starts at 1: sandwich in column 1', () => {
    const result = hint(boardOf(6, { cells: [[1, 1, 0], [3, 1, 0]] }));
    expect(result).toEqual(fill(2, 1, 1, 'sandwich', 'Між двома нулями у стовпці 1 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.'));
    expect(result.sentence).not.toContain('стовпці 0');
  });
});

describe('@trace FR-23 hint choice is deterministic', () => {
  it.each(FILL_BOARDS)('repeated calls return the same cell, value and sentence: %s', (_name, board) => {
    const first = hint(board);
    expect(first.kind).toBe('fill');
    expect(hint(board)).toEqual(first);
    expect(hint(cloneBoard(board))).toEqual(first);
  });

  it('pair beats sandwich although the sandwich is on a lower row', () => {
    const board = boardOf(6, { rows: { 1: '1 . 1 . . .', 5: '0 0 . . . .' } });
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 4, col: 2, value: 1, rule: 'pair' });
  });

  it('sandwich beats count', () => {
    const board = boardOf(6, { rows: { 1: '0 1 0 . . 0', 6: '1 . 1 . . .' } });
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 5, col: 1, value: 0, rule: 'sandwich' });
  });

  it('rows before columns although the column pair has the lower line number', () => {
    const board = boardOf(6, { cells: [[4, 5, 1], [4, 6, 1], [1, 2, 0], [2, 2, 0]] });
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 3, col: 3, value: 0, rule: 'pair' });
  });

  it('lower line number first (row 2 before row 5)', () => {
    const board = boardOf(6, { rows: { 2: '1 1 . . . .', 5: '0 0 . . . .' } });
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 1, col: 2, value: 0, rule: 'pair' });
  });

  it('lower cell position first when both cells beside the pair are empty (row 3 column 1)', () => {
    const board = boardOf(6, { rows: { 3: '. 0 0 . . .' } });
    expect(hint(board)).toMatchObject({ kind: 'fill', row: 2, col: 0, value: 1, rule: 'pair' });
  });
});

describe('@trace FR-24 a hint targets only empty cells', () => {
  it('filled cell beside a pair is not targeted: no cell and the no-rule sentence', () => {
    expect(hint(boardOf(6, { rows: { 3: '0 0 1 . . .' } }))).toEqual(NONE);
  });

  it.each(FILL_BOARDS)('board is left unchanged and the target was empty before the call: %s', (_name, board) => {
    const before = cloneBoard(board);
    const result = hint(board);
    expect(board).toEqual(before);
    expect(result.kind).toBe('fill');
    if (result.kind === 'fill') expect(before[result.row]?.[result.col]).toBeNull();
  });
});

describe('@trace FR-25 no-rule hint', () => {
  it('sparse board with only 0 at row 1 column 1 targets no cell', () => {
    expect(hint(boardOf(6, { cells: [[1, 1, 0]] }))).toEqual(NONE);
  });

  it('empty 6x6 board targets no cell', () => {
    expect(hint(emptyBoard(6))).toEqual(NONE);
  });

  it('complete valid 4x4 board targets no cell', () => {
    expect(hint(VALID_4X4)).toEqual(NONE);
  });
});

describe('@trace FR-26 broken-board hint', () => {
  it('three in a row (0 0 0 . . .) targets no cell and asks to fix the rule', () => {
    expect(hint(boardOf(6, { rows: { 1: '0 0 0 . . .' } }))).toEqual(BROKEN_HINT);
  });

  it('a broken rule wins over an available pair hint', () => {
    expect(hint(boardOf(6, { rows: { 1: '0 0 0 . . .', 3: '1 1 . . . .' } }))).toEqual(BROKEN_HINT);
  });

  it('digit-count violation (1 1 0 1 1 .) is broken', () => {
    expect(hint(boardOf(6, { rows: { 2: '1 1 0 1 1 .' } }))).toEqual(BROKEN_HINT);
  });

  it('duplicate complete rows are broken', () => {
    const board = parseBoard(`
      0 1 1 0
      0 1 1 0
      1 0 0 1
      1 0 0 1
    `);
    expect(hint(board)).toEqual(BROKEN_HINT);
  });

  it('a legal entry that differs from the solution is followed, not corrected', () => {
    // The unique solution of the puzzle is VALID_4X4 (0 0 1 1 in row 1); the player entered 1 1.
    const board = boardOf(4, { cells: [[1, 1, 1], [1, 2, 1]] });
    expect(VALID_4X4[0]?.[2]).toBe(1);
    expect(hint(board)).toEqual(
      fill(1, 3, 0, 'pair', 'Дві одиниці поспіль у рядку 1, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.'),
    );
  });
});

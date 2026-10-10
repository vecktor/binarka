// Hint engine. Every scenario of openspec/specs/puzzle-engine/spec.md with the exact Ukrainian sentences.
// Scenario numbers are 1-based; `row` and `col` of the interface are 0-based, so scenario row 3 column 3
// is { row: 2, col: 2 }. The helper `fill` takes the 1-BASED scenario numbers and converts them.
// add-english-version DELIBERATE CHANGE (FR-110, FR-112; source: design.md «Tests that change deliberately», row `tests/hint.test.ts`; the
// helper `fill` and the 13 whole-object checks through it): a fill result carries the data of its sentence (axis, line, digit, and for the
// count rule empties and size), so `fill` takes that data too and the checks are `toStrictEqual` (a field that must be absent is absent).
// The Ukrainian sentences, cells and values are byte-identical to before; the English scenarios are added at the end of the file.
import { describe, expect, it } from 'vitest';
import type { Grid, Hint } from '../src/engine/index';
import { VALID_4X4, boardOf, cloneBoard, emptyBoard, parseBoard } from './helpers/board';
import { FILL_CASES, NO_TARGET_CASES, expectedFill } from './helpers/hint-cases';
import { hint } from './helpers/hint-type';
import type { HintAny } from './helpers/hint-type';

type Rule = 'pair' | 'sandwich' | 'count';

interface FillData {
  axis: 'row' | 'col';
  /** 0-based, like `row` and `col` */
  line: number;
  digit: 0 | 1;
  empties?: number;
  size?: number;
}

function fill(row1: number, col1: number, value: 0 | 1, rule: Rule, sentence: string, data: FillData): HintAny {
  return { kind: 'fill', row: row1 - 1, col: col1 - 1, value, rule, ...data, sentence };
}

const NO_RULE = 'Жодне з правил зараз не підказує наступного ходу.';
const BROKEN = 'Спершу виправте порушення правил, підсвічене на полі.';
const NONE: Hint = { kind: 'none', sentence: NO_RULE };
const BROKEN_HINT: Hint = { kind: 'broken', sentence: BROKEN };


/** Boards on which a hint applies, shared by the determinism and no-mutation checks. */
const FILL_BOARDS: [string, Grid, HintAny][] = [
  ['pair of zeros in a row', boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] }), fill(3, 3, 1, 'pair', 'Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.', { axis: 'row', line: 2, digit: 0 })],
  ['pair of ones in a column', boardOf(6, { cells: [[1, 4, 1], [2, 4, 1]] }), fill(3, 4, 0, 'pair', 'Дві одиниці поспіль у стовпці 4, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.', { axis: 'col', line: 3, digit: 1 })],
  ['pair of ones in a row', boardOf(6, { cells: [[2, 4, 1], [2, 5, 1]] }), fill(2, 3, 0, 'pair', 'Дві одиниці поспіль у рядку 2, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.', { axis: 'row', line: 1, digit: 1 })],
  ['pair of zeros in a column', boardOf(6, { cells: [[4, 6, 0], [5, 6, 0]] }), fill(3, 6, 1, 'pair', 'Два нулі поспіль у стовпці 6, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.', { axis: 'col', line: 5, digit: 0 })],
  ['sandwich of zeros in a column', boardOf(6, { cells: [[1, 2, 0], [3, 2, 0]] }), fill(2, 2, 1, 'sandwich', 'Між двома нулями у стовпці 2 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.', { axis: 'col', line: 1, digit: 0 })],
  ['sandwich of ones in a row', boardOf(6, { cells: [[1, 1, 1], [1, 3, 1]] }), fill(1, 2, 0, 'sandwich', 'Між двома одиницями у рядку 1 може стояти лише нуль, бо три однакові цифри поспіль заборонені.', { axis: 'row', line: 0, digit: 1 })],
  ['count of zeros in a 6-wide row', boardOf(6, { rows: { 5: '0 1 0 1 . 0' } }), fill(5, 5, 1, 'count', 'У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.', { axis: 'row', line: 4, digit: 0, empties: 1, size: 6 })],
  ['count of ones in a column', boardOf(6, { cols: { 2: '1 0 1 0 . 1' } }), fill(5, 2, 0, 'count', 'У стовпці 2 вже три одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.', { axis: 'col', line: 1, digit: 1, empties: 1, size: 6 })],
];

describe('@trace FR-19 pair hint', () => {
  it.each(FILL_BOARDS.slice(0, 4))('%s', (_name, board, expected) => {
    expect(hint(board)).toStrictEqual(expected);
  });
});

describe('@trace FR-20 sandwich hint', () => {
  it.each(FILL_BOARDS.slice(4, 6))('%s', (_name, board, expected) => {
    expect(hint(board)).toStrictEqual(expected);
  });
});

describe('@trace FR-21 count hint', () => {
  it.each(FILL_BOARDS.slice(6, 8))('%s', (_name, board, expected) => {
    expect(hint(board)).toStrictEqual(expected);
  });

  it('number word for N = 4: два нулі and дві одиниці', () => {
    expect(hint(boardOf(4, { rows: { 2: '0 1 0 .' } }))).toStrictEqual(
      fill(2, 4, 1, 'count', 'У рядку 2 вже два нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.', { axis: 'row', line: 1, digit: 0, empties: 1, size: 4 }),
    );
    expect(hint(boardOf(4, { rows: { 2: '1 0 1 .' } }))).toStrictEqual(
      fill(2, 4, 0, 'count', 'У рядку 2 вже дві одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.', { axis: 'row', line: 1, digit: 1, empties: 1, size: 4 }),
    );
  });

  it('number word for N = 8: чотири нулі and чотири одиниці', () => {
    expect(hint(boardOf(8, { rows: { 1: '0 1 0 1 0 1 0 .' } }))).toStrictEqual(
      fill(1, 8, 1, 'count', 'У рядку 1 вже чотири нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.', { axis: 'row', line: 0, digit: 0, empties: 1, size: 8 }),
    );
    expect(hint(boardOf(8, { rows: { 1: '1 0 1 0 1 0 1 .' } }))).toStrictEqual(
      fill(1, 8, 0, 'count', 'У рядку 1 вже чотири одиниці, а нулів і одиниць має бути порівну, тож остання порожня клітинка — нуль.', { axis: 'row', line: 0, digit: 1, empties: 1, size: 8 }),
    );
  });

  it('two empty cells in the line use the plural ending (решта порожніх клітинок)', () => {
    expect(hint(boardOf(6, { rows: { 2: '0 1 0 . . 0' } }))).toStrictEqual(
      fill(2, 4, 1, 'count', 'У рядку 2 вже три нулі, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — одиниці.', { axis: 'row', line: 1, digit: 0, empties: 2, size: 6 }),
    );
  });

  it('two empty cells in a column of ones use the plural ending with нулі (review-gate finding)', () => {
    expect(hint(boardOf(6, { cols: { 3: '1 0 1 . . 1' } }))).toStrictEqual(
      fill(4, 3, 0, 'count', 'У стовпці 3 вже три одиниці, а нулів і одиниць має бути порівну, тож решта порожніх клітинок — нулі.', { axis: 'col', line: 2, digit: 1, empties: 2, size: 6 }),
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
    expect(result).toStrictEqual(fill(1, 3, 1, 'pair', 'Два нулі поспіль у рядку 1, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.', { axis: 'row', line: 0, digit: 0 }));
    expect(result.sentence).not.toContain('рядку 0');
  });

  it('column numbering starts at 1: sandwich in column 1', () => {
    const result = hint(boardOf(6, { cells: [[1, 1, 0], [3, 1, 0]] }));
    expect(result).toStrictEqual(fill(2, 1, 1, 'sandwich', 'Між двома нулями у стовпці 1 може стояти лише одиниця, бо три однакові цифри поспіль заборонені.', { axis: 'col', line: 0, digit: 0 }));
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
    expect(before[result.row ?? -1]?.[result.col ?? -1], 'the target cell was empty').toBeNull();
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
    expect(hint(board)).toStrictEqual(
      fill(1, 3, 0, 'pair', 'Дві одиниці поспіль у рядку 1, тож поруч може стояти лише нуль, бо три однакові цифри поспіль заборонені.', { axis: 'row', line: 0, digit: 1 }),
    );
  });
});

// ---------------------------------------------------------------------------------------------------------
// add-english-version: the English sentences of the named scenarios (FR-112, FR-56), whole-object, in the page language
// ---------------------------------------------------------------------------------------------------------

describe('@trace FR-112 @trace FR-56 the English hint sentences of the named scenarios', () => {
  const quoted = FILL_CASES.filter((c) => c.quoted);

  it.each(quoted.map((c) => [c.name, c] as const))('%s: the English sentence, the same target, value and data as in Ukrainian', (_name, c) => {
    expect(hint(c.board, c.ceiling, 'en')).toStrictEqual(expectedFill(c, 'en'));
    expect(hint(c.board, c.ceiling, 'en').sentence).toBe(c.en);
  });

  it.each(FILL_CASES.filter((c) => !c.quoted).map((c) => [c.name, c] as const))(
    '%s: the English sentence follows the pattern of the requirement (not quoted in a scenario)',
    (_name, c) => {
      expect(hint(c.board, c.ceiling, 'en')).toStrictEqual(expectedFill(c, 'en'));
    },
  );

  it.each(NO_TARGET_CASES.map((c) => [c.name, c] as const))('%s: the English no-target sentence at every ceiling', (_name, c) => {
    for (const ceiling of [undefined, 1, 4]) {
      expect(hint(c.board, ceiling, 'en')).toStrictEqual({ kind: c.kind, sentence: c.en });
    }
  });

  it('the language never changes which hint is chosen (FR-23, FR-77): the same cell and value on every named board', () => {
    for (const c of FILL_CASES) {
      const uk = hint(c.board, c.ceiling, 'uk');
      const en = hint(c.board, c.ceiling, 'en');
      expect([en.row, en.col, en.value, en.rule]).toEqual([uk.row, uk.col, uk.value, uk.rule]);
    }
  });
});

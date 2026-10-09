// NFR-4 (every hint sentence is exactly one sentence), NFR-5 (Ukrainian: Cyrillic, no Latin) and FR-22 (the sentence
// names its line or cell) for the three new sentence kinds of add-difficulty-engine: line balance (FR-78), unique lines
// (FR-79) and look-ahead (FR-80). Written from the delta spec before the implementation exists.
// The sentences come from the engine through the engine, requested with the
// ceiling that allows their technique; each case first asserts the fill and its rule, so a placeholder or the
// no-rule sentence cannot pass vacuously.
// Coverage: line balance at N = 6 and 8 (row and column at 6, the 8x8 row of the threshold scenario); unique lines,
// row and column, on the spec's 6x6 boards and on an 8x8 board derived by hand from FR-75 (no 8x8 board is pinned by
// the spec); look-ahead on the spec's three 6x6 boards. CONSCIOUS GAP: look-ahead at N = 8 has no spec board and
// none can be derived without running an implementation, so it is not covered here (reported in the red-run file).
// Green by design at red: the shape checks on the literal sentences of the spec (they test the helpers on the spec's
// text) and the checks of the existing no-rule and broken sentences. Everything that asks the engine for a new
// technique fails at red.
import { describe, expect, it } from 'vitest';
import type { Grid } from '../src/engine/index';
import { boardOf, hasCyrillic, hasLatin, isOneSentence, terminalMarkCount } from './helpers/board';
import { hint } from './helpers/hint-type';
import {
  BROKEN_SENTENCE,
  LA_EQUAL,
  LA_FOUR,
  LA_TWO,
  LB_COL,
  LB_N8,
  LB_ROW,
  NO_RULE_SENTENCE,
  UL_COL,
  UL_ROW,
} from './helpers/technique-boards';

/** An 8x8 unique-lines row board derived by hand from FR-75: row 2 agrees with the complete row 5 on its six filled cells. */
const UL_ROW_8 = boardOf(8, { rows: { 2: '0 1 . . 1 0 1 0', 5: '0 1 0 1 1 0 1 0' } });
const UL_COL_8 = boardOf(8, { cols: { 2: '0 1 . . 1 0 1 0', 5: '0 1 0 1 1 0 1 0' } });

interface Case {
  label: string;
  board: Grid;
  ceiling: number;
  rule: 'balance' | 'unique' | 'lookahead';
}

const CASES: Case[] = [
  { label: 'line balance, row, N = 6', board: LB_ROW, ceiling: 2, rule: 'balance' },
  { label: 'line balance, column, N = 6', board: LB_COL, ceiling: 2, rule: 'balance' },
  { label: 'line balance, row, N = 8', board: LB_N8, ceiling: 2, rule: 'balance' },
  { label: 'unique lines, row, N = 6', board: UL_ROW, ceiling: 3, rule: 'unique' },
  { label: 'unique lines, column, N = 6', board: UL_COL, ceiling: 3, rule: 'unique' },
  { label: 'unique lines, row, N = 8', board: UL_ROW_8, ceiling: 3, rule: 'unique' },
  { label: 'unique lines, column, N = 8', board: UL_COL_8, ceiling: 3, rule: 'unique' },
  { label: 'look-ahead of two steps, N = 6', board: LA_TWO, ceiling: 4, rule: 'lookahead' },
  { label: 'look-ahead of four steps, N = 6', board: LA_FOUR, ceiling: 4, rule: 'lookahead' },
  { label: 'look-ahead with equal steps, N = 6', board: LA_EQUAL, ceiling: 4, rule: 'lookahead' },
];

describe('@trace NFR-4 @trace FR-78 @trace FR-79 @trace FR-80 the new sentence kinds are exactly one sentence', () => {
  it.each(CASES)('$label: one terminal mark, at the end, no earlier break', ({ board, ceiling, rule }) => {
    const h = hint(board, ceiling);
    expect(h.kind).toBe('fill');
    expect(h.rule).toBe(rule);
    expect(terminalMarkCount(h.sentence), JSON.stringify(h.sentence)).toBe(1);
    expect(isOneSentence(h.sentence), JSON.stringify(h.sentence)).toBe(true);
    expect(h.sentence.endsWith('.')).toBe(true);
  });
});

describe('@trace NFR-5 @trace FR-78 @trace FR-79 @trace FR-80 the new sentence kinds are Ukrainian', () => {
  it.each(CASES)('$label: Cyrillic letters, no Latin letters', ({ board, ceiling, rule }) => {
    const h = hint(board, ceiling);
    expect(h.rule).toBe(rule);
    expect(hasCyrillic(h.sentence)).toBe(true);
    expect(hasLatin(h.sentence), JSON.stringify(h.sentence)).toBe(false);
  });
});

describe('@trace FR-22 the new sentences name their line or their cell', () => {
  it('line balance in a row contains «рядку 3» and no «стовп»', () => {
    const h = hint(LB_ROW, 2);
    expect(h.rule).toBe('balance');
    expect(h.sentence).toContain('рядку 3');
    expect(h.sentence).not.toContain('стовп');
  });

  it('line balance in a column contains «стовпці 2» and no «рядк»', () => {
    const h = hint(LB_COL, 2);
    expect(h.rule).toBe('balance');
    expect(h.sentence).toContain('стовпці 2');
    expect(h.sentence).not.toContain('рядк');
  });

  it('line balance at N = 8 names row 1', () => {
    const h = hint(LB_N8, 2);
    expect(h.rule).toBe('balance');
    expect(h.sentence).toContain('рядку 1');
  });

  it('unique lines in a row starts with «Рядок 2», in a column with «Стовпець 2» (the target cell\'s own line first)', () => {
    const row = hint(UL_ROW, 3);
    const col = hint(UL_COL, 3);
    expect(row.rule).toBe('unique');
    expect(col.rule).toBe('unique');
    expect(row.sentence.startsWith('Рядок 2')).toBe(true);
    expect(col.sentence.startsWith('Стовпець 2')).toBe(true);
  });

  it('unique lines at N = 8 starts with the target line and names the complete line 5', () => {
    const row = hint(UL_ROW_8, 3);
    const col = hint(UL_COL_8, 3);
    expect(row.rule).toBe('unique');
    expect(col.rule).toBe('unique');
    expect(row.sentence.startsWith('Рядок 2 збігається з повним рядком 5')).toBe(true);
    expect(col.sentence.startsWith('Стовпець 2 збігається з повним стовпцем 5')).toBe(true);
  });

  it('the look-ahead sentence names the cell by row and column: «у рядку 6, стовпці 5»', () => {
    const h = hint(LA_TWO, 4);
    expect(h.rule).toBe('lookahead');
    expect(h.sentence).toContain('у рядку 6, стовпці 5');
  });

  it('the look-ahead sentences of the other boards name their own cells (row 6 column 1; row 5 column 3)', () => {
    expect(hint(LA_FOUR, 4).sentence).toContain('у рядку 6, стовпці 1');
    expect(hint(LA_EQUAL, 4).sentence).toContain('у рядку 5, стовпці 3');
  });
});

describe('@trace NFR-4 number words, dashes and reason clauses are not sentence breaks', () => {
  const COMMA_HEAVY = 'Якщо поставити 1 у рядку 6, стовпці 5, за кілька кроків порушиться правило, тож тут 0.';
  const COUNT = 'У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.';
  const PAIR = 'Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.';

  it.each([COMMA_HEAVY, COUNT, PAIR])('the spec sentence counts as one: %s', (sentence) => {
    expect(isOneSentence(sentence)).toBe(true);
    expect(terminalMarkCount(sentence)).toBe(1);
  });

  it('the comma-heavy look-ahead sentence the engine returns is exactly the spec shape and counts as one', () => {
    const h = hint(LA_TWO, 4);
    expect(h.rule).toBe('lookahead');
    expect(h.sentence).toBe(COMMA_HEAVY);
    expect(isOneSentence(h.sentence)).toBe(true);
  });
});

describe('@trace NFR-4 @trace NFR-5 the no-rule and broken-rule sentences keep the one-sentence Ukrainian shape', () => {
  it.each([NO_RULE_SENTENCE, BROKEN_SENTENCE])('%s', (sentence) => {
    expect(isOneSentence(sentence)).toBe(true);
    expect(hasCyrillic(sentence)).toBe(true);
    expect(hasLatin(sentence)).toBe(false);
  });
});

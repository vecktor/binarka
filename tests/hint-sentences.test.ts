// NFR-4 (every sentence is exactly one sentence) and NFR-5 (every sentence is Ukrainian: Cyrillic, no Latin).
// A collection of every sentence kind at N = 4, 6 and 8, each for a row and for a column where the kind has both.
// Each case first asserts the kind and rule it must produce, so the stub's placeholder cannot pass vacuously.
import { describe, expect, it } from 'vitest';
import { hint } from '../src/engine/index';
import type { Grid } from '../src/engine/index';
import { boardOf, emptyBoard, hasCyrillic, hasLatin, isOneSentence, terminalMarkCount } from './helpers/board';

interface Case {
  label: string;
  board: Grid;
  kind: 'fill' | 'none' | 'broken';
  rule?: 'pair' | 'sandwich' | 'count';
}

/** `0 1 0 1 ... .`: N-1 alternating cells starting with `start`, last cell empty (N/2 of `start` digit). */
function alternating(n: number, start: 0 | 1): string {
  const cells: string[] = [];
  for (let i = 0; i < n - 1; i++) cells.push(String(i % 2 === 0 ? start : 1 - start));
  cells.push('.');
  return cells.join(' ');
}

function casesFor(n: number): Case[] {
  return [
    { label: `N=${n} pair zeros in a row`, board: boardOf(n, { cells: [[3, 1, 0], [3, 2, 0]] }), kind: 'fill', rule: 'pair' },
    { label: `N=${n} pair ones in a row`, board: boardOf(n, { cells: [[2, 2, 1], [2, 3, 1]] }), kind: 'fill', rule: 'pair' },
    { label: `N=${n} pair zeros in a column`, board: boardOf(n, { cells: [[1, 4, 0], [2, 4, 0]] }), kind: 'fill', rule: 'pair' },
    { label: `N=${n} pair ones in a column`, board: boardOf(n, { cells: [[1, 4, 1], [2, 4, 1]] }), kind: 'fill', rule: 'pair' },
    { label: `N=${n} sandwich zeros in a row`, board: boardOf(n, { cells: [[1, 1, 0], [1, 3, 0]] }), kind: 'fill', rule: 'sandwich' },
    { label: `N=${n} sandwich ones in a row`, board: boardOf(n, { cells: [[1, 1, 1], [1, 3, 1]] }), kind: 'fill', rule: 'sandwich' },
    { label: `N=${n} sandwich zeros in a column`, board: boardOf(n, { cells: [[1, 2, 0], [3, 2, 0]] }), kind: 'fill', rule: 'sandwich' },
    { label: `N=${n} sandwich ones in a column`, board: boardOf(n, { cells: [[1, 2, 1], [3, 2, 1]] }), kind: 'fill', rule: 'sandwich' },
    { label: `N=${n} count zeros in a row`, board: boardOf(n, { rows: { 2: alternating(n, 0) } }), kind: 'fill', rule: 'count' },
    { label: `N=${n} count ones in a row`, board: boardOf(n, { rows: { 2: alternating(n, 1) } }), kind: 'fill', rule: 'count' },
    { label: `N=${n} count zeros in a column`, board: boardOf(n, { cols: { 2: alternating(n, 0) } }), kind: 'fill', rule: 'count' },
    { label: `N=${n} count ones in a column`, board: boardOf(n, { cols: { 2: alternating(n, 1) } }), kind: 'fill', rule: 'count' },
    { label: `N=${n} no-rule (empty board)`, board: emptyBoard(n), kind: 'none' },
    { label: `N=${n} no-rule (single given)`, board: boardOf(n, { cells: [[1, 1, 0]] }), kind: 'none' },
    { label: `N=${n} broken (three in a row)`, board: boardOf(n, { rows: { 1: `0 0 0 ${Array(n - 3).fill('.').join(' ')}` } }), kind: 'broken' },
    { label: `N=${n} broken (three in a column)`, board: boardOf(n, { cols: { 1: `1 1 1 ${Array(n - 3).fill('.').join(' ')}` } }), kind: 'broken' },
  ];
}

const ALL: Case[] = [4, 6, 8].flatMap(casesFor);

describe('@trace NFR-4 every hint sentence is exactly one sentence', () => {
  it.each(ALL)('$label', ({ board, kind, rule }) => {
    const result = hint(board);
    expect(result.kind).toBe(kind);
    if (rule) expect(result).toMatchObject({ rule });
    expect(isOneSentence(result.sentence), result.sentence).toBe(true);
    expect(result.sentence.trimEnd().endsWith('.')).toBe(true);
    expect(terminalMarkCount(result.sentence)).toBe(1);
  });

  it('number words, comma and dash are not breaks: the count sentence for row 5 is one sentence', () => {
    const result = hint(boardOf(6, { rows: { 5: '0 1 0 1 . 0' } }));
    expect(result).toMatchObject({ kind: 'fill', rule: 'count' });
    expect(result.sentence).toBe('У рядку 5 вже три нулі, а нулів і одиниць має бути порівну, тож остання порожня клітинка — одиниця.');
    expect(isOneSentence(result.sentence)).toBe(true);
  });
});

describe('@trace NFR-4 reason clauses are not sentence breaks', () => {
  it('a pair sentence with the «бо» clause is one sentence', () => {
    const result = hint(boardOf(6, { cells: [[3, 1, 0], [3, 2, 0]] }));
    expect(result).toMatchObject({ kind: 'fill', rule: 'pair' });
    expect(result.sentence).toBe('Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені.');
    expect(isOneSentence(result.sentence)).toBe(true);
    expect(terminalMarkCount(result.sentence)).toBe(1);
  });
});

describe('@trace NFR-5 hint sentences are Ukrainian', () => {
  it.each(ALL)('$label', ({ board, kind, rule }) => {
    const result = hint(board);
    expect(result.kind).toBe(kind);
    if (rule) expect(result).toMatchObject({ rule });
    expect(hasCyrillic(result.sentence), result.sentence).toBe(true);
    expect(hasLatin(result.sentence), result.sentence).toBe(false);
  });
});

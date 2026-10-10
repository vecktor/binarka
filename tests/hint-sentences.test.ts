// NFR-4 (every sentence is exactly one sentence) and NFR-5 (every sentence is Ukrainian: Cyrillic, no Latin).
// add-english-version (FR-112, NFR-4, NFR-5 per language, FR-22): the same collection is asked in English; the Ukrainian tests above the
// English blocks are unchanged. The English blocks first assert a Latin sentence, so a Ukrainian placeholder cannot pass them vacuously.
// A collection of every sentence kind at N = 4, 6 and 8, each for a row and for a column where the kind has both.
// Each case first asserts the kind and rule it must produce, so the stub's placeholder cannot pass vacuously.
import { describe, expect, it } from 'vitest';
import { hint } from '../src/engine/index';
import type { Grid } from '../src/engine/index';
import { boardOf, emptyBoard, hasCyrillic, hasLatin, isOneSentence, terminalMarkCount } from './helpers/board';
import { FILL_CASES } from './helpers/hint-cases';
import { hint as languageHint } from './helpers/hint-type';

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

// ---------------------------------------------------------------------------------------------------------
// add-english-version: the English sentences (FR-112)
// ---------------------------------------------------------------------------------------------------------

const APOSTROPHES = /['\u02BC]/; // U+0027 and U+02BC: no English page text or sentence has either (Q4)

/** The pattern the English requirement gives for a rule, with the digit words checked for agreement. Returns a problem or ''. */
function englishProblem(rule: 'pair' | 'sandwich' | 'count', n: number, sentence: string): string {
  const opposite: Record<string, string> = { zeros: 'a one', ones: 'a zero' };
  if (rule === 'pair') {
    const m = /^Two (zeros|ones) side by side in (row|column) ([1-8]), so only (a one|a zero) can go next to them, because three equal digits side by side are not allowed\.$/.exec(sentence);
    if (m === null) return 'does not match the pair pattern';
    return opposite[m[1] ?? ''] === m[4] ? '' : `the pair of ${m[1] ?? ''} allows ${m[4] ?? ''}`;
  }
  if (rule === 'sandwich') {
    const m = /^Only (a one|a zero) can go between the two (zeros|ones) in (row|column) ([1-8]), because three equal digits side by side are not allowed\.$/.exec(sentence);
    if (m === null) return 'does not match the sandwich pattern';
    return opposite[m[2] ?? ''] === m[1] ? '' : `the sandwich of ${m[2] ?? ''} allows ${m[1] ?? ''}`;
  }
  const m = /^(Row|Column) ([1-8]) already has (two|three|four) (zeros|ones), and a line needs as many zeros as ones, so the (last empty cell is (a one|a zero)|remaining empty cells are (ones|zeros))\.$/.exec(sentence);
  if (m === null) return 'does not match the count pattern';
  const word = { 4: 'two', 6: 'three', 8: 'four' }[n];
  if (m[3] !== word) return `the number word is ${m[3] ?? ''} but N/2 for N = ${n} is ${word ?? '?'}`;
  const single = m[6];
  const plural = m[7];
  if (single !== undefined) return opposite[m[4] ?? ''] === single ? '' : `${m[4] ?? ''} with ${single}`;
  return (m[4] === 'zeros' ? 'ones' : 'zeros') === plural ? '' : `${m[4] ?? ''} with the remaining ${plural ?? ''}`;
}

describe('@trace NFR-4 @trace FR-112 every English hint sentence is exactly one sentence', () => {
  it.each(ALL)('$label', ({ board, kind, rule }) => {
    const result = languageHint(board, 1, 'en');
    expect(result.kind).toBe(kind);
    if (rule) expect(result).toMatchObject({ rule });
    expect(result.sentence, 'premise: an English sentence (Latin letters)').toMatch(/[A-Za-z]/);
    expect(isOneSentence(result.sentence), result.sentence).toBe(true);
    expect(terminalMarkCount(result.sentence)).toBe(1);
    expect(result.sentence.trimEnd().endsWith('.')).toBe(true);
    expect(APOSTROPHES.test(result.sentence), `${result.sentence} has no U+0027 or U+02BC`).toBe(false);
  });

  it('number words, commas and the reason clauses are not breaks: the English count sentence for row 5 is one sentence', () => {
    const result = languageHint(boardOf(6, { rows: { 5: '0 1 0 1 . 0' } }), 1, 'en');
    expect(result).toMatchObject({ kind: 'fill', rule: 'count' });
    expect(result.sentence).toBe('Row 5 already has three zeros, and a line needs as many zeros as ones, so the last empty cell is a one.');
    expect(isOneSentence(result.sentence)).toBe(true);
  });
});

describe('@trace NFR-5 @trace FR-112 English hint sentences are Latin, with no Cyrillic letter', () => {
  it.each(ALL)('$label', ({ board, kind, rule }) => {
    const result = languageHint(board, 1, 'en');
    expect(result.kind).toBe(kind);
    if (rule) expect(result).toMatchObject({ rule });
    expect(hasLatin(result.sentence), result.sentence).toBe(true);
    expect(hasCyrillic(result.sentence), result.sentence).toBe(false);
    if (rule) {
      // names "row" or "column" with a 1-based number; "zero"/"one" agree with the count ("two zeros", "three ones")
      expect(englishProblem(rule, board.length, result.sentence), result.sentence).toBe('');
    } else {
      expect(result.sentence, 'the no-rule and broken-rule sentences name no line').not.toMatch(/\b(row|column)\b/i);
    }
  });
});

describe('@trace FR-22 @trace FR-112 the English explanation names the line type and number', () => {
  const byName = (name: string): FillCaseLike => {
    const found = FILL_CASES.find((c) => c.name === name);
    expect.assert(found !== undefined, `premise: the case table holds «${name}»`);
    return found;
  };
  type FillCaseLike = (typeof FILL_CASES)[number];

  it('English line types and numbering: the row pair contains "row 3" and not "column"', () => {
    const c = byName('Pair of zeros in a row');
    const s = languageHint(c.board, 4, 'en').sentence;
    expect(s).toContain('row 3');
    expect(s).not.toContain('column');
    expect(s).not.toContain('row 0');
  });

  it('English line types and numbering: the column pair contains "column 4" and not "row"', () => {
    const c = byName('Pair of ones in a column');
    const s = languageHint(c.board, 4, 'en').sentence;
    expect(s).toContain('column 4');
    expect(s).not.toMatch(/\brow\b/);
    expect(s).not.toContain('column 0');
  });

  it('English line types and numbering: the look-ahead sentence contains "row 6, column 5"', () => {
    const c = byName('Look-ahead of two steps beats an earlier cell of four');
    const s = languageHint(c.board, 4, 'en').sentence;
    expect(s).toContain('row 6, column 5');
    expect(s).not.toContain('row 0');
    expect(s).not.toContain('column 0');
  });

  it('English numbering starts at 1 for rows and for columns', () => {
    const row = languageHint(boardOf(6, { cells: [[1, 1, 0], [1, 2, 0]] }), 1, 'en').sentence;
    expect(row).toBe('Two zeros side by side in row 1, so only a one can go next to them, because three equal digits side by side are not allowed.');
    const col = languageHint(boardOf(6, { cells: [[1, 1, 0], [3, 1, 0]] }), 1, 'en').sentence;
    expect(col).toBe('Only a one can go between the two zeros in column 1, because three equal digits side by side are not allowed.');
  });
});

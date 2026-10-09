import { findViolations } from './rules';
import { nextFill } from './techniques';
import type { Digit, Fill } from './techniques';
import type { Grid, Hint } from './types';

const NO_RULE = 'Жодне з правил зараз не підказує наступного ходу.';
const BROKEN = 'Спершу виправте порушення правил, підсвічене на полі.';

/**
 * Number words of the count sentence, keyed by k = N/2 (zeros: masculine, ones: feminine).
 * The pair and sandwich sentences keep their own fixed forms («два»/«дві», «двома»).
 * Rows k = 2 to 4 are tested; the plural genitive forms for k = 5 to 8 follow the regular rule
 * but are untested above N = 8.
 */
const COUNT_WORDS: Record<number, { zero: string; one: string }> = {
  2: { zero: 'два нулі', one: 'дві одиниці' },
  3: { zero: 'три нулі', one: 'три одиниці' },
  4: { zero: 'чотири нулі', one: 'чотири одиниці' },
  5: { zero: 'п’ять нулів', one: 'п’ять одиниць' },
  6: { zero: 'шість нулів', one: 'шість одиниць' },
  7: { zero: 'сім нулів', one: 'сім одиниць' },
  8: { zero: 'вісім нулів', one: 'вісім одиниць' },
};

const inLine = (axis: 'row' | 'col'): string => (axis === 'row' ? 'рядку' : 'стовпці');
const singular = (d: Digit): string => (d === 0 ? 'нуль' : 'одиниця');

function pairSentence(axis: 'row' | 'col', line: number, d: Digit): string {
  const twice = d === 0 ? 'Два нулі' : 'Дві одиниці';
  return `${twice} поспіль у ${inLine(axis)} ${line + 1}, тож поруч може стояти лише ${singular((1 - d) as Digit)}, бо три однакові цифри поспіль заборонені.`;
}

function sandwichSentence(axis: 'row' | 'col', line: number, d: Digit): string {
  const both = d === 0 ? 'нулями' : 'одиницями';
  return `Між двома ${both} у ${inLine(axis)} ${line + 1} може стояти лише ${singular((1 - d) as Digit)}, бо три однакові цифри поспіль заборонені.`;
}

function countSentence(axis: 'row' | 'col', line: number, d: Digit, n: number, empties: number): string {
  const words = COUNT_WORDS[n / 2];
  const have = words === undefined ? String(n / 2) : d === 0 ? words.zero : words.one;
  const ending =
    empties === 1
      ? `остання порожня клітинка — ${singular((1 - d) as Digit)}`
      : `решта порожніх клітинок — ${d === 0 ? 'одиниці' : 'нулі'}`;
  return `У ${inLine(axis)} ${line + 1} вже ${have}, а нулів і одиниць має бути порівну, тож ${ending}.`;
}

function balanceSentence(axis: 'row' | 'col', line: number, d: Digit): string {
  const place = d === 0 ? 'одного нуля' : 'однієї одиниці';
  const it = d === 0 ? 'його' : 'її';
  const result = d === 0 ? 'одиниця' : 'нуль';
  return `У ${inLine(axis)} ${line + 1} є місце лише для ${place}, і якщо поставити ${it} сюди, решта клітинок дасть три однакові цифри поспіль, тож тут ${result}.`;
}

function uniqueSentence(axis: 'row' | 'col', line: number, other: number, value: Digit): string {
  const nominative = axis === 'row' ? 'Рядок' : 'Стовпець';
  const instrumental = axis === 'row' ? 'рядком' : 'стовпцем';
  const plural = axis === 'row' ? 'рядки' : 'стовпці';
  return `${nominative} ${line + 1} збігається з повним ${instrumental} ${other + 1} усюди, крім двох порожніх клітинок, тож тут має бути ${value}, інакше ці ${plural} були б однакові.`;
}

function lookAheadSentence(row: number, col: number, value: Digit): string {
  return `Якщо поставити ${1 - value} у рядку ${row + 1}, стовпці ${col + 1}, за кілька кроків порушиться правило, тож тут ${value}.`;
}

function sentenceOf(f: Fill, n: number): string {
  const axis = f.axis ?? 'row';
  const line = f.line ?? 0;
  const digit = f.digit ?? 0;
  switch (f.rule) {
    case 'pair':
      return pairSentence(axis, line, digit);
    case 'sandwich':
      return sandwichSentence(axis, line, digit);
    case 'count':
      return countSentence(axis, line, digit, n, f.empties ?? 1);
    case 'balance':
      return balanceSentence(axis, line, digit);
    case 'unique':
      return uniqueSentence(axis, line, f.other ?? 0, f.value);
    case 'lookahead':
      return lookAheadSentence(f.row, f.col, f.value);
  }
}

/**
 * Deterministic hint from the board alone (never the solution); the board is not modified.
 * Techniques 1 to `ceiling` are allowed (FR-77); the default is the three basic rules.
 */
export function hint(board: Grid, ceiling = 1): Hint {
  if (findViolations(board).length > 0) return { kind: 'broken', sentence: BROKEN };
  const f = nextFill(board, ceiling);
  if (f === null) return { kind: 'none', sentence: NO_RULE };
  const sentence = sentenceOf(f, board.length);
  if (f.rule === 'lookahead') {
    return { kind: 'fill', row: f.row, col: f.col, value: f.value, rule: 'lookahead', steps: f.steps ?? 0, sentence };
  }
  return { kind: 'fill', row: f.row, col: f.col, value: f.value, rule: f.rule, sentence };
}

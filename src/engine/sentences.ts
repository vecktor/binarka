import type { Hint, HintLanguage, Sentenceless } from './types';

/**
 * The hint sentences in both languages (ADR-0005). Pure: a result in, text out; no DOM, no storage, no random numbers.
 * The Ukrainian wording is unchanged from the first hint engine; the English wording is the delta of add-english-version.
 */

type Digit = 0 | 1;
type Axis = 'row' | 'col';

const NO_RULE = { uk: 'Жодне з правил зараз не підказує наступного ходу.', en: 'None of the rules points to a next move right now.' };
const BROKEN = { uk: 'Спершу виправте порушення правил, підсвічене на полі.', en: 'First fix the rule break highlighted on the board.' };

// ---------------------------------------------------------------------------------------------------------
// Ukrainian
// ---------------------------------------------------------------------------------------------------------

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

const inLine = (axis: Axis): string => (axis === 'row' ? 'рядку' : 'стовпці');
const singular = (d: Digit): string => (d === 0 ? 'нуль' : 'одиниця');

function ukPair(axis: Axis, line: number, d: Digit): string {
  const twice = d === 0 ? 'Два нулі' : 'Дві одиниці';
  return `${twice} поспіль у ${inLine(axis)} ${line + 1}, тож поруч може стояти лише ${singular((1 - d) as Digit)}, бо три однакові цифри поспіль заборонені.`;
}

function ukSandwich(axis: Axis, line: number, d: Digit): string {
  const both = d === 0 ? 'нулями' : 'одиницями';
  return `Між двома ${both} у ${inLine(axis)} ${line + 1} може стояти лише ${singular((1 - d) as Digit)}, бо три однакові цифри поспіль заборонені.`;
}

function ukCount(axis: Axis, line: number, d: Digit, n: number, empties: number): string {
  const words = COUNT_WORDS[n / 2];
  const have = words === undefined ? String(n / 2) : d === 0 ? words.zero : words.one;
  const ending =
    empties === 1
      ? `остання порожня клітинка — ${singular((1 - d) as Digit)}`
      : `решта порожніх клітинок — ${d === 0 ? 'одиниці' : 'нулі'}`;
  return `У ${inLine(axis)} ${line + 1} вже ${have}, а нулів і одиниць має бути порівну, тож ${ending}.`;
}

function ukBalance(axis: Axis, line: number, d: Digit): string {
  const place = d === 0 ? 'одного нуля' : 'однієї одиниці';
  const it = d === 0 ? 'його' : 'її';
  const result = d === 0 ? 'одиниця' : 'нуль';
  return `У ${inLine(axis)} ${line + 1} є місце лише для ${place}, і якщо поставити ${it} сюди, решта клітинок дасть три однакові цифри поспіль, тож тут ${result}.`;
}

function ukUnique(axis: Axis, line: number, other: number, value: Digit): string {
  const nominative = axis === 'row' ? 'Рядок' : 'Стовпець';
  const instrumental = axis === 'row' ? 'рядком' : 'стовпцем';
  const plural = axis === 'row' ? 'рядки' : 'стовпці';
  return `${nominative} ${line + 1} збігається з повним ${instrumental} ${other + 1} усюди, крім двох порожніх клітинок, тож тут має бути ${value}, інакше ці ${plural} були б однакові.`;
}

function ukLookAhead(row: number, col: number, value: Digit): string {
  return `Якщо поставити ${1 - value} у рядку ${row + 1}, стовпці ${col + 1}, за кілька кроків порушиться правило, тож тут ${value}.`;
}

// ---------------------------------------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------------------------------------

/** Number words of the count sentence by k = N/2; the words five to eight are untested like the Ukrainian side. */
const EN_NUMBERS: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };

const enLine = (axis: Axis): string => (axis === 'row' ? 'row' : 'column');
const enLineCap = (axis: Axis): string => (axis === 'row' ? 'Row' : 'Column');
const enOne = (d: Digit): string => (d === 0 ? 'zero' : 'one');
const enMany = (d: Digit): string => (d === 0 ? 'zeros' : 'ones');
const ENDING = 'because three equal digits side by side are not allowed.';

function enPair(axis: Axis, line: number, d: Digit): string {
  return `Two ${enMany(d)} side by side in ${enLine(axis)} ${line + 1}, so only a ${enOne((1 - d) as Digit)} can go next to them, ${ENDING}`;
}

function enSandwich(axis: Axis, line: number, d: Digit): string {
  return `Only a ${enOne((1 - d) as Digit)} can go between the two ${enMany(d)} in ${enLine(axis)} ${line + 1}, ${ENDING}`;
}

function enCount(axis: Axis, line: number, d: Digit, n: number, empties: number): string {
  const have = `${EN_NUMBERS[n / 2] ?? String(n / 2)} ${enMany(d)}`;
  const other = (1 - d) as Digit;
  const ending = empties === 1 ? `the last empty cell is a ${enOne(other)}` : `the remaining empty cells are ${enMany(other)}`;
  return `${enLineCap(axis)} ${line + 1} already has ${have}, and a line needs as many zeros as ones, so ${ending}.`;
}

function enBalance(axis: Axis, line: number, d: Digit): string {
  return `${enLineCap(axis)} ${line + 1} has room for only one more ${d}, and putting it here would leave three equal digits side by side in the other cells, so this must be a ${1 - d}.`;
}

function enUnique(axis: Axis, line: number, other: number, value: Digit): string {
  const word = enLine(axis);
  return `${enLineCap(axis)} ${line + 1} matches the complete ${word} ${other + 1} everywhere except two empty cells, so this must be ${value}, or the two ${word}s would be the same.`;
}

function enLookAhead(row: number, col: number, value: Digit): string {
  return `If you put ${1 - value} in row ${row + 1}, column ${col + 1}, a rule would break within a few steps, so this cell must be ${value}.`;
}

/** The sentence of a hint result in `language`. A pure function of the result; the default is Ukrainian. */
export function hintSentence(h: Sentenceless<Hint>, language: HintLanguage = 'uk'): string {
  const en = language === 'en';
  if (h.kind !== 'fill') return h.kind === 'none' ? NO_RULE[language] : BROKEN[language];
  switch (h.rule) {
    case 'pair':
      return en ? enPair(h.axis, h.line, h.digit) : ukPair(h.axis, h.line, h.digit);
    case 'sandwich':
      return en ? enSandwich(h.axis, h.line, h.digit) : ukSandwich(h.axis, h.line, h.digit);
    case 'count':
      return en ? enCount(h.axis, h.line, h.digit, h.size, h.empties) : ukCount(h.axis, h.line, h.digit, h.size, h.empties);
    case 'balance':
      return en ? enBalance(h.axis, h.line, h.digit) : ukBalance(h.axis, h.line, h.digit);
    case 'unique':
      return en ? enUnique(h.axis, h.line, h.other, h.value) : ukUnique(h.axis, h.line, h.other, h.value);
    case 'lookahead':
      return en ? enLookAhead(h.row, h.col, h.value) : ukLookAhead(h.row, h.col, h.value);
  }
}

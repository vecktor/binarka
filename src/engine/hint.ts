import { findViolations } from './rules';
import type { Grid, Hint } from './types';

type Digit = 0 | 1;
type Rule = 'pair' | 'sandwich' | 'count';

const NO_RULE = 'Жодне з трьох правил зараз не підказує наступного ходу.';
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

/** Deterministic hint from the board alone (never the solution); the board is not modified. */
export function hint(board: Grid): Hint {
  if (findViolations(board).length > 0) return { kind: 'broken', sentence: BROKEN };
  const n = board.length;
  const at = (axis: 'row' | 'col', line: number, i: number): 0 | 1 | null =>
    (axis === 'row' ? board[line]?.[i] : board[i]?.[line]) ?? null;
  const fill = (axis: 'row' | 'col', line: number, i: number, value: Digit, rule: Rule, sentence: string): Hint => ({
    kind: 'fill',
    row: axis === 'row' ? line : i,
    col: axis === 'row' ? i : line,
    value,
    rule,
    sentence,
  });

  for (const rule of ['pair', 'sandwich', 'count'] as const) {
    for (const axis of ['row', 'col'] as const) {
      for (let line = 0; line < n; line++) {
        if (rule === 'count') {
          for (const d of [0, 1] as const) {
            let have = 0;
            let firstEmpty = -1;
            let empties = 0;
            for (let i = 0; i < n; i++) {
              const v = at(axis, line, i);
              if (v === d) have++;
              else if (v === null) {
                empties++;
                if (firstEmpty === -1) firstEmpty = i;
              }
            }
            if (have === n / 2 && firstEmpty !== -1) {
              return fill(axis, line, firstEmpty, (1 - d) as Digit, 'count', countSentence(axis, line, d, n, empties));
            }
          }
          continue;
        }
        for (let i = 0; i < n; i++) {
          if (rule === 'pair') {
            // targets in order of position: the cell before the pair at i - 1 and i (target i - 1),
            // or the cell after (target i + 1)
            const a = at(axis, line, i);
            const b = at(axis, line, i + 1);
            if (a === null || a !== b) continue;
            const d = a;
            if (i - 1 >= 0 && at(axis, line, i - 1) === null) {
              return fill(axis, line, i - 1, (1 - d) as Digit, 'pair', pairSentence(axis, line, d));
            }
            if (i + 2 < n && at(axis, line, i + 2) === null) {
              return fill(axis, line, i + 2, (1 - d) as Digit, 'pair', pairSentence(axis, line, d));
            }
          } else {
            const a = at(axis, line, i);
            if (a !== null && at(axis, line, i + 1) === null && at(axis, line, i + 2) === a) {
              return fill(axis, line, i + 1, (1 - a) as Digit, 'sandwich', sandwichSentence(axis, line, a));
            }
          }
        }
      }
    }
  }
  return { kind: 'none', sentence: NO_RULE };
}

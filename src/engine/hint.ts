import { findViolations } from './rules';
import { nextFill } from './techniques';
import { hintSentence } from './sentences';
import type { Fill } from './techniques';
import type { Grid, Hint, HintLanguage, Sentenceless } from './types';

/** The fill with the data its sentence is built from, minus the sentence (ADR-0005). The fields a kind's sentence needs are set (a field
 * the technique leaves unset gets its default: axis 'row', line 0, digit 0, empties 1, other 0, steps 0); the others stay absent. */
function withData(f: Fill, n: number): Sentenceless<Extract<Hint, { kind: 'fill' }>> {
  const base = { kind: 'fill' as const, row: f.row, col: f.col, value: f.value };
  const axis = f.axis ?? 'row';
  const line = f.line ?? 0;
  const digit = f.digit ?? 0;
  switch (f.rule) {
    case 'pair':
    case 'sandwich':
    case 'balance':
      return { ...base, rule: f.rule, axis, line, digit };
    case 'count':
      return { ...base, rule: 'count', axis, line, digit, empties: f.empties ?? 1, size: n };
    case 'unique':
      return { ...base, rule: 'unique', axis, line, other: f.other ?? 0 };
    case 'lookahead':
      return { ...base, rule: 'lookahead', steps: f.steps ?? 0 };
  }
}

/**
 * Deterministic hint from the board alone (never the solution); the board is not modified.
 * Techniques 1 to `ceiling` are allowed (FR-77); the default is the three basic rules. The sentence is in `language`
 * (default Ukrainian); the result also carries the data to rebuild it in the other language with `hintSentence` (ADR-0005).
 */
export function hint(board: Grid, ceiling = 1, language: HintLanguage = 'uk'): Hint {
  if (findViolations(board).length > 0) return { kind: 'broken', sentence: hintSentence({ kind: 'broken' }, language) };
  const f = nextFill(board, ceiling);
  if (f === null) return { kind: 'none', sentence: hintSentence({ kind: 'none' }, language) };
  const data = withData(f, board.length);
  return { ...data, sentence: hintSentence(data, language) };
}

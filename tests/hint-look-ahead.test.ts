// Look-ahead hint (technique 4). Written from the delta spec of add-difficulty-engine before the implementation exists.
// Scenarios of «Requirement: Look-ahead hint». Coordinates are 1-based in the spec and 0-based in the engine.
// Besides the exact expectations, the file replays each forced chain of the spec through PUBLIC `hint(board, 3)` calls
// and `findViolations` (the test follows the spec's chain: a chain that is wrong in the spec fails here), and it checks
// the hint against a reference model of FR-76 written with the public API only.
// Each board is first shown to have no fill from techniques 1 to 3 (`hint(board, 3).kind` is `none`), so that only
// look-ahead can be the answer. Those precondition assertions are green by design at red (nothing at ceiling 3 exists
// today either); everything else fails at red because technique 4 does not exist.
import { describe, expect, it } from 'vitest';
import { countSolutions, findViolations } from '../src/engine/index';
import type { Grid } from '../src/engine/index';
import { hint } from './helpers/engine-shim';
import type { Chain } from './helpers/technique-boards';
import {
  BOARD_A,
  BOARD_B,
  LA_EQUAL,
  LA_EQUAL_CHAIN,
  LA_FIVE,
  LA_FIVE_CHAIN,
  LA_FOUR,
  LA_FOUR_CHAIN,
  LA_TWO,
  LA_TWO_CHAIN,
  NO_RULE_SENTENCE,
  lookAheadSentence,
  withPlacement,
} from './helpers/technique-boards';

const copyOf = (board: Grid): Grid => board.map((row) => [...row]);

/**
 * Replays a chain: the refuted value is placed, then each step is asked of the public hint with ceiling 3, must equal the
 * spec's cell, value and rule, and is written. Returns a description of the first problem, or null when the chain is
 * exactly as the spec says: no violation after the placement or after any step but the last, a violation after the last.
 */
function replay(board: Grid, chain: Chain): string | null {
  const work = withPlacement(board, chain.place);
  if (findViolations(work).length > 0) return 'the placement already violates (0 steps), the spec says otherwise';
  for (const [i, step] of chain.steps.entries()) {
    const h = hint(work, 3);
    if (h.kind !== 'fill') return `step ${i + 1}: hint(board, 3) is "${h.kind}", the spec expects the fill ${step.row},${step.col}`;
    const got = `${(h.row ?? -1) + 1},${(h.col ?? -1) + 1}=${h.value} ${h.rule}`;
    const want = `${step.row},${step.col}=${step.value} ${step.rule}`;
    if (got !== want) return `step ${i + 1}: hint(board, 3) is ${got}, the spec expects ${want}`;
    const line = work[step.row - 1];
    if (line === undefined) throw new Error(`no row ${step.row}`);
    line[step.col - 1] = step.value;
    const violated = findViolations(work).length > 0;
    const last = i === chain.steps.length - 1;
    if (violated && !last) return `step ${i + 1}: a violation appears before the last step`;
    if (!violated && last) return `step ${i + 1}: no violation after the last step`;
  }
  return null;
}

/**
 * Reference model of technique 4 (FR-76) written with the public API: for each empty cell and each value v in
 * row-major order, v = 0 first, place v on a copy, apply `hint(copy, 3)` fills up to 4 times, and count the steps until
 * `findViolations` reports a violation. Fewest steps wins, ties go to the first found. Returns the refuted placement.
 */
function modelLookAhead(board: Grid): { row: number; col: number; refuted: 0 | 1; steps: number } | null {
  let best: { row: number; col: number; refuted: 0 | 1; steps: number } | null = null;
  board.forEach((line, row) => {
    line.forEach((cell, col) => {
      if (cell !== null) return;
      for (const v of [0, 1] as const) {
        const work = copyOf(board);
        const target = work[row];
        if (target === undefined) throw new Error('no row');
        target[col] = v;
        let steps = 0;
        let contradiction = false;
        for (;;) {
          if (findViolations(work).length > 0) {
            contradiction = true;
            break;
          }
          if (steps === 4) break;
          const h = hint(work, 3);
          if (h.kind !== 'fill') break;
          const hl = work[h.row ?? -1];
          if (hl === undefined) break;
          hl[h.col ?? -1] = h.value as 0 | 1;
          steps++;
        }
        if (contradiction && (best === null || steps < best.steps)) best = { row, col, refuted: v, steps };
      }
    });
  });
  return best;
}

interface Case {
  name: string;
  board: Grid;
  chain: Chain;
  row: number;
  col: number;
  refuted: 0 | 1;
  steps: number;
}

const POSITIVE: Case[] = [
  { name: 'Look-ahead of two steps beats an earlier cell of four', board: LA_TWO, chain: LA_TWO_CHAIN, row: 6, col: 5, refuted: 1, steps: 2 },
  { name: 'A contradiction at exactly 4 steps is found', board: LA_FOUR, chain: LA_FOUR_CHAIN, row: 6, col: 1, refuted: 1, steps: 4 },
  { name: 'Equal steps, the lower row first', board: LA_EQUAL, chain: LA_EQUAL_CHAIN, row: 5, col: 3, refuted: 0, steps: 3 },
];

describe('@trace FR-76 @trace FR-80 look-ahead hint', () => {
  it.each(POSITIVE)('$name: exact cell, value, rule, steps and sentence at ceiling 4', ({ board, row, col, refuted, steps }) => {
    const value = (1 - refuted) as 0 | 1;
    expect(hint(board, 4)).toEqual({
      kind: 'fill',
      row: row - 1,
      col: col - 1,
      value,
      rule: 'lookahead',
      steps,
      sentence: lookAheadSentence(refuted, row, col, value),
    });
  });

  it.each(POSITIVE)('$name: precondition, techniques 1 to 3 find nothing (hint at ceiling 3 is none)', ({ board }) => {
    expect(hint(board, 3).kind).toBe('none');
  });

  it.each(POSITIVE)('$name: ceiling 3 gives no target and the no-rule sentence (look-ahead is off below ceiling 4)', ({ board }) => {
    expect(hint(board, 3)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it.each(POSITIVE)('$name: the spec chain is reproduced step by step by public hint calls and findViolations', ({ board, chain, steps }) => {
    expect(chain.steps.length, 'the chain length equals the steps of the spec').toBe(steps);
    expect(replay(board, chain)).toBeNull();
  });

  it('Look-ahead of two steps: the earlier cell row 5 column 5 is not chosen (putting 0 there needs 4 steps)', () => {
    const chosen = hint(LA_TWO, 4);
    expect(chosen).toMatchObject({ kind: 'fill', row: 5, col: 4, steps: 2 });
    // the earlier cell in row-major order, row 5 column 5, with the refuted value 0 per the spec, needs 4 steps
    const work = withPlacement(LA_TWO, { row: 5, col: 5, value: 0 });
    let steps = 0;
    for (; steps <= 4; steps++) {
      if (findViolations(work).length > 0) break;
      const h = hint(work, 3);
      if (h.kind !== 'fill') break;
      const line = work[h.row ?? -1];
      if (line === undefined) break;
      line[h.col ?? -1] = h.value as 0 | 1;
    }
    expect(steps, 'steps of the contradiction for 0 at row 5 column 5').toBe(4);
  });

  it('Equal steps: putting 1 at row 6 column 3 also ends in a violation after 3 steps (the tie the spec describes)', () => {
    const work = withPlacement(LA_EQUAL, { row: 6, col: 3, value: 1 });
    let steps = 0;
    let violated = false;
    for (; steps <= 4; steps++) {
      if (findViolations(work).length > 0) {
        violated = true;
        break;
      }
      const h = hint(work, 3);
      if (h.kind !== 'fill') break;
      const line = work[h.row ?? -1];
      if (line === undefined) break;
      line[h.col ?? -1] = h.value as 0 | 1;
    }
    expect({ violated, steps }).toEqual({ violated: true, steps: 3 });
  });

  it('A contradiction that needs 5 forced steps is not a deduction: ceiling 4 gives no target and the no-rule sentence', () => {
    expect(hint(LA_FIVE, 3).kind, 'precondition: techniques 1 to 3 find nothing').toBe('none');
    expect(hint(LA_FIVE, 4)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('A contradiction that needs 5 forced steps: the chain has five steps and the violation appears only after the fifth', () => {
    expect(LA_FIVE_CHAIN.steps).toHaveLength(5);
    expect(replay(LA_FIVE, LA_FIVE_CHAIN)).toBeNull();
  });

  it('A contradiction that needs 5 forced steps: the solver reports 0 with 1 at row 1 column 4 and 2 for the board itself', () => {
    expect(countSolutions(withPlacement(LA_FIVE, { row: 1, col: 4, value: 1 }))).toBe(0);
    expect(countSolutions(LA_FIVE)).toBe(2);
  });

  it('Propagation that stalls without a violation is not a contradiction (6x6 with one given, 8x8 empty)', () => {
    const six: Grid = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => null));
    const sixRow = six[0];
    if (sixRow === undefined) throw new Error('no row');
    sixRow[0] = 0;
    const eight: Grid = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
    expect(hint(six, 4)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
    expect(hint(eight, 4)).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
  });

  it('the hint equals the reference model of FR-76 on the look-ahead boards (fewest steps, lower row, lower column, v = 0 first)', () => {
    for (const { name, board, row, col, refuted, steps } of POSITIVE) {
      const model = modelLookAhead(board);
      expect(model, name).toEqual({ row: row - 1, col: col - 1, refuted, steps });
    }
    expect(modelLookAhead(LA_FIVE), 'the 5-step board has no 4-step contradiction').toBeNull();
  });

  it('the worst-case 8x8 boards A and B: ceiling 3 and ceiling 4 return no target (every cell tried with both values)', () => {
    for (const board of [BOARD_A, BOARD_B]) {
      for (const ceiling of [3, 4]) {
        expect(hint(board, ceiling), `ceiling ${ceiling}`).toEqual({ kind: 'none', sentence: NO_RULE_SENTENCE });
      }
    }
  });
});

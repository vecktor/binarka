// The English hint-clarity eval: its three cases and its exit-coded per-case gate (add-english-version, task 2.5, TD-Q9).
// Scenarios of «Hint explanations are clear and correct for a player» of openspec/changes/add-english-version/specs/puzzle-engine/spec.md:
// «The English cases are graded» (the cases exist in `evals/cases/`, dimension `hint-clarity-en`, one each for pair, sandwich and count) and its
// last AND-clause: a vitest test reads `evals/results` for the dimension and fails on any case with `pass: false` or a score below 80, because
// `scripts/check-eval-ratchet.mjs` compares AVERAGES per dimension and would pass a new dimension as an improvement.
//
// THE GATE TEST FAILS BY DESIGN until the eval-suite workflow has graded the three cases (tasks.md 4.5): with no result for the dimension it
// reports NOT-EARNED and fails (AGENTS.md, "a PASS over zero evidence is NOT-EARNED"); it is never a skip and never a pass over nothing. No
// baseline is minted here and no judge is run.
//
// @trace NFR-6
// @trace FR-112
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cases } from '../evals/cases/hint-clarity-en.eval';
import { FILL_CASES } from './helpers/hint-cases';

const DIMENSION = 'hint-clarity-en';
const BAR = 80;
const RESULTS_DIR = `${process.cwd()}/evals/results`;

describe('The English cases are graded (the cases)', () => {
  it('three cases exist in the dimension hint-clarity-en: pair, sandwich and count', () => {
    expect(cases, 'three cases').toHaveLength(3);
    expect(new Set(cases.map((c) => c.id)).size, 'distinct ids').toBe(3);
    for (const c of cases) {
      expect(c.dimension, `${c.id}: the dimension`).toBe(DIMENSION);
      expect(c.capability).toBe('puzzle-engine');
      expect(c.trace, `${c.id}: traced to NFR-6`).toContain('NFR-6');
      expect(c.rubric.length, `${c.id}: a rubric`).toBeGreaterThanOrEqual(4);
      expect(c.rubric.filter((item) => item.startsWith('CRITICAL')).length, `${c.id}: three critical items`).toBe(3);
    }
    expect(cases.map((c) => c.trace.find((t) => /^FR-(19|20|21)$/.test(t)))).toEqual(['FR-19', 'FR-20', 'FR-21']);
  });

  it('produce() shows the English sentence of the engine and no Cyrillic letter at all (the rubric is adapted to English)', async () => {
    const expected = [
      FILL_CASES.find((c) => c.name === 'Pair of zeros in a row')?.en,
      undefined, // the sandwich board of the eval (column 2, rows 1 and 3) is not a named scenario board: checked by its pattern below
      FILL_CASES.find((c) => c.name === 'Three zeros in a 6-wide row, one empty cell')?.en,
    ];
    for (const [i, c] of cases.entries()) {
      const text = await c.produce();
      expect(/\p{Script=Cyrillic}/u.test(text), `${c.id}: no Cyrillic letter in what the judge sees`).toBe(false);
      expect(text, `${c.id}: the explanation line`).toMatch(/Explanation the player sees: [A-Z][^.!?]*\.$/);
      expect(text, `${c.id}: the action line`).toMatch(/The cell in row \d, column \d was filled with the digit [01]\./);
      const sentence = expected[i];
      if (sentence !== undefined) expect(text.endsWith(sentence), `${c.id}: ends with the engine's English sentence`).toBe(true);
    }
    expect((await cases[1]?.produce()) ?? '', 'the sandwich case: the English gap sentence for column 2').toMatch(
      /Only a one can go between the two zeros in column 2, because three equal digits side by side are not allowed\.$/,
    );
  });
});

describe('The English cases are graded (the gate)', () => {
  interface Scored {
    id: string;
    dimension: string;
    score: number;
    pass: boolean;
    file: string;
  }

  /** Every case of the dimension in `evals/results/*.json`: `latest.json` has `cases[]`, `manifest.json` has `results[]`. */
  function scored(): Scored[] {
    if (!existsSync(RESULTS_DIR)) return [];
    const out: Scored[] = [];
    for (const file of readdirSync(RESULTS_DIR).filter((name) => name.endsWith('.json'))) {
      const data: unknown = JSON.parse(readFileSync(`${RESULTS_DIR}/${file}`, 'utf8'));
      if (typeof data !== 'object' || data === null) continue;
      const lists = [(data as { cases?: unknown }).cases, (data as { results?: unknown }).results];
      for (const list of lists) {
        if (!Array.isArray(list)) continue;
        for (const entry of list as Record<string, unknown>[]) {
          if (entry.dimension !== DIMENSION) continue;
          out.push({
            id: typeof entry.id === 'string' ? entry.id : '?',
            dimension: DIMENSION,
            score: typeof entry.score === 'number' ? entry.score : Number.NaN,
            pass: entry.pass === true,
            file,
          });
        }
      }
    }
    return out;
  }

  it('NOT-EARNED unless every case of hint-clarity-en has a result that passed with a score of at least 80', () => {
    const results = scored();
    expect(results.length, `NOT-EARNED: no result for the dimension ${DIMENSION} under evals/results (run the eval-suite workflow, tasks.md 4.5)`).toBeGreaterThan(0);
    const latest = results.filter((r) => r.file === 'latest.json');
    expect(latest.map((r) => r.id).sort(), 'latest.json holds a result for each of the three cases').toEqual(cases.map((c) => c.id).sort());
    for (const r of results) {
      expect(r.pass, `${r.id} (${r.file}) has pass: false`).toBe(true);
      expect(r.score, `${r.id} (${r.file}) scored ${r.score}, the bar is ${BAR}`).toBeGreaterThanOrEqual(BAR);
    }
  });
});

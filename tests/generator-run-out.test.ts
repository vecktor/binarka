// At most 100 attempts and the distinct run-out error (FR-84), and the public engine interface (FR-81, FR-84, FR-77).
// Written from the delta spec of add-difficulty-engine before the implementation exists. The new API
// (`buildPuzzle`, `MAX_ATTEMPTS`, `GenerationRunOutError`, `InvalidLevelError`) is imported directly.
// This file's reds are therefore mostly that deliberate message (task 1.12), except the assertions on the index module's
// properties, which fail by assertion.
// Green by design at red (guards of unchanged behaviour, not red evidence): no run-out over the 180 combinations (the
// engine ignores the level, so nothing runs out), and «buildPuzzle, MAX_ATTEMPTS and solveByRules are not properties of
// src/engine/index.ts» (trivially true today and a guard for the implementer).
// The premise of the retry tests is searched, never assumed: `findRetryCase` fails loudly, naming the premise.
import { describe, expect, it } from 'vitest';
import { InvalidArgumentTypeError, InvalidSeedError, InvalidSizeError } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';
import { isOneSentence } from './helpers/board';
import * as indexModuleNs from '../src/engine/index';
import { GenerationRunOutError, InvalidLevelError, generate } from '../src/engine/index';
import { hint as engineHint } from '../src/engine/hint';
import { MAX_ATTEMPTS, buildPuzzle } from '../src/engine/generator';
import { solveByRules } from '../src/engine/rule-solve';

const indexModule: Record<string, unknown> = { ...indexModuleNs };
import { COMBOS, LONG, SEEDS, findRetryCase } from './helpers/levels';
import { LB_ROW } from './helpers/technique-boards';

function thrown(f: () => unknown): unknown {
  try {
    f();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('@trace FR-84 generation makes at most 100 attempts', () => {
  it('the attempt bound MAX_ATTEMPTS of the generator module equals 100', () => {
    expect(MAX_ATTEMPTS).toBe(100);
  });

  it('no run-out over the 180 combinations of the fixed seed set (any error from generate is a failure)', () => {
    const bad: string[] = [];
    for (const { n, level } of COMBOS) {
      for (const seed of SEEDS) {
        try {
          generate(n, seed, level);
        } catch (e) {
          bad.push(`N ${n} level ${level} seed ${seed}: ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  }, LONG);

  it('the builder with a limit of 1 attempt raises a GenerationRunOutError for a combination that needs more than one attempt', () => {
    const { n, level, seed } = findRetryCase();
    let result: Puzzle | undefined;
    const e = thrown(() => {
      result = buildPuzzle(n, seed, level, 1);
    });
    expect(e !== undefined, `buildPuzzle(${n}, ${seed}, ${level}, 1) must throw`).toBe(true);
    expect(result).toBeUndefined();
    expect(e).toBeInstanceOf(GenerationRunOutError);
  }, LONG);

  it('the run-out error is none of InvalidLevelError, InvalidSizeError and InvalidSeedError', () => {
    const { n, level, seed } = findRetryCase();
    const e = thrown(() => buildPuzzle(n, seed, level, 1));
    expect(e).toBeInstanceOf(GenerationRunOutError);
    expect(e).not.toBeInstanceOf(InvalidLevelError);
    expect(e).not.toBeInstanceOf(InvalidSizeError);
    expect(e).not.toBeInstanceOf(InvalidSeedError);
    expect(e).not.toBeInstanceOf(InvalidArgumentTypeError);
  }, LONG);

  it('the same combination with the limit of 100 returns a puzzle that is exactly its level (solvable with L, not with L - 1)', () => {
    const { n, level, seed } = findRetryCase();
    const p = buildPuzzle(n, seed, level, 100);
    expect(solveByRules(p.givens, level).solved, `N ${n} level ${level} seed ${seed}: solvable with ceiling ${level}`).toBe(true);
    expect(solveByRules(p.givens, level - 1).solved, `N ${n} level ${level} seed ${seed}: not solvable with ceiling ${level - 1}`).toBe(false);
    expect(p).toEqual(generate(n, seed, level));
  }, LONG);

  it('the run-out error message is one English sentence without Cyrillic letters', () => {
    const { n, level, seed } = findRetryCase();
    const e = thrown(() => buildPuzzle(n, seed, level, 1));
    expect(e).toBeInstanceOf(GenerationRunOutError);
    const message = (e as Error).message;
    expect(message).not.toMatch(/\p{Script=Cyrillic}/u);
    expect(message).toMatch(/[A-Za-z]/);
    expect(isOneSentence(message), JSON.stringify(message)).toBe(true);
  }, LONG);
});

describe('@trace FR-81 @trace FR-84 @trace FR-77 the public engine interface exports the level API', () => {
  it.each(['generate', 'hint', 'InvalidLevelError', 'GenerationRunOutError'])('%s is exported from src/engine/index.ts', (name) => {
    expect(typeof indexModule[name], `src/engine/index.ts export ${name}`).toBe('function');
  });

  it.each(['buildPuzzle', 'MAX_ATTEMPTS', 'solveByRules'])('%s is NOT a property of src/engine/index.ts (internal test seam)', (name) => {
    expect(name in indexModule).toBe(false);
    expect(indexModule[name]).toBeUndefined();
  });

  it('generate of the index accepts a third argument (a level) and hint a second one (a ceiling)', () => {
    const indexGenerate = indexModule.generate as (size: number, seed: number, level?: unknown) => unknown;
    const indexHint = indexModule.hint as (board: unknown, ceiling?: number) => { kind: string; rule?: string };
    expect(thrown(() => indexGenerate(4, 1, 2)), 'generate(4, 1, 2) of the index must throw').toBeInstanceOf(Error);
    expect(indexHint(LB_ROW, 2)).toMatchObject({ kind: 'fill', rule: 'balance' });
  });

  it('a forced run-out is recognised by the class exported from the index, and by none of the other four', () => {
    const { n, level, seed } = findRetryCase();
    const e = thrown(() => buildPuzzle(n, seed, level, 1));
    const RunOut = indexModule.GenerationRunOutError as new () => Error;
    expect(e).toBeInstanceOf(RunOut);
    expect(e).not.toBeInstanceOf(indexModule.InvalidLevelError as new () => Error);
    expect(e).not.toBeInstanceOf(InvalidSizeError);
    expect(e).not.toBeInstanceOf(InvalidSeedError);
    expect(e).not.toBeInstanceOf(InvalidArgumentTypeError);
  }, LONG);

  it.each([
    ['generate(4, 1, 2)', 4, 1, 2],
    ['generate(6, 1, 5)', 6, 1, 5],
  ] as const)('%s throws the InvalidLevelError of the index, not the run-out error', (_name, size, seed, level) => {
    const e = thrown(() => generate(size, seed, level));
    expect(e !== undefined, `${_name} must throw`).toBe(true);
    expect(e).toBeInstanceOf(indexModule.InvalidLevelError as new () => Error);
    expect(e).not.toBeInstanceOf(indexModule.GenerationRunOutError as new () => Error);
  });

  it('hint of the index is the hint of the engine (the same function)', () => {
    expect(indexModule.hint).toBe(engineHint);
  });
});

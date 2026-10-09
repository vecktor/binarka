// Red-phase shim of add-difficulty-engine (task 1.11). Deleted by task 2.8a.
// The pre-commit hook type-checks tests/ with `strict`, so the new tests reach the new API (ceiling argument, level
// argument, `steps`, the new error classes, `buildPuzzle`, `MAX_ATTEMPTS`, the local violation seam) only through this
// file. Wide function types hide the missing signatures; the exports that do not exist yet are read through a
// runtime-built module specifier (the precedent of tests/generator-rule-solvable.test.ts at its red commit).
//
// LAZINESS IS THE POINT: nothing here throws while the module is evaluated (that would be an import error in every
// importing file, including the green-by-design assertions). A missing export THROWS «not implemented: <name>» on FIRST
// USE (a wrapper function that is called, or a getter that is read), and never yields `undefined`, so an `instanceof`
// check on a missing class cannot pass or crash obscurely. Once the implementation exists the same code returns the
// real function or class: the shim needs no edit between red and green.
import { generate as realGenerate, hint as realHint } from '../../src/engine/index';
import type { Grid, Puzzle } from '../../src/engine/index';
import { solveByRules as realSolveByRules } from '../../src/engine/rule-solve';

/** The hint of the new API: the `rule` is wider than today's three names and a look-ahead fill carries `steps`. */
export interface HintAny {
  kind: 'fill' | 'none' | 'broken';
  sentence: string;
  row?: number;
  col?: number;
  value?: number;
  rule?: string;
  steps?: number;
}

export type ErrorClass = new (...args: never[]) => Error;

// Widened through `unknown` (the identity at run time): the real signatures are narrower today and different later.
const anyHint: unknown = realHint;
const anyGenerate: unknown = realGenerate;
const anySolveByRules: unknown = realSolveByRules;

export const hint = anyHint as (board: Grid, ceiling?: number) => HintAny;
export const generate = anyGenerate as (size: number, seed: number, level?: unknown) => Puzzle;
export const solveByRules = anySolveByRules as (board: Grid, ceiling?: number) => { solved: boolean; steps: number };

const SRC = ['..', '..', 'src', 'engine'].join('/');

/** Loads a module of src/engine by a specifier built at run time; a missing module is an empty record, not an error. */
async function load(name: string): Promise<Record<string, unknown>> {
  try {
    const specifier = `${SRC}/${name}`;
    return (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** src/engine/index.ts as a bag of properties: for the checks "is defined" and "is not exported". */
export const indexModule: Record<string, unknown> = await load('index');
const generatorModule = await load('generator');
const techniquesModule = await load('techniques');

function missing(name: string): never {
  throw new Error(`not implemented: ${name}`);
}

function fn(mod: Record<string, unknown>, name: string): (...args: never[]) => unknown {
  const value = mod[name];
  return typeof value === 'function' ? (value as (...args: never[]) => unknown) : () => missing(name);
}

function cls(mod: Record<string, unknown>, name: string): ErrorClass {
  const value = mod[name];
  if (typeof value !== 'function') return missing(name);
  return value as ErrorClass;
}

/** The two new error classes, read from the PUBLIC index (FR-81, FR-84). Reading a missing one throws. */
export const errors = {
  get InvalidLevelError(): ErrorClass {
    return cls(indexModule, 'InvalidLevelError');
  },
  get GenerationRunOutError(): ErrorClass {
    return cls(indexModule, 'GenerationRunOutError');
  },
};

/** The internal builder of src/engine/generator.ts: `buildPuzzle(size, seed, level, maxAttempts)`. */
export const buildPuzzle = (size: number, seed: number, level: number, maxAttempts: number): Puzzle =>
  fn(generatorModule, 'buildPuzzle')(size as never, seed as never, level as never, maxAttempts as never) as Puzzle;

/** `MAX_ATTEMPTS` of src/engine/generator.ts (not of index.ts). Throws when missing. */
export function maxAttempts(): number {
  const value = generatorModule.MAX_ATTEMPTS;
  if (typeof value !== 'number') return missing('MAX_ATTEMPTS');
  return value;
}

/**
 * The local violation check seam (design decision 8c, task 2.2). CHOSEN CONTRACT, relayed to the implementer:
 * `hasLocalViolation(board: Grid, row: number, col: number): boolean` exported from `src/engine/techniques.ts`
 * (0-based row and col); on a board that had no violation before the cell (row, col) was changed it returns true
 * exactly when `findViolations(board).length > 0` (the row and the column through the cell: three in a row, a digit
 * count above N/2, a duplicate of another complete line of the same axis).
 */
export const hasLocalViolation = (board: Grid, row: number, col: number): boolean =>
  fn(techniquesModule, 'hasLocalViolation')(board as never, row as never, col as never) as boolean;

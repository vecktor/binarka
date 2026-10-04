// Generator: shape, determinism, size and seed validation. Scenarios from openspec/specs/puzzle-engine/spec.md.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import type { Puzzle } from '../src/engine/index';

/** Calls generate and reports whether it threw an Error and what it returned (nothing, when it threw). */
function attempt(size: number, seed: number): { threw: boolean; isError: boolean; result: Puzzle | undefined } {
  let result: Puzzle | undefined;
  try {
    result = generate(size, seed);
  } catch (e) {
    return { threw: true, isError: e instanceof Error, result: undefined };
  }
  return { threw: false, isError: false, result };
}

function expectRejected(size: number, seed: number): void {
  const a = attempt(size, seed);
  expect(a.threw, `generate(${size}, ${seed}) must throw`).toBe(true);
  expect(a.isError, 'the thrown value must be an Error').toBe(true);
  expect(a.result).toBeUndefined();
}

function expectShape(p: Puzzle, n: number): void {
  expect(p.size).toBe(n);
  expect(p.givens).toHaveLength(n);
  expect(p.solution).toHaveLength(n);
  for (const row of p.givens) {
    expect(row).toHaveLength(n);
    for (const cell of row) expect([0, 1, null]).toContain(cell);
  }
  for (const row of p.solution) {
    expect(row).toHaveLength(n);
    for (const cell of row) expect([0, 1]).toContain(cell);
  }
}

const SEEDS = [1, 42, 2147483647];

describe('@trace FR-13 generator returns a puzzle of the requested size', () => {
  it('size 6 seed 42 gives 6 rows of 6 cells, each 0, 1 or empty', () => {
    expectShape(generate(6, 42), 6);
  });

  it.each([4, 8])('size %i seed 1 gives an NxN puzzle of 0, 1 or empty cells', (n) => {
    expectShape(generate(n, 1), n);
  });
});

describe('@trace FR-14 same seed and size give the identical puzzle', () => {
  it('size 6 seed 42 generated twice is cell-for-cell identical', () => {
    expect(generate(6, 42)).toEqual(generate(6, 42));
  });

  it('is not disturbed by generating other sizes and seeds in between', () => {
    const first = generate(8, 7);
    generate(4, 1);
    generate(6, 99);
    generate(8, 8);
    expect(generate(8, 7)).toEqual(first);
  });

  it('size 8 seed 7 generated in a separate process is identical (seed is the only source of variation)', () => {
    const code =
      'import("./src/engine/index.ts").then((m) => { process.stdout.write(JSON.stringify(m.generate(8, 7))); });';
    const run = spawnSync('npx', ['tsx', '-e', code], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual(generate(8, 7));
  }, 30_000);
});

describe('@trace FR-16 odd size is rejected', () => {
  it.each([5, 7])('size %i raises an error and returns no puzzle', (size) => {
    for (const seed of SEEDS) expectRejected(size, seed);
  });
});

describe('@trace FR-17 size below the minimum is rejected', () => {
  it('even size 2 raises an error and returns no puzzle', () => {
    for (const seed of SEEDS) expectRejected(2, seed);
  });

  it.each([0, 3, -2])('size %i raises an error and returns no puzzle', (size) => {
    for (const seed of SEEDS) expectRejected(size, seed);
  });

  it('minimum size 4 is accepted and gives a 4x4 puzzle', () => {
    for (const seed of SEEDS) expectShape(generate(4, seed), 4);
  });
});

describe('@trace FR-49 size above the maximum is rejected', () => {
  it.each([18, 1000])('size %i raises an error and returns no puzzle', (size) => {
    for (const seed of SEEDS) expectRejected(size, seed);
  });

  it('largest tested size 8 is still accepted and gives an 8x8 puzzle', () => {
    expectShape(generate(8, 1), 8);
  });
});

describe('@trace FR-50 a size that is not an integer is rejected', () => {
  it.each([4.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'size %s raises an error and returns no puzzle',
    (size) => {
      for (const seed of SEEDS) expectRejected(size, seed);
    },
  );

  it('whole-number size 6 is accepted and gives a 6x6 puzzle', () => {
    for (const seed of SEEDS) expectShape(generate(6, seed), 6);
  });
});

describe('@trace FR-51 a seed outside the seed domain is rejected', () => {
  it.each([0, 2147483647])('seed %i with size 4 returns a 4x4 puzzle', (seed) => {
    expectShape(generate(4, seed), 4);
  });

  it('seed -1 raises an error and returns no puzzle', () => {
    expectRejected(4, -1);
  });

  it('seed 2147483648 raises an error and returns no puzzle', () => {
    expectRejected(4, 2147483648);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'seed %s raises an error and returns no puzzle',
    (seed) => {
      expectRejected(4, seed);
    },
  );
});

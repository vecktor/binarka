// @trace FR-14
// @trace FR-85
// Level 1 is byte-identical to the unchanged generator (add-difficulty-engine). The golden file
// tests/fixtures/level1-golden.json was taken from the UNCHANGED engine at the commit it records
// (docs/qa/add-difficulty-engine/golden-provenance.txt), before any change of src/.
//
// THIS IS A SAMPLED CHECK OF THE SEED SPACE, NOT ALL SEEDS: 60 entries (N = 4, 6, 8 x seeds 1 to 20) compared byte for
// byte plus 540 SHA-256 hashes of the CLI text (seeds 21 to 200). Level-1 identity for other seeds rests on the
// construction (the fill draws and the first shuffle are unchanged), not on this test.
//
// GREEN AT RED BY DESIGN AND GREEN AFTER THE CHANGE: this file is the byte-identity guard of unchanged behaviour, not
// red evidence. It must be green before the implementation, and stay green at every commit. The `--level 1` subprocess
// runs are NOT in this file (they are red at red because `--level` is unknown); they live in tests/cli-level.test.ts.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Grid } from '../src/engine/index';
import { generate } from './helpers/engine-shim';

interface Entry {
  size: number;
  seed: number;
  cli: string;
  solution: string[];
}
interface Hashed {
  size: number;
  seed: number;
  sha256: string;
}
interface Golden {
  commit: string;
  entries: Entry[];
  extraHashes: Hashed[];
}

const golden = JSON.parse(readFileSync(`${process.cwd()}/tests/fixtures/level1-golden.json`, 'utf8')) as Golden;

/** The text the CLI prints for the givens: one line per row, tokens `0`, `1` or `.` separated by single spaces. */
const textOf = (givens: Grid): string => givens.map((row) => row.map((c) => (c === null ? '.' : String(c))).join(' ')).join('\n') + '\n';
const solutionOf = (solution: readonly (readonly number[])[]): string[] => solution.map((row) => row.join(''));

describe('@trace FR-14 @trace FR-85 the golden file is what the task says it is', () => {
  it('holds 60 entries (N = 4, 6, 8 x seeds 1 to 20) and 540 extra hashes (seeds 21 to 200)', () => {
    expect(golden.entries).toHaveLength(60);
    expect(golden.extraHashes).toHaveLength(540);
    expect(golden.commit).toMatch(/^[0-9a-f]{40}$/);
    for (const size of [4, 6, 8]) {
      expect(golden.entries.filter((e) => e.size === size).map((e) => e.seed)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    }
  });
});

describe('@trace FR-14 @trace FR-85 level 1 equals the golden file (sampled: 60 seeds, engine calls)', () => {
  it.each(golden.entries.map((e) => [e.size, e.seed, e] as const))('N = %i seed %i: generate(N, S) and generate(N, S, 1) give the golden CLI text and solution', (size, seed, entry) => {
    for (const [name, p] of [['generate(N, S)', generate(size, seed)], ['generate(N, S, 1)', generate(size, seed, 1)]] as const) {
      expect(textOf(p.givens), `${name} N ${size} seed ${seed}: CLI text`).toBe(entry.cli);
      expect(solutionOf(p.solution), `${name} N ${size} seed ${seed}: solution`).toEqual(entry.solution);
    }
  });

  it('seeds 21 to 200: the SHA-256 of the CLI text of generate(N, S) and of generate(N, S, 1) equals the stored hash (540 hashes, sampled)', () => {
    const bad: string[] = [];
    for (const { size, seed, sha256 } of golden.extraHashes) {
      for (const [name, p] of [['generate(N, S)', generate(size, seed)], ['generate(N, S, 1)', generate(size, seed, 1)]] as const) {
        const hash = createHash('sha256').update(textOf(p.givens)).digest('hex');
        if (hash !== sha256) bad.push(`${name} N ${size} seed ${seed}`);
      }
    }
    expect(bad).toEqual([]);
  }, 120_000);
});

describe('@trace FR-85 @trace FR-14 the CLI without --level prints the golden text byte for byte (sampled: 60 pairs, real process)', () => {
  it.each(golden.entries.map((e) => [e.size, e.seed, e.cli] as const))('npm run --silent cli -- --size %i --seed %i', (size, seed, text) => {
    const r = spawnSync('npm', ['run', '--silent', 'cli', '--', '--size', String(size), '--seed', String(seed)], {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(r.status, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stderr).toBe('');
    expect(r.stdout).toBe(text);
  }, 60_000);
});

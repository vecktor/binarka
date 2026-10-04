// CLI: `npm run --silent cli -- <args>` run as a real child process (FR-28..30, FR-52..54, NFR-4 CLI part, NFR-8).
// Error wording is NEVER asserted (A-22): only the language and the one-sentence shape.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generate } from '../src/engine/index';
import type { Grid } from '../src/engine/index';
import { hasCyrillic, hasLatin, isOneSentence } from './helpers/board';

const TIMEOUT = 30_000;

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

const cache = new Map<string, Run>();

function npmRun(npmArgs: string[], fresh = false): Run {
  const key = JSON.stringify(npmArgs);
  const hit = cache.get(key);
  if (hit && !fresh) return hit;
  const r = spawnSync('npm', npmArgs, { cwd: process.cwd(), encoding: 'utf8', timeout: TIMEOUT });
  const run: Run = { status: r.status, stdout: r.stdout, stderr: r.stderr };
  cache.set(key, run);
  return run;
}

/** `npm run --silent cli -- <args>`; `fresh` forces a new process even if the same command ran before. */
function cli(args: string[], fresh = false): Run {
  return npmRun(['run', '--silent', 'cli', '--', ...args], fresh);
}

/** `npm run --silent cli` (no arguments at all, not even the `--` separator). */
function cliNoArgs(): Run {
  return npmRun(['run', '--silent', 'cli']);
}

/** Asserts stdout is exactly n newline-terminated lines of n single-space-separated tokens 0, 1 or '.'. */
function expectPuzzleStdout(run: Run, n: number): string[][] {
  expect(run.stdout.endsWith('\n'), 'stdout must end with a newline').toBe(true);
  const lines = run.stdout.slice(0, -1).split('\n');
  expect(lines).toHaveLength(n);
  const grid: string[][] = [];
  for (const line of lines) {
    expect(line).toMatch(new RegExp(`^[01.]( [01.]){${n - 1}}$`));
    grid.push(line.split(' '));
  }
  return grid;
}

function expectSuccess(run: Run, n: number): string[][] {
  expect(run.status).toBe(0);
  expect(run.stderr).toBe('');
  return expectPuzzleStdout(run, n);
}

const tokensOf = (givens: Grid): string[][] => givens.map((row) => row.map((c) => (c === null ? '.' : String(c))));

/** FR-30 / FR-52 / FR-54 error behaviour plus the NFR-4 / NFR-8 shape (language and one sentence, no wording). */
function expectCliError(run: Run): void {
  expect(run.status, 'exit code must be a non-zero number (not a timeout)').not.toBeNull();
  expect(run.status).not.toBe(0);
  expect(run.stdout).toBe('');
  const text = run.stderr;
  expect(text.endsWith('\n') ? text.slice(0, -1) : text, 'stderr must hold something').not.toBe('');
  const line = text.endsWith('\n') ? text.slice(0, -1) : text;
  expect(line.includes('\n'), `stderr must be a single line: ${JSON.stringify(text)}`).toBe(false);
  expect(isOneSentence(line), `one sentence with a single terminal mark: ${JSON.stringify(text)}`).toBe(true);
  expect(hasLatin(line), 'English: contains Latin letters').toBe(true);
  expect(hasCyrillic(line), 'English: no Cyrillic').toBe(false);
}

describe('@trace FR-28 CLI prints the puzzle for a size and seed', () => {
  it('size 6 seed 42: exit 0, 6 lines of 6 tokens, empty stderr', () => {
    expectSuccess(cli(['--size', '6', '--seed', '42']), 6);
  }, TIMEOUT);

  it('output matches the engine generator cell for cell (. is an empty cell)', () => {
    const grid = expectSuccess(cli(['--size', '6', '--seed', '42']), 6);
    expect(grid).toEqual(tokensOf(generate(6, 42).givens));
  }, TIMEOUT);

  it('same arguments, same output (two real runs)', () => {
    const first = cli(['--size', '4', '--seed', '9'], true);
    const second = cli(['--size', '4', '--seed', '9'], true);
    expectSuccess(first, 4);
    expectSuccess(second, 4);
    expect(second.stdout).toBe(first.stdout);
  }, TIMEOUT * 2);

  it('size 8 seed 7 in a separate process equals the engine in this process (FR-14 across processes)', () => {
    const grid = expectSuccess(cli(['--size', '8', '--seed', '7']), 8);
    expect(grid).toEqual(tokensOf(generate(8, 7).givens));
  }, TIMEOUT);
});

describe('@trace FR-29 CLI defaults', () => {
  it('no arguments: stdout equals --size 6 --seed 1', () => {
    const bare = cliNoArgs();
    const explicit = cli(['--size', '6', '--seed', '1']);
    expectSuccess(bare, 6);
    expectSuccess(explicit, 6);
    expect(bare.stdout).toBe(explicit.stdout);
  }, TIMEOUT * 2);

  it('only the seed given: a 6x6 puzzle equal to --size 6 --seed 5', () => {
    const only = cli(['--seed', '5']);
    const explicit = cli(['--size', '6', '--seed', '5']);
    expectSuccess(only, 6);
    expectSuccess(explicit, 6);
    expect(only.stdout).toBe(explicit.stdout);
  }, TIMEOUT * 2);

  it('only the size given: a 4x4 puzzle equal to --size 4 --seed 1', () => {
    const only = cli(['--size', '4']);
    const explicit = cli(['--size', '4', '--seed', '1']);
    expectSuccess(only, 4);
    expectSuccess(explicit, 4);
    expect(only.stdout).toBe(explicit.stdout);
  }, TIMEOUT * 2);
});

describe('@trace FR-30 CLI rejects an invalid size', () => {
  it.each([
    ['odd size 5', ['--size', '5']],
    ['size below 4', ['--size', '2']],
    ['size above 16', ['--size', '18']],
    ['non-numeric size', ['--size', 'abc']],
    ['size that breaks the number grammar (6.5)', ['--size', '6.5']],
  ])('%s: one English sentence on stderr, non-zero exit, empty stdout', (_name, args) => {
    expectCliError(cli(args));
  }, TIMEOUT);
});

describe('@trace FR-52 CLI rejects an invalid seed', () => {
  it.each([
    ['non-numeric seed', ['--seed', 'abc']],
    ['seed above the domain (2147483648)', ['--seed', '2147483648']],
    ['negative seed', ['--seed', '-1']],
    ['fractional seed', ['--seed', '1.5']],
  ])('%s: one English sentence on stderr, non-zero exit, empty stdout', (_name, args) => {
    expectCliError(cli(args));
  }, TIMEOUT);

  it.each([0, 2147483647])('seed %i with size 4: exit 0, a 4x4 puzzle, empty stderr', (seed) => {
    expectSuccess(cli(['--size', '4', '--seed', String(seed)]), 4);
  }, TIMEOUT);
});

describe('@trace FR-53 CLI number grammar', () => {
  it('leading zeros in the size: --size 06 equals --size 6', () => {
    const padded = cli(['--size', '06', '--seed', '7']);
    const plain = cli(['--size', '6', '--seed', '7']);
    expectSuccess(padded, 6);
    expectSuccess(plain, 6);
    expect(padded.stdout).toBe(plain.stdout);
  }, TIMEOUT * 2);

  it('leading zeros in the seed: --seed 007 equals --seed 7', () => {
    const padded = cli(['--size', '4', '--seed', '007']);
    const plain = cli(['--size', '4', '--seed', '7']);
    expectSuccess(padded, 4);
    expectSuccess(plain, 4);
    expect(padded.stdout).toBe(plain.stdout);
  }, TIMEOUT * 2);

  it.each(['6.5', '+6', '-2', '1e1', '0x6', ''])('invalid size token %j is rejected', (token) => {
    expectCliError(cli(['--size', token]));
  }, TIMEOUT);

  it.each(['6.5', '+6', '-2', '1e1', '0x6', ''])('invalid seed token %j is rejected', (token) => {
    expectCliError(cli(['--seed', token]));
  }, TIMEOUT);
});

describe('@trace FR-54 CLI rejects a missing option value and an unknown option', () => {
  it.each([
    ['size without a value', ['--size']],
    ['seed without a value after another option', ['--size', '6', '--seed']],
    ['unknown option', ['--level', '3']],
    ['unknown option next to valid ones', ['--size', '6', '--seed', '1', '--verbose']],
  ])('%s: one English sentence on stderr, non-zero exit, empty stdout', (_name, args) => {
    expectCliError(cli(args));
  }, TIMEOUT);
});

describe('@trace NFR-4 CLI error sentences are one sentence', () => {
  it.each([
    ['odd size', ['--size', '5']],
    ['size below 4', ['--size', '2']],
    ['non-numeric size', ['--size', 'abc']],
  ])('%s: single line, one terminal mark at the end, no earlier . ! or ?', (_name, args) => {
    const run = cli(args);
    expect(run.status).not.toBeNull();
    expect(run.status).not.toBe(0);
    const line = run.stderr.replace(/\n$/, '');
    expect(line.length).toBeGreaterThan(1);
    expect(isOneSentence(line), JSON.stringify(run.stderr)).toBe(true);
  }, TIMEOUT);
});

describe('@trace NFR-8 CLI errors are English', () => {
  it.each([
    ['odd size', ['--size', '5']],
    ['size above 16', ['--size', '18']],
    ['non-numeric seed', ['--seed', 'abc']],
    ['seed above 2147483647', ['--seed', '2147483648']],
    ['--size without a value', ['--size']],
    ['unknown option', ['--level', '3']],
  ])('%s: Latin letters, no Cyrillic, one line, one terminal mark', (_name, args) => {
    expectCliError(cli(args));
  }, TIMEOUT);
});

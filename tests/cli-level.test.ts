// CLI `--level` of add-difficulty-engine (FR-85, FR-86, FR-53, FR-54, NFR-8, NFR-4), run as a real child process through
// `npm run --silent cli --` exactly as tests/cli.test.ts does, plus the run-out scenario in the test process with a
// mocked engine. Error wording is NEVER asserted (A-22): only the language and the one-sentence shape.
// Written from the delta spec before the implementation exists.
// At red `--level` is an unknown option, so every success scenario and every `--level 1` golden run is red. The error
// scenarios would "pass" at red for the wrong reason (an unknown-option error is also a one-sentence English error), so
// each of them first asserts the precondition «--level is a known option» (a valid `--level 1` run exits 0); it is the
// part that is red today. The run-out scenario asserts that the mocked `generate` was called with (6, 1, 4).
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Grid } from '../src/engine/index';
import { hasCyrillic, hasLatin, isOneSentence } from './helpers/board';
import { GenerationRunOutError, generate } from '../src/engine/index';

const TIMEOUT = 60_000;

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

const cache = new Map<string, Run>();

function cli(args: string[], fresh = false): Run {
  const npmArgs = ['run', '--silent', 'cli', '--', ...args];
  const key = JSON.stringify(npmArgs);
  const hit = cache.get(key);
  if (hit && !fresh) return hit;
  const r = spawnSync('npm', npmArgs, { cwd: process.cwd(), encoding: 'utf8', timeout: TIMEOUT });
  const run: Run = { status: r.status, stdout: r.stdout, stderr: r.stderr };
  cache.set(key, run);
  return run;
}

const textOf = (givens: Grid): string => givens.map((row) => row.map((c) => (c === null ? '.' : String(c))).join(' ')).join('\n') + '\n';

function expectPuzzleStdout(run: Run, n: number): void {
  expect(run.stdout.endsWith('\n'), 'stdout must end with a newline').toBe(true);
  const lines = run.stdout.slice(0, -1).split('\n');
  expect(lines).toHaveLength(n);
  for (const line of lines) expect(line).toMatch(new RegExp(`^[01.]( [01.]){${n - 1}}$`));
}

function expectSuccess(run: Run, n: number): void {
  expect(run.status, `stderr: ${run.stderr}`).toBe(0);
  expect(run.stderr).toBe('');
  expectPuzzleStdout(run, n);
}

/** FR-86 / NFR-8 / NFR-4: non-zero exit, empty stdout, one English sentence on stderr (wording not asserted). */
function expectCliError(run: Run): void {
  expect(run.status).not.toBeNull();
  expect(run.status).not.toBe(0);
  expect(run.stdout).toBe('');
  const line = run.stderr.replace(/\n$/, '');
  expect(line.length).toBeGreaterThan(1);
  expect(line.includes('\n'), JSON.stringify(run.stderr)).toBe(false);
  expect(hasLatin(line), JSON.stringify(run.stderr)).toBe(true);
  expect(hasCyrillic(line), JSON.stringify(run.stderr)).toBe(false);
  expect(isOneSentence(line), JSON.stringify(run.stderr)).toBe(true);
}

/** The precondition that makes the error scenarios meaningful: `--level` is a known option (red today). */
function expectLevelIsKnown(): void {
  expectSuccess(cli(['--size', '6', '--seed', '1', '--level', '1']), 6);
}

describe('@trace FR-85 CLI prints the puzzle of a level', () => {
  it('size 6 seed 42 level 3: exit 0, 6 lines of 6 tokens, empty stderr, the givens of generate(6, 42, 3)', () => {
    const run = cli(['--size', '6', '--seed', '42', '--level', '3']);
    expectSuccess(run, 6);
    expect(run.stdout).toBe(textOf(generate(6, 42, 3).givens));
  }, TIMEOUT);

  it('size 8 seed 7 level 4 prints the givens of generate(8, 7, 4)', () => {
    const run = cli(['--size', '8', '--seed', '7', '--level', '4']);
    expectSuccess(run, 8);
    expect(run.stdout).toBe(textOf(generate(8, 7, 4).givens));
  }, TIMEOUT);

  it('leading zeros in the level: --level 03 equals --level 3 (FR-53)', () => {
    const a = cli(['--size', '6', '--seed', '7', '--level', '03']);
    const b = cli(['--size', '6', '--seed', '7', '--level', '3']);
    expectSuccess(a, 6);
    expectSuccess(b, 6);
    expect(a.stdout).toBe(b.stdout);
  }, TIMEOUT);

  it('option order does not matter', () => {
    const a = cli(['--level', '2', '--seed', '9', '--size', '6']);
    const b = cli(['--size', '6', '--seed', '9', '--level', '2']);
    expectSuccess(a, 6);
    expectSuccess(b, 6);
    expect(a.stdout).toBe(b.stdout);
  }, TIMEOUT);

  it('same arguments, same output: size 8 seed 3 level 4 run twice in separate processes', () => {
    const a = cli(['--size', '8', '--seed', '3', '--level', '4'], true);
    const b = cli(['--size', '8', '--seed', '3', '--level', '4'], true);
    expectSuccess(a, 8);
    expect(b.stdout).toBe(a.stdout);
  }, TIMEOUT);

  it('level 1 at size 4 is accepted and prints a 4x4 puzzle', () => {
    const run = cli(['--size', '4', '--level', '1']);
    expectSuccess(run, 4);
  }, TIMEOUT);

  it('the level option is no longer unknown (FR-54): --size 6 --seed 1 --level 3 exits 0 with nothing on stderr', () => {
    expectSuccess(cli(['--size', '6', '--seed', '1', '--level', '3']), 6);
  }, TIMEOUT);
});

describe('@trace FR-85 @trace FR-14 no level means level 1, byte for byte; --level 1 for sampled seeds', () => {
  interface Entry {
    size: number;
    seed: number;
    cli: string;
  }
  const golden = JSON.parse(readFileSync(`${process.cwd()}/tests/fixtures/level1-golden.json`, 'utf8')) as { entries: Entry[] };
  const sampled = [4, 6, 8].flatMap((size) =>
    [1, 10, 20].map((seed) => {
      const entry = golden.entries.find((e) => e.size === size && e.seed === seed);
      if (entry === undefined) throw new Error(`no golden entry for size ${size} seed ${seed}`);
      return entry;
    }),
  );

  it('the golden file holds the 9 sampled entries', () => {
    expect(sampled).toHaveLength(9);
  });

  it.each(sampled.map((e) => [e.size, e.seed, e.cli] as const))('--size %i --seed %i --level 1 prints exactly the golden CLI text', (size, seed, text) => {
    const run = cli(['--size', String(size), '--seed', String(seed), '--level', '1']);
    expect(run.status, `stderr: ${run.stderr}`).toBe(0);
    expect(run.stderr).toBe('');
    expect(run.stdout).toBe(text);
  }, TIMEOUT);
});

describe('@trace FR-86 @trace NFR-8 @trace NFR-4 CLI rejects an invalid level', () => {
  it.each([
    ['0', '0'],
    ['5', '5'],
  ])('--size 6 --level %s: one English sentence, non-zero exit, empty stdout', (_name, level) => {
    expectLevelIsKnown();
    expectCliError(cli(['--size', '6', '--level', level]));
  }, TIMEOUT);

  it.each(['1.5', '+2', '-2', '1e1', '0x3', 'abc', ''])('--size 6 --level %j breaks the grammar: one English sentence, non-zero exit, empty stdout (FR-53)', (token) => {
    expectLevelIsKnown();
    expectCliError(cli(['--size', '6', '--level', token]));
  }, TIMEOUT);

  it('--size 6 --level without a value: one English sentence, non-zero exit, empty stdout (FR-54)', () => {
    expectLevelIsKnown();
    expectCliError(cli(['--size', '6', '--level']));
  }, TIMEOUT);

  it.each(['2', '4'])('--size 4 --level %s (a level above 1 at size 4): one English sentence, non-zero exit, empty stdout', (level) => {
    expectLevelIsKnown();
    expectCliError(cli(['--size', '4', '--level', level]));
  }, TIMEOUT);

  it('--size 4 --level 1 exits 0 and prints a 4x4 puzzle (the contrast to the previous case)', () => {
    expectSuccess(cli(['--size', '4', '--level', '1']), 4);
  }, TIMEOUT);

  it('the unknown option --depth is still rejected (FR-54, the option that replaced --level in tests/cli.test.ts)', () => {
    expectCliError(cli(['--depth', '3']));
  }, TIMEOUT);
});

describe('@trace FR-86 @trace FR-84 @trace NFR-8 a generator run-out is reported as one English sentence', () => {
  const savedArgv = [...process.argv];
  const savedExitCode = process.exitCode;

  afterEach(() => {
    process.argv = [...savedArgv];
    process.exitCode = savedExitCode;
    vi.doUnmock('../src/engine/index');
    vi.resetModules();
  });

  it('the CLI module with a mocked engine whose generate throws GenerationRunOutError: stderr gets one English sentence, exit code 1, stdout nothing', async () => {
    const RunOut = GenerationRunOutError;
    const mockedGenerate = vi.fn((): never => {
      throw new RunOut();
    });
    vi.resetModules();
    vi.doMock('../src/engine/index', async (importOriginal) => ({
      ...(await importOriginal<Record<string, unknown>>()),
      generate: mockedGenerate,
    }));
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    process.argv = ['node', 'cli.ts', '--size', '6', '--level', '4'];
    process.exitCode = undefined;

    await import('../src/cli');

    expect(mockedGenerate, 'the mocked generate must have been reached with size 6, seed 1, level 4').toHaveBeenCalledWith(6, 1, 4);
    expect(out).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalledTimes(1);
    const text = String(err.mock.calls[0]?.[0]);
    expect(text.endsWith('\n')).toBe(true);
    const line = text.replace(/\n$/, '');
    expect(hasCyrillic(line), JSON.stringify(text)).toBe(false);
    expect(hasLatin(line), JSON.stringify(text)).toBe(true);
    expect(isOneSentence(line), JSON.stringify(text)).toBe(true);
    expect(process.exitCode).toBe(1);
  }, TIMEOUT);
});

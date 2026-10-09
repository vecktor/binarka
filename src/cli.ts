import { generate } from './engine/index';

const DIGITS = /^[0-9]+$/;

class CliError extends Error {}

interface Options {
  size: number;
  seed: number;
  level: number;
}

function parseNumber(value: string, what: string): number {
  if (!DIGITS.test(value)) throw new CliError(`The ${what} must be written as whole decimal digits only.`);
  return Number(value);
}

function parseArgs(argv: string[]): Options {
  const options: Options = { size: 6, seed: 1, level: 1 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg !== '--size' && arg !== '--seed' && arg !== '--level') {
      throw new CliError('Unknown option: only --size, --seed and --level are supported.');
    }
    const value = argv[i + 1];
    const what = arg === '--size' ? 'size' : arg === '--seed' ? 'seed' : 'level';
    if (value === undefined) throw new CliError(`The --${what} option needs a value.`);
    i++;
    options[what] = parseNumber(value, what);
  }
  return options;
}

function main(): void {
  try {
    const { size, seed, level } = parseArgs(process.argv.slice(2));
    const puzzle = generate(size, seed, level);
    const text = puzzle.givens.map((row) => row.map((c) => (c === null ? '.' : String(c))).join(' ')).join('\n') + '\n';
    process.stdout.write(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The puzzle could not be generated.';
    process.stderr.write(message + '\n');
    process.exitCode = 1;
  }
}

main();

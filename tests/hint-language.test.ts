// The language of the hint sentences and the data of a hint (add-english-version, openspec/changes/add-english-version/specs/puzzle-engine/
// spec.md). One test per scenario of the two ADDED requirements «Hint language is an engine input» and «A hint exposes the data of its
// sentence», and of the MODIFIED «The public engine interface exports the level API» (the new scenario). Written FIRST (red): today `hint`
// takes two arguments, a fill result has no data fields and `src/engine/index.ts` has no `hintSentence`.
//
// The English sentences, the boards and the data are in tests/helpers/hint-cases.ts (transcribed from the spec). `hintSentence` is reached
// through tests/helpers/hint-type.ts, so its absence fails an assertion (`sentenceOf`) and not a TypeError.
//
// GUARDS (green before the change, and they must stay green): «The default language is Ukrainian and unchanged» (the extra argument is
// ignored today; the Ukrainian sentences are the ones pinned since add-difficulty-engine), «The CLI does not use the hint or a language»,
// «The engine stays pure», and the `lookahead` row of «Each rule carries its data» (its only data field, `steps`, exists today).
//
// @trace FR-112
// @trace FR-110
// @trace FR-56
// @trace FR-23
// @trace NFR-5
// @trace NFR-8
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as engine from '../src/engine/index';
import { boardOf } from './helpers/board';
import { FILL_CASES, NO_TARGET_CASES, PAGE_CEILING, expectedFill } from './helpers/hint-cases';
import type { FillCase } from './helpers/hint-cases';
import { dataFieldsOf, hasHintSentence, hint, sentenceOf } from './helpers/hint-type';
import type { HintAny } from './helpers/hint-type';

/** The boards of «Pair hint», «Sandwich hint», «Count hint», «Line balance hint», «Unique lines hint», «Look-ahead hint», «No-rule hint»
 * and «Broken-board hint» that the scenarios of «Hint language is an engine input» name (one case of each kind, at its own ceiling). */
const KIND_CASES: { kind: string; board: FillCase['board']; ceiling: number }[] = [
  ...['Pair of zeros in a row', 'Zeros around a gap in a column', 'Three zeros in a 6-wide row, one empty cell', 'Line balance in a row', 'Unique lines in a row', 'Look-ahead of two steps beats an earlier cell of four'].map(
    (name) => {
      const c = FILL_CASES.find((fill) => fill.name === name);
      expect.assert(c !== undefined, `premise: the case table holds «${name}»`);
      return { kind: `${c.rule} (${name})`, board: c.board, ceiling: c.ceiling };
    },
  ),
  ...NO_TARGET_CASES.map((c) => ({ kind: `${c.kind} (${c.name})`, board: c.board, ceiling: 1 })),
];

const withoutSentence = (h: HintAny): Record<string, unknown> => Object.fromEntries(Object.entries(h).filter(([key]) => key !== 'sentence'));

describe('Hint language is an engine input', () => {
  // GUARD: today the third argument is ignored and the sentences are the Ukrainian ones; it must stay so for 'uk' and for no argument.
  it('The default language is Ukrainian and unchanged', () => {
    for (const { kind, board, ceiling } of KIND_CASES) {
      const twoArguments = hint(board, ceiling);
      const withUk = hint(board, ceiling, 'uk');
      expect(withUk, `${kind}: 'uk' equals the old two-argument form`).toStrictEqual(twoArguments);
      expect(hint(board), `${kind}: no argument at all equals ceiling 1 with 'uk'`).toStrictEqual(hint(board, 1, 'uk'));
    }
    for (const c of FILL_CASES) {
      const result = hint(c.board, c.ceiling);
      expect(result.sentence, `${c.name}: the Ukrainian sentence of the named requirement`).toBe(c.uk);
      expect(result, `${c.name}: kind, cell, value, rule and steps are those pinned there`).toMatchObject({
        kind: 'fill',
        row: c.target.row - 1,
        col: c.target.col - 1,
        value: c.target.value,
        rule: c.rule,
        ...(c.steps === undefined ? {} : { steps: c.steps }),
      });
    }
    for (const c of NO_TARGET_CASES) expect(hint(c.board, 4), c.name).toStrictEqual({ kind: c.kind, sentence: c.uk });
  });

  it('English changes only the sentence', () => {
    for (const { kind, board, ceiling } of KIND_CASES) {
      const uk = hint(board, ceiling, 'uk');
      const en = hint(board, ceiling, 'en');
      expect(en.sentence, `${kind}: the English sentence differs from the Ukrainian one`).not.toBe(uk.sentence);
      expect(withoutSentence(en), `${kind}: kind, row, col, value, rule, steps and the data fields are equal; only the sentence differs`).toStrictEqual(
        withoutSentence(uk),
      );
    }
  });

  // GUARD: the CLI never used the hint and must not start to (NFR-8); the CLI tests (tests/cli*.test.ts) are unchanged.
  it('The CLI does not use the hint or a language', () => {
    const source = readFileSync(`${process.cwd()}/src/cli.ts`, 'utf8');
    expect(source.length, 'premise: src/cli.ts was read').toBeGreaterThan(200);
    expect(source, 'src/cli.ts names no hint function').not.toMatch(/\bhint\b/i);
    expect(source, 'src/cli.ts names no hintSentence').not.toMatch(/hintSentence/);
    expect(source, 'src/cli.ts has no language option').not.toMatch(/\blanguage\b|--lang\b|\blocale\b/i);
  });

  // GUARD (TC-7, TC-8): the engine reads no DOM, no storage, no locale and no Math.random; a language is a plain value passed in.
  it('The engine stays pure', () => {
    const root = `${process.cwd()}/src/engine`;
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const path = `${dir}/${entry}`;
        if (statSync(path).isDirectory()) walk(path);
        else if (entry.endsWith('.ts')) files.push(path);
      }
    };
    walk(root);
    expect(files.map((f) => f.slice(root.length + 1)), 'premise: the hint module is scanned').toContain('hint.ts');
    const code = (path: string): string =>
      readFileSync(path, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    const globals = /\b(document|window|localStorage|sessionStorage|navigator|location|Intl|toLocaleString|toLocaleLowerCase|toLocaleUpperCase)\b/;
    expect(files.filter((f) => globals.test(code(f))), 'no DOM, browser global or locale call under src/engine/').toEqual([]);
    expect(files.filter((f) => /\bMath\s*\.\s*random\b/.test(code(f))), 'no Math.random under src/engine/').toEqual([]);
    expect(
      files.filter((f) => /from\s+['"](?:[^'"]*\/)?(?:ui|main)(?:\/[^'"]*)?['"]/.test(code(f))),
      'no import of the page under src/engine/',
    ).toEqual([]);
  });
});

describe('A hint exposes the data of its sentence', () => {
  // The fields each rule carries, from the table of the requirement; every other field is absent (not undefined-valued, not null).
  const FIELDS: Record<string, string[]> = {
    pair: ['axis', 'digit', 'line'],
    sandwich: ['axis', 'digit', 'line'],
    count: ['axis', 'digit', 'empties', 'line', 'size'],
    balance: ['axis', 'digit', 'line'],
    unique: ['axis', 'line', 'other'],
    lookahead: ['steps'],
  };
  // The seven boards of the scenario «Each rule carries its data», in its order.
  const NAMES = [
    'Pair of zeros in a row',
    'Zeros around a gap in a column',
    'Three zeros in a 6-wide row, one empty cell',
    'Two empty cells in the line use the plural ending',
    'Line balance in a row',
    'Unique lines in a column',
    'Look-ahead of two steps beats an earlier cell of four',
  ];

  // GUARD for the `lookahead` row only (its `steps` exists today); the other six rows are red.
  it.each(NAMES)('Each rule carries its data: %s', (name) => {
    const c = FILL_CASES.find((fill) => fill.name === name);
    expect.assert(c !== undefined, `premise: the case table holds «${name}»`);
    const result = hint(c.board, PAGE_CEILING);
    expect(result, 'premise: a fill of the expected rule').toMatchObject({ kind: 'fill', rule: c.rule });
    expect(dataFieldsOf(result), `the fields present for ${c.rule} are exactly ${(FIELDS[c.rule] ?? []).join(', ')}`).toStrictEqual(FIELDS[c.rule]);
    expect(result, 'the values of the fields').toMatchObject({ ...c.data, ...(c.steps === undefined ? {} : { steps: c.steps }) });
    for (const field of ['axis', 'line', 'digit', 'empties', 'other', 'size'] as const) {
      if (!(FIELDS[c.rule] ?? []).includes(field)) expect(result, `${c.rule} carries no ${field}`).not.toHaveProperty(field);
    }
    if (c.rule === 'count') expect(result.size, 'a count result carries the side of its board').toBe(c.board.length);
  });

  it('Each rule carries its data: the count results carry size equal to the side of their board (4, 6 and 8)', () => {
    for (const c of FILL_CASES.filter((fill) => fill.rule === 'count')) {
      const result = hint(c.board, c.ceiling);
      expect(result.size, c.name).toBe(c.board.length);
    }
  });

  it('hintSentence rebuilds every sentence in both languages', () => {
    const named = [
      ...['Pair of zeros in a row', 'Zeros around a gap in a column', 'Three zeros in a 6-wide row, one empty cell', 'Two empty cells in the line use the plural ending', 'Line balance in a row', 'Unique lines in a column', 'Look-ahead of two steps beats an earlier cell of four'],
      'Pair of ones in a column',
      'Ones around a gap in a row',
      'Number word for N = 8, one empty cell (zeros)',
      'Line balance in a column',
      'Unique lines in a row',
    ];
    expect(hasHintSentence(), 'src/engine/index.ts exports a function hintSentence (FR-110)').toBe(true);
    for (const name of named) {
      const c = FILL_CASES.find((fill) => fill.name === name);
      expect.assert(c !== undefined, `premise: the case table holds «${name}»`);
      const made = hint(c.board, PAGE_CEILING); // made with the default language
      expect(made.kind, `${name}: premise, a fill`).toBe('fill');
      expect(sentenceOf(made, 'uk'), `${name}: 'uk' rebuilds the sentence of the hint`).toBe(made.sentence);
      expect(sentenceOf(made), `${name}: no language means 'uk'`).toBe(made.sentence);
      const english = sentenceOf(made, 'en');
      expect(english, `${name}: 'en' equals the engine's English sentence for the same board`).toBe(hint(c.board, PAGE_CEILING, 'en').sentence);
      expect(english, `${name}: and it is not the Ukrainian one`).not.toBe(made.sentence);
    }
  });

  it('The no-rule and broken-rule sentences need no data', () => {
    expect(hasHintSentence(), 'src/engine/index.ts exports a function hintSentence (FR-110)').toBe(true);
    for (const c of NO_TARGET_CASES) {
      const made = Object.freeze(hint(c.board, PAGE_CEILING));
      const before = structuredClone(made);
      expect(made.kind, `${c.name}: premise`).toBe(c.kind);
      expect(sentenceOf(made, 'uk'), `${c.name}: Ukrainian`).toBe(c.uk);
      expect(sentenceOf(made, 'en'), `${c.name}: English`).toBe(c.en);
      expect(made, `${c.name}: the input object is not modified`).toStrictEqual(before);
      expect(dataFieldsOf(made), `${c.name}: no data fields`).toStrictEqual([]);
    }
  });
});

describe('The public engine interface exports the level API', () => {
  it('The sentence function is imported from the index', () => {
    expect(typeof (engine as unknown as { hintSentence?: unknown }).hintSentence, 'hintSentence is a function').toBe('function');
    const c = FILL_CASES[0];
    expect.assert(c !== undefined, 'premise: a case exists');
    expect(hint(c.board, c.ceiling, 'en').sentence, 'hint accepts a third argument: the English sentence').toBe(c.en);
    expect(dataFieldsOf(hint(c.board, c.ceiling)), 'a fill result carries the fields of «A hint exposes the data of its sentence»').toStrictEqual(['axis', 'digit', 'line']);
  });

  // GUARD: the test seams stay out of the public module (unchanged scenario of «The classes and functions are imported from the index»).
  it('The internal test seams are still not exported', () => {
    for (const name of ['buildPuzzle', 'MAX_ATTEMPTS', 'solveByRules']) expect(engine, `${name} is not exported`).not.toHaveProperty(name);
  });
});

// Not in a scenario table: an unrelated board keeps the data out of the way (a guard that a cell-less hint never carries data).
describe('A hint with no cell carries no data', () => {
  it('none and broken results are exactly { kind, sentence } in both languages', () => {
    for (const language of ['uk', 'en'] as const) {
      expect(Object.keys(hint(boardOf(6, { cells: [[1, 1, 0]] }), 4, language)).sort(), `none, ${language}`).toStrictEqual(['kind', 'sentence']);
      expect(Object.keys(hint(boardOf(6, { rows: { 1: '0 0 0 . . .' } }), 4, language)).sort(), `broken, ${language}`).toStrictEqual(['kind', 'sentence']);
    }
  });
});

// The full object a case pins, for one language, as a whole-object check of a fill (the strict form of the old `toEqual` tests).
describe('A fill is exactly the object the scenario pins', () => {
  it.each(FILL_CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    expect(hint(c.board, c.ceiling)).toStrictEqual(expectedFill(c, 'uk'));
    expect(hint(c.board, c.ceiling, 'uk')).toStrictEqual(expectedFill(c, 'uk'));
    expect(hint(c.board, c.ceiling, 'en')).toStrictEqual(expectedFill(c, 'en'));
  });
});

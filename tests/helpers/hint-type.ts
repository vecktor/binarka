// A typed view of the public hint for tests that read the optional fields (row, col, value, rule, steps and, since add-english-version,
// the data fields of FR-110 and the language input of FR-112) without narrowing on `kind`. Identity at run time: no behaviour of its own.
// The hint's third parameter and the `hintSentence` export are reached through casts, so that this file (and every test that imports it)
// compiles against the engine as it was before the language input existed, and `npm run build` (which type-checks `tests/` and `e2e/`)
// never stops the real-browser red run; a missing export is an ASSERTION failure (`sentenceOf`), never a crash.
import { expect } from 'vitest';
import * as engine from '../../src/engine/index';
import type { Grid } from '../../src/engine/index';

export type HintLanguage = 'uk' | 'en';

export interface HintAny {
  kind: 'fill' | 'none' | 'broken';
  sentence: string;
  row?: number;
  col?: number;
  value?: number;
  rule?: string;
  steps?: number;
  axis?: 'row' | 'col';
  line?: number;
  digit?: number;
  empties?: number;
  other?: number;
  size?: number;
}

/** The six data fields of FR-110 plus `steps`, in the order of the table of «A hint exposes the data of its sentence». */
export const DATA_FIELDS = ['axis', 'line', 'digit', 'empties', 'other', 'steps', 'size'] as const;

export const hint = engine.hint as (board: Grid, ceiling?: number, language?: HintLanguage) => HintAny;

type SentenceFunction = (hint: HintAny, language?: HintLanguage) => string;

/** `hintSentence` of `src/engine/index.ts`, or undefined while the engine does not export it (FR-110). */
const exported = (engine as unknown as { hintSentence?: SentenceFunction }).hintSentence;

/** True when `src/engine/index.ts` exports a function `hintSentence`. */
export const hasHintSentence = (): boolean => typeof exported === 'function';

/** `hintSentence(h, language)`; the first line asserts the export, so its absence is an assertion failure and not a TypeError. */
export function sentenceOf(h: HintAny, language?: HintLanguage): string {
  expect(typeof exported, 'src/engine/index.ts exports a function hintSentence (FR-110)').toBe('function');
  expect.assert(exported !== undefined, 'hintSentence is exported');
  return language === undefined ? exported(h) : exported(h, language);
}

/** The data fields a hint object actually carries (own keys, so `undefined`-valued and absent fields are told apart), sorted. */
export const dataFieldsOf = (h: HintAny): string[] => Object.keys(h).filter((key) => (DATA_FIELDS as readonly string[]).includes(key)).sort();

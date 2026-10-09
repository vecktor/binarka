// A typed view of the public hint for tests that read the optional fields (row, col, value, rule, steps) without
// narrowing on `kind`. Identity at run time: no behaviour of its own.
import { hint as engineHint } from '../../src/engine/index';
import type { Grid } from '../../src/engine/index';

export interface HintAny {
  kind: 'fill' | 'none' | 'broken';
  sentence: string;
  row?: number;
  col?: number;
  value?: number;
  rule?: string;
  steps?: number;
}

export const hint = engineHint as (board: Grid, ceiling?: number) => HintAny;

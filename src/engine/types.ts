export type Cell = 0 | 1 | null;
export type Grid = Cell[][];

export interface Puzzle {
  size: number;
  givens: Grid;
  solution: (0 | 1)[][];
}

export interface Violation {
  rule: 'three' | 'count' | 'duplicate';
  axis: 'row' | 'col';
  /** 0-based line index (the lower line of a duplicate pair) */
  index: number;
  /** 0-based second line of a duplicate pair */
  other?: number;
  /** [row, col] pairs, 0-based */
  cells: [number, number][];
}

/** The language of a hint sentence (ADR-0005). */
export type HintLanguage = 'uk' | 'en';

/** The data a hint sentence is built from (FR-110); `line` and `other` are 0-based like `row` and `col`. */
export type Hint =
  | { kind: 'fill'; row: number; col: number; value: 0 | 1; rule: 'pair' | 'sandwich' | 'balance'; axis: 'row' | 'col'; line: number; digit: 0 | 1; sentence: string }
  | {
      kind: 'fill';
      row: number;
      col: number;
      value: 0 | 1;
      rule: 'count';
      axis: 'row' | 'col';
      line: number;
      digit: 0 | 1;
      empties: number;
      size: number;
      sentence: string;
    }
  | { kind: 'fill'; row: number; col: number; value: 0 | 1; rule: 'unique'; axis: 'row' | 'col'; line: number; other: number; sentence: string }
  | { kind: 'fill'; row: number; col: number; value: 0 | 1; rule: 'lookahead'; steps: number; sentence: string }
  | { kind: 'none' | 'broken'; sentence: string };

/** The size is not an even integer from 4 to 16. */
export class InvalidSizeError extends RangeError {
  constructor() {
    super('The size must be an even whole number from 4 to 16.');
    this.name = 'InvalidSizeError';
  }
}

/** The seed is not an integer from 0 to 2147483647. */
export class InvalidSeedError extends RangeError {
  constructor() {
    super('The seed must be a whole number from 0 to 2147483647.');
    this.name = 'InvalidSeedError';
  }
}

/** A size or seed argument is not a number at all. */
export class InvalidArgumentTypeError extends TypeError {
  constructor() {
    super('The size and the seed must be numbers.');
    this.name = 'InvalidArgumentTypeError';
  }
}

/** The level is not an integer from 1 to 4, or a level above 1 was asked for size 4. */
export class InvalidLevelError extends RangeError {
  constructor(aboveOneAtFour = false) {
    super(
      aboveOneAtFour
        ? 'Levels 2 to 4 need a size of 6 or more.'
        : 'The level must be a whole number from 1 to 4.',
    );
    this.name = 'InvalidLevelError';
  }
}

/** No attempt within the limit gave a puzzle of exactly the requested level. */
export class GenerationRunOutError extends Error {
  constructor() {
    super('No puzzle of the requested level was found within the attempt limit.');
    this.name = 'GenerationRunOutError';
  }
}

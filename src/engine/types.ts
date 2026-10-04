// RED-STAGE STUB: replaced by the capability-implementer
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
  index: number;
  other?: number;
  cells: Array<[number, number]>;
}

export type Hint =
  | { kind: 'fill'; row: number; col: number; value: 0 | 1; rule: 'pair' | 'sandwich' | 'count'; sentence: string }
  | { kind: 'none' | 'broken'; sentence: string };

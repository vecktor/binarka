import type { BoardSpec, CellSpec } from '@/components/binarka-page'

const parse = (rows: string[]): CellSpec[][] =>
  rows.map((row) => row.trim().split(/\s+/) as CellSpec[])

// 6×6: givens from our engine (generate(6, 5), level 1, exactly one solution); the three boards share them.
// Entries are taken from that solution, except the third 0 of row 3 on the fixture (the solution has 1 there),
// which makes the one triple violation. The hinted cell is the engine's first hint on the hint board.
export const fixtureBoard: BoardSpec = {
  size: 6,
  rows: parse([
    'g1 .  .  .  g0 .',
    'p1 .  g1 .  .  .',
    'p0 p0 p0 .  .  g1',
    'g0 .  g0 .  g0 .',
    '.  g1 .  .  .  p0',
    '.  .  .  p1 g0 .',
  ]),
  violations: [
    [3, 1],
    [3, 2],
    [3, 3],
  ],
}

export const hintBoard: BoardSpec = {
  size: 6,
  rows: parse([
    'g1 .  .  .  g0 .',
    'p1 .  g1 .  .  .',
    'p0 p0 h1 .  .  g1',
    'g0 .  g0 .  g0 .',
    '.  g1 .  .  .  p0',
    '.  .  .  p1 g0 .',
  ]),
}

export const solvedBoard: BoardSpec = {
  size: 6,
  solved: true,
  rows: parse([
    'g1 p1 p0 p1 g0 p0',
    'p1 p0 g1 p0 p1 p0',
    'p0 p0 p1 p0 p1 g1',
    'g0 p1 g0 p1 g0 p1',
    'p1 g1 p0 p0 p1 p0',
    'p0 p0 p1 p1 g0 p1',
  ]),
}

// 8×8 mid-game: givens from our engine (generate(8, 7), exactly one solution),
// entries taken from that solution.
export const eightBoard: BoardSpec = {
  size: 8,
  rows: parse([
    'p0 g0 p1 p1 .  .  g1 .',
    'p1 p1 .  .  g1 .  .  g0',
    '.  p1 .  p1 .  .  .  .',
    '.  .  p1 .  .  .  .  .',
    '.  g0 .  .  .  .  .  .',
    'g1 p1 .  .  .  .  .  .',
    '.  .  .  .  .  p1 g0 g0',
    'g1 p0 g1 .  .  .  .  g0',
  ]),
}

// 4×4 mid-game: givens from our engine (generate(4, 3), exactly one solution),
// entries taken from that solution.
export const fourBoard: BoardSpec = {
  size: 4,
  rows: parse([
    'g1 p0 .  .',
    'g1 .  g1 .',
    '.  g1 .  g1',
    'p0 g1 .  .',
  ]),
}

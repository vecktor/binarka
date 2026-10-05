import type { BoardSpec, CellSpec } from '@/components/binarka-page'

const parse = (rows: string[]): CellSpec[][] =>
  rows.map((row) => row.trim().split(/\s+/) as CellSpec[])

export const fixtureBoard: BoardSpec = {
  size: 6,
  rows: parse([
    '.  g0 .  .  g1 .',
    'p1 .  .  g0 .  .',
    '.  p0 p0 p0 .  g1',
    'g1 .  .  .  .  .',
    '.  .  g0 .  .  p1',
    '.  g1 .  .  p0 .',
  ]),
  violations: [
    [3, 2],
    [3, 3],
    [3, 4],
  ],
}

export const hintBoard: BoardSpec = {
  size: 6,
  rows: parse([
    '.  g0 .  .  g1 .',
    'p1 .  .  g0 .  .',
    'h1 p0 p0 .  .  g1',
    'g1 .  .  .  .  .',
    '.  .  g0 .  .  p1',
    '.  g1 .  .  p0 .',
  ]),
}

export const solvedBoard: BoardSpec = {
  size: 6,
  solved: true,
  rows: parse([
    'p0 g0 p1 p0 g1 p1',
    'p1 p1 p0 g0 p1 p0',
    'p0 p0 p1 p1 p0 g1',
    'g1 p0 p1 p1 p0 p0',
    'p0 p1 g0 p0 p1 p1',
    'p1 g1 p0 p1 p0 p0',
  ]),
}

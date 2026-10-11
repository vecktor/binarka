import { BinarkaPage, type BoardSpec, type CellSpec } from '@/components/binarka-page'

// Review capture only (the violation-cause design touch, FR-64, FR-120, A-58). Not in boards.json:
// the product's capture-board tests read that file. The fixture board's rows, with two causes on one
// board so a reviewer sees the mark on both border styles. The product marks at most one cell.
// P1: a press made three 0s side by side in row 3; the third, (3,3), is the cause.
// P6: a hint fill made three 1s in column 6; the hinted cell (2,6) is the cause and keeps its dashed border.
const rows: string[] = [
  'g1 .  .  .  g0 p1',
  'p1 .  g1 .  .  h1',
  'p0 p0 p0 .  .  g1',
  'g0 .  g0 .  g0 .',
  '.  g1 .  .  .  p0',
  '.  .  .  p1 g0 .',
]

const causeBoard: BoardSpec = {
  size: 6,
  rows: rows.map((row) => row.trim().split(/\s+/) as CellSpec[]),
  violations: [
    [3, 1],
    [3, 2],
    [3, 3],
    [1, 6],
    [2, 6],
    [3, 6],
  ],
  causes: [
    [3, 3],
    [2, 6],
  ],
}

export default function CausePage() {
  return <BinarkaPage board={causeBoard} />
}

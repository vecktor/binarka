import { BinarkaPage, type BoardSpec, type CellSpec } from '@/components/binarka-page'

// Review capture only (the violation-cause design touch, FR-64, FR-120, A-58): one mark, 4×4.
// The /four/ board's givens; a hint fill of 1 at (3,3) made three 1s in row 3 (P6). That is also
// three 1s of four, so the whole row is highlighted. The hinted cell is the cause and keeps its
// dashed border. No other line breaks a rule.
const rows: string[] = [
  'g1 p0 .  .',
  'g1 .  g1 .',
  '.  g1 h1 g1',
  'p0 g1 .  .',
]

const causeFourBoard: BoardSpec = {
  size: 4,
  rows: rows.map((row) => row.trim().split(/\s+/) as CellSpec[]),
  violations: [
    [3, 1],
    [3, 2],
    [3, 3],
    [3, 4],
  ],
  causes: [[3, 3]],
}

export default function CauseFourPage() {
  return <BinarkaPage board={causeFourBoard} />
}

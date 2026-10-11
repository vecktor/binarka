import { BinarkaPage, type BoardSpec, type CellSpec } from '@/components/binarka-page'

// Review capture only (the violation-cause design touch, FR-64, FR-120, A-58): one mark, 8×8.
// The /eight/ board's givens; row 3 holds five 1s of eight (P2), so the whole row is highlighted.
// The fifth 1, pressed last at (3,7), is the cause; it is a cell of the excess digit, as the checker
// reports it. Row 3 has no run of three, and no other line breaks a rule.
const rows: string[] = [
  'p0 g0 p1 p1 .  .  g1 .',
  'p1 p1 .  .  g1 .  .  g0',
  'p1 p1 p0 p1 p1 p0 p1 .',
  '.  .  p1 .  .  .  .  .',
  '.  g0 .  .  .  .  .  .',
  'g1 p1 .  .  .  .  .  .',
  '.  .  .  .  .  p1 g0 g0',
  'g1 p0 g1 .  .  .  .  g0',
]

const causeEightBoard: BoardSpec = {
  size: 8,
  rows: rows.map((row) => row.trim().split(/\s+/) as CellSpec[]),
  violations: Array.from({ length: 8 }, (_, index) => [3, index + 1] as const),
  causes: [[3, 7]],
}

export default function CauseEightPage() {
  return <BinarkaPage board={causeEightBoard} />
}

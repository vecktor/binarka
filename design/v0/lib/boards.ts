import type { BoardSpec, CellSpec } from '@/components/binarka-page'
import boards from './boards.json'

const parse = (rows: string[]): CellSpec[][] =>
  rows.map((row) => row.trim().split(/\s+/) as CellSpec[])

// The boards are data (boards.json), so the page's capture-only board test reads the same cells (FR-119).
const build = (data: { size: number; rows: string[]; solved?: boolean; violations?: number[][] }): BoardSpec => ({
  size: data.size,
  rows: parse(data.rows),
  ...(data.solved ? { solved: true } : {}),
  ...(data.violations ? { violations: data.violations.map(([r, c]) => [r, c] as const) } : {}),
})

// 6×6: givens from our engine (generate(6, 5), level 1, exactly one solution); the three boards share them.
// Entries are taken from that solution, except the third 0 of row 3 on the fixture (the solution has 1 there),
// which makes the one triple violation. The hinted cell is the engine's first hint on the hint board.
export const fixtureBoard: BoardSpec = build(boards.fixtureBoard)

export const hintBoard: BoardSpec = build(boards.hintBoard)

export const solvedBoard: BoardSpec = build(boards.solvedBoard)

// 8×8 mid-game: givens from our engine (generate(8, 7), exactly one solution),
// entries taken from that solution.
export const eightBoard: BoardSpec = build(boards.eightBoard)

// 4×4 mid-game: givens from our engine (generate(4, 3), exactly one solution),
// entries taken from that solution.
export const fourBoard: BoardSpec = build(boards.fourBoard)

import { BinarkaPage } from '@/components/binarka-page'
import { eightBoard } from '@/lib/boards'

// Review capture only: another level selected («Мозколамка» at 8×8, FR-87, FR-95).
// The board is the /eight/ board; the summary reads «8×8 · Мозколамка», the sheet is closed.
export default function LevelPage() {
  return <BinarkaPage board={eightBoard} level={4} />
}

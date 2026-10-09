import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 14, FR-91, FR-100): the board shown is 6×6 · Розминка, the
// sheet is open with 4×4 marked: the reason line, «Розминка» marked, levels 2 to 4 unavailable.
export default function SetupMarkedFourPage() {
  return <BinarkaPage board={fixtureBoard} markedSize={4} setupOpen />
}

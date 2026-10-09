import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 14, FR-100): the board shown is 6×6 · Розминка (the summary
// still reads «6×6 · Розминка ▾»), the sheet is open with 8×8 · Головоломка marked, and the
// focus is on «Почати» (FR-101).
export default function SetupMarkedPage() {
  return <BinarkaPage board={fixtureBoard} markedSize={8} markedLevel={3} setupOpen focusStart />
}
